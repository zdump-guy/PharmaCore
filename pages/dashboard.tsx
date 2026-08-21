import type { GetServerSideProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { useState, useEffect } from "react"
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations"
import {
  FiActivity as Activity,
  FiAward as Award,
  FiBookOpen as BookOpen,
  FiChevronRight as ChevronRight,
  FiCompass as Compass,
  FiPlay as Play,
  FiTrendingUp as TrendingUp,
  FiZap as Zap,
} from "react-icons/fi"
import { FaFire as Flame, FaGraduationCap as GraduationCap } from "react-icons/fa6"
import Layout from "@/components/Layout"
import EmptyState from "@/components/EmptyState"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import DailyChallengeCard from "@/components/gamification/DailyChallengeCard"
import CircularProgressRing from "@/components/gamification/CircularProgressRing"
import DivisionBadge from "@/components/gamification/DivisionBadge"
import StreakBadgeCard from "@/components/certificates/StreakBadgeCard"
import { supabase } from "@/lib/supabaseClient"
import {
  formatXp,
  getUserDivisionInfo,
  getUserGamificationProfile,
  fetchLeaderboardEntries,
  awardUserXp,
  type LeaderboardEntry,
} from "@/lib/gamification"
import { getUserStreak, getUserBadges } from "@/lib/certificates"
import type { Course, UserProfile, UserStreak, UserBadge } from "@/types"

interface EnrolledCourseItem extends Course {
  progressPercent: number
  completedLectures: number
  totalLectures: number
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "en", ["common"])),
    },
  }
}

