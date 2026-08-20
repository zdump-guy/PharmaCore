# Handoff Report — Milestone M1 Review (reviewer_m1_2)

**Reviewer**: reviewer_m1_2  
**Milestone**: M1 (Database Migrations & Schema Foundations)  
**Timestamp**: 2026-08-20T18:07:00+03:00  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

Direct observations, tool outputs, and file audits:

1. **Build Verification (`npm run build`)**:
   - Command: `npm run build`
   - Result: Exited with code 1 (FAILED).
   - Verbatim error log:
     ```
     > yo-project@0.1.0 build
     > next build

        ▲ Next.js 15.5.23
        - Environments: .env.local

     ./pages/profile.tsx
     154:6  Warning: React Hook useEffect has a missing dependency: 'tr'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps

     ./components/admin/AnalyticsDashboard.tsx
     157:3  Warning: 'quizzes' is defined but never used.  @typescript-eslint/no-unused-vars
     158:3  Warning: 'questions' is defined but never used.  @typescript-eslint/no-unused-vars

        Linting and checking validity of types     ✓ Linting and checking validity of types 
        Creating an optimized production build ...
      ✓ Compiled successfully in 31.5s

     > Build error occurred
     [Error: ENOENT: no such file or directory, open '/home/bravo-07/Documents/dev/yo-project/.next/server/pages-manifest.json'] {
       errno: -2,
       code: 'ENOENT',
       syscall: 'open',
       path: '/home/bravo-07/Documents/dev/yo-project/.next/server/pages-manifest.json'
     }
     ```
   - On a subsequent run:
     ```
     > Could not find a production build in the '/home/bravo-07/Documents/dev/yo-project/.next' directory. Try building your app with 'next build' before starting the static export. https://nextjs.org/docs/messages/next-export-no-build-id
     ```

2. **TypeScript & E2E Test Suite Execution**:
   - `npx tsc --noEmit`: Exited 0 with 0 type errors.
   - `node scripts/run-e2e-tests.mjs`: Exited 0.
     - Total Tests: 98
     - Passed: 98 (100.0%)
     - Failed: 0

3. **RLS Policy Vulnerability in `supabase/migrations/002_ai_consultations.sql`**:
   - Lines 34–37:
     ```sql
     DROP POLICY IF EXISTS "Users can insert own AI consultations" ON public.ai_consultations;
     CREATE POLICY "Users can insert own AI consultations"
       ON public.ai_consultations FOR INSERT
       WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);
     ```
   - Direct Observation: The clause `OR auth.uid() IS NULL` allows an unauthenticated client to insert rows where `user_id` is set to any arbitrary existing user's UUID, spoofing consultation history for other users.

4. **Realtime Publication Registration in `supabase/migrations/001_feature_flags.sql`**:
   - Lines 58–71: The migration script comment notes adding both `site_content` and `courses` for realtime sync, but the `DO $$` block only executes `ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content;` and omits `public.courses`.

5. **Interface and Contract Alignment (`types/index.ts`, `lib/featureFlags.ts`, `lib/siteContent.ts`)**:
   - `FeatureFlagsConfig`, `Course.feature_overrides`, `Question` rationales (`explanation_en`, `explanation_ar`, `clinical_reference`, `difficulty`), `CertificateRecord`, `AIConsultRequest`, `QuizSubmission`, `LectureProgress`, and `GradebookEntry` match the requirements in `ORIGINAL_REQUEST.md` and `PROJECT.md`.
   - `resolveCourseFeatures()` correctly enforces two-tier precedence (`courseOverrides` -> `globalFlags` -> `defaultFeatureFlags`).

---

## 2. Logic Chain

1. **Build Gate Violation**:
   - Requirement Task 1 states: "Verify `npm run build` exits 0 with 0 errors."
   - Acceptance Criteria in `ORIGINAL_REQUEST.md` states: "`npm run build` exits with code 0 and 0 TypeScript/ESLint errors."
   - Observation 1 proves `npm run build` currently fails with exit code 1 due to missing server manifest artifacts during the build pipeline (`.next/server/pages-manifest.json`).
   - Therefore, the work product cannot be approved until `npm run build` exits cleanly with code 0.

2. **Security & Authorization Defect**:
   - In Supabase PostgreSQL RLS, when a request is made with the anonymous role, `auth.uid()` evaluates to `NULL`.
   - In `supabase/migrations/002_ai_consultations.sql` line 37, the check `(auth.uid() = user_id OR auth.uid() IS NULL)` evaluates to `true` whenever `auth.uid()` is `NULL`, regardless of what value is provided in the `user_id` column.
   - This allows anonymous callers to insert AI consultation records and associate them with arbitrary victim user IDs.
   - The condition must be constrained so that unauthenticated users can only insert records with `user_id IS NULL`: `((auth.uid() IS NOT NULL AND auth.uid() = user_id) OR (auth.uid() IS NULL AND user_id IS NULL))`.

3. **Publication Coverage**:
   - Course-level feature overrides are stored in `public.courses`.
   - For real-time updates to propagate to client listeners when a course's `feature_overrides` change, `public.courses` should also be added to `supabase_realtime` if not already present.

---

## 3. Caveats

- Local E2E suite (`node scripts/run-e2e-tests.mjs`) tests migration DDL parsing and behavioral logic, passing 98/98 tests.
- TypeScript static type checking (`npx tsc --noEmit`) passes cleanly with 0 errors.
- The build failure in `next build` is isolated to the Next.js production build output/manifest generation step and does not stem from TypeScript type syntax errors.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

The foundation work in Milestone M1 is largely well-structured, with comprehensive TypeScript interfaces, robust two-tier feature flag resolution, and valid SQL migration tables. However, changes are required before advancing:

1. **[Critical] Fix Next.js Build**: Ensure `npm run build` completes successfully and exits with code 0 without ENOENT errors on `.next/server/pages-manifest.json`.
2. **[Major] Patch AI Consultations RLS Policy**: Update `supabase/migrations/002_ai_consultations.sql` line 37 to prevent unauthenticated users from spoofing `user_id`:
   ```sql
   WITH CHECK (
     (auth.uid() IS NOT NULL AND auth.uid() = user_id)
     OR (auth.uid() IS NULL AND user_id IS NULL)
   );
   ```
3. **[Minor] Add `courses` to Realtime Publication**: Update `supabase/migrations/001_feature_flags.sql` to include `public.courses` in `supabase_realtime`.

---

## 5. Verification Method

To independently verify these items:

1. **Verify Build**:
   ```bash
   npm run build
   ```
   *Expected*: Exit code 0, all static and dynamic pages generated without manifest ENOENT errors.

2. **Verify E2E Tests**:
   ```bash
   node scripts/run-e2e-tests.mjs
   ```
   *Expected*: 98/98 tests pass (100%).

3. **Verify Typecheck**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected*: 0 type errors.

4. **Verify RLS Security**:
   Inspect `supabase/migrations/002_ai_consultations.sql` to confirm `WITH CHECK` protects against anonymous `user_id` spoofing.
