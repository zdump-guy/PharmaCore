# PharmaCore Testing Infrastructure & Quality Assurance Specification

## Executive Overview
PharmaCore employs a rigorous, multi-tiered, and automated testing architecture designed to guarantee system integrity, security isolation, responsive fluidity, input validation, and high-availability error handling. This document details the testing methodology, runner framework, and end-to-end coverage matrix mapping all 17 system features defined in `PROJECT.md § Feature Inventory`.

---

## 1. The 4-Tier Testing Methodology

PharmaCore structures all automated quality assurance into a 4-tier verification hierarchy. Each tier tests the system under increasingly complex conditions, progressing from isolated unit mechanics to full-fidelity real-world user workflows.

```
┌────────────────────────────────────────────────────────────────────────┐
│               Tier 4: Real-World Application Scenarios                 │
│      End-to-End User Journeys, Multi-step Flows, Arabic Onboarding    │
├────────────────────────────────────────────────────────────────────────┤
│              Tier 3: Cross-Feature Combinations & State                │
│    RTL + Small Viewport, Rate Limiter + Zod Cascades, Auth + Upload   │
├────────────────────────────────────────────────────────────────────────┤
│                Tier 2: Boundary, Corner & Stress Testing               │
│     Extreme Viewports (240px-3840px), Token Exhaustion, Rapid Bursts    │
├────────────────────────────────────────────────────────────────────────┤
│                Tier 1: Feature & Contract Coverage                     │
│    Direct Unit Testing, Schema Verification, AST / Codebase Scanning   │
└────────────────────────────────────────────────────────────────────────┘
```

### Tier 1: Feature & Contract Coverage
- **Objective**: Verify the fundamental happy-path behavior, functional contracts, and structural rules of individual features in total isolation.
- **Scope**:
  - AST and static regex scans ensuring zero secret leaks (`SUPABASE_SERVICE_ROLE_KEY`) in client bundles.
  - Unit tests for token bucket replenishment, header emission (`X-RateLimit-*`), and rate limiter state tracking.
  - Syntax and keyword validation of database schema scripts (`IF NOT EXISTS`, role defaults, security definers).
  - Validation of Zod schema definitions and structured error reporting (`parsed.error.flatten()`).
  - Next.js configuration properties (`images.remotePatterns`, security headers).
  - Component existence, export types, and initial prop validation.

### Tier 2: Boundary, Corner & Stress Testing
- **Objective**: Subject features to boundary conditions, extreme inputs, resource constraints, and adversarial scenarios.
- **Scope**:
  - Viewport boundary stress: testing UI layout stability across 240px, 280px, 320px (iPhone SE), 375px, 768px (iPad), 1024px, 1280px, and 4K (3840px).
  - Rate limiter exhaustion: testing rapid multi-request bursts, boundary token depletion (`tokens < 1`), fractional replenishment windows, and `Retry-After` header precision.
  - UploadThing unauthorized access: empty auth headers, invalid tokens, expired tokens, and unauthorized roles (`student`).
  - Input validation boundary tests: oversized payloads (>3000 chars), invalid UUID formats, illegal enum values, injection strings, and missing required parameters.
  - Touch target hit area enforcement: validating minimum bounding boxes (>= 44px x 44px) across all interactive elements.

### Tier 3: Cross-Feature Combinations & State Transitions
- **Objective**: Exercise interaction points between multiple features operating concurrently.
- **Scope**:
  - **Bidirectionality + Viewport Scaling**: Arabic RTL cascade (`dir="rtl"`, Tajawal font, logical properties `start-`, `end-`, `ps-`, `pe-`) interacting with micro viewports (320px) and dropdown menus.
  - **Security + File Ingestion**: UploadThing authorization middleware chained with client session token retrieval in `file-uploader.tsx`.
  - **Rate Limiting + Input Validation**: Verifying that volumetric abuse triggers HTTP 429 before application compute/DB access, while valid throughput with malformed payloads cleanly returns HTTP 400 with Zod field errors.
  - **Theme System + Error Boundaries**: Verifying that `ErrorBoundary.tsx` and custom error pages (`404.tsx`, `500.tsx`, `_error.tsx`) inherit theme tokens (`bg-background`, `text-foreground`, `bg-card`) and maintain bilingual fidelity during runtime crashes.

