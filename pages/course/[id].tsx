import type { GetServerSideProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, Clock3, GraduationCap, LockKeyhole, PlayCircle } from "lucide-react"
import Layout from "@/components/Layout"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { demoCourses, demoLectures } from "@/lib/demo-data"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"
import type { Course, Lecture } from "@/types"

interface CoursePageProps { course: Course | null; lectures: Lecture[] }

export default function CoursePage({ course, lectures }: CoursePageProps) {
  const { locale } = useRouter()
  const isAr = locale === "ar"
  const DirectionArrow = isAr ? ArrowRight : ArrowLeft

  if (!course) {
    return <Layout title="Course not found"><div className="page-shell section-space text-center"><BookOpen className="mx-auto size-12 text-muted-foreground" /><h1 className="mt-5 text-3xl font-bold">{isAr ? "المقرر غير موجود" : "Course not found"}</h1><Button className="mt-6" asChild><Link href="/#courses">{isAr ? "العودة للمقررات" : "Back to courses"}</Link></Button></div></Layout>
  }

  const title = isAr ? course.title_ar : course.title_en
  const description = isAr ? course.description_ar : course.description_en
  const objectives = (isAr ? course.objectives_ar : course.objectives_en).split(/[.،]\s*/).filter(Boolean)
  const prerequisites = isAr ? course.prerequisites_ar : course.prerequisites_en
  const copy = isAr ? { label: "مقرر تعليمي", back: "كل المقررات", lectures: "محتوى المقرر", intro: "رحلة متدرجة من المفاهيم الأساسية إلى التطبيق.", overview: "نظرة عامة", goals: "ماذا ستتعلم", req: "قبل أن تبدأ", start: "ابدأ المحاضرة الأولى", lesson: "محاضرة", mins: "دقيقة", open: "فتح المحاضرة", progress: "تقدم المقرر", ready: "جاهز للبدء", free: "وصول مفتوح" } : { label: "Learning course", back: "All courses", lectures: "Course content", intro: "A progressive journey from first principles to practical application.", overview: "Overview", goals: "What you will learn", req: "Before you start", start: "Start lecture one", lesson: "Lecture", mins: "min", open: "Open lecture", progress: "Course progress", ready: "Ready to begin", free: "Open access" }

  return (
    <Layout title={`${title} — PharmaCore`} description={description}>
      <section className="border-b bg-muted/45">
        <div className="page-shell py-10 lg:py-14">
          <Button variant="ghost" className="-ms-4 mb-8" asChild><Link href="/#courses"><DirectionArrow />{copy.back}</Link></Button>
          <div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <Badge variant="outline" className="gap-2 bg-card"><GraduationCap className="size-3.5" />{copy.label}</Badge>
              <h1 className="mt-5 max-w-4xl text-balance text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">{title}</h1>
              <p className="body-lead mt-5">{description}</p>
              <div className="mt-7 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex min-h-10 items-center gap-2 rounded-full border bg-card px-3"><BookOpen className="size-4 text-primary" />{lectures.length} {copy.lesson}</span>
                <span className="flex min-h-10 items-center gap-2 rounded-full border bg-card px-3"><LockKeyhole className="size-4 text-primary" />{copy.free}</span>
              </div>
            </div>
            <Card className="border-primary/20 shadow-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between text-sm"><span className="font-bold">{copy.progress}</span><span className="text-muted-foreground">0%</span></div>
                <Progress value={0} className="mt-3" />
                <p className="mt-4 text-sm text-muted-foreground">{copy.intro}</p>
                {lectures[0] && <Button size="lg" className="mt-5 w-full" asChild><Link href={`/lecture/${lectures[0].id}`}><PlayCircle />{copy.start}</Link></Button>}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-shell grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-14">
          <div>
            <div className="mb-6"><span className="eyebrow">{copy.overview}</span><h2 className="mt-4 text-3xl font-bold">{copy.lectures}</h2></div>
            <Accordion type="single" collapsible defaultValue={lectures[0]?.id} className="space-y-3">
              {lectures.map((lecture, index) => {
                const lectureTitle = isAr ? lecture.title_ar : lecture.title_en
                const details = isAr ? lecture.details_ar : lecture.details_en
                return (
                  <AccordionItem key={lecture.id} value={lecture.id} className="rounded-xl border bg-card px-5 data-[state=open]:border-primary/35">
                    <AccordionTrigger className="min-h-20 gap-4 py-4 text-start hover:no-underline">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary font-bold text-primary">{String(index + 1).padStart(2, "0")}</span>
                      <span className="flex-1"><span className="block text-base font-bold">{lectureTitle}</span><span className="mt-1 flex items-center gap-2 text-xs font-normal text-muted-foreground"><Clock3 className="size-3.5" />{18 + index * 6} {copy.mins}</span></span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 ps-14">
                      <p className="text-sm text-muted-foreground">{details}</p>
                      <Button variant="outline" className="mt-4" asChild><Link href={`/lecture/${lecture.id}`}><PlayCircle />{copy.open}</Link></Button>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <Card className="shadow-none">
              <CardHeader><CardTitle className="flex items-center gap-3 text-lg"><span className="icon-tile size-10"><ClipboardCheck className="size-4" /></span>{copy.goals}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {objectives.map((item) => <div key={item} className="flex gap-3 text-sm text-muted-foreground"><CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" /><span>{item}</span></div>)}
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardHeader><CardTitle className="text-lg">{copy.req}</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{prerequisites}</p></CardContent>
            </Card>
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-secondary/60 p-4 text-sm"><CheckCircle2 className="size-5 text-primary" /><span className="font-semibold">{copy.ready}</span></div>
          </aside>
        </div>
      </section>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps<CoursePageProps> = async ({ params, locale }) => {
  const id = params?.id as string
  let course: Course | null = demoCourses.find((item) => item.id === id) ?? null
  let lectures: Lecture[] = course ? demoLectures.map((item) => ({ ...item, course_id: course!.id })) : []
  if (isSupabaseConfigured) {
    try {
      const { data: courseData } = await supabase.from("courses").select("*").eq("id", id).single()
      if (courseData) course = courseData
      const { data: lectureData } = await supabase.from("lectures").select("*").eq("course_id", id).order("order", { ascending: true })
      if (lectureData) lectures = lectureData
    } catch {}
  }
  return { props: { course, lectures, ...(await serverSideTranslations(locale ?? "en", ["common"])) } }
}
