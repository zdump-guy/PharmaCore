import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { checkRateLimit } from '@/lib/rateLimit'

const querySchema = z.object({
  q: z.string().trim().min(1).max(100),
  role: z.enum(['all', 'student', 'mentor', 'super_admin', 'dev']).optional().default('all'),
  limit: z.coerce.number().min(1).max(50).default(20),
})

async function authenticateStaff(req: NextApiRequest) {
  if (!supabaseAdmin) return { error: 'Database service unavailable', status: 503 } as const
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return { error: 'Unauthorized', status: 401 } as const

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return { error: 'Unauthorized', status: 401 } as const

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('id, role, full_name, email')
    .eq('id', user.id)
    .single()

  if (!profile || !['dev', 'super_admin', 'mentor'].includes(profile.role)) {
    return { error: 'Forbidden: Staff privileges required', status: 403 } as const
  }

  return { user, profile, status: 200 } as const
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!checkRateLimit(req, res, { limit: 40, windowMs: 60_000, prefix: 'admin_user_search' })) {
    return
  }

  const auth = await authenticateStaff(req)
  if ('error' in auth) {
    return res.status(auth.status).json({ error: auth.error })
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database service unavailable' })
  }

  const parsed = querySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid search parameters', details: parsed.error.flatten() })
  }

  const { q, role, limit } = parsed.data

  try {
    let query = supabaseAdmin
      .from('users')
      .select('id, full_name, email, role, status, university, faculty')
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(limit)

    if (role && role !== 'all') {
      query = query.eq('role', role)
    }

    const { data: users, error } = await query
    if (error) {
      return res.status(500).json({ error: 'Search failed: ' + error.message })
    }

    return res.status(200).json({
      success: true,
      users: users || [],
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'User search error'
    return res.status(500).json({ error: msg })
  }
}
