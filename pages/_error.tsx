import type { NextPageContext } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { FiAlertTriangle as AlertTriangle, FiHome as Home, FiRefreshCw as RefreshCw } from "react-icons/fi"
import Layout from "@/components/Layout"
import BrandMark from "@/components/BrandMark"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ErrorProps {
  statusCode?: number
}

export default function CustomError({ statusCode }: ErrorProps) {
  const router = useRouter()
  const { locale } = router
  const isAr = locale === "ar"

  const code = statusCode || 500
  const title = isAr
    ? `خطأ ${code} | فارماكور`
    : `Error ${code} | PharmaCore`

  const getErrorMessage = () => {
    if (code === 404) {
      return {
        badge: isAr ? "خطأ 404 • الصفحة غير موجودة" : "404 Error • Page Not Found",
        headline: isAr ? "عذراً، الصفحة غير موجودة" : "Page Not Found",
        description: isAr
          ? "لم يتم العثور على الصفحة المطلوبة على هذا الخادم. ربما نُقلت أو حُذفت."
          : "The requested page could not be found on the server. It may have been moved or deleted.",
      }
    }
    if (code === 500) {
      return {
        badge: isAr ? "خطأ 500 • خطأ داخلي في الخادم" : "500 Error • Internal Server Error",
        headline: isAr ? "حدث خطأ داخلي في الخادم" : "Internal Server Error",
        description: isAr
          ? "واجه الخادم مشكلة غير متوقعة أثناء معالجة الطلب. يرجى إعادة المحاولة."
          : "The server encountered an unexpected error while processing your request. Please try again.",
      }
    }
    return {
      badge: isAr ? `خطأ ${code}` : `Error ${code}`,
      headline: isAr ? `حدث خطأ رقم ${code}` : `An Error ${code} Occurred`,
      description: isAr
        ? `تعذر استكمال العملية بسبب خطأ في الاستجابة (${code}). يرجى إعادة المحاولة.`
        : `Unable to complete your request due to an unexpected error (${code}). Please try again.`,
    }
  }

  const { badge, headline, description } = getErrorMessage()

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
          {/* Brand Mark with warning container */}
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
            <AlertTriangle className="size-3.5" />
            <span>{badge}</span>
          </Badge>

          {/* Large Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground">
            {headline}
          </h1>

          {/* Subtitle / Description */}
          <p className="mt-4 max-w-lg text-base sm:text-lg text-muted-foreground leading-relaxed">
            {description}
          </p>

          {/* Action CTAs (WCAG 2.5.5 Touch Targets >= 44px) */}
          <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button
              onClick={handleReload}
              size="lg"
              className="min-h-[48px] h-12 w-full sm:w-auto px-8 rounded-xl font-bold gap-2 text-base shadow-md shadow-primary/20"
            >
              <RefreshCw className="size-4" />
              <span>{isAr ? "إعادة المحاولة" : "Try Again"}</span>
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

          {/* Assistance link */}
          <div className="mt-12 pt-6 border-t border-border/60 w-full max-w-md text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              {isAr ? "تحتاج للمساعدة الفنية؟" : "Need technical assistance?"}
            </span>
            <a
              href="mailto:mohamed_mostafa.uiux@outlook.com"
              className="font-semibold text-primary underline-offset-4 hover:underline min-h-[44px] inline-flex items-center"
            >
              {isAr ? "تواصل مع الدعم" : "Contact Support"}
            </a>
          </div>
        </div>
      </div>
    </Layout>
  )
}

CustomError.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}
