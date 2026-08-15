import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const schema = z.object({
  lectureId: z.string().uuid(),
  authorName: z.string().min(1).max(100),
  authorEmail: z.string().email(),
  text: z.string().min(5).max(2000),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { lectureId, authorName, authorEmail, text } = parsed.data;

  const { error } = await supabaseAdmin.from('community_questions').insert([{
    lecture_id: lectureId,
    author_name: authorName,
    author_email: authorEmail,
    text,
  }]);

  if (error) {
    console.error('Error inserting question:', error);
    return res.status(500).json({ error: 'Failed to submit question' });
  }

  return res.status(201).json({ success: true });
}
