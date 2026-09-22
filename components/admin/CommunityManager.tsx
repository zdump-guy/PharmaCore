import { useState } from "react"
import {
  FiAlertCircle as AlertCircle,
  FiCheckCircle as CheckCircle2,
  FiClock as Clock,
  FiEyeOff as EyeOff,
  FiHelpCircle as HelpCircle,
  FiLoader as Loader2,
  FiMail as Mail,
  FiMessageCircle as MessageCircle,
  FiSearch as Search,
  FiSend as Send,
  FiShield as ShieldCheck,
  FiTrash2 as Trash2,
  FiVolume2 as Volume2,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabaseClient"
import type { CommunityQuestion, Lecture, UserProfile } from "@/types"

interface CommunityManagerProps {
  isAr: boolean
  searchQuery: string
  community: CommunityQuestion[]
  lectures: Lecture[]
  profile: UserProfile | null
  reply: Record<string, string>
  setReply: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onSendReply: (questionId: string) => void
  onDeleteQuestion?: (questionId: string) => Promise<void> | void
  onDeleteAnswer?: (answerId: string, questionId: string) => Promise<void> | void
}

export default function CommunityManager({
  isAr,
  searchQuery,
  community,
  lectures,
  profile,
  reply,
  setReply,
  onSendReply,
  onDeleteQuestion,
  onDeleteAnswer,
}: CommunityManagerProps) {
  const [activeTab, setActiveTab] = useState<"unanswered" | "answered" | "broadcast">("unanswered")
  const [localSearch, setLocalSearch] = useState("")
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null)
  const [deletingAnswerId, setDeletingAnswerId] = useState<string | null>(null)

  // Broadcast state
  const [annTitleEn, setAnnTitleEn] = useState("")
  const [annTitleAr, setAnnTitleAr] = useState("")
  const [annMessageEn, setAnnMessageEn] = useState("")
  const [annMessageAr, setAnnMessageAr] = useState("")
  const [targetAudience, setTargetAudience] = useState<"all" | "active_only">("all")
  const [sendEmailAlert, setSendEmailAlert] = useState(true)
  const [actionUrl, setActionUrl] = useState("")
  const [broadcasting, setBroadcasting] = useState(false)
  const [broadcastNotice, setBroadcastNotice] = useState<{ error?: boolean; text: string } | null>(null)

  const tr = (en: string, ar: string) => (isAr ? ar : en)
  const effectiveSearch = (searchQuery || localSearch).trim().toLowerCase()
  const canBroadcast = profile && ["dev", "super_admin"].includes(profile.role)
  const isDev = profile?.role === "dev"

  const handleDeleteQuestion = async (questionId: string) => {
    if (!onDeleteQuestion) return
    setDeletingQuestionId(questionId)
    try {
      await onDeleteQuestion(questionId)
    } finally {
      setDeletingQuestionId(null)
    }
  }

  const handleDeleteAnswer = async (answerId: string, questionId: string) => {
    if (!onDeleteAnswer) return
    setDeletingAnswerId(answerId)
    try {
      await onDeleteAnswer(answerId, questionId)
    } finally {
      setDeletingAnswerId(null)
    }
  }

  const getLectureName = (lectureId: string | null) => {
    const lecture = lectures.find((l) => l.id === lectureId)
    return lecture ? (isAr ? lecture.title_ar : lecture.title_en) : null
  }

  const unanswered = community.filter((q) => !q.answers?.length)
  const answered = community.filter((q) => !!q.answers?.length)

  const filterQuestions = (list: CommunityQuestion[]) => {
    if (!effectiveSearch) return list
    return list.filter(
      (q) =>
        q.author_name.toLowerCase().includes(effectiveSearch) ||
        q.text.toLowerCase().includes(effectiveSearch) ||
        (getLectureName(q.lecture_id) || "").toLowerCase().includes(effectiveSearch)
    )
  }

  const filteredUnanswered = filterQuestions(unanswered)
  const filteredAnswered = filterQuestions(answered)

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setBroadcastNotice(null)

    if (!annTitleEn.trim() || !annTitleAr.trim() || !annMessageEn.trim() || !annMessageAr.trim()) {
      setBroadcastNotice({
        error: true,
        text: tr(
          "Please fill in both English and Arabic titles and messages.",
          "يرجى كتابة عنوان ونص الإعلان باللغتين العربية والإنجليزية."
        ),
      })
      return
    }

    setBroadcasting(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) throw new Error(tr("Session expired", "انتهت الجلسة"))

      const res = await fetch("/api/admin/announcements/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title_en: annTitleEn.trim(),
          title_ar: annTitleAr.trim(),
          message_en: annMessageEn.trim(),
          message_ar: annMessageAr.trim(),
          target_audience: targetAudience,
          send_email_alert: sendEmailAlert,
          action_url: actionUrl.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to broadcast announcement.")

      setBroadcastNotice({
        error: false,
        text: isAr
          ? `تم إرسال الإعلان بنجاح إلى ${data.count} طالب (${data.emailsDispatched} إشعار بريد إلكتروني).`
          : `Announcement successfully broadcast to ${data.count} student(s) (${data.emailsDispatched} email alerts dispatched).`,
      })

      // Reset fields
      setAnnTitleEn("")
      setAnnTitleAr("")
      setAnnMessageEn("")
      setAnnMessageAr("")
      setActionUrl("")
    } catch (err: unknown) {
      setBroadcastNotice({
        error: true,
        text: err instanceof Error ? err.message : tr("Broadcast failed.", "فشل إرسال الإعلان."),
      })
    } finally {
      setBroadcasting(false)
    }
  }

  const renderQuestionCard = (question: CommunityQuestion) => {
    const isUnanswered = !question.answers?.length
    const lectureTitle = getLectureName(question.lecture_id)
    const replyText = reply[question.id] ?? ""

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (replyText.trim()) {
          onSendReply(question.id)
        }
      }
    }

    return (
      <Card
        key={question.id}
        className={`card-interactive shadow-none transition-all ${
          isUnanswered ? "border-amber-500/30 bg-amber-500/[0.02]" : ""
        }`}
      >
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Header */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`grid size-9 sm:size-10 shrink-0 place-items-center rounded-full font-bold text-sm ${
                  question.is_anonymous
                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {question.is_anonymous ? <EyeOff className="size-4" /> : question.author_name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="font-extrabold text-sm text-foreground truncate">{question.author_name}</p>
                  {question.is_anonymous && (
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 px-1.5 font-bold border-purple-500/40 text-purple-700 dark:text-purple-300 bg-purple-500/10 gap-1"
                    >
                      <EyeOff className="size-2.5" />
                      <span>{tr("Anonymous to Students", "مجهول للطلاب")}</span>
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  {question.author_email && (
                    <>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-foreground/70">
                        <Mail className="size-3" />
                        {question.author_email}
                      </span>
                      <span>·</span>
                    </>
                  )}
                  <Clock className="size-3 shrink-0" />
                  <span suppressHydrationWarning>
                    {new Date(question.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {lectureTitle && (
                    <>
                      <span>·</span>
                      <span className="font-medium truncate max-w-[160px] sm:max-w-[240px] text-foreground/80">
                        {lectureTitle}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-start shrink-0">
              <Badge
                variant={isUnanswered ? "outline" : "secondary"}
                className={`badge-nowrap text-xs font-semibold gap-1 ${
                  isUnanswered ? "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10" : ""
                }`}
              >
                {isUnanswered ? (
                  <>
                    <HelpCircle className="size-3 shrink-0" />
                    <span>{tr("Awaiting Answer", "بانتظار الإجابة")}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{tr("Answered", "تمت الإجابة")}</span>
                  </>
                )}
              </Badge>

              {isDev && onDeleteQuestion && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={deletingQuestionId === question.id}
                  onClick={() => {
                    if (
                      window.confirm(
                        tr(
                          "Are you sure you want to delete this question and all its answers? This action cannot be undone.",
                          "هل أنت متأكد من رغبتك في حذف هذا السؤال وجميع إجاباته؟ لا يمكن التراجع عن هذا الإجراء."
                        )
                      )
                    ) {
                      handleDeleteQuestion(question.id)
                    }
                  }}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title={tr("Delete Question (Dev Only)", "حذف السؤال (خاص بالمطور)")}
                  aria-label={tr("Delete Question", "حذف السؤال")}
                >
                  {deletingQuestionId === question.id ? (
                    <Loader2 className="size-3.5 animate-spin text-destructive" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Question Text */}
          <div className="rounded-xl bg-muted/30 p-3.5 sm:p-4">
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{question.text}</p>
          </div>

          {/* Previous Staff Answers */}
          {question.answers && question.answers.length > 0 && (
            <div className="space-y-2.5 ps-2.5 sm:ps-5 border-s-2 border-primary/40">
              {question.answers.map((ans) => (
                <div key={ans.id} className="rounded-xl bg-secondary/40 p-3 sm:p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-primary">
                      <ShieldCheck className="size-3.5" />
                      {tr("Staff Educator Answer", "إجابة المرشد / المشرف")}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(ans.created_at).toLocaleTimeString(isAr ? "ar-EG" : "en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isDev && onDeleteAnswer && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={deletingAnswerId === ans.id}
                          onClick={() => {
                            if (
                              window.confirm(
                                tr(
                                  "Are you sure you want to delete this educator response?",
                                  "هل أنت متأكد من رغبتك في حذف إجابة المرشد هذه؟"
                                )
                              )
                            ) {
                              handleDeleteAnswer(ans.id, question.id)
                            }
                          }}
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title={tr("Delete Answer (Dev Only)", "حذف الإجابة (خاص بالمطور)")}
                          aria-label={tr("Delete Answer", "حذف الإجابة")}
                        >
                          {deletingAnswerId === ans.id ? (
                            <Loader2 className="size-3 animate-spin text-destructive" />
                          ) : (
                            <Trash2 className="size-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">{ans.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Reply composer */}
          <div className="flex flex-col gap-2 sm:flex-row pt-1">
            <Input
              value={replyText}
              onChange={(e) => setReply((prev) => ({ ...prev, [question.id]: e.target.value }))}
              onKeyDown={handleKeyDown}
              placeholder={
                question.answers?.length
                  ? tr("Add a follow-up answer (Ctrl+Enter)...", "أضف ردًا توضيحيًا إضافيًا (Ctrl+Enter)...")
                  : tr("Write an educator response (Ctrl+Enter)...", "اكتب إجابة علمية واضحة للطالب (Ctrl+Enter)...")
              }
              className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]"
            />
            <Button
              size="sm"
              onClick={() => onSendReply(question.id)}
              disabled={!replyText.trim()}
              className="btn-nowrap gap-1.5 font-bold shrink-0 text-xs min-h-[40px] sm:min-h-[36px] w-full sm:w-auto"
            >
              <Send className="size-3.5 rtl:rotate-180 shrink-0" />
              <span>{tr("Send Answer", "إرسال الإجابة")}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* Header & Stats */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageCircle className="size-5 text-primary" />
            <h3 className="text-xl font-bold tracking-tight">{tr("Student Q&A & Announcements", "إدارة أسئلة واستفسارات وإعلانات الطلاب")}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {tr(
              "Review student inquiries, answer lecture questions, and broadcast official announcements to learners.",
              "متابعة استفسارات الطلاب، والرد على أسئلة المحاضرات، وإرسال التنبيهات والإعلانات العامة لجميع الطلاب."
            )}
          </p>
        </div>

        {/* Search */}
        {activeTab !== "broadcast" && (
          <div className="relative w-full sm:w-60">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={tr("Search questions & students...", "بحث بالاسم أو نص السؤال...")}
              className="h-9 ps-8 pe-3 text-xs w-full"
            />
          </div>
        )}
      </div>

      {/* Tabs: Unanswered vs Answered vs Broadcast */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)} className="space-y-4">
        <TabsList className="grid grid-cols-3 h-auto min-h-10 w-full sm:w-[480px] p-1 bg-muted/60 gap-1">
          <TabsTrigger value="unanswered" className="badge-nowrap text-xs font-bold gap-2 min-h-[34px]">
            <span>{tr("Unanswered", "غير مجابة")}</span>
            <Badge
              variant={unanswered.length > 0 ? "destructive" : "secondary"}
              className="badge-nowrap h-4 px-1.5 text-[10px] shrink-0"
            >
              {unanswered.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="answered" className="badge-nowrap text-xs font-bold gap-2 min-h-[34px]">
            <span>{tr("Answered", "تمت الإجابة")}</span>
            <Badge variant="secondary" className="badge-nowrap h-4 px-1.5 text-[10px] shrink-0">
              {answered.length}
            </Badge>
          </TabsTrigger>

          {canBroadcast && (
            <TabsTrigger value="broadcast" className="badge-nowrap text-xs font-bold gap-1.5 min-h-[34px]">
              <Volume2 className="size-3.5 text-primary shrink-0" />
              <span>{tr("Broadcast", "إرسال إعلان")}</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* 1. Unanswered Tab */}
        <TabsContent value="unanswered" className="space-y-4">
          {filteredUnanswered.map(renderQuestionCard)}

          {!filteredUnanswered.length && (
            <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              <div>
                <CheckCircle2 className="mx-auto size-8 text-emerald-500 opacity-80" />
                <p className="mt-2 font-bold text-sm text-foreground">
                  {tr("All caught up!", "تمت الإجابة عن جميع الأسئلة!")}
                </p>
                <p className="mt-1 text-xs">
                  {tr("There are no pending questions awaiting educator answers.", "لا توجد أسئلة معلقة بانتظار رد المرشد.")}
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* 2. Answered Tab */}
        <TabsContent value="answered" className="space-y-4">
          {filteredAnswered.map(renderQuestionCard)}

          {!filteredAnswered.length && (
            <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              <div>
                <MessageCircle className="mx-auto size-8 opacity-40" />
                <p className="mt-2 font-bold text-sm">
                  {tr("No answered questions yet", "لا توجد أسئلة مجاب عنها بعد")}
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* 3. Broadcast Announcement Tab */}
        {canBroadcast && (
          <TabsContent value="broadcast" className="space-y-4">
            <Card className="shadow-none border-primary/20">
              <CardHeader className="pb-3 border-b bg-primary/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Volume2 className="size-4 text-primary" />
                      <span>{tr("Broadcast Official Announcement", "إرسال إعلان وتنبيه رسمي للطلاب")}</span>
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {tr(
                        "Send simultaneous in-app notifications and transactional emails to enrolled students.",
                        "إرسال إشعارات فورية داخل حسابات الطلاب ورسائل بريد إلكتروني آلية ومحمية."
                      )}
                    </CardDescription>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/30 font-bold text-[10px]">
                    {tr("Super Admin", "الإدارة العليا")}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-5">
                {broadcastNotice && (
                  <div
                    className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                      broadcastNotice.error
                        ? "border-destructive/30 bg-destructive/10 text-destructive"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                    }`}
                  >
                    {broadcastNotice.error ? <AlertCircle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}
                    <span>{broadcastNotice.text}</span>
                  </div>
                )}

                <form onSubmit={handleSendBroadcast} className="space-y-4">
                  {/* Titles */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">{tr("Title (English)", "عنوان الإعلان (بالإنجليزية)")}</Label>
                      <Input
                        value={annTitleEn}
                        onChange={(e) => setAnnTitleEn(e.target.value)}
                        placeholder="e.g. New Live Review Session Scheduled"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">{tr("Title (Arabic)", "عنوان الإعلان (بالعربية)")}</Label>
                      <Input
                        value={annTitleAr}
                        onChange={(e) => setAnnTitleAr(e.target.value)}
                        placeholder="مثال: موعد جلسة المراجعة الإكلينيكية المباشرة"
                        required
                        dir="rtl"
                      />
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">{tr("Message (English)", "نص الإعلان (بالإنجليزية)")}</Label>
                      <Textarea
                        value={annMessageEn}
                        onChange={(e) => setAnnMessageEn(e.target.value)}
                        placeholder="Write detailed announcement content..."
                        rows={4}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">{tr("Message (Arabic)", "نص الإعلان (بالعربية)")}</Label>
                      <Textarea
                        value={annMessageAr}
                        onChange={(e) => setAnnMessageAr(e.target.value)}
                        placeholder="اكتب تفاصيل الإعلان والتوجيهات الأكاديمية..."
                        rows={4}
                        required
                        dir="rtl"
                      />
                    </div>
                  </div>

                  {/* Target Audience & Action Link */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">{tr("Target Audience", "الفئة المستهدفة")}</Label>
                      <Select
                        value={targetAudience}
                        onValueChange={(v) => setTargetAudience(v as "all" | "active_only")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{tr("All Registered Students", "جميع الطلاب المسجلين بالمنصة")}</SelectItem>
                          <SelectItem value="active_only">{tr("Active Students Only", "الطلاب المفعلين فقط (Active)")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">{tr("Action Button Link (Optional)", "رابط الإجراء السريع (اختياري)")}</Label>
                      <Input
                        value={actionUrl}
                        onChange={(e) => setActionUrl(e.target.value)}
                        placeholder="https://pharma-core-edu.vercel.app/course/..."
                      />
                    </div>
                  </div>

                  {/* Email Alert Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="space-y-0.5 pe-3">
                      <p className="text-xs font-bold flex items-center gap-1.5">
                        <Mail className="size-3.5 text-primary" />
                        <span>{tr("Send Resend Email Broadcast (Do Not Reply)", "إرسال نسخة بريد إلكتروني تلقائية (Do Not Reply)")}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {tr(
                          "Dispatches formatted bilingual email alerts with PharmaCore logo and automated unmonitored mailbox notices.",
                          "يتم إرسال تنبيهات بريد إلكتروني بشعار فارما كور وتنبيه واضح بعدم الرد المباشر على الرسالة الآلية."
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={sendEmailAlert}
                      onClick={() => setSendEmailAlert((prev) => !prev)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        sendEmailAlert ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          sendEmailAlert
                            ? isAr
                              ? "-translate-x-4"
                              : "translate-x-4"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={broadcasting}
                    className="gap-2 font-bold w-full sm:w-auto text-xs min-h-[40px]"
                  >
                    {broadcasting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4 rtl:rotate-180" />}
                    <span>{broadcasting ? tr("Broadcasting Announcement...", "جارٍ إرسال الإعلان...") : tr("Broadcast Announcement", "إرسال الإعلان الآن")}</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
