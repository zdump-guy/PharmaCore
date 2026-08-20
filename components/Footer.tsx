import Link from "next/link"
import { useRouter } from "next/router"
import {
  FiGlobe as Globe,
  FiMail as Mail,
  FiShield as ShieldCheck,
  FiArrowUpRight as ArrowUpRight,
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
import BrandMark from "@/components/BrandMark"
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
    <footer className="border-t border-border/80 bg-card/60 backdrop-blur-xl" role="contentinfo" dir={isAr ? "rtl" : "ltr"}>
      <div className="page-shell py-14 lg:py-18">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {/* ─── 1. PHARMACORE PLATFORM BRAND ────────────────────────────── */}
          <div className="space-y-4 lg:col-span-2 max-w-md">
            <Link href="/" className="inline-flex items-center gap-2.5 rounded-xl group focus-visible:ring-2">
              <BrandMark className="size-9 transition-transform group-hover:rotate-6" />
              <div>
                <span className="text-xl font-black tracking-tight block">
                  Pharma<span className="text-primary">Core</span>
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block -mt-1">
                  Clinical Education
                </span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {copy.footer_description}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
              <ShieldCheck className="size-4 shrink-0" />
              <span>{copy.footer_reviewed}</span>
            </div>
          </div>

          {/* ─── 2. COMMUNITY & SOCIAL CHANNELS ─────────────────────────── */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wider text-xs">
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
                        className="inline-flex items-center gap-2.5 text-xs text-muted-foreground hover:text-primary transition-colors group max-w-full"
                      >
                        <div className="size-6 grid place-items-center rounded-lg bg-secondary/80 text-foreground/80 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                          <Icon className="size-3.5" aria-hidden="true" />
                        </div>
                        <span className="font-semibold text-foreground/90 group-hover:text-primary whitespace-nowrap">{platformName}</span>
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
          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wider text-xs">
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
                  className="inline-flex items-center gap-2.5 text-xs text-muted-foreground hover:text-primary transition-colors group max-w-full"
                >
                  <Mail className="size-3.5 text-primary shrink-0" />
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
                    className="inline-flex items-center gap-2.5 text-xs text-muted-foreground hover:text-primary transition-colors group"
                  >
                    <Icon className="size-3.5 text-foreground/60 group-hover:text-primary transition-colors shrink-0" aria-hidden="true" />
                    <span className="font-medium group-hover:underline underline-offset-4 whitespace-nowrap">{label}</span>
                    <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ─── BOTTOM COPYRIGHT LINE ──────────────────────────────────────── */}
        <div className="mt-12 flex flex-col gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} PharmaCore. {copy.footer_rights}</p>
          <p className="font-medium">{copy.footer_tagline}</p>
        </div>
      </div>
    </footer>
  )
}
