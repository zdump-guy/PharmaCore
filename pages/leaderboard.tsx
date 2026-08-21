import React, { useEffect, useState, useMemo } from "react"
import type { GetServerSideProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations"
import {
  FiClock as Clock,
  FiGlobe as Globe,
  FiInfo as Info,
  FiZap as Zap,
  FiUsers as Users,
} from "react-icons/fi"
import {
  FaCrown as Crown,
  FaFire as Flame,
  FaGraduationCap as GraduationCap,
  FaBookOpen as BookOpen,
  FaGem as Gem,
} from "react-icons/fa6"
import { HiSparkles as Sparkles } from "react-icons/hi2"
import Layout from "@/components/Layout"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CircularProgressRing } from "@/components/gamification/CircularProgressRing"
import { DivisionBadge } from "@/components/gamification/DivisionBadge"
import { LeaderboardPodium } from "@/components/gamification/LeaderboardPodium"
import { LeaderboardTable } from "@/components/gamification/LeaderboardTable"
import { supabase } from "@/lib/supabaseClient"
import { loadSiteContent, type SiteContent } from "@/lib/siteContent"
import { cn } from "@/lib/utils"
import {
  calculateDivision,
  fetchLeaderboardEntries,
  getUserGamificationProfile,
  DIVISION_METADATA,
  type LeaderboardScope,
  type LeaderboardTimeframe,
  type LeaderboardResult,
  type UserGamificationProfile,
} from "@/lib/gamification"
import type { Course, UserProfile } from "@/types"

interface LeaderboardPageProps {
  courses: Course[]
  siteContent: SiteContent
}

