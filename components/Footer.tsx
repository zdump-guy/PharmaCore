import Link from "next/link"
import { Mail, ShieldCheck } from "lucide-react"
import { useRouter } from "next/router"
import { useTranslation } from 'next-i18next'
import BrandMark from "@/components/BrandMark"

const socialLinks = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/mohamed-mostafa-uiux', icon: '🔗' },
  { label: 'Portfolio', href: 'https://mohamed-mostafa-uiux.vercel.app', icon: '🌐' },
  { label: 'GitHub', href: 'https://github.com/zdump-guy', icon: '💻' },
];

export default function Footer() {
  const { locale } = useRouter()
  const { t } = useTranslation('common')
  const isAr = locale === "ar"
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-card" role="contentinfo">
      <div className="page-shell py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex min-h-11 items-center gap-3"><BrandMark /><span className="text-lg font-extrabold">PharmaCore</span></Link>
            <p className="mt-4 text-sm text-muted-foreground">{isAr ? "تعليم صيدلي واضح، موثوق، ومتاح للجميع — من المفهوم الأول حتى الممارسة السريرية." : "Clear, trustworthy pharmacy education — from first principles to clinical practice."}</p>
            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-primary"><ShieldCheck className="size-4" />{isAr ? "محتوى تعليمي بإشراف متخصصين" : "Educator-reviewed learning"}</div>
          </div>
          <div>
            <h2 className="text-sm font-bold">{isAr ? "فريق المنصة" : "Platform team"}</h2>
            <p className="mt-4 text-sm font-semibold">Ghost (Mohamed Mostafa)</p>
            <p className="mt-1 text-sm text-muted-foreground">UI/UX & Web Developer</p>
            <a href="mailto:hello@pharmacore.education" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline"><Mail className="size-4" /> hello@pharmacore.education</a>
          </div>
          <div>
            <h2 className="text-sm font-bold">{t('footer.devTitle', 'Developer & Maintainer')}</h2>
            <div className="mt-5 flex flex-wrap gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary text-xs font-medium"
                  >
                    <span>{link.icon}</span> {link.label}
                  </a>
                ))}
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} PharmaCore. {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}</p>
          <p>{isAr ? "صُمّم وبُني بعناية للتعلّم." : "Designed and built for focused learning."}</p>
        </div>
      </div>
    </footer>
  )
}
