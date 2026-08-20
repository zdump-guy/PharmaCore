export interface GradebookStudent {
  id: string
  name: string
  email: string
  university?: string
  cohort?: string
}

export interface LectureProgressRecord {
  user_id: string
  lecture_id: string
  completed: boolean
}

export interface QuizSubmissionRecord {
  user_id: string
  quiz_id: string
  score_percentage: number
}

export interface CertificateSummaryRecord {
  user_id: string
  course_id: string
  certificate_code: string
  status: "valid" | "revoked"
}

export interface GradebookRow {
  student_id: string
  student_name: string
  email: string
  university: string
  cohort: string
  lectures_watched: number
  total_lectures: number
  watch_completion_rate: number
  quiz_scores: Record<string, number | null>
  quiz_average: number
  certificate_status: "issued" | "eligible" | "not_eligible"
  certificate_code: string | null
}

export interface GradebookFilters {
  university?: string
  cohort?: string
  certificate_status?: string
  search?: string
}

export function generateGradebookMatrix({
  students = [],
  lectures = [],
  lecture_progress = [],
  quizzes = [],
  quiz_submissions = [],
  certificates = [],
}: {
  students: GradebookStudent[]
  lectures: { id: string; course_id?: string | null; title_en?: string; title_ar?: string }[]
  lecture_progress: LectureProgressRecord[]
  quizzes: { id: string; course_id?: string | null; title_en?: string; title_ar?: string }[]
  quiz_submissions: QuizSubmissionRecord[]
  certificates: CertificateSummaryRecord[]
}): GradebookRow[] {
  const totalLecturesCount = lectures.length

  return students.map((student) => {
    // 1. Calculate lecture completion
    const watchedLectures = lecture_progress.filter(
      (lp) => lp.user_id === student.id && lp.completed
    )
    const watchedCount = watchedLectures.length
    const watchCompletionRate =
      totalLecturesCount > 0
        ? Math.round((watchedCount / totalLecturesCount) * 1000) / 10
        : 0

    // 2. Calculate itemized quiz scores & average
    const studentSubmissions = quiz_submissions.filter((qs) => qs.user_id === student.id)
    const quizScoresMap: Record<string, number | null> = {}
    let totalScoreSum = 0

    quizzes.forEach((q) => {
      const sub = studentSubmissions.find((s) => s.quiz_id === q.id)
      if (sub) {
        quizScoresMap[q.id] = sub.score_percentage
        totalScoreSum += sub.score_percentage
      } else {
        quizScoresMap[q.id] = null
      }
    })

    const submittedCount = studentSubmissions.length
    const quizAverage =
      submittedCount > 0
        ? Math.round((totalScoreSum / submittedCount) * 10) / 10
        : 0

    // 3. Certificate status
    const cert = certificates.find(
      (c) => c.user_id === student.id && c.status === "valid"
    )
    let certificateStatus: "issued" | "eligible" | "not_eligible" = "not_eligible"
    let certificateCode: string | null = null

    if (cert) {
      certificateStatus = "issued"
      certificateCode = cert.certificate_code
    } else if (watchCompletionRate >= 100 && quizAverage >= 80) {
      certificateStatus = "eligible"
    }

    return {
      student_id: student.id,
      student_name: student.name,
      email: student.email,
      university: student.university || "Unassigned",
      cohort: student.cohort || "Default",
      lectures_watched: watchedCount,
      total_lectures: totalLecturesCount,
      watch_completion_rate: watchCompletionRate,
      quiz_scores: quizScoresMap,
      quiz_average: quizAverage,
      certificate_status: certificateStatus,
      certificate_code: certificateCode,
    }
  })
}

export function filterGradebookRoster(
  rows: GradebookRow[],
  filters: GradebookFilters = {}
): GradebookRow[] {
  return rows.filter((row) => {
    if (
      filters.university &&
      filters.university !== "all" &&
      row.university !== filters.university
    ) {
      return false
    }
    if (
      filters.cohort &&
      filters.cohort !== "all" &&
      row.cohort !== filters.cohort
    ) {
      return false
    }
    if (
      filters.certificate_status &&
      filters.certificate_status !== "all" &&
      row.certificate_status !== filters.certificate_status
    ) {
      return false
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim()
      const matchName = row.student_name.toLowerCase().includes(q)
      const matchEmail = row.email.toLowerCase().includes(q)
      const matchCode = (row.certificate_code || "").toLowerCase().includes(q)
      if (!matchName && !matchEmail && !matchCode) return false
    }
    return true
  })
}

export function exportGradebookToCSV(
  rows: GradebookRow[],
  quizzes: { id: string; title_en?: string; title_ar?: string }[] = []
): string {
  const escapeCsv = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return ""
    const str = String(val)
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const headers = [
    "Student ID",
    "Student Name",
    "Email",
    "University",
    "Cohort",
    "Lectures Watched",
    "Total Lectures",
    "Watch Completion (%)",
    ...quizzes.map((q) => `Quiz: ${q.title_en || q.id}`),
    "Quiz Average (%)",
    "Certificate Status",
    "Certificate Code",
  ]

  const csvRows = [headers.map(escapeCsv).join(",")]

  rows.forEach((row) => {
    const rowValues = [
      row.student_id,
      row.student_name,
      row.email,
      row.university,
      row.cohort,
      row.lectures_watched,
      row.total_lectures,
      `${row.watch_completion_rate}%`,
      ...quizzes.map((q) => {
        const score = row.quiz_scores[q.id]
        return score !== null ? `${score}%` : "N/A"
      }),
      `${row.quiz_average}%`,
      row.certificate_status,
      row.certificate_code || "N/A",
    ]
    csvRows.push(rowValues.map(escapeCsv).join(","))
  })

  return csvRows.join("\r\n")
}
