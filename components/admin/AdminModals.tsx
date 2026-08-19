import {
  FiGlobe as Globe,
  FiLoader as Loader2,
  FiLock as Lock,
  FiMessageCircle as MessageCircle,
  FiShield as Shield,
  FiTrash2 as Trash2,
} from "react-icons/fi"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import FileUploader from "@/components/ui/file-uploader"
import type { Course, Lecture, Question, QuestionType, Quiz, Resource, ResourceType, UserRole } from "@/types"
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
}

interface AdminModalsProps {
  isAr: boolean
  editor: "course" | "lecture" | "quiz" | "resource" | "question" | null
  setEditor: (val: "course" | "lecture" | "quiz" | "resource" | "question" | null) => void
  saving: boolean
  courses: Course[]
  lectures: Lecture[]
  quizzes: Quiz[]
  // Form states
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
  // User modals
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
  // Q&A Alert
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
  const quizLectures = lectures.filter((l) => l.course_id === quizForm.course_id)
  const resourceLectures = lectures.filter((l) => l.course_id === resourceForm.course_id)

  return (
    <>
      {/* ─── 1. COURSE MODAL ─────────────────────────────────────────── */}
      <Dialog open={editor === "course"} onOpenChange={(open) => !open && setEditor(null)}>
        <DialogContent className="max-h-[92vh] w-[95vw] sm:max-w-2xl overflow-y-auto custom-scrollbar p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
          <form onSubmit={onSaveCourse}>
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-extrabold">
                {courseForm.id ? tr("Edit Course Details", "تعديل بيانات المقرر") : tr("New Course", "إضافة مقرر جديد")}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {tr(
                  "Define bilingual titles, descriptions, learning objectives, and cover image.",
                  "أدخل العناوين والوصف والأهداف التعليمية باللغتين وصورة الغلاف."
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3.5 sm:gap-4 py-4 sm:py-5 sm:grid-cols-2">
              <div className="space-y-1.5" dir="ltr">
                <Label htmlFor="course-title-en" className="text-xs font-bold">English Title</Label>
                <Input
                  id="course-title-en"
                  required
                  value={courseForm.title_en}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, title_en: e.target.value }))}
                  placeholder="e.g. Clinical Pharmacology"
                  className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]"
                />
              </div>

              <div className="space-y-1.5" dir="rtl">
                <Label htmlFor="course-title-ar" className="text-xs font-bold">العنوان بالعربية</Label>
                <Input
                  id="course-title-ar"
                  required
                  value={courseForm.title_ar}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, title_ar: e.target.value }))}
                  placeholder="مثال: علم الأدوية السريري"
                  className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2" dir="ltr">
                <Label htmlFor="course-desc-en" className="text-xs font-semibold">English Description</Label>
                <Textarea
                  id="course-desc-en"
                  rows={2}
                  value={courseForm.description_en}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, description_en: e.target.value }))}
                  placeholder="Course overview and scope..."
                  className="text-sm sm:text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2" dir="rtl">
                <Label htmlFor="course-desc-ar" className="text-xs font-semibold">الوصف بالعربية</Label>
                <Textarea
                  id="course-desc-ar"
                  rows={2}
                  value={courseForm.description_ar}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, description_ar: e.target.value }))}
                  placeholder="نبذة عامة عن المقرر وأهدافه..."
                  className="text-sm sm:text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <FileUploader
                  endpoint="courseImage"
                  value={courseForm.thumbnail_url}
                  onChange={(url) => setCourseForm((prev) => ({ ...prev, thumbnail_url: url }))}
                  isAr={isAr}
                  label={tr("Course Cover Image", "صورة غلاف المقرر")}
                  hint={tr("Direct upload to Uploadthing CDN (JPG, PNG, WebP up to 4MB)", "رفع مباشر وتخزين فوري بصيغة JPG أو PNG أو WebP حتى 4 ميجابايت")}
                />
              </div>

              {/* Course Access & Gating Policy */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold">{tr("Course Access Policy & Gating", "سياسة الوصول وصلاحيات المشاهدة")}</Label>
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
                  <SelectTrigger className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">
                      <div className="flex items-center gap-2">
                        <Globe className="size-3.5 text-emerald-500 shrink-0" />
                        <span>{tr("Open Access (Free for all visitors without login)", "وصول مفتوح (متاح لجميع الزوار دون تسجيل دخول)")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="students_only">
                      <div className="flex items-center gap-2">
                        <Lock className="size-3.5 text-amber-500 shrink-0" />
                        <span>{tr("Registered Students Only (Requires student login for lectures)", "للطلاب المسجلين فقط (يلزم تسجيل الدخول لحضور المحاضرات)")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="enrolled_only">
                      <div className="flex items-center gap-2">
                        <Shield className="size-3.5 text-indigo-500 shrink-0" />
                        <span>{tr("Enrolled Cohort Only (Requires specific course enrollment)", "مجموعات محددة فقط (يلزم اشتراك معتمد في هذا المقرر)")}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>


            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditor(null)} className="w-full sm:w-auto min-h-[40px] sm:min-h-[36px]">
                {tr("Cancel", "إلغاء")}
              </Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto min-h-[40px] sm:min-h-[36px]">
                {saving && <Loader2 className="size-3.5 animate-spin me-1.5" />}
                {saving ? tr("Saving...", "جارٍ الحفظ...") : tr("Save Course", "حفظ المقرر")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── 2. LECTURE MODAL ────────────────────────────────────────── */}
      <Dialog open={editor === "lecture"} onOpenChange={(v) => !v && setEditor(null)}>
        <DialogContent className="max-h-[92vh] w-[95vw] sm:max-w-2xl overflow-y-auto custom-scrollbar p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
          <form onSubmit={onSaveLecture}>
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-extrabold">
                {lectureForm.id ? tr("Edit Lecture", "تعديل المحاضرة") : tr("New Lecture", "إضافة محاضرة جديدة")}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {tr("Attach this lecture video to a course with sequential ordering.", "ربط فيديو المحاضرة بمقرر تعليمي مع تحديد ترتيب العرض.")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3.5 sm:gap-4 py-4 sm:py-5 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold">{tr("Assigned Course", "المقرر التابع له")}</Label>
                <Select
                  value={lectureForm.course_id}
                  onValueChange={(val) => setLectureForm((prev) => ({ ...prev, course_id: val }))}
                  required
                >
                  <SelectTrigger className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]">
                    <SelectValue placeholder={tr("Select course", "اختر المقرر")} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {isAr ? c.title_ar : c.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5" dir="ltr">
                <Label htmlFor="lecture-title-en" className="text-xs font-bold">English Title</Label>
                <Input
                  id="lecture-title-en"
                  required
                  value={lectureForm.title_en}
                  onChange={(e) => setLectureForm((prev) => ({ ...prev, title_en: e.target.value }))}
                  placeholder="e.g. Introduction to Pharmacokinetics"
                  className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]"
                />
              </div>

              <div className="space-y-1.5" dir="rtl">
                <Label htmlFor="lecture-title-ar" className="text-xs font-bold">العنوان بالعربية</Label>
                <Input
                  id="lecture-title-ar"
                  required
                  value={lectureForm.title_ar}
                  onChange={(e) => setLectureForm((prev) => ({ ...prev, title_ar: e.target.value }))}
                  placeholder="مثال: مقدمة في الحركية الدوائية"
                  className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="lecture-youtube" className="text-xs font-bold">
                  {tr("YouTube Video URL", "رابط فيديو YouTube")}
                </Label>
                <Input
                  id="lecture-youtube"
                  type="url"
                  required
                  value={lectureForm.youtube_url}
                  onChange={(e) => setLectureForm((prev) => ({ ...prev, youtube_url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]"
                />
                <p className="text-[11px] text-muted-foreground">
                  {tr("Paste the direct video watch URL (not an embed iframe tag).", "الصق رابط المشاهدة المباشر وليس كود التضمين iframe.")}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lecture-order" className="text-xs font-bold">
                  {tr("Lecture Order Sequence", "ترتيب المحاضرة")}
                </Label>
                <Input
                  id="lecture-order"
                  type="number"
                  min="1"
                  required
                  value={lectureForm.order}
                  onChange={(e) => setLectureForm((prev) => ({ ...prev, order: +e.target.value }))}
                  className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px] font-mono"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditor(null)} className="w-full sm:w-auto min-h-[40px] sm:min-h-[36px]">
                {tr("Cancel", "إلغاء")}
              </Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto min-h-[40px] sm:min-h-[36px]">
                {saving && <Loader2 className="size-3.5 animate-spin me-1.5" />}
                {saving ? tr("Saving...", "جارٍ الحفظ...") : tr("Save Lecture", "حفظ المحاضرة")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── 3. QUIZ MODAL ───────────────────────────────────────────── */}
      <Dialog open={editor === "quiz"} onOpenChange={(v) => !v && setEditor(null)}>
        <DialogContent className="max-h-[92vh] w-[95vw] sm:max-w-xl overflow-y-auto custom-scrollbar p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
          <form onSubmit={onSaveQuiz}>
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-extrabold">
                {quizForm.id ? tr("Edit Quiz Checkpoint", "تعديل الاختبار") : tr("New Quiz Checkpoint", "إضافة اختبار جديد")}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {tr("Assign this quiz checkpoint to a specific course and lecture.", "ربط هذا الاختبار بمقرر ومحاضرة محددة.")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3.5 sm:gap-4 py-4 sm:py-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{tr("Course", "المقرر")}</Label>
                <Select
                  value={quizForm.course_id}
                  onValueChange={(val) => setQuizForm((prev) => ({ ...prev, course_id: val, lecture_id: "" }))}
                  required
                >
                  <SelectTrigger className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]">
                    <SelectValue placeholder={tr("Select course", "اختر المقرر")} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {isAr ? c.title_ar : c.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{tr("Associated Lecture", "المحاضرة المرتبطة")}</Label>
                <Select
                  value={quizForm.lecture_id}
                  onValueChange={(val) => setQuizForm((prev) => ({ ...prev, lecture_id: val }))}
                  disabled={!quizForm.course_id}
                  required
                >
                  <SelectTrigger className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]">
                    <SelectValue placeholder={tr("Select lecture", "اختر المحاضرة")} />
                  </SelectTrigger>
                  <SelectContent>
                    {quizLectures.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {isAr ? l.title_ar : l.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5" dir="ltr">
                <Label htmlFor="quiz-title-en" className="text-xs font-bold">English Quiz Title</Label>
                <Input
                  id="quiz-title-en"
                  required
                  value={quizForm.title_en}
                  onChange={(e) => setQuizForm((prev) => ({ ...prev, title_en: e.target.value }))}
                  placeholder="e.g. Pharmacokinetics Checkpoint 1"
                  className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]"
                />
              </div>

              <div className="space-y-1.5" dir="rtl">
                <Label htmlFor="quiz-title-ar" className="text-xs font-bold">عنوان الاختبار بالعربية</Label>
                <Input
                  id="quiz-title-ar"
                  required
                  value={quizForm.title_ar}
                  onChange={(e) => setQuizForm((prev) => ({ ...prev, title_ar: e.target.value }))}
                  placeholder="مثال: اختبار تقييم الحركية الدوائية"
                  className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditor(null)} className="w-full sm:w-auto min-h-[40px] sm:min-h-[36px]">
                {tr("Cancel", "إلغاء")}
              </Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto min-h-[40px] sm:min-h-[36px]">
                {saving && <Loader2 className="size-3.5 animate-spin me-1.5" />}
                {saving ? tr("Saving...", "جارٍ الحفظ...") : tr("Save Quiz", "حفظ الاختبار")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── 4. RESOURCE MODAL ───────────────────────────────────────── */}
      <Dialog open={editor === "resource"} onOpenChange={(v) => !v && setEditor(null)}>
        <DialogContent className="max-h-[92vh] w-[95vw] sm:max-w-xl overflow-y-auto custom-scrollbar p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
          <form onSubmit={onSaveResource}>
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-extrabold">
                {resourceForm.id ? tr("Edit Lecture Resource", "تعديل المادة المساندة") : tr("New Lecture Resource", "إضافة مادة مساندة")}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {tr("Attach PDF notes, diagrams, or reference links to a lecture.", "إرفاق ملخصات PDF أو صور توضيحية بالمحاضرة.")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3.5 sm:gap-4 py-4 sm:py-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{tr("Course", "المقرر")}</Label>
                <Select
                  value={resourceForm.course_id}
                  onValueChange={(val) => setResourceForm((prev) => ({ ...prev, course_id: val, lecture_id: "" }))}
                  required
                >
                  <SelectTrigger className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]">
                    <SelectValue placeholder={tr("Select course", "اختر المقرر")} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {isAr ? c.title_ar : c.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{tr("Assigned Lecture", "المحاضرة المرفق بها")}</Label>
                <Select
                  value={resourceForm.lecture_id}
                  onValueChange={(val) => setResourceForm((prev) => ({ ...prev, lecture_id: val }))}
                  disabled={!resourceForm.course_id}
                  required
                >
                  <SelectTrigger className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]">
                    <SelectValue placeholder={tr("Select lecture", "اختر المحاضرة")} />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceLectures.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {isAr ? l.title_ar : l.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5" dir="ltr">
                <Label htmlFor="res-title-en" className="text-xs font-bold">English Resource Title</Label>
                <Input
                  id="res-title-en"
                  required
                  value={resourceForm.title_en}
                  onChange={(e) => setResourceForm((prev) => ({ ...prev, title_en: e.target.value }))}
                  placeholder="e.g. Lecture Notes Summary (PDF)"
                  className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]"
                />
              </div>

              <div className="space-y-1.5" dir="rtl">
                <Label htmlFor="res-title-ar" className="text-xs font-bold">العنوان بالعربية</Label>
                <Input
                  id="res-title-ar"
                  required
                  value={resourceForm.title_ar}
                  onChange={(e) => setResourceForm((prev) => ({ ...prev, title_ar: e.target.value }))}
                  placeholder="مثال: ملخص المحاضرة والخرائط الذهنية"
                  className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]"
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
                        if (!newTitleEn) {
                          newTitleEn = cleanName
                        }
                        if (!newTitleAr) {
                          newTitleAr = cleanName
                        }
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
                <Label className="text-xs font-bold">{tr("File Category / Type", "نوع المادة")}</Label>
                <Select
                  value={resourceForm.type}
                  onValueChange={(val) => setResourceForm((prev) => ({ ...prev, type: val as ResourceType }))}
                >
                  <SelectTrigger className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="image">Image / Diagram</SelectItem>
                    <SelectItem value="other">Web Reference Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>


            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditor(null)} className="w-full sm:w-auto min-h-[40px] sm:min-h-[36px]">
                {tr("Cancel", "إلغاء")}
              </Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto min-h-[40px] sm:min-h-[36px]">
                {saving && <Loader2 className="size-3.5 animate-spin me-1.5" />}
                {saving ? tr("Saving...", "جارٍ الحفظ...") : tr("Save Resource", "حفظ المادة")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── 5. QUESTION MODAL ───────────────────────────────────────── */}
      <Dialog open={editor === "question"} onOpenChange={(v) => !v && setEditor(null)}>
        <DialogContent className="max-h-[92vh] w-[95vw] sm:max-w-2xl overflow-y-auto custom-scrollbar p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
          <form onSubmit={onSaveQuestion}>
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-extrabold">
                {questionForm.id ? tr("Edit Question", "تعديل السؤال") : tr("New Question", "إضافة سؤال جديد")}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {tr("Define question prompt, format (MCQ / True-False), and correct answer.", "تحديد نص السؤال ونوعه والإجابة الصحيحة.")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3.5 sm:gap-4 py-4 sm:py-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{tr("Assigned Quiz", "الاختبار التابع له")}</Label>
                <Select
                  value={questionForm.quiz_id}
                  onValueChange={(val) => setQuestionForm((prev) => ({ ...prev, quiz_id: val }))}
                  required
                >
                  <SelectTrigger className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]">
                    <SelectValue placeholder={tr("Select quiz", "اختر الاختبار")} />
                  </SelectTrigger>
                  <SelectContent>
                    {quizzes.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {isAr ? q.title_ar : q.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{tr("Question Type", "نوع السؤال")}</Label>
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
                  <SelectTrigger className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">{tr("Multiple Choice (MCQ)", "اختيار من متعدد")}</SelectItem>
                    <SelectItem value="true_false">{tr("True / False", "صح / خطأ")}</SelectItem>
                    <SelectItem value="short_text">{tr("Short Text", "إجابة قصيرة")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2" dir="ltr">
                <Label htmlFor="q-text-en" className="text-xs font-bold">Question in English</Label>
                <Textarea
                  id="q-text-en"
                  required
                  rows={2}
                  value={questionForm.text_en}
                  onChange={(e) => setQuestionForm((prev) => ({ ...prev, text_en: e.target.value }))}
                  placeholder="Enter the question prompt in English..."
                  className="text-sm sm:text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2" dir="rtl">
                <Label htmlFor="q-text-ar" className="text-xs font-bold">السؤال بالعربية</Label>
                <Textarea
                  id="q-text-ar"
                  required
                  rows={2}
                  value={questionForm.text_ar}
                  onChange={(e) => setQuestionForm((prev) => ({ ...prev, text_ar: e.target.value }))}
                  placeholder="أدخل نص السؤال بالعربية..."
                  className="text-sm sm:text-xs"
                />
              </div>

              {questionForm.type === "multiple_choice" && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="q-options" className="text-xs font-bold">
                    {tr("Multiple Choice Options (1 per line)", "خيارات السؤال (خيار واحد في كل سطر)")}
                  </Label>
                  <Textarea
                    id="q-options"
                    required
                    rows={4}
                    value={questionForm.optionsText}
                    onChange={(e) => setQuestionForm((prev) => ({ ...prev, optionsText: e.target.value }))}
                    placeholder={"Option A\nOption B\nOption C\nOption D"}
                    className="text-sm sm:text-xs font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {tr("Enter each possible answer choice on a separate line.", "أدخل كل خيار متاح في سطر مستقل.")}
                  </p>
                </div>
              )}

              {questionForm.type === "true_false" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">{tr("Correct Answer", "الإجابة الصحيحة")}</Label>
                  <Select
                    value={questionForm.correct_answer}
                    onValueChange={(val) => setQuestionForm((prev) => ({ ...prev, correct_answer: val }))}
                  >
                    <SelectTrigger className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="True">{tr("True", "صح")}</SelectItem>
                      <SelectItem value="False">{tr("False", "خطأ")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="q-correct" className="text-xs font-bold">
                    {tr("Exact Correct Answer", "نص الإجابة الصحيحة")}
                  </Label>
                  <Input
                    id="q-correct"
                    required
                    value={questionForm.correct_answer}
                    onChange={(e) => setQuestionForm((prev) => ({ ...prev, correct_answer: e.target.value }))}
                    placeholder={tr("Must match one of the options above", "يجب أن يطابق أحد الخيارات أعلاه بالضبط")}
                    className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="q-order" className="text-xs font-bold">
                  {tr("Question Order", "ترتيب السؤال")}
                </Label>
                <Input
                  id="q-order"
                  type="number"
                  min="1"
                  required
                  value={questionForm.order}
                  onChange={(e) => setQuestionForm((prev) => ({ ...prev, order: +e.target.value }))}
                  className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px] font-mono"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditor(null)} className="w-full sm:w-auto min-h-[40px] sm:min-h-[36px]">
                {tr("Cancel", "إلغاء")}
              </Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto min-h-[40px] sm:min-h-[36px]">
                {saving && <Loader2 className="size-3.5 animate-spin me-1.5" />}
                {saving ? tr("Saving...", "جارٍ الحفظ...") : tr("Save Question", "حفظ السؤال")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── 6. EDIT USER MODAL ──────────────────────────────────────── */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="w-[95vw] sm:max-w-lg p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
          {editingUser && (
            <form onSubmit={onSaveUserEdit}>
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl font-extrabold">{tr("Edit Staff Account", "تعديل حساب العضو")}</DialogTitle>
                <DialogDescription className="text-xs">
                  {tr("Update profile name, assigned role, or set a new password.", "تعديل الاسم الكامل أو الدور أو تعيين كلمة مرور جديدة.")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{tr("Email (Immutable)", "البريد الإلكتروني")}</Label>
                  <Input value={editingUser.email} disabled className="bg-muted text-muted-foreground text-xs" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{tr("Full Name", "الاسم الكامل")}</Label>
                  <Input
                    value={userEditForm.full_name}
                    onChange={(e) => setUserEditForm((f) => ({ ...f, full_name: e.target.value }))}
                    placeholder="Dr. Sarah Ahmed"
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{tr("Staff Role", "الدور الوظيفي")}</Label>
                  <Select
                    value={userEditForm.role}
                    onValueChange={(val: UserRole) => setUserEditForm((f) => ({ ...f, role: val }))}
                    disabled={editingUser.id === currentUserId}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mentor">{tr("Mentor / Instructor", "أستاذ / مرشد تعليمي")}</SelectItem>
                      <SelectItem value="super_admin">{tr("Super Administrator", "مدير نظام عام")}</SelectItem>
                      <SelectItem value="dev">{tr("Developer / Engineering", "مطور برمجيات")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 border-t pt-3">
                  <Label className="text-xs">{tr("Set New Password (optional)", "تعيين كلمة مرور جديدة (اختياري)")}</Label>
                  <Input
                    type="password"
                    value={userEditForm.password}
                    onChange={(e) => setUserEditForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder={tr("Leave blank to keep unchanged", "اتركه فارغًا للإبقاء دون تغيير")}
                    className="text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)} className="w-full sm:w-auto min-h-[40px] sm:min-h-[36px]">
                  {tr("Cancel", "إلغاء")}
                </Button>
                <Button type="submit" disabled={saving} className="gap-1.5 font-bold w-full sm:w-auto min-h-[40px] sm:min-h-[36px]">
                  {saving && <Loader2 className="size-3.5 animate-spin" />}
                  <span>{tr("Save Changes", "حفظ التعديلات")}</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── 7. DELETE USER CONFIRMATION ─────────────────────────────── */}
      <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent className="max-h-[92vh] w-[95vw] sm:max-w-md overflow-y-auto custom-scrollbar p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
          {deletingUser && (
            <>
              <DialogHeader>
                <div className="mb-2.5 grid size-10 place-items-center rounded-xl bg-destructive/10 text-destructive">
                  <Trash2 className="size-5" />
                </div>
                <DialogTitle className="text-base sm:text-lg font-bold">
                  {tr("Permanently Delete User Account?", "حذف حساب المستخدم نهائيًا؟")}
                </DialogTitle>
                <DialogDescription className="text-xs leading-relaxed">
                  {tr(
                    `${deletingUser.full_name || deletingUser.email} will immediately lose all administrative access. This action cannot be undone.`,
                    `سيفقد ${deletingUser.full_name || deletingUser.email} حق الوصول الإداري فورًا. هذا الإجراء نهائي ولا يمكن التراجع عنه.`
                  )}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => setDeletingUser(null)} className="w-full sm:w-auto min-h-[40px] sm:min-h-[36px]">
                  {tr("Cancel", "إلغاء")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onConfirmDeleteUser}
                  disabled={userActionId === deletingUser.id}
                  className="gap-1.5 w-full sm:w-auto min-h-[40px] sm:min-h-[36px]"
                >
                  {userActionId === deletingUser.id && <Loader2 className="size-3.5 animate-spin" />}
                  <Trash2 className="size-3.5" />
                  {tr("Delete Account", "تأكيد الحذف")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── 8. UNANSWERED QUESTIONS NOTIFICATION MODAL ──────────────── */}
      <Dialog open={questionAlertOpen} onOpenChange={setQuestionAlertOpen}>
        <DialogContent className="max-h-[92vh] w-[95vw] sm:max-w-md overflow-y-auto custom-scrollbar p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <div className="mb-2.5 grid size-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <MessageCircle className="size-5" />
            </div>
            <DialogTitle className="text-base sm:text-lg font-bold">
              {tr("Pending Student Questions", "هناك أسئلة طلاب تنتظر الإجابة")}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              {tr(
                `There ${unansweredCount === 1 ? "is" : "are"} currently ${unansweredCount} unanswered student inquiry awaiting educator feedback.`,
                `يوجد حاليًا ${unansweredCount} من أسئلة واستفسارات الطلاب دون رد بانتظار إجابة الفريق.`
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setQuestionAlertOpen(false)} className="w-full sm:w-auto min-h-[40px] sm:min-h-[36px]">
              {tr("Review Later", "المراجعة لاحقًا")}
            </Button>
            <Button onClick={onGoToQA} className="gap-1.5 font-bold w-full sm:w-auto min-h-[40px] sm:min-h-[36px]">
              <MessageCircle className="size-3.5" />
              {tr("Answer Questions Now", "الإجابة الآن")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
