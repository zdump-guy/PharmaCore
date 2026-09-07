import type { AppProps } from "next/app"
import { appWithTranslation } from "next-i18next/pages"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ThemeProvider } from "@/components/ThemeProvider"
import { SiteContentProvider, useSiteContent } from "@/components/SiteContentProvider"
import MaintenanceScreen from "@/components/MaintenanceScreen"
import ErrorBoundary from "@/components/ErrorBoundary"
import { inter, tajawal } from "@/lib/fonts"
import { initAnalytics, trackPageView } from "@/lib/analytics"
import { AuthProvider, useAuth } from "@/components/AuthProvider"
import "@/styles/globals.css"

function AppContent({ Component, pageProps }: { Component: AppProps["Component"]; pageProps: AppProps["pageProps"] }) {
  const router = useRouter()
  const siteContent = useSiteContent()
  const { isStaff: isStaffUser } = useAuth()

  const path = router.pathname || ""
  const asPath = router.asPath || ""
  const isMaintenanceActive = Boolean(siteContent?.maintenance_mode?.enabled)
  const isAdminRoute =
    path === "/admin" ||
    path.startsWith("/admin/") ||
    asPath === "/admin" ||
    asPath.startsWith("/admin/") ||
    asPath.startsWith("/ar/admin")

  // If maintenance is active, non-admin route, non-staff user: render Maintenance screen
  if (isMaintenanceActive && !isAdminRoute && !isStaffUser) {
    return <MaintenanceScreen config={siteContent.maintenance_mode} />
  }

  return <Component {...pageProps} />
}

function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const { locale } = router

  useEffect(() => {
    initAnalytics()
    trackPageView(router.asPath)

    const handleRouteChange = (url: string) => {
      trackPageView(url)
    }

    router.events.on("routeChangeComplete", handleRouteChange)
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange)
    }
  }, [router])

  useEffect(() => {
    const isArabic = locale === "ar"
    document.documentElement.lang = isArabic ? "ar" : "en"
    document.documentElement.dir = isArabic ? "rtl" : "ltr"
  }, [locale])

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerSW = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then(() => {
            // Service Worker registered
          })
          .catch((err) => {
            console.warn("[SW] Registration failed:", err)
          })
      }

      if (document.readyState === "complete") {
        registerSW()
      } else {
        window.addEventListener("load", registerSW, { once: true })
      }
    }
  }, [])

  return (
    <div className={`${inter.variable} ${tajawal.variable} font-sans`}>
      <ThemeProvider>
        <AuthProvider>
          <SiteContentProvider initialContent={pageProps.siteContent}>
            <ErrorBoundary>
              <AppContent Component={Component} pageProps={pageProps} />
            </ErrorBoundary>
          </SiteContentProvider>
        </AuthProvider>
      </ThemeProvider>
      <Analytics />
      <SpeedInsights />
    </div>
  )
}

export default appWithTranslation(App)
