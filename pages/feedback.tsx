import type { GetServerSideProps } from "next"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations"
import {
  FiAlertCircle as AlertCircle,
  FiAlertTriangle as AlertTriangle,
  FiBookOpen as BookOpen,
  FiCheckCircle as CheckCircle2,
  FiChevronRight as ChevronRight,
  FiChevronLeft as ChevronLeft,
  FiCpu as Cpu,
  FiFileText as FileText,
  FiHelpCircle as HelpCircle,
  FiLoader as Loader2,
  FiLock as LockKeyhole,
  FiMail as Mail,
  FiMessageSquare as MessageSquare,
  FiMonitor as Monitor,
  FiPaperclip as Paperclip,
  FiSend as Send,
  FiShield as ShieldCheck,
  FiUser as User,
  FiVideo as FileVideo,
  FiZap as Zap,
} from "react-icons/fi"
import Layout from "@/components/Layout"
import Turnstile, { type TurnstileRef } from "@/components/Turnstile"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabaseClient"
import type {
  FeedbackDeviceInfo,
  FeedbackSeverity,
  FeedbackType,
  TechnicalCategory,
  AcademicCategory,
} from "@/types"

interface FeedbackPageProps {
  courses: Array<{ id: string; title_en: string; title_ar: string }>
}

