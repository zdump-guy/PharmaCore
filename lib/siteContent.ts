import { supabase } from "@/lib/supabaseClient"
import type { University, Faculty, EnrollmentSettings } from "@/types"

export type SiteLocale = "en" | "ar"

export type SocialPlatform =
  | "telegram"
  | "facebook"
  | "whatsapp"
  | "youtube"
  | "linkedin"
  | "twitter"
  | "instagram"
  | "discord"
  | "tiktok"
  | "website"

export interface SocialLink {
  id: string
  platform: SocialPlatform
  label_en: string
  label_ar: string
  url: string
}

export interface SiteLocaleContent {
  hero_eyebrow: string
  hero_title_a: string
  hero_title_b: string
  hero_subtitle: string
  hero_primary_cta: string
  hero_secondary_cta: string
  hero_note_one: string
  hero_note_two: string
  about_eyebrow: string
  about_title: string
  about_body: string
  feature_one_title: string
  feature_one_body: string
  feature_two_title: string
  feature_two_body: string
  feature_three_title: string
  feature_three_body: string
  feature_four_title: string
  feature_four_body: string
  courses_eyebrow: string
  courses_title: string
  courses_body: string
  course_view: string
  course_badge: string
  cta_title: string
  cta_body: string
  footer_description: string
  footer_reviewed: string
  footer_social_title: string
  footer_team_name: string
  footer_team_role: string
  footer_email: string
  footer_links_title: string
  footer_rights: string
  footer_tagline: string
}

export interface MaintenanceModeConfig {
  enabled: boolean
  title_en?: string
  title_ar?: string
  message_en?: string
  message_ar?: string
  estimated_until?: string
}

export interface SiteContent {
  en: SiteLocaleContent
  ar: SiteLocaleContent
  social_links?: SocialLink[]
  enrollment_settings?: EnrollmentSettings
  maintenance_mode?: MaintenanceModeConfig
}

export const defaultSocialLinks: SocialLink[] = [
  {
    id: "1",
    platform: "telegram",
    label_en: "Official Channel",
    label_ar: "القناة الرسمية",
    url: "https://t.me",
  },
  {
    id: "2",
    platform: "facebook",
    label_en: "Discussion Community",
    label_ar: "مجموعة النقاش",
    url: "https://facebook.com",
  },
  {
    id: "3",
    platform: "youtube",
    label_en: "Video Lectures",
    label_ar: "قناة المحاضرات",
    url: "https://youtube.com",
  },
]

export const defaultUniversities: University[] = [
  { id: "u_cairo", name_en: "Cairo University", name_ar: "جامعة القاهرة" },
  { id: "u_ainshams", name_en: "Ain Shams University", name_ar: "جامعة عين شمس" },
  { id: "u_alex", name_en: "Alexandria University", name_ar: "جامعة الإسكندرية" },
  { id: "u_mansoura", name_en: "Mansoura University", name_ar: "جامعة المنصورة" },
  { id: "u_assiut", name_en: "Assiut University", name_ar: "جامعة أسيوط" },
  { id: "u_zagazig", name_en: "Zagazig University", name_ar: "جامعة الزقازيق" },
  { id: "u_helwan", name_en: "Helwan University", name_ar: "جامعة حلوان" },
  { id: "u_must", name_en: "Misr University for Science & Technology (MUST)", name_ar: "جامعة مصر للعلوم والتكنولوجيا" },
  { id: "u_buc", name_en: "Badr University in Cairo (BUC)", name_ar: "جامعة بدر بالقاهرة" },
  { id: "u_miu", name_en: "Misr International University (MIU)", name_ar: "جامعة مصر الدولية" },
  { id: "u_guc", name_en: "German University in Cairo (GUC)", name_ar: "الجامعة الألمانية بالقاهرة" },
  { id: "u_other", name_en: "Other Institution", name_ar: "جامعة أو مؤسسة أخرى" },
]

