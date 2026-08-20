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
  FiShield as Shield,
  FiUser as UserIcon,
  FiZap as Zap
} from "react-icons/fi"
import { FaGraduationCap as GraduationCap, FaFire as Flame } from "react-icons/fa6"
import Layout from "@/components/Layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import CertificateCard from "@/components/certificates/CertificateCard"
import StreakBadgeCard from "@/components/certificates/StreakBadgeCard"
import { supabase } from "@/lib/supabaseClient"
import { loadSiteContent, type SiteContent } from "@/lib/siteContent"
import { resetUser } from "@/lib/analytics"
import {
  getUserCertificates,
  getUserStreak,
  getUserBadges
} from "@/lib/certificates"
import type {
  UserProfile,
  EnrolledCourseProgress,
  CertificateRecord,
  UserStreak,
  UserBadge
} from "@/types"

interface ProfilePageProps {
  siteContent: SiteContent
}

interface ProfileMetrics {
  videosWatched: number
  quizzesTaken: number
  hoursStudied: number
  streakDays: number
  coursesEnrolled: number
  certificatesEarned?: number
}

export default function ProfilePage({ siteContent }: ProfilePageProps) {
  const router = useRouter()
  const { locale, query } = router
  const isAr = locale === "ar"
  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const [activeTab, setActiveTab] = useState<"info" | "learning" | "certificates" | "streaks" | "security">(
    (query.tab as "info" | "learning" | "certificates" | "streaks" | "security") || "info"
  )

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [metrics, setMetrics] = useState<ProfileMetrics>({
    videosWatched: 0,
    quizzesTaken: 0,
    hoursStudied: 0,
    streakDays: 1,
    coursesEnrolled: 0,
    certificatesEarned: 0
  })
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseProgress[]>([])
  const [certificates, setCertificates] = useState<CertificateRecord[]>([])
  const [streak, setStreak] = useState<UserStreak>({
    user_id: "",
    current_streak: 1,
    longest_streak: 1,
    last_activity_date: new Date().toISOString().split("T")[0],
    updated_at: new Date().toISOString()
  })
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [claimingCourseId, setClaimingCourseId] = useState<string | null>(null)
  const [claimNotice, setClaimNotice] = useState<{ error?: boolean; text: string } | null>(null)

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

  // Load Session, Profile, Enrollments, Certificates & Streaks
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    async function fetchStudentProfile() {
      setLoading(true)
      try {
        const {
          data: { session }
        } = await supabase!.auth.getSession()

        if (!session) {
          router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`)
          return
        }

        const [profileRes, enrollmentsRes, certsRes] = await Promise.all([
          fetch("/api/profile", {
            headers: { Authorization: `Bearer ${session.access_token}` }
          }),
          fetch("/api/students/enrollments", {
            headers: { Authorization: `Bearer ${session.access_token}` }
          }),
          fetch("/api/certificates", {
            headers: { Authorization: `Bearer ${session.access_token}` }
          })
        ])

        if (!profileRes.ok) {
          throw new Error("Could not load student profile.")
        }

        const data = await profileRes.json()
        const userProf = data.profile as UserProfile
        setProfile(userProf)

        if (enrollmentsRes.ok) {
          const enrollData = await enrollmentsRes.json()
          setEnrolledCourses(enrollData.enrollments || [])
        }

        let userCerts: CertificateRecord[] = []
        if (certsRes.ok) {
          const certData = await certsRes.json()
          userCerts = certData.certificates || []
          setCertificates(userCerts)
        } else {
          userCerts = await getUserCertificates(userProf.id)
          setCertificates(userCerts)
        }

        // Fetch Streak & Badges
        const [userStreakData, userBadgesData] = await Promise.all([
          getUserStreak(userProf.id),
          getUserBadges(userProf.id)
        ])
        setStreak(userStreakData)
        setBadges(userBadgesData)

        if (data.metrics) {
          setMetrics({
            ...data.metrics,
            streakDays: userStreakData.current_streak || data.metrics.streakDays || 1,
            certificatesEarned: userCerts.length
          })
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
          text: err instanceof Error ? err.message : tr("Failed to fetch profile.", "تعذر تحميل الملف الشخصي.")
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStudentProfile()
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
        data: { session }
      } = await supabase.auth.getSession()
      if (!session) throw new Error(tr("Session expired", "انتهت الجلسة"))

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phoneNumber.trim() || null,
          university: university || null,
          faculty: faculty || null,
          start_year: Number(startYear),
          predicted_end_year: Number(predictedEndYear),
          current_year: calculatedYear
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update profile.")

      setProfile(data.profile)
      setProfileNotice({
        error: false,
        text: tr("Profile information updated successfully!", "تم تحديث بيانات الملف الشخصي بنجاح!")
      })
    } catch (err: unknown) {
      setProfileNotice({
        error: true,
        text: err instanceof Error ? err.message : tr("Could not update profile.", "تعذر تحديث البيانات.")
      })
    } finally {
      setSavingProfile(false)
    }
  }

  // Handle Certificate Claim
  const handleClaimCertificate = async (courseId: string, courseTitle: string) => {
    if (!supabase) return
    setClaimingCourseId(courseId)
    setClaimNotice(null)

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (!session) throw new Error(tr("Session expired", "انتهت الجلسة"))

      const res = await fetch("/api/certificates/issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          course_id: courseId,
          student_name: profile?.full_name || [firstName, lastName].filter(Boolean).join(" ") || "Student"
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || tr("Mastery criteria not yet met.", "لم يتم استيفاء شروط الإتقان بعد."))
      }

      const newCert = data.certificate as CertificateRecord
      setCertificates((prev) => [newCert, ...prev.filter((c) => c.course_id !== courseId)])
      setClaimNotice({
        error: false,
        text: tr(
          `Congratulations! Certificate issued for "${courseTitle}".`,
          `مبروك! تم إصدار شهادة الإتقان لمقرر "${courseTitle}".`
        )
      })
    } catch (err: unknown) {
      setClaimNotice({
        error: true,
        text: err instanceof Error ? err.message : tr("Could not claim certificate.", "تعذر إصدار الشهادة.")
      })
    } finally {
      setClaimingCourseId(null)
    }
  }

  // Handle Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordNotice(null)

    if (newPassword.length < 8) {
      setPasswordNotice({
        error: true,
        text: tr("Password must be at least 8 characters.", "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.")
      })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordNotice({
        error: true,
        text: tr("Passwords do not match.", "كلمات المرور غير متطابقة.")
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
        text: tr("Password updated successfully!", "تم تحديث كلمة المرور بنجاح!")
      })
    } catch (err: unknown) {
      setPasswordNotice({
        error: true,
        text: err instanceof Error ? err.message : tr("Failed to update password.", "تعذر تغيير كلمة المرور.")
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
        "Manage your PharmaCore student profile, track study progress, download verified certificates, and review milestone achievements.",
        "إدارة ملفك الأكاديمي في فارما كور، ومتابعة التقدم الدراسي، وتحميل الشهادات المعتمدة، ومراجعة أوسمة الإنجاز."
      )}
    >
      <div className="page-shell section-space space-y-8" dir={isAr ? "rtl" : "ltr"}>
        {/* ─── Top Hero / Profile Banner Card ──────────────────────────────── */}
        <div className="rounded-3xl border border-border/80 bg-card/90 p-6 sm:p-8 shadow-sm relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 end-0 size-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between relative z-10">
            {/* Avatar & Identifiers */}
            <div className="flex items-center gap-4">
              <Avatar className="size-20 ring-2 ring-primary/30 shadow-md">
                <AvatarFallback className="bg-primary text-primary-foreground font-black text-2xl uppercase">
                  {profile?.full_name ? profile.full_name[0] : "S"}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                    {profile?.full_name || tr("Student Learner", "طالب صيدلي")}
                  </h1>
                  <Badge variant={profile?.status === "active" ? "success" : "warning"} className="font-bold">
                    {profile?.status === "active"
                      ? tr("Active Student", "طالب مفعل")
                      : profile?.status === "needs_setup"
                      ? tr("Setup Required", "يتطلب استكمال البيانات")
                      : tr("Enrolled", "مسجل")}
                  </Badge>
                  {certificates.length > 0 && (
                    <Badge variant="default" className="font-bold bg-emerald-600/90 text-white gap-1 text-[11px]">
                      <Shield className="size-3" />
                      <span>
                        {certificates.length} {tr("Certificates", "شهادات معتمدة")}
                      </span>
                    </Badge>
                  )}
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
                className="gap-2 font-bold text-xs rounded-full shadow-xs border-border/80 hover:bg-muted"
              >
                <LogOut className="size-3.5 text-muted-foreground shrink-0" />
                <span>{tr("Sign Out", "تسجيل الخروج")}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Metric Highlight Cards ───────────────────────────────────────── */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm transition-transform hover:-translate-y-0.5">
            <CardContent className="p-5 space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">{tr("Study Hours", "ساعات التعلم")}</span>
                <Clock className="size-4 text-primary shrink-0" />
              </div>
              <p className="text-3xl font-black font-mono text-foreground">{metrics.hoursStudied}h</p>
              <p className="text-[11px] text-muted-foreground truncate">{tr("Video lecture hours", "مشاهدة شروحات الفيديو")}</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm transition-transform hover:-translate-y-0.5">
            <CardContent className="p-5 space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">{tr("Lectures", "المحاضرات")}</span>
                <BookOpen className="size-4 text-teal-500 shrink-0" />
              </div>
              <p className="text-3xl font-black font-mono text-foreground">{metrics.videosWatched}</p>
              <p className="text-[11px] text-muted-foreground truncate">{tr("Completed sessions", "محاضرة تم اجتيازها")}</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm transition-transform hover:-translate-y-0.5">
            <CardContent className="p-5 space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">{tr("Assessments", "الاختبارات")}</span>
                <Award className="size-4 text-emerald-500 shrink-0" />
              </div>
              <p className="text-3xl font-black font-mono text-foreground">{metrics.quizzesTaken}</p>
              <p className="text-[11px] text-muted-foreground truncate">{tr("Solved quizzes", "اختبارات تم إنجازها")}</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm transition-transform hover:-translate-y-0.5">
            <CardContent className="p-5 space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">{tr("Study Streak", "المواظبة")}</span>
                <Flame className="size-4 text-amber-500 shrink-0" />
              </div>
              <p className="text-3xl font-black font-mono text-foreground">
                {streak.current_streak || metrics.streakDays} {tr("d", "يوم")}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">{tr("Consecutive active days", "أيام متتالية من التعلم")}</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm transition-transform hover:-translate-y-0.5 col-span-2 lg:col-span-1">
            <CardContent className="p-5 space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">{tr("Certificates", "الشهادات")}</span>
                <Shield className="size-4 text-emerald-600 shrink-0" />
              </div>
              <p className="text-3xl font-black font-mono text-foreground">{certificates.length}</p>
              <p className="text-[11px] text-muted-foreground truncate">{tr("Verified credentials", "شهادات معتمدة وموثقة")}</p>
            </CardContent>
          </Card>
        </div>

        {/* ─── Profile Tabs Navigation ──────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-3 overflow-x-auto w-full">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "info"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            <UserIcon className="size-4 shrink-0" />
            <span>{tr("Personal & Academic Info", "البيانات الشخصية والأكاديمية")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("learning")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "learning"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            <Activity className="size-4 shrink-0" />
            <span>{tr("Learning Activity", "سجل التقدم الدراسي")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("certificates")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "certificates"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            <Award className="size-4 shrink-0" />
            <span>{tr("Verifiable Certificates", "الشهادات المعتمدة")}</span>
            {certificates.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-background/20 font-mono">
                {certificates.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("streaks")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "streaks"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            <Zap className="size-4 shrink-0" />
            <span>{tr("Study Streaks & Badges", "المواظبة والأوسمة")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "security"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            <Lock className="size-4 shrink-0" />
            <span>{tr("Security & Password", "الأمان وكلمة المرور")}</span>
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

            <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
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
                    <Label className="text-xs font-bold">{tr("First Name", "الاسم الأول")}</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ahmed"
                      required
                      className="rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{tr("Last Name", "اسم العائلة / اللقب")}</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Hassan"
                      required
                      className="rounded-xl h-11"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{tr("Email Address", "البريد الإلكتروني")}</Label>
                    <div className="relative">
                      <Input value={profile?.email || ""} disabled className="bg-muted text-muted-foreground pe-8 rounded-xl h-11" />
                      <Check className="size-4 text-emerald-500 absolute end-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{tr("Phone Number", "رقم الهاتف")}</Label>
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+20 100 000 0000"
                      className="rounded-xl h-11"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
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
                    <Label className="text-xs font-bold">{tr("University", "الجامعة")}</Label>
                    <Select value={university} onValueChange={setUniversity}>
                      <SelectTrigger className="w-full rounded-xl h-11">
                        <SelectValue placeholder={tr("Select University", "اختر الجامعة")} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {universitiesList.map((u) => (
                          <SelectItem key={u.id} value={isAr ? u.name_ar : u.name_en}>
                            {isAr ? u.name_ar : u.name_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{tr("Faculty / Department", "الكلية / البرنامج")}</Label>
                    <Select value={faculty} onValueChange={setFaculty}>
                      <SelectTrigger className="w-full rounded-xl h-11">
                        <SelectValue placeholder={tr("Select Faculty", "اختر الكلية")} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
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
                    <Label className="text-xs font-bold">{tr("Start Year", "سنة بدء الدراسة")}</Label>
                    <Input
                      type="number"
                      min={2015}
                      max={2030}
                      value={startYear}
                      onChange={(e) => setStartYear(Number(e.target.value))}
                      className="rounded-xl h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{tr("Predicted Graduation Year", "سنة التخرج المتوقعة")}</Label>
                    <Input
                      type="number"
                      min={2020}
                      max={2035}
                      value={predictedEndYear}
                      onChange={(e) => setPredictedEndYear(Number(e.target.value))}
                      className="rounded-xl h-11"
                    />
                  </div>
                </div>

                {/* Academic Year Computed Badge */}
                <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">
                    {tr("Current Academic Stage:", "السنة الدراسية الحالية:")}
                  </span>
                  <Badge variant="default" className="font-bold">
                    {tr(`Year ${calculatedYear}`, `الفرقة ${calculatedYear}`)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              size="lg"
              disabled={savingProfile}
              className="gap-2 font-bold w-full sm:w-auto rounded-full px-8 shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 h-12"
            >
              {savingProfile ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              <span>{savingProfile ? tr("Saving Profile...", "جارٍ الحفظ...") : tr("Save Changes", "حفظ التعديلات")}</span>
            </Button>
          </form>
        )}

        {/* ─── 2. LEARNING ACTIVITY & ENROLLED COURSES TAB ──────────────────── */}
        {activeTab === "learning" && (
          <div className="space-y-6 max-w-4xl">
            <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
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
                  <div className="text-center py-12 border border-dashed border-border/80 rounded-3xl p-6 bg-muted/20 space-y-3">
                    <BookOpen className="size-10 text-muted-foreground/50 mx-auto" />
                    <h4 className="text-sm font-bold text-foreground">{tr("No enrolled courses yet", "لم تشترك في أي مقرر بعد")}</h4>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                      {tr(
                        "Browse our available curriculum and enroll in courses to begin your academic learning track.",
                        "استعرض المقررات المتاحة واشترك في المساقات لبدء رحلتك التعليمية."
                      )}
                    </p>
                    <Button size="sm" className="mt-2 rounded-full px-6 font-bold" asChild>
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
                      const hasCert = certificates.some((c) => c.course_id === item.courseId)

                      return (
                        <div
                          key={item.enrollmentId}
                          className="rounded-3xl border border-border/80 bg-card/90 p-5 flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all shadow-2xs"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-sm leading-snug line-clamp-2 text-foreground">{courseTitle}</span>
                              <Badge
                                variant={item.status === "completed" || item.progressPercent === 100 ? "success" : item.status === "pending" ? "warning" : "default"}
                                className="text-[10px] font-bold shrink-0"
                              >
                                {item.status === "completed" || item.progressPercent === 100
                                  ? tr("Completed", "مكتمل")
                                  : item.status === "pending"
                                  ? tr("Pending Approval", "قيد المراجعة")
                                  : tr("Active", "نشط")}
                              </Badge>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                                <span>{tr("Course Progress", "نسبة الإنجاز")}</span>
                                <span className="font-mono font-bold text-primary">{item.progressPercent}%</span>
                              </div>
                              <Progress value={item.progressPercent} className="h-2" />
                            </div>

                            <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground pt-1">
                              <span>
                                {item.completedLectures} / {item.totalLectures} {tr("Lectures watched", "محاضرة مكتملة")}
                              </span>
                              {item.totalQuizzes > 0 && (
                                <span>
                                  • {item.completedQuizzes} / {item.totalQuizzes} {tr("Quizzes", "اختبار")}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            {item.status === "pending" ? (
                              <Button size="sm" variant="outline" className="w-full rounded-full font-bold text-xs gap-1.5 h-9 border-amber-500/30 text-amber-700 dark:text-amber-300" asChild>
                                <Link href={`/course/${item.courseId}`}>
                                  <Clock className="size-3.5 shrink-0" />
                                  <span>{tr("Pending Approval", "قيد مراجعة الإدارة")}</span>
                                </Link>
                              </Button>
                            ) : (
                              <Button size="sm" className="w-full rounded-full font-bold text-xs gap-1.5 h-9 shadow-xs" asChild>
                                <Link href={nextLectureHref}>
                                  <PlayCircle className="size-3.5 shrink-0" />
                                  <span>{item.completedLectures > 0 ? tr("Resume Learning", "متابعة الدراسة") : tr("Start Course", "بدء المقرر")}</span>
                                </Link>
                              </Button>
                            )}

                            {item.progressPercent === 100 && !hasCert && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleClaimCertificate(item.courseId, courseTitle)}
                                disabled={claimingCourseId === item.courseId}
                                className="rounded-full font-bold text-xs gap-1.5 h-9 px-3 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                              >
                                {claimingCourseId === item.courseId ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Award className="size-3.5" />
                                )}
                                <span>{tr("Claim Cert", "إصدار الشهادة")}</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── 3. VERIFIABLE CERTIFICATES TAB ──────────────────────────────── */}
        {activeTab === "certificates" && (
          <div className="space-y-6 max-w-4xl">
            {claimNotice && (
              <div
                className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                  claimNotice.error
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                }`}
              >
                {claimNotice.error ? <Lock className="size-4" /> : <CheckCircle2 className="size-4" />}
                <span>{claimNotice.text}</span>
              </div>
            )}

            <div className="rounded-3xl border border-border/80 bg-card/90 p-6 sm:p-7 shadow-sm relative overflow-hidden backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="size-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-base font-black text-foreground">
                      {tr("My Clinical Mastery Certificates", "شهادات الإتقان السريري المعتمدة")}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-xl">
                    {tr(
                      "Official credentials issued upon completing 100% of course lectures and achieving >= 80% on clinical assessments. Each certificate contains a unique verifiable QR code.",
                      "شهادات رسمية تصدر آليًا فور إتمام 100% من المحاضرات وتحقيق 80% فأعلى في التقييمات السريرية. تتضمن كل شهادة رمز QR موثقًا للتحقق الفوري."
                    )}
                  </p>
                </div>

                <Badge variant="success" className="font-mono font-bold text-xs self-start sm:self-center px-3 py-1">
                  {certificates.length} {tr("Issued", "شهادة صادرة")}
                </Badge>
              </div>
            </div>

            {certificates.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border/80 rounded-3xl p-8 bg-muted/20 space-y-4">
                <Award className="size-12 text-muted-foreground/40 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">
                    {tr("No certificates earned yet", "لم يتم الحصول على أي شهادة حتى الآن")}
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    {tr(
                      "To earn your official PharmaCore certificate, complete 100% of the video lectures in an enrolled course and achieve at least 80% average on the quizzes.",
                      "للحصول على شهادتك المعتمدة، أكمل 100% من محاضرات المقرر المسجل به وحقق 80% على الأقل في الاختبارات."
                    )}
                  </p>
                </div>

                <Button size="sm" className="rounded-full px-6 font-bold" asChild>
                  <Link href="/#courses">{tr("Start Learning", "بدء التعلم")}</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {certificates.map((cert) => (
                  <CertificateCard key={cert.id} certificate={cert} locale={locale} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── 4. STUDY STREAKS & BADGES TAB ───────────────────────────────── */}
        {activeTab === "streaks" && (
          <div className="space-y-6 max-w-4xl">
            <StreakBadgeCard streak={streak} badges={badges} locale={locale} />
          </div>
        )}

        {/* ─── 5. SECURITY & PASSWORD TAB ──────────────────────────────────── */}
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

            <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
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
                  <Label className="text-xs font-bold">{tr("New Password", "كلمة المرور الجديدة")}</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="rounded-xl h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">{tr("Confirm New Password", "تأكيد كلمة المرور الجديدة")}</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="rounded-xl h-11"
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              size="lg"
              disabled={updatingPassword}
              className="gap-2 font-bold w-full sm:w-auto rounded-full px-8 shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 h-12"
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
      ...(await serverSideTranslations(locale ?? "en", ["common"]))
    }
  }
}
