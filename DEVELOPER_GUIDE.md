# PharmaCore — Future Developer & Maintainer Guide (`DEVELOPER_GUIDE.md`)

> **Document Purpose**: Exhaustive onboarding guide and architectural reference for any software engineer, DevOps specialist, or academic administrator working on the PharmaCore codebase in the future.  
> **Current Version**: 2.4.0 (Production-Ready)  
> **Last Updated**: August 2026

---

## 1. Project Status & Health Overview

PharmaCore is a fully functional, production-ready fullstack web application built on **Next.js 15.5**, **React 19**, **TypeScript**, **Tailwind CSS 3.4**, and **Supabase (PostgreSQL 15)**.

### Current System Health Metrics:
- **Build Status**: `✓ npm run build` compiles with code 0 across all 9 static/dynamic routes.
- **Automated Test Coverage**: **302 / 302 automated tests passing (100%)** across `scripts/run-e2e-tests.mjs` and `scripts/run-expansion-tests.mjs`.
- **Database Migrations**: 4 modular SQL scripts in `supabase/migrations/` covering feature flags, AI consultations, certificates/streaks, and question rationales/gradebook.
- **Design System**: Strict vector iconography (`react-icons/fi`, `react-icons/fa6`, `lucide-react`) with zero emojis and responsive Glassmorphism styling.
- **Mobile Responsiveness**: 100% verified across 320px, 375px, 390px, 412px, 768px, 1024px, and 1440px viewports without horizontal overflow (`overflow-x`).

---

## 2. Key Architectural Concepts

### 2.1 Bilingual Internationalization & RTL
- The application uses `next-i18next` with `en` (English, LTR) and `ar` (Arabic, RTL).
- All pages implement `serverSideTranslations(locale ?? "en", ["common"])` inside `getServerSideProps` or `getStaticProps`.
- CSS uses logical Tailwind classes (`start-`, `end-`, `ps-`, `pe-`, `ms-`, `me-`, `rtl:rotate-180`) rather than physical `left-` and `right-` to guarantee automatic RTL layout flipping.

### 2.2 Dual-Tier Feature Flag Engine (`lib/featureFlags.ts`)
- Features can be enabled/disabled at the **Global Level** (`site_content.features`) in the Admin CMS, and overridden at the **Course Level** (`courses.feature_overrides`).
- Available flags:
  - `practice_mode`: Instant clinical explanations during quizzes.
  - `ai_assistant`: In-lecture floating AI clinical consultation drawer.
  - `certificates`: Strict mastery certificate issuance and PDF generation.
  - `leaderboards`: Multi-scope gamification and 5-tier Division standings.
  - `discussions`: Classroom peer Q&A and upvoting.
  - `notes_drawer`: Timestamped clinical note taking and PDF/Markdown export.

### 2.3 Strict Certificate Mastery Engine (`lib/certificates.ts`)
- Certificates cannot be claimed unless both criteria are met:
  1. $\text{Lecture Watch Rate} = 100\%$
  2. $\text{Aggregate Course Quiz Average} \ge 80\%$
- Codes follow the format `PC-XXXX-YYYY` and resolve on the public `/verify/[code]` portal.

---

## 3. How to Perform Common Tasks

### 3.1 Adding a New Course
1. Insert a new row in the Supabase `courses` table:
   ```sql
   INSERT INTO courses (
     title_en, title_ar, description_en, description_ar, 
     category, difficulty, price, is_published, estimated_hours
   ) VALUES (
     'Oncology Therapeutics & Chemotherapy', 'العلاج الدوائي للأورام والعلاج الكيميائي',
     'Targeted therapies, monoclonal antibodies, and chemotherapy toxicity management.',
     'العلاجات الموجهة، الأجسام المضادة أحادية النسيلة، والتعامل مع سمية العلاج الكيميائي.',
     'oncology', 'advanced', 0, true, 8.0
   );
   ```
2. Insert accompanying lectures into `lectures` with `course_id` and sequential `order_index`.
3. Add a corresponding checkpoint quiz in `quizzes` with question rationales in `quiz_questions`.

### 3.2 Adding a New Clinical Calculator
1. Define the mathematical formula and interface in [`lib/clinicalCalculators.ts`](file:///home/bravo-07/Documents/dev/yo-project/lib/clinicalCalculators.ts).
2. Add a new tab inside [`components/clinical/ClinicalWorkspace.tsx`](file:///home/bravo-07/Documents/dev/yo-project/components/clinical/ClinicalWorkspace.tsx) using the Radix `Tabs` primitive.
3. Wire the tool definition into the AI consultation router in [`pages/api/ai/consult.ts`](file:///home/bravo-07/Documents/dev/yo-project/pages/api/ai/consult.ts).
4. Add unit test assertions in `tests/` and run `node scripts/run-e2e-tests.mjs`.

### 3.3 Modifying Gamification Division XP Thresholds
- Update `DEFAULT_XP_RULES` in [`lib/gamification.ts`](file:///home/bravo-07/Documents/dev/yo-project/lib/gamification.ts) or configure dynamic thresholds in the Admin Developer Console (`site_content.gamification_rules`).

---

## 4. Running Verification & Quality Checks

Always run the full suite of automated checks before deploying changes to production:

```bash
# 1. Type check and Next.js production build verification
npm run build

# 2. Run core platform E2E tests (98 test cases)
node scripts/run-e2e-tests.mjs

# 3. Run platform expansion & gamification tests (204 test cases)
node scripts/run-expansion-tests.mjs
```

---

## 5. Security & Deployment Best Practices

1. **Row Level Security (RLS)**:
   - Ensure every new Supabase table enables RLS (`ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`).
   - Policies should permit public `SELECT` on published courses and restrict `INSERT`/`UPDATE` to authenticated owners or staff roles (`dev`, `super_admin`, `mentor`).
2. **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` is public-safe for browser queries.
   - `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to client bundles (use only in `/pages/api/*`).
3. **Responsive Mobile Testing**:
   - Verify all new modal dialogues and tables with Chrome DevTools Device Mode set to 360px width.
