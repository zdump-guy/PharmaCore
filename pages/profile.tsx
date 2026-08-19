import type { GetServerSideProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations"
import {
  FiActivity as Activity,
  FiAward as Award,
  FiBookOpen as BookOpen,
  FiCheck as Check,
  FiCheckCircle as CheckCircle2,
  FiClock as Clock,
  FiKey as Key,
  FiLoader as Loader2,
  FiLock as Lock,
  FiLogOut as LogOut,
  FiMail as Mail,
  FiPlayCircle as PlayCircle,
  FiSave as Save,
  FiUser as UserIcon,
  FiZap as Zap,
} from "react-icons/fi"
import { FaGraduationCap as GraduationCap } from "react-icons/fa6"
import Layout from "@/components/Layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"
import { loadSiteContent, type SiteContent } from "@/lib/siteContent"
import { resetUser } from "@/lib/analytics"
import { Progress } from "@/components/ui/progress"
import type { UserProfile, EnrolledCourseProgress } from "@/types"

interface ProfilePageProps {
  siteContent: SiteContent
}

interface ProfileMetrics {
  videosWatched: number
  quizzesTaken: number
  hoursStudied: number
  streakDays: number
  coursesEnrolled: number
}

export default function ProfilePage({ siteContent }: ProfilePageProps) {
  const router = useRouter()
  const { locale, query } = router
  const isAr = locale === "ar"
  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const [activeTab, setActiveTab] = useState<"info" | "learning" | "security">(
    (query.tab as "info" | "learning" | "security") || "info"
  )

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [metrics, setMetrics] = useState<ProfileMetrics>({
    videosWatched: 0,
    quizzesTaken: 0,
    hoursStudied: 0,
    streakDays: 1,
    coursesEnrolled: 0,
  })
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseProgress[]>([])

  // Form State
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [university, setUniversity] = useState("")
  const [faculty, setFaculty] = useState("")
  const [startYear, setStartYear] = useState<number>(new Date().getFullYear() - 2)
  const [predictedEndYear, setPredictedEndYear] = useState<number>(new Date().getFullYear() + 3)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileNotice, setProfileNotice] = useState<{ error?: boolean; text: string } | null>(null)

  // Password State
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [passwordNotice, setPasswordNotice] = useState<{ error?: boolean; text: string } | null>(null)

  // Universities & Faculties
  const universitiesList = siteContent.enrollment_settings?.universities || []
  const facultiesList = siteContent.enrollment_settings?.faculties || []

  // Load Session, Profile & Real Course Enrollments
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    async function fetchStudentProfile() {
      setLoading(true)
      try {
        const {
          data: { session },
        } = await supabase!.auth.getSession()

        if (!session) {
          router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`)
          return
        }

        const [profileRes, enrollmentsRes] = await Promise.all([
          fetch("/api/profile", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch("/api/students/enrollments", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
        ])

        if (!profileRes.ok) {
          throw new Error("Could not load student profile.")
        }

        const data = await profileRes.json()
        const userProf = data.profile as UserProfile
        setProfile(userProf)
        if (data.metrics) setMetrics(data.metrics)

        if (enrollmentsRes.ok) {
          const enrollData = await enrollmentsRes.json()
          setEnrolledCourses(enrollData.enrollments || [])
        }

        // Populate fields
        setFirstName(userProf.first_name || userProf.full_name?.split(" ")[0] || "")
        setLastName(userProf.last_name || userProf.full_name?.split(" ").slice(1).join(" ") || "")
        setPhoneNumber(userProf.phone_number || "")
        setUniversity(userProf.university || "")
        setFaculty(userProf.faculty || "")
        if (userProf.start_year) setStartYear(userProf.start_year)
        if (userProf.predicted_end_year) setPredictedEndYear(userProf.predicted_end_year)
      } catch (err: unknown) {
        setProfileNotice({
          error: true,
          text: err instanceof Error ? err.message : tr("Failed to fetch profile.", "تعذر تحميل الملف الشخصي."),
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStudentProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  // Calculate academic year
  const calculatedYear = Math.max(1, new Date().getFullYear() - startYear + 1)

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setSavingProfile(true)
    setProfileNotice(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error(tr("Session expired", "انتهت الجلسة"))

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phoneNumber.trim() || null,
          university: university || null,
          faculty: faculty || null,
          start_year: Number(startYear),
          predicted_end_year: Number(predictedEndYear),
          current_year: calculatedYear,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update profile.")

      setProfile(data.profile)
      setProfileNotice({
        error: false,
        text: tr("Profile information updated successfully!", "تم تحديث بيانات الملف الشخصي بنجاح!"),
      })
    } catch (err: unknown) {
      setProfileNotice({
        error: true,
        text: err instanceof Error ? err.message : tr("Could not update profile.", "تعذر تحديث البيانات."),
      })
    } finally {
      setSavingProfile(false)
    }
  }

  // Handle Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordNotice(null)

    if (newPassword.length < 8) {
      setPasswordNotice({
        error: true,
        text: tr("Password must be at least 8 characters.", "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل."),
      })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordNotice({
        error: true,
        text: tr("Passwords do not match.", "كلمات المرور غير متطابقة."),
      })
      return
    }

    setUpdatingPassword(true)
    try {
      const { error } = await supabase!.auth.updateUser({ password: newPassword })
      if (error) throw error

      setNewPassword("")
      setConfirmPassword("")
      setPasswordNotice({
        error: false,
        text: tr("Password updated successfully!", "تم تحديث كلمة المرور بنجاح!"),
      })
    } catch (err: unknown) {
      setPasswordNotice({
        error: true,
        text: err instanceof Error ? err.message : tr("Failed to update password.", "تعذر تغيير كلمة المرور."),
      })
    } finally {
      setUpdatingPassword(false)
    }
  }

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
      resetUser()
    }
    router.push("/")
  }

  if (loading) {
    return (
      <Layout title={tr("Student Profile — PharmaCore", "الملف الشخصي — فارما كور")}>
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-bold text-muted-foreground">
            {tr("Loading student profile...", "جارٍ تحميل الملف الأكاديمي...")}
          </p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title={tr(
        `${profile?.full_name || "Student"} — Academic Profile`,
        `${profile?.full_name || "الطالب"} — الملف الشخصي`
      )}
      description={tr(
        "Manage your PharmaCore student profile, track study progress, and update academic credentials.",
        "إدارة ملفك الأكاديمي في فارما كور، ومتابعة تقدم الدراسة وتحديث البيانات."
      )}
    >
      <div className="page-shell section-space space-y-8" dir={isAr ? "rtl" : "ltr"}>
        {/* ─── Top Hero / Profile Banner Card ──────────────────────────────── */}
        <div className="rounded-3xl border bg-card p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 end-0 size-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between relative z-10">
            {/* Avatar & Identifiers */}
            <div className="flex items-center gap-4">
              <div className="size-20 rounded-2xl bg-gradient-to-tr from-primary to-primary/60 text-primary-foreground font-black text-3xl grid place-items-center shadow-lg uppercase">
                {profile?.full_name ? profile.full_name[0] : "S"}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {profile?.full_name || tr("Student Learner", "طالب صيدلي")}
                  </h1>
                  <Badge
                    className={`badge-nowrap ${
                      profile?.status === "active"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-600 font-bold"
                    }`}
                  >
                    {profile?.status === "active"
                      ? tr("Active Student", "طالب مفعل")
                      : profile?.status === "needs_setup"
                      ? tr("Setup Required", "يتطلب استكمال البيانات")
                      : tr("Enrolled", "مسجل")}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 truncate">
                  <Mail className="size-3.5 shrink-0" />
                  <span className="truncate">{profile?.email}</span>
                </p>
                {(profile?.university || profile?.faculty) && (
                  <p className="text-xs text-primary font-bold flex items-center gap-1.5 pt-0.5">
                    <GraduationCap className="size-4 shrink-0" />
                    <span className="truncate">
                      {[profile.faculty, profile.university].filter(Boolean).join(" • ")}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="btn-nowrap gap-2 font-bold text-xs rounded-xl shadow-xs"
              >
                <LogOut className="size-3.5 text-muted-foreground shrink-0" />
                <span>{tr("Sign Out", "تسجيل الخروج")}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Metric Highlight Cards ───────────────────────────────────────── */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="card-interactive card-equal shadow-none">
            <CardContent className="p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase whitespace-nowrap">{tr("Study Hours", "ساعات التعلم")}</span>
                <Clock className="size-4 text-primary shrink-0" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono">{metrics.hoursStudied}h</p>
              <p className="text-[11px] text-muted-foreground truncate">{tr("Watched video lectures", "مشاهدة شروحات الفيديو")}</p>
            </CardContent>
          </Card>

          <Card className="card-interactive card-equal shadow-none">
            <CardContent className="p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase whitespace-nowrap">{tr("Videos Watched", "المحاضرات المكتملة")}</span>
                <BookOpen className="size-4 text-blue-500 shrink-0" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono">{metrics.videosWatched}</p>
              <p className="text-[11px] text-muted-foreground truncate">{tr("Completed lecture sessions", "محاضرة تم اجتيازها")}</p>
            </CardContent>
          </Card>

          <Card className="card-interactive card-equal shadow-none">
            <CardContent className="p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase whitespace-nowrap">{tr("Quizzes Solved", "الاختبارات")}</span>
                <Award className="size-4 text-emerald-500 shrink-0" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono">{metrics.quizzesTaken}</p>
              <p className="text-[11px] text-muted-foreground truncate">{tr("Self-assessment tests", "اختبارات تقييم ذاتي")}</p>
            </CardContent>
          </Card>

          <Card className="card-interactive card-equal shadow-none">
            <CardContent className="p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase whitespace-nowrap">{tr("Study Streak", "المواظبة")}</span>
                <Zap className="size-4 text-amber-500 shrink-0" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono">{metrics.streakDays} {tr("Days", "أيام")}</p>
              <p className="text-[11px] text-muted-foreground truncate">{tr("Consecutive active days", "أيام متتالية من التعلم")}</p>
            </CardContent>
          </Card>
        </div>

        {/* ─── Profile Tabs Navigation ──────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-b pb-2 overflow-x-auto w-full">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === "info"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <UserIcon className="size-4 shrink-0" />
            <span>{tr("Personal & Academic Info", "البيانات الشخصية والأكاديمية")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("learning")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === "learning"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Activity className="size-4 shrink-0" />
            <span>{tr("Learning Activity", "سجل التقدم الدراسي")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === "security"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Lock className="size-4 shrink-0" />
            <span>{tr("Security & Password", "الأمان وتغيير كلمة المرور")}</span>
          </button>
        </div>

        {/* ─── 1. PERSONAL & ACADEMIC INFO TAB ──────────────────────────────── */}
        {activeTab === "info" && (
          <form onSubmit={handleSaveProfile} className="space-y-6 max-w-3xl">
            {profileNotice && (
              <div
                className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                  profileNotice.error
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                }`}
              >
                {profileNotice.error ? <Lock className="size-4" /> : <CheckCircle2 className="size-4" />}
                <span>{profileNotice.text}</span>
              </div>
            )}

            <Card className="shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">
                  {tr("Personal Details", "البيانات الشخصية")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tr("Keep your official student name and contact information up to date.", "تأكد من صحة الاسم الرسمي ومعلومات الاتصال.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{tr("First Name", "الاسم الأول")}</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ahmed"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{tr("Last Name", "اسم العائلة / اللقب")}</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Hassan"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{tr("Email Address", "البريد الإلكتروني")}</Label>
                    <div className="relative">
                      <Input value={profile?.email || ""} disabled className="bg-muted text-muted-foreground pe-8" />
                      <Check className="size-4 text-emerald-500 absolute end-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{tr("Phone Number", "رقم الهاتف")}</Label>
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+20 100 000 0000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">
                  {tr("Academic Affiliation & Timeline", "البيانات الأكاديمية والمرحلة الدراسية")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tr("Select your enrolled university, faculty, and study years.", "اختر الجامعة والكلية المسجل بهما وسنوات الدراسة.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{tr("University", "الجامعة")}</Label>
                    <Select value={university} onValueChange={setUniversity}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={tr("Select University", "اختر الجامعة")} />
                      </SelectTrigger>
                      <SelectContent>
                        {universitiesList.map((u) => (
                          <SelectItem key={u.id} value={isAr ? u.name_ar : u.name_en}>
                            {isAr ? u.name_ar : u.name_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">{tr("Faculty / Department", "الكلية / البرنامج")}</Label>
                    <Select value={faculty} onValueChange={setFaculty}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={tr("Select Faculty", "اختر الكلية")} />
                      </SelectTrigger>
                      <SelectContent>
                        {facultiesList.map((f) => (
                          <SelectItem key={f.id} value={isAr ? f.name_ar : f.name_en}>
                            {isAr ? f.name_ar : f.name_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{tr("Start Year", "سنة بدء الدراسة")}</Label>
                    <Input
                      type="number"
                      min={2015}
                      max={2030}
                      value={startYear}
                      onChange={(e) => setStartYear(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">{tr("Predicted Graduation Year", "سنة التخرج المتوقعة")}</Label>
                    <Input
                      type="number"
                      min={2020}
                      max={2035}
                      value={predictedEndYear}
                      onChange={(e) => setPredictedEndYear(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Academic Year Computed Badge */}
                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">
                    {tr("Current Academic Stage:", "السنة الدراسية الحالية:")}
                  </span>
                  <Badge className="bg-primary text-primary-foreground font-bold">
                    {tr(`Year ${calculatedYear}`, `الفرقة ${calculatedYear}`)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              size="lg"
              disabled={savingProfile}
              className="gap-2 font-bold w-full sm:w-auto rounded-xl shadow-xs"
            >
              {savingProfile ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              <span>{savingProfile ? tr("Saving Profile...", "جارٍ الحفظ...") : tr("Save Changes", "حفظ التعديلات")}</span>
            </Button>
          </form>
        )}

        {/* ─── 2. LEARNING ACTIVITY & ENROLLED COURSES TAB ──────────────────── */}
        {activeTab === "learning" && (
          <div className="space-y-6 max-w-4xl">
            {/* My Enrolled Courses Section */}
            <Card className="shadow-none">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <GraduationCap className="size-4 text-primary" />
                      <span>{tr("My Enrolled Courses", "المقررات المسجل بها")}</span>
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {tr("Courses you are actively registered in and your lecture completion progress.", "المقررات المسجل بها رسميًا ونسبة إنجاز المحاضرات والاختبارات.")}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="font-mono font-bold text-xs">
                    {enrolledCourses.length} {tr("Courses", "مقررات")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {enrolledCourses.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-2xl p-6 bg-muted/20">
                    <BookOpen className="size-10 text-muted-foreground/50 mx-auto" />
                    <h4 className="mt-3 text-sm font-bold">{tr("No enrolled courses yet", "لم تشترك في أي مقرر بعد")}</h4>
                    <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                      {tr(
                        "Browse our available curriculum and enroll in courses to begin your academic learning track.",
                        "استعرض المقررات المتاحة واشترك في المساقات لبدء رحلتك التعليمية."
                      )}
                    </p>
                    <Button size="sm" className="mt-4 font-bold" asChild>
                      <Link href="/#courses">{tr("Explore Courses", "استعراض المقررات")}</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {enrolledCourses.map((item) => {
                      const courseTitle = isAr ? item.course.title_ar : item.course.title_en
                      const nextLectureHref = item.lastActiveLectureId
                        ? `/lecture/${item.lastActiveLectureId}`
                        : `/course/${item.courseId}`

                      return (
                        <div
                          key={item.enrollmentId}
                          className="rounded-2xl border bg-card p-4 flex flex-col justify-between space-y-3 hover:border-primary/40 transition-colors shadow-2xs card-equal"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-sm leading-snug line-clamp-2">{courseTitle}</span>
                              <Badge
                                variant="outline"
                                className={`badge-nowrap text-[10px] font-bold shrink-0 ${
                                  item.status === "completed"
                                    ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                                    : item.status === "pending"
                                    ? "border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10 animate-pulse"
                                    : "border-primary/30 text-primary bg-primary/10"
                                }`}
                              >
                                {item.status === "completed"
                                  ? tr("Completed", "مكتمل")
                                  : item.status === "pending"
                                  ? tr("Pending Approval", "قيد المراجعة")
                                  : tr("Active", "نشط")}
                              </Badge>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="whitespace-nowrap">{tr("Course Progress", "نسبة الإنجاز")}</span>
                                <span className="font-mono font-bold text-foreground whitespace-nowrap">{item.progressPercent}%</span>
                              </div>
                              <Progress value={item.progressPercent} className="h-2" />
                            </div>

                            <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground pt-1">
                              <span className="whitespace-nowrap">
                                {item.completedLectures} / {item.totalLectures} {tr("Lectures watched", "محاضرة مكتملة")}
                              </span>
                              {item.totalQuizzes > 0 && (
                                <span className="whitespace-nowrap">
                                  • {item.completedQuizzes} / {item.totalQuizzes} {tr("Quizzes", "اختبار")}
                                </span>
                              )}
                            </div>
                          </div>

                          {item.status === "pending" ? (
                            <Button size="sm" variant="outline" className="btn-nowrap w-full font-bold text-xs gap-1.5 h-8 mt-2 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10" asChild>
                              <Link href={`/course/${item.courseId}`}>
                                <Clock className="size-3.5 shrink-0" />
                                <span>{tr("Pending Approval", "قيد مراجعة الإدارة")}</span>
                              </Link>
                            </Button>
                          ) : (
                            <Button size="sm" variant="default" className="btn-nowrap w-full font-bold text-xs gap-1.5 h-8 mt-2" asChild>
                              <Link href={nextLectureHref}>
                                <PlayCircle className="size-3.5 shrink-0" />
                                <span>{item.completedLectures > 0 ? tr("Resume Learning", "متابعة الدراسة") : tr("Start Course", "بدء المقرر")}</span>
                              </Link>
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Analytics & Milestones Summary */}
            <Card className="shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">
                  {tr("Learning Summary & Engagement", "ملخص النشاط والتفاعل")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tr("Aggregated overview of your study engagement and learning streak.", "نظرة عامة على نشاطك ومشاركتك المستمرة في المنصة.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-2xl border bg-muted/20 text-center">
                    <p className="text-lg font-bold font-mono text-primary">{metrics.videosWatched}</p>
                    <p className="text-[11px] text-muted-foreground">{tr("Videos Watched", "فيديو تمت مشاهدته")}</p>
                  </div>
                  <div className="p-3 rounded-2xl border bg-muted/20 text-center">
                    <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">{metrics.quizzesTaken}</p>
                    <p className="text-[11px] text-muted-foreground">{tr("Quizzes Taken", "اختبار مكتمل")}</p>
                  </div>
                  <div className="p-3 rounded-2xl border bg-muted/20 text-center">
                    <p className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">{metrics.hoursStudied}h</p>
                    <p className="text-[11px] text-muted-foreground">{tr("Study Time", "ساعات التعلم")}</p>
                  </div>
                  <div className="p-3 rounded-2xl border bg-muted/20 text-center">
                    <p className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">{metrics.streakDays} {tr("days", "أيام")}</p>
                    <p className="text-[11px] text-muted-foreground">{tr("Active Streak", "أيام النشاط")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── 3. SECURITY & PASSWORD TAB ──────────────────────────────────── */}
        {activeTab === "security" && (
          <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-xl">
            {passwordNotice && (
              <div
                className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                  passwordNotice.error
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                }`}
              >
                {passwordNotice.error ? <Lock className="size-4" /> : <CheckCircle2 className="size-4" />}
                <span>{passwordNotice.text}</span>
              </div>
            )}

            <Card className="shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">
                  {tr("Change Account Password", "تغيير كلمة المرور")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tr("Ensure your account is protected with a strong, memorable password.", "تأكد من حماية حسابك بكلمة مرور قوية وموثوقة.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{tr("New Password", "كلمة المرور الجديدة")}</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{tr("Confirm New Password", "تأكيد كلمة المرور الجديدة")}</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              size="lg"
              disabled={updatingPassword}
              className="gap-2 font-bold w-full sm:w-auto rounded-xl shadow-xs"
            >
              {updatingPassword ? <Loader2 className="size-4 animate-spin" /> : <Key className="size-4" />}
              <span>{updatingPassword ? tr("Updating Password...", "جارٍ التحديث...") : tr("Update Password", "تحديث كلمة المرور")}</span>
            </Button>
          </form>
        )}
      </div>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const siteContent = await loadSiteContent()
  return {
    props: {
      siteContent,
      ...(await serverSideTranslations(locale ?? "en", ["common"])),
    },
  }
}
