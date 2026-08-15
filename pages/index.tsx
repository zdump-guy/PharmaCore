import type { GetStaticProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import { ArrowUpRight, BookOpenCheck, CheckCircle2, Clock3, GraduationCap, MessageCircle, PlayCircle, ShieldCheck } from "lucide-react"
import Layout from "@/components/Layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { demoCourses } from "@/lib/demo-data"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"
import type { Course } from "@/types"

interface HomeProps { courses: Course[] }

export default function Home({ courses }: HomeProps) {
  const { locale } = useRouter()
  const isAr = locale === "ar"
  const copy = isAr ? {
    eyebrow: "منصة تعليم صيدلي مفتوحة",
    titleA: "افهم الصيدلة",
    titleB: "بعمق. طبّقها بثقة.",
    subtitle: "مسارات تعليمية منظمة تجمع المحاضرات والملخصات والاختبارات والأسئلة المجتمعية — متاحة لكل طالب، دون تسجيل.",
    browse: "استكشف المقررات",
    preview: "شاهد طريقة التعلّم",
    free: "دون تسجيل أو اشتراك",
    reviewed: "محتوى منظم بإشراف متخصصين",
    panel: "مسارك هذا الأسبوع",
    course: "أساسيات علم الأدوية",
    lesson: "المحاضرة ٤ من ٦",
    done: "مكتمل ٦٧٪",
    continue: "متابعة التعلّم",
    aboutEyebrow: "تجربة تعلّم مصممة بوعي",
    aboutTitle: "كل ما تحتاجه، في سياق واحد.",
    aboutBody: "بدل التنقل بين مصادر مشتتة، تجمع PharmaCore الفيديو والملفات والتقييم والنقاش في رحلة واضحة.",
    coursesEyebrow: "المكتبة التعليمية",
    coursesTitle: "ابدأ من المقرر المناسب لك",
    coursesBody: "محتوى جامعي منظم حول العلوم الصيدلانية والممارسة السريرية.",
    view: "عرض المقرر",
    lectures: "محاضرات منظمة",
    ctaTitle: "جاهز لبناء أساس صيدلي أقوى؟",
    ctaBody: "ابدأ مجانًا، وتعلّم بالسرعة التي تناسبك.",
  } : {
    eyebrow: "Open pharmacy learning platform",
    titleA: "Understand pharmacy",
    titleB: "deeply. Apply it confidently.",
    subtitle: "Structured learning paths that connect lectures, notes, quizzes, and community questions — open to every student, with no sign-up.",
    browse: "Explore courses",
    preview: "See how learning works",
    free: "No sign-up or subscription",
    reviewed: "Educator-guided structure",
    panel: "Your learning this week",
    course: "Foundations of Pharmacology",
    lesson: "Lecture 4 of 6",
    done: "67% complete",
    continue: "Continue learning",
    aboutEyebrow: "A deliberate learning experience",
    aboutTitle: "Everything you need, in one context.",
    aboutBody: "Instead of scattered resources, PharmaCore connects video, references, assessment, and discussion in one clear journey.",
    coursesEyebrow: "Learning library",
    coursesTitle: "Start with the course that fits",
    coursesBody: "Structured, university-level content across pharmaceutical science and clinical practice.",
    view: "View course",
    lectures: "Structured lectures",
    ctaTitle: "Ready to build a stronger pharmacy foundation?",
    ctaBody: "Start free and learn at your own pace.",
  }

  const features = [
    { Icon: GraduationCap, title: isAr ? "شرح يقوده المتخصص" : "Expert-guided clarity", body: isAr ? "محتوى مرتب حول الأهداف التي تحتاج لإتقانها فعلًا." : "Content organized around the outcomes you actually need to master.", className: "md:col-span-2" },
    { Icon: PlayCircle, title: isAr ? "فيديو بلا تشتيت" : "Focused video learning", body: isAr ? "مشاهدة المحاضرة والمواد المساندة في صفحة واحدة." : "Lecture, notes, and next steps stay together.", className: "" },
    { Icon: BookOpenCheck, title: isAr ? "اختبر فهمك" : "Check understanding", body: isAr ? "اختبارات قصيرة تعطيك تغذية راجعة مباشرة." : "Targeted quizzes provide immediate feedback.", className: "" },
    { Icon: MessageCircle, title: isAr ? "اسأل وتعلّم مع الآخرين" : "Ask and learn together", body: isAr ? "نقاش عام يحفظ الإجابات المفيدة لكل الطلاب." : "Public Q&A keeps useful mentor answers available to everyone.", className: "md:col-span-2" },
  ]

  return (
    <Layout title={isAr ? "فارما كور — منصة التعليم الصيدلي" : "PharmaCore — Pharmacy Education"} description={copy.subtitle}>
      <section className="relative overflow-hidden border-b">
        <div className="clinical-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
        <div className="page-shell relative grid min-h-[720px] items-center gap-14 py-16 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
          <div className="animate-fade-up">
            <Badge variant="outline" className="mb-6 min-h-8 gap-2 border-primary/25 bg-card px-3 text-primary"><ShieldCheck className="size-3.5" />{copy.eyebrow}</Badge>
            <h1 className="display-title">{copy.titleA}{" "}<span className="block text-primary">{copy.titleB}</span></h1>
            <p className="body-lead mt-7">{copy.subtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild><a href="#courses">{copy.browse}<ArrowUpRight /></a></Button>
              <Button size="lg" variant="outline" asChild><a href="#about"><PlayCircle />{copy.preview}</a></Button>
            </div>
            <div className="mt-8 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:gap-6">
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" />{copy.free}</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" />{copy.reviewed}</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg animate-fade-up animation-delay-100">
            <div className="absolute -left-4 top-12 hidden h-20 w-1 rounded-full bg-[#8BCDE1] sm:block" aria-hidden="true" />
            <Card className="overflow-hidden border-primary/25 shadow-none">
              <CardHeader className="border-b bg-secondary/60">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{copy.panel}</p>
                    <CardTitle className="mt-2 text-xl">{copy.course}</CardTitle>
                  </div>
                  <div className="icon-tile"><BookOpenCheck className="size-5" /></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-6 sm:p-8">
                <div>
                  <div className="mb-3 flex items-center justify-between text-sm"><span className="font-semibold">{copy.lesson}</span><span className="text-muted-foreground">{copy.done}</span></div>
                  <Progress value={67} className="h-2.5" aria-label={copy.done} />
                </div>
                <div className="rounded-xl border bg-background p-4">
                  <div className="flex items-start gap-3">
                    <div className="icon-tile size-10"><PlayCircle className="size-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{isAr ? "حركية الدواء داخل الجسم" : "How medicines move through the body"}</p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="size-3.5" /> 24 min</p>
                    </div>
                  </div>
                </div>
                <Button className="w-full" size="lg" asChild><Link href="/lecture/demo-lecture">{copy.continue}<ArrowUpRight /></Link></Button>
              </CardContent>
            </Card>
            <div className="mt-4 grid grid-cols-3 gap-3" aria-label={isAr ? "إحصاءات المنصة" : "Platform statistics"}>
              {[[isAr ? "مفتوح" : "Open", isAr ? "للجميع" : "to all"], ["24/7", isAr ? "تعلّم مرن" : "flexible"], [isAr ? "عربي" : "AR + EN", isAr ? "وإنجليزي" : "bilingual"]].map(([value, label]) => <div key={value} className="rounded-xl border bg-card p-3 text-center"><p className="font-extrabold text-primary">{value}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="section-space">
        <div className="page-shell">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
            <div>
              <span className="eyebrow">{copy.aboutEyebrow}</span>
              <h2 className="section-title mt-5">{copy.aboutTitle}</h2>
              <p className="body-lead mt-5">{copy.aboutBody}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {features.map(({ Icon, title, body, className }) => (
                <Card key={title} className={`card-interactive shadow-none ${className}`}>
                  <CardContent className="p-6 sm:p-7">
                    <div className="icon-tile"><Icon className="size-5" /></div>
                    <h3 className="mt-5 text-xl font-bold">{title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="courses" className="section-space border-y bg-muted/45">
        <div className="page-shell">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">{copy.coursesEyebrow}</span>
              <h2 className="section-title mt-5">{copy.coursesTitle}</h2>
              <p className="body-lead mt-4">{copy.coursesBody}</p>
            </div>
            <Badge variant="secondary" className="w-fit px-3 py-2">{courses.length} {isAr ? "مقررات" : "courses"}</Badge>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course, index) => {
              const title = isAr ? course.title_ar : course.title_en
              const description = isAr ? course.description_ar : course.description_en
              return (
                <Link href={`/course/${course.id}`} key={course.id} className="group rounded-xl focus-visible:ring-2">
                  <Card className="card-interactive h-full overflow-hidden shadow-none">
                    <div className="flex h-40 items-end border-b bg-secondary/65 p-6">
                      <div className="flex w-full items-end justify-between">
                        <div className="icon-tile size-14 bg-card"><GraduationCap className="size-6" /></div>
                        <span className="text-5xl font-black text-primary/15">0{index + 1}</span>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <Badge variant="outline">{copy.lectures}</Badge>
                      <h3 className="mt-4 text-xl font-bold">{title}</h3>
                      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{description}</p>
                      <div className="mt-6 flex min-h-11 items-center justify-between border-t pt-4 text-sm font-bold text-primary">
                        {copy.view}<ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:rotate-[-90deg]" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-shell">
          <div className="rounded-3xl border border-primary/25 bg-primary px-6 py-12 text-primary-foreground sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-14">
            <div><h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">{copy.ctaTitle}</h2><p className="mt-3 text-primary-foreground/80">{copy.ctaBody}</p></div>
            <Button size="lg" variant="secondary" className="mt-7 lg:mt-0" asChild><a href="#courses">{copy.browse}<ArrowUpRight /></a></Button>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({ locale }) => {
  let courses = demoCourses
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from("courses").select("*").order("created_at", { ascending: false })
      if (!error && data) courses = data
    } catch {}
  }
  return { props: { courses, ...(await serverSideTranslations(locale ?? "en", ["common"])) }, revalidate: 60 }
}
