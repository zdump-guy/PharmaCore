import {
  FiAward as Award,
  FiBarChart2 as BarChart2,
  FiBookOpen as BookOpen,
  FiCheckSquare as CheckSquare,
  FiCpu as Cpu,
  FiFolder as Folder,
  FiGlobe as Globe,
  FiHelpCircle as HelpCircle,
  FiLoader as Loader2,
  FiLock as Lock,
  FiMessageCircle as MessageCircle,
  FiMessageSquare as MessageSquare,
  FiPlayCircle as PlayCircle,
  FiShield as Shield,
  FiSliders as Sliders,
  FiTrash2 as Trash2,
  FiUser as UserIcon,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import FileUploader from "@/components/ui/file-uploader"
import { useSiteContent } from "@/components/SiteContentProvider"
import {
  FEATURE_FLAG_DEFINITIONS,
  defaultFeatureFlags,
  resolveCourseFeatures,
} from "@/lib/featureFlags"
import type {
  Course,
  FeatureFlagsConfig,
  Lecture,
  Question,
  QuestionDifficulty,
  QuestionType,
  Quiz,
  Resource,
  ResourceType,
  UserRole,
} from "@/types"
import type { ManagedUser, UserForm } from "@/components/admin/UserManager"

export type CourseForm = {
  id?: string
  title_en: string
  title_ar: string
  description_en: string
  description_ar: string
  objectives_en: string
  objectives_ar: string
  prerequisites_en: string
  prerequisites_ar: string
  thumbnail_url: string
  is_locked?: boolean
  access_policy?: "open" | "students_only" | "enrolled_only"
  feature_overrides?: Partial<FeatureFlagsConfig> | null
}

export type LectureForm = {
  id?: string
  course_id: string
  title_en: string
  title_ar: string
  details_en: string
  details_ar: string
  youtube_url: string
  order: number
}

export type QuizForm = Pick<Quiz, "title_en" | "title_ar"> & {
  id?: string
  course_id: string
  lecture_id: string
}

export type ResourceForm = Pick<Resource, "lecture_id" | "title_en" | "title_ar" | "url" | "type"> & {
  id?: string
  course_id: string
}

export type QuestionForm = Pick<Question, "quiz_id" | "text_en" | "text_ar" | "type" | "correct_answer" | "order"> & {
  id?: string
  optionsText: string
  explanation_en?: string
  explanation_ar?: string
  clinical_reference?: string
  difficulty?: QuestionDifficulty
}

interface AdminModalsProps {
  isAr: boolean
  editor: "course" | "lecture" | "quiz" | "resource" | "question" | null
  setEditor: (val: "course" | "lecture" | "quiz" | "resource" | "question" | null) => void
  saving: boolean
  courses: Course[]
  lectures: Lecture[]
  quizzes: Quiz[]
  courseForm: CourseForm
  setCourseForm: React.Dispatch<React.SetStateAction<CourseForm>>
  onSaveCourse: (e: React.FormEvent) => void
  lectureForm: LectureForm
  setLectureForm: React.Dispatch<React.SetStateAction<LectureForm>>
  onSaveLecture: (e: React.FormEvent) => void
  quizForm: QuizForm
  setQuizForm: React.Dispatch<React.SetStateAction<QuizForm>>
  onSaveQuiz: (e: React.FormEvent) => void
  resourceForm: ResourceForm
  setResourceForm: React.Dispatch<React.SetStateAction<ResourceForm>>
  onSaveResource: (e: React.FormEvent) => void
  questionForm: QuestionForm
  setQuestionForm: React.Dispatch<React.SetStateAction<QuestionForm>>
  onSaveQuestion: (e: React.FormEvent) => void
  editingUser: ManagedUser | null
  setEditingUser: (u: ManagedUser | null) => void
  userEditForm: UserForm
  setUserEditForm: React.Dispatch<React.SetStateAction<UserForm>>
  onSaveUserEdit: (e: React.FormEvent) => void
  deletingUser: ManagedUser | null
  setDeletingUser: (u: ManagedUser | null) => void
  onConfirmDeleteUser: () => void
  userActionId: string | null
  currentUserId?: string
  questionAlertOpen: boolean
  setQuestionAlertOpen: (open: boolean) => void
  unansweredCount: number
  onGoToQA: () => void
}

export default function AdminModals({
  isAr,
  editor,
  setEditor,
  saving,
  courses,
  lectures,
  quizzes,
  courseForm,
  setCourseForm,
  onSaveCourse,
  lectureForm,
  setLectureForm,
  onSaveLecture,
  quizForm,
  setQuizForm,
  onSaveQuiz,
  resourceForm,
  setResourceForm,
  onSaveResource,
  questionForm,
  setQuestionForm,
  onSaveQuestion,
  editingUser,
  setEditingUser,
  userEditForm,
  setUserEditForm,
  onSaveUserEdit,
  deletingUser,
  setDeletingUser,
  onConfirmDeleteUser,
  userActionId,
  currentUserId,
  questionAlertOpen,
  setQuestionAlertOpen,
  unansweredCount,
  onGoToQA,
}: AdminModalsProps) {
  const tr = (en: string, ar: string) => (isAr ? ar : en)
  const siteContent = useSiteContent()
  const quizLectures = lectures.filter((l) => l.course_id === quizForm.course_id)
  const resourceLectures = lectures.filter((l) => l.course_id === resourceForm.course_id)

  const resolvedCourseFeatures = resolveCourseFeatures(
    siteContent?.features,
    courseForm.feature_overrides
  )

  const handleOverrideChange = (
    key: keyof FeatureFlagsConfig,
    mode: "inherit" | "enable" | "disable"
  ) => {
    setCourseForm((prev) => {
      const updatedOverrides = { ...(prev.feature_overrides || {}) }
      if (mode === "inherit") {
        delete updatedOverrides[key]
      } else if (mode === "enable") {
        updatedOverrides[key] = true
      } else if (mode === "disable") {
        updatedOverrides[key] = false
      }
      return {
        ...prev,
        feature_overrides: updatedOverrides,
      }
    })
  }

  return (
    <>
      {/* ─── 1. COURSE MODAL ─────────────────────────────────────────── */}
      <Dialog open={editor === "course"} onOpenChange={(open) => !open && setEditor(null)}>
        <DialogContent className="max-h-[92vh] w-[95vw] sm:max-w-2xl overflow-y-auto custom-scrollbar p-6 sm:p-8 rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl" dir={isAr ? "rtl" : "ltr"}>
          <form onSubmit={onSaveCourse} className="space-y-6">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="size-11 grid place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl sm:text-2xl font-black">
                    {courseForm.id ? tr("Edit Course Details", "تعديل بيانات المقرر") : tr("Create New Course", "إضافة مقرر جديد")}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {tr(
                      "Define bilingual curriculum details, access policies, and cover branding.",
                      "أدخل توصيف المقرر والأهداف التعليمية وسياسة التسجيل وصورة الغلاف."
                    )}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5" dir="ltr">
                <div className="flex items-center justify-between">
                  <Label htmlFor="course-title-en" className="text-xs font-bold text-foreground">Course Title (English)</Label>
                  <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">EN</span>
                </div>
                <Input
                  id="course-title-en"
                  required
                  value={courseForm.title_en}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, title_en: e.target.value }))}
                  placeholder="e.g. Clinical Pharmacology"
                  className="rounded-xl h-11 border-border/80 bg-background/60 text-xs"
                />
              </div>

              <div className="space-y-1.5" dir="rtl">
                <div className="flex items-center justify-between">
                  <Label htmlFor="course-title-ar" className="text-xs font-bold text-foreground">عنوان المقرر (بالعربية)</Label>
                  <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">AR</span>
                </div>
                <Input
                  id="course-title-ar"
                  required
                  value={courseForm.title_ar}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, title_ar: e.target.value }))}
                  placeholder="مثال: علم الأدوية السريري"
                  className="rounded-xl h-11 border-border/80 bg-background/60 text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2" dir="ltr">
                <Label htmlFor="course-desc-en" className="text-xs font-bold text-foreground">English Description</Label>
                <Textarea
                  id="course-desc-en"
                  rows={2}
                  value={courseForm.description_en}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, description_en: e.target.value }))}
                  placeholder="Course summary, objectives, and scope..."
                  className="rounded-xl border-border/80 bg-background/60 text-xs leading-relaxed"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2" dir="rtl">
                <Label htmlFor="course-desc-ar" className="text-xs font-bold text-foreground">الوصف بالعربية</Label>
                <Textarea
                  id="course-desc-ar"
                  rows={2}
                  value={courseForm.description_ar}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, description_ar: e.target.value }))}
                  placeholder="نبذة عامة عن المقرر وأهدافه التعليمية..."
                  className="rounded-xl border-border/80 bg-background/60 text-xs leading-relaxed"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <FileUploader
                  endpoint="courseImage"
                  value={courseForm.thumbnail_url}
                  onChange={(url) => setCourseForm((prev) => ({ ...prev, thumbnail_url: url }))}
                  isAr={isAr}
                  label={tr("Course Cover Image", "صورة غلاف المقرر")}
                  hint={tr("Direct upload to CDN (JPG, PNG, WebP up to 4MB)", "رفع مباشر وتخزين فوري بصيغة JPG أو PNG أو WebP حتى 4 ميجابايت")}
                />
              </div>

              {/* Course Access & Gating Policy */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-foreground">{tr("Course Access Policy & Gating", "سياسة الوصول وصلاحيات المشاهدة")}</Label>
                <Select
                  value={courseForm.access_policy || (courseForm.is_locked ? "students_only" : "open")}
                  onValueChange={(val: "open" | "students_only" | "enrolled_only") =>
                    setCourseForm((prev) => ({
                      ...prev,
                      access_policy: val,
                      is_locked: val !== "open",
                    }))
                  }
                >
                  <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="open">
                      <div className="flex items-center gap-2">
                        <Globe className="size-4 text-emerald-500 shrink-0" />
                        <span className="font-semibold">{tr("Open Access (Free for all visitors without login)", "وصول مفتوح (متاح لجميع الزوار دون تسجيل دخول)")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="students_only">
                      <div className="flex items-center gap-2">
                        <Lock className="size-4 text-amber-500 shrink-0" />
                        <span className="font-semibold">{tr("Registered Students Only (Requires student account)", "للطلاب المسجلين فقط (يلزم تسجيل الدخول)")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="enrolled_only">
                      <div className="flex items-center gap-2">
                        <Shield className="size-4 text-indigo-500 shrink-0" />
                        <span className="font-semibold">{tr("Enrolled Cohort Only (Requires approved enrollment)", "مجموعات محددة فقط (يلزم اشتراك معتمد في المقرر)")}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ─── MODULE ACTIVATION & FEATURE OVERRIDES ─────────── */}
              <div className="space-y-3 sm:col-span-2 pt-3 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Sliders className="size-4 text-primary shrink-0" />
                      <Label className="text-xs font-black text-foreground">
                        {tr("Module Activation & Feature Overrides", "تفعيل الميزات والاستثناءات الخاصة بالمقرر")}
                      </Label>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {tr(
                        "Set specific overrides for this course or inherit global defaults from Platform Settings.",
                        "تحديد استثناءات خاصة بهذا المقرر (تفعيل/تعطيل إجباري) أو توريث القيم الافتراضية للمنصة."
                      )}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono font-bold shrink-0">
                    {
                      Object.keys(courseForm.feature_overrides || {}).length > 0
                        ? `${Object.keys(courseForm.feature_overrides || {}).length} ${tr("Custom", "مخصص")}`
                        : tr("All Inherited", "موروث بالكامل")
                    }
                  </Badge>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-1">
                  {FEATURE_FLAG_DEFINITIONS.map((def) => {
                    const currentOverride = courseForm.feature_overrides?.[def.key]
                    const overrideState: "inherit" | "enable" | "disable" =
                      typeof currentOverride === "boolean"
                        ? currentOverride
                          ? "enable"
                          : "disable"
                        : "inherit"

                    const isResolvedOn = Boolean(resolvedCourseFeatures[def.key])
                    const globalDefault = (siteContent?.features || defaultFeatureFlags)[def.key]

                    const categoryIcons: Record<string, typeof Cpu> = {
                      ai: Cpu,
                      assessment: CheckSquare,
                      gamification: Award,
                      collaboration: MessageSquare,
                      analytics: BarChart2,
                    }
                    const IconComp = categoryIcons[def.category] || Sliders

                    return (
                      <div
                        key={def.key}
                        className={`rounded-2xl border p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          overrideState === "enable"
                            ? "border-emerald-500/40 bg-emerald-500/5 shadow-2xs"
                            : overrideState === "disable"
                            ? "border-rose-500/40 bg-rose-500/5 shadow-2xs"
                            : "border-border/70 bg-card/60"
                        }`}
                      >
                        {/* Title & Description */}
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="size-8 grid place-items-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                            <IconComp className="size-4" />
                          </span>
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-foreground truncate">
                                {isAr ? def.title_ar : def.title_en}
                              </span>
                              {/* Resolved State Badge */}
                              <Badge
                                className={`text-[10px] px-2 py-0 font-bold rounded-full shrink-0 ${
                                  overrideState === "enable"
                                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                    : overrideState === "disable"
                                    ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                                    : isResolvedOn
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                    : "bg-muted text-muted-foreground border border-border"
                                }`}
                              >
                                {overrideState === "enable"
                                  ? tr("Forced ON", "مفعل إجباريًا")
                                  : overrideState === "disable"
                                  ? tr("Forced OFF", "معطل إجباريًا")
                                  : isResolvedOn
                                  ? `${tr("Inherited", "موروث")}: ${globalDefault ? tr("ON", "مفعل") : tr("OFF", "معطل")}`
                                  : `${tr("Inherited", "موروث")}: ${globalDefault ? tr("ON", "مفعل") : tr("OFF", "معطل")}`}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {isAr ? def.description_ar : def.description_en}
                            </p>
                          </div>
                        </div>

                        {/* 3-State Selector Buttons */}
                        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl shrink-0 self-end sm:self-center border border-border/50">
                          <button
                            type="button"
                            onClick={() => handleOverrideChange(def.key, "inherit")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              overrideState === "inherit"
                                ? "bg-background text-foreground shadow-xs font-black"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            title={tr("Inherit global default setting", "توريث القيمة الافتراضية")}
                          >
                            {tr("Inherit", "افتراضي")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOverrideChange(def.key, "enable")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              overrideState === "enable"
                                ? "bg-emerald-600 text-white shadow-xs font-black"
                                : "text-muted-foreground hover:text-emerald-600"
                            }`}
                            title={tr("Force enable for this course", "تفعيل إجباري لهذا المقرر")}
                          >
                            {tr("Force ON", "تفعيل")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOverrideChange(def.key, "disable")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              overrideState === "disable"
                                ? "bg-rose-600 text-white shadow-xs font-black"
                                : "text-muted-foreground hover:text-rose-600"
                            }`}
                            title={tr("Force disable for this course", "تعطيل إجباري لهذا المقرر")}
                          >
                            {tr("Force OFF", "تعطيل")}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setEditor(null)} className="rounded-full font-bold text-xs h-11 px-6">
                {tr("Cancel", "إلغاء")}
              </Button>
              <Button type="submit" disabled={saving} className="rounded-full font-bold text-xs h-11 px-8 shadow-md shadow-primary/20 bg-primary hover:bg-primary/90">
                {saving && <Loader2 className="size-3.5 animate-spin me-1.5" />}
                <span>{saving ? tr("Saving...", "جارٍ الحفظ...") : tr("Save Course", "حفظ المقرر")}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── 2. LECTURE MODAL ────────────────────────────────────────── */}
      <Dialog open={editor === "lecture"} onOpenChange={(v) => !v && setEditor(null)}>
        <DialogContent className="max-h-[92vh] w-[95vw] sm:max-w-2xl overflow-y-auto custom-scrollbar p-6 sm:p-8 rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl" dir={isAr ? "rtl" : "ltr"}>
          <form onSubmit={onSaveLecture} className="space-y-6">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="size-11 grid place-items-center rounded-2xl bg-teal-500/10 text-teal-600 border border-teal-500/20">
                  <PlayCircle className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl sm:text-2xl font-black">
                    {lectureForm.id ? tr("Edit Lecture Details", "تعديل المحاضرة") : tr("Create New Lecture", "إضافة محاضرة جديدة")}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {tr("Attach this lecture video to a course with sequential ordering.", "ربط فيديو المحاضرة بمقرر تعليمي مع تحديد ترتيب العرض.")}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-foreground">{tr("Assigned Course", "المقرر التابع له")}</Label>
                <Select
                  value={lectureForm.course_id}
                  onValueChange={(val) => setLectureForm((prev) => ({ ...prev, course_id: val }))}
                  required
                >
                  <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                    <SelectValue placeholder={tr("Select course", "اختر المقرر")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {isAr ? c.title_ar : c.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5" dir="ltr">
                <Label htmlFor="lecture-title-en" className="text-xs font-bold text-foreground">English Title</Label>
                <Input
                  id="lecture-title-en"
                  required
                  value={lectureForm.title_en}
                  onChange={(e) => setLectureForm((prev) => ({ ...prev, title_en: e.target.value }))}
                  placeholder="e.g. Introduction to Pharmacokinetics"
                  className="rounded-xl h-11 border-border/80 bg-background/60 text-xs"
                />
              </div>

              <div className="space-y-1.5" dir="rtl">
                <Label htmlFor="lecture-title-ar" className="text-xs font-bold text-foreground">العنوان بالعربية</Label>
                <Input
                  id="lecture-title-ar"
                  required
                  value={lectureForm.title_ar}
                  onChange={(e) => setLectureForm((prev) => ({ ...prev, title_ar: e.target.value }))}
                  placeholder="مثال: مقدمة في الحركية الدوائية"
                  className="rounded-xl h-11 border-border/80 bg-background/60 text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="lecture-youtube" className="text-xs font-bold text-foreground">
                  {tr("YouTube Video URL", "رابط فيديو YouTube")}
                </Label>
                <Input
                  id="lecture-youtube"
                  type="url"
                  required
                  value={lectureForm.youtube_url}
                  onChange={(e) => setLectureForm((prev) => ({ ...prev, youtube_url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="rounded-xl h-11 border-border/80 bg-background/60 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  {tr("Paste the direct video watch URL (not an embed iframe tag).", "الصق رابط المشاهدة المباشر وليس كود التضمين iframe.")}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lecture-order" className="text-xs font-bold text-foreground">
                  {tr("Lecture Order Sequence", "ترتيب المحاضرة")}
                </Label>
                <Input
                  id="lecture-order"
                  type="number"
                  min="1"
                  required
                  value={lectureForm.order}
                  onChange={(e) => setLectureForm((prev) => ({ ...prev, order: +e.target.value }))}
                  className="rounded-xl h-11 border-border/80 bg-background/60 text-xs font-mono"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setEditor(null)} className="rounded-full font-bold text-xs h-11 px-6">
                {tr("Cancel", "إلغاء")}
              </Button>
              <Button type="submit" disabled={saving} className="rounded-full font-bold text-xs h-11 px-8 shadow-md shadow-primary/20 bg-primary hover:bg-primary/90">
                {saving && <Loader2 className="size-3.5 animate-spin me-1.5" />}
                <span>{saving ? tr("Saving...", "جارٍ الحفظ...") : tr("Save Lecture", "حفظ المحاضرة")}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── 3. QUIZ MODAL ───────────────────────────────────────────── */}
      <Dialog open={editor === "quiz"} onOpenChange={(v) => !v && setEditor(null)}>
        <DialogContent className="max-h-[92vh] w-[95vw] sm:max-w-xl overflow-y-auto custom-scrollbar p-6 sm:p-8 rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl" dir={isAr ? "rtl" : "ltr"}>
          <form onSubmit={onSaveQuiz} className="space-y-6">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="size-11 grid place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <HelpCircle className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl sm:text-2xl font-black">
                    {quizForm.id ? tr("Edit Quiz Checkpoint", "تعديل الاختبار") : tr("Create Quiz Checkpoint", "إضافة اختبار جديد")}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {tr("Assign this quiz checkpoint to a specific course and lecture.", "ربط هذا الاختبار بمقرر ومحاضرة محددة.")}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">{tr("Course", "المقرر")}</Label>
                <Select
                  value={quizForm.course_id}
                  onValueChange={(val) => setQuizForm((prev) => ({ ...prev, course_id: val, lecture_id: "" }))}
                  required
                >
                  <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                    <SelectValue placeholder={tr("Select course", "اختر المقرر")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {isAr ? c.title_ar : c.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">{tr("Associated Lecture", "المحاضرة المرتبطة")}</Label>
                <Select
                  value={quizForm.lecture_id}
                  onValueChange={(val) => setQuizForm((prev) => ({ ...prev, lecture_id: val }))}
                  disabled={!quizForm.course_id}
                  required
                >
                  <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                    <SelectValue placeholder={tr("Select lecture", "اختر المحاضرة")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {quizLectures.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {isAr ? l.title_ar : l.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5" dir="ltr">
                <Label htmlFor="quiz-title-en" className="text-xs font-bold text-foreground">English Quiz Title</Label>
                <Input
                  id="quiz-title-en"
                  required
                  value={quizForm.title_en}
                  onChange={(e) => setQuizForm((prev) => ({ ...prev, title_en: e.target.value }))}
                  placeholder="e.g. Pharmacokinetics Checkpoint 1"
                  className="rounded-xl h-11 border-border/80 bg-background/60 text-xs"
                />
              </div>

              <div className="space-y-1.5" dir="rtl">
                <Label htmlFor="quiz-title-ar" className="text-xs font-bold text-foreground">عنوان الاختبار بالعربية</Label>
                <Input
                  id="quiz-title-ar"
                  required
                  value={quizForm.title_ar}
                  onChange={(e) => setQuizForm((prev) => ({ ...prev, title_ar: e.target.value }))}
                  placeholder="مثال: اختبار تقييم الحركية الدوائية"
                  className="rounded-xl h-11 border-border/80 bg-background/60 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setEditor(null)} className="rounded-full font-bold text-xs h-11 px-6">
                {tr("Cancel", "إلغاء")}
              </Button>
              <Button type="submit" disabled={saving} className="rounded-full font-bold text-xs h-11 px-8 shadow-md shadow-primary/20 bg-primary hover:bg-primary/90">
                {saving && <Loader2 className="size-3.5 animate-spin me-1.5" />}
                <span>{saving ? tr("Saving...", "جارٍ الحفظ...") : tr("Save Quiz", "حفظ الاختبار")}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── 4. RESOURCE MODAL ───────────────────────────────────────── */}
      <Dialog open={editor === "resource"} onOpenChange={(v) => !v && setEditor(null)}>
        <DialogContent className="max-h-[92vh] w-[95vw] sm:max-w-xl overflow-y-auto custom-scrollbar p-6 sm:p-8 rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl" dir={isAr ? "rtl" : "ltr"}>
          <form onSubmit={onSaveResource} className="space-y-6">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="size-11 grid place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                  <Folder className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl sm:text-2xl font-black">
                    {resourceForm.id ? tr("Edit Attached Resource", "تعديل المادة المساندة") : tr("Attach New Resource", "إضافة مادة مساندة")}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {tr("Attach PDF notes, diagrams, or reference links to a lecture.", "إرفاق ملخصات PDF أو صور توضيحية بالمحاضرة.")}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">{tr("Course", "المقرر")}</Label>
                <Select
                  value={resourceForm.course_id}
                  onValueChange={(val) => setResourceForm((prev) => ({ ...prev, course_id: val, lecture_id: "" }))}
                  required
                >
                  <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                    <SelectValue placeholder={tr("Select course", "اختر المقرر")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {isAr ? c.title_ar : c.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">{tr("Assigned Lecture", "المحاضرة المرفق بها")}</Label>
                <Select
                  value={resourceForm.lecture_id}
                  onValueChange={(val) => setResourceForm((prev) => ({ ...prev, lecture_id: val }))}
                  disabled={!resourceForm.course_id}
                  required
                >
                  <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                    <SelectValue placeholder={tr("Select lecture", "اختر المحاضرة")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {resourceLectures.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {isAr ? l.title_ar : l.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5" dir="ltr">
                <Label htmlFor="res-title-en" className="text-xs font-bold text-foreground">English Resource Title</Label>
                <Input
                  id="res-title-en"
                  required
                  value={resourceForm.title_en}
                  onChange={(e) => setResourceForm((prev) => ({ ...prev, title_en: e.target.value }))}
                  placeholder="e.g. Lecture Notes Summary (PDF)"
                  className="rounded-xl h-11 border-border/80 bg-background/60 text-xs"
                />
              </div>

              <div className="space-y-1.5" dir="rtl">
                <Label htmlFor="res-title-ar" className="text-xs font-bold text-foreground">العنوان بالعربية</Label>
                <Input
                  id="res-title-ar"
                  required
                  value={resourceForm.title_ar}
                  onChange={(e) => setResourceForm((prev) => ({ ...prev, title_ar: e.target.value }))}
                  placeholder="مثال: ملخص المحاضرة والخرائط الذهنية"
                  className="rounded-xl h-11 border-border/80 bg-background/60 text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <FileUploader
                  endpoint="lectureResource"
                  value={resourceForm.url}
                  onChange={(url, meta) => {
                    setResourceForm((prev) => {
                      let newType = prev.type
                      let newTitleEn = prev.title_en
                      let newTitleAr = prev.title_ar

                      if (meta?.type) {
                        newType = meta.type
                      }
                      if (meta?.name) {
                        const cleanName = meta.name
                          .replace(/\.[^/.]+$/, "")
                          .replace(/[_-]+/g, " ")
                          .trim()
                        if (!newTitleEn) newTitleEn = cleanName
                        if (!newTitleAr) newTitleAr = cleanName
                      }

                      return {
                        ...prev,
                        url,
                        type: newType,
                        title_en: newTitleEn,
                        title_ar: newTitleAr,
                      }
                    })
                  }}
                  isAr={isAr}
                  label={tr("Lecture File / PDF / Document", "ملف المحاضرة / PDF / وثيقة مساندة")}
                  hint={tr("Direct upload: Lecture notes PDF, diagrams, or slides up to 32MB", "رفع مباشر: ملخصات PDF، مخططات، أو مراجع علمية حتى 32 ميجابايت")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">{tr("File Category / Type", "نوع المادة")}</Label>
                <Select
                  value={resourceForm.type}
                  onValueChange={(val) => setResourceForm((prev) => ({ ...prev, type: val as ResourceType }))}
                >
                  <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="image">Image / Diagram</SelectItem>
                    <SelectItem value="other">Web Reference Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setEditor(null)} className="rounded-full font-bold text-xs h-11 px-6">
                {tr("Cancel", "إلغاء")}
              </Button>
              <Button type="submit" disabled={saving} className="rounded-full font-bold text-xs h-11 px-8 shadow-md shadow-primary/20 bg-primary hover:bg-primary/90">
                {saving && <Loader2 className="size-3.5 animate-spin me-1.5" />}
                <span>{saving ? tr("Saving...", "جارٍ الحفظ...") : tr("Save Resource", "حفظ المادة")}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── 5. QUESTION MODAL ───────────────────────────────────────── */}
      <Dialog open={editor === "question"} onOpenChange={(v) => !v && setEditor(null)}>
        <DialogContent className="max-h-[92vh] w-[95vw] sm:max-w-2xl overflow-y-auto custom-scrollbar p-6 sm:p-8 rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl" dir={isAr ? "rtl" : "ltr"}>
          <form onSubmit={onSaveQuestion} className="space-y-6">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="size-11 grid place-items-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <CheckSquare className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl sm:text-2xl font-black">
                    {questionForm.id ? tr("Edit Question Prompt", "تعديل السؤال") : tr("Create New Question", "إضافة سؤال جديد")}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {tr("Define question prompt, format (MCQ / True-False), and correct answer.", "تحديد نص السؤال ونوعه والإجابة الصحيحة.")}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">{tr("Assigned Quiz", "الاختبار التابع له")}</Label>
                <Select
                  value={questionForm.quiz_id}
                  onValueChange={(val) => setQuestionForm((prev) => ({ ...prev, quiz_id: val }))}
                  required
                >
                  <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                    <SelectValue placeholder={tr("Select quiz", "اختر الاختبار")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {quizzes.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {isAr ? q.title_ar : q.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">{tr("Question Type", "نوع السؤال")}</Label>
                <Select
                  value={questionForm.type}
                  onValueChange={(val) =>
                    setQuestionForm((prev) => ({
                      ...prev,
                      type: val as QuestionType,
                      correct_answer: val === "true_false" ? "True" : "",
                    }))
                  }
                >
                  <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="multiple_choice">{tr("Multiple Choice (MCQ)", "اختيار من متعدد")}</SelectItem>
                    <SelectItem value="true_false">{tr("True / False", "صح / خطأ")}</SelectItem>
                    <SelectItem value="short_text">{tr("Short Text", "إجابة قصيرة")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2" dir="ltr">
                <Label htmlFor="q-text-en" className="text-xs font-bold text-foreground">Question in English</Label>
                <Textarea
                  id="q-text-en"
                  required
                  rows={2}
                  value={questionForm.text_en}
                  onChange={(e) => setQuestionForm((prev) => ({ ...prev, text_en: e.target.value }))}
                  placeholder="Enter the question prompt in English..."
                  className="rounded-xl border-border/80 bg-background/60 text-xs leading-relaxed"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2" dir="rtl">
                <Label htmlFor="q-text-ar" className="text-xs font-bold text-foreground">السؤال بالعربية</Label>
                <Textarea
                  id="q-text-ar"
                  required
                  rows={2}
                  value={questionForm.text_ar}
                  onChange={(e) => setQuestionForm((prev) => ({ ...prev, text_ar: e.target.value }))}
                  placeholder="أدخل نص السؤال بالعربية..."
                  className="rounded-xl border-border/80 bg-background/60 text-xs leading-relaxed"
                />
              </div>

              {questionForm.type === "multiple_choice" && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="q-options" className="text-xs font-bold text-foreground">
                    {tr("Multiple Choice Options (1 per line)", "خيارات السؤال (خيار واحد في كل سطر)")}
                  </Label>
                  <Textarea
                    id="q-options"
                    required
                    rows={4}
                    value={questionForm.optionsText}
                    onChange={(e) => setQuestionForm((prev) => ({ ...prev, optionsText: e.target.value }))}
                    placeholder={"Option A\nOption B\nOption C\nOption D"}
                    className="rounded-xl border-border/80 bg-background/60 text-xs font-mono leading-relaxed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {tr("Enter each possible answer choice on a separate line.", "أدخل كل خيار متاح في سطر مستقل.")}
                  </p>
                </div>
              )}

              {questionForm.type === "true_false" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">{tr("Correct Answer", "الإجابة الصحيحة")}</Label>
                  <Select
                    value={questionForm.correct_answer}
                    onValueChange={(val) => setQuestionForm((prev) => ({ ...prev, correct_answer: val }))}
                  >
                    <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="True">{tr("True", "صح")}</SelectItem>
                      <SelectItem value="False">{tr("False", "خطأ")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="q-correct" className="text-xs font-bold text-foreground">
                    {tr("Exact Correct Answer", "نص الإجابة الصحيحة")}
                  </Label>
                  <Input
                    id="q-correct"
                    required
                    value={questionForm.correct_answer}
                    onChange={(e) => setQuestionForm((prev) => ({ ...prev, correct_answer: e.target.value }))}
                    placeholder={tr("Must match one of the options above", "يجب أن يطابق أحد الخيارات أعلاه بالضبط")}
                    className="rounded-xl h-11 border-border/80 bg-background/60 text-xs"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="q-order" className="text-xs font-bold text-foreground">
                  {tr("Question Order", "ترتيب السؤال")}
                </Label>
                <Input
                  id="q-order"
                  type="number"
                  min="1"
                  required
                  value={questionForm.order}
                  onChange={(e) => setQuestionForm((prev) => ({ ...prev, order: +e.target.value }))}
                  className="rounded-xl h-11 border-border/80 bg-background/60 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  {tr("Difficulty Tier", "مستوى الصعوبة")}
                </Label>
                <Select
                  value={questionForm.difficulty || "medium"}
                  onValueChange={(val: QuestionDifficulty) =>
                    setQuestionForm((prev) => ({ ...prev, difficulty: val }))
                  }
                >
                  <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="easy">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        <span>{tr("Easy", "سهل - تأسيسي")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-amber-500" />
                        <span>{tr("Medium", "متوسط - سريري")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="hard">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-rose-500" />
                        <span>{tr("Hard", "متقدم - معقد")}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ─── Practice Mode Clinical Rationales & Citations ─── */}
              <div className="sm:col-span-2 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 grid place-items-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-foreground">
                      {tr("Practice Mode: Clinical Rationales & Citations", "وضع التدريب: التعليلات السريرية والمراجع")}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      {tr(
                        "Displayed instantly to students in Practice Mode upon selecting an answer.",
                        "تُعرض فورًا للطلاب في وضع التدريب بمجرد اختيار الإجابة لتوضيح المفهوم الدوائي."
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="q-reference" className="text-xs font-bold text-foreground">
                    {tr("Clinical Textbook / Guideline Reference", "المرجع السريري / الدليل العلاجي المعتمد")}
                  </Label>
                  <Input
                    id="q-reference"
                    value={questionForm.clinical_reference ?? ""}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({ ...prev, clinical_reference: e.target.value }))
                    }
                    placeholder={tr(
                      "e.g. Goodman & Gilman's Pharmacological Basis of Therapeutics, 14th Ed, Ch. 12",
                      "مثال: Goodman & Gilman's Pharmacological Basis of Therapeutics, 14th Ed"
                    )}
                    className="rounded-xl h-11 border-border/80 bg-background/80 text-xs"
                  />
                </div>

                <div className="space-y-1.5" dir="ltr">
                  <Label htmlFor="q-explanation-en" className="text-xs font-bold text-foreground">
                    English Clinical Rationale
                  </Label>
                  <Textarea
                    id="q-explanation-en"
                    rows={3}
                    value={questionForm.explanation_en ?? ""}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({ ...prev, explanation_en: e.target.value }))
                    }
                    placeholder="Explain why the correct answer is therapeutically optimal and why distractors are incorrect..."
                    className="rounded-xl border-border/80 bg-background/80 text-xs leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5" dir="rtl">
                  <Label htmlFor="q-explanation-ar" className="text-xs font-bold text-foreground">
                    التعليل السريري بالعربية
                  </Label>
                  <Textarea
                    id="q-explanation-ar"
                    rows={3}
                    value={questionForm.explanation_ar ?? ""}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({ ...prev, explanation_ar: e.target.value }))
                    }
                    placeholder="اشرح الأساس الدوائي والسريري للإجابة الصحيحة وأسباب استبعاد الخيارات الأخرى..."
                    className="rounded-xl border-border/80 bg-background/80 text-xs leading-relaxed"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setEditor(null)} className="rounded-full font-bold text-xs h-11 px-6">
                {tr("Cancel", "إلغاء")}
              </Button>
              <Button type="submit" disabled={saving} className="rounded-full font-bold text-xs h-11 px-8 shadow-md shadow-primary/20 bg-primary hover:bg-primary/90">
                {saving && <Loader2 className="size-3.5 animate-spin me-1.5" />}
                <span>{saving ? tr("Saving...", "جارٍ الحفظ...") : tr("Save Question", "حفظ السؤال")}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── 6. EDIT USER MODAL ──────────────────────────────────────── */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="w-[95vw] sm:max-w-lg p-6 sm:p-8 rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl" dir={isAr ? "rtl" : "ltr"}>
          {editingUser && (
            <form onSubmit={onSaveUserEdit} className="space-y-6">
              <DialogHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="size-11 grid place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                    <UserIcon className="size-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl sm:text-2xl font-black">{tr("Edit Staff Account", "تعديل حساب العضو")}</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      {tr("Update profile name, assigned role, or set a new password.", "تعديل الاسم الكامل أو الدور أو تعيين كلمة مرور جديدة.")}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">{tr("Email (Immutable)", "البريد الإلكتروني")}</Label>
                  <Input value={editingUser.email} disabled className="rounded-xl h-11 bg-muted/60 text-muted-foreground text-xs" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">{tr("Full Name", "الاسم الكامل")}</Label>
                  <Input
                    value={userEditForm.full_name}
                    onChange={(e) => setUserEditForm((f) => ({ ...f, full_name: e.target.value }))}
                    placeholder="Dr. Sarah Ahmed"
                    required
                    className="rounded-xl h-11 border-border/80 bg-background/60 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">{tr("Staff Role", "الدور الوظيفي")}</Label>
                  <Select
                    value={userEditForm.role}
                    onValueChange={(val: UserRole) => setUserEditForm((f) => ({ ...f, role: val }))}
                    disabled={editingUser.id === currentUserId}
                  >
                    <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="mentor">{tr("Mentor / Instructor", "أستاذ / مرشد تعليمي")}</SelectItem>
                      <SelectItem value="super_admin">{tr("Super Administrator", "مدير نظام عام")}</SelectItem>
                      <SelectItem value="dev">{tr("Developer / Engineering", "مطور برمجيات")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 border-t border-border/60 pt-3">
                  <Label className="text-xs font-bold text-foreground">{tr("Set New Password (optional)", "تعيين كلمة مرور جديدة (اختياري)")}</Label>
                  <Input
                    type="password"
                    value={userEditForm.password}
                    onChange={(e) => setUserEditForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder={tr("Leave blank to keep unchanged", "اتركه فارغًا للإبقاء دون تغيير")}
                    className="rounded-xl h-11 border-border/80 bg-background/60 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2 border-t border-border/60">
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)} className="rounded-full font-bold text-xs h-11 px-6">
                  {tr("Cancel", "إلغاء")}
                </Button>
                <Button type="submit" disabled={saving} className="rounded-full font-bold text-xs h-11 px-8 shadow-md shadow-primary/20 bg-primary hover:bg-primary/90">
                  {saving && <Loader2 className="size-3.5 animate-spin me-1.5" />}
                  <span>{tr("Save Changes", "حفظ التعديلات")}</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── 7. DELETE USER CONFIRMATION ─────────────────────────────── */}
      <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md p-6 sm:p-8 rounded-3xl border border-destructive/30 bg-card/95 backdrop-blur-2xl shadow-2xl" dir={isAr ? "rtl" : "ltr"}>
          {deletingUser && (
            <div className="space-y-6">
              <DialogHeader className="space-y-2">
                <div className="size-12 grid place-items-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 mx-auto sm:mx-0">
                  <Trash2 className="size-6" />
                </div>
                <DialogTitle className="text-lg sm:text-xl font-black">
                  {tr("Permanently Delete User Account?", "حذف حساب المستخدم نهائيًا؟")}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                  {tr(
                    `${deletingUser.full_name || deletingUser.email} will immediately lose all administrative access. This action cannot be undone.`,
                    `سيفقد ${deletingUser.full_name || deletingUser.email} حق الوصول الإداري فورًا. هذا الإجراء نهائي ولا يمكن التراجع عنه.`
                  )}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2 border-t border-border/60">
                <Button type="button" variant="outline" onClick={() => setDeletingUser(null)} className="rounded-full font-bold text-xs h-11 px-6">
                  {tr("Cancel", "إلغاء")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onConfirmDeleteUser}
                  disabled={userActionId === deletingUser.id}
                  className="rounded-full font-bold text-xs h-11 px-8 shadow-md shadow-destructive/20"
                >
                  {userActionId === deletingUser.id && <Loader2 className="size-3.5 animate-spin me-1.5" />}
                  <Trash2 className="size-4" />
                  <span>{tr("Delete Account", "تأكيد الحذف")}</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── 8. UNANSWERED QUESTIONS NOTIFICATION MODAL ──────────────── */}
      <Dialog open={questionAlertOpen} onOpenChange={setQuestionAlertOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md p-6 sm:p-8 rounded-3xl border border-amber-500/30 bg-card/95 backdrop-blur-2xl shadow-2xl" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader className="space-y-2">
            <div className="size-12 grid place-items-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <MessageCircle className="size-6" />
            </div>
            <DialogTitle className="text-lg sm:text-xl font-black">
              {tr("Pending Student Questions", "هناك أسئلة طلاب تنتظر الإجابة")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {tr(
                `There ${unansweredCount === 1 ? "is" : "are"} currently ${unansweredCount} unanswered student inquiry awaiting educator feedback.`,
                `يوجد حاليًا ${unansweredCount} من أسئلة واستفسارات الطلاب دون رد بانتظار إجابة الفريق.`
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2.5 pt-4 border-t border-border/60">
            <Button variant="outline" onClick={() => setQuestionAlertOpen(false)} className="rounded-full font-bold text-xs h-11 px-6">
              {tr("Review Later", "المراجعة لاحقًا")}
            </Button>
            <Button onClick={onGoToQA} className="rounded-full font-bold text-xs h-11 px-8 shadow-md shadow-primary/20 bg-primary hover:bg-primary/90">
              <MessageCircle className="size-4" />
              <span>{tr("Answer Questions Now", "الإجابة الآن")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
