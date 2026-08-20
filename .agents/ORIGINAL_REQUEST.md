# Original User Request

## 2026-08-20T14:50:55Z

Implement the 4-phase PharmaCore enhancement plan: (1) Global & Course-level Feature Flagging Engine, (2) Hybrid AI Clinical Pharmacology Assistant, (3) Automated Verifiable PDF Certificates with QR verification & Study Streaks, (4) Practice Mode with Instant Clinical Rationales, and (5) Faculty Gradebook with drop-off analytics, along with incremental Supabase migrations.

Working directory: /home/bravo-07/Documents/dev/yo-project
Integrity mode: development

## Requirements

### R1. Feature Matrix & Modular Activation Engine
- Implement a global feature toggles configuration in Admin CMS & Developer Console stored in database settings (site_content.features).
- Implement course-level feature overrides in the course editor inheriting defaults from global settings and stored in courses.feature_overrides.

### R2. Practice Exam Simulator with Instant Clinical Rationales
- Enable an untimed Practice Mode in quiz runner revealing instant clinical explanations and guideline references immediately upon selecting an answer.
- Update quiz question authoring in admin dialogs to support bilingual explanation fields and clinical textbook references.

### R3. Automated Verifiable Certificates & Gamification
- Automatically generate verifiable certificates for students meeting strict mastery criteria (100% lecture watch completion and >= 80% quiz average).
- Provide a public verification page /verify/[code] with QR code validation.
- Implement daily learning streaks and milestone achievement badges.

### R4. Hybrid AI Clinical Assistant
- In-lecture context-aware side drawer retrieving current video topic and syllabus objectives.
- Expandable to a full clinical consultation workspace with renal/pediatric dose calculators and drug-drug interaction checkers.

### R5. Faculty Gradebook & Performance Analytics
- Admin gradebook matrix showing student-by-student lecture completion, individual quiz scores, and certificate status with university/cohort filters and CSV export.
- Visual drop-off and question difficulty heatmap analytics.

### R6. Incremental Database Migrations
- Provide 4 modular SQL migration scripts in supabase/migrations/ for feature flags, AI consultations, certificates/streaks, and question rationales/gradebook.

## Acceptance Criteria

### Build & Type Safety
- [ ] npm run build exits with code 0 and 0 TypeScript/ESLint errors.
- [ ] All new routes (/verify/[code], /api/ai/consult, etc.) resolve properly.

### Feature Flagging
- [ ] Toggling a module off globally or per-course hides its corresponding UI triggers and disables the API access.
- [ ] New courses created automatically inherit current global defaults.

### Practice Mode & Rationales
- [ ] In Practice Mode, selecting an answer displays instant feedback, correct/incorrect indicator, and clinical rationales.
- [ ] Existing standard quiz flow remains functional and unaffected.

### Certificates & Verification
- [ ] Reaching 100% video completion + >= 80% quiz score triggers certificate issuance with a unique code.
- [ ] Visiting /verify/[code] displays the authenticated student name, course title, issue date, and validation badge.

### Faculty Gradebook
- [ ] Gradebook displays student roster with itemized quiz scores and exportable CSV.
