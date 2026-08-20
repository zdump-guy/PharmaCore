import type { GetServerSideProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations"
import {
  FiArrowLeft as ArrowLeft,
  FiArrowRight as ArrowRight,
  FiAward as Award,
  FiCheck as Check,
  FiCheckCircle as CheckCircle2,
  FiClipboard as ClipboardCheck,
  FiLock as LockKeyhole,
  FiLogIn as LogIn,
  FiRotateCcw as RotateCcw,
  FiSend as Send,
  FiX as X,
  FiZap as Zap,
} from "react-icons/fi"
import Layout from "@/components/Layout"
import PracticeModeControls, { type QuizRunnerMode } from "@/components/quiz/PracticeModeControls"
import ClinicalRationaleCard from "@/components/quiz/ClinicalRationaleCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabaseClient"
import { loadSiteContent, type SiteContent } from "@/lib/siteContent"
import { resolveCourseFeatures } from "@/lib/featureFlags"
import { cn } from "@/lib/utils"
import { trackQuizStart, trackQuestionAnswered, trackQuizSubmit, trackQuizRetry } from "@/lib/analytics"
import type { Course, Question, Quiz } from "@/types"

interface QuizPageProps {
  quiz: Quiz | null
  course: Course | null
  questions: Question[]
  isLocked: boolean
  siteContent: SiteContent
}

export default function QuizPage({ quiz, course, questions, isLocked, siteContent }: QuizPageProps) {
  const { locale } = useRouter()
  const isAr = locale === "ar"
  const tr = (en: string, ar: string) => (isAr ? ar : en)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const DirectionArrow = isAr ? ArrowRight : ArrowLeft

  // Resolve course features to check if practice_mode is enabled
  const resolvedFeatures = resolveCourseFeatures(
    siteContent?.features,
    course?.feature_overrides
  )
  const isPracticeAvailable = Boolean(resolvedFeatures.practice_mode)

  // Quiz runner mode state: defaults to practice if available, otherwise standard
  const [mode, setMode] = useState<QuizRunnerMode>(isPracticeAvailable ? "practice" : "standard")

  // Enforce standard mode if practice mode is disabled by course policy
  const effectiveMode: QuizRunnerMode = isPracticeAvailable ? mode : "standard"

  // Check auth state
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
        <div className="page-shell section-space text-center py-24">
          <div className="size-16 grid place-items-center rounded-3xl bg-muted/60 text-muted-foreground mx-auto">
            <ClipboardCheck className="size-8" />
          </div>
          <h1 className="mt-6 text-3xl font-black">{isAr ? "الاختبار غير موجود" : "Quiz not found"}</h1>
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
        label: "اختبار سريري تفاعلي",
        helper: "اختر الإجابة الأدق لكل سؤال سريري. يمكنك مراجعة اختياراتك قبل الاعتماد النهائي.",
        answered: "الأسئلة المجاب عليها",
        of: "من",
        submit: "اعتماد وإرسال الإجابات",
        complete: "يرجى الإجابة عن كافة الأسئلة لتفعيل الإرسال",
        result: "نتيجة التقييم السريري",
        excellent: "أداء استثنائي — إتقان تام للمفاهيم السريرية والدوائية.",
        proficient: "أداء جيد جداً — استيعاب قوي للمفاهيم الأساسية.",
        improve: "بحاجة إلى مراجعة — يوصى بإعادة مشاهدة المحاضرة ومراجعة الملخص.",
        correct: "إجابة دقيقة وصحيحة",
        incorrect: "إجابة غير دقيقة",
        answer: "الإجابة المعتمدة",
        retry: "إعادة الاختبار",
        true: "صحيح",
        false: "خاطئ",
        placeholder: "اكتب إجابتك هنا...",
        lockedTitle: "هذا الاختبار مخصص للطلاب المسجلين",
        lockedDesc: "سجل الدخول بحساب الطالب الخاص بك لحل الاختبار السريري وتسجيل نقاطك الأكاديمية.",
        signInCta: "تسجيل الدخول / إنشاء حساب",
        practiceSummary: "ملخص أداء التدريب السريري",
        practiceHelper: "في وضع التدريب، يتم تصحيح كل إجابة فور اختيارها مع إظهار التعليل الإكلينيكي والمراجع المعتمدة.",
        resetPractice: "إعادة تعيين التدريب",
        finishPractice: "إنهاء جلسة التدريب",
        practiced: "الأسئلة المنجزة",
        accuracy: "نسبة الدقة الحالية",
      }
    : {
        back: "Back to Lecture",
        label: "Clinical Knowledge Checkpoint",
        helper: "Select the most accurate option for each clinical question. You can review before final submission.",
        answered: "Questions Answered",
        of: "of",
        submit: "Submit Assessment",
        complete: "Please answer all questions to enable submission",
        result: "Clinical Evaluation Result",
        excellent: "Outstanding mastery — thorough understanding of clinical pharmacology.",
        proficient: "Proficient — strong grasp of core therapeutic principles.",
        improve: "Needs review — recommend reviewing the lecture notes and retaking the checkpoint.",
        correct: "Correct Answer",
        incorrect: "Incorrect",
        answer: "Approved Answer",
        retry: "Retake Quiz",
        true: "True",
        false: "False",
        placeholder: "Type your clinical answer...",
        lockedTitle: "Quiz Reserved for Registered Students",
        lockedDesc: "Sign in with your student account to complete this clinical assessment and record your progress.",
        signInCta: "Sign In / Register Free",
        practiceSummary: "Practice Session Summary",
        practiceHelper: "In Practice Mode, instant feedback, clinical rationales, and textbook citations are revealed immediately upon selecting an answer.",
        resetPractice: "Reset Practice",
        finishPractice: "Complete Practice Session",
        practiced: "Questions Practiced",
        accuracy: "Current Accuracy",
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

  if (isGated) {
    return (
      <Layout title={`${title} — PharmaCore`} description={copy.helper}>
        <div className="page-shell section-space max-w-xl text-center py-20">
          <div className="mx-auto size-16 grid place-items-center rounded-3xl bg-amber-500/10 text-amber-600 border border-amber-500/30">
            <LockKeyhole className="size-8" />
          </div>
          <h1 className="mt-6 text-3xl font-black">{copy.lockedTitle}</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{copy.lockedDesc}</p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Button size="lg" className="rounded-full font-bold gap-2 shadow-md shadow-primary/20" asChild>
              <Link href={`/login?returnUrl=/quiz/${quiz.id}&tab=signup`}>
                <LogIn className="size-4" />
                <span>{copy.signInCta}</span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full" asChild>
              <Link href={backHref}>
                <DirectionArrow className="size-4" />
                <span>{copy.back}</span>
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  const isPractice = effectiveMode === "practice"

  return (
    <Layout title={`${title} — PharmaCore`} description={isPractice ? copy.practiceHelper : copy.helper}>
      {/* ─── QUIZ HEADER ─────────────────────────────────────────────────── */}
      <section className="relative border-b border-border/70 bg-muted/30">
        <div className="hero-glow pointer-events-none absolute inset-0 opacity-35" aria-hidden="true" />
        <div className="page-shell max-w-4xl py-8 sm:py-12 relative space-y-6">
          <Button
            variant="ghost"
            size="sm"
            className="-ms-3 rounded-full text-xs font-bold gap-1.5 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href={backHref}>
              <DirectionArrow className="size-3.5" />
              <span>{copy.back}</span>
            </Link>
          </Button>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1.5 bg-background/80 text-primary font-bold">
                <ClipboardCheck className="size-3.5" />
                <span>{copy.label}</span>
              </Badge>
              {isPractice ? (
                <Badge variant="success" className="gap-1 font-bold">
                  <Zap className="size-3" />
                  <span>{isAr ? "وضع التدريب الفوري" : "Practice Mode Active"}</span>
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 font-bold">
                  <Award className="size-3" />
                  <span>{isAr ? "اختبار معياري" : "Standard Exam Mode"}</span>
                </Badge>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-foreground">{title}</h1>
            <p className="body-lead text-sm sm:text-base text-muted-foreground">
              {isPractice ? copy.practiceHelper : copy.helper}
            </p>
          </div>

          {/* Practice vs Standard Mode Toggle Controls */}
          <PracticeModeControls
            mode={effectiveMode}
            onChangeMode={(newMode) => {
              setMode(newMode)
              if (newMode === "practice") {
                setSubmitted(false)
              }
            }}
            isPracticeAvailable={isPracticeAvailable}
            isAr={isAr}
          />

          {/* Progress Indicator */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-muted-foreground">
                {isPractice ? copy.practiced : copy.answered}
              </span>
              <span className="font-mono text-primary">
                {answeredCount} {copy.of} {questions.length}
              </span>
            </div>
            <Progress value={questions.length ? (answeredCount / questions.length) * 100 : 0} className="h-2.5" />
          </div>
        </div>
      </section>

      {/* ─── QUESTIONS LIST & RESULTS ─────────────────────────────────────── */}
      <section className="page-shell max-w-4xl py-10 sm:py-14 space-y-8">
        {/* Results Banner (Shown in Standard Mode upon submission, or in Practice Mode when completed) */}
        {submitted && (
          <div
            className={cn(
              "rounded-3xl border p-7 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-xl animate-in fade-in zoom-in-95",
              percent >= 80
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-50"
                : percent >= 60
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-50"
            )}
          >
            <div className="size-20 grid place-items-center rounded-3xl bg-background/90 text-primary shadow-md shrink-0">
              <span className="text-2xl font-black font-mono">{percent}%</span>
            </div>
            <div className="space-y-1.5 text-center sm:text-start flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-black">
                  {isPractice ? copy.practiceSummary : copy.result}: {score} / {questions.length}
                </h2>
                <Badge variant={percent >= 80 ? "success" : percent >= 60 ? "default" : "warning"}>
                  {percent >= 80
                    ? isAr
                      ? "امتياز سريري"
                      : "Distinction (Mastery)"
                    : percent >= 60
                    ? isAr
                      ? "ناجح"
                      : "Proficient"
                    : isAr
                    ? "يحتاج مراجعة"
                    : "Needs Review"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {percent >= 80 ? copy.excellent : percent >= 60 ? copy.proficient : copy.improve}
              </p>
            </div>
          </div>
        )}

        {/* Questions Cards */}
        <div className="space-y-6">
          {questions.map((question, index) => {
            const qText = isAr ? question.text_ar : question.text_en
            const selectedVal = answers[question.id] ?? ""
            const isAnswered = Boolean(selectedVal)
            const isCorrect = selectedVal.trim().toLowerCase() === question.correct_answer.trim().toLowerCase()
            const options = question.type === "true_false" ? [copy.true, copy.false] : question.options ?? []

            // In practice mode, show feedback instantly once answered.
            // In standard mode, show feedback only after final submission.
            const showFeedback = isPractice ? isAnswered : submitted

            return (
              <Card
                key={question.id}
                className={cn(
                  "rounded-3xl border-border/80 bg-card/90 shadow-sm transition-all overflow-hidden",
                  showFeedback &&
                    (isCorrect ? "border-emerald-500/40 bg-emerald-500/5" : "border-rose-500/40 bg-rose-500/5")
                )}
              >
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-bold bg-muted/40">
                        {isAr ? `السؤال ${index + 1}` : `Question ${index + 1}`} {copy.of} {questions.length}
                      </Badge>
                      {question.difficulty && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold capitalize ${
                            question.difficulty === "easy"
                              ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                              : question.difficulty === "hard"
                              ? "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10"
                              : "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                          }`}
                        >
                          {question.difficulty === "easy"
                            ? isAr ? "سهل" : "Easy"
                            : question.difficulty === "hard"
                            ? isAr ? "متقدم" : "Hard"
                            : isAr ? "متوسط" : "Medium"}
                        </Badge>
                      )}
                    </div>

                    {showFeedback && (
                      <Badge variant={isCorrect ? "success" : "destructive"} className="gap-1 font-bold">
                        {isCorrect ? <Check className="size-3" /> : <X className="size-3" />}
                        <span>{isCorrect ? copy.correct : copy.incorrect}</span>
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="mt-3 text-lg sm:text-xl font-bold leading-relaxed text-foreground">
                    {qText}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6 pt-0 space-y-4">
                  {question.type === "short_text" ? (
                    <div className="space-y-3">
                      <Input
                        value={selectedVal}
                        onChange={(e) => setAnswer(question.id, e.target.value)}
                        placeholder={copy.placeholder}
                        disabled={!isPractice && submitted}
                        className="rounded-xl h-12"
                      />
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {options.map((option, optIdx) => {
                        const isThisSelected = selectedVal === option
                        const isThisCorrectOption =
                          option.trim().toLowerCase() === question.correct_answer.trim().toLowerCase()

                        let buttonStyles = "border-border/70 bg-background/50 hover:bg-muted/60 text-foreground/90 hover:border-border"
                        let badgeStyles = "bg-muted/80 text-muted-foreground"

                        if (showFeedback) {
                          if (isThisSelected) {
                            if (isCorrect) {
                              buttonStyles = "border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 font-bold shadow-xs ring-1 ring-emerald-500/50"
                              badgeStyles = "bg-emerald-600 text-white"
                            } else {
                              buttonStyles = "border-rose-500 bg-rose-500/15 text-rose-800 dark:text-rose-200 font-bold shadow-xs ring-1 ring-rose-500/50"
                              badgeStyles = "bg-rose-600 text-white"
                            }
                          } else if (isThisCorrectOption) {
                            // Highlight the correct answer for learning reinforcement
                            buttonStyles = "border-emerald-500/60 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 font-bold"
                            badgeStyles = "bg-emerald-600/80 text-white"
                          } else {
                            buttonStyles = "border-border/40 bg-background/30 text-muted-foreground opacity-60"
                          }
                        } else if (isThisSelected) {
                          buttonStyles = "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/40"
                          badgeStyles = "bg-primary text-primary-foreground"
                        }

                        return (
                          <button
                            key={option}
                            type="button"
                            disabled={!isPractice && submitted}
                            onClick={() => setAnswer(question.id, option)}
                            className={cn(
                              "flex items-center gap-3.5 rounded-2xl border p-4 text-start transition-all select-none",
                              !isPractice && submitted ? "cursor-default" : "cursor-pointer hover:shadow-xs",
                              buttonStyles
                            )}
                          >
                            <div
                              className={cn(
                                "size-7 grid place-items-center rounded-xl text-xs font-mono font-black shrink-0 transition-colors",
                                badgeStyles
                              )}
                            >
                              {showFeedback && isThisSelected ? (
                                isCorrect ? <Check className="size-3.5" /> : <X className="size-3.5" />
                              ) : showFeedback && isThisCorrectOption ? (
                                <Check className="size-3.5" />
                              ) : (
                                String.fromCharCode(65 + optIdx)
                              )}
                            </div>
                            <span className="flex-1 text-sm leading-snug">{option}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Clinical Rationale Card (Instant in Practice Mode, or Post-Submission in Standard Mode) */}
                  {showFeedback && (
                    <ClinicalRationaleCard
                      question={question}
                      selectedAnswer={selectedVal}
                      isCorrect={isCorrect}
                      isAr={isAr}
                      showApprovedAnswer={!isCorrect}
                    />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Sticky Submission & Retry Bar */}
        <div className="sticky bottom-4 z-20 mt-10 rounded-3xl border border-border/80 bg-background/95 p-4 sm:p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground">
            <span className="font-mono text-primary font-black">{answeredCount}</span>
            <span>{copy.of}</span>
            <span className="font-mono text-foreground font-black">{questions.length}</span>
            <span className="hidden sm:inline ms-2 text-xs font-normal">
              {isPractice
                ? `(${score} / ${answeredCount} ${tr("correct", "صحيحة")})`
                : answeredCount < questions.length
                ? `(${copy.complete})`
                : "✓"}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isPractice ? (
              <div className="flex items-center gap-2">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-5 font-bold gap-2 border-border/80 hover:bg-muted/80 shadow-xs h-11 text-xs"
                  onClick={reset}
                >
                  <RotateCcw className="size-3.5 shrink-0" />
                  <span>{copy.resetPractice}</span>
                </Button>
                {answeredCount > 0 && !submitted && (
                  <Button
                    size="lg"
                    className="rounded-full px-6 font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 h-11 text-xs"
                    onClick={handleSubmitQuiz}
                  >
                    <CheckCircle2 className="size-3.5 shrink-0" />
                    <span>{copy.finishPractice}</span>
                  </Button>
                )}
              </div>
            ) : submitted ? (
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-6 font-bold gap-2 border-border/80 hover:bg-muted/80 shadow-xs"
                onClick={reset}
              >
                <RotateCcw className="size-4 shrink-0" />
                <span>{copy.retry}</span>
              </Button>
            ) : (
              <Button
                size="lg"
                className="rounded-full px-8 font-bold gap-2 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 h-12"
                disabled={answeredCount !== questions.length}
                onClick={handleSubmitQuiz}
              >
                <Send className="size-4 shrink-0" />
                <span>{copy.submit}</span>
              </Button>
            )}
          </div>
        </div>
      </section>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps<QuizPageProps> = async ({ params, locale }) => {
  const id = params?.id as string
  let quiz: Quiz | null = null
  let course: Course | null = null
  let questions: Question[] = []
  let isLocked = false

  if (supabase) {
    try {
      const { data: quizData } = await supabase.from("quizzes").select("*").eq("id", id).maybeSingle()
      if (quizData) {
        quiz = quizData
        const courseId = quizData.course_id

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
      course,
      questions,
      isLocked,
      siteContent: await loadSiteContent(),
      ...(await serverSideTranslations(locale ?? "en", ["common"])),
    },
  }
}
