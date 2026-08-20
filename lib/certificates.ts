import { supabase } from "@/lib/supabaseClient"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import type { CertificateRecord, CertificateStatus, UserStreak, UserBadge } from "@/types"

export interface CertificateEligibilityResult {
  eligible: boolean
  reasons: string[]
}

export interface BadgeDefinition {
  id: string
  name: string
  name_ar?: string
  description: string
  description_ar?: string
  category: 'streak' | 'mastery' | 'performance'
  threshold?: number
  icon?: string
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'streak_3',
    name: 'Bronze Scholar',
    name_ar: 'الباحث البرونزي',
    description: 'Maintained a 3-day study streak',
    description_ar: 'الحفاظ على مواظبة دراسية لمدة 3 أيام متتالية',
    category: 'streak',
    threshold: 3,
    icon: 'bronze'
  },
  {
    id: 'streak_7',
    name: 'Silver Scholar',
    name_ar: 'الصيدلي الفضي',
    description: 'Maintained a 7-day study streak',
    description_ar: 'الحفاظ على مواظبة دراسية لمدة 7 أيام متتالية',
    category: 'streak',
    threshold: 7,
    icon: 'silver'
  },
  {
    id: 'streak_30',
    name: 'Gold Scholar',
    name_ar: 'الخبير السريري الذهبي',
    description: 'Maintained a 30-day study streak',
    description_ar: 'الحفاظ على مواظبة دراسية لمدة 30 يومًا متتالية',
    category: 'streak',
    threshold: 30,
    icon: 'gold'
  },
  {
    id: 'course_mastery',
    name: 'Course Mastery',
    name_ar: 'إتقان المقرر الأكاديمي',
    description: 'Completed 100% of course lectures and passed final quiz',
    description_ar: 'إتمام 100% من محاضرات المقرر واجتياز الاختبار النهائي بنجاح',
    category: 'mastery',
    icon: 'mastery'
  },
  {
    id: 'perfect_score',
    name: 'Perfect Score',
    name_ar: 'العلامة الكاملة',
    description: 'Achieved 100% score on a pharmacology assessment',
    description_ar: 'الحصول على دقة سريرية بنسبة 100% في التقييم الصيدلاني',
    category: 'performance',
    icon: 'perfect'
  }
]

// Fallback demo certificate database
const DEMO_CERTIFICATES: CertificateRecord[] = [
  {
    id: "cert_demo_001",
    certificate_code: "PHARMA-2026-A1B2-C3D4",
    user_id: "usr_demo_1",
    course_id: "crs_demo_1",
    student_name: "Dr. Tariq Hassan",
    course_title_en: "Advanced Neuropharmacology",
    course_title_ar: "علم الأدوية العصبية المتقدم",
    issue_date: "2026-08-20T12:00:00Z",
    final_score: 88,
    watch_completion_rate: 100,
    status: "valid",
    metadata: { honors: "Clinical Excellence" }
  },
  {
    id: "cert_demo_002",
    certificate_code: "PHARMA-2026-REEM-0001",
    user_id: "usr_demo_2",
    course_id: "crs_demo_2",
    student_name: "Reem Al-Ghamdi",
    course_title_en: "Clinical Hemostasis & Anticoagulation",
    course_title_ar: "علم الأدوية السريرية لتخثر الدم ومضادات التجلط",
    issue_date: "2026-08-20T14:30:00Z",
    final_score: 95,
    watch_completion_rate: 100,
    status: "valid",
    metadata: { honors: "High Distinction" }
  },
  {
    id: "cert_demo_003",
    certificate_code: "PHARMA-2026-REV0-0001",
    user_id: "usr_demo_3",
    course_id: "crs_demo_3",
    student_name: "Revoked Student",
    course_title_en: "Basic Pharmacokinetics",
    course_title_ar: "الحركية الدوائية الأساسية",
    issue_date: "2026-01-10T10:00:00Z",
    final_score: 80,
    watch_completion_rate: 100,
    status: "revoked"
  }
]

