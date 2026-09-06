import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  FiAlertCircle as AlertCircle,
  FiBookOpen as BookOpen,
  FiCheckCircle as CheckCircle2,
  FiClock as Clock,
  FiCpu as Cpu,
  FiExternalLink as ExternalLink,
  FiEye as Eye,
  FiInbox as Inbox,
  FiLoader as Loader2,
  FiMail as Mail,
  FiPaperclip as Paperclip,
  FiRefreshCw as RefreshCw,
  FiSave as Save,
  FiSearch as Search,
  FiTrash2 as Trash2,
  FiUser as User,
  FiZap as Zap,
} from "react-icons/fi"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { FeedbackSeverity, FeedbackStatus, FeedbackSubmission, FeedbackType, UserProfile } from "@/types"

interface FeedbackManagerProps {
  isAr: boolean
  sessionToken: string
  profile: UserProfile
  onCountChange?: (openCount: number) => void
}

export default function FeedbackManager({
  isAr,
  sessionToken,
  profile,
  onCountChange,
}: FeedbackManagerProps) {
  const tr = (en: string, ar: string) => (isAr ? ar : en)
  const canDelete = profile?.role === "dev" || profile?.role === "super_admin"

  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Filter States
  const [typeFilter, setTypeFilter] = useState<"all" | FeedbackType>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | FeedbackStatus>("all")
  const [severityFilter, setSeverityFilter] = useState<"all" | FeedbackSeverity>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Stats
  const [stats, setStats] = useState({
    totalCount: 0,
    openTechnicalCount: 0,
    openAcademicCount: 0,
    resolvedCount: 0,
    inProgressCount: 0,
  })

  // Selected Submission for Modal Detail / Edit
  const [selectedItem, setSelectedItem] = useState<FeedbackSubmission | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editStatus, setEditStatus] = useState<FeedbackStatus>("open")
  const [editAdminNotes, setEditAdminNotes] = useState("")
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchFeedback = useCallback(async () => {
    if (!sessionToken) return
    setLoading(true)
    setErrorMsg("")

    try {
      const params = new URLSearchParams()
      if (typeFilter !== "all") params.set("feedback_type", typeFilter)
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (severityFilter !== "all") params.set("severity", severityFilter)
      if (searchQuery.trim()) params.set("search", searchQuery.trim())

      const res = await fetch(`/api/admin/feedback?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to load feedback")
      }

      setSubmissions(data.submissions || [])
      if (data.stats) {
        setStats(data.stats)
        const totalOpen = (data.stats.openTechnicalCount || 0) + (data.stats.openAcademicCount || 0)
        onCountChange?.(totalOpen)
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error loading feedback")
    } finally {
      setLoading(false)
    }
  }, [sessionToken, typeFilter, statusFilter, severityFilter, searchQuery, onCountChange])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  function openDetailModal(item: FeedbackSubmission) {
    setSelectedItem(item)
    setEditStatus(item.status)
    setEditAdminNotes(item.admin_notes || "")
    setDetailOpen(true)
  }

  async function handleUpdateSubmission() {
    if (!selectedItem || !sessionToken) return
    setUpdating(true)
    setErrorMsg("")
    setSuccessMsg("")

    try {
      const res = await fetch(`/api/admin/feedback/${selectedItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          status: editStatus,
          admin_notes: editAdminNotes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to update feedback item")
      }

      setSuccessMsg(tr("Feedback updated successfully.", "تم تحديث حالة الملاحظة بنجاح."))
      setDetailOpen(false)
      fetchFeedback()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update feedback")
    } finally {
      setUpdating(false)
    }
  }

  async function handleDeleteSubmission(id: string) {
    if (!sessionToken || !confirm(tr("Are you sure you want to delete this submission?", "هل أنت متأكد من حذف هذه الملاحظة نهائيًا؟"))) {
      return
    }

    setDeleting(true)
    setErrorMsg("")

    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete submission")
      }

      setDetailOpen(false)
      fetchFeedback()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to delete submission")
    } finally {
      setDeleting(false)
    }
  }

  const getSeverityBadge = (sev: FeedbackSeverity) => {
    switch (sev) {
      case "critical":
        return <Badge className="bg-rose-600 text-white font-mono text-[10px]">Critical</Badge>
      case "high":
        return <Badge className="bg-orange-500 text-white font-mono text-[10px]">High</Badge>
      case "medium":
        return <Badge className="bg-amber-500 text-white font-mono text-[10px]">Medium</Badge>
      case "low":
        return <Badge variant="secondary" className="font-mono text-[10px]">Low</Badge>
    }
  }

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[11px] gap-1">
            <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
            <span>{tr("Open", "قيد الانتظار")}</span>
          </Badge>
        )
      case "under_review":
        return (
          <Badge variant="outline" className="border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-[11px] gap-1">
            <Clock className="size-3" />
            <span>{tr("Under Review", "قيد المراجعة")}</span>
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="border-purple-500/50 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold text-[11px] gap-1">
            <Zap className="size-3" />
            <span>{tr("In Progress", "جاري المعالجة")}</span>
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] gap-1">
            <CheckCircle2 className="size-3" />
            <span>{tr("Resolved", "تم الحل والتطبيق")}</span>
          </Badge>
        )
      case "dismissed":
        return (
          <Badge variant="secondary" className="text-[11px] text-muted-foreground">
            {tr("Dismissed", "مستبعد")}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* ─── 1. TOP STATS CARDS ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border bg-card shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{tr("Total Submissions", "إجمالي الملاحظات والبلاغات")}</p>
              <p className="text-2xl font-extrabold text-foreground">{stats.totalCount}</p>
            </div>
            <div className="size-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <Inbox className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-xs border-amber-500/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">{tr("Open Technical Issues", "بلاغات تقنية معلقة")}</p>
              <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{stats.openTechnicalCount}</p>
            </div>
            <div className="size-11 rounded-xl bg-amber-500/10 text-amber-600 grid place-items-center">
              <Cpu className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-xs border-blue-500/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">{tr("Open Academic Feedback", "مقترحات وملاحظات أكاديمية")}</p>
              <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{stats.openAcademicCount}</p>
            </div>
            <div className="size-11 rounded-xl bg-blue-500/10 text-blue-600 grid place-items-center">
              <BookOpen className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-xs border-emerald-500/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{tr("Resolved & Implemented", "تمت المعالجة والإغلاق")}</p>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.resolvedCount}</p>
            </div>
            <div className="size-11 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── STATUS NOTICES ─────────────────────────────────────────────── */}
      {errorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}
      {successMsg && (
        <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
          <CheckCircle2 className="size-4" />
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      {/* ─── 2. FILTER & ACTION TOOLBAR ───────────────────────────────────── */}
      <Card className="border shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Feedback Type Tabs */}
            <Tabs
              value={typeFilter}
              onValueChange={(val) => setTypeFilter(val as typeof typeFilter)}
              className="w-full lg:w-auto"
            >
              <TabsList className="grid grid-cols-3 h-auto p-1 bg-muted/80 rounded-xl gap-1 w-full sm:w-96">
                <TabsTrigger value="all" className="min-h-[36px] text-xs font-bold rounded-lg">
                  {tr("All", "الكل")}
                </TabsTrigger>
                <TabsTrigger value="technical" className="min-h-[36px] text-xs font-bold rounded-lg gap-1.5">
                  <Cpu className="size-3.5 text-amber-500" />
                  <span>{tr("Technical", "تقني")}</span>
                </TabsTrigger>
                <TabsTrigger value="academic" className="min-h-[36px] text-xs font-bold rounded-lg gap-1.5">
                  <BookOpen className="size-3.5 text-blue-500" />
                  <span>{tr("Academic", "أكاديمي")}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Status & Severity Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as typeof statusFilter)}>
                <SelectTrigger className="w-[140px] min-h-[38px] text-xs">
                  <SelectValue placeholder={tr("Status", "الحالة")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tr("All Statuses", "كافة الحالات")}</SelectItem>
                  <SelectItem value="open">{tr("Open", "قيد الانتظار")}</SelectItem>
                  <SelectItem value="under_review">{tr("Under Review", "قيد المراجعة")}</SelectItem>
                  <SelectItem value="in_progress">{tr("In Progress", "جاري المعالجة")}</SelectItem>
                  <SelectItem value="resolved">{tr("Resolved", "تم الحل")}</SelectItem>
                  <SelectItem value="dismissed">{tr("Dismissed", "مستبعد")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={(val) => setSeverityFilter(val as typeof severityFilter)}>
                <SelectTrigger className="w-[130px] min-h-[38px] text-xs">
                  <SelectValue placeholder={tr("Severity", "الأهمية")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tr("All Severity", "كافة الدرجات")}</SelectItem>
                  <SelectItem value="critical">🔴 Critical</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="low">🟢 Low</SelectItem>
                </SelectContent>
              </Select>

              {/* Refresh Action */}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchFeedback}
                disabled={loading}
                className="min-h-[38px] px-3 text-xs gap-1.5"
              >
                <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">{tr("Refresh", "تحديث")}</span>
              </Button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={tr("Search feedback by title, description, email, or submitter...", "بحث في الملاحظات بالعنوان أو الوصف أو البريد...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 min-h-[40px] text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* ─── 3. SUBMISSIONS TABLE / LIST ─────────────────────────────────── */}
      <Card className="border shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">
              {tr("Feedback & Bug Reports Queue", "قائمة البلاغات والملاحظات المستلمة")}
            </CardTitle>
            <CardDescription className="text-xs">
              {tr(`Displaying ${submissions.length} submission(s)`, `عرض ${submissions.length} ملاحظة`)}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="grid min-h-64 place-items-center p-8">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="size-8 animate-spin text-primary" />
                <span className="text-xs font-semibold">{tr("Loading feedback...", "جارٍ تحميل الملاحظات...")}</span>
              </div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="grid min-h-64 place-items-center p-8 text-center text-muted-foreground">
              <div className="space-y-3">
                <CheckCircle2 className="mx-auto size-10 text-emerald-500 opacity-80" />
                <p className="text-sm font-bold text-foreground">
                  {tr("No feedback matching current filters", "لا توجد بلاغات تطابق الفلاتر المحددة")}
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {tr("All caught up! New student bug reports and academic feedback will appear here in real time.", "لوحة الملاحظات نظيفة! ستظهر بلاغات الطلاب ومقترحات المناهج الجديدة هنا فور إرسالها.")}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {submissions.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Feedback Type Badge */}
                      {item.feedback_type === "technical" ? (
                        <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 font-bold text-[10px] gap-1">
                          <Cpu className="size-3" />
                          <span>{tr("Technical", "تقني")}</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-600 font-bold text-[10px] gap-1">
                          <BookOpen className="size-3" />
                          <span>{tr("Academic", "أكاديمي")}</span>
                        </Badge>
                      )}

                      {/* Severity Badge */}
                      {getSeverityBadge(item.severity)}

                      {/* Status Badge */}
                      {getStatusBadge(item.status)}

                      {/* Category Label */}
                      <span className="text-xs font-medium text-muted-foreground">
                        • {item.category}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm sm:text-base text-foreground line-clamp-1">
                      {item.title}
                    </h4>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground font-mono">
                      {item.contact_name && (
                        <span className="flex items-center gap-1 text-foreground/80">
                          <User className="size-3 text-primary" />
                          <span>{item.contact_name}</span>
                        </span>
                      )}
                      {item.contact_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="size-3" />
                          <span>{item.contact_email}</span>
                        </span>
                      )}
                      {item.page_url && (
                        <span className="text-primary truncate max-w-[200px]">
                          📍 {item.page_url}
                        </span>
                      )}
                      <span>
                        🕒 {new Date(item.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailModal(item)}
                      className="text-xs font-bold gap-1.5 min-h-[36px]"
                    >
                      <Eye className="size-3.5" />
                      <span>{tr("View & Update", "عرض وتعديل")}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── 4. ITEM DETAIL & STATUS UPDATE DIALOG ───────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={isAr ? "rtl" : "ltr"}>
          {selectedItem && (
            <>
              <DialogHeader className="border-b pb-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {selectedItem.feedback_type === "technical" ? (
                    <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 font-bold text-xs gap-1">
                      <Cpu className="size-3" />
                      <span>{tr("Technical Bug Report", "بلاغ تقني")}</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-600 font-bold text-xs gap-1">
                      <BookOpen className="size-3" />
                      <span>{tr("Academic Feedback", "ملاحظة أكاديمية")}</span>
                    </Badge>
                  )}
                  {getSeverityBadge(selectedItem.severity)}
                  {getStatusBadge(selectedItem.status)}
                </div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {selectedItem.title}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {tr("Submitted on:", "تاريخ الإرسال:")}{" "}
                  {new Date(selectedItem.created_at).toLocaleString(isAr ? "ar-EG" : "en-US")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-4 text-xs sm:text-sm">
                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="font-bold text-muted-foreground">{tr("Description & Details", "التفاصيل وما تم شرحه")}</Label>
                  <div className="p-3.5 rounded-xl bg-muted/40 border leading-relaxed text-foreground whitespace-pre-wrap">
                    {selectedItem.description}
                  </div>
                </div>

                {/* Reproduction Steps */}
                {selectedItem.reproduction_steps && (
                  <div className="space-y-1.5">
                    <Label className="font-bold text-muted-foreground">{tr("Steps to Reproduce", "خطوات تكرار المشكلة")}</Label>
                    <div className="p-3.5 rounded-xl bg-muted/30 border font-mono text-xs leading-relaxed whitespace-pre-wrap">
                      {selectedItem.reproduction_steps}
                    </div>
                  </div>
                )}

                {/* Academic Context / Reference */}
                {selectedItem.academic_reference && (
                  <div className="space-y-1.5">
                    <Label className="font-bold text-muted-foreground">{tr("Academic Citation & Context", "السياق والمرجع العلمي المرفق")}</Label>
                    <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200 leading-relaxed">
                      {selectedItem.academic_reference}
                    </div>
                  </div>
                )}

                {/* Page URL & Course Context */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedItem.page_url && (
                    <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground">{tr("Reported Page URL", "رابط الصفحة المعنية")}</Label>
                      <p className="font-mono text-xs text-primary truncate">
                        <Link href={selectedItem.page_url} target="_blank" className="hover:underline flex items-center gap-1">
                          <span>{selectedItem.page_url}</span>
                          <ExternalLink className="size-3" />
                        </Link>
                      </p>
                    </div>
                  )}

                  {selectedItem.attachment_url && (
                    <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground">{tr("Screenshot / Attachment", "المرفق التوضيحي")}</Label>
                      <p className="font-mono text-xs text-primary truncate">
                        <a href={selectedItem.attachment_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                          <Paperclip className="size-3" />
                          <span>{tr("View Attachment Link", "فتح رابط المرفق")}</span>
                          <ExternalLink className="size-3" />
                        </a>
                      </p>
                    </div>
                  )}
                </div>

                {/* Auto-Captured Device Telemetry */}
                {selectedItem.device_info && Object.keys(selectedItem.device_info).length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="font-bold text-muted-foreground">{tr("Client Telemetry (Auto-Captured)", "بيانات المتصفح والنظام المسجلة")}</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] text-muted-foreground bg-muted/30 p-3 rounded-xl border">
                      <div>
                        <span className="block text-[9px] uppercase text-muted-foreground/70">OS</span>
                        <span className="font-bold text-foreground">{selectedItem.device_info.os || "N/A"}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase text-muted-foreground/70">Browser</span>
                        <span className="font-bold text-foreground">{selectedItem.device_info.browser || "N/A"}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase text-muted-foreground/70">Viewport</span>
                        <span className="font-bold text-foreground">{selectedItem.device_info.viewport || "N/A"}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase text-muted-foreground/70">Screen</span>
                        <span className="font-bold text-foreground">{selectedItem.device_info.screen || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submitter Details */}
                <div className="p-3 rounded-xl border bg-muted/20 flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{tr("Submitter", "المرسل")}</span>
                    <p className="font-bold text-foreground">
                      {selectedItem.contact_name || selectedItem.user?.full_name || tr("Anonymous / Guest", "زائر")}
                    </p>
                  </div>
                  {selectedItem.contact_email && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">{tr("Contact Email", "البريد")}</span>
                      <p className="font-mono text-xs text-foreground">{selectedItem.contact_email}</p>
                    </div>
                  )}
                </div>

                {/* ─── STATUS & ADMIN NOTES FORM ───────────────────────────── */}
                <div className="space-y-3 pt-3 border-t">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="status-select" className="font-bold">
                        {tr("Update Status *", "تحديث حالة البلاغ *")}
                      </Label>
                      <Select value={editStatus} onValueChange={(val) => setEditStatus(val as FeedbackStatus)}>
                        <SelectTrigger id="status-select" className="min-h-[40px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">🟡 {tr("Open / Pending", "قيد الانتظار")}</SelectItem>
                          <SelectItem value="under_review">🔵 {tr("Under Review", "قيد المراجعة")}</SelectItem>
                          <SelectItem value="in_progress">🟣 {tr("In Progress (Being Fixed)", "جاري المعالجة والعمل")}</SelectItem>
                          <SelectItem value="resolved">🟢 {tr("Resolved & Closed", "تم الحل والتطبيق")}</SelectItem>
                          <SelectItem value="dismissed">⚪ {tr("Dismissed / Not a bug", "مستبعد / لا يتطلب إجراء")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="admin-notes" className="font-bold">
                      {tr("Internal Admin / Resolution Notes", "ملاحظات الإدارة وفريق التطوير")}
                    </Label>
                    <Textarea
                      id="admin-notes"
                      rows={3}
                      placeholder={tr(
                        "Add internal notes on how this bug was fixed, commit hash, or curriculum update rationale...",
                        "أضف ملاحظات توضيحية حول الحل المنفذ، أو سبب التعديل الأكاديمي..."
                      )}
                      value={editAdminNotes}
                      onChange={(e) => setEditAdminNotes(e.target.value)}
                      className="text-xs leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t pt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                {canDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteSubmission(selectedItem.id)}
                    disabled={deleting}
                    className="gap-1.5 text-xs w-full sm:w-auto"
                  >
                    <Trash2 className="size-3.5" />
                    <span>{deleting ? tr("Deleting...", "جارٍ الحذف...") : tr("Delete Submission", "حذف الملاحظة")}</span>
                  </Button>
                ) : <div />}

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailOpen(false)}
                    className="text-xs"
                  >
                    {tr("Cancel", "إلغاء")}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleUpdateSubmission}
                    disabled={updating}
                    className="gap-1.5 text-xs font-bold"
                  >
                    {updating ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    <span>{updating ? tr("Saving...", "جارٍ الحفظ...") : tr("Save Changes", "حفظ التغييرات")}</span>
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
