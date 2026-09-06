import { supabase } from "@/lib/supabaseClient"

export interface AnalyticsEvent {
  id: string
  name: string
  properties?: Record<string, unknown>
  timestamp: string
  distinct_id?: string
  user_id?: string | null
}

type EventSubscriber = (event: AnalyticsEvent) => void

const subscribers: Set<EventSubscriber> = new Set()
const recentEventsBuffer: AnalyticsEvent[] = []
const MAX_BUFFER_SIZE = 50

let currentUserId: string | null = null
let currentUserProperties: Record<string, unknown> = {}
let realtimeChannelSubscribed = false

// Helper to get or generate anonymous visitor distinct ID
function getDistinctId(): string {
  if (typeof window === "undefined") return "server_rendered"
  try {
    let id = localStorage.getItem("pharmacore_distinct_id")
    if (!id) {
      id = "pc_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
      localStorage.setItem("pharmacore_distinct_id", id)
    }
    return id
  } catch {
    return "anonymous_visitor"
  }
}

/**
 * Initialize Analytics & Realtime listener
 */
export function initAnalytics() {
  if (typeof window === "undefined") return

  // Check Supabase session on init
  if (supabase) {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          currentUserId = session.user.id
        }
      })
      .catch((err: unknown) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Analytics auth session warning:", err)
        }
      })

    // Listen to Supabase Realtime for live events stream across all tabs/users
    if (!realtimeChannelSubscribed) {
      try {
        supabase
          .channel("public:analytics_events")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "analytics_events" },
            (payload) => {
              const row = payload.new as {
                id: string
                event_name: string
                properties: Record<string, unknown>
                created_at: string
                distinct_id?: string
                user_id?: string | null
              }
              if (row) {
                const eventObj: AnalyticsEvent = {
                  id: row.id || String(Date.now()),
                  name: row.event_name,
                  properties: row.properties || {},
                  timestamp: row.created_at || new Date().toISOString(),
                  distinct_id: row.distinct_id,
                  user_id: row.user_id,
                }
                // Avoid duplicating if already locally added
                if (!recentEventsBuffer.some((e) => e.id === eventObj.id)) {
                  recentEventsBuffer.unshift(eventObj)
                  if (recentEventsBuffer.length > MAX_BUFFER_SIZE) {
                    recentEventsBuffer.pop()
                  }
                  subscribers.forEach((fn) => fn(eventObj))
                }
              }
            }
          )
          .subscribe()

        realtimeChannelSubscribed = true
      } catch (err) {
        console.warn("Realtime subscription warning:", err)
      }
    }
  }
}

/**
 * Track an analytics event directly to Supabase
 */
export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return

  const distinctId = getDistinctId()
  const currentUrl = typeof window !== "undefined" ? window.location.pathname : null
  const payloadProps = {
    ...(properties || {}),
    ...(currentUserProperties || {}),
    path: currentUrl,
  }

  const localEvent: AnalyticsEvent = {
    id: "evt_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    name: eventName,
    properties: payloadProps,
    timestamp: new Date().toISOString(),
    distinct_id: distinctId,
    user_id: currentUserId,
  }

  // Push immediately to local memory buffer and notify UI listeners
  recentEventsBuffer.unshift(localEvent)
  if (recentEventsBuffer.length > MAX_BUFFER_SIZE) {
    recentEventsBuffer.pop()
  }
  subscribers.forEach((subscriber) => subscriber(localEvent))

  // Persist directly to Supabase analytics_events table
  if (supabase) {
    Promise.resolve(
      supabase.from("analytics_events").insert([
        {
          event_name: eventName,
          properties: payloadProps,
          distinct_id: distinctId,
          user_id: currentUserId,
          url: currentUrl,
        },
      ])
    )
      .then(({ error }) => {
        if (error && process.env.NODE_ENV !== "production") {
          // Table might not exist yet before migration
          console.warn("Analytics insertion warning:", error.message)
        }
      })
      .catch((err: unknown) => {
        // Suppress unhandled promise rejection if network drops or ad-blocker blocks telemetry
        if (process.env.NODE_ENV !== "production") {
          console.warn("Analytics insertion network error:", err)
        }
      })
  }
}

