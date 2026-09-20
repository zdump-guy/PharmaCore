import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { checkRateLimit } from "@/lib/rateLimit"
import type { StudentQuestionItem, UserRole } from "@/types"

const querySchema = z.object({
  status: z.enum(["all", "answered", "pending"]).optional().default("all"),
  search: z.string().max(100).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
})

async function authorizeStudent(req: NextApiRequest) {
  if (!supabaseAdmin) return { error: "Database service unavailable", status: 503 } as const
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) return { error: "Unauthorized", status: 401 } as const

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) return { error: "Unauthorized", status: 401 } as const
  return { user, status: 200 } as const
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  if (!checkRateLimit(req, res, { limit: 30, windowMs: 60_000, prefix: "student_questions" })) {
    return
  }

  const auth = await authorizeStudent(req)
  if ("error" in auth) {
    return res.status(auth.status).json({ error: auth.error })
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: "Database service unavailable" })
  }

  const parsed = querySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query parameters", details: parsed.error.flatten() })
  }

  const { status, search, limit, offset } = parsed.data
  const userId = auth.user.id
  const userEmail = auth.user.email

  try {
    // Query questions submitted by this student (IDOR protected)
    const query = supabaseAdmin
      .from("community_questions")
      .select(`
        id,
        lecture_id,
        user_id,
        author_name,
        author_email,
        is_anonymous,
        text,
        created_at,
        answers:community_answers (
          id,
          question_id,
          responder_id,
          text,
          created_at,
          responder:users!community_answers_responder_id_fkey (
            id,
            full_name,
            role
          )
        ),
        lecture:lectures!community_questions_lecture_id_fkey (
          id,
          title_en,
          title_ar,
          course_id,
          course:courses!lectures_course_id_fkey (
            id,
            title_en,
            title_ar
          )
        )
      `)
      .or(`user_id.eq.${userId}${userEmail ? `,author_email.eq.${userEmail}` : ""}`)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: rawQuestions, error } = await query

    if (error) {
      console.error("Student questions fetch error:", error)
      return res.status(500).json({ error: "Failed to fetch student questions: " + error.message })
    }

    interface RawQuestionRow {
      id: string
      lecture_id: string
      user_id: string | null
      author_name: string
      author_email: string | null
      is_anonymous?: boolean
      text: string
      created_at: string
      answers?: Array<{
        id: string
        question_id: string
        responder_id: string | null
        text: string
        created_at: string
        responder?: {
          id: string
          full_name: string | null
          role: UserRole
        }
      }>
      lecture?: {
        id: string
        title_en: string
        title_ar: string
        course_id?: string
        course?: {
          id: string
          title_en: string
          title_ar: string
        } | Array<{
          id: string
          title_en: string
          title_ar: string
        }>
      } | Array<{
        id: string
        title_en: string
        title_ar: string
        course_id?: string
        course?: {
          id: string
          title_en: string
          title_ar: string
        } | Array<{
          id: string
          title_en: string
          title_ar: string
        }>
      }>
    }

    const items: StudentQuestionItem[] = ((rawQuestions || []) as unknown as RawQuestionRow[]).map((q) => {
      const lectureObj = Array.isArray(q.lecture) ? q.lecture[0] : q.lecture
      const courseObj = lectureObj?.course ? (Array.isArray(lectureObj.course) ? lectureObj.course[0] : lectureObj.course) : null

      return {
        id: q.id,
        lecture_id: q.lecture_id,
        user_id: q.user_id,
        author_name: q.author_name,
        author_email: q.author_email,
        is_anonymous: q.is_anonymous,
        text: q.text,
        created_at: q.created_at,
        answers: q.answers || [],
        course_id: courseObj?.id || lectureObj?.course_id || null,
        course_title_en: courseObj?.title_en || null,
        course_title_ar: courseObj?.title_ar || null,
        lecture_title_en: lectureObj?.title_en || null,
        lecture_title_ar: lectureObj?.title_ar || null,
      }
    })

    // Filter by status if requested
    let filtered = items
    if (status === "answered") {
      filtered = filtered.filter((q) => (q.answers || []).length > 0)
    } else if (status === "pending") {
      filtered = filtered.filter((q) => (q.answers || []).length === 0)
    }

    // Filter by search text if provided
    if (search && search.trim()) {
      const s = search.trim().toLowerCase()
      filtered = filtered.filter(
        (q) =>
          q.text.toLowerCase().includes(s) ||
          q.lecture_title_en?.toLowerCase().includes(s) ||
          q.lecture_title_ar?.toLowerCase().includes(s) ||
          q.course_title_en?.toLowerCase().includes(s) ||
          q.course_title_ar?.toLowerCase().includes(s)
      )
    }

    const totalAnswered = items.filter((q) => (q.answers || []).length > 0).length
    const totalPending = items.filter((q) => (q.answers || []).length === 0).length

    return res.status(200).json({
      questions: filtered,
      stats: {
        total: items.length,
        answered: totalAnswered,
        pending: totalPending,
      },
    })
  } catch (err) {
    console.error("Student questions exception:", err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Internal server error",
    })
  }
}
