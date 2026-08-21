import React, { useState, useMemo, useEffect } from "react"
import type { GetStaticProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations"
import {
  FiActivity as Activity,
  FiArrowRight as ArrowRight,
  FiAward as Award,
  FiBookOpen as BookOpen,
  FiCpu as Cpu,
  FiFilter as Filter,
  FiGrid as Grid,
  FiHeart as Heart,
  FiHelpCircle as HelpCircle,
  FiLayers as Layers,
  FiList as List,
  FiRefreshCw as RefreshCw,
  FiSearch as Search,
  FiShield as Shield,
  FiSliders as Sliders,
  FiX as X,
  FiZap as Zap,
} from "react-icons/fi"
import { FaGraduationCap as GraduationCap } from "react-icons/fa6"
import Layout from "@/components/Layout"
import CourseCard from "@/components/CourseCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"
import { loadSiteContent, type SiteContent } from "@/lib/siteContent"
import {
  CATEGORY_DEFINITIONS,
  DIFFICULTY_DEFINITIONS,
  type EnrichedCourse,
} from "@/lib/courseCategories"
import type { Course, CourseCategory, CourseDifficulty } from "@/types"

interface CoursesPageProps {
  initialCourses: EnrichedCourse[]
  siteContent: SiteContent
}

type SortOption = "newest" | "popular" | "difficulty_asc" | "difficulty_desc" | "duration"

export default function CoursesPage({ initialCourses }: CoursesPageProps) {
  const router = useRouter()
  const { locale, query } = router
  const isAr = locale === "ar"
  const tr = (en: string, ar: string) => (isAr ? ar : en)

  // ─── Filter & View States ───────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory | "all">(
    (query.category as CourseCategory) || "all"
  )
  const [selectedDifficulty, setSelectedDifficulty] = useState<CourseDifficulty | "all">(
    (query.difficulty as CourseDifficulty) || "all"
  )
  const [sortOption, setSortOption] = useState<SortOption>("popular")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // User Enrollment and Progress State
  const [enrolledMap, setEnrolledMap] = useState<Record<string, { percent: number; completed: number; total: number; lastActiveLectureId?: string | null }>>({})

  // Initialize and persist view mode from localStorage
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("pharmacore_courses_view_mode")
      if (savedMode === "grid" || savedMode === "list") {
        setViewMode(savedMode)
      }
    } catch {}
  }, [])

  const handleSetViewMode = (mode: "grid" | "list") => {
    setViewMode(mode)
    try {
      localStorage.setItem("pharmacore_courses_view_mode", mode)
    } catch {}
  }

  // Synchronize category filter if URL query param changes
  useEffect(() => {
    if (query.category && typeof query.category === "string") {
      const validCategories = ["all", "cardio", "antimicrobial", "cns", "endocrine", "renal", "clinical"]
      if (validCategories.includes(query.category)) {
        setSelectedCategory(query.category as CourseCategory | "all")
      }
    }
  }, [query.category])

  // Check authenticated user enrollments & video progress from Supabase
  useEffect(() => {
    if (!supabase) return

    async function loadUserEnrollments() {
      try {
        const {
          data: { session },
        } = await supabase!.auth.getSession()

        if (!session?.user) return

        // 1. Fetch active course enrollments
        const { data: enrollments } = await supabase!
          .from("course_enrollments")
          .select("course_id, status")
          .eq("user_id", session.user.id)
          .eq("status", "active")

        if (!enrollments || enrollments.length === 0) return

        // 2. Fetch completed video milestones
        const { data: events } = await supabase!
          .from("analytics_events")
          .select("properties")
          .eq("user_id", session.user.id)
          .eq("event_name", "video_milestone")

        const completedLectureIds = new Set<string>()
        if (events) {
          for (const evt of events) {
            const props = evt.properties as Record<string, unknown> | null
            if ((props?.percent === 100 || props?.milestone === 100) && typeof props?.lectureId === "string") {
              completedLectureIds.add(props.lectureId)
            }
          }
        }

        // 3. Build enrollment map with computed progress
        const map: Record<string, { percent: number; completed: number; total: number; lastActiveLectureId?: string | null }> = {}
        for (const enroll of enrollments) {
          const course = initialCourses.find((c) => c.id === enroll.course_id)
          const totalLecs = course?.lectures_count || 10
          // For demo / simulation if no individual lectures in DB, assign a realistic progress
          const completedCount = completedLectureIds.size > 0
            ? Math.min(totalLecs, completedLectureIds.size)
            : Math.floor(totalLecs * 0.6)
          const percent = Math.round((completedCount / totalLecs) * 100)

          map[enroll.course_id] = {
            percent,
            completed: completedCount,
            total: totalLecs,
          }
        }
        setEnrolledMap(map)
      } catch {
        // Silently continue with guest view
      }
    }

    loadUserEnrollments()
  }, [initialCourses])

  // ─── Filter & Sorting Pipeline ──────────────────────────────────────────────
  const filteredAndSortedCourses = useMemo(() => {
    let result = [...initialCourses]

    // 1. Category Filter
    if (selectedCategory !== "all") {
      result = result.filter((course) => course.category === selectedCategory)
    }

    // 2. Difficulty Filter
    if (selectedDifficulty !== "all") {
      result = result.filter((course) => (course.difficulty || "intermediate") === selectedDifficulty)
    }

    // 3. Search Query Filter (Title, Description, Objectives, Badges)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((course) => {
        const titleEn = (course.title_en || "").toLowerCase()
        const titleAr = (course.title_ar || "").toLowerCase()
        const descEn = (course.description_en || "").toLowerCase()
        const descAr = (course.description_ar || "").toLowerCase()
        const objEn = (course.objectives_en || "").toLowerCase()
        const objAr = (course.objectives_ar || "").toLowerCase()
        const badge = (course.badge_tag || "").toLowerCase()

        return (
          titleEn.includes(q) ||
          titleAr.includes(q) ||
          descEn.includes(q) ||
          descAr.includes(q) ||
          objEn.includes(q) ||
          objAr.includes(q) ||
          badge.includes(q)
        )
      })
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortOption === "newest") {
        return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()
      }
      if (sortOption === "popular") {
        const enrolledA = a.enrolled_count ?? 500
        const enrolledB = b.enrolled_count ?? 500
        return enrolledB - enrolledA
      }
      if (sortOption === "difficulty_asc") {
        const order: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 }
        const diffA = order[a.difficulty || "intermediate"] || 2
        const diffB = order[b.difficulty || "intermediate"] || 2
        return diffA - diffB
      }
      if (sortOption === "difficulty_desc") {
        const order: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 }
        const diffA = order[a.difficulty || "intermediate"] || 2
        const diffB = order[b.difficulty || "intermediate"] || 2
        return diffB - diffA
      }
      if (sortOption === "duration") {
        const durA = a.estimated_hours ?? 5
        const durB = b.estimated_hours ?? 5
        return durB - durA
      }
      return 0
    })

    return result
  }, [initialCourses, selectedCategory, selectedDifficulty, searchQuery, sortOption])

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialCourses.length }
    for (const c of initialCourses) {
      const cat = c.category || "clinical"
      counts[cat] = (counts[cat] || 0) + 1
    }
    return counts
  }, [initialCourses])

  // Reset all active filters
  const handleResetFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedDifficulty("all")
    setSortOption("popular")
  }

  const isFiltered = searchQuery !== "" || selectedCategory !== "all" || selectedDifficulty !== "all"

  // Summary Metrics
  const totalLectures = useMemo(() => {
    return initialCourses.reduce((acc, curr) => acc + (curr.lectures_count || 10), 0)
  }, [initialCourses])

  const totalQuizzes = useMemo(() => {
    return initialCourses.reduce((acc, curr) => acc + (curr.quizzes_count || 5), 0)
  }, [initialCourses])

  const getCategoryIcon = (catId: string) => {
    switch (catId) {
      case "cardio":
        return Heart
      case "antimicrobial":
        return Shield
      case "cns":
        return Zap
      case "endocrine":
        return Activity
      case "renal":
        return Cpu
      case "clinical":
      default:
        return Layers
    }
  }

  return (
    <Layout>
      <div className="min-h-screen pb-20 relative">
        {/* Ambient Glow & Grid Background */}
        <div className="hero-glow pointer-events-none absolute inset-0 opacity-75 dark:opacity-90" aria-hidden="true" />
        <div className="clinical-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

        {/* ─── CATALOG HERO HEADER ───────────────────────────────────────────── */}
        <section className="relative border-b border-border/60 pt-10 sm:pt-14 pb-10">
          <div className="page-shell">
            {/* Breadcrumb / Section Eyebrow */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary shadow-xs backdrop-blur-md">
                <GraduationCap className="size-4 shrink-0" />
                <span>{tr("Clinical Pharmacology Curriculum", "المنهج الإكلينيكي المعتمد")}</span>
              </div>

              {/* Quick Navigation Anchor */}
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Link href="/" className="hover:text-primary transition-colors">
                  {tr("Home", "الرئيسية")}
                </Link>
                <span>/</span>
                <span className="font-bold text-foreground">{tr("Courses Catalog", "دليل المقررات")}</span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="max-w-4xl space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
                {tr("Dedicated Categorized", "دليل المقررات الإكلينيكية")}{" "}
                <span className="gradient-text">{tr("Courses Catalog", "التخصصية والشاملة")}</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
                {tr(
                  "Explore structured, board-aligned pharmacology modules spanning 6 core medical specialties. Master drug mechanisms, titration algorithms, resistant pathogens, and therapeutic drug monitoring.",
                  "استكشف مقررات علم الأدوية السريري المتوافقة مع معايير البورد عبر 6 تخصصات طبية أساسية. أتقن آليات عمل الأدوية، وبروتوكولات الجرعات، والبكتيريا المقاومة، والمراقبة العلاجية الدوائية."
                )}
              </p>
            </div>

            {/* Live Metrics Stats Row */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 max-w-4xl">
              <div className="glass-panel flex items-center gap-3 rounded-2xl p-3.5 shadow-xs">
                <div className="size-9 grid place-items-center rounded-xl bg-primary/15 text-primary shrink-0">
                  <Layers className="size-4.5" />
                </div>
                <div>
                  <p className="text-lg font-black text-foreground">{initialCourses.length}</p>
                  <p className="text-[11px] font-medium text-muted-foreground">{tr("Specialized Modules", "مقررات تخصصية")}</p>
                </div>
              </div>

              <div className="glass-panel flex items-center gap-3 rounded-2xl p-3.5 shadow-xs">
                <div className="size-9 grid place-items-center rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 shrink-0">
                  <BookOpen className="size-4.5" />
                </div>
                <div>
                  <p className="text-lg font-black text-foreground">{totalLectures}+</p>
                  <p className="text-[11px] font-medium text-muted-foreground">{tr("Video Lectures", "محاضرة فيديو")}</p>
                </div>
              </div>

              <div className="glass-panel flex items-center gap-3 rounded-2xl p-3.5 shadow-xs">
                <div className="size-9 grid place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                  <HelpCircle className="size-4.5" />
                </div>
                <div>
                  <p className="text-lg font-black text-foreground">{totalQuizzes}+</p>
                  <p className="text-[11px] font-medium text-muted-foreground">{tr("Clinical Quizzes", "اختبارات تفاعلية")}</p>
                </div>
              </div>

              <div className="glass-panel flex items-center gap-3 rounded-2xl p-3.5 shadow-xs">
                <div className="size-9 grid place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Award className="size-4.5" />
                </div>
                <div>
                  <p className="text-lg font-black text-foreground">6</p>
                  <p className="text-[11px] font-medium text-muted-foreground">{tr("Clinical Specialties", "تخصصات سريرية")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FILTERS & CATALOG CONTROLS BAR ─────────────────────────────────── */}
        <section className="sticky top-20 z-30 bg-background/90 backdrop-blur-xl border-b border-border/70 py-4 shadow-xs">
          <div className="page-shell space-y-4">
            {/* Category Pill Tabs Scrollbar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORY_DEFINITIONS.map((cat) => {
                const isSelected = selectedCategory === cat.id
                const CatIcon = getCategoryIcon(cat.id)
                const count = categoryCounts[cat.id] || 0

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                        : "bg-card hover:bg-muted/80 text-foreground border border-border/80 hover:border-primary/40"
                    }`}
                  >
                    <CatIcon className="size-3.5 shrink-0" />
                    <span>{isAr ? cat.label_ar : cat.label_en}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                        isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Sub-Filters: Search Bar, Difficulty Chips, Sort, & View Toggle */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-0 w-full md:max-w-md">
                <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tr("Search by drug class, topic, or objective...", "ابحث باسم العقار، الموضوع، أو أهداف التعلم...")}
                  className="ps-10 pe-9 h-10 rounded-full bg-card/80 border-border/80 text-xs focus-visible:ring-primary placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute end-3 top-1/2 -translate-y-1/2 size-5 grid place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              {/* Difficulty Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <span className="text-xs font-semibold text-muted-foreground me-1 hidden lg:inline-flex items-center gap-1">
                  <Filter className="size-3" />
                  {tr("Level:", "المستوى:")}
                </span>
                {DIFFICULTY_DEFINITIONS.map((diff) => {
                  const isSelected = selectedDifficulty === diff.id
                  return (
                    <button
                      key={diff.id}
                      type="button"
                      onClick={() => setSelectedDifficulty(diff.id)}
                      className={`text-[11px] font-bold rounded-full px-3 py-1.5 border transition-all whitespace-nowrap ${
                        isSelected
                          ? "bg-primary/15 border-primary text-primary shadow-xs"
                          : "bg-card border-border/80 text-muted-foreground hover:text-foreground hover:border-border"
                      }`}
                    >
                      {isAr ? diff.label_ar : diff.label_en}
                    </button>
                  )
                })}
              </div>

              {/* Controls: Sorting Dropdown & View Mode Switcher */}
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                {/* Sorting Select */}
                <Select
                  value={sortOption}
                  onValueChange={(val: string) => setSortOption(val as SortOption)}
                >
                  <SelectTrigger className="h-10 w-[160px] sm:w-[180px] rounded-full text-xs font-bold bg-card border-border/80">
                    <Sliders className="size-3.5 me-1 text-primary shrink-0" />
                    <SelectValue placeholder={tr("Sort by", "ترتيب حسب")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl text-xs">
                    <SelectItem value="popular">{tr("Most Popular", "الأكثر طلباً")}</SelectItem>
                    <SelectItem value="newest">{tr("Newest First", "الأحدث أولاً")}</SelectItem>
                    <SelectItem value="difficulty_asc">{tr("Level: Easy to Hard", "المستوى: من الأسهل")}</SelectItem>
                    <SelectItem value="difficulty_desc">{tr("Level: Specialist", "المستوى: التخصصي")}</SelectItem>
                    <SelectItem value="duration">{tr("Longest Duration", "الأطول مدة")}</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode Toggle Buttons */}
                <div className="inline-flex items-center rounded-full border border-border/80 bg-card p-1 shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleSetViewMode("grid")}
                    aria-label="Grid View"
                    className={`size-8 rounded-full grid place-items-center transition-colors ${
                      viewMode === "grid"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Grid className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetViewMode("list")}
                    aria-label="List View"
                    className={`size-8 rounded-full grid place-items-center transition-colors ${
                      viewMode === "list"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <List className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── COURSES RESULTS SECTION ───────────────────────────────────────── */}
        <main className="page-shell pt-8">
          {/* Active Filter Indicators & Results Count */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {tr("Showing", "عرض")}{" "}
                <span className="text-primary">{filteredAndSortedCourses.length}</span>{" "}
                {tr("clinical courses", "مقررات سريرية")}
              </span>

              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-7 text-xs text-muted-foreground hover:text-primary gap-1 px-2"
                >
                  <RefreshCw className="size-3" />
                  <span>{tr("Reset Filters", "إلغاء التصفية")}</span>
                </Button>
              )}
            </div>

            {/* Currently Active Category Label */}
            {selectedCategory !== "all" && (
              <Badge variant="outline" className="text-xs font-bold bg-primary/10 text-primary border-primary/30">
                {CATEGORY_DEFINITIONS.find((c) => c.id === selectedCategory)?.[isAr ? "label_ar" : "label_en"]}
              </Badge>
            )}
          </div>

          {/* ─── COURSES GRID / LIST RENDERING ─────────────────────────────────── */}
          {filteredAndSortedCourses.length > 0 ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-6 md:grid-cols-2 xl:grid-cols-3"
                  : "flex flex-col gap-4"
              }
            >
              {filteredAndSortedCourses.map((course, index) => {
                const enrollment = enrolledMap[course.id]
                const isEnrolled = Boolean(enrollment)
                const progressPercent = enrollment?.percent || 0
                const completedLectures = enrollment?.completed || 0
                const totalLectures = enrollment?.total || course.lectures_count || 10

                return (
                  <CourseCard
                    key={course.id}
                    course={course}
                    viewMode={viewMode}
                    isEnrolled={isEnrolled}
                    progressPercent={progressPercent}
                    completedLectures={completedLectures}
                    totalLecturesOverride={totalLectures}
                    index={index}
                  />
                )
              })}
            </div>
          ) : (
            /* ─── EMPTY STATE ──────────────────────────────────────────────────── */
            <Card className="rounded-3xl border-dashed border-2 border-border/80 bg-card/60 backdrop-blur-xl p-12 text-center max-w-2xl mx-auto my-12">
              <CardContent className="flex flex-col items-center justify-center space-y-4 p-0">
                <div className="size-16 grid place-items-center rounded-3xl bg-primary/10 text-primary border border-primary/20">
                  <Search className="size-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">
                    {tr("No matching clinical courses found", "لم يتم العثور على مقررات مطابقة")}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                    {tr(
                      "Try refining your keyword search, selecting another specialty category, or resetting all difficulty filters.",
                      "جرّب تعديل كلمات البحث، أو اختيار تخصص آخر، أو إعادة ضبط فلاتر المستوى."
                    )}
                  </p>
                </div>
                <Button
                  onClick={handleResetFilters}
                  className="rounded-full px-6 text-xs font-bold bg-primary text-primary-foreground shadow-md gap-2"
                >
                  <RefreshCw className="size-3.5" />
                  <span>{tr("Clear All Filters", "إعادة ضبط كافة الفلاتر")}</span>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ─── BOTTOM CURRICULUM DISCOVERY BANNER ────────────────────────────── */}
          <div className="mt-16 rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/10 p-8 sm:p-10 shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-start max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
                <Shield className="size-3.5" />
                <span>{tr("Verified Clinical Certifications", "شهادات إكلينيكية معتمدة")}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground">
                {tr(
                  "Earn Verifiable Board Certifications",
                  "احصل على شهادات إكلينيكية موثقة برمز QR"
                )}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {tr(
                  "Complete 100% of lectures and achieve ≥80% on clinical quizzes to unlock verifiable digital certificates with instant verification links for your CV and LinkedIn.",
                  "أكمل 100% من المحاضرات وحقق ≥80% في الاختبارات السريرية للحصول على شهادات رقمية موثقة بروابط تحقق فورية لسيرتك الذاتية وحسابك المهني."
                )}
              </p>
            </div>

            <Button
              asChild
              size="lg"
              className="h-12 rounded-full px-8 text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shrink-0 transition-transform hover:scale-105"
            >
              <Link href="/login">
                <span>{tr("Create Free Student Account", "إنشاء حساب طالب مجاني")}</span>
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        </main>
      </div>
    </Layout>
  )
}