/**
 * Identify authenticated user
 */
export function identifyUser(userId: string, userProperties?: Record<string, unknown>) {
  currentUserId = userId
  if (userProperties) {
    currentUserProperties = { ...currentUserProperties, ...userProperties }
  }
  trackEvent("user_identified", { user_id: userId, ...(userProperties || {}) })
}

/**
 * Reset user session on logout
 */
export function resetUser() {
  currentUserId = null
  currentUserProperties = {}
  try {
    localStorage.removeItem("pharmacore_distinct_id")
  } catch {
    // Ignore storage issues
  }
}

/**
 * Pageview helper
 */
export function trackPageView(url?: string) {
  if (typeof window === "undefined") return
  const currentPath = url || window.location.pathname
  trackEvent("$pageview", {
    path: currentPath,
    url: typeof window !== "undefined" ? window.location.href : currentPath,
    referrer: typeof document !== "undefined" ? document.referrer : "",
    title: typeof document !== "undefined" ? document.title : "",
  })
}

/**
 * Subscribe to real-time events in the Admin UI
 */
export function subscribeToEvents(callback: EventSubscriber): () => void {
  subscribers.add(callback)
  return () => {
    subscribers.delete(callback)
  }
}

/**
 * Get in-memory recent events buffer
 */
export function getRecentEvents(): AnalyticsEvent[] {
  return [...recentEventsBuffer]
}

// ─── Domain-specific helpers ──────────────────────────────────────────────────

export function trackCourseView(
  payloadOrId: string | { courseId: string; courseTitle: string; locale?: string },
  courseTitle?: string
) {
  if (typeof payloadOrId === "object") {
    trackEvent("course_viewed", {
      course_id: payloadOrId.courseId,
      course_title: payloadOrId.courseTitle,
      locale: payloadOrId.locale,
    })
  } else {
    trackEvent("course_viewed", {
      course_id: payloadOrId,
      course_title: courseTitle,
    })
  }
}

export function trackLectureView(
  payloadOrId:
    | string
    | {
        courseId?: string
        lectureId: string
        lectureTitle: string
        order?: number
        lectureOrder?: number
        locale?: string
      },
  lectureId?: string,
  lectureTitle?: string,
  order?: number
) {
  if (typeof payloadOrId === "object") {
    trackEvent("lecture_viewed", {
      course_id: payloadOrId.courseId,
      lecture_id: payloadOrId.lectureId,
      lecture_title: payloadOrId.lectureTitle,
      lecture_order: payloadOrId.lectureOrder ?? payloadOrId.order,
      locale: payloadOrId.locale,
    })
  } else {
    trackEvent("lecture_viewed", {
      course_id: payloadOrId,
      lecture_id: lectureId,
      lecture_title: lectureTitle,
      lecture_order: order,
    })
  }
}

export function trackVideoEvent(payload: {
  action: "started" | "paused" | "completed" | "rate_changed" | "seeked" | "milestone"
  videoId?: string
  lectureId?: string
  lectureTitle?: string
  currentTime?: number
  duration?: number
  rate?: number
  playbackRate?: number
  milestone?: string
  from?: number
  to?: number
}) {
  let eventName = "video_played"
  if (payload.action === "paused") eventName = "video_paused"
  else if (payload.action === "completed" || payload.action === "milestone") eventName = "video_milestone_reached"
  else if (payload.action === "seeked") eventName = "video_seeked"
  else if (payload.action === "rate_changed") eventName = "video_rate_changed"

  trackEvent(eventName, {
    video_id: payload.videoId,
    lecture_id: payload.lectureId,
    lecture_title: payload.lectureTitle,
    current_time_sec: payload.currentTime,
    duration_sec: payload.duration,
    playback_rate: payload.playbackRate ?? payload.rate,
    milestone: payload.action === "completed" ? "100%" : payload.milestone,
    from_sec: payload.from,
    to_sec: payload.to,
  })
}

