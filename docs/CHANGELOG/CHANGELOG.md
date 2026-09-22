# PharmaCore Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - 2026-09-22

### Added
- Comprehensive continuous documentation system (`docs/`) spanning 26 technical domains and 60+ modular documentation files adhering strictly to `AI_AGENT_DOCUMENTATION_SYSTEM.md`.
- Architecture Decision Records (ADRs 0001 through 0007).
- Full 21 API routes specification and 13 PostgreSQL tables schema reference.
- End-to-end data flow sequence diagrams for enrollment, Q&A, feedback, and authoring.

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
