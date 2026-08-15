import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const schema = z.object({
  questionId: z.string().uuid(),
  text: z.string().min(1).max(3000),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
    .select('role')
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

  const { data: answer, error } = await supabaseAdmin.from('community_answers').insert([{
    question_id: questionId,
    responder_id: user.id,
    text,
  }]).select().single();

  if (error) {
    return res.status(500).json({ error: 'Failed to post answer' });
  }

  return res.status(201).json({ success: true, answer });
}