export const defaultFaculties: Faculty[] = [
  { id: "f_pharmd_clin", name_en: "Faculty of Pharmacy — PharmD Clinical Pharmacy", name_ar: "كلية الصيدلة — دكتور صيدلي إكلينيكي", duration_years: 5 },
  { id: "f_pharmd_gen", name_en: "Faculty of Pharmacy — PharmD General Pharmacy", name_ar: "كلية الصيدلة — دكتور صيدلي عام", duration_years: 5 },
  { id: "f_pharm_bachelor", name_en: "Faculty of Pharmacy — Bachelor of Pharmacy", name_ar: "كلية الصيدلة — بكالوريوس الصيدلة", duration_years: 5 },
  { id: "f_med", name_en: "Faculty of Medicine", name_ar: "كلية الطب البشري", duration_years: 5 },
  { id: "f_dent", name_en: "Faculty of Dentistry", name_ar: "كلية طب الأسنان", duration_years: 5 },
  { id: "f_health_sci", name_en: "Faculty of Applied Health Sciences", name_ar: "كلية تكنولوجيا العلوم الصحية", duration_years: 4 },
  { id: "f_other", name_en: "Other Medical / Healthcare Specialization", name_ar: "تخصص صحي أو طبي آخر", duration_years: 5 },
]

export const defaultEnrollmentSettings: EnrollmentSettings = {
  signup_mode: "approval_required",
  universities: defaultUniversities,
  faculties: defaultFaculties,
}

