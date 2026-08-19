import type { GetServerSideProps } from "next"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations"
import { FiLoader as Loader2 } from "react-icons/fi"
import Layout from "@/components/Layout"
import AdminSidebar from "@/components/admin/AdminSidebar"
import AdminTopNav from "@/components/admin/AdminTopNav"
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard"
import CurriculumManager from "@/components/admin/CurriculumManager"
import CommunityManager from "@/components/admin/CommunityManager"
import UserManager, { type ManagedUser, type UserForm } from "@/components/admin/UserManager"
import SiteContentManager from "@/components/admin/SiteContentManager"
import StudentManager from "@/components/admin/StudentManager"
import DeveloperConsole, { type DevSubTab } from "@/components/admin/DeveloperConsole"
import AdminModals, {
  type CourseForm,
  type LectureForm,
  type QuizForm,
  type ResourceForm,
  type QuestionForm,
} from "@/components/admin/AdminModals"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabaseClient"
import {
  defaultSiteContent,
  loadSiteContent,
  mergeSiteContent,
  type SiteContent,
} from "@/lib/siteContent"
import { trackAdminAction, resetUser } from "@/lib/analytics"
import type {
  CommunityQuestion,
  Course,
  EnrollmentSettings,
  Lecture,
  Question,
  Quiz,
  Resource,
  UserProfile,
} from "@/types"

type Editor = "course" | "lecture" | "quiz" | "resource" | "question" | null
type Notice = { error?: boolean; text: string } | null

const emptyCourse: CourseForm = {
  title_en: "",
  title_ar: "",
  description_en: "",
  description_ar: "",
  objectives_en: "",
  objectives_ar: "",
  prerequisites_en: "",
  prerequisites_ar: "",
  thumbnail_url: "",
  is_locked: false,
  access_policy: "open",
}

const emptyLecture: LectureForm = {
  course_id: "",
  title_en: "",
  title_ar: "",
  details_en: "",
  details_ar: "",
  youtube_url: "",
  order: 1,
}

const emptyQuiz: QuizForm = {
  course_id: "",
  lecture_id: "",
  title_en: "",
  title_ar: "",
}

const emptyResource: ResourceForm = {
  course_id: "",
  lecture_id: "",
  title_en: "",
  title_ar: "",
  url: "",
  type: "pdf",
}

const emptyQuestion: QuestionForm = {
  quiz_id: "",
  text_en: "",
  text_ar: "",
  type: "multiple_choice",
  optionsText: "",
  correct_answer: "",
  order: 1,
}

const emptyUser: UserForm = {
  full_name: "",
  email: "",
  password: "",
  role: "mentor",
}

const merge = <T extends { id: string }>(rows: T[], row: T) =>
  rows.some(({ id }) => id === row.id)
    ? rows.map((item) => (item.id === row.id ? row : item))
    : [row, ...rows]

