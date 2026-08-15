import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';
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

  // Verify auth session using cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies).map(([name, value]) => ({ name, value: value ?? '' }));
        },
        setAll() {},
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify user is admin or mentor
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || !['dev', 'super_admin', 'mentor'].includes(profile.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { questionId, text } = parsed.data;

  const { error } = await supabaseAdmin.from('community_answers').insert([{
    question_id: questionId,
    responder_id: session.user.id,
    text,
  }]);

  if (error) {
    return res.status(500).json({ error: 'Failed to post answer' });
  }

  return res.status(201).json({ success: true });
}
