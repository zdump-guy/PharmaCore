import { useState, useEffect } from "react"
import {
  FiAlertCircle as AlertCircle,
  FiCheckCircle as CheckCircle2,
  FiClock as Clock,
  FiCode as Code,
  FiEye as Eye,
  FiFileText as FileText,
  FiLayers as Layers,
  FiLoader as Loader2,
  FiMail as Mail,
  FiRefreshCw as RefreshCw,
  FiSearch as Search,
  FiSend as Send,
  FiShield as ShieldCheck,
  FiSmartphone as Smartphone,
  FiTag as Tag,
  FiTrash2 as Trash2,
  FiUploadCloud as UploadCloud,
  FiUser as UserIcon,
  FiUsers as Users,
  FiX as X,
} from "react-icons/fi"
import { FaGraduationCap as GraduationCap } from "react-icons/fa6"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { Course, EmailLog, EmailTargetAudience, EmailTemplate, UserProfile } from "@/types"

interface EmailManagerProps {
  isAr: boolean
  sessionToken: string
  profile: UserProfile | null
  courses: Course[]
}

interface SearchedUser {
  id: string
  full_name: string | null
  email: string
  role: string
  status?: string
}

export default function EmailManager({
  isAr,
  sessionToken,
  profile,
  courses,
}: EmailManagerProps) {
  const tr = (en: string, ar: string) => (isAr ? ar : en)
  const isDev = profile?.role === "dev"
  const canSend = profile && ["dev", "super_admin"].includes(profile.role)

  const [activeTab, setActiveTab] = useState<"compose" | "templates" | "logs">("compose")

  // ── Compose State ─────────────────────────────────────────────────────────
  const [targetAudience, setTargetAudience] = useState<EmailTargetAudience>("students")
  const [studentStatus, setStudentStatus] = useState<"all" | "active_only">("all")
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("system_announcement")
  const [campaignType, setCampaignType] = useState<"announcement" | "marketing" | "direct_message" | "system">("announcement")

  // Single User / Custom Set search state
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<SearchedUser[]>([])
  const [customEmailsInput, setCustomEmailsInput] = useState("")

  // Form Content
  const [subject, setSubject] = useState("")
  const [titleEn, setTitleEn] = useState("")
  const [titleAr, setTitleAr] = useState("")
  const [messageEn, setMessageEn] = useState("")
  const [messageAr, setMessageAr] = useState("")
  const [actionUrl, setActionUrl] = useState("")
  const [actionTextEn, setActionTextEn] = useState("Open PharmaCore Platform →")
  const [actionTextAr, setActionTextAr] = useState("الانتقال إلى منصة فارما كور ←")
  const [promoBadge, setPromoBadge] = useState("NEW COURSE LAUNCH")
  const [promoCode, setPromoCode] = useState("PHARMA2026")
  const [subtitleEn, setSubtitleEn] = useState("")
  const [customHtmlBody, setCustomHtmlBody] = useState("")
  const [sendInAppNotif, setSendInAppNotif] = useState(true)

  // Preview & Dispatch state
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile" | "code">("desktop")
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewLoading, setPreviewLoading] = useState(false)
  const [dispatching, setDispatching] = useState(false)
  const [testing, setTesting] = useState(false)
  const [notice, setNotice] = useState<{ error?: boolean; text: string } | null>(null)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  // ── Template Library State ────────────────────────────────────────────────
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateTitleEn, setNewTemplateTitleEn] = useState("")
  const [newTemplateTitleAr, setNewTemplateTitleAr] = useState("")
  const [newTemplateCategory, setNewTemplateCategory] = useState<"announcement" | "marketing" | "custom">("custom")
  const [newTemplateSubject, setNewTemplateSubject] = useState("{{subject}}")
  const [newTemplateHtml, setNewTemplateHtml] = useState("")
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [previewingTemplate, setPreviewingTemplate] = useState<EmailTemplate | null>(null)

  // ── Logs State ────────────────────────────────────────────────────────────
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null)

  // Load Templates on Mount
  const loadTemplates = async () => {
    if (!sessionToken) return
    setLoadingTemplates(true)
    try {
      const res = await fetch("/api/admin/emails/templates", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
      const data = await res.json()
      if (res.ok && data.templates) {
        setTemplates(data.templates)
      }
    } catch {
      // Non-blocking catch
    } finally {
      setLoadingTemplates(false)
    }
  }

  // Load Logs on Mount / Tab change
  const loadLogs = async () => {
    if (!sessionToken) return
    setLoadingLogs(true)
    try {
      const res = await fetch("/api/admin/emails/logs", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
      const data = await res.json()
      if (res.ok && data.logs) {
        setLogs(data.logs)
      }
    } catch {
      // Non-blocking catch
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    loadTemplates()
    loadLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken])

  // User Search debounce
  useEffect(() => {
    if (!userSearchQuery.trim() || userSearchQuery.length < 2 || !sessionToken) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearchingUsers(true)
      try {
        const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(userSearchQuery.trim())}`, {
          headers: { Authorization: `Bearer ${sessionToken}` },
        })
        const data = await res.json()
        if (res.ok && data.users) {
          setSearchResults(data.users)
        }
      } catch {
        // Ignore
      } finally {
        setSearchingUsers(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [userSearchQuery, sessionToken])

  // Update preview automatically when relevant inputs change
  useEffect(() => {
    if (!sessionToken) return
    const timer = setTimeout(() => {
      fetchPreview()
    }, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedTemplateId,
    subject,
    titleEn,
    titleAr,
    messageEn,
    messageAr,
    actionUrl,
    actionTextEn,
    actionTextAr,
    promoBadge,
    promoCode,
    subtitleEn,
    customHtmlBody,
    sessionToken,
  ])

  const fetchPreview = async () => {
    if (!sessionToken) return
    setPreviewLoading(true)
    try {
      const isCustomHtml = selectedTemplateId === "custom_uploaded_html"
      const res = await fetch("/api/admin/emails/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          template_id: isCustomHtml ? undefined : selectedTemplateId.startsWith("system") ? undefined : selectedTemplateId,
          template_name: isCustomHtml ? undefined : selectedTemplateId,
          custom_html: isCustomHtml ? customHtmlBody : undefined,
          subject_template: subject || "{{title_en}}",
          variables: {
            title_en: titleEn || "Clinical Pharmacology Masterclass Update",
            title_ar: titleAr || "تحديث في مساق علم الأدوية السريري",
            message_en: messageEn || "We are pleased to invite you to the newly released clinical interactive modules.",
            message_ar: messageAr || "يسعدنا دعوتكم لحضور ومتابعة الوحدات التفاعلية المحدثة.",
            action_url: actionUrl || "https://pharma-core-edu.vercel.app",
            action_text_en: actionTextEn || "Open Course Platform →",
            action_text_ar: actionTextAr || "الانتقال إلى المنصة ←",
            promo_badge: promoBadge || "EXCLUSIVE INVITATION",
            promo_code: promoCode || "PHARMA2026",
            subtitle_en: subtitleEn || "Advanced therapeutics and clinical insights",
            content_html: customHtmlBody || "<p>Your custom HTML message content here.</p>",
          },
        }),
      })
      const data = await res.json()
      if (res.ok && data.html) {
        setPreviewHtml(data.html)
      }
    } catch {
      // Ignore preview errors
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!sessionToken || !profile?.email) {
      setNotice({ error: true, text: tr("Admin profile has no email configured.", "حسابك الإداري لا يحتوي على بريد إلكتروني مسجل.") })
      return
    }

    setTesting(true)
    setNotice(null)
    try {
      const isCustomHtml = selectedTemplateId === "custom_uploaded_html"
      const res = await fetch("/api/admin/emails/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          template_id: isCustomHtml ? undefined : selectedTemplateId.startsWith("system") ? undefined : selectedTemplateId,
          template_name: isCustomHtml ? undefined : selectedTemplateId,
          custom_html: isCustomHtml ? customHtmlBody : undefined,
          custom_subject: subject || titleEn || "Test Email Preview",
          variables: {
            title_en: titleEn || "Test Email Headline",
            title_ar: titleAr || "معاينة تجريبية للإعلان",
            message_en: messageEn || "This is a test broadcast delivery.",
            message_ar: messageAr || "هذه رسالة اختبار تجريبية.",
            action_url: actionUrl || "https://pharma-core-edu.vercel.app",
            action_text_en: actionTextEn,
            action_text_ar: actionTextAr,
            promo_badge: promoBadge,
            promo_code: promoCode,
            subtitle_en: subtitleEn,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send test email")

      setNotice({
        error: false,
        text: data.simulated
          ? tr(`Test email simulated for ${profile.email}. Set RESEND_API_KEY for live delivery.`, `تمت محاكاة إرسال البريد لـ ${profile.email}.`)
          : tr(`Test email dispatched successfully to ${profile.email}.`, `تم إرسال بريد التجربة بنجاح إلى ${profile.email}.`),
      })
    } catch (err: unknown) {
      setNotice({ error: true, text: err instanceof Error ? err.message : tr("Failed to send test email.", "فشل إرسال البريد التجريبي.") })
    } finally {
      setTesting(false)
    }
  }

  const handleDispatchCampaign = async () => {
    if (!sessionToken) return
    setDispatching(true)
    setNotice(null)
    setConfirmModalOpen(false)

    try {
      const isCustomHtml = selectedTemplateId === "custom_uploaded_html"
      const targetUserIds = selectedUsers.map((u) => u.id)
      const parsedCustomEmails = customEmailsInput
        .split(/[\n,;]+/)
        .map((e) => e.trim())
        .filter((e) => e.includes("@"))

      const res = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          target_audience: targetAudience,
          student_status: studentStatus,
          course_id: targetAudience === "course_enrolled" ? selectedCourseId : undefined,
          target_user_ids: targetUserIds.length > 0 ? targetUserIds : undefined,
          target_emails: parsedCustomEmails.length > 0 ? parsedCustomEmails : undefined,
          single_user_id: targetAudience === "single_user" && selectedUsers[0] ? selectedUsers[0].id : undefined,
          single_email: targetAudience === "single_user" && !selectedUsers[0] ? customEmailsInput.trim() : undefined,
          template_id: isCustomHtml ? undefined : selectedTemplateId.startsWith("system") ? undefined : selectedTemplateId,
          template_name: isCustomHtml ? undefined : selectedTemplateId,
          custom_subject: subject || titleEn || "PharmaCore Official Notice",
          custom_html: isCustomHtml ? customHtmlBody : undefined,
          campaign_type: campaignType,
          send_in_app_notification: sendInAppNotif,
          variables: {
            title_en: titleEn,
            title_ar: titleAr,
            message_en: messageEn,
            message_ar: messageAr,
            action_url: actionUrl,
            action_text_en: actionTextEn,
            action_text_ar: actionTextAr,
            promo_badge: promoBadge,
            promo_code: promoCode,
            subtitle_en: subtitleEn,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to dispatch campaign")

      setNotice({
        error: false,
        text: isAr
          ? `تم إرسال الحملة البريدية بنجاح إلى ${data.count} مستلم (${data.emailsDispatched} بريد إلكتروني).`
          : `Email campaign successfully sent to ${data.count} recipient(s) (${data.emailsDispatched} dispatched).`,
      })

      loadLogs()
    } catch (err: unknown) {
      setNotice({ error: true, text: err instanceof Error ? err.message : tr("Failed to send campaign.", "فشل إرسال الحملة البريدية.") })
    } finally {
      setDispatching(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        setNewTemplateHtml(content)
      }
    }
    reader.readAsText(file)
  }

  const handleSaveNewTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionToken) return
    setSavingTemplate(true)

    try {
      const res = await fetch("/api/admin/emails/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          name: newTemplateName.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
          title_en: newTemplateTitleEn,
          title_ar: newTemplateTitleAr,
          category: newTemplateCategory,
          subject_template: newTemplateSubject,
          html_content: newTemplateHtml,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save template")

      setUploadModalOpen(false)
      setNewTemplateName("")
      setNewTemplateTitleEn("")
      setNewTemplateTitleAr("")
      setNewTemplateHtml("")
      loadTemplates()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving template")
    } finally {
      setSavingTemplate(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm(tr("Delete this custom template?", "حذف هذا القالب المخصص؟"))) return
    try {
      const res = await fetch(`/api/admin/emails/templates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id))
      }
    } catch {
      // Ignore
    }
  }

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="size-5 text-primary" />
            <h3 className="text-xl font-bold tracking-tight">{tr("Email Campaigns & Communications Center", "مركز الحملات والمراسلات البريدية")}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {tr(
              "Compose targeted broadcasts, manage custom HTML templates, send direct user memos, and track deliverability telemetry.",
              "إرسال إعلانات موجهة للطلاب والكادر، إدارة قوالب HTML المخصصة، مراسلة مستخدمين محددين، ومتابعة سجلات الوصول."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setUploadModalOpen(true)}
            className="gap-1.5 text-xs font-bold"
          >
            <UploadCloud className="size-4" />
            <span>{tr("Upload HTML Template", "رفع قالب HTML جديد")}</span>
          </Button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 ${
            notice.error
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
          }`}
        >
          {notice.error ? <AlertCircle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}
          <span className="flex-1">{notice.text}</span>
          <Button variant="ghost" size="sm" onClick={() => setNotice(null)} className="h-6 w-6 p-0">
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-4">
        <TabsList className="grid grid-cols-3 h-auto min-h-10 w-full sm:w-[480px] p-1 bg-muted/60 gap-1">
          <TabsTrigger value="compose" className="text-xs font-bold gap-2 min-h-[34px]">
            <Send className="size-3.5 rtl:rotate-180" />
            <span>{tr("Compose & Broadcast", "إنشاء وإرسال")}</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs font-bold gap-2 min-h-[34px]">
            <Layers className="size-3.5" />
            <span>{tr("Templates Library", "مكتبة القوالب")}</span>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{templates.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="logs" className="text-xs font-bold gap-2 min-h-[34px]">
            <Clock className="size-3.5" />
            <span>{tr("Dispatch History", "سجل الإرسال")}</span>
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: COMPOSE & BROADCAST ──────────────────────────────────── */}
        <TabsContent value="compose" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Column: Configuration & Content (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* 1. Audience Selector Card */}
              <Card className="shadow-none border-primary/20">
                <CardHeader className="pb-3 bg-muted/20">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Users className="size-4 text-primary" />
                    <span>{tr("1. Select Target Audience", "1. تحديد الفئة المستهدفة")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: "students", labelEn: "Students (All / Active)", labelAr: "الطلاب (الكل / النشطين)", icon: GraduationCap },
                      { id: "course_enrolled", labelEn: "Course Enrolled", labelAr: "طلاب مساق محدد", icon: ShieldCheck },
                      { id: "marketing", labelEn: "Marketing Campaign", labelAr: "حملة تسويقية عامة", icon: Tag },
                      { id: "staff", labelEn: "Staff & Mentors", labelAr: "الكادر والمدربون", icon: ShieldCheck },
                      { id: "single_user", labelEn: "Single User", labelAr: "مستخدم محدد", icon: UserIcon },
                      { id: "custom_set", labelEn: "Custom User List", labelAr: "قائمة مخصصة", icon: Users },
                    ].map((aud) => {
                      const Icon = aud.icon
                      const isSelected = targetAudience === aud.id
                      return (
                        <button
                          key={aud.id}
                          type="button"
                          onClick={() => {
                            setTargetAudience(aud.id as EmailTargetAudience)
                            if (aud.id === "marketing") {
                              setCampaignType("marketing")
                              setSelectedTemplateId("marketing_promo")
                            } else {
                              setCampaignType("announcement")
                              if (selectedTemplateId === "marketing_promo") {
                                setSelectedTemplateId("system_announcement")
                              }
                            }
                          }}
                          className={`p-3 rounded-xl border text-start transition-all flex flex-col gap-1.5 ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                              : "border-border/60 hover:bg-muted/40"
                          }`}
                        >
                          <Icon className={`size-4 ${isSelected ? "text-primary font-bold" : "text-muted-foreground"}`} />
                          <span className="text-xs font-bold text-foreground leading-tight">{tr(aud.labelEn, aud.labelAr)}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Sub-Filters based on Audience Selection */}
                  {targetAudience === "students" && (
                    <div className="p-3 bg-muted/30 rounded-xl border flex items-center justify-between">
                      <Label className="text-xs font-bold">{tr("Student Status Filter:", "حالة حساب الطالب:")}</Label>
                      <Select value={studentStatus} onValueChange={(v) => setStudentStatus(v as "all" | "active_only")}>
                        <SelectTrigger className="w-48 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{tr("All Registered Students", "جميع الطلاب المسجلين")}</SelectItem>
                          <SelectItem value="active_only">{tr("Active Students Only", "الطلاب النشطين فقط")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {targetAudience === "course_enrolled" && (
                    <div className="p-3 bg-muted/30 rounded-xl border space-y-2">
                      <Label className="text-xs font-bold">{tr("Select Course:", "اختر المساق الدراسي:")}</Label>
                      <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                        <SelectTrigger className="w-full h-9 text-xs">
                          <SelectValue placeholder={tr("Choose a course...", "اختر المساق...")} />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {isAr ? c.title_ar : c.title_en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(targetAudience === "single_user" || targetAudience === "custom_set") && (
                    <div className="p-3 bg-muted/30 rounded-xl border space-y-3">
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        <Search className="size-3.5 text-primary" />
                        <span>{tr("Search & Select Users:", "البحث وتحديد المستخدمين:")}</span>
                      </Label>
                      <div className="relative">
                        <Input
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          placeholder={tr("Type name or email to search...", "اكتب اسم المستخدم أو بريده للبحث...")}
                          className="text-xs h-9"
                        />
                        {searchingUsers && (
                          <Loader2 className="size-3.5 animate-spin absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        )}
                      </div>

                      {searchResults.length > 0 && (
                        <div className="max-h-40 overflow-y-auto rounded-lg border bg-background p-1 divide-y divide-border/40">
                          {searchResults.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                if (targetAudience === "single_user") {
                                  setSelectedUsers([u])
                                } else if (!selectedUsers.some((x) => x.id === u.id)) {
                                  setSelectedUsers((prev) => [...prev, u])
                                }
                                setUserSearchQuery("")
                                setSearchResults([])
                              }}
                              className="w-full p-2 text-start text-xs hover:bg-muted/60 flex items-center justify-between rounded-sm"
                            >
                              <span className="font-bold">{u.full_name || u.email}</span>
                              <Badge variant="outline" className="text-[10px]">{u.role}</Badge>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Selected chips */}
                      {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedUsers.map((u) => (
                            <span
                              key={u.id}
                              className="inline-flex items-center gap-1.5 bg-primary/15 text-primary px-2.5 py-1 rounded-full text-xs font-semibold"
                            >
                              <span>{u.full_name || u.email}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedUsers((prev) => prev.filter((x) => x.id !== u.id))}
                                className="hover:text-destructive"
                              >
                                <X className="size-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {targetAudience === "custom_set" && (
                        <div className="space-y-1.5 pt-2 border-t">
                          <Label className="text-[11px] font-bold text-muted-foreground">
                            {tr("Or paste comma/line-separated emails:", "أو الصق قائمة إيميلات مفصولة بفواصل:")}
                          </Label>
                          <Textarea
                            value={customEmailsInput}
                            onChange={(e) => setCustomEmailsInput(e.target.value)}
                            placeholder="student1@uni.edu, student2@uni.edu..."
                            rows={2}
                            className="text-xs"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 2. Template Selector Card */}
              <Card className="shadow-none border-primary/20">
                <CardHeader className="pb-3 bg-muted/20">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Layers className="size-4 text-primary" />
                    <span>{tr("2. Choose Template", "2. اختيار قالب البريد")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {templates.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplateId(tpl.id.startsWith("system") ? tpl.name : tpl.id)
                          if (tpl.category === "marketing") {
                            setCampaignType("marketing")
                          }
                        }}
                        className={`p-3 rounded-xl border text-start transition-all flex flex-col gap-1 ${
                          selectedTemplateId === (tpl.id.startsWith("system") ? tpl.name : tpl.id)
                            ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                            : "border-border/60 hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate">{isAr ? tpl.title_ar : tpl.title_en}</span>
                          <Badge variant="outline" className="text-[9px] uppercase px-1 py-0">{tpl.category}</Badge>
                        </div>
                        <span className="text-[11px] text-muted-foreground line-clamp-1">{tpl.subject_template}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSelectedTemplateId("custom_uploaded_html")}
                      className={`p-3 rounded-xl border text-start transition-all flex flex-col gap-1 ${
                        selectedTemplateId === "custom_uploaded_html"
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                          : "border-border/60 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary flex items-center gap-1">
                          <Code className="size-3" />
                          {tr("Custom Raw HTML", "شفرة HTML مخصصة")}
                        </span>
                        <Badge variant="secondary" className="text-[9px]">Custom</Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{tr("Paste raw HTML code directly", "لصق كود HTML حر")}</span>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* 3. Campaign Content Fields */}
              <Card className="shadow-none border-primary/20">
                <CardHeader className="pb-3 bg-muted/20">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    <span>{tr("3. Campaign Content & Details", "3. محتوى وبيانات الرسالة")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Subject Line */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold flex items-center justify-between">
                      <span>{tr("Email Subject Line *", "عنوان الرسالة (Subject) *")}</span>
                      <span className="text-[10px] text-muted-foreground">Supports placeholders: &#123;&#123;user_name&#125;&#125;</span>
                    </Label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={campaignType === "marketing" ? "⭐ Special Opportunity: {{title_en}}" : "[PharmaCore] 📢 Important Academic Announcement"}
                      className="text-xs font-medium"
                      required
                    />
                  </div>

                  {selectedTemplateId === "custom_uploaded_html" ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">{tr("Raw HTML Code", "كود الـ HTML المخصص")}</Label>
                      <Textarea
                        value={customHtmlBody}
                        onChange={(e) => setCustomHtmlBody(e.target.value)}
                        placeholder="<html><body><h1>Hello {{user_name}}</h1><p>...</p></body></html>"
                        rows={10}
                        className="font-mono text-xs"
                      />
                    </div>
                  ) : (
                    <>
                      {/* Titles */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">{tr("Headline (English) *", "العنوان البارز (EN) *")}</Label>
                          <Input
                            value={titleEn}
                            onChange={(e) => setTitleEn(e.target.value)}
                            placeholder="e.g. Clinical Pharmacology Masterclass Update"
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">{tr("Headline (Arabic) *", "العنوان البارز (AR) *")}</Label>
                          <Input
                            value={titleAr}
                            onChange={(e) => setTitleAr(e.target.value)}
                            placeholder="مثال: تحديث في مساق علم الأدوية السريري"
                            className="text-xs"
                            dir="rtl"
                          />
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">{tr("Message Body (English) *", "نص الرسالة (EN) *")}</Label>
                          <Textarea
                            value={messageEn}
                            onChange={(e) => setMessageEn(e.target.value)}
                            placeholder="Detailed explanation, instructions, or promotional details..."
                            rows={4}
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">{tr("Message Body (Arabic) *", "نص الرسالة (AR) *")}</Label>
                          <Textarea
                            value={messageAr}
                            onChange={(e) => setMessageAr(e.target.value)}
                            placeholder="التفاصيل والتوجيهات الأكاديمية أو التسويقية..."
                            rows={4}
                            className="text-xs"
                            dir="rtl"
                          />
                        </div>
                      </div>

                      {/* Marketing Specific Fields */}
                      {campaignType === "marketing" && (
                        <div className="grid gap-3 sm:grid-cols-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-amber-900 dark:text-amber-200">{tr("Promo Badge", "شارة العرض")}</Label>
                            <Input
                              value={promoBadge}
                              onChange={(e) => setPromoBadge(e.target.value)}
                              placeholder="LIMITED TIME"
                              className="text-xs h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-amber-900 dark:text-amber-200">{tr("Promo Code", "كود الخصم / الوصول")}</Label>
                            <Input
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value)}
                              placeholder="PHARMA2026"
                              className="text-xs h-8 font-mono uppercase"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-amber-900 dark:text-amber-200">{tr("Subtitle (EN)", "العنوان الفرعي")}</Label>
                            <Input
                              value={subtitleEn}
                              onChange={(e) => setSubtitleEn(e.target.value)}
                              placeholder="Exclusive clinical series"
                              className="text-xs h-8"
                            />
                          </div>
                        </div>
                      )}

                      {/* Action Link & Buttons */}
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">{tr("Action Button URL", "رابط زر الإجراء")}</Label>
                          <Input
                            value={actionUrl}
                            onChange={(e) => setActionUrl(e.target.value)}
                            placeholder="https://pharma-core-edu.vercel.app/course/..."
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">{tr("Button Label (EN)", "نص الزر (EN)")}</Label>
                          <Input
                            value={actionTextEn}
                            onChange={(e) => setActionTextEn(e.target.value)}
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">{tr("Button Label (AR)", "نص الزر (AR)")}</Label>
                          <Input
                            value={actionTextAr}
                            onChange={(e) => setActionTextAr(e.target.value)}
                            className="text-xs"
                            dir="rtl"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* In-app notification checkbox */}
                  <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold">{tr("Mirror to In-App Notification Bell", "إرسال نسخة إلى جرس الإشعارات داخل المنصة")}</p>
                      <p className="text-[11px] text-muted-foreground">{tr("Inserts notification alerts for registered students in real-time.", "يتم إدراج إشعار في حسابات الطلاب المسجلين فورًا.")}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={sendInAppNotif}
                      onClick={() => setSendInAppNotif((prev) => !prev)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        sendInAppNotif ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    >
                      <span className={`inline-block size-4 transform rounded-full bg-white shadow-sm transition duration-200 ${sendInAppNotif ? (isAr ? "-translate-x-4" : "translate-x-4") : "translate-x-0"}`} />
                    </button>
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={testing || dispatching}
                      onClick={handleSendTestEmail}
                      className="text-xs font-bold gap-1.5"
                    >
                      {testing ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5 text-primary" />}
                      <span>{testing ? tr("Sending Test...", "جارٍ إرسال التجربة...") : tr("Send Test to My Email", "إرسال تجربة لبريدي")}</span>
                    </Button>

                    <Button
                      type="button"
                      disabled={dispatching || !canSend}
                      onClick={() => setConfirmModalOpen(true)}
                      className="text-xs font-bold gap-1.5 min-w-[160px]"
                    >
                      <Send className="size-3.5 rtl:rotate-180" />
                      <span>{tr("Review & Dispatch Campaign", "مراجعة وإرسال الحملة")}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Live Responsive Preview (5 Cols) */}
            <div className="lg:col-span-5 space-y-3">
              <Card className="shadow-none border-primary/20 sticky top-24">
                <CardHeader className="p-3.5 border-b bg-muted/20 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="size-4 text-primary" />
                    <CardTitle className="text-xs font-bold">{tr("Live Responsive Preview", "المعاينة التفاعلية المباشرة")}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border">
                    <Button
                      variant={previewMode === "desktop" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPreviewMode("desktop")}
                      className="h-6 px-2 text-[10px] font-bold"
                    >
                      Desktop
                    </Button>
                    <Button
                      variant={previewMode === "mobile" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPreviewMode("mobile")}
                      className="h-6 px-2 text-[10px] font-bold gap-1"
                    >
                      <Smartphone className="size-3" />
                      Mobile
                    </Button>
                    <Button
                      variant={previewMode === "code" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPreviewMode("code")}
                      className="h-6 px-2 text-[10px] font-bold"
                    >
                      <Code className="size-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  {previewMode === "code" ? (
                    <div className="rounded-xl border bg-slate-950 text-slate-100 p-3 max-h-[600px] overflow-auto font-mono text-[11px]">
                      <pre className="whitespace-pre-wrap">{previewHtml}</pre>
                    </div>
                  ) : (
                    <div
                      className={`mx-auto transition-all border rounded-xl overflow-hidden shadow-inner bg-slate-100 dark:bg-slate-900 ${
                        previewMode === "mobile" ? "max-w-[340px] h-[560px]" : "w-full h-[600px]"
                      }`}
                    >
                      {previewLoading && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-xs grid place-items-center z-10">
                          <Loader2 className="size-6 animate-spin text-primary" />
                        </div>
                      )}
                      <iframe
                        srcDoc={previewHtml}
                        title="Email Preview"
                        className="w-full h-full border-0"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 2: TEMPLATES LIBRARY ─────────────────────────────────────── */}
        <TabsContent value="templates" className="space-y-4">
          {loadingTemplates ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-xs font-semibold">{tr("Loading templates...", "جارٍ تحميل القوالب...")}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((tpl) => (
              <Card key={tpl.id} className="shadow-none card-interactive border-border/80 flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold">{tpl.category}</Badge>
                    {tpl.is_default && <Badge className="text-[9px] bg-primary/20 text-primary border-primary/30">Default</Badge>}
                  </div>
                  <CardTitle className="text-sm font-bold mt-2">{isAr ? tpl.title_ar : tpl.title_en}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {isAr ? tpl.description_ar || tpl.description_en : tpl.description_en}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="p-2.5 rounded-lg bg-muted/40 font-mono text-[11px] text-muted-foreground truncate">
                    {tpl.subject_template}
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewingTemplate(tpl)}
                      className="text-xs h-7 gap-1 font-bold"
                    >
                      <Eye className="size-3" />
                      <span>{tr("Preview", "معاينة")}</span>
                    </Button>

                    {!tpl.is_default && tpl.category !== "system" && isDev && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="text-xs h-7 p-0 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </TabsContent>

        {/* ── TAB 3: DISPATCH HISTORY & LOGS ───────────────────────────────── */}
        <TabsContent value="logs" className="space-y-4">
          <Card className="shadow-none">
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <span>{tr("Email Campaign Records", "سجل الحملات والمراسلات السابقة")}</span>
              </CardTitle>
              <Button size="sm" variant="ghost" onClick={loadLogs} className="h-8 gap-1 text-xs">
                <RefreshCw className={`size-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
                <span>{tr("Refresh", "تحديث")}</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-muted/40 border-b text-muted-foreground font-bold">
                    <tr>
                      <th className="p-3 text-start">{tr("Date & Time", "التاريخ والوقت")}</th>
                      <th className="p-3 text-start">{tr("Campaign Subject", "عنوان الحملة")}</th>
                      <th className="p-3 text-start">{tr("Audience", "الفئة")}</th>
                      <th className="p-3 text-start">{tr("Recipients", "المستلمون")}</th>
                      <th className="p-3 text-start">{tr("Sender", "المرسل")}</th>
                      <th className="p-3 text-start">{tr("Status", "الحالة")}</th>
                      <th className="p-3 text-end">{tr("Details", "التفاصيل")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/20">
                        <td className="p-3 font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString(isAr ? "ar-EG" : "en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-3 font-bold text-foreground max-w-[220px] truncate">{log.subject}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] capitalize font-semibold">{log.target_audience}</Badge>
                        </td>
                        <td className="p-3 font-bold">{log.recipient_count}</td>
                        <td className="p-3 text-muted-foreground">{log.sender?.full_name || "Admin"}</td>
                        <td className="p-3">
                          <Badge
                            className={`text-[10px] ${
                              log.delivery_status === "completed"
                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                : log.delivery_status === "simulated"
                                ? "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30"
                                : "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30"
                            }`}
                          >
                            {log.delivery_status}
                          </Badge>
                        </td>
                        <td className="p-3 text-end">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedLog(log)} className="h-7 text-xs px-2">
                            {tr("View", "عرض")}
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!logs.length && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          {tr("No email broadcast records found yet.", "لا توجد سجلات حملات بريدية مرسلة بعد.")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── CONFIRMATION MODAL ────────────────────────────────────────────── */}
      {confirmModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs grid place-items-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl border-primary/30">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Send className="size-4 text-primary" />
                <span>{tr("Confirm Email Campaign Dispatch", "تأكيد إرسال الحملة البريدية")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded-lg bg-muted/40">
                  <span className="font-bold text-muted-foreground">{tr("Target Audience:", "الفئة المستهدفة:")}</span>
                  <span className="font-bold text-foreground capitalize">{targetAudience}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-muted/40">
                  <span className="font-bold text-muted-foreground">{tr("Campaign Subject:", "عنوان الرسالة:")}</span>
                  <span className="font-bold text-foreground truncate max-w-[200px]">{subject || titleEn}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-muted/40">
                  <span className="font-bold text-muted-foreground">{tr("In-App Notification Mirror:", "إشعار داخل المنصة:")}</span>
                  <span className="font-bold text-emerald-600">{sendInAppNotif ? tr("Enabled", "مفعل") : tr("Disabled", "معطل")}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-semibold">
                ⚠️ {tr("Emails will be dispatched to all matching users who have active notifications enabled.", "سيتم إرسال البريد لجميع المستخدمين المطابقين الذين لم يوقفوا استلام الإشعارات.")}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setConfirmModalOpen(false)}>
                  {tr("Cancel", "إلغاء")}
                </Button>
                <Button size="sm" disabled={dispatching} onClick={handleDispatchCampaign} className="gap-1.5 font-bold">
                  {dispatching ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4 rtl:rotate-180" />}
                  <span>{dispatching ? tr("Dispatching...", "جارٍ الإرسال...") : tr("Confirm & Send Now", "تأكيد وإرسال الآن")}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── UPLOAD / CREATE TEMPLATE MODAL ────────────────────────────────── */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs grid place-items-center z-50 p-4">
          <Card className="w-full max-w-2xl shadow-2xl border-primary/30 max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <UploadCloud className="size-5 text-primary" />
                <span>{tr("Upload / Create Email Template", "رفع / إنشاء قالب بريد جديد")}</span>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setUploadModalOpen(false)} className="h-6 w-6 p-0">
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleSaveNewTemplate} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{tr("Template Name (Slug) *", "اسم القالب (Slug) *")}</Label>
                    <Input
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="e.g. clinical-fall-newsletter"
                      required
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{tr("Category", "التصنيف")}</Label>
                    <Select value={newTemplateCategory} onValueChange={(v) => setNewTemplateCategory(v as typeof newTemplateCategory)}>
                      <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="announcement">{tr("Academic Announcement", "إعلان أكاديمي")}</SelectItem>
                        <SelectItem value="marketing">{tr("Marketing / Promo", "حملة تسويقية")}</SelectItem>
                        <SelectItem value="custom">{tr("Custom Brand", "قالب مخصص")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{tr("Title (English) *", "عنوان القالب (EN) *")}</Label>
                    <Input value={newTemplateTitleEn} onChange={(e) => setNewTemplateTitleEn(e.target.value)} required className="text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{tr("Title (Arabic) *", "عنوان القالب (AR) *")}</Label>
                    <Input value={newTemplateTitleAr} onChange={(e) => setNewTemplateTitleAr(e.target.value)} required className="text-xs" dir="rtl" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">{tr("Subject Line Template *", "قالب عنوان الرسالة (Subject) *")}</Label>
                  <Input value={newTemplateSubject} onChange={(e) => setNewTemplateSubject(e.target.value)} required className="text-xs" />
                </div>

                {/* Upload HTML File Dropzone */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">{tr("Upload HTML File (or paste below)", "رفع ملف HTML (أو الصق الشفرة أدناه)")}</Label>
                  <input
                    type="file"
                    accept=".html,.htm,.txt"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-muted-foreground file:me-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">{tr("HTML Template Code *", "شفرة الـ HTML *")}</Label>
                  <Textarea
                    value={newTemplateHtml}
                    onChange={(e) => setNewTemplateHtml(e.target.value)}
                    placeholder="<!DOCTYPE html><html><body>...</body></html>"
                    rows={8}
                    required
                    className="font-mono text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <Button variant="outline" size="sm" type="button" onClick={() => setUploadModalOpen(false)}>
                    {tr("Cancel", "إلغاء")}
                  </Button>
                  <Button size="sm" type="submit" disabled={savingTemplate} className="font-bold">
                    {savingTemplate ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                    <span>{savingTemplate ? tr("Saving...", "جارٍ الحفظ...") : tr("Save Template", "حفظ القالب")}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── PREVIEW TEMPLATE MODAL ────────────────────────────────────────── */}
      {previewingTemplate && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs grid place-items-center z-50 p-4">
          <Card className="w-full max-w-3xl shadow-2xl border-primary/30 h-[85vh] flex flex-col">
            <CardHeader className="p-3.5 border-b bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold">
                {isAr ? previewingTemplate.title_ar : previewingTemplate.title_en}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setPreviewingTemplate(null)} className="h-6 w-6 p-0">
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-3 flex-1 overflow-hidden">
              <iframe
                srcDoc={previewingTemplate.html_content}
                title="Template Preview"
                className="w-full h-full border-0 rounded-xl bg-white"
                sandbox="allow-same-origin"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── LOG DETAILS MODAL ─────────────────────────────────────────────── */}
      {selectedLog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs grid place-items-center z-50 p-4">
          <Card className="w-full max-w-lg shadow-2xl border-primary/30">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <span>{tr("Campaign Dispatch Details", "تفاصيل الحملة البريدية")}</span>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)} className="h-6 w-6 p-0">
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-muted-foreground">{tr("Subject:", "عنوان الرسالة:")}</p>
                <p className="font-extrabold text-foreground">{selectedLog.subject}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div>
                  <p className="font-bold text-muted-foreground">{tr("Audience:", "الفئة المستهدفة:")}</p>
                  <Badge variant="outline" className="text-[10px] capitalize mt-0.5">{selectedLog.target_audience}</Badge>
                </div>
                <div>
                  <p className="font-bold text-muted-foreground">{tr("Total Recipients:", "عدد المستلمين:")}</p>
                  <p className="font-extrabold text-foreground mt-0.5">{selectedLog.recipient_count}</p>
                </div>
              </div>
              <div className="space-y-1 pt-2 border-t">
                <p className="font-bold text-muted-foreground">{tr("Sample Recipients:", "عينة من المستلمين:")}</p>
                <div className="flex flex-wrap gap-1">
                  {selectedLog.sample_recipients?.map((email) => (
                    <span key={email} className="px-2 py-0.5 bg-muted rounded text-[11px] font-mono">{email}</span>
                  ))}
                </div>
              </div>
              <div className="space-y-1 pt-2 border-t">
                <p className="font-bold text-muted-foreground">{tr("Timestamp:", "توقيت الإرسال:")}</p>
                <p className="font-mono text-muted-foreground">{new Date(selectedLog.created_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
