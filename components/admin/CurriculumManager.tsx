import { useState } from "react"
import {
  FiBookOpen as BookOpen,
  FiCheck as Check,
  FiCheckCircle as CheckCircle2,
  FiClipboard as ClipboardCheck,
  FiEdit2 as Pencil,
  FiExternalLink as ExternalLink,
  FiFileText as FileText,
  FiGlobe as Globe,
  FiHelpCircle as HelpCircle,
  FiImage as FileImage,
  FiLink as LinkIcon,
  FiLock as Lock,
  FiPlus as Plus,
  FiSearch as Search,
  FiShield as Shield,
  FiSliders as Sliders,
  FiTrash2 as Trash2,
  FiUsers as Users,
  FiVideo as FileVideo,
  FiX as X,
  FiYoutube as YoutubeIcon,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import CourseEnrollmentManager from "@/components/admin/CourseEnrollmentManager"
import type { Course, EnrollmentSettings, Lecture, Question, Quiz, Resource } from "@/types"

interface CurriculumManagerProps {
  isAr: boolean
  token?: string | null
  enrollmentSettings?: EnrollmentSettings
  searchQuery: string
  courses: Course[]
  lectures: Lecture[]
  quizzes: Quiz[]
  questions: Question[]
  resources: Resource[]
  selectedQuizId: string
  setSelectedQuizId: (id: string) => void
  activeSubTab?: SubTab
  selectedEnrollmentCourseId?: string
  onOpenCourseEditor: (course?: Course) => void
  onOpenLectureEditor: (lecture?: Lecture) => void
  onOpenQuizEditor: (quiz?: Quiz) => void
  onOpenResourceEditor: (resource?: Resource) => void
  onOpenQuestionEditor: (question?: Question) => void
  onDeleteEntity: (
    table: "courses" | "lectures" | "quizzes" | "resources" | "questions",
    id: string,
    name: string
  ) => void
  onNavigateToEnrollments?: (courseId?: string) => void
  onEnrollmentsUpdated?: (pendingCount: number) => void
}

type SubTab = "courses" | "enrollments" | "lectures" | "quizzes" | "resources"

export default function CurriculumManager({
  isAr,
  token = null,
  enrollmentSettings = { signup_mode: "approval_required", universities: [], faculties: [] },
  searchQuery,
  courses,
  lectures,
  quizzes,
  questions,
  resources,
  selectedQuizId,
  setSelectedQuizId,
  activeSubTab: controlledSubTab,
  selectedEnrollmentCourseId,
  onOpenCourseEditor,
  onOpenLectureEditor,
  onOpenQuizEditor,
  onOpenResourceEditor,
  onOpenQuestionEditor,
  onDeleteEntity,
  onNavigateToEnrollments,
  onEnrollmentsUpdated,
}: CurriculumManagerProps) {
  const activeSubTab = controlledSubTab || "courses"
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all")
  const [localSearch, setLocalSearch] = useState("")

  const tr = (en: string, ar: string) => (isAr ? ar : en)
  const effectiveSearch = (searchQuery || localSearch).trim().toLowerCase()

  // Helpers to resolve titles
  const getCourseTitle = (courseId: string | null) => {
    const found = courses.find((c) => c.id === courseId)
    return found ? (isAr ? found.title_ar : found.title_en) : "—"
  }

  const getLectureTitle = (lectureId: string | null) => {
    const found = lectures.find((l) => l.id === lectureId)
    return found ? (isAr ? found.title_ar : found.title_en) : "—"
  }

  // Filtered lists
  const filteredCourses = courses.filter((c) => {
    if (!effectiveSearch) return true
    return (
      c.title_en.toLowerCase().includes(effectiveSearch) ||
      c.title_ar.toLowerCase().includes(effectiveSearch) ||
      c.description_en?.toLowerCase().includes(effectiveSearch) ||
      c.description_ar?.toLowerCase().includes(effectiveSearch)
    )
  })

  const filteredLectures = lectures.filter((l) => {
    if (selectedCourseFilter !== "all" && l.course_id !== selectedCourseFilter) return false
    if (!effectiveSearch) return true
    return (
      l.title_en.toLowerCase().includes(effectiveSearch) ||
      l.title_ar.toLowerCase().includes(effectiveSearch) ||
      getCourseTitle(l.course_id).toLowerCase().includes(effectiveSearch)
    )
  })

  const filteredQuizzes = quizzes.filter((q) => {
    if (selectedCourseFilter !== "all" && q.course_id !== selectedCourseFilter) return false
    if (!effectiveSearch) return true
    return (
      q.title_en.toLowerCase().includes(effectiveSearch) ||
      q.title_ar.toLowerCase().includes(effectiveSearch) ||
      getCourseTitle(q.course_id).toLowerCase().includes(effectiveSearch)
    )
  })

  const activeQuiz = quizzes.find((q) => q.id === selectedQuizId) || quizzes[0]
  const currentQuizQuestions = questions.filter((q) => q.quiz_id === (activeQuiz?.id ?? selectedQuizId))

  const filteredResources = resources.filter((r) => {
    const lecture = lectures.find((l) => l.id === r.lecture_id)
    if (selectedCourseFilter !== "all" && lecture?.course_id !== selectedCourseFilter) return false
    if (!effectiveSearch) return true
    return (
      r.title_en.toLowerCase().includes(effectiveSearch) ||
      r.title_ar.toLowerCase().includes(effectiveSearch) ||
      r.url.toLowerCase().includes(effectiveSearch)
    )
  })

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* ─── 1. COURSES VIEW ────────────────────────────────────────────── */}
      {activeSubTab === "courses" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-card/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="size-10 grid place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <BookOpen className="size-5" />
                </div>
                <h3 className="text-xl font-black tracking-tight text-foreground">{tr("Course Catalog", "دليل المقررات التعليمية")}</h3>
                <Badge variant="secondary" className="text-xs font-mono font-bold">
                  {filteredCourses.length} {tr("courses", "مقرر")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tr(
                  "Manage published curriculum, bilingual descriptions, and cover branding.",
                  "إدارة المقررات المنشورة، والتوصيف ثنائي اللغة، وصور الغلاف."
                )}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder={tr("Search courses...", "بحث في المقررات...")}
                  className="h-10 ps-9 pe-8 rounded-xl text-xs bg-background/60"
                />
                {localSearch && (
                  <button
                    onClick={() => setLocalSearch("")}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <Button
                onClick={() => onOpenCourseEditor()}
                className="gap-2 font-bold h-10 px-5 rounded-full shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-xs w-full sm:w-auto shrink-0"
              >
                <Plus className="size-4" />
                <span>{tr("New Course", "إضافة مقرر جديد")}</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCourses.map((course) => {
              const courseLectures = lectures.filter((l) => l.course_id === course.id)
              const courseQuizzes = quizzes.filter((q) => q.course_id === course.id)
              const title = isAr ? course.title_ar : course.title_en
              const desc = isAr ? course.description_ar : course.description_en

              return (
                <Card key={course.id} className="rounded-3xl border-border/80 bg-card/90 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                  <div>
                    {/* Course Thumbnail */}
                    {course.thumbnail_url ? (
                      <div className="aspect-video w-full overflow-hidden bg-muted/40 relative shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={course.thumbnail_url}
                          alt={title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <Badge className="absolute top-3 end-3 bg-black/75 backdrop-blur-md text-[10px] font-bold text-white border-white/10 rounded-full px-2.5">
                          <span>{courseLectures.length} {tr("lectures", "محاضرة")}</span>
                        </Badge>
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-gradient-to-br from-primary/10 via-secondary to-muted/40 grid place-items-center relative border-b border-border/60 shrink-0">
                        <BookOpen className="size-9 text-primary/40" />
                        <Badge variant="outline" className="absolute top-3 end-3 text-[10px] font-bold bg-background/80 backdrop-blur-md rounded-full px-2.5">
                          <span>{courseLectures.length} {tr("lectures", "محاضرة")}</span>
                        </Badge>
                      </div>
                    )}

                    <CardContent className="p-5 space-y-3">
                      <h4 className="font-black text-base text-foreground leading-snug line-clamp-2">{title}</h4>

                      {desc && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{desc}</p>}

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <Badge variant="outline" className="text-[11px] gap-1 shrink-0 font-bold bg-background/50">
                          <FileVideo className="size-3 text-primary shrink-0" />
                          <span>{courseLectures.length} {tr("Lectures", "محاضرة")}</span>
                        </Badge>
                        <Badge variant="outline" className="text-[11px] gap-1 shrink-0 font-bold bg-background/50">
                          <ClipboardCheck className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{courseQuizzes.length} {tr("Quizzes", "اختبار")}</span>
                        </Badge>
                        {course.is_locked || course.access_policy === "students_only" ? (
                          <Badge variant="secondary" className="text-[10px] gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold shrink-0">
                            <Lock className="size-3 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>{tr("Students Only", "للطلاب فقط")}</span>
                          </Badge>
                        ) : course.access_policy === "enrolled_only" ? (
                          <Badge variant="secondary" className="text-[10px] gap-1 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 font-bold shrink-0">
                            <Shield className="size-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span>{tr("Cohort Only", "مجموعات محددة")}</span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold shrink-0">
                            <Globe className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{tr("Open Access", "وصول مفتوح")}</span>
                          </Badge>
                        )}
                        {course.feature_overrides && Object.keys(course.feature_overrides).length > 0 && (
                          <Badge variant="outline" className="text-[10px] gap-1 shrink-0 font-bold border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5">
                            <Sliders className="size-2.5" />
                            <span>{Object.keys(course.feature_overrides).length} {tr("Overrides", "استثناءات")}</span>
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </div>

                  {/* Actions footer */}
                  <div className="border-t border-border/60 bg-muted/20 p-3.5 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs font-bold rounded-full px-3"
                        onClick={() => onOpenCourseEditor(course)}
                      >
                        <Pencil className="size-3 shrink-0" />
                        <span>{tr("Edit", "تعديل")}</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs font-bold rounded-full px-3 text-primary border-primary/30 hover:bg-primary/5"
                        onClick={() => onNavigateToEnrollments?.(course.id)}
                        title={tr("Manage Enrolled Students", "إدارة تسجيل وقبول الطلاب")}
                      >
                        <Users className="size-3 shrink-0" />
                        <span>{tr("Students", "الطلاب")}</span>
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                      onClick={() => onDeleteEntity("courses", course.id, title)}
                      title={tr("Delete course", "حذف المقرر")}
                    >
                      <Trash2 className="size-3.5 shrink-0" />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>

          {!filteredCourses.length && (
            <div className="grid min-h-48 place-items-center rounded-3xl border border-dashed border-border/80 p-8 text-center text-muted-foreground">
              <div>
                <BookOpen className="mx-auto size-9 opacity-40" />
                <p className="mt-3 font-bold text-sm text-foreground">
                  {tr("No courses found", "لم يتم العثور على مقررات")}
                </p>
                <p className="mt-1 text-xs">
                  {tr("Click 'New Course' to create your first learning track.", "انقر على 'إضافة مقرر جديد' لإنشاء أول مسار تعليمي.")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 2. COURSE ENROLLMENTS & REQUESTS VIEW ────────────────────── */}
      {activeSubTab === "enrollments" && (
        <CourseEnrollmentManager
          isAr={isAr}
          token={token}
          courses={courses}
          enrollmentSettings={enrollmentSettings}
          initialCourseFilter={selectedEnrollmentCourseId || selectedCourseFilter}
          onEnrollmentsUpdated={onEnrollmentsUpdated}
        />
      )}

      {/* ─── 3. LECTURES VIEW ───────────────────────────────────────────── */}
      {activeSubTab === "lectures" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-card/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="size-10 grid place-items-center rounded-2xl bg-teal-500/10 text-teal-600 border border-teal-500/20">
                  <FileVideo className="size-5" />
                </div>
                <h3 className="text-xl font-black tracking-tight text-foreground">{tr("Lecture Videos", "محاضرات الفيديو")}</h3>
                <Badge variant="secondary" className="text-xs font-mono font-bold">
                  {filteredLectures.length} {tr("lectures", "محاضرة")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tr(
                  "Sequential video lectures linked to YouTube with attached resources and checkpoints.",
                  "محاضرات فيديو متسلسلة مرتبطة بروابط YouTube مع المواد والاختبارات المرفقة."
                )}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
                <SelectTrigger className="h-10 w-full sm:w-[180px] rounded-xl text-xs bg-background/60">
                  <SelectValue placeholder={tr("Filter by course", "تصفية حسب المقرر")} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">{tr("All Courses", "جميع المقررات")}</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {isAr ? course.title_ar : course.title_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder={tr("Search lectures...", "بحث في المحاضرات...")}
                  className="h-10 ps-9 pe-8 rounded-xl text-xs bg-background/60"
                />
                {localSearch && (
                  <button
                    onClick={() => setLocalSearch("")}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <Button
                onClick={() => onOpenLectureEditor()}
                disabled={!courses.length}
                className="gap-2 font-bold h-10 px-5 rounded-full shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-xs w-full sm:w-auto shrink-0"
              >
                <Plus className="size-4" />
                <span>{tr("New Lecture", "إضافة محاضرة")}</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredLectures.map((lecture) => {
              const courseTitle = getCourseTitle(lecture.course_id)
              const title = isAr ? lecture.title_ar : lecture.title_en
              const attachedResources = resources.filter((r) => r.lecture_id === lecture.id)
              const attachedQuiz = quizzes.find((q) => q.lecture_id === lecture.id)

              return (
                <Card key={lecture.id} className="rounded-3xl border-border/80 bg-card/90 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid size-7 place-items-center rounded-xl bg-primary/10 text-primary font-black text-xs">
                          #{lecture.order}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono truncate max-w-[140px] font-bold">
                          {courseTitle}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="gap-1 text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 font-bold border-red-500/20">
                        <YoutubeIcon className="size-3" />
                        YouTube
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-black text-sm text-foreground leading-snug line-clamp-2">{title}</h4>
                      {lecture.details_en && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {isAr ? lecture.details_ar : lecture.details_en}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {attachedResources.length > 0 && (
                        <Badge variant="outline" className="text-[10px] gap-1 font-bold bg-background/50">
                          <FileText className="size-3 text-primary" />
                          {attachedResources.length} {tr("Files", "ملفات")}
                        </Badge>
                      )}
                      {attachedQuiz && (
                        <Badge variant="outline" className="text-[10px] gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold bg-emerald-500/5">
                          <CheckCircle2 className="size-3" />
                          {tr("Quiz Ready", "اختبار متاح")}
                        </Badge>
                      )}
                    </div>
                  </CardContent>

                  <div className="border-t border-border/60 bg-muted/20 p-3 flex items-center justify-between">
                    <a
                      href={lecture.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline px-2.5 h-8 rounded-full hover:bg-primary/5"
                    >
                      <ExternalLink className="size-3" />
                      <span>{tr("Watch", "مشاهدة")}</span>
                    </a>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-full"
                        onClick={() => onOpenLectureEditor(lecture)}
                        title={tr("Edit lecture", "تعديل المحاضرة")}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDeleteEntity("lectures", lecture.id, title)}
                        title={tr("Delete lecture", "حذف المحاضرة")}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {!filteredLectures.length && (
            <div className="grid min-h-48 place-items-center rounded-3xl border border-dashed border-border/80 p-8 text-center text-muted-foreground">
              <div>
                <FileVideo className="mx-auto size-9 opacity-40" />
                <p className="mt-3 font-bold text-sm text-foreground">
                  {tr("No lectures found", "لم يتم العثور على محاضرات")}
                </p>
                <p className="mt-1 text-xs">
                  {courses.length === 0
                    ? tr("Create a course first before adding lectures.", "أنشئ مقررًا أولًا قبل إضافة المحاضرات.")
                    : tr("Add lecture videos to build out your curriculum.", "أضف محاضرات فيديو لبناء المنهج التعليمي.")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 4. QUIZZES & QUESTIONS VIEW ────────────────────────────────── */}
      {activeSubTab === "quizzes" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-card/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="size-10 grid place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <ClipboardCheck className="size-5" />
                </div>
                <h3 className="text-xl font-black tracking-tight text-foreground">{tr("Assessments & Quizzes", "الاختبارات والتقييمات")}</h3>
                <Badge variant="secondary" className="text-xs font-mono font-bold">
                  {filteredQuizzes.length} {tr("quizzes", "اختبار")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tr(
                  "Interactive question banks for assessing student comprehension.",
                  "بنوك أسئلة تفاعلية لتقييم استيعاب الطلاب للمحاضرات."
                )}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
                <SelectTrigger className="h-10 w-full sm:w-[180px] rounded-xl text-xs bg-background/60">
                  <SelectValue placeholder={tr("Filter by course", "تصفية حسب المقرر")} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">{tr("All Courses", "جميع المقررات")}</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {isAr ? course.title_ar : course.title_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder={tr("Search quizzes...", "بحث في الاختبارات...")}
                  className="h-10 ps-9 pe-8 rounded-xl text-xs bg-background/60"
                />
                {localSearch && (
                  <button
                    onClick={() => setLocalSearch("")}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <Button
                onClick={() => onOpenQuizEditor()}
                disabled={!lectures.length}
                className="gap-2 font-bold h-10 px-5 rounded-full shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-xs w-full sm:w-auto shrink-0"
              >
                <Plus className="size-4" />
                <span>{tr("New Quiz", "إضافة اختبار")}</span>
              </Button>
            </div>
          </div>

          {/* Quiz Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredQuizzes.map((quiz) => {
              const isSelected = (activeQuiz?.id ?? selectedQuizId) === quiz.id
              const quizQuestions = questions.filter((q) => q.quiz_id === quiz.id)
              const title = isAr ? quiz.title_ar : quiz.title_en
              const courseTitle = getCourseTitle(quiz.course_id)
              const lectureTitle = getLectureTitle(quiz.lecture_id)

              return (
                <Card
                  key={quiz.id}
                  onClick={() => setSelectedQuizId(quiz.id)}
                  className={`rounded-3xl border cursor-pointer transition-all shadow-sm ${
                    isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md" : "border-border/80 bg-card/90 hover:border-primary/40"
                  }`}
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={isSelected ? "default" : "outline"} className="text-[10px] font-bold rounded-full px-2.5">
                        {quizQuestions.length} {tr("questions", "سؤال")}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpenQuizEditor(quiz)
                          }}
                          title={tr("Edit quiz", "تعديل الاختبار")}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteEntity("quizzes", quiz.id, title)
                          }}
                          title={tr("Delete quiz", "حذف الاختبار")}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-black text-sm text-foreground leading-snug">{title}</h4>
                      <p className="mt-1 text-xs text-muted-foreground truncate font-medium">
                        {courseTitle} · {lectureTitle}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Interactive Question Explorer for Selected Quiz */}
          {activeQuiz && (
            <Card className="rounded-3xl border-primary/30 bg-card/95 shadow-md overflow-hidden">
              <CardContent className="p-6 sm:p-7 space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="size-8 grid place-items-center rounded-xl bg-primary/10 text-primary">
                        <HelpCircle className="size-4" />
                      </div>
                      <h4 className="font-black text-base text-foreground">
                        {tr("Questions in:", "الأسئلة في:")} {isAr ? activeQuiz.title_ar : activeQuiz.title_en}
                      </h4>
                      <Badge variant="secondary" className="text-xs font-mono font-bold">
                        {currentQuizQuestions.length} {tr("questions", "سؤال")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tr(
                        "Manage questions, correct answer markers, and multiple-choice options.",
                        "إدارة الأسئلة، وتحديد الإجابة الصحيحة، وخيارات الاختيار من متعدد."
                      )}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => onOpenQuestionEditor()}
                    className="gap-2 text-xs font-bold h-10 px-5 rounded-full shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 w-full sm:w-auto"
                  >
                    <Plus className="size-3.5" />
                    <span>{tr("Add Question", "إضافة سؤال")}</span>
                  </Button>
                </div>

                {/* Questions List */}
                <div className="space-y-3.5">
                  {currentQuizQuestions.map((question, idx) => {
                    const qTitle = isAr ? question.text_ar : question.text_en
                    const isMCQ = question.type === "multiple_choice"
                    const isTF = question.type === "true_false"

                    return (
                      <div
                        key={question.id}
                        className="rounded-2xl border border-border/80 bg-card/90 p-4 sm:p-5 space-y-3 transition-all hover:border-primary/40 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary font-black text-xs shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="space-y-1">
                              <p className="font-bold text-sm text-foreground leading-snug">{qTitle}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] font-bold capitalize">
                                  {question.type.replaceAll("_", " ")}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-bold capitalize ${
                                    question.difficulty === "easy"
                                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                      : question.difficulty === "hard"
                                      ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                                      : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                  }`}
                                >
                                  {question.difficulty === "easy"
                                    ? tr("Easy", "سهل")
                                    : question.difficulty === "hard"
                                    ? tr("Hard", "صعب")
                                    : tr("Medium", "متوسط")}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground font-mono font-bold">
                                  #{question.order}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-full"
                              onClick={() => onOpenQuestionEditor(question)}
                              title={tr("Edit question", "تعديل السؤال")}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => onDeleteEntity("questions", question.id, qTitle)}
                              title={tr("Delete question", "حذف السؤال")}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Options preview with correct answer highlighted */}
                        {isMCQ && question.options && (
                          <div className="grid gap-2 sm:grid-cols-2 pt-1 ps-0 sm:ps-10">
                            {question.options.map((opt, oIdx) => {
                              const isCorrect = opt.trim().toLowerCase() === question.correct_answer.trim().toLowerCase()
                              return (
                                <div
                                  key={oIdx}
                                  className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
                                    isCorrect
                                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold"
                                      : "bg-muted/40 text-muted-foreground border-border/60"
                                  }`}
                                >
                                  {isCorrect ? (
                                    <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  ) : (
                                    <span className="size-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                                  )}
                                  <span className="truncate">{opt}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {isTF && (
                          <div className="flex items-center gap-2 ps-0 sm:ps-10">
                            <Badge
                              variant="outline"
                              className="gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs py-1 px-3 rounded-full"
                            >
                              <CheckCircle2 className="size-3.5" />
                              <span>{tr("Correct Answer:", "الإجابة الصحيحة:")} {question.correct_answer}</span>
                            </Badge>
                          </div>
                        )}

                        {Boolean(question.clinical_reference || question.explanation_en || question.explanation_ar) && (
                          <div className="ps-0 sm:ps-10 pt-1">
                            <div className="rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-xs space-y-1">
                              {question.clinical_reference && (
                                <div className="flex items-center gap-1.5 font-bold text-primary text-[11px]">
                                  <BookOpen className="size-3.5 shrink-0" />
                                  <span className="truncate">{question.clinical_reference}</span>
                                </div>
                              )}
                              {(question.explanation_en || question.explanation_ar) && (
                                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                  {isAr
                                    ? question.explanation_ar || question.explanation_en
                                    : question.explanation_en || question.explanation_ar}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {!currentQuizQuestions.length && (
                    <div className="grid min-h-32 place-items-center rounded-2xl border border-dashed border-border/80 p-6 text-center text-muted-foreground">
                      <div>
                        <HelpCircle className="mx-auto size-7 opacity-40" />
                        <p className="mt-2 text-xs font-bold text-foreground">
                          {tr("No questions added yet", "لم تتم إضافة أسئلة بعد")}
                        </p>
                        <p className="mt-0.5 text-[11px]">
                          {tr("Click 'Add Question' to create question checkpoints.", "انقر على 'إضافة سؤال' لإنشاء أسئلة الاختبار.")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─── 5. RESOURCES VIEW ──────────────────────────────────────────── */}
      {activeSubTab === "resources" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-card/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="size-10 grid place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                  <FileText className="size-5" />
                </div>
                <h3 className="text-xl font-black tracking-tight text-foreground">{tr("Lecture Resources", "مواد ومرفقات المحاضرات")}</h3>
                <Badge variant="secondary" className="text-xs font-mono font-bold">
                  {filteredResources.length} {tr("files", "ملف")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tr(
                  "Supplementary PDFs, high-res diagrams, and clinical reference links.",
                  "ملفات PDF مساندة، ومخططات توضيحية، ومراجع سريرية مرتبطة بالمحاضرات."
                )}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
                <SelectTrigger className="h-10 w-full sm:w-[180px] rounded-xl text-xs bg-background/60">
                  <SelectValue placeholder={tr("Filter by course", "تصفية حسب المقرر")} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">{tr("All Courses", "جميع المقررات")}</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {isAr ? course.title_ar : course.title_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder={tr("Search resources...", "بحث في المواد...")}
                  className="h-10 ps-9 pe-8 rounded-xl text-xs bg-background/60"
                />
                {localSearch && (
                  <button
                    onClick={() => setLocalSearch("")}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <Button
                onClick={() => onOpenResourceEditor()}
                disabled={!lectures.length}
                className="gap-2 font-bold h-10 px-5 rounded-full shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-xs w-full sm:w-auto shrink-0"
              >
                <Plus className="size-4" />
                <span>{tr("New Resource", "إضافة مادة")}</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredResources.map((resource) => {
              const lectureTitle = getLectureTitle(resource.lecture_id)
              const title = isAr ? resource.title_ar : resource.title_en
              const isPdf = resource.type === "pdf"
              const isImg = resource.type === "image"

              return (
                <Card key={resource.id} className="rounded-3xl border-border/80 bg-card/90 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`gap-1 text-[10px] font-bold uppercase rounded-full px-2.5 ${
                          isPdf
                            ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                            : isImg
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isPdf ? <FileText className="size-3" /> : isImg ? <FileImage className="size-3" /> : <LinkIcon className="size-3" />}
                        <span>{resource.type}</span>
                      </Badge>

                      <Badge variant="outline" className="text-[10px] font-bold truncate max-w-[160px]">
                        {lectureTitle}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-black text-sm text-foreground leading-snug line-clamp-2">{title}</h4>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground truncate">{resource.url}</p>
                    </div>
                  </CardContent>

                  <div className="border-t border-border/60 bg-muted/20 p-3 flex items-center justify-between">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline px-3 h-8 rounded-full hover:bg-primary/5"
                    >
                      <ExternalLink className="size-3" />
                      <span>{tr("Open File", "فتح الملف")}</span>
                    </a>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-full"
                        onClick={() => onOpenResourceEditor(resource)}
                        title={tr("Edit resource", "تعديل المادة")}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDeleteEntity("resources", resource.id, title)}
                        title={tr("Delete resource", "حذف المادة")}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {!filteredResources.length && (
            <div className="grid min-h-48 place-items-center rounded-3xl border border-dashed border-border/80 p-8 text-center text-muted-foreground">
              <div>
                <FileText className="mx-auto size-9 opacity-40" />
                <p className="mt-3 font-bold text-sm text-foreground">
                  {tr("No resources found", "لم يتم العثور على مواد")}
                </p>
                <p className="mt-1 text-xs">
                  {tr("Attach PDFs, images, or reference slides to lectures.", "أرفق ملفات PDF أو صورًا أو شرائح مراجع بالمحاضرات.")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
