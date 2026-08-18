import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

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

      // Fetch progress metrics from analytics or courses
      const { count: videoViewsCount } = await supabaseAdmin
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .like("event_name", "video_%")

      const { count: quizAttemptsCount } = await supabaseAdmin
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .like("event_name", "quiz_%")

      return res.status(200).json({
        profile: profile || {
          id: userId,
          email: auth.user.email,
          full_name: auth.user.user_metadata?.full_name || "Student",
          role: "student",
          status: "active",
        },
        metrics: {
          videosWatched: videoViewsCount || 0,
          quizzesTaken: quizAttemptsCount || 0,
          hoursStudied: Math.round(((videoViewsCount || 0) * 0.45) * 10) / 10,
          streakDays: 4,
          coursesEnrolled: 3,
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

    try {
      const { data: updated, error } = await supabaseAdmin
        .from("users")
        .update(payload)
        .eq("id", userId)
        .select()
        .single()

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      // Also update auth user_metadata full_name
      if (payload.full_name) {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { full_name: payload.full_name },
        })
      }

      return res.status(200).json({ profile: updated })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile"
      return res.status(500).json({ error: message })
    }
  }

  return res.status(405).json({ error: "Method not allowed" })
}
