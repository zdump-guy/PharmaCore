# Database Queries & 20 High-Performance Index Structures

## 1. Indexing Strategy & Index Matrix

PharmaCore establishes **20 dedicated B-Tree index structures** in PostgreSQL to optimize query execution plans, eliminate full table scans, and accelerate Row Level Security (RLS) subqueries.

| Table | Index Name | Indexed Columns | Optimization Purpose |
|---|---|---|---|
| `public.lectures` | `lectures_course_id_idx` | `(course_id)` | Fast lookup of lectures for a given course. |
| `public.lectures` | `lectures_order_idx` | `(course_id, "order")` | Ordered syllabus retrieval without sort overhead. |
| `public.resources` | `resources_lecture_id_idx` | `(lecture_id)` | Fast retrieval of lecture handouts. |
| `public.quizzes` | `quizzes_lecture_id_idx` | `(lecture_id)` | Lecture-level assessment queries. |
| `public.quizzes` | `quizzes_course_id_idx` | `(course_id)` | Course-level final exam queries. |
| `public.questions` | `questions_quiz_id_idx` | `(quiz_id)` | Rapid retrieval of quiz questions. |
| `public.audio_records`| `idx_audio_records_lecture` | `(lecture_id)` | Lecture audio tracks lookup. |
| `public.audio_records`| `idx_audio_records_course` | `(course_id)` | Course-wide audio index. |
| `public.community_questions` | `cq_lecture_id_idx` | `(lecture_id)` | Fast rendering of lecture Q&A forum. |
| `public.community_questions` | `cq_user_id_idx` | `(user_id)` | Student profile question tracker queries. |
| `public.community_answers` | `community_answers_question_id_idx` | `(question_id)` | Instant join of answers to question threads. |
| `public.course_enrollments` | `course_enrollments_course_status_idx` | `(course_id, status)` | Admin cohort filtering (Pending vs Active). |
| `public.course_enrollments` | `course_enrollments_user_status_idx` | `(user_id, status)` | Student profile active enrollments check. |
| `public.course_enrollments` | `course_enrollments_status_idx` | `(status)` | Global pending enrollment counters. |
| `public.course_enrollments` | `course_enrollments_enrolled_at_idx` | `(enrolled_at DESC)` | Chronological enrollment audit queries. |
| `public.analytics_events` | `idx_analytics_events_name` | `(event_name)` | Event aggregation queries. |
| `public.analytics_events` | `idx_analytics_events_created_at` | `(created_at DESC)` | Real-time analytics dashboard time-series. |
| `public.feedback_submissions` | `idx_feedback_status` | `(status)` | Open/Resolved feedback dashboard triage. |
| `public.feedback_submissions` | `idx_feedback_type` | `(feedback_type)` | Technical bug vs Academic feedback filter. |
| `public.notifications` | `idx_notifications_user_read` | `(user_id, is_read)` | Unread notification badge counter query. |

---

## 2. Key High-Frequency Query Patterns

### 2.1 Complete Lecture Detail Join
```sql
SELECT 
  l.*,
  COALESCE(json_agg(DISTINCT r.*) FILTER (WHERE r.id IS NOT NULL), '[]') AS resources,
  COALESCE(json_agg(DISTINCT a.*) FILTER (WHERE a.id IS NOT NULL), '[]') AS audio_records,
  COALESCE(json_agg(DISTINCT q.*) FILTER (WHERE q.id IS NOT NULL), '[]') AS quizzes
FROM public.lectures l
LEFT JOIN public.resources r ON r.lecture_id = l.id
LEFT JOIN public.audio_records a ON a.lecture_id = l.id
LEFT JOIN public.quizzes q ON q.lecture_id = l.id
WHERE l.id = $1
GROUP BY l.id;
```

### 2.2 Community Q&A with Instructor Answers
```sql
SELECT 
  q.id, q.lecture_id, q.user_id, q.author_name, q.text, q.created_at, q.is_anonymous,
  COALESCE(
    json_agg(
      json_build_object(
        'id', ans.id,
        'text', ans.text,
        'created_at', ans.created_at,
        'responder_name', u.full_name,
        'responder_role', u.role
      )
    ) FILTER (WHERE ans.id IS NOT NULL), 
    '[]'
  ) AS answers
FROM public.community_questions q
LEFT JOIN public.community_answers ans ON ans.question_id = q.id
LEFT JOIN public.users u ON u.id = ans.responder_id
WHERE q.lecture_id = $1
GROUP BY q.id
ORDER BY q.created_at DESC;
```
