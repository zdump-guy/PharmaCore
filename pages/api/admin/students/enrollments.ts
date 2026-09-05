import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

const getQuerySchema = z.object({
  courseId: z.string().optional(),
  studentId: z.string().optional(),
  status: z.string().optional(),
})

const patchBodySchema = z.object({
  action: z.enum(["approve", "accept", "reject", "deny"]).optional(),
  enrollmentId: z.string().uuid().optional(),
  enrollmentIds: z.array(z.string().uuid()).optional(),
  status: z.enum(["active", "pending", "rejected", "completed"]).optional(),
}).refine(
  (data) => Boolean(data.enrollmentId || (data.enrollmentIds && data.enrollmentIds.length > 0)),
  { message: "Missing enrollment ID(s)", path: ["enrollmentId"] }
).refine(
  (data) => Boolean(data.action || data.status),
  { message: "Invalid action or status", path: ["action"] }
)

const postBodySchema = z.object({
  studentId: z.string().uuid().optional(),
  studentIds: z.array(z.string().uuid()).optional(),
  courseId: z.string().uuid().optional(),
  courseIds: z.array(z.string().uuid()).optional(),
  status: z.enum(["active", "pending", "rejected", "completed"]).optional().default("active"),
}).refine(
  (data) => Boolean(data.studentId || (data.studentIds && data.studentIds.length > 0)),
  { message: "Missing student ID(s)", path: ["studentId"] }
).refine(
  (data) => Boolean(data.courseId || (data.courseIds && data.courseIds.length > 0)),
  { message: "Missing course ID(s)", path: ["courseId"] }
)

const deleteBodySchema = z.object({
  enrollmentId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
}).refine(
  (data) => Boolean(data.enrollmentId || (data.studentId && data.courseId)),
  { message: "Missing enrollment ID or student & course ID pair", path: ["enrollmentId"] }
)

