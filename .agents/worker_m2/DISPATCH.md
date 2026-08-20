## 2026-08-20T15:15:00Z

You are worker_m2, responsible for implementing Milestone M2: Feature Matrix & Modular Activation Engine (Requirement R1).
Your working directory is: /home/bravo-07/Documents/dev/yo-project/.agents/worker_m2
Your parent is the Project Orchestrator (aa81873a-183a-48db-b31d-72d9a6210c82).

Scope Documents:
- /home/bravo-07/Documents/dev/yo-project/.agents/ORIGINAL_REQUEST.md (MANDATORY: read this first)
- /home/bravo-07/Documents/dev/yo-project/PROJECT.md
- /home/bravo-07/Documents/dev/yo-project/TEST_READY.md

Exclusive Write Ownership:
- `components/admin/DeveloperConsole.tsx`
- `components/admin/SiteContentManager.tsx`
- `components/admin/AdminModals.tsx`
- `components/admin/CurriculumManager.tsx`
- `components/SiteContentProvider.tsx`
- `pages/course/[id].tsx`

Detailed Tasks for Milestone M2:
1. Global Feature Flags UI in Admin CMS & Developer Console:
   - In `components/admin/DeveloperConsole.tsx`, add a dedicated "Feature Matrix & Flags" panel allowing administrators to toggle each global flag (`ai_assistant`, `practice_mode`, `certificates`, `community_qa`, `gradebook`) with live status badges, descriptions (bilingual EN/AR), and instant save to `site_content.content.features`.
   - In `components/admin/SiteContentManager.tsx`, add an accordion section for "Feature Flags Management" allowing toggling the same global flags within the site content editor.
2. Course-Level Feature Overrides in Course Form / Editor:
   - In `components/admin/AdminModals.tsx` (`CourseForm`), add a "Module Activation & Feature Overrides" section.
   - For each feature flag (`ai_assistant`, `practice_mode`, `certificates`, `community_qa`, `gradebook`), allow three states:
     - `Inherit Global Default` (sets override to `undefined` / not in overrides)
     - `Force Enable` (sets override to `true`)
     - `Force Disable` (sets override to `false`)
   - Show the effective resolved state dynamically in the UI based on `resolveCourseFeatures()`.
   - When creating new courses, initialize `feature_overrides` to `{}` so that they automatically inherit all global defaults.
   - When editing courses, persist `feature_overrides` JSONB to `courses.feature_overrides` in Supabase.
3. Course View & Navigation Integration:
   - In `pages/course/[id].tsx` and navigation/curriculum components, use `resolveCourseFeatures(siteContent.features, course.feature_overrides)` to conditionally display or disable feature entry points (such as AI consultation, practice mode prompts, certificates, or community Q&A).
4. Run verification:
   - Run `npx tsc --noEmit` to verify 0 type errors.
   - Run `npm run build` to verify exit code 0.
   - Run `node scripts/run-e2e-tests.mjs` to verify all 98 tests pass.