export default function LeaderboardPage({ courses = [], siteContent }: LeaderboardPageProps) {
  const router = useRouter()
  const { locale, query } = router
  const currentLocale: "en" | "ar" = locale === "ar" ? "ar" : "en"
  const isAr = currentLocale === "ar"
  const tr = (en: string, ar: string) => (isAr ? ar : en)

  // Scope & Timeframe State (synced with router queries if present)
  const [scope, setScope] = useState<LeaderboardScope>(
    (query.scope as LeaderboardScope) || "global"
  )
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>(
    (query.timeframe as LeaderboardTimeframe) || "weekly"
  )
  const [selectedUniversity, setSelectedUniversity] = useState<string>("")
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || "crs_cardio_101"
  )

  // User State
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userGamification, setUserGamification] = useState<UserGamificationProfile>({
    user_id: "",
    total_xp: 480,
    weekly_xp: 85,
    division: "bronze",
    current_streak: 3,
    longest_streak: 7,
    last_activity_date: new Date().toISOString().split("T")[0],
    badges_count: 1,
    certificates_count: 0,
  })

  // Leaderboard Data State
  const [, setLoading] = useState(true)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResult>({
    scope: "global",
    timeframe: "weekly",
    totalEntries: 0,
    podium: [],
    remaining: [],
    allEntries: [],
    currentUserEntry: null,
  })

  // Season Countdown Timer
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 3,
    hours: 14,
    minutes: 22,
    seconds: 45,
  })

  // Calculate season reset (next Sunday 23:59:59 UTC)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const dayOfWeek = now.getUTCDay()
      const daysUntilSunday = (7 - dayOfWeek) % 7
      const nextSunday = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday),
          23,
          59,
          59
        )
      )
      const diff = Math.max(0, nextSunday.getTime() - now.getTime())

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((diff / 1000 / 60) % 60)
      const seconds = Math.floor((diff / 1000) % 60)

      setTimeLeft({ days, hours, minutes, seconds })
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [])

  // Load User Session & Profile
  useEffect(() => {
    async function loadUser() {
      if (!supabase) return

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          const uid = session.user.id
          setCurrentUserId(uid)

          // Fetch user profile from API
          try {
            const res = await fetch("/api/profile", {
              headers: { Authorization: `Bearer ${session.access_token}` },
            })
            if (res.ok) {
              const data = await res.json()
              const prof = data.profile as UserProfile
              setUserProfile(prof)
              if (prof.university && !selectedUniversity) {
                setSelectedUniversity(prof.university)
              }
              const gam = await getUserGamificationProfile(uid, prof)
              setUserGamification(gam)
            }
          } catch {
            const gam = await getUserGamificationProfile(uid)
            setUserGamification(gam)
          }
        }
      } catch {
        // Fallback
      }
    }

    loadUser()
  }, [selectedUniversity])

  // Load Leaderboard Data on Scope / Timeframe / Selection change
  useEffect(() => {
    let isCancelled = false

    async function loadData() {
      setLoading(true)
      try {
        const result = await fetchLeaderboardEntries({
          scope,
          timeframe,
          userUniversity: selectedUniversity || (userProfile?.university || "Cairo University"),
          courseId: selectedCourseId,
          currentUserId,
          currentUserProfile: userProfile,
        })

        if (!isCancelled) {
          setLeaderboardData(result)
        }
      } catch {
        // Fallback
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isCancelled = true
    }
  }, [scope, timeframe, selectedUniversity, selectedCourseId, currentUserId, userProfile])

  // Universities list from site content or fallback
  const universitiesList = useMemo(() => {
    const list = siteContent.enrollment_settings?.universities || []
    if (list.length > 0) return list
    return [
      { id: "u_cairo", name_en: "Cairo University", name_ar: "جامعة القاهرة" },
      { id: "u_ksu", name_en: "King Saud University", name_ar: "جامعة الملك سعود" },
      { id: "u_ainshams", name_en: "Ain Shams University", name_ar: "جامعة عين شمس" },
      { id: "u_kau", name_en: "King Abdulaziz University", name_ar: "جامعة الملك عبدالعزيز" },
      { id: "u_alex", name_en: "Alexandria University", name_ar: "جامعة الإسكندرية" },
      { id: "u_just", name_en: "Jordan University of Science & Technology", name_ar: "جامعة العلوم والتكنولوجيا الأردنية" },
      { id: "u_mansoura", name_en: "Mansoura University", name_ar: "جامعة المنصورة" },
      { id: "u_aub", name_en: "American University of Beirut", name_ar: "الجامعة الأمريكية في بيروت" },
      { id: "u_kuwait", name_en: "Kuwait University", name_ar: "جامعة الكويت" },
    ]
  }, [siteContent])

  // Current division progression metrics for user spotlight
  const divisionProgress = useMemo(() => {
    return calculateDivision(userGamification.total_xp)
  }, [userGamification.total_xp])

  // Next tier info
  const nextTierMeta = useMemo(() => {
    if (!divisionProgress.nextTierMinXp) return null
    return calculateDivision(divisionProgress.nextTierMinXp)
  }, [divisionProgress.nextTierMinXp])

  return (
    <Layout
      title={tr(
        "Scholar Leaderboard & Division Leagues | PharmaCore",
        "لائحة شرف الصيادلة ودوريات الأقسام | فارماكور"
      )}
    >
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background pb-20 pt-6">
        <div className="page-shell space-y-8">
          {/* Breadcrumbs Navigation */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary transition-colors">
              {tr("Home", "الرئيسية")}
            </Link>
            <span>/</span>
            <span className="font-semibold text-foreground">
              {tr("Leaderboard & Divisions", "المتصدرون والأقسام")}
            </span>
          </nav>

          {/* Hero Banner with Season Timer & User Rank Card */}
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-background to-accent/10 p-6 md:p-10 shadow-2xl backdrop-blur-2xl">
            {/* Ambient Background Glows */}
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Heading & Season Countdown */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-primary/40 bg-primary/10 text-primary font-bold text-xs px-3 py-1 gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {tr("5-Tier Division League System", "نظام دوريات الأقسام الخماسية")}
                  </Badge>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/80 border border-border/60 text-xs font-mono font-bold text-muted-foreground shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {tr("Season Resets:", "إعادة التعيين:")}{" "}
                      <span className="text-foreground">
                        {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
                      </span>
                    </span>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
                  {tr("Scholar Leaderboard", "لائحة شرف الصيادلة")}
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-teal-300">
                    {tr("& Division Leagues", "ودوريات الأقسام")}
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                  {tr(
                    "Compete with pharmacology scholars across top medical institutions. Earn XP from lecture mastery, daily clinical challenges, and assessments to rise through the ranks!",
                    "تنافس مع نخبة طلاب الصيدلة والطب في كبرى الجامعات، واكسب النقاط من إتمام المحاضرات والتحديات السريرية اليومية للصعود إلى المراتب العليا!"
                  )}
                </p>
              </div>

              {/* Right Column: User Division Spotlight Card */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border-2 border-border/80 bg-card/80 backdrop-blur-xl p-5 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground font-semibold">
                        {tr("Your Division Standing", "مستواك في الدوري")}
                      </span>
                      <div className="flex items-center gap-2">
                        <DivisionBadge
                          tier={divisionProgress.tier}
                          size="md"
                          showXp={false}
                          locale={currentLocale}
                        />
                      </div>
                      <div className="pt-1 flex items-center gap-3 text-xs font-mono">
                        <span className="font-extrabold text-foreground text-sm">
                          {userGamification.total_xp.toLocaleString()} <span className="text-primary text-xs">XP</span>
                        </span>
                        <span className="flex items-center gap-1 text-amber-500 font-bold">
                          <Flame className="w-3.5 h-3.5 text-orange-500" />
                          {userGamification.current_streak}d {tr("Streak", "أيام")}
                        </span>
                      </div>
                    </div>

                    {/* Circular Progress Ring to Next Tier */}
                    <div className="flex-shrink-0">
                      <CircularProgressRing
                        value={divisionProgress.progressPercent}
                        size={104}
                        strokeWidth={8}
                        gradient={
                          divisionProgress.tier === "diamond"
                            ? "purple"
                            : divisionProgress.tier === "platinum"
                            ? "cyan"
                            : divisionProgress.tier === "gold"
                            ? "gold"
                            : divisionProgress.tier === "silver"
                            ? "silver"
                            : "amber"
                        }
                      >
                        <span className="text-xs font-extrabold font-mono text-foreground">
                          {divisionProgress.progressPercent}%
                        </span>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
                          {divisionProgress.isMaxTier ? tr("Max Tier", "القمة") : tr("Next Tier", "للقسم التالي")}
                        </span>
                      </CircularProgressRing>
                    </div>
                  </div>

                  {/* Progress Footnote */}
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                    {!divisionProgress.isMaxTier && nextTierMeta ? (
                      <span>
                        {tr(
                          `${divisionProgress.xpNeededForNext.toLocaleString()} XP needed for ${nextTierMeta.name_en}`,
                          `تحتاج ${divisionProgress.xpNeededForNext.toLocaleString()} نقطة للوصول إلى ${nextTierMeta.name_ar}`
                        )}
                      </span>
                    ) : (
                      <span className="text-purple-400 font-bold flex items-center gap-1">
                        <Gem className="w-3.5 h-3.5" />
                        {tr("Elite Diamond Champion Rank Achieved", "تم تحقيق أعلى مرتبة في الدوري الماسي النخبوي")}
                      </span>
                    )}

                    <Link
                      href="#league-rules"
                      className="text-primary hover:underline font-medium text-[11px] flex items-center gap-0.5"
                    >
                      <Info className="w-3 h-3" />
                      {tr("Rules", "القواعد")}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scope Switcher & Timeframe Tabs */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Main Scope Switcher Pills */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-card/70 border border-border/60 backdrop-blur-xl shadow-sm overflow-x-auto">
                <button
                  onClick={() => setScope("global")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                    scope === "global"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Globe className="w-4 h-4" />
                  {tr("Global Platform", "المنصة العالمية")}
                </button>

                <button
                  onClick={() => setScope("university")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                    scope === "university"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <GraduationCap className="w-4 h-4" />
                  {tr("My University", "جامعتي")}
                </button>

                <button
                  onClick={() => setScope("course")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                    scope === "course"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <BookOpen className="w-4 h-4" />
                  {tr("Course Classroom", "قاعة المقرر")}
                </button>
              </div>

              {/* Timeframe Tabs (Weekly Season vs All-Time) */}
              <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-card/70 border border-border/60 backdrop-blur-xl shadow-sm self-start md:self-auto">
                <button
                  onClick={() => setTimeframe("weekly")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                    timeframe === "weekly"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Flame className="w-3.5 h-3.5 text-white" />
                  {tr("Weekly Season", "دوري الأسبوع")}
                </button>

                <button
                  onClick={() => setTimeframe("all_time")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                    timeframe === "all_time"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Crown className="w-3.5 h-3.5 text-white" />
                  {tr("All-Time Hall of Fame", "لوحة الشرف الدائمة")}
                </button>
              </div>
            </div>

            {/* Sub-Filters: University Dropdown & Course Dropdown when active */}
            {scope === "university" && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-md animate-fade-up">
                <span className="text-xs font-bold text-foreground whitespace-nowrap flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  {tr("Select University Campus:", "اختر الحرم الجامعي:")}
                </span>
                <Select
                  value={selectedUniversity || "Cairo University"}
                  onValueChange={(val) => setSelectedUniversity(val)}
                >
                  <SelectTrigger className="w-full max-w-xs bg-background/80 h-9 text-xs font-semibold rounded-xl">
                    <SelectValue placeholder={tr("Select institution", "اختر الجامعة")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 rounded-xl">
                    {universitiesList.map((u) => (
                      <SelectItem key={u.id} value={u.name_en} className="text-xs">
                        {isAr ? u.name_ar : u.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {scope === "course" && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-md animate-fade-up">
                <span className="text-xs font-bold text-foreground whitespace-nowrap flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-primary" />
                  {tr("Select Course Classroom:", "اختر المقرر الدراسي:")}
                </span>
                <Select
                  value={selectedCourseId}
                  onValueChange={(val) => setSelectedCourseId(val)}
                >
                  <SelectTrigger className="w-full max-w-sm bg-background/80 h-9 text-xs font-semibold rounded-xl">
                    <SelectValue placeholder={tr("Select course", "اختر المقرر")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 rounded-xl">
                    {courses.length > 0 ? (
                      courses.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {isAr ? c.title_ar || c.title_en : c.title_en}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="crs_cardio_101" className="text-xs">
                          Cardiovascular Pharmacotherapy
                        </SelectItem>
                        <SelectItem value="crs_anti_201" className="text-xs">
                          Clinical Antimicrobial Stewardship
                        </SelectItem>
                        <SelectItem value="crs_cns_301" className="text-xs">
                          Advanced Neuropharmacology
                        </SelectItem>
                        <SelectItem value="crs_renal_401" className="text-xs">
                          Renal & Endocrine Therapeutics
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Top 3 Podium Showcase */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                {tr("Top Champions Podium", "منصة أبطال الصدارة")}
              </h3>
              <span className="text-xs text-muted-foreground font-mono">
                {scope.toUpperCase()} • {timeframe === "weekly" ? tr("WEEKLY XP", "نقاط الأسبوع") : tr("ALL-TIME XP", "مجموع النقاط")}
              </span>
            </div>

            <LeaderboardPodium
              topThree={leaderboardData.podium}
              timeframe={timeframe}
              locale={currentLocale}
              onSelectUser={() => {}}
            />
          </div>

          {/* Full Ranked Roster Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {tr("Complete Division Roster", "قائمة الترتيب الشاملة")}
              </h3>
              <span className="text-xs text-muted-foreground font-medium">
                {leaderboardData.totalEntries} {tr("Ranked Scholars", "طالب مصنف")}
              </span>
            </div>

            <LeaderboardTable
              entries={leaderboardData.allEntries}
              currentUserId={currentUserId}
              timeframe={timeframe}
              locale={currentLocale}
              pageSize={10}
            />
          </div>

          {/* Division League Explainer & XP Rules Guide */}
          <div id="league-rules" className="pt-8 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-bold text-xs">
                {tr("Handbook & Scoring Guide", "دليل القواعد واحتساب النقاط")}
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                {tr("How Division Leagues & XP Work", "كيف يعمل نظام دوريات الأقسام ونقاط الخبرة")}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {tr(
                  "Earn XP through authentic clinical learning activities. Climb from Bronze to Diamond Division as you master pharmacology concepts.",
                  "اكسب نقاط الخبرة من خلال الأنشطة التعليمية السريرية الحقيقية، وارتقِ من القسم البرونزي إلى الماسي مع إتقانك لمفاهيم علم الأدوية."
                )}
              </p>
            </div>

            {/* 5-Tier Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {(
                [
                  { tier: "bronze", xpRange: "0 - 499 XP", color: "border-amber-600/40 bg-amber-950/20" },
                  { tier: "silver", xpRange: "500 - 1,499 XP", color: "border-slate-400/40 bg-slate-800/20" },
                  { tier: "gold", xpRange: "1,500 - 3,499 XP", color: "border-yellow-500/40 bg-yellow-950/20" },
                  { tier: "platinum", xpRange: "3,500 - 6,999 XP", color: "border-cyan-400/40 bg-cyan-950/20" },
                  { tier: "diamond", xpRange: "7,000+ XP", color: "border-purple-400/40 bg-purple-950/20" },
                ] as const
              ).map((d) => (
                <div
                  key={d.tier}
                  className={cn(
                    "rounded-2xl border p-4 backdrop-blur-xl flex flex-col items-center text-center space-y-3 transition-all hover:scale-[1.02]",
                    d.color
                  )}
                >
                  <DivisionBadge tier={d.tier} size="md" interactive={false} locale={currentLocale} />
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold text-foreground block">{d.xpRange}</span>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {isAr
                        ? DIVISION_METADATA[d.tier].name_ar
                        : DIVISION_METADATA[d.tier].name_en}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* XP Scoring Matrix */}
            <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xl p-6 shadow-sm">
              <h4 className="font-bold text-sm sm:text-base text-foreground mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                {tr("Official XP Activity Scoring Matrix", "جدول احتساب نقاط الأنشطة المعتمد")}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-background/60 border border-border/50 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-foreground block">
                      {tr("Lecture Completion", "إتمام محاضرة")}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {tr("Watch 100% of video lecture", "مشاهدة المحاضرة كاملة")}
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-primary/20 text-primary font-mono font-bold">
                    +50 XP
                  </Badge>
                </div>

                <div className="p-3.5 rounded-xl bg-background/60 border border-border/50 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-foreground block">
                      {tr("Assessment Pass", "اجتياز اختبار")}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {tr("Score ≥ 80% on quiz", "تحقيق 80% أو أعلى")}
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-primary/20 text-primary font-mono font-bold">
                    +100 XP
                  </Badge>
                </div>

                <div className="p-3.5 rounded-xl bg-background/60 border border-border/50 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-foreground block">
                      {tr("Perfect Score Bonus", "مكافأة العلامة الكاملة")}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {tr("Score 100% on clinical quiz", "دقة 100% في الاختبار")}
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 font-mono font-bold">
                    +50 XP
                  </Badge>
                </div>

                <div className="p-3.5 rounded-xl bg-background/60 border border-border/50 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-foreground block">
                      {tr("Daily Clinical Challenge", "التحدي السريري اليومي")}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {tr('"Drug of the Day" vignette', 'سؤال "دواء اليوم" اليومي')}
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 font-mono font-bold">
                    +25 XP
                  </Badge>
                </div>

                <div className="p-3.5 rounded-xl bg-background/60 border border-border/50 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-foreground block">
                      {tr("Certificate Issued", "إصدار شهادة معتمدة")}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {tr("Course mastery milestone", "إتمام مقرر دراسي كامل")}
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                    +200 XP
                  </Badge>
                </div>

                <div className="p-3.5 rounded-xl bg-background/60 border border-border/50 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-foreground block">
                      {tr("Discussion Upvote", "إعجاب بسؤال أو إجابة")}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {tr("Helpful peer contribution", "مساهمة مميزة في المجتمع")}
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 font-mono font-bold">
                    +10 XP
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps<LeaderboardPageProps> = async ({ locale }) => {
  let courses: Course[] = []
  if (supabase) {
    try {
      const courseResult = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false })
      if (!courseResult.error && courseResult.data) {
        courses = courseResult.data
      }
    } catch {
      // Fallback
    }
  }

  const siteContent = await loadSiteContent()

  return {
    props: {
      courses,
      siteContent,
      ...(await serverSideTranslations(locale ?? "en", ["common"])),
    },
  }
}
