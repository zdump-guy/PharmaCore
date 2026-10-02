import { supabase } from "@/lib/supabaseClient"
import type { Course, Lecture, Quiz } from "@/types"

/**
 * Standard URL-safe slugifier
 * Turns "Analytical chemistry 1" -> "analytical-chemistry-1"
 * "Medicinal plants \"pharmacognosy\"" -> "medicinal-plants-pharmacognosy"
 */
export function slugify(text: string): string {
  if (!text) return ""
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/['"“”‘’]/g, "") // remove quotes
    .replace(/&/g, " and ") // replace & with and
    .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric except spaces and hyphens
    .trim()
    .replace(/[\s_]+/g, "-") // collapse spaces/underscores into single hyphen
    .replace(/-+/g, "-") // collapse repeated hyphens
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
}

export function isUuid(value: string): boolean {
  if (!value || typeof value !== "string") return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())
}

/**
 * Extract short UUID segment if slug contains disambiguation suffix, e.g.:
 * "plants-lecture-1-e5b8b992" -> "e5b8b992"
 */
export function extractShortId(slug: string): string | null {
  if (!slug) return null
  const match = slug.trim().match(/-([0-9a-f]{8})$/i)
  return match ? match[1].toLowerCase() : null
}

/**
 * Get slug for a course
 */
export function getCourseSlug(course: Pick<Course, "id" | "title_en">): string {
  const base = slugify(course.title_en)
  return base || course.id
}

/**
 * Get full path URL for a course
 */
export function getCourseUrl(course: Pick<Course, "id" | "title_en">, isAr = false): string {
  const slug = getCourseSlug(course)
  return `${isAr ? "/ar" : ""}/course/${slug}`
}

/**
 * Get slug for a lecture, disambiguating if colliding with other lectures
 */
export function getLectureSlug(
  lecture: Pick<Lecture, "id" | "title_en">,
  allLectures?: Pick<Lecture, "id" | "title_en">[]
): string {
  const base = slugify(lecture.title_en) || "lecture"
  if (allLectures && allLectures.length > 0) {
    const collisions = allLectures.filter(
      (l) => l.id !== lecture.id && (slugify(l.title_en) || "lecture") === base
    )
    if (collisions.length > 0) {
      // Disambiguate by appending first 8 chars of UUID
      return `${base}-${lecture.id.slice(0, 8)}`
    }
  }
  return base
}

/**
 * Get full path URL for a lecture
 */
export function getLectureUrl(
  lecture: Pick<Lecture, "id" | "title_en">,
  isAr = false,
  allLectures?: Pick<Lecture, "id" | "title_en">[]
): string {
  const slug = getLectureSlug(lecture, allLectures)
  return `${isAr ? "/ar" : ""}/lecture/${slug}`
}

/**
 * Get slug for a quiz, disambiguating if colliding with other quizzes
 */
export function getQuizSlug(
  quiz: Pick<Quiz, "id" | "title_en">,
  allQuizzes?: Pick<Quiz, "id" | "title_en">[]
): string {
  const base = slugify(quiz.title_en) || "quiz"
  if (allQuizzes && allQuizzes.length > 0) {
    const collisions = allQuizzes.filter(
      (q) => q.id !== quiz.id && (slugify(q.title_en) || "quiz") === base
    )
    if (collisions.length > 0) {
      return `${base}-${quiz.id.slice(0, 8)}`
    }
  }
  return base
}

/**
 * Get full path URL for a quiz
 */
export function getQuizUrl(
  quiz: Pick<Quiz, "id" | "title_en">,
  isAr = false,
  allQuizzes?: Pick<Quiz, "id" | "title_en">[]
): string {
  const slug = getQuizSlug(quiz, allQuizzes)
  return `${isAr ? "/ar" : ""}/quiz/${slug}`
}

/**
 * Resolve a course from Supabase by UUID or human-readable slug
 */
export async function resolveCourse(identifier: string): Promise<Course | null> {
  if (!supabase || !identifier) return null
  const clean = identifier.trim()

  // 1. Direct UUID match
  if (isUuid(clean)) {
    const { data } = await supabase.from("courses").select("*").eq("id", clean).maybeSingle()
    if (data) return data
  }

  // 2. Slug match across courses
  const { data: courses } = await supabase.from("courses").select("*")
  if (!courses || courses.length === 0) return null

  const target = clean.toLowerCase()
  const matched = courses.find((c) => getCourseSlug(c).toLowerCase() === target || c.id === target)
  return matched || null
}

/**
 * Resolve a lecture from Supabase by UUID, short UUID suffix, or human-readable slug
 */
export async function resolveLecture(identifier: string): Promise<{
  lecture: Lecture | null
  allLectures: Lecture[]
}> {
  if (!supabase || !identifier) return { lecture: null, allLectures: [] }
  const clean = identifier.trim()

  const { data: allLectures } = await supabase.from("lectures").select("*")
  const lectures = allLectures || []

  // 1. Direct UUID match
  if (isUuid(clean)) {
    const found = lectures.find((l) => l.id.toLowerCase() === clean.toLowerCase())
    if (found) return { lecture: found, allLectures: lectures }
  }

  // 2. Short UUID suffix match: e.g. "plants-lecture-1-80e87756"
  const shortId = extractShortId(clean)
  if (shortId) {
    const byShortId = lectures.find((l) => l.id.toLowerCase().startsWith(shortId))
    if (byShortId) return { lecture: byShortId, allLectures: lectures }
  }

  // 3. Match by computed slug
  const target = clean.toLowerCase()
  const matched = lectures.find(
    (l) => getLectureSlug(l, lectures).toLowerCase() === target || l.id === target
  )

  return { lecture: matched || null, allLectures: lectures }
}

/**
 * Resolve a quiz from Supabase by UUID, short UUID suffix, or human-readable slug
 */
export async function resolveQuiz(identifier: string): Promise<{
  quiz: Quiz | null
  allQuizzes: Quiz[]
}> {
  if (!supabase || !identifier) return { quiz: null, allQuizzes: [] }
  const clean = identifier.trim()

  const { data: allQuizzes } = await supabase.from("quizzes").select("*")
  const quizzes = allQuizzes || []

  // 1. Direct UUID match
  if (isUuid(clean)) {
    const found = quizzes.find((q) => q.id.toLowerCase() === clean.toLowerCase())
    if (found) return { quiz: found, allQuizzes: quizzes }
  }

  // 2. Short UUID suffix match
  const shortId = extractShortId(clean)
  if (shortId) {
    const byShortId = quizzes.find((q) => q.id.toLowerCase().startsWith(shortId))
    if (byShortId) return { quiz: byShortId, allQuizzes: quizzes }
  }

  // 3. Match by computed slug
  const target = clean.toLowerCase()
  const matched = quizzes.find(
    (q) => getQuizSlug(q, quizzes).toLowerCase() === target || q.id === target
  )

  return { quiz: matched || null, allQuizzes: quizzes }
}
