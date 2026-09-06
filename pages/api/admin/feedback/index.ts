import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

const filterSchema = z.object({
  feedback_type: z.enum(["all", "technical", "academic"]).optional().default("all"),
  status: z.enum(["all", "open", "under_review", "in_progress", "resolved", "dismissed"]).optional().default("all"),
  severity: z.enum(["all", "low", "medium", "high", "critical"]).optional().default("all"),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
})

async function authorize(req: NextApiRequest) {
  if (!supabaseAdmin) return { error: "Supabase is not configured", status: 503 } as const
  const header = req.headers.authorization
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) return { error: "Unauthorized", status: 401 } as const

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return { error: "Unauthorized", status: 401 } as const

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("id, role, full_name, email")
    .eq("id", user.id)
    .single()
  if (!profile || !["dev", "super_admin", "mentor"].includes(profile.role)) {
    return { error: "Forbidden", status: 403 } as const
  }

  return { user, profile, status: 200 } as const
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const requester = await authorize(req)
  if ("error" in requester) {
    return res.status(requester.status).json({ error: requester.error })
  }

  const parsed = filterSchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query parameters", details: parsed.error.flatten() })
  }

  const { feedback_type, status, severity, search, limit, offset } = parsed.data

  if (!supabaseAdmin) {
    return res.status(503).json({ error: "Supabase is not configured" })
  }

  try {
    let query = supabaseAdmin
      .from("feedback_submissions")
      .select(
        `
        *,
        user:users!user_id (id, full_name, email, role, university, faculty),
        course:courses!course_id (id, title_en, title_ar),
        lecture:lectures!lecture_id (id, title_en, title_ar)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (feedback_type !== "all") {
      query = query.eq("feedback_type", feedback_type)
    }

    if (status !== "all") {
      query = query.eq("status", status)
    }

    if (severity !== "all") {
      query = query.eq("severity", severity)
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`
      query = query.or(`title.ilike.${term},description.ilike.${term},contact_email.ilike.${term},contact_name.ilike.${term}`)
    }

    const { data: submissions, count, error } = await query

    if (error) {
      console.error("Admin feedback fetch error:", error)
      return res.status(500).json({ error: "Failed to fetch feedback submissions: " + error.message })
    }

    // Aggregate summary metrics across all submissions
    const { data: allStats, error: statsErr } = await supabaseAdmin
      .from("feedback_submissions")
      .select("feedback_type, status")

    let totalCount = 0
    let openTechnicalCount = 0
    let openAcademicCount = 0
    let resolvedCount = 0
    let inProgressCount = 0

    if (!statsErr && allStats) {
      totalCount = allStats.length
      for (const item of allStats) {
        if (item.status === "resolved") {
          resolvedCount++
        } else if (item.status === "open" || item.status === "under_review" || item.status === "in_progress") {
          if (item.status === "in_progress") inProgressCount++
          if (item.feedback_type === "technical") {
            openTechnicalCount++
          } else if (item.feedback_type === "academic") {
            openAcademicCount++
          }
        }
      }
    }

    return res.status(200).json({
      submissions: submissions || [],
      total: count || 0,
      stats: {
        totalCount,
        openTechnicalCount,
        openAcademicCount,
        resolvedCount,
        inProgressCount,
      },
    })
  } catch (err) {
    console.error("Admin feedback API exception:", err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Internal server error",
    })
  }
}
