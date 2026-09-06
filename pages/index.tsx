import type { GetStaticProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations"
import { FiArrowUpRight as ArrowUpRight, FiBookOpen as BookOpenCheck, FiCheckCircle as CheckCircle2, FiMessageCircle as MessageCircle, FiPlayCircle as PlayCircle, FiShield as ShieldCheck } from "react-icons/fi"
import { FaGraduationCap as GraduationCap } from "react-icons/fa6"
import Layout from "@/components/Layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { loadSiteContent, type SiteContent } from "@/lib/siteContent"
import { getDirectImageUrl } from "@/lib/utils"
import type { Course } from "@/types"

interface HomeProps { courses: Course[]; siteContent: SiteContent }

export default function Home({ courses, siteContent }: HomeProps) {
  const { locale } = useRouter()
  const isAr = locale === "ar"
  const copy = siteContent[isAr ? "ar" : "en"]

  const features = [
    { Icon: GraduationCap, title: copy.feature_one_title, body: copy.feature_one_body, className: "md:col-span-2" },
    { Icon: PlayCircle, title: copy.feature_two_title, body: copy.feature_two_body, className: "" },
    { Icon: BookOpenCheck, title: copy.feature_three_title, body: copy.feature_three_body, className: "" },
    { Icon: MessageCircle, title: copy.feature_four_title, body: copy.feature_four_body, className: "md:col-span-2" },
  ]

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pharma-core-edu.vercel.app"
  const homeSchema = [
    {
      "@type": "ItemList",
      "name": isAr ? "مقررات علم الأدوية والصيدلة السريرية" : "Clinical Pharmacology Courses",
      "description": copy.courses_body,
      "numberOfItems": courses.length,
      "itemListElement": courses.map((course, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "Course",
          "name": isAr ? course.title_ar : course.title_en,
          "description": isAr ? course.description_ar : course.description_en,
          "url": `${siteUrl}${isAr ? "/ar" : ""}/course/${course.id}`,
          "provider": {
            "@type": "EducationalOrganization",
            "name": "PharmaCore",
            "sameAs": siteUrl,
          },
        },
      })),
    },
    {
      "@type": "FAQPage",
      "name": isAr ? "الأسئلة الشائعة حول منصة فارماكور" : "Frequently Asked Questions — PharmaCore",
      "mainEntity": isAr
        ? [
            {
              "@type": "Question",
              "name": "ما هي منصة فارماكور (PharmaCore)؟",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "فارماكور هي منصة تعليمية متخصصة تقدم مقررات جامعية ومتقدمة في علم الأدوية السريرية والصيدلة، مع شروحات مرئية، وملخصات سريرية قابلة للتحميل، واختبارات تفاعلية لتقييم المعرفة.",
              },
            },
            {
              "@type": "Question",
              "name": "هل مقررات فارماكور متاحة لجميع طلاب العلوم الصحية؟",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "نعم، المقررات الأساسية في علم الأدوية السريرية متاحة لطلاب الصيدلة والطب والعلوم الصحية مع إمكانية التسجيل ومتابعة المحاضرات بشكل منظم.",
              },
            },
            {
              "@type": "Question",
              "name": "كيف يمكنني تقييم فهمي للمحاضرات السريرية؟",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "تتضمن كل محاضرة اختبارات سريرية قصيرة تقيس آليات عمل الأدوية، وموانع الاستعمال، والتداخلات الدوائية، وتطبيقات الممارسة الإكلينيكية.",
              },
            },
          ]
        : [
            {
              "@type": "Question",
              "name": "What is PharmaCore?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "PharmaCore is a specialized educational platform delivering university-grade clinical pharmacology and pharmacy courses, visual lecture breakdowns, downloadable clinical summaries, and interactive knowledge checkpoints.",
              },
            },
            {
              "@type": "Question",
              "name": "Are the courses on PharmaCore freely accessible?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, core clinical pharmacology courses are freely accessible to healthcare students and professionals, with open enrollment and structured video modules.",
              },
            },
            {
              "@type": "Question",
              "name": "Can I test my clinical knowledge after lectures?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Every lecture is accompanied by targeted assessment quizzes testing mechanisms of action, drug contraindications, adverse interactions, and clinical pharmacology principles.",
              },
            },
          ],
    },
  ]

  return (
    <Layout schema={homeSchema}>
      <section className="relative overflow-hidden border-b">
        <div className="clinical-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
        <div className="page-shell relative flex min-h-[520px] sm:min-h-[620px] items-center py-16 lg:py-24">
          <div className="max-w-4xl animate-fade-up">
            <Badge variant="outline" className="badge-nowrap mb-6 min-h-8 gap-2 border-primary/25 bg-card px-3 text-primary">
              <ShieldCheck className="size-3.5 shrink-0" />
              <span>{copy.hero_eyebrow}</span>
            </Badge>
            <h1 className="display-title">{copy.hero_title_a}{" "}<span className="block text-primary">{copy.hero_title_b}</span></h1>
            <p className="body-lead mt-7">{copy.hero_subtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="w-full sm:w-auto btn-nowrap" asChild>
                <a href="#courses">{copy.hero_primary_cta}<ArrowUpRight className="shrink-0" /></a>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto btn-nowrap" asChild>
                <a href="#about"><PlayCircle className="shrink-0" />{copy.hero_secondary_cta}</a>
              </Button>
            </div>
            <div className="mt-8 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:gap-6 flex-wrap">
              <span className="inline-flex items-center gap-2 whitespace-nowrap"><CheckCircle2 className="size-4 text-primary shrink-0" />{copy.hero_note_one}</span>
              <span className="inline-flex items-center gap-2 whitespace-nowrap"><CheckCircle2 className="size-4 text-primary shrink-0" />{copy.hero_note_two}</span>
            </div>
          </div>

        </div>
      </section>

      <section id="about" className="section-space scroll-mt-20 sm:scroll-mt-24">
        <div className="page-shell">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
            <div>
              <span className="eyebrow">{copy.about_eyebrow}</span>
              <h2 className="section-title mt-5">{copy.about_title}</h2>
              <p className="body-lead mt-5">{copy.about_body}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {features.map(({ Icon, title, body, className }) => (
                <Card key={title} className={`card-interactive card-equal shadow-none ${className}`}>
                  <CardContent className="p-6 sm:p-7 flex flex-col justify-between h-full">
                    <div>
                      <div className="icon-tile"><Icon className="size-5" /></div>
                      <h3 className="mt-5 text-xl font-bold">{title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="courses" className="section-space border-y bg-muted/45 scroll-mt-20 sm:scroll-mt-24">

        <div className="page-shell">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">{copy.courses_eyebrow}</span>
              <h2 className="section-title mt-5">{copy.courses_title}</h2>
              <p className="body-lead mt-4">{copy.courses_body}</p>
            </div>
            <Badge variant="secondary" className="badge-nowrap px-3 py-2">{courses.length} {isAr ? "مقررات" : "courses"}</Badge>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course, index) => {
              const title = isAr ? course.title_ar : course.title_en
              const description = isAr ? course.description_ar : course.description_en
              const coverUrl = getDirectImageUrl(course.thumbnail_url)
              return (
                <Link href={`/course/${course.id}`} key={course.id} className="group rounded-xl focus-visible:ring-2 block h-full">
                  <Card className="card-interactive card-equal overflow-hidden shadow-none">
                    <div className="relative flex h-44 items-end border-b bg-secondary/65 bg-cover bg-center p-6 shrink-0" style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined} role={coverUrl ? "img" : undefined} aria-label={coverUrl ? `${title} cover` : undefined}>
                      {coverUrl && <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" aria-hidden="true" />}
                      <div className="relative flex w-full items-end justify-between">
                        <div className="icon-tile size-14 bg-card"><GraduationCap className="size-6" /></div>
                        <span className="text-5xl font-black text-primary/15">0{index + 1}</span>
                      </div>
                    </div>
                    <CardContent className="p-6 flex flex-col flex-1 justify-between">
                      <div>
                        <Badge variant="outline" className="badge-nowrap">{copy.course_badge}</Badge>
                        <h3 className="mt-4 text-xl font-bold leading-snug">{title}</h3>
                        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground leading-relaxed">{description}</p>
                      </div>
                      <div className="mt-6 flex min-h-11 items-center justify-between border-t pt-4 text-sm font-bold text-primary">
                        <span className="whitespace-nowrap">{copy.course_view}</span>
                        <ArrowUpRight className="size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:rotate-[-90deg]" />
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
            <div><h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">{copy.cta_title}</h2><p className="mt-3 text-primary-foreground/80">{copy.cta_body}</p></div>
            <Button size="lg" variant="secondary" className="mt-7 w-full sm:w-auto lg:mt-0" asChild><a href="#courses">{copy.hero_primary_cta}<ArrowUpRight /></a></Button>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({ locale }) => {
  let courses: Course[] = []
  if (supabase) {
    try {
      const courseResult = await supabase.from("courses").select("*").order("created_at", { ascending: false })
      if (!courseResult.error && courseResult.data) courses = courseResult.data
    } catch {}
  }
  const siteContent = await loadSiteContent()
  return { props: { courses, siteContent, ...(await serverSideTranslations(locale ?? "en", ["common"])) }, revalidate: 60 }
}