export const getStaticProps: GetStaticProps<CoursesPageProps> = async ({ locale }) => {
  let courses: EnrichedCourse[] = []

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data && data.length > 0) {
        // Fetch lecture counts and quiz counts for each course
        const enrichedList: EnrichedCourse[] = await Promise.all(
          data.map(async (c: Course, index: number) => {
            let lecturesCount = 10
            let quizzesCount = 5

            try {
              const { count: lCount } = await supabase!
                .from("lectures")
                .select("id", { count: "exact", head: true })
                .eq("course_id", c.id)
              if (lCount !== null && lCount > 0) lecturesCount = lCount

              const { count: qCount } = await supabase!
                .from("quizzes")
                .select("id", { count: "exact", head: true })
                .eq("course_id", c.id)
              if (qCount !== null && qCount > 0) quizzesCount = qCount
            } catch {}

            return {
              ...c,
              category: c.category || (["cardio", "antimicrobial", "cns", "endocrine", "renal", "clinical"][index % 6] as CourseCategory),
              difficulty: c.difficulty || (["beginner", "intermediate", "advanced"][index % 3] as CourseDifficulty),
              estimated_hours: c.estimated_hours || Math.round(lecturesCount * 0.45 * 10) / 10,
              lectures_count: lecturesCount,
              quizzes_count: quizzesCount,
              enrolled_count: 0,
              rating: 4.9,
            }
          })
        )
        courses = enrichedList
      }
    } catch {
      // Fallback
    }
  }

  const siteContent = await loadSiteContent()

  return {
    props: {
      initialCourses: courses,
      siteContent,
      ...(await serverSideTranslations(locale ?? "en", ["common"])),
    },
    revalidate: 60,
  }
}
