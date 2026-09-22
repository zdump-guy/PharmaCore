import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { checkRateLimit } from '@/lib/rateLimit'
import { sanitizeInputText } from '@/lib/utils'
import {
  sendBatchCustomEmails,
  DEFAULT_ANNOUNCEMENT_TEMPLATE,
  DEFAULT_MARKETING_TEMPLATE,
  DEFAULT_DIRECT_MESSAGE_TEMPLATE,
  DEFAULT_CONTAINER_TEMPLATE,
} from '@/lib/email'

const sendCampaignSchema = z.object({
  target_audience: z.enum([
    'all',
    'staff',
    'students',
    'marketing',
    'custom_set',
    'single_user',
    'course_enrolled',
  ]),
  student_status: z.enum(['all', 'active_only']).optional().default('all'),
  course_id: z.string().uuid().optional().nullable(),
  university: z.string().optional().nullable(),
  target_user_ids: z.array(z.string().uuid()).optional(),
  target_emails: z.array(z.string().email()).optional(),
  single_user_id: z.string().optional().nullable(),
  single_email: z.string().email().optional().nullable(),

  template_id: z.string().optional().nullable(),
  template_name: z.string().optional().nullable(),
  custom_subject: z.string().trim().min(2).max(250),
  custom_html: z.string().optional().nullable(),

  campaign_type: z.enum(['announcement', 'marketing', 'direct_message', 'system']).default('announcement'),
  variables: z.record(z.string(), z.any()).optional().default({}),
  send_in_app_notification: z.boolean().default(true),
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

interface TargetRecipient {
  userId?: string | null
  email: string
  fullName: string
  role?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!checkRateLimit(req, res, { limit: 10, windowMs: 60_000, prefix: 'admin_email_send' })) {
    return
  }

  const auth = await authenticateStaff(req)
  if ('error' in auth) {
    return res.status(auth.status).json({ error: auth.error })
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database service unavailable' })
  }

  const parsed = sendCampaignSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid campaign payload', details: parsed.error.flatten() })
  }

  const {
    target_audience,
    student_status,
    course_id,
    university,
    target_user_ids,
    target_emails,
    single_user_id,
    single_email,
    template_id,
    template_name,
    custom_subject,
    custom_html,
    campaign_type,
    variables,
    send_in_app_notification,
  } = parsed.data

  try {
    // ── 1. Resolve Target Recipients ──────────────────────────────────────────
    const recipients: TargetRecipient[] = []

    if (target_audience === 'single_user') {
      if (single_user_id) {
        const { data: u } = await supabaseAdmin
          .from('users')
          .select('id, email, full_name, role')
          .eq('id', single_user_id)
          .maybeSingle()
        if (u?.email) {
          recipients.push({ userId: u.id, email: u.email, fullName: u.full_name || 'User', role: u.role })
        }
      } else if (single_email) {
        recipients.push({ email: single_email, fullName: 'User' })
      }
    } else if (target_audience === 'custom_set') {
      if (target_user_ids && target_user_ids.length > 0) {
        const { data: users } = await supabaseAdmin
          .from('users')
          .select('id, email, full_name, role')
          .in('id', target_user_ids)
        if (users) {
          recipients.push(
            ...users
              .filter((u) => u.email)
              .map((u) => ({ userId: u.id, email: u.email, fullName: u.full_name || 'User', role: u.role }))
          )
        }
      }
      if (target_emails && target_emails.length > 0) {
        for (const em of target_emails) {
          if (!recipients.some((r) => r.email.toLowerCase() === em.toLowerCase())) {
            recipients.push({ email: em, fullName: 'User' })
          }
        }
      }
    } else if (target_audience === 'course_enrolled' && course_id) {
      const { data: enrollments } = await supabaseAdmin
        .from('course_enrollments')
        .select(`
          user_id,
          user:users!course_enrollments_user_id_fkey (
            id,
            email,
            full_name,
            role,
            email_notifications_enabled
          )
        `)
        .eq('course_id', course_id)
        .eq('status', 'active')

      if (enrollments) {
        for (const e of enrollments) {
          const u = Array.isArray(e.user) ? e.user[0] : e.user
          if (u?.email && u.email_notifications_enabled !== false) {
            recipients.push({ userId: u.id, email: u.email, fullName: u.full_name || 'Student', role: u.role })
          }
        }
      }
    } else if (target_audience === 'staff') {
      const { data: staffUsers } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, role')
        .in('role', ['dev', 'super_admin', 'mentor'])

      if (staffUsers) {
        recipients.push(
          ...staffUsers
            .filter((u) => u.email)
            .map((u) => ({ userId: u.id, email: u.email, fullName: u.full_name || 'Staff Member', role: u.role }))
        )
      }
    } else if (target_audience === 'marketing') {
      const q = supabaseAdmin
        .from('users')
        .select('id, email, full_name, role, email_marketing_enabled, email_notifications_enabled')
        .neq('email_marketing_enabled', false)
        .neq('email_notifications_enabled', false)

      const { data: marketingUsers } = await q
      if (marketingUsers) {
        recipients.push(
          ...marketingUsers
            .filter((u) => u.email)
            .map((u) => ({ userId: u.id, email: u.email, fullName: u.full_name || 'Learner', role: u.role }))
        )
      }
    } else if (target_audience === 'students') {
      let q = supabaseAdmin
        .from('users')
        .select('id, email, full_name, role, status, university, email_notifications_enabled')
        .eq('role', 'student')
        .neq('email_notifications_enabled', false)

      if (student_status === 'active_only') {
        q = q.eq('status', 'active')
      }
      if (university) {
        q = q.eq('university', university)
      }

      const { data: students } = await q
      if (students) {
        recipients.push(
          ...students
            .filter((u) => u.email)
            .map((u) => ({ userId: u.id, email: u.email, fullName: u.full_name || 'Student', role: u.role }))
        )
      }
    } else if (target_audience === 'all') {
      const { data: allUsers } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, role, email_notifications_enabled')
        .neq('email_notifications_enabled', false)

      if (allUsers) {
        recipients.push(
          ...allUsers
            .filter((u) => u.email)
            .map((u) => ({ userId: u.id, email: u.email, fullName: u.full_name || 'User', role: u.role }))
        )
      }
    }

    if (recipients.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        emailsDispatched: 0,
        message: 'No recipients matched the selected criteria.',
      })
    }

    // ── 2. Resolve HTML Template ──────────────────────────────────────────────
    let htmlTemplate = DEFAULT_ANNOUNCEMENT_TEMPLATE
    let resolvedTemplateName = template_name || 'system_announcement'
    let resolvedTemplateId = template_id || null

    if (custom_html && custom_html.trim().length > 10) {
      htmlTemplate = custom_html
      resolvedTemplateName = 'custom_uploaded_html'
    } else if (template_id) {
      const { data: dbTpl } = await supabaseAdmin
        .from('email_templates')
        .select('*')
        .eq('id', template_id)
        .maybeSingle()

      if (dbTpl?.html_content) {
        htmlTemplate = dbTpl.html_content
        resolvedTemplateName = dbTpl.name
        resolvedTemplateId = dbTpl.id
      }
    } else if (template_name === 'marketing_promo') {
      htmlTemplate = DEFAULT_MARKETING_TEMPLATE
    } else if (template_name === 'direct_message') {
      htmlTemplate = DEFAULT_DIRECT_MESSAGE_TEMPLATE
    } else if (template_name === 'custom_container') {
      htmlTemplate = DEFAULT_CONTAINER_TEMPLATE
    }

    // ── 3. Sanitize and Prepare Variables ─────────────────────────────────────
    const sanitizedVariables: Record<string, string> = {}
    for (const [key, val] of Object.entries(variables)) {
      sanitizedVariables[key] = typeof val === 'string' ? sanitizeInputText(val) : String(val ?? '')
    }

    // Default variable values if omitted
    if (!sanitizedVariables.title_en) sanitizedVariables.title_en = custom_subject
    if (!sanitizedVariables.title_ar) sanitizedVariables.title_ar = custom_subject
    if (!sanitizedVariables.subject) sanitizedVariables.subject = custom_subject

    // ── 4. Batch Dispatch Emails ──────────────────────────────────────────────
    const batchRecipients = recipients.map((r) => ({
      toEmail: r.email,
      userName: r.fullName,
      customVariables: {
        user_name: r.fullName,
        first_name: r.fullName.split(' ')[0] || r.fullName,
        user_email: r.email,
        user_role: r.role || 'Member',
      },
    }))

    const dispatchResult = await sendBatchCustomEmails({
      recipients: batchRecipients,
      subjectTemplate: custom_subject,
      htmlTemplate,
      defaultVariables: sanitizedVariables,
    })

    // ── 5. Optional In-App Notification Mirroring ─────────────────────────────
    if (send_in_app_notification) {
      const usersWithId = recipients.filter((r) => Boolean(r.userId))
      if (usersWithId.length > 0) {
        const notifRows = usersWithId.map((r) => ({
          user_id: r.userId!,
          type: campaign_type === 'marketing' ? 'announcement' : 'announcement',
          title_en: sanitizedVariables.title_en || custom_subject,
          title_ar: sanitizedVariables.title_ar || custom_subject,
          message_en: sanitizedVariables.message_en || sanitizedVariables.message || custom_subject,
          message_ar: sanitizedVariables.message_ar || sanitizedVariables.message || custom_subject,
          is_read: false,
          created_at: new Date().toISOString(),
        }))

        // Chunk insert
        const chunkSize = 100
        for (let i = 0; i < notifRows.length; i += chunkSize) {
          const chunk = notifRows.slice(i, i + chunkSize)
          try {
            await supabaseAdmin.from('notifications').insert(chunk)
          } catch (notifErr) {
            console.warn('In-app notification mirror warning:', notifErr)
          }
        }
      }
    }

    // ── 6. Log Campaign in public.email_logs ──────────────────────────────────
    const sampleRecipients = recipients.slice(0, 10).map((r) => r.email)
    let logId: string | undefined

    try {
      const { data: logEntry } = await supabaseAdmin
        .from('email_logs')
        .insert([{
          sender_id: auth.profile.id,
          campaign_type,
          target_audience,
          subject: custom_subject,
          template_id: resolvedTemplateId,
          template_name: resolvedTemplateName,
          recipient_count: recipients.length,
          delivery_status: dispatchResult.simulated ? 'simulated' : dispatchResult.success ? 'completed' : 'partial',
          sample_recipients: sampleRecipients,
          metadata: {
            variables: sanitizedVariables,
            errors: dispatchResult.errors,
            simulated: dispatchResult.simulated,
            in_app_mirrored: send_in_app_notification,
          },
          created_at: new Date().toISOString(),
        }])
        .select('id')
        .single()

      logId = logEntry?.id
    } catch (logErr) {
      console.warn('Email logs insert error (non-fatal):', logErr)
    }

    return res.status(200).json({
      success: true,
      count: recipients.length,
      emailsDispatched: dispatchResult.dispatched,
      simulated: dispatchResult.simulated,
      logId,
      message: `Email campaign successfully processed for ${recipients.length} recipient(s).`,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal campaign dispatch error'
    console.error('Email campaign exception:', err)
    return res.status(500).json({ error: msg })
  }
}