export const defaultSiteContent: SiteContent = {
  en: {
    hero_eyebrow: "Modern pharmacology education",
    hero_title_a: "Master Clinical",
    hero_title_b: "Pharmacology",
    hero_subtitle:
      "A focused, structured learning hub with high-yield video lectures, downloadable clinical summaries, and instant knowledge checkpoints.",
    hero_primary_cta: "Browse Courses",
    hero_secondary_cta: "Explore Method",
    hero_note_one: "Free, open curriculum",
    hero_note_two: "Verified clinical references",
    about_eyebrow: "Learning framework",
    about_title: "Designed for retention and clinical readiness.",
    about_body:
      "Medical education often overwhelms with fragmented notes and endless slides. PharmaCore structures complex drug mechanisms into concise, visual units so you can move from fundamental principles to confident clinical decisions.",
    feature_one_title: "Structured Pathways",
    feature_one_body: "Organized by body system and therapeutic drug class.",
    feature_two_title: "High-Yield Video",
    feature_two_body: "Concise whiteboard breakdowns focused on mechanisms of action.",
    feature_three_title: "Clinical Checkpoints",
    feature_three_body: "Targeted question sets testing contraindications and drug interactions.",
    feature_four_title: "Direct Peer Discussion",
    feature_four_body: "Ask questions on every lecture with mentor-reviewed feedback.",
    courses_eyebrow: "Curriculum",
    courses_title: "Explore Core Modules",
    courses_body: "Structured clinical pharmacology units built for students and clinicians.",
    course_view: "Explore Course",
    course_badge: "Curriculum Module",
    cta_title: "Ready to accelerate your clinical pharmacology foundation?",
    cta_body: "Start with any module today — free, open access with no barriers.",
    footer_description:
      "PharmaCore delivers structured, visual clinical pharmacology education for medical, pharmacy, and healthcare professionals.",
    footer_reviewed: "Peer-reviewed content",
    footer_social_title: "Connect & Community",
    footer_team_name: "PharmaCore Education Team",
    footer_team_role: "Clinical Pharmacology Unit",
    footer_email: "support@pharmacore.com",
    footer_links_title: "Platform",
    footer_rights: "All rights reserved.",
    footer_tagline: "Empowering clinical decision makers worldwide.",
  },
  ar: {
    hero_eyebrow: "تعليم متقدم في علم الأدوية السريري",
    hero_title_a: "أتقن علم",
    hero_title_b: "الأدوية السريري",
    hero_subtitle:
      "منصة تعليمية مركزة تجمع بين محاضرات الفيديو المبسطة، والملخصات السريرية القابلة للتحميل، والاختبارات التفاعلية الفورية.",
    hero_primary_cta: "استكشف المقررات",
    hero_secondary_cta: "منهجية التعليم",
    hero_note_one: "محتوى تعليمي مفتوح",
    hero_note_two: "مراجع إكلينيكية معتمدة",
    about_eyebrow: "إطار التعلم",
    about_title: "مُصمم لترسيخ الفهم والجاهزية الإكلينيكية.",
    about_body:
      "غالبًا ما يتشتت الدارس بين المذكرات المبعثرة والعروض الطويلة. تقدم فارماكور تقسيمًا منهجيًا لآليات عمل الأدوية لتنتقل بسلاسة من المفاهيم الأولية إلى التطبيق السريري الواثق.",
    feature_one_title: "مسارات منهجية",
    feature_one_body: "ترتيب علمي متدرج حسب الأجهزة الحيوية والمجموعات العلاجية.",
    feature_two_title: "محاضرات مركزة",
    feature_two_body: "شرح تفاعلي مكثف يركز على آليات العمل والتطبيقات العملية.",
    feature_three_title: "اختبارات استيعاب",
    feature_three_body: "أسئلة تدريبية مباشرة على موانع الاستعمال والتفاعلات الدوائية.",
    feature_four_title: "مجتمع تفاعلي",
    feature_four_body: "اطرح استفساراتك على كل محاضرة مع مراجعة وإجابة من المشرفين.",
    courses_eyebrow: "المنهج الدراسي",
    courses_title: "استكشف المقررات المتاحة",
    courses_body: "وحدات تعليمية إكلينيكية متخصصة لطلاب وخريجي المهن الطبية والصحية.",
    course_view: "عرض المحتوى",
    course_badge: "مقرر تعليمي",
    cta_title: "جاهز لبناء أساس قوي في علم الأدوية الإكلينيكي؟",
    cta_body: "ابدأ دراسة أي مقرر الآن — محتوى متكامل متاح للجميع.",
    footer_description:
      "فارماكور منصة متخصصة في تقديم تعليم صيدلاني وسريري مرئي ومبسط لطلاب وخريجي القطاع الصحي.",
    footer_reviewed: "محتوى مراجع علميًا",
    footer_social_title: "قنوات التواصل والمجتمع",
    footer_team_name: "فريق فارماكور التعليمي",
    footer_team_role: "وحدة الفارماكولوجي الإكلينيكي",
    footer_email: "support@pharmacore.com",
    footer_links_title: "المنصة",
    footer_rights: "جميع الحقوق محفوظة.",
    footer_tagline: "تمكين الممارسين الصحيين بأحدث المعارف الإكلينيكية.",
  },
  social_links: defaultSocialLinks,
  enrollment_settings: defaultEnrollmentSettings,
}

export const contentSections: Array<{
  title: string
  fields: Array<keyof SiteLocaleContent>
}> = [
  {
    title: "Hero section",
    fields: [
      "hero_eyebrow",
      "hero_title_a",
      "hero_title_b",
      "hero_subtitle",
      "hero_primary_cta",
      "hero_secondary_cta",
      "hero_note_one",
      "hero_note_two",
    ],
  },
  {
    title: "About section",
    fields: [
      "about_eyebrow",
      "about_title",
      "about_body",
      "feature_one_title",
      "feature_one_body",
      "feature_two_title",
      "feature_two_body",
      "feature_three_title",
      "feature_three_body",
      "feature_four_title",
      "feature_four_body",
    ],
  },
  {
    title: "Courses and CTA",
    fields: [
      "courses_eyebrow",
      "courses_title",
      "courses_body",
      "course_view",
      "course_badge",
      "cta_title",
      "cta_body",
    ],
  },
  {
    title: "Footer & Attribution",
    fields: [
      "footer_description",
      "footer_reviewed",
      "footer_social_title",
      "footer_team_name",
      "footer_team_role",
      "footer_email",
      "footer_links_title",
      "footer_rights",
      "footer_tagline",
    ],
  },
]

