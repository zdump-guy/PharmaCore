import type { GetServerSideProps } from "next"
import { useState, useRef } from "react"
import { useRouter } from "next/router"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import {
  FiArrowRight as ArrowRight,
  FiCheckCircle as CheckCircle2,
  FiClock as Clock,
  FiKey as KeyRound,
  FiLoader as Loader2,
  FiLock as LockKeyhole,
  FiMail as Mail,
  FiPhone as Phone,
  FiUser as User,
  FiUserPlus as UserPlus,
  FiAlertTriangle as AlertTriangle,
} from "react-icons/fi"
import { FaGraduationCap as GraduationCap } from "react-icons/fa6"
import Layout from "@/components/Layout"
import BrandMark from "@/components/BrandMark"
import StudentSetupModal from "@/components/StudentSetupModal"
import Turnstile, { type TurnstileRef } from "@/components/Turnstile"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { loadSiteContent, type SiteContent } from "@/lib/siteContent"
import { supabase } from "@/lib/supabaseClient"
import { identifyUser } from "@/lib/analytics"
import type { University, Faculty } from "@/types"

interface LoginPageProps {
  siteContent: SiteContent
}

export default function LoginPage({ siteContent }: LoginPageProps) {
  const router = useRouter()
  const isAr = router.locale === "ar"
  const returnUrl = (router.query.returnUrl as string) || ""
  const defaultTab = (router.query.tab as string) === "signup" ? "signup" : "signin"

  const [tab, setTab] = useState<"signin" | "signup">(defaultTab)

  // ─── Sign In State ────────────────────────────────────────────────────────
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [signInStatus, setSignInStatus] = useState<"idle" | "submitting" | "error" | "pending_approval">("idle")
  const [signInError, setSignInError] = useState("")
  const [signInTurnstileToken, setSignInTurnstileToken] = useState("")
  const signInTurnstileRef = useRef<TurnstileRef>(null)

  // ─── Sign Up State ────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [university, setUniversity] = useState("")
  const [faculty, setFaculty] = useState("")
  const [startYear, setStartYear] = useState<number>(new Date().getFullYear() - 1)
  const [signUpStatus, setSignUpStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [signUpMessage, setSignUpMessage] = useState("")
  const [isPendingReview, setIsPendingReview] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState("")
  const turnstileRef = useRef<TurnstileRef>(null)

  // ─── Setup Modal State (for Generic Provisioned Accounts) ──────────────────
  const [setupModalOpen, setSetupModalOpen] = useState(false)
  const [loggedUserToken, setLoggedUserToken] = useState("")
  const [loggedUserEmail, setLoggedUserEmail] = useState("")

  const enrollmentSettings = siteContent.enrollment_settings || {
    signup_mode: "approval_required",
    universities: [],
    faculties: [],
  }

  const universities: University[] = enrollmentSettings.universities || []
  const faculties: Faculty[] = enrollmentSettings.faculties || []
  const isClosedRegistration = enrollmentSettings.signup_mode === "admin_provisioned"

  // Auto-calculated graduation year
  const selectedFacultyObj = faculties.find(
    (f) => f.name_en === faculty || f.name_ar === faculty || f.id === faculty
  )
  const duration = selectedFacultyObj?.duration_years || 5
  const predictedGraduationYear = Number(startYear) + duration

  // Auto-calculated academic level
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const yearIndex = currentYear - Number(startYear) + (currentMonth >= 9 ? 1 : 0)
  let academicLevelText = isAr ? `السنة ${Math.max(1, yearIndex)}` : `Year ${Math.max(1, yearIndex)}`
  if (yearIndex >= duration) {
    academicLevelText = isAr ? "سنة التخرج (السنة الأخيرة)" : `Final Year (Year ${duration})`
  }
  if (yearIndex > duration) {
    academicLevelText = isAr ? "خريج" : "Graduate"
  }

  const copy = isAr
    ? {
        signInTab: "تسجيل الدخول",
        signUpTab: "حساب طالب جديد",
        loginTitle: "مرحبًا بك في فارماكور",
        loginSubtitle: "سجل الدخول لمتابعة المحاضرات والاختبارات وحفظ تقدمك الدراسي.",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        signInBtn: "تسجيل الدخول",
        submitting: "جارٍ التحقق...",
        signingUp: "جارٍ إنشاء الحساب...",
        configError: "يرجى تهيئة إعدادات Supabase أولًا.",
        firstName: "الاسم الأول",
        lastName: "اسم العائلة / اللقب",
        phone: "رقم الهاتف / واتساب",
        uni: "الجامعة",
        selectUni: "اختر جامعتك",
        faculty: "الكلية / البرنامج الدراسي",
        selectFaculty: "اختر كليتك",
        startYear: "سنة بدء الدراسة",
        gradYear: "التخرج المتوقع",
        academicLevel: "المستوى الدراسي",
        signUpBtn: "إنشاء حساب طالب",
        closedTitle: "التسجيل العام مغلق حاليًا",
        closedDesc:
          "التسجيل في هذه الفترة مقتصر على الحسابات المصروفة من قِبل إدارة المنصة. إذا كان لديك حساب مسجل، استخدم تبويب تسجيل الدخول.",
        approvalNoticeTitle: "طلبك قيد المراجعة والاعتماد",
        approvalNoticeDesc:
          "تم استلام طلب تسجيلك بنجاح! سيتم مراجعة بياناتك واعتماد الحساب من قِبل إدارة فارماكور قريبًا. ستتمكن من تسجيل الدخول فور اعتماد الحساب.",
        pendingError: "حسابك قيد المراجعة من قِبل الإدارة حاليًا. سيتم تفعيله قريبًا.",
        suspendedError: "تم إيقاف هذا الحساب. يرجى التواصل مع الدعم الفني.",
        featuresTitle: "تعلم سريري متكامل بلا حواجز",
        f1: "وصول كامل لجميع محاضرات الفيديو والملخصات الإكلينيكية",
        f2: "اختبارات تفاعلية فورية لقياس الاستيعاب بعد كل محاضرة",
        f3: "طرح الأسئلة والمشاركة في النقاشات مع المشرفين المعتمدين",
      }
    : {
        signInTab: "Sign In",
        signUpTab: "Create Student Account",
        loginTitle: "Welcome to PharmaCore",
        loginSubtitle: "Sign in to access lecture videos, test your knowledge, and track your clinical learning.",
        email: "Email address",
        password: "Password",
        signInBtn: "Sign In",
        submitting: "Signing in...",
        signingUp: "Creating account...",
        configError: "Please configure Supabase environment variables.",
        firstName: "First name",
        lastName: "Last name",
        phone: "Phone / WhatsApp number",
        uni: "University",
        selectUni: "Select your university",
        faculty: "Faculty / Program",
        selectFaculty: "Select your faculty",
        startYear: "Starting year",
        gradYear: "Predicted graduation",
        academicLevel: "Academic level",
        signUpBtn: "Create Student Account",
        closedTitle: "Public registration is currently closed",
        closedDesc:
          "Account creation is restricted to provisioned members. If you were issued login credentials by administration, please sign in.",
        approvalNoticeTitle: "Registration Received & Under Review",
        approvalNoticeDesc:
          "Thank you for signing up! Your registration has been received and is currently being reviewed by the administration. You will be able to log in once approved.",
        pendingError: "Your account is pending administrator approval. It will be activated shortly.",
        suspendedError: "This account has been suspended. Please contact platform support.",
        featuresTitle: "Focused Clinical Pharmacology Education",
        f1: "Full access to high-yield whiteboard lectures and clinical notes",
        f2: "Instant knowledge checkpoints testing drug mechanisms & contraindications",
        f3: "Direct lecture discussions with verified mentors and clinical peers",
      }

  // ─── Handle Sign In ────────────────────────────────────────────────────────
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setSignInStatus("submitting")
    setSignInError("")

    if (!supabase) {
      setSignInError(copy.configError)
      setSignInStatus("error")
      return
    }

    try {
      const cleanEmail = email.trim().toLowerCase()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
        options: signInTurnstileToken ? { captchaToken: signInTurnstileToken } : undefined,
      })

      if (error) {
        signInTurnstileRef.current?.reset()
        setSignInTurnstileToken("")
        let displayMsg = error.message
        if (
          error.message.includes("Invalid login credentials") ||
          error.message.includes("invalid_grant")
        ) {
          displayMsg = isAr
            ? "البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التحقق وإعادة المحاولة."
            : "Invalid email or password. Please verify your credentials."
        } else if (
          error.message.includes("captcha") ||
          error.message.includes("captcha_failed")
        ) {
          displayMsg = isAr
            ? "فشل التحقق الأمني من النشاط التلقائي. يرجى إعادة المحاولة."
            : "Security bot verification failed. Please try again."
        } else if (error.message.includes("Email not confirmed")) {
          displayMsg = isAr
            ? "البريد الإلكتروني غير مؤكد بعد. يرجى مراجعة بريدك الإلكتروني لتأكيده."
            : "Email is not confirmed yet. Please verify your email address."
        }
        setSignInStatus("error")
        setSignInError(displayMsg)
        return
      }

      if (data.user) {
        // Identify in analytics
        identifyUser(data.user.id, { email: data.user.email })

        // Check user profile for status & role
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle()

        if (profile?.status === "pending") {
          await supabase.auth.signOut()
          setSignInStatus("pending_approval")
          setSignInError(copy.pendingError)
          return
        }

        if (profile?.status === "suspended") {
          await supabase.auth.signOut()
          setSignInStatus("error")
          setSignInError(copy.suspendedError)
          return
        }

        // Check if generic account needs initial setup
        if (profile?.must_change_password || profile?.status === "needs_setup") {
          setLoggedUserToken(data.session?.access_token || "")
          setLoggedUserEmail(data.user.email || "")
          setSetupModalOpen(true)
          setSignInStatus("idle")
          return
        }

        // Role-based routing
        if (profile?.role && ["dev", "super_admin", "mentor"].includes(profile.role) && !returnUrl) {
          router.replace("/admin")
        } else {
          router.replace(returnUrl || "/#courses")
        }
      }
    } catch (err: unknown) {
      setSignInStatus("error")
      setSignInError(err instanceof Error ? err.message : "Authentication failed")
    }
  }

  // ─── Handle Sign Up ────────────────────────────────────────────────────────
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setSignUpStatus("submitting")
    setSignUpMessage("")

    try {
      const res = await fetch("/api/students/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: signupEmail,
          password: signupPassword,
          phone_number: phone,
          university,
          faculty,
          start_year: startYear,
          turnstileToken,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        turnstileRef.current?.reset()
        throw new Error((isAr && data.error_ar) ? data.error_ar : (data.error || "Failed to register"))
      }

      if (data.status === "pending") {
        setIsPendingReview(true)
        setSignUpStatus("success")
        setSignUpMessage(isAr ? data.message_ar : data.message)
      } else {
        // Auto sign in if open registration
        if (supabase) {
          await supabase.auth.signInWithPassword({
            email: signupEmail.trim(),
            password: signupPassword,
          })
        }
        router.replace(returnUrl || "/#courses")
      }
    } catch (err: unknown) {
      turnstileRef.current?.reset()
      setSignUpStatus("error")
      setSignUpMessage(err instanceof Error ? err.message : "Failed to sign up")
    }
  }

  const startYears = []
  const nowYear = new Date().getFullYear()
  for (let y = nowYear + 1; y >= nowYear - 8; y--) {
    startYears.push(y)
  }

  return (
    <Layout title={`${isAr ? "تسجيل الدخول والاشتراك" : "Sign In & Student Registration"} — PharmaCore`} description={copy.loginSubtitle}>
      {/* Generic provisioned account setup wizard modal */}
      <StudentSetupModal
        open={setupModalOpen}
        userEmail={loggedUserEmail}
        token={loggedUserToken}
        universities={universities}
        faculties={faculties}
        onSuccess={() => {
          setSetupModalOpen(false)
          router.replace(returnUrl || "/#courses")
        }}
      />

      <div className="page-shell grid min-h-[calc(100vh-5rem)] items-center gap-10 py-10 lg:grid-cols-2 lg:gap-16">
        {/* Left Side: Educational Value Pitch */}
        <section className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-xs font-semibold text-primary">
            <GraduationCap className="size-4" />
            <span>PharmaCore Learning Portal</span>
          </div>

          <h1 className="mt-6 max-w-xl text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl">
            {copy.featuresTitle}
          </h1>

          <p className="body-lead mt-5 max-w-lg text-muted-foreground">
            {copy.loginSubtitle}
          </p>

          <div className="mt-8 space-y-4">
            {[copy.f1, copy.f2, copy.f3].map((feat, idx) => (
              <div key={idx} className="flex items-center gap-3 font-medium text-sm">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle2 className="size-4" />
                </span>
                <span>{feat}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border bg-card/60 backdrop-blur-md p-5 max-w-lg shadow-xs">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="size-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-foreground">
                  {isAr ? "منهج صيدلي سريري معتمد" : "Evidence-Based Clinical Curriculum"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  {isAr
                    ? "مصمم لمساعدة طلاب الصيدلة والامتياز على ربط علم الأدوية بالممارسة السريرية اليومية."
                    : "Designed for pharmacy students and interns bridging pharmacology fundamentals with hospital ward practice."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Auth Card with Tabs */}
        <Card className="mx-auto w-full max-w-lg border-primary/20 shadow-xl shadow-primary/5">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <BrandMark className="size-10" />
              {returnUrl && (
                <Badge variant="secondary" className="badge-nowrap text-[11px] gap-1 font-mono shrink-0">
                  <LockKeyhole className="size-3 shrink-0" />
                  <span>{isAr ? "محتوى مخصص" : "Protected Content"}</span>
                </Badge>
              )}
            </div>

            <Tabs value={tab} onValueChange={(val) => setTab(val as "signin" | "signup")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="badge-nowrap gap-2 min-h-10 text-xs sm:text-sm font-semibold">
                  <LockKeyhole className="size-3.5 shrink-0" />
                  <span>{copy.signInTab}</span>
                </TabsTrigger>
                <TabsTrigger value="signup" className="badge-nowrap gap-2 min-h-10 text-xs sm:text-sm font-semibold">
                  <UserPlus className="size-3.5 shrink-0" />
                  <span>{copy.signUpTab}</span>
                </TabsTrigger>
              </TabsList>

              {/* ─── TAB 1: SIGN IN ─────────────────────────────────────── */}
              <TabsContent value="signin">
                <div className="mb-5">
                  <h2 className="text-2xl font-extrabold">{copy.loginTitle}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{copy.loginSubtitle}</p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email">{copy.email}</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        className="ps-9"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        placeholder="student@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signin-password">{copy.password}</Label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        className="ps-9"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  {signInStatus === "error" && (
                    <Alert variant="destructive">
                      <AlertDescription>{signInError}</AlertDescription>
                    </Alert>
                  )}

                  {signInStatus === "pending_approval" && (
                    <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
                      <Clock className="size-4 text-amber-600 shrink-0" />
                      <AlertTitle className="font-bold">{copy.approvalNoticeTitle}</AlertTitle>
                      <AlertDescription className="text-xs mt-1">{copy.pendingError}</AlertDescription>
                    </Alert>
                  )}

                  {/* Background Cloudflare Turnstile bot verification for Sign In */}
                  <Turnstile
                    ref={signInTurnstileRef}
                    action="student_signin"
                    size="invisible"
                    onVerify={(token) => setSignInTurnstileToken(token)}
                    onExpire={() => setSignInTurnstileToken("")}
                  />

                  <Button type="submit" size="lg" className="btn-nowrap w-full mt-2" disabled={signInStatus === "submitting"}>
                    {signInStatus === "submitting" ? <Loader2 className="animate-spin shrink-0" /> : <LockKeyhole className="shrink-0" />}
                    <span>{signInStatus === "submitting" ? copy.submitting : copy.signInBtn}</span>
                    <ArrowRight className="shrink-0 rtl:rotate-180" />
                  </Button>
                </form>
              </TabsContent>

              {/* ─── TAB 2: CREATE STUDENT ACCOUNT ────────────────────────── */}
              <TabsContent value="signup">
                {isClosedRegistration ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="mx-auto grid size-12 place-items-center rounded-full bg-amber-500/10 text-amber-600">
                      <AlertTriangle className="size-6" />
                    </div>
                    <h3 className="text-lg font-bold">{copy.closedTitle}</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      {copy.closedDesc}
                    </p>
                    <Button variant="outline" onClick={() => setTab("signin")}>
                      {copy.signInTab}
                    </Button>
                  </div>
                ) : isPendingReview ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                      <Clock className="size-6" />
                    </div>
                    <h3 className="text-xl font-bold">{copy.approvalNoticeTitle}</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      {copy.approvalNoticeDesc}
                    </p>
                    <Button variant="outline" onClick={() => setTab("signin")}>
                      {copy.signInTab}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSignUp} className="space-y-3.5">
                    {/* First & Last Name */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-firstname">{copy.firstName} *</Label>
                        <div className="relative">
                          <User className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="signup-firstname"
                            className="ps-9"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder={isAr ? "أحمد" : "Ahmed"}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-lastname">{copy.lastName} *</Label>
                        <div className="relative">
                          <User className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="signup-lastname"
                            className="ps-9"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder={isAr ? "علي" : "Ali"}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email & Password */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-email">{copy.email} *</Label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            className="ps-9"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            placeholder="student@example.com"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-password">{copy.password} *</Label>
                        <div className="relative">
                          <KeyRound className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type="password"
                            className="ps-9"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            placeholder="••••••••"
                            minLength={6}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-phone">{copy.phone}</Label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="signup-phone"
                          type="tel"
                          className="ps-9"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+20 100 000 0000"
                        />
                      </div>
                    </div>

                    {/* University & Faculty */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>{copy.uni} *</Label>
                        <Select value={university} onValueChange={setUniversity} required>
                          <SelectTrigger>
                            <SelectValue placeholder={copy.selectUni} />
                          </SelectTrigger>
                          <SelectContent>
                            {universities.map((u) => (
                              <SelectItem key={u.id} value={isAr ? u.name_ar : u.name_en}>
                                {isAr ? u.name_ar : u.name_en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label>{copy.faculty} *</Label>
                        <Select value={faculty} onValueChange={setFaculty} required>
                          <SelectTrigger>
                            <SelectValue placeholder={copy.selectFaculty} />
                          </SelectTrigger>
                          <SelectContent>
                            {faculties.map((f) => (
                              <SelectItem key={f.id} value={isAr ? f.name_ar : f.name_en}>
                                {isAr ? f.name_ar : f.name_en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Starting Year & Live Academic Level Display */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>{copy.startYear}</Label>
                        <Select value={String(startYear)} onValueChange={(val) => setStartYear(Number(val))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {startYears.map((yr) => (
                              <SelectItem key={yr} value={String(yr)}>
                                {yr}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="rounded-lg border bg-muted/40 p-2.5 flex flex-col justify-center">
                        <span className="text-[11px] text-muted-foreground font-medium">{copy.academicLevel}</span>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="text-xs font-bold text-primary">{academicLevelText}</span>
                          <span className="text-[10px] text-muted-foreground">({copy.gradYear}: {predictedGraduationYear})</span>
                        </div>
                      </div>
                    </div>

                    {signUpStatus === "error" && (
                      <Alert variant="destructive">
                        <AlertDescription>{signUpMessage}</AlertDescription>
                      </Alert>
                    )}

                    {/* Background Cloudflare Turnstile bot verification */}
                    <Turnstile
                      ref={turnstileRef}
                      action="student_signup"
                      size="invisible"
                      onVerify={(token) => setTurnstileToken(token)}
                      onExpire={() => setTurnstileToken("")}
                    />

                    <Button type="submit" size="lg" className="w-full mt-3" disabled={signUpStatus === "submitting"}>
                      {signUpStatus === "submitting" ? <Loader2 className="animate-spin" /> : <UserPlus />}
                      {signUpStatus === "submitting" ? copy.signingUp : copy.signUpBtn}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      siteContent: await loadSiteContent(),
      ...(await serverSideTranslations(locale ?? "en", ["common"])),
    },
  }
}
