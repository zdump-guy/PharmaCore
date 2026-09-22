# PharmaCore — Continuous Engineering Journal

This document acts as an append-only, chronological engineering log recording meaningful decisions, findings, architectural changes, and system evolution over time.

---

## 2026-09-23 — UI & Design System Integrity Audit & Remediation (Task TASK-002)

### Objective
Execute a full 30-dimension audit and remediation on PharmaCore's UI, design tokens, component library, responsiveness, and WCAG 2.1 AA accessibility in accordance with `UI_DESIGN_SYSTEM_INTEGRITY_AUDIT.md`.

### Observations & Discoveries
- Token divergence identified: `design-system/pharmacore/MASTER.md` and initial docs referenced a legacy pharmacy green palette (`#15803D`) whereas runtime `styles/globals.css` and platform code strictly use the clinical cyan/teal palette (`hsl(194 49% 31%)`, `#262626`, `#6AA6B8`, `#8BCDE1`).
- Admin tables in `UserManager.tsx` and `CurriculumManager.tsx` used icon-only buttons without accessible `aria-label` tags for screen readers.
- 100% responsiveness verified across all 5 standard viewport tiers (320px–1400px) and extreme micro-viewports (240px–280px) in `verify_responsiveness.mjs` (129/129 tests passing).

### Actions Taken
- Created full audit documentation suite in `docs/UI_AUDIT/` (9 documents covering 30 assessment dimensions, findings, and remediation).
- Synchronized `design-system/pharmacore/MASTER.md`, `docs/DESIGN_SYSTEM/TOKENS.md`, and `docs/DESIGN_SYSTEM/README.md` to reflect runtime cyan/teal tokens.
- Documented `--radius: 0.9rem` (14.4px) baseline and calculated token scale in `docs/DESIGN_SYSTEM/SPACING_AND_LAYOUT.md`.
- Added localized bilingual `aria-label` attributes to all action buttons in `UserManager.tsx` and `CurriculumManager.tsx`.
- Standardized all administrative badges and verified container padding across page shells.

### Verification
- `npm test`: 100% PASS (26 visual, 16 security, 12 QA, 23 matrix, 41 integrity, 129 responsiveness).
- `npx tsc --noEmit`: 0 errors.
- `npm run lint`: 0 errors.

---

## 2026-09-22 — Onboarding Comprehensive Documentation System (Milestone M5 Complete)

### Objective
Establish an authoritative, exhaustive documentation system adhering strictly to `AI_AGENT_DOCUMENTATION_SYSTEM.md` across 26 distinct technical domains.

### Observations & Discoveries
- Repository contains 21 Next.js API routes, 13 PostgreSQL tables, 33+ React components, and 9 passing test suites.
- Code quality is exceptionally high: 0 TypeScript errors on strict mode, 0 ESLint warnings, and 100% test pass rate across unit, security, and responsive suites.
- Existing documentation was fragmented across a monolithic `README.md`, `TEST_INFRA.md`, and `security.md`.

### Action Taken
- Created structured `docs/` hierarchy with 26 dedicated domains: `ENGINES/`, `APIS/`, `INTEGRATIONS/`, `DATABASE/`, `UI/`, `DESIGN_SYSTEM/`, `MODULES/`, `DATA_FLOWS/`, `SECURITY/`, `PERFORMANCE/`, `TESTING/`, `DEPLOYMENT/`, `OPERATIONS/`, `DECISIONS/`, `CHANGELOG/`, `COMMITS/`, `TASKS/`.
- Authored initial baseline files: `README.md`, `PROJECT_OVERVIEW.md`, `ARCHITECTURE.md`, `DIRECTORY_STRUCTURE.md`, `TECH_STACK.md`, `ROADMAP.md`, `TECHNICAL_DEBT.md`, `KNOWN_ISSUES.md`.

### Verification
- Executed `npm test` (9 suites, 100% pass).
- Executed `npx tsc --noEmit` (0 errors).
- Executed `npm run lint` (0 errors).

### Documentation Impact
- Bootstrapped `docs/` directory as the single source of truth for engineering knowledge.

### Next Step
- Complete Phase 2: Runtime Engines, APIs, Database Schemas, and Integrations documentation.

---

## 2026-09-21 — Community Q&A Hub, Notifications & Resend Email Integration

### Objective
Implement in-app notifications and transactional email alerts for student Q&A responses and admin announcements.

### Action Taken
- Created `supabase/03_notifications_and_qa_hub.sql` adding `public.notifications` table and `email_notifications_enabled` preference.
- Developed `lib/email.ts` supporting Resend transactional email dispatching with CRLF sanitization and HTML template generation.
- Added `/api/students/notifications/index.ts`, `/api/students/notifications/read.ts`, and `/api/admin/announcements/broadcast.ts`.
- Integrated Notification Bell icon in Navbar and dedicated tracking tab in `pages/profile.tsx`.

### Verification
- Ran `tests/qa_and_notifications_security.test.mjs` (12/12 tests PASS).

---

## 2026-09-07 — Audio Records & Interactive Quiz PDF Extension

### Objective
Enable instructors to attach voice notes to lectures and support PDF quiz solution downloads.

### Action Taken
- Created `supabase/01_audio_records_and_quiz_pdf_migration.sql` adding `public.audio_records` table and PDF columns on `public.quizzes`.
- Built `components/ui/custom-audio-player.tsx` and `components/admin/VoiceRecorder.tsx`.
- Integrated UploadThing file router for audio and PDF uploads.

### Verification
- Ran `tests/e2e_requirements_audit.test.mjs` and `tests/integrity_check.test.mjs` (100% PASS).
