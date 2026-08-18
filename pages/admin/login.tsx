import type { GetServerSideProps } from "next"
import { useState } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import {
  FiArrowLeft as ArrowLeft,
  FiArrowRight as ArrowRight,
  FiGlobe as Languages,
  FiKey as KeyRound,
  FiLoader as Loader2,
  FiLock as LockKeyhole,
  FiMail as Mail,
  FiMoon as Moon,
  FiShield as ShieldCheck,
  FiSun as Sun,
  FiAlertTriangle as AlertTriangle,
  FiHome as HomeIcon,
} from "react-icons/fi"
import Layout from "@/components/Layout"
import { useTheme } from "@/components/ThemeProvider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabaseClient"
import { identifyUser, trackLocaleSwitch, trackThemeToggle } from "@/lib/analytics"

export default function AdminLoginPage() {
  const router = useRouter()
  const isAr = router.locale === "ar"
  const { theme, toggleTheme } = useTheme()
  const tr = (en: string, ar: string) => (isAr ? ar : en)
  const DirectionArrow = isAr ? ArrowLeft : ArrowRight

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const switchLocale = () => {
    const nextLocale = isAr ? "en" : "ar"
    trackLocaleSwitch({ fromLocale: router.locale || "en", toLocale: nextLocale })
    router.push({ pathname: router.pathname, query: router.query }, router.asPath, { locale: nextLocale })
  }

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark"
    trackThemeToggle({ theme: nextTheme })
    toggleTheme()
  }

  async function handleAdminSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) {
      setErrorMsg(tr("Supabase client is not configured.", "إعدادات الاتصال بقاعدة البيانات غير مهيأة."))
      return
    }

    setLoading(true)
    setErrorMsg("")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!data.user) {
        throw new Error(tr("Authentication failed.", "فشل التحقق من بيانات الدخول."))
      }

      // Check role in users table
      const { data: profile, error: profileErr } = await supabase
        .from("users")
        .select("role, full_name, status")
        .eq("id", data.user.id)
        .maybeSingle()

      if (profileErr) {
        console.warn("Could not retrieve profile:", profileErr)
      }

      // Check if suspended
      const authBannedUntil = (data.user as { banned_until?: string | null }).banned_until
      const isBanned =
        profile?.status === "suspended" ||
        (authBannedUntil && new Date(authBannedUntil).getTime() > Date.now())

      if (isBanned) {
        await supabase.auth.signOut()
        throw new Error(tr("This administrative account has been suspended.", "تم إيقاف هذا الحساب الإداري. يرجى مراجعة المسؤول."))
      }

      // Check role: must be staff / mentor / super_admin / dev
      const role = profile?.role || data.user.user_metadata?.role
      if (role === "student") {
        await supabase.auth.signOut()
        throw new Error(
          tr(
            "Access Restricted: This portal is reserved for academic staff and platform administrators. Students must log in via the student portal at /login.",
            "وصول مقيد: هذه البوابة مخصصة لأعضاء هيئة التدريس وإدارة المنصة فقط. بالنسبة للطلاب، يرجى استخدام بوابة الطلاب في صفحة تسجيل الدخول."
          )
        )
      }

      if (!["dev", "super_admin", "mentor"].includes(role)) {
        await supabase.auth.signOut()
        throw new Error(
          tr(
            "You do not have administrative privileges to access this area.",
            "ليس لديك صلاحيات إدارية للوصول إلى لوحة التحكم."
          )
        )
      }

      // Identify session
      identifyUser(data.user.id, {
        email: data.user.email || "",
        fullName: profile?.full_name || data.user.user_metadata?.full_name || "Admin User",
        role,
      })

      router.replace("/admin")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : tr("Sign in failed.", "تعذر تسجيل الدخول."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title={`${tr("Staff & Administration Portal", "بوابة الإدارة وهيئة التدريس")} — PharmaCore`}>
      {/* Top Utility Strip */}
      <div className="border-b bg-muted/20">
        <div className="page-shell flex items-center justify-between py-2.5">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
            <HomeIcon className="size-3.5 text-primary" />
            <span>{tr("PharmaCore Home", "الرئيسية")}</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={switchLocale}
              className="h-8 px-2 text-xs font-bold gap-1"
            >
              <Languages className="size-3.5" />
              <span>{isAr ? "English" : "العربية"}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleTheme}
              className="size-8"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="size-3.5 text-amber-500" /> : <Moon className="size-3.5 text-primary" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="page-shell flex min-h-[calc(100vh-120px)] items-center justify-center py-10 sm:py-16">
        <div className="w-full max-w-md space-y-6">
          {/* Header Card / Branding */}
          <div className="text-center space-y-2">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-sm shadow-primary/5">
              <ShieldCheck className="size-7" />
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-[11px] font-bold text-primary">
              <LockKeyhole className="size-3" />
              <span>{tr("Secure Staff Gateway", "بوابة وصول الإدارة والأساتذة")}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {tr("Staff & Administration Sign In", "تسجيل دخول الكادر التدريسي والإدارة")}
            </h1>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {tr(
                "Access course management, curriculum tools, student enrollment, and platform analytics.",
                "إدارة المقررات الدراسية، متابعة الطلاب، واعتماد التسجيل، والتحليلات التعليمية."
              )}
            </p>
          </div>

          {/* Login Form Card */}
          <Card className="border-primary/20 shadow-xl shadow-primary/5">
            <CardContent className="p-6 sm:p-8 space-y-5">
              {errorMsg && (
                <Alert variant="destructive" className="animate-in fade-in">
                  <AlertTriangle className="size-4" />
                  <AlertTitle className="text-xs font-bold">{tr("Authentication Error", "خطأ في تسجيل الدخول")}</AlertTitle>
                  <AlertDescription className="text-xs leading-relaxed mt-1">
                    {errorMsg}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleAdminSignIn} className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-email" className="text-xs font-bold">
                    {tr("Staff Email Address", "البريد الإلكتروني المهني")}
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="admin-email"
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@pharmacore.com"
                      className="ps-9 h-10 text-sm bg-background"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="admin-password" className="text-xs font-bold">
                      {tr("Password", "كلمة المرور")}
                    </Label>
                  </div>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="admin-password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="ps-9 h-10 text-sm bg-background"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-xs font-bold gap-2 shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>{tr("Verifying Credentials...", "جارٍ التحقق من الصلاحيات...")}</span>
                    </>
                  ) : (
                    <>
                      <span>{tr("Sign In to Admin Hub", "الدخول للوحة التحكم")}</span>
                      <DirectionArrow className="size-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="pt-3 border-t text-center">
                <Link
                  href="/login"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors font-semibold"
                >
                  {tr("Looking for Student Login instead?", "هل تبحث عن تسجيل دخول الطلاب؟")}
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Security footnote */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground/80 text-center">
            <ShieldCheck className="size-3.5 text-primary shrink-0" />
            <span>{tr("Protected by end-to-end role authorization & audit telemetry.", "محمي بنظام تشفير الصلاحيات ومراقبة العمليات الإدارية.")}</span>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "en", ["common"])),
    },
  }
}
