import {
  FiAward as Award,
  FiBarChart2 as BarChart2,
  FiCalendar as Calendar,
  FiCheckSquare as CheckSquare,
  FiCpu as Cpu,
  FiGlobe as Globe,
  FiLayers as Layers,
  FiLink as LinkIcon,
  FiLoader as Loader2,
  FiMessageSquare as MessageSquare,
  FiPlus as Plus,
  FiSave as Save,
  FiShare2 as Share2,
  FiSliders as Sliders,
  FiTag as Tag,
  FiTrash2 as Trash2,
  FiZap as Zap,
} from "react-icons/fi"
import {
  FaDiscord,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTelegram,
  FaTiktok,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  contentGroups,
  contentLabel,
  defaultFeatureFlags,
  defaultMarketingBanner,
  defaultLeadMagnet,
  type SiteContent,
  type SiteLocale,
  type SiteLocaleContent,
  type SocialLink,
  type SocialPlatform,
  type MarketingBannerConfig,
  type LeadMagnetConfig,
} from "@/lib/siteContent"
import {
  FEATURE_FLAG_DEFINITIONS,
  FEATURE_FLAG_KEYS,
} from "@/lib/featureFlags"
import type { FeatureFlagsConfig } from "@/types"

interface SiteContentManagerProps {
  isAr: boolean
  siteContent: SiteContent
  setSiteContent: React.Dispatch<React.SetStateAction<SiteContent>>
  saving: boolean
  onSaveContent: () => void
}

const availablePlatforms: Array<{ id: SocialPlatform; label: string; icon: React.ReactNode }> = [
  { id: "telegram", label: "Telegram", icon: <FaTelegram className="size-3.5 text-[#229ED9]" /> },
  { id: "facebook", label: "Facebook", icon: <FaFacebookF className="size-3.5 text-[#1877F2]" /> },
  { id: "whatsapp", label: "WhatsApp", icon: <FaWhatsapp className="size-3.5 text-[#25D366]" /> },
  { id: "youtube", label: "YouTube", icon: <FaYoutube className="size-3.5 text-[#FF0000]" /> },
  { id: "linkedin", label: "LinkedIn", icon: <FaLinkedinIn className="size-3.5 text-[#0A66C2]" /> },
  { id: "twitter", label: "X (Twitter)", icon: <FaXTwitter className="size-3.5" /> },
  { id: "instagram", label: "Instagram", icon: <FaInstagram className="size-3.5 text-[#E4405F]" /> },
  { id: "discord", label: "Discord", icon: <FaDiscord className="size-3.5 text-[#5865F2]" /> },
  { id: "tiktok", label: "TikTok", icon: <FaTiktok className="size-3.5" /> },
  { id: "website", label: "Website / Other", icon: <Globe className="size-3.5 text-primary" /> },
]

