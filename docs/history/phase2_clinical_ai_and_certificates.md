# Phase 2: Clinical AI Assistant, Practice Mode, Certificates & Faculty Gradebook

## 1. Phase Overview & Strategic Objectives

- **Timeframe**: August 18, 2026 – August 21, 2026
- **Commit Range**: Commits 23 – 35 (`f776543` → `49f9920`)
- **Primary Authors**: zdump-guy (`mohamedmostafa.dev.main@gmail.com`), Mohamed, Vercel Bot
- **Net Diff Volume**: 322 files modified/created, +42,650 lines added, -4,774 lines refactored

Phase 2 transformed PharmaCore from a foundational course delivery platform into an advanced, intelligent clinical education and credentialing ecosystem. It introduced clinical pharmacology decision support tools, formative practice assessments with rich rationale feedback, verifiable digital certifications with cryptographic hash codes, an institutional Faculty Gradebook, and the Tier 1–4 automated test suite.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             PHASE 2 SYSTEM ARCHITECTURE                                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   ┌────────────────────────────────┐            ┌──────────────────────────────────┐   │
│   │   Clinical Decision Support    │            │     Practice Mode & Assessment   │   │
│   │   • Cockcroft-Gault CrCl       │            │     • Instant Rationale Reveal   │   │
│   │   • Pediatric Dosing Engine    │            │     • Distractor Risk Analysis   │   │
│   │   • Drug-Drug Interaction DDI  │            │     • High-Yield Clinical Pearls │   │
│   │   • /api/ai/consult Hybrid AI  │            │     • Textbook Citations         │   │
│   └────────────────────────────────┘            └──────────────────────────────────┘   │
│                   │                                               │                    │
│                   ▼                                               ▼                    │
│   ┌────────────────────────────────┐            ┌──────────────────────────────────┐   │
│   │ Automated Verifiable Certs     │            │    Faculty Academic Gradebook    │   │
│   │   • 100% Watch + >=80% Quiz    │            │    • Cohort Attempt Analytics    │   │
│   │   • Pure-TS SimpleQRCode       │            │    • LMS CSV/JSON Data Exporters │   │
│   │   • PDF 1.4 Binary Generator   │            │    • Remediation Status Tracking │   │
│   │   • Public /verify/[code]      │            │    • Developer Console Flags     │   │
│   └────────────────────────────────┘            └──────────────────────────────────┘   │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Chronological Commit Breakdown (Commits 23 to 35)

### Commits 23 & 24: `f776543` & `cb002fd` — Resource Uploads & Uploadthing Integration
- **Full Hashes**: `f77654375f8be3a90d3cf2cd1cf58b5295c4e1dc` & `cb002fd2e23fe4d697af37a95f17d24ccd285d7e`
- **Authors**: zdump-guy & Mohamed <mohamedmostafa.dev.main@gmail.com>
- **Date**: 2026-08-18 01:26:40 & 01:28:08 +0300
- **Diff Stats**: 30 files changed, +8,129 insertions, -329 deletions
- **Technical Scope**:
  - Integrated **Uploadthing** API (`pages/api/uploadthing.ts`, `lib/uploadthing.ts`) for secure file and lecture resource uploads (PDF slide decks, clinical monographs, dosing tables).
  - Implemented client-side event tracking telemetry for file uploads and course downloads.
  - Merged PR #7 into `main`.

### Commits 25 & 26: `a38f875` & `7538317` — Quiz Gating & Course Enrollment Access Control
- **Full Hashes**: `a38f8755747423bb21308aeb769296585a18f4c2` & `7538317f396302cafccc085ca1bc563ded865cb2`
- **Authors**: zdump-guy & Mohamed <mohamedmostafa.dev.main@gmail.com>
- **Date**: 2026-08-18 03:18:07 & 03:20:38 +0300
- **Diff Stats**: 35 files changed, +8,865 insertions, -637 deletions
- **Technical Scope**:
  - Engineered quiz access control mechanisms preventing unauthenticated visitors from taking credentialed assessments.
  - Created `course_enrollments` tracking table to manage student course memberships, prerequisite enforcement, and enrollment timestamps.
  - Merged PR #9 into `main`.

### Commits 27 & 28: `4132f58` & `06d78e0` — Vercel Speed Insights Integration
- **Full Hashes**: `4132f58bc13f4935fcc738a250c3e37d06363f24` & `06d78e0fc6d33863d8292a6213969a9155c94aaf`
- **Authors**: Vercel Bot & Mohamed <mohamedmostafa.dev.main@gmail.com>
- **Date**: 2026-08-18 00:25:27 & 03:26:13 +0300
- **Diff Stats**: 3 files changed, +43 insertions
- **Technical Scope**:
  - Integrated `@vercel/speed-insights` package in `pages/_app.tsx` for real-user monitoring (RUM) of interaction responsiveness (INP), layout shift (CLS), and server latency (TTFB).
  - Merged PR #10 into `main`.

### Commit 29: `90d97a0` — Database Query Modernization (`maybeSingle`)
- **Full Hash**: `90d97a08f7b630daa357872edca281b21e907a55`
- **Author**: zdump-guy <mohamedmostafa.dev.main@gmail.com>
- **Date**: 2026-08-18 10:27:34 +0300
- **Diff Stats**: 12 files changed, +43 insertions, -30 deletions
- **Technical Scope**:
  - Refactored Supabase queries from `.single()` to `.maybeSingle()` across student profiles, quiz submissions, and progress trackers.
  - Eliminated runtime exceptions when querying records that may legitimately be absent (e.g. newly registered students without prior submissions).

