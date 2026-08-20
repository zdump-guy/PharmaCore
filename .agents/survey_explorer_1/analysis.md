# Comprehensive Architectural Analysis: PharmaCore Database, Migrations & API Architecture

**Prepared by:** `survey_explorer_1`  
**Date:** 2026-08-20  
**Corpus/Project:** PharmaCore (`yo-project`)  
**Scope Reference:** `.agents/ORIGINAL_REQUEST.md` (R1 – R6)

---

## 1. Executive Summary & Problem Scope

PharmaCore is a bilingual (English / Arabic) clinical pharmacology educational platform built on **Next.js 15 (Pages Router)**, **React 19**, **Tailwind CSS**, and **Supabase (PostgreSQL + Auth + Storage + Realtime)**.

The enhancement plan introduces five integrated pedagogical modules (R1 through R5) backed by a 4-phase incremental migration suite (R6):
1. **R1. Feature Matrix & Modular Activation Engine**: Global feature toggles stored in `site_content.content.features` and inherited/overridden at the course level in `courses.feature_overrides`.
2. **R2. Practice Exam Simulator with Instant Clinical Rationales**: Untimed practice mode in quiz runner revealing instant bilingual explanations, correct/incorrect feedback, and clinical textbook citations.
3. **R3. Automated Verifiable Certificates & Gamification**: Automatic certificate issuance upon meeting mastery criteria (100% video lecture completion and $\ge 80\%$ quiz average), public verification route at `/verify/[code]` with QR verification, daily learning streaks, and milestone badges.
4. **R4. Hybrid AI Clinical Pharmacology Assistant**: In-lecture context-aware side drawer (video topic & syllabus objectives) expandable to a full clinical consultation workspace with renal dose adjustment calculator (Cockcroft-Gault), pediatric dosage calculator (weight/BSA), and Drug-Drug Interaction (DDI) checker.
5. **R5. Faculty Gradebook & Performance Analytics**: Student roster matrix showing individual quiz scores, lecture watch completion, certificate status, university/cohort filters, CSV export, and question difficulty/drop-off heatmaps.
6. **R6. Incremental Database Migrations**: 4 modular SQL migration scripts located in `supabase/migrations/` covering feature flags, AI consultations, certificates/streaks, and question rationales/gradebook.

---

## 2. Current Database Architecture & Schema Inventory

### 2.1 Existing Tables & Relationships
From our inspection of `supabase/migration.sql`, `supabase/student_layer_migration.sql`, `supabase/analytics_migration.sql`, `supabase/course_enrollment_request_migration.sql`, `supabase/security_hardening.sql`, and `supabase/reconcile.sql`, the active database entities are:

| Table | Primary Key | Key Foreign Keys | Purpose & Key Columns |
| :--- | :--- | :--- | :--- |
| `public.users` | `id (UUID)` | `auth.users(id)` | User profiles extending Supabase Auth. Columns: `email`, `full_name`, `first_name`, `last_name`, `phone_number`, `university`, `faculty`, `start_year`, `predicted_end_year`, `role` (`dev`, `super_admin`, `mentor`, `student`), `status` (`active`, `pending`, `suspended`, `needs_setup`), `must_change_password`. |
| `public.courses` | `id (UUID)` | `mentor_id -> users(id)` | Course catalog. Columns: `title_en`, `title_ar`, `description_en`, `description_ar`, `objectives_en`, `objectives_ar`, `prerequisites_en`, `prerequisites_ar`, `thumbnail_url`, `is_locked`, `access_policy` (`open`, `students_only`, `enrolled_only`). |
| `public.lectures` | `id (UUID)` | `course_id -> courses(id)` | Video lectures. Columns: `course_id`, `title_en`, `title_ar`, `details_en`, `details_ar`, `youtube_url`, `order`. |
| `public.resources` | `id (UUID)` | `lecture_id -> lectures(id)` | Downloadable lecture files. Columns: `title_en`, `title_ar`, `url`, `type` (`pdf`, `image`, `other`). |
| `public.quizzes` | `id (UUID)` | `lecture_id`, `course_id`, `created_by` | Clinical quizzes associated with lectures or courses. Columns: `title_en`, `title_ar`, `lecture_id`, `course_id`, `created_by`. |
| `public.questions` | `id (UUID)` | `quiz_id -> quizzes(id)` | Quiz questions. Columns: `text_en`, `text_ar`, `type` (`multiple_choice`, `true_false`, `short_text`), `options (JSONB)`, `correct_answer`, `order`. |
| `public.community_questions` | `id (UUID)` | `lecture_id -> lectures(id)` | Discussion questions from students. Columns: `author_name`, `author_email`, `text`. |
| `public.community_answers` | `id (UUID)` | `question_id`, `responder_id` | Mentor/admin answers to community questions. |
| `public.course_enrollments` | `id (UUID)` | `user_id`, `course_id` | Enrollment requests & active student access. Columns: `status` (`active`, `pending`, `rejected`, `completed`), `enrolled_at`. |
| `public.mentor_course_assignments` | `(mentor_id, course_id)` | `users(id)`, `courses(id)` | Mentor curriculum permission assignment matrix. |
| `public.site_content` | `id (TEXT)` | `updated_by -> users(id)` | Singleton store (`id='main'`) with `content JSONB` containing bilingual branding, hero text, footer, social links, enrollment settings, maintenance mode config. |
| `public.analytics_events` | `id (UUID)` | `user_id -> users(id)` | Native event stream storing event telemetry (`event_name`, `properties JSONB`, `distinct_id`, `user_id`, `created_at`). Broadcasted via Supabase Realtime. |

