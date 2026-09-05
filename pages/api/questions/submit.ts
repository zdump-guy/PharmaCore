import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyTurnstileToken, extractClientIp } from '@/lib/turnstile';
import { checkRateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

const schema = z.object({
  lectureId: z.string().uuid(),
  authorName: z.string().min(1).max(100),
  authorEmail: z.string().email(),
  text: z.string().min(5).max(2000),
  turnstileToken: z.string().optional().nullable(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!checkRateLimit(req, res, { limit: 10, windowMs: 60_000, prefix: "questions" })) {
    return;
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { lectureId, authorName, authorEmail, text, turnstileToken } = parsed.data;

  // Cloudflare Turnstile Spam & Bot Verification
  const clientIp = extractClientIp(req);
  const turnstileResult = await verifyTurnstileToken({
    token: turnstileToken,
    remoteIp: clientIp,
    expectedAction: 'question_submit',
  });

  if (!turnstileResult.success) {
    return res.status(403).json({
      error: 'Bot verification failed. Please try submitting again.',
      error_ar: 'فشل التحقق الأمني من النشاط التلقائي. يرجى المحاولة مرة أخرى.',
    });
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Supabase is not configured' });
  }

  const { data: question, error } = await supabaseAdmin.from('community_questions').insert([{
    lecture_id: lectureId,
    author_name: authorName,
    author_email: authorEmail,
    text,
  }]).select().single();

  if (error) {
    console.error('Error inserting question:', error);
    return res.status(500).json({ error: 'Failed to submit question' });
  }

  return res.status(201).json({ success: true, question: { ...question, answers: [] } });
}
