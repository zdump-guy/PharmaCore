import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

const idSchema = z.string().uuid();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!checkRateLimit(req, res, { limit: 30, windowMs: 60_000, prefix: 'del_answer' })) {
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
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify caller is strictly 'dev' role
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'dev') {
    return res.status(403).json({ error: 'Forbidden. Dev role required to delete discussion answers.' });
  }

  const parsedId = idSchema.safeParse(req.query.id);
  if (!parsedId.success) {
    return res.status(400).json({ error: 'Invalid answer ID format' });
  }

  const answerId = parsedId.data;

  // Verify answer existence
  const { data: answer, error: fetchError } = await supabaseAdmin
    .from('community_answers')
    .select('id, question_id')
    .eq('id', answerId)
    .maybeSingle();

  if (fetchError) {
    return res.status(500).json({ error: 'Database query error: ' + fetchError.message });
  }

  if (!answer) {
    return res.status(404).json({ error: 'Answer not found' });
  }

  // Delete answer
  const { error: deleteError } = await supabaseAdmin
    .from('community_answers')
    .delete()
    .eq('id', answerId);

  if (deleteError) {
    return res.status(500).json({ error: 'Failed to delete answer: ' + deleteError.message });
  }

  return res.status(200).json({
    success: true,
    message: 'Answer deleted successfully',
    answerId,
    questionId: answer.question_id,
  });
}
