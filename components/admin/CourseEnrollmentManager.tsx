import React, { useState, useEffect, useCallback } from "react"
import {
  FiBookOpen as BookOpen,
  FiCheck as Check,
  FiCheckCircle as CheckCircle2,
  FiClock as Clock,
  FiLoader as Loader2,
  FiLock as Lock,
  FiRefreshCw as RefreshCw,
  FiSearch as Search,
  FiShield as Shield,
  FiTrash2 as Trash2,
  FiUserCheck as UserCheck,
  FiUserPlus as UserPlus,
  FiX as X,
} from "react-icons/fi"
import { FaGraduationCap as GraduationCap } from "react-icons/fa6"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertTitle } from "@/components/ui/alert"
import type { Course, EnrollmentSettings, UserProfile, CourseEnrollmentStatus } from "@/types"

export interface CourseEnrollmentRecord {
  id: string
  user_id: string
  course_id: string
  status: CourseEnrollmentStatus
  enrolled_at: string
  user?: {
    id?: string
    email?: string
    full_name?: string
    first_name?: string
    last_name?: string
    role?: string
    status?: string
    university?: string
    faculty?: string
    phone_number?: string
  }
  course?: {
    id?: string
    title_en?: string
    title_ar?: string
    thumbnail_url?: string
    access_policy?: string
  }
}

interface CourseEnrollmentManagerProps {
  isAr: boolean
  token: string | null
  courses: Course[]
  enrollmentSettings: EnrollmentSettings
  initialCourseFilter?: string
  onEnrollmentsUpdated?: (pendingCount: number) => void
}

