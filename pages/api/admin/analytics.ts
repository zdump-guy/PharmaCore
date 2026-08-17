import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

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
    .select("role")
    .eq("id", user.id)
    .single()
  if (!profile || !["dev", "super_admin", "mentor"].includes(profile.role)) {
    return { error: "Forbidden", status: 203 } as const
  }

  return { user, profile, status: 200 } as const
}

export interface TimeSeriesPoint {
  key: string
  label: string
  pageviews: number
  videoPlays: number
  quizSubmissions: number
  visitors: number
}

export interface PedagogicalInsight {
  id: string
  type: "success" | "warning" | "info" | "alert"
  title: string
  title_ar: string
  description: string
  description_ar: string
  metric?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const requester = await authorize(req)
  if ("error" in requester) {
    return res.status(requester.status).json({ error: requester.error })
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: "Supabase is not configured" })
  }

  const timeRange = (req.query.timeRange as string) || "7d"

  // Calculate start date
  let startDate: string | null = null
  const now = new Date()
  if (timeRange === "today") {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    startDate = today.toISOString()
  } else if (timeRange === "7d") {
    const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    startDate = d.toISOString()
  } else if (timeRange === "30d") {
    const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    startDate = d.toISOString()
  }

  try {
    let query = supabaseAdmin
      .from("analytics_events")
      .select("id, event_name, properties, distinct_id, user_id, created_at")
      .order("created_at", { ascending: false })

    if (startDate) {
      query = query.gte("created_at", startDate)
    }

    const { data: events, error } = await query

    if (error) {
      // Table might not exist yet if migration hasn't been executed
      return res.status(200).json({
        configured: true,
        tableExists: false,
        message: "Analytics table ready for migration. Run supabase/analytics_migration.sql in Supabase SQL editor.",
        stats: {
          uniqueVisitors: 0,
          pageviews: 0,
          courseViews: 0,
          videoPlays: 0,
          videoMilestones: 0,
          videoCompletions: 0,
          quizStarts: 0,
          quizSubmissions: 0,
          quizPassed: 0,
          avgQuizScore: 0,
          quizPassRate: 0,
          estimatedStudyMinutes: 0,
        },
        timeSeries: [],
        retention: {
          plays: 0,
          p25: 0,
          p50: 0,
          p75: 0,
          p100: 0,
          completionRate: 0,
        },
        scoreDistribution: {
          tier90_100: 0,
          tier70_89: 0,
          tier50_69: 0,
          tier0_49: 0,
        },
        deviceStats: { mobile: 0, desktop: 0, tablet: 0 },
        localeStats: { ar: 0, en: 0 },
        funnel: [
          { key: "course_viewed", count: 0, percent: 0 },
          { key: "video_played", count: 0, percent: 0 },
          { key: "video_milestone_50", count: 0, percent: 0 },
          { key: "quiz_started", count: 0, percent: 0 },
          { key: "quiz_passed", count: 0, percent: 0 },
        ],
        topCourses: [],
        topLectures: [],
        insights: [],
        recentEvents: [],
      })
    }

    const allEvents = events || []

    // ─── STRICT UN-INFLATED AGGREGATION ENGINE ────────────────────────────
    const distinctVisitors = new Set<string>()
    let pageviews = 0
    let courseViews = 0
    let videoPlays = 0
    let videoMilestones = 0
    let videoCompletions = 0
    let videoP25 = 0
    let videoP50 = 0
    let videoP75 = 0
    let quizStarts = 0
    let quizSubmissions = 0
    let quizPassed = 0
    let quizScoreSum = 0

    let scoreTier90_100 = 0
    let scoreTier70_89 = 0
    let scoreTier50_69 = 0
    let scoreTier0_49 = 0

    let localeAr = 0
    let localeEn = 0
    let deviceMobile = 0
    let deviceDesktop = 0
    let deviceTablet = 0

    const courseViewsCount: Record<string, number> = {}
    const lectureStats: Record<string, { views: number; plays: number; completions: number }> = {}

    // Time-series bucket map
    const timeBuckets: Record<
      string,
      { pageviews: number; videoPlays: number; quizSubmissions: number; visitors: Set<string> }
    > = {}

    // Pre-seed time buckets based on range for a continuous, smooth chart
    if (timeRange === "today") {
      for (let h = 0; h <= 23; h += 2) {
        const hourStr = `${String(h).padStart(2, "0")}:00`
        timeBuckets[hourStr] = { pageviews: 0, videoPlays: 0, quizSubmissions: 0, visitors: new Set() }
      }
    } else {
      const daysCount = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 14
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dayStr = d.toISOString().split("T")[0]
        timeBuckets[dayStr] = { pageviews: 0, videoPlays: 0, quizSubmissions: 0, visitors: new Set() }
      }
    }

    for (const evt of allEvents) {
      // 1. Precise Unique Visitor Identity (never fall back to evt.id which artificially inflates counts)
      const distinctKey = evt.distinct_id || evt.user_id || null
      if (distinctKey) {
        distinctVisitors.add(distinctKey)
      }

      const props = (evt.properties as Record<string, unknown>) || {}
      const eventName = evt.event_name
      const createdDate = new Date(evt.created_at)

      // Time-series bucketing key
      let bucketKey = ""
      if (timeRange === "today") {
        const h = Math.floor(createdDate.getHours() / 2) * 2
        bucketKey = `${String(h).padStart(2, "0")}:00`
      } else {
        bucketKey = evt.created_at.split("T")[0]
      }

      if (!timeBuckets[bucketKey]) {
        timeBuckets[bucketKey] = { pageviews: 0, videoPlays: 0, quizSubmissions: 0, visitors: new Set() }
      }
      if (distinctKey) {
        timeBuckets[bucketKey].visitors.add(distinctKey)
      }

      // 2. Locale & Device Split
      const loc = String(props.locale || props.lang || "")
      if (loc === "ar" || loc.startsWith("ar")) {
        localeAr++
      } else {
        localeEn++
      }

      const screenW = Number(props.screen_width || props.width || 0)
      const userAgent = String(props.user_agent || "").toLowerCase()
      if (screenW > 0) {
        if (screenW < 768) deviceMobile++
        else if (screenW < 1024) deviceTablet++
        else deviceDesktop++
      } else if (userAgent.includes("mobi") || userAgent.includes("android") || userAgent.includes("iphone")) {
        deviceMobile++
      } else if (userAgent.includes("ipad") || userAgent.includes("tablet")) {
        deviceTablet++
      } else {
        deviceDesktop++
      }

      // 3. Precise Single-Count Event Classification
      if (eventName === "$pageview") {
        pageviews++
        timeBuckets[bucketKey].pageviews++
      } else if (eventName === "course_viewed") {
        courseViews++
        const title = String(props.course_title || props.title || "Course")
        courseViewsCount[title] = (courseViewsCount[title] || 0) + 1
      } else if (eventName === "lecture_viewed") {
        const title = String(props.lecture_title || props.title || "Lecture")
        if (!lectureStats[title]) lectureStats[title] = { views: 0, plays: 0, completions: 0 }
        lectureStats[title].views++
      } else if (eventName === "video_played") {
        videoPlays++
        timeBuckets[bucketKey].videoPlays++
        const title = String(props.lecture_title || props.title || "Lecture")
        if (!lectureStats[title]) lectureStats[title] = { views: 0, plays: 0, completions: 0 }
        lectureStats[title].plays++
      } else if (eventName === "video_milestone_reached") {
        const m = String(props.milestone || "")
        const title = String(props.lecture_title || props.title || "Lecture")
        if (!lectureStats[title]) lectureStats[title] = { views: 0, plays: 0, completions: 0 }

        if (m === "25%") {
          videoP25++
          videoMilestones++
        } else if (m === "50%") {
          videoP50++
          videoMilestones++
        } else if (m === "75%") {
          videoP75++
          videoMilestones++
        } else if (m === "100%") {
          videoCompletions++
          videoMilestones++
          lectureStats[title].completions++
        }
      } else if (eventName === "quiz_started") {
        quizStarts++
      } else if (eventName === "quiz_submitted") {
        quizSubmissions++
        timeBuckets[bucketKey].quizSubmissions++

        let rawPct = Number(props.percentage ?? props.score_pct ?? 0)
        // Normalize decimal percentage (e.g. 0.85 -> 85)
        if (rawPct > 0 && rawPct <= 1) {
          rawPct = Math.round(rawPct * 100)
        }
        rawPct = Math.min(100, Math.max(0, rawPct))

        const passed = props.passed === true || props.passed === "true" || rawPct >= 70
        if (passed) quizPassed++
        quizScoreSum += rawPct

        if (rawPct >= 90) scoreTier90_100++
        else if (rawPct >= 70) scoreTier70_89++
        else if (rawPct >= 50) scoreTier50_69++
        else scoreTier0_49++
      }
    }

    const uniqueVisitors = Math.max(distinctVisitors.size, allEvents.length > 0 ? 1 : 0)
    const avgQuizScore = quizSubmissions > 0 ? Math.round(quizScoreSum / quizSubmissions) : 0
    const quizPassRate = quizSubmissions > 0 ? Math.min(100, Math.round((quizPassed / quizSubmissions) * 100)) : 0

    // Realistic study minutes: ~5 mins per video play, +5 mins for reaching midpoint, +8 mins for completion, +3 mins for quiz
    const estimatedStudyMinutes = Math.round(
      videoPlays * 5 +
      videoP50 * 5 +
      videoCompletions * 8 +
      quizSubmissions * 3
    )

    // Formatted time-series array
    const timeSeries: TimeSeriesPoint[] = Object.entries(timeBuckets).map(([key, val]) => {
      let label = key
      if (timeRange !== "today" && key.includes("-")) {
        const parts = key.split("-")
        label = `${parts[1]}/${parts[2]}`
      }
      return {
        key,
        label,
        pageviews: val.pageviews,
        videoPlays: val.videoPlays,
        quizSubmissions: val.quizSubmissions,
        visitors: val.visitors.size,
      }
    })

    // Strict funnel calculations
    const funnel = [
      {
        key: "course_viewed",
        count: courseViews,
        percent: courseViews > 0 ? 100 : 0,
      },
      {
        key: "video_played",
        count: videoPlays,
        percent: courseViews > 0 ? Math.min(100, Math.round((videoPlays / courseViews) * 100)) : 0,
      },
      {
        key: "video_milestone_50",
        count: videoP50,
        percent: videoPlays > 0 ? Math.min(100, Math.round((videoP50 / videoPlays) * 100)) : 0,
      },
      {
        key: "quiz_started",
        count: quizStarts,
        percent: videoPlays > 0 ? Math.min(100, Math.round((quizStarts / videoPlays) * 100)) : 0,
      },
      {
        key: "quiz_passed",
        count: quizPassed,
        percent: quizStarts > 0 ? Math.min(100, Math.round((quizPassed / quizStarts) * 100)) : 0,
      },
    ]

    // Accurate, un-fabricated video retention
    const retention = {
      plays: videoPlays,
      p25: videoP25,
      p50: videoP50,
      p75: videoP75,
      p100: videoCompletions,
      completionRate: videoPlays > 0 ? Math.min(100, Math.round((videoCompletions / videoPlays) * 100)) : 0,
    }

    // Top Courses
    const topCourses = Object.entries(courseViewsCount)
      .map(([title, views]) => ({ title, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)

    // Top Lectures with friction analysis
    const topLectures = Object.entries(lectureStats)
      .map(([title, st]) => {
        const plays = st.plays || st.views
        const dropoff = plays > 0 ? Math.max(0, Math.round(((plays - st.completions) / plays) * 100)) : 0
        return {
          title,
          views: st.views || st.plays,
          plays: st.plays,
          completions: st.completions,
          dropoffRate: dropoff,
        }
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)

    // Generate Automated Pedagogical Insights (Rule-based)
    const insights: PedagogicalInsight[] = []

    if (quizPassRate >= 75 && quizSubmissions > 0) {
      insights.push({
        id: "high_pass_rate",
        type: "success",
        title: "Strong Learner Mastery",
        title_ar: "مستوى إتقان مرتفع للطلاب",
        description: `Students are achieving a high pass rate of ${quizPassRate}% with an average score of ${avgQuizScore}%.`,
        description_ar: `يحقق الطلاب نسبة اجتياز ممتازة تصل إلى ${quizPassRate}٪ ومتوسط درجات ${avgQuizScore}٪.`,
        metric: `${quizPassRate}% Pass Rate`,
      })
    } else if (quizPassRate < 60 && quizSubmissions > 2) {
      insights.push({
        id: "low_pass_rate",
        type: "warning",
        title: "Quiz Conceptual Friction",
        title_ar: "صعوبة في استيعاب أسئلة الاختبارات",
        description: `Average pass rate is currently ${quizPassRate}%. Consider reviewing question wording or adding summary notes to key lectures.`,
        description_ar: `نسبة الاجتياز الحالية هي ${quizPassRate}٪. يُنصح بمراجعة صياغة الأسئلة أو تدعيم المحاضرات بملخصات مساندة.`,
        metric: `${quizPassRate}% Pass Rate`,
      })
    }

    if (videoPlays > 0 && retention.completionRate < 40) {
      insights.push({
        id: "video_dropoff",
        type: "info",
        title: "Midpoint Video Drop-off",
        title_ar: "انخفاض المشاهدة قبل اكتمال الفيديو",
        description: `About ${100 - retention.completionRate}% of lecture views stop before full completion. Adding video chapter timestamps can boost retention.`,
        description_ar: `يتوقف حوالي ${100 - retention.completionRate}٪ من الطلاب قبل نهاية المحاضرة. إضافة فواصل زمنية ومحاور واضحة يساعد في رفع الإكمال.`,
        metric: `${retention.completionRate}% Completion`,
      })
    }

    if (uniqueVisitors > 0 && videoPlays === 0 && pageviews > 0) {
      insights.push({
        id: "browsing_visitors",
        type: "info",
        title: "High Browsing Interest",
        title_ar: "اهتمام بتصفح المقررات",
        description: `Learners are exploring course pages. Make sure video thumbnails and syllabus descriptions are compelling.`,
        description_ar: `يتصفح الطلاب صفحات المقررات بنشاط. احرص على جاذبية عناوين المحاضرات والصور التوضيحية.`,
        metric: `${uniqueVisitors} Visitors`,
      })
    }

    // Recent 30 events formatted
    const recentEvents = allEvents.slice(0, 30).map((evt) => ({
      id: evt.id,
      name: evt.event_name,
      properties: (evt.properties as Record<string, unknown>) || {},
      timestamp: evt.created_at,
    }))

    return res.status(200).json({
      configured: true,
      tableExists: true,
      stats: {
        uniqueVisitors,
        pageviews,
        courseViews,
        videoPlays,
        videoMilestones,
        videoCompletions,
        quizStarts,
        quizSubmissions,
        quizPassed,
        avgQuizScore,
        quizPassRate,
        estimatedStudyMinutes,
      },
      timeSeries,
      retention,
      scoreDistribution: {
        tier90_100: scoreTier90_100,
        tier70_89: scoreTier70_89,
        tier50_69: scoreTier50_69,
        tier0_49: scoreTier0_49,
      },
      deviceStats: {
        mobile: deviceMobile,
        desktop: deviceDesktop,
        tablet: deviceTablet,
      },
      localeStats: {
        ar: localeAr,
        en: localeEn,
      },
      funnel,
      topCourses,
      topLectures,
      insights,
      recentEvents,
    })
  } catch (error) {
    console.error("Supabase Analytics API Error:", error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to query analytics from database",
    })
  }
}
