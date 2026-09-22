import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { checkRateLimit } from '@/lib/rateLimit'

const updateTemplateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  title_en: z.string().trim().min(2).max(200).optional(),
  title_ar: z.string().trim().min(2).max(200).optional(),
  description_en: z.string().trim().max(500).optional().nullable(),
  description_ar: z.string().trim().max(500).optional().nullable(),
  category: z.enum(['system', 'announcement', 'marketing', 'custom']).optional(),
  subject_template: z.string().trim().min(2).max(250).optional(),
  html_content: z.string().min(10).optional(),
  variables_schema: z.array(z.object({
    key: z.string(),
    label_en: z.string(),
    label_ar: z.string(),
    default_value: z.string().optional(),
    required: z.boolean().optional(),
  })).optional(),
  is_default: z.boolean().optional(),
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
  if (!checkRateLimit(req, res, { limit: 30, windowMs: 60_000, prefix: 'admin_email_template_detail' })) {
    return
  }

  const auth = await authenticateStaff(req)
  if ('error' in auth) {
    return res.status(auth.status).json({ error: auth.error })
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database service unavailable' })
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Template ID is required' })
  }

  // GET: Fetch Single Template
  if (req.method === 'GET') {
    try {
      const { data: template, error } = await supabaseAdmin
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) {
        return res.status(500).json({ error: 'Database query error: ' + error.message })
      }

      if (!template) {
        return res.status(404).json({ error: 'Template not found' })
      }

      return res.status(200).json({ success: true, template })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Internal error'
      return res.status(500).json({ error: msg })
    }
  }

  // Super Admin / Dev required for modifications
  if (!['dev', 'super_admin'].includes(auth.profile.role)) {
    return res.status(403).json({ error: 'Forbidden: Super Admin access required' })
  }

  // PATCH / PUT: Update Template
  if (req.method === 'PATCH' || req.method === 'PUT') {
    const parsed = updateTemplateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid update payload', details: parsed.error.flatten() })
    }

    try {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('email_templates')
        .update({
          ...parsed.data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        return res.status(500).json({ error: 'Failed to update template: ' + updateError.message })
      }

      return res.status(200).json({ success: true, template: updated, message: 'Template updated successfully' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Internal error'
      return res.status(500).json({ error: msg })
    }
  }

  // DELETE: Delete Template
  if (req.method === 'DELETE') {
    try {
      // Check if template exists and is not a protected system default
      const { data: existing, error: checkError } = await supabaseAdmin
        .from('email_templates')
        .select('id, category, is_default')
        .eq('id', id)
        .maybeSingle()

      if (checkError) {
        return res.status(500).json({ error: 'Database query error: ' + checkError.message })
      }

      if (!existing) {
        return res.status(404).json({ error: 'Template not found' })
      }

      if (existing.category === 'system' || existing.is_default) {
        return res.status(400).json({ error: 'Default system templates cannot be deleted' })
      }

      const { error: deleteError } = await supabaseAdmin
        .from('email_templates')
        .delete()
        .eq('id', id)

      if (deleteError) {
        return res.status(500).json({ error: 'Failed to delete template: ' + deleteError.message })
      }

      return res.status(200).json({ success: true, message: 'Template deleted successfully', templateId: id })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Internal error'
      return res.status(500).json({ error: msg })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