async function authorizeStaff(req: NextApiRequest) {
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

  if (!profile || !["dev", "super_admin", "mentor"].includes(profile.role)) {
    return { error: "Forbidden", status: 403 } as const
  }

  return { user, profile, status: 200 } as const
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ─── GET: List Enrollments by Course, Student, or Status ───────────────────
  if (req.method === "GET") {
    const parsedQuery = getQuerySchema.safeParse(req.query)
    if (!parsedQuery.success) {
      return res.status(400).json({
        error: "Invalid request payload",
        details: parsedQuery.error.flatten(),
      })
    }

    const staff = await authorizeStaff(req)
    if ("error" in staff) {
      return res.status(staff.status).json({ error: staff.error })
    }

    if (!supabaseAdmin) {
      return res.status(503).json({ error: "Database service unavailable" })
    }

    const { courseId, studentId, status } = parsedQuery.data

    try {
      let query = supabaseAdmin
        .from("course_enrollments")
        .select(`
          id,
          user_id,
          course_id,
          status,
          enrolled_at,
          user:users!course_enrollments_user_id_fkey(id, email, full_name, first_name, last_name, role, status, university, faculty, phone_number),
          course:courses!course_enrollments_course_id_fkey(id, title_en, title_ar, thumbnail_url, access_policy)
        `)
        .order("enrolled_at", { ascending: false })

      if (courseId && courseId !== "all") {
        query = query.eq("course_id", courseId)
      }
      if (studentId) {
        query = query.eq("user_id", studentId)
      }
      if (status && status !== "all") {
        query = query.eq("status", status)
      }

      const { data: enrollments, error } = await query

      if (error) {
        // Fallback simple query if relational joins fail
        let fallbackQuery = supabaseAdmin
          .from("course_enrollments")
          .select("*")
          .order("enrolled_at", { ascending: false })

        if (courseId && courseId !== "all") fallbackQuery = fallbackQuery.eq("course_id", courseId)
        if (studentId) fallbackQuery = fallbackQuery.eq("user_id", studentId)
        if (status && status !== "all") fallbackQuery = fallbackQuery.eq("status", status)

        const { data: fallbackData, error: fbErr } = await fallbackQuery
        if (fbErr) throw fbErr

        const rows = fallbackData || []
        const pendingCount = rows.filter((e) => e.status === "pending").length
        const activeCount = rows.filter((e) => e.status === "active").length

        return res.status(200).json({
          enrollments: rows,
          count: rows.length,
          pendingCount,
          stats: {
            total: rows.length,
            active: activeCount,
            pending: pendingCount,
            rejected: rows.filter((e) => e.status === "rejected").length,
            completed: rows.filter((e) => e.status === "completed").length,
          },
        })
      }

      const list = enrollments || []
      const pendingCount = list.filter((e) => e.status === "pending").length
      const activeCount = list.filter((e) => e.status === "active").length
      const rejectedCount = list.filter((e) => e.status === "rejected").length
      const completedCount = list.filter((e) => e.status === "completed").length

      return res.status(200).json({
        enrollments: list,
        count: list.length,
        pendingCount,
        stats: {
          total: list.length,
          active: activeCount,
          pending: pendingCount,
          rejected: rejectedCount,
          completed: completedCount,
        },
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to list enrollments"
      return res.status(500).json({ error: msg })
    }
  }

  // ─── PATCH: Approve or Reject Enrollment Request(s) ─────────────────────────
  if (req.method === "PATCH") {
    const parsed = patchBodySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request payload",
        details: parsed.error.flatten(),
      })
    }

    const staff = await authorizeStaff(req)
    if ("error" in staff) {
      return res.status(staff.status).json({ error: staff.error })
    }

    if (!supabaseAdmin) {
      return res.status(503).json({ error: "Database service unavailable" })
    }

    const { action, enrollmentId, enrollmentIds, status: directStatus } = parsed.data
    const targetIds: string[] = enrollmentIds || (enrollmentId ? [enrollmentId] : [])

    let targetStatus: "active" | "rejected" | "pending" | "completed" = "active"

    if (action === "approve" || action === "accept") {
      targetStatus = "active"
    } else if (action === "reject" || action === "deny") {
      targetStatus = "rejected"
    } else if (directStatus) {
      targetStatus = directStatus
    } else {
      targetStatus = "active"
    }

    try {
      const updatePayload: Record<string, unknown> = {
        status: targetStatus,
      }
      if (targetStatus === "active") {
        updatePayload.enrolled_at = new Date().toISOString()
      }

      const { data: updated, error } = await supabaseAdmin
        .from("course_enrollments")
        .update(updatePayload)
        .in("id", targetIds)
        .select()

      if (error) throw error

      return res.status(200).json({
        success: true,
        action,
        status: targetStatus,
        updatedCount: updated?.length || targetIds.length,
        message:
          targetStatus === "active"
            ? `Successfully approved ${targetIds.length} enrollment request(s).`
            : `Successfully rejected ${targetIds.length} enrollment request(s).`,
        message_ar:
          targetStatus === "active"
            ? `تم قبول واعتماد ${targetIds.length} طلب تسجيل بنجاح.`
            : `تم رفض ${targetIds.length} طلب تسجيل.`,
        enrollments: updated,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update enrollment status"
      return res.status(500).json({ error: msg })
    }
  }

  // ─── POST: Admin Assign / Batch Enroll Student(s) ───────────────────────────
  if (req.method === "POST") {
    const parsed = postBodySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request payload",
        details: parsed.error.flatten(),
      })
    }

    const staff = await authorizeStaff(req)
    if ("error" in staff) {
      return res.status(staff.status).json({ error: staff.error })
    }

    if (!supabaseAdmin) {
      return res.status(503).json({ error: "Database service unavailable" })
    }

    const { studentId, studentIds, courseId, courseIds, status } = parsed.data
    const targetStudents: string[] = studentIds || (studentId ? [studentId] : [])
    const targetCourses: string[] = courseIds || (courseId ? [courseId] : [])

    try {
      const recordsToInsert = []
      for (const sId of targetStudents) {
        for (const cId of targetCourses) {
          recordsToInsert.push({
            user_id: sId,
            course_id: cId,
            status,
            enrolled_at: new Date().toISOString(),
          })
        }
      }

      const { data: inserted, error } = await supabaseAdmin
        .from("course_enrollments")
        .upsert(recordsToInsert, { onConflict: "user_id,course_id" })
        .select()

      if (error) throw error

      return res.status(200).json({
        success: true,
        message: `Successfully enrolled ${targetStudents.length} student(s) into ${targetCourses.length} course(s).`,
        message_ar: `تم تسجيل ${targetStudents.length} طالب في ${targetCourses.length} مقرر بنجاح.`,
        enrolledCount: inserted?.length || recordsToInsert.length,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to enroll students"
      return res.status(500).json({ error: msg })
    }
  }

  // ─── DELETE: Admin Remove Enrollment ───────────────────────────────────────
  if (req.method === "DELETE") {
    const parsed = deleteBodySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request payload",
        details: parsed.error.flatten(),
      })
    }

    const staff = await authorizeStaff(req)
    if ("error" in staff) {
      return res.status(staff.status).json({ error: staff.error })
    }

    if (!supabaseAdmin) {
      return res.status(503).json({ error: "Database service unavailable" })
    }

    const { enrollmentId, studentId, courseId } = parsed.data

    try {
      let query = supabaseAdmin.from("course_enrollments").delete()

      if (enrollmentId) {
        query = query.eq("id", enrollmentId)
      } else if (studentId && courseId) {
        query = query.eq("user_id", studentId).eq("course_id", courseId)
      }

      const { error } = await query
      if (error) throw error

      return res.status(200).json({
        success: true,
        message: "Enrollment removed successfully.",
        message_ar: "تم إلغاء تسجيل الطالب من المقرر بنجاح.",
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove enrollment"
      return res.status(500).json({ error: msg })
    }
  }

  return res.status(405).json({ error: "Method not allowed" })
}