export default function StudentDashboard() {
  const router = useRouter()
  const isAr = router.locale === "ar"
  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseItem[]>([])
  const [totalXp, setTotalXp] = useState<number>(0)
  const [streak, setStreak] = useState<UserStreak>({
    user_id: "",
    current_streak: 0,
    longest_streak: 0,
    last_activity_date: null,
    updated_at: new Date().toISOString(),
  })
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [cohortLeaders, setCohortLeaders] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      if (!supabase) {
        setIsLoading(false)
        return
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          void router.replace("/login?redirect=/dashboard")
          return
        }

        const userId = session.user.id

        // 1. Fetch User Profile
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .maybeSingle()

        const activeUser: UserProfile = profile || {
          id: userId,
          email: session.user.email || "student@pharmacore.edu",
          full_name: session.user.user_metadata?.full_name || "PharmD Student",
          role: "student",
          status: "active",
          created_at: new Date().toISOString(),
        }

        if (isMounted) setUser(activeUser)

        // 2. Fetch Gamification Stats
        const gamProfile = await getUserGamificationProfile(userId, activeUser)
        if (isMounted) {
          setTotalXp(gamProfile.total_xp)
        }

        // 3. Fetch Streaks & Badges
        const [streakData, badgesData] = await Promise.all([
          getUserStreak(userId),
          getUserBadges(userId),
        ])
        if (isMounted) {
          setStreak(streakData)
          setBadges(badgesData)
        }

        // 4. Fetch Real Course Enrollments
        const { data: enrollments, error: enrollErr } = await supabase
          .from("course_enrollments")
          .select("course_id, status, enrolled_at")
          .eq("user_id", userId)

        if (!enrollErr && enrollments && enrollments.length > 0) {
          const courseIds = enrollments.map((e) => e.course_id)
          const { data: coursesData } = await supabase
            .from("courses")
            .select("*")
            .in("id", courseIds)

          if (coursesData && coursesData.length > 0) {
            // Fetch lecture progress for this user
            const { data: progressRecords } = await supabase
              .from("lecture_progress")
              .select("lecture_id, completed")
              .eq("user_id", userId)

            const completedLectureIds = new Set(
              (progressRecords || []).filter((p) => p.completed).map((p) => p.lecture_id)
            )

            // Fetch lectures per course to compute real progress
            const enriched: EnrolledCourseItem[] = await Promise.all(
              coursesData.map(async (c: Course) => {
                const { count: totalLecs } = await supabase!
                  .from("lectures")
                  .select("id", { count: "exact", head: true })
                  .eq("course_id", c.id)

                const total = totalLecs && totalLecs > 0 ? totalLecs : 1
                const { data: courseLectures } = await supabase!
                  .from("lectures")
                  .select("id")
                  .eq("course_id", c.id)

                const completedInCourse = (courseLectures || []).filter((l) =>
                  completedLectureIds.has(l.id)
                ).length

                const progressPercent = Math.min(100, Math.round((completedInCourse / total) * 100))

                return {
                  ...c,
                  progressPercent,
                  completedLectures: completedInCourse,
                  totalLectures: totalLecs || 0,
                }
              })
            )

            if (isMounted) setEnrolledCourses(enriched)
          } else {
            if (isMounted) setEnrolledCourses([])
          }
        } else {
          if (isMounted) setEnrolledCourses([])
        }

        // 5. Fetch Cohort Leaderboard Top Active Users
        const leaderboardResult = await fetchLeaderboardEntries({
          scope: "global",
          timeframe: "weekly",
          currentUserId: userId,
          currentUserProfile: activeUser,
        })

        if (isMounted) {
          setCohortLeaders(leaderboardResult.allEntries.slice(0, 3))
          if (leaderboardResult.currentUserEntry) {
            setUserRank(leaderboardResult.currentUserEntry.rank)
          }
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [router])

  const divisionInfo = getUserDivisionInfo(totalXp)

  const handleRewardXp = async (amount: number) => {
    setTotalXp((prev) => prev + amount)
    if (user?.id) {
      await awardUserXp(user.id, amount, "daily_challenge")
    }
  }

  if (isLoading) {
    return (
      <Layout title={tr("Loading Command Center...", "جاري تحميل مركز التحكم...")}>
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4" dir={isAr ? "rtl" : "ltr"}>
          <div className="size-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 grid place-items-center animate-pulse">
            <Activity className="size-6 animate-spin" />
          </div>
          <p className="text-xs font-bold text-muted-foreground">
            {tr("Connecting to PharmaCore clinical network...", "جاري الاتصال بقاعدة بيانات فارماكور السريرية...")}
          </p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title={tr("Student Command Center | PharmaCore", "مركز تحكم الطالب | فارماكور")}
      description={tr(
        "Track your active pharmacology courses, daily clinical challenges, and division leaderboard rank.",
        "متابعة مساقاتك السريرية الفعالة، وتحديات الأدوية اليومية، ومرتبتك في الدوري."
      )}
    >
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8" dir={isAr ? "rtl" : "ltr"}>
        {/* ─── Hero Student Welcome Banner ────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card/90 via-card/80 to-primary/5 p-6 sm:p-8 shadow-sm backdrop-blur-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Badge className="rounded-full px-3 py-1 font-bold text-xs bg-primary/10 text-primary border-primary/20">
                  {tr("Student Workspace", "مساحة الطالب")}
                </Badge>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold font-mono">
                  <Flame className="size-3.5 fill-current animate-pulse" />
                  <span>
                    {streak.current_streak} {tr("Day Streak", "أيام متتالية")}
                  </span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
                {tr("Welcome back, ", "مرحباً بك، ")}
                <span className="text-primary">{user?.full_name || tr("Student", "زميلنا الصيدلي")}</span>
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                {user?.university
                  ? `${user.university} • ${user.faculty || tr("Faculty of Pharmacy", "كلية الصيدلة")}`
                  : tr(
                      "Elevate your clinical pharmacotherapy knowledge with daily clinical cases, interactive practice rationales, and verified certificates.",
                      "طوّر مهاراتك الدوائية السريرية عبر الحالات اليومية والتعليلات التفاعلية والشهادات المعتمدة."
                    )}
              </p>
            </div>

            {/* Division Badge Widget */}
            <div className="flex items-center gap-4 bg-background/60 border border-border/70 p-4 rounded-2xl shadow-inner backdrop-blur-md">
              <CircularProgressRing
                value={divisionInfo.progressPercent}
                size={64}
                strokeWidth={5}
                gradient="primary"
              >
                <span className="text-xs font-black font-mono">{Math.round(divisionInfo.progressPercent)}%</span>
              </CircularProgressRing>

              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  {tr("Current Division", "الدرجة الحالية")}
                </p>
                <div className="mt-0.5">
                  <DivisionBadge tier={divisionInfo.tier.tier} locale={isAr ? "ar" : "en"} size="md" />
                </div>
                <p className="text-[11px] font-mono text-muted-foreground mt-1">
                  {formatXp(totalXp)} / {formatXp(divisionInfo.tier.nextTierMinXp || totalXp)} XP
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Quick Stats Grid ────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Active Courses */}
          <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm backdrop-blur-xl">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  {tr("Enrolled Courses", "المقررات المسجلة")}
                </p>
                <p className="text-2xl sm:text-3xl font-black font-mono mt-1 text-foreground">
                  {enrolledCourses.length}
                </p>
              </div>
              <div className="size-11 rounded-2xl bg-blue-500/10 text-blue-600 grid place-items-center">
                <BookOpen className="size-5" />
              </div>
            </CardContent>
          </Card>

          {/* Daily Streak */}
          <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm backdrop-blur-xl">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">{tr("Study Streak", "أيام الدراسة")}</p>
                <p className="text-2xl sm:text-3xl font-black font-mono mt-1 text-foreground">
                  {streak.current_streak}{" "}
                  <span className="text-xs font-normal text-muted-foreground">{tr("days", "يوم")}</span>
                </p>
              </div>
              <div className="size-11 rounded-2xl bg-amber-500/10 text-amber-600 grid place-items-center">
                <Flame className="size-5 fill-current" />
              </div>
            </CardContent>
          </Card>

          {/* Total XP Earned */}
          <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm backdrop-blur-xl">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  {tr("Total Experience", "مجموع نقاط XP")}
                </p>
                <p className="text-2xl sm:text-3xl font-black font-mono mt-1 text-foreground">{totalXp}</p>
              </div>
              <div className="size-11 rounded-2xl bg-purple-500/10 text-purple-600 grid place-items-center">
                <Zap className="size-5" />
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard Rank */}
          <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm backdrop-blur-xl">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  {tr("Global Standing", "الترتيب العام")}
                </p>
                <p className="text-2xl sm:text-3xl font-black font-mono mt-1 text-foreground">
                  {userRank && userRank > 0 ? (
                    <>
                      #{userRank}{" "}
                      <span className="text-xs font-normal text-emerald-600">
                        {userRank <= 3 ? tr("Podium", "منصة الصدارة") : tr("Active", "نشط")}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">
                      {divisionInfo.tier.name_en}
                    </span>
                  )}
                </p>
              </div>
              <div className="size-11 rounded-2xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
                <TrendingUp className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Main Content Grid: Daily Challenge & Enrolled Courses ───── */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column: Daily Challenge & Active Learning (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Daily Challenge Card */}
            <DailyChallengeCard isAr={isAr} onRewardXp={handleRewardXp} />

            {/* Active Enrolled Courses */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Activity className="size-4 text-primary" />
                  <span>{tr("My Active Courses", "مقرراتي الدراسية الفعالة")}</span>
                </h2>
                <Link
                  href="/courses"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span>{tr("Browse Catalog", "تصفح الدليل")}</span>
                  <ChevronRight className="size-3.5 rtl:rotate-180" />
                </Link>
              </div>

              {enrolledCourses.length > 0 ? (
                <div className="space-y-3">
                  {enrolledCourses.map((course) => {
                    return (
                      <Card
                        key={course.id}
                        className="rounded-3xl border border-border/80 bg-card/90 p-4 sm:p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md backdrop-blur-xl"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-foreground truncate">
                              {isAr ? course.title_ar || course.title_en : course.title_en}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {isAr ? course.description_ar || course.description_en : course.description_en}
                            </p>

                            <div className="flex items-center gap-3 pt-1">
                              <Progress
                                value={course.progressPercent}
                                className="h-1.5 bg-muted/60 flex-1 max-w-[180px]"
                              />
                              <span className="text-[11px] font-mono font-bold text-muted-foreground">
                                {course.progressPercent}%
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                ({course.completedLectures}/{course.totalLectures || 0} {tr("lectures", "محاضرة")})
                              </span>
                            </div>
                          </div>

                          <Link href={`/course/${course.id}`}>
                            <Button className="rounded-full h-9 px-4 text-xs font-bold gap-1.5 shadow-sm shadow-primary/20 shrink-0 w-full sm:w-auto">
                              <Play className="size-3 fill-current" />
                              <span>{course.progressPercent > 0 ? tr("Resume", "متابعة") : tr("Start", "بدء")}</span>
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={GraduationCap}
                  title={tr("No active enrolled courses yet", "لم تسجل في أي مقرر بعد")}
                  description={tr(
                    "Explore our clinical catalog to enroll in high-yield pharmacotherapy modules, participate in discussions, and earn verifiable certificates.",
                    "استعرض دليل المقررات للتسجيل في المساقات الإكلينيكية المعتمدة، والمشاركة في النقاشات، والحصول على شهادات موثقة."
                  )}
                  action={
                    <Button asChild className="rounded-full px-6 font-bold text-xs bg-primary text-primary-foreground gap-2">
                      <Link href="/courses">
                        <BookOpen className="size-3.5" />
                        <span>{tr("Browse Catalog", "استعراض دليل المقررات")}</span>
                      </Link>
                    </Button>
                  }
                />
              )}
            </div>
          </div>

          {/* Right Column: Streaks, Leaderboard CTA & Quick Tools (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Streak & Badges Showcase */}
            <StreakBadgeCard streak={streak} badges={badges} locale={router.locale} />

            {/* Leaderboard Teaser Card */}
            <Card className="rounded-3xl border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-xl bg-amber-500/10 text-amber-500 grid place-items-center">
                    <Award className="size-4" />
                  </div>
                  <h3 className="text-sm font-black text-foreground">
                    {tr("Cohort Leaderboard", "لوحة شرف الدفعة")}
                  </h3>
                </div>
                <Link
                  href="/leaderboard"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span>{tr("Full Standings", "التصنيف الكامل")}</span>
                  <ChevronRight className="size-3.5 rtl:rotate-180" />
                </Link>
              </div>

              {cohortLeaders.length > 0 ? (
                <div className="space-y-2 font-sans text-xs">
                  {cohortLeaders.map((entry, idx) => {
                    const isSelf = entry.user_id === user?.id
                    return (
                      <div
                        key={entry.user_id || idx}
                        className={`flex items-center justify-between p-2.5 rounded-xl border ${
                          isSelf
                            ? "bg-primary/10 border-primary/20 font-bold text-primary"
                            : idx === 0
                            ? "bg-amber-500/10 border-amber-500/20"
                            : "bg-muted/40 border-border/60"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`size-5 rounded-full grid place-items-center text-[10px] font-black font-mono ${
                              idx === 0
                                ? "bg-amber-500 text-white"
                                : idx === 1
                                ? "bg-slate-400 text-white"
                                : idx === 2
                                ? "bg-amber-700 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-bold text-foreground truncate">
                            {isSelf ? `${entry.full_name} (${tr("You", "أنت")})` : entry.full_name}
                          </span>
                        </div>
                        <span
                          className={`font-mono font-bold shrink-0 ps-2 ${
                            idx === 0 ? "text-amber-600 dark:text-amber-400" : isSelf ? "text-primary" : "text-muted-foreground"
                          }`}
                        >
                          {formatXp(entry.weekly_xp || entry.total_xp)} XP
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-6 text-center space-y-2">
                  <Award className="size-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-xs font-bold text-foreground">
                    {tr("No active leaderboard standings yet", "لا يوجد تصنيف مسجل بعد")}
                  </p>
                  <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                    {tr(
                      "Complete your first quiz or Daily Challenge to earn XP and appear on the leaderboard.",
                      "أكمل أول اختبار أو تحدي يومي لكسب نقاط XP والظهور في لوحة الشرف."
                    )}
                  </p>
                </div>
              )}

              <Link href="/leaderboard" className="block">
                <Button
                  variant="outline"
                  className="w-full rounded-2xl h-10 text-xs font-bold border-border/80 hover:bg-primary/5 hover:text-primary"
                >
                  {tr("View University & Global Rankings", "عرض تصنيف الجامعة والتصنيف العام")}
                </Button>
              </Link>
            </Card>

            {/* Quick Clinical Tool Access */}
            <Card className="rounded-3xl border border-border/80 bg-gradient-to-br from-card/90 to-primary/5 p-5 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-primary/10 text-primary grid place-items-center">
                  <Compass className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">
                    {tr("Clinical Pharmacology Suite", "حزمة الأدوات السريرية")}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tr(
                      "CrCl renal calculators, pediatric dosage & DDI checker.",
                      "حاسبات التصفية الكلوية والجرعات وتعارض الأدوية."
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}
