import type { GetStaticProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations"
import {
  FiArrowUpRight as ArrowUpRight,
  FiBookOpen as BookOpenCheck,
  FiCheckCircle as CheckCircle2,
  FiMessageCircle as MessageCircle,
  FiPlayCircle as PlayCircle,
  FiShield as ShieldCheck,
  FiAward as Award,
  FiUsers as Users,
  FiLayers as Layers,
} from "react-icons/fi"
import { FaGraduationCap as GraduationCap } from "react-icons/fa6"
import Layout from "@/components/Layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { loadSiteContent, type SiteContent } from "@/lib/siteContent"
import { getDirectImageUrl } from "@/lib/utils"
import type { Course } from "@/types"

interface HomeProps {
  courses: Course[]
  siteContent: SiteContent
}

export default function Home({ courses, siteContent }: HomeProps) {
  const { locale } = useRouter()
  const isAr = locale === "ar"
  const copy = siteContent[isAr ? "ar" : "en"]
  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const features = [
    {
      Icon: GraduationCap,
      title: copy.feature_one_title,
      body: copy.feature_one_body,
      tag: tr("Clinical Board Alignment", "معايير البورد الصيدلي"),
      className: "md:col-span-2 bg-gradient-to-br from-card via-card to-primary/5",
    },
    {
      Icon: PlayCircle,
      title: copy.feature_two_title,
      body: copy.feature_two_body,
      tag: tr("High Yield Video", "فيديوهات مكثفة"),
      className: "bg-card",
    },
    {
      Icon: BookOpenCheck,
      title: copy.feature_three_title,
      body: copy.feature_three_body,
      tag: tr("Instant Quizzes", "اختبارات تفاعلية"),
      className: "bg-card",
    },
    {
      Icon: MessageCircle,
      title: copy.feature_four_title,
      body: copy.feature_four_body,
      tag: tr("Mentor Discussions", "نقاشات مع الأساتذة"),
      className: "md:col-span-2 bg-gradient-to-br from-card via-card to-accent/5",
    },
  ]

  return (
    <Layout>
      {/* ─── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="hero-glow pointer-events-none absolute inset-0 opacity-80 dark:opacity-100" aria-hidden="true" />
        <div className="clinical-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

        <div className="page-shell relative flex min-h-[640px] flex-col justify-center py-16 sm:py-24 lg:py-28">
          <div className="max-w-4xl space-y-6">
            {/* Top Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary shadow-xs backdrop-blur-md">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              <ShieldCheck className="size-4 shrink-0" />
              <span>{copy.hero_eyebrow}</span>
            </div>

            {/* Main Headline */}
            <h1 className="display-title tracking-tight font-black">
              {copy.hero_title_a}{" "}
              <span className="block gradient-text mt-1">{copy.hero_title_b}</span>
            </h1>

            {/* Subtitle */}
            <p className="body-lead text-base sm:text-lg leading-relaxed text-muted-foreground max-w-3xl">
              {copy.hero_subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center pt-3">
              <Button
                size="lg"
                className="h-12 rounded-full px-8 text-sm font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
                asChild
              >
                <a href="#courses" className="flex items-center gap-2">
                  <span>{copy.hero_primary_cta}</span>
                  <ArrowUpRight className="size-4 shrink-0 rtl:rotate-[-90deg]" />
                </a>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-full px-7 text-sm font-bold border-border/80 bg-background/80 hover:bg-muted/80 backdrop-blur-md transition-all hover:-translate-y-0.5"
                asChild
              >
                <a href="#about" className="flex items-center gap-2">
                  <PlayCircle className="size-4 text-primary shrink-0" />
                  <span>{copy.hero_secondary_cta}</span>
                </a>
              </Button>
            </div>

            {/* Clinical Value Checklist */}
            <div className="flex flex-wrap gap-4 sm:gap-8 pt-4 text-xs sm:text-sm font-semibold text-muted-foreground">
              <div className="inline-flex items-center gap-2">
                <div className="size-5 grid place-items-center rounded-full bg-primary/15 text-primary">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <span>{copy.hero_note_one}</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <div className="size-5 grid place-items-center rounded-full bg-primary/15 text-primary">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <span>{copy.hero_note_two}</span>
              </div>
            </div>
          </div>

          {/* Floating Metric Stats Bar */}
          <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 max-w-5xl">
            <div className="glass-panel flex items-center gap-3.5 rounded-2xl p-4 transition-transform hover:-translate-y-0.5">
              <div className="size-10 grid place-items-center rounded-xl bg-primary/15 text-primary shrink-0">
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-xl font-black text-foreground">5,000+</p>
                <p className="text-[11px] font-medium text-muted-foreground">{tr("Active Students", "طالب وطالبة")}</p>
              </div>
            </div>

            <div className="glass-panel flex items-center gap-3.5 rounded-2xl p-4 transition-transform hover:-translate-y-0.5">
              <div className="size-10 grid place-items-center rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 shrink-0">
                <Layers className="size-5" />
              </div>
              <div>
                <p className="text-xl font-black text-foreground">{courses.length} {tr("Modules", "مقررات")}</p>
                <p className="text-[11px] font-medium text-muted-foreground">{tr("Clinical Courses", "مقررات سريرية")}</p>
              </div>
            </div>

            <div className="glass-panel flex items-center gap-3.5 rounded-2xl p-4 transition-transform hover:-translate-y-0.5">
              <div className="size-10 grid place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                <Award className="size-5" />
              </div>
              <div>
                <p className="text-xl font-black text-foreground">98%</p>
                <p className="text-[11px] font-medium text-muted-foreground">{tr("Quiz Pass Rate", "نسبة اجتياز الاختبارات")}</p>
              </div>
            </div>

            <div className="glass-panel flex items-center gap-3.5 rounded-2xl p-4 transition-transform hover:-translate-y-0.5">
              <div className="size-10 grid place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-xl font-black text-foreground">100%</p>
                <p className="text-[11px] font-medium text-muted-foreground">{tr("Faculty Reviewed", "مراجعة سريرية معتمدة")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ABOUT / BENTO GRID FEATURES ──────────────────────────────────── */}
      <section id="about" className="section-space scroll-mt-20 sm:scroll-mt-24 relative">
        <div className="page-shell">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-14 items-start">
            <div className="space-y-4">
              <span className="eyebrow">{copy.about_eyebrow}</span>
              <h2 className="section-title">{copy.about_title}</h2>
              <p className="body-lead">{copy.about_body}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {features.map(({ Icon, title, body, tag, className }) => (
                <div
                  key={title}
                  className={`bento-card group flex flex-col justify-between ${className}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="size-12 grid place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 transition-transform group-hover:scale-110">
                        <Icon className="size-6" />
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {tag}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── COURSES CATALOG ──────────────────────────────────────────────── */}
      <section id="courses" className="section-space border-y border-border/60 bg-muted/30 scroll-mt-20 sm:scroll-mt-24 relative">
        <div className="page-shell">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-10">
            <div className="space-y-3 max-w-2xl">
              <span className="eyebrow">{copy.courses_eyebrow}</span>
              <h2 className="section-title">{copy.courses_title}</h2>
              <p className="body-lead">{copy.courses_body}</p>
            </div>
            <Badge variant="secondary" className="badge-nowrap px-4 py-2 text-sm font-bold rounded-full">
              {courses.length} {isAr ? "مقررات سريرية متاحة" : "Available Courses"}
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course, index) => {
              const title = isAr ? course.title_ar : course.title_en
              const description = isAr ? course.description_ar : course.description_en
              const coverUrl = getDirectImageUrl(course.thumbnail_url)

              return (
                <Link
                  href={`/course/${course.id}`}
                  key={course.id}
                  className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-3xl"
                >
                  <Card className="overflow-hidden h-full flex flex-col justify-between border-border/80 bg-card/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
                    {/* Course Banner */}
                    <div
                      className="relative flex h-48 items-end border-b border-border/60 bg-gradient-to-br from-primary/10 via-secondary to-accent/10 bg-cover bg-center p-6 shrink-0"
                      style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
                      role={coverUrl ? "img" : undefined}
                      aria-label={coverUrl ? `${title} cover` : undefined}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" aria-hidden="true" />
                      <div className="relative flex w-full items-end justify-between">
                        <div className="size-12 grid place-items-center rounded-2xl bg-card border border-border/80 text-primary shadow-sm">
                          <GraduationCap className="size-6" />
                        </div>
                        <span className="text-4xl font-black text-foreground/20 select-none">
                          0{index + 1}
                        </span>
                      </div>
                    </div>

                    {/* Course Details */}
                    <CardContent className="p-6 flex flex-col flex-1 justify-between space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[11px] font-bold">
                            {copy.course_badge}
                          </Badge>
                          {course.access_policy === "enrolled_only" && (
                            <Badge variant="warning" className="text-[10px]">
                              {tr("Enrolled Only", "تسجيل مسبق")}
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-xl font-bold leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors">
                          {title}
                        </h3>

                        <p className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">
                          {description}
                        </p>
                      </div>

                      {/* Course Card Action Bar */}
                      <div className="flex items-center justify-between border-t border-border/60 pt-4 text-xs font-bold text-primary">
                        <span className="group-hover:underline underline-offset-4">{copy.course_view}</span>
                        <div className="size-8 grid place-items-center rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <ArrowUpRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:rotate-[-90deg]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── CALL TO ACTION BANNER ────────────────────────────────────────── */}
      <section className="section-space relative">
        <div className="page-shell">
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-r from-primary via-emerald-800 to-teal-900 px-7 py-14 text-primary-foreground sm:px-12 lg:flex lg:items-center lg:justify-between lg:px-16 shadow-xl shadow-primary/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" aria-hidden="true" />
            <div className="relative space-y-3 max-w-2xl">
              <Badge variant="secondary" className="bg-white/20 text-white border-transparent text-xs font-bold">
                {tr("Open Access Clinical Education", "تعليم صيدلي متاح مجاناً")}
              </Badge>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                {copy.cta_title}
              </h2>
              <p className="text-base text-white/85 leading-relaxed">
                {copy.cta_body}
              </p>
            </div>

            <div className="relative mt-8 lg:mt-0 shrink-0">
              <Button
                size="lg"
                className="h-13 rounded-full px-8 text-sm font-bold bg-white text-emerald-950 hover:bg-white/90 shadow-xl transition-transform hover:scale-105 active:scale-95"
                asChild
              >
                <a href="#courses" className="flex items-center gap-2">
                  <span>{copy.hero_primary_cta}</span>
                  <ArrowUpRight className="size-4 rtl:rotate-[-90deg]" />
                </a>
              </Button>
            </div>
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
  return {
    props: {
      courses,
      siteContent,
      ...(await serverSideTranslations(locale ?? "en", ["common"])),
    },
    revalidate: 60,
  }
}
