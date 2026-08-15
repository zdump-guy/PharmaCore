import type { GetServerSideProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { useState } from "react"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import { ArrowLeft, ArrowRight, CheckCircle2, Download, ExternalLink, FileImage, FileText, HelpCircle, MessageCircle, PlayCircle, Send, ShieldCheck, Sparkles, UserRound } from "lucide-react"
import Layout from "@/components/Layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { demoLectures, demoQuestions, demoQuizzes, demoResources } from "@/lib/demo-data"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"
import type { CommunityQuestion, Lecture, Quiz, Resource } from "@/types"

interface LecturePageProps { lecture: Lecture | null; resources: Resource[]; quizzes: Quiz[]; questions: CommunityQuestion[]; courseId: string | null }

function QuestionForm({ lectureId, isAr, onAdded }: { lectureId: string; isAr: boolean; onAdded: (question: CommunityQuestion) => void }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [question, setQuestion] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !email.trim() || !question.trim()) return
    setStatus("submitting")
    if (!isSupabaseConfigured) {
      onAdded({ id: `local-${Date.now()}`, lecture_id: lectureId, author_name: name, author_email: email, text: question, created_at: new Date().toISOString(), answers: [] })
      setName(""); setEmail(""); setQuestion(""); setStatus("success")
      return
    }
    try {
      const response = await fetch("/api/questions/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lectureId, authorName: name, authorEmail: email, text: question }) })
      if (!response.ok) throw new Error()
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

  if (!lecture) {
    return <Layout title="Lecture not found"><div className="page-shell section-space text-center"><PlayCircle className="mx-auto size-12 text-muted-foreground" /><h1 className="mt-5 text-3xl font-bold">{isAr ? "المحاضرة غير موجودة" : "Lecture not found"}</h1></div></Layout>
  }

  const title = isAr ? lecture.title_ar : lecture.title_en
  const details = isAr ? lecture.details_ar : lecture.details_en
  const videoId = lecture.youtube_url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/\s]{11})/)?.[1]
  const copy = isAr ? { back: "العودة إلى المقرر", lecture: "محاضرة", summary: "الملخص", outcomes: "بعد هذه المحاضرة ستتمكن من", resources: "المواد", discussion: "الأسئلة", quiz: "اختبر فهمك", quizBody: "اختبار قصير يساعدك على تثبيت المفاهيم الأساسية.", startQuiz: "بدء الاختبار", noResources: "لا توجد مواد مرفقة حتى الآن.", mentor: "إجابة المرشد", ask: "لديك سؤال؟", askBody: "اكتب سؤالك بوضوح ليستفيد منه باقي الطلاب أيضًا.", questions: "أسئلة الطلاب" } : { back: "Back to course", lecture: "Lecture", summary: "Summary", outcomes: "After this lecture, you will be able to", resources: "Resources", discussion: "Discussion", quiz: "Check your understanding", quizBody: "A short checkpoint to reinforce the core ideas.", startQuiz: "Start quiz", noResources: "No resources are attached yet.", mentor: "Mentor answer", ask: "Have a question?", askBody: "Ask clearly so other students can benefit from the answer too.", questions: "Student questions" }

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
        <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <div className="aspect-video overflow-hidden rounded-2xl border bg-[#101819] shadow-sm">
              {videoId ? <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${videoId}`} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <div className="grid h-full place-items-center text-center text-white"><div><PlayCircle className="mx-auto size-14 text-[#8BCDE1]" /><p className="mt-4 font-semibold">{isAr ? "سيُضاف فيديو المحاضرة قريبًا" : "Lecture video coming soon"}</p></div></div>}
            </div>

            <Tabs defaultValue="summary" className="mt-8">
              <TabsList className="grid h-auto w-full grid-cols-3 bg-muted p-1">
                <TabsTrigger value="summary" className="min-h-11">{copy.summary}</TabsTrigger>
                <TabsTrigger value="resources" className="min-h-11">{copy.resources}</TabsTrigger>
                <TabsTrigger value="discussion" className="min-h-11">{copy.discussion}</TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="mt-5">
                <Card className="shadow-none"><CardContent className="p-6 sm:p-8"><h2 className="text-2xl font-bold">{copy.outcomes}</h2><div className="mt-6 grid gap-4 sm:grid-cols-2">{[isAr ? "شرح مراحل ADME بوضوح" : "Explain each ADME stage", isAr ? "ربط خصائص الدواء بتوافره الحيوي" : "Connect drug properties to bioavailability", isAr ? "تمييز دور الكبد والكلى" : "Distinguish liver and kidney roles", isAr ? "قراءة المصطلحات الحركية بثقة" : "Read pharmacokinetic terms confidently"].map((item) => <div key={item} className="flex gap-3 rounded-xl border bg-muted/35 p-4 text-sm"><CheckCircle2 className="size-5 shrink-0 text-primary" /><span className="font-medium">{item}</span></div>)}</div></CardContent></Card>
              </TabsContent>
              <TabsContent value="resources" className="mt-5 space-y-3">
                {resources.length ? resources.map((resource) => {
                  const ResourceIcon = resource.type === "image" ? FileImage : FileText
                  return <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer" className="flex min-h-16 items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/45"><span className="icon-tile"><ResourceIcon className="size-5" /></span><span className="flex-1 font-semibold">{isAr ? resource.title_ar : resource.title_en}</span><ExternalLink className="size-4 text-muted-foreground" /></a>
                }) : <Card className="shadow-none"><CardContent className="p-8 text-center text-muted-foreground"><Download className="mx-auto mb-3 size-8" />{copy.noResources}</CardContent></Card>}
              </TabsContent>
              <TabsContent value="discussion" className="mt-5">
                <div className="space-y-5">
                  <Card className="shadow-none"><CardHeader><CardTitle className="flex items-center gap-3"><span className="icon-tile"><HelpCircle className="size-5" /></span>{copy.ask}</CardTitle><p className="text-sm text-muted-foreground">{copy.askBody}</p></CardHeader><CardContent><QuestionForm lectureId={lecture.id} isAr={isAr} onAdded={(item) => setQuestions((current) => [item, ...current])} /></CardContent></Card>
                  <h2 className="pt-4 text-2xl font-bold">{copy.questions}</h2>
                  {questions.map((question) => <Card key={question.id} className="shadow-none"><CardContent className="p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-secondary font-bold text-primary">{question.author_name.charAt(0)}</span><div><p className="font-bold">{question.author_name}</p><p className="text-xs text-muted-foreground">{new Date(question.created_at).toLocaleDateString(locale)}</p></div></div><p className="mt-5 text-pretty">{question.text}</p>{question.answers?.map((answer) => <div key={answer.id} className="mt-5 border-s-2 border-primary bg-secondary/45 p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><ShieldCheck className="size-3.5" />{copy.mentor}</p><p className="mt-2 text-sm text-muted-foreground">{answer.text}</p></div>)}</CardContent></Card>)}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
            {quizzes.map((quiz) => <Card key={quiz.id} className="border-primary/25 shadow-none"><CardHeader><div className="icon-tile"><Sparkles className="size-5" /></div><CardTitle className="pt-3 text-xl">{copy.quiz}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{copy.quizBody}</p><Button className="mt-5 w-full" asChild><Link href={`/quiz/${quiz.id}`}>{copy.startQuiz}<ArrowRight className="rtl:rotate-180" /></Link></Button></CardContent></Card>)}
            <Card className="shadow-none"><CardContent className="p-5"><div className="flex items-center gap-3"><span className="icon-tile"><UserRound className="size-5" /></span><div><p className="text-xs text-muted-foreground">{isAr ? "مرشد المقرر" : "Course mentor"}</p><p className="font-bold">Dr. Ahmed Hassan</p></div></div></CardContent></Card>
            <div className="rounded-xl border bg-muted/50 p-4 text-sm text-muted-foreground"><MessageCircle className="mb-3 size-5 text-primary" />{isAr ? "الأسئلة والإجابات ظاهرة لجميع الطلاب للحفاظ على المعرفة المشتركة." : "Questions and answers stay visible to every student, building shared knowledge."}</div>
          </aside>
        </div>
      </div>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps<LecturePageProps> = async ({ params, locale }) => {
  const id = params?.id as string
  let lecture: Lecture | null = demoLectures.find((item) => item.id === id) ?? null
  let resources = lecture ? demoResources : []
  let quizzes = lecture ? demoQuizzes : []
  let questions = lecture ? demoQuestions : []
  let courseId = lecture?.course_id ?? null
  if (isSupabaseConfigured) {
    try {
      const { data: lectureData } = await supabase.from("lectures").select("*").eq("id", id).single()
      if (lectureData) { lecture = lectureData; courseId = lectureData.course_id }
      const [{ data: resourceData }, { data: quizData }, { data: questionData }] = await Promise.all([
        supabase.from("resources").select("*").eq("lecture_id", id),
        supabase.from("quizzes").select("*").eq("lecture_id", id),
        supabase.from("community_questions").select("*, answers:community_answers(*)").eq("lecture_id", id).order("created_at", { ascending: false }),
      ])
      if (resourceData) resources = resourceData
      if (quizData) quizzes = quizData
      if (questionData) questions = questionData
    } catch {}
  }
  return { props: { lecture, resources, quizzes, questions, courseId, ...(await serverSideTranslations(locale ?? "en", ["common"])) } }
}
