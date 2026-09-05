import type { GetStaticProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations"
import { FiAlertOctagon as AlertOctagon, FiHome as Home, FiRefreshCw as RefreshCw } from "react-icons/fi"
import Layout from "@/components/Layout"
import BrandMark from "@/components/BrandMark"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { loadSiteContent } from "@/lib/siteContent"

export default function Custom500() {
  const router = useRouter()
  const { locale } = router
  const isAr = locale === "ar"

  const title = isAr
    ? "خطأ في الخادم - 500 | فارماكور"
    : "Server Error - 500 | PharmaCore"
  const description = isAr
    ? "عذراً، حدث خطأ غير متوقع أثناء معالجة الطلب على الخادم."
    : "An unexpected server error occurred while processing your request."

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  return (
    <Layout title={title} description={description} noindex={true}>
      <div
        className="flex min-h-[calc(100vh-14rem)] w-full items-center justify-center px-4 py-12 sm:px-6 lg:py-20"
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="flex w-full max-w-2xl flex-col items-center text-center">
          {/* Brand Mark with destructive warning indicator */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="absolute -inset-4 rounded-full bg-destructive/10 blur-xl dark:bg-destructive/20" />
            <div className="relative flex items-center justify-center rounded-3xl border border-destructive/30 bg-card p-4 shadow-lg">
              <BrandMark className="size-16 sm:size-20" />
            </div>
          </div>

          {/* Status Badge */}
          <Badge
            variant="destructive"
            className="mb-4 gap-1.5 px-3.5 py-1 text-xs sm:text-sm font-semibold tracking-wider uppercase bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/15"
          >
            <AlertOctagon className="size-3.5" />
            <span>{isAr ? "خطأ 500 • خطأ داخلي في الخادم" : "500 Error • Internal Server Error"}</span>
          </Badge>

          {/* Large Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground">
            {isAr ? "حدث خطأ غير متوقع في الخادم" : "Internal Server Error"}
          </h1>

          {/* Subtitle / Description */}
          <p className="mt-4 max-w-lg text-base sm:text-lg text-muted-foreground leading-relaxed">
            {isAr
              ? "واجهت خوادمنا صعوبة غير متوقعة أثناء معالجة طلبك. تم تسجيل تفاصيل الخطأ لفريق التطوير. يرجى تجربة إعادة المحاولة الآن أو العودة لاحقاً."
              : "Our clinical education servers encountered an unexpected condition while processing your request. Please try reloading the page, or return to the homepage."}
          </p>

          {/* Action CTAs (WCAG 2.5.5 Touch Targets >= 44px) */}
          <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button
              onClick={handleReload}
              size="lg"
              className="min-h-[48px] h-12 w-full sm:w-auto px-8 rounded-xl font-bold gap-2 text-base shadow-md shadow-primary/20"
            >
              <RefreshCw className="size-4" />
              <span>{isAr ? "إعادة تحميل الصفحة" : "Reload Page"}</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="min-h-[48px] h-12 w-full sm:w-auto px-8 rounded-xl font-bold gap-2 text-base border-primary/30 bg-card hover:bg-muted"
              asChild
            >
              <Link href="/">
                <Home className="size-4 text-primary" />
                <span>{isAr ? "العودة للرئيسية" : "Return to Home"}</span>
              </Link>
            </Button>
          </div>

          {/* Quick Helpful Context */}
          <div className="mt-12 pt-6 border-t border-border/60 w-full max-w-md text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              {isAr ? "استمرت المشكلة في الظهور؟" : "Does the issue persist?"}
            </span>
            <a
              href="mailto:mohamed_mostafa.uiux@outlook.com"
              className="font-semibold text-primary underline-offset-4 hover:underline min-h-[44px] inline-flex items-center"
            >
              {isAr ? "الإبلاغ عن خلل فني" : "Report Technical Issue"}
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
