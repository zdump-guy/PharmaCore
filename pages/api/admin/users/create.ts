import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/rateLimit';

const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  full_name: z.string().trim().min(1).max(120),
  role: z.enum(['dev', 'super_admin', 'mentor']),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!checkRateLimit(req, res, { limit: 15, windowMs: 60_000, prefix: "admin_users" })) {
    return;
  }

  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request payload",
      details: parsed.error.flatten(),
    });
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Supabase is not configured' });
  }

  // Basic auth check: The request should include an Authorization header with a Bearer token
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.error('Missing authorization header');
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  
  if (authError || !user) {
    console.error('Invalid token or auth error:', authError);
    return res.status(401).json({ error: 'Invalid or expired token', details: authError });
  }

  // Verify the requesting user is a super_admin or dev
  const { data: requesterData, error: requesterError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (requesterError || !requesterData || !['super_admin', 'dev'].includes(requesterData.role)) {
    return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
  }

  const { email, password, full_name, role } = parsed.data;

  try {
    // 1. Create user in Supabase Auth
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (createError) {
      return res.status(400).json({ error: createError.message });
    }

    const newUserId = authData.user.id;

    // 2. Upsert into public.users (handle conflict gracefully if trigger already inserted it)
    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: newUserId,
        email,
        full_name,
        role,
      });
      
    if (upsertError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return res.status(500).json({ error: 'Failed to create user profile', details: upsertError.message });
    }

    return res.status(200).json({ message: 'User created successfully', user: { id: newUserId, email, full_name, role } });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