---

## 3. Settings & Feature Toggle Architecture (R1)

### 3.1 Global Feature Matrix (`site_content.content.features`)
Global settings are stored inside the `content JSONB` column of the `site_content` table (record `id = 'main'`).
The application already loads and merges this singleton via `loadSiteContent()` and `mergeSiteContent()` in `lib/siteContent.ts`, and distributes it via `SiteContentProvider` (which also listens to live Realtime updates on `site_content`).

The global feature schema:
```typescript
export interface FeatureFlagsConfig {
  ai_assistant: boolean            // In-lecture AI Drawer & Consultation Workspace
  practice_mode: boolean           // Quiz Practice Mode with instant rationales
  certificates: boolean            // Automated PDF Certificate Generation & /verify/[code]
  gamification_streaks: boolean    // Daily Study Streaks & Milestone Badges
  gradebook_analytics: boolean     // Faculty Gradebook Matrix & Drop-off Heatmaps
  community_qa: boolean            // Student Q&A discussion board on lectures
  downloadable_resources: boolean  // PDF lecture summary downloads
  course_gating: boolean           // Student enrollment restrictions & approval workflow
}
```

### 3.2 Course-Level Overrides (`courses.feature_overrides`)
Courses can override any global feature flag (for example, disabling the AI assistant for an exam-prep course or disabling certificates for informal workshops).

1. Schema addition: `ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS feature_overrides JSONB DEFAULT '{}'::jsonb;`
2. Inheritance logic helper:
```typescript
export function resolveCourseFeatures(
  globalFlags: FeatureFlagsConfig,
  overrides?: Partial<FeatureFlagsConfig> | null
): FeatureFlagsConfig {
  if (!overrides) return globalFlags
  return {
    ...globalFlags,
    ...Object.fromEntries(
      Object.entries(overrides).filter(([_, v]) => v !== undefined && v !== null)
    ),
  }
}
```
When a course has `{ "ai_assistant": false }`, its effective `ai_assistant` is `false`. When a feature key is not set in `feature_overrides`, it falls back to `globalFlags[key]`.

---

## 4. Required Database Extensions & R6 Migration Plan

The R6 requirement specifies 4 modular SQL migration scripts under `supabase/migrations/`:

```
supabase/
└── migrations/
    ├── 001_feature_flags.sql
    ├── 002_ai_consultations.sql
    ├── 003_certificates_and_streaks.sql
    └── 004_question_rationales_and_gradebook.sql
```

### 4.1 Migration 1: Feature Matrix & Flagging Engine (`001_feature_flags.sql`)
- **Action 1**: Add `feature_overrides` column to `public.courses`:
  ```sql
  ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS feature_overrides JSONB DEFAULT '{}'::jsonb;
  ```
