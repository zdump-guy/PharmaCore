import type { GetStaticProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import { FiArrowUpRight as ArrowUpRight, FiBookOpen as BookOpenCheck, FiCheckCircle as CheckCircle2, FiMessageCircle as MessageCircle, FiPlayCircle as PlayCircle, FiShield as ShieldCheck } from "react-icons/fi"
import { FaGraduationCap as GraduationCap } from "react-icons/fa6"
import Layout from "@/components/Layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { defaultSiteContent, mergeSiteContent, loadSiteContent, type SiteContent } from "@/lib/siteContent"
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

  return (
    <Layout>
      <section className="relative overflow-hidden border-b">
        <div className="clinical-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
        <div className="page-shell relative flex min-h-[620px] items-center py-16 lg:py-24">
          <div className="max-w-4xl animate-fade-up">
            <Badge variant="outline" className="mb-6 min-h-8 gap-2 border-primary/25 bg-card px-3 text-primary"><ShieldCheck className="size-3.5" />{copy.hero_eyebrow}</Badge>
            <h1 className="display-title">{copy.hero_title_a}{" "}<span className="block text-primary">{copy.hero_title_b}</span></h1>
            <p className="body-lead mt-7">{copy.hero_subtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild><a href="#courses">{copy.hero_primary_cta}<ArrowUpRight /></a></Button>
              <Button size="lg" variant="outline" asChild><a href="#about"><PlayCircle />{copy.hero_secondary_cta}</a></Button>
            </div>
            <div className="mt-8 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:gap-6">
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" />{copy.hero_note_one}</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" />{copy.hero_note_two}</span>
            </div>
          </div>

        </div>
      </section>

      <section id="about" className="section-space">
        <div className="page-shell">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
            <div>
              <span className="eyebrow">{copy.about_eyebrow}</span>
              <h2 className="section-title mt-5">{copy.about_title}</h2>
              <p className="body-lead mt-5">{copy.about_body}</p>
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
              <span className="eyebrow">{copy.courses_eyebrow}</span>
              <h2 className="section-title mt-5">{copy.courses_title}</h2>
              <p className="body-lead mt-4">{copy.courses_body}</p>
            </div>
            <Badge variant="secondary" className="w-fit px-3 py-2">{courses.length} {isAr ? "مقررات" : "courses"}</Badge>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course, index) => {
              const title = isAr ? course.title_ar : course.title_en
              const description = isAr ? course.description_ar : course.description_en
              const coverUrl = getDirectImageUrl(course.thumbnail_url)
              return (
                <Link href={`/course/${course.id}`} key={course.id} className="group rounded-xl focus-visible:ring-2">
                  <Card className="card-interactive h-full overflow-hidden shadow-none">
                    <div className="relative flex h-40 items-end border-b bg-secondary/65 bg-cover bg-center p-6" style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined} role={coverUrl ? "img" : undefined} aria-label={coverUrl ? `${title} cover` : undefined}>
                      {coverUrl && <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" aria-hidden="true" />}
                      <div className="relative flex w-full items-end justify-between">
                        <div className="icon-tile size-14 bg-card"><GraduationCap className="size-6" /></div>
                        <span className="text-5xl font-black text-primary/15">0{index + 1}</span>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <Badge variant="outline">{copy.course_badge}</Badge>
                      <h3 className="mt-4 text-xl font-bold">{title}</h3>
                      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{description}</p>
                      <div className="mt-6 flex min-h-11 items-center justify-between border-t pt-4 text-sm font-bold text-primary">
                        {copy.course_view}<ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:rotate-[-90deg]" />
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
            <Button size="lg" variant="secondary" className="mt-7 lg:mt-0" asChild><a href="#courses">{copy.hero_primary_cta}<ArrowUpRight /></a></Button>
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
