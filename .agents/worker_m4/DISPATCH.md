## 2026-08-20T15:37:30Z
You are worker_m4, an implementation worker responsible for Milestone M4: Automated Verifiable Certificates & Gamification (Requirement R3).
Your working directory is: /home/bravo-07/Documents/dev/yo-project/.agents/worker_m4
Your parent is the Project Orchestrator (aa81873a-183a-48db-b31d-72d9a6210c82).

Scope Documents:
- /home/bravo-07/Documents/dev/yo-project/.agents/ORIGINAL_REQUEST.md (MANDATORY: read this first)
- /home/bravo-07/Documents/dev/yo-project/PROJECT.md
- /home/bravo-07/Documents/dev/yo-project/TEST_READY.md

Exclusive Write Ownership:
- `pages/verify/[code].tsx`
- `pages/profile.tsx`
- `pages/api/certificates/` (any new certificate endpoints)
- `components/certificates/` (new directory for certificate & streak/badge components)
- `lib/certificates.ts` / `lib/certificatePdf.ts`

Detailed Tasks for Milestone M4 (Requirement R3):
1. Public Verification Page (`pages/verify/[code].tsx`):
   - Create public verification page at `/verify/[code]` accessible to anyone without requiring login.
   - Use `getServerSideProps` to look up certificate by `code` in `public.certificates` (or mock/fallback for demo).
   - Display:
     - Student authenticated full name (`student_name`).
     - Course title (`course_title_en` / `course_title_ar`).
     - Issue date (`issue_date`).
     - Verification status badge ("Verified & Authentic" in emerald with shield-check icon, or "Invalid / Revoked" if code not found/revoked).
     - Final quiz score and lecture watch completion rate (e.g. 100% Video Completion, >= 80% Quiz Average).
     - QR code rendered for verification sharing.
     - "Download Official PDF" button.
2. Automated Mastery Evaluation & Certificate Issuance:
   - In `lib/certificates.ts` (and `/api/certificates/issue.ts` if needed):
     - Implement deterministic mastery check: requires strictly 100% lecture watch completion AND >= 80% average quiz score.
     - Generate standardized unique certificate code: `PHARMA-YYYY-XXXX-XXXX`.
     - Record issuance in `public.certificates` table in Supabase.
   - In `pages/profile.tsx`:
     - Display issued certificates for enrolled courses that have reached mastery criteria, with a "View Certificate" modal, "Download PDF" action, and public verification link.
3. PDF Generation & QR Embedding:
   - Implement PDF generation in `lib/certificatePdf.ts` (using `jspdf` and `qrcode` or high-resolution canvas/vector rendering compatible with React 19).
   - Generate professional, medical-themed landscape certificate with gold/emerald borders, PharmaCore branding, student name, course title, unique certificate code, issue date, and embedded QR code pointing to `https://pharmacore.edu/verify/${code}` (or origin `/verify/${code}`).
4. Study Streaks & Gamification Badges:
   - In `pages/profile.tsx` and `components/certificates/StreakBadgeCard.tsx`:
     - Calculate/display current study streak (days), longest streak, and last active date.
     - Implement milestone achievement badges:
       - 3-day Study Streak (Bronze Scholar)
       - 7-day Study Streak (Silver Pharmacist)
       - 30-day Study Streak (Gold Clinician)
       - Course Mastery (Certified Pharmacology Expert)
       - Perfect Quiz Score (100% Clinical Accuracy)
     - Render visual badge cards with unlock dates, progress indicators, and tooltips.
5. Verification:
   - Run `npx tsc --noEmit` -> 0 errors.
   - Run `npm run build` -> exit code 0.
   - Run `node scripts/run-e2e-tests.mjs` -> all 98 tests pass.
