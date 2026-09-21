import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { checkRateLimit } from "@/lib/rateLimit"

const updateProfileSchema = z.object({
  first_name: z.string().trim().max(60).optional(),
  last_name: z.string().trim().max(60).optional(),
  full_name: z.string().trim().min(2).max(120).optional(),
  phone_number: z.string().trim().max(30).optional().nullable(),
  university: z.string().trim().max(100).optional().nullable(),
  faculty: z.string().trim().max(100).optional().nullable(),
  start_year: z.number().int().min(2000).max(2100).optional().nullable(),
  predicted_end_year: z.number().int().min(2000).max(2100).optional().nullable(),
  current_year: z.number().int().min(1).max(10).optional().nullable(),
  email_notifications_enabled: z.boolean().optional(),
})


async function authorizeUser(req: NextApiRequest) {
  if (!supabaseAdmin) return { error: "Supabase not configured", status: 503 } as const
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
  if (!checkRateLimit(req, res, { limit: 30, windowMs: 60_000, prefix: "user_profile" })) {
    return
  }

  const auth = await authorizeUser(req)
  if ("error" in auth) return res.status(auth.status).json({ error: auth.error })
  if (!supabaseAdmin) return res.status(503).json({ error: "Supabase not configured" })

  const userId = auth.user.id

  // ─── GET: Fetch Profile + Stats ─────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const { data: profile, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", userId)
        .single()

      if (error && error.code !== "PGRST116") {
        return res.status(500).json({ error: error.message })
      }

      // Fetch progress metrics from analytics and real course enrollments
      const [{ count: videoViewsCount }, { count: quizAttemptsCount }, { count: enrollmentsCount }] = await Promise.all([
        supabaseAdmin
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .like("event_name", "video_%"),
        supabaseAdmin
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .like("event_name", "quiz_%"),
        supabaseAdmin
          .from("course_enrollments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "active"),
      ])

      const totalVideos = videoViewsCount || 0
      const totalQuizzes = quizAttemptsCount || 0
      const activeEnrollments = enrollmentsCount || 0

      return res.status(200).json({
        profile: profile || {
          id: userId,
          email: auth.user.email,
          full_name: auth.user.user_metadata?.full_name || "Student",
          role: "student",
          status: "active",
        },
        metrics: {
          videosWatched: totalVideos,
          quizzesTaken: totalQuizzes,
          hoursStudied: Math.round((totalVideos * 0.45) * 10) / 10,
          streakDays: Math.max(1, Math.min(30, Math.ceil(totalVideos / 2) || 1)),
          coursesEnrolled: activeEnrollments,
        },
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load profile"
      return res.status(500).json({ error: message })
    }
  }

  // ─── PATCH: Update Profile ──────────────────────────────────────────────────
  if (req.method === "PATCH") {
    const parsed = updateProfileSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() })
    }

    const payload = parsed.data
    // Compute full_name if first_name / last_name passed
    if (payload.first_name || payload.last_name) {
      payload.full_name = [payload.first_name, payload.last_name].filter(Boolean).join(" ").trim()
    }

    // Build strict database update payload excluding computed/virtual fields like current_year
    const dbUpdatePayload: Record<string, string | number | boolean | null | undefined> = {}
    if (payload.first_name !== undefined) dbUpdatePayload.first_name = payload.first_name
    if (payload.last_name !== undefined) dbUpdatePayload.last_name = payload.last_name
    if (payload.full_name !== undefined) dbUpdatePayload.full_name = payload.full_name
    if (payload.phone_number !== undefined) dbUpdatePayload.phone_number = payload.phone_number
    if (payload.university !== undefined) dbUpdatePayload.university = payload.university
    if (payload.faculty !== undefined) dbUpdatePayload.faculty = payload.faculty
    if (payload.start_year !== undefined) dbUpdatePayload.start_year = payload.start_year
    if (payload.predicted_end_year !== undefined) dbUpdatePayload.predicted_end_year = payload.predicted_end_year
    if (payload.email_notifications_enabled !== undefined) {
      dbUpdatePayload.email_notifications_enabled = payload.email_notifications_enabled
    }

    try {
      let { data: updated, error } = await supabaseAdmin
        .from("users")
        .update(dbUpdatePayload)
        .eq("id", userId)
        .select()
        .single()

      // Graceful fallback if email_notifications_enabled column has not been migrated yet on remote DB
      if (
        error &&
        (error.message?.includes("email_notifications_enabled") ||
          error.code === "42703" ||
          error.code === "PGRST204" ||
          error.message?.includes("schema cache"))
      ) {
        const fallbackPayload = { ...dbUpdatePayload }
        delete fallbackPayload.email_notifications_enabled
        const fallbackRes = await supabaseAdmin
          .from("users")
          .update(fallbackPayload)
          .eq("id", userId)
          .select()
          .single()
        updated = fallbackRes.data
        error = fallbackRes.error
      }

      if (error) {
        console.error("Profile update DB error:", error)
        return res.status(500).json({ error: error.message })
      }

      // Also update auth user_metadata full_name
      if (dbUpdatePayload.full_name) {
        try {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { full_name: dbUpdatePayload.full_name },
          })
        } catch (metaErr) {
          console.warn("User metadata sync warning:", metaErr)
        }
      }

      return res.status(200).json({ profile: updated })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile"
      console.error("Exception in profile update:", err)
      return res.status(500).json({ error: message })
    }
  }

  return res.status(405).json({ error: "Method not allowed" })
}