### Commits 30, 31, 32 & 33: `ffa4165`, `0411eac`, `34c00b4` & `ee77f09` — Bot Defense Exploration & Turnstile Lifecycle
- **Full Hashes**: `ffa4165e7a669f1f74b2e29de5d5c00e65532fa9`, `0411eac1dc410f80dc3b658798a8c7f85b01fa5d`, `34c00b49d29320b8dacfd3ab11ae556bf1978429` & `ee77f09ba4ff294e6820b44977b42948e7e24331`
- **Author**: zdump-guy <mohamedmostafa.dev.main@gmail.com>
- **Dates**: 2026-08-19 23:43:54 through 2026-08-20 00:16:34 +0300
- **Diff Stats**: 44 files total, +3,811 insertions, -668 deletions
- **Technical Scope**:
  - Explored Cloudflare Turnstile integration for bot defense on login and enrollment forms.
  - After user testing revealed friction for medical students on mobile devices with ad-blockers, streamlined auth workflows and replaced CAPTCHA barriers with server-side rate limiting and Supabase Auth built-in defenses.

### Commit 34: `412583e` — Dependency Upgrades & next-i18next Refactoring
- **Full Hash**: `412583e5e19227f00731572d8eefb353f6629e54`
- **Author**: zdump-guy <mohamedmostafa.dev.main@gmail.com>
- **Date**: 2026-08-20 00:33:13 +0300
- **Diff Stats**: 15 files changed, +1,013 insertions, -737 deletions
- **Technical Scope**:
  - Upgraded Next.js to version 15.2.0 and React to version 19.0.0.
  - Refactored `next-i18next` imports and serverSideTranslations configurations across all dynamic routes.

### Commit 35: `49f9920` — Phase 2 Major Consolidation & E2E Test Suite
- **Full Hash**: `49f9920158d70f81d4e20942a90eca7833b47378`
- **Author**: zdump-guy <mohamedmostafa.dev.main@gmail.com>
- **Date**: 2026-08-21 00:03:47 +0300
- **Diff Stats**: 186 files changed, +20,694 insertions, -2,459 deletions
- **Technical Scope**:
  - **Clinical Decision Support**: Implemented `lib/clinicalCalculators.ts` containing Cockcroft-Gault Creatinine Clearance, KDIGO CKD staging, narrow-therapeutic index drug adjustments (Vancomycin, Gentamicin, Enoxaparin, Digoxin, Metformin, Ciprofloxacin), pediatric dosing formulas (Weight-based, Clark, Young), and 12-pair DDI matrix.
  - **Practice Mode**: Built `components/quiz/PracticeModeControls.tsx` and `ClinicalRationaleCard.tsx` delivering instant rationale feedback, distractor explanations, clinical pearls, and textbook citations.
  - **Automated Verifiable Certificates**: Created `lib/certificates.ts` and `lib/certificatePdf.ts` with dual mastery criteria (100% watch rate + $\ge 80\%$ quiz score), `SimpleQRCode` pure-TS matrix generator, binary PDF 1.4 compiler, and public verification portal at `pages/verify/[code].tsx`.
  - **Faculty Gradebook**: Implemented `components/admin/FacultyGradebook.tsx` and `lib/gradebookExport.ts` for cohort attempt tracking, score distributions, and CSV/JSON exports.
  - **Supabase Migrations 001–004**: Deployed `001_feature_flags.sql`, `002_certificates.sql`, `003_ai_consultations.sql`, and `004_user_streaks.sql` with developer toggle console (`components/admin/DeveloperConsole.tsx`).
  - **Tier 1–4 Test Suite**: Deployed automated test runner `scripts/run-e2e-tests.mjs` executing 204 unit, boundary, integration, and scenario tests with 100.0% pass rate.

---

## 3. Deep Dive: Key Technical Implementations in Phase 2

### 3.1 Cockcroft-Gault Equation & Renal Staging
$$\text{CrCl (mL/min)} = \frac{(140 - \text{Age}) \times \text{Weight (kg)}}{72 \times \text{Serum Creatinine (mg/dL)}} \times (0.85 \text{ if Female})$$

The engine automatically computes renal impairment stages according to KDIGO guidelines:
- $\ge 90\text{ mL/min}$: Normal / Stage 1
- $60 - 89\text{ mL/min}$: Mild Impairment / Stage 2
- $30 - 59\text{ mL/min}$: Moderate Impairment / Stage 3
- $15 - 29\text{ mL/min}$: Severe Impairment / Stage 4
- $< 15\text{ mL/min}$: End-Stage Renal Disease (ESRD) / Stage 5

### 3.2 Dual Mastery Certificate Criteria & Cryptographic Verification Code
Certificates require strict dual criteria:
1. **$\text{Watch Rate} = 100.0\%$**: Every lecture in the syllabus must be completed.
2. **$\text{Quiz Score} \ge 80.0\%$**: Comprehensive final assessment passing grade.

Verification codes follow the deterministic structure:
$$\text{PHARMA}-\text{YYYY}-\text{HEX}_1-\text{HEX}_2$$
Generated from `hash(courseId:userId:timestamp)`.

### 3.3 Dependency-Free Binary PDF 1.4 Generator
`lib/certificatePdf.ts` renders an A4 landscape canvas ($2000 \times 1414\text{ px}$) complete with guilloche security borders, clinical typography, student name, course title, and live QR code. It then compiles the raw byte stream into a standard PDF 1.4 document without external runtime dependencies.
