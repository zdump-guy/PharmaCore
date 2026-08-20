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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">{tr("Total Enrollments", "إجمالي التسجيلات")}</span>
              <div className="size-9 grid place-items-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="size-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground font-mono">{stats.total}</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">{tr("Active Students", "الطلاب المقبولون")}</span>
              <div className="size-9 grid place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <UserCheck className="size-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">{stats.active}</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                {tr("Pending Requests", "طلبات قيد الانتظار")}
              </span>
              <div className="size-9 grid place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                <Clock className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">{stats.pending}</p>
              {stats.pending > 0 && (
                <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 font-bold rounded-full px-2">
                  <span>{tr("Action needed", "يتطلب إجراء")}</span>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">{tr("Restricted Courses", "مقررات مقيدة")}</span>
              <div className="size-9 grid place-items-center rounded-xl bg-indigo-500/10 text-indigo-600">
                <Lock className="size-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground font-mono">
              {courses.filter((c) => c.access_policy === "enrolled_only").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── 2. PENDING REQUESTS FAST-ACTION QUEUE ───────────────────────── */}
      {pendingRequests.length > 0 && (
        <Card className="rounded-3xl border-amber-500/30 bg-amber-500/5 shadow-sm overflow-hidden">
          <CardHeader className="p-5 sm:p-6 pb-4 border-b border-amber-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 grid place-items-center rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  <Clock className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base sm:text-lg font-black text-amber-800 dark:text-amber-200">
                      {tr("Pending Course Enrollment Requests", "طلبات الانضمام للمقررات قيد المراجعة والاعتماد")}
                    </CardTitle>
                    <Badge className="bg-amber-500 text-white font-mono font-bold text-xs rounded-full px-2.5">
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
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleApproveAllPending}
                  disabled={batchActionLoading || loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-md shadow-emerald-600/20 rounded-full px-5 h-10"
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

          <CardContent className="p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                    className="rounded-3xl border border-amber-500/30 bg-card/90 p-4 space-y-3 shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="size-8 ring-1 ring-amber-500/30 shrink-0">
                            <AvatarFallback className="bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-xs">
                              {studentName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-bold text-xs truncate text-foreground">{studentName}</p>
                            <p className="text-[10px] text-muted-foreground truncate font-mono">{reqItem.user?.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[9px] font-bold border-amber-500/40 text-amber-700 dark:text-amber-300 shrink-0 rounded-full px-2">
                          {reqItem.enrolled_at ? new Date(reqItem.enrolled_at).toLocaleDateString() : tr("Recent", "حديث")}
                        </Badge>
                      </div>

                      <div className="rounded-2xl bg-muted/40 p-2.5 text-xs space-y-1 border border-border/60">
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
                        className="flex-1 h-9 text-xs font-bold gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      >
                        {isItemLoading ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5" />}
                        <span>{tr("Accept", "قبول")}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isItemLoading}
                        onClick={() => handleRejectEnrollment(reqItem.id, studentName)}
                        className="flex-1 h-9 text-xs font-bold gap-1.5 rounded-full shadow-sm"
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
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Manual Single Assign */}
        <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm overflow-hidden">
          <CardHeader className="p-6 pb-4 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="size-9 grid place-items-center rounded-xl bg-primary/10 text-primary">
                <UserPlus className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base font-black text-foreground">
                  {tr("Enroll Individual Student", "تسجيل طالب محدد في مقرر")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tr("Assign an active student to any course immediately with chosen status.", "إضافة طالب نشط إلى أي مقرر دراسي بشكل فوري مع تحديد الحالة.")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleAssignStudent} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">{tr("Select Student", "اختر الطالب")}</Label>
                <Select value={assignStudentId} onValueChange={setAssignStudentId}>
                  <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                    <SelectValue placeholder={tr("Choose an active student...", "اختر طالبًا نشطًا...")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 rounded-2xl">
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
                  <Label className="text-xs font-bold text-foreground">{tr("Target Course", "المقرر المستهدف")}</Label>
                  <Select value={assignCourseId} onValueChange={setAssignCourseId}>
                    <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                      <SelectValue placeholder={tr("Select course...", "اختر المقرر...")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {isAr ? c.title_ar || c.title_en : c.title_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">{tr("Initial Status", "الحالة المبدئية")}</Label>
                  <Select value={assignStatus} onValueChange={(val: CourseEnrollmentStatus) => setAssignStatus(val)}>
                    <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
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
                className="w-full h-11 rounded-full text-xs font-bold gap-2 shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 mt-2"
              >
                {assignLoading ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
                <span>{tr("Enroll Student in Course", "تسجيل الطالب في المقرر")}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Batch Cohort Auto-Enrollment */}
        <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm overflow-hidden">
          <CardHeader className="p-6 pb-4 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="size-9 grid place-items-center rounded-xl bg-indigo-500/10 text-indigo-600">
                <GraduationCap className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base font-black text-foreground">
                  {tr("Batch Cohort Auto-Enrollment", "تسجيل دفعة كاملة (جامعة / كلية)")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tr(
                    "Enroll all matching active students from a specific university or faculty in 1 click.",
                    "تسجيل جميع طلاب جامعة أو كلية معينة في مقرر محدد بضغطة زر واحدة."
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleBatchCohortEnroll} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">{tr("University Filter", "الجامعة")}</Label>
                  <Select value={cohortUni} onValueChange={setCohortUni}>
                    <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
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
                  <Label className="text-xs font-bold text-foreground">{tr("Faculty Filter", "الكلية")}</Label>
                  <Select value={cohortFac} onValueChange={setCohortFac}>
                    <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
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
                <Label className="text-xs font-bold text-foreground">{tr("Target Course to Enroll", "المقرر المستهدف")}</Label>
                <Select value={cohortCourseId} onValueChange={setCohortCourseId}>
                  <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                    <SelectValue placeholder={tr("Select course...", "اختر المقرر...")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {isAr ? c.title_ar || c.title_en : c.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-xs flex items-center justify-between">
                <span className="text-muted-foreground font-bold">{tr("Eligible Active Students:", "عدد الطلاب المؤهلين:")}</span>
                <span className="font-black font-mono text-primary">
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
                className="w-full h-11 rounded-full text-xs font-bold gap-2 shadow-md shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {cohortLoading ? <Loader2 className="size-3.5 animate-spin" /> : <GraduationCap className="size-3.5" />}
                <span>{tr("Batch Enroll Matching Cohort", "تسجيل الدفعة بالكامل في المقرر")}</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ─── 4. ENROLLMENTS ROSTER & FILTERABLE TABLE ─────────────────────── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card/90 border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm backdrop-blur-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="size-10 grid place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <Shield className="size-5" />
              </div>
              <h3 className="text-xl font-black tracking-tight text-foreground">
                {tr("Course Enrollments Roster", "سجل تسجيلات واشتراكات المقررات")}
              </h3>
              <Badge variant="secondary" className="text-xs font-mono font-bold">
                {filteredEnrollments.length} {tr("records", "سجل")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tr(
                "Filter, monitor, and manage student enrollment states and course authorizations.",
                "استعراض وتصفية وإدارة جميع اشتراكات الطلاب وصلاحيات وصولهم للمقررات."
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchEnrollments}
              disabled={loading}
              className="size-10 rounded-xl"
              title={tr("Refresh enrollments", "تحديث")}
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Course filter */}
          <div className="space-y-1">
            <Label className="text-xs font-bold text-foreground">{tr("Course", "المقرر")}</Label>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
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
          </div>

          {/* Status filter */}
          <div className="space-y-1">
            <Label className="text-xs font-bold text-foreground">{tr("Status", "الحالة")}</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                <SelectValue placeholder={tr("Filter by status", "تصفية حسب الحالة")} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
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
            <Label className="text-xs font-bold text-foreground">{tr("University", "الجامعة")}</Label>
            <Select value={universityFilter} onValueChange={setUniversityFilter}>
              <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                <SelectValue placeholder={tr("Filter by university", "تصفية حسب الجامعة")} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
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
            <Label className="text-xs font-bold text-foreground">{tr("Search", "بحث")}</Label>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={tr("Student, email, or course...", "بحث بالاسم أو البريد أو المقرر...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10 rounded-xl h-11 border-border/80 bg-background/60 text-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">
            <Loader2 className="mx-auto size-8 animate-spin text-primary" />
            <p className="mt-3 text-xs font-bold">{tr("Loading enrollments...", "جارٍ تحميل التسجيلات...")}</p>
          </div>
        ) : !filteredEnrollments.length ? (
          <div className="py-20 text-center border border-dashed border-border/80 rounded-3xl bg-card/50">
            <Shield className="mx-auto size-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-base font-black text-foreground">
              {tr("No course enrollments found.", "لم يتم العثور على تسجيلات في المقررات المحددة.")}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {tr("Use the forms above to enroll individual students or cohorts.", "استخدم النماذج أعلاه لتسجيل الطلاب أو الدفعات.")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-border/80 bg-card/90 shadow-sm">
            <table className="w-full text-start text-sm">
              <thead className="border-b border-border/60 bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 text-start whitespace-nowrap">{tr("Student", "الطالب")}</th>
                  <th className="px-5 py-4 text-start whitespace-nowrap">{tr("Enrolled Course", "المقرر المسجل به")}</th>
                  <th className="px-5 py-4 text-start whitespace-nowrap">{tr("University & Faculty", "الجامعة والكلية")}</th>
                  <th className="px-5 py-4 text-start whitespace-nowrap">{tr("Status", "الحالة")}</th>
                  <th className="px-5 py-4 text-start whitespace-nowrap">{tr("Date", "التاريخ")}</th>
                  <th className="px-5 py-4 text-end whitespace-nowrap">{tr("Actions", "الإجراءات")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
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
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 ring-2 ring-primary/20 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary font-black text-xs uppercase">
                              {studentName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate text-xs sm:text-sm">{studentName}</p>
                            <p className="text-xs text-muted-foreground truncate font-mono">{item.user?.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="size-4 text-primary shrink-0" />
                          <span className="font-bold text-xs truncate max-w-[220px] text-foreground">{courseTitle}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        <p className="font-bold text-foreground truncate max-w-[180px]">{item.user?.university || "—"}</p>
                        <p className="text-[11px] truncate max-w-[180px]">{item.user?.faculty || "—"}</p>
                      </td>

                      <td className="px-5 py-4">
                        {item.status === "active" ? (
                          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] rounded-full px-2.5">
                            <Check className="size-2.5 me-1" />
                            <span>{tr("Active", "نشط ومقبول")}</span>
                          </Badge>
                        ) : item.status === "pending" ? (
                          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-[10px] rounded-full px-2.5 animate-pulse">
                            <Clock className="size-2.5 me-1" />
                            <span>{tr("Pending", "قيد الانتظار")}</span>
                          </Badge>
                        ) : item.status === "rejected" ? (
                          <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive font-bold text-[10px] rounded-full px-2.5">
                            <X className="size-2.5 me-1" />
                            <span>{tr("Rejected", "مرفوض")}</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] rounded-full px-2.5">
                            <CheckCircle2 className="size-2.5 me-1" />
                            <span>{tr("Completed", "مكتمل")}</span>
                          </Badge>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {item.enrolled_at ? new Date(item.enrolled_at).toLocaleDateString() : "—"}
                      </td>

                      <td className="px-5 py-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-xs font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 rounded-full"
                                disabled={isActionLoading}
                                onClick={() => handleApproveEnrollment(item.id, studentName)}
                                title={tr("Approve Enrollment", "قبول")}
                              >
                                {isActionLoading ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                                <span className="ms-1">{tr("Accept", "قبول")}</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="size-8 p-0 text-destructive hover:bg-destructive/10 rounded-full"
                                disabled={isActionLoading}
                                onClick={() => handleRejectEnrollment(item.id, studentName)}
                                title={tr("Deny Request", "رفض")}
                              >
                                <X className="size-3.5" />
                              </Button>
                            </>
                          )}

                          {item.status === "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 rounded-full"
                              disabled={isActionLoading}
                              onClick={() => handleApproveEnrollment(item.id, studentName)}
                              title={tr("Re-Approve Enrollment", "إعادة القبول")}
                            >
                              <Check className="size-3" />
                              <span className="ms-1">{tr("Re-Accept", "إعادة القبول")}</span>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
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
