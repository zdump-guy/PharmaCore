# PharmaCore Technical Survey & Infrastructure Analysis

**Author**: survey_explorer_3  
**Date**: 2026-08-20  
**Focus Area**: Build, Dependencies, Test Infrastructure, PDF/QR Generation, AI Assistant Capabilities, Certificate Verification Route (`/verify/[code]`), and Build Health.

---

## Executive Summary

PharmaCore is a bilingual (English/Arabic) clinical pharmacology educational platform built on **Next.js 15.2.0** (Pages Router) and **React 19.0.0**, with **Tailwind CSS v3.4.19**, **Radix UI** component primitives, **Supabase** backend (Auth, PostgreSQL, Row-Level Security), and **next-i18next** internationalization.

The project currently compiles successfully (`npm run build` exits with code 0) and passes linting (`npm run lint` exits with code 0). There is no automated test runner configured in `package.json`, and no external PDF, QR code, or AI SDKs are currently installed. This analysis provides concrete architectural and implementation blueprints for the 4-phase enhancement plan (Feature Flagging Engine, Practice Mode with Instant Rationales, Verifiable Certificates with QR & Streaks, Hybrid AI Clinical Assistant, and Faculty Gradebook).

---

## 1. Build, Dependencies & TypeScript/ESLint Setup

### 1.1 Package Manifest & Dependency Inventory
- **Core Framework**:
  - `next`: `^15.2.0` (active version `15.5.23`)
  - `react`: `^19.0.0`
  - `react-dom`: `^19.0.0`
  - `typescript`: `^5` (with `"moduleResolution": "bundler"`, `"strict": true`)
- **UI & Styling**:
  - `tailwindcss`: `^3.4.19`, `tailwindcss-animate`: `^1.0.7`, `postcss`: `^8.5.26`
  - `clsx`: `^2.1.1`, `tailwind-merge`: `^3.6.0`, `class-variance-authority`: `^0.7.1`
  - `@radix-ui/react-*` primitives: Accordion, Avatar, Dialog, Dropdown Menu, Label, Progress, Scroll Area, Select, Separator, Slot, Tabs, Tooltip.
  - `react-icons`: `^5.7.0` (using `Fi*` and `Fa*` icons)
- **Backend & State**:
  - `@supabase/supabase-js`: `^2.112.3`
  - `uploadthing`: `^7.7.4`, `@uploadthing/react`: `^7.3.3`
  - `zod`: `^4.4.3`
  - `next-i18next`: `^16.0.10`, `i18next`: `^26.3.6`, `react-i18next`: `^17.0.11`
- **Analytics**:
  - `@vercel/analytics`: `^2.0.1`, `@vercel/speed-insights`: `^2.0.0`
  - Custom in-house analytics in `lib/analytics.ts` backed by `public.analytics_events` table

### 1.2 TypeScript Configuration (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 1.3 Routing Architecture
The platform strictly uses the **Next.js Pages Router** (`pages/` directory):
- `pages/_app.tsx`: Top-level wrapper with `SiteContentProvider`, `ThemeProvider`, i18n support, and fonts.
- `pages/_document.tsx`: HTML shell with dynamic `lang` and `dir` (LTR/RTL) attributes based on locale.
- `pages/index.tsx`: Public landing page with hero, curriculum overview, and features.
- `pages/course/[id].tsx`: Course details, lecture syllabus, enrollment action, and prerequisites.
- `pages/lecture/[id].tsx`: Lecture video player, study resources, quiz launcher, and community Q&A.
- `pages/quiz/[id].tsx`: Clinical knowledge checkpoint quiz runner.
- `pages/profile.tsx`: Student dashboard, enrolled courses progress, and profile details.
- `pages/admin/index.tsx`: Admin dashboard with sidebar tabs for curriculum, students, analytics, CMS, and developer console.
- `pages/admin/login.tsx` & `pages/login.tsx`: Authentication flows.
- `pages/api/*`: Backend API routes utilizing `supabaseAdmin` (`lib/supabaseAdmin.ts`).

---

## 2. Test Infrastructure Assessment

### 2.1 Current State
- `package.json` contains no `"test"` script.
- There are no automated unit or end-to-end test files (`*.test.ts`, `*.spec.ts`) in the application directories.
- Existing testing assets are ad-hoc Node.js scripts located in the root directory:
  - `test_api.js`: Admin user creation test against `/api/admin/users/create`.
  - `test_login.js`, `test_login2.js`: Supabase Auth password sign-in checks.
  - `test_token.js`: Token extraction and `supabaseAdmin.auth.getUser` verification.
  - `check_auth_users.js`, `check_trigger.js`, `fix_auth.js`, `reset_pwd.js`: Database / user trigger inspection scripts.

