import {
  FiGlobe as Globe,
  FiLayers as Layers,
  FiLink as LinkIcon,
  FiLoader as Loader2,
  FiPlus as Plus,
  FiSave as Save,
  FiShare2 as Share2,
  FiTrash2 as Trash2,
  FiType as TypeIcon,
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
  type SiteContent,
  type SiteLocale,
  type SiteLocaleContent,
  type SocialLink,
  type SocialPlatform,
} from "@/lib/siteContent"

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

  const removeSocialLink = (id: string) => {
    setSiteContent((prev) => ({
      ...prev,
      social_links: (prev.social_links || []).filter((link) => link.id !== id),
    }))
  }

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* Header & Save Action */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="size-5 text-primary shrink-0" />
            <h3 className="text-xl font-bold tracking-tight">{tr("Website Content CMS", "إدارة وتخصيص نصوص الموقع")}</h3>
            <Badge variant="outline" className="badge-nowrap text-xs gap-1 font-mono shrink-0">
              <TypeIcon className="size-3 shrink-0" />
              <span>Bilingual</span>
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {tr(
              "Manage public-facing text, headlines, social links, and call-to-actions across English and Arabic locales.",
              "تعديل وتخصيص كافة النصوص العامة، والعناوين الرئيسية، وروابط التواصل الاجتماعي باللغتين العربية والإنجليزية."
            )}
          </p>
        </div>

        <Button
          onClick={() => onSaveContent()}
          disabled={saving}
          className="btn-nowrap gap-2 font-bold text-xs shrink-0 w-full sm:w-auto min-h-[40px] sm:min-h-[36px]"
        >
          {saving ? <Loader2 className="size-4 animate-spin shrink-0" /> : <Save className="size-4 shrink-0" />}
          <span>{saving ? tr("Publishing Changes...", "جارٍ حفظ التغييرات...") : tr("Publish Site Content", "نشر محتوى الموقع")}</span>
        </Button>
      </div>

      {/* Accordion grouped content */}
      <Accordion
        type="multiple"
        defaultValue={["Hero", "About section", "Courses and CTA", "Footer & Attribution", "Community Social Links"]}
        className="space-y-3.5 sm:space-y-4"
      >
        {/* ─── 1. PHARMACORE SOCIAL & COMMUNITY CHANNELS ──────────────── */}
        <AccordionItem
          value="Community Social Links"
          className="rounded-2xl border border-primary/30 bg-card px-4 sm:px-5 shadow-xs overflow-hidden"
        >
          <AccordionTrigger className="hover:no-underline py-3.5 sm:py-4">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Share2 className="size-4" />
              </span>
              <div className="text-start">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm sm:text-base leading-none">
                    {tr("PharmaCore Community & Social Channels", "قنوات المجتمع وروابط التواصل الاجتماعي")}
                  </h4>
                  <Badge variant="secondary" className="badge-nowrap text-xs font-mono shrink-0">
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

          <AccordionContent className="pt-2 pb-5 sm:pb-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <p className="text-xs text-muted-foreground">
                {tr(
                  "Configure platform, bilingual context text (e.g. 'Official Channel', 'Study Group', 'Page'), and URL.",
                  "اختر المنصة واكتب النص التوضيحي بالعربية والإنجليزية (مثال: 'القناة الرسمية'، 'مجموعة النقاش'، 'الصفحة')."
                )}
              </p>

              <Button
                type="button"
                size="sm"
                onClick={addSocialLink}
                className="btn-nowrap gap-1.5 font-bold text-xs shrink-0 min-h-[36px]"
              >
                <Plus className="size-3.5 shrink-0" />
                <span>{tr("Add Social Channel", "إضافة قناة تواصل")}</span>
              </Button>
            </div>

            <div className="space-y-3">
              {socialLinks.map((link, idx) => {
                return (
                  <div
                    key={link.id}
                    className="rounded-xl border bg-muted/15 p-3.5 sm:p-4 space-y-3 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs">
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
                        className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeSocialLink(link.id)}
                        title={tr("Delete link", "حذف الرابط")}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
                      {/* Platform Select */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">{tr("Platform", "المنصة")}</Label>
                        <Select
                          value={link.platform}
                          onValueChange={(val) => updateSocialLink(link.id, { platform: val as SocialPlatform })}
                        >
                          <SelectTrigger className="text-xs min-h-[38px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
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
                        <Label className="text-xs font-bold">English Context / Type</Label>
                        <Input
                          value={link.label_en}
                          onChange={(e) => updateSocialLink(link.id, { label_en: e.target.value })}
                          placeholder="e.g. Official Channel, Study Group, Page"
                          className="text-xs min-h-[38px]"
                        />
                      </div>

                      {/* Arabic Label / Context */}
                      <div className="space-y-1.5" dir="rtl">
                        <Label className="text-xs font-bold">التوصيف بالعربية</Label>
                        <Input
                          value={link.label_ar}
                          onChange={(e) => updateSocialLink(link.id, { label_ar: e.target.value })}
                          placeholder="مثال: القناة الرسمية، مجموعة النقاش، الصفحة"
                          className="text-xs min-h-[38px]"
                        />
                      </div>

                      {/* Target URL */}
                      <div className="space-y-1.5 sm:col-span-3">
                        <Label className="text-xs font-bold">{tr("Target Channel / Group URL", "رابط القناة أو المجموعة")}</Label>
                        <div className="relative">
                          <LinkIcon className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="url"
                            value={link.url}
                            onChange={(e) => updateSocialLink(link.id, { url: e.target.value })}
                            placeholder="https://t.me/your_channel or https://facebook.com/groups/..."
                            className="ps-8 pe-3 text-xs min-h-[38px] font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {!socialLinks.length && (
                <div className="grid min-h-24 place-items-center rounded-xl border border-dashed p-6 text-center text-muted-foreground">
                  <div>
                    <Share2 className="mx-auto size-6 opacity-40" />
                    <p className="mt-2 text-xs font-bold">
                      {tr("No social channels added yet", "لم تتم إضافة قنوات تواصل بعد")}
                    </p>
                    <p className="mt-0.5 text-[11px]">
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
            className="rounded-2xl border bg-card px-4 sm:px-5 shadow-xs overflow-hidden"
          >
            <AccordionTrigger className="hover:no-underline py-3.5 sm:py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Layers className="size-4" />
                </span>
                <div className="text-start">
                  <h4 className="font-bold text-sm sm:text-base leading-none">{group.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {group.fields.length} {tr("fields available", "حقول قابلة للتعديل")}
                  </p>
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="pt-2 pb-5 sm:pb-6 space-y-4 sm:space-y-6">
              {group.fields.map((field: keyof SiteLocaleContent) => {
                const multiline = /body|description|subtitle|tagline/.test(field)
                const isEmail = field === "footer_email"
                const enVal = siteContent.en[field] || ""
                const arVal = siteContent.ar[field] || ""

                return (
                  <div
                    key={field}
                    className="rounded-xl border bg-muted/15 p-3.5 sm:p-4 space-y-3 transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-primary">
                        {contentLabel(field)}
                      </Label>
                      <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
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
                            className="text-sm sm:text-xs leading-relaxed"
                          />
                        ) : (
                          <Input
                            type={isEmail ? "email" : "text"}
                            value={enVal}
                            onChange={(e) => updateField("en", field, e.target.value)}
                            className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]"
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
                            className="text-sm sm:text-xs leading-relaxed"
                          />
                        ) : (
                          <Input
                            type={isEmail ? "email" : "text"}
                            value={arVal}
                            onChange={(e) => updateField("ar", field, e.target.value)}
                            className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]"
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
