import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { checkRateLimit } from '@/lib/rateLimit'
import {
  renderEmailTemplate,
  sendCustomEmail,
  DEFAULT_ANNOUNCEMENT_TEMPLATE,
  DEFAULT_MARKETING_TEMPLATE,
  DEFAULT_DIRECT_MESSAGE_TEMPLATE,
  DEFAULT_CONTAINER_TEMPLATE,
} from '@/lib/email'

const testEmailSchema = z.object({
  template_id: z.string().optional().nullable(),
  template_name: z.string().optional().nullable(),
  custom_html: z.string().optional().nullable(),
  custom_subject: z.string().trim().min(2).max(250),
  variables: z.record(z.string(), z.any()).optional().default({}),
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!checkRateLimit(req, res, { limit: 10, windowMs: 60_000, prefix: 'admin_email_test' })) {
    return
  }

  const auth = await authenticateStaff(req)
  if ('error' in auth) {
    return res.status(auth.status).json({ error: auth.error })
  }

  if (!auth.profile.email) {
    return res.status(400).json({ error: 'Your admin profile does not have an email address configured' })
  }

  const parsed = testEmailSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid test payload', details: parsed.error.flatten() })
  }

  const { template_id, template_name, custom_html, custom_subject, variables } = parsed.data

  let htmlToRender = DEFAULT_ANNOUNCEMENT_TEMPLATE

  if (custom_html && custom_html.trim().length > 10) {
    htmlToRender = custom_html
  } else if (template_id && supabaseAdmin) {
    const { data: dbTpl } = await supabaseAdmin
      .from('email_templates')
      .select('html_content')
      .eq('id', template_id)
      .maybeSingle()

    if (dbTpl?.html_content) {
      htmlToRender = dbTpl.html_content
    }
  } else if (template_name === 'marketing_promo') {
    htmlToRender = DEFAULT_MARKETING_TEMPLATE
  } else if (template_name === 'direct_message') {
    htmlToRender = DEFAULT_DIRECT_MESSAGE_TEMPLATE
  } else if (template_name === 'custom_container') {
    htmlToRender = DEFAULT_CONTAINER_TEMPLATE
  }

  const testVariables: Record<string, string> = {
    user_name: auth.profile.full_name || 'Admin Tester',
    first_name: (auth.profile.full_name || 'Admin').split(' ')[0],
    user_email: auth.profile.email,
    user_role: auth.profile.role,
    title_en: 'Test Email Preview',
    title_ar: 'معاينة تجريبية للبريد الإلكتروني',
    subtitle_en: 'Sample subtitle for email inspection',
    message_en: 'This is a test delivery from PharmaCore Campaign Manager to verify formatting and deliverability.',
    message_ar: 'هذه رسالة بريد إلكتروني تجريبية للتحقق من التنسيق وسلامة وصول الرسائل.',
    promo_badge: 'TEST PROMO',
    promo_code: 'TEST2026',
    action_url: process.env.NEXT_PUBLIC_SITE_URL || 'https://pharma-core-edu.vercel.app',
    action_text_en: 'Verify Platform →',
    action_text_ar: 'الانتقال إلى المنصة ←',
    sender_name: auth.profile.full_name || 'PharmaCore Administrator',
    message_content: 'Test direct memo body verification.',
    content_html: '<p>Test custom HTML body content.</p>',
    ...Object.fromEntries(
      Object.entries(variables).map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)])
    ),
  }

  const renderedSubject = `[TEST] ${renderEmailTemplate(custom_subject, testVariables)}`
  const renderedHtml = renderEmailTemplate(htmlToRender, testVariables)

  const result = await sendCustomEmail({
    toEmail: auth.profile.email,
    subject: renderedSubject,
    htmlContent: renderedHtml,
  })

  if (!result.success) {
    return res.status(500).json({ error: result.error || 'Failed to dispatch test email' })
  }

  return res.status(200).json({
    success: true,
    simulated: result.simulated,
    messageId: result.messageId,
    recipient: auth.profile.email,
    message: result.simulated
      ? `Test email simulated for ${auth.profile.email} (Set RESEND_API_KEY for live delivery).`
      : `Test email dispatched to ${auth.profile.email}.`,
  })
}
