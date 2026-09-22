# TASK-003: Dev-Exclusive Discussion Questions & Answers Deletion

**Status**: ✅ Completed  
**Date**: September 23, 2026  
**Author**: Antigravity Platform Architect  
**Review Type**: Feature Implementation, RBAC Hardening & Subsystem Review  

---

## 1. Objective

Provide the `dev` user role with exclusive, secure capabilities to permanently delete discussion questions and answers from the platform across:
1. The administrative moderation center ([`components/admin/CommunityManager.tsx`](file:///home/bravo-07/Documents/dev/yo-project/components/admin/CommunityManager.tsx) & [`pages/admin/index.tsx`](file:///home/bravo-07/Documents/dev/yo-project/pages/admin/index.tsx)).
2. The contextual lecture room Q&A stream ([`pages/lecture/[id].tsx`](file:///home/bravo-07/Documents/dev/yo-project/pages/lecture/[id].tsx)).
3. Dedicated serverless endpoints enforcing strict role-based access control (`profile.role === 'dev'`).

---

## 2. Architecture & Subsystem Review Findings

1. **Database Cascading**:
   - `public.community_questions` is referenced by `public.community_answers` with `ON DELETE CASCADE`.
   - `public.notifications` references `public.community_questions` with `ON DELETE CASCADE`.
   - Deleting a question permanently purges its associated replies and notification entries at the PostgreSQL tier without leaving orphan records.
2. **REST API Design & Route Collisions**:
   - `pages/api/questions/answer.ts` handles `POST` for adding answers.
   - To avoid Next.js Pages router file/folder collision (`answer.ts` vs `answer/[id].ts`), the answer deletion route is located at `pages/api/questions/answers/[id].ts`.
   - Question deletion is located at `pages/api/questions/[id].ts`.
3. **RBAC Guardrail**:
   - Both deletion endpoints verify bearer tokens using `supabaseAdmin.auth.getUser(token)`.
   - Both endpoints strictly check that `public.users.role === 'dev'`, returning `403 Forbidden` for students, mentors, and super_admin accounts.

---

## 3. Implementation Summary

### 3.1 Backend APIs
* [`pages/api/questions/[id].ts`](file:///home/bravo-07/Documents/dev/yo-project/pages/api/questions/[id].ts):
  * HTTP Method: `DELETE`
  * Role: `dev` only
  * Rate Limit: 20 req/min
  * Validation: UUID check on `req.query.id`
* [`pages/api/questions/answers/[id].ts`](file:///home/bravo-07/Documents/dev/yo-project/pages/api/questions/answers/[id].ts):
  * HTTP Method: `DELETE`
  * Role: `dev` only
  * Rate Limit: 30 req/min
  * Validation: UUID check on `req.query.id`

### 3.2 Frontend UI Moderation
* [`components/admin/CommunityManager.tsx`](file:///home/bravo-07/Documents/dev/yo-project/components/admin/CommunityManager.tsx):
  * Added `onDeleteQuestion` and `onDeleteAnswer` prop interfaces.
  * Rendered destructive `Trash2` action buttons in question card headers and answer bubbles when `profile?.role === 'dev'`.
  * Included bilingual confirmation dialogues before invoking deletion.
* [`pages/admin/index.tsx`](file:///home/bravo-07/Documents/dev/yo-project/pages/admin/index.tsx):
  * Added `deleteCommunityQuestion` and `deleteCommunityAnswer` handlers.
  * Synchronized local `community` state and logged admin telemetry.
* [`pages/lecture/[id].tsx`](file:///home/bravo-07/Documents/dev/yo-project/pages/lecture/[id].tsx):
  * Extracted `role` from `useAuth()` to check `isDev`.
  * Added inline trash action buttons next to student questions and mentor answers with confirmation prompts.
  * Added `handleDeleteQuestion` and `handleDeleteAnswer` with immediate UI state reconciliation.

---

## 4. Verification & Testing

* **Automated Test Suite**: Added test section `12. Dev Role Discussion Deletion Security & RBAC Guardrails` to [`tests/qa_and_notifications_security.test.mjs`](file:///home/bravo-07/Documents/dev/yo-project/tests/qa_and_notifications_security.test.mjs).
* **Test Results**: All test suites passed with 100% success rate (`npm test`).
* **Static Analysis**: TypeScript (`npx tsc --noEmit`) compiled with 0 errors. ESLint (`npm run lint`) passed with 0 warnings.
