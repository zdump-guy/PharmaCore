# PharmaCore Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - 2026-09-23

### Added
- Enhanced Email System & Campaign Engine featuring in-browser template authoring, HTML file upload, dynamic placeholder interpolation (`{{user_name}}`, `{{action_url}}`, `{{current_year}}`), live iframe preview, and instant test email dispatching.
- Multi-audience campaign dispatcher supporting broadcasts to *All Users*, *Staff Only*, *Student Cohorts* (all/active/course-enrolled), *Marketing Campaigns* (with promo code pills, banners, and compliant opt-out filtering), and dedicated direct emails (*Specific Users* search chips or *Single User* autocomplete).
- 7 new Next.js Serverless API endpoints under `pages/api/admin/emails/` and `pages/api/admin/users/search.ts` with strict Zod validation, rate limiting, and staff RBAC checks.
- Database migration `supabase/04_enhanced_email_system.sql` introducing `public.email_templates`, `public.email_logs`, `email_marketing_enabled` user preferences, and performance indexes.
- 3-tab Administrative Email Communications Center (`components/admin/EmailManager.tsx`) integrated into `components/admin/AdminSidebar.tsx`, `components/admin/AdminTopNav.tsx`, and `pages/admin/index.tsx`.
- Automated test suite `tests/enhanced_email_system.test.mjs` verifying schema DDL, RLS, mailer chunking, endpoint validation, and UI tab contracts.
- Dev-exclusive discussion moderation endpoints: `DELETE /api/questions/[id]` (deletes question with cascading deletion of answers and in-app notifications) and `DELETE /api/questions/answers/[id]` (deletes individual reply).
- Dev role deletion action controls with confirmation dialogs in `components/admin/CommunityManager.tsx` and `pages/admin/index.tsx`.
- Inline dev role deletion controls for student questions and mentor answers in `pages/lecture/[id].tsx`.
- Automated test coverage in `tests/qa_and_notifications_security.test.mjs` (Section 12) validating dev-only RBAC, UUID schemas, rate limits, and cascade integrity.
- Comprehensive 30-dimension UI & Design System Integrity Audit suite (`docs/UI_AUDIT/`) covering component matrices, design tokens, viewport benchmarks, WCAG 2.1 AA accessibility, and remediation roadmap.
- Comprehensive continuous documentation system (`docs/`) spanning 26 technical domains and 90+ modular documentation files adhering strictly to `AI_AGENT_DOCUMENTATION_SYSTEM.md`.
- Architecture Decision Records (ADRs 0001 through 0007).
- Full 23 API routes specification and 13 PostgreSQL tables schema reference.
- End-to-end data flow sequence diagrams for enrollment, Q&A, feedback, and authoring.

### Changed
- Synchronized master design token specifications (`design-system/pharmacore/MASTER.md` and `docs/DESIGN_SYSTEM/TOKENS.md`) to accurately document active clinical cyan/teal runtime tokens (`hsl(194 49% 31%)`, `#262626`, `#6AA6B8`, `#8BCDE1`).
- Standardized corner radius token documentation around base `--radius: 0.9rem` (14.4px).

### Removed
- **Cloudflare Turnstile Bot Verification**: Completely removed Turnstile client widgets, server-side verification helpers (`lib/turnstile.ts`), CSP header allowances (`challenges.cloudflare.com`), and environment variables (`NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`, `CLOUDFLARE_TURNSTILE_SECRET_KEY`) across all registration, enrollment, Q&A, and feedback endpoints in favor of zero-friction, multi-tier defense-in-depth security (in-memory sliding-window IP rate limiting, strict Zod validation, text sanitization, and Supabase RLS). Superseded [ADR-0007](../DECISIONS/ADR-0007-cloudflare-turnstile-bot-defense.md) and recorded in [TASK-005](../TASKS/TASK-005-complete-removal-of-cloudflare-turnstile.md).

### Fixed
- Added localized bilingual `aria-label` screen reader tags to all icon-only action buttons across `components/admin/UserManager.tsx` and `components/admin/CurriculumManager.tsx`.
- Standardized badge primitives in `components/admin/AnalyticsDashboard.tsx`.

---

## [0.5.0] - 2026-09-21 (Milestone M5)

### Added
- In-app notification center for student question replies and administrative broadcasts (`supabase/03_notifications_and_qa_hub.sql`).
- Transactional email dispatcher via Resend (`lib/email.ts`) with CRLF injection defense and HTML escaping.
- Comprehensive 22-domain security hardening audit and automated test suite (`tests/comprehensive_security_matrix.test.mjs`).
- Public feedback and bug reporting portal (`pages/feedback.tsx`) with automatic device telemetry capture.

### Security
- Enhanced sliding window rate limiting with user-aware quotas and spoof-proof Real-IP resolution order.
- Cloudflare Turnstile bot challenge integration on public write endpoints.

---

## [0.4.0] - 2026-09-07 (Milestone M4)

### Added
- Custom multi-track audio lecture player (`components/ui/custom-audio-player.tsx`) for voice notes.
- In-browser microphone audio recorder (`components/admin/VoiceRecorder.tsx`) integrated with UploadThing.
- Interactive quiz engine PDF and solution PDF modal viewers (`components/ui/pdf-preview-modal.tsx`).

---

## [0.3.0] - 2026-09-06 (Milestone M3)

### Added
- Student account registration, login tabs, and personal profile management (`pages/profile.tsx`).
- Course cohort enrollment request and approval workflow (`public.course_enrollments`).
- Community Q&A forum on lecture pages with anonymous posting toggle and Column Level Security (CLS).

---

## [0.2.0] - 2026-08-20 (Milestone M2)

### Added
- Consolidated production PostgreSQL migration (`supabase/00_complete_production_schema.sql`).
- Non-recursive `get_user_role()` function eliminating PostgreSQL `42P17` RLS recursion.
- 20 high-performance B-tree indexing structures.

---

## [0.1.0] - 2026-08-15 (Milestone M1)

### Added
- Initial bilingual educational platform shell (Next.js 15, React 19, Tailwind CSS).
- Course syllabus and lecture video streaming with YouTube iframe integration.
- Light/Dark theme provider and bilingual `Tajawal`/`Inter` font integration.
