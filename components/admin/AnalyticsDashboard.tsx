import { useCallback, useEffect, useState } from "react"
import {
  FiActivity as Activity,
  FiAlertTriangle as AlertTriangle,
  FiAward as Award,
  FiCheckCircle as CheckCircle2,
  FiChevronLeft as ChevronLeft,
  FiChevronRight as ChevronRight,
  FiClock as Clock,
  FiDatabase as Database,
  FiDownload as Download,
  FiGlobe as Globe,
  FiInfo as Info,
  FiLoader as Loader2,
  FiMessageCircle as MessageCircle,
  FiMonitor as Monitor,
  FiPause as Pause,
  FiPlay as Play,
  FiRefreshCw as RefreshCw,
  FiSmartphone as Smartphone,
  FiTrendingUp as TrendingUp,
  FiUsers as Users,
  FiVideo as Video,
  FiX as X,
  FiZap as Zap,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import {
  subscribeToEvents,
  trackEvent,
  type AnalyticsEvent,
} from "@/lib/analytics"
import type { Course, Lecture, Question, Quiz } from "@/types"
import type { PedagogicalInsight, TimeSeriesPoint } from "@/pages/api/admin/analytics"

interface AnalyticsDashboardProps {
  isAr: boolean
  courses: Course[]
  lectures: Lecture[]
  quizzes: Quiz[]
  questions: Question[]
  unansweredQuestionsCount: number
}

type TimeRange = "today" | "7d" | "30d" | "all"
type EventFilterCategory = "all" | "video" | "quiz" | "course" | "admin"

interface AnalyticsData {
  configured: boolean
  tableExists?: boolean
  message?: string
  stats: {
    uniqueVisitors: number
    pageviews: number
    courseViews: number
    videoPlays: number
    videoMilestones: number
    videoCompletions: number
    quizStarts: number
    quizSubmissions: number
    quizPassed: number
    avgQuizScore: number
    quizPassRate: number
    estimatedStudyMinutes?: number
  }
  timeSeries?: TimeSeriesPoint[]
  retention?: {
    plays: number
    p25: number
    p50: number
    p75: number
    p100: number
    completionRate: number
  }
  scoreDistribution?: {
    tier90_100: number
    tier70_89: number
    tier50_69: number
    tier0_49: number
  }
  deviceStats?: {
    mobile: number
    desktop: number
    tablet: number
  }
  localeStats?: {
    ar: number
    en: number
  }
  funnel: { key: string; count: number; percent: number }[]
  topCourses: { title: string; views: number }[]
  topLectures: {
    title: string
    views: number
    plays?: number
    completions?: number
    dropoffRate?: number
  }[]
  insights?: PedagogicalInsight[]
  recentEvents: AnalyticsEvent[]
}

const defaultAnalyticsData: AnalyticsData = {
  configured: true,
  tableExists: true,
  stats: {
    uniqueVisitors: 0,
    pageviews: 0,
    courseViews: 0,
    videoPlays: 0,
    videoMilestones: 0,
    videoCompletions: 0,
    quizStarts: 0,
    quizSubmissions: 0,
    quizPassed: 0,
    avgQuizScore: 0,
    quizPassRate: 0,
    estimatedStudyMinutes: 0,
  },
  timeSeries: [],
  retention: {
    plays: 0,
    p25: 0,
    p50: 0,
    p75: 0,
    p100: 0,
    completionRate: 0,
  },
  scoreDistribution: {
    tier90_100: 0,
    tier70_89: 0,
    tier50_69: 0,
    tier0_49: 0,
  },
  deviceStats: { mobile: 0, desktop: 0, tablet: 0 },
  localeStats: { ar: 0, en: 0 },
  funnel: [
    { key: "course_viewed", count: 0, percent: 0 },
    { key: "video_played", count: 0, percent: 0 },
    { key: "video_milestone_50", count: 0, percent: 0 },
    { key: "quiz_started", count: 0, percent: 0 },
    { key: "quiz_passed", count: 0, percent: 0 },
  ],
  topCourses: [],
  topLectures: [],
  insights: [],
  recentEvents: [],
}

export default function AnalyticsDashboard({
  isAr,
  courses,
  lectures,
  quizzes,
  questions,
  unansweredQuestionsCount,
}: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d")
  const [data, setData] = useState<AnalyticsData>(defaultAnalyticsData)
  const [liveEvents, setLiveEvents] = useState<AnalyticsEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [eventCategoryFilter, setEventCategoryFilter] = useState<EventFilterCategory>("all")
  const [isLivePaused, setIsLivePaused] = useState(false)
  const [activeHoverPoint, setActiveHoverPoint] = useState<TimeSeriesPoint | null>(null)
  const [isInsightsOpen, setIsInsightsOpen] = useState(true)
  const [activeInsightIndex, setActiveInsightIndex] = useState(0)

  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const fetchAnalytics = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`/api/admin/analytics?timeRange=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      if (res.ok) {
        const json: AnalyticsData = await res.json()
        setData(json)
        if (json.recentEvents?.length) {
          setLiveEvents(json.recentEvents)
        }
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  useEffect(() => {
    const unsubscribe = subscribeToEvents((newEvent) => {
      if (!isLivePaused) {
        setLiveEvents((prev) => [newEvent, ...prev.slice(0, 49)])
      }
    })
    return () => unsubscribe()
  }, [isLivePaused])

  const triggerSampleTestEvent = () => {
    trackEvent("admin_preview_pulse", {
      triggered_by: "staff_admin",
      time_range: timeRange,
      locale: isAr ? "ar" : "en",
    })
  }

  // Export Analytics to CSV
  const handleExportCSV = () => {
    const rows = [
      ["Metric", "Value"],
      ["Time Range", timeRange],
      ["Unique Visitors", String(data.stats.uniqueVisitors)],
      ["Total Pageviews", String(data.stats.pageviews)],
      ["Course Views", String(data.stats.courseViews)],
      ["Video Plays", String(data.stats.videoPlays)],
      ["Video Completions", String(data.stats.videoCompletions)],
      ["Video Completion Rate (%)", `${data.retention?.completionRate ?? 0}%`],
      ["Quiz Submissions", String(data.stats.quizSubmissions)],
      ["Quiz Passed", String(data.stats.quizPassed)],
      ["Quiz Pass Rate (%)", `${data.stats.quizPassRate}%`],
      ["Average Quiz Score (%)", `${data.stats.avgQuizScore}%`],
      ["Estimated Study Minutes", String(data.stats.estimatedStudyMinutes ?? 0)],
      [],
      ["Top Courses", "Views"],
      ...data.topCourses.map((c) => [c.title, String(c.views)]),
      [],
      ["Top Lectures", "Views", "Drop-off Rate (%)"],
      ...data.topLectures.map((l) => [l.title, String(l.views), `${l.dropoffRate ?? 0}%`]),
    ]

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `pharmacore_analytics_${timeRange}_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filtered live events
  const filteredEvents = liveEvents.filter((evt) => {
    if (eventCategoryFilter === "all") return true
    if (eventCategoryFilter === "video") return evt.name.startsWith("video_")
    if (eventCategoryFilter === "quiz") return evt.name.startsWith("quiz_") || evt.name.startsWith("question_")
    if (eventCategoryFilter === "course") return evt.name.startsWith("course_") || evt.name.startsWith("lecture_")
    if (eventCategoryFilter === "admin") return evt.name.startsWith("admin_") || evt.name.startsWith("user_")
    return true
  })

  // Format minutes into hours + mins
  const formatStudyTime = (minutes: number) => {
    if (!minutes || minutes < 60) return `${minutes || 0} ${tr("mins", "دقيقة")}`
    const hrs = Math.floor(minutes / 60)
    const remMins = minutes % 60
    return `${hrs}h ${remMins}m`
  }

  // TimeSeries Chart Max Value Helper
  const chartPoints = data.timeSeries || []
  const maxChartVal = Math.max(
    ...chartPoints.map((p) => Math.max(p.pageviews, p.videoPlays, p.quizSubmissions)),
    5
  )

  const totalDeviceViews =
    (data.deviceStats?.mobile || 0) +
    (data.deviceStats?.desktop || 0) +
    (data.deviceStats?.tablet || 0) || 1

  const totalLocaleViews =
    (data.localeStats?.ar || 0) + (data.localeStats?.en || 0) || 1

  const totalScoreSubmissions =
    (data.scoreDistribution?.tier90_100 || 0) +
    (data.scoreDistribution?.tier70_89 || 0) +
    (data.scoreDistribution?.tier50_69 || 0) +
    (data.scoreDistribution?.tier0_49 || 0) || 1

  const insightsList = data.insights || []
  const currentInsight = insightsList[activeInsightIndex] || insightsList[0]

  return (
    <div className="space-y-6 sm:space-y-8 relative" dir={isAr ? "rtl" : "ltr"}>
      {/* ─── TOP BAR & CONTROLS ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:gap-5 rounded-3xl border border-border/80 bg-card/90 p-5 sm:p-7 shadow-sm backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="size-10 grid place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Activity className="size-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {tr("Platform Insights & Telemetry", "تحليلات المنصة ومؤشرات الأداء")}
            </h2>
            <Badge variant="default" className="gap-1.5 font-bold bg-emerald-600 dark:bg-emerald-500 text-white text-[11px] rounded-full px-3">
              <Database className="size-3" />
              <span>{tr("Supabase Native", "تحليلات Supabase")}</span>
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
            {tr(
              "Zero external tracking APIs. High-performance learning analytics, student drop-off metrics, and score distributions recorded directly in PostgreSQL.",
              "بدون أي أدوات تتبع خارجية. تحليلات تعلم دقيقة، ومعدلات إكمال المحاضرات، وتوزيع درجات الاختبارات مسجلة مباشرة في قاعدة بيانات Supabase."
            )}
          </p>
        </div>

        {/* Time Range Selector & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <div className="grid grid-cols-4 sm:flex rounded-2xl border border-border/80 bg-muted/50 p-1 w-full sm:w-auto">
            {(
              [
                ["today", tr("Today", "اليوم")],
                ["7d", tr("7 Days", "٧ أيام")],
                ["30d", tr("30 Days", "٣٠ يوم")],
                ["all", tr("All", "الكل")],
              ] as [TimeRange, string][]
            ).map(([range, label]) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "ghost"}
                size="sm"
                className="h-8 rounded-xl px-3 text-xs font-bold"
                onClick={() => setTimeRange(range)}
                disabled={loading}
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {insightsList.length > 0 && (
              <Button
                variant={isInsightsOpen ? "default" : "outline"}
                size="sm"
                className="h-9 gap-1.5 text-xs font-bold rounded-full px-3.5 flex-1 sm:flex-initial"
                onClick={() => setIsInsightsOpen(!isInsightsOpen)}
              >
                <Zap className="size-3.5" />
                <span>{tr("Suggestions", "المقترحات")}</span>
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4 font-mono font-bold">
                  {insightsList.length}
                </Badge>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs font-bold rounded-full px-3.5 flex-1 sm:flex-initial"
              onClick={fetchAnalytics}
              disabled={loading}
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{tr("Refresh", "تحديث")}</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="h-9 gap-1.5 text-xs font-bold rounded-full px-3.5 flex-1 sm:flex-initial"
              onClick={handleExportCSV}
              disabled={loading}
            >
              <Download className="size-3.5" />
              <span>{tr("Export CSV", "تصدير CSV")}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── PRIMARY KPI CARDS (5 METRICS) ────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {/* 1. Unique Learners / Visitors */}
        <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="size-11 grid place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                <Users className="size-5" />
              </div>
              <Badge variant="outline" className="gap-1 text-[10px] font-mono shrink-0 rounded-full px-2">
                <Clock className="size-2.5 shrink-0" />
                <span>{timeRange.toUpperCase()}</span>
              </Badge>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                {tr("Active Learners", "الطلاب والزوار")}
              </p>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-foreground font-mono">
                {loading ? (
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                ) : (
                  data.stats.uniqueVisitors.toLocaleString()
                )}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground truncate font-medium">
                {data.stats.pageviews.toLocaleString()} {tr("pageviews", "مشاهدة صفحة")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. Estimated Learning Delivered */}
        <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="size-11 grid place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                <TrendingUp className="size-5" />
              </div>
              <Badge variant="outline" className="border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] shrink-0 rounded-full px-2">
                <span>{tr("Study Time", "ساعات التعلم")}</span>
              </Badge>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                {tr("Learning Delivered", "وقت التعلم")}
              </p>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-foreground font-mono">
                {loading ? (
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                ) : (
                  formatStudyTime(data.stats.estimatedStudyMinutes || 0)
                )}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground truncate font-medium">
                {courses.length} {tr("courses published", "مقرر منشور")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. Video Sessions & Completion */}
        <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="size-11 grid place-items-center rounded-2xl bg-teal-500/10 text-teal-600 border border-teal-500/20 shrink-0">
                <Video className="size-5" />
              </div>
              <Badge variant="outline" className="gap-1 border-teal-500/30 text-teal-600 dark:text-teal-400 font-bold text-[10px] shrink-0 rounded-full px-2">
                <span>{data.retention?.completionRate ?? 0}% {tr("completed", "إكمال")}</span>
              </Badge>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                {tr("Video Sessions", "تشغيل المحاضرات")}
              </p>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-foreground font-mono">
                {loading ? (
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                ) : (
                  data.stats.videoPlays.toLocaleString()
                )}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground truncate font-medium">
                {data.stats.videoCompletions.toLocaleString()} {tr("fully completed", "مكتملة بالكامل")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 4. Quiz Mastery & Pass Rate */}
        <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="size-11 grid place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <Award className="size-5" />
              </div>
              <Badge
                variant="outline"
                className="gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] shrink-0 rounded-full px-2"
              >
                <CheckCircle2 className="size-2.5 shrink-0" />
                <span>{data.stats.quizPassRate}%</span>
              </Badge>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                {tr("Quiz Submissions", "تسليم الاختبارات")}
              </p>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-foreground font-mono">
                {loading ? (
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                ) : (
                  data.stats.quizSubmissions.toLocaleString()
                )}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground truncate font-medium">
                {data.stats.avgQuizScore}% {tr("avg score", "متوسط الدرجة")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 5. Community Q&A Resolution */}
        <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm hover:shadow-md transition-all col-span-2 md:col-span-1">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="size-11 grid place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                <MessageCircle className="size-5" />
              </div>
              {unansweredQuestionsCount > 0 ? (
                <Badge variant="destructive" className="text-[10px] font-bold shrink-0 rounded-full px-2.5">
                  <span>{unansweredQuestionsCount} {tr("Pending", "معلق")}</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 font-bold text-[10px] shrink-0 rounded-full px-2">
                  <CheckCircle2 className="size-2.5 shrink-0" />
                  <span>{tr("All Resolved", "مكتمل")}</span>
                </Badge>
              )}
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                {tr("Student Inquiries", "استفسارات الطلاب")}
              </p>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-foreground font-mono">
                {unansweredQuestionsCount === 0
                  ? "100%"
                  : `${Math.max(0, 100 - unansweredQuestionsCount * 10)}%`}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground truncate font-medium">
                {unansweredQuestionsCount === 0
                  ? tr("No pending questions", "لا توجد أسئلة معلقة")
                  : `${unansweredQuestionsCount} ${tr("awaiting reply", "بانتظار الرد")}`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── TIME-SERIES ACTIVITY TREND CHART ────────────────────────────── */}
      <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/60 p-6 pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base sm:text-lg font-black text-foreground">
                  {tr("Learning Activity & Engagement Trends", "مؤشرات وتدفق النشاط التعليمي عبر الوقت")}
                </CardTitle>
                {activeHoverPoint && (
                  <Badge variant="secondary" className="text-xs font-mono font-bold">
                    {activeHoverPoint.label}: {activeHoverPoint.pageviews}v, {activeHoverPoint.videoPlays}p, {activeHoverPoint.quizSubmissions}q
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {tr(
                  "Visual comparison of page explorations, lecture videos started, and quizzes submitted across the selected timeframe.",
                  "مقارنة بيانية لمشاهدات المقررات وتشغيل محاضرات الفيديو وتسليمات الاختبارات عبر الفترة الزمنية المحددة."
                )}
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-primary" />
                <span>{tr("Views", "المشاهدات")}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[#6AA6B8]" />
                <span>{tr("Videos", "الفيديو")}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                <span>{tr("Quizzes", "الاختبارات")}</span>
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {chartPoints.length > 0 ? (
            <div className="space-y-2">
              <div className="h-44 sm:h-52 w-full flex items-end gap-2 sm:gap-3 pt-6 pb-2 border-b border-border/60">
                {chartPoints.map((pt) => {
                  const viewPct = Math.min(100, Math.round((pt.pageviews / maxChartVal) * 100))
                  const videoPct = Math.min(100, Math.round((pt.videoPlays / maxChartVal) * 100))
                  const quizPct = Math.min(100, Math.round((pt.quizSubmissions / maxChartVal) * 100))

                  return (
                    <div
                      key={pt.key}
                      className="group relative flex-1 h-full flex flex-col justify-end items-center cursor-pointer"
                      onMouseEnter={() => setActiveHoverPoint(pt)}
                      onMouseLeave={() => setActiveHoverPoint(null)}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                        <div className="rounded-xl border border-border/80 bg-popover px-3 py-1.5 text-[10px] font-bold text-popover-foreground shadow-lg whitespace-nowrap">
                          {pt.label} · {pt.pageviews}v / {pt.videoPlays}p / {pt.quizSubmissions}q
                        </div>
                      </div>

                      {/* Stacked/Clustered Bars */}
                      <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                        {/* Pageviews bar */}
                        <div
                          className="w-1/3 min-w-[4px] max-w-[14px] bg-primary/70 group-hover:bg-primary rounded-t-md transition-all shadow-xs"
                          style={{ height: pt.pageviews > 0 ? `${Math.max(viewPct, 5)}%` : "0%" }}
                        />
                        {/* Video plays bar */}
                        <div
                          className="w-1/3 min-w-[4px] max-w-[14px] bg-[#6AA6B8]/70 group-hover:bg-[#6AA6B8] rounded-t-md transition-all shadow-xs"
                          style={{ height: pt.videoPlays > 0 ? `${Math.max(videoPct, 5)}%` : "0%" }}
                        />
                        {/* Quiz submissions bar */}
                        <div
                          className="w-1/3 min-w-[4px] max-w-[14px] bg-emerald-500/70 group-hover:bg-emerald-500 rounded-t-md transition-all shadow-xs"
                          style={{ height: pt.quizSubmissions > 0 ? `${Math.max(quizPct, 5)}%` : "0%" }}
                        />
                      </div>

                      <span className="mt-2 text-[10px] font-mono text-muted-foreground truncate w-full text-center">
                        {pt.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="grid min-h-36 place-items-center rounded-2xl border border-dashed border-border/80 p-6 text-center text-muted-foreground">
              <p className="text-xs font-semibold">
                {tr("No time-series events recorded yet.", "لم يتم تسجيل أحداث زمنية بعد.")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── TWO-COLUMN ANALYTICS & DIAGNOSTICS GRID ──────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN: Video Retention Barometer & Quiz Score Distribution */}
        <div className="space-y-6">
          {/* 1. Video Retention & Milestone Barometer */}
          <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/60 p-5 pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm sm:text-base font-black text-foreground">
                    {tr("Video Retention & Milestone Barometer", "مقياس استمرارية مشاهدة المحاضرات")}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {tr("Drop-off analysis at each quarter of the video.", "معدل استمرار الطلاب خلال أرباع المحاضرة.")}
                  </p>
                </div>
                <Badge variant="outline" className="font-mono text-xs text-primary font-bold rounded-full px-2.5">
                  {data.retention?.completionRate ?? 0}% {tr("Complete", "إكمال")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              {[
                { label: tr("Start (0%)", "البداية (٠٪)"), count: data.stats.videoPlays, pct: data.stats.videoPlays > 0 ? 100 : 0, color: "bg-primary" },
                { label: tr("Quarter (25%)", "الربع الأول (٢٥٪)"), count: data.retention?.p25 || 0, pct: data.stats.videoPlays > 0 ? Math.round(((data.retention?.p25 || 0) / data.stats.videoPlays) * 100) : 0, color: "bg-[#6AA6B8]" },
                { label: tr("Midpoint (50%)", "منتصف المحاضرة (٥٠٪)"), count: data.retention?.p50 || 0, pct: data.stats.videoPlays > 0 ? Math.round(((data.retention?.p50 || 0) / data.stats.videoPlays) * 100) : 0, color: "bg-[#8BCDE1]" },
                { label: tr("Full Completion (100%)", "الإكمال التام (١٠٠٪)"), count: data.stats.videoCompletions, pct: data.retention?.completionRate || 0, color: "bg-emerald-500" },
              ].map((m) => (
                <div key={m.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-bold text-foreground">{m.label}</span>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-muted-foreground">{m.count.toLocaleString()}</span>
                      <span className="font-bold w-10 text-end text-primary">{m.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className={`h-full rounded-full transition-all duration-500 ${m.color}`} style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 2. Quiz Score Mastery Distribution Tiers */}
          <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/60 p-5 pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm sm:text-base font-black text-foreground">
                    {tr("Quiz Score Mastery Distribution", "توزيع مستويات إتقان ودرجات الاختبارات")}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {tr("Student score tiers across all completed quizzes.", "تصنيف أداء الطلاب حسب الشرائح المئوية للدرجات.")}
                  </p>
                </div>
                <Badge variant="secondary" className="font-mono text-xs font-bold rounded-full px-2.5">
                  {data.stats.quizSubmissions} {tr("Submissions", "تسليم")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-3.5">
              {[
                {
                  icon: Award,
                  iconColor: "text-amber-500",
                  label: tr("Mastery (90–100%)", "إتقان تام (٩٠–١٠٠٪)"),
                  count: data.scoreDistribution?.tier90_100 || 0,
                  pct: Math.round(((data.scoreDistribution?.tier90_100 || 0) / totalScoreSubmissions) * 100),
                  color: "bg-emerald-500",
                },
                {
                  icon: CheckCircle2,
                  iconColor: "text-emerald-500",
                  label: tr("Satisfactory (70–89%)", "نجاح جيد (٧٠–٨٩٪)"),
                  count: data.scoreDistribution?.tier70_89 || 0,
                  pct: Math.round(((data.scoreDistribution?.tier70_89 || 0) / totalScoreSubmissions) * 100),
                  color: "bg-primary",
                },
                {
                  icon: Clock,
                  iconColor: "text-amber-500",
                  label: tr("Near Pass (50–69%)", "محاولة قريبة (٥٠–٦٩٪)"),
                  count: data.scoreDistribution?.tier50_69 || 0,
                  pct: Math.round(((data.scoreDistribution?.tier50_69 || 0) / totalScoreSubmissions) * 100),
                  color: "bg-amber-500",
                },
                {
                  icon: AlertTriangle,
                  iconColor: "text-destructive",
                  label: tr("Needs Review (< 50%)", "بحاجة لإعادة مراجعة (< ٥٠٪)"),
                  count: data.scoreDistribution?.tier0_49 || 0,
                  pct: Math.round(((data.scoreDistribution?.tier0_49 || 0) / totalScoreSubmissions) * 100),
                  color: "bg-destructive",
                },
              ].map((tier) => (
                <div key={tier.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{tier.label}</span>
                    <span className="font-mono text-muted-foreground">{tier.count} ({tier.pct}%)</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className={`h-full rounded-full transition-all duration-500 ${tier.color}`} style={{ width: `${tier.pct}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Top Courses, Lecture Drop-off, Device & Locale */}
        <div className="space-y-6">
          {/* 1. Top Courses */}
          <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/60 p-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base font-black text-foreground">
                  {tr("Top Viewed Courses", "أعلى المقررات مشاهدة")}
                </CardTitle>
                <Badge variant="secondary" className="text-xs font-mono font-bold">
                  {courses.length} {tr("Available", "متاح")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-border/60 p-0">
              {data.topCourses.length > 0 ? (
                data.topCourses.map((course, idx) => (
                  <div
                    key={course.title + idx}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-black text-primary">
                        #{idx + 1}
                      </span>
                      <span className="truncate font-bold text-xs sm:text-sm text-foreground">
                        {course.title}
                      </span>
                    </div>
                    <Badge variant="outline" className="font-mono text-[11px] shrink-0 font-bold">
                      {course.views.toLocaleString()} {tr("views", "مشاهدة")}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  {tr("No course view events recorded.", "لم يتم تسجيل مشاهدات مقررات بعد.")}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Top Lectures with Friction Analysis */}
          <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/60 p-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base font-black text-foreground">
                  {tr("Lecture Retention & Drop-off Diagnostics", "تشخيص استمرارية المحاضرات")}
                </CardTitle>
                <Badge variant="secondary" className="text-xs font-mono font-bold">
                  {lectures.length} {tr("Lectures", "محاضرة")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-border/60 p-0">
              {data.topLectures.length > 0 ? (
                data.topLectures.map((lecture, idx) => (
                  <div
                    key={lecture.title + idx}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-[#6AA6B8]/15 text-xs font-black text-[#6AA6B8]">
                        #{idx + 1}
                      </span>
                      <span className="truncate font-bold text-xs sm:text-sm text-foreground">
                        {lecture.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="font-mono text-[11px] font-bold">
                        {lecture.views.toLocaleString()} {tr("views", "مشاهدة")}
                      </Badge>
                      {lecture.dropoffRate !== undefined && (
                        <Badge
                          variant={lecture.dropoffRate > 50 ? "destructive" : "secondary"}
                          className="font-mono text-[10px] font-bold"
                        >
                          {lecture.dropoffRate}% {tr("drop-off", "توقف")}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  {tr("No lecture view events recorded.", "لم يتم تسجيل مشاهدات محاضرات بعد.")}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Learner Demographics: Device Split & Language */}
          <div className="grid grid-cols-2 gap-4">
            {/* Device Demographics */}
            <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm overflow-hidden">
              <CardHeader className="p-4 pb-2 border-b border-border/60">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Monitor className="size-3.5 text-primary" />
                  <span>{tr("Device Breakdown", "الأجهزة")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5"><Smartphone className="size-3.5 text-muted-foreground" /> {tr("Mobile", "هاتف")}</span>
                  <span className="font-mono text-primary">{Math.round(((data.deviceStats?.mobile || 0) / totalDeviceViews) * 100)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5"><Monitor className="size-3.5 text-muted-foreground" /> {tr("Desktop", "حاسوب")}</span>
                  <span className="font-mono text-primary">{Math.round(((data.deviceStats?.desktop || 0) / totalDeviceViews) * 100)}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Language Demographics */}
            <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm overflow-hidden">
              <CardHeader className="p-4 pb-2 border-b border-border/60">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Globe className="size-3.5 text-primary" />
                  <span>{tr("Language Split", "اللغة")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{tr("Arabic (العربية)", "العربية")}</span>
                  <span className="font-mono text-primary">{Math.round(((data.localeStats?.ar || 0) / totalLocaleViews) * 100)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{tr("English", "الإنجليزية")}</span>
                  <span className="font-mono text-primary">{Math.round(((data.localeStats?.en || 0) / totalLocaleViews) * 100)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ─── REAL-TIME LIVE EVENT TELEMETRY STREAM ───────────────────────── */}
      <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/60 p-6 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className={`size-3 rounded-full ${isLivePaused ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
                <CardTitle className="text-base sm:text-lg font-black text-foreground">
                  {tr("Live Event Telemetry Stream", "شريط الأحداث المباشر")}
                </CardTitle>
                <Badge variant="secondary" className="text-xs font-mono font-bold">
                  {filteredEvents.length}
                </Badge>
              </div>
            </div>

            {/* Stream Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Category Filter Pills */}
              <div className="flex overflow-x-auto rounded-2xl border border-border/80 bg-muted/40 p-1 text-xs scrollbar-none snap-x w-full sm:w-auto">
                {(
                  [
                    ["all", tr("All", "الكل")],
                    ["video", tr("Videos", "فيديو")],
                    ["quiz", tr("Quizzes", "اختبارات")],
                    ["course", tr("Courses", "مقررات")],
                    ["admin", tr("Admin", "إدارة")],
                  ] as [EventFilterCategory, string][]
                ).map(([cat, label]) => (
                  <button
                    key={cat}
                    onClick={() => setEventCategoryFilter(cat)}
                    className={`flex-1 sm:flex-initial px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[30px] ${
                      eventCategoryFilter === cat
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLivePaused(!isLivePaused)}
                  className="h-9 rounded-full px-3.5 gap-1.5 text-xs font-bold flex-1 sm:flex-initial"
                >
                  {isLivePaused ? <Play className="size-3 text-emerald-600" /> : <Pause className="size-3" />}
                  <span>{isLivePaused ? tr("Resume", "استئناف") : tr("Pause", "إيقاف")}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={triggerSampleTestEvent}
                  className="h-9 rounded-full px-3.5 gap-1.5 text-xs font-bold flex-1 sm:flex-initial"
                >
                  <Zap className="size-3 text-primary" />
                  <span>{tr("Ping", "نبضة")}</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((evt) => {
                const isVideo = evt.name.startsWith("video_")
                const isQuiz =
                  evt.name.startsWith("quiz_") || evt.name.startsWith("question_")
                const isCourse =
                  evt.name.startsWith("course_") || evt.name.startsWith("lecture_")
                const isAdmin = evt.name.startsWith("admin_") || evt.name.startsWith("user_")

                const badgeColor = isVideo
                  ? "bg-[#6AA6B8]/15 text-[#6AA6B8] border-[#6AA6B8]/30"
                  : isQuiz
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : isCourse
                  ? "bg-primary/10 text-primary border-primary/30"
                  : isAdmin
                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                  : "bg-muted text-muted-foreground"

                const rawTitle =
                  evt.properties?.course_title ||
                  evt.properties?.lecture_title ||
                  evt.properties?.quiz_title ||
                  evt.properties?.entity_type ||
                  (evt.properties
                    ? Object.entries(evt.properties)
                        .slice(0, 2)
                        .map(([k, v]) => `${k}: ${String(v)}`)
                        .join(", ")
                    : "")

                const eventDetail =
                  typeof rawTitle === "string"
                    ? rawTitle
                    : String(rawTitle || "")

                return (
                  <div
                    key={evt.id}
                    className="flex flex-col gap-1.5 rounded-2xl border border-border/70 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Badge
                        variant="outline"
                        className={`shrink-0 font-mono text-[10px] sm:text-[11px] font-bold rounded-lg ${badgeColor}`}
                      >
                        {evt.name}
                      </Badge>
                      <span className="truncate text-xs font-bold text-foreground">
                        {eventDetail}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] sm:text-[11px] text-muted-foreground font-semibold">
                      {new Date(evt.timestamp).toLocaleTimeString(
                        isAr ? "ar-EG" : "en-US"
                      )}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="grid min-h-32 place-items-center rounded-2xl border border-dashed border-border/80 p-6 text-center text-muted-foreground">
                <div>
                  <Activity className="mx-auto size-8 opacity-40" />
                  <p className="mt-2 text-xs font-bold">
                    {tr(
                      "Awaiting real-time telemetry events...",
                      "بانتظار الأحداث التلقائية المباشرة..."
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── FLOATING BOTTOM RECOMMENDATIONS POPUP ────────────────────────── */}
      {insightsList.length > 0 && (
        <>
          {isInsightsOpen ? (
            <div
              className="fixed bottom-5 end-5 z-50 w-[calc(100vw-2.5rem)] sm:w-[420px] rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl p-5 space-y-3.5 animate-in slide-in-from-bottom-5 fade-in duration-300"
              dir={isAr ? "rtl" : "ltr"}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 grid place-items-center rounded-xl bg-primary/10 text-primary">
                    <Zap className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-foreground">
                      {tr("Pedagogical Suggestions", "المقترحات والتوصيات التعليمية")}
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono font-bold">
                      {activeInsightIndex + 1} {tr("of", "من")} {insightsList.length}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Step controls if > 1 */}
                  {insightsList.length > 1 && (
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          setActiveInsightIndex(
                            (prev) => (prev - 1 + insightsList.length) % insightsList.length
                          )
                        }
                        aria-label="Previous insight"
                      >
                        {isAr ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          setActiveInsightIndex((prev) => (prev + 1) % insightsList.length)
                        }
                        aria-label="Next insight"
                      >
                        {isAr ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                      </Button>
                    </div>
                  )}

                  {/* Dismiss / Close Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => setIsInsightsOpen(false)}
                    aria-label="Close suggestions popup"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Current Insight Body */}
              {currentInsight && (
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-xl mt-0.5 ${
                        currentInsight.type === "success"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : currentInsight.type === "warning"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-primary/15 text-primary"
                      }`}
                    >
                      {currentInsight.type === "success" ? (
                        <CheckCircle2 className="size-4" />
                      ) : currentInsight.type === "warning" ? (
                        <AlertTriangle className="size-4" />
                      ) : (
                        <Info className="size-4" />
                      )}
                    </span>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-foreground truncate">
                          {isAr ? currentInsight.title_ar : currentInsight.title}
                        </p>
                        {currentInsight.metric && (
                          <Badge variant="outline" className="text-[10px] font-mono shrink-0 font-bold rounded-md">
                            {currentInsight.metric}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {isAr ? currentInsight.description_ar : currentInsight.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Button */}
              <div className="flex items-center justify-between pt-2.5 border-t border-border/60 text-xs">
                <span className="text-[10px] text-muted-foreground">
                  {tr("Rule-based automated insights", "تحليلات واقتراحات آلية")}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs font-bold text-muted-foreground hover:text-foreground rounded-full px-3"
                  onClick={() => setIsInsightsOpen(false)}
                >
                  {tr("Dismiss", "إخفاء")}
                </Button>
              </div>
            </div>
          ) : (
            /* Minimized Floating Trigger Button */
            <button
              onClick={() => setIsInsightsOpen(true)}
              className="fixed bottom-5 end-5 z-40 flex items-center gap-2.5 rounded-full border border-border/80 bg-card/95 px-4 py-2.5 text-xs font-bold text-foreground shadow-2xl backdrop-blur-md transition-transform hover:scale-105 active:scale-95 hover:border-primary/50"
            >
              <Zap className="size-4 text-primary animate-pulse" />
              <span>{tr("Suggestions", "المقترحات")}</span>
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4 font-mono font-bold">
                {insightsList.length}
              </Badge>
            </button>
          )}
        </>
      )}
    </div>
  )
}