### 2.2 Recommendation
1. For Unit & Integration Testing: **Vitest** or Node built-in test runner can be used for zero-overhead validation of pure calculation engines (Renal CrCl calculator, Pediatric dose calculator, DDI matrix, certificate verification logic).
2. For End-to-End & Route Verification: Automated API route invocation scripts or Playwright can verify `/verify/[code]`, `/api/ai/consult`, `/api/courses/[id]/enroll`, and feature flag endpoints.

---

## 3. PDF & QR Code Generation Analysis

### 3.1 PDF Generation Library Evaluation
Because the project uses **React 19.0.0** and **Next.js 15**, certain legacy React PDF libraries (such as `@react-pdf/renderer`) encounter peer dependency conflicts.

| Library | React 19 Compatibility | Performance / Size | Vector Drawing Support | Verdict |
|---|---|---|---|---|
| `jspdf` (`^2.5.1` / `^4.0.0`) | **100% Compatible** (Pure JS) | Lightweight (~250kB) | Native vector (`rect`, `text`, `addImage`, `circle`, `lines`) | **Recommended** |
| `pdf-lib` | **100% Compatible** (Pure JS) | Lightweight (~300kB) | Low-level PDF primitives | Good alternative |
| `@react-pdf/renderer` | ⚠️ Peer dependency issues with React 19 | Heavy (~1.5MB) | React JSX components | Not recommended |
| `html2canvas` + `jspdf` | Compatible | Medium (~400kB) | Rasterizes DOM to Canvas | Useful for complex CSS snapshots |

**Implementation Strategy**:
- Use `jspdf` for generating high-definition landscape certificates (`format: 'a4'`, `orientation: 'landscape'`).
- Certificate canvas elements:
  - Outer classic diploma border with navy/emerald accent tones and guilloché corner ornaments.
  - PharmaCore official crest and title header ("CERTIFICATE OF CLINICAL MASTERY").
  - Recipient Name formatted with elegant typography.
  - Course Title, Completion Date, and Verification Serial ID (e.g., `PC-8F29-41B0-2026`).
  - Dean / Clinical Director signature block with authentic seal badge.
  - Embedded high-contrast QR code pointing directly to `${origin}/verify/${code}`.

### 3.2 QR Code Generation Library Evaluation
- **Package**: `qrcode` (with `@types/qrcode`) or `qrcode.react`.
- **Capabilities**:
  - `QRCode.toDataURL(url, options)` returns base64 PNG data URL in ~1ms without DOM dependency.
  - `QRCode.toString(url, { type: 'svg' })` returns inline SVG markup.
  - High error correction level (`errorCorrectionLevel: 'H'`) ensures reliable mobile phone scanning even if small or printed.
- **Verification Target URL**: `https://<domain>/verify/<certificate_code>`.

---

## 4. Hybrid AI Clinical Assistant Architecture

### 4.1 Requirements Breakdown (R4)
1. **In-lecture context-aware side drawer**: Opens alongside the active lecture video, injecting current lecture title, details, and parent course learning objectives.
2. **Expandable Full Clinical Consultation Workspace**: Modal or fullscreen consultation deck supporting clinical pharmacology queries, calculations, and drug interactions.
3. **Hybrid Engine**: Seamlessly combines offline rule-based clinical calculators with optional generative AI (Gemini / OpenAI / Anthropic).

### 4.2 Built-In Clinical Calculation Engines (100% Offline & Deterministic)
1. **Renal Dose Adjustment Calculator**:
   - **Cockcroft-Gault Equation**:
     $$\text{CrCl (mL/min)} = \frac{(140 - \text{age}) \times \text{weight (kg)}}{72 \times \text{Serum Creatinine (mg/dL)}} \times (0.85 \text{ if female})$$
   - Pre-programmed dosage adjustment guidelines for narrow therapeutic index drugs:
     - *Vancomycin*: Trough target 15-20 mcg/mL, interval extension based on CrCl (<50: Q24h, <30: Q48h).
     - *Gentamicin / Tobramycin*: Extended interval vs traditional dosing.
     - *Enoxaparin*: Standard 1 mg/kg Q12h; reduce to 1 mg/kg Q24h if $\text{CrCl} < 30 \text{ mL/min}$.
     - *DOACs (Apixaban, Rivaroxaban)*: Dose reduction triggers (Age $\ge 80$, Wt $\le 60\text{kg}$, $\text{SCr} \ge 1.5$).
     - *Metformin*: Contraindicated if $\text{eGFR} < 30\text{ mL/min/1.73m}^2$, caution $30-45$.
