# PharmaCore Comprehensive Frontend & UI Component Architecture Analysis

**Agent:** `survey_explorer_2`  
**Date:** 2026-08-20  
**Scope Reference:** `/home/bravo-07/Documents/dev/yo-project/.agents/ORIGINAL_REQUEST.md`  
**Target:** PharmaCore (Open Clinical Pharmacy Learning Platform)  

---

## 1. Executive Summary & Overview

This exploration report provides a comprehensive architectural map and technical blueprint of PharmaCore's frontend routes, UI components, state management, and administrative interfaces. PharmaCore is an open clinical pharmacy education platform built with **Next.js (Pages Router)**, **TypeScript**, **Tailwind CSS**, **Radix UI Primitives**, **Supabase Auth / Database / Realtime**, and **next-i18next** (English `en` & Arabic `ar` with full RTL support).

The platform is undergoing a major 4-phase transformation across six key pillars:
- **R1. Feature Matrix & Modular Activation Engine:** Database-driven global feature toggles and course-level overrides.
- **R2. Practice Exam Simulator with Instant Clinical Rationales:** Interactive untimed practice mode with immediate bilingual rationales and textbook references.
- **R3. Automated Verifiable Certificates & Gamification:** Mastery-triggered certificate issuance with public QR verification at `/verify/[code]`, daily streaks, and badges.
- **R4. Hybrid AI Clinical Assistant:** In-lecture context-aware side drawer with syllabus awareness, interactive consultation workspace, and clinical calculation tools (renal clearance, pediatric dosing, DDI checker).
- **R5. Faculty Gradebook & Performance Analytics:** Student-by-student completion and itemized quiz gradebook matrix, university/cohort filters, CSV export, and question difficulty heatmaps.
- **R6. Incremental Database Migrations:** 4 modular SQL scripts covering features, AI logs, certificates, and question rationales/gradebook.

---

## 2. Next.js Routing & Layout Architecture

### 2.1 Router Framework Detection
The project is built on **Next.js Pages Router** (`pages/` directory structure, Next.js `15.2.0`, React `19.0.0`). The root layout is managed through `pages/_app.tsx` and wrapped in `components/Layout.tsx`.

```
pages/
├── _app.tsx                      # Root wrapper: ThemeProvider, SiteContentProvider, Maintenance mode, i18n
├── _document.tsx                  # HTML Document setup with dir/lang attributes
├── 404.tsx                       # Custom 404 error page
├── index.tsx                     # Public landing page (Hero, About, Curriculum list, CTA)
├── login.tsx                     # Unified Authentication Portal (Login, Student Signup, Account Setup)
├── profile.tsx                   # Student Academic Profile & Learning Activity Dashboard
├── course/
│   └── [id].tsx                  # Course syllabus, learning objectives, enroll button, lecture list
├── lecture/
│   └── [id].tsx                  # Lecture Theater: YouTube player, tabs (Summary/Notes/Quizzes/Q&A)
├── quiz/
│   └── [id].tsx                  # Interactive Quiz Runner & Assessment Simulator
├── admin/
│   ├── index.tsx                 # Master Faculty/Admin Dashboard (7 tabs)
│   └── login.tsx                 # Staff / Faculty / Developer authentication gate
├── verify/                       # [NEW REQUIRED ROUTE for R3]
│   └── [code].tsx                # Public Certificate Verification & Authenticity Validation
└── api/
    ├── profile.ts                # Student profile fetch and update PATCH
    ├── courses/
    │   └── [id]/enroll.ts        # Student course enrollment request handler
    ├── questions/
    │   ├── answer.ts             # Question answer tracking
    │   └── submit.ts             # Quiz submission and score calculation
    ├── students/
    │   ├── signup.ts             # Public student self-registration endpoint
    │   ├── profile.ts            # Student profile updates
    │   └── enrollments.ts        # Student active/pending enrollments endpoint
    ├── admin/
    │   ├── analytics.ts          # Aggregated analytics, funnel, retention, score tiers
    │   ├── users/                # User management & batch create
    │   ├── students/             # Student roster & course enrollment approvals
    │   └── settings/signup.ts    # Student registration access toggles
    ├── ai/                       # [NEW REQUIRED ROUTE for R4]
    │   └── consult.ts            # Hybrid AI Clinical Assistant LLM endpoint
    ├── certificates/             # [NEW REQUIRED ROUTE for R3]
    │   ├── verify.ts             # Public certificate validation query
    │   └── generate.ts           # Mastery-based certificate generation
    └── gradebook/                # [NEW REQUIRED ROUTE for R5]
        ├── matrix.ts             # Itemized student gradebook dataset
        └── export-csv.ts         # CSV export generator
```