### Tier 4: Real-World Application Scenarios
- **Objective**: Simulate complete end-to-end user workflows and real-world failure recovery paths.
- **Scope**:
  - **Student Onboarding & Registration Journey**: Turnstile verification -> rate-limited signup request -> database default role assignment (`student`) -> profile completion.
  - **Lecture Access & Community Engagement**: Viewing course -> lecture selection -> submitting community questions (without email leakage via CLS) -> video playback layout adaptation.
  - **Admin Course & Enrollment Management**: Staff authentication -> media upload via UploadThing -> curriculum management -> approving pending student enrollments.
  - **Fault Resilience & Disaster Recovery**: Unhandled component exception caught by `ErrorBoundary` -> user triggers retry or navigates back to `/` without white-screen lockup.

---

## 2. Feature Inventory & Verification Matrix (F1 – F17)

All 17 features from `PROJECT.md § Feature Inventory` are cataloged below with their architectural layer, target milestone, and multi-tier verification mapping:

| Feature ID | Feature Name | Layer | Milestone | Primary Verification Suites | Tier Coverage Mapping |
|---|---|---|---|---|---|
| **F1** | Supabase Service Role Secret Isolation | Security / Auth | M1 | `tests/integrity_check.test.mjs` (Suite 1) | **T1**: AST/Regex scan of client directories<br>**T2**: Window guard check in `supabaseAdmin.ts`<br>**T3**: Build artifact audit (`npm run build`) |
| **F2** | UploadThing Staff Authorization | API / Storage | M1 | `tests/integrity_check.test.mjs` (Suite 2) | **T1**: Middleware signature & token inspection<br>**T2**: Rejection of missing/invalid tokens and non-staff roles<br>**T3**: Header injection in `file-uploader.tsx` |
| **F3** | In-Memory Sliding-Window Rate Limiting | API Middleware | M1 | `tests/integrity_check.test.mjs` (Suite 3) | **T1**: Token consumption & standard headers<br>**T2**: Bucket exhaustion, 429 response, `Retry-After`<br>**T3**: IP isolation & route prefix segregation |
| **F4** | Comprehensive Environment Documentation | Configuration | M1 | `tests/integrity_check.test.mjs` (Suite 4) | **T1**: Key presence in `.env.local.example`<br>**T2**: Value placeholder format validation |
| **F5** | Canonical Idempotent Database Schema | Database (PostgreSQL) | M2 | `tests/integrity_check.test.mjs` (Suite 5) | **T1**: SQL DDL syntax & idempotency keywords (`IF NOT EXISTS`)<br>**T2**: Consecutive re-run simulation<br>**T3**: Constraint and index declarations |
| **F6** | Default Signup Role Hardening | Database / Auth | M2 | `tests/integrity_check.test.mjs` (Suite 5) | **T1**: `handle_new_user()` trigger inspection<br>**T2**: Default role validation as `'student'`<br>**T4**: Sign-up flow privilege escalation prevention |
| **F7** | Non-Recursive RLS & Analytics Policy Fix | Database (RLS) | M2 | `tests/integrity_check.test.mjs` (Suite 5) | **T1**: `get_user_role()` defined as `SECURITY DEFINER STABLE`<br>**T2**: Absence of direct subqueries in `analytics_events` RLS |
| **F8** | Student Email Privacy via CLS | Database (RLS/CLS) | M2 | `tests/integrity_check.test.mjs` (Suite 5) | **T1**: CLS `REVOKE SELECT` on `author_email`<br>**T2**: Whitelist grant of non-sensitive columns only<br>**T3**: Removal of public INSERT on `community_questions` |
| **F9** | Course Enrollment Gating Policy | Database (RLS) | M2 | `tests/integrity_check.test.mjs` (Suite 5) | **T1**: Enrollment INSERT RLS policy inspection<br>**T2**: Strict constraint on `status = 'pending'` |
| **F10** | Comprehensive Zod Input Validation | API Routes | M3 | `tests/integrity_check.test.mjs` (Suite 6) & Integration | **T1**: Schema presence on all endpoints<br>**T2**: Rejection of invalid types with 400 Bad Request<br>**T3**: Uniform `error.flatten()` structure |
| **F11** | Global React Error Boundary | Presentation | M4 | `tests/integrity_check.test.mjs` (Suite 7) | **T1**: Component export & lifecycle methods<br>**T2**: Catch block execution & fallback rendering<br>**T4**: Integration into `pages/_app.tsx` |
| **F12** | Branded Bilingual Custom Error Pages | Presentation | M4 | `tests/integrity_check.test.mjs` (Suite 7) | **T1**: `404.tsx`, `500.tsx`, `_error.tsx` exports<br>**T2**: HTTP status code handling<br>**T3**: Bilingual toggle (EN/AR) & theme support |
| **F13** | Typography & Arabic Tajawal Cascade Fix | Styling / Typography | M4 | `tests/integrity_check.test.mjs` (Suite 8) & Responsive Suites | **T1**: `tailwind.config.ts` fontFamily definitions<br>**T2**: `[dir="rtl"]` font override in `globals.css`<br>**T3**: Anti-FOUC theme script in `_document.tsx` |
| **F14** | WCAG 2.5.5 Touch Target Upgrades | Accessibility (UI) | M4 | `tests/integrity_check.test.mjs` (Suite 8) & Responsive Suites | **T1**: Button, Input, Select, Dialog close >= 44px<br>**T2**: Mobile touch bounding box audit (320px-390px)<br>**T3**: Touch spacing and layout non-collision |
| **F15** | Logical Property Normalization for RTL | Styling (CSS) | M4 | `tests/integrity_check.test.mjs` (Suite 8) & Responsive Suites | **T1**: Replacement of `left-`/`right-` with `start-`/`end-`<br>**T2**: Bidirectional mirroring in Alert, Select, Dialog |
| **F16** | Production HTTP Security Headers & Remote Patterns | Infrastructure | M5 | `tests/integrity_check.test.mjs` (Suite 9) | **T1**: Next.js `headers()` configuration<br>**T2**: HSTS, X-Frame-Options, CSP/Permissions-Policy<br>**T3**: `images.remotePatterns` replacing `images.domains` |
| **F17** | Automated Integrity & Responsiveness Test Suite | Quality Assurance | E2E / M5 | Master Test Runner (`npm test`) | **T1-T4**: 100% execution of responsive and integrity suites with 0 failures |

