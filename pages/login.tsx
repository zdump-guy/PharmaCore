import type { GetServerSideProps } from "next"
import { useState } from "react"
import { useRouter } from "next/router"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import { ArrowRight, CheckCircle2, KeyRound, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react"
import Layout from "@/components/Layout"
import BrandMark from "@/components/BrandMark"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"

export default function LoginPage() {
  const router = useRouter()
  const isAr = router.locale === "ar"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const copy = isAr ? { eyebrow: "منطقة الإدارة الآمنة", title: "أدر المحتوى من مكان واحد.", body: "وصول مخصص للمطور والمشرفين والمرشدين، مع صلاحيات واضحة لكل دور.", point1: "إدارة المقررات والمحاضرات", point2: "إنشاء الاختبارات والموارد", point3: "متابعة أسئلة الطلاب والرد عليها", login: "تسجيل دخول المشرف", helper: "استخدم حسابك الإداري للوصول إلى لوحة التحكم.", email: "البريد الإلكتروني", password: "كلمة المرور", submit: "تسجيل الدخول", submitting: "جارٍ التحقق...", error: "تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.", secure: "اتصال آمن ومحمي" } : { eyebrow: "Secure admin area", title: "Manage every learning touchpoint.", body: "Purpose-built access for developers, admins, and mentors, with clear permissions for every role.", point1: "Manage courses and lectures", point2: "Build quizzes and resources", point3: "Review and answer student questions", login: "Admin sign in", helper: "Use your staff account to access the dashboard.", email: "Email address", password: "Password", submit: "Sign in", submitting: "Verifying...", error: "Could not sign in. Check your details and try again.", secure: "Secure, protected connection" }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setStatus("submitting")
    if (!isSupabaseConfigured) { await router.push("/admin"); return }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      console.error('Login error:', error);
      setStatus("error")
      setErrorMsg(error.message);
    }
    else router.replace("/admin")
  }

  return (
    <Layout title={`${copy.login} — PharmaCore`} description={copy.helper}>
      <div className="page-shell grid min-h-[calc(100vh-5rem)] items-center gap-10 py-12 lg:grid-cols-2 lg:gap-20">
        <section className="hidden lg:block">
          <span className="eyebrow"><ShieldCheck className="size-3.5" />{copy.eyebrow}</span>
          <h2 className="mt-6 max-w-xl text-5xl font-extrabold leading-tight">{copy.title}</h2>
          <p className="body-lead mt-5">{copy.body}</p>
          <div className="mt-8 space-y-4">
            {[copy.point1, copy.point2, copy.point3].map((point) => <div key={point} className="flex items-center gap-3 font-medium"><span className="grid size-8 place-items-center rounded-full bg-secondary text-primary"><CheckCircle2 className="size-4" /></span>{point}</div>)}
          </div>
        </section>

        <Card className="mx-auto w-full max-w-md border-primary/20 shadow-none">
          <CardContent className="p-6 sm:p-9">
            <div className="mb-8"><BrandMark className="size-12" /><h1 className="mt-5 text-3xl font-extrabold lg:text-2xl">{copy.login}</h1><p className="mt-2 text-sm text-muted-foreground">{copy.helper}</p></div>
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2"><Label htmlFor="login-email">{copy.email}</Label><div className="relative"><Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="ps-10" placeholder="admin@pharmacore.com" required /></div></div>
              <div className="space-y-2"><Label htmlFor="login-password">{copy.password}</Label><div className="relative"><KeyRound className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="ps-10" placeholder="••••••••" required /></div></div>
              {status === "error" && <Alert variant="destructive" role="alert"><AlertDescription>{errorMsg || copy.error}</AlertDescription></Alert>}
              <Button type="submit" size="lg" className="w-full" disabled={status === "submitting"}>{status === "submitting" ? <Loader2 className="animate-spin" /> : <LockKeyhole />}{status === "submitting" ? copy.submitting : copy.submit}<ArrowRight className="rtl:rotate-180" /></Button>
              <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-3.5" />{copy.secure}</p>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({ props: { ...(await serverSideTranslations(locale ?? "en", ["common"])) } })