2. **Pediatric Dose Calculator**:
   - **Clark's Rule**: $\text{Pediatric Dose} = \frac{\text{Weight (lbs)}}{150} \times \text{Adult Dose}$
   - **Body Surface Area (Mosteller Equation)**: $\text{BSA (m}^2\text{)} = \sqrt{\frac{\text{Height (cm)} \times \text{Weight (kg)}}{3600}}$
   - **Mg/Kg Dosing Protocols**:
     - *Paracetamol (Acetaminophen)*: 10-15 mg/kg/dose Q4-6h (max 75 mg/kg/day, adult cap 4000 mg/day).
     - *Ibuprofen*: 5-10 mg/kg/dose Q6-8h (max 40 mg/kg/day, adult cap 2400 mg/day).
     - *Amoxicillin*: High-dose AOM protocol 80-90 mg/kg/day divided BID.
     - *Azithromycin*: 10 mg/kg day 1, followed by 5 mg/kg days 2-5.
3. **Drug-Drug Interaction (DDI) Matrix**:
   - Curated clinical interaction database cross-referencing:
     - CYP3A4 inhibitors (Clarithromycin, Ketoconazole, Grapefruit juice) + Statins (Simvastatin / Atorvastatin rhabdomyolysis risk).
     - CYP2C19 inhibitors (Omeprazole) + Clopidogrel (decreased active metabolite formation).
     - QT Prolongation Additive Risk (Macrolides + Fluoroquinolones + Ondansetron + Amiodarone).
     - Serotonin Syndrome Risk (SSRIs + Tramadol + Linezolid + MAOIs).
     - Hyperkalemia Risk (ACE inhibitors + ARBs + Spironolactone + Potassium supplements).
     - Bleeding Risk (Warfarin / DOACs + NSAIDs / Aspirin).

### 4.3 Generative LLM & API Route (`/api/ai/consult`)
- **Endpoint**: `POST /api/ai/consult`
- **Request Body**:
  ```ts
  {
    prompt: string,
    lectureContext?: {
      lectureId: string,
      title: string,
      details: string,
      courseTitle: string,
      objectives: string
    },
    calculatorType?: 'renal' | 'pediatric' | 'ddi' | 'general',
    calculatorParams?: Record<string, unknown>
  }
  ```
- **Execution Flow**:
  1. Check if `ai_assistant` feature flag is enabled globally and for the specific course.
  2. If a calculation or DDI query is requested, run deterministic calculation engine first.
  3. If an LLM API key (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) is configured in the environment, synthesize a clinical pharmacology response with structured rationales, contraindications, and guideline citations.
  4. If no LLM key is configured, return the structured clinical calculator results and pharmacological database response directly with full clinical explanations.

---

## 5. Route `/verify/[code]` & Certificate Architecture

### 5.1 Route Specification (`pages/verify/[code].tsx`)
- Dynamic SSR route matching any certificate verification code (e.g. `/verify/PC-91E2-4A7C-2026`).
- **Public Accessibility**: No authentication required. Anyone scanning the QR code or visiting the URL can verify the credential.
- **Verification Page Features**:
  1. **Status Badge**: Genuine & Verified (Green), Revoked (Red), or Expired/Not Found.
  2. **Student Credential Info**: Authenticated Student Full Name, University, Faculty, and Graduation Year.
  3. **Course & Mastery Metrics**:
     - Course Title (Bilingual Arabic & English).
     - Completion Date & Time.
     - 100% Video Lecture Completion Verification.
     - Final Assessment Average Score (e.g. 92% — Distinction).
  4. **Cryptographic Validation Hash / Code**: Unique identifier.
  5. **Interactive Actions**:
     - "Download Official PDF Certificate"
     - "Copy Verification Link"
     - "View Course Syllabus"

### 5.2 Certificate Issuance Trigger Logic
A certificate is automatically generated when a student satisfies the mastery criteria:
- $\text{Lecture Watch Progress} = 100\%$ (All lectures in course marked completed in `lecture_progress` or analytics).
- $\text{Average Quiz Score} \ge 80\%$ across all course quizzes.
- Upon reaching criteria, `POST /api/certificates/issue` creates a unique record in `public.certificates` with code format `PC-<4_HEX>-<4_HEX>-<YEAR>` and unlocks certificate download in the student profile and course page.

---

## 6. Feature Flagging Engine Architecture

