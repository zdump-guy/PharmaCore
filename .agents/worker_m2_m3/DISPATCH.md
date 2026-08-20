## 2026-08-20T15:27:17Z
You are worker_m2_m3, an implementation worker responsible for resolving the M2 edit defect and implementing Milestone M3: Practice Exam Simulator with Instant Clinical Rationales (Requirement R2).
Your working directory is: /home/bravo-07/Documents/dev/yo-project/.agents/worker_m2_m3
Your parent is the Project Orchestrator (aa81873a-183a-48db-b31d-72d9a6210c82).

Scope Documents:
- /home/bravo-07/Documents/dev/yo-project/.agents/ORIGINAL_REQUEST.md (MANDATORY: read this first)
- /home/bravo-07/Documents/dev/yo-project/PROJECT.md
- /home/bravo-07/Documents/dev/yo-project/TEST_READY.md
- /home/bravo-07/Documents/dev/yo-project/.agents/reviewer_m2/handoff.md

Exclusive Write Ownership:
- `pages/admin/index.tsx`
- `pages/quiz/[id].tsx`
- `components/admin/AdminModals.tsx`
- `components/admin/CurriculumManager.tsx`
- `components/quiz/` (any new quiz subcomponents if needed)

Tasks:
1. [Milestone M2 Fix]: In `pages/admin/index.tsx`, locate `openCourse(x)` (around lines 727-747) and ensure `feature_overrides: x.feature_overrides ?? null` is populated into `courseForm` when opening an existing course for editing.
2. [Milestone M3 Implementation - Requirement R2]:
   a. In `pages/quiz/[id].tsx`:
      - Add an untimed **Practice Mode** toggle at the top of the quiz runner (e.g. toggle between Standard Exam Mode and Untimed Practice Mode with Instant Rationales).
      - In Practice Mode:
        - As soon as a student selects an answer option for a question, immediately display instant feedback:
          - A clear visual indicator (Correct / Incorrect) highlighting the chosen option and the correct option.
          - Clinical Rationale card showing bilingual explanations (`question.explanation_en`, `question.explanation_ar`) and textbook/guideline references (`question.clinical_reference`).
        - The student can explore questions at their own pace without timer constraints.
      - In Standard Exam Mode:
        - Keep the existing timed/scored examination flow intact (answers recorded and feedback revealed only after final quiz submission).
      - Feature Flag Gating: If `practice_mode` is disabled for the course (via `resolveCourseFeatures()`), disable/hide the Practice Mode toggle and enforce Standard Mode.
   b. In `components/admin/AdminModals.tsx` (`QuestionForm`) and `components/admin/CurriculumManager.tsx`:
      - Update Question Authoring dialogs to include input fields for:
        - `explanation_en` (English Clinical Explanation / Rationale)
        - `explanation_ar` (Arabic Clinical Explanation / Rationale)
        - `clinical_reference` (Textbook / Clinical Guideline Reference, e.g. "Goodman & Gilman's Pharmacological Basis of Therapeutics, 14th Ed.")
        - `difficulty` ('easy' | 'medium' | 'hard' dropdown selector).
      - Ensure these fields are saved to the `questions` table in Supabase and loaded when editing existing questions.
3. Verification:
   - Run `npx tsc --noEmit` -> verify 0 type errors.
   - Run `npm run build` -> verify exit code 0.
   - Run `node scripts/run-e2e-tests.mjs` -> verify all 98 tests pass.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When finished, write handoff.md in your working directory and send a message to your parent.