export default function FeedbackPage({ courses }: FeedbackPageProps) {
  const router = useRouter()
  const isAr = router.locale === "ar"
  const tr = (en: string, ar: string) => (isAr ? ar : en)
  const DirectionArrow = isAr ? ChevronLeft : ChevronRight

  // Query parameter defaults
  const initialType = (router.query.type as string) === "academic" ? "academic" : "technical"
  const initialPage = (router.query.page as string) || ""
  const initialCourseId = (router.query.course as string) || ""

  const [feedbackType, setFeedbackType] = useState<FeedbackType>(initialType)

  // ─── Common Fields ──────────────────────────────────────────────────────────
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // ─── Technical Fields ───────────────────────────────────────────────────────
  const [techCategory, setTechCategory] = useState<TechnicalCategory>("visual")
  const [pagePreset, setPagePreset] = useState<string>(initialPage || "home")
  const [customPageUrl, setCustomPageUrl] = useState("")
  const [severity, setSeverity] = useState<FeedbackSeverity>("medium")
  const [reproductionSteps, setReproductionSteps] = useState("")
  const [attachmentUrl, setAttachmentUrl] = useState("")
  const [includeDeviceInfo, setIncludeDeviceInfo] = useState(true)
  const [deviceInfo, setDeviceInfo] = useState<FeedbackDeviceInfo>({})

  // ─── Academic Fields ────────────────────────────────────────────────────────
  const [academicCategory, setAcademicCategory] = useState<AcademicCategory>("scientific_accuracy")
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId)
  const [lectureTitleOrNum, setLectureTitleOrNum] = useState("")
  const [academicReference, setAcademicReference] = useState("")

  // ─── Submission Status ──────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState("")
  const turnstileRef = useRef<TurnstileRef>(null)

  // Auto-capture client telemetry on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const info: FeedbackDeviceInfo = {
        browser: detectBrowser(),
        os: detectOS(),
        screen: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        userAgent: navigator.userAgent,
        language: navigator.language,
      }
      setDeviceInfo(info)
    }

    // Check logged in user
    async function checkAuth() {
      if (!supabase) return
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        setIsLoggedIn(true)
        setContactEmail(session.user.email || "")
        const fullName =
          (session.user.user_metadata?.full_name as string) ||
          `${session.user.user_metadata?.first_name || ""} ${session.user.user_metadata?.last_name || ""}`.trim()
        if (fullName) setContactName(fullName)
      }
    }
    checkAuth()
  }, [])

  function detectBrowser(): string {
    const ua = navigator.userAgent
    if (ua.includes("Firefox/")) return "Firefox"
    if (ua.includes("Edg/")) return "Microsoft Edge"
    if (ua.includes("Chrome/") && !ua.includes("Edg/")) return "Google Chrome"
    if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari"
    if (ua.includes("OPR/") || ua.includes("Opera/")) return "Opera"
    return "Unknown Browser"
  }

  function detectOS(): string {
    const ua = navigator.userAgent
    if (ua.includes("Win")) return "Windows"
    if (ua.includes("Mac")) return "macOS"
    if (ua.includes("Android")) return "Android"
    if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS"
    if (ua.includes("Linux")) return "Linux"
    return "Unknown OS"
  }

  const resolvedPageUrl =
    feedbackType === "technical"
      ? pagePreset === "custom"
        ? customPageUrl
        : pagePreset === "home"
        ? "/"
        : pagePreset
      : ""

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError("")

    if (!title.trim() || !description.trim()) {
      setSubmitError(tr("Please fill in all required fields (title and description).", "يرجى تعبئة الحقول الإلزامية (العنوان والتفاصيل)."))
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        feedback_type: feedbackType,
        category: feedbackType === "technical" ? techCategory : academicCategory,
        page_url: resolvedPageUrl || null,
        course_id: feedbackType === "academic" && selectedCourseId ? selectedCourseId : null,
        lecture_id: null,
        title: title.trim(),
        description: description.trim(),
        reproduction_steps: feedbackType === "technical" ? reproductionSteps.trim() || null : null,
        severity: feedbackType === "technical" ? severity : "medium",
        device_info: feedbackType === "technical" && includeDeviceInfo ? deviceInfo : {},
        attachment_url: attachmentUrl.trim() || null,
        academic_reference:
          feedbackType === "academic"
            ? [
                lectureTitleOrNum ? `Lecture/Context: ${lectureTitleOrNum}` : "",
                academicReference ? `Reference: ${academicReference}` : "",
              ]
                .filter(Boolean)
                .join(" | ") || null
            : null,
        contact_email: contactEmail.trim() || null,
        contact_name: contactName.trim() || null,
        turnstileToken: turnstileToken || null,
      }

      let authToken = ""
      if (supabase) {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.access_token) {
          authToken = session.access_token
        }
      }

      const res = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        turnstileRef.current?.reset()
        throw new Error(data.error || "Failed to submit feedback")
      }

      setSubmittedId(data.submission?.id || "pc-feedback")
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit feedback. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const techCategories = [
    {
      id: "visual",
      label_en: "Visual & UI Glitch",
      label_ar: "مشكلة في التصميم أو العرض",
      desc_en: "Misaligned text, button overflow, dark mode issue, overlapping elements",
      desc_ar: "تداخل نصوص، أزرار غير منسقة، مشاكل في الوضع الليلي أو تداخل العناصر",
      icon: Monitor,
    },
    {
      id: "playback",
      label_en: "Video Player Issue",
      label_ar: "مشكلة في تشغيل الفيديو",
      desc_en: "Video not playing, buffering, quality issues, playback controls",
      desc_ar: "الفيديو لا يعمل، تقطيع مستمر، جودة العرض، أزرار التحكم في التشغيل",
      icon: FileVideo,
    },
    {
      id: "quiz_bug",
      label_en: "Quiz & MCQ Bug",
      label_ar: "خطأ في الاختبارات والأسئلة",
      desc_en: "Option not selectable, wrong score calculation, submit button error",
      desc_ar: "تعذر اختيار الإجابة، خطأ في احتساب النتيجة، مشكلة في زر التسليم",
      icon: FileText,
    },
    {
      id: "login_issue",
      label_en: "Login & Access Issue",
      label_ar: "مشكلة تسجيل الدخول والوصول",
      desc_en: "Cannot sign in, password reset, account activation, course gating",
      desc_ar: "تعذر تسجيل الدخول، إعادة تعيين كلمة المرور، تفعيل الحساب، قفل المقررات",
      icon: LockKeyhole,
    },
    {
      id: "performance",
      label_en: "Performance & Slowness",
      label_ar: "بطء أو استجابة ضعيفة",
      desc_en: "Slow page load, high resource usage, lag on mobile devices",
      desc_ar: "بطء في تحميل الصفحة، استهلاك عالي للذاكرة، بطء على أجهزة الجوال",
      icon: Zap,
    },
    {
      id: "other",
      label_en: "Other Technical Problem",
      label_ar: "مشكلة تقنية أخرى",
      desc_en: "Any other technical bug, broken link, or platform issue",
      desc_ar: "أي خطأ تقني آخر، روابط معطلة، أو مشكلة في وظائف المنصة",
      icon: AlertCircle,
    },
  ]

  const academicCategories = [
    {
      id: "scientific_accuracy",
      label_en: "Medical & Pharmacological Accuracy",
      label_ar: "الدقة العلمية والصيدلانية",
      desc_en: "Correction for drug dose, mechanism, contraindication, or guideline update",
      desc_ar: "تصحيح لجرعة دواء، آلية عمل، موانع استخدام، أو تحديث إرشادات علاجية",
      icon: ShieldCheck,
    },
    {
      id: "explanation_clarity",
      label_en: "Lecture Clarity & Explanation",
      label_ar: "وضوح الشرح والمفاهيم",
      desc_en: "Concept needs deeper clarification, missing background context, or pace",
      desc_ar: "مفهوم يحتاج إلى تبسيط أعمق، سياق علمي ناقص، أو سرعة الشرح",
      icon: HelpCircle,
    },
    {
      id: "question_correction",
      label_en: "Quiz Question / Answer Correction",
      label_ar: "تصحيح سؤال أو خيار في الاختبارات",
      desc_en: "Typo in question text, ambiguous options, or debatable correct answer",
      desc_ar: "خطأ مطبعي بالسؤال، خيارات غير واضحة، أو تصحيح الإجابة النموذجية",
      icon: FileText,
    },
    {
      id: "suggested_topic",
      label_en: "Suggested Topic or Clinical Case",
      label_ar: "اقتراح موضوع جديد أو حالة سريرية",
      desc_en: "Request coverage for specific drug classes, clinical scenarios, or exams",
      desc_ar: "طلب شرح لمجموعات دوائية محددة، حالات سريرية واقعية، أو تدريب للاختبارات",
      icon: BookOpen,
    },
    {
      id: "other",
      label_en: "General Curriculum Feedback",
      label_ar: "ملاحظات عامة على المنهج",
      desc_en: "Feedback regarding course structure, handouts, or syllabus flow",
      desc_ar: "آراء وملاحظات حول هيكل المقررات، الملازم والمراجع المساندة",
      icon: MessageSquare,
    },
  ]

  return (
    <Layout
      title={`${tr("Feedback & Bug Reports", "الملاحظات والبلاغات")} — PharmaCore`}
      description={tr(
        "Help us improve PharmaCore by reporting technical bugs, visual glitches, or academic pharmacology suggestions.",
        "ساعدنا في تطوير فارماكور عبر الإبلاغ عن المشكلات التقنية أو تقديم الملاحظات الأكاديمية."
      )}
      breadcrumbs={[
        { label: tr("Feedback Hub", "مركز الملاحظات والآراء") },
      ]}
    >
      <div className="page-shell py-8 sm:py-12 max-w-4xl mx-auto space-y-8">
        {/* Header Title Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-xs font-semibold text-primary shadow-xs">
            <MessageSquare className="size-3.5" />
            <span>{tr("Continuous Quality Improvement", "التطوير والجودة المستمرة")}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {tr("PharmaCore Feedback Hub", "مركز الملاحظات والدعم الفني")}
          </h1>

          <p className="body-lead text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            {tr(
              "Your direct feedback empowers our academic faculty and engineering team to keep lectures accurate, seamless, and glitch-free.",
              "ملاحظاتكم المباشرة تساعد كادرنا الأكاديمي وفريقنا التقني في الحفاظ على دقة المحاضرات وسلاسة التجربة التعليمية."
            )}
          </p>
        </div>

        {/* ─── SUCCESS CONFIRMATION STATE ──────────────────────────────────── */}
        {submittedId ? (
          <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-xl">
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-600">
                <CheckCircle2 className="size-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {tr("Thank You! Feedback Received", "شكرًا لك! تم استلام ملاحظاتك بنجاح")}
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  {tr(
                    "Our team reviews every submission thoroughly. If you provided your contact email, we will notify you once updates or corrections are applied.",
                    "يقوم فريقنا بمراجعة كافة البلاغات والملاحظات بعناية. سيتم إشعارك فور اعتماد التحديثات أو معالجة المشكلة."
                  )}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-xs font-mono text-muted-foreground shadow-xs">
                <span>{tr("Reference ID:", "رقم المرجع:")}</span>
                <span className="font-bold text-foreground">{submittedId}</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  onClick={() => {
                    setSubmittedId(null)
                    setTitle("")
                    setDescription("")
                    setReproductionSteps("")
                    setAttachmentUrl("")
                    setAcademicReference("")
                  }}
                  variant="outline"
                  className="gap-2 text-xs font-bold"
                >
                  <Send className="size-3.5" />
                  <span>{tr("Submit Another Feedback", "إرسال ملاحظة أخرى")}</span>
                </Button>

                <Button asChild className="gap-2 text-xs font-bold">
                  <Link href="/#courses">
                    <span>{tr("Return to Courses", "العودة إلى المقررات")}</span>
                    <DirectionArrow className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* ─── FEEDBACK SUBMISSION FORM ─────────────────────────────────── */
          <Card className="border shadow-lg">
            <CardHeader className="p-6 pb-4 sm:p-8 sm:pb-6 border-b bg-muted/20">
              <CardTitle className="text-xl font-bold">
                {tr("What would you like to submit?", "ما نوع الملاحظة أو البلاغ الذي ترغب في إرساله؟")}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {tr(
                  "Choose Technical Issue for bugs, video errors, or design glitches. Choose Academic Feedback for medical accuracy or syllabus suggestions.",
                  "اختر مشكلة تقنية للأخطاء البرمجية ومشاكل الفيديو والتصميم، أو اختر ملاحظات أكاديمية للدقة العلمية واقتراحات المناهج."
                )}
              </CardDescription>

              {/* Feedback Type Tabs */}
              <Tabs
                value={feedbackType}
                onValueChange={(val) => setFeedbackType(val as FeedbackType)}
                className="mt-4"
              >
                <TabsList className="grid grid-cols-2 h-auto p-1.5 bg-muted/80 rounded-xl gap-1 w-full sm:w-96">
                  <TabsTrigger
                    value="technical"
                    className="gap-2 min-h-[42px] px-3 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:shadow-sm"
                  >
                    <Cpu className="size-4 shrink-0 text-amber-500" />
                    <span>{tr("Technical Issue", "مشكلة تقنية / خطأ")}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="academic"
                    className="gap-2 min-h-[42px] px-3 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:shadow-sm"
                  >
                    <BookOpen className="size-4 shrink-0 text-primary" />
                    <span>{tr("Academic Feedback", "ملاحظة أكاديمية")}</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>

            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* ─── TECHNICAL PATH ──────────────────────────────────────── */}
                {feedbackType === "technical" && (
                  <div className="space-y-6">
                    {/* Category Cards */}
                    <div className="space-y-3">
                      <Label className="text-sm font-bold">
                        {tr("1. Issue Category *", "1. نوع المشكلة التقنية *")}
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {techCategories.map((cat) => {
                          const IconComp = cat.icon
                          const isSelected = techCategory === cat.id
                          return (
                            <button
                              type="button"
                              key={cat.id}
                              onClick={() => setTechCategory(cat.id as TechnicalCategory)}
                              className={`flex flex-col items-start p-3.5 rounded-xl border text-start transition-all ${
                                isSelected
                                  ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs"
                                  : "bg-card hover:bg-muted/40 hover:border-muted-foreground/30"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <span
                                  className={`p-1.5 rounded-lg ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  <IconComp className="size-4" />
                                </span>
                                <span className="font-bold text-xs sm:text-sm text-foreground">
                                  {tr(cat.label_en, cat.label_ar)}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                {tr(cat.desc_en, cat.desc_ar)}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Page Context & Severity */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Page Context */}
                      <div className="space-y-2">
                        <Label htmlFor="page-preset" className="text-xs sm:text-sm font-bold">
                          {tr("2. Where did this happen?", "2. في أي صفحة حدثت المشكلة؟")}
                        </Label>
                        <Select value={pagePreset} onValueChange={(val) => setPagePreset(val)}>
                          <SelectTrigger id="page-preset" className="min-h-[42px]">
                            <SelectValue placeholder={tr("Select page", "اختر الصفحة")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="home">{tr("Homepage / Landing", "الصفحة الرئيسية")}</SelectItem>
                            <SelectItem value="/#courses">{tr("Courses Catalog", "كتالوج المقررات")}</SelectItem>
                            <SelectItem value="/lecture">{tr("Lecture Video Player", "مشغل المحاضرات")}</SelectItem>
                            <SelectItem value="/quiz">{tr("Quiz & Assessment", "صفحة الاختبارات")}</SelectItem>
                            <SelectItem value="/login">{tr("Login / Registration", "تسجيل الدخول والتسجيل")}</SelectItem>
                            <SelectItem value="/profile">{tr("Student Profile", "الملف الشخصي للطالب")}</SelectItem>
                            <SelectItem value="/admin">{tr("Admin Hub", "لوحة الإدارة")}</SelectItem>
                            <SelectItem value="custom">{tr("Other / Specific URL", "رابط آخر محدد")}</SelectItem>
                          </SelectContent>
                        </Select>

                        {pagePreset === "custom" && (
                          <Input
                            placeholder="e.g. /course/cardio-101"
                            value={customPageUrl}
                            onChange={(e) => setCustomPageUrl(e.target.value)}
                            className="mt-2 text-xs"
                          />
                        )}
                      </div>

                      {/* Severity */}
                      <div className="space-y-2">
                        <Label htmlFor="severity" className="text-xs sm:text-sm font-bold">
                          {tr("3. Severity / Impact *", "3. درجة التأثير *")}
                        </Label>
                        <Select value={severity} onValueChange={(val) => setSeverity(val as FeedbackSeverity)}>
                          <SelectTrigger id="severity" className="min-h-[42px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">🟢 {tr("Low — Minor / Cosmetic issue", "منخفض — مشكلة شكلية بسيطة")}</SelectItem>
                            <SelectItem value="medium">🟡 {tr("Medium — Noticeable glitch", "متوسط — خطأ ملحوظ ولكنه لا يعطل الدراسة")}</SelectItem>
                            <SelectItem value="high">🟠 {tr("High — Impedes learning flow", "مرتفع — يعيق إكمال المحاضرة أو الاختبار")}</SelectItem>
                            <SelectItem value="critical">🔴 {tr("Critical — Complete blocker", "حرج — تعطل كامل أو تعذر الدخول")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Auto-Captured Telemetry Box */}
                    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Cpu className="size-4 text-primary" />
                          <span className="text-xs font-bold text-foreground">
                            {tr("Client Environment & Device Telemetry", "بيانات الجهاز والمتصفح المكتشفة تلقائيًا")}
                          </span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={includeDeviceInfo}
                            onChange={(e) => setIncludeDeviceInfo(e.target.checked)}
                            className="rounded border-input text-primary focus:ring-primary size-3.5"
                          />
                          <span>{tr("Attach with report", "إرفاق مع البلاغ")}</span>
                        </label>
                      </div>

                      {includeDeviceInfo && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-muted-foreground">
                          <div className="bg-background/80 p-2 rounded-lg border">
                            <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/70">OS</span>
                            <span className="font-semibold text-foreground">{deviceInfo.os || "Detecting..."}</span>
                          </div>
                          <div className="bg-background/80 p-2 rounded-lg border">
                            <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/70">Browser</span>
                            <span className="font-semibold text-foreground">{deviceInfo.browser || "Detecting..."}</span>
                          </div>
                          <div className="bg-background/80 p-2 rounded-lg border">
                            <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/70">Viewport</span>
                            <span className="font-semibold text-foreground">{deviceInfo.viewport || "Detecting..."}</span>
                          </div>
                          <div className="bg-background/80 p-2 rounded-lg border">
                            <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/70">Screen</span>
                            <span className="font-semibold text-foreground">{deviceInfo.screen || "Detecting..."}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── ACADEMIC PATH ───────────────────────────────────────── */}
                {feedbackType === "academic" && (
                  <div className="space-y-6">
                    {/* Academic Category Cards */}
                    <div className="space-y-3">
                      <Label className="text-sm font-bold">
                        {tr("1. Feedback Nature *", "1. طبيعة الملاحظة الأكاديمية *")}
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {academicCategories.map((cat) => {
                          const IconComp = cat.icon
                          const isSelected = academicCategory === cat.id
                          return (
                            <button
                              type="button"
                              key={cat.id}
                              onClick={() => setAcademicCategory(cat.id as AcademicCategory)}
                              className={`flex flex-col items-start p-3.5 rounded-xl border text-start transition-all ${
                                isSelected
                                  ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs"
                                  : "bg-card hover:bg-muted/40 hover:border-muted-foreground/30"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <span
                                  className={`p-1.5 rounded-lg ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  <IconComp className="size-4" />
                                </span>
                                <span className="font-bold text-xs sm:text-sm text-foreground">
                                  {tr(cat.label_en, cat.label_ar)}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                {tr(cat.desc_en, cat.desc_ar)}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Course & Context Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="course-select" className="text-xs sm:text-sm font-bold">
                          {tr("2. Relevant Course (Optional)", "2. المقرر المعني (اختياري)")}
                        </Label>
                        <Select value={selectedCourseId} onValueChange={(val) => setSelectedCourseId(val)}>
                          <SelectTrigger id="course-select" className="min-h-[42px]">
                            <SelectValue placeholder={tr("Select course", "اختر المقرر")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">{tr("General / Platform-wide", "عام / في كافة المقررات")}</SelectItem>
                            {courses.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {isAr ? c.title_ar : c.title_en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lecture-context" className="text-xs sm:text-sm font-bold">
                          {tr("3. Lecture, Slide, or Question Reference", "3. المحاضرة، الشريحة، أو السؤال المعني")}
                        </Label>
                        <Input
                          id="lecture-context"
                          placeholder={tr("e.g. Lecture 4, Slide 18, or MCQ #3", "مثال: المحاضرة 4، الشريحة 18، أو السؤال 3")}
                          value={lectureTitleOrNum}
                          onChange={(e) => setLectureTitleOrNum(e.target.value)}
                          className="min-h-[42px]"
                        />
                      </div>
                    </div>

                    {/* Reference / Guideline Citation */}
                    <div className="space-y-2">
                      <Label htmlFor="academic-ref" className="text-xs sm:text-sm font-bold">
                        {tr("4. Reference or Guideline Citation (Optional)", "4. المرجع الطبي أو الدليل الإرشادي (اختياري)")}
                      </Label>
                      <Input
                        id="academic-ref"
                        placeholder={tr(
                          "e.g. Goodman & Gilman 14th Ed. p. 450, or AHA/ACC 2024 Guidelines",
                          "مثال: مرجع كاتزنغ 15th ed، أو إرشادات الجمعية الأمريكية لأمراض القلب 2024"
                        )}
                        value={academicReference}
                        onChange={(e) => setAcademicReference(e.target.value)}
                        className="min-h-[42px]"
                      />
                    </div>
                  </div>
                )}

                {/* ─── COMMON TITLE & DETAILS ──────────────────────────────── */}
                <div className="space-y-4 pt-2 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="feedback-title" className="text-xs sm:text-sm font-bold">
                      {feedbackType === "technical"
                        ? tr("Issue Summary / Title *", "ملخص المشكلة / عنوان البلاغ *")
                        : tr("Topic / Feedback Title *", "عنوان الملاحظة أو المقترح الأكاديمي *")}
                    </Label>
                    <Input
                      id="feedback-title"
                      required
                      placeholder={
                        feedbackType === "technical"
                          ? tr("e.g. Sign in tab button overflows on iPhone 13", "مثال: زر تسجيل الدخول يخرج عن حدود البطاقة في الآيفون")
                          : tr("e.g. Dosage update suggestion for Warfarin bridging", "مثال: اقتراح إضافة تفصيل بروتوكول التجسير للوارفارين")
                      }
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback-desc" className="text-xs sm:text-sm font-bold">
                      {feedbackType === "technical"
                        ? tr("Detailed Description & Behavior *", "التفاصيل وما حدث بالتحديد *")
                        : tr("Detailed Academic Comment & Suggestion *", "الشرح المفصل والملاحظة الأكاديمية *")}
                    </Label>
                    <Textarea
                      id="feedback-desc"
                      required
                      rows={4}
                      placeholder={
                        feedbackType === "technical"
                          ? tr(
                              "Please describe what went wrong, what you expected to happen, and any error message displayed.",
                              "يرجى توضيح ما حدث، والسلوك المتوقع، وأي رسالة خطأ ظهرت لك."
                            )
                          : tr(
                              "Explain your scientific rationale, proposed correction, or suggested clinical additions.",
                              "اشرح المبرر العلمي، والتصحيح المقترح، أو الإضافة السريرية المطلوبة بالتفصيل."
                            )
                      }
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="leading-relaxed"
                    />
                  </div>

                  {/* Optional Reproduction Steps for Technical issues */}
                  {feedbackType === "technical" && (
                    <div className="space-y-2">
                      <Label htmlFor="repro-steps" className="text-xs sm:text-sm font-bold">
                        {tr("Steps to Reproduce (Optional)", "خطوات تكرار المشكلة (اختياري)")}
                      </Label>
                      <Textarea
                        id="repro-steps"
                        rows={2}
                        placeholder={tr(
                          "1. Go to /login\n2. Click Create Account tab\n3. Notice text clipping on small screen",
                          "1. الدخول إلى صفحة /login\n2. الضغط على تبويب حساب جديد\n3. ملاحظة خروج النص عن الإطار"
                        )}
                        value={reproductionSteps}
                        onChange={(e) => setReproductionSteps(e.target.value)}
                        className="text-xs leading-relaxed"
                      />
                    </div>
                  )}

                  {/* Attachment URL */}
                  <div className="space-y-2">
                    <Label htmlFor="attachment-url" className="text-xs sm:text-sm font-bold">
                      {tr("Screenshot or Link URL (Optional)", "رابط صورة أو لقطة شاشة توضيحية (اختياري)")}
                    </Label>
                    <div className="relative">
                      <Paperclip className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="attachment-url"
                        type="url"
                        placeholder="https://imgur.com/... or cloud screenshot link"
                        value={attachmentUrl}
                        onChange={(e) => setAttachmentUrl(e.target.value)}
                        className="ps-9"
                      />
                    </div>
                  </div>
                </div>

                {/* ─── CONTACT INFORMATION ─────────────────────────────────── */}
                <div className="space-y-4 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs sm:text-sm font-bold">
                      {tr("Contact for Follow-up (Optional)", "بيانات التواصل للمتابعة (اختياري)")}
                    </Label>
                    {isLoggedIn && (
                      <Badge variant="secondary" className="badge-nowrap text-[11px] gap-1 font-mono">
                        <CheckCircle2 className="size-3 text-emerald-500" />
                        <span>{tr("Student Account Verified", "حساب طالب مسجل")}</span>
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-name" className="text-xs text-muted-foreground">
                        {tr("Your Name", "الاسم")}
                      </Label>
                      <div className="relative">
                        <User className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="contact-name"
                          placeholder={tr("Dr. Ahmed Mohamed", "د. أحمد محمد")}
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="ps-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="contact-email" className="text-xs text-muted-foreground">
                        {tr("Email Address", "البريد الإلكتروني")}
                      </Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="contact-email"
                          type="email"
                          placeholder="doctor@example.com"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="ps-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Banner */}
                {submitError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="size-4" />
                    <AlertTitle>{tr("Submission Error", "خطأ في الإرسال")}</AlertTitle>
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                {/* Bot Protection */}
                <Turnstile
                  ref={turnstileRef}
                  onVerify={(tok) => setTurnstileToken(tok)}
                  className="my-2"
                />

                {/* Submit Action */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto min-h-[46px] px-8 text-sm font-bold gap-2 btn-nowrap"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>{tr("Submitting Feedback...", "جارٍ إرسال الملاحظات...")}</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      <span>
                        {feedbackType === "technical"
                          ? tr("Submit Bug Report", "إرسال البلاغ التقني")
                          : tr("Submit Academic Feedback", "إرسال الملاحظة الأكاديمية")}
                      </span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  let courses: Array<{ id: string; title_en: string; title_ar: string }> = []

  if (supabase) {
    try {
      const { data } = await supabase
        .from("courses")
        .select("id, title_en, title_ar")
        .order("created_at", { ascending: true })
      if (data) courses = data
    } catch {
      // Fallback to empty courses if database not yet migrated
    }
  }

  return {
    props: {
      ...(await serverSideTranslations(locale || "en", ["common"])),
      courses,
    },
  }
}
