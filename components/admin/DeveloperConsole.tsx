import { useState, useEffect, useMemo } from "react"
import {
  FiActivity as Activity,
  FiAlertTriangle as AlertTriangle,
  FiBookOpen as BookOpen,
  FiCheckCircle as CheckCircle2,
  FiCode as Code,
  FiCompass as Compass,
  FiCopy as Copy,
  FiDownload as Download,
  FiEye as Eye,
  FiKey as Key,
  FiLock as LockKeyhole,
  FiPause as Pause,
  FiPlay as Play,
  FiRefreshCw as RefreshCw,
  FiSearch as Search,
  FiServer as Server,
  FiShield as ShieldCheck,
  FiTerminal as Terminal,
  FiTrash2 as Trash2,
  FiX as X,
  FiZap as Zap,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabaseClient"
import {
  getRecentEvents,
  subscribeToEvents,
  type AnalyticsEvent,
} from "@/lib/analytics"
import type { SiteContent, MaintenanceModeConfig } from "@/lib/siteContent"
import type { Course, Lecture, Question, Quiz } from "@/types"

export type DevSubTab = "logs" | "system" | "maintenance"

interface DeveloperConsoleProps {
  isAr: boolean
  subTab?: DevSubTab
  siteContent: SiteContent
  onSaveSiteContent: (content: SiteContent) => Promise<void>
  courses: Course[]
  lectures: Lecture[]
  quizzes: Quiz[]
  questions: Question[]
}

export default function DeveloperConsole({
  isAr,
  subTab = "logs",
  siteContent,
  onSaveSiteContent,
  courses,
  lectures,
  quizzes,
  questions,
}: DeveloperConsoleProps) {
  const tr = (en: string, ar: string) => (isAr ? ar : en)

  // ─── LOGS STATE ──────────────────────────────────────────────────────────
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [liveStreamActive, setLiveStreamActive] = useState(true)
  const [logCategory, setLogCategory] = useState<"all" | "nav" | "auth" | "curriculum" | "errors">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<AnalyticsEvent | null>(null)
  const [copied, setCopied] = useState(false)

  // ─── SYSTEM TELEMETRY STATE ──────────────────────────────────────────────
  const [pingMs, setPingMs] = useState<number | null>(null)
  const [testingPing, setTestingPing] = useState(false)
  const [dbStatus, setDbStatus] = useState<"healthy" | "degraded" | "disconnected">("healthy")
  const [totalEventsCount, setTotalEventsCount] = useState<number>(0)

  // ─── MAINTENANCE STATE ───────────────────────────────────────────────────
  const [maintenanceEnabled, setMaintenanceEnabled] = useState<boolean>(
    siteContent.maintenance_mode?.enabled ?? false
  )
  const [titleEn, setTitleEn] = useState(siteContent.maintenance_mode?.title_en || "Scheduled Platform Maintenance")
  const [titleAr, setTitleAr] = useState(siteContent.maintenance_mode?.title_ar || "أعمال صيانة وتحديث مجدولة")
  const [msgEn, setMsgEn] = useState(
    siteContent.maintenance_mode?.message_en ||
      "PharmaCore is currently undergoing scheduled infrastructure upgrades. We will be back online shortly."
  )
  const [msgAr, setMsgAr] = useState(
    siteContent.maintenance_mode?.message_ar ||
      "تخضع منصة فارما كور حاليًا لأعمال تحسين وتطوير للبنية التحتية. سنعود للعمل قريبًا."
  )
  const [estimatedUntil, setEstimatedUntil] = useState(siteContent.maintenance_mode?.estimated_until || "")
  const [savingMaintenance, setSavingMaintenance] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Initialize event stream and subscribe
  useEffect(() => {
    setEvents(getRecentEvents())

    const unsubscribe = subscribeToEvents((newEvent) => {
      if (liveStreamActive) {
        setEvents((prev) => [newEvent, ...prev.slice(0, 99)])
      }
    })

    return () => {
      unsubscribe()
    }
  }, [liveStreamActive])

  // Run ping test
  const runPingTest = async () => {
    if (!supabase) {
      setDbStatus("disconnected")
      return
    }
    setTestingPing(true)
    const start = performance.now()
    try {
      const { error, count } = await supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
      const elapsed = Math.round(performance.now() - start)
      setPingMs(elapsed)
      if (error) {
        setDbStatus("degraded")
      } else {
        setDbStatus("healthy")
        if (count !== null) setTotalEventsCount(count)
      }
    } catch {
      setDbStatus("disconnected")
      setPingMs(null)
    } finally {
      setTestingPing(false)
    }
  }

  useEffect(() => {
    runPingTest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Category filter
      if (logCategory === "nav") {
        if (!["page_view", "locale_switch", "theme_toggle"].includes(event.name)) return false
      } else if (logCategory === "auth") {
        if (!["login_success", "login_failed", "signup_attempt", "student_provisioned", "user_banned", "logout"].some((k) => event.name.includes(k))) {
          return false
        }
      } else if (logCategory === "curriculum") {
        if (!["video_", "quiz_", "resource_", "course_"].some((k) => event.name.startsWith(k))) {
          return false
        }
      } else if (logCategory === "errors") {
        if (!event.name.includes("error") && !event.name.includes("failed")) return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = event.name.toLowerCase().includes(q)
        const matchId = (event.distinct_id || "").toLowerCase().includes(q)
        const matchUser = (event.user_id || "").toLowerCase().includes(q)
        const matchProps = JSON.stringify(event.properties || {}).toLowerCase().includes(q)
        if (!matchName && !matchId && !matchUser && !matchProps) return false
      }

      return true
    })
  }, [events, logCategory, searchQuery])

  // Export logs to JSON
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(filteredEvents, null, 2)
    const blob = new Blob([jsonStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `pharmacore_logs_${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Export logs to CSV
  const handleExportCSV = () => {
    const headers = ["Timestamp", "Event Name", "User ID", "Distinct ID", "Properties JSON"]
    const rows = filteredEvents.map((e) => [
      `"${e.timestamp}"`,
      `"${e.name}"`,
      `"${e.user_id || "anonymous"}"`,
      `"${e.distinct_id || ""}"`,
      `"${JSON.stringify(e.properties || {}).replace(/"/g, '""')}"`,
    ])
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `pharmacore_logs_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Save Maintenance Settings
  const handleSaveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingMaintenance(true)
    setSavedSuccess(false)
    try {
      const config: MaintenanceModeConfig = {
        enabled: maintenanceEnabled,
        title_en: titleEn,
        title_ar: titleAr,
        message_en: msgEn,
        message_ar: msgAr,
        estimated_until: estimatedUntil.trim() || undefined,
      }
      const updatedSiteContent: SiteContent = {
        ...siteContent,
        maintenance_mode: config,
      }
      await onSaveSiteContent(updatedSiteContent)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 4000)
    } finally {
      setSavingMaintenance(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* ─── 1. LIVE EVENT LOGS VIEW ───────────────────────────────────────── */}
      {subTab === "logs" && (
        <div className="space-y-4">
          {/* Header & Stream Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card border rounded-2xl p-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <Terminal className="size-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                  {tr("Live Event Stream & Log Explorer", "سجل التتبع والأحداث المباشر")}
                </h3>
                <span className="flex size-2 relative ms-1">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      liveStreamActive ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full size-2 ${
                      liveStreamActive ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                </span>
                <Badge variant="secondary" className="badge-nowrap text-xs font-mono font-bold ms-1 shrink-0">
                  {filteredEvents.length} {tr("events", "حدث")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tr(
                  "Real-time telemetry stream capturing client actions, pageviews, video telemetry, and security events.",
                  "تدفق مباشر لبيانات القياس عن بُعد يرصد تفاعلات المستخدمين، والمشاهدات، وأحداث الأمان في المنصة."
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLiveStreamActive(!liveStreamActive)}
                className={`btn-nowrap gap-1.5 text-xs font-bold shadow-xs h-9 shrink-0 ${
                  liveStreamActive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"
                }`}
              >
                {liveStreamActive ? <Pause className="size-3.5 shrink-0" /> : <Play className="size-3.5 shrink-0" />}
                <span>{liveStreamActive ? tr("Pause Stream", "إيقاف مؤقت") : tr("Resume Stream", "استئناف")}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={!filteredEvents.length}
                className="btn-nowrap gap-1.5 text-xs font-bold shadow-xs h-9 shrink-0"
              >
                <Download className="size-3.5 shrink-0" />
                <span>CSV</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJSON}
                disabled={!filteredEvents.length}
                className="btn-nowrap gap-1.5 text-xs font-bold shadow-xs h-9 shrink-0"
              >
                <Code className="size-3.5 shrink-0" />
                <span>JSON</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEvents([])}
                className="size-9 p-0 text-muted-foreground hover:text-destructive shrink-0"
                title={tr("Clear buffer", "مسح السجل المحلي")}
              >
                <Trash2 className="size-3.5 shrink-0" />
              </Button>
            </div>
          </div>

          {/* Sub-Category Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 border rounded-2xl p-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
              <button
                type="button"
                onClick={() => setLogCategory("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  logCategory === "all"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tr("All Events", "جميع الأحداث")}
              </button>
              <button
                type="button"
                onClick={() => setLogCategory("nav")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  logCategory === "nav"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Compass className="size-3.5" />
                <span>{tr("Navigation", "التنقل")}</span>
              </button>
              <button
                type="button"
                onClick={() => setLogCategory("auth")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  logCategory === "auth"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Key className="size-3.5" />
                <span>{tr("Auth & Security", "الأمان والحسابات")}</span>
              </button>
              <button
                type="button"
                onClick={() => setLogCategory("curriculum")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  logCategory === "curriculum"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <BookOpen className="size-3.5" />
                <span>{tr("Curriculum Media", "التعليم والفيديو")}</span>
              </button>
              <button
                type="button"
                onClick={() => setLogCategory("errors")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  logCategory === "errors"
                    ? "bg-rose-500 text-white shadow-2xs"
                    : "text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                }`}
              >
                <AlertTriangle className="size-3.5" />
                <span>{tr("Errors", "الأخطاء")}</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tr("Filter payload, user, distinct_id...", "بحث في البيانات، المستخدم...")}
                className="h-8 ps-8 pe-8 text-xs bg-background"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Event Stream Terminal Box */}
          <div className="rounded-2xl border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto custom-scrollbar max-h-[580px]">
              <table className="w-full text-start text-xs font-mono">
                <thead className="border-b bg-muted/50 text-[11px] font-bold text-muted-foreground uppercase sticky top-0 backdrop-blur-md z-10">
                  <tr>
                    <th className="px-4 py-2.5 text-start w-32">{tr("Time", "الوقت")}</th>
                    <th className="px-4 py-2.5 text-start w-48">{tr("Event Name", "اسم الحدث")}</th>
                    <th className="px-4 py-2.5 text-start w-36">{tr("Visitor / User", "المستخدم")}</th>
                    <th className="px-4 py-2.5 text-start">{tr("Payload Preview", "معاينة البيانات")}</th>
                    <th className="px-4 py-2.5 text-end w-20">{tr("Details", "التفاصيل")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredEvents.map((evt) => {
                    const isError = evt.name.includes("error") || evt.name.includes("failed")
                    const isAuth = evt.name.includes("login") || evt.name.includes("signup") || evt.name.includes("provision")
                    const isVideo = evt.name.startsWith("video_")
                    const isQuiz = evt.name.startsWith("quiz_")

                    const timeStr = new Date(evt.timestamp).toLocaleTimeString(isAr ? "ar-EG" : "en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })

                    return (
                      <tr
                        key={evt.id}
                        className={`hover:bg-muted/30 transition-colors ${
                          isError ? "bg-rose-500/5 text-rose-600 dark:text-rose-300" : ""
                        }`}
                      >
                        <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{timeStr}</td>
                        <td className="px-4 py-2.5 font-bold whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] ${
                              isError
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                : isAuth
                                ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                                : isVideo
                                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                : isQuiz
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            {evt.name}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[140px]">
                          {evt.user_id ? (
                            <span className="text-primary font-bold">User:{evt.user_id.slice(0, 8)}</span>
                          ) : (
                            <span className="text-muted-foreground/70">{evt.distinct_id ? evt.distinct_id.slice(0, 10) : "anon"}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground truncate max-w-md font-sans">
                          {JSON.stringify(evt.properties || {})}
                        </td>
                        <td className="px-4 py-2.5 text-end whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEvent(evt)}
                            className="h-7 px-2 text-[11px] gap-1 font-sans"
                          >
                            <Eye className="size-3" />
                            <span>{tr("Inspect", "فحص")}</span>
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {!filteredEvents.length && (
                <div className="py-16 text-center text-muted-foreground">
                  <Terminal className="mx-auto size-8 opacity-40" />
                  <p className="mt-2 text-xs font-bold font-sans">
                    {tr("No events captured yet", "لم يتم التقاط أحداث تطابق التصفية")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. SYSTEM HEALTH & DIAGNOSTICS VIEW ───────────────────────────── */}
      {subTab === "system" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card border rounded-2xl p-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <Server className="size-5 text-primary" />
                <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                  {tr("System Diagnostics & Telemetry", "فحص النظام والبيئة التشغيلية")}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tr(
                  "Infrastructure health, database latency benchmarks, real-time connectivity, and entity metrics.",
                  "مؤشرات صحة البنية التحتية، وزمن استجابة قاعدة البيانات، وعدد السجلات عبر المنصة."
                )}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={runPingTest}
              disabled={testingPing}
              className="gap-1.5 text-xs font-bold shadow-xs h-9"
            >
              <RefreshCw className={`size-3.5 ${testingPing ? "animate-spin" : ""}`} />
              <span>{tr("Run Diagnostics Ping", "إعادة فحص الاتصال")}</span>
            </Button>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Latency */}
            <Card className="shadow-none">
              <CardContent className="p-4 sm:p-5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase">{tr("Database Latency", "زمن استجابة DB")}</span>
                  <Zap className="size-4 text-amber-500" />
                </div>
                <p className="text-2xl font-black font-mono">
                  {pingMs !== null ? `${pingMs}ms` : "-"}
                </p>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold ${
                    dbStatus === "healthy"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  }`}
                >
                  {dbStatus === "healthy" ? tr("Optimal (<200ms)", "استجابة ممتازة") : tr("Degraded", "استجابة منخفضة")}
                </Badge>
              </CardContent>
            </Card>

            {/* Supabase Status */}
            <Card className="shadow-none">
              <CardContent className="p-4 sm:p-5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase">{tr("Database Engine", "قاعدة البيانات")}</span>
                  <Server className="size-4 text-primary" />
                </div>
                <p className="text-lg font-black truncate">Supabase Postgres</p>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                  <CheckCircle2 className="size-3.5" />
                  <span>{tr("Connected & Active", "متصل ومتاح")}</span>
                </div>
              </CardContent>
            </Card>

            {/* Realtime Stream */}
            <Card className="shadow-none">
              <CardContent className="p-4 sm:p-5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase">{tr("Realtime WebSocket", "تدفق WebSocket")}</span>
                  <Activity className="size-4 text-purple-500" />
                </div>
                <p className="text-lg font-black truncate">Supabase Realtime</p>
                <span className="inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-purple-500/15 text-purple-600 dark:text-purple-400">
                  Channel Subscribed
                </span>
              </CardContent>
            </Card>

            {/* Telemetry Events Recorded */}
            <Card className="shadow-none">
              <CardContent className="p-4 sm:p-5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase">{tr("Total Logged Events", "إجمالي الأحداث")}</span>
                  <Terminal className="size-4 text-primary" />
                </div>
                <p className="text-2xl font-black font-mono">{totalEventsCount || events.length}</p>
                <p className="text-[10px] text-muted-foreground">{tr("Captured in database", "مسجلة في قاعدة البيانات")}</p>
              </CardContent>
            </Card>
          </div>

          {/* Database Entity Counter Table */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">
                {tr("Entity Inventory & Platform Metrics", "إحصائيات جداول المنصة")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs font-mono">
                <div className="p-3 rounded-xl border bg-muted/20 flex items-center justify-between">
                  <span className="text-muted-foreground font-sans font-semibold">{tr("Published Courses", "المقررات")}</span>
                  <span className="text-base font-bold">{courses.length}</span>
                </div>
                <div className="p-3 rounded-xl border bg-muted/20 flex items-center justify-between">
                  <span className="text-muted-foreground font-sans font-semibold">{tr("Lecture Videos", "المحاضرات")}</span>
                  <span className="text-base font-bold">{lectures.length}</span>
                </div>
                <div className="p-3 rounded-xl border bg-muted/20 flex items-center justify-between">
                  <span className="text-muted-foreground font-sans font-semibold">{tr("Quizzes & MCQs", "الاختبارات")}</span>
                  <span className="text-base font-bold">{quizzes.length}</span>
                </div>
                <div className="p-3 rounded-xl border bg-muted/20 flex items-center justify-between">
                  <span className="text-muted-foreground font-sans font-semibold">{tr("Question Items", "الأسئلة")}</span>
                  <span className="text-base font-bold">{questions.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── 3. MAINTENANCE MODE CONTROLLER VIEW ───────────────────────────── */}
      {subTab === "maintenance" && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-card border rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-2">
              <LockKeyhole className="size-5 text-amber-500" />
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                {tr("Maintenance Mode & Platform Lock", "وضع الصيانة والتحديث العام")}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tr(
                "When enabled, general visitors and students are blocked and presented with the maintenance screen. Staff & administrators can bypass and access /admin normally.",
                "عند تفعيل هذا الوضع، يُحظر وصول الزوار والطلاب وتظهر شاشة الصيانة، بينما يحتفظ الكادر والإدارة بالوصول الكامل للوحة التحكم."
              )}
            </p>
          </div>

          {savedSuccess && (
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span>{tr("Maintenance settings updated successfully!", "تم حفظ وتطبيق إعدادات الصيانة بنجاح!")}</span>
            </div>
          )}

          <form onSubmit={handleSaveMaintenance} className="space-y-6">
            {/* Toggle Card */}
            <Card className={`shadow-none border-2 transition-all ${maintenanceEnabled ? "border-amber-500 bg-amber-500/5" : ""}`}>
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base">
                      {tr("Global Maintenance Mode", "تفعيل وضع الصيانة العام")}
                    </span>
                    <Badge
                      className={
                        maintenanceEnabled
                          ? "bg-amber-500 text-white font-bold"
                          : "bg-muted text-muted-foreground font-bold"
                      }
                    >
                      {maintenanceEnabled ? tr("ACTIVE / ON", "مفعل") : tr("INACTIVE / OFF", "معطل")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tr(
                      "Block public learners and direct them to the maintenance page.",
                      "حظر وصول الطلاب والزوار وتوجيههم لشاشة الصيانة والتحديث."
                    )}
                  </p>
                </div>

                <input
                  type="checkbox"
                  id="toggle-maintenance"
                  checked={maintenanceEnabled}
                  onChange={(e) => setMaintenanceEnabled(e.target.checked)}
                  className="size-6 rounded-md text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
              </CardContent>
            </Card>

            {/* Custom Messages Card */}
            <Card className="shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">
                  {tr("Maintenance Screen Messages", "نصوص ورسائل شاشة الصيانة")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tr("Customize the headline and explanation shown to learners.", "تخصيص العنوان والرسالة الظاهرة للطلاب عند فتح المنصة.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{tr("Title (English)", "العنوان بالإنجليزية")}</Label>
                    <Input
                      value={titleEn}
                      onChange={(e) => setTitleEn(e.target.value)}
                      placeholder="Scheduled Platform Maintenance"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{tr("Title (Arabic)", "العنوان بالعربية")}</Label>
                    <Input
                      value={titleAr}
                      onChange={(e) => setTitleAr(e.target.value)}
                      placeholder="أعمال صيانة وتحديث مجدولة"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{tr("Message (English)", "الرسالة بالإنجليزية")}</Label>
                    <textarea
                      value={msgEn}
                      onChange={(e) => setMsgEn(e.target.value)}
                      className="w-full min-h-[80px] rounded-xl border bg-background p-3 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{tr("Message (Arabic)", "الرسالة بالعربية")}</Label>
                    <textarea
                      value={msgAr}
                      onChange={(e) => setMsgAr(e.target.value)}
                      className="w-full min-h-[80px] rounded-xl border bg-background p-3 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{tr("Estimated Completion Time (Optional)", "الوقت المتوقع للانتهاء (اختياري)")}</Label>
                  <Input
                    value={estimatedUntil}
                    onChange={(e) => setEstimatedUntil(e.target.value)}
                    placeholder="e.g. 2 hours / 04:00 AM UTC"
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              size="lg"
              disabled={savingMaintenance}
              className="w-full font-bold gap-2 shadow-xs"
            >
              {savingMaintenance ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              <span>{savingMaintenance ? tr("Saving...", "جارٍ الحفظ...") : tr("Apply Maintenance Settings", "تطبيق إعدادات الصيانة")}</span>
            </Button>
          </form>
        </div>
      )}

      {/* ─── INSPECT EVENT JSON MODAL ─────────────────────────────────────── */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
            <DialogHeader>
              <div className="flex items-center justify-between gap-2">
                <DialogTitle className="text-base font-bold font-mono">
                  {selectedEvent.name}
                </DialogTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(selectedEvent, null, 2))}
                  className="gap-1.5 text-xs font-bold h-8"
                >
                  <Copy className="size-3.5" />
                  <span>{copied ? tr("Copied!", "تم النسخ!") : tr("Copy JSON", "نسخ JSON")}</span>
                </Button>
              </div>
              <DialogDescription className="text-xs">
                Timestamp: {selectedEvent.timestamp} | Distinct ID: {selectedEvent.distinct_id || "None"}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border bg-muted/40 p-4 font-mono text-xs overflow-x-auto custom-scrollbar">
              <pre>{JSON.stringify(selectedEvent, null, 2)}</pre>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
