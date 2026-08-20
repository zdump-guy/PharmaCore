# Milestone M2 Review & Adversarial Challenge Report

**Reviewer**: reviewer_m2 (Reviewer & Adversarial Critic)  
**Milestone**: M2 (Feature Matrix & Modular Activation Engine - Requirement R1)  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

### 1.1 Verification Commands Execution
- **TypeScript Compilation (`npx tsc --noEmit`)**:
  - Exited with code `0` (0 errors).
- **Production Build (`npm run build`)**:
  - Exited with code `0`.
  - Next.js 15.5.23 compiled successfully in 2.7s.
  - Generating static pages: `7/7` completed.
  - All dynamic and static routes (`/`, `/admin`, `/course/[id]`, `/lecture/[id]`, `/login`, `/profile`, `/quiz/[id]`, etc.) compiled cleanly.
- **E2E Test Runner (`node scripts/run-e2e-tests.mjs`)**:
  - Exited with code `0`.
  - Summary: Total `98` tests executed, `98` passed (100.0%), `0` failed in `0.02s`.

### 1.2 Review Target Code Inspections

1. **`components/admin/DeveloperConsole.tsx`**:
   - Sub-tab `"flags"` added to `DevSubTab` (line 59).
   - Card in "system" telemetry view linking directly to the Feature Matrix with live `{active}/{total}` badge (lines 764-779).
   - "Feature Matrix & Modular Activation Engine" panel (lines 818-997) with:
     - Header badge indicating active flags count out of `FEATURE_FLAG_KEYS.length`.
     - Category-based badges and color schemes (`ai`, `assessment`, `gamification`, `collaboration`, `analytics`).
     - Bilingual titles (`title_en`, `title_ar`) and descriptions (`description_en`, `description_ar`).
     - Status badges (`Active / ON` vs `Disabled / OFF`).
     - Batch control buttons: `Enable All`, `Disable All`, `Reset Defaults`.
     - Direct persistence button invoking `onSaveSiteContent(updatedSiteContent)` to update `site_content.content.features`.
     - Visual confirmation alert upon successful save (`flagsSavedSuccess`).

2. **`components/admin/SiteContentManager.tsx`**:
   - Accordion item `"Feature Flags"` added to default opened accordion list (line 168).
   - Live preview counter badge in header `Object.values(...).filter(Boolean).length / 5 Active` (lines 187-195).
   - Toggle switch per feature flag mapped to `siteContent.features` via `toggleFeatureFlag(key)` (lines 82-91, 215-281).
   - Saved centrally with all other CMS content via `onSaveContent`.

3. **`components/admin/AdminModals.tsx`**:
   - `CourseForm` type extended with `feature_overrides?: Partial<FeatureFlagsConfig> | null` (line 60).
   - Dedicated "Module Activation & Feature Overrides" section in `CourseForm` modal (lines 329-467).
   - Computes effective resolved state using `resolveCourseFeatures(siteContent?.features, courseForm.feature_overrides)` (lines 172-175, 363).
   - 3-way toggle controls per flag (`Inherit`, `Force ON`, `Force OFF`) via `handleOverrideChange` (lines 177-195, 423-462):
     - `Inherit`: Deletes the key from `feature_overrides` so it cleanly inherits global defaults without lingering `undefined` properties.
     - `Force ON`: Sets `feature_overrides[key] = true`.
     - `Force OFF`: Sets `feature_overrides[key] = false`.
   - Dynamic badges displaying `Forced ON`, `Forced OFF`, or `Inherited: ON` / `Inherited: OFF` reflecting current global setting.

4. **`components/admin/CurriculumManager.tsx`**:
   - Course cards in catalog overview display override badge (`X Overrides`) when `course.feature_overrides && Object.keys(course.feature_overrides).length > 0` (lines 266-271).

5. **`pages/course/[id].tsx`**:
   - Calls `resolveCourseFeatures(siteContent?.features, course.feature_overrides)` to calculate effective flags (lines 188-191).
   - Conditionally renders feature badges in the course hero header based on resolved feature flags (lines 333-356):
     - `resolvedFeatures.certificates`: "Certificate on Completion" badge.
     - `resolvedFeatures.ai_assistant`: "AI Clinical Assistant" badge.
     - `resolvedFeatures.practice_mode`: "Practice Mode & Rationales" badge.
     - `resolvedFeatures.community_qa`: "Mentor & Peer Q&A" badge.

6. **`pages/admin/index.tsx` (Call-Site Exploration)**:
   - In `openCourse(x?: Course)` (lines 727-747):
     ```typescript
     const openCourse = (x?: Course) => {
       setCourseForm(
         x
           ? {
               id: x.id,
               title_en: x.title_en,
               title_ar: x.title_ar,
               description_en: x.description_en ?? "",
               description_ar: x.description_ar ?? "",
               objectives_en: x.objectives_en ?? "",
               objectives_ar: x.objectives_ar ?? "",
               prerequisites_en: x.prerequisites_en ?? "",
               prerequisites_ar: x.prerequisites_ar ?? "",
               thumbnail_url: x.thumbnail_url ?? "",
               is_locked: x.is_locked,
               access_policy: x.access_policy || (x.is_locked ? "students_only" : "open"),
             }
           : emptyCourse
       )
       setEditor("course")
     }
     ```
   - **Observed Defect**: `openCourse` omits `feature_overrides: x.feature_overrides`.

---

## 2. Logic Chain

