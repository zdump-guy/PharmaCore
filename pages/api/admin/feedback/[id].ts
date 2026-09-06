import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

const patchSchema = z.object({
  status: z.enum(["open", "under_review", "in_progress", "resolved", "dismissed"]).optional(),
  admin_notes: z.string().max(5000).optional().nullable(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
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
  const { id } = req.query
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid feedback ID" })
  }

  const requester = await authorize(req)
  if ("error" in requester) {
    return res.status(requester.status).json({ error: requester.error })
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: "Supabase is not configured" })
  }

  if (req.method === "PATCH") {
    const parsed = patchSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (parsed.data.status !== undefined) {
      updates.status = parsed.data.status
      if (parsed.data.status === "resolved") {
        updates.resolved_by = requester.user.id
        updates.resolved_at = new Date().toISOString()
      } else if (parsed.data.status === "open") {
        updates.resolved_by = null
        updates.resolved_at = null
      }
    }

    if (parsed.data.admin_notes !== undefined) {
      updates.admin_notes = parsed.data.admin_notes?.trim() || null
    }

    if (parsed.data.severity !== undefined) {
      updates.severity = parsed.data.severity
    }

    try {
      const { data, error } = await supabaseAdmin
        .from("feedback_submissions")
        .update(updates)
        .eq("id", id)
        .select(
          `
          *,
          user:users!user_id (id, full_name, email, role, university, faculty),
          course:courses!course_id (id, title_en, title_ar),
          lecture:lectures!lecture_id (id, title_en, title_ar)
        `
        )
        .single()

      if (error) {
        return res.status(500).json({ error: "Failed to update feedback: " + error.message })
      }

      return res.status(200).json({
        success: true,
        submission: data,
        message: "Feedback updated successfully.",
      })
    } catch (err) {
      return res.status(500).json({
        error: err instanceof Error ? err.message : "Internal server error",
      })
    }
  }

  if (req.method === "DELETE") {
    try {
      const { error } = await supabaseAdmin
        .from("feedback_submissions")
        .delete()
        .eq("id", id)

      if (error) {
        return res.status(500).json({ error: "Failed to delete feedback: " + error.message })
      }

      return res.status(200).json({
        success: true,
        message: "Feedback deleted successfully.",
      })
    } catch (err) {
      return res.status(500).json({
        error: err instanceof Error ? err.message : "Internal server error",
      })
    }
  }

  return res.status(405).json({ error: "Method not allowed" })
}
