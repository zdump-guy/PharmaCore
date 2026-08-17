import type { GetServerSideProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import { FiArrowLeft as ArrowLeft, FiArrowRight as ArrowRight, FiCheckCircle as CheckCircle2, FiDownload as Download, FiExternalLink as ExternalLink, FiImage as FileImage, FiFileText as FileText, FiHelpCircle as HelpCircle, FiMessageCircle as MessageCircle, FiPlayCircle as PlayCircle, FiSend as Send, FiShield as ShieldCheck, FiStar as Sparkles } from "react-icons/fi"
import Layout from "@/components/Layout"
import YouTubePlayer from "@/components/YouTubePlayer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabaseClient"
import { loadSiteContent, type SiteContent } from "@/lib/siteContent"
import { trackLectureView, trackResourceClick, trackCommunityQuestionSubmit } from "@/lib/analytics"
import type { CommunityQuestion, Lecture, Quiz, Resource } from "@/types"

interface LecturePageProps { lecture: Lecture | null; resources: Resource[]; quizzes: Quiz[]; questions: CommunityQuestion[]; courseId: string | null; siteContent: SiteContent }

function QuestionForm({ lectureId, isAr, onAdded }: { lectureId: string; isAr: boolean; onAdded: (question: CommunityQuestion) => void }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [question, setQuestion] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !email.trim() || !question.trim()) return
    setStatus("submitting")
    try {
      const response = await fetch("/api/questions/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lectureId, authorName: name, authorEmail: email, text: question }) })
      if (!response.ok) throw new Error()
      const data = await response.json()
      onAdded(data.question)
      trackCommunityQuestionSubmit({
        lectureId,
        authorName: name,
        textLength: question.length,
      })
      setName(""); setEmail(""); setQuestion(""); setStatus("success")
    } catch { setStatus("error") }
  }

  return (
    <form onSubmit={submit} className="space-y-5" aria-label={isAr ? "نموذج طرح سؤال" : "Ask a question form"}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="qa-name">{isAr ? "الاسم" : "Name"}</Label><Input id="qa-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></div>
        <div className="space-y-2"><Label htmlFor="qa-email">{isAr ? "البريد الإلكتروني" : "Email address"}</Label><Input id="qa-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="qa-question">{isAr ? "سؤالك" : "Your question"}</Label><Textarea id="qa-question" value={question} onChange={(e) => setQuestion(e.target.value)} rows={4} placeholder={isAr ? "اكتب سؤالًا محددًا عن المحاضرة..." : "Ask a focused question about this lecture..."} required /></div>
      <Button type="submit" disabled={status === "submitting"}><Send />{status === "submitting" ? (isAr ? "جارٍ الإرسال..." : "Sending...") : (isAr ? "إرسال السؤال" : "Submit question")}</Button>
      {status === "success" && <Alert className="border-primary/30"><CheckCircle2 className="size-4 text-primary" /><AlertDescription>{isAr ? "تمت إضافة سؤالك إلى النقاش." : "Your question has been added to the discussion."}</AlertDescription></Alert>}
      {status === "error" && <Alert variant="destructive"><AlertDescription>{isAr ? "تعذر الإرسال. حاول مرة أخرى." : "Could not submit. Please try again."}</AlertDescription></Alert>}
    </form>
  )
}