export default function CourseEnrollmentManager({
  isAr,
  token,
  courses = [],
  enrollmentSettings,
  initialCourseFilter = "all",
  onEnrollmentsUpdated,
}: CourseEnrollmentManagerProps) {
  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const [courseFilter, setCourseFilter] = useState<string>(initialCourseFilter)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [universityFilter, setUniversityFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const [enrollments, setEnrollments] = useState<CourseEnrollmentRecord[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, rejected: 0, completed: 0 })
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [batchActionLoading, setBatchActionLoading] = useState(false)
  const [bannerMessage, setBannerMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Students list for manual assign
  const [students, setStudents] = useState<UserProfile[]>([])

  // Single Manual Assign Form
  const [assignStudentId, setAssignStudentId] = useState<string>("")
  const [assignCourseId, setAssignCourseId] = useState<string>(initialCourseFilter !== "all" ? initialCourseFilter : "")
  const [assignStatus, setAssignStatus] = useState<CourseEnrollmentStatus>("active")
  const [assignLoading, setAssignLoading] = useState(false)

  // Batch Cohort Assign Form
  const [cohortUni, setCohortUni] = useState<string>("all")
  const [cohortFac, setCohortFac] = useState<string>("all")
  const [cohortCourseId, setCohortCourseId] = useState<string>(initialCourseFilter !== "all" ? initialCourseFilter : "")
  const [cohortLoading, setCohortLoading] = useState(false)

  // Update initial filter when prop changes
  useEffect(() => {
    if (initialCourseFilter && initialCourseFilter !== "all") {
      setCourseFilter(initialCourseFilter)
      setAssignCourseId((prev) => (prev ? prev : initialCourseFilter))
      setCohortCourseId((prev) => (prev ? prev : initialCourseFilter))
    }
  }, [initialCourseFilter])

  // Fetch Enrollments
  const fetchEnrollments = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      let url = `/api/admin/students/enrollments?status=${statusFilter}`
      if (courseFilter && courseFilter !== "all") {
        url += `&courseId=${courseFilter}`
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setEnrollments(data.enrollments || [])
        if (data.stats) setStats(data.stats)
        if (onEnrollmentsUpdated) {
          onEnrollmentsUpdated(data.pendingCount || 0)
        }
      }
    } catch (err) {
      console.error("Failed to load course enrollments:", err)
    } finally {
      setLoading(false)
    }
  }, [token, courseFilter, statusFilter, onEnrollmentsUpdated])

  // Fetch Active Students for assignment
  const fetchStudents = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch("/api/admin/students?status=active", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStudents(data.students || [])
      }
    } catch (err) {
      console.error("Failed to load students for enrollment:", err)
    }
  }, [token])

  useEffect(() => {
    fetchEnrollments()
  }, [fetchEnrollments])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  // Clear banner after 5 seconds
  useEffect(() => {
    if (bannerMessage) {
      const timer = setTimeout(() => setBannerMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [bannerMessage])

  // ─── Fast Approve / Reject Actions ──────────────────────────────────────────
  const handleApproveEnrollment = async (enrollmentId: string, studentName: string) => {
    if (!token) return
    setActionLoadingId(enrollmentId)
    try {
      const res = await fetch("/api/admin/students/enrollments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "approve", enrollmentId }),
      })
      const data = await res.json()
      if (res.ok) {
        setBannerMessage({
          type: "success",
          text: tr(
            `Enrolled & Approved ${studentName} successfully!`,
            `تم قبول واعتماد تسجيل ${studentName} بنجاح!`
          ),
        })
        fetchEnrollments()
      } else {
        setBannerMessage({ type: "error", text: data.error || "Failed to approve enrollment" })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRejectEnrollment = async (enrollmentId: string, studentName: string) => {
    if (!token) return
    if (!confirm(tr(`Deny enrollment request for ${studentName}?`, `هل أنت متأكد من رفض طلب تسجيل ${studentName}؟`))) return
    setActionLoadingId(enrollmentId)
    try {
      const res = await fetch("/api/admin/students/enrollments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "reject", enrollmentId }),
      })
      const data = await res.json()
      if (res.ok) {
        setBannerMessage({
          type: "success",
          text: tr(`Enrollment request for ${studentName} declined.`, `تم رفض طلب تسجيل ${studentName}.`),
        })
        fetchEnrollments()
      } else {
        setBannerMessage({ type: "error", text: data.error || "Failed to reject enrollment" })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoadingId(null)
    }
  }

  // ─── Batch Approve All Pending Requests ─────────────────────────────────────
  const handleApproveAllPending = async () => {
    const pendingList = enrollments.filter((e) => e.status === "pending")
    if (!pendingList.length || !token) return

    const confirmMsg = isAr
      ? `هل أنت متأكد من قبول واعتماد جميع طلبات التسجيل المعلقة (${pendingList.length} طلب) دفعة واحدة؟`
      : `Are you sure you want to approve all ${pendingList.length} pending enrollment request(s)?`
    if (!confirm(confirmMsg)) return

    setBatchActionLoading(true)
    try {
      const res = await fetch("/api/admin/students/enrollments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: "approve",
          enrollmentIds: pendingList.map((e) => e.id),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setBannerMessage({
          type: "success",
          text: tr(
            `Successfully approved all ${pendingList.length} student requests!`,
            `تم قبول واعتماد جميع الطلبات (${pendingList.length} طالب) بنجاح!`
          ),
        })
        fetchEnrollments()
      } else {
        setBannerMessage({ type: "error", text: data.error || "Failed to batch approve" })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setBatchActionLoading(false)
    }
  }

  // ─── Remove / Unenroll Record ───────────────────────────────────────────────
  const handleRemoveEnrollment = async (enrollmentId: string, studentName: string) => {
    if (!token) return
    if (!confirm(tr(`Unenroll ${studentName} and remove record?`, `إلغاء تسجيل ${studentName} وحذف السجل؟`))) return
    setActionLoadingId(enrollmentId)
    try {
      const res = await fetch("/api/admin/students/enrollments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enrollmentId }),
      })
      if (res.ok) {
        setBannerMessage({
          type: "success",
          text: tr("Enrollment removed successfully.", "تم حذف وإلغاء التسجيل بنجاح."),
        })
        fetchEnrollments()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoadingId(null)
    }
  }

  // ─── Single Student Manual Assign ───────────────────────────────────────────
  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !assignStudentId || !assignCourseId) {
      alert(tr("Please select both a student and a course", "يرجى اختيار كل من الطالب والمقرر"))
      return
    }
    setAssignLoading(true)
    try {
      const res = await fetch("/api/admin/students/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          studentId: assignStudentId,
          courseId: assignCourseId,
          status: assignStatus,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setBannerMessage({
          type: "success",
          text: tr("Student successfully assigned to course!", "تم تسجيل الطالب في المقرر بنجاح!"),
        })
        setAssignStudentId("")
        fetchEnrollments()
      } else {
        alert(data.error || "Failed to assign course")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAssignLoading(false)
    }
  }

  // ─── Batch Cohort Enroll ───────────────────────────────────────────────────
  const handleBatchCohortEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !cohortCourseId) {
      alert(tr("Please select a target course", "يرجى اختيار المقرر المستهدف"))
      return
    }

    const matchingStudents = students.filter((s) => {
      if (cohortUni !== "all" && s.university !== cohortUni) return false
      if (cohortFac !== "all" && s.faculty !== cohortFac) return false
      return s.status === "active"
    })

    if (!matchingStudents.length) {
      alert(tr("No active students found matching the selected filters.", "لم يتم العثور على طلاب نشطين يطابقون الاختيار."))
      return
    }

    const confirmMsg = isAr
      ? `هل أنت متأكد من تسجيل ${matchingStudents.length} طالب في المقرر المختار دفعة واحدة؟`
      : `Are you sure you want to enroll ${matchingStudents.length} student(s) in this course at once?`
    if (!confirm(confirmMsg)) return

    setCohortLoading(true)
    try {
      const res = await fetch("/api/admin/students/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          studentIds: matchingStudents.map((s) => s.id),
          courseId: cohortCourseId,
          status: "active",
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setBannerMessage({
          type: "success",
          text: tr(
            `Successfully enrolled ${data.enrolledCount || matchingStudents.length} students!`,
            `تم تسجيل ${data.enrolledCount || matchingStudents.length} طالب بنجاح!`
          ),
        })
        fetchEnrollments()
      } else {
        alert(data.error || "Failed to batch enroll")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCohortLoading(false)
    }
  }

  // ─── Filtered Data ──────────────────────────────────────────────────────────
  const pendingRequests = enrollments.filter((e) => e.status === "pending")

  const filteredEnrollments = enrollments.filter((item) => {
    // University filter
    if (universityFilter !== "all" && item.user?.university !== universityFilter) {
      return false
    }

    // Text search query
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    const studentName = (item.user?.full_name || `${item.user?.first_name || ""} ${item.user?.last_name || ""}` || "").toLowerCase()
    const studentEmail = (item.user?.email || "").toLowerCase()
    const courseTitle = (item.course?.title_en || item.course?.title_ar || "").toLowerCase()
    const uni = (item.user?.university || "").toLowerCase()
    const fac = (item.user?.faculty || "").toLowerCase()

    return studentName.includes(q) || studentEmail.includes(q) || courseTitle.includes(q) || uni.includes(q) || fac.includes(q)
  })

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* Banner alert */}
      {bannerMessage && (
        <Alert
          className={
            bannerMessage.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }
        >
          {bannerMessage.type === "success" ? (
            <CheckCircle2 className="size-4 text-emerald-600" />
          ) : (
            <X className="size-4 text-destructive" />
          )}
          <AlertTitle className="text-xs sm:text-sm font-bold">{bannerMessage.text}</AlertTitle>
        </Alert>
      )}

      {/* ─── 1. TOP METRICS & STATS ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <Card className="card-equal shadow-none">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase whitespace-nowrap">{tr("Total Enrollments", "إجمالي التسجيلات")}</span>
              <BookOpen className="size-4 text-primary shrink-0" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black">{stats.total}</p>
          </CardContent>
        </Card>

        <Card className="card-equal shadow-none">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase whitespace-nowrap">{tr("Active Students", "الطلاب المقبولون")}</span>
              <UserCheck className="size-4 text-emerald-600 shrink-0" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600">{stats.active}</p>
          </CardContent>
        </Card>

        <Card className={`card-equal shadow-none ${stats.pending > 0 ? "border-amber-500/40 bg-amber-500/5" : ""}`}>
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase text-amber-700 dark:text-amber-300 whitespace-nowrap">
                {tr("Pending Requests", "طلبات قيد الانتظار")}
              </span>
              <Clock className="size-4 text-amber-600 shrink-0" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-black text-amber-600">{stats.pending}</p>
              {stats.pending > 0 && (
                <Badge className="bg-amber-500 text-white font-mono font-bold text-[10px] animate-pulse">
                  {tr("Action needed", "يتطلب إجراء")}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase">{tr("Restricted Courses", "مقررات مقيدة")}</span>
              <Lock className="size-4 text-purple-600" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-purple-600">
              {courses.filter((c) => c.access_policy === "enrolled_only").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── 2. PENDING REQUESTS FAST-ACTION QUEUE ───────────────────────── */}
      {pendingRequests.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5 shadow-xs overflow-hidden">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-amber-500/20 bg-amber-500/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="size-5 text-amber-600" />
                  <CardTitle className="text-base sm:text-lg font-extrabold text-amber-950 dark:text-amber-100">
                    {tr("Pending Course Enrollment Requests", "طلبات الانضمام للمقررات قيد المراجعة والاعتماد")}
                  </CardTitle>
                  <Badge className="bg-amber-500 text-white font-mono font-bold text-xs">
                    {pendingRequests.length} {tr("requests", "طلب")}
                  </Badge>
                </div>
                <CardDescription className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-1">
                  {tr(
                    "Review student enrollment applications and grant or deny access to restricted courses.",
                    "مراجعة طلبات انضمام الطلاب للمقررات المقيدة وقبولها أو رفضها بضغطة زر واحدة."
                  )}
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleApproveAllPending}
                  disabled={batchActionLoading || loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 text-xs shadow-xs h-9"
                >
                  {batchActionLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )}
                  <span>{tr("Approve All Requests", "قبول واعتماد الكل")}</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pendingRequests.map((reqItem) => {
                const studentName =
                  reqItem.user?.full_name ||
                  `${reqItem.user?.first_name || ""} ${reqItem.user?.last_name || ""}`.trim() ||
                  reqItem.user?.email ||
                  tr("Student", "طالب")
                const courseTitle = isAr
                  ? reqItem.course?.title_ar || reqItem.course?.title_en || tr("Course", "مقرر")
                  : reqItem.course?.title_en || reqItem.course?.title_ar || tr("Course", "مقرر")
                const isItemLoading = actionLoadingId === reqItem.id

                return (
                  <div
                    key={reqItem.id}
                    className="rounded-xl border border-amber-500/30 bg-card p-3.5 space-y-3 shadow-2xs flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="grid size-8 place-items-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-xs shrink-0">
                            {studentName.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-xs truncate">{studentName}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{reqItem.user?.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-700 dark:text-amber-300 shrink-0">
                          {reqItem.enrolled_at ? new Date(reqItem.enrolled_at).toLocaleDateString() : tr("Recent", "حديث")}
                        </Badge>
                      </div>

                      <div className="rounded-lg bg-muted/30 p-2 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-primary truncate">
                          <BookOpen className="size-3 shrink-0" />
                          <span className="truncate">{courseTitle}</span>
                        </div>
                        {(reqItem.user?.university || reqItem.user?.faculty) && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {reqItem.user.university} {reqItem.user.faculty ? `• ${reqItem.user.faculty}` : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        disabled={isItemLoading}
                        onClick={() => handleApproveEnrollment(reqItem.id, studentName)}
                        className="flex-1 h-8 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isItemLoading ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5" />}
                        <span>{tr("Accept", "قبول")}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isItemLoading}
                        onClick={() => handleRejectEnrollment(reqItem.id, studentName)}
                        className="flex-1 h-8 text-xs font-bold gap-1"
                      >
                        <X className="size-3.5" />
                        <span>{tr("Deny", "رفض")}</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── 3. ENROLLMENT PROVISIONING TOOLS (Single & Cohort) ──────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Manual Single Assign */}
        <Card className="border rounded-2xl shadow-xs">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <UserPlus className="size-4 text-primary" />
              <CardTitle className="text-sm sm:text-base font-bold">
                {tr("Enroll Individual Student", "تسجيل طالب محدد في مقرر")}
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              {tr("Assign an active student to any course immediately with chosen status.", "إضافة طالب نشط إلى أي مقرر دراسي بشكل فوري مع تحديد الحالة.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleAssignStudent} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{tr("Select Student", "اختر الطالب")}</Label>
                <Select value={assignStudentId} onValueChange={setAssignStudentId}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder={tr("Choose an active student...", "اختر طالبًا نشطًا...")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {students
                      .filter((s) => s.status === "active")
                      .map((s) => {
                        const name = s.full_name || `${s.first_name || ""} ${s.last_name || ""}`.trim() || s.email
                        return (
                          <SelectItem key={s.id} value={s.id}>
                            {name} ({s.email}) {s.university ? `• ${s.university}` : ""}
                          </SelectItem>
                        )
                      })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{tr("Target Course", "المقرر المستهدف")}</Label>
                  <Select value={assignCourseId} onValueChange={setAssignCourseId}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder={tr("Select course...", "اختر المقرر...")} />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {isAr ? c.title_ar || c.title_en : c.title_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{tr("Initial Status", "الحالة المبدئية")}</Label>
                  <Select value={assignStatus} onValueChange={(val: CourseEnrollmentStatus) => setAssignStatus(val)}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{tr("Active (Access Granted)", "نشط (مسموح بالوصول)")}</SelectItem>
                      <SelectItem value="pending">{tr("Pending (Under Review)", "معلق (قيد المراجعة)")}</SelectItem>
                      <SelectItem value="completed">{tr("Completed Course", "مكتمل")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={assignLoading || !assignStudentId || !assignCourseId}
                className="w-full h-9 text-xs font-bold gap-2 mt-2"
              >
                {assignLoading ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
                <span>{tr("Enroll Student in Course", "تسجيل الطالب في المقرر")}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Batch Cohort Auto-Enrollment */}
        <Card className="border rounded-2xl shadow-xs">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-purple-600 dark:text-purple-400" />
              <CardTitle className="text-sm sm:text-base font-bold">
                {tr("Batch Cohort Auto-Enrollment", "تسجيل دفعة كاملة (جامعة / كلية)")}
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              {tr(
                "Enroll all matching active students from a specific university or faculty in 1 click.",
                "تسجيل جميع طلاب جامعة أو كلية معينة في مقرر محدد بضغطة زر واحدة."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleBatchCohortEnroll} className="space-y-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{tr("University Filter", "الجامعة")}</Label>
                  <Select value={cohortUni} onValueChange={setCohortUni}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tr("All Universities", "جميع الجامعات")}</SelectItem>
                      {enrollmentSettings.universities?.map((u) => (
                        <SelectItem key={u.id} value={isAr ? u.name_ar : u.name_en}>
                          {isAr ? u.name_ar : u.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{tr("Faculty Filter", "الكلية")}</Label>
                  <Select value={cohortFac} onValueChange={setCohortFac}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tr("All Faculties", "جميع الكليات")}</SelectItem>
                      {enrollmentSettings.faculties?.map((f) => (
                        <SelectItem key={f.id} value={isAr ? f.name_ar : f.name_en}>
                          {isAr ? f.name_ar : f.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{tr("Target Course to Enroll", "المقرر المستهدف")}</Label>
                <Select value={cohortCourseId} onValueChange={setCohortCourseId}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder={tr("Select course...", "اختر المقرر...")} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {isAr ? c.title_ar || c.title_en : c.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border bg-muted/20 px-3 py-2 text-xs flex items-center justify-between">
                <span className="text-muted-foreground">{tr("Eligible Active Students:", "عدد الطلاب المؤهلين:")}</span>
                <span className="font-bold font-mono text-primary">
                  {
                    students.filter((s) => {
                      if (cohortUni !== "all" && s.university !== cohortUni) return false
                      if (cohortFac !== "all" && s.faculty !== cohortFac) return false
                      return s.status === "active"
                    }).length
                  }{" "}
                  {tr("students", "طالب")}
                </span>
              </div>

              <Button
                type="submit"
                disabled={cohortLoading || !cohortCourseId}
                className="w-full h-9 text-xs font-bold gap-2 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {cohortLoading ? <Loader2 className="size-3.5 animate-spin" /> : <GraduationCap className="size-3.5" />}
                <span>{tr("Batch Enroll Matching Cohort", "تسجيل الدفعة بالكامل في المقرر")}</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ─── 4. ENROLLMENTS ROSTER & FILTERABLE TABLE ─────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border rounded-2xl p-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                {tr("Course Enrollments Roster", "سجل تسجيلات واشتراكات المقررات")}
              </h3>
              <Badge variant="secondary" className="text-xs font-mono font-bold">
                {filteredEnrollments.length} {tr("records", "سجل")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tr(
                "Filter, monitor, and manage student enrollment states and course authorizations.",
                "استعراض وتصفية وإدارة جميع اشتراكات الطلاب وصلاحيات وصولهم للمقررات."
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchEnrollments}
              disabled={loading}
              className="size-9 p-0 shadow-xs shrink-0"
              title={tr("Refresh enrollments", "تحديث")}
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 bg-card border rounded-2xl p-3 shadow-xs">
          {/* Course filter */}
          <div className="space-y-1">
            <Label className="text-[11px] font-bold text-muted-foreground">{tr("Course", "المقرر")}</Label>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="h-9 text-xs">
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
          </div>

          {/* Status filter */}
          <div className="space-y-1">
            <Label className="text-[11px] font-bold text-muted-foreground">{tr("Status", "الحالة")}</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={tr("Filter by status", "تصفية حسب الحالة")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tr("All Statuses", "جميع الحالات")}</SelectItem>
                <SelectItem value="active">{tr("Active (Approved)", "نشط ومقبول")}</SelectItem>
                <SelectItem value="pending">{tr("Pending Approval", "قيد الانتظار")}</SelectItem>
                <SelectItem value="rejected">{tr("Rejected / Denied", "مرفوض")}</SelectItem>
                <SelectItem value="completed">{tr("Completed", "مكتمل")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* University filter */}
          <div className="space-y-1">
            <Label className="text-[11px] font-bold text-muted-foreground">{tr("University", "الجامعة")}</Label>
            <Select value={universityFilter} onValueChange={setUniversityFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={tr("Filter by university", "تصفية حسب الجامعة")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tr("All Universities", "جميع الجامعات")}</SelectItem>
                {enrollmentSettings.universities?.map((u) => (
                  <SelectItem key={u.id} value={isAr ? u.name_ar : u.name_en}>
                    {isAr ? u.name_ar : u.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Input */}
          <div className="space-y-1">
            <Label className="text-[11px] font-bold text-muted-foreground">{tr("Search", "بحث")}</Label>
            <div className="relative">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder={tr("Student, email, or course...", "بحث بالاسم أو البريد أو المقرر...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-8 text-xs h-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="grid min-h-48 place-items-center rounded-2xl border bg-card p-8">
            <Loader2 className="size-8 animate-spin text-primary opacity-60" />
          </div>
        ) : !filteredEnrollments.length ? (
          <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed bg-card p-8 text-center text-muted-foreground">
            <div>
              <Shield className="mx-auto size-8 opacity-40" />
              <p className="mt-2 font-bold text-sm">
                {tr("No course enrollments found.", "لم يتم العثور على تسجيلات في المقررات المحددة.")}
              </p>
              <p className="text-xs mt-1">
                {tr("Use the forms above to enroll individual students or cohorts.", "استخدم النماذج أعلاه لتسجيل الطلاب أو الدفعات.")}
              </p>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-start text-sm min-w-[650px]">
              <thead className="border-b bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3.5 text-start whitespace-nowrap">{tr("Student", "الطالب")}</th>
                  <th className="px-4 py-3.5 text-start whitespace-nowrap">{tr("Enrolled Course", "المقرر المسجل به")}</th>
                  <th className="px-4 py-3.5 text-start whitespace-nowrap">{tr("University & Faculty", "الجامعة والكلية")}</th>
                  <th className="px-4 py-3.5 text-start whitespace-nowrap">{tr("Status", "الحالة")}</th>
                  <th className="px-4 py-3.5 text-start whitespace-nowrap">{tr("Date", "التاريخ")}</th>
                  <th className="px-4 py-3.5 text-end whitespace-nowrap">{tr("Actions", "الإجراءات")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEnrollments.map((item) => {
                  const studentName =
                    item.user?.full_name ||
                    `${item.user?.first_name || ""} ${item.user?.last_name || ""}`.trim() ||
                    item.user?.email ||
                    tr("Student", "طالب")
                  const courseTitle = isAr
                    ? item.course?.title_ar || item.course?.title_en || tr("Course", "مقرر")
                    : item.course?.title_en || item.course?.title_ar || tr("Course", "مقرر")
                  const isActionLoading = actionLoadingId === item.id

                  return (
                    <tr key={item.id} className="hover:bg-muted/25 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                            {studentName.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-xs truncate">{studentName}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{item.user?.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <BookOpen className="size-3.5 text-primary shrink-0" />
                          <span className="font-semibold text-xs truncate max-w-[220px]">{courseTitle}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        <p className="truncate max-w-[180px]">{item.user?.university || "—"}</p>
                        <p className="text-[10px] truncate max-w-[180px]">{item.user?.faculty || "—"}</p>
                      </td>

                      <td className="px-4 py-3.5">
                        {item.status === "active" ? (
                          <Badge variant="secondary" className="badge-nowrap text-[10px] gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
                            <Check className="size-2.5 shrink-0" />
                            <span>{tr("Active", "نشط ومقبول")}</span>
                          </Badge>
                        ) : item.status === "pending" ? (
                          <Badge variant="secondary" className="badge-nowrap text-[10px] gap-1 border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold animate-pulse shrink-0">
                            <Clock className="size-2.5 shrink-0" />
                            <span>{tr("Pending", "قيد الانتظار")}</span>
                          </Badge>
                        ) : item.status === "rejected" ? (
                          <Badge variant="secondary" className="badge-nowrap text-[10px] gap-1 border-destructive/30 text-destructive font-bold shrink-0">
                            <X className="size-2.5 shrink-0" />
                            <span>{tr("Rejected", "مرفوض")}</span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="badge-nowrap text-[10px] gap-1 border-blue-500/30 text-blue-700 dark:text-blue-300 font-bold shrink-0">
                            <CheckCircle2 className="size-2.5 shrink-0" />
                            <span>{tr("Completed", "مكتمل")}</span>
                          </Badge>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {item.enrolled_at ? new Date(item.enrolled_at).toLocaleDateString() : "—"}
                      </td>

                      <td className="px-4 py-3.5 text-end">
                        <div className="flex items-center justify-end gap-1">
                          {item.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="btn-nowrap h-7 px-2 text-xs font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 shrink-0"
                                disabled={isActionLoading}
                                onClick={() => handleApproveEnrollment(item.id, studentName)}
                                title={tr("Approve Enrollment", "قبول")}
                              >
                                {isActionLoading ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                                <span>{tr("Accept", "قبول")}</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="btn-nowrap h-7 px-2 text-xs font-bold text-destructive border-destructive/30 hover:bg-destructive/10 gap-1 shrink-0"
                                disabled={isActionLoading}
                                onClick={() => handleRejectEnrollment(item.id, studentName)}
                                title={tr("Deny Request", "رفض")}
                              >
                                <X className="size-3" />
                                <span>{tr("Deny", "رفض")}</span>
                              </Button>
                            </>
                          )}

                          {item.status === "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="btn-nowrap h-7 px-2 text-xs font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 shrink-0"
                              disabled={isActionLoading}
                              onClick={() => handleApproveEnrollment(item.id, studentName)}
                              title={tr("Re-Approve Enrollment", "إعادة القبول")}
                            >
                              <Check className="size-3" />
                              <span>{tr("Re-Accept", "إعادة القبول")}</span>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            disabled={isActionLoading}
                            onClick={() => handleRemoveEnrollment(item.id, studentName)}
                            title={tr("Remove Enrollment", "حذف التسجيل")}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
