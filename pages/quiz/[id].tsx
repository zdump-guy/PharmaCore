import type { GetServerSideProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { useState } from "react"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import { FiArrowLeft as ArrowLeft, FiArrowRight as ArrowRight, FiCheck as Check, FiCheckCircle as CheckCircle2, FiClipboard as ClipboardCheck, FiRotateCcw as RotateCcw, FiSend as Send, FiX as X } from "react-icons/fi"
import Layout from "@/components/Layout"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabaseClient"
import { loadSiteContent, type SiteContent } from "@/lib/siteContent"
import { cn } from "@/lib/utils"
import type { Question, Quiz } from "@/types"

interface QuizPageProps { quiz: Quiz | null; questions: Question[]; siteContent: SiteContent }

export default function QuizPage({ quiz, questions }: QuizPageProps) {
  const { locale } = useRouter()
  const isAr = locale === "ar"
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const DirectionArrow = isAr ? ArrowRight : ArrowLeft

  if (!quiz) return <Layout title="Quiz not found"><div className="page-shell section-space text-center"><ClipboardCheck className="mx-auto size-12 text-muted-foreground" /><h1 className="mt-5 text-3xl font-bold">{isAr ? "الاختبار غير موجود" : "Quiz not found"}</h1></div></Layout>

  const title = isAr ? quiz.title_ar : quiz.title_en
  const answeredCount = Object.values(answers).filter(Boolean).length
  const score = questions.filter((question) => (answers[question.id] ?? "").trim().toLowerCase() === question.correct_answer.trim().toLowerCase()).length
  const percent = questions.length ? Math.round((score / questions.length) * 100) : 0
  const backHref = quiz.lecture_id ? `/lecture/${quiz.lecture_id}` : quiz.course_id ? `/course/${quiz.course_id}` : "/"
  const copy = isAr ? { back: "العودة للمحاضرة", label: "اختبار قصير", helper: "اختر أفضل إجابة لكل سؤال. يمكنك المراجعة قبل الإرسال.", answered: "تمت الإجابة", of: "من", submit: "إرسال الإجابات", complete: "أجب عن جميع الأسئلة للإرسال", result: "نتيجتك", excellent: "إتقان ممتاز — يمكنك الانتقال بثقة.", improve: "بداية جيدة. راجع الإجابات وحاول مرة أخرى.", correct: "إجابة صحيحة", incorrect: "تحتاج مراجعة", answer: "الإجابة الصحيحة", retry: "إعادة المحاولة", true: "صح", false: "خطأ", placeholder: "اكتب إجابتك هنا" } : { back: "Back to lecture", label: "Knowledge checkpoint", helper: "Choose the best answer for each question. You can review before submitting.", answered: "Answered", of: "of", submit: "Submit answers", complete: "Answer every question to submit", result: "Your result", excellent: "Excellent mastery — move forward with confidence.", improve: "Good start. Review the feedback and try once more.", correct: "Correct answer", incorrect: "Needs review", answer: "Correct answer", retry: "Retake quiz", true: "True", false: "False", placeholder: "Type your answer here" }

  const setAnswer = (id: string, value: string) => setAnswers((current) => ({ ...current, [id]: value }))
  const reset = () => { setAnswers({}); setSubmitted(false); window.scrollTo({ top: 0, behavior: "smooth" }) }

  return (
    <Layout title={`${title} — PharmaCore`} description={copy.helper}>
      <section className="border-b bg-muted/45">
        <div className="page-shell max-w-4xl py-9 lg:py-12">
          <Button variant="ghost" className="-ms-4 mb-6" asChild><Link href={backHref}><DirectionArrow />{copy.back}</Link></Button>
          <Badge variant="outline" className="gap-2 bg-card"><ClipboardCheck className="size-3.5" />{copy.label}</Badge>
          <h1 className="mt-5 text-balance text-4xl font-extrabold sm:text-5xl">{title}</h1>
          <p className="body-lead mt-4">{copy.helper}</p>
          <div className="mt-7 rounded-xl border bg-card p-4">
            <div className="mb-2 flex justify-between text-sm"><span className="font-bold">{copy.answered}</span><span className="text-muted-foreground">{answeredCount} {copy.of} {questions.length}</span></div>
            <Progress value={questions.length ? (answeredCount / questions.length) * 100 : 0} aria-label={`${answeredCount} ${copy.of} ${questions.length}`} />
          </div>
        </div>
      </section>

      <section className="page-shell max-w-4xl py-10 lg:py-14">
        {submitted && <Alert className="mb-8 border-primary/30 bg-secondary/50 p-6"><CheckCircle2 className="size-5 text-primary" /><AlertTitle className="text-xl">{copy.result}: {percent}%</AlertTitle><AlertDescription className="mt-2">{percent >= 70 ? copy.excellent : copy.improve}</AlertDescription></Alert>}
        <div className="space-y-6">
          {questions.map((question, index) => {
            const value = answers[question.id] ?? ""
            const correct = value.trim().toLowerCase() === question.correct_answer.trim().toLowerCase()
            const choices = question.type === "true_false" ? [{ value: "True", label: copy.true }, { value: "False", label: copy.false }] : (question.options ?? []).map((option) => ({ value: option, label: option }))
            return (
              <Card key={question.id} className={cn("shadow-none", submitted && (correct ? "border-primary/55" : "border-destructive/55"))}>
                <CardHeader className="flex-row items-start gap-4 space-y-0">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary font-extrabold text-primary">{String(index + 1).padStart(2, "0")}</span>
                  <div className="flex-1"><p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">{isAr ? "السؤال" : "Question"} {index + 1}</p><CardTitle className="mt-2 text-lg leading-7">{isAr ? question.text_ar : question.text_en}</CardTitle></div>
                </CardHeader>
                <CardContent className="space-y-3 ps-6 sm:ps-20">
                  {question.type === "short_text" ? <Input value={value} onChange={(e) => setAnswer(question.id, e.target.value)} disabled={submitted} placeholder={copy.placeholder} aria-label={copy.placeholder} /> : choices.map((choice) => {
                    const selected = value === choice.value
                    const correctChoice = choice.value.toLowerCase() === question.correct_answer.toLowerCase()
                    return (
                      <label key={choice.value} className={cn("flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-medium transition-colors", !submitted && selected && "border-primary bg-secondary/65", !submitted && "hover:border-primary/40", submitted && correctChoice && "border-primary bg-secondary/65", submitted && selected && !correctChoice && "border-destructive bg-destructive/5")}>
                        <input className="size-4 accent-primary" type="radio" name={question.id} value={choice.value} checked={selected} onChange={() => setAnswer(question.id, choice.value)} disabled={submitted} />
                        <span className="flex-1">{choice.label}</span>
                        {submitted && correctChoice && <Check className="size-4 text-primary" />}
                        {submitted && selected && !correctChoice && <X className="size-4 text-destructive" />}
                      </label>
                    )
                  })}
                  {submitted && <div className={cn("mt-4 flex gap-3 rounded-lg p-3 text-sm", correct ? "bg-secondary text-secondary-foreground" : "bg-destructive/10 text-destructive")}><span>{correct ? <CheckCircle2 className="size-5" /> : <X className="size-5" />}</span><div><p className="font-bold">{correct ? copy.correct : copy.incorrect}</p>{!correct && <p className="mt-1">{copy.answer}: {question.correct_answer}</p>}</div></div>}
                </CardContent>
              </Card>
            )
          })}
        </div>
        <div className="sticky bottom-4 z-20 mt-8 flex flex-col gap-3 rounded-2xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{answeredCount < questions.length ? copy.complete : `${questions.length} / ${questions.length}`}</p>
          {submitted ? <Button size="lg" variant="outline" onClick={reset}><RotateCcw />{copy.retry}</Button> : <Button size="lg" disabled={answeredCount !== questions.length} onClick={() => { setSubmitted(true); window.scrollTo({ top: 0, behavior: "smooth" }) }}><Send />{copy.submit}</Button>}
        </div>
      </section>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps<QuizPageProps> = async ({ params, locale }) => {
  const id = params?.id as string
  let quiz: Quiz | null = null
  let questions: Question[] = []
  if (supabase) {
    try {
      const { data: quizData } = await supabase.from("quizzes").select("*").eq("id", id).single()
      if (quizData) quiz = quizData
      const { data: questionData } = await supabase.from("questions").select("*").eq("quiz_id", id).order("order", { ascending: true })
      if (questionData) questions = questionData
    } catch {}
  }
  return { props: { quiz, questions, siteContent: await loadSiteContent(), ...(await serverSideTranslations(locale ?? "en", ["common"])) } }
}
