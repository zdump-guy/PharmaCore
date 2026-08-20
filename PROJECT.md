# Project: PharmaCore Enhancement & Modular Activation Engine

## Architecture
PharmaCore is a medical/clinical pharmacology learning platform built with Next.js 15 (Pages Router), React 19, Tailwind CSS, Radix UI, and Supabase PostgreSQL.
- **Frontend Layer**: Next.js Pages router (`pages/`), Radix UI modal/sheet primitives, Tailwind CSS styling, `next-i18next` localization.
- **Data & Auth Layer**: Supabase PostgreSQL with Row Level Security (RLS) policies, Supabase Auth, and Supabase Realtime synchronization.
- **Feature Activation Engine**: Real-time two-tier feature flag hierarchy (`site_content.features` global defaults + `courses.feature_overrides` course-level overrides).
- **Clinical Calculation & AI Engine**: In-lecture drawer & consultation workspace with deterministic renal/pediatric calculators, drug-drug interaction checkers, and `/api/ai/consult` API.
- **Assessment & Certification Engine**: Untimed practice mode with instant clinical rationales, verifiable PDF certificates with QR codes, and public verification at `/verify/[code]`.
- **Analytics & Gradebook**: Student-by-student lecture completion, itemized quiz matrix, cohort filters, CSV export, and question difficulty heatmaps.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | R6.1 Feature Flags Migration | SQL script for `courses.feature_overrides` & `site_content.features` | M1 | ORIGINAL_REQUEST §R6 |
| 2 | R6.2 AI Consultations Migration | SQL script for `ai_consultations` table, indexes, RLS | M1 | ORIGINAL_REQUEST §R6 |
| 3 | R6.3 Certificates & Gamification Migration | SQL script for `certificates`, `user_streaks`, `user_badges` tables | M1 | ORIGINAL_REQUEST §R6 |
| 4 | R6.4 Rationales & Gradebook Migration | SQL script for question rationales, `quiz_submissions`, `lecture_progress` | M1 | ORIGINAL_REQUEST §R6 |
| 5 | Types & Schema Integration | TypeScript definitions for feature flags, rationales, certificates, streaks, AI consultations, gradebook | M1 | ORIGINAL_REQUEST §R1-R6 |
| 6 | R1.1 Global Feature Flags CMS | Admin CMS & Developer Console UI for managing global feature flags in `site_content.features` | M2 | ORIGINAL_REQUEST §R1 |
| 7 | R1.2 Course-Level Overrides | Course Editor UI for configuring course-level feature overrides in `courses.feature_overrides` | M2 | ORIGINAL_REQUEST §R1 |
| 8 | R1.3 Real-time Flag Resolution | Two-tier feature flag resolver (`course_override ?? global_flag ?? default`) across UI and API | M2 | ORIGINAL_REQUEST §R1 |
| 9 | R2.1 Untimed Practice Mode | Interactive toggle in `pages/quiz/[id].tsx` for practice mode vs standard mode | M3 | ORIGINAL_REQUEST §R2 |
| 10 | R2.2 Instant Clinical Rationales | Immediate feedback on option select with bilingual explanations & textbook references | M3 | ORIGINAL_REQUEST §R2 |
| 11 | R2.3 Question Authoring Rationales | Admin modal input fields for `explanation_en`, `explanation_ar`, and `clinical_reference` | M3 | ORIGINAL_REQUEST §R2 |
| 12 | R3.1 Mastery Criteria & Certificate Issuance | Automatic certificate issuance on 100% lecture watch completion + >= 80% quiz average | M4 | ORIGINAL_REQUEST §R3 |
| 13 | R3.2 Public Certificate Verification | Public SSR page `/verify/[code]` with student name, course title, issue date, validation badge | M4 | ORIGINAL_REQUEST §R3 |
| 14 | R3.3 PDF & QR Generation | PDF certificate generation with embedded verification QR code using `jspdf` & `qrcode` | M4 | ORIGINAL_REQUEST §R3 |
| 15 | R3.4 Study Streaks & Badges | Daily learning streak tracking and milestone achievement badges on student profile | M4 | ORIGINAL_REQUEST §R3 |
| 16 | R4.1 In-Lecture AI Drawer | Context-aware side drawer in `pages/lecture/[id].tsx` retrieving current lecture topic & objectives | M5 | ORIGINAL_REQUEST §R4 |
| 17 | R4.2 Clinical Calculators & DDI Checker | Cockcroft-Gault CrCl renal calculator, pediatric dose calculator, and drug-drug interaction checker | M5 | ORIGINAL_REQUEST §R4 |
| 18 | R4.3 Consultation Workspace & API | Full clinical consultation workspace component and `/api/ai/consult` hybrid API endpoint | M5 | ORIGINAL_REQUEST §R4 |
| 19 | R5.1 Faculty Gradebook Matrix | Admin roster matrix displaying student-by-student lecture completion %, quiz scores, certificate status | M6 | ORIGINAL_REQUEST §R5 |
| 20 | R5.2 Gradebook Filters & CSV Export | University/cohort filtering and client-side CSV export of gradebook roster | M6 | ORIGINAL_REQUEST §R5 |
| 21 | R5.3 Drop-off & Difficulty Analytics | Visual drop-off funnel and question difficulty heatmap analytics | M6 | ORIGINAL_REQUEST §R5 |
| 22 | Final E2E Test Pass & Coverage Hardening | 100% pass across E2E test suite (Tiers 1-4) and Tier 5 adversarial verification | M7 | ORIGINAL_REQUEST §Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Database Migrations & Schema Foundations | R6 (4 SQL migrations in `supabase/migrations/`), `types/index.ts`, `lib/siteContent.ts` | none | DONE |
| M2 | Feature Matrix & Modular Activation Engine | R1 (Global & course-level feature flags, CMS controls, resolver) | M1 | DONE |
| M3 | Practice Exam Simulator & Clinical Rationales | R2 (Untimed practice mode, instant feedback, bilingual rationales, question authoring) | M1, M2 | DONE |
| M4 | Automated Verifiable Certificates & Gamification | R3 (Certificate generation, `/verify/[code]`, PDF/QR generation, streaks, badges) | M1, M2 | DONE |
| M5 | Hybrid AI Clinical Assistant | R4 (In-lecture drawer, clinical calculators, DDI checker, `/api/ai/consult`) | M1, M2 | DONE |
| M6 | Faculty Gradebook & Performance Analytics | R5 (Gradebook roster matrix, CSV export, cohort filters, drop-off / question difficulty heatmaps) | M1, M2, M3 | DONE |
| M7 | Final E2E Verification & Adversarial Hardening | Pass 100% E2E test suite (Tiers 1-4) + Tier 5 adversarial testing | M1-M6, E2E Test Suite | DONE |

