import type { AppProps } from "next/app"
import { appWithTranslation } from "next-i18next"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ThemeProvider } from "@/components/ThemeProvider"
import { SiteContentProvider, useSiteContent } from "@/components/SiteContentProvider"
import MaintenanceScreen from "@/components/MaintenanceScreen"
import { inter, tajawal } from "@/lib/fonts"
import { initAnalytics, trackPageView } from "@/lib/analytics"
import { supabase } from "@/lib/supabaseClient"
import "@/styles/globals.css"

function AppContent({ Component, pageProps }: { Component: AppProps["Component"]; pageProps: AppProps["pageProps"] }) {
  const router = useRouter()
  const siteContent = useSiteContent()
  const [isStaffUser, setIsStaffUser] = useState(false)

  useEffect(() => {
    if (!supabase) return

    async function checkAuth() {
      try {
        const {
          data: { session },
        } = await supabase!.auth.getSession()
        if (session?.user) {
          const userMetaRole = session.user.user_metadata?.role
          if (userMetaRole && ["dev", "super_admin", "mentor"].includes(userMetaRole)) {
            setIsStaffUser(true)
          }
          const { data: profile, error } = await supabase!
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .maybeSingle()
          if (!error && profile && ["dev", "super_admin", "mentor"].includes(profile.role)) {
            setIsStaffUser(true)
          }
        }
      } catch {
        // Continue
      }
    }

    checkAuth()
  }, [])

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

  return (
    <div className={`${inter.variable} ${tajawal.variable} font-sans`}>
      <ThemeProvider>
        <SiteContentProvider initialContent={pageProps.siteContent}>
          <AppContent Component={Component} pageProps={pageProps} />
        </SiteContentProvider>
      </ThemeProvider>
      <Analytics />
      <SpeedInsights />
    </div>
  )
}

export default appWithTranslation(App)
