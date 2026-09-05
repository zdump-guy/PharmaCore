import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { verifyTurnstileToken, extractClientIp } from "@/lib/turnstile"
import { checkRateLimit } from "@/lib/rateLimit"

const querySchema = z.object({
  id: z.string().uuid(),
})

const postBodySchema = z.object({
  turnstileToken: z.string().optional().nullable(),
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

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("id, role, status")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.status === "suspended") {
    return { error: "Account is suspended", status: 403 } as const
  }

  return { user, profile, status: 200 } as const
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!checkRateLimit(req, res, { limit: 10, windowMs: 60_000, prefix: "enroll" })) {
    return
  }

  const parsedQuery = querySchema.safeParse(req.query)
  if (!parsedQuery.success) {
    return res.status(400).json({
      error: "Invalid request payload",
      details: parsedQuery.error.flatten(),
    })
  }

  const courseId = parsedQuery.data.id

  if (!supabaseAdmin) {
    return res.status(503).json({ error: "Database service unavailable" })
  }

  const auth = await authorizeUser(req)
  if ("error" in auth) {
    return res.status(auth.status).json({ error: auth.error })
  }

  const userId = auth.user.id

  // ─── GET: Check Enrollment Status for Course ────────────────────────────────
  if (req.method === "GET") {
    try {
      const { data: enrollment, error } = await supabaseAdmin
        .from("course_enrollments")
        .select("id, status, enrolled_at")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle()

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({
        isEnrolled: Boolean(enrollment && enrollment.status === "active"),
        status: enrollment?.status || null,
        enrollment: enrollment || null,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to check enrollment"
      return res.status(500).json({ error: msg })
    }
  }

  // ─── POST: Enroll or Request Enrollment in Course ───────────────────────────
  if (req.method === "POST") {
    const parsedBody = postBodySchema.safeParse(req.body || {})
    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Invalid request payload",
        details: parsedBody.error.flatten(),
      })
    }

    try {
      // 0. Verify Cloudflare Turnstile Token
      const { turnstileToken } = parsedBody.data
      const clientIp = extractClientIp(req)
      const turnstileResult = await verifyTurnstileToken({
        token: turnstileToken,
        remoteIp: clientIp,
        expectedAction: "course_enroll",
      })

      if (!turnstileResult.success) {
        return res.status(403).json({
          error: "Bot protection verification failed. Please try again.",
          error_ar: "فشل التحقق الأمني من النشاط التلقائي. يرجى المحاولة مرة أخرى.",
        })
      }

      // 1. Verify course exists and get its policy
      const { data: course, error: courseErr } = await supabaseAdmin
        .from("courses")
        .select("id, title_en, title_ar, access_policy, is_locked")
        .eq("id", courseId)
        .maybeSingle()

      if (courseErr || !course) {
        return res.status(404).json({ error: "Course not found" })
      }

      // Check whether this course requires admin approval or instant active access
      const requiresApproval = course.access_policy === "enrolled_only"
      const targetStatus = requiresApproval ? "pending" : "active"

      // 2. Check if already enrolled or requested
      const { data: existing } = await supabaseAdmin
        .from("course_enrollments")
        .select("id, status, enrolled_at")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle()

      if (existing) {
        if (existing.status === "active") {
          return res.status(200).json({
            success: true,
            isEnrolled: true,
            status: "active",
            message: "You are already actively enrolled in this course.",
            message_ar: "أنت مسجل بالفعل في هذا المقرر.",
            enrollment: existing,
          })
        }

        if (existing.status === "pending") {
          return res.status(200).json({
            success: true,
            isEnrolled: false,
            status: "pending",
            message: "Your enrollment request has already been submitted and is awaiting administrator review.",
            message_ar: "طلب الانضمام مقدم مسبقًا وقيد المراجعة والاعتماد من قِبل إدارة المنصة.",
            enrollment: existing,
          })
        }

        // If previously rejected or completed, re-request or reactivate
        const { data: updated, error: updateErr } = await supabaseAdmin
          .from("course_enrollments")
          .update({ status: targetStatus, enrolled_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select()
          .single()

        if (updateErr) throw updateErr

        return res.status(200).json({
          success: true,
          isEnrolled: targetStatus === "active",
          status: targetStatus,
          message: requiresApproval
            ? "Enrollment request re-submitted! An administrator will review your request."
            : "Course enrollment activated successfully!",
          message_ar: requiresApproval
            ? "تمت إعادة إرسال طلب الانضمام بنجاح! ستتم مراجعة طلبك من قِبل إدارة المنصة."
            : "تم تفعيل اشتراكك في المقرر بنجاح!",
          enrollment: updated,
        })
      }

      // 3. Insert new enrollment record (pending or active)
      const { data: newEnrollment, error: insertErr } = await supabaseAdmin
        .from("course_enrollments")
        .insert([
          {
            user_id: userId,
            course_id: courseId,
            status: targetStatus,
            enrolled_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (insertErr) {
        throw insertErr
      }

      // 4. Log enrollment event in analytics table
      try {
        await supabaseAdmin.from("analytics_events").insert([
          {
            event_name: requiresApproval ? "course_enrollment_request" : "course_enrollment",
            user_id: userId,
            properties: {
              course_id: courseId,
              course_title_en: course.title_en,
              course_title_ar: course.title_ar,
              status: targetStatus,
              requires_approval: requiresApproval,
              timestamp: new Date().toISOString(),
            },
          },
        ])
      } catch {
        // Analytics non-blocking
      }

      return res.status(201).json({
        success: true,
        isEnrolled: targetStatus === "active",
        status: targetStatus,
        message: requiresApproval
          ? "Enrollment request submitted! An administrator will review and approve your request shortly."
          : "Successfully enrolled in this course!",
        message_ar: requiresApproval
          ? "تم تقديم طلب الانضمام للمقرر بنجاح! ستتم مراجعته واعتماده من قِبل إدارة المنصة قريبًا."
          : "تم الاشتراك في المقرر بنجاح!",
        enrollment: newEnrollment,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to process enrollment"
      return res.status(500).json({ error: msg })
    }
  }

  // ─── DELETE: Unenroll / Drop Course ─────────────────────────────────────────
  if (req.method === "DELETE") {
    try {
      const { error } = await supabaseAdmin
        .from("course_enrollments")
        .delete()
        .eq("user_id", userId)
        .eq("course_id", courseId)

      if (error) throw error

      return res.status(200).json({
        success: true,
        message: "Unenrolled from course successfully.",
        message_ar: "تم إلغاء الاشتراك من المقرر.",
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to unenroll"
      return res.status(500).json({ error: msg })
    }
  }

  return res.status(405).json({ error: "Method not allowed" })
}