---

## 3. Test Runner Architecture & Execution

The test infrastructure runs entirely on Node.js native ESM without requiring external daemon processes or heavy browser drivers, ensuring lightning-fast local and CI/CD execution.

### Test Suites Directory Layout
```
tests/
├── helpers/
│   ├── layout_simulator.mjs     # Viewport & CSS length calculation engine
│   └── test_framework.mjs       # Zero-dependency async test framework & reporter
├── responsive_test.mjs          # Responsive runner entrypoint (Tiers 1-4)
├── tier1_feature_coverage.test.mjs
├── tier2_boundary_cases.test.mjs
├── tier3_cross_feature.test.mjs
├── tier4_user_scenarios.test.mjs
└── integrity_check.test.mjs     # Standalone system integrity & security test suite
```

### Execution Commands

1. **Standalone Integrity Check Suite**:
   ```bash
   node tests/integrity_check.test.mjs
   ```
   *Verifies security boundaries, rate limiting unit mechanics, database DDL syntax, Zod error compliance, error pages, and design tokens.*

2. **Mobile Responsiveness & Layout Suite**:
   ```bash
   node scripts/verify_responsiveness.mjs
   ```
   *Executes all 129 automated assertions across Tiers 1–4.*

3. **Master Verification Command**:
   ```bash
   npm test
   ```
   *Sequentially executes both test suites, asserting 100% pass rate.*

4. **Complete Production Readiness Pipeline**:
   ```bash
   npm test && npx tsc --noEmit && npm run lint && npm run build
   ```

---

## 4. Acceptance Thresholds & Quality Gates

To achieve production readiness signoff (`TEST_READY.md`), the codebase must strictly satisfy:
- **Zero Test Failures**: 100% passing across all integrity and responsiveness assertions.
- **Zero TypeScript Errors**: `npx tsc --noEmit` exits with status `0`.
- **Zero ESLint Warnings/Errors**: `npm run lint` exits with status `0`.
- **Zero Build Regressions**: `npm run build` completes production compilation and static route generation cleanly.
- **Zero Secret Leaks**: Automated verification confirms zero client bundle references to `SUPABASE_SERVICE_ROLE_KEY`.
