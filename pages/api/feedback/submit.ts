import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { supabase } from "@/lib/supabaseClient"

const feedbackSubmitSchema = z.object({
  feedback_type: z.enum(["technical", "academic"]),
  category: z.string().min(1).max(100),
  page_url: z.string().max(1000).optional().nullable(),
  course_id: z.string().uuid().optional().nullable(),
  lecture_id: z.string().uuid().optional().nullable(),
  title: z.string().min(2, "Title must be at least 2 characters").max(200),
  description: z.string().min(5, "Description must be at least 5 characters").max(5000),
  reproduction_steps: z.string().max(3000).optional().nullable(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional().default("medium"),
  device_info: z
    .object({
      browser: z.string().optional(),
      os: z.string().optional(),
      screen: z.string().optional(),
      viewport: z.string().optional(),
      userAgent: z.string().optional(),
      language: z.string().optional(),
    })
    .optional()
    .nullable(),
  attachment_url: z.string().url().max(1000).optional().nullable().or(z.literal("")),
  academic_reference: z.string().max(2000).optional().nullable(),
  contact_email: z.string().email().max(255).optional().nullable().or(z.literal("")),
  contact_name: z.string().max(120).optional().nullable(),
  turnstileToken: z.string().optional().nullable(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const client = supabaseAdmin || supabase
  if (!client) {
    return res.status(503).json({ error: "Database service unavailable" })
  }

  const parsed = feedbackSubmitSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: parsed.error.flatten(),
    })
  }

  const payload = parsed.data

  // Optional bot protection verification (Cloudflare Turnstile)
  const turnstileSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY
  if (turnstileSecret && payload.turnstileToken) {
    try {
      const turnstileRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: payload.turnstileToken,
          remoteip: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "",
        }),
      })
      const turnstileData = await turnstileRes.json()
      if (!turnstileData.success) {
        return res.status(400).json({ error: "Security verification failed. Please try again." })
      }
    } catch (err) {
      console.warn("Turnstile validation exception (proceeding safely):", err)
    }
  }

  // Resolve authenticated user if session header is present
  let authenticatedUserId: string | null = null
  let authenticatedEmail: string | null = null
  let authenticatedName: string | null = null

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

  if (token && supabaseAdmin) {
    try {
      const {
        data: { user },
      } = await supabaseAdmin.auth.getUser(token)
      if (user) {
        authenticatedUserId = user.id
        authenticatedEmail = user.email || null
        authenticatedName =
          (user.user_metadata?.full_name as string) ||
          `${user.user_metadata?.first_name || ""} ${user.user_metadata?.last_name || ""}`.trim() ||
          null
      }
    } catch {
      // Allow guest submissions if auth fails
    }
  }

  try {
    const { data, error } = await client
      .from("feedback_submissions")
      .insert({
        user_id: authenticatedUserId,
        feedback_type: payload.feedback_type,
        category: payload.category,
        page_url: payload.page_url || null,
        course_id: payload.course_id || null,
        lecture_id: payload.lecture_id || null,
        title: payload.title.trim(),
        description: payload.description.trim(),
        reproduction_steps: payload.reproduction_steps?.trim() || null,
        severity: payload.severity,
        device_info: payload.device_info || {},
        attachment_url: payload.attachment_url || null,
        academic_reference: payload.academic_reference?.trim() || null,
        contact_email: (payload.contact_email || authenticatedEmail || "").trim() || null,
        contact_name: (payload.contact_name || authenticatedName || "").trim() || null,
        status: "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id, feedback_type, status, created_at")
      .single()

    if (error) {
      console.error("Feedback insert error:", error)
      return res.status(500).json({ error: "Failed to submit feedback: " + error.message })
    }

    return res.status(201).json({
      success: true,
      submission: data,
      message: "Feedback submitted successfully. Thank you for helping improve PharmaCore!",
      message_ar: "تم إرسال ملاحظاتك بنجاح. شكرًا لمساهمتك في تحسين فارماكور!",
    })
  } catch (err) {
    console.error("Feedback submit exception:", err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Internal server error",
    })
  }
}
