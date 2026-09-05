import React, { Component, type ErrorInfo, type ReactNode } from "react"
import BrandMark from "@/components/BrandMark"
import { Button } from "@/components/ui/button"
import { FiAlertTriangle as AlertTriangle, FiRefreshCw as RefreshCw, FiHome as Home } from "react-icons/fi"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode | ((error: Error | null, reset: () => void) => ReactNode)
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    // Log error to console for diagnosis and telemetry
    if (typeof console !== "undefined" && console.error) {
      console.error("[ErrorBoundary] Uncaught application error:", error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (!hasError) {
      return children
    }

    if (fallback) {
      if (typeof fallback === "function") {
        return fallback(error, this.handleReset)
      }
      return fallback
    }

    const isAr =
      typeof document !== "undefined" &&
      (document.documentElement.lang === "ar" || document.documentElement.dir === "rtl")

    return (
      <div
        className="flex min-h-[70vh] w-full items-center justify-center p-4 sm:p-6"
        dir={isAr ? "rtl" : "ltr"}
        role="alert"
      >
        <div className="flex w-full max-w-xl flex-col items-center space-y-6 rounded-3xl border bg-card/95 p-6 sm:p-8 text-center shadow-2xl backdrop-blur-xl">
          {/* Header Brand & Icon */}
          <div className="relative flex items-center justify-center">
            <BrandMark className="size-14" />
            <span className="absolute -bottom-1 -end-1 grid size-6 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-sm">
              <AlertTriangle className="size-3.5" />
            </span>
          </div>

          {/* Bilingual Alert Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
            <span>{isAr ? "خطأ غير متوقع في التطبيق" : "Unexpected Application Error"}</span>
          </div>

          {/* Titles & Explanations */}
          <div className="space-y-2 max-w-md">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {isAr ? "عذراً، حدث خطأ غير متوقع" : "Something Went Wrong"}
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
              {isAr
                ? "واجه التطبيق مشكلة تقنية أثناء معالجة طلبك. يمكنك إعادة محاولة تحميل الصفحة أو العودة للصفحة الرئيسية للمتابعة."
                : "The application encountered an unexpected runtime issue. You can try refreshing the page or returning to the homepage to continue."}
            </p>
          </div>

          {/* Technical Diagnostics (Shown in Development or if error is present) */}
          {error && process.env.NODE_ENV !== "production" && (
            <details className="w-full rounded-xl border bg-muted/40 p-3 text-start text-xs font-mono text-muted-foreground">
              <summary className="cursor-pointer font-bold select-none hover:text-foreground">
                {isAr ? "التفاصيل التقنية للخطأ (بيئة التطوير)" : "Technical Error Details (Development)"}
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-md bg-background/80 p-2 text-[11px] text-destructive">
                {error.name}: {error.message}
                {error.stack ? `\n\n${error.stack}` : ""}
              </pre>
            </details>
          )}

          {/* Action Buttons (WCAG 2.5.5 touch target >= 44px) */}
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center pt-2">
            <Button
              onClick={this.handleReload}
              size="lg"
              className="min-h-[44px] h-11 w-full sm:w-auto px-6 rounded-xl font-bold gap-2 shadow-sm"
            >
              <RefreshCw className="size-4" />
              <span>{isAr ? "إعادة المحاولة" : "Try Again"}</span>
            </Button>

            <Button
              onClick={this.handleGoHome}
              variant="outline"
              size="lg"
              className="min-h-[44px] h-11 w-full sm:w-auto px-6 rounded-xl font-bold gap-2"
            >
              <Home className="size-4" />
              <span>{isAr ? "الرئيسية" : "Home"}</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
