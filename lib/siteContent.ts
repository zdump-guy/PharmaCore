import { supabase } from "@/lib/supabaseClient"

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

export interface SiteContent {
  en: SiteLocaleContent
  ar: SiteLocaleContent
  social_links?: SocialLink[]
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

export const siteMetadata = {
  en: {
    title: "PharmaCore — Pharmacy Education",
    description: "A specialized educational platform for pharmacy and pharmacology courses.",
  },
  ar: {
    title: "فارما كور — منصة التعليم الصيدلي",
    description: "منصة تعليمية متخصصة في مقررات الصيدلة وعلم الأدوية.",
  },
} as const

export const siteBranding = {
  faviconUrl: "/pharmacore-mark.svg",
  previewImageUrl: "",
} as const

export const defaultSiteContent: SiteContent = {
  en: {
    hero_eyebrow: "Open pharmacy learning platform",
    hero_title_a: "Understand pharmacy",
    hero_title_b: "deeply. Apply it confidently.",
    hero_subtitle: "Structured learning paths that connect lectures, notes, quizzes, and community questions — open to every student, with no sign-up.",
    hero_primary_cta: "Explore courses",
    hero_secondary_cta: "See how learning works",
    hero_note_one: "No sign-up or subscription",
    hero_note_two: "Educator-guided structure",
    about_eyebrow: "A deliberate learning experience",
    about_title: "Everything you need, in one context.",
    about_body: "Instead of scattered resources, PharmaCore connects video, references, assessment, and discussion in one clear journey.",
    feature_one_title: "Expert-guided clarity",
    feature_one_body: "Content organized around the outcomes you actually need to master.",
    feature_two_title: "Focused video learning",
    feature_two_body: "Lecture, notes, and next steps stay together.",
    feature_three_title: "Check understanding",
    feature_three_body: "Targeted quizzes provide immediate feedback.",
    feature_four_title: "Ask and learn together",
    feature_four_body: "Public Q&A keeps useful mentor answers available to everyone.",
    courses_eyebrow: "Learning library",
    courses_title: "Start with the course that fits",
    courses_body: "Structured, university-level content across pharmaceutical science and clinical practice.",
    course_view: "View course",
    course_badge: "Structured lectures",
    cta_title: "Ready to build a stronger pharmacy foundation?",
    cta_body: "Start free and learn at your own pace.",
    footer_description: "Clear, trustworthy pharmacy education — from first principles to clinical practice.",
    footer_reviewed: "Educator-reviewed learning",
    footer_social_title: "Community & Channels",
    footer_team_name: "Ghost (Mohamed Mostafa)",
    footer_team_role: "UI/UX & Web Developer",
    footer_email: "mohamedmostafa.dev.main@gmail.com",
    footer_links_title: "Developer & Maintainer",
    footer_rights: "All rights reserved.",
    footer_tagline: "Designed and built for focused learning.",
  },
  ar: {
    hero_eyebrow: "منصة تعليم صيدلي مفتوحة",
    hero_title_a: "افهم الصيدلة",
    hero_title_b: "بعمق. طبّقها بثقة.",
    hero_subtitle: "مسارات تعليمية منظمة تجمع المحاضرات والملخصات والاختبارات والأسئلة المجتمعية — متاحة لكل طالب، دون تسجيل.",
    hero_primary_cta: "استكشف المقررات",
    hero_secondary_cta: "شاهد طريقة التعلّم",
    hero_note_one: "دون تسجيل أو اشتراك",
    hero_note_two: "محتوى منظم بإشراف متخصصين",
    about_eyebrow: "تجربة تعلّم مصممة بوعي",
    about_title: "كل ما تحتاجه، في سياق واحد.",
    about_body: "بدل التنقل بين مصادر مشتتة، تجمع PharmaCore الفيديو والملفات والتقييم والنقاش في رحلة واضحة.",
    feature_one_title: "شرح يقوده المتخصص",
    feature_one_body: "محتوى مرتب حول الأهداف التي تحتاج لإتقانها فعلًا.",
    feature_two_title: "فيديو بلا تشتيت",
    feature_two_body: "مشاهدة المحاضرة والمواد المساندة في صفحة واحدة.",
    feature_three_title: "اختبر فهمك",
    feature_three_body: "اختبارات قصيرة تعطيك تغذية راجعة مباشرة.",
    feature_four_title: "اسأل وتعلّم مع الآخرين",
    feature_four_body: "نقاش عام يحفظ الإجابات المفيدة لكل الطلاب.",
    courses_eyebrow: "المكتبة التعليمية",
    courses_title: "ابدأ من المقرر المناسب لك",
    courses_body: "محتوى جامعي منظم حول العلوم الصيدلانية والممارسة السريرية.",
    course_view: "عرض المقرر",
    course_badge: "محاضرات منظمة",
    cta_title: "جاهز لبناء أساس صيدلي أقوى؟",
    cta_body: "ابدأ مجانًا، وتعلّم بالسرعة التي تناسبك.",
    footer_description: "تعليم صيدلي واضح، موثوق، ومتاح للجميع — من المفهوم الأول حتى الممارسة السريرية.",
    footer_reviewed: "محتوى تعليمي بإشراف متخصصين",
    footer_social_title: "قنوات المجتمع والتواصل",
    footer_team_name: "Ghost (Mohamed Mostafa)",
    footer_team_role: "مصمم UI/UX ومطور ويب",
    footer_email: "mohamedmostafa.dev.main@gmail.com",
    footer_links_title: "المطور والمسؤول عن الصيانة",
    footer_rights: "جميع الحقوق محفوظة.",
    footer_tagline: "صُمّم وبُني بعناية للتعلّم.",
  },
  social_links: defaultSocialLinks,
}

export const contentGroups: Array<{ title: string; fields: Array<keyof SiteLocaleContent> }> = [
  {
    title: "Hero",
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

export const contentLabel = (field: keyof SiteLocaleContent) =>
  field.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase())

export const mergeSiteContent = (content?: Partial<SiteContent> | null): SiteContent => ({
  en: { ...defaultSiteContent.en, ...(content?.en ?? {}) },
  ar: { ...defaultSiteContent.ar, ...(content?.ar ?? {}) },
  social_links: Array.isArray(content?.social_links)
    ? content.social_links
    : defaultSocialLinks,
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
