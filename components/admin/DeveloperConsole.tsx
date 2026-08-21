import { useState, useEffect, useMemo } from "react"
import {
  FiActivity as Activity,
  FiAlertTriangle as AlertTriangle,
  FiAward as Award,
  FiBarChart2 as BarChart2,
  FiBookOpen as BookOpen,
  FiCalendar as Calendar,
  FiCheck as Check,
  FiCheckCircle as CheckCircle2,
  FiCheckSquare as CheckSquare,
  FiCode as Code,
  FiCompass as Compass,
  FiCopy as Copy,
  FiCpu as Cpu,
  FiDownload as Download,
  FiEye as Eye,
  FiKey as Key,
  FiLock as LockKeyhole,
  FiMessageSquare as MessageSquare,
  FiPause as Pause,
  FiPlay as Play,
  FiRefreshCw as RefreshCw,
  FiSave as Save,
  FiSearch as Search,
  FiServer as Server,
  FiShield as ShieldCheck,
  FiSliders as Sliders,
  FiTag as Tag,
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
import {
  defaultMarketingBanner,
  type SiteContent,
  type MaintenanceModeConfig,
  type MarketingBannerConfig,
} from "@/lib/siteContent"
import {
  FEATURE_FLAG_DEFINITIONS,
  FEATURE_FLAG_KEYS,
  defaultFeatureFlags,
} from "@/lib/featureFlags"
import type { Course, FeatureFlagsConfig, Lecture, Question, Quiz } from "@/types"
import TopPromoBanner from "@/components/TopPromoBanner"
import LeadMagnetModal from "@/components/LeadMagnetModal"

export type DevSubTab = "logs" | "system" | "flags" | "maintenance" | "marketing"

function safeJsonStringify(val: unknown, space?: number): string {
  try {
    const seen = new WeakSet()
    return JSON.stringify(
      val,
      (key, value) => {
        if (typeof value === "function" || typeof value === "symbol") return undefined
        if (typeof window !== "undefined" && (value instanceof Node || value instanceof Event)) return undefined
        if (typeof key === "string" && (key.startsWith("__react") || key.startsWith("_react"))) return undefined
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) return "[Circular]"
          seen.add(value)
        }
        return value
      },
      space
    )
  } catch {
    return String(val)
  }
}

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

  const [internalSubTab, setInternalSubTab] = useState<DevSubTab>(subTab || "logs")
  useEffect(() => {
    if (subTab) setInternalSubTab(subTab)
  }, [subTab])

  // ─── FEATURE FLAGS STATE ────────────────────────────────────────────────
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagsConfig>(
    siteContent.features || defaultFeatureFlags
  )
  const [savingFlags, setSavingFlags] = useState(false)
  const [flagsSavedSuccess, setFlagsSavedSuccess] = useState(false)

  useEffect(() => {
    if (siteContent.features) {
      setFeatureFlags(siteContent.features)
    }
  }, [siteContent.features])

  const handleToggleFlag = (key: keyof FeatureFlagsConfig) => {
    setFeatureFlags((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleEnableAllFlags = () => {
    setFeatureFlags({
      ai_assistant: true,
      practice_mode: true,
      certificates: true,
      community_qa: true,
      gradebook: true,
    })
  }

  const handleDisableAllFlags = () => {
    setFeatureFlags({
      ai_assistant: false,
      practice_mode: false,
      certificates: false,
      community_qa: false,
      gradebook: false,
    })
  }

  const handleResetDefaultFlags = () => {
    setFeatureFlags(defaultFeatureFlags)
  }

  const handleSaveFeatureFlags = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSavingFlags(true)
    setFlagsSavedSuccess(false)
    try {
      const updatedSiteContent: SiteContent = {
        ...siteContent,
        features: featureFlags,
      }
      await onSaveSiteContent(updatedSiteContent)
      setFlagsSavedSuccess(true)
      setTimeout(() => setFlagsSavedSuccess(false), 4000)
    } finally {
      setSavingFlags(false)
    }
  }

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

  // ─── MARKETING TEST BENCH STATE ──────────────────────────────────────────
  const [testBannerConfig, setTestBannerConfig] = useState<MarketingBannerConfig>(
    siteContent.marketing_banner || defaultMarketingBanner
  )
  const [testLeadMagnetOpen, setTestLeadMagnetOpen] = useState(false)
  const [testClipboardFeedback, setTestClipboardFeedback] = useState(false)
  const [savingMarketingTest, setSavingMarketingTest] = useState(false)
  const [marketingSavedSuccess, setMarketingSavedSuccess] = useState(false)

  useEffect(() => {
    if (siteContent.marketing_banner) {
      setTestBannerConfig(siteContent.marketing_banner)
    }
  }, [siteContent.marketing_banner])

  const setTestExpirationOffset = (hoursFromNow: number) => {
    const target = new Date(Date.now() + hoursFromNow * 3600 * 1000).toISOString()
    setTestBannerConfig((prev) => ({
      ...prev,
      target_date: target,
    }))
  }

  const handleTestCopyCoupon = async () => {
    if (!testBannerConfig.coupon_code) return
    try {
      await navigator.clipboard.writeText(testBannerConfig.coupon_code)
      setTestClipboardFeedback(true)
      setTimeout(() => setTestClipboardFeedback(false), 2500)
    } catch {
      setTestClipboardFeedback(true)
      setTimeout(() => setTestClipboardFeedback(false), 2500)
    }
  }

  const handleSaveMarketingTest = async () => {
    setSavingMarketingTest(true)
    setMarketingSavedSuccess(false)
    try {
      const updatedSiteContent: SiteContent = {
        ...siteContent,
        marketing_banner: testBannerConfig,
      }
      await onSaveSiteContent(updatedSiteContent)
      setMarketingSavedSuccess(true)
      setTimeout(() => setMarketingSavedSuccess(false), 4000)
    } finally {
      setSavingMarketingTest(false)
    }
  }

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
        const matchProps = safeJsonStringify(event.properties || {}).toLowerCase().includes(q)
        if (!matchName && !matchId && !matchUser && !matchProps) return false
      }

      return true
    })
  }, [events, logCategory, searchQuery])

  // Export logs to JSON
  const handleExportJSON = () => {
    const jsonStr = safeJsonStringify(filteredEvents, 2)
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
      `"${safeJsonStringify(e.properties || {}).replace(/"/g, '""')}"`,
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
      {/* Dev Console Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-card/90 border border-border/80 rounded-2xl shadow-xs overflow-x-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => setInternalSubTab("logs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            internalSubTab === "logs"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Terminal className="size-3.5" />
          <span>{tr("Live Logs & Telemetry", "سجل التتبع والأحداث")}</span>
        </button>

        <button
          type="button"
          onClick={() => setInternalSubTab("system")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            internalSubTab === "system"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Server className="size-3.5" />
          <span>{tr("System Diagnostics", "فحص النظام والبيئة")}</span>
        </button>

        <button
          type="button"
          onClick={() => setInternalSubTab("flags")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            internalSubTab === "flags"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Sliders className="size-3.5" />
          <span>{tr("Feature Matrix & Flags", "مصفوفة تفعيل الميزات")}</span>
          <Badge
            variant={Object.values(featureFlags).every(Boolean) ? "outline" : "secondary"}
            className="text-[10px] px-1.5 py-0 font-mono font-bold ms-1"
          >
            {Object.values(featureFlags).filter(Boolean).length}/{FEATURE_FLAG_KEYS.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setInternalSubTab("maintenance")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            internalSubTab === "maintenance"
              ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <LockKeyhole className="size-3.5" />
          <span>{tr("Maintenance Mode", "وضع الصيانة والتحديث")}</span>
          {maintenanceEnabled && (
            <span className="size-2 rounded-full bg-amber-400 animate-pulse ms-1" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setInternalSubTab("marketing")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            internalSubTab === "marketing"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Zap className="size-3.5" />
          <span>{tr("Marketing Test Bench", "منصة اختبار العروض")}</span>
          {testBannerConfig.enabled && (
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse ms-1" />
          )}
        </button>
      </div>

      {/* ─── 1. LIVE EVENT LOGS VIEW ───────────────────────────────────────── */}
      {internalSubTab === "logs" && (
        <div className="space-y-6">
          {/* Header & Stream Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/90 border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm backdrop-blur-xl">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="size-10 grid place-items-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  <Terminal className="size-5" />
                </div>
                <h3 className="text-xl font-black tracking-tight text-foreground">
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
                <Badge variant="secondary" className="text-xs font-mono font-bold ms-1 shrink-0">
                  {filteredEvents.length} {tr("events", "حدث")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
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
                className={`gap-1.5 text-xs font-bold rounded-full h-10 px-4 shrink-0 ${
                  liveStreamActive ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30" : "text-amber-600 border-amber-500/30"
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
                className="gap-1.5 text-xs font-bold rounded-full h-10 px-4 shrink-0"
              >
                <Download className="size-3.5 shrink-0" />
                <span>CSV</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJSON}
                disabled={!filteredEvents.length}
                className="gap-1.5 text-xs font-bold rounded-full h-10 px-4 shrink-0"
              >
                <Code className="size-3.5 shrink-0" />
                <span>JSON</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEvents([])}
                className="size-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                title={tr("Clear buffer", "مسح السجل المحلي")}
              >
                <Trash2 className="size-4 shrink-0" />
              </Button>
            </div>
          </div>

          {/* Sub-Category Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/90 border border-border/80 rounded-3xl p-3.5 shadow-sm">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
              <button
                type="button"
                onClick={() => setLogCategory("all")}
                className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  logCategory === "all"
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tr("All Events", "جميع الأحداث")}
              </button>
              <button
                type="button"
                onClick={() => setLogCategory("nav")}
                className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  logCategory === "nav"
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Compass className="size-3.5" />
                <span>{tr("Navigation", "التنقل")}</span>
              </button>
              <button
                type="button"
                onClick={() => setLogCategory("auth")}
                className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  logCategory === "auth"
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Key className="size-3.5" />
                <span>{tr("Auth & Security", "الأمان والحسابات")}</span>
              </button>
              <button
                type="button"
                onClick={() => setLogCategory("curriculum")}
                className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  logCategory === "curriculum"
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <BookOpen className="size-3.5" />
                <span>{tr("Curriculum Media", "التعليم والفيديو")}</span>
              </button>
              <button
                type="button"
                onClick={() => setLogCategory("errors")}
                className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  logCategory === "errors"
                    ? "bg-rose-500 text-white shadow-sm shadow-rose-500/20"
                    : "text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                }`}
              >
                <AlertTriangle className="size-3.5" />
                <span>{tr("Errors", "الأخطاء")}</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tr("Filter payload, user, distinct_id...", "بحث في البيانات، المستخدم...")}
                className="rounded-xl h-10 ps-9 pe-8 text-xs border-border/80 bg-background/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Event Stream Terminal Box */}
          <div className="rounded-3xl border border-border/80 bg-card/90 overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar max-h-[580px]">
              <table className="w-full text-start text-xs font-mono">
                <thead className="border-b border-border/60 bg-muted/50 text-[11px] font-bold text-muted-foreground uppercase sticky top-0 backdrop-blur-md z-10">
                  <tr>
                    <th className="px-5 py-3.5 text-start w-32">{tr("Time", "الوقت")}</th>
                    <th className="px-5 py-3.5 text-start w-48">{tr("Event Name", "اسم الحدث")}</th>
                    <th className="px-5 py-3.5 text-start w-36">{tr("Visitor / User", "المستخدم")}</th>
                    <th className="px-5 py-3.5 text-start">{tr("Payload Preview", "معاينة البيانات")}</th>
                    <th className="px-5 py-3.5 text-end w-20">{tr("Details", "التفاصيل")}</th>
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
                        <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{timeStr}</td>
                        <td className="px-5 py-3 font-bold whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isError
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                : isAuth
                                ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                                : isVideo
                                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                : isQuiz
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            {evt.name}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground truncate max-w-[140px]">
                          {evt.user_id ? (
                            <span className="text-primary font-bold">User:{evt.user_id.slice(0, 8)}</span>
                          ) : (
                            <span className="text-muted-foreground/70">{evt.distinct_id ? evt.distinct_id.slice(0, 10) : "anon"}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground truncate max-w-md font-sans text-xs">
                          {safeJsonStringify(evt.properties || {})}
                        </td>
                        <td className="px-5 py-3 text-end whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEvent(evt)}
                            className="h-8 px-3 text-xs gap-1.5 font-sans font-bold rounded-full hover:bg-primary/10 hover:text-primary"
                          >
                            <Eye className="size-3.5" />
                            <span>{tr("Inspect", "فحص")}</span>
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {!filteredEvents.length && (
                <div className="py-20 text-center text-muted-foreground">
                  <Terminal className="mx-auto size-12 opacity-30 text-primary" />
                  <p className="mt-3 text-xs font-bold font-sans">
                    {tr("No events captured yet", "لم يتم التقاط أحداث تطابق التصفية")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. SYSTEM HEALTH & DIAGNOSTICS VIEW ───────────────────────────── */}
      {internalSubTab === "system" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/90 border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm backdrop-blur-xl">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="size-10 grid place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <Server className="size-5" />
                </div>
                <h3 className="text-xl font-black tracking-tight text-foreground">
                  {tr("System Diagnostics & Telemetry", "فحص النظام والبيئة التشغيلية")}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {tr(
                  "Infrastructure health, database latency benchmarks, real-time connectivity, and entity metrics.",
                  "مؤشرات صحة البنية التحتية، وزمن استجابة قاعدة البيانات، وعدد السجلات عبر المنصة."
                )}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInternalSubTab("flags")}
                className="gap-2 text-xs font-bold rounded-full h-10 px-4 shadow-sm"
              >
                <Sliders className="size-3.5" />
                <span>{tr("Manage Feature Flags", "إدارة مصفوفة الميزات")}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={runPingTest}
                disabled={testingPing}
                className="gap-2 text-xs font-bold rounded-full h-10 px-5 shadow-sm"
              >
                <RefreshCw className={`size-3.5 ${testingPing ? "animate-spin" : ""}`} />
                <span>{tr("Run Diagnostics Ping", "إعادة فحص الاتصال")}</span>
              </Button>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Latency */}
            <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">{tr("Database Latency", "زمن استجابة DB")}</span>
                  <div className="size-9 grid place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                    <Zap className="size-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black font-mono text-foreground">
                    {pingMs !== null ? `${pingMs}ms` : "-"}
                  </p>
                  <Badge
                    variant="outline"
                    className={`mt-1 text-[10px] font-bold rounded-full px-2 ${
                      dbStatus === "healthy"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                        : "border-destructive/30 bg-destructive/10 text-destructive"
                    }`}
                  >
                    {dbStatus === "healthy" ? tr("Optimal (<200ms)", "استجابة ممتازة") : tr("Degraded", "استجابة منخفضة")}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Supabase Status */}
            <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">{tr("Database Engine", "قاعدة البيانات")}</span>
                  <div className="size-9 grid place-items-center rounded-xl bg-primary/10 text-primary">
                    <Server className="size-4" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-black truncate text-foreground">Supabase Postgres</p>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold mt-1">
                    <CheckCircle2 className="size-3.5" />
                    <span>{tr("Connected & Active", "متصل ومتاح")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Realtime Stream */}
            <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">{tr("Realtime WebSocket", "تدفق WebSocket")}</span>
                  <div className="size-9 grid place-items-center rounded-xl bg-purple-500/10 text-purple-600">
                    <Activity className="size-4" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-black truncate text-foreground">Supabase Realtime</p>
                  <Badge variant="outline" className="mt-1 text-[10px] font-bold border-purple-500/30 text-purple-700 dark:text-purple-300 rounded-full px-2">
                    Channel Subscribed
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Feature Flags Active */}
            <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm cursor-pointer hover:border-primary/50 transition-all" onClick={() => setInternalSubTab("flags")}>
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">{tr("Feature Flags", "الميزات النشطة")}</span>
                  <div className="size-9 grid place-items-center rounded-xl bg-indigo-500/10 text-indigo-600">
                    <Sliders className="size-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black font-mono text-foreground">
                    {Object.values(featureFlags).filter(Boolean).length} / {FEATURE_FLAG_KEYS.length}
                  </p>
                  <p className="text-[10px] text-primary font-bold mt-0.5">{tr("Click to configure matrix", "انقر لتعديل المصفوفة")}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Database Entity Counter Table */}
          <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm overflow-hidden">
            <CardHeader className="p-6 pb-4 border-b border-border/60">
              <CardTitle className="text-base font-black text-foreground">
                {tr("Entity Inventory & Platform Metrics", "إحصائيات جداول المنصة")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 text-xs font-mono">
                <div className="p-4 rounded-2xl border border-border/70 bg-background/60 flex items-center justify-between">
                  <span className="text-muted-foreground font-sans font-bold">{tr("Published Courses", "المقررات")}</span>
                  <span className="text-lg font-black text-foreground">{courses.length}</span>
                </div>
                <div className="p-4 rounded-2xl border border-border/70 bg-background/60 flex items-center justify-between">
                  <span className="text-muted-foreground font-sans font-bold">{tr("Lecture Videos", "المحاضرات")}</span>
                  <span className="text-lg font-black text-foreground">{lectures.length}</span>
                </div>
                <div className="p-4 rounded-2xl border border-border/70 bg-background/60 flex items-center justify-between">
                  <span className="text-muted-foreground font-sans font-bold">{tr("Quizzes & MCQs", "الاختبارات")}</span>
                  <span className="text-lg font-black text-foreground">{quizzes.length}</span>
                </div>
                <div className="p-4 rounded-2xl border border-border/70 bg-background/60 flex items-center justify-between">
                  <span className="text-muted-foreground font-sans font-bold">{tr("Question Items", "الأسئلة")}</span>
                  <span className="text-lg font-black text-foreground">{questions.length}</span>
                </div>
                <div className="p-4 rounded-2xl border border-border/70 bg-background/60 flex items-center justify-between">
                  <span className="text-muted-foreground font-sans font-bold">{tr("Logged Events", "الأحداث")}</span>
                  <span className="text-lg font-black text-foreground">{totalEventsCount || events.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── 3. FEATURE MATRIX & MODULAR ACTIVATION VIEW ───────────────────── */}
      {internalSubTab === "flags" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/90 border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm backdrop-blur-xl">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="size-10 grid place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <Sliders className="size-5" />
                </div>
                <h3 className="text-xl font-black tracking-tight text-foreground">
                  {tr("Feature Matrix & Modular Activation Engine", "مصفوفة تفعيل الميزات والوحدات البرمجية")}
                </h3>
                <Badge variant="outline" className="text-xs font-mono font-bold ms-1">
                  {Object.values(featureFlags).filter(Boolean).length}/{FEATURE_FLAG_KEYS.length} {tr("Active", "مفعّل")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {tr(
                  "Configure global feature toggles stored in site_content.features. These settings establish default platform behavior across all courses.",
                  "التحكم في تفعيل وإلغاء ميزات المنصة العامة. تسري هذه الإعدادات كقيم افتراضية لجميع المقررات ما لم يتم تخصيص استثناء على مستوى المقرر."
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEnableAllFlags}
                className="gap-1.5 text-xs font-bold rounded-full h-10 px-4 shrink-0"
              >
                <Check className="size-3.5 shrink-0 text-emerald-600" />
                <span>{tr("Enable All", "تفعيل الكل")}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDisableAllFlags}
                className="gap-1.5 text-xs font-bold rounded-full h-10 px-4 shrink-0"
              >
                <X className="size-3.5 shrink-0 text-rose-600" />
                <span>{tr("Disable All", "تعطيل الكل")}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetDefaultFlags}
                className="gap-1.5 text-xs font-bold rounded-full h-10 px-4 shrink-0"
              >
                <RefreshCw className="size-3.5 shrink-0" />
                <span>{tr("Reset Defaults", "القيم الافتراضية")}</span>
              </Button>

              <Button
                type="button"
                onClick={handleSaveFeatureFlags}
                disabled={savingFlags}
                className="gap-2 font-bold text-xs h-10 px-6 rounded-full shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
              >
                {savingFlags ? <RefreshCw className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                <span>{savingFlags ? tr("Saving...", "جارٍ الحفظ...") : tr("Save Global Flags", "حفظ الإعدادات العامة")}</span>
              </Button>
            </div>
          </div>

          {flagsSavedSuccess && (
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span>{tr("Global feature flags saved successfully and broadcast to all clients!", "تم حفظ مصفوفة الميزات بنجاح ونشر التحديث لجميع المتصفحات!")}</span>
            </div>
          )}

          {/* Feature Flags Grid */}
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {FEATURE_FLAG_DEFINITIONS.map((def) => {
              const isEnabled = Boolean(featureFlags[def.key])
              const categoryIcons: Record<string, typeof Cpu> = {
                ai: Cpu,
                assessment: CheckSquare,
                gamification: Award,
                collaboration: MessageSquare,
                analytics: BarChart2,
              }
              const IconComp = categoryIcons[def.category] || Sliders

              const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
                ai: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20" },
                assessment: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" },
                gamification: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20" },
                collaboration: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20" },
                analytics: { bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500/20" },
              }
              const color = categoryColors[def.category] || categoryColors.ai

              return (
                <Card
                  key={def.key}
                  className={`rounded-3xl border-2 transition-all overflow-hidden flex flex-col justify-between ${
                    isEnabled
                      ? "border-primary/40 bg-card/95 shadow-sm shadow-primary/5"
                      : "border-border/60 bg-muted/20 opacity-85"
                  }`}
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`size-11 grid place-items-center rounded-2xl ${color.bg} ${color.text} border ${color.border}`}>
                          <IconComp className="size-5" />
                        </div>
                        <div>
                          <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider ${color.text} border-transparent bg-transparent p-0`}>
                            {def.category}
                          </Badge>
                          <CardTitle className="text-sm font-black leading-snug text-foreground">
                            {isAr ? def.title_ar : def.title_en}
                          </CardTitle>
                        </div>
                      </div>

                      <Badge
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${
                          isEnabled
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {isEnabled ? tr("Active / ON", "مفعل") : tr("Disabled / OFF", "معطل")}
                      </Badge>
                    </div>

                    <CardDescription className="text-xs mt-2 leading-relaxed text-muted-foreground line-clamp-3">
                      {isAr ? def.description_ar : def.description_en}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 pt-0">
                    <div className="flex items-center justify-between pt-3 border-t border-border/60">
                      <span className="font-mono text-[11px] text-muted-foreground font-semibold">
                        {def.key}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => handleToggleFlag(def.key)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="p-4 rounded-2xl border border-border/80 bg-card/60 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="leading-relaxed">
              {tr(
                "Tip: Course authors can override any of these flags in the Course Editor (Inherit, Force Enable, or Force Disable).",
                "معلومة: يمكن لمدير المقرر استثناء وتخصيص أي ميزة لكل مقرر بشكل منفصل عبر نافذة تعديل المقرر."
              )}
            </span>
            <Button
              type="button"
              onClick={handleSaveFeatureFlags}
              disabled={savingFlags}
              size="sm"
              className="gap-1.5 font-bold text-xs rounded-full h-9 px-5 shrink-0 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {savingFlags ? <RefreshCw className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              <span>{savingFlags ? tr("Saving...", "جارٍ الحفظ...") : tr("Apply Global Flags", "تطبيق التغييرات")}</span>
            </Button>
          </div>
        </div>
      )}

      {/* ─── 4. MAINTENANCE MODE CONTROLLER VIEW ───────────────────────────── */}
      {internalSubTab === "maintenance" && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-card/90 border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <div className="size-10 grid place-items-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <LockKeyhole className="size-5" />
              </div>
              <h3 className="text-xl font-black tracking-tight text-foreground">
                {tr("Maintenance Mode & Platform Lock", "وضع الصيانة والتحديث العام")}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
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
            <Card className={`rounded-3xl border-2 transition-all overflow-hidden ${maintenanceEnabled ? "border-amber-500 bg-amber-500/5" : "border-border/80 bg-card/90"}`}>
              <CardContent className="p-6 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-black text-base text-foreground">
                      {tr("Global Maintenance Mode", "تفعيل وضع الصيانة العام")}
                    </span>
                    <Badge
                      className={`rounded-full px-3 text-xs font-bold ${
                        maintenanceEnabled
                          ? "bg-amber-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {maintenanceEnabled ? tr("ACTIVE / ON", "مفعل") : tr("INACTIVE / OFF", "معطل")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
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
                  className="size-6 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
              </CardContent>
            </Card>

            {/* Custom Messages Card */}
            <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm overflow-hidden">
              <CardHeader className="p-6 pb-4 border-b border-border/60">
                <CardTitle className="text-base font-black text-foreground">
                  {tr("Maintenance Screen Messages", "نصوص ورسائل شاشة الصيانة")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tr("Customize the headline and explanation shown to learners.", "تخصيص العنوان والرسالة الظاهرة للطلاب عند فتح المنصة.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">{tr("Title (English)", "العنوان بالإنجليزية")}</Label>
                    <Input
                      value={titleEn}
                      onChange={(e) => setTitleEn(e.target.value)}
                      placeholder="Scheduled Platform Maintenance"
                      className="rounded-xl h-11 border-border/80 bg-background/60 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">{tr("Title (Arabic)", "العنوان بالعربية")}</Label>
                    <Input
                      value={titleAr}
                      onChange={(e) => setTitleAr(e.target.value)}
                      placeholder="أعمال صيانة وتحديث مجدولة"
                      className="rounded-xl h-11 border-border/80 bg-background/60 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">{tr("Message (English)", "الرسالة بالإنجليزية")}</Label>
                    <textarea
                      value={msgEn}
                      onChange={(e) => setMsgEn(e.target.value)}
                      className="w-full min-h-[88px] rounded-2xl border border-border/80 bg-background/60 p-3 text-xs leading-relaxed focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">{tr("Message (Arabic)", "الرسالة بالعربية")}</Label>
                    <textarea
                      value={msgAr}
                      onChange={(e) => setMsgAr(e.target.value)}
                      className="w-full min-h-[88px] rounded-2xl border border-border/80 bg-background/60 p-3 text-xs leading-relaxed focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">{tr("Estimated Completion Time (Optional)", "الوقت المتوقع للانتهاء (اختياري)")}</Label>
                  <Input
                    value={estimatedUntil}
                    onChange={(e) => setEstimatedUntil(e.target.value)}
                    placeholder="e.g. 2 hours / 04:00 AM UTC"
                    className="rounded-xl h-11 border-border/80 bg-background/60 text-xs font-mono"
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              size="lg"
              disabled={savingMaintenance}
              className="w-full h-12 font-bold gap-2 rounded-full shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
            >
              {savingMaintenance ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              <span>{savingMaintenance ? tr("Saving...", "جارٍ الحفظ...") : tr("Apply Maintenance Settings", "تطبيق إعدادات الصيانة")}</span>
            </Button>
          </form>
        </div>
      )}

      {/* ─── 5. MARKETING ENGINE TEST BENCH VIEW ──────────────────────────── */}
      {internalSubTab === "marketing" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/90 border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm backdrop-blur-xl">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="size-10 grid place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Zap className="size-5" />
                </div>
                <h3 className="text-xl font-black tracking-tight text-foreground">
                  {tr("Marketing Engine Test Bench & Live Simulation", "منصة اختبار ومحاكاة محرك العروض")}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {tr(
                  "Interactive test bench to simulate announcement bar states, countdown deadlines, clipboard copying, and guest lead magnet modals.",
                  "بيئة تفاعلية لاختبار ومحاكاة شريط الإعلانات، ومواعيد العد التنازلي، ونسخ الكوبونات، ونوافذ تحويل الزوار."
                )}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                onClick={handleSaveMarketingTest}
                disabled={savingMarketingTest}
                className="gap-2 font-bold text-xs h-10 px-6 rounded-full shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {savingMarketingTest ? <RefreshCw className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                <span>{savingMarketingTest ? tr("Saving to CMS...", "جارٍ الحفظ...") : tr("Publish to Live Site", "نشر للموقع الحي")}</span>
              </Button>
            </div>
          </div>

          {marketingSavedSuccess && (
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span>{tr("Marketing banner settings published to live platform successfully!", "تم نشر إعدادات شريط العروض للمنصة الحية بنجاح!")}</span>
            </div>
          )}

          {/* 1. Live Sandbox Banner Preview */}
          <Card className="rounded-3xl border-2 border-emerald-500/30 bg-card/90 shadow-sm overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-border/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black text-foreground flex items-center gap-2">
                  <Tag className="size-4 text-emerald-600" />
                  <span>{tr("Live Announcement Bar Sandbox Preview", "معاينة حية لشريط الإعلانات")}</span>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {tr("Rendered directly in sandbox mode (forced preview enabled)", "معاينة فورية للشريط كما يظهر في أعلى صفحات المنصة")}
                </CardDescription>
              </div>

              <Badge
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  testBannerConfig.enabled
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                }`}
              >
                {testBannerConfig.enabled ? tr("Active Status", "حالة: مفعل") : tr("Inactive Status", "حالة: معطل")}
              </Badge>
            </CardHeader>

            <div className="p-4 bg-muted/40 border-b border-border/60">
              <div className="rounded-2xl overflow-hidden border border-border/80 shadow-md">
                <TopPromoBanner config={testBannerConfig} isPreview={true} />
              </div>
            </div>

            <CardContent className="p-5 space-y-4">
              {/* Quick Preset Controls */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">
                  {tr("Countdown Timer Simulation Presets", "محاكاة العد التنازلي ومواعيد الانتهاء")}
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTestExpirationOffset(2)}
                    className="h-9 px-3.5 text-xs font-bold rounded-xl gap-1.5"
                  >
                    <Calendar className="size-3.5 text-emerald-600" />
                    <span>{tr("Set +2 Hours (Active Countdown)", "تحديد بعد ساعتين (عد نشط)")}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTestExpirationOffset(24)}
                    className="h-9 px-3.5 text-xs font-bold rounded-xl gap-1.5"
                  >
                    <Calendar className="size-3.5 text-blue-600" />
                    <span>{tr("Set +24 Hours (1 Day)", "تحديد بعد 24 ساعة")}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTestExpirationOffset(-1)}
                    className="h-9 px-3.5 text-xs font-bold rounded-xl gap-1.5 text-rose-600 hover:text-rose-700"
                  >
                    <AlertTriangle className="size-3.5" />
                    <span>{tr("Set Expired (-1 Hour)", "محاكاة انتهاء الوقت")}</span>
                  </Button>
                </div>
              </div>

              {/* Banner Configuration Input Row */}
              <div className="grid gap-3 sm:grid-cols-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">{tr("Coupon Code", "رمز الكوبون")}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={testBannerConfig.coupon_code || ""}
                      onChange={(e) =>
                        setTestBannerConfig((prev) => ({
                          ...prev,
                          coupon_code: e.target.value.toUpperCase(),
                        }))
                      }
                      className="rounded-xl h-10 border-border/80 bg-background text-xs font-mono uppercase font-bold"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestCopyCoupon}
                      className="h-10 px-3 shrink-0 rounded-xl text-xs font-bold gap-1"
                    >
                      {testClipboardFeedback ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                      <span>{testClipboardFeedback ? tr("Copied!", "تم!") : tr("Test Copy", "اختبار")}</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">{tr("Target Date-Time (ISO)", "التاريخ والوقت")}</Label>
                  <Input
                    value={testBannerConfig.target_date || ""}
                    onChange={(e) =>
                      setTestBannerConfig((prev) => ({
                        ...prev,
                        target_date: e.target.value,
                      }))
                    }
                    className="rounded-xl h-10 border-border/80 bg-background text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">{tr("CTA Destination URL", "رابط الزر")}</Label>
                  <Input
                    value={testBannerConfig.cta_url || ""}
                    onChange={(e) =>
                      setTestBannerConfig((prev) => ({
                        ...prev,
                        cta_url: e.target.value,
                      }))
                    }
                    className="rounded-xl h-10 border-border/80 bg-background text-xs font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Lead Magnet Conversion Modal Tester */}
          <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-black text-foreground flex items-center gap-2">
                    <Award className="size-4 text-emerald-600" />
                    <span>{tr("Guest Lead Magnet Modal Test Suite", "اختبار نافذة تحويل الزوار")}</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {tr(
                      "Test non-intrusive conversion dialog triggered when guests complete preview lectures or access locked resources.",
                      "اختبار ظهور نافذة التسجيل عند إتمام المحاضرة التجريبية للزوار."
                    )}
                  </CardDescription>
                </div>

                <Button
                  type="button"
                  onClick={() => setTestLeadMagnetOpen(true)}
                  className="gap-1.5 font-bold text-xs rounded-full h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  <Eye className="size-3.5" />
                  <span>{tr("Launch Preview Modal", "فتح النافذة التجريبية")}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 text-xs text-muted-foreground leading-relaxed">
              <p>
                {tr(
                  "The Lead Magnet modal delivers value proposition bullets (100% Video Access, Clinical Quizzes + XP, QR Certificates, and Timestamped Clinical Notes) to convert guest learners into registered students.",
                  "تعرض نافذة التحويل مميزات المنصة الرئيسية لتشجيع الزوار على إنشاء حساب طلابي مجاني دون حظر تجربتهم بشكل مفاجئ."
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── TEST BENCH LEAD MAGNET MODAL ─────────────────────────────────── */}
      <LeadMagnetModal
        isOpen={testLeadMagnetOpen}
        onClose={() => setTestLeadMagnetOpen(false)}
        courseTitle="Advanced Cardiovascular Pharmacology"
        lectureTitle="Beta Blockers in Heart Failure & Arrhythmias"
        source="preview_complete"
      />

      {/* ─── INSPECT EVENT JSON MODAL ─────────────────────────────────────── */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar p-6 sm:p-8 rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl">
            <DialogHeader className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <DialogTitle className="text-base font-bold font-mono text-foreground">
                  {selectedEvent.name}
                </DialogTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(safeJsonStringify(selectedEvent, 2))}
                  className="gap-1.5 text-xs font-bold h-8 rounded-full"
                >
                  <Copy className="size-3.5" />
                  <span>{copied ? tr("Copied!", "تم النسخ!") : tr("Copy JSON", "نسخ JSON")}</span>
                </Button>
              </div>
              <DialogDescription className="text-xs text-muted-foreground font-mono">
                Timestamp: {selectedEvent.timestamp} | Distinct ID: {selectedEvent.distinct_id || "None"}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 font-mono text-xs overflow-x-auto custom-scrollbar">
              <pre>{safeJsonStringify(selectedEvent, 2)}</pre>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