### 6.1 Database Schema
1. **Global Flags** in `public.site_content`:
   ```json
   {
     "features": {
       "practice_mode": true,
       "ai_assistant": true,
       "certificates": true,
       "gamification_streaks": true,
       "community_qa": true,
       "faculty_gradebook": true
     }
   }
   ```
2. **Course-Level Overrides** in `public.courses`:
   `courses.feature_overrides` JSONB column (e.g. `{"practice_mode": false, "ai_assistant": true}`).

### 6.2 Evaluation Hierarchy
```
Effective Feature Flag =
  Course Override (if boolean) !== undefined
    ? Course Override
    : Global Feature Flag !== undefined
      ? Global Feature Flag
      : Default Fallback (true)
```

### 6.3 Enforcement Points
- **Client Side**: Custom hook `useFeatureFlag('practice_mode', courseId)` conditionally renders UI elements (Practice Mode toggle in quiz runner, AI Drawer button in lecture viewer, Certificates tab in profile).
- **Server Side / API**: API handlers (`/api/ai/consult`, `/api/certificates/issue`, etc.) check effective flag and return `403 Forbidden` (`Feature Disabled`) if the module is disabled.

---

## 7. Faculty Gradebook & Performance Analytics

### 7.1 Features
- Matrix of all enrolled students with itemized progress:
  - Student Name, Email, University, Faculty, Cohort.
  - Video Lecture Completion Rate ($0-100\%$).
  - Individual Quiz Scores & Average Percentage.
  - Certificate Issuance Status & Code.
  - Filter by University, Faculty, Enrollment Status, and Search.
  - **CSV Export**: Clean downloadable spreadsheet for faculty record-keeping.
  - **Visual Question Difficulty Heatmap & Drop-off Analytics**: Identifies high-friction questions (lowest pass rates) and drop-off points.

---

## 8. Database Migrations Plan (`supabase/migrations/`)

Four modular SQL migrations to implement:
1. `01_feature_flags.sql`:
   - Adds `feature_overrides` JSONB to `public.courses`.
   - Adds feature flags structure to `public.site_content`.
2. `02_practice_mode_and_rationales.sql`:
   - Adds `explanation_en`, `explanation_ar`, `references_en`, `references_ar` to `public.questions`.
   - Creates `public.quiz_attempts` / `public.question_answers` for instant feedback logging and gradebook analytics.
3. `03_certificates_and_streaks.sql`:
   - Creates `public.certificates` table (`id`, `certificate_code`, `user_id`, `course_id`, `issued_at`, `final_score`, `total_lectures_watched`, `status`, `metadata`).
   - Creates `public.lecture_progress` table (`user_id`, `lecture_id`, `course_id`, `completed`, `watched_seconds`, `updated_at`).
   - Creates `public.user_streaks` and `public.user_badges` tables for gamification.
4. `04_ai_consultations_and_gradebook.sql`:
   - Creates `public.ai_consultations` table for auditing and tracking clinical consultations.
   - RLS security policies for faculty/super_admin/dev gradebook view.

---

## 9. Build Hurdles & Risk Analysis

| Risk Area | Potential Issue | Mitigation Strategy |
|---|---|---|
| **React 19 Compatibility** | `@react-pdf/renderer` or certain UI packages crash with React 19 | Use `jspdf` + `qrcode` (pure JavaScript, zero React 19 peer conflicts) |
| **Next.js Pages Router** | Adding App Router (`app/`) files could cause route conflicts or duplicate layouts | Keep all new routes in `pages/` (`pages/verify/[code].tsx`, `pages/api/ai/consult.ts`, etc.) |
| **Bilingual Localization** | Arabic RTL text alignment and translation key missing errors | Ensure every new UI string has both English and Arabic translations in `public/locales/` and inline fallbacks |
| **Unauthenticated API Access** | Certificates and verification need public access, but gradebook needs admin access | Use `supabase` (anon client) for public `/verify/[code]` and `supabaseAdmin` (service role) with bearer token role checks for `/api/admin/*` |
| **Existing Lint Warnings** | Minor warnings in `pages/profile.tsx` (missing `tr` in `useEffect`) and `components/admin/AnalyticsDashboard.tsx` (unused vars) | Clean up dependency arrays and unused variables during implementation to guarantee 0 errors and 0 warnings |

---

## 10. Conclusion & Next Steps
The PharmaCore codebase is in a healthy, well-structured state. All required enhancements can be built cleanly using standard Pages router conventions, lightweight React 19-compatible libraries (`jspdf`, `qrcode`), deterministic clinical pharmacology engines + optional generative AI, and modular Supabase SQL migrations.
