import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { checkRateLimit } from "@/lib/rateLimit"
import type { NotificationItem } from "@/types"

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(30),
  offset: z.coerce.number().min(0).optional().default(0),
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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  if (!checkRateLimit(req, res, { limit: 40, windowMs: 60_000, prefix: "student_notifications" })) {
    return
  }

  const auth = await authorizeUser(req)
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

  const { limit, offset } = parsed.data
  const userId = auth.user.id

  try {
    const { data: notifications, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      // Return empty if table not migrated yet
      return res.status(200).json({
        notifications: [],
        unreadCount: 0,
        totalCount: 0,
      })
    }

    const list = (notifications || []) as NotificationItem[]
    const unreadCount = list.filter((n) => !n.is_read).length

    return res.status(200).json({
      notifications: list,
      unreadCount,
      totalCount: list.length,
    })
  } catch (err) {
    console.error("Fetch notifications exception:", err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Internal server error",
    })
  }
}
