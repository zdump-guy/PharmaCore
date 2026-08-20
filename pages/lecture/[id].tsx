import type { GetServerSideProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState, useRef } from "react"
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations"
import {
  FiArrowLeft as ArrowLeft,
  FiArrowRight as ArrowRight,
  FiCheckCircle as CheckCircle2,
  FiClock as Clock,
  FiDownload as Download,
  FiImage as FileImage,
  FiFileText as FileText,
  FiHelpCircle as HelpCircle,
  FiLock as LockKeyhole,
  FiLogIn as LogIn,
  FiMessageCircle as MessageCircle,
  FiPlayCircle as PlayCircle,
  FiSend as Send,
  FiShield as ShieldCheck,
  
  
} from "react-icons/fi"
import Layout from "@/components/Layout"
import YouTubePlayer from "@/components/YouTubePlayer"
import Turnstile, { type TurnstileRef } from "@/components/Turnstile"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabaseClient"
import { loadSiteContent, type SiteContent } from "@/lib/siteContent"
import { resolveCourseFeatures } from "@/lib/featureFlags"
import ClinicalAssistantDrawer from "@/components/clinical/ClinicalAssistantDrawer"
import { trackLectureView, trackResourceClick, trackCommunityQuestionSubmit } from "@/lib/analytics"
import type { CommunityQuestion, Course, Lecture, Quiz, Resource } from "@/types"

interface LecturePageProps {
  lecture: Lecture | null
  resources: Resource[]
  quizzes: Quiz[]
  questions: CommunityQuestion[]
  courseId: string | null
  course: Course | null
  isLocked: boolean
  siteContent: SiteContent
}

function QuestionForm({
  lectureId,
  isAr,
  onAdded,
}: {
  lectureId: string
  isAr: boolean
  onAdded: (question: CommunityQuestion) => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [question, setQuestion] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [turnstileToken, setTurnstileToken] = useState("")
  const turnstileRef = useRef<TurnstileRef>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !email.trim() || !question.trim()) return
    setStatus("submitting")
    try {
      const response = await fetch("/api/questions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lectureId,
          authorName: name,
          authorEmail: email,
          text: question,
          turnstileToken,
        }),
      })
      if (!response.ok) {
        turnstileRef.current?.reset()
        throw new Error()
      }
      const data = await response.json()
      onAdded(data.question)
      trackCommunityQuestionSubmit({
        lectureId,
        authorName: name,
        textLength: question.length,
      })
      setName("")
      setEmail("")
      setQuestion("")
      setStatus("success")
      turnstileRef.current?.reset()
    } catch {
      turnstileRef.current?.reset()
      setStatus("error")
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" aria-label={isAr ? "طرح استفسار سريري" : "Ask clinical question"}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="qa-name" className="text-xs font-bold">{isAr ? "الاسم" : "Name"}</Label>
          <Input
            id="qa-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder={isAr ? "اسمك الأكاديمي" : "Your name"}
            required
            className="rounded-xl h-10 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qa-email" className="text-xs font-bold">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
          <Input
            id="qa-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="student@university.edu"
            required
            className="rounded-xl h-10 text-xs"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="qa-question" className="text-xs font-bold">{isAr ? "سؤالك الأكاديمي أو السريري" : "Your clinical question"}</Label>
        <Textarea
          id="qa-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder={isAr ? "اطرح استفسارك بوضوح حول النقاط الدوائية في المحاضرة..." : "Ask your focused question about this lecture topic..."}
          required
          className="rounded-xl text-xs leading-relaxed"
        />
      </div>

      <Turnstile
        ref={turnstileRef}
        action="question_submit"
        size="flexible"
        appearance="interaction-only"
        onVerify={(token) => setTurnstileToken(token)}
        onExpire={() => setTurnstileToken("")}
      />

      <Button
        type="submit"
        size="sm"
        disabled={status === "submitting"}
        className="rounded-full font-bold gap-2 px-6 shadow-xs bg-primary hover:bg-primary/90"
      >
        <Send className="size-3.5" />
        <span>{status === "submitting" ? (isAr ? "جارٍ النشر..." : "Posting...") : isAr ? "نشر السؤال" : "Post Question"}</span>
      </Button>

      {status === "success" && (
        <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 rounded-2xl">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <AlertDescription className="text-xs font-bold">
            {isAr ? "تم نشر سؤالك بنجاح وسيقوم المشرف السريري بالرد عليه قريبًا." : "Question submitted! The mentor will review and answer soon."}
          </AlertDescription>
        </Alert>
      )}

      {status === "error" && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertDescription className="text-xs font-bold">
            {isAr ? "تعذر الإرسال. يرجى المحاولة مرة أخرى." : "Could not submit. Please try again."}
          </AlertDescription>
        </Alert>
      )}
    </form>
  )
}

