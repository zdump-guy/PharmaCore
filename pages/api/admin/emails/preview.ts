import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { checkRateLimit } from '@/lib/rateLimit'
import {
  renderEmailTemplate,
  DEFAULT_ANNOUNCEMENT_TEMPLATE,
  DEFAULT_MARKETING_TEMPLATE,
  DEFAULT_DIRECT_MESSAGE_TEMPLATE,
  DEFAULT_CONTAINER_TEMPLATE,
} from '@/lib/email'

const previewSchema = z.object({
  template_id: z.string().optional().nullable(),
  template_name: z.string().optional().nullable(),
  custom_html: z.string().optional().nullable(),
  subject_template: z.string().default('[PharmaCore] {{title_en}}'),
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

  if (!checkRateLimit(req, res, { limit: 30, windowMs: 60_000, prefix: 'admin_email_preview' })) {
    return
  }

  const auth = await authenticateStaff(req)
  if ('error' in auth) {
    return res.status(auth.status).json({ error: auth.error })
  }

  const parsed = previewSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid preview payload', details: parsed.error.flatten() })
  }

  const { template_id, template_name, custom_html, subject_template, variables } = parsed.data

  let htmlToRender = DEFAULT_ANNOUNCEMENT_TEMPLATE

  if (custom_html && custom_html.trim().length > 10) {
    htmlToRender = custom_html
  } else if (template_id) {
    if (supabaseAdmin) {
      const { data: dbTpl } = await supabaseAdmin
        .from('email_templates')
        .select('html_content')
        .eq('id', template_id)
        .maybeSingle()

      if (dbTpl?.html_content) {
        htmlToRender = dbTpl.html_content
      }
    }
  } else if (template_name === 'marketing_promo') {
    htmlToRender = DEFAULT_MARKETING_TEMPLATE
  } else if (template_name === 'direct_message') {
    htmlToRender = DEFAULT_DIRECT_MESSAGE_TEMPLATE
  } else if (template_name === 'custom_container') {
    htmlToRender = DEFAULT_CONTAINER_TEMPLATE
  }

  const mockVariables: Record<string, string> = {
    user_name: auth.profile.full_name || 'Dr. Alex Vance',
    first_name: (auth.profile.full_name || 'Alex').split(' ')[0],
    user_email: auth.profile.email || 'admin@pharmacore.edu',
    user_role: auth.profile.role,
    title_en: 'Clinical Pharmacology Update: Novel Mechanisms',
    title_ar: 'تحديث في علم الأدوية السريري: آليات علاجية جديدة',
    subtitle_en: 'Essential masterclass and updated drug interaction charts',
    message_en: 'We are pleased to announce the release of new interactive pharmacology modules covering receptor kinetics and clinical dosing.',
    message_ar: 'يسرنا الإعلان عن إطلاق مساقات تفاعلية جديدة في حركية الدواء وتحديد الجرعات السريرية.',
    promo_badge: 'LIMITED ENROLLMENT',
    promo_code: 'CLINICAL2026',
    action_url: process.env.NEXT_PUBLIC_SITE_URL || 'https://pharma-core-edu.vercel.app',
    action_text_en: 'Open Course Masterclass →',
    action_text_ar: 'الانتقال إلى المساق التدريبي ←',
    sender_name: auth.profile.full_name || 'Lead Academic Faculty',
    message_content: 'Please review the attached lecture notes and verify your registration before the upcoming practical session.',
    content_html: '<p>This is a live rendered preview of your custom uploaded HTML body content.</p>',
    ...Object.fromEntries(
      Object.entries(variables).map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)])
    ),
  }

  const renderedSubject = renderEmailTemplate(subject_template, mockVariables)
  const renderedHtml = renderEmailTemplate(htmlToRender, mockVariables)

  return res.status(200).json({
    success: true,
    subject: renderedSubject,
    html: renderedHtml,
  })
}
