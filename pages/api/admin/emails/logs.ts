import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { checkRateLimit } from '@/lib/rateLimit'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  campaign_type: z.enum(['announcement', 'marketing', 'direct_message', 'system']).optional(),
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

  if (!checkRateLimit(req, res, { limit: 30, windowMs: 60_000, prefix: 'admin_email_logs' })) {
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
    return res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.flatten() })
  }

  const { page, limit, campaign_type } = parsed.data
  const offset = (page - 1) * limit

  try {
    let countQuery = supabaseAdmin
      .from('email_logs')
      .select('*', { count: 'exact', head: true })

    if (campaign_type) {
      countQuery = countQuery.eq('campaign_type', campaign_type)
    }

    const { count, error: countError } = await countQuery
    if (countError) {
      return res.status(500).json({ error: 'Failed to count logs: ' + countError.message })
    }

    let logsQuery = supabaseAdmin
      .from('email_logs')
      .select(`
        id,
        sender_id,
        campaign_type,
        target_audience,
        subject,
        template_id,
        template_name,
        recipient_count,
        delivery_status,
        sample_recipients,
        metadata,
        created_at,
        sender:users!email_logs_sender_id_fkey (
          id,
          full_name,
          email,
          role
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (campaign_type) {
      logsQuery = logsQuery.eq('campaign_type', campaign_type)
    }

    const { data: logs, error: logsError } = await logsQuery
    if (logsError) {
      return res.status(500).json({ error: 'Failed to query logs: ' + logsError.message })
    }

    const formattedLogs = (logs || []).map((l) => ({
      ...l,
      sender: Array.isArray(l.sender) ? l.sender[0] : l.sender,
    }))

    return res.status(200).json({
      success: true,
      logs: formattedLogs,
      totalCount: count ?? 0,
      page,
      limit,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve email logs'
    return res.status(500).json({ error: msg })
  }
}