- **Action 2**: Seed/Update default `features` inside `site_content` record:
  ```sql
  UPDATE public.site_content
  SET content = jsonb_set(
    COALESCE(content, '{}'::jsonb),
    '{features}',
    COALESCE(
      content->'features',
      '{"ai_assistant": true, "practice_mode": true, "certificates": true, "gamification_streaks": true, "gradebook_analytics": true, "community_qa": true, "downloadable_resources": true, "course_gating": true}'::jsonb
    ),
    true
  )
  WHERE id = 'main';
  ```
- **Action 3**: Ensure RLS on `site_content` allows public read and staff update.

### 4.2 Migration 2: AI Clinical Consultations (`002_ai_consultations.sql`)
- **Action 1**: Create `public.ai_consultations` table:
  ```sql
  CREATE TABLE IF NOT EXISTS public.ai_consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    lecture_id UUID REFERENCES public.lectures(id) ON DELETE SET NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    tool_type TEXT NOT NULL CHECK (tool_type IN ('general_consult', 'dose_calculator', 'interaction_checker', 'lecture_qa')) DEFAULT 'general_consult',
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ```
- **Action 2**: Create performance indexes:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_ai_consultations_user_id ON public.ai_consultations(user_id);
  CREATE INDEX IF NOT EXISTS idx_ai_consultations_lecture_id ON public.ai_consultations(lecture_id);
  CREATE INDEX IF NOT EXISTS idx_ai_consultations_course_id ON public.ai_consultations(course_id);
  CREATE INDEX IF NOT EXISTS idx_ai_consultations_created_at ON public.ai_consultations(created_at DESC);
  ```
- **Action 3**: Row Level Security (RLS) policies:
  - Users read/insert own consultations.
  - Staff (roles `dev`, `super_admin`, `mentor`) read all consultations for auditing.

### 4.3 Migration 3: Automated Verifiable Certificates & Gamification (`003_certificates_and_streaks.sql`)
- **Action 1**: Create `public.certificates` table:
  ```sql
  CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_code TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    course_title_en TEXT NOT NULL,
    course_title_ar TEXT NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    final_score NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    watch_completion_rate NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'revoked')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, course_id)
  );
  ```
- **Action 2**: Create `public.user_streaks` table:
  ```sql
  CREATE TABLE IF NOT EXISTS public.user_streaks (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 1,
    longest_streak INTEGER NOT NULL DEFAULT 1,
    last_activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_active_days INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ```
- **Action 3**: Create `public.user_badges` table:
  ```sql
  CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_key TEXT NOT NULL,
    title_en TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    icon TEXT,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE(user_id, badge_key)
  );
  ```
- **Action 4**: Indexes and RLS:
  - Public can SELECT `certificates` WHERE `status = 'valid'` (enables the `/verify/[code]` public route).
  - Authenticated students read own certificates, streaks, and badges.
  - Staff manage all certificates and view metrics.

### 4.4 Migration 4: Question Rationales & Faculty Gradebook (`004_question_rationales_and_gradebook.sql`)
- **Action 1**: Extend `public.questions` table:
  ```sql
  ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS explanation_en TEXT;
  ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS explanation_ar TEXT;
  ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS clinical_reference TEXT;
  ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert'));
  ```
- **Action 2**: Create `public.quiz_submissions` table (tracks individual student quiz attempts, itemized choices, practice vs standard mode):
  ```sql
  CREATE TABLE IF NOT EXISTS public.quiz_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    lecture_id UUID REFERENCES public.lectures(id) ON DELETE SET NULL,
    mode TEXT NOT NULL DEFAULT 'standard' CHECK (mode IN ('standard', 'practice')),
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT false,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    time_spent_seconds INTEGER DEFAULT 0,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ```
- **Action 3**: Create `public.lecture_progress` table (records individual lecture completion and watch progress):
  ```sql
  CREATE TABLE IF NOT EXISTS public.lecture_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT false,
    watch_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    last_watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, lecture_id)
  );
  ```
- **Action 4**: Indexes and RLS:
  - Students read/insert own submissions and lecture progress.
  - Staff (dev, super_admin, mentor) read all submissions and progress for the Faculty Gradebook matrix.

---

## 5. TypeScript Database Types & Interfaces

The primary type definition file is `types/index.ts`. Below is the inventory of current interfaces alongside proposed extensions.

### 5.1 Proposed Updated & New Interfaces

```typescript
// ─── Feature Flagging (R1) ──────────────────────────────────────────────────
export interface FeatureFlagsConfig {
  ai_assistant: boolean
  practice_mode: boolean
  certificates: boolean
  gamification_streaks: boolean
  gradebook_analytics: boolean
  community_qa: boolean
  downloadable_resources: boolean
  course_gating: boolean
}