### 2.2 Global State & Provider Architecture
1. **`SiteContentProvider` (`components/SiteContentProvider.tsx`):**
   - Loads global content, branding, navigation, enrollment settings, and feature flags from the `site_content` table (`id: 'main'`).
   - Listens to Supabase Realtime channel `public:site_content_sync` on `site_content` changes to trigger instant client-side UI re-rendering without page refreshes.
2. **`ThemeProvider` (`components/ThemeProvider.tsx`):**
   - Manages light/dark theme switching and persists preferences to `localStorage`.
3. **`Layout` (`components/Layout.tsx`) & `Navbar` (`components/Navbar.tsx`):**
   - Provides responsive glassmorphic navigation, locale switcher (`en` / `ar`), auth dropdown, mobile slide-over drawer (`components/ui/sheet.tsx`), and maintenance mode banner.

---

## 3. Detailed Component Deep-Dive

### 3.1 Quiz Runner & Question Authoring (R2)

#### Current Implementation (`pages/quiz/[id].tsx`)
- **State Structure:**
  - `answers: Record<string, string>`: Holds user selected option IDs.
  - `submitted: boolean`: Controls whether the quiz is in answering state or post-submission scored state.
  - `score: number`, `percentage: number`, `passed: boolean`: Scored post-submission metrics.
- **Workflow:**
  - Standard mode: User selects an option, clicks "Next", advances through all questions, and hits "Submit Quiz".
  - On submission: Evaluates answers against `question.correct_answer`, tracks `quiz_submitted` analytics event, records score, and shows score summary card with review mode.

#### Practice Exam Simulator Enhancement Plan
1. **Practice Mode Toggle:**
   - Add a sticky header switch in `pages/quiz/[id].tsx`: `[Standard Exam Mode | Practice Mode (Instant Rationales)]`.
   - Feature-gated via `course.feature_overrides?.practice_mode ?? siteContent.features?.practice_mode ?? true`.
2. **Instant Feedback & Clinical Rationales (Practice Mode Active):**
   - When an option is selected in Practice Mode:
     - Immediately reveals if the selection is correct (green badge / ring) or incorrect (red badge / ring with highlight on correct answer).
     - Renders an **Instant Clinical Rationale Card**:
       - Arabic explanation (`question.explanation_ar`) and English explanation (`question.explanation_en`) with language toggle or localized view.
       - Clinical Textbook / Guideline Reference Badge (`question.textbook_ref`) displaying the source (e.g. *Goodman & Gilman 14th Ed.*, *Dipiro Pharmacotherapy 12th Ed.*, *AHA/ACC 2023 Guidelines*).
3. **Question Authoring Dialog in Admin CMS (`components/admin/AdminModals.tsx` & `CurriculumManager.tsx`):**
   - **Current `QuestionForm` fields (Lines 659–827):** `quiz_id`, `type` (`multiple_choice` / `true_false` / `short_text`), `text_en`, `text_ar`, `options` (JSON string array), `correct_answer`, `order`.
   - **Required Additions:**
     - `explanation_en` (`TEXT`): Rich text / markdown textarea for English clinical explanation & pharmacological reasoning.
     - `explanation_ar` (`TEXT`): Rich text / markdown textarea for Arabic clinical explanation & pharmacological reasoning.
     - `textbook_ref` (`TEXT`): Text input for Clinical reference citation / textbook chapter / clinical guideline.
   - **Modal UI Updates:** Update `QuestionModal` in `AdminModals.tsx` to include bilingual explanation textareas and textbook reference input with quick copy / preview capability.

