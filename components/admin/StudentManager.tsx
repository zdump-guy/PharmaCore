import { useState, useEffect, useCallback } from "react"
import {
  FiBookOpen as BookOpen,
  FiCheck as Check,
  FiCheckCircle as CheckCircle2,
  FiClock as Clock,
  FiDownload as Download,
  FiLoader as Loader2,
  FiLock as LockKeyhole,
  FiPhone as Phone,
  FiPlus as Plus,
  FiRefreshCw as RefreshCw,
  FiSearch as Search,
  FiShield as Shield,
  FiTrash2 as Trash2,
  FiUserCheck as UserCheck,
  FiUserPlus as UserPlus,
  FiUserX as UserX,
  FiUsers as Users,
  FiX as X,
  FiZap as Zap,
} from "react-icons/fi"
import { FaGraduationCap as GraduationCap } from "react-icons/fa6"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { UserProfile, University, Faculty, EnrollmentSettings, SignupMode, Course } from "@/types"

export interface CourseEnrollmentItem {
  id: string
  user_id: string
  course_id: string
  status: "active" | "pending" | "completed"
  enrolled_at: string
  user?: {
    id?: string
    email?: string
    full_name?: string
    university?: string
    faculty?: string
  }
  course?: {
    id?: string
    title_en?: string
    title_ar?: string
  }
}

interface StudentManagerProps {
  isAr: boolean
  token: string | null
  courses?: Course[]
  enrollmentSettings: EnrollmentSettings
  subTab?: "roster" | "pending" | "controller" | "directories" | "provision"
  onUpdateEnrollmentSettings: (newSettings: EnrollmentSettings) => Promise<void>
}

