import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/rateLimit';
import { sanitizeInputText } from '@/lib/utils';
import { z } from 'zod';


const schema = z.object({
  questionId: z.string().uuid(),
  text: z.string().min(1).max(3000),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!checkRateLimit(req, res, { limit: 20, windowMs: 60_000, prefix: 'answer' })) {
    return;
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Supabase is not configured' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  // Verify user is admin or mentor
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || !['dev', 'super_admin', 'mentor'].includes(profile.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { questionId, text } = parsed.data;
  const cleanText = sanitizeInputText(text);

  // 1. Fetch Question details and joined Lecture for notification context
  const { data: question } = await supabaseAdmin
    .from('community_questions')
    .select(`
      id,
      lecture_id,
      user_id,
      author_name,
      author_email,
      text,
      lecture:lectures!community_questions_lecture_id_fkey (
        id,
        title_en,
        title_ar
      )
    `)
    .eq('id', questionId)
    .maybeSingle();

  // 2. Insert answer
  const { data: answer, error } = await supabaseAdmin.from('community_answers').insert([{
    question_id: questionId,
    responder_id: user.id,
    text: cleanText,
  }]).select(`
    *,
    responder:users!community_answers_responder_id_fkey (
      id,
      full_name,
      role
    )
  `).single();

  if (error) {
    return res.status(500).json({ error: 'Failed to post answer: ' + error.message });
  }

  // 3. Trigger In-App Notification and Transactional Email Alert (Non-blocking)
  if (question) {
    const lectureObj = Array.isArray(question.lecture) ? question.lecture[0] : question.lecture;
    const lectureTitleEn = lectureObj?.title_en || 'Pharmacology Lecture';
    const lectureTitleAr = lectureObj?.title_ar || 'محاضرة علم الأدوية';
    const responderName = profile?.full_name || user.user_metadata?.full_name || 'Academic Mentor';

    // Insert In-App Notification if question has an associated user_id
    if (question.user_id) {
      try {
        await supabaseAdmin.from('notifications').insert([{
          user_id: question.user_id,
          type: 'mentor_reply',
          title_en: 'New response from instructor',
          title_ar: 'إجابة جديدة من المشرف الأكاديمي',
          message_en: `${responderName} answered your question in "${lectureTitleEn}".`,
          message_ar: `أجاب ${responderName} على سؤالك في محاضرة "${lectureTitleAr}".`,
          lecture_id: question.lecture_id,
          question_id: question.id,
          is_read: false,
          created_at: new Date().toISOString(),
        }]);
      } catch (notifErr) {
        console.warn('In-app notification insert error (non-fatal):', notifErr);
      }
    }

    // Check student email notification preference and dispatch Resend email
    const targetEmail = question.author_email || (question.user_id ? (await supabaseAdmin.from('users').select('email, email_notifications_enabled').eq('id', question.user_id).maybeSingle()).data?.email : null);

    if (targetEmail) {
      let isEmailEnabled = true;
      if (question.user_id) {
        const { data: userPref } = await supabaseAdmin
          .from('users')
          .select('email_notifications_enabled')
          .eq('id', question.user_id)
          .maybeSingle();
        if (userPref && userPref.email_notifications_enabled === false) {
          isEmailEnabled = false;
        }
      }

      if (isEmailEnabled) {
        import('@/lib/email').then(({ sendMentorReplyEmail }) => {
          sendMentorReplyEmail({
            toEmail: targetEmail,
            studentName: question.author_name || 'Student',
            mentorName: responderName,
            mentorRole: profile?.role === 'dev' ? 'Lead Platform Architect' : 'Clinical Faculty Mentor',
            lectureId: question.lecture_id,
            lectureTitleEn,
            lectureTitleAr,
            questionText: question.text,
            answerText: cleanText,
          }).catch((err) => console.warn('Resend email error (non-fatal):', err));
        }).catch(() => {});
      }
    }
  }

  return res.status(201).json({ success: true, answer });

}