async function callUserApi(token: string, init?: RequestInit) {
  const response = await fetch("/api/admin/users", {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error || "User operation failed")
  return payload
}

export default function AdminPage() {
  const router = useRouter()
  const isAr = router.locale === "ar"
  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editor, setEditor] = useState<Editor>(null)
  const [notice, setNotice] = useState<Notice>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [community, setCommunity] = useState<CommunityQuestion[]>([])

  const [courseForm, setCourseForm] = useState<CourseForm>(emptyCourse)
  const [lectureForm, setLectureForm] = useState<LectureForm>(emptyLecture)
  const [quizForm, setQuizForm] = useState<QuizForm>(emptyQuiz)
  const [resourceForm, setResourceForm] = useState<ResourceForm>(emptyResource)
  const [questionForm, setQuestionForm] = useState<QuestionForm>(emptyQuestion)

  const [selectedQuizId, setSelectedQuizId] = useState("")
  const [reply, setReply] = useState<Record<string, string>>({})
  const [siteContent, setSiteContent] = useState<SiteContent>(defaultSiteContent)
  
  // Navigation State
  const [activePage, setActivePage] = useState<string>("analytics")
  const [activeCurriculumSubTab, setActiveCurriculumSubTab] = useState<"courses" | "enrollments" | "lectures" | "quizzes" | "resources">("courses")
  const [activeStudentSubTab, setActiveStudentSubTab] = useState<"roster" | "pending" | "controller" | "directories" | "provision">("roster")
  const [activeDevSubTab, setActiveDevSubTab] = useState<DevSubTab>("logs")
  const [selectedEnrollmentCourseId, setSelectedEnrollmentCourseId] = useState<string>("all")
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false)

  const handleSelectNav = (page: string, subpage?: string) => {
    setActivePage(page)
    if (page === "curriculum" && subpage) {
      setActiveCurriculumSubTab(subpage as typeof activeCurriculumSubTab)
    }
    if (page === "students" && subpage) {
      setActiveStudentSubTab(subpage as typeof activeStudentSubTab)
    }
    if (page === "dev" && subpage) {
      setActiveDevSubTab(subpage as DevSubTab)
    }
  }

  const handleNavigateToCourseEnrollments = (courseId?: string) => {
    if (courseId) setSelectedEnrollmentCourseId(courseId)
    setActivePage("curriculum")
    setActiveCurriculumSubTab("enrollments")
  }

  const currentSubpage =
    activePage === "curriculum"
      ? activeCurriculumSubTab
      : activePage === "students"
      ? activeStudentSubTab
      : activePage === "dev"
      ? activeDevSubTab
      : undefined

  const [questionAlertOpen, setQuestionAlertOpen] = useState(false)

  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [pendingStudentsCount, setPendingStudentsCount] = useState(0)
  const [pendingEnrollmentsCount, setPendingEnrollmentsCount] = useState(0)

  // Users management
  const [userForm, setUserForm] = useState<UserForm>(emptyUser)
  const [creatingUser, setCreatingUser] = useState(false)
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userActionId, setUserActionId] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)
  const [userEditForm, setUserEditForm] = useState<UserForm>(emptyUser)
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null)

  useEffect(() => {
    const client = supabase
    if (!client) {
      router.replace("/admin/login")
      return
    }

    client.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/admin/login")
        return
      }

      setSessionToken(session.access_token)

      // Query pending students and course enrollments count
      try {
        const [{ count: studentCount }, { count: enrollCount }] = await Promise.all([
          client
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("role", "student")
            .eq("status", "pending"),
          client
            .from("course_enrollments")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
        ])
        if (studentCount !== null) setPendingStudentsCount(studentCount)
        if (enrollCount !== null) setPendingEnrollmentsCount(enrollCount)
      } catch {}

      const data = await Promise.all([
        client.from("users").select("*").eq("id", session.user.id).maybeSingle(),
        client.from("courses").select("*").order("created_at", { ascending: false }),
        client.from("lectures").select("*").order("order"),
        client.from("quizzes").select("*").order("created_at", { ascending: false }),
        client.from("resources").select("*"),
        client.from("questions").select("*").order("order"),
        client
          .from("community_questions")
          .select("id, lecture_id, author_name, text, created_at, answers:community_answers(*)")
          .order("created_at", { ascending: false }),
        client.from("site_content").select("content").eq("id", "main").maybeSingle(),
      ])

      if (data[0].data) {
        if (!["dev", "super_admin", "mentor"].includes(data[0].data.role)) {
          // If student or unauthorized role attempts to open admin panel, redirect to admin login
          router.replace("/admin/login")
          return
        }

        setProfile(data[0].data)
        if (["dev", "super_admin"].includes(data[0].data.role)) {
          setLoadingUsers(true)
          try {
            const payload = await callUserApi(session.access_token)
            setManagedUsers(payload.users)
          } catch (error) {
            setNotice({
              error: true,
              text: error instanceof Error ? error.message : "Could not load users",
            })
          } finally {
            setLoadingUsers(false)
          }
        }
      } else {
        router.replace("/admin/login")
        return
      }

      if (data[1].data) setCourses(data[1].data)
      if (data[2].data) setLectures(data[2].data)
      if (data[3].data) {
        setQuizzes(data[3].data)
        setSelectedQuizId(data[3].data[0]?.id ?? "")
      }
      if (data[4].data) setResources(data[4].data)
      if (data[5].data) setQuestions(data[5].data)
      if (data[6].data) {
        setCommunity(data[6].data)
        if (data[6].data.some((question) => !question.answers?.length)) {
          setQuestionAlertOpen(true)
        }
      }
      if (data[7].data?.content) {
        setSiteContent(mergeSiteContent(data[7].data.content as Partial<SiteContent>))
      }

      const error = data.slice(0, 7).find((item) => item.error)?.error
      if (error) setNotice({ error: true, text: error.message })
      setReady(true)
    })
  }, [router])

  const canManageUsers = profile?.role === "dev" || profile?.role === "super_admin"
  const isDev = profile?.role === "dev"
  const unansweredCommunity = community.filter((q) => !q.answers?.length)

  const result = (error: { message: string } | null, text: string) =>
    setNotice({ error: !!error, text: error?.message ?? text })

  // ─── CRUD Handlers ──────────────────────────────────────────────────────────

  async function saveCourse(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    const { id, ...form } = courseForm
    const payload = {
      ...form,
      thumbnail_url: form.thumbnail_url || null,
      mentor_id: null,
      is_locked: form.is_locked ?? false,
      access_policy: form.access_policy || (form.is_locked ? "students_only" : "open"),
    }
    const res = id
      ? await supabase.from("courses").update(payload).eq("id", id).select().single()
      : await supabase.from("courses").insert([payload]).select().single()

    if (res.data) {
      setCourses((rows) => merge(rows, res.data))
      setEditor(null)
      setCourseForm(emptyCourse)
      trackAdminAction({
        action: id ? "updated" : "created",
        entityType: "course",
        entityId: res.data.id,
        entityName: res.data.title_en,
      })
    }
    result(res.error, tr("Course saved successfully.", "تم حفظ المقرر بنجاح."))
    setSaving(false)
  }

  async function saveLecture(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    const { id, ...payload } = lectureForm
    const res = id
      ? await supabase.from("lectures").update(payload).eq("id", id).select().single()
      : await supabase.from("lectures").insert([payload]).select().single()

    if (res.data) {
      setLectures((rows) => merge(rows, res.data))
      setEditor(null)
      setLectureForm(emptyLecture)
      trackAdminAction({
        action: id ? "updated" : "created",
        entityType: "lecture",
        entityId: res.data.id,
        entityName: res.data.title_en,
      })
    }
    result(res.error, tr("Lecture saved successfully.", "تم حفظ المحاضرة بنجاح."))
    setSaving(false)
  }

  async function saveQuiz(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase || !profile) return
    setSaving(true)
    const { id, ...form } = quizForm
    const payload = { ...form, created_by: profile.id }
    const res = id
      ? await supabase.from("quizzes").update(payload).eq("id", id).select().single()
      : await supabase.from("quizzes").insert([payload]).select().single()

    if (res.data) {
      setQuizzes((rows) => merge(rows, res.data))
      setSelectedQuizId(res.data.id)
      setEditor(null)
      setQuizForm(emptyQuiz)
      trackAdminAction({
        action: id ? "updated" : "created",
        entityType: "quiz",
        entityId: res.data.id,
        entityName: res.data.title_en,
      })
    }
    result(res.error, tr("Quiz saved successfully.", "تم حفظ الاختبار بنجاح."))
    setSaving(false)
  }

  async function saveResource(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    const { id } = resourceForm
    const payload = {
      lecture_id: resourceForm.lecture_id,
      title_en: resourceForm.title_en,
      title_ar: resourceForm.title_ar,
      url: resourceForm.url,
      type: resourceForm.type,
    }
    const res = id
      ? await supabase.from("resources").update(payload).eq("id", id).select().single()
      : await supabase.from("resources").insert([payload]).select().single()

    if (res.data) {
      setResources((rows) => merge(rows, res.data))
      setEditor(null)
      setResourceForm(emptyResource)
      trackAdminAction({
        action: id ? "updated" : "created",
        entityType: "resource",
        entityId: res.data.id,
        entityName: res.data.title_en,
      })
    }
    result(res.error, tr("Resource saved successfully.", "تم حفظ المادة بنجاح."))
    setSaving(false)
  }

  async function saveQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    const { id, optionsText, ...form } = questionForm
    const options =
      form.type === "multiple_choice"
        ? optionsText.split("\n").map((v) => v.trim()).filter(Boolean)
        : form.type === "true_false"
        ? ["True", "False"]
        : null

    if (form.type === "multiple_choice" && (options?.length ?? 0) < 2) {
      setNotice({
        error: true,
        text: tr("Enter at least two options, one per line.", "أدخل خيارين على الأقل، كل خيار في سطر."),
      })
      setSaving(false)
      return
    }

    const payload = { ...form, options }
    const res = id
      ? await supabase.from("questions").update(payload).eq("id", id).select().single()
      : await supabase.from("questions").insert([payload]).select().single()

    if (res.data) {
      setQuestions((rows) => merge(rows, res.data))
      setEditor(null)
      setQuestionForm({ ...emptyQuestion, quiz_id: res.data.quiz_id })
      trackAdminAction({
        action: id ? "updated" : "created",
        entityType: "question",
        entityId: res.data.id,
        entityName: res.data.text_en,
      })
    }
    result(res.error, tr("Question saved successfully.", "تم حفظ السؤال بنجاح."))
    setSaving(false)
  }

  async function remove(
    table: "courses" | "lectures" | "quizzes" | "resources" | "questions",
    id: string,
    name: string
  ) {
    if (!supabase || !confirm(tr(`Delete ${name}? Related records may also be deleted.`, `حذف ${name}؟ قد تُحذف السجلات المرتبطة أيضًا.`))) return
    const { error } = await supabase.from(table).delete().eq("id", id)

    if (!error) {
      trackAdminAction({
        action: "deleted",
        entityType:
          table === "courses"
            ? "course"
            : table === "lectures"
            ? "lecture"
            : table === "quizzes"
            ? "quiz"
            : table === "resources"
            ? "resource"
            : "question",
        entityId: id,
        entityName: name,
      })
    }

    if (!error && table === "courses") {
      const lectureIds = lectures.filter((x) => x.course_id === id).map((x) => x.id)
      const quizIds = quizzes.filter((x) => x.course_id === id).map((x) => x.id)
      setCourses((r) => r.filter((x) => x.id !== id))
      setLectures((r) => r.filter((x) => x.course_id !== id))
      setResources((r) => r.filter((x) => !lectureIds.includes(x.lecture_id)))
      setQuizzes((r) => r.filter((x) => x.course_id !== id))
      setQuestions((r) => r.filter((x) => !quizIds.includes(x.quiz_id)))
    }
    if (!error && table === "lectures") {
      const quizIds = quizzes.filter((x) => x.lecture_id === id).map((x) => x.id)
      setLectures((r) => r.filter((x) => x.id !== id))
      setResources((r) => r.filter((x) => x.lecture_id !== id))
      setQuizzes((r) => r.filter((x) => x.lecture_id !== id))
      setQuestions((r) => r.filter((x) => !quizIds.includes(x.quiz_id)))
    }
    if (!error && table === "quizzes") {
      setQuizzes((r) => r.filter((x) => x.id !== id))
      setQuestions((r) => r.filter((x) => x.quiz_id !== id))
      if (selectedQuizId === id) setSelectedQuizId("")
    }
    if (!error && table === "resources") setResources((r) => r.filter((x) => x.id !== id))
    if (!error && table === "questions") setQuestions((r) => r.filter((x) => x.id !== id))

    result(error, tr("Deleted successfully.", "تم الحذف بنجاح."))
  }

  async function sendReply(id: string) {
    const text = reply[id]?.trim()
    if (!text || !supabase || !profile) return
    const { data, error } = await supabase
      .from("community_answers")
      .insert([{ question_id: id, responder_id: profile.id, text }])
      .select()
      .single()

    if (data) {
      setCommunity((rows) =>
        rows.map((q) => (q.id === id ? { ...q, answers: [...(q.answers ?? []), data] } : q))
      )
      setReply((r) => ({ ...r, [id]: "" }))
      trackAdminAction({
        action: "created",
        entityType: "qa_reply",
        entityId: id,
        details: { responder_role: profile.role },
      })
    }
    result(error, tr("Reply posted successfully.", "تم نشر الإجابة بنجاح."))
  }

  async function saveSiteContent(overrideContent?: SiteContent) {
    if (!supabase || profile?.role !== "dev") return
    setSaving(true)
    const contentToSave = overrideContent || siteContent
    const { error } = await supabase
      .from("site_content")
      .upsert({
        id: "main",
        content: contentToSave,
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      })

    if (!error) {
      if (overrideContent) {
        setSiteContent(overrideContent)
      }
      trackAdminAction({ action: "content_updated", entityType: "site_content" })
    }
    result(
      error,
      tr("Site content updated successfully.", "تم تحديث نصوص ومحتوى الموقع بنجاح.")
    )
    setSaving(false)
  }

  async function logout() {
    resetUser()
    if (supabase) await supabase.auth.signOut()
    await router.push("/admin/login")
  }

  // ─── User Management Handlers ───────────────────────────────────────────────

  async function loadManagedUsers() {
    if (!supabase) return
    setLoadingUsers(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error(tr("Your session expired. Sign in again.", "انتهت الجلسة. سجّل الدخول مرة أخرى."))
      const payload = await callUserApi(session.access_token)
      setManagedUsers(payload.users)
    } catch (error) {
      setNotice({
        error: true,
        text: error instanceof Error ? error.message : tr("Could not load users.", "تعذر تحميل المستخدمين."),
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  async function createAdminUser(event: React.FormEvent) {
    event.preventDefault()
    if (!supabase || !canManageUsers) return
    setCreatingUser(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      setNotice({
        error: true,
        text: tr("Your session expired. Sign in again.", "انتهت الجلسة. سجّل الدخول مرة أخرى."),
      })
      setCreatingUser(false)
      return
    }

    try {
      const response = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(userForm),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || tr("Could not create user.", "تعذر إنشاء المستخدم."))
      trackAdminAction({
        action: "created",
        entityType: "user",
        details: { email: userForm.email, role: userForm.role },
      })
      setUserForm(emptyUser)
      await loadManagedUsers()
      setNotice({ text: tr("Administrative user created successfully.", "تم إنشاء المستخدم الإداري بنجاح.") })
    } catch (error) {
      setNotice({
        error: true,
        text: error instanceof Error ? error.message : tr("Could not create user.", "تعذر إنشاء المستخدم."),
      })
    } finally {
      setCreatingUser(false)
    }
  }

  const openUserEditor = (user: ManagedUser) => {
    setEditingUser(user)
    setUserEditForm({
      full_name: user.full_name ?? "",
      email: user.email,
      password: "",
      role: user.role,
    })
  }

  async function updateManagedUser(userId: string, changes: Record<string, unknown>, success: string) {
    if (!supabase) return false
    setUserActionId(userId)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error(tr("Your session expired. Sign in again.", "انتهت الجلسة. سجّل الدخول مرة أخرى."))
      await callUserApi(session.access_token, {
        method: "PATCH",
        body: JSON.stringify({ userId, ...changes }),
      })
      trackAdminAction({ action: "updated", entityType: "user", entityId: userId, details: changes })
      await loadManagedUsers()
      setNotice({ text: success })
      return true
    } catch (error) {
      setNotice({
        error: true,
        text: error instanceof Error ? error.message : tr("Could not update user.", "تعذر تحديث المستخدم."),
      })
      return false
    } finally {
      setUserActionId(null)
    }
  }

  async function saveManagedUser(event: React.FormEvent) {
    event.preventDefault()
    if (!editingUser) return
    const updated = await updateManagedUser(
      editingUser.id,
      userEditForm,
      tr("User details updated successfully.", "تم تحديث بيانات المستخدم بنجاح.")
    )
    if (updated) setEditingUser(null)
  }

  async function toggleManagedUser(user: ManagedUser) {
    const suspended = !!user.banned_until && new Date(user.banned_until).getTime() > Date.now()
    await updateManagedUser(
      user.id,
      { banned: !suspended },
      suspended
        ? tr("User access restored.", "تمت إعادة تفعيل المستخدم.")
        : tr("User access suspended.", "تم إيقاف وصول المستخدم.")
    )
  }

  async function deleteManagedUser() {
    if (!supabase || !deletingUser) return
    const target = deletingUser
    setUserActionId(target.id)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error(tr("Your session expired. Sign in again.", "انتهت الجلسة. سجّل الدخول مرة أخرى."))
      await callUserApi(session.access_token, {
        method: "DELETE",
        body: JSON.stringify({ userId: target.id }),
      })
      trackAdminAction({ action: "deleted", entityType: "user", entityId: target.id, entityName: target.email })
      setManagedUsers((users) => users.filter((user) => user.id !== target.id))
      setDeletingUser(null)
      setNotice({ text: tr("User deleted permanently.", "تم حذف المستخدم نهائيًا.") })
    } catch (error) {
      setNotice({
        error: true,
        text: error instanceof Error ? error.message : tr("Could not delete user.", "تعذر حذف المستخدم."),
      })
    } finally {
      setUserActionId(null)
    }
  }

  // ─── Modal Openers ──────────────────────────────────────────────────────────

  const openCourse = (x?: Course) => {
    setCourseForm(
      x
        ? {
            id: x.id,
            title_en: x.title_en,
            title_ar: x.title_ar,
            description_en: x.description_en ?? "",
            description_ar: x.description_ar ?? "",
            objectives_en: x.objectives_en ?? "",
            objectives_ar: x.objectives_ar ?? "",
            prerequisites_en: x.prerequisites_en ?? "",
            prerequisites_ar: x.prerequisites_ar ?? "",
            thumbnail_url: x.thumbnail_url ?? "",
            is_locked: x.is_locked,
            access_policy: x.access_policy || (x.is_locked ? "students_only" : "open"),
          }
        : emptyCourse
    )
    setEditor("course")
  }

  const openLecture = (x?: Lecture) => {
    setLectureForm(
      x
        ? {
            id: x.id,
            course_id: x.course_id,
            title_en: x.title_en,
            title_ar: x.title_ar,
            details_en: x.details_en ?? "",
            details_ar: x.details_ar ?? "",
            youtube_url: x.youtube_url,
            order: x.order,
          }
        : { ...emptyLecture, course_id: courses[0]?.id ?? "", order: lectures.length + 1 }
    )
    setEditor("lecture")
  }

  const openQuiz = (x?: Quiz) => {
    setQuizForm(
      x
        ? {
            id: x.id,
            course_id: x.course_id ?? "",
            lecture_id: x.lecture_id ?? "",
            title_en: x.title_en,
            title_ar: x.title_ar,
          }
        : { ...emptyQuiz, course_id: courses[0]?.id ?? "" }
    )
    setEditor("quiz")
  }

  const openResource = (x?: Resource) => {
    const lecture = lectures.find((l) => l.id === x?.lecture_id)
    setResourceForm(
      x
        ? {
            id: x.id,
            course_id: lecture?.course_id ?? courses[0]?.id ?? "",
            lecture_id: x.lecture_id,
            title_en: x.title_en,
            title_ar: x.title_ar,
            url: x.url,
            type: x.type,
          }
        : { ...emptyResource, course_id: courses[0]?.id ?? "" }
    )
    setEditor("resource")
  }

  const openQuestion = (x?: Question) => {
    const currentQuestions = questions.filter((q) => q.quiz_id === selectedQuizId)
    setQuestionForm(
      x
        ? {
            id: x.id,
            quiz_id: x.quiz_id,
            text_en: x.text_en,
            text_ar: x.text_ar,
            type: x.type,
            optionsText: x.options?.join("\n") ?? "",
            correct_answer: x.correct_answer,
            order: x.order,
          }
        : {
            ...emptyQuestion,
            quiz_id: selectedQuizId || quizzes[0]?.id || "",
            order: currentQuestions.length + 1,
          }
    )
    setEditor("question")
  }

  async function handleUpdateEnrollmentSettings(newSettings: EnrollmentSettings) {
    if (!sessionToken) return
    try {
      const res = await fetch("/api/admin/settings/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ enrollment_settings: newSettings }),
      })
      if (res.ok) {
        const data = await res.json()
        setSiteContent((prev) => ({
          ...prev,
          enrollment_settings: data.enrollment_settings,
        }))
        setNotice({ text: tr("Enrollment settings updated successfully.", "تم تحديث إعدادات التسجيل بنجاح.") })
      }
    } catch (err) {
      console.error("Failed to update enrollment settings:", err)
    }
  }

  if (!ready) {
    return (
      <Layout title="Admin Hub — PharmaCore">
        <div className="grid min-h-screen place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={`${tr("Administration Hub", "لوحة الإدارة والتحليلات")} — PharmaCore`}>
      <div className="flex min-h-screen bg-muted/20">
        {/* Left / Right Collapsible Categorized Sidebar */}
        <AdminSidebar
          isAr={isAr}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
          activePage={activePage}
          activeSubpage={currentSubpage}
          onSelectNav={handleSelectNav}
          profile={profile}
          unansweredCount={unansweredCommunity.length}
          pendingStudentsCount={pendingStudentsCount}
          pendingEnrollmentsCount={pendingEnrollmentsCount}
          canManageUsers={canManageUsers}
          isDev={isDev}
          onLogout={logout}
        />

        {/* Content Container (Offset with sidebar width) */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            isAr
              ? sidebarCollapsed
                ? "lg:mr-20"
                : "lg:mr-64 xl:mr-72"
              : sidebarCollapsed
              ? "lg:ml-20"
              : "lg:ml-64 xl:ml-72"
          }`}
          dir={isAr ? "rtl" : "ltr"}
        >
          {/* Top Command Bar & Breadcrumbs */}
          <AdminTopNav
            isAr={isAr}
            onToggleMobile={() => setMobileSidebarOpen(true)}
            activePage={activePage}
            activeSubpage={currentSubpage}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            unansweredCount={unansweredCommunity.length}
            onGoToQA={() => handleSelectNav("qa")}
          />

          {/* Main Workspace Canvas */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1720px] w-full mx-auto">
            {notice && (
              <Alert variant={notice.error ? "destructive" : "default"} className="mb-6">
                <AlertDescription>{notice.text}</AlertDescription>
              </Alert>
            )}

            {/* 1. Insights & Telemetry */}
            {activePage === "analytics" && (
              <AnalyticsDashboard
                isAr={isAr}
                courses={courses}
                lectures={lectures}
                quizzes={quizzes}
                questions={questions}
                unansweredQuestionsCount={unansweredCommunity.length}
              />
            )}

            {/* 2. Academic Curriculum */}
            {activePage === "curriculum" && (
              <CurriculumManager
                isAr={isAr}
                token={sessionToken}
                enrollmentSettings={
                  siteContent.enrollment_settings || {
                    signup_mode: "approval_required",
                    universities: [],
                    faculties: [],
                  }
                }
                searchQuery={searchQuery}
                courses={courses}
                lectures={lectures}
                quizzes={quizzes}
                questions={questions}
                resources={resources}
                selectedQuizId={selectedQuizId}
                setSelectedQuizId={setSelectedQuizId}
                activeSubTab={activeCurriculumSubTab}
                selectedEnrollmentCourseId={selectedEnrollmentCourseId}
                onOpenCourseEditor={openCourse}
                onOpenLectureEditor={openLecture}
                onOpenQuizEditor={openQuiz}
                onOpenResourceEditor={openResource}
                onOpenQuestionEditor={openQuestion}
                onDeleteEntity={remove}
                onNavigateToEnrollments={handleNavigateToCourseEnrollments}
                onEnrollmentsUpdated={(count) => setPendingEnrollmentsCount(count)}
              />
            )}

            {/* 3. Community Q&A */}
            {activePage === "qa" && (
              <CommunityManager
                isAr={isAr}
                searchQuery={searchQuery}
                community={community}
                lectures={lectures}
                profile={profile}
                reply={reply}
                setReply={setReply}
                onSendReply={sendReply}
              />
            )}

            {/* 4. Student Affairs & Signup Controller */}
            {activePage === "students" && (
              <StudentManager
                isAr={isAr}
                token={sessionToken}
                subTab={activeStudentSubTab}
                courses={courses}
                enrollmentSettings={
                  siteContent.enrollment_settings || {
                    signup_mode: "approval_required",
                    universities: [],
                    faculties: [],
                  }
                }
                onUpdateEnrollmentSettings={handleUpdateEnrollmentSettings}
              />
            )}

            {/* 5. Staff & Faculty Governance */}
            {activePage === "users" && canManageUsers && (
              <UserManager
                isAr={isAr}
                searchQuery={searchQuery}
                profile={profile}
                managedUsers={managedUsers}
                loadingUsers={loadingUsers}
                creatingUser={creatingUser}
                userActionId={userActionId}
                userForm={userForm}
                setUserForm={setUserForm}
                onLoadUsers={loadManagedUsers}
                onCreateUser={createAdminUser}
                onOpenEditUser={openUserEditor}
                onToggleSuspendUser={toggleManagedUser}
                onOpenDeleteUser={(u) => setDeletingUser(u)}
              />
            )}

            {/* 6. Site CMS & Content */}
            {activePage === "content" && isDev && (
              <SiteContentManager
                isAr={isAr}
                siteContent={siteContent}
                setSiteContent={setSiteContent}
                saving={saving}
                onSaveContent={saveSiteContent}
              />
            )}

            {/* 7. Developer Console */}
            {activePage === "dev" && isDev && (
              <DeveloperConsole
                isAr={isAr}
                subTab={activeDevSubTab}
                siteContent={siteContent}
                onSaveSiteContent={saveSiteContent}
                courses={courses}
                lectures={lectures}
                quizzes={quizzes}
                questions={questions}
              />
            )}
          </main>
        </div>
      </div>

      {/* Reusable Modals & Dialogs */}
      <AdminModals
        isAr={isAr}
        editor={editor}
        setEditor={setEditor}
        saving={saving}
        courses={courses}
        lectures={lectures}
        quizzes={quizzes}
        courseForm={courseForm}
        setCourseForm={setCourseForm}
        onSaveCourse={saveCourse}
        lectureForm={lectureForm}
        setLectureForm={setLectureForm}
        onSaveLecture={saveLecture}
        quizForm={quizForm}
        setQuizForm={setQuizForm}
        onSaveQuiz={saveQuiz}
        resourceForm={resourceForm}
        setResourceForm={setResourceForm}
        onSaveResource={saveResource}
        questionForm={questionForm}
        setQuestionForm={setQuestionForm}
        onSaveQuestion={saveQuestion}
        editingUser={editingUser}
        setEditingUser={setEditingUser}
        userEditForm={userEditForm}
        setUserEditForm={setUserEditForm}
        onSaveUserEdit={saveManagedUser}
        deletingUser={deletingUser}
        setDeletingUser={setDeletingUser}
        onConfirmDeleteUser={deleteManagedUser}
        userActionId={userActionId}
        currentUserId={profile?.id}
        questionAlertOpen={questionAlertOpen}
        setQuestionAlertOpen={setQuestionAlertOpen}
        unansweredCount={unansweredCommunity.length}
        onGoToQA={() => {
          handleSelectNav("qa")
          setQuestionAlertOpen(false)
        }}
      />
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    siteContent: await loadSiteContent(),
    ...(await serverSideTranslations(locale ?? "en", ["common"])),
  },
})