export default function LecturePage({
  lecture,
  resources,
  quizzes,
  questions: initialQuestions,
  courseId,
  course,
  isLocked,
  siteContent,
}: LecturePageProps) {
  const { locale } = useRouter()
  const isAr = locale === "ar"
  const [questions, setQuestions] = useState(initialQuestions)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrollmentStatus, setEnrollmentStatus] = useState<"active" | "pending" | "rejected" | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollMsg, setEnrollMsg] = useState<string | null>(null)
  const DirectionArrow = isAr ? ArrowRight : ArrowLeft

  // Resolve feature flags for AI Assistant
  const courseFeatures = resolveCourseFeatures(siteContent?.features, course?.feature_overrides)
  const isAiEnabled = Boolean(courseFeatures.ai_assistant)
  const courseObjectives = isAr
    ? (course?.objectives_ar ? [course.objectives_ar] : [])
    : (course?.objectives_en ? [course.objectives_en] : [])

  // Check auth session & enrollment
  useEffect(() => {
    if (!supabase) return

    async function checkAuthAndEnrollment() {
      const {
        data: { session },
      } = await supabase!.auth.getSession()
      const isAuth = Boolean(session?.user)
      setIsAuthenticated(isAuth)
      setSessionToken(session?.access_token || null)

      if (session?.user && session?.access_token && courseId) {
        try {
          const res = await fetch(`/api/courses/${courseId}/enroll`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
          if (res.ok) {
            const data = await res.json()
            setIsEnrolled(Boolean(data.isEnrolled))
            setEnrollmentStatus(data.status || null)
          }
        } catch {
          // Continue
        }
      }
    }

    checkAuthAndEnrollment()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user))
      setSessionToken(session?.access_token || null)
    })

    return () => subscription.unsubscribe()
  }, [courseId])

  const handleQuickEnroll = async () => {
    if (!sessionToken || !courseId) return
    setEnrolling(true)
    setEnrollMsg(null)
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
      })
      const data = await res.json()
      if (res.ok && data.success) {
        if (data.status === "active") {
          setIsEnrolled(true)
          setEnrollmentStatus("active")
          setEnrollMsg(isAr ? "تم الاشتراك بنجاح! يمكنك الآن مشاهدة المحاضرة." : "Enrolled successfully! You can now watch the lecture.")
        } else if (data.status === "pending") {
          setIsEnrolled(false)
          setEnrollmentStatus("pending")
          setEnrollMsg(
            isAr
              ? "تم إرسال طلب انضمامك وهو الآن قيد مراجعة واعتماد الإدارة."
              : "Enrollment request submitted! It is now pending admin review."
          )
        }
      } else {
        setEnrollMsg(data.error || (isAr ? "تعذر إتمام التسجيل" : "Failed to enroll"))
      }
    } catch {
      setEnrollMsg(isAr ? "حدث خطأ أثناء الاشتراك" : "Error during enrollment")
    } finally {
      setEnrolling(false)
    }
  }

  const title = lecture ? (isAr ? lecture.title_ar : lecture.title_en) : ""
  const details = lecture ? ((isAr ? lecture.details_ar : lecture.details_en) ?? "") : ""

  useEffect(() => {
    if (lecture && courseId) {
      trackLectureView({
        lectureId: lecture.id,
        courseId,
        lectureTitle: title,
        order: lecture.order,
        locale: locale || "en",
      })
    }
  }, [lecture, courseId, title, locale])

  if (!lecture) {
    return (
      <Layout title="Lecture not found">
        <div className="page-shell section-space text-center py-24">
          <div className="size-16 grid place-items-center rounded-3xl bg-muted/60 text-muted-foreground mx-auto">
            <PlayCircle className="size-8" />
          </div>
          <h1 className="mt-6 text-3xl font-black">{isAr ? "المحاضرة غير موجودة" : "Lecture not found"}</h1>
        </div>
      </Layout>
    )
  }

  const videoId = lecture.youtube_url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/\s]{11})/)?.[1]
  const isEnrolledOnly = course?.access_policy === "enrolled_only"
  const isGatedAuth = isLocked && !isAuthenticated
  const isGatedEnrollment = isEnrolledOnly && isAuthenticated && !isEnrolled
  const isGated = isGatedAuth || isGatedEnrollment

  const copy = isAr
    ? {
        back: "العودة إلى المقرر",
        lecture: "محاضرة",
        summary: "الملخص والنقاط السريرية",
        resources: "الملفات والمواد المرفقة",
        quizzes: "الاختبارات المرتبطة",
        discussion: "النقاش الأكاديمي",
        quiz: "تقييم سريري",
        quizBody: "اختبار قصير لقياس فهمك للمفاهيم الأساسية في هذه المحاضرة.",
        startQuiz: "بدء الاختبار",
        noResources: "لا توجد مواد مرفقة لهذه المحاضرة حالياً.",
        noQuizzes: "لا توجد اختبارات مرتبطة بهذه المحاضرة حالياً.",
        mentor: "إجابة المشرف السريري",
        ask: "لديك استفسار سريري؟",
        askBody: "اطرح سؤالك الأكاديمي ليجيب عليه أعضاء هيئة التدريس ويستفيد منه زملاؤك.",
        questions: "استفسارات الطلاب والنقاشات",
        lockedTitle: "هذه المحاضرة مخصصة للطلاب المسجلين",
        lockedDesc: "سجل الدخول أو أنشئ حساب طالب مجاني للوصول إلى فيديو المحاضرة والملخصات والاختبارات.",
        enrollTitle: "يلزم الاشتراك في المقرر لمشاهدة المحاضرة",
        enrollDesc: "هذا المقرر متاح لمجموعات محددة. انقر على زر الاشتراك أدناه للانضمام وبدء المشاهدة فورًا.",
        enrollCta: "اشترك في هذا المقرر مجانًا",
        signInCta: "تسجيل الدخول / حساب جديد",
      }
    : {
        back: "Back to Course",
        lecture: "Lecture",
        summary: "Summary & Clinical Pearls",
        resources: "Attached Resources",
        quizzes: "Linked Quizzes",
        discussion: "Academic Q&A",
        quiz: "Clinical Checkpoint",
        quizBody: "A short quiz to evaluate your retention of key therapeutic concepts.",
        startQuiz: "Start Quiz",
        noResources: "No attached resources for this lecture yet.",
        noQuizzes: "No quizzes linked to this lecture yet.",
        mentor: "Clinical Mentor Response",
        ask: "Have a clinical question?",
        askBody: "Ask your academic question to receive verified feedback from clinical mentors.",
        questions: "Community Questions & Answers",
        lockedTitle: "Lecture Reserved for Registered Students",
        lockedDesc: "Sign in or create a free student account to unlock the full video breakdown, clinical notes, and quizzes.",
        enrollTitle: "Course Enrollment Required",
        enrollDesc: "This course requires enrollment. Click below to enroll and start learning immediately.",
        enrollCta: "Enroll in Course (Free)",
        signInCta: "Sign In / Register Free",
      }

  return (
    <Layout title={`${title} — PharmaCore`} description={details}>
      {/* ─── LECTURE HEADER ───────────────────────────────────────────────── */}
      <section className="relative border-b border-border/70 bg-muted/30">
        <div className="hero-glow pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="page-shell py-6 sm:py-8 lg:py-10 relative">
          {courseId && (
            <Button
              variant="ghost"
              size="sm"
              className="-ms-3 mb-4 rounded-full text-xs font-bold gap-1.5 text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href={`/course/${courseId}`}>
                <DirectionArrow className="size-3.5" />
                <span>{copy.back}</span>
              </Link>
            </Button>
          )}

          <div className="space-y-3 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1.5 bg-background/80 text-primary font-bold">
                <PlayCircle className="size-3.5" />
                <span>{copy.lecture} {lecture.order}</span>
              </Badge>

              {isEnrolledOnly ? (
                <Badge variant="warning" className="gap-1">
                  <LockKeyhole className="size-3" />
                  <span>{isAr ? "مجموعات محددة" : "Cohort Only"}</span>
                </Badge>
              ) : isLocked ? (
                <Badge variant="secondary" className="gap-1">
                  <LockKeyhole className="size-3" />
                  <span>{isAr ? "مقرر مقيد" : "Members Only"}</span>
                </Badge>
              ) : null}

              {isAiEnabled && (
                <ClinicalAssistantDrawer
                  lectureId={lecture.id}
                  lectureTitle={title}
                  objectives={courseObjectives}
                  variant="inline"
                  triggerLabel={isAr ? "المساعد السريري الذكي" : "AI Clinical Assistant"}
                />
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight text-foreground">
              {title}
            </h1>
            <p className="body-lead text-xs sm:text-sm text-muted-foreground">{details}</p>
          </div>
        </div>
      </section>

      {/* ─── VIDEO THEATER & TABS ─────────────────────────────────────────── */}
      <div className="page-shell py-8 sm:py-10 lg:py-14">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
          <div className="min-w-0 space-y-8">
            {/* Video Player Box with Ambient Glow */}
            <div className="aspect-video overflow-hidden rounded-3xl border border-border/80 bg-black shadow-xl relative">
              {isGated ? (
                <div className="grid h-full place-items-center text-center p-6 text-white bg-gradient-to-b from-slate-900 to-black">
                  <div className="max-w-md space-y-4">
                    <div className="mx-auto size-16 grid place-items-center rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-lg">
                      <LockKeyhole className="size-8" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black">
                      {enrollmentStatus === "pending"
                        ? isAr
                          ? "طلب الانضمام قيد المراجعة"
                          : "Enrollment Pending Review"
                        : isGatedEnrollment
                        ? copy.enrollTitle
                        : copy.lockedTitle}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {enrollmentStatus === "pending"
                        ? isAr
                          ? "تم إرسال طلب انضمامك وهو الآن قيد المراجعة من المشرف السريري. سيتم فتح المحاضرة فور الاعتماد."
                          : "Your enrollment request has been submitted and is awaiting administrator approval."
                        : isGatedEnrollment
                        ? copy.enrollDesc
                        : copy.lockedDesc}
                    </p>

                    {enrollmentStatus === "pending" ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-500/40 px-4 py-2 text-xs font-bold text-amber-300">
                        <Clock className="size-4 animate-spin shrink-0" />
                        <span>{isAr ? "بانتظار موافقة الإدارة" : "Awaiting Approval"}</span>
                      </div>
                    ) : isGatedEnrollment ? (
                      <div className="space-y-2">
                        <Button
                          onClick={handleQuickEnroll}
                          disabled={enrolling}
                          size="lg"
                          className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 shadow-lg"
                        >
                          <ShieldCheck className="size-4 shrink-0" />
                          <span>{enrolling ? (isAr ? "جارٍ الإرسال..." : "Submitting...") : copy.enrollCta}</span>
                        </Button>
                        {enrollMsg && (
                          <p className="text-xs font-bold text-primary">{enrollMsg}</p>
                        )}
                      </div>
                    ) : (
                      <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 shadow-lg" asChild>
                        <Link href={`/login?returnUrl=/lecture/${lecture.id}&tab=signup`}>
                          <LogIn className="size-4 shrink-0" />
                          <span>{copy.signInCta}</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ) : videoId ? (
                <YouTubePlayer videoId={videoId} title={title} lectureId={lecture.id} lectureTitle={title} />
              ) : (
                <div className="grid h-full place-items-center text-center p-6 text-muted-foreground">
                  <div className="space-y-3">
                    <PlayCircle className="mx-auto size-14 text-primary opacity-60" />
                    <p className="text-sm font-bold">
                      {isAr ? "سيُضاف فيديو المحاضرة قريبًا" : "Lecture video coming soon"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Lecture Tabs: Summary, Resources, Quizzes, Discussion */}
            <Tabs defaultValue="summary" className="space-y-6">
              <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4 bg-muted/60 p-1.5 gap-1.5 rounded-2xl border border-border/60">
                <TabsTrigger value="summary" className="min-h-10 rounded-xl text-xs font-bold">{copy.summary}</TabsTrigger>
                <TabsTrigger value="resources" className="min-h-10 rounded-xl text-xs font-bold">{copy.resources}</TabsTrigger>
                <TabsTrigger value="quizzes" className="min-h-10 rounded-xl text-xs font-bold">{copy.quizzes}</TabsTrigger>
                <TabsTrigger value="discussion" className="min-h-10 rounded-xl text-xs font-bold">{copy.discussion}</TabsTrigger>
              </TabsList>

              {/* Summary Tab */}
              <TabsContent value="summary">
                <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm p-6 sm:p-8">
                  <h2 className="text-xl font-black text-foreground">{copy.summary}</h2>
                  <p className="mt-4 leading-relaxed text-sm text-muted-foreground whitespace-pre-line">{details}</p>
                </Card>
              </TabsContent>

              {/* Resources Tab */}
              <TabsContent value="resources" className="space-y-3">
                {isGated ? (
                  <Card className="rounded-3xl border-dashed border-amber-500/40 bg-amber-500/5 p-8 text-center">
                    <LockKeyhole className="mx-auto size-8 text-amber-600 mb-2" />
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">{copy.lockedTitle}</p>
                    <Button size="sm" className="mt-4 rounded-full" asChild>
                      <Link href={`/login?returnUrl=/lecture/${lecture.id}&tab=signup`}>
                        {copy.signInCta}
                      </Link>
                    </Button>
                  </Card>
                ) : resources.length ? (
                  resources.map((resource) => {
                    const isImg = resource.type === "image" || resource.url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/) !== null
                    const ResourceIcon = isImg ? FileImage : FileText
                    const resTitle = isAr ? resource.title_ar : resource.title_en

                    return (
                      <a
                        key={resource.id}
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() =>
                          trackResourceClick({
                            resourceId: resource.id,
                            resourceTitle: resTitle,
                            resourceType: resource.type,
                            lectureId: lecture.id,
                          })
                        }
                        className="flex items-center justify-between rounded-2xl border border-border/80 bg-card/90 p-4 transition-all hover:border-primary/50 hover:shadow-md"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="size-11 grid place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                            <ResourceIcon className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate text-foreground">{resTitle}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">{resource.type}</p>
                          </div>
                        </div>
                        <Download className="size-4 text-muted-foreground shrink-0" />
                      </a>
                    )
                  })
                ) : (
                  <Card className="rounded-3xl p-8 text-center text-xs text-muted-foreground">
                    {copy.noResources}
                  </Card>
                )}
              </TabsContent>

              {/* Quizzes Tab */}
              <TabsContent value="quizzes" className="space-y-4">
                {isGated ? (
                  <Card className="rounded-3xl border-dashed border-amber-500/40 bg-amber-500/5 p-8 text-center">
                    <LockKeyhole className="mx-auto size-8 text-amber-600 mb-2" />
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">{copy.lockedTitle}</p>
                    <Button size="sm" className="mt-4 rounded-full" asChild>
                      <Link href={`/login?returnUrl=/lecture/${lecture.id}&tab=signup`}>
                        {copy.signInCta}
                      </Link>
                    </Button>
                  </Card>
                ) : quizzes.length ? (
                  quizzes.map((quiz) => (
                    <Card key={quiz.id} className="rounded-3xl border-border/80 bg-card/90 shadow-sm overflow-hidden">
                      <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6">
                        <div className="space-y-1.5 min-w-0">
                          <Badge variant="outline" className="gap-1 bg-primary/5 text-primary text-[10px] font-bold">
                            <HelpCircle className="size-3" />
                            <span>{copy.quiz}</span>
                          </Badge>
                          <h3 className="text-lg font-bold text-foreground">{isAr ? quiz.title_ar : quiz.title_en}</h3>
                          <p className="text-xs text-muted-foreground">{copy.quizBody}</p>
                        </div>
                        <Button className="rounded-full px-6 font-bold text-xs shrink-0 self-start sm:self-center" asChild>
                          <Link href={`/quiz/${quiz.id}`}>{copy.startQuiz}</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="rounded-3xl p-8 text-center text-xs text-muted-foreground">
                    {copy.noQuizzes}
                  </Card>
                )}
              </TabsContent>

              {/* Discussion Tab Form */}
              <TabsContent value="discussion">
                <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm p-6 sm:p-8 space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-foreground">{copy.ask}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{copy.askBody}</p>
                  </div>
                  <QuestionForm
                    lectureId={lecture.id}
                    isAr={isAr}
                    onAdded={(newQ) => setQuestions((curr) => [newQ, ...curr])}
                  />
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar: Q&A Community Feed */}
          <aside
            className="space-y-4 xl:sticky xl:top-24 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto xl:pe-1 xl:self-start"
            dir={isAr ? "rtl" : "ltr"}
            aria-labelledby="student-questions-title"
          >
            <div className="rounded-3xl border border-primary/25 bg-primary/5 p-5">
              <div className="flex items-center gap-3">
                <div className="size-10 grid place-items-center rounded-xl bg-primary/10 text-primary">
                  <MessageCircle className="size-5" />
                </div>
                <h2 id="student-questions-title" className="text-base font-black text-foreground">
                  {copy.questions}
                </h2>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {isAr
                  ? "الأسئلة والإجابات موثقة ليستفيد منها كافة الطلاب في مراجعتهم السريرية."
                  : "Community questions & mentor responses are curated for shared clinical mastery."}
              </p>
            </div>

            {questions.map((question) => (
              <Card key={question.id} className="rounded-3xl border-border/80 bg-card/90 shadow-xs">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                        {question.author_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate text-foreground">{question.author_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(question.created_at).toLocaleDateString(locale)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-foreground leading-relaxed">{question.text}</p>

                  {question.answers?.map((answer) => (
                    <div key={answer.id} className="mt-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                        <ShieldCheck className="size-3.5 shrink-0" />
                        <span>{copy.mentor}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {answer.text}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            {!questions.length && (
              <Card className="rounded-3xl p-6 text-center text-xs text-muted-foreground">
                {isAr ? "لا توجد أسئلة بعد. كن أول من يطرح استفسارًا!" : "No questions yet. Be the first to ask!"}
              </Card>
            )}
          </aside>
        </div>
      </div>

      {/* Floating AI Clinical Assistant Trigger */}
      {isAiEnabled && (
        <ClinicalAssistantDrawer
          lectureId={lecture.id}
          lectureTitle={title}
          objectives={courseObjectives}
          variant="floating"
        />
      )}
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps<LecturePageProps> = async ({ params, locale }) => {
  const id = params?.id as string
  let lecture: Lecture | null = null
  let resources: Resource[] = []
  let quizzes: Quiz[] = []
  let questions: CommunityQuestion[] = []
  let courseId: string | null = null
  let course: Course | null = null
  let isLocked = false

  if (supabase) {
    try {
      const { data: lectureData } = await supabase.from("lectures").select("*").eq("id", id).maybeSingle()
      if (lectureData) {
        lecture = lectureData
        courseId = lectureData.course_id

        if (courseId) {
          const { data: courseData } = await supabase.from("courses").select("*").eq("id", courseId).maybeSingle()
          if (courseData) {
            course = courseData
            isLocked = Boolean(
              courseData.is_locked ||
              courseData.access_policy === "students_only" ||
              courseData.access_policy === "enrolled_only"
            )
          }
        }
      }

      const [{ data: resourceData }, { data: quizData }, { data: questionData }] = await Promise.all([
        supabase.from("resources").select("*").eq("lecture_id", id),
        supabase.from("quizzes").select("*").eq("lecture_id", id),
        supabase
          .from("community_questions")
          .select("id, lecture_id, author_name, text, created_at, answers:community_answers(*)")
          .eq("lecture_id", id)
          .order("created_at", { ascending: false }),
      ])

      if (resourceData) resources = resourceData
      if (quizData) quizzes = quizData
      if (questionData) questions = questionData
    } catch {}
  }

  return {
    props: {
      lecture,
      resources,
      quizzes,
      questions,
      courseId,
      course,
      isLocked,
      siteContent: await loadSiteContent(),
      ...(await serverSideTranslations(locale ?? "en", ["common"])),
    },
  }
}
