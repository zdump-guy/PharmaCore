# Handoff Report: PharmaCore Database Schema, Migrations & API Architecture

**Agent:** `survey_explorer_1`  
**Working Directory:** `/home/bravo-07/Documents/dev/yo-project/.agents/survey_explorer_1`  
**Date:** 2026-08-20  
**Handoff Type:** Hard (Exploration Phase Complete)  
**Parent Agent:** `aa81873a-183a-48db-b31d-72d9a6210c82` (Project Orchestrator)

---

## 1. Observation

### 1.1 Existing Migration Scripts & Schema Definition
Direct inspection of the `supabase/` directory revealed 6 existing SQL scripts:
- `supabase/migration.sql` (lines 1–236): Contains base definitions for `users`, `courses`, `lectures`, `resources`, `quizzes`, `questions`, `community_questions`, `community_answers`, `mentor_course_assignments`, and `site_content`.
- `supabase/student_layer_migration.sql` (lines 1–63): Extends `users` with student profile columns (`first_name`, `last_name`, `phone_number`, `university`, `faculty`, `start_year`, `predicted_end_year`, `status`, `must_change_password`), adds `is_locked` and `access_policy` to `courses`, and creates `course_enrollments`.
- `supabase/analytics_migration.sql` (lines 1–55): Defines `analytics_events` and adds it to `supabase_realtime` publication.
- `supabase/course_enrollment_request_migration.sql` (lines 1–26): Adds `rejected` status check to `course_enrollments` and creates composite indexes.
- `supabase/security_hardening.sql` (lines 1–79): Implements non-recursive RLS policies using `public.get_user_role()`.
- `supabase/reconcile.sql` (lines 1–79): Sets up `handle_new_user()` idempotency and grants.

### 1.2 TypeScript Interfaces & Site Content Provider
- `types/index.ts` (lines 1–175): Defines `UserProfile`, `Course`, `Lecture`, `Resource`, `Quiz`, `Question`, `CommunityQuestion`, `CommunityAnswer`, `University`, `Faculty`, `CourseEnrollment`, and `EnrolledCourseProgress`.
- `lib/siteContent.ts` (lines 1–346): Manages `SiteContent` containing `en`, `ar`, `social_links`, `enrollment_settings`, and `maintenance_mode`. Contains `mergeSiteContent` and `loadSiteContent()`.
- `components/SiteContentProvider.tsx` (lines 1–93): Wraps application in `SiteContentContext`, loads live site content, and subscribes to Supabase Realtime channel `public:site_content_sync` on table `site_content`.

### 1.3 Baseline Next.js Build
- Ran `npm run build`: Output exited with **code 0** across all 8 static and dynamic routes (`/`, `/admin`, `/admin/login`, `/course/[id]`, `/lecture/[id]`, `/login`, `/profile`, `/quiz/[id]`).

---

## 2. Logic Chain

1. **Feature Matrix Storage (R1)**:
   - *Observation*: `site_content` record `id = 'main'` holds singleton platform configuration as JSONB in `content`. `SiteContentProvider` already syncs this JSONB in realtime to client components.
   - *Deduction*: Global feature toggles belong in `site_content.content.features` (`FeatureFlagsConfig`). Course-level overrides require an added JSONB column `courses.feature_overrides`. Merging them via `resolveCourseFeatures(globalFlags, course.feature_overrides)` provides deterministic fallback.

2. **AI Clinical Assistant Schema (R4 & R6)**:
   - *Observation*: The current codebase has no table for logging AI assistant sessions or consultations.
   - *Deduction*: Migration `002_ai_consultations.sql` must create `public.ai_consultations` with `tool_type` (`general_consult`, `dose_calculator`, `interaction_checker`, `lecture_qa`), `prompt`, `response`, `metadata JSONB`, and RLS policies restricted to the user and audited by staff.

3. **Verifiable Certificates & Gamification (R3 & R6)**:
   - *Observation*: Student metrics in `pages/api/profile/index.ts` currently estimate streak days mathematically from video counts without dedicated streak or certificate tables.
   - *Deduction*: Migration `003_certificates_and_streaks.sql` must create:
     - `public.certificates` with unique `certificate_code`, `user_id`, `course_id`, `student_name`, `final_score`, `watch_completion_rate`, `status`, and a public RLS select policy for verification at `/verify/[code]`.
     - `public.user_streaks` and `public.user_badges` for tracking study streaks and achievement milestones.

4. **Practice Mode Rationales & Faculty Gradebook (R2, R5 & R6)**:
   - *Observation*: `questions` in `supabase/migration.sql` lacks explanation fields; `pages/quiz/[id].tsx` only compares user answer with `correct_answer` upon final submission.
   - *Deduction*: Migration `004_question_rationales_and_gradebook.sql` must add `explanation_en`, `explanation_ar`, `clinical_reference`, and `difficulty` to `questions`, and create `quiz_submissions` and `lecture_progress` tables to support instant practice feedback, mastery evaluation, and the Faculty Gradebook matrix.

---

## 3. Caveats

1. **Live Supabase Instance Dependency**: In offline or development environments where the remote Supabase database is not connected, the client gracefully falls back to mock/default content via `lib/siteContent.ts` and `lib/supabaseClient.ts`.
2. **Migration Directory Location**: The legacy migrations reside in `supabase/`, while requirement R6 explicitly designates `supabase/migrations/` as the target directory for the 4 modular migrations. Both locations should be kept in sync or clearly documented.

---

## 4. Conclusion

The database schema, TypeScript types, and API architecture are fully mapped and ready for implementation.
The 4-migration plan under `supabase/migrations/` is structured as:
1. `001_feature_flags.sql`: `courses.feature_overrides` column and `site_content.content.features` defaults.
2. `002_ai_consultations.sql`: `public.ai_consultations` table, indexes, and RLS.
3. `003_certificates_and_streaks.sql`: `public.certificates`, `public.user_streaks`, `public.user_badges` tables, indexes, and RLS.
4. `004_question_rationales_and_gradebook.sql`: `questions` rationale/reference columns, `public.quiz_submissions`, `public.lecture_progress` tables, indexes, and RLS.

All required extensions integrate cleanly into `types/index.ts`, `lib/siteContent.ts`, and the Next.js API route layer without introducing breaking changes.

---

## 5. Verification Method

To independently verify this exploration:
1. **Inspect Analysis Report**:
   ```bash
   cat /home/bravo-07/Documents/dev/yo-project/.agents/survey_explorer_1/analysis.md
   ```
2. **Verify Next.js Baseline Build**:
   ```bash
   npm run build
   ```
   (Should exit with code 0).
3. **Verify Type Definitions & Migration Schemas**:
   Inspect `types/index.ts`, `lib/siteContent.ts`, and `supabase/*.sql` to confirm all referenced column names and types match.
