import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { checkRateLimit } from "@/lib/rateLimit"
import { sanitizeInputText } from "@/lib/utils"
import { sendBroadcastAnnouncementEmail } from "@/lib/email"

const broadcastSchema = z.object({
  title_en: z.string().trim().min(3).max(150),
  title_ar: z.string().trim().min(3).max(150),
  message_en: z.string().trim().min(5).max(3000),
  message_ar: z.string().trim().min(5).max(3000),
  target_audience: z.enum(["all", "active_only", "course_enrolled"]).default("all"),
  course_id: z.string().uuid().optional().nullable(),
  send_email_alert: z.boolean().default(false),
  action_url: z.string().optional().nullable(),
})

async function authorizeAdmin(req: NextApiRequest) {
  if (!supabaseAdmin) return { error: "Database service unavailable", status: 503 } as const
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) return { error: "Unauthorized", status: 401 } as const

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) return { error: "Unauthorized", status: 401 } as const

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !["dev", "super_admin"].includes(profile.role)) {
    return { error: "Forbidden: Super Admin access required", status: 403 } as const
  }

  return { user, status: 200 } as const
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  if (!checkRateLimit(req, res, { limit: 10, windowMs: 60_000, prefix: "admin_announcement_broadcast" })) {
    return
  }

  const auth = await authorizeAdmin(req)
  if ("error" in auth) {
    return res.status(auth.status).json({ error: auth.error })
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: "Database service unavailable" })
  }

  const parsed = broadcastSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() })
  }

  const {
    title_en,
    title_ar,
    message_en,
    message_ar,
    target_audience,
    course_id,
    send_email_alert,
    action_url,
  } = parsed.data

  const cleanTitleEn = sanitizeInputText(title_en)
  const cleanTitleAr = sanitizeInputText(title_ar)
  const cleanMessageEn = sanitizeInputText(message_en)
  const cleanMessageAr = sanitizeInputText(message_ar)

  try {
    // 1. Fetch Target Students
    interface TargetUser {
      id: string
      email: string
      full_name: string | null
      email_notifications_enabled?: boolean
    }

    let targetUsers: TargetUser[] = []

    if (target_audience === "course_enrolled" && course_id) {
      const { data: enrollments, error } = await supabaseAdmin
        .from("course_enrollments")
        .select(`
          user_id,
          user:users!course_enrollments_user_id_fkey (
            id,
            email,
            full_name,
            email_notifications_enabled
          )
        `)
        .eq("course_id", course_id)
        .eq("status", "active")

      if (error) {
        return res.status(500).json({ error: "Failed to query enrolled students: " + error.message })
      }

      targetUsers = (enrollments || [])
        .map((e) => {
          const u = Array.isArray(e.user) ? e.user[0] : e.user
          return u as TargetUser | undefined
        })
        .filter((u): u is TargetUser => Boolean(u && u.id && u.email))
    } else {
      let query = supabaseAdmin
        .from("users")
        .select("id, email, full_name, email_notifications_enabled")
        .eq("role", "student")

      if (target_audience === "active_only") {
        query = query.eq("status", "active")
      }

      const { data: users, error } = await query
      if (error) {
        return res.status(500).json({ error: "Failed to query target students: " + error.message })
      }
      targetUsers = (users || []) as TargetUser[]
    }

    if (targetUsers.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        emailsDispatched: 0,
        message: "No target students found matching criteria.",
      })
    }

    // 2. Batch Insert In-App Notifications
    const notificationRows = targetUsers.map((u) => ({
      user_id: u.id,
      type: "announcement",
      title_en: cleanTitleEn,
      title_ar: cleanTitleAr,
      message_en: cleanMessageEn,
      message_ar: cleanMessageAr,
      is_read: false,
      created_at: new Date().toISOString(),
    }))

    // Insert in batches of 100 to avoid payload limits
    const batchSize = 100
    for (let i = 0; i < notificationRows.length; i += batchSize) {
      const batch = notificationRows.slice(i, i + batchSize)
      const { error: insertError } = await supabaseAdmin.from("notifications").insert(batch)
      if (insertError) {
        console.warn("Announcement notification batch insert warning:", insertError)
      }
    }

    // 3. Optional: Dispatch Resend Emails (Non-blocking)
    let emailsDispatchedCount = 0
    if (send_email_alert) {
      const eligibleUsers = targetUsers.filter((u) => u.email_notifications_enabled !== false && u.email)
      emailsDispatchedCount = eligibleUsers.length

      // Trigger asynchronous dispatch
      const promises = eligibleUsers.map((u) =>
        sendBroadcastAnnouncementEmail({
          toEmail: u.email,
          studentName: u.full_name || "PharmaCore Student",
          titleEn: cleanTitleEn,
          titleAr: cleanTitleAr,
          messageEn: cleanMessageEn,
          messageAr: cleanMessageAr,
          actionUrl: action_url || undefined,
        }).catch((err) => {
          console.warn(`Failed to dispatch announcement to ${u.email}:`, err)
        })
      )

      // Execute in parallel without blocking response for large batches
      Promise.allSettled(promises).catch(() => {})
    }

    return res.status(200).json({
      success: true,
      count: targetUsers.length,
      emailsDispatched: emailsDispatchedCount,
      message: `Announcement broadcast successfully to ${targetUsers.length} student(s).`,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error"
    console.error("Announcement broadcast exception:", err)
    return res.status(500).json({ error: msg })
  }
}
