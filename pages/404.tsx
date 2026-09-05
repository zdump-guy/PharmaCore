import type { GetStaticProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations"
import { FiCompass as Compass, FiHome as Home, FiSearch as Search } from "react-icons/fi"
import Layout from "@/components/Layout"
import BrandMark from "@/components/BrandMark"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { loadSiteContent } from "@/lib/siteContent"

export default function Custom404() {
  const router = useRouter()
  const { locale } = router
  const isAr = locale === "ar"

  const title = isAr
    ? "الصفحة غير موجودة - 404 | فارماكور"
    : "Page Not Found - 404 | PharmaCore"
  const description = isAr
    ? "عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها."
    : "The page you are looking for does not exist or has been moved."

  return (
    <Layout title={title} description={description} noindex={true}>
      <div
        className="flex min-h-[calc(100vh-14rem)] w-full items-center justify-center px-4 py-12 sm:px-6 lg:py-20"
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="flex w-full max-w-2xl flex-col items-center text-center">
          {/* Brand Mark with decorative glow */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="absolute -inset-4 rounded-full bg-primary/10 blur-xl dark:bg-primary/20" />
            <div className="relative flex items-center justify-center rounded-3xl border bg-card p-4 shadow-lg">
              <BrandMark className="size-16 sm:size-20" />
            </div>
          </div>

          {/* Status Badge */}
          <Badge
            variant="secondary"
            className="mb-4 gap-1.5 px-3.5 py-1 text-xs sm:text-sm font-semibold tracking-wider uppercase border-primary/20 text-primary bg-primary/10"
          >
            <Compass className="size-3.5" />
            <span>{isAr ? "خطأ 404 • الصفحة غير موجودة" : "404 Error • Page Not Found"}</span>
          </Badge>

          {/* Large Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground">
            {isAr ? "ضللت الطريق؟ الصفحة غير موجودة" : "Looking for Something?"}
          </h1>

          {/* Subtitle / Description */}
          <p className="mt-4 max-w-lg text-base sm:text-lg text-muted-foreground leading-relaxed">
            {isAr
              ? "الصفحة التي تحاول الوصول إليها قد تكون حُذفت، أو نُقلت، أو أن الرابط الذي اتبعته غير صحيح. يسعدنا مساعدتك في العودة لمتابعة رحلتك التعليمية."
              : "The page you requested could not be found. It may have been moved, renamed, or is temporarily unavailable. Let's get you back on track."}
          </p>

          {/* Action CTAs (WCAG 2.5.5 Touch Targets >= 44px) */}
          <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button
              size="lg"
              className="min-h-[48px] h-12 w-full sm:w-auto px-8 rounded-xl font-bold gap-2 text-base shadow-md shadow-primary/20"
              asChild
            >
              <Link href="/">
                <Home className="size-4" />
                <span>{isAr ? "العودة للرئيسية" : "Return to Home"}</span>
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="min-h-[48px] h-12 w-full sm:w-auto px-8 rounded-xl font-bold gap-2 text-base border-primary/30 bg-card hover:bg-muted"
              asChild
            >
              <Link href="/#courses">
                <Search className="size-4 text-primary" />
                <span>{isAr ? "استعراض المقررات" : "Browse Courses"}</span>
              </Link>
            </Button>
          </div>

          {/* Quick Helpful Context */}
          <div className="mt-12 pt-6 border-t border-border/60 w-full max-w-md text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              {isAr ? "تحتاج لمساعدة إضافية؟" : "Need assistance?"}
            </span>
            <a
              href="mailto:mohamed_mostafa.uiux@outlook.com"
              className="font-semibold text-primary underline-offset-4 hover:underline min-h-[44px] inline-flex items-center"
            >
              {isAr ? "تواصل مع فريق الدعم" : "Contact Support"}
            </a>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      siteContent: await loadSiteContent(),
      ...(await serverSideTranslations(locale ?? "en", ["common"]).catch(() => ({}))),
    },
  }
}
