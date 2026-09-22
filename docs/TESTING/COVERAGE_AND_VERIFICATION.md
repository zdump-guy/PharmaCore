# Requirements Traceability & Verification Matrix

This document maps requirements from `PharmaCore_Prompt_Updated.md` to automated test verifications.

---

## Requirements Verification Matrix

| Requirement Code | Requirement Summary | Implementation Files | Automated Verification Suite |
|---|---|---|---|
| **R1 (Course Page)** | Display course title, objectives, prerequisites, and dynamic lecture list. | `pages/course/[id].tsx`, `supabase/00_complete_production_schema.sql` | `tests/e2e_requirements_audit.test.mjs` (Section 1) |
| **R2 (Lecture Page)**| Embedded YouTube player, Google Drive/UploadThing resources, quizzes button, community Q&A forum. | `pages/lecture/[id].tsx`, `components/YouTubePlayer.tsx` | `tests/e2e_requirements_audit.test.mjs` (Section 2) |
| **R3 (Admin Dashboard)**| Role-gated curriculum hub, data entry forms, mentor assignment, community Q&A moderation. | `pages/admin/index.tsx`, `components/admin/*` | `tests/e2e_requirements_audit.test.mjs` (Section 3) |
| **R4 (Theme & Typography)**| Full Light/Dark mode support, Arabic `Tajawal` font, English `Inter` font, emerald green & trust blue palette. | `styles/globals.css`, `lib/fonts.ts`, `components/ThemeProvider.tsx` | `scripts/verify_responsiveness.mjs` |
| **R5 (Roles & Permissions)**| Strict isolation between `dev`, `super_admin`, `mentor`, `student`, and anonymous public visitors. | `supabase/00_complete_production_schema.sql`, `pages/api/*` | `tests/comprehensive_security_matrix.test.mjs` |
