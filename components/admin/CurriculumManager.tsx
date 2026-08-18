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
  FiTrash2 as Trash2,
  FiVideo as FileVideo,
  FiX as X,
  FiYoutube as YoutubeIcon,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Course, Lecture, Question, Quiz, Resource } from "@/types"

interface CurriculumManagerProps {
  isAr: boolean
  searchQuery: string
  courses: Course[]
  lectures: Lecture[]
  quizzes: Quiz[]
  questions: Question[]
  resources: Resource[]
  selectedQuizId: string
  setSelectedQuizId: (id: string) => void
  activeSubTab?: SubTab
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
}

type SubTab = "courses" | "lectures" | "quizzes" | "resources"

export default function CurriculumManager({
  isAr,
  searchQuery,
  courses,
  lectures,
  quizzes,
  questions,
  resources,
  selectedQuizId,
  setSelectedQuizId,
  activeSubTab: controlledSubTab,
  onOpenCourseEditor,
  onOpenLectureEditor,
  onOpenQuizEditor,
  onOpenResourceEditor,
  onOpenQuestionEditor,
  onDeleteEntity,
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
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card border rounded-2xl p-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="size-5 text-primary" />
                <h3 className="text-lg sm:text-xl font-bold tracking-tight">{tr("Course Catalog", "دليل المقررات التعليمية")}</h3>
                <Badge variant="secondary" className="text-xs font-mono font-bold">
                  {filteredCourses.length} {tr("courses", "مقرر")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tr(
                  "Manage published curriculum, bilingual descriptions, and cover branding.",
                  "إدارة المقررات المنشورة، والتوصيف ثنائي اللغة، وصور الغلاف."
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative w-full sm:w-60">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder={tr("Search courses...", "بحث في المقررات...")}
                  className="h-9 ps-8 pe-8 text-xs bg-background"
                />
                {localSearch && (
                  <button
                    onClick={() => setLocalSearch("")}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <Button
                onClick={() => onOpenCourseEditor()}
                className="gap-1.5 font-bold min-h-[36px] w-full sm:w-auto shrink-0 shadow-xs"
              >
                <Plus className="size-4" />
                <span>{tr("New Course", "إضافة مقرر جديد")}</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => {
              const courseLectures = lectures.filter((l) => l.course_id === course.id)
              const courseQuizzes = quizzes.filter((q) => q.course_id === course.id)
              const title = isAr ? course.title_ar : course.title_en
              const desc = isAr ? course.description_ar : course.description_en

              return (
                <Card key={course.id} className="card-interactive overflow-hidden shadow-none flex flex-col justify-between">
                  <div>
                    {/* Course Thumbnail */}
                    {course.thumbnail_url ? (
                      <div className="aspect-video w-full overflow-hidden bg-muted/40 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={course.thumbnail_url}
                          alt={title}
                          className="h-full w-full object-cover"
                        />
                        <Badge className="absolute top-2.5 end-2.5 bg-black/70 backdrop-blur-md text-[10px] text-white">
                          {courseLectures.length} {tr("lectures", "محاضرة")}
                        </Badge>
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-muted/30 grid place-items-center relative border-b">
                        <BookOpen className="size-8 text-muted-foreground/40" />
                        <Badge variant="outline" className="absolute top-2.5 end-2.5 text-[10px]">
                          {courseLectures.length} {tr("lectures", "محاضرة")}
                        </Badge>
                      </div>
                    )}

                    <CardContent className="p-4 space-y-2.5">
                      <h4 className="font-extrabold text-base leading-snug line-clamp-2">{title}</h4>

                      {desc && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{desc}</p>}

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <Badge variant="outline" className="text-[11px] gap-1">
                          <FileVideo className="size-3 text-primary" />
                          {courseLectures.length} {tr("Lectures", "محاضرة")}
                        </Badge>
                        <Badge variant="outline" className="text-[11px] gap-1">
                          <ClipboardCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
                          {courseQuizzes.length} {tr("Quizzes", "اختبار")}
                        </Badge>
                        {course.is_locked || course.access_policy === "students_only" ? (
                          <Badge variant="secondary" className="text-[10px] gap-1 border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold">
                            <Lock className="size-3 text-amber-600 dark:text-amber-400" />
                            <span>{tr("Students Only", "للطلاب فقط")}</span>
                          </Badge>
                        ) : course.access_policy === "enrolled_only" ? (
                          <Badge variant="secondary" className="text-[10px] gap-1 border-purple-500/30 text-purple-700 dark:text-purple-300 font-bold">
                            <Shield className="size-3 text-purple-600 dark:text-purple-400" />
                            <span>{tr("Cohort Only", "مجموعات محددة")}</span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold">
                            <Globe className="size-3 text-emerald-600 dark:text-emerald-400" />
                            <span>{tr("Open Access", "وصول مفتوح")}</span>
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </div>

                  {/* Actions footer */}
                  <div className="border-t bg-muted/20 p-3 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 text-xs font-semibold"
                      onClick={() => onOpenCourseEditor(course)}
                    >
                      <Pencil className="size-3.5" />
                      {tr("Edit Details", "تعديل")}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDeleteEntity("courses", course.id, title)}
                      title={tr("Delete course", "حذف المقرر")}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>

          {!filteredCourses.length && (
            <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              <div>
                <BookOpen className="mx-auto size-8 opacity-40" />
                <p className="mt-2 font-bold text-sm">
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

      {/* ─── 2. LECTURES VIEW ───────────────────────────────────────────── */}
      {activeSubTab === "lectures" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card border rounded-2xl p-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <FileVideo className="size-5 text-primary" />
                <h3 className="text-lg sm:text-xl font-bold tracking-tight">{tr("Lecture Videos", "محاضرات الفيديو")}</h3>
                <Badge variant="secondary" className="text-xs font-mono font-bold">
                  {filteredLectures.length} {tr("lectures", "محاضرة")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tr(
                  "Sequential video lectures linked to YouTube with attached resources and checkpoints.",
                  "محاضرات فيديو متسلسلة مرتبطة بروابط YouTube مع المواد والاختبارات المرفقة."
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
                <SelectTrigger className="h-9 w-full sm:w-[180px] text-xs bg-background">
                  <SelectValue placeholder={tr("Filter by course", "تصفية حسب المقرر")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tr("All Courses", "جميع المقررات")}</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {isAr ? course.title_ar : course.title_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-52">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder={tr("Search lectures...", "بحث في المحاضرات...")}
                  className="h-9 ps-8 pe-8 text-xs bg-background"
                />
                {localSearch && (
                  <button
                    onClick={() => setLocalSearch("")}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <Button
                onClick={() => onOpenLectureEditor()}
                disabled={!courses.length}
                className="gap-1.5 font-bold min-h-[36px] w-full sm:w-auto shrink-0 shadow-xs"
              >
                <Plus className="size-4" />
                <span>{tr("New Lecture", "إضافة محاضرة")}</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLectures.map((lecture) => {
              const courseTitle = getCourseTitle(lecture.course_id)
              const title = isAr ? lecture.title_ar : lecture.title_en
              const attachedResources = resources.filter((r) => r.lecture_id === lecture.id)
              const attachedQuiz = quizzes.find((q) => q.lecture_id === lecture.id)

              return (
                <Card key={lecture.id} className="card-interactive shadow-none flex flex-col justify-between">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                          #{lecture.order}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono truncate max-w-[150px]">
                          {courseTitle}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="gap-1 text-[10px] bg-red-500/10 text-red-600 dark:text-red-400">
                        <YoutubeIcon className="size-3" />
                        YouTube
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm leading-snug line-clamp-2">{title}</h4>
                      {lecture.details_en && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {isAr ? lecture.details_ar : lecture.details_en}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {attachedResources.length > 0 && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <FileText className="size-3 text-primary" />
                          {attachedResources.length} {tr("Files", "ملفات")}
                        </Badge>
                      )}
                      {attachedQuiz && (
                        <Badge variant="outline" className="text-[10px] gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                          <CheckCircle2 className="size-3" />
                          {tr("Quiz Ready", "اختبار متاح")}
                        </Badge>
                      )}
                    </div>
                  </CardContent>

                  <div className="border-t bg-muted/20 p-2.5 flex items-center justify-between">
                    <a
                      href={lecture.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline px-2 min-h-[32px]"
                    >
                      <ExternalLink className="size-3" />
                      {tr("Watch", "مشاهدة")}
                    </a>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => onOpenLectureEditor(lecture)}
                        title={tr("Edit lecture", "تعديل المحاضرة")}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
            <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              <div>
                <FileVideo className="mx-auto size-8 opacity-40" />
                <p className="mt-2 font-bold text-sm">
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

      {/* ─── 3. QUIZZES & QUESTIONS VIEW ────────────────────────────────── */}
      {activeSubTab === "quizzes" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card border rounded-2xl p-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="size-5 text-primary" />
                <h3 className="text-lg sm:text-xl font-bold tracking-tight">{tr("Assessments & Quizzes", "الاختبارات والتقييمات")}</h3>
                <Badge variant="secondary" className="text-xs font-mono font-bold">
                  {filteredQuizzes.length} {tr("quizzes", "اختبار")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tr(
                  "Interactive question banks for assessing student comprehension.",
                  "بنوك أسئلة تفاعلية لتقييم استيعاب الطلاب للمحاضرات."
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
                <SelectTrigger className="h-9 w-full sm:w-[180px] text-xs bg-background">
                  <SelectValue placeholder={tr("Filter by course", "تصفية حسب المقرر")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tr("All Courses", "جميع المقررات")}</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {isAr ? course.title_ar : course.title_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-52">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder={tr("Search quizzes...", "بحث في الاختبارات...")}
                  className="h-9 ps-8 pe-8 text-xs bg-background"
                />
                {localSearch && (
                  <button
                    onClick={() => setLocalSearch("")}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <Button
                onClick={() => onOpenQuizEditor()}
                disabled={!lectures.length}
                className="gap-1.5 font-bold min-h-[36px] w-full sm:w-auto shrink-0 shadow-xs"
              >
                <Plus className="size-4" />
                <span>{tr("New Quiz", "إضافة اختبار")}</span>
              </Button>
            </div>
          </div>

          {/* Quiz Cards Grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                  className={`card-interactive cursor-pointer shadow-none transition-all ${
                    isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : ""
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={isSelected ? "default" : "outline"} className="text-[10px]">
                        {quizQuestions.length} {tr("questions", "سؤال")}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
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
                          className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                      <h4 className="font-bold text-sm leading-snug">{title}</h4>
                      <p className="mt-1 text-xs text-muted-foreground truncate">
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
            <Card className="shadow-none border-primary/30">
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <HelpCircle className="size-4 text-primary" />
                      <h4 className="font-extrabold text-sm sm:text-base">
                        {tr("Questions in:", "الأسئلة في:")} {isAr ? activeQuiz.title_ar : activeQuiz.title_en}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
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
                    className="gap-1.5 text-xs font-bold min-h-[38px] w-full sm:w-auto"
                  >
                    <Plus className="size-3.5" />
                    {tr("Add Question", "إضافة سؤال")}
                  </Button>
                </div>

                {/* Questions List */}
                <div className="space-y-3">
                  {currentQuizQuestions.map((question, idx) => {
                    const qTitle = isAr ? question.text_ar : question.text_en
                    const isMCQ = question.type === "multiple_choice"
                    const isTF = question.type === "true_false"

                    return (
                      <div
                        key={question.id}
                        className="rounded-xl border bg-card p-3.5 sm:p-4 space-y-3 transition-colors hover:border-primary/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="space-y-1">
                              <p className="font-bold text-sm leading-snug">{qTitle}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] capitalize">
                                  {question.type.replaceAll("_", " ")}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground font-mono">
                                  #{question.order}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => onOpenQuestionEditor(question)}
                              title={tr("Edit question", "تعديل السؤال")}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => onDeleteEntity("questions", question.id, qTitle)}
                              title={tr("Delete question", "حذف السؤال")}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Options preview with correct answer highlighted */}
                        {isMCQ && question.options && (
                          <div className="grid gap-1.5 sm:grid-cols-2 pt-1 ps-0 sm:ps-8">
                            {question.options.map((opt, oIdx) => {
                              const isCorrect = opt.trim().toLowerCase() === question.correct_answer.trim().toLowerCase()
                              return (
                                <div
                                  key={oIdx}
                                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
                                    isCorrect
                                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold"
                                      : "bg-muted/30 text-muted-foreground"
                                  }`}
                                >
                                  {isCorrect ? (
                                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
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
                          <div className="flex items-center gap-2 ps-0 sm:ps-8">
                            <Badge
                              variant="outline"
                              className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs py-1"
                            >
                              <CheckCircle2 className="size-3" />
                              {tr("Correct Answer:", "الإجابة الصحيحة:")} {question.correct_answer}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {!currentQuizQuestions.length && (
                    <div className="grid min-h-32 place-items-center rounded-xl border border-dashed p-6 text-center text-muted-foreground">
                      <div>
                        <HelpCircle className="mx-auto size-6 opacity-40" />
                        <p className="mt-2 text-xs font-bold">
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

      {/* ─── 4. RESOURCES VIEW ──────────────────────────────────────────── */}
      {activeSubTab === "resources" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card border rounded-2xl p-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                <h3 className="text-lg sm:text-xl font-bold tracking-tight">{tr("Lecture Resources", "مواد ومرفقات المحاضرات")}</h3>
                <Badge variant="secondary" className="text-xs font-mono font-bold">
                  {filteredResources.length} {tr("files", "ملف")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tr(
                  "Supplementary PDFs, high-res diagrams, and clinical reference links.",
                  "ملفات PDF مساندة، ومخططات توضيحية، ومراجع سريرية مرتبطة بالمحاضرات."
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
                <SelectTrigger className="h-9 w-full sm:w-[180px] text-xs bg-background">
                  <SelectValue placeholder={tr("Filter by course", "تصفية حسب المقرر")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tr("All Courses", "جميع المقررات")}</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {isAr ? course.title_ar : course.title_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-52">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder={tr("Search resources...", "بحث في المواد...")}
                  className="h-9 ps-8 pe-8 text-xs bg-background"
                />
                {localSearch && (
                  <button
                    onClick={() => setLocalSearch("")}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <Button
                onClick={() => onOpenResourceEditor()}
                disabled={!lectures.length}
                className="gap-1.5 font-bold min-h-[36px] w-full sm:w-auto shrink-0 shadow-xs"
              >
                <Plus className="size-4" />
                <span>{tr("New Resource", "إضافة مادة")}</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => {
              const lectureTitle = getLectureTitle(resource.lecture_id)
              const title = isAr ? resource.title_ar : resource.title_en
              const isPdf = resource.type === "pdf"
              const isImg = resource.type === "image"

              return (
                <Card key={resource.id} className="card-interactive shadow-none flex flex-col justify-between">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`gap-1 text-[10px] font-bold uppercase ${
                          isPdf
                            ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                            : isImg
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isPdf ? <FileText className="size-3" /> : isImg ? <FileImage className="size-3" /> : <LinkIcon className="size-3" />}
                        {resource.type}
                      </Badge>

                      <Badge variant="outline" className="text-[10px] truncate max-w-[160px]">
                        {lectureTitle}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm leading-snug line-clamp-2">{title}</h4>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground truncate">{resource.url}</p>
                    </div>
                  </CardContent>

                  <div className="border-t bg-muted/20 p-2.5 flex items-center justify-between">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline px-2 min-h-[32px]"
                    >
                      <ExternalLink className="size-3" />
                      {tr("Open File", "فتح الملف")}
                    </a>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => onOpenResourceEditor(resource)}
                        title={tr("Edit resource", "تعديل المادة")}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
            <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              <div>
                <FileText className="mx-auto size-8 opacity-40" />
                <p className="mt-2 font-bold text-sm">
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