export default function SiteContentManager({
  isAr,
  siteContent,
  setSiteContent,
  saving,
  onSaveContent,
}: SiteContentManagerProps) {
  const tr = (en: string, ar: string) => (isAr ? ar : en)
  const socialLinks = siteContent.social_links || []

  const toggleFeatureFlag = (key: keyof FeatureFlagsConfig) => {
    setSiteContent((prev) => ({
      ...prev,
      features: {
        ...defaultFeatureFlags,
        ...(prev.features || {}),
        [key]: !(prev.features?.[key] ?? defaultFeatureFlags[key]),
      },
    }))
  }

  const updateField = (locale: SiteLocale, field: keyof SiteLocaleContent, value: string) => {
    setSiteContent((prev) => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        [field]: value,
      },
    }))
  }

  const addSocialLink = () => {
    const newLink: SocialLink = {
      id: "social_" + Date.now(),
      platform: "telegram",
      label_en: "Official Channel",
      label_ar: "القناة الرسمية",
      url: "https://",
    }
    setSiteContent((prev) => ({
      ...prev,
      social_links: [...(prev.social_links || []), newLink],
    }))
  }

  const updateSocialLink = (id: string, updates: Partial<SocialLink>) => {
    setSiteContent((prev) => ({
      ...prev,
      social_links: (prev.social_links || []).map((link) =>
        link.id === id ? { ...link, ...updates } : link
      ),
    }))
  }

  const updateMarketingBanner = (updates: Partial<MarketingBannerConfig>) => {
    setSiteContent((prev) => ({
      ...prev,
      marketing_banner: {
        ...defaultMarketingBanner,
        ...(prev.marketing_banner || {}),
        ...updates,
      },
    }))
  }

  const updateLeadMagnet = (updates: Partial<LeadMagnetConfig>) => {
    setSiteContent((prev) => ({
      ...prev,
      lead_magnet: {
        ...defaultLeadMagnet,
        ...(prev.lead_magnet || {}),
        ...updates,
      },
    }))
  }

  const removeSocialLink = (id: string) => {
    setSiteContent((prev) => ({
      ...prev,
      social_links: (prev.social_links || []).filter((link) => link.id !== id),
    }))
  }

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* Header & Save Action */}
      <div className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-card/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="size-10 grid place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Globe className="size-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight text-foreground">{tr("Website Content CMS", "إدارة وتخصيص نصوص الموقع")}</h3>
            <Badge variant="secondary" className="text-xs font-mono font-bold">
              Bilingual
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {tr(
              "Manage public-facing text, headlines, social links, and call-to-actions across English and Arabic locales.",
              "تعديل وتخصيص كافة النصوص العامة، والعناوين الرئيسية، وروابط التواصل الاجتماعي باللغتين العربية والإنجليزية."
            )}
          </p>
        </div>

        <Button
          onClick={onSaveContent}
          disabled={saving}
          className="gap-2 font-bold text-xs h-11 px-6 rounded-full shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 w-full sm:w-auto"
        >
          {saving ? <Loader2 className="size-4 animate-spin shrink-0" /> : <Save className="size-4 shrink-0" />}
          <span>{saving ? tr("Publishing Changes...", "جارٍ حفظ التغييرات...") : tr("Publish Site Content", "نشر محتوى الموقع")}</span>
        </Button>
      </div>

      {/* Accordion grouped content */}
      <Accordion
        type="multiple"
        defaultValue={["Marketing & Announcements", "Feature Flags", "Community Social Links", "Hero section", "About section", "Courses and CTA", "Footer & Attribution"]}
        className="space-y-4"
      >
        {/* ─── 0. MARKETING ENGINE & TOP PROMO ANNOUNCEMENTS ──────── */}
        <AccordionItem
          value="Marketing & Announcements"
          className="rounded-3xl border border-amber-500/30 bg-card/90 px-5 sm:px-6 shadow-sm overflow-hidden"
        >
          <AccordionTrigger className="hover:no-underline py-4 sm:py-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                <Zap className="size-5" />
              </span>
              <div className="text-start">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm sm:text-base text-foreground leading-none">
                    {tr("Marketing Engine & In-App Announcements", "إدارة الإعلانات الترويجية والعروض")}
                  </h4>
                  <Badge
                    className={`text-xs font-mono font-bold shrink-0 ${
                      siteContent.marketing_banner?.enabled
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {siteContent.marketing_banner?.enabled
                      ? tr("Banner Active", "الشريط مفعل")
                      : tr("Banner Inactive", "الشريط معطل")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {tr(
                    "Configure the top frosted promo bar, live countdown clock, coupon codes, and guest lead magnet preview modal.",
                    "التحكم في شريط الإعلانات العلوي، والعد التنازلي المباشر، ورموز الخصم، ونافذة تحويل الزوار المجانية."
                  )}
                </p>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="pt-2 pb-6 space-y-6">
            {/* Top Promo Banner Controls Card */}
            <div className="rounded-2xl border border-border/80 bg-background/60 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Tag className="size-4 text-primary" />
                    <h5 className="font-black text-xs sm:text-sm text-foreground">
                      {tr("Dynamic Top Promo Announcement Bar", "شريط الإعلانات الترويجي العلوي")}
                    </h5>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {tr(
                      "Displays at the very top of all public pages with live countdown and coupon copy.",
                      "يظهر في أعلى صفحات الموقع مع عداد زمني وزر نسخ رمز الخصم."
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground">
                    {siteContent.marketing_banner?.enabled ? tr("Enabled", "مفعل") : tr("Disabled", "معطل")}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(siteContent.marketing_banner?.enabled)}
                      onChange={(e) => updateMarketingBanner({ enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {/* Banner Details Fields */}
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                {/* Badge EN */}
                <div className="space-y-1.5" dir="ltr">
                  <Label className="text-xs font-bold text-foreground">Badge Tag (English)</Label>
                  <Input
                    value={siteContent.marketing_banner?.badge_en || ""}
                    onChange={(e) => updateMarketingBanner({ badge_en: e.target.value })}
                    placeholder="LIMITED OFFER / 20% OFF"
                    className="rounded-xl h-11 border-border/80 bg-background/80 text-xs"
                  />
                </div>

                {/* Badge AR */}
                <div className="space-y-1.5" dir="rtl">
                  <Label className="text-xs font-bold text-foreground">وسم العرض (بالعربية)</Label>
                  <Input
                    value={siteContent.marketing_banner?.badge_ar || ""}
                    onChange={(e) => updateMarketingBanner({ badge_ar: e.target.value })}
                    placeholder="عرض حصري / خصم 20%"
                    className="rounded-xl h-11 border-border/80 bg-background/80 text-xs"
                  />
                </div>

                {/* Banner Text EN */}
                <div className="space-y-1.5 sm:col-span-2" dir="ltr">
                  <Label className="text-xs font-bold text-foreground">Announcement Copy (English)</Label>
                  <Input
                    value={siteContent.marketing_banner?.text_en || ""}
                    onChange={(e) => updateMarketingBanner({ text_en: e.target.value })}
                    placeholder="Master Clinical Pharmacology with 20% off all certifications! Use code"
                    className="rounded-xl h-11 border-border/80 bg-background/80 text-xs"
                  />
                </div>

                {/* Banner Text AR */}
                <div className="space-y-1.5 sm:col-span-2" dir="rtl">
                  <Label className="text-xs font-bold text-foreground">نص الإعلان الترويجي (بالعربية)</Label>
                  <Input
                    value={siteContent.marketing_banner?.text_ar || ""}
                    onChange={(e) => updateMarketingBanner({ text_ar: e.target.value })}
                    placeholder="أتقن علم الأدوية السريري بخصم 20% على كافة الشهادات المهنية! استخدم الكوبون"
                    className="rounded-xl h-11 border-border/80 bg-background/80 text-xs"
                  />
                </div>

                {/* Coupon Code */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">{tr("Coupon Code", "رمز الكوبون")}</Label>
                  <div className="relative">
                    <Tag className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={siteContent.marketing_banner?.coupon_code || ""}
                      onChange={(e) => updateMarketingBanner({ coupon_code: e.target.value.toUpperCase() })}
                      placeholder="PHARMA2026"
                      className="ps-10 rounded-xl h-11 border-border/80 bg-background/80 text-xs font-mono font-bold uppercase"
                    />
                  </div>
                </div>

                {/* Countdown Target Date */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">
                    {tr("Countdown Target Deadline (ISO / UTC)", "تاريخ ونهاية العد التنازلي")}
                  </Label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={siteContent.marketing_banner?.target_date || ""}
                      onChange={(e) => updateMarketingBanner({ target_date: e.target.value })}
                      placeholder="2026-09-01T00:00:00Z"
                      className="ps-10 rounded-xl h-11 border-border/80 bg-background/80 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* CTA URL */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-foreground">{tr("CTA Link Target URL", "رابط زر الدعوة للعمل (CTA)")}</Label>
                  <div className="relative">
                    <LinkIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={siteContent.marketing_banner?.cta_url || ""}
                      onChange={(e) => updateMarketingBanner({ cta_url: e.target.value })}
                      placeholder="/courses or /course/special-bundle"
                      className="ps-10 rounded-xl h-11 border-border/80 bg-background/80 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* CTA Text EN */}
                <div className="space-y-1.5" dir="ltr">
                  <Label className="text-xs font-bold text-foreground">CTA Button Label (English)</Label>
                  <Input
                    value={siteContent.marketing_banner?.cta_text_en || ""}
                    onChange={(e) => updateMarketingBanner({ cta_text_en: e.target.value })}
                    placeholder="Explore Courses"
                    className="rounded-xl h-11 border-border/80 bg-background/80 text-xs"
                  />
                </div>

                {/* CTA Text AR */}
                <div className="space-y-1.5" dir="rtl">
                  <Label className="text-xs font-bold text-foreground">نص زر الدعوة للعمل (بالعربية)</Label>
                  <Input
                    value={siteContent.marketing_banner?.cta_text_ar || ""}
                    onChange={(e) => updateMarketingBanner({ cta_text_ar: e.target.value })}
                    placeholder="استكشف المقررات"
                    className="rounded-xl h-11 border-border/80 bg-background/80 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Lead Magnet Preview Mode Card */}
            <div className="rounded-2xl border border-border/80 bg-background/60 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Award className="size-4 text-emerald-600" />
                    <h5 className="font-black text-xs sm:text-sm text-foreground">
                      {tr("Guest Lead Magnet & Preview Conversion Modal", "نافذة تحويل الزوار والمحاضرات التجريبية")}
                    </h5>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {tr(
                      "Enables sample lesson previews and displays a high-converting registration modal upon completion.",
                      "تتيح للزوار مشاهدة عينات تجريبية من المحاضرات، وتظهر نافذة للتسجيل المجاني عند إتمام الدرس."
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">
                      {siteContent.lead_magnet?.enabled ? tr("Enabled", "مفعل") : tr("Disabled", "معطل")}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(siteContent.lead_magnet?.enabled)}
                        onChange={(e) => updateLeadMagnet({ enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Preview All First Lectures Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground">
                    {tr("Unlock First Lecture of All Courses as Free Preview", "فتح المحاضرة الأولى من كل مقرر كمعاينة مجانية")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {tr(
                      "Guests can watch lecture #1 without requiring immediate enrollment.",
                      "يمكن للزوار مشاهدة المحاضرة الأولى تلقائياً دون اشتراط تسجيل مسبق."
                    )}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(siteContent.lead_magnet?.preview_all_first_lectures)}
                    onChange={(e) => updateLeadMagnet({ preview_all_first_lectures: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Modal Titles & Copy */}
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <div className="space-y-1.5" dir="ltr">
                  <Label className="text-xs font-bold text-foreground">Modal Title (English)</Label>
                  <Input
                    value={siteContent.lead_magnet?.modal_title_en || ""}
                    onChange={(e) => updateLeadMagnet({ modal_title_en: e.target.value })}
                    placeholder="Unlock the Full Clinical Curriculum"
                    className="rounded-xl h-11 border-border/80 bg-background/80 text-xs"
                  />
                </div>

                <div className="space-y-1.5" dir="rtl">
                  <Label className="text-xs font-bold text-foreground">عنوان النافذة (بالعربية)</Label>
                  <Input
                    value={siteContent.lead_magnet?.modal_title_ar || ""}
                    onChange={(e) => updateLeadMagnet({ modal_title_ar: e.target.value })}
                    placeholder="افتح كامل المنهج الإكلينيكي المعتمد"
                    className="rounded-xl h-11 border-border/80 bg-background/80 text-xs"
                  />
                </div>

                <div className="space-y-1.5" dir="ltr">
                  <Label className="text-xs font-bold text-foreground">Modal Body Copy (English)</Label>
                  <Textarea
                    rows={3}
                    value={siteContent.lead_magnet?.modal_body_en || ""}
                    onChange={(e) => updateLeadMagnet({ modal_body_en: e.target.value })}
                    placeholder="Join 5,000+ medical and pharmacy students. Create your free account..."
                    className="rounded-2xl border-border/80 bg-background/80 text-xs leading-relaxed p-3 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1.5" dir="rtl">
                  <Label className="text-xs font-bold text-foreground">نص الرسالة التوضيحية (بالعربية)</Label>
                  <Textarea
                    rows={3}
                    value={siteContent.lead_magnet?.modal_body_ar || ""}
                    onChange={(e) => updateLeadMagnet({ modal_body_ar: e.target.value })}
                    placeholder="انضم إلى أكثر من 5,000 طالب وطبيبة صيدلانية. أنشئ حسابك المجاني..."
                    className="rounded-2xl border-border/80 bg-background/80 text-xs leading-relaxed p-3 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ─── 1. GLOBAL FEATURE FLAGS & MODULAR ACTIVATION ──────────── */}
        <AccordionItem
          value="Feature Flags"
          className="rounded-3xl border border-indigo-500/30 bg-card/90 px-5 sm:px-6 shadow-sm overflow-hidden"
        >
          <AccordionTrigger className="hover:no-underline py-4 sm:py-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                <Sliders className="size-5" />
              </span>
              <div className="text-start">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm sm:text-base text-foreground leading-none">
                    {tr("Platform Feature Flags & Modular Activation", "إدارة وتفعيل وحدات وميزات المنصة")}
                  </h4>
                  <Badge variant="outline" className="text-xs font-mono font-bold shrink-0">
                    {
                      Object.values({
                        ...defaultFeatureFlags,
                        ...(siteContent.features || {}),
                      }).filter(Boolean).length
                    }
                    /{FEATURE_FLAG_KEYS.length} {tr("Active", "مفعّل")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {tr(
                    "Toggle global availability of AI assistant, practice mode, certificates, community Q&A, and gradebook.",
                    "التحكم المركزي في إتاحة المساعد الذكي، وضع التدريب، الشهادات، مجتمع النقاش، وسجل الدرجات."
                  )}
                </p>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="pt-2 pb-6 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed border-b border-border/60 pb-3">
              {tr(
                "These global flags set baseline behavior across the platform. Specific courses can override these defaults in their respective course settings.",
                "تسري هذه الإعدادات كقيم افتراضية لكافة المقررات في المنصة، مع إمكانية استثناء أي ميزة وتخصيصها لكل مقرر على حدة."
              )}
            </p>

            <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {FEATURE_FLAG_DEFINITIONS.map((def) => {
                const currentFeatures = {
                  ...defaultFeatureFlags,
                  ...(siteContent.features || {}),
                }
                const isEnabled = Boolean(currentFeatures[def.key])

                const categoryIcons: Record<string, typeof Cpu> = {
                  ai: Cpu,
                  assessment: CheckSquare,
                  gamification: Award,
                  collaboration: MessageSquare,
                  analytics: BarChart2,
                }
                const IconComp = categoryIcons[def.category] || Sliders

                return (
                  <div
                    key={def.key}
                    className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                      isEnabled
                        ? "border-primary/40 bg-card/90 shadow-2xs"
                        : "border-border/60 bg-muted/20 opacity-80"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="size-8 grid place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                            <IconComp className="size-4" />
                          </span>
                          <span className="font-bold text-xs text-foreground leading-tight">
                            {isAr ? def.title_ar : def.title_en}
                          </span>
                        </div>
                        <Badge
                          className={`rounded-full px-2 py-0 text-[10px] font-bold shrink-0 ${
                            isEnabled
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {isEnabled ? tr("ON", "مفعل") : tr("OFF", "معطل")}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        {isAr ? def.description_ar : def.description_en}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {def.key}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => toggleFeatureFlag(def.key)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ─── 1. PHARMACORE SOCIAL & COMMUNITY CHANNELS ──────────────── */}
        <AccordionItem
          value="Community Social Links"
          className="rounded-3xl border border-primary/30 bg-card/90 px-5 sm:px-6 shadow-sm overflow-hidden"
        >
          <AccordionTrigger className="hover:no-underline py-4 sm:py-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                <Share2 className="size-5" />
              </span>
              <div className="text-start">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm sm:text-base text-foreground leading-none">
                    {tr("PharmaCore Community & Social Channels", "قنوات المجتمع وروابط التواصل الاجتماعي")}
                  </h4>
                  <Badge variant="secondary" className="text-xs font-mono font-bold shrink-0">
                    {socialLinks.length}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {tr(
                    "Manage buttons shown in the footer (Telegram channel, Facebook group, WhatsApp, YouTube, etc.)",
                    "إدارة الأزرار المعروضة في الفوتر (قناة التيليجرام، مجموعة الفيسبوك، الواتساب، اليوتيوب، إلخ)"
                  )}
                </p>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="pt-2 pb-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tr(
                  "Configure platform, bilingual context text (e.g. 'Official Channel', 'Study Group', 'Page'), and URL.",
                  "اختر المنصة واكتب النص التوضيحي بالعربية والإنجليزية (مثال: 'القناة الرسمية'، 'مجموعة النقاش'، 'الصفحة')."
                )}
              </p>

              <Button
                type="button"
                size="sm"
                onClick={addSocialLink}
                className="gap-1.5 font-bold text-xs shrink-0 rounded-full h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                <Plus className="size-3.5 shrink-0" />
                <span>{tr("Add Social Channel", "إضافة قناة تواصل")}</span>
              </Button>
            </div>

            <div className="space-y-4">
              {socialLinks.map((link, idx) => {
                return (
                  <div
                    key={link.id}
                    className="rounded-2xl border border-border/70 bg-background/60 p-4 space-y-3.5 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs font-mono">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                          {link.platform}
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeSocialLink(link.id)}
                        title={tr("Delete link", "حذف الرابط")}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
                      {/* Platform Select */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground">{tr("Platform", "المنصة")}</Label>
                        <Select
                          value={link.platform}
                          onValueChange={(val) => updateSocialLink(link.id, { platform: val as SocialPlatform })}
                        >
                          <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            {availablePlatforms.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                <div className="flex items-center gap-2">
                                  {p.icon}
                                  <span>{p.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* English Label / Context */}
                      <div className="space-y-1.5" dir="ltr">
                        <Label className="text-xs font-bold text-foreground">English Context / Type</Label>
                        <Input
                          value={link.label_en}
                          onChange={(e) => updateSocialLink(link.id, { label_en: e.target.value })}
                          placeholder="e.g. Official Channel, Study Group, Page"
                          className="rounded-xl h-11 border-border/80 bg-background/60 text-xs"
                        />
                      </div>

                      {/* Arabic Label / Context */}
                      <div className="space-y-1.5" dir="rtl">
                        <Label className="text-xs font-bold text-foreground">التوصيف بالعربية</Label>
                        <Input
                          value={link.label_ar}
                          onChange={(e) => updateSocialLink(link.id, { label_ar: e.target.value })}
                          placeholder="مثال: القناة الرسمية، مجموعة النقاش، الصفحة"
                          className="rounded-xl h-11 border-border/80 bg-background/60 text-xs"
                        />
                      </div>

                      {/* Target URL */}
                      <div className="space-y-1.5 sm:col-span-3">
                        <Label className="text-xs font-bold text-foreground">{tr("Target Channel / Group URL", "رابط القناة أو المجموعة")}</Label>
                        <div className="relative">
                          <LinkIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="url"
                            value={link.url}
                            onChange={(e) => updateSocialLink(link.id, { url: e.target.value })}
                            placeholder="https://t.me/your_channel or https://facebook.com/groups/..."
                            className="ps-10 rounded-xl h-11 border-border/80 bg-background/60 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {!socialLinks.length && (
                <div className="grid min-h-24 place-items-center rounded-2xl border border-dashed border-border/80 p-6 text-center text-muted-foreground">
                  <div>
                    <Share2 className="mx-auto size-8 opacity-40" />
                    <p className="mt-2 text-xs font-bold text-foreground">
                      {tr("No social channels added yet", "لم تتم إضافة قنوات تواصل بعد")}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {tr("Click 'Add Social Channel' above to create footer channel buttons.", "انقر على 'إضافة قناة تواصل' أعلاه لإضافة أزرار الفوتر.")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ─── 2. GENERAL BILINGUAL CONTENT ACCORDIONS ────────────────── */}
        {contentGroups.map((group: { title: string; fields: Array<keyof SiteLocaleContent> }) => (
          <AccordionItem
            key={group.title}
            value={group.title}
            className="rounded-3xl border border-border/80 bg-card/90 px-5 sm:px-6 shadow-sm overflow-hidden"
          >
            <AccordionTrigger className="hover:no-underline py-4 sm:py-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <Layers className="size-5" />
                </span>
                <div className="text-start">
                  <h4 className="font-black text-sm sm:text-base text-foreground leading-none">{group.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {group.fields.length} {tr("fields available", "حقول قابلة للتعديل")}
                  </p>
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="pt-2 pb-6 space-y-4">
              {group.fields.map((field: keyof SiteLocaleContent) => {
                const multiline = /body|description|subtitle|tagline/.test(field)
                const isEmail = field === "footer_email"
                const enVal = siteContent.en[field] || ""
                const arVal = siteContent.ar[field] || ""

                return (
                  <div
                    key={field}
                    className="rounded-2xl border border-border/70 bg-background/60 p-4 space-y-3 transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-primary">
                        {contentLabel(field)}
                      </Label>
                      <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground rounded-full px-2">
                        {field}
                      </Badge>
                    </div>

                    <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                      {/* English Field */}
                      <div className="space-y-1.5" dir="ltr">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                          <span>English (EN)</span>
                          <span className="font-mono">{enVal.length} chars</span>
                        </div>
                        {multiline ? (
                          <Textarea
                            rows={3}
                            value={enVal}
                            onChange={(e) => updateField("en", field, e.target.value)}
                            className="rounded-2xl border-border/80 bg-background/80 text-xs leading-relaxed p-3 focus:ring-2 focus:ring-primary/20"
                          />
                        ) : (
                          <Input
                            type={isEmail ? "email" : "text"}
                            value={enVal}
                            onChange={(e) => updateField("en", field, e.target.value)}
                            className="rounded-xl h-11 border-border/80 bg-background/80 text-xs"
                          />
                        )}
                      </div>

                      {/* Arabic Field */}
                      <div className="space-y-1.5" dir="rtl">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                          <span>العربية (AR)</span>
                          <span className="font-mono">{arVal.length} حرف</span>
                        </div>
                        {multiline ? (
                          <Textarea
                            rows={3}
                            value={arVal}
                            onChange={(e) => updateField("ar", field, e.target.value)}
                            className="rounded-2xl border-border/80 bg-background/80 text-xs leading-relaxed p-3 focus:ring-2 focus:ring-primary/20"
                          />
                        ) : (
                          <Input
                            type={isEmail ? "email" : "text"}
                            value={arVal}
                            onChange={(e) => updateField("ar", field, e.target.value)}
                            className="rounded-xl h-11 border-border/80 bg-background/80 text-xs"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