---

### 3.2 Lecture Viewer & In-Lecture AI Clinical Drawer (R4)

#### Current Implementation (`pages/lecture/[id].tsx` & `components/YouTubePlayer.tsx`)
- **Video Theater:**
  - Embeds custom YouTube Player with custom controls, seekbar, playback speed selector, fullscreen toggle, and milestone telemetry (25%, 50%, 75%, 100%).
- **Sidebar & Tabs:**
  - Tab 1: **Summary / Notes** (`lecture.details_en` / `lecture.details_ar`).
  - Tab 2: **Resources** (PDF downloads, slide decks).
  - Tab 3: **Quizzes** (Checkpoints & end-of-lecture assessments).
  - Tab 4: **Q&A Discussion Feed** (Community questions and mentor replies).

#### Hybrid AI Clinical Assistant Integration Plan
1. **Drawer UI Component:**
   - Utilize existing `components/ui/sheet.tsx` (`Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetTitle`).
2. **Placement & Triggers:**
   - **Video Header / Action Bar Trigger:** Floating action button next to theater mode or in the lecture title bar:
     - Label: `✨ AI Clinical Assistant` / `✨ المساعد السريري الذكي`
     - Keyboard shortcut trigger: `Ctrl + Shift + A` / `Cmd + Shift + A`.
   - **Bookmark Trigger:** Clicking on a video timestamp can trigger contextual inquiry.
3. **Context-Aware Payload Injection:**
   - The drawer captures:
     - `course_id`, `course_title`: Course title and curriculum metadata.
     - `lecture_id`, `lecture_title`: Current lecture title.
     - `lecture_details`: Lecture notes and syllabus topics.
     - `learning_objectives`: Course objectives (`course.objectives_en` / `course.objectives_ar`).
     - `video_timestamp`: Current playback timestamp in seconds from `YouTubePlayer`.
4. **Clinical Assistant Capabilities:**
   - **Contextual Inquiries:** Rapid prompt chips: "Explain drug mechanism of action", "Summarize black-box warnings", "Key clinical trial evidence", "Mechanism-based adverse drug reactions".
   - **Interactive Consultation Workspace:** Free-form chat interface communicating with `/api/ai/consult`.
   - **Clinical Pharmacological Calculators:**
     - *Renal Dose Calculator:* Cockcroft-Gault equation for Creatinine Clearance ($\text{CrCl} = \frac{(140 - \text{age}) \times \text{weight (kg)}}{72 \times \text{SCr}} \times [0.85 \text{ if female}]$) with dose adjustment recommendations.
     - *Pediatric Dosing Tool:* Weight-based dosing (mg/kg/day) and Body Surface Area (Mosteller formula) validation.
     - *Drug-Drug Interaction (DDI) Checker:* Rapid screening for CYP450 interactions (3A4, 2D6, 2C9, 2C19), QT prolongation risk, and contraindications.

---

### 3.3 Admin CMS, Course Editor, and Developer Console (R1)

#### Global Feature Matrix Engine
- **Database Storage:** Stored inside the `site_content` table (`id: 'main'`) in the `content.features` JSONB property:
  ```json
  {
    "features": {
      "ai_assistant": true,
      "practice_mode": true,
      "certificates": true,
      "community_qa": true,
      "gradebook": true
    }
  }
  ```
- **Realtime Synchronization:**
  - Admin toggles a switch in Developer Console / Site Content Manager $\rightarrow$ Updates `site_content` $\rightarrow$ Supabase Realtime broadcast triggers `SiteContentProvider` state update across all open browser sessions without reload.