/**
 * Evaluates whether a student meets the strict mastery criteria for certificate issuance:
 * - Exactly 100% video/lecture watch completion rate (watchCompletionRate === 100)
 * - >= 80% overall quiz average score (quizAverage >= 80)
 */
export function evaluateCertificateEligibility(
  watchCompletionRate: number | string,
  quizAverage: number | string
): CertificateEligibilityResult {
  const reasons: string[] = []

  const watchRate = Number(watchCompletionRate)
  const quizScore = Number(quizAverage)

  if (isNaN(watchRate) || isNaN(quizScore)) {
    return {
      eligible: false,
      reasons: ["Invalid numeric inputs for completion rate or quiz score"]
    }
  }

  if (watchRate < 100) {
    reasons.push(`Lecture watch completion rate is ${watchRate.toFixed(1)}% (requires exactly 100%)`)
  }

  if (quizScore < 80) {
    reasons.push(`Quiz average score is ${quizScore.toFixed(1)}% (requires minimum 80.0%)`)
  }

  const eligible = reasons.length === 0

  return {
    eligible,
    reasons
  }
}

/**
 * Generates a unique, standardized certificate verification code
 * Format: PHARMA-YYYY-XXXX-XXXX
 */
export function generateCertificateCode(
  courseId: string,
  userId: string,
  issueDate: Date = new Date()
): string {
  const year = issueDate.getFullYear()
  const rawSeed = `${courseId}:${userId}:${issueDate.getTime()}`
  let hash = 0
  for (let i = 0; i < rawSeed.length; i++) {
    hash = (hash << 5) - hash + rawSeed.charCodeAt(i)
    hash |= 0
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0")
  const part1 = hex.slice(0, 4)
  const part2 = hex.slice(4, 8)

  return `PHARMA-${year}-${part1}-${part2}`
}

/**
 * Creates an authoritative certificate record
 */
export function issueCertificateRecord({
  id,
  userId,
  courseId,
  studentName,
  courseTitleEn,
  courseTitleAr = "",
  watchCompletionRate,
  quizAverage,
  issueDate = new Date().toISOString(),
  metadata
}: {
  id?: string
  userId: string
  courseId: string
  studentName: string
  courseTitleEn: string
  courseTitleAr?: string
  watchCompletionRate: number | string
  quizAverage: number | string
  issueDate?: string
  metadata?: Record<string, unknown>
}): CertificateRecord {
  const eligibility = evaluateCertificateEligibility(watchCompletionRate, quizAverage)
  if (!eligibility.eligible) {
    throw new Error(`Cannot issue certificate: ${eligibility.reasons.join(", ")}`)
  }

  const numericWatchRate = Number(watchCompletionRate)
  const numericQuizAverage = Number(quizAverage)
  const certificateCode = generateCertificateCode(courseId, userId, new Date(issueDate))

  return {
    id: id || `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    certificate_code: certificateCode,
    user_id: userId,
    course_id: courseId,
    student_name: studentName,
    course_title_en: courseTitleEn,
    course_title_ar: courseTitleAr,
    issue_date: issueDate,
    final_score: numericQuizAverage,
    watch_completion_rate: numericWatchRate,
    status: "valid" as CertificateStatus,
    metadata: metadata || null
  }
}

/**
 * Public certificate verification engine for /verify/[code]
 */
export function verifyCertificatePublic(
  certificateDatabase: CertificateRecord[],
  code?: string | null
): { verified: boolean; certificate: Partial<CertificateRecord> | null; error: string | null } {
  if (!code || typeof code !== "string" || !code.trim()) {
    return {
      verified: false,
      certificate: null,
      error: "Missing or invalid certificate verification code"
    }
  }

  const normalizedCode = code.trim().toUpperCase()
  const record = certificateDatabase.find(
    (c) => c.certificate_code && c.certificate_code.toUpperCase() === normalizedCode
  )

  if (!record) {
    return {
      verified: false,
      certificate: null,
      error: "Certificate not found with the provided verification code"
    }
  }

  if (record.status === "revoked") {
    return {
      verified: false,
      certificate: record,
      error: "This certificate has been revoked by administration"
    }
  }

  if (record.status !== "valid") {
    return {
      verified: false,
      certificate: record,
      error: `Certificate status is invalid (${record.status})`
    }
  }

  return {
    verified: true,
    certificate: {
      certificate_code: record.certificate_code,
      student_name: record.student_name,
      course_title_en: record.course_title_en,
      course_title_ar: record.course_title_ar,
      issue_date: record.issue_date,
      final_score: record.final_score,
      watch_completion_rate: record.watch_completion_rate,
      status: record.status,
      metadata: record.metadata
    },
    error: null
  }
}

/**
 * Calculates calendar day difference between two dates (YYYY-MM-DD)
 */
export function getDaysDifference(dateA: string, dateB: string): number {
  const d1 = new Date(dateA)
  const d2 = new Date(dateB)
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate())
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate())
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24))
}

/**
 * Updates a user's daily study streak based on a new activity event
 */
export function recordUserActivity(
  currentStreakRecord: { current_streak?: number; longest_streak?: number; last_active_date?: string | null } | null | undefined,
  activityDate: string
): { current_streak: number; longest_streak: number; last_active_date: string } {
  if (!activityDate || typeof activityDate !== "string") {
    throw new Error("activityDate must be a valid YYYY-MM-DD string")
  }

  const record = currentStreakRecord || {
    current_streak: 0,
    longest_streak: 0,
    last_active_date: null
  }

  const current_streak = record.current_streak || 0
  const longest_streak = record.longest_streak || 0
  const last_active_date = record.last_active_date || null

  if (!last_active_date) {
    return {
      current_streak: 1,
      longest_streak: Math.max(1, longest_streak),
      last_active_date: activityDate
    }
  }

  const diff = getDaysDifference(last_active_date, activityDate)

  if (diff < 0) {
    return {
      current_streak,
      longest_streak,
      last_active_date
    }
  }

  if (diff === 0) {
    return {
      current_streak,
      longest_streak,
      last_active_date
    }
  }

  if (diff === 1) {
    const newStreak = current_streak + 1
    const newLongest = Math.max(longest_streak, newStreak)
    return {
      current_streak: newStreak,
      longest_streak: newLongest,
      last_active_date: activityDate
    }
  }

  return {
    current_streak: 1,
    longest_streak: Math.max(longest_streak, 1),
    last_active_date: activityDate
  }
}

/**
 * Evaluates all earned badges for a student given current stats
 */
export function evaluateMilestoneBadges(
  stats: {
    currentStreak?: number
    longestStreak?: number
    courseCompleted?: boolean
    perfectScore?: boolean
  },
  existingBadgeIds: string[] = []
): BadgeDefinition[] {
  const existingSet = new Set(existingBadgeIds)
  const newlyAwarded: BadgeDefinition[] = []

  const streak = Math.max(stats.currentStreak || 0, stats.longestStreak || 0)

  if (streak >= 3 && !existingSet.has("streak_3")) {
    const badge = BADGE_DEFINITIONS.find((b) => b.id === "streak_3")
    if (badge) newlyAwarded.push(badge)
  }
  if (streak >= 7 && !existingSet.has("streak_7")) {
    const badge = BADGE_DEFINITIONS.find((b) => b.id === "streak_7")
    if (badge) newlyAwarded.push(badge)
  }
  if (streak >= 30 && !existingSet.has("streak_30")) {
    const badge = BADGE_DEFINITIONS.find((b) => b.id === "streak_30")
    if (badge) newlyAwarded.push(badge)
  }

  if (stats.courseCompleted && !existingSet.has("course_mastery")) {
    const badge = BADGE_DEFINITIONS.find((b) => b.id === "course_mastery")
    if (badge) newlyAwarded.push(badge)
  }

  if (stats.perfectScore && !existingSet.has("perfect_score")) {
    const badge = BADGE_DEFINITIONS.find((b) => b.id === "perfect_score")
    if (badge) newlyAwarded.push(badge)
  }

  return newlyAwarded
}

/**
 * Looks up certificate by verification code with Supabase and demo fallback
 */
export async function lookupCertificateByCode(code: string): Promise<{
  verified: boolean
  certificate: CertificateRecord | null
  error: string | null
}> {
  if (!code || !code.trim()) {
    return {
      verified: false,
      certificate: null,
      error: "Missing or invalid certificate verification code"
    }
  }

  const normalizedCode = code.trim().toUpperCase()

  // 1. Try Supabase
  const client = supabaseAdmin || supabase
  if (client) {
    try {
      const { data, error } = await client
        .from("certificates")
        .select("*")
        .ilike("certificate_code", normalizedCode)
        .maybeSingle()

      if (!error && data) {
        const record = data as CertificateRecord
        if (record.status === "revoked") {
          return {
            verified: false,
            certificate: record,
            error: "This certificate has been revoked by administration"
          }
        }
        if (record.status !== "valid") {
          return {
            verified: false,
            certificate: record,
            error: `Certificate status is invalid (${record.status})`
          }
        }
        return {
          verified: true,
          certificate: record,
          error: null
        }
      }
    } catch (e) {
      console.warn("Supabase certificate query warning:", e)
    }
  }

  // 2. Check demo fallback
  const demoMatch = DEMO_CERTIFICATES.find(
    (c) => c.certificate_code.toUpperCase() === normalizedCode
  )
  if (demoMatch) {
    if (demoMatch.status === "revoked") {
      return {
        verified: false,
        certificate: demoMatch,
        error: "This certificate has been revoked by administration"
      }
    }
    return {
      verified: true,
      certificate: demoMatch,
      error: null
    }
  }

  return {
    verified: false,
    certificate: null,
    error: "Certificate not found with the provided verification code"
  }
}

/**
 * Fetch all certificates for a specific user
 */
export async function getUserCertificates(userId: string): Promise<CertificateRecord[]> {
  if (!userId) return []

  const client = supabaseAdmin || supabase
  if (client) {
    try {
      const { data, error } = await client
        .from("certificates")
        .select("*")
        .eq("user_id", userId)
        .order("issue_date", { ascending: false })

      if (!error && data && data.length > 0) {
        return data as CertificateRecord[]
      }
    } catch (e) {
      console.warn("Could not fetch certificates from Supabase:", e)
    }
  }

  // Demo fallback
  return DEMO_CERTIFICATES.filter((c) => c.user_id === userId)
}

/**
 * Fetch user streak record
 */
export async function getUserStreak(userId: string): Promise<UserStreak> {
  const defaultStreak: UserStreak = {
    user_id: userId,
    current_streak: 1,
    longest_streak: 1,
    last_activity_date: new Date().toISOString().split("T")[0],
    updated_at: new Date().toISOString()
  }

  if (!userId) return defaultStreak

  const client = supabaseAdmin || supabase
  if (client) {
    try {
      const { data, error } = await client
        .from("user_streaks")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

      if (!error && data) {
        return data as UserStreak
      }
    } catch (e) {
      console.warn("Could not fetch streak from Supabase:", e)
    }
  }

  return defaultStreak
}

/**
 * Fetch user earned badges
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  if (!userId) return []

  const client = supabaseAdmin || supabase
  if (client) {
    try {
      const { data, error } = await client
        .from("user_badges")
        .select("*")
        .eq("user_id", userId)
        .order("awarded_at", { ascending: true })

      if (!error && data && data.length > 0) {
        return data as UserBadge[]
      }
    } catch (e) {
      console.warn("Could not fetch user badges from Supabase:", e)
    }
  }

  return [
    {
      id: "badge_1",
      user_id: userId,
      badge_type: "streak_3",
      awarded_at: new Date(Date.now() - 86400000 * 3).toISOString()
    }
  ]
}