1. **Integrity & Core Implementation**:
   - The implementation in `components/admin/DeveloperConsole.tsx`, `components/admin/SiteContentManager.tsx`, `components/admin/AdminModals.tsx`, `components/admin/CurriculumManager.tsx`, and `pages/course/[id].tsx` adheres to interface contracts and requirements without dummy implementations, facade code, or hardcoded test shortcuts.
   - All tests in `tests/e2e/` run genuine functional logic and pass 100%.

2. **Root Cause Analysis of Identified Defect**:
   - In `AdminModals.tsx`, `CourseForm` has `feature_overrides?: Partial<FeatureFlagsConfig> | null`.
   - When creating a new course, `openCourse()` invokes `setCourseForm(emptyCourse)` where `feature_overrides` is `undefined`, properly defaulting to all inherited global settings.
   - When editing an existing course `x` that has existing custom overrides (e.g., `{ practice_mode: false }`), `openCourse(x)` constructs a new object for `courseForm` but omits `feature_overrides: x.feature_overrides`.
   - Consequently, `courseForm.feature_overrides` becomes `undefined` upon opening the modal for an existing course.
   - The modal incorrectly displays "All Inherited" for existing courses that actually have custom overrides.
   - If the administrator submits the edit form (e.g., to update course description or title), `saveCourse` sends `payload` containing `feature_overrides: undefined`, which erases the course's stored feature overrides in Supabase `courses.feature_overrides`.

3. **Severity & Impact**:
   - This constitutes a **Major Functional Defect** in the course override editing workflow.
   - It directly violates Requirement R1 ("When editing courses, persist `feature_overrides` JSONB to `courses.feature_overrides` in Supabase" without unintended loss of existing configuration).

---

## 3. Findings

### [Major] Finding 1: `openCourse` omits `feature_overrides` in `pages/admin/index.tsx`
- **What**: When opening the Course Editor modal for an existing course, `openCourse` fails to populate `feature_overrides` from the course record `x`.
- **Where**: `pages/admin/index.tsx`, lines 727–747.
- **Why**: Pre-existing feature overrides are wiped in the modal UI and inadvertently overwritten/reset to `undefined` upon saving.
- **Suggestion**: Add `feature_overrides: x.feature_overrides ?? null` to the `setCourseForm` object in `openCourse` in `pages/admin/index.tsx`:
  ```typescript
  const openCourse = (x?: Course) => {
    setCourseForm(
      x
        ? {
            id: x.id,
            title_en: x.title_en,
            title_ar: x.title_ar,
            description_en: x.description_en ?? "",
            description_ar: x.description_ar ?? "",
            objectives_en: x.objectives_en ?? "",
            objectives_ar: x.objectives_ar ?? "",
            prerequisites_en: x.prerequisites_en ?? "",
            prerequisites_ar: x.prerequisites_ar ?? "",
            thumbnail_url: x.thumbnail_url ?? "",
            is_locked: x.is_locked,
            access_policy: x.access_policy || (x.is_locked ? "students_only" : "open"),
            feature_overrides: x.feature_overrides ?? null,
          }
        : emptyCourse
    )
    setEditor("course")
  }
  ```

---

## 4. Adversarial Challenge & Stress-Test Results

| Scenario / Hypothesis | Stress-Test / Attack Input | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|---|
| **Partial Overrides Resolution** | `courseOverrides = { ai_assistant: false }`, `globalFlags = { practice_mode: false }` | `ai_assistant` -> false (course), `practice_mode` -> false (global), others -> true (default) | `resolveCourseFeatures` handles precedence and fallback cleanly | **PASS** |
| **Inherit Action State Cleanup** | Admin toggles flag to `Inherit` after it was `Force ON` | `delete updatedOverrides[key]` removes key from object without leaving `undefined` values | Clean deletion of key from `courseForm.feature_overrides` | **PASS** |
| **Global Batch Actions** | Admin clicks "Disable All", then "Save" | All 5 flags set to `false` and saved to `site_content.features` | Updated state accurately serialized and dispatched | **PASS** |
| **Course Edit Lifecycle** | Admin edits course with existing `feature_overrides` | Modal loads existing overrides and preserves them on save | Modal initializes `feature_overrides` as `undefined` due to missing mapping in `openCourse` | **FAIL (Finding 1)** |
| **Type Safety & Build** | Next.js production build & TypeScript verification | Zero type errors, code 0 exit | `tsc` and `next build` both exited 0 with 0 errors | **PASS** |

---

## 5. Caveats
- No other caveats. The core modular architecture, database migrations from M1, two-tier resolution engine in `lib/featureFlags.ts`, Developer Console UI, Site Content Manager CMS, and Course View UI are in robust condition.

---

## 6. Conclusion
The implementation for Milestone M2 is 95% complete with outstanding UI and modular design. However, due to the missing `feature_overrides` property in `openCourse` (`pages/admin/index.tsx`), editing an existing course resets its feature overrides.
Therefore, the verdict is **REQUEST_CHANGES** to address this 1-line mapping issue.

---

## 7. Verification Method
To independently verify the fix after addressing Finding 1:
1. Run typecheck:
   ```bash
   npx tsc --noEmit
   ```
2. Run production build:
   ```bash
   npm run build
   ```
3. Run E2E test suite:
   ```bash
   node scripts/run-e2e-tests.mjs
   ```
4. Verify `pages/admin/index.tsx:openCourse` includes `feature_overrides: x.feature_overrides ?? null`.