- **Admin UI Controls:**
  - Add a dedicated **Feature Flags Management Card** in `DeveloperConsole.tsx` (under the `system` subtab) and in `SiteContentManager.tsx`.
  - Provide master toggles with status indicators, description tooltips, and instant save buttons.

#### Course-Level Feature Overrides
- **Database Storage:** Stored in `courses.feature_overrides` (`JSONB DEFAULT '{}'::jsonb`).
- **Resolution Strategy:**
  $$\text{EffectiveFeature}(feature, course) = \begin{cases} 
  \text{course.feature\_overrides}[feature] & \text{if explicitly defined (true/false)} \\
  \text{siteContent.features}[feature] & \text{if defined globally} \\
  \text{DEFAULT\_FEATURE\_FLAGS}[feature] & \text{fallback}
  \end{cases}$$
- **Admin UI Controls:**
  - Add a **Modular Features Override** section in `CourseForm` (`components/admin/AdminModals.tsx`) and `CurriculumManager.tsx`.
  - For each feature flag (`ai_assistant`, `practice_mode`, `certificates`, `community_qa`), provide a 3-way toggle:
    1. `Inherit Global Setting` (default)
    2. `Force Enable for this Course`
    3. `Force Disable for this Course`

---

### 3.4 Faculty/Admin Gradebook & Performance Analytics (R5)

#### Current State
- `AnalyticsDashboard.tsx` (Lines 1–800): Displays high-level platform telemetry (visitors, pageviews, video retention funnel, aggregate quiz pass rates, score distribution tiers, device/locale splits).
- `StudentManager.tsx` (Lines 1–800): Lists student profiles with verification actions and batch account provisioning.
- `CourseEnrollmentManager.tsx` (Lines 1–1073): Manages student enrollment requests, fast approvals, and cohort batch enrollment.

#### Gradebook Architecture Specification
To meet R5, a dedicated **Faculty Gradebook Matrix** component (`components/admin/GradebookMatrix.tsx` or integrated into `StudentManager.tsx` / `AnalyticsDashboard.tsx`) is required:

1. **Itemized Matrix Grid:**
   - **Rows:** Student roster (filterable by university, faculty, academic year, course, and enrollment status).
   - **Columns:**
     - *Student Profile:* Name, Email, University, Faculty, Academic Stage.
     - *Enrollment Status:* `active` | `pending` | `completed`.
     - *Lecture Progress:* % watched (e.g. 100%, 75%) and watched lecture count / total lectures.
     - *Itemized Quiz Scores:* Column for each quiz in the course displaying the student's highest score (e.g., Q1: 95%, Q2: 80%, Q3: 100%).
     - *Weighted Average Quiz Score:* Cumulative quiz score average.
     - *Mastery & Certificate Status:* Badge indicating eligibility (100% video completion + $\ge 80\%$ quiz average) or issued certificate ID with link to `/verify/[code]`.
2. **Filters & Cohort Management:**
   - Course selector dropdown.
   - University filter dropdown.
   - Faculty filter dropdown.
   - Performance tier filter (All, Passing $\ge 80\%$, At Risk $< 60\%$, Incomplete).
3. **Data Exporting:**
   - **Export to CSV:** Client-side & server-side generation of itemized gradebook spreadsheets formatted for faculty records.
4. **Visual Heatmaps & Difficulty Analytics:**
   - **Question Difficulty Heatmap:** Renders a visual matrix of all questions in a selected course/quiz showing:
     - Error rate percentage.
     - Difficulty classification (🔴 Hard / 🟡 Moderate / 🟢 Easy).
     - Most frequent distractor option selected by students.
   - **Lecture Drop-off Barometer:** Visual heat-gradient displaying where students stop watching within each video.

---

### 3.5 Verifiable Certificates & Gamification (R3)