export default function StudentManager({
  isAr,
  token,
  courses = [],
  enrollmentSettings,
  subTab: controlledSubTab,
  onUpdateEnrollmentSettings,
}: StudentManagerProps) {
  const subTab = controlledSubTab || "roster"
  const [students, setStudents] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [universityFilter, setUniversityFilter] = useState<string>("all")
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, suspended: 0, needsSetup: 0 })
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState("")

  // Provisioning form
  const [provMode, setProvMode] = useState<"batch" | "single">("batch")
  const [provEmail, setProvEmail] = useState("")
  const [provPassword, setProvPassword] = useState("Pharma@2026")
  const [provFirstName, setProvFirstName] = useState("")
  const [provLastName, setProvLastName] = useState("")
  const [provUniversity, setProvUniversity] = useState("")
  const [provFaculty, setProvFaculty] = useState("")
  const [provStartYear, setProvStartYear] = useState<number>(new Date().getFullYear())
  const [provMustSetup, setProvMustSetup] = useState(true)
  const [provLoading, setProvLoading] = useState(false)
  const [provResult, setProvResult] = useState<{ email: string; pass: string } | null>(null)

  // Batch provisioning state
  const [batchCount, setBatchCount] = useState<number>(5)
  const [batchPrefix, setBatchPrefix] = useState("student")
  const [batchDomain, setBatchDomain] = useState("pharmacore.edu")
  const [batchPassword, setBatchPassword] = useState("Pharma@2026")
  const [batchResults, setBatchResults] = useState<
    Array<{
      id: string
      email: string
      password: string
      university: string
      faculty: string
      start_year: number
      status: string
      created_at: string
    }>
  >([])

  // Directory managers
  const [newUniEn, setNewUniEn] = useState("")
  const [newUniAr, setNewUniAr] = useState("")
  const [newFacEn, setNewFacEn] = useState("")
  const [newFacAr, setNewFacAr] = useState("")
  const [newFacDuration, setNewFacDuration] = useState<number>(5)
  const [savingSettings, setSavingSettings] = useState(false)

  // Student specific course access modal
  const [managingStudent, setManagingStudent] = useState<UserProfile | null>(null)
  const [studentEnrolledCourseIds, setStudentEnrolledCourseIds] = useState<string[]>([])
  const [loadingStudentCourses, setLoadingStudentCourses] = useState(false)
  const [savingStudentCourses, setSavingStudentCourses] = useState(false)

  const tr = (en: string, ar: string) => (isAr ? ar : en)

  // Fetch student roster
  const fetchStudents = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/students?search=${encodeURIComponent(search)}&status=${statusFilter}&university=${encodeURIComponent(
          universityFilter
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (res.ok) {
        const data = await res.json()
        setStudents(data.students || [])
        if (data.stats) setStats(data.stats)
      }
    } catch (err) {
      console.error("Failed to load students:", err)
    } finally {
      setLoading(false)
    }
  }, [token, search, statusFilter, universityFilter])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  // Student specific course access modal
  const handleOpenStudentCourses = async (student: UserProfile) => {
    setManagingStudent(student)
    setLoadingStudentCourses(true)
    try {
      const res = await fetch(`/api/admin/students/enrollments?studentId=${student.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const enrolledIds = (data.enrollments || []).map((e: { course_id: string }) => e.course_id)
        setStudentEnrolledCourseIds(enrolledIds)
      } else {
        setStudentEnrolledCourseIds([])
      }
    } catch (err) {
      console.error(err)
      setStudentEnrolledCourseIds([])
    } finally {
      setLoadingStudentCourses(false)
    }
  }

  const handleToggleCourseForStudent = async (courseId: string, currentlyEnrolled: boolean) => {
    if (!token || !managingStudent) return
    setSavingStudentCourses(true)
    try {
      if (currentlyEnrolled) {
        const res = await fetch("/api/admin/students/enrollments", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ studentId: managingStudent.id, courseId }),
        })
        if (res.ok) {
          setStudentEnrolledCourseIds((prev) => prev.filter((id) => id !== courseId))
        }
      } else {
        const res = await fetch("/api/admin/students/enrollments", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ studentId: managingStudent.id, courseId, status: "active" }),
        })
        if (res.ok) {
          setStudentEnrolledCourseIds((prev) => [...prev, courseId])
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingStudentCourses(false)
    }
  }

  // Actions
  const handleApprove = async (id: string) => {
    setActionLoadingId(id)
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "approve", studentId: id }),
      })
      if (res.ok) {
        setSuccessBanner(tr("Student account approved!", "تم اعتماد حساب الطالب بنجاح!"))
        fetchStudents()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReject = async (id: string) => {
    if (!confirm(tr("Are you sure you want to reject this registration?", "هل أنت متأكد من رفض هذا الطلب؟"))) return
    setActionLoadingId(id)
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "reject", studentId: id }),
      })
      if (res.ok) {
        setSuccessBanner(tr("Registration rejected and removed.", "تم رفض الطلب وحذفه."))
        fetchStudents()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleSuspend = async (id: string, targetStatus: "active" | "suspended") => {
    setActionLoadingId(id)
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "suspend", studentId: id, status: targetStatus }),
      })
      if (res.ok) {
        setSuccessBanner(
          targetStatus === "suspended"
            ? tr("Student account suspended.", "تم إيقاف حساب الطالب.")
            : tr("Student account reactivated.", "تم إعادة تفعيل الحساب.")
        )
        fetchStudents()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(tr("Are you sure you want to permanently delete this student account?", "هل أنت متأكد من حذف هذا الحساب نهائيًا؟"))) return
    setActionLoadingId(id)
    try {
      const res = await fetch("/api/admin/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentId: id }),
      })
      if (res.ok) {
        setSuccessBanner(tr("Account permanently deleted.", "تم حذف الحساب نهائيًا."))
        fetchStudents()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Provisioning
  const handleProvisionStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setProvLoading(true)
    setProvResult(null)

    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: "provision",
          studentData: {
            email: provEmail,
            password: provPassword,
            first_name: provFirstName,
            last_name: provLastName,
            university: provUniversity,
            faculty: provFaculty,
            start_year: provStartYear,
            must_change_password: provMustSetup,
          },
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setProvResult({ email: provEmail, pass: provPassword })
        setSuccessBanner(tr("Generic student account provisioned!", "تم إنشاء الحساب بنجاح!"))
        setProvEmail("")
        setProvFirstName("")
        setProvLastName("")
        fetchStudents()
      } else {
        alert(data.error || "Failed to provision")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setProvLoading(false)
    }
  }

  // Auto-generate a clean student email for single provisioning
  const autoGenerateSingleEmail = () => {
    const tag = Date.now().toString().slice(-4)
    const rand = Math.random().toString(36).substring(2, 6)
    setProvEmail(`student_${tag}_${rand}@pharmacore.edu`)
  }

  // Reusable CSV exporter
  const exportToCSV = (data: Array<Record<string, unknown>>, filename: string) => {
    if (!data.length) return
    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const val = row[header] ?? ""
            const escaped = String(val).replace(/"/g, '""')
            return `"${escaped}"`
          })
          .join(",")
      ),
    ]
    const csvContent = "\uFEFF" + csvRows.join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Export filtered roster to CSV
  const handleExportRosterCSV = () => {
    if (!students.length) return
    const rows = students.map((s) => ({
      "Full Name": s.full_name || `${s.first_name || ""} ${s.last_name || ""}`.trim() || "—",
      "Email": s.email || "—",
      "Phone": s.phone_number || "—",
      "University": s.university || "—",
      "Faculty": s.faculty || "—",
      "Starting Year": s.start_year || "—",
      "Predicted Graduation": s.predicted_end_year || "—",
      "Status": s.status || "active",
      "Role": s.role || "student",
      "Registration Date": s.created_at ? new Date(s.created_at).toLocaleDateString() : "—",
    }))
    exportToCSV(rows, `pharmacore_students_roster_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  // Batch provisioning handler
  const handleBatchProvision = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setProvLoading(true)
    setBatchResults([])
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: "batch_provision",
          batchData: {
            count: batchCount,
            prefix: batchPrefix,
            domain: batchDomain,
            password: batchPassword,
            university: provUniversity,
            faculty: provFaculty,
            start_year: provStartYear,
            must_change_password: provMustSetup,
          },
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setBatchResults(data.students || [])
        setSuccessBanner(
          tr(
            `Successfully created ${data.students?.length || 0} student accounts!`,
            `تم إنشاء ${data.students?.length || 0} حساب طالب بنجاح!`
          )
        )
        fetchStudents()
      } else {
        alert(data.error || "Failed to batch provision")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setProvLoading(false)
    }
  }

  // Export batch provisioning results to CSV
  const handleExportBatchCSV = () => {
    if (!batchResults.length) return
    const rows = batchResults.map((r) => ({
      "Student Email": r.email,
      "Temporary Password": r.password,
      "University": r.university,
      "Faculty": r.faculty,
      "Starting Year": r.start_year,
      "Account Status": r.status,
      "Created At": r.created_at,
    }))
    exportToCSV(rows, `pharmacore_batch_credentials_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  // Universities and Faculties management
  const handleAddUniversity = async () => {
    if (!newUniEn.trim() && !newUniAr.trim()) return
    setSavingSettings(true)
    const newUni: University = {
      id: `u_${Date.now()}`,
      name_en: newUniEn.trim() || newUniAr.trim(),
      name_ar: newUniAr.trim() || newUniEn.trim(),
    }
    const updated: EnrollmentSettings = {
      ...enrollmentSettings,
      universities: [...(enrollmentSettings.universities || []), newUni],
    }
    await onUpdateEnrollmentSettings(updated)
    setNewUniEn("")
    setNewUniAr("")
    setSavingSettings(false)
  }

  const handleRemoveUniversity = async (id: string) => {
    setSavingSettings(true)
    const updated: EnrollmentSettings = {
      ...enrollmentSettings,
      universities: (enrollmentSettings.universities || []).filter((u) => u.id !== id),
    }
    await onUpdateEnrollmentSettings(updated)
    setSavingSettings(false)
  }

  const handleAddFaculty = async () => {
    if (!newFacEn.trim() && !newFacAr.trim()) return
    setSavingSettings(true)
    const newFac: Faculty = {
      id: `f_${Date.now()}`,
      name_en: newFacEn.trim() || newFacAr.trim(),
      name_ar: newFacAr.trim() || newFacEn.trim(),
      duration_years: Number(newFacDuration) || 5,
    }
    const updated: EnrollmentSettings = {
      ...enrollmentSettings,
      faculties: [...(enrollmentSettings.faculties || []), newFac],
    }
    await onUpdateEnrollmentSettings(updated)
    setNewFacEn("")
    setNewFacAr("")
    setSavingSettings(false)
  }

  const handleRemoveFaculty = async (id: string) => {
    setSavingSettings(true)
    const updated: EnrollmentSettings = {
      ...enrollmentSettings,
      faculties: (enrollmentSettings.faculties || []).filter((f) => f.id !== id),
    }
    await onUpdateEnrollmentSettings(updated)
    setSavingSettings(false)
  }

  const handleSaveSignupMode = async (mode: SignupMode) => {
    setSavingSettings(true)
    const updated: EnrollmentSettings = {
      ...enrollmentSettings,
      signup_mode: mode,
    }
    await onUpdateEnrollmentSettings(updated)
    setSavingSettings(false)
  }

  const pendingStudents = students.filter((s) => s.status === "pending")

  const filteredStudents = students.filter((s) => {
    const fullName = `${s.full_name || ""} ${s.first_name || ""} ${s.last_name || ""}`.toLowerCase()
    const email = (s.email || "").toLowerCase()
    const phone = (s.phone_number || "").toLowerCase()
    const uni = (s.university || "").toLowerCase()
    const q = search.toLowerCase().trim()

    if (q && !fullName.includes(q) && !email.includes(q) && !phone.includes(q) && !uni.includes(q)) {
      return false
    }

    if (statusFilter !== "all") {
      const status = s.status || "active"
      if (statusFilter === "needs_setup") {
        if (!s.must_change_password) return false
      } else if (status !== statusFilter) {
        return false
      }
    }

    if (universityFilter !== "all" && s.university !== universityFilter) {
      return false
    }

    return true
  })

  return (
    <div className="space-y-6">
      {successBanner && (
        <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <AlertTitle>{successBanner}</AlertTitle>
        </Alert>
      )}

      {/* ─── TOP STATS BAR ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <Card className="card-equal shadow-none">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase whitespace-nowrap">{tr("Total Students", "إجمالي الطلاب")}</span>
              <Users className="size-4 text-primary shrink-0" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black">{stats.total}</p>
          </CardContent>
        </Card>

        <Card className="card-equal shadow-none">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase whitespace-nowrap">{tr("Active Students", "الطلاب النشطون")}</span>
              <UserCheck className="size-4 text-emerald-600 shrink-0" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600">{stats.active}</p>
          </CardContent>
        </Card>

        <Card className="card-equal shadow-none">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase whitespace-nowrap">{tr("Pending Review", "بانتظار الاعتماد")}</span>
              <Clock className="size-4 text-amber-600 shrink-0" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-black text-amber-600">{stats.pending}</p>
              {stats.pending > 0 && (
                <Badge variant="outline" className="badge-nowrap text-[10px] border-amber-500/30 text-amber-600 shrink-0">
                  <span>{tr("Action needed", "يتطلب إجراء")}</span>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="card-equal shadow-none">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase whitespace-nowrap">{tr("Current Mode", "نظام التسجيل")}</span>
              <LockKeyhole className="size-4 text-indigo-600 shrink-0" />
            </div>
            <p className="mt-2 text-sm sm:text-base font-bold truncate capitalize">
              {enrollmentSettings.signup_mode === "approval_required"
                ? tr("Approval Required", "موافقة مسبقة")
                : enrollmentSettings.signup_mode === "open_registration"
                ? tr("Open Instant", "تسجيل فوري")
                : tr("Admin Provisioned", "حسابات إدارية فقط")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── 1. STUDENTS ROSTER VIEW ─────────────────────────────────── */}
      {subTab === "roster" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border rounded-2xl p-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                <h3 className="text-lg sm:text-xl font-bold tracking-tight">{tr("Students Roster", "سجل الطلاب المسجلين")}</h3>
                <Badge variant="secondary" className="text-xs font-mono font-bold">
                  {filteredStudents.length} {tr("students", "طالب")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tr(
                  "View, search, filter and manage all student accounts and their access states.",
                  "استعراض والبحث وتصفية وإدارة جميع حسابات الطلاب وحالات تفعيلهم."
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportRosterCSV}
                className="gap-1.5 text-xs font-bold shadow-xs h-9"
              >
                <Download className="size-3.5" />
                <span>{tr("Export CSV", "تصدير CSV")}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStudents}
                disabled={loading}
                className="size-9 p-0 shadow-xs"
                title={tr("Refresh students", "تحديث")}
              >
                <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={tr("Search by name, email, phone, university...", "ابحث بالاسم، البريد، الهاتف، الجامعة...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={tr("Filter status", "تصفية الحالة")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tr("All Statuses", "جميع الحالات")}</SelectItem>
                <SelectItem value="active">{tr("Active", "نشط")}</SelectItem>
                <SelectItem value="pending">{tr("Pending Review", "قيد المراجعة")}</SelectItem>
                <SelectItem value="suspended">{tr("Suspended", "موقوف")}</SelectItem>
                <SelectItem value="needs_setup">{tr("Needs First Setup", "بانتظار التفعيل")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={universityFilter} onValueChange={setUniversityFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={tr("Filter university", "تصفية الجامعة")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tr("All Universities", "جميع الجامعات")}</SelectItem>
                {(enrollmentSettings.universities || []).map((u) => (
                  <SelectItem key={u.id} value={isAr ? u.name_ar : u.name_en}>
                    {isAr ? u.name_ar : u.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="py-16 text-center text-muted-foreground">
              <Loader2 className="mx-auto size-8 animate-spin text-primary" />
              <p className="mt-3 text-sm">{tr("Loading students roster...", "جارٍ تحميل سجل الطلاب...")}</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-16 text-center border rounded-2xl bg-muted/20">
              <Users className="mx-auto size-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-base font-bold">{tr("No students found", "لم يتم العثور على طلاب")}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {search || statusFilter !== "all"
                  ? tr("Try adjusting your search filters.", "جرّب تغيير معايير البحث والتصفية.")
                  : tr("Students will appear here once they register.", "سيظهر الطلاب هنا فور تسجيلهم.")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border bg-card">
              <table className="w-full text-start text-sm">
                <thead className="border-b bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3.5 text-start">{tr("Student", "الطالب")}</th>
                    <th className="px-4 py-3.5 text-start">{tr("University & Faculty", "الجامعة والكلية")}</th>
                    <th className="px-4 py-3.5 text-start">{tr("Academic Year", "السنة الدراسية")}</th>
                    <th className="px-4 py-3.5 text-start">{tr("Status", "الحالة")}</th>
                    <th className="px-4 py-3.5 text-start">{tr("Contact", "التواصل")}</th>
                    <th className="px-4 py-3.5 text-end">{tr("Actions", "الإجراءات")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStudents.map((student) => {
                    const fullName = student.full_name || `${student.first_name || ""} ${student.last_name || ""}`.trim() || student.email
                    const status = student.status || "active"
                    const isLoading = actionLoadingId === student.id

                    return (
                      <tr key={student.id} className="hover:bg-muted/25 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                              {fullName.charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold truncate">{fullName}</p>
                              <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-xs truncate max-w-[200px]">
                            {student.university || tr("Not specified", "غير محدد")}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                            {student.faculty || "-"}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 text-xs font-mono">
                          {student.start_year ? (
                            <div>
                              <span>{student.start_year}</span>
                              {student.predicted_end_year && (
                                <span className="text-muted-foreground"> → {student.predicted_end_year}</span>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          {status === "active" && (
                            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                              {tr("Active", "نشط")}
                            </Badge>
                          )}
                          {status === "pending" && (
                            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                              {tr("Pending Review", "قيد المراجعة")}
                            </Badge>
                          )}
                          {status === "suspended" && (
                            <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive font-bold text-[10px]">
                              {tr("Suspended", "موقوف")}
                            </Badge>
                          )}
                          {status === "needs_setup" && (
                            <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                              {tr("Needs Setup", "بانتظار التفعيل")}
                            </Badge>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-xs">
                          {student.phone_number ? (
                            <a
                              href={`https://wa.me/${student.phone_number.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-600 hover:underline font-mono"
                            >
                              <Phone className="size-3" />
                              <span>{student.phone_number}</span>
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-end">
                          <div className="flex items-center justify-end gap-1">
                            {status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2.5 text-xs font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-50"
                                  disabled={isLoading}
                                  onClick={() => handleApprove(student.id)}
                                >
                                  {isLoading ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                                  <span className="ms-1">{tr("Approve", "اعتماد")}</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                                  disabled={isLoading}
                                  onClick={() => handleReject(student.id)}
                                >
                                  <X className="size-3" />
                                </Button>
                              </>
                            )}

                            {status === "active" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-xs text-amber-600 hover:bg-amber-50"
                                disabled={isLoading}
                                onClick={() => handleSuspend(student.id, "suspended")}
                                title={tr("Suspend Student", "إيقاف الحساب")}
                              >
                                <UserX className="size-3.5" />
                              </Button>
                            )}

                            {status === "suspended" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-xs text-emerald-600 hover:bg-emerald-50"
                                disabled={isLoading}
                                onClick={() => handleSuspend(student.id, "active")}
                                title={tr("Reactivate Student", "إعادة التفعيل")}
                              >
                                <UserCheck className="size-3.5" />
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs font-bold gap-1 text-primary border-primary/30 hover:bg-primary/5"
                              onClick={() => handleOpenStudentCourses(student)}
                              title={tr("Manage Course Enrollments", "إدارة تسجيل المقررات")}
                            >
                              <BookOpen className="size-3" />
                              <span className="hidden sm:inline">{tr("Courses", "المقررات")}</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                              disabled={isLoading}
                              onClick={() => handleDelete(student.id)}
                              title={tr("Delete Account", "حذف نهائي")}
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
      )}

      {/* ─── 2. PENDING APPROVALS FAST QUEUE ────────────────────────── */}
      {subTab === "pending" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border rounded-2xl p-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="size-5 text-amber-500" />
                <h3 className="text-lg sm:text-xl font-bold tracking-tight">{tr("Pending Student Approvals", "طلبات اعتماد تسجيل الطلاب")}</h3>
                {stats.pending > 0 && (
                  <Badge className="bg-amber-500 text-white font-mono font-bold text-xs">
                    {stats.pending} {tr("pending", "قيد الانتظار")}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tr(
                  "Review and approve or reject prospective students awaiting manual authorization.",
                  "مراجعة واعتماد أو رفض طلبات تسجيل الطلاب المعلقة للموافقة اليدوية."
                )}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchStudents}
              disabled={loading}
              className="size-9 p-0 shadow-xs shrink-0"
              title={tr("Refresh pending queue", "تحديث")}
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          {pendingStudents.length === 0 ? (
            <div className="py-16 text-center border rounded-2xl bg-muted/15">
              <CheckCircle2 className="mx-auto size-12 text-emerald-500/60" />
              <h3 className="mt-4 text-lg font-bold">{tr("All Caught Up!", "لا توجد طلبات معلقة!")}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {tr("Every student registration has been reviewed and processed.", "تمت مراجعة واعتماد جميع طلبات التسجيل.")}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
              {pendingStudents.map((student) => {
                const fullName = student.full_name || `${student.first_name || ""} ${student.last_name || ""}`.trim()
                const isLoading = actionLoadingId === student.id

                return (
                  <Card key={student.id} className="shadow-none border-amber-500/30 bg-amber-500/5">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300 text-[10px]">
                          <Clock className="size-2.5 me-1" />
                          {tr("New Registration", "طلب تسجيل جديد")}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(student.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <CardTitle className="mt-2 text-base font-extrabold">{fullName}</CardTitle>
                      <CardDescription className="text-xs">{student.email}</CardDescription>
                    </CardHeader>

                    <CardContent className="p-4 pt-2 space-y-2 text-xs">
                      <div className="rounded-lg bg-background p-2.5 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{tr("University:", "الجامعة:")}</span>
                          <span className="font-semibold">{student.university || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{tr("Faculty:", "الكلية:")}</span>
                          <span className="font-semibold">{student.faculty || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{tr("Start Year:", "سنة البدء:")}</span>
                          <span className="font-semibold">{student.start_year || "-"}</span>
                        </div>
                        {student.phone_number && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{tr("Phone:", "الهاتف:")}</span>
                            <span className="font-semibold font-mono">{student.phone_number}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <Button
                          size="sm"
                          className="flex-1 font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={isLoading}
                          onClick={() => handleApprove(student.id)}
                        >
                          {isLoading ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5" />}
                          <span>{tr("Approve", "قبول واعتماد")}</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 font-bold gap-1"
                          disabled={isLoading}
                          onClick={() => handleReject(student.id)}
                        >
                          <X className="size-3.5" />
                          <span>{tr("Reject", "رفض")}</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── 3. SIGNUP CONTROLLER ──────────────────────────────────── */}
      {subTab === "controller" && (
        <div className="space-y-6 max-w-5xl">
          <div className="bg-card border rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-2">
              <LockKeyhole className="size-5 text-primary" />
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">{tr("Signup Controller & Registration Policies", "إعدادات وقواعد التسجيل")}</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tr(
                "Choose how new students join PharmaCore and configure access policies.",
                "حدد طريقة انضمام الطلاب الجدد وصلاحيات وصولهم للمقررات المقيدة."
              )}
            </p>
          </div>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                {tr("Student Registration & Enrollment Mode", "نظام تسجيل وقبول الطلاب")}
              </CardTitle>
              <CardDescription>
                {tr(
                  "Choose how new students join PharmaCore and access restricted course content.",
                  "حدد طريقة انضمام الطلاب الجدد وصلاحيات وصولهم للمقررات المقيدة."
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {/* Mode 1 */}
                <label
                  onClick={() => handleSaveSignupMode("approval_required")}
                  className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-all ${
                    enrollmentSettings.signup_mode === "approval_required"
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "hover:bg-muted/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="signup_mode"
                    value="approval_required"
                    checked={enrollmentSettings.signup_mode === "approval_required"}
                    onChange={() => handleSaveSignupMode("approval_required")}
                    className="mt-1 size-4 text-primary"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-bold block">
                      {tr("Mode 1: Review & Approval Required (Recommended)", "الوضع 1: المراجعة والموافقة المسبقة (موصى به)")}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {tr(
                        "Students can sign up by submitting their full academic profile. Their account remains in 'Pending' status until approved by staff.",
                        "يستطيع الطالب تقديم طلب التسجيل وتعبئة بياناته، ويبقى الحساب معلقًا حتى تتم مراجعته واعتماده من قِبل إدارة المنصة."
                      )}
                    </p>
                  </div>
                </label>

                {/* Mode 2 */}
                <label
                  onClick={() => handleSaveSignupMode("open_registration")}
                  className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-all ${
                    enrollmentSettings.signup_mode === "open_registration"
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "hover:bg-muted/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="signup_mode"
                    value="open_registration"
                    checked={enrollmentSettings.signup_mode === "open_registration"}
                    onChange={() => handleSaveSignupMode("open_registration")}
                    className="mt-1 size-4 text-primary"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-bold block">
                      {tr("Mode 2: Instant Open Registration", "الوضع 2: التسجيل المفتوح الفوري")}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {tr(
                        "Anyone can register and instantly access member lectures and quizzes with zero waiting time.",
                        "يتاح لأي زائر إنشاء حساب طالب والوصول الفوري للمحاضرات والاختبارات دون انتظار موافقة مسبقة."
                      )}
                    </p>
                  </div>
                </label>

                {/* Mode 3 */}
                <label
                  onClick={() => handleSaveSignupMode("admin_provisioned")}
                  className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-all ${
                    enrollmentSettings.signup_mode === "admin_provisioned"
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "hover:bg-muted/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="signup_mode"
                    value="admin_provisioned"
                    checked={enrollmentSettings.signup_mode === "admin_provisioned"}
                    onChange={() => handleSaveSignupMode("admin_provisioned")}
                    className="mt-1 size-4 text-primary"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-bold block">
                      {tr("Mode 3: Admin Provisioned Only (Closed Registration)", "الوضع 3: حسابات إدارية مخصصة (التسجيل العام مغلق)")}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {tr(
                        "Public registration tab is closed. Admins generate generic/temporary accounts. On first login, a mandatory wizard forces the student to complete their profile and choose their own password.",
                        "يتم إغلاق التسجيل العام، وتنشئ الإدارة حسابات مخصصة. عند تسجيل دخول الطالب لأول مرة يظهر له نموذج إجباري لتحديث بياناته وتعيين كلمة المرور الخاصة به."
                      )}
                    </p>
                  </div>
                </label>
              </div>

              {savingSettings && (
                <div className="flex items-center gap-2 text-xs text-primary font-bold">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>{tr("Saving enrollment policy...", "جارٍ حفظ إعدادات التسجيل...")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── 4. UNIVERSITIES & FACULTIES DIRECTORIES ────────────────── */}
      {subTab === "directories" && (
        <div className="space-y-6">
          <div className="bg-card border rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" />
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">{tr("Universities & Faculties Directory", "دليل الجامعات والكليات")}</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tr(
                "Manage higher education institutions and available faculties for student registration.",
                "إدارة الجامعات المتاحة والكليات المرتبطة بها لاختيارات الطلاب أثناء التسجيل."
              )}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Universities Directory */}
            <Card className="shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">{tr("Universities Directory", "دليل الجامعات")}</CardTitle>
                  <Badge variant="outline">{enrollmentSettings.universities?.length || 0}</Badge>
                </div>
                <CardDescription>
                  {tr("Institutions available in the student signup dropdown.", "الجامعات المتاحة في قائمة اختيار الطالب عند التسجيل.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add new university */}
                <div className="rounded-xl border bg-muted/20 p-3 space-y-2">
                  <span className="text-xs font-bold text-muted-foreground">{tr("+ Add New University", "+ إضافة جامعة جديدة")}</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder={tr("University name (EN)", "اسم الجامعة بالإنجليزي")}
                      value={newUniEn}
                      onChange={(e) => setNewUniEn(e.target.value)}
                    />
                    <Input
                      placeholder={tr("University name (AR)", "اسم الجامعة بالعربي")}
                      value={newUniAr}
                      onChange={(e) => setNewUniAr(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full font-bold gap-1"
                    disabled={savingSettings || (!newUniEn.trim() && !newUniAr.trim())}
                    onClick={handleAddUniversity}
                  >
                    <Plus className="size-3.5" />
                    <span>{tr("Add University", "إضافة الجامعة")}</span>
                  </Button>
                </div>

                {/* Universities list */}
                <div className="max-h-[340px] overflow-y-auto space-y-1.5 pe-1">
                  {(enrollmentSettings.universities || []).map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-2 rounded-lg border bg-card p-2.5 text-xs hover:bg-muted/20 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-bold truncate">{isAr ? u.name_ar : u.name_en}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{isAr ? u.name_en : u.name_ar}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveUniversity(u.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Faculties & Programs Directory */}
            <Card className="shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">{tr("Faculties & Programs", "الكليات والبرامج الدراسية")}</CardTitle>
                  <Badge variant="outline">{enrollmentSettings.faculties?.length || 0}</Badge>
                </div>
                <CardDescription>
                  {tr(
                    "Faculties with study duration used to calculate graduation years.",
                    "الكليات وعدد سنوات الدراسة لحساب سنة التخرج والمستوى الدراسي آليًا."
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add new faculty */}
                <div className="rounded-xl border bg-muted/20 p-3 space-y-2">
                  <span className="text-xs font-bold text-muted-foreground">{tr("+ Add New Faculty", "+ إضافة كلية أو برنامج")}</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder={tr("Faculty name (EN)", "اسم الكلية بالإنجليزي")}
                      value={newFacEn}
                      onChange={(e) => setNewFacEn(e.target.value)}
                    />
                    <Input
                      placeholder={tr("Faculty name (AR)", "اسم الكلية بالعربي")}
                      value={newFacAr}
                      onChange={(e) => setNewFacAr(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[11px]">{tr("Study Duration (Years)", "مدة الدراسة (بالسنوات)")}</Label>
                      <Select value={String(newFacDuration)} onValueChange={(v) => setNewFacDuration(Number(v))}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">4 {tr("Years", "سنوات")}</SelectItem>
                          <SelectItem value="5">5 {tr("Years (Standard PharmD)", "سنوات (PharmD)")}</SelectItem>
                          <SelectItem value="6">6 {tr("Years", "سنوات")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      size="sm"
                      className="mt-4 font-bold gap-1"
                      disabled={savingSettings || (!newFacEn.trim() && !newFacAr.trim())}
                      onClick={handleAddFaculty}
                    >
                      <Plus className="size-3.5" />
                      <span>{tr("Add Faculty", "إضافة")}</span>
                    </Button>
                  </div>
                </div>

                {/* Faculties list */}
                <div className="max-h-[340px] overflow-y-auto space-y-1.5 pe-1">
                  {(enrollmentSettings.faculties || []).map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between gap-2 rounded-lg border bg-card p-2.5 text-xs hover:bg-muted/20 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-bold truncate">{isAr ? f.name_ar : f.name_en}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {f.duration_years} {tr("Years duration", "سنوات دراسية")}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveFaculty(f.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── 5. BATCH & SINGLE PROVISIONING ────────────────────────── */}
      {subTab === "provision" && (
        <div className="space-y-6 max-w-5xl">
          <div className="bg-card border rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-2">
              <UserPlus className="size-5 text-primary" />
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">{tr("Multi-Account Student Generator", "توليد الحسابات الطلابية")}</h3>
              <Badge className="bg-primary/20 text-primary border border-primary/30 text-xs font-mono font-bold">
                Batch & Single
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tr(
                "Instantly provision generic student accounts, auto-generate sequential emails, and export credentials to CSV.",
                "إنشاء حسابات طلابية جاهزة دفعة واحدة، وتوليد بريد إلكتروني تسلسلي، وتصدير بيانات الدخول في ملف CSV."
              )}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-xl max-w-md">
            <button
              type="button"
              onClick={() => setProvMode("batch")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                provMode === "batch"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="size-3.5" />
              <span>{tr("Batch Multi-Account Generator", "توليد دفعات متعددة")}</span>
            </button>
            <button
              type="button"
              onClick={() => setProvMode("single")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                provMode === "single"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserPlus className="size-3.5" />
              <span>{tr("Single Custom Account", "حساب فردي مخصص")}</span>
            </button>
          </div>

          {/* ─── A. BATCH PROVISIONING MODE ───────────────────────────────── */}
          {provMode === "batch" && (
            <Card className="shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg font-bold">
                      {tr("Batch Multi-Account Student Generator", "توليد دفعات حسابات طلاب متعددة")}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {tr(
                        "Automatically generate unique student emails and login credentials in 1-click. Ready to download and distribute via CSV.",
                        "إنشاء دفعة من الحسابات الفريدة بضغطة زر وتوليد بريد إلكتروني وكلمة مرور مؤقتة وتصديرها مباشرة كملف CSV."
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs text-primary font-bold">
                    1-Click Batch
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <form onSubmit={handleBatchProvision} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label>{tr("Number of Accounts", "عدد الحسابات المطلوبة")} *</Label>
                      <Select value={String(batchCount)} onValueChange={(v) => setBatchCount(Number(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 5, 10, 20, 30, 50, 100].map((num) => (
                            <SelectItem key={num} value={String(num)}>
                              {num} {tr("Accounts", "حساب")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>{tr("Email Prefix", "بادئة البريد الإلكتروني")}</Label>
                      <Input
                        value={batchPrefix}
                        onChange={(e) => setBatchPrefix(e.target.value)}
                        placeholder="student"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>{tr("Domain", "النطاق البريدي")}</Label>
                      <Input
                        value={batchDomain}
                        onChange={(e) => setBatchDomain(e.target.value)}
                        placeholder="pharmacore.edu"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label>{tr("Target University", "الجامعة التابع لها")}</Label>
                      <Select value={provUniversity} onValueChange={setProvUniversity}>
                        <SelectTrigger>
                          <SelectValue placeholder={tr("Select university", "اختر الجامعة")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="—">{tr("None / Generic", "عام / غير محدد")}</SelectItem>
                          {(enrollmentSettings.universities || []).map((u) => (
                            <SelectItem key={u.id} value={isAr ? u.name_ar : u.name_en}>
                              {isAr ? u.name_ar : u.name_en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>{tr("Target Faculty", "الكلية / البرنامج")}</Label>
                      <Select value={provFaculty} onValueChange={setProvFaculty}>
                        <SelectTrigger>
                          <SelectValue placeholder={tr("Select faculty", "اختر الكلية")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="—">{tr("None / Generic", "عام / غير محدد")}</SelectItem>
                          {(enrollmentSettings.faculties || []).map((f) => (
                            <SelectItem key={f.id} value={isAr ? f.name_ar : f.name_en}>
                              {isAr ? f.name_ar : f.name_en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>{tr("Starting Year", "سنة بدء الدراسة")}</Label>
                      <Select value={String(provStartYear)} onValueChange={(val) => setProvStartYear(Number(val))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020].map((yr) => (
                            <SelectItem key={yr} value={String(yr)}>
                              {yr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>{tr("Temporary Password for Batch", "كلمة المرور المؤقتة للحسابات")} *</Label>
                    <Input
                      value={batchPassword}
                      onChange={(e) => setBatchPassword(e.target.value)}
                      placeholder="Pharma@2026"
                      required
                    />
                  </div>

                  <div className="rounded-xl border p-3 flex items-center gap-3 bg-muted/20">
                    <input
                      type="checkbox"
                      id="batch-force-setup"
                      checked={provMustSetup}
                      onChange={(e) => setProvMustSetup(e.target.checked)}
                      className="size-4 rounded text-primary"
                    />
                    <Label htmlFor="batch-force-setup" className="text-xs font-semibold cursor-pointer">
                      {tr(
                        "Force students to update profile & change password upon their first login",
                        "إلزام الطلاب باستكمال بياناتهم وتعيين كلمة مرور شخصية عند أول تسجيل دخول"
                      )}
                    </Label>
                  </div>

                  <Button type="submit" size="lg" className="w-full font-bold gap-2" disabled={provLoading}>
                    {provLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>{tr(`Generating ${batchCount} student accounts...`, `جارٍ توليد ${batchCount} حساب طالب...`)}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="size-4" />
                        <span>{tr(`Generate ${batchCount} Student Accounts in 1-Click`, `توليد ${batchCount} حساب طالب بضغطة زر`)}</span>
                      </>
                    )}
                  </Button>
                </form>

                {/* Batch Generation Results & CSV Download */}
                {batchResults.length > 0 && (
                  <div className="pt-4 border-t space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                          {tr(`Successfully generated ${batchResults.length} accounts`, `تم توليد ${batchResults.length} حساب بنجاح`)}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          {tr("Download credentials CSV or copy individual rows below.", "يمكنك تحميل بيانات الدخول بصيغة CSV لتوزيعها على الطلاب.")}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={handleExportBatchCSV}
                        className="gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      >
                        <Download className="size-3.5" />
                        <span>{tr("Download Credentials (CSV)", "تحميل الحسابات (CSV)")}</span>
                      </Button>
                    </div>

                    {/* Preview Table */}
                    <div className="rounded-xl border overflow-x-auto max-h-[300px]">
                      <table className="w-full text-xs text-start">
                        <thead className="bg-muted/40 font-bold border-b">
                          <tr>
                            <th className="px-3 py-2 text-start">#</th>
                            <th className="px-3 py-2 text-start">{tr("Generated Email", "البريد الإلكتروني")}</th>
                            <th className="px-3 py-2 text-start">{tr("Temp Password", "كلمة المرور")}</th>
                            <th className="px-3 py-2 text-start">{tr("University", "الجامعة")}</th>
                            <th className="px-3 py-2 text-start">{tr("Faculty", "الكلية")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y font-mono text-[11px]">
                          {batchResults.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-muted/20">
                              <td className="px-3 py-2 text-muted-foreground font-sans">{idx + 1}</td>
                              <td className="px-3 py-2 font-bold text-foreground">{item.email}</td>
                              <td className="px-3 py-2 text-primary font-bold">{item.password}</td>
                              <td className="px-3 py-2 font-sans">{item.university}</td>
                              <td className="px-3 py-2 font-sans">{item.faculty}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── B. SINGLE PROVISIONING MODE ──────────────────────────────── */}
          {provMode === "single" && (
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-lg font-bold">
                  {tr("Provision Single Custom Account", "إنشاء حساب طالب مخصص")}
                </CardTitle>
                <CardDescription>
                  {tr(
                    "Create a single pre-issued student account with customized details or auto-generated email.",
                    "إنشاء حساب واحد مخصص لطالب محدد مع إمكانية توليد البريد تلقائيًا."
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {provResult && (
                  <Alert className="mb-6 border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <AlertTitle className="font-bold">{tr("Account Created Successfully!", "تم إنشاء الحساب بنجاح!")}</AlertTitle>
                    <AlertDescription className="text-xs mt-1 space-y-1">
                      <p>
                        <strong>{tr("Email:", "البريد:")}</strong> {provResult.email}
                      </p>
                      <p>
                        <strong>{tr("Temporary Password:", "كلمة المرور المؤقتة:")}</strong> {provResult.pass}
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleProvisionStudent} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label>{tr("Student Email", "بريد الطالب")} *</Label>
                        <button
                          type="button"
                          onClick={autoGenerateSingleEmail}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <Zap className="size-3" />
                          <span>{tr("Auto-Generate", "توليد تلقائي")}</span>
                        </button>
                      </div>
                      <Input
                        type="email"
                        placeholder="student@example.com"
                        value={provEmail}
                        onChange={(e) => setProvEmail(e.target.value)}
                        required
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{tr("Temporary Password", "كلمة المرور المؤقتة")} *</Label>
                      <Input
                        type="text"
                        value={provPassword}
                        onChange={(e) => setProvPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>{tr("First Name (Optional)", "الاسم الأول (اختياري)")}</Label>
                      <Input
                        value={provFirstName}
                        onChange={(e) => setProvFirstName(e.target.value)}
                        placeholder={isAr ? "أحمد" : "Ahmed"}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{tr("Last Name (Optional)", "اللقب (اختياري)")}</Label>
                      <Input
                        value={provLastName}
                        onChange={(e) => setProvLastName(e.target.value)}
                        placeholder={isAr ? "علي" : "Ali"}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>{tr("University", "الجامعة")}</Label>
                      <Select value={provUniversity} onValueChange={setProvUniversity}>
                        <SelectTrigger>
                          <SelectValue placeholder={tr("Select university", "اختر الجامعة")} />
                        </SelectTrigger>
                        <SelectContent>
                          {(enrollmentSettings.universities || []).map((u) => (
                            <SelectItem key={u.id} value={isAr ? u.name_ar : u.name_en}>
                              {isAr ? u.name_ar : u.name_en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>{tr("Faculty", "الكلية")}</Label>
                      <Select value={provFaculty} onValueChange={setProvFaculty}>
                        <SelectTrigger>
                          <SelectValue placeholder={tr("Select faculty", "اختر الكلية")} />
                        </SelectTrigger>
                        <SelectContent>
                          {(enrollmentSettings.faculties || []).map((f) => (
                            <SelectItem key={f.id} value={isAr ? f.name_ar : f.name_en}>
                              {isAr ? f.name_ar : f.name_en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>{tr("Starting Academic Year", "سنة بدء الدراسة")}</Label>
                    <Select value={String(provStartYear)} onValueChange={(val) => setProvStartYear(Number(val))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019].map((yr) => (
                          <SelectItem key={yr} value={String(yr)}>
                            {yr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-xl border p-3 flex items-center gap-3 bg-muted/20">
                    <input
                      type="checkbox"
                      id="force-setup"
                      checked={provMustSetup}
                      onChange={(e) => setProvMustSetup(e.target.checked)}
                      className="size-4 rounded text-primary"
                    />
                    <Label htmlFor="force-setup" className="text-xs font-semibold cursor-pointer">
                      {tr(
                        "Force student to complete profile and change password on first login",
                        "إلزام الطالب باستكمال بياناته وتغيير كلمة المرور عند أول تسجيل دخول"
                      )}
                    </Label>
                  </div>

                  <Button type="submit" size="lg" className="w-full font-bold gap-2" disabled={provLoading}>
                    {provLoading ? <Loader2 className="animate-spin" /> : <UserPlus />}
                    <span>{provLoading ? tr("Provisioning...", "جارٍ الإنشاء...") : tr("Provision Account", "إنشاء الحساب")}</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─── 6. STUDENT COURSE ACCESS DIALOG ─────────────────────────── */}
      <Dialog open={!!managingStudent} onOpenChange={(open) => !open && setManagingStudent(null)}>
        <DialogContent className="max-h-[92vh] w-[95vw] sm:max-w-xl overflow-y-auto custom-scrollbar p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
          {managingStudent && (
            <div>
              <DialogHeader>
                <div className="flex items-center gap-2 text-primary font-bold text-xs">
                  <Shield className="size-4" />
                  <span>{tr("Student Course Access", "صلاحيات تسجيل المقررات")}</span>
                </div>
                <DialogTitle className="text-lg sm:text-xl font-extrabold truncate mt-1">
                  {managingStudent.full_name || managingStudent.email}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {tr(
                    "Enable or revoke this student's access to specific curriculum courses.",
                    "تفعيل أو إلغاء وصول هذا الطالب للمقررات الدراسية المحددة."
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-3">
                {loadingStudentCourses ? (
                  <div className="grid min-h-32 place-items-center">
                    <Loader2 className="size-6 animate-spin text-primary opacity-70" />
                  </div>
                ) : !courses.length ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    {tr("No courses available in curriculum.", "لا توجد مقررات مضافة في النظام.")}
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-[50vh] overflow-y-auto custom-scrollbar pe-1">
                    {courses.map((course) => {
                      const isEnrolled = studentEnrolledCourseIds.includes(course.id)
                      const title = isAr ? course.title_ar || course.title_en : course.title_en

                      return (
                        <div
                          key={course.id}
                          className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                            isEnrolled ? "bg-primary/5 border-primary/40 shadow-2xs" : "bg-card hover:bg-muted/30"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold truncate">{title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {course.access_policy === "enrolled_only" ? (
                                <Badge variant="secondary" className="text-[10px] border-purple-500/30 text-purple-700 dark:text-purple-300">
                                  {tr("Cohort Gated", "مغلق للتسجيل فقط")}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                                  {tr("Open / Public", "عام")}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant={isEnrolled ? "default" : "outline"}
                            disabled={savingStudentCourses}
                            onClick={() => handleToggleCourseForStudent(course.id, isEnrolled)}
                            className={`h-8 px-3 text-xs font-bold gap-1.5 shrink-0 ${
                              isEnrolled ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                            }`}
                          >
                            {savingStudentCourses ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : isEnrolled ? (
                              <Check className="size-3" />
                            ) : (
                              <Plus className="size-3" />
                            )}
                            <span>{isEnrolled ? tr("Enrolled", "مسجل") : tr("Enroll", "تسجيل")}</span>
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <DialogFooter className="pt-2 border-t">
                <Button variant="outline" onClick={() => setManagingStudent(null)} className="w-full sm:w-auto text-xs h-9">
                  {tr("Close", "إغلاق")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
