import Link from "next/link"
import { FiGlobe, FiMail as Mail, FiShield as ShieldCheck } from "react-icons/fi"
import { FaGithub, FaLinkedinIn } from "react-icons/fa6"
import { useRouter } from "next/router"
import BrandMark from "@/components/BrandMark"
import { useSiteContent } from "@/components/SiteContentProvider"

const socialLinks = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/mohamed-mostafa-uiux', Icon: FaLinkedinIn },
  { label: 'Portfolio', href: 'https://mohamed-mostafa-uiux.vercel.app', Icon: FiGlobe },
  { label: 'GitHub', href: 'https://github.com/zdump-guy', Icon: FaGithub },
];

export default function Footer() {
  const { locale } = useRouter()
  const siteContent = useSiteContent()
  const isAr = locale === "ar"
  const year = new Date().getFullYear()
  const copy = siteContent[isAr ? "ar" : "en"]

  return (
    <footer className="border-t bg-card" role="contentinfo">
      <div className="page-shell py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex min-h-11 items-center gap-3"><BrandMark /><span className="text-lg font-extrabold">PharmaCore</span></Link>
            <p className="mt-4 text-sm text-muted-foreground">{copy.footer_description}</p>
            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-primary"><ShieldCheck className="size-4" />{copy.footer_reviewed}</div>
          </div>
          <div className="lg:justify-self-end lg:min-w-[420px]">
            <h2 className="text-sm font-bold">{copy.footer_links_title}</h2>
            <p className="mt-4 text-sm font-semibold">{copy.footer_team_name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{copy.footer_team_role}</p>
            <a href={`mailto:${copy.footer_email}`} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline"><Mail className="size-4" />{copy.footer_email}</a>
            <div className="mt-5 flex flex-wrap gap-2">
                {socialLinks.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex min-h-11 items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Icon className="size-3.5" aria-hidden="true" />{label}
                  </a>
                ))}
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} PharmaCore. {copy.footer_rights}</p>
          <p>{copy.footer_tagline}</p>
        </div>
      </div>
    </footer>
  )
}
