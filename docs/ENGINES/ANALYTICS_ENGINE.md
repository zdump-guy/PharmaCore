# Analytics Engine & Telemetry Pipeline

## 1. Overview & Architecture

PharmaCore operates a **dual-layer telemetry architecture** balancing privacy-first edge analytics with real-time in-app business events:

1. **Vercel Web Vitals & Traffic Analytics**: Monitored at the edge via `@vercel/analytics` and `@vercel/speed-insights` for page load times, LCP, CLS, and geographic visitor distribution.
2. **In-App Event Stream (`public.analytics_events`)**: Managed via `lib/analytics.ts` to record educational events (lecture views, video plays, audio scrubs, quiz submissions, search queries, feedback submissions).

```mermaid
flowchart TD
    UserAction[User Interaction / Navigation] --> ClientSDK[Client Event Dispatcher (lib/analytics.ts)]
    
    ClientSDK --> Batch[Buffered Event Queue]
    Batch -->|REST INSERT| Supabase[Supabase PostgreSQL (analytics_events)]
    Batch -->|Edge Beacon| Vercel[Vercel Analytics & Speed Insights]

    Supabase --> Realtime[Supabase Realtime Stream]
    Realtime --> AdminDash[Admin Analytics Dashboard (components/admin/AnalyticsDashboard.tsx)]
```

---

## 2. Event Taxonomy

| Event Name | Trigger Location | Captured Properties |
|---|---|---|
| `page_view` | `_app.tsx` route change | `pathname`, `locale`, `referrer` |
| `lecture_view` | `pages/lecture/[id].tsx` | `course_id`, `lecture_id`, `lecture_title` |
| `audio_play` | `CustomAudioPlayer.tsx` | `audio_id`, `lecture_id`, `duration` |
| `quiz_completed` | `pages/quiz/[id].tsx` | `quiz_id`, `score`, `total_questions`, `passed` |
| `feedback_submitted` | `pages/feedback.tsx` | `feedback_type`, `category`, `severity` |
| `course_enroll_request`| `pages/course/[id].tsx` | `course_id`, `user_id` |

---

## 3. Privacy & Performance Protections

1. **Zero PII in Properties**: Passwords, email addresses, and student personal notes are never included in event property JSON.
2. **Asynchronous Fire-and-Forget**: Telemetry dispatches run asynchronously and will not block page transitions or user interactions.
3. **Database Indexing**: The `analytics_events` table features composite indexes on `(event_name, created_at DESC)` to enable rapid aggregation queries in the admin dashboard.
