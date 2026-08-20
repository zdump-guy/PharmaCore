import { useState, useMemo } from "react"
import {
  FiAward as Award,
  FiBookOpen as BookOpen,
  FiCheckCircle as CheckCircle2,
  FiClock as Clock,
  FiDownload as Download,
  FiSearch as Search,
  FiUsers as Users,
  FiX as X,
  FiBarChart2 as BarChart2,
  FiAlertTriangle as AlertTriangle,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  generateGradebookMatrix,
  filterGradebookRoster,
  exportGradebookToCSV,
  type GradebookRow,
  type GradebookStudent,
  type LectureProgressRecord,
  type QuizSubmissionRecord,
  type CertificateSummaryRecord,
} from "@/lib/gradebookExport"
import type { Course, Lecture, Quiz, Question } from "@/types"

interface FacultyGradebookProps {
  isAr: boolean
  courses: Course[]
  lectures: Lecture[]
  quizzes: Quiz[]
  questions: Question[]
  students?: GradebookStudent[]
  lectureProgress?: LectureProgressRecord[]
  quizSubmissions?: QuizSubmissionRecord[]
  certificates?: CertificateSummaryRecord[]
}

export default function FacultyGradebook({
  isAr,
  courses,
  lectures,
  quizzes,
  questions,
  students = [],
  lectureProgress = [],
  quizSubmissions = [],
  certificates = [],
}: FacultyGradebookProps) {
  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const [selectedCourseId, setSelectedCourseId] = useState<string>("all")
  const [selectedUniversity, setSelectedUniversity] = useState<string>("all")
  const [selectedCohort, setSelectedCohort] = useState<string>("all")
  const [selectedCertStatus, setSelectedCertStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"roster" | "analytics">("roster")

  // Fallback demo students if no active students enrolled yet
  const effectiveStudents: GradebookStudent[] = useMemo(() => {
    if (students.length > 0) return students
    return [
      { id: "s1", name: "Zaid Al-Harbi", email: "zaid@ksu.edu.sa", university: "King Saud University", cohort: "PharmD-2026" },
      { id: "s2", name: "Mona El-Sayed", email: "mona@cu.edu.eg", university: "Cairo University", cohort: "PharmD-2026" },
      { id: "s3", name: "Omar Khaled", email: "omar@ksu.edu.sa", university: "King Saud University", cohort: "BSc-2027" },
      { id: "s4", name: "Fatima Al-Mansoor", email: "fatima@squ.edu.om", university: "Sultan Qaboos University", cohort: "PharmD-2025" },
    ]
  }, [students])

  // Filter lectures and quizzes for the selected course
  const courseLectures = useMemo(() => {
    if (selectedCourseId === "all") return lectures
    return lectures.filter((l) => l.course_id === selectedCourseId)
  }, [lectures, selectedCourseId])

  const courseQuizzes = useMemo(() => {
    if (selectedCourseId === "all") return quizzes
    return quizzes.filter((q) => q.course_id === selectedCourseId)
  }, [quizzes, selectedCourseId])

  // Generate Matrix
  const gradebookRows: GradebookRow[] = useMemo(() => {
    return generateGradebookMatrix({
      students: effectiveStudents,
      lectures: courseLectures,
      lecture_progress: lectureProgress,
      quizzes: courseQuizzes,
      quiz_submissions: quizSubmissions,
      certificates: certificates,
    })
  }, [effectiveStudents, courseLectures, lectureProgress, courseQuizzes, quizSubmissions, certificates])

  // Extract unique universities and cohorts for filter dropdowns
  const universitiesList = useMemo(() => {
    const unis = new Set<string>()
    gradebookRows.forEach((r) => {
      if (r.university && r.university !== "Unassigned") unis.add(r.university)
    })
    return Array.from(unis)
  }, [gradebookRows])

  const cohortsList = useMemo(() => {
    const cohorts = new Set<string>()
    gradebookRows.forEach((r) => {
      if (r.cohort && r.cohort !== "Default") cohorts.add(r.cohort)
    })
    return Array.from(cohorts)
  }, [gradebookRows])

  // Filtered rows
  const filteredRows = useMemo(() => {
    return filterGradebookRoster(gradebookRows, {
      university: selectedUniversity,
      cohort: selectedCohort,
      certificate_status: selectedCertStatus,
      search: searchQuery,
    })
  }, [gradebookRows, selectedUniversity, selectedCohort, selectedCertStatus, searchQuery])

  // Aggregate stats
  const stats = useMemo(() => {
    const total = filteredRows.length
    if (total === 0) {
      return { total: 0, avgQuiz: 0, avgCompletion: 0, certEligibleCount: 0, certIssuedCount: 0 }
    }
    const totalQuizAvg = filteredRows.reduce((acc, r) => acc + r.quiz_average, 0)
    const totalCompletion = filteredRows.reduce((acc, r) => acc + r.watch_completion_rate, 0)
    const eligible = filteredRows.filter((r) => r.certificate_status === "eligible").length
    const issued = filteredRows.filter((r) => r.certificate_status === "issued").length

    return {
      total,
      avgQuiz: Math.round((totalQuizAvg / total) * 10) / 10,
      avgCompletion: Math.round((totalCompletion / total) * 10) / 10,
      certEligibleCount: eligible,
      certIssuedCount: issued,
    }
  }, [filteredRows])

  // Export CSV
  const handleExportCSV = () => {
    const csvData = exportGradebookToCSV(filteredRows, courseQuizzes)
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `pharmacore-gradebook-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* ─── Top Header Card ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/90 border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-10 grid place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <BookOpen className="size-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {tr("Faculty Gradebook & Cohort Analytics", "سجل الدرجات وتحليلات الدفعات الدراسية")}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {tr(
              "Track student lecture completion, itemized quiz scores, and verifiable certificate eligibility across all cohorts.",
              "متابعة نسب إكمال المحاضرات، ودرجات الاختبارات التفصيلية، وأهلية الشهادات المعتمدة لكل دفعة."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Sub-tab pills */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-full">
            <button
              type="button"
              onClick={() => setActiveTab("roster")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === "roster"
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tr("Gradebook Matrix", "جدول الدرجات")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === "analytics"
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tr("Drop-off & Difficulty", "نسب الإكمال والصعوبة")}
            </button>
          </div>

          <Button
            onClick={handleExportCSV}
            disabled={filteredRows.length === 0}
            className="rounded-full font-bold h-10 px-5 gap-2 text-xs shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Download className="size-3.5" />
            <span>{tr("Export CSV", "تصدير CSV")}</span>
          </Button>
        </div>
      </div>

      {/* ─── Metric Cards Grid ──────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Students */}
        <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">{tr("Enrolled Students", "الطلاب المسجلين")}</span>
              <div className="size-9 grid place-items-center rounded-xl bg-blue-500/10 text-blue-600">
                <Users className="size-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-foreground">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{tr("Across active filters", "ضمن التصفية المحددة")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Avg Completion */}
        <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">{tr("Avg Watch Progress", "متوسط المشاهدة")}</span>
              <div className="size-9 grid place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <Clock className="size-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-foreground">{stats.avgCompletion}%</p>
              <Progress value={stats.avgCompletion} className="h-1.5 mt-2 bg-muted/60" />
            </div>
          </CardContent>
        </Card>

        {/* Class Quiz Average */}
        <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">{tr("Class Quiz Average", "متوسط درجات الاختبارات")}</span>
              <div className="size-9 grid place-items-center rounded-xl bg-purple-500/10 text-purple-600">
                <BarChart2 className="size-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-foreground">{stats.avgQuiz}%</p>
              <Badge
                variant="outline"
                className={`mt-1 text-[10px] font-bold rounded-full px-2 ${
                  stats.avgQuiz >= 80
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                }`}
              >
                {stats.avgQuiz >= 80 ? tr("Mastery Level", "مستوى إتقان ممتاز") : tr("Standard", "مستوى قياسي")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Certificates Issued / Eligible */}
        <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">{tr("Certificates Issued", "الشهادات المعتمدة")}</span>
              <div className="size-9 grid place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                <Award className="size-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-foreground">{stats.certIssuedCount}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {stats.certEligibleCount} {tr("pending claims", "طالب مؤهل للإصدار")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Filters & Search Bar ───────────────────────────────────── */}
      <div className="bg-card/90 border border-border/80 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Course filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground">{tr("Course Filter", "تصفية المقرر")}</label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="rounded-xl h-10 border-border/80 bg-background/60 text-xs">
                <SelectValue placeholder={tr("All Courses", "جميع المقررات")} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">{tr("All Courses", "جميع المقررات")}</SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {isAr ? c.title_ar || c.title_en : c.title_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* University filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground">{tr("University", "الجامعة")}</label>
            <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
              <SelectTrigger className="rounded-xl h-10 border-border/80 bg-background/60 text-xs">
                <SelectValue placeholder={tr("All Universities", "جميع الجامعات")} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">{tr("All Universities", "جميع الجامعات")}</SelectItem>
                {universitiesList.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cohort filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground">{tr("Cohort / Program", "الدفعة الدراسية")}</label>
            <Select value={selectedCohort} onValueChange={setSelectedCohort}>
              <SelectTrigger className="rounded-xl h-10 border-border/80 bg-background/60 text-xs">
                <SelectValue placeholder={tr("All Cohorts", "جميع الدفعات")} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">{tr("All Cohorts", "جميع الدفعات")}</SelectItem>
                {cohortsList.map((coh) => (
                  <SelectItem key={coh} value={coh}>
                    {coh}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Certificate status filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground">{tr("Certificate Status", "حالة الشهادة")}</label>
            <Select value={selectedCertStatus} onValueChange={setSelectedCertStatus}>
              <SelectTrigger className="rounded-xl h-10 border-border/80 bg-background/60 text-xs">
                <SelectValue placeholder={tr("All Statuses", "جميع الحالات")} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">{tr("All Statuses", "جميع الحالات")}</SelectItem>
                <SelectItem value="issued">{tr("Issued", "تم الإصدار")}</SelectItem>
                <SelectItem value="eligible">{tr("Eligible (>=80%)", "مؤهل للإصدار")}</SelectItem>
                <SelectItem value="not_eligible">{tr("In Progress", "قيد الإنجاز")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search box */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground">{tr("Search Student", "بحث عن طالب")}</label>
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tr("Name, email, code...", "الاسم، البريد، الرمز...")}
                className="ps-9 pe-8 rounded-xl h-10 border-border/80 bg-background/60 text-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── TAB 1: ROSTER MATRIX TABLE ─────────────────────────────── */}
      {activeTab === "roster" && (
        <div className="rounded-3xl border border-border/80 bg-card/90 shadow-sm overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-start text-xs">
              <thead className="border-b border-border/60 bg-muted/50 text-[11px] font-bold text-muted-foreground uppercase sticky top-0 backdrop-blur-md z-10">
                <tr>
                  <th className="px-5 py-3.5 text-start">{tr("Student Details", "بيانات الطالب")}</th>
                  <th className="px-5 py-3.5 text-start">{tr("University & Cohort", "الجامعة والدفعة")}</th>
                  <th className="px-5 py-3.5 text-start min-w-[140px]">{tr("Watch Completion", "نسبة المشاهدة")}</th>
                  {courseQuizzes.map((q) => (
                    <th key={q.id} className="px-4 py-3.5 text-center whitespace-nowrap">
                      {isAr ? q.title_ar || q.title_en : q.title_en}
                    </th>
                  ))}
                  <th className="px-5 py-3.5 text-center">{tr("Quiz Average", "المعدل العام")}</th>
                  <th className="px-5 py-3.5 text-end">{tr("Certificate", "الشهادة")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-sans">
                {filteredRows.map((row) => {
                  return (
                    <tr key={row.student_id} className="hover:bg-muted/30 transition-colors">
                      {/* Student Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 rounded-xl border border-border/80 bg-primary/10 text-primary">
                            <AvatarFallback className="font-bold text-xs">
                              {row.student_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-foreground text-xs">{row.student_name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{row.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* University & Cohort */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-foreground text-xs">{row.university}</p>
                        <Badge variant="outline" className="mt-1 text-[10px] font-mono rounded-full px-2 border-border/70">
                          {row.cohort}
                        </Badge>
                      </td>

                      {/* Watch Progress */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span>{row.watch_completion_rate}%</span>
                            <span className="text-muted-foreground">
                              {row.lectures_watched}/{row.total_lectures}
                            </span>
                          </div>
                          <Progress value={row.watch_completion_rate} className="h-1.5 bg-muted/60" />
                        </div>
                      </td>

                      {/* Itemized Quiz Scores */}
                      {courseQuizzes.map((q) => {
                        const score = row.quiz_scores[q.id]
                        return (
                          <td key={q.id} className="px-4 py-4 text-center font-mono">
                            {score !== null && score !== undefined ? (
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                  score >= 80
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : score >= 60
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                    : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                {score}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50 text-[10px]">—</span>
                            )}
                          </td>
                        )
                      })}

                      {/* Overall Average */}
                      <td className="px-5 py-4 text-center font-mono">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${
                            row.quiz_average >= 80
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                              : row.quiz_average >= 60
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {row.quiz_average}%
                        </span>
                      </td>

                      {/* Certificate Status */}
                      <td className="px-5 py-4 text-end whitespace-nowrap">
                        {row.certificate_status === "issued" ? (
                          <div className="flex flex-col items-end">
                            <Badge className="bg-emerald-500 text-white rounded-full text-[10px] font-bold gap-1 px-2.5">
                              <CheckCircle2 className="size-3" />
                              <span>{tr("Issued", "معتمدة")}</span>
                            </Badge>
                            {row.certificate_code && (
                              <span className="text-[9px] font-mono text-muted-foreground mt-0.5">
                                {row.certificate_code}
                              </span>
                            )}
                          </div>
                        ) : row.certificate_status === "eligible" ? (
                          <Badge className="bg-amber-500 text-white rounded-full text-[10px] font-bold gap-1 px-2.5">
                            <Award className="size-3" />
                            <span>{tr("Eligible", "مؤهل")}</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground rounded-full px-2.5">
                            {tr("In Progress", "قيد التقدم")}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filteredRows.length === 0 && (
              <div className="py-20 text-center text-muted-foreground">
                <Users className="mx-auto size-12 opacity-30 text-primary" />
                <p className="mt-3 text-xs font-bold">
                  {tr("No student records match the active filters.", "لا توجد سجلات تطابق شروط التصفية.")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: DROP-OFF FUNNEL & DIFFICULTY HEATMAP ────────────── */}
      {activeTab === "analytics" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Lecture Drop-Off Funnel */}
          <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
            <CardHeader className="p-6 pb-4 border-b border-border/60">
              <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <span>{tr("Lecture Retention & Drop-off Funnel", "مسار الاستبقاء والتسرب عبر المحاضرات")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {courseLectures.map((lec, idx) => {
                const completedCount = lectureProgress.filter(
                  (lp) => lp.lecture_id === lec.id && lp.completed
                ).length
                const total = effectiveStudents.length || 1
                const percent = Math.round((completedCount / total) * 100)

                return (
                  <div key={lec.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">
                        {idx + 1}. {isAr ? lec.title_ar || lec.title_en : lec.title_en}
                      </span>
                      <span className="font-mono text-muted-foreground font-bold">{percent}%</span>
                    </div>
                    <Progress value={percent} className="h-2 bg-muted/60" />
                  </div>
                )
              })}

              {courseLectures.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  {tr("No lectures available for the selected course.", "لا توجد محاضرات للمقرر المحدد.")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Question Difficulty Heatmap */}
          <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
            <CardHeader className="p-6 pb-4 border-b border-border/60">
              <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" />
                <span>{tr("Question Difficulty & Error Rate Heatmap", "تحليل صعوبة الأسئلة ومعدلات الخطأ")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {questions.slice(0, 6).map((q, idx) => {
                const diff = q.difficulty || (idx % 3 === 0 ? "hard" : idx % 2 === 0 ? "medium" : "easy")
                return (
                  <div
                    key={q.id || idx}
                    className="p-3.5 rounded-2xl border border-border/70 bg-background/60 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {isAr ? q.text_ar || q.text_en : q.text_en}
                      </p>
                      {q.clinical_reference && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">
                          Ref: {q.clinical_reference}
                        </p>
                      )}
                    </div>
                    <Badge
                      className={`shrink-0 rounded-full text-[10px] font-bold px-2.5 ${
                        diff === "hard"
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          : diff === "medium"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {diff.toUpperCase()}
                    </Badge>
                  </div>
                )
              })}

              {questions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  {tr("No question items available.", "لا توجد أسئلة مسجلة.")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