// ─── Course Extensions (R1) ─────────────────────────────────────────────────
export interface Course {
  id: string
  title_en: string
  title_ar: string
  description_en: string | null
  description_ar: string | null
  objectives_en: string | null
  objectives_ar: string | null
  prerequisites_en: string | null
  prerequisites_ar: string | null
  thumbnail_url: string | null
  mentor_id: string | null
  is_locked?: boolean
  access_policy?: CourseAccessPolicy
  feature_overrides?: Partial<FeatureFlagsConfig> | null
  created_at: string
  mentor?: UserProfile
}

// ─── Question Extensions (R2) ───────────────────────────────────────────────
export type QuestionDifficulty = 'easy' | 'medium' | 'hard' | 'expert'

export interface Question {
  id: string
  quiz_id: string
  text_en: string
  text_ar: string
  type: QuestionType
  options: string[] | null
  correct_answer: string
  order: number
  explanation_en?: string | null
  explanation_ar?: string | null
  clinical_reference?: string | null
  difficulty?: QuestionDifficulty
}

// ─── Certificates & Gamification (R3) ──────────────────────────────────────
export interface Certificate {
  id: string
  certificate_code: string
  user_id: string
  course_id: string
  student_name: string
  course_title_en: string
  course_title_ar: string
  issued_at: string
  final_score: number
  watch_completion_rate: number
  status: 'valid' | 'revoked'
  metadata?: Record<string, unknown>
  created_at: string
  course?: Course
  user?: UserProfile
}

export interface UserStreak {
  user_id: string
  current_streak: number
  longest_streak: number
  last_activity_date: string
  total_active_days: number
  updated_at: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_key: string
  title_en: string
  title_ar: string
  description_en?: string | null
  description_ar?: string | null
  icon?: string | null
  earned_at: string
  metadata?: Record<string, unknown>
}

// ─── AI Clinical Assistant (R4) ─────────────────────────────────────────────
export type AIConsultToolType = 'general_consult' | 'dose_calculator' | 'interaction_checker' | 'lecture_qa'

export interface AIConsultation {
  id: string
  user_id?: string | null
  lecture_id?: string | null
  course_id?: string | null
  tool_type: AIConsultToolType
  prompt: string
  response: string
  metadata?: Record<string, unknown>
  created_at: string
}

// ─── Submissions, Progress & Gradebook (R5) ──────────────────────────────────
export type QuizMode = 'standard' | 'practice'

export interface QuizSubmission {
  id: string
  user_id: string
  quiz_id: string
  course_id?: string | null
  lecture_id?: string | null
  mode: QuizMode
  score: number
  total_questions: number
  percentage: number
  passed: boolean
  answers: Record<string, string>
  time_spent_seconds?: number
  submitted_at: string
}

export interface LectureProgress {
  id: string
  user_id: string
  lecture_id: string
  course_id: string
  completed: boolean
  watch_percentage: number
  last_watched_at: string
}

