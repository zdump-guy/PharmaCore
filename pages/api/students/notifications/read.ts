import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { checkRateLimit } from "@/lib/rateLimit"

const bodySchema = z.object({
  notificationId: z.string().uuid().optional(),
  notification_id: z.string().uuid().optional(),
  markAll: z.boolean().optional(),
  mark_all: z.boolean().optional(),
}).refine((d) => Boolean(d.notificationId || d.notification_id || d.markAll || d.mark_all), {
  message: "Either notificationId or markAll must be provided",
  path: ["notification_id"],
})

async function authorizeUser(req: NextApiRequest) {
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
  if (req.method !== "POST" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  if (!checkRateLimit(req, res, { limit: 30, windowMs: 60_000, prefix: "notifications_read" })) {
    return
  }

  const auth = await authorizeUser(req)
  if ("error" in auth) {
    return res.status(auth.status).json({ error: auth.error })
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: "Database service unavailable" })
  }

  const parsed = bodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request payload", details: parsed.error.flatten() })
  }

  const targetId = parsed.data.notificationId || parsed.data.notification_id
  const isMarkAll = Boolean(parsed.data.markAll || parsed.data.mark_all)
  const userId = auth.user.id

  try {
    let query = supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId) // Enforce IDOR protection: cannot modify other users' notifications

    if (targetId) {
      query = query.eq("id", targetId)
    } else if (isMarkAll) {
      query = query.eq("is_read", false)
    }

    const { error } = await query

    if (error) {
      return res.status(500).json({ error: "Failed to update notification status: " + error.message })
    }

    return res.status(200).json({
      success: true,
      message: targetId ? "Notification marked as read" : "All notifications marked as read",
    })
  } catch (err) {
    console.error("Mark notification read exception:", err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Internal server error",
    })
  }
}
