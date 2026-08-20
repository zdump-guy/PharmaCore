import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import {
  evaluateCertificateEligibility,
  issueCertificateRecord
} from "@/lib/certificates"
import type { CertificateRecord } from "@/types"

const issueSchema = z.object({
  course_id: z.string().min(1),
  student_name: z.string().optional(),
  watch_completion_rate: z.number().optional(),
  quiz_average: z.number().optional()
})

async function authorizeUser(req: NextApiRequest) {
  if (!supabaseAdmin) return { error: "Supabase not configured", status: 503 } as const
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) return { error: "Unauthorized", status: 401 } as const

  const {
    data: { user },
    error
  } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) return { error: "Unauthorized", status: 401 } as const
  return { user, status: 200 } as const
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const auth = await authorizeUser(req)
  if ("error" in auth) {
    return res.status(auth.status).json({ error: auth.error })
  }
  if (!supabaseAdmin) {
    return res.status(503).json({ error: "Database not configured" })
  }

  const parsed = issueSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request payload", details: parsed.error.flatten() })
  }

  const { course_id, student_name } = parsed.data
  const userId = auth.user.id

  try {
    // 1. Check if certificate already exists
    const { data: existingCert } = await supabaseAdmin
      .from("certificates")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", course_id)
      .maybeSingle()

    if (existingCert) {
      return res.status(200).json({
        message: "Certificate already issued",
        certificate: existingCert as CertificateRecord
      })
    }

    // 2. Fetch Course Details
    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("id, title_en, title_ar, feature_overrides")
      .eq("id", course_id)
      .single()

    if (courseError || !course) {
      return res.status(404).json({ error: "Course not found" })
    }

    // Check if certificates feature is disabled for this course
    if (course.feature_overrides?.certificates === false) {
      return res.status(403).json({ error: "Certificates are disabled for this course" })
    }

    // 3. Fetch Student Name
    let resolvedStudentName = student_name
    if (!resolvedStudentName) {
      const { data: userProfile } = await supabaseAdmin
        .from("users")
        .select("full_name, first_name, last_name")
        .eq("id", userId)
        .single()

      resolvedStudentName =
        userProfile?.full_name ||
        [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(" ") ||
        auth.user.user_metadata?.full_name ||
        "PharmaCore Scholar"
    }

    // 4. Calculate actual progress & scores or use provided override (if from verified caller)
    let watchRate = parsed.data.watch_completion_rate
    let quizAvg = parsed.data.quiz_average

    if (watchRate === undefined || quizAvg === undefined) {
      // Calculate from DB
      const [{ data: lectures }, { data: progress }, { data: submissions }] = await Promise.all([
        supabaseAdmin.from("lectures").select("id").eq("course_id", course_id),
        supabaseAdmin
          .from("lecture_progress")
          .select("lecture_id, completed")
          .eq("user_id", userId)
          .eq("course_id", course_id),
        supabaseAdmin
          .from("quiz_submissions")
          .select("score, passed")
          .eq("user_id", userId)
          .eq("course_id", course_id)
      ])

      const totalLecs = lectures?.length || 0
      const completedLecs = progress?.filter((p) => p.completed).length || 0
      watchRate = totalLecs > 0 ? Math.round((completedLecs / totalLecs) * 100) : 100

      if (submissions && submissions.length > 0) {
        const sum = submissions.reduce((acc, s) => acc + Number(s.score || 0), 0)
        quizAvg = Math.round((sum / submissions.length) * 10) / 10
      } else {
        quizAvg = 100 // fallback if no standalone quizzes attached
      }
    }

    // 5. Evaluate Mastery Criteria
    const eligibility = evaluateCertificateEligibility(watchRate, quizAvg)
    if (!eligibility.eligible) {
      return res.status(400).json({
        error: "Mastery criteria not met for certificate issuance",
        reasons: eligibility.reasons,
        current_stats: {
          watch_completion_rate: watchRate,
          quiz_average: quizAvg
        }
      })
    }

    // 6. Generate Certificate Record
    const certRecord = issueCertificateRecord({
      userId,
      courseId: course_id,
      studentName: resolvedStudentName || "PharmaCore Scholar",
      courseTitleEn: course.title_en,
      courseTitleAr: course.title_ar || "",
      watchCompletionRate: watchRate,
      quizAverage: quizAvg,
      issueDate: new Date().toISOString()
    })

    // 7. Save to public.certificates
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("certificates")
      .insert({
        id: certRecord.id,
        certificate_code: certRecord.certificate_code,
        user_id: certRecord.user_id,
        course_id: certRecord.course_id,
        student_name: certRecord.student_name,
        course_title_en: certRecord.course_title_en,
        course_title_ar: certRecord.course_title_ar,
        final_score: certRecord.final_score,
        watch_completion_rate: certRecord.watch_completion_rate,
        status: certRecord.status,
        issue_date: certRecord.issue_date,
        metadata: {
          issued_via: "mastery_engine_api",
          verified_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (insertError) {
      return res.status(500).json({ error: "Failed to save certificate: " + insertError.message })
    }

    // Award course mastery badge to user
    try {
      await supabaseAdmin.from("user_badges").upsert(
        {
          user_id: userId,
          badge_type: "course_mastery",
          metadata: { course_id, course_title: course.title_en }
        },
        { onConflict: "user_id,badge_type" }
      )
    } catch (badgeErr) {
      console.warn("Badge award warning:", badgeErr)
    }

    return res.status(201).json({
      message: "Certificate issued successfully",
      certificate: (inserted || certRecord) as CertificateRecord
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error issuing certificate"
    return res.status(500).json({ error: msg })
  }
}
