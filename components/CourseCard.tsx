import React from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import {
  FiActivity as Activity,
  FiArrowRight as ArrowRight,
  FiArrowUpRight as ArrowUpRight,
  FiBookOpen as BookOpen,
  FiCheckCircle as CheckCircle2,
  FiClock as Clock,
  FiCpu as Cpu,
  FiHelpCircle as HelpCircle,
  FiHeart as Heart,
  FiLayers as Layers,
  FiLock as Lock,
  FiPlayCircle as PlayCircle,
  FiShield as Shield,
  FiStar as Star,
  FiUsers as Users,
  FiZap as Zap,
} from "react-icons/fi"
import { FaGraduationCap as GraduationCap } from "react-icons/fa6"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getDirectImageUrl } from "@/lib/utils"
import type { Course, CourseCategory, CourseDifficulty } from "@/types"
import type { EnrichedCourse } from "@/lib/courseCategories"

export interface CourseCardProps {
  course: Course | EnrichedCourse
  viewMode?: "grid" | "list"
  isEnrolled?: boolean
  progressPercent?: number
  completedLectures?: number
  totalLecturesOverride?: number
  lastActiveLectureId?: string | null
  index?: number
}

export default function CourseCard({
  course,
  viewMode = "grid",
  isEnrolled = false,
  progressPercent = 0,
  completedLectures = 0,
  totalLecturesOverride,
  lastActiveLectureId,
  index = 0,
}: CourseCardProps) {
  const { locale } = useRouter()
  const isAr = locale === "ar"
  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const title = isAr ? course.title_ar || course.title_en : course.title_en
  const description = isAr ? course.description_ar || course.description_en : course.description_en
  const coverUrl = getDirectImageUrl(course.thumbnail_url)

  const enriched = course as EnrichedCourse
  const lectureCount = totalLecturesOverride ?? enriched.lectures_count ?? 10
  const quizCount = enriched.quizzes_count ?? Math.max(2, Math.round(lectureCount / 2))
  const estimatedHours = course.estimated_hours ?? Math.round(lectureCount * 0.45 * 10) / 10
  const rating = enriched.rating ?? 4.9
  const enrolledCount = enriched.enrolled_count ?? 0

  // Category Configuration
  const category = (course.category || "cardio") as CourseCategory
  const getCategoryMeta = (cat: CourseCategory) => {
    switch (cat) {
      case "cardio":
        return {
          label: tr("Cardiovascular", "القلب والأوعية"),
          icon: Heart,
          badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
          gradient: "from-rose-500/20 via-pink-500/10 to-transparent",
        }
      case "antimicrobial":
        return {
          label: tr("Antimicrobial & ID", "المضادات الحيوية"),
          icon: Shield,
          badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
          gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
        }
      case "cns":
        return {
          label: tr("CNS & Neuro", "الأعصاب والنفسية"),
          icon: Zap,
          badgeClass: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
          gradient: "from-purple-500/20 via-indigo-500/10 to-transparent",
        }
      case "endocrine":
        return {
          label: tr("Endocrine & Diabetes", "الغدد والسكري"),
          icon: Activity,
          badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
          gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
        }
      case "renal":
        return {
          label: tr("Renal & Critical Care", "الكلى والعناية الحرجة"),
          icon: Cpu,
          badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
          gradient: "from-blue-500/20 via-cyan-500/10 to-transparent",
        }
      case "clinical":
      default:
        return {
          label: tr("Clinical Practice & TDM", "الممارسة الإكلينيكية"),
          icon: Layers,
          badgeClass: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
          gradient: "from-teal-500/20 via-emerald-500/10 to-transparent",
        }
    }
  }

  const catMeta = getCategoryMeta(category)
  const CategoryIcon = catMeta.icon

  // Difficulty Meta
  const difficulty = (course.difficulty || "intermediate") as CourseDifficulty
  const getDifficultyMeta = (diff: CourseDifficulty) => {
    switch (diff) {
      case "beginner":
        return {
          label: tr("Core / Beginner", "مستوى أساسي"),
          badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        }
      case "advanced":
        return {
          label: tr("Clinical Specialist", "متقدم / تخصصي"),
          badgeClass: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
        }
      case "intermediate":
      default:
        return {
          label: tr("Intermediate", "مستوى متوسط"),
          badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
        }
    }
  }
  const diffMeta = getDifficultyMeta(difficulty)

  // Promotional Badge
  const promoTag = course.badge_tag || (course.is_preview ? "Free Preview" : "Board Review")
  const getPromoBadgeClass = (tag: string) => {
    if (tag.includes("Popular") || tag.includes("High-Yield")) {
      return "bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/40 shadow-xs"
    }
    if (tag.includes("Preview") || tag.includes("Free")) {
      return "bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border-emerald-500/40 shadow-xs"
    }
    return "bg-purple-500/20 text-purple-900 dark:text-purple-200 border-purple-500/40 shadow-xs"
  }

  // Destination URL
  const courseUrl = isEnrolled && lastActiveLectureId
    ? `/lecture/${lastActiveLectureId}`
    : `/course/${course.id}`

  // ───────────────────────────────────────────────────────────────────────────
  // LIST VIEW LAYOUT
  // ───────────────────────────────────────────────────────────────────────────
  if (viewMode === "list") {
    return (
      <div className="group relative rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left / Start: Thumbnail & Specialty Icon */}
          <div className="flex items-start gap-4 sm:gap-5 w-full lg:w-auto">
            <Link
              href={courseUrl}
              className="relative shrink-0 size-24 sm:size-28 rounded-2xl overflow-hidden border border-border/70 bg-gradient-to-br from-primary/15 via-secondary to-accent/15 flex items-center justify-center group-hover:border-primary/40 transition-colors"
            >
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt={title}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="size-full flex flex-col items-center justify-center text-primary p-2">
                  <CategoryIcon className="size-8 sm:size-10" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <div className="absolute bottom-1.5 start-1.5">
                <span className="text-[10px] font-black font-mono text-foreground/80 bg-background/80 px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                  0{index + 1}
                </span>
              </div>
            </Link>

            {/* Middle: Content Info */}
            <div className="space-y-2 flex-1 min-w-0">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Badge variant="outline" className={`text-[10px] sm:text-xs font-bold gap-1 ${catMeta.badgeClass}`}>
                  <CategoryIcon className="size-3" />
                  <span>{catMeta.label}</span>
                </Badge>

                <Badge variant="outline" className={`text-[10px] sm:text-xs font-semibold ${diffMeta.badgeClass}`}>
                  {diffMeta.label}
                </Badge>

                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black backdrop-blur-md ${getPromoBadgeClass(promoTag)}`}>
                  {promoTag}
                </span>

                {course.access_policy === "enrolled_only" ? (
                  <Badge variant="outline" className="text-[10px] bg-muted/50 border-border text-muted-foreground">
                    <Lock className="size-2.5 me-1" />
                    {tr("Enrolled Only", "تسجيل مسبق")}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                    <PlayCircle className="size-2.5 me-1" />
                    {tr("Open Preview", "معاينة متاحة")}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <Link href={courseUrl} className="block group-hover:text-primary transition-colors">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground leading-snug line-clamp-1">
                  {title}
                </h3>
              </Link>

              {/* Description & Objectives Preview */}
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {description}
              </p>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1 text-xs text-muted-foreground font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary shrink-0" />
                  <span>{estimatedHours} {tr("Hours", "ساعات")}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="size-3.5 text-primary shrink-0" />
                  <span>{lectureCount} {tr("Lectures", "محاضرة")}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <HelpCircle className="size-3.5 text-primary shrink-0" />
                  <span>{quizCount} {tr("Clinical Quizzes", "اختبارات سريرية")}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-amber-500">
                  <Star className="size-3.5 fill-current" />
                  <span className="font-bold text-foreground">{rating}</span>
                  <span className="text-[11px] text-muted-foreground font-normal">({enrolledCount})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right / End: Progress or CTA Actions */}
          <div className="w-full lg:w-64 shrink-0 flex flex-col justify-center gap-3 pt-3 lg:pt-0 lg:border-s lg:border-border/60 lg:ps-6">
            {isEnrolled ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-primary flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" />
                    {progressPercent >= 100 ? tr("Completed", "مكتمل") : tr("In Progress", "قيد التقدم")}
                  </span>
                  <span className="font-mono text-muted-foreground">{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2 rounded-full" />
                <p className="text-[11px] text-muted-foreground text-center">
                  {completedLectures}/{lectureCount} {tr("lectures finished", "محاضرة منجزة")}
                </p>
                <Button
                  asChild
                  className="w-full h-10 rounded-full font-bold shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                >
                  <Link href={courseUrl} className="flex items-center justify-center gap-2">
                    <span>{progressPercent >= 100 ? tr("Review Course", "مراجعة المقرر") : tr("Continue Learning", "متابعة الدراسة")}</span>
                    <ArrowRight className="size-3.5 rtl:rotate-180" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5 text-primary" />
                    <span>{enrolledCount.toLocaleString()} {tr("Students", "طالب")}</span>
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {course.access_policy === "open" ? tr("Free Access", "متاح مجاناً") : tr("Curriculum", "منهج معتمد")}
                  </span>
                </div>
                <Button
                  asChild
                  className="w-full h-10 rounded-full font-bold shadow-md shadow-primary/10 bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                >
                  <Link href={`/course/${course.id}`} className="flex items-center justify-center gap-2">
                    <span>{course.is_preview ? tr("Free Preview", "معاينة مجانية") : tr("Explore Course", "استعراض المقرر")}</span>
                    <ArrowUpRight className="size-3.5 rtl:rotate-[-90deg]" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GRID VIEW LAYOUT (Default)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <Card className="group overflow-hidden h-full flex flex-col justify-between rounded-3xl border-border/80 bg-card/90 backdrop-blur-xl shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
      {/* Course Banner Image & Badges Header */}
      <div
        className="relative flex h-48 sm:h-52 items-end border-b border-border/60 bg-gradient-to-br from-primary/15 via-secondary to-accent/15 bg-cover bg-center p-5 sm:p-6 shrink-0"
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
        role={coverUrl ? "img" : undefined}
        aria-label={coverUrl ? `${title} cover` : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" aria-hidden="true" />
        
        {/* Top Floating Promo Badge & Category Badge */}
        <div className="absolute top-4 start-4 end-4 z-10 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-black backdrop-blur-md ${getPromoBadgeClass(promoTag)}`}
          >
            {promoTag}
          </span>

          <Badge variant="outline" className={`text-[10px] font-bold backdrop-blur-md ${catMeta.badgeClass}`}>
            <CategoryIcon className="size-3 me-1" />
            <span>{catMeta.label}</span>
          </Badge>
        </div>

        {/* Bottom Banner Row: Avatar Icon & Index */}
        <div className="relative flex w-full items-end justify-between z-10">
          <div className="size-11 grid place-items-center rounded-2xl bg-card/90 border border-border/80 text-primary shadow-xs backdrop-blur-md">
            <GraduationCap className="size-5.5" />
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-bold text-amber-500 backdrop-blur-md shadow-xs">
              <Star className="size-3 fill-current" />
              <span className="text-foreground">{rating}</span>
            </span>
            <span className="text-3xl sm:text-4xl font-black text-foreground/20 select-none font-mono">
              0{index + 1}
            </span>
          </div>
        </div>
      </div>

      {/* Course Details Content */}
      <CardContent className="p-5 sm:p-6 flex flex-col flex-1 justify-between space-y-5">
        <div className="space-y-3">
          {/* Difficulty and Access Tags */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[10px] font-semibold ${diffMeta.badgeClass}`}>
              {diffMeta.label}
            </Badge>

            {course.access_policy === "enrolled_only" ? (
              <Badge variant="outline" className="text-[10px] bg-muted/50 border-border text-muted-foreground">
                <Lock className="size-2.5 me-1" />
                {tr("Enrolled Only", "تسجيل مسبق")}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                <PlayCircle className="size-2.5 me-1" />
                {tr("Open Preview", "معاينة متاحة")}
              </Badge>
            )}
          </div>

          {/* Title */}
          <Link href={courseUrl} className="block focus-visible:outline-none">
            <h3 className="text-lg sm:text-xl font-bold leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </h3>
          </Link>

          {/* Description */}
          <p className="line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>

          {/* Metadata Row */}
          <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground border-t border-border/50 pt-3">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5 text-primary" />
              <span>{estimatedHours} {tr("Hours", "ساعات")}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="size-3.5 text-primary" />
              <span>{lectureCount} {tr("Lectures", "محاضرة")}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HelpCircle className="size-3.5 text-primary" />
              <span>{quizCount} {tr("Quizzes", "اختبارات")}</span>
            </span>
          </div>
        </div>

        {/* Progress or CTA Action Bar */}
        <div className="border-t border-border/60 pt-4">
          {isEnrolled ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-primary flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="size-3" />
                  {progressPercent >= 100 ? tr("Completed", "مكتمل 100%") : tr("Study Progress", "نسبة الإنجاز")}
                </span>
                <span className="font-mono text-muted-foreground text-xs">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2 rounded-full" />
              <Button
                asChild
                className="w-full h-10 rounded-full font-bold shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground text-xs mt-1"
              >
                <Link href={courseUrl} className="flex items-center justify-center gap-2">
                  <span>{progressPercent >= 100 ? tr("Review Course", "مراجعة المقرر") : tr("Continue Learning", "متابعة الدراسة")}</span>
                  <ArrowRight className="size-3.5 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <Button
                asChild
                variant="ghost"
                className="p-0 h-auto font-bold text-xs text-primary hover:bg-transparent hover:underline underline-offset-4"
              >
                <Link href={`/course/${course.id}`}>
                  {tr("Explore Curriculum", "استعراض المنهج")}
                </Link>
              </Button>

              <Button
                asChild
                size="sm"
                className="h-9 rounded-full px-4 text-xs font-bold shadow-md shadow-primary/10 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              >
                <Link href={`/course/${course.id}`}>
                  <span>{course.is_preview ? tr("Preview", "معاينة") : tr("View", "عرض")}</span>
                  <ArrowUpRight className="size-3.5 rtl:rotate-[-90deg]" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