#### Public Verification Page (`pages/verify/[code].tsx`)
- Resolves certificate codes (e.g. `PC-2026-B8F9A2`) publicly without requiring login.
- Displays:
  - Student Full Name.
  - Course Title (Bilingual `en`/`ar`).
  - Date of Issuance.
  - Mastery Metrics: Lecture Completion: 100%, Average Quiz Score: $\ge 80\%$.
  - Official Verification Status: `VALID / VERIFIED` with cryptographic credential hash.
  - QR Code generator pointing to `https://pharmacore.domain/verify/[code]`.
  - PDF Certificate Download button.

#### Student Profile (`pages/profile.tsx`) Updates
- Add a **Certificates & Achievements** section to the Learning Activity tab:
  - Cards displaying earned certificates with direct verification links and PDF download.
  - Daily Study Streak counter with flame indicator (`metrics.streakDays`).
  - Milestone Badges: "Master of Pharmacology", "100% Video Completionist", "7-Day Clinical Streak", "Perfect Quiz Score".

---

## 4. UI Triggers & Modal Blueprint

| Requirement | Target Component | UI Trigger / Location | Action / Modal Behavior |
|---|---|---|---|
| **R1 (Global Features)** | `DeveloperConsole.tsx`, `SiteContentManager.tsx` | Developer Console $\rightarrow$ System Tab / Site Content Matrix Card | Toggles features in `site_content.features` and triggers live Supabase broadcast. |
| **R1 (Course Overrides)** | `AdminModals.tsx` (`CourseForm`), `CurriculumManager.tsx` | Course Edit Modal $\rightarrow$ "Module Feature Overrides" section | 3-state radio / toggle buttons modifying `courses.feature_overrides`. |
| **R2 (Practice Mode)** | `pages/quiz/[id].tsx` | Sticky header toggle switch | Switches quiz between Standard Scored Mode and Untimed Practice Mode. |
| **R2 (Instant Rationales)** | `pages/quiz/[id].tsx` | Option radio click in Practice Mode | Reveals instant correctness indicator, bilingual explanation card, and textbook citation. |
| **R2 (Authoring Rationales)** | `AdminModals.tsx` (`QuestionForm`) | Question Authoring Dialog $\rightarrow$ "Clinical Rationales & References" | New textareas for `explanation_en`, `explanation_ar` and input for `textbook_ref`. |
| **R3 (Public Verification)** | `pages/verify/[code].tsx` | Direct URL / QR Code scan / Profile certificate link | Public authenticity verification with certificate badge and download. |
| **R3 (Profile Badges & Streaks)**| `pages/profile.tsx` | Profile Hero & Learning Activity Tab | Displays earned certificates, streak days, and unlocked milestone badges. |
| **R4 (AI Clinical Drawer)** | `pages/lecture/[id].tsx` | Video action bar button: "✨ AI Clinical Assistant" | Slides out Radix UI `Sheet` drawer loaded with current lecture/course context. |
| **R4 (Dose Calculators)** | In-Lecture Assistant Drawer | Calculator tab / Quick tool buttons | Interactive Cockcroft-Gault CrCl, Pediatric BSA, and DDI screening tools. |
| **R5 (Gradebook Matrix)** | `AdminDashboard` / `GradebookMatrix.tsx` | Admin Dashboard $\rightarrow$ Gradebook Tab | Displays itemized student matrix, quiz breakdown, filters, and CSV export. |
| **R5 (Difficulty Heatmaps)** | `AdminDashboard` / `AnalyticsDashboard.tsx` | Analytics Tab $\rightarrow$ Question Difficulty Heatmap subtab | Heatmap visualization of question error rates and distractor frequencies. |

---

## 5. Incremental Database Migration Blueprint (R6)

To support all frontend and backend enhancements cleanly, 4 modular migration scripts should be located in `supabase/migrations/`:

```
supabase/migrations/
├── 01_feature_flags_and_overrides.sql
├── 02_ai_consultations.sql
├── 03_certificates_streaks_badges.sql
└── 04_question_rationales_and_gradebook.sql
```

### Script Specifications
1. **`01_feature_flags_and_overrides.sql`:**
   - Adds `feature_overrides JSONB DEFAULT '{}'::jsonb` to `public.courses`.
   - Seeds default `features` JSON inside `public.site_content` (`id: 'main'`).