export default function LecturePage({ lecture, resources, quizzes, questions: initialQuestions, courseId }: LecturePageProps) {
  const { locale } = useRouter()
  const isAr = locale === "ar"
  const [questions, setQuestions] = useState(initialQuestions)
  const DirectionArrow = isAr ? ArrowRight : ArrowLeft

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
    return <Layout title="Lecture not found"><div className="page-shell section-space text-center"><PlayCircle className="mx-auto size-12 text-muted-foreground" /><h1 className="mt-5 text-3xl font-bold">{isAr ? "المحاضرة غير موجودة" : "Lecture not found"}</h1></div></Layout>
  }

  const videoId = lecture.youtube_url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/\s]{11})/)?.[1]
  const copy = isAr ? { back: "العودة إلى المقرر", lecture: "محاضرة", summary: "الملخص", outcomes: "بعد هذه المحاضرة ستتمكن من", resources: "المواد", quizzes: "الاختبارات", discussion: "الأسئلة", quiz: "اختبر فهمك", quizBody: "اختبار قصير يساعدك على تثبيت المفاهيم الأساسية.", startQuiz: "بدء الاختبار", noResources: "لا توجد مواد مرفقة حتى الآن.", noQuizzes: "لا توجد اختبارات مرتبطة بهذه المحاضرة حتى الآن.", mentor: "إجابة المرشد", ask: "لديك سؤال؟", askBody: "اكتب سؤالك بوضوح ليستفيد منه باقي الطلاب أيضًا.", questions: "أسئلة الطلاب" } : { back: "Back to course", lecture: "Lecture", summary: "Summary", outcomes: "After this lecture, you will be able to", resources: "Resources", quizzes: "Quizzes", discussion: "Discussion", quiz: "Check your understanding", quizBody: "A short checkpoint to reinforce the core ideas.", startQuiz: "Start quiz", noResources: "No resources are attached yet.", noQuizzes: "No quizzes are linked to this lecture yet.", mentor: "Mentor answer", ask: "Have a question?", askBody: "Ask clearly so other students can benefit from the answer too.", questions: "Student questions" }

  return (
    <Layout title={`${title} — PharmaCore`} description={details}>
      <section className="border-b bg-muted/40">
        <div className="page-shell py-8 lg:py-12">
          {courseId && <Button variant="ghost" className="-ms-4 mb-6" asChild><Link href={`/course/${courseId}`}><DirectionArrow />{copy.back}</Link></Button>}
          <div className="max-w-4xl">
            <Badge variant="outline" className="gap-2 bg-card"><PlayCircle className="size-3.5" />{copy.lecture} {lecture.order}</Badge>
            <h1 className="mt-5 text-balance text-4xl font-extrabold leading-tight sm:text-5xl">{title}</h1>
            <p className="body-lead mt-5">{details}</p>
          </div>
        </div>
      </section>

      <div className="page-shell py-8 lg:py-12">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
          <div className="min-w-0">
            <div className="aspect-video overflow-hidden rounded-2xl border bg-[#101819] shadow-sm">
              {videoId ? <YouTubePlayer videoId={videoId} title={title} lectureId={lecture.id} lectureTitle={title} /> : <div className="grid h-full place-items-center text-center text-white"><div><PlayCircle className="mx-auto size-14 text-[#8BCDE1]" /><p className="mt-4 font-semibold">{isAr ? "سيُضاف فيديو المحاضرة قريبًا" : "Lecture video coming soon"}</p></div></div>}
            </div>

            <Tabs defaultValue="summary" className="mt-8">
              <TabsList className="grid h-auto w-full grid-cols-4 bg-muted p-1">
                <TabsTrigger value="summary" className="min-h-11">{copy.summary}</TabsTrigger>
                <TabsTrigger value="resources" className="min-h-11">{copy.resources}</TabsTrigger>
                <TabsTrigger value="quizzes" className="min-h-11">{copy.quizzes}</TabsTrigger>
                <TabsTrigger value="discussion" className="min-h-11">{copy.discussion}</TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="mt-5">
                <Card className="shadow-none"><CardContent className="p-6 sm:p-8"><h2 className="text-2xl font-bold">{copy.summary}</h2><p className="mt-5 leading-7 text-muted-foreground">{details}</p></CardContent></Card>
              </TabsContent>
              <TabsContent value="resources" className="mt-5 space-y-3">
                {resources.length ? resources.map((resource) => {
                  const isPdf = resource.type === "pdf" || resource.url.toLowerCase().includes(".pdf")
                  const isImg = resource.type === "image" || resource.url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/) !== null
                  const ResourceIcon = isImg ? FileImage : FileText
                  const resTitle = isAr ? resource.title_ar : resource.title_en
                  return (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => trackResourceClick({
                        resourceId: resource.id,
                        resourceTitle: resTitle,
                        resourceType: resource.type,
                        url: resource.url,
                        lectureId: lecture.id,
                      })}
                      className="flex min-h-16 items-center justify-between gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/45 hover:bg-muted/20"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className={`grid size-11 place-items-center rounded-xl shrink-0 ${
                          isPdf ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-primary/10 text-primary"
                        }`}>
                          <ResourceIcon className="size-5" />
                        </span>
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-bold text-sm text-foreground truncate">{resTitle}</p>
                          <Badge variant="outline" className={`text-[10px] uppercase font-bold px-1.5 py-0 ${
                            isPdf ? "border-red-500/30 text-red-600 dark:text-red-400" : "border-primary/30 text-primary"
                          }`}>
                            {isPdf ? "PDF Document" : isImg ? "Image / Diagram" : "Reference"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold text-primary hidden sm:inline">
                          {isPdf ? (isAr ? "تحميل / قراءة" : "View PDF") : (isAr ? "فتح المادة" : "Open")}
                        </span>
                        <ExternalLink className="size-4 text-muted-foreground" />
                      </div>
                    </a>
                  )
                }) : <Card className="shadow-none"><CardContent className="p-8 text-center text-muted-foreground"><Download className="mx-auto mb-3 size-8" />{copy.noResources}</CardContent></Card>}
              </TabsContent>

              <TabsContent value="quizzes" className="mt-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  {quizzes.map((quiz) => <Card key={quiz.id} className="border-primary/25 shadow-none"><CardHeader><div className="icon-tile"><Sparkles className="size-5" /></div><CardTitle className="pt-3 text-xl">{isAr ? quiz.title_ar : quiz.title_en}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{copy.quizBody}</p><Button className="mt-5 w-full" asChild><Link href={`/quiz/${quiz.id}`}>{copy.startQuiz}<ArrowRight className="rtl:rotate-180" /></Link></Button></CardContent></Card>)}
                </div>
                {!quizzes.length && <Alert><AlertDescription>{copy.noQuizzes}</AlertDescription></Alert>}
              </TabsContent>
              <TabsContent value="discussion" className="mt-5">
                <Card className="shadow-none" dir={isAr ? "rtl" : "ltr"}><CardHeader><CardTitle className="flex items-center gap-3"><span className="icon-tile"><HelpCircle className="size-5" /></span>{copy.ask}</CardTitle><p className="text-sm text-muted-foreground">{copy.askBody}</p></CardHeader><CardContent><QuestionForm lectureId={lecture.id} isAr={isAr} onAdded={(item) => setQuestions((current) => [item, ...current])} /></CardContent></Card>
              </TabsContent>
            </Tabs>
          </div>


          <aside className="min-w-0 space-y-4 xl:sticky xl:top-28 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto xl:pe-1 xl:self-start" dir={isAr ? "rtl" : "ltr"} aria-labelledby="student-questions-title">
            <div className="rounded-xl border bg-muted/50 p-4"><div className="flex items-center gap-3"><span className="icon-tile size-10"><MessageCircle className="size-5" /></span><h2 id="student-questions-title" className="text-xl font-bold">{copy.questions}</h2></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{isAr ? "الأسئلة والإجابات ظاهرة لجميع الطلاب للحفاظ على المعرفة المشتركة." : "Questions and answers stay visible to every student, building shared knowledge."}</p></div>
            {questions.map((question) => <Card key={question.id} className="shadow-none"><CardContent className="p-5"><div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary font-bold text-primary" aria-hidden="true">{question.author_name.charAt(0)}</span><div className="min-w-0"><p className="truncate font-bold">{question.author_name}</p><p className="text-xs text-muted-foreground">{new Date(question.created_at).toLocaleDateString(locale)}</p></div></div><p className="mt-4 break-words text-pretty text-sm leading-6">{question.text}</p>{question.answers?.map((answer) => <div key={answer.id} className="mt-4 border-s-2 border-primary bg-secondary/45 p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><ShieldCheck className="size-3.5 shrink-0" />{copy.mentor}</p><p className="mt-2 break-words text-sm leading-6 text-muted-foreground">{answer.text}</p></div>)}</CardContent></Card>)}
            {!questions.length && <Alert><AlertDescription>{isAr ? "لا توجد أسئلة بعد. كن أول من يسأل." : "No questions yet. Be the first to ask."}</AlertDescription></Alert>}
          </aside>
        </div>
      </div>
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
  if (supabase) {
    try {
      const { data: lectureData } = await supabase.from("lectures").select("*").eq("id", id).single()
      if (lectureData) { lecture = lectureData; courseId = lectureData.course_id }
      const [{ data: resourceData }, { data: quizData }, { data: questionData }] = await Promise.all([
        supabase.from("resources").select("*").eq("lecture_id", id),
        supabase.from("quizzes").select("*").eq("lecture_id", id),
        supabase.from("community_questions").select("id, lecture_id, author_name, text, created_at, answers:community_answers(*)").eq("lecture_id", id).order("created_at", { ascending: false }),
      ])
      if (resourceData) resources = resourceData
      if (quizData) quizzes = quizData
      if (questionData) questions = questionData
    } catch {}
  }
  return { props: { lecture, resources, quizzes, questions, courseId, siteContent: await loadSiteContent(), ...(await serverSideTranslations(locale ?? "en", ["common"])) } }
}