export function trackVideoMilestone(
  videoUrl: string,
  milestone: "25%" | "50%" | "75%" | "100%",
  durationSec: number,
  meta?: { course_id?: string; lecture_id?: string; lecture_title?: string }
) {
  trackEvent("video_milestone_reached", {
    video_url: videoUrl,
    milestone,
    duration_sec: durationSec,
    course_id: meta?.course_id,
    lecture_id: meta?.lecture_id,
    lecture_title: meta?.lecture_title,
  })
}

export function trackVideoAction(
  action: "play" | "pause",
  videoUrl: string,
  currentTimeSec: number,
  meta?: { course_id?: string; lecture_id?: string; lecture_title?: string }
) {
  trackEvent(action === "play" ? "video_played" : "video_paused", {
    video_url: videoUrl,
    current_time_sec: currentTimeSec,
    course_id: meta?.course_id,
    lecture_id: meta?.lecture_id,
    lecture_title: meta?.lecture_title,
  })
}

export function trackVideoSeek(
  videoUrl: string,
  fromSec: number,
  toSec: number,
  meta?: { course_id?: string; lecture_id?: string; lecture_title?: string }
) {
  trackEvent("video_seeked", {
    video_url: videoUrl,
    from_sec: fromSec,
    to_sec: toSec,
    course_id: meta?.course_id,
    lecture_id: meta?.lecture_id,
    lecture_title: meta?.lecture_title,
  })
}

export function trackVideoRateChange(
  videoUrl: string,
  playbackRate: number,
  meta?: { course_id?: string; lecture_id?: string; lecture_title?: string }
) {
  trackEvent("video_rate_changed", {
    video_url: videoUrl,
    playback_rate: playbackRate,
    course_id: meta?.course_id,
    lecture_id: meta?.lecture_id,
    lecture_title: meta?.lecture_title,
  })
}

export function trackResourceClick(
  payloadOrId:
    | string
    | {
        resourceId: string
        resourceTitle: string
        resourceType: string
        url?: string
        lectureId?: string
      },
  resourceTitle?: string,
  resourceType?: string,
  lectureId?: string
) {
  if (typeof payloadOrId === "object") {
    trackEvent("resource_clicked", {
      resource_id: payloadOrId.resourceId,
      resource_title: payloadOrId.resourceTitle,
      resource_type: payloadOrId.resourceType,
      url: payloadOrId.url,
      lecture_id: payloadOrId.lectureId,
    })
  } else {
    trackEvent("resource_clicked", {
      resource_id: payloadOrId,
      resource_title: resourceTitle,
      resource_type: resourceType,
      lecture_id: lectureId,
    })
  }
}


export function trackCommunityQuestionSubmit(
  payloadOrId:
    | string
    | {
        lectureId: string
        textLength: number
        authorName?: string
        isAnonymous?: boolean
      },
  textLength?: number,
  authorName?: string
) {
  if (typeof payloadOrId === "object") {
    trackEvent("community_question_submitted", {
      lecture_id: payloadOrId.lectureId,
      text_length: payloadOrId.textLength,
      author_name: payloadOrId.authorName,
      is_anonymous: payloadOrId.isAnonymous,
    })
  } else {
    trackEvent("community_question_submitted", {
      lecture_id: payloadOrId,
      text_length: textLength,
      author_name: authorName,
    })
  }
}

export function trackQuizStart(
  payloadOrId:
    | string
    | {
        quizId: string
        quizTitle: string
        totalQuestions?: number
        courseId?: string | null
        lectureId?: string | null
      },
  quizTitle?: string,
  meta?: { course_id?: string | null; lecture_id?: string | null }
) {
  if (typeof payloadOrId === "object") {
    trackEvent("quiz_started", {
      quiz_id: payloadOrId.quizId,
      quiz_title: payloadOrId.quizTitle,
      total_questions: payloadOrId.totalQuestions,
      course_id: payloadOrId.courseId,
      lecture_id: payloadOrId.lectureId,
    })
  } else {
    trackEvent("quiz_started", {
      quiz_id: payloadOrId,
      quiz_title: quizTitle,
      course_id: meta?.course_id,
      lecture_id: meta?.lecture_id,
    })
  }
}