export const contentGroups = contentSections

export const siteMetadata = {
  en: {
    title: "PharmaCore — Specialized Clinical Pharmacology & Pharmacy Education",
    titleTemplate: "%s | PharmaCore",
    description:
      "A focused, open educational platform for medical and pharmacy students. High-yield video lectures, clinical pharmacology breakdowns, downloadable summaries, and interactive quizzes.",
    keywords: [
      "clinical pharmacology",
      "pharmacy courses",
      "PharmD education",
      "drug mechanisms of action",
      "medical pharmacology",
      "pharmacology quizzes",
      "pharmacotherapy",
      "healthcare education",
      "hospital pharmacy",
      "clinical checkpoints"
    ],
  },
  ar: {
    title: "فارماكور — المنصة التخصصية في علم الأدوية السريري والتعليم الصيدلي",
    titleTemplate: "%s | فارماكور",
    description:
      "منصة تعليمية متخصصة ومفتوحة لطلاب وخريجي كليات الصيدلة والطب. محاضرات فيديو مركزة في الفارماكولوجي الإكلينيكي، ملخصات سريرية مبسطة، واختبارات تفاعلية فورية.",
    keywords: [
      "علم الأدوية السريري",
      "فارماكولوجي",
      "صيدلة إكلينيكية",
      "دكتور صيدلي",
      "شرح فارماكولوجي",
      "دورات صيدلة",
      "مقررات طبية",
      "اختبارات أدوية",
      "آليات عمل الأدوية",
      "فارماكور"
    ],
  },
}

export const siteBranding = {
  logo_url: "/pharmacore-logo.svg",
  favicon_url: "/favicon.ico",
  preview_image_url: "/og-image.png",
  logoUrl: "/pharmacore-logo.svg",
  faviconUrl: "/favicon.ico",
  previewImageUrl: "/og-image.png",
  themeColorLight: "#1e515d",
  themeColorDark: "#0d1b1e",
  brandInk: "#262626",
  brandMid: "#6aa6b8",
  brandLight: "#8bcde1",
}

export const contentLabel = (field: keyof SiteLocaleContent) =>
  field.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase())

export const mergeSiteContent = (content?: Partial<SiteContent> | null): SiteContent => ({
  en: { ...defaultSiteContent.en, ...(content?.en ?? {}) },
  ar: { ...defaultSiteContent.ar, ...(content?.ar ?? {}) },
  social_links: Array.isArray(content?.social_links)
    ? content.social_links
    : defaultSocialLinks,
  enrollment_settings: {
    signup_mode: content?.enrollment_settings?.signup_mode || defaultEnrollmentSettings.signup_mode,
    universities: Array.isArray(content?.enrollment_settings?.universities) && content.enrollment_settings.universities.length > 0
      ? content.enrollment_settings.universities
      : defaultUniversities,
    faculties: Array.isArray(content?.enrollment_settings?.faculties) && content.enrollment_settings.faculties.length > 0
      ? content.enrollment_settings.faculties
      : defaultFaculties,
  },
  maintenance_mode: content?.maintenance_mode || {
    enabled: false,
    title_en: "Scheduled Maintenance in Progress",
    title_ar: "أعمال صيانة وتحديث مجدولة",
    message_en: "PharmaCore is undergoing planned platform improvements. We will be back shortly.",
    message_ar: "تخضع منصة فارما كور لأعمال تطوير وتحديث مجدولة. سنعود للعمل قريبًا جدًا.",
  },
})

export async function loadSiteContent(): Promise<SiteContent> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("site_content")
        .select("content")
        .eq("id", "main")
        .single()
      if (!error && data?.content) {
        return mergeSiteContent(data.content as Partial<SiteContent>)
      }
    } catch {}
  }
  return defaultSiteContent
}
