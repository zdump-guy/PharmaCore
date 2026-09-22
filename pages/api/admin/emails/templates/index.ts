import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { checkRateLimit } from '@/lib/rateLimit'
import {
  DEFAULT_ANNOUNCEMENT_TEMPLATE,
  DEFAULT_MARKETING_TEMPLATE,
  DEFAULT_DIRECT_MESSAGE_TEMPLATE,
  DEFAULT_CONTAINER_TEMPLATE,
} from '@/lib/email'

const createTemplateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  title_en: z.string().trim().min(2).max(200),
  title_ar: z.string().trim().min(2).max(200),
  description_en: z.string().trim().max(500).optional().nullable(),
  description_ar: z.string().trim().max(500).optional().nullable(),
  category: z.enum(['system', 'announcement', 'marketing', 'custom']).default('custom'),
  subject_template: z.string().trim().min(2).max(250),
  html_content: z.string().min(10),
  variables_schema: z.array(z.object({
    key: z.string(),
    label_en: z.string(),
    label_ar: z.string(),
    default_value: z.string().optional(),
    required: z.boolean().optional(),
  })).optional().default([]),
  is_default: z.boolean().optional().default(false),
})

const defaultBuiltInTemplates = [
  {
    id: 'system-announcement-default',
    name: 'system_announcement',
    title_en: 'Academic Announcement (Bilingual)',
    title_ar: 'إعلان أكاديمي رسمي (ثنائي اللغة)',
    description_en: 'Official blue/cyan branded announcement card with bilingual headers and action buttons.',
    description_ar: 'قالب إعلانات أكاديمي أنيق مع ترويسة ثنائية اللغة وزر إجراء سريع.',
    category: 'announcement',
    subject_template: '[PharmaCore] 📢 {{title_en}}',
    html_content: DEFAULT_ANNOUNCEMENT_TEMPLATE,
    variables_schema: [
      { key: 'title_en', label_en: 'Title (English)', label_ar: 'العنوان (بالإنجليزية)', required: true },
      { key: 'title_ar', label_en: 'Title (Arabic)', label_ar: 'العنوان (بالعربية)', required: true },
      { key: 'message_en', label_en: 'Message (English)', label_ar: 'النص (بالإنجليزية)', required: true },
      { key: 'message_ar', label_en: 'Message (Arabic)', label_ar: 'النص (بالعربية)', required: true },
      { key: 'action_url', label_en: 'Action URL', label_ar: 'رابط الإجراء' },
      { key: 'action_text_en', label_en: 'Button Label (EN)', label_ar: 'نص الزر (EN)' },
      { key: 'action_text_ar', label_en: 'Button Label (AR)', label_ar: 'نص الزر (AR)' },
    ],
    is_default: true,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'marketing-promo-default',
    name: 'marketing_promo',
    title_en: 'Promotional & Course Launch Campaign',
    title_ar: 'حملة ترويجية وإطلاق مساق جديد',
    description_en: 'High-conversion marketing layout with hero banner, promo badge, discount code pill, and CTA button.',
    description_ar: 'قالب تسويقي احترافي عالي التحويل مع كود ترويجي وزر اشتراك مميز.',
    category: 'marketing',
    subject_template: '⭐ Special Opportunity: {{title_en}}',
    html_content: DEFAULT_MARKETING_TEMPLATE,
    variables_schema: [
      { key: 'promo_badge', label_en: 'Promo Badge Label', label_ar: 'شارة العرض', default_value: 'NEW COURSE LAUNCH' },
      { key: 'title_en', label_en: 'Headline (English)', label_ar: 'العنوان الرئيسي (EN)', required: true },
      { key: 'subtitle_en', label_en: 'Subtitle (English)', label_ar: 'العنوان الفرعي (EN)' },
      { key: 'title_ar', label_en: 'Headline (Arabic)', label_ar: 'العنوان الرئيسي (AR)' },
      { key: 'message_en', label_en: 'Promo Details (English)', label_ar: 'تفاصيل العرض (EN)', required: true },
      { key: 'message_ar', label_en: 'Promo Details (Arabic)', label_ar: 'تفاصيل العرض (AR)' },
      { key: 'promo_code', label_en: 'Promo / Access Code', label_ar: 'كود الخصم أو الوصول', default_value: 'PHARMA2026' },
      { key: 'action_url', label_en: 'CTA Action URL', label_ar: 'رابط التسجيل الفوري' },
      { key: 'action_text_en', label_en: 'Button Label (EN)', label_ar: 'نص زر الاشتراك' },
      { key: 'action_text_ar', label_en: 'Button Label (AR)', label_ar: 'نص زر الاشتراك (عربي)' },
    ],
    is_default: false,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'direct-message-default',
    name: 'direct_message',
    title_en: 'Direct Advisory Memo / Notice',
    title_ar: 'إشعار ومذكرة أكاديمية مباشرة',
    description_en: 'Clean personalized educator letterhead designed for direct messaging to single students or cohorts.',
    description_ar: 'قالب مذكرة رسمي نظيف للمراسلة الفردية أو لمجموعة محددة من الطلاب.',
    category: 'system',
    subject_template: '[PharmaCore Notice] {{subject}}',
    html_content: DEFAULT_DIRECT_MESSAGE_TEMPLATE,
    variables_schema: [
      { key: 'sender_name', label_en: 'Sender Name / Role', label_ar: 'اسم المرسل والصفة', default_value: 'Academic Faculty' },
      { key: 'message_content', label_en: 'Message Content', label_ar: 'نص المذكرة', required: true },
      { key: 'action_url', label_en: 'Follow-up URL', label_ar: 'رابط المتابعة' },
      { key: 'action_text', label_en: 'Button Text', label_ar: 'نص الزر', default_value: 'Open Student Portal' },
    ],
    is_default: false,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'custom-container-default',
    name: 'custom_container',
    title_en: 'Custom HTML Brand Container',
    title_ar: 'إطار مخصص للشفرات البرمجية المرفوعة',
    description_en: 'Minimalist container with official PharmaCore logo and footer wrapper for arbitrary uploaded HTML.',
    description_ar: 'إطار محمي بشعار المنصة وتذييل رسمي مناسب لأي كود HTML مخصص يتم رفعه.',
    category: 'custom',
    subject_template: '{{subject}}',
    html_content: DEFAULT_CONTAINER_TEMPLATE,
    variables_schema: [
      { key: 'content_html', label_en: 'Raw HTML Body', label_ar: 'محتوى الـ HTML الخام', required: true },
    ],
    is_default: false,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
]

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
  if (!checkRateLimit(req, res, { limit: 30, windowMs: 60_000, prefix: 'admin_email_templates' })) {
    return
  }

  const auth = await authenticateStaff(req)
  if ('error' in auth) {
    return res.status(auth.status).json({ error: auth.error })
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database service unavailable' })
  }

  if (req.method === 'GET') {
    try {
      const { category } = req.query
      let query = supabaseAdmin
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (category && typeof category === 'string') {
        query = query.eq('category', category)
      }

      const { data: dbTemplates, error } = await query

      let combinedTemplates = defaultBuiltInTemplates
      if (!error && dbTemplates && dbTemplates.length > 0) {
        // Merge DB templates, avoiding duplicates by name
        const dbNames = new Set(dbTemplates.map((t) => t.name))
        const nonDuplicateDefaults = defaultBuiltInTemplates.filter((t) => !dbNames.has(t.name))
        combinedTemplates = [...dbTemplates, ...nonDuplicateDefaults]
      }

      return res.status(200).json({
        success: true,
        templates: combinedTemplates,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query email templates'
      return res.status(500).json({ error: msg })
    }
  }

  if (req.method === 'POST') {
    // Only Super Admins and Devs can create/upload new templates
    if (!['dev', 'super_admin'].includes(auth.profile.role)) {
      return res.status(403).json({ error: 'Forbidden: Super Admin access required to create templates' })
    }

    const parsed = createTemplateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid template payload', details: parsed.error.flatten() })
    }

    try {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('email_templates')
        .insert([{
          ...parsed.data,
          created_by: auth.profile.id,
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single()

      if (insertError) {
        return res.status(500).json({ error: 'Failed to create template: ' + insertError.message })
      }

      return res.status(201).json({
        success: true,
        template: inserted,
        message: 'Template created successfully',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create template'
      return res.status(500).json({ error: msg })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