2. **`02_ai_consultations.sql`:**
   - Creates `public.ai_consultations` table (`id`, `user_id`, `lecture_id`, `course_id`, `messages JSONB`, `tool_usage JSONB`, `created_at`).
   - RLS policies allowing students to manage their own consultation histories.
3. **`03_certificates_streaks_badges.sql`:**
   - Creates `public.certificates` table (`id`, `code`, `user_id`, `course_id`, `lecture_completion_pct`, `quiz_average_pct`, `issued_at`, `credential_hash`, `status`).
   - Creates `public.user_badges` table (`id`, `user_id`, `badge_key`, `unlocked_at`).
   - Adds `streak_days INTEGER DEFAULT 1`, `last_active_date DATE` to `public.users`.
   - Public read RLS for `certificates` by `code`.
4. **`04_question_rationales_and_gradebook.sql`:**
   - Adds `explanation_en TEXT`, `explanation_ar TEXT`, `textbook_ref TEXT` to `public.questions`.
   - Creates `public.quiz_submissions` table (`id`, `user_id`, `quiz_id`, `course_id`, `score`, `total_questions`, `percentage`, `passed`, `answers JSONB`, `submitted_at`) for fast gradebook matrix querying.
   - Indexes on `(user_id, course_id)` and `(quiz_id, user_id)`.

---

## 6. TypeScript Type Model Updates

The following updates to `types/index.ts` are required to maintain type safety:

```typescript
// 1. Feature Flags
export interface FeatureFlags {
  ai_assistant: boolean
  practice_mode: boolean
  certificates: boolean
  community_qa: boolean
  gradebook: boolean
  [key: string]: boolean | undefined
}

export type FeatureOverrideValue = 'inherited' | 'enabled' | 'disabled'

export interface CourseFeatureOverrides {
  ai_assistant?: boolean
  practice_mode?: boolean
  certificates?: boolean
  community_qa?: boolean
  [key: string]: boolean | undefined
}

// 2. Question Rationales
export interface Question {
  id: string
  quiz_id: string
  text_en: string
  text_ar: string
  type: 'multiple_choice' | 'true_false' | 'short_text'
  options?: string[]
  correct_answer: string
  order: number
  explanation_en?: string
  explanation_ar?: string
  textbook_ref?: string
}

// 3. Certificates & Streaks
export interface Certificate {
  id: string
  code: string
  userId: string
  courseId: string
  studentName: string
  courseTitleEn: string
  courseTitleAr: string
  lectureCompletionPct: number
  quizAveragePct: number
  issuedAt: string
  credentialHash: string
  status: 'valid' | 'revoked'
}

// 4. Gradebook Matrix
export interface StudentGradebookEntry {
  userId: string
  fullName: string
  email: string
  university?: string
  faculty?: string
  enrollmentStatus: CourseEnrollmentStatus
  lectureCompletionPct: number
  completedLecturesCount: number
  totalLecturesCount: number
  quizScores: Record<string, { quizTitle: string; score: number; percentage: number; passed: boolean }>
  averageQuizScore: number
  certificateStatus: 'eligible' | 'issued' | 'in_progress'
  certificateCode?: string
}
```

---

## 7. Implementation Readiness & Risk Assessment

1. **Backward Compatibility:** All existing courses, lectures, quizzes, and site content remain 100% functional without breaking changes.
2. **Graceful Fallbacks:** If feature flags are undefined in older course records, the system falls back seamlessly to global defaults.
3. **RTL & Localization:** All newly introduced dialogs, drawer panels, gradebook tables, and rationale cards are built with bilingual text strings (`tr(en, ar)`) and `dir={isAr ? "rtl" : "ltr"}` attributes.
4. **Performance:** Gradebook queries and quiz submissions are backed by dedicated SQL indexes to prevent slow response times on large cohorts.

---
*Report prepared by `survey_explorer_2` for PharmaCore Project Orchestrator.*
