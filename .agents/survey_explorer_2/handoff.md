# Handoff Report — Frontend Routes & UI Component Architecture

**Agent:** `survey_explorer_2`  
**Working Directory:** `/home/bravo-07/Documents/dev/yo-project/.agents/survey_explorer_2`  
**Parent:** `aa81873a-183a-48db-b31d-72d9a6210c82` (Project Orchestrator)  
**Date:** 2026-08-20  

---

## 1. Observation

1. **Routing Architecture & Framework:**
   - The application uses **Next.js Pages Router** with Next.js 15.2.0, React 19.0.0, `@supabase/supabase-js`, `next-i18next`, and Tailwind CSS (`package.json`, lines 19–42).
   - Core student routes: `pages/index.tsx` (landing page), `pages/login.tsx` (unified auth portal), `pages/profile.tsx` (student profile & progress), `pages/course/[id].tsx` (course syllabus & enrollment), `pages/lecture/[id].tsx` (video player theater, summary/resources/quizzes tabs, community Q&A), `pages/quiz/[id].tsx` (interactive quiz runner).
   - Core admin routes: `pages/admin/index.tsx` (7-tab administration dashboard: `analytics`, `curriculum`, `qa`, `students`, `users`, `content`, `dev`), `pages/admin/login.tsx` (staff login).

2. **Quiz Runner & Question Authoring:**
   - In `pages/quiz/[id].tsx` (lines 53–120), quiz state tracks `answers: Record<string, string>` and `submitted: boolean`. Quizzes currently run only in standard submitted mode without instant feedback or clinical rationales.
   - In `components/admin/AdminModals.tsx` (lines 659–827), `QuestionForm` provides fields for `quiz_id`, `type`, `text_en`, `text_ar`, `options`, `correct_answer`, and `order`. It lacks fields for `explanation_en`, `explanation_ar`, and `textbook_ref`.
   - In `types/index.ts` (lines 66–78), the `Question` interface is defined without explanation or reference fields.

3. **Lecture Viewer & Context-Aware AI Drawer:**
   - In `pages/lecture/[id].tsx` (lines 40–120), lecture details (`lecture.title_en`, `lecture.title_ar`, `lecture.details_en`, `lecture.details_ar`), course objectives (`course.objectives_en`, `course.objectives_ar`), and YouTube player state are available.
   - In `components/YouTubePlayer.tsx` (lines 79–232), video playback timestamp and milestone events (25%, 50%, 75%, 100%) are tracked via `trackVideoEvent` in `lib/analytics.ts`.
   - In `components/ui/sheet.tsx` (lines 1–142), Radix UI `Sheet` primitive is available for implementing the in-lecture context-aware side drawer.

4. **Feature Matrix & Modular Activation Engine:**
   - In `components/SiteContentProvider.tsx` (lines 1–93) and `lib/siteContent.ts` (lines 1–60), global site settings are loaded from `public.site_content` (`id: 'main'`) and synced in real-time via the Supabase Realtime channel `public:site_content_sync`.
   - In `components/admin/DeveloperConsole.tsx` (lines 1–450) and `components/admin/SiteContentManager.tsx` (lines 1–407), developer tools and bilingual CMS accordions are present, providing the exact integration surfaces for global feature flag toggles.
   - In `components/admin/AdminModals.tsx` (lines 35–220), `CourseForm` currently lacks controls for course-level feature overrides (`courses.feature_overrides`).

5. **Faculty Gradebook & Performance Analytics:**
   - In `components/admin/AnalyticsDashboard.tsx` (lines 1–550), aggregate metrics (pageviews, video retention funnel, quiz pass rate, score distribution tiers) are displayed.
   - In `components/admin/CourseEnrollmentManager.tsx` (lines 1–800) and `components/admin/StudentManager.tsx` (lines 1–800), student accounts and enrollment approvals are managed, but there is no itemized student-by-student matrix showing lecture completion %, individual quiz scores, certificate status, and CSV export.

---

## 2. Logic Chain

