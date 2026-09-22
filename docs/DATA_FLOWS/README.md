# PharmaCore — Data Flows & Pipeline Sequence Reference

This directory provides end-to-end data flow sequence diagrams tracing data transitions from user input $\to$ client validation $\to$ API handler $\to$ database mutations $\to$ side effects $\to$ client UI updates.

---

## Data Flow Index

| Flow Document | Primary Journey | Involved Components & Endpoints |
|---|---|---|
| [**Student Enrollment Flow**](./STUDENT_ENROLLMENT_FLOW.md) | Course cohort request, triage & approval | `pages/course/[id].tsx`, `/api/courses/[id]/enroll`, `/api/admin/students/enrollments`, `public.course_enrollments` |
| [**Question & Answer Flow**](./QUESTION_AND_ANSWER_FLOW.md) | Community Q&A, instructor reply & email alert | `pages/lecture/[id].tsx`, `/api/questions/submit`, `/api/questions/answer`, `lib/email.ts`, `public.notifications` |
| [**Feedback Submission Flow**](./FEEDBACK_SUBMISSION_FLOW.md) | Public bug/curriculum report & staff triage | `pages/feedback.tsx`, `/api/feedback/submit`, `/api/admin/feedback/[id]`, `public.feedback_submissions` |
| [**Admin Content Management Flow**](./ADMIN_CONTENT_MANAGEMENT_FLOW.md) | Course/lecture authoring, audio upload & DB commit | `pages/admin/index.tsx`, `components/admin/CurriculumManager.tsx`, UploadThing, Supabase DB |
