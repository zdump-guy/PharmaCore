import Link from "next/link"
import { useRouter } from "next/router"
import {
  FiDownload as Download,
  FiGlobe as Globe,
  FiMail as Mail,
  FiShield as ShieldCheck,
} from "react-icons/fi"
import {
  FaDiscord,
  FaFacebookF,
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaTelegram,
  FaTiktok,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6"
import BrandLogo from "@/components/BrandLogo"
import InstallAppModal from "@/components/InstallAppModal"
import { useSiteContent } from "@/components/SiteContentProvider"
import type { SocialPlatform } from "@/lib/siteContent"

const devSocialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/mohamed-mostafa-uiux", Icon: FaLinkedinIn },
  { label: "Portfolio", href: "https://mohamed-mostafa-uiux.vercel.app", Icon: Globe },
  { label: "GitHub", href: "https://github.com/zdump-guy", Icon: FaGithub },
]

export function getPlatformIcon(platform: SocialPlatform) {
  switch (platform) {
    case "telegram":
      return FaTelegram
    case "facebook":
      return FaFacebookF
    case "whatsapp":
      return FaWhatsapp
    case "youtube":
      return FaYoutube
    case "linkedin":
      return FaLinkedinIn
    case "twitter":
      return FaXTwitter
    case "instagram":
      return FaInstagram
    case "discord":
      return FaDiscord
    case "tiktok":
      return FaTiktok
    case "website":
    default:
      return Globe
  }
}

export function getPlatformName(platform: SocialPlatform): string {
  switch (platform) {
    case "telegram":
      return "Telegram"
    case "facebook":
      return "Facebook"
    case "whatsapp":
      return "WhatsApp"
    case "youtube":
      return "YouTube"
    case "linkedin":
      return "LinkedIn"
    case "twitter":
      return "X (Twitter)"
    case "instagram":
      return "Instagram"
    case "discord":
      return "Discord"
    case "tiktok":
      return "TikTok"
    case "website":
    default:
      return "Website"
  }
}

export default function Footer() {
  const { locale } = useRouter()
  const siteContent = useSiteContent()
  const isAr = locale === "ar"
  const year = new Date().getFullYear()
  const copy = siteContent[isAr ? "ar" : "en"]
  const socialLinks = siteContent.social_links || []

  return (
    <footer className="border-t bg-card" role="contentinfo" dir={isAr ? "rtl" : "ltr"}>
      <div className="page-shell py-12 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-14">
          {/* ─── 1. PHARMACORE PLATFORM ──────────────────────────────────── */}
          <div className="space-y-4 max-w-sm">
            <Link href="/" className="inline-flex items-center rounded-lg focus-visible:ring-2" aria-label="PharmaCore">
              <BrandLogo className="h-9 w-auto" priority={false} />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {copy.footer_description}
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary pt-1">
              <ShieldCheck className="size-4 shrink-0" />
              <span>{copy.footer_reviewed}</span>
            </div>
            <div className="pt-1">
              <InstallAppModal
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20 cursor-pointer min-h-[36px]"
                  >
                    <Download className="size-3.5 shrink-0" />
                    <span>{isAr ? "تثبيت تطبيق سطح المكتب" : "Install Desktop App"}</span>
                  </button>
                }
              />
            </div>
          </div>

          {/* ─── 2. COMMUNITY & SOCIAL CHANNELS (MIDDLE) ─────────────────── */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              {copy.footer_social_title}
            </h3>

            {socialLinks.length > 0 ? (
              <ul className="space-y-2.5">
                {socialLinks.map((link) => {
                  const label = isAr ? link.label_ar : link.label_en
                  const Icon = getPlatformIcon(link.platform)
                  const platformName = getPlatformName(link.platform)

                  return (
                    <li key={link.id}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center min-h-[44px] py-1.5 gap-2.5 text-xs text-muted-foreground hover:text-primary transition-colors group max-w-full"
                      >
                        <Icon className="size-3.5 text-foreground/70 group-hover:text-primary transition-colors shrink-0" aria-hidden="true" />
                        <span className="font-medium group-hover:underline underline-offset-4 text-foreground whitespace-nowrap">{platformName}</span>
                        {label && (
                          <span className="text-[11px] text-muted-foreground truncate">
                            — {label}
                          </span>
                        )}
                      </a>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                {isAr ? "لا توجد قنوات تواصل مضافة." : "No social channels added."}
              </p>
            )}
          </div>

          {/* ─── 3. DEVELOPER & MAINTAINER ────────────────────────────────── */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1 lg:justify-self-end lg:max-w-xs w-full">
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              {copy.footer_links_title}
            </h3>

            <div>
              <p className="text-sm font-bold text-foreground">{copy.footer_team_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{copy.footer_team_role}</p>
            </div>

            <ul className="space-y-2.5">
              <li>
                <a
                  href={`mailto:${copy.footer_email}`}
                  className="inline-flex items-center min-h-[44px] py-1.5 gap-2.5 text-xs text-muted-foreground hover:text-primary transition-colors group max-w-full"
                >
                  <Mail className="size-3.5 text-foreground/70 group-hover:text-primary transition-colors shrink-0" />
                  <span className="font-medium group-hover:underline underline-offset-4 truncate">{copy.footer_email}</span>
                </a>
              </li>

              {devSocialLinks.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex items-center min-h-[44px] py-1.5 gap-2.5 text-xs text-muted-foreground hover:text-primary transition-colors group"
                  >
                    <Icon className="size-3.5 text-foreground/70 group-hover:text-primary transition-colors shrink-0" aria-hidden="true" />
                    <span className="font-medium group-hover:underline underline-offset-4 whitespace-nowrap">{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ─── BOTTOM COPYRIGHT LINE ──────────────────────────────────────── */}
        <div className="mt-12 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} PharmaCore. {copy.footer_rights}</p>
          <p>{copy.footer_tagline}</p>
        </div>
      </div>
    </footer>
  )
}