1. **R1 (Feature Flags):** Because global site settings are already distributed via `SiteContentProvider` and synced via Supabase Realtime, extending `site_content.content.features` with flags (`ai_assistant`, `practice_mode`, `certificates`, `community_qa`, `gradebook`) will automatically provide real-time feature gating without page reloads. Adding `feature_overrides` JSONB to `courses` enables course-specific customization that resolves via `course.feature_overrides?.[flag] ?? siteContent.features?.[flag] ?? DEFAULT`.
2. **R2 (Practice Mode):** Because `pages/quiz/[id].tsx` already tracks question-by-question selection, introducing a `practiceMode` boolean state allows conditionally rendering instant correctness feedback upon radio selection. Extending `Question` in `types/index.ts`, `QuestionForm` in `AdminModals.tsx`, and the `questions` SQL table with `explanation_en`, `explanation_ar`, and `textbook_ref` enables the instant display of bilingual clinical rationales and textbook references.
3. **R3 (Certificates & Verification):** Because `pages/profile.tsx` already tracks enrolled course completion and `YouTubePlayer.tsx` tracks video milestones, a deterministic mastery rule (100% lecture watch completion + $\ge 80\%$ average quiz score) can trigger certificate generation. Introducing `pages/verify/[code].tsx` enables public validation of certificate codes and QR verification without requiring authentication.
4. **R4 (Hybrid AI Clinical Assistant):** Because `pages/lecture/[id].tsx` already has access to lecture metadata, syllabus objectives, and active video timestamps, adding a trigger button that opens `components/ui/sheet.tsx` enables context-aware prompt injection to `/api/ai/consult`. Incorporating interactive calculators (Cockcroft-Gault CrCl, Pediatric BSA, DDI checker) into the drawer provides immediate clinical utility during video lectures.
5. **R5 (Faculty Gradebook):** Because student roster and enrollment records are managed in `CourseEnrollmentManager.tsx` and quiz submissions can be recorded in `quiz_submissions`, creating a dedicated Gradebook matrix component with student rows, itemized quiz columns, lecture watch %, certificate status, university/cohort filters, and CSV export will fulfill all institutional reporting requirements.

---

## 3. Caveats

1. **LLM Provider API Keys:** The Hybrid AI Clinical Assistant (`/api/ai/consult`) requires a valid API key (e.g., Gemini API / Anthropic / OpenAI) configured in server environment variables. A graceful fallback / mock mode should be provided if no key is configured in dev.
2. **Migration Execution Order:** SQL migrations in `supabase/migrations/` must be executed sequentially (01: feature flags $\rightarrow$ 02: AI consultations $\rightarrow$ 03: certificates & streaks $\rightarrow$ 04: question rationales & gradebook) to preserve relational integrity.
3. **Existing Questions Backfill:** Existing questions in the database will have `NULL` values for `explanation_en`, `explanation_ar`, and `textbook_ref`. The UI must handle missing rationales gracefully by hiding the rationale card or showing a default fallback message.

---

## 4. Conclusion

The PharmaCore frontend architecture is well-structured and highly extensible. Next.js Pages router, Radix UI primitives, Supabase Realtime, and Tailwind CSS provide all necessary primitives to implement requirements R1 through R6 seamlessly. Complete implementation blueprints, component modifications, state flows, and migration specifications have been formulated and documented in `/home/bravo-07/Documents/dev/yo-project/.agents/survey_explorer_2/analysis.md`.

---

## 5. Verification Method

1. **TypeScript Build Verification:**
   ```bash
   npm run build
   ```
   *Expected result:* Zero compilation errors, all dynamic routes (`pages/verify/[code].tsx`, `pages/api/ai/consult.ts`, etc.) resolve properly.

2. **Lint & Static Analysis:**
   ```bash
   npm run lint
   ```
   *Expected result:* All pages and components pass ESLint and TypeScript checks.

3. **UI Inspection Checklist:**
   - Inspect `pages/quiz/[id].tsx` to verify Practice Mode toggle, instant feedback, and rationale rendering.
   - Inspect `components/admin/AdminModals.tsx` to verify `explanation_en`, `explanation_ar`, and `textbook_ref` input fields in `QuestionForm`.
   - Inspect `pages/lecture/[id].tsx` to verify AI drawer slide-out, context capture, and dose calculators.
   - Inspect `components/admin/DeveloperConsole.tsx` and `CourseForm` to verify feature flag controls.
   - Inspect `pages/verify/[code].tsx` to verify public certificate validation and QR rendering.