export interface GradebookStudentRow {
  studentId: string
  studentName: string
  email: string
  university: string | null
  faculty: string | null
  startYear: number | null
  status: StudentStatus
  enrolledCoursesCount: number
  courseProgress: {
    courseId: string
    courseTitle: string
    lectureCompletionRate: number
    quizzesTaken: number
    totalQuizzes: number
    avgQuizScore: number
    certificateEarned: boolean
    certificateCode?: string | null
  }[]
}
```

---

## 6. API Routes & Server Actions Inventory

### 6.1 Existing API Routes
1. `pages/api/admin/analytics.ts`: Telemetry event ingestion, retention metrics, funnel calculations.
2. `pages/api/admin/settings/signup.ts`: Admin toggle for signup mode and university/faculty directory.
3. `pages/api/admin/students/enrollments.ts`: Admin approval, rejection, and batch course assignment.
4. `pages/api/admin/students/index.ts`: Student roster retrieval, account provisioning, suspension.
5. `pages/api/admin/users/create.ts` & `index.ts`: Staff account management (`dev`, `super_admin`, `mentor`).
6. `pages/api/courses/[id]/enroll.ts`: Student course registration with Turnstile bot verification.
7. `pages/api/profile/index.ts`: Student profile retrieval, activity counts, profile edits.
8. `pages/api/questions/submit.ts` & `answer.ts`: Community Q&A question submission and staff response.
9. `pages/api/students/enrollments.ts`: Student list of active enrollments and progress.
10. `pages/api/students/profile.ts` & `signup.ts`: Student onboarding and account setup.

### 6.2 Required New / Extended API Routes

| Endpoint | Method | Role / Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/ai/consult` | POST | Authenticated / Protected | Handles AI clinical consultation queries, renal CrCl dose calculations, pediatric dose staging, and DDI interaction checks. Respects feature flags. |
| `/api/certificates/generate` | POST | Authenticated | Evaluates mastery threshold (100% lecture watch + $\ge 80\%$ quiz score), generates unique code `PHARMA-2026-XXXX`, creates certificate record, awards badge. |
| `/api/certificates/verify/[code]` | GET | Public (Anonymous) | Validates and returns student name, course title, issue date, score, and verification status for `/verify/[code]`. |
| `/api/quiz/submit` | POST | Authenticated | Records `quiz_submissions`, computes score, returns clinical rationales in practice mode, updates daily streak and milestone badges. |
| `/api/lecture/progress` | POST | Authenticated | Records video watch milestones, marks lecture complete, checks course completion, updates streak. |
| `/api/admin/gradebook` | GET | Staff (`dev`, `super_admin`, `mentor`) | Queries matrix of student progress across lectures, quizzes, and certificates with university/cohort filters and CSV export. |
| `/api/admin/gradebook/analytics` | GET | Staff | Returns itemized question difficulty breakdown, distracter analysis, and lecture drop-off heatmaps. |
| `/api/admin/settings/features` | PATCH | Staff (`dev`, `super_admin`) | Updates global feature toggles in `site_content.content.features`. |

---

## 7. UI / Component Integration & Verification Flow

### 7.1 Feature Flag Enforcement Matrix
- In `components/SiteContentProvider.tsx`: Global features loaded and available via `useSiteContent()`.
- In `pages/course/[id].tsx` and `pages/lecture/[id].tsx`: Resolve effective flags via `resolveCourseFeatures(siteContent.features, course.feature_overrides)`.
- If `ai_assistant` is disabled: The AI drawer button and side sheet are hidden.
- If `practice_mode` is disabled: The practice mode toggle in `pages/quiz/[id].tsx` is hidden.
- If `certificates` is disabled: Certificate issuance triggers and download buttons are hidden.

### 7.2 Practice Mode UI in `pages/quiz/[id].tsx`
- Adds a Mode Selector: Graded Exam vs Practice Simulator.
- In Practice Mode: Selecting any answer option immediately reveals:
  - Correct / Incorrect visual badge.
  - Bilingual Clinical Rationale (`explanation_en` / `explanation_ar`).
  - Textbook / Clinical Guideline Reference citation (`clinical_reference`).

### 7.3 Public Certificate Verification Page (`pages/verify/[code].tsx`)
- Resolves any certificate code.
- Displays: Authenticated student name, course title, date of issue, final mastery score, verified seal, and SVG QR code pointing to the current verification URL.

### 7.4 Faculty Gradebook in Admin Panel (`pages/admin/index.tsx`)
- New navigation item: "Gradebook & Analytics".
- Matrix view: Student name, email, university, faculty, lecture completion rate %, quiz scores, certificate status.
- Filters: By course, university, faculty, status.
- Export: Instant CSV download formatted with BOM for Excel Arabic/English compatibility.
- Visual heatmaps: Question difficulty distribution, lecture drop-off points.

---

## 8. Summary of Findings & Next Steps

1. **Database Schema Readiness**: Core tables exist. 4 new modular migration scripts in `supabase/migrations/` will add feature flag support, AI consultations, certificates/streaks, and question rationales/gradebook tables.
2. **Type Safety**: TypeScript interfaces in `types/index.ts` and `lib/siteContent.ts` can be seamlessly extended without breaking existing queries.
3. **Build & Integrity**: Base Next.js build is verified and passing.
4. **Implementation Path**: Clear separation between migration definitions, API endpoints, and UI components ensures independent implementability.
