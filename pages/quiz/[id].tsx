import type { GetServerSideProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations"
import {
  FiArrowLeft as ArrowLeft,
  FiArrowRight as ArrowRight,
  FiCheck as Check,
  FiCheckCircle as CheckCircle2,
  FiClipboard as ClipboardCheck,
  FiLock as LockKeyhole,
  FiLogIn as LogIn,
  FiRotateCcw as RotateCcw,
  FiSend as Send,
  FiX as X,
} from "react-icons/fi"
import Layout from "@/components/Layout"
import Breadcrumb from "@/components/Breadcrumb"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabaseClient"
import { loadSiteContent, type SiteContent } from "@/lib/siteContent"
import { cn } from "@/lib/utils"
import { trackQuizStart, trackQuestionAnswered, trackQuizSubmit, trackQuizRetry } from "@/lib/analytics"
import type { Course, Lecture, Question, Quiz } from "@/types"

interface QuizPageProps {
  quiz: Quiz | null
  questions: Question[]
  isLocked: boolean
  course?: Course | null
  lecture?: Lecture | null
  siteContent: SiteContent
}

export default function QuizPage({ quiz, questions, isLocked, course = null, lecture = null }: QuizPageProps) {
  const { locale } = useRouter()
  const isAr = locale === "ar"
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const DirectionArrow = isAr ? ArrowRight : ArrowLeft

  // Check auth
  useEffect(() => {
    if (!supabase) return

    async function checkAuth() {
      const {
        data: { session },
      } = await supabase!.auth.getSession()
      setIsAuthenticated(Boolean(session?.user))
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user))
    })

    return () => subscription.unsubscribe()
  }, [])

  const title = quiz ? (isAr ? quiz.title_ar : quiz.title_en) : ""

  useEffect(() => {
    if (quiz) {
      trackQuizStart({
        quizId: quiz.id,
        quizTitle: title,
        lectureId: quiz.lecture_id,
        courseId: quiz.course_id,
        totalQuestions: questions.length,
      })
    }
  }, [quiz, title, questions.length])

  if (!quiz) {
    return (
      <Layout title="Quiz not found">
        <div className="page-shell section-space text-center">
          <ClipboardCheck className="mx-auto size-12 text-muted-foreground" />
          <h1 className="mt-5 text-3xl font-bold">{isAr ? "الاختبار غير موجود" : "Quiz not found"}</h1>
        </div>
      </Layout>
    )
  }

  const isGated = isLocked && !isAuthenticated
  const answeredCount = Object.values(answers).filter(Boolean).length
  const score = questions.filter(
    (question) => (answers[question.id] ?? "").trim().toLowerCase() === question.correct_answer.trim().toLowerCase()
  ).length
  const percent = questions.length ? Math.round((score / questions.length) * 100) : 0
  const backHref = quiz.lecture_id ? `/lecture/${quiz.lecture_id}` : quiz.course_id ? `/course/${quiz.course_id}` : "/"

  const copy = isAr
    ? {
        back: "العودة للمحاضرة",
        label: "اختبار قصير",
        helper: "اختر أفضل إجابة لكل سؤال. يمكنك المراجعة قبل الإرسال.",
        answered: "تمت الإجابة",
        of: "من",
        submit: "إرسال الإجابات",
        complete: "أجب عن جميع الأسئلة للإرسال",
        result: "نتيجتك",
        excellent: "إتقان ممتاز — يمكنك الانتقال بثقة.",
        improve: "بداية جيدة. راجع الإجابات وحاول مرة أخرى.",
        correct: "إجابة صحيحة",
        incorrect: "تحتاج مراجعة",
        answer: "الإجابة الصحيحة",
        retry: "إعادة المحاولة",
        true: "صح",
        false: "خطأ",
        placeholder: "اكتب إجابتك هنا",
        lockedTitle: "هذا الاختبار مخصص للطلاب المسجلين",
        lockedDesc: "سجل الدخول بحساب الطالب الخاص بك لحل الاختبار وحفظ درجاتك وتقييم مستواك.",
        signInCta: "تسجيل الدخول / إنشاء حساب",
      }
    : {
        back: "Back to lecture",
        label: "Knowledge checkpoint",
        helper: "Choose the best answer for each question. You can review before submitting.",
        answered: "Answered",
        of: "of",
        submit: "Submit answers",
        complete: "Answer every question to submit",
        result: "Your result",
        excellent: "Excellent mastery — move forward with confidence.",
        improve: "Good start. Review the feedback and try once more.",
        correct: "Correct answer",
        incorrect: "Needs review",
        answer: "Correct answer",
        retry: "Retake quiz",
        true: "True",
        false: "False",
        placeholder: "Type your answer here",
        lockedTitle: "This quiz is reserved for registered students",
        lockedDesc: "Sign in to take this interactive quiz, test your pharmacological mastery, and record your score.",
        signInCta: "Sign In / Register Free",
      }

  const setAnswer = (id: string, value: string) => {
    setAnswers((current) => ({ ...current, [id]: value }))
    const qIndex = questions.findIndex((q) => q.id === id)
    const targetQ = questions[qIndex]
    if (targetQ) {
      trackQuestionAnswered({
        quizId: quiz.id,
        questionId: id,
        questionType: targetQ.type,
        isCorrect: value.trim().toLowerCase() === targetQ.correct_answer.trim().toLowerCase(),
        questionIndex: qIndex + 1,
      })
    }
  }

  const reset = () => {
    trackQuizRetry({ quizId: quiz.id, quizTitle: title })
    setAnswers({})
    setSubmitted(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSubmitQuiz = () => {
    setSubmitted(true)
    trackQuizSubmit({
      quizId: quiz.id,
      quizTitle: title,
      score,
      totalQuestions: questions.length,
      percentage: percent,
      passed: percent >= 70,
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pharma-core-edu.vercel.app"
  const quizUrl = `${siteUrl}${isAr ? "/ar" : ""}/quiz/${quiz.id}`
  const courseId = quiz.course_id
  const courseUrl = courseId ? `${siteUrl}${isAr ? "/ar" : ""}/course/${courseId}` : undefined
  const courseTitle = isAr ? course?.title_ar || "المقرر" : course?.title_en || "Course"
  const lectureId = quiz.lecture_id
  const lectureUrl = lectureId ? `${siteUrl}${isAr ? "/ar" : ""}/lecture/${lectureId}` : undefined
  const lectureTitle = isAr ? lecture?.title_ar || "المحاضرة" : lecture?.title_en || "Lecture"

  const breadcrumbItems = [
    { label: isAr ? "المقررات" : "Courses", href: "/#courses" },
    ...(courseId
      ? [{ label: courseTitle, href: `/course/${courseId}` }]
      : []),
    ...(lectureId
      ? [{ label: lectureTitle, href: `/lecture/${lectureId}` }]
      : []),
    { label: title },
  ]

  const quizSchema = [
    {
      "@type": "Quiz",
      "@id": `${quizUrl}#quiz`,
      "name": title,
      "description": copy.helper,
      "educationalLevel": "HigherEducation",
      "inLanguage": isAr ? "ar" : "en",
      "url": quizUrl,
      ...(courseUrl
        ? {
            "isPartOf": {
              "@type": "Course",
              "name": courseTitle,
              "url": courseUrl,
            },
          }
        : {}),
      "provider": {
        "@type": "EducationalOrganization",
        "name": "PharmaCore",
        "sameAs": siteUrl,
      },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": isAr ? "الرئيسية" : "Home", "item": `${siteUrl}${isAr ? "/ar" : ""}` },
        { "@type": "ListItem", "position": 2, "name": isAr ? "المقررات" : "Courses", "item": `${siteUrl}${isAr ? "/ar" : ""}/#courses` },
        ...(courseUrl
          ? [
              {
                "@type": "ListItem",
                "position": 3,
                "name": courseTitle,
                "item": courseUrl,
              },
            ]
          : []),
        ...(lectureUrl
          ? [
              {
                "@type": "ListItem",
                "position": courseUrl ? 4 : 3,
                "name": lectureTitle,
                "item": lectureUrl,
              },
            ]
          : []),
        {
          "@type": "ListItem",
          "position": (courseUrl ? 1 : 0) + (lectureUrl ? 1 : 0) + 2 + 1,
          "name": title,
          "item": quizUrl,
        },
      ],
    },
  ]

  if (isGated) {
    return (
      <Layout
        title={`${title} — PharmaCore`}
        description={copy.helper}
        image="/og-quiz.png"
        schema={quizSchema}
      >
        <div className="page-shell section-space max-w-xl text-center">
          <Breadcrumb items={breadcrumbItems} className="mb-6 justify-center" />
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/30">
            <LockKeyhole className="size-8" />
          </div>
          <h1 className="mt-5 text-3xl font-bold">{copy.lockedTitle}</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{copy.lockedDesc}</p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Button size="lg" className="font-bold gap-2" asChild>
              <Link href={`/login?returnUrl=/quiz/${quiz.id}&tab=signup`}>
                <LogIn className="size-4" />
                {copy.signInCta}
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={backHref}>
                <DirectionArrow />
                {copy.back}
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title={`${title} — PharmaCore`}
      description={copy.helper}
      image="/og-quiz.png"
      schema={quizSchema}
    >
      <section className="border-b bg-muted/45">
        <div className="page-shell max-w-4xl py-9 lg:py-12">
          <Breadcrumb items={breadcrumbItems} className="mb-4" />
          <Button variant="ghost" className="-ms-4 mb-6" asChild>
            <Link href={backHref}>
              <DirectionArrow />
              {copy.back}
            </Link>
          </Button>
          <Badge variant="outline" className="badge-nowrap gap-2 bg-card">
            <ClipboardCheck className="size-3.5 shrink-0" />
            <span>{copy.label}</span>
          </Badge>
          <h1 className="mt-4 text-balance text-3xl font-extrabold sm:text-4xl">{title}</h1>
          <p className="body-lead mt-3">{copy.helper}</p>
          <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">
              {copy.answered} {answeredCount} {copy.of} {questions.length}
            </span>
          </div>
          <Progress value={questions.length ? (answeredCount / questions.length) * 100 : 0} className="mt-3" />
        </div>
      </section>

      <section className="page-shell max-w-4xl section-space">
        {submitted && (
          <Alert className="mb-8 border-primary/40 bg-secondary/80 p-6">
            <CheckCircle2 className="size-6 text-primary shrink-0" />
            <div className="ms-3 min-w-0">
              <AlertTitle className="text-xl font-bold">
                {copy.result}: {score}/{questions.length} ({percent}%)
              </AlertTitle>
              <AlertDescription className="mt-2 text-sm text-muted-foreground">
                {percent >= 70 ? copy.excellent : copy.improve}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="space-y-6">
          {questions.map((question, index) => {
            const qText = isAr ? question.text_ar : question.text_en
            const isCorrect = (answers[question.id] ?? "").trim().toLowerCase() === question.correct_answer.trim().toLowerCase()
            const options = question.type === "true_false" ? [copy.true, copy.false] : (question.options ?? [])

            return (
              <Card
                key={question.id}
                className={cn(
                  "shadow-none transition-colors",
                  submitted && (isCorrect ? "border-emerald-500/50 bg-emerald-500/5" : "border-destructive/50 bg-destructive/5")
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="badge-nowrap">
                      {index + 1} {copy.of} {questions.length}
                    </Badge>
                    {submitted && (
                      <span className={cn("badge-nowrap flex items-center gap-1 text-xs font-bold shrink-0", isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                        {isCorrect ? <Check className="size-3.5 shrink-0" /> : <X className="size-3.5 shrink-0" />}
                        <span>{isCorrect ? copy.correct : copy.incorrect}</span>
                      </span>
                    )}
                  </div>
                  <CardTitle className="mt-3 text-lg leading-relaxed">{qText}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  {question.type === "short_text" ? (
                    <Input
                      value={answers[question.id] ?? ""}
                      onChange={(e) => setAnswer(question.id, e.target.value)}
                      placeholder={copy.placeholder}
                      disabled={submitted}
                    />
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {options.map((option) => {
                        const selected = answers[question.id] === option
                        return (
                          <Button
                            key={option}
                            type="button"
                            variant={selected ? "default" : "outline"}
                            className={cn(
                              "h-auto min-h-12 justify-start whitespace-normal p-4 text-start font-medium",
                              selected && "font-bold shadow-xs"
                            )}
                            disabled={submitted}
                            onClick={() => setAnswer(question.id, option)}
                          >
                            <span className="me-2.5 grid size-6 shrink-0 place-items-center rounded-md bg-muted/60 text-xs font-mono font-bold">
                              {options.indexOf(option) + 1}
                            </span>
                            <span className="flex-1">{option}</span>
                          </Button>
                        )
                      })}
                    </div>
                  )}

                  {submitted && !isCorrect && (
                    <p className="mt-3 text-xs font-semibold text-muted-foreground">
                      {copy.answer}: <span className="font-bold text-foreground">{question.correct_answer}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="sticky bottom-4 z-20 mt-8 flex flex-col gap-3 rounded-2xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            {answeredCount < questions.length ? copy.complete : `${questions.length} / ${questions.length}`}
          </p>
          {submitted ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" variant="outline" className="btn-nowrap" onClick={reset}>
                <RotateCcw className="size-4 shrink-0" />
                <span>{copy.retry}</span>
              </Button>
              {quiz.course_id && (
                <Button size="lg" className="btn-nowrap bg-primary text-primary-foreground font-bold" asChild>
                  <Link href={`/course/${quiz.course_id}`}>
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>{isAr ? "العودة إلى المقرر" : "Return to Course"}</span>
                  </Link>
                </Button>
              )}
              {quiz.lecture_id && (
                <Button size="lg" variant="secondary" className="btn-nowrap font-bold" asChild>
                  <Link href={`/lecture/${quiz.lecture_id}`}>
                    <DirectionArrow className="size-4 shrink-0" />
                    <span>{isAr ? "مراجعة المحاضرة" : "Review Lecture"}</span>
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Button size="lg" className="btn-nowrap" disabled={answeredCount !== questions.length} onClick={handleSubmitQuiz}>
              <Send className="size-4 shrink-0" />
              <span>{copy.submit}</span>
            </Button>
          )}
        </div>
      </section>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps<QuizPageProps> = async ({ params, locale }) => {
  const id = params?.id as string
  let quiz: Quiz | null = null
  let questions: Question[] = []
  let isLocked = false
  let course: Course | null = null
  let lecture: Lecture | null = null

  if (supabase) {
    try {
      const { data: quizData } = await supabase.from("quizzes").select("*").eq("id", id).maybeSingle()
      if (quizData) {
        quiz = quizData
        const courseId = quizData.course_id
        const lectureId = quizData.lecture_id

        if (courseId) {
          const { data: courseData } = await supabase
            .from("courses")
            .select("*")
            .eq("id", courseId)
            .maybeSingle()
          if (courseData) {
            course = courseData
            isLocked = Boolean(
              courseData.is_locked ||
              courseData.access_policy === "students_only" ||
              courseData.access_policy === "enrolled_only"
            )
          }
        }
        if (lectureId) {
          const { data: lectureData } = await supabase
            .from("lectures")
            .select("*")
            .eq("id", lectureId)
            .maybeSingle()
          if (lectureData) {
            lecture = lectureData
          }
        }
      }

      const { data: questionData } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", id)
        .order("order", { ascending: true })

      if (questionData) questions = questionData
    } catch {}
  }

  return {
    props: {
      quiz,
      questions,
      isLocked,
      course,
      lecture,
      siteContent: await loadSiteContent(),
      ...(await serverSideTranslations(locale ?? "en", ["common"])),
    },
  }
}