export function trackQuestionAnswered(
  payloadOrId:
    | string
    | {
        quizId: string
        questionId: string
        questionIndex?: number
        questionOrder?: number
        questionType?: string
        isCorrect: boolean
        selectedOption?: string
      },
  questionId?: string,
  questionOrder?: number,
  isCorrect?: boolean
) {
  if (typeof payloadOrId === "object") {
    trackEvent("question_answered", {
      quiz_id: payloadOrId.quizId,
      question_id: payloadOrId.questionId,
      question_order: payloadOrId.questionOrder ?? payloadOrId.questionIndex,
      question_type: payloadOrId.questionType,
      is_correct: payloadOrId.isCorrect,
      selected_option: payloadOrId.selectedOption,
    })
  } else {
    trackEvent("question_answered", {
      quiz_id: payloadOrId,
      question_id: questionId,
      question_order: questionOrder,
      is_correct: isCorrect,
    })
  }
}


export function trackQuizSubmit(
  payloadOrId:
    | string
    | {
        quizId: string
        quizTitle: string
        score: number
        totalQuestions: number
        percentage: number
        passed: boolean
      },
  quizTitle?: string,
  score?: number,
  totalQuestions?: number,
  percentage?: number,
  passed?: boolean
) {
  if (typeof payloadOrId === "object") {
    trackEvent("quiz_submitted", {
      quiz_id: payloadOrId.quizId,
      quiz_title: payloadOrId.quizTitle,
      score: payloadOrId.score,
      total_questions: payloadOrId.totalQuestions,
      percentage: payloadOrId.percentage,
      passed: payloadOrId.passed,
    })
  } else {
    trackEvent("quiz_submitted", {
      quiz_id: payloadOrId,
      quiz_title: quizTitle,
      score,
      total_questions: totalQuestions,
      percentage,
      passed,
    })
  }
}

export function trackQuizRetry(
  payloadOrId: string | { quizId: string; quizTitle: string },
  quizTitle?: string
) {
  if (typeof payloadOrId === "object") {
    trackEvent("quiz_retried", {
      quiz_id: payloadOrId.quizId,
      quiz_title: payloadOrId.quizTitle,
    })
  } else {
    trackEvent("quiz_retried", {
      quiz_id: payloadOrId,
      quiz_title: quizTitle,
    })
  }
}

export function trackLocaleSwitch(
  fromOrObj: string | { fromLocale: string; toLocale: string },
  to?: string
) {
  if (typeof fromOrObj === "object") {
    trackEvent("locale_switched", {
      from_locale: fromOrObj.fromLocale,
      to_locale: fromOrObj.toLocale,
    })
  } else {
    trackEvent("locale_switched", {
      from_locale: fromOrObj,
      to_locale: to,
    })
  }
}

export function trackThemeToggle(themeOrObj: "light" | "dark" | { theme: "light" | "dark" }) {
  const t = typeof themeOrObj === "object" ? themeOrObj.theme : themeOrObj
  trackEvent("theme_toggled", {
    theme: t,
  })
}

export function trackAdminAction(payload: {
  action: "created" | "updated" | "deleted" | "content_updated"
  entityType: "course" | "lecture" | "quiz" | "resource" | "question" | "user" | "qa_reply" | "site_content"
  entityId?: string
  entityName?: string
  details?: Record<string, unknown>
}) {
  trackEvent("admin_action", {
    action: payload.action,
    entity_type: payload.entityType,
    entity_id: payload.entityId,
    entity_name: payload.entityName,
    ...(payload.details || {}),
  })
}