## Interface Contracts

### Feature Flag Engine Contract
- **Type**:
  ```typescript
  export interface FeatureFlagsConfig {
    ai_assistant: boolean;
    practice_mode: boolean;
    certificates: boolean;
    community_qa: boolean;
    gradebook: boolean;
  }
  ```
- **Helper**:
  ```typescript
  export function resolveCourseFeatures(
    globalFlags: FeatureFlagsConfig | undefined,
    courseOverrides: Partial<FeatureFlagsConfig> | null | undefined
  ): FeatureFlagsConfig;
  ```

### Question Rationales Contract
- **Type additions to `Question`**:
  ```typescript
  export interface Question {
    // existing fields...
    explanation_en?: string;
    explanation_ar?: string;
    clinical_reference?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }
  ```

### Certificate & Verification Contract
- **Type**:
  ```typescript
  export interface CertificateRecord {
    id: string;
    certificate_code: string;
    user_id: string;
    course_id: string;
    student_name: string;
    course_title_en: string;
    course_title_ar?: string;
    issue_date: string;
    final_score: number;
    watch_completion_rate: number;
    status: 'valid' | 'revoked';
  }
  ```
- **Verification Endpoint**: `GET /verify/[code]` or `/api/certificates/verify?code=[code]`

### AI Clinical Assistant Contract
- **API Request**:
  ```typescript
  export interface AIConsultRequest {
    tool_type: 'general_consult' | 'dose_calculator' | 'interaction_checker' | 'lecture_qa';
    prompt: string;
    context?: {
      lecture_id?: string;
      lecture_title?: string;
      objectives?: string[];
      patient_data?: {
        age?: number;
        weight_kg?: number;
        serum_creatinine_mg_dl?: number;
        gender?: 'male' | 'female';
        drug_a?: string;
        drug_b?: string;
      };
    };
  }
  ```

## Code Layout
- `supabase/migrations/`:
  - `001_feature_flags.sql`
  - `002_ai_consultations.sql`
  - `003_certificates_and_streaks.sql`
  - `004_question_rationales_and_gradebook.sql`
- `types/`: `types/index.ts`
- `lib/`:
  - `lib/siteContent.ts`, `lib/featureFlags.ts`, `lib/clinicalCalculators.ts`, `lib/certificatePdf.ts`, `lib/gradebookExport.ts`
- `pages/`:
  - `pages/quiz/[id].tsx`, `pages/lecture/[id].tsx`, `pages/profile.tsx`, `pages/verify/[code].tsx`
  - `pages/api/ai/consult.ts`, `pages/api/certificates/*.ts`, `pages/api/gradebook/*.ts`
- `components/`:
  - `components/SiteContentProvider.tsx`
  - `components/admin/DeveloperConsole.tsx`, `components/admin/SiteContentManager.tsx`, `components/admin/AdminModals.tsx`
  - `components/admin/FacultyGradebook.tsx`, `components/admin/AnalyticsDashboard.tsx`
  - `components/clinical/ClinicalAssistantDrawer.tsx`, `components/clinical/ClinicalWorkspace.tsx`
  - `components/quiz/PracticeModeControls.tsx`, `components/quiz/ClinicalRationaleCard.tsx`
  - `components/certificates/CertificateViewer.tsx`, `components/certificates/StreakBadgeCard.tsx`
