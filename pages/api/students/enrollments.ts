import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import type { EnrolledCourseProgress, Course, Lecture, Quiz } from "@/types"

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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: "Database service unavailable" })
  }

  const auth = await authorizeUser(req)
  if ("error" in auth) {
    return res.status(auth.status).json({ error: auth.error })
  }

  const userId = auth.user.id

  try {
    // 1. Fetch student active enrollments
    const { data: enrollments, error: enrollErr } = await supabaseAdmin
      .from("course_enrollments")
      .select("id, course_id, status, enrolled_at")
      .eq("user_id", userId)
      .order("enrolled_at", { ascending: false })

    if (enrollErr) {
      return res.status(500).json({ error: enrollErr.message })
    }

    if (!enrollments || enrollments.length === 0) {
      return res.status(200).json({ enrollments: [], count: 0 })
    }

    const courseIds = enrollments.map((e) => e.course_id)

    // 2. Fetch associated courses, lectures, quizzes, and analytics events in parallel
    const [coursesRes, lecturesRes, quizzesRes, userEventsRes] = await Promise.all([
      supabaseAdmin.from("courses").select("*").in("id", courseIds),
      supabaseAdmin.from("lectures").select("id, course_id, title_en, title_ar, order").in("course_id", courseIds).order("order", { ascending: true }),
      supabaseAdmin.from("quizzes").select("id, course_id, lecture_id").in("course_id", courseIds),
      supabaseAdmin.from("analytics_events").select("event_name, properties").eq("user_id", userId),
    ])

    const coursesMap = new Map<string, Course>((coursesRes.data || []).map((c) => [c.id, c]))
    const lecturesByCourse = new Map<string, Lecture[]>()
    for (const lecture of lecturesRes.data || []) {
      const list = lecturesByCourse.get(lecture.course_id) || []
      list.push(lecture as Lecture)
      lecturesByCourse.set(lecture.course_id, list)
    }

    const quizzesByCourse = new Map<string, Quiz[]>()
    for (const quiz of quizzesRes.data || []) {
      if (quiz.course_id) {
        const list = quizzesByCourse.get(quiz.course_id) || []
        list.push(quiz as Quiz)
        quizzesByCourse.set(quiz.course_id, list)
      }
    }

    // Set of completed lecture IDs from analytics
    const completedLectureIds = new Set<string>()
    const completedQuizIds = new Set<string>()

    for (const evt of userEventsRes.data || []) {
      const props = evt.properties as Record<string, unknown> | null
      if (evt.event_name === "video_milestone" && (props?.percent === 100 || props?.milestone === 100)) {
        if (props?.lectureId && typeof props.lectureId === "string") {
          completedLectureIds.add(props.lectureId)
        }
      }
      if (evt.event_name === "quiz_submit" && props?.quizId && typeof props.quizId === "string") {
        completedQuizIds.add(props.quizId)
      }
    }

    // 3. Assemble progress structures
    const detailedEnrollments: EnrolledCourseProgress[] = []

    for (const enrollment of enrollments) {
      const course = coursesMap.get(enrollment.course_id)
      if (!course) continue

      const courseLectures = lecturesByCourse.get(enrollment.course_id) || []
      const courseQuizzes = quizzesByCourse.get(enrollment.course_id) || []

      const totalLectures = courseLectures.length
      const completedLectures = courseLectures.filter((l) => completedLectureIds.has(l.id)).length
      const totalQuizzes = courseQuizzes.length
      const completedQuizzes = courseQuizzes.filter((q) => completedQuizIds.has(q.id)).length

      const progressPercent = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0

      // Find next unwatched lecture
      const nextLecture = courseLectures.find((l) => !completedLectureIds.has(l.id)) || courseLectures[0] || null

      detailedEnrollments.push({
        enrollmentId: enrollment.id,
        courseId: enrollment.course_id,
        course,
        status: enrollment.status,
        enrolledAt: enrollment.enrolled_at,
        totalLectures,
        completedLectures,
        progressPercent,
        totalQuizzes,
        completedQuizzes,
        lastActiveLectureId: nextLecture?.id || null,
        lastActiveLectureTitle: nextLecture ? `${nextLecture.title_en} / ${nextLecture.title_ar}` : null,
      })
    }

    return res.status(200).json({
      enrollments: detailedEnrollments,
      count: detailedEnrollments.length,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch student enrollments"
    return res.status(500).json({ error: msg })
  }
}
