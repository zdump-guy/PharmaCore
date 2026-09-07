import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyTurnstileToken, extractClientIp } from '@/lib/turnstile';
import { checkRateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

const schema = z.object({
  lectureId: z.string().uuid(),
  authorName: z.string().max(100).optional().nullable(),
  authorEmail: z.string().email().optional().nullable().or(z.literal('')),
  text: z.string().min(3, 'Question must be at least 3 characters').max(2000),
  isAnonymous: z.boolean().optional().default(false),
  turnstileToken: z.string().optional().nullable(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Enforce IP-based rate limiting (10 requests per minute per IP)
  if (!checkRateLimit(req, res, { limit: 10, windowMs: 60_000, prefix: 'questions' })) {
    return;
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { lectureId, authorName, authorEmail, text, isAnonymous, turnstileToken } = parsed.data;

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
    return res.status(503).json({ error: 'Database service is not configured' });
  }

  // Resolve authenticated user from Bearer token if provided
  let authenticatedUserId: string | null = null;
  let resolvedName = authorName ? authorName.trim() : '';
  let resolvedEmail = authorEmail ? authorEmail.trim() : '';

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      const {
        data: { user },
      } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        authenticatedUserId = user.id;
        if (!resolvedEmail && user.email) {
          resolvedEmail = user.email;
        }
        if (!resolvedName) {
          resolvedName =
            (user.user_metadata?.full_name as string) ||
            `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
            user.email?.split('@')[0] ||
            'Student';
        }
      }
    } catch {
      // Continue with provided form fields if token validation fails
    }
  }

  // Handle anonymous guest vs non-anonymous guest validations
  if (!resolvedName) {
    if (isAnonymous) {
      resolvedName = 'Anonymous Student';
    } else {
      return res.status(400).json({
        error: 'Please enter your name or choose to post anonymously.',
        error_ar: 'يرجى كتابة اسمك أو اختيار الإرسال كطالب مجهول.',
      });
    }
  }

  if (!isAnonymous && !resolvedEmail && !authenticatedUserId) {
    return res.status(400).json({
      error: 'Please enter a valid email address so we can notify you of responses.',
      error_ar: 'يرجى كتابة بريدك الإلكتروني لتلقي إشعار عند الرد على سؤالك.',
    });
  }

  try {
    const { data: question, error } = await supabaseAdmin
      .from('community_questions')
      .insert([
        {
          lecture_id: lectureId,
          user_id: authenticatedUserId,
          author_name: resolvedName,
          author_email: resolvedEmail || null,
          is_anonymous: Boolean(isAnonymous),
          text: text.trim(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error inserting community question:', error);
      return res.status(500).json({ error: 'Failed to submit question: ' + error.message });
    }

    // Prepare public safe representation
    const publicQuestion = {
      ...question,
      author_name: isAnonymous ? 'Anonymous Student' : resolvedName,
      answers: [],
    };

    return res.status(201).json({ success: true, question: publicQuestion });
  } catch (err) {
    console.error('Exception in question submit handler:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

