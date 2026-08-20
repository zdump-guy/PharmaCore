## 2026-08-20T14:56:27Z
You are worker_m1, an implementation worker for Milestone M1 (Database Migrations & Schema Foundations).
Your working directory is: /home/bravo-07/Documents/dev/yo-project/.agents/worker_m1
Your parent is the Project Orchestrator (aa81873a-183a-48db-b31d-72d9a6210c82).

Scope Documents:
- /home/bravo-07/Documents/dev/yo-project/.agents/ORIGINAL_REQUEST.md (MANDATORY: read this first)
- /home/bravo-07/Documents/dev/yo-project/PROJECT.md

Exclusive Write Ownership:
- `supabase/migrations/001_feature_flags.sql`
- `supabase/migrations/002_ai_consultations.sql`
- `supabase/migrations/003_certificates_and_streaks.sql`
- `supabase/migrations/004_question_rationales_and_gradebook.sql`
- `types/index.ts`
- `lib/siteContent.ts`
- `lib/featureFlags.ts` (new helper module for feature resolution)

Tasks for Milestone M1:
1. Create `supabase/migrations/001_feature_flags.sql`:
   - Adds `feature_overrides` JSONB column to `public.courses`.
   - Ensures `public.site_content` contains `features` JSONB with default flags:
     `{"ai_assistant": true, "practice_mode": true, "certificates": true, "community_qa": true, "gradebook": true}`.
2. Create `supabase/migrations/002_ai_consultations.sql`:
   - Creates `public.ai_consultations` table (`id` UUID PRIMARY KEY DEFAULT gen_random_uuid(), `user_id` UUID REFERENCES auth.users, `lecture_id` UUID, `tool_type` TEXT NOT NULL, `prompt` TEXT NOT NULL, `response` TEXT NOT NULL, `patient_context` JSONB, `created_at` TIMESTAMPTZ DEFAULT now()).
   - Creates appropriate indexes and RLS policies.
3. Create `supabase/migrations/003_certificates_and_streaks.sql`:
   - Creates `public.certificates` table (`id` UUID PRIMARY KEY DEFAULT gen_random_uuid(), `certificate_code` TEXT UNIQUE NOT NULL, `user_id` UUID REFERENCES auth.users, `course_id` UUID, `student_name` TEXT NOT NULL, `course_title_en` TEXT NOT NULL, `course_title_ar` TEXT, `final_score` NUMERIC NOT NULL, `watch_completion_rate` NUMERIC NOT NULL, `status` TEXT NOT NULL DEFAULT 'valid', `issue_date` TIMESTAMPTZ DEFAULT now(), `metadata` JSONB).
   - Creates public SELECT policy on `public.certificates` for verification (WHERE status = 'valid').
   - Creates `public.user_streaks` (`user_id` UUID PRIMARY KEY, `current_streak` INT DEFAULT 0, `longest_streak` INT DEFAULT 0, `last_activity_date` DATE, `updated_at` TIMESTAMPTZ DEFAULT now()).
   - Creates `public.user_badges` (`id` UUID PRIMARY KEY DEFAULT gen_random_uuid(), `user_id` UUID, `badge_type` TEXT NOT NULL, `awarded_at` TIMESTAMPTZ DEFAULT now(), `metadata` JSONB).
4. Create `supabase/migrations/004_question_rationales_and_gradebook.sql`:
   - Adds columns to `public.questions`: `explanation_en` TEXT, `explanation_ar` TEXT, `clinical_reference` TEXT, `difficulty` TEXT DEFAULT 'medium'.
   - Creates `public.quiz_submissions` table (`id` UUID PRIMARY KEY DEFAULT gen_random_uuid(), `user_id` UUID, `quiz_id` UUID, `course_id` UUID, `answers` JSONB NOT NULL, `score` NUMERIC NOT NULL, `passed` BOOLEAN NOT NULL, `is_practice` BOOLEAN DEFAULT false, `submitted_at` TIMESTAMPTZ DEFAULT now()).
   - Creates `public.lecture_progress` table (`id` UUID PRIMARY KEY DEFAULT gen_random_uuid(), `user_id` UUID, `lecture_id` UUID, `course_id` UUID, `watched_seconds` INT DEFAULT 0, `duration_seconds` INT DEFAULT 0, `completed` BOOLEAN DEFAULT false, `last_watched_at` TIMESTAMPTZ DEFAULT now(), UNIQUE(user_id, lecture_id)).
   - Creates indexes and RLS policies for student ownership and admin gradebook access.
5. Update `types/index.ts` with all new interfaces (`FeatureFlagsConfig`, `Question` updates, `Course` updates with `feature_overrides`, `CertificateRecord`, `AIConsultRequest`, `QuizSubmission`, `LectureProgress`, `UserStreak`, `UserBadge`, `GradebookEntry`).
6. Update `lib/siteContent.ts` and create `lib/featureFlags.ts` with clean `resolveCourseFeatures()` utility and default fallback values.
7. Run build/typecheck (`npm run build`) to ensure 0 errors.
