# PharmaCore — Advanced Clinical Pharmacy & Therapeutics Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%203.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Tests-302%20Passing-brightgreen?style=flat-square)](./scripts/)

> **PharmaCore** is an open, modern, high-yield clinical pharmacy education and board preparation platform engineered for PharmD students, clinical residents, and pharmacy practitioners preparing for licensure examinations (NAPLEX, SPLE, DHA/MOH, BCPS).

---

## Architecture Diagram

```mermaid
graph TD
    User([Student / Pharmacist]) -->|Web Browser| NextClient[Next.js 15 Client - Glassmorphism UI]
    NextClient -->|Bilingual Routing EN/AR| PagesRouter[Pages Router & API Routes]
    
    subgraph Frontend Subsystems
        PagesRouter --> CoursesCatalog[/courses - Categorized Catalog]
        PagesRouter --> StudentDashboard[/dashboard - Command Center & Daily Challenge]
        PagesRouter --> LeaderboardPortal[/leaderboard - 5-Tier Division Podium]
        PagesRouter --> LecturePlayer[/lecture/:id - Timestamped Notes & Video]
        PagesRouter --> PracticeQuiz[/quiz/:id - Untimed Rationales & Exam Mode]
        PagesRouter --> PublicVerify[/verify/:code - Verifiable Credentials]
    end

    subgraph Clinical & Backend Engines
        PagesRouter --> AIClinicalAssistant[Clinical AI Assistant & Calculators]
        PagesRouter --> GamificationEngine[5-Tier Division & XP Engine]
        PagesRouter --> CertificateEngine[Automated PDF Certificate Generator]
        PagesRouter --> GradebookEngine[Faculty Gradebook & Funnel Analytics]
    end

    subgraph Data & Cloud Infrastructure
        AIClinicalAssistant --> SupabaseDB[(Supabase PostgreSQL)]
        GamificationEngine --> SupabaseDB
        CertificateEngine --> SupabaseDB
        GradebookEngine --> SupabaseDB
    end
```

---

## Key Features

### 1. High-Yield Clinical Curriculum & Discovery
* **Categorized Course Directory (`/courses`)**: Filter by therapeutic specialty (Cardiovascular, Antimicrobial, Kinetics, Oncology, Endocrine, Neuro/Psych), difficulty tier, and duration.
* **Lead Magnet & Guest Previews**: Free introductory lectures and sample quizzes with seamless conversion flows.

### 2. Clinical Decision Support & AI Calculators
* **Cockcroft-Gault Creatinine Clearance**: Auto-normalizes age, gender, and weight for CKD staging and dose adjustments.
* **Pediatric Dosing Engine**: Weight-based dosing with adult maximum safety caps.
* **Drug-Drug Interaction (DDI) Matrix**: Identifies CYP450 contraindications, QT prolongation, and adverse drug pairings.

### 3. Automated Verifiable PDF Certificates
* **Strict Mastery Gate**: Unlocked automatically upon 100% video completion and $\ge 80\%$ aggregate quiz average.
* **Vector PDF Credentials**: Dynamic generation via `jspdf` with high-resolution seals and embedded verification QR codes.
* **Public Verification Portal (`/verify/[code]`)**: Instant credential authentication for universities and hospital employers.

### 4. 5-Tier Division Gamification & Leaderboards
* **Division Leagues**: Bronze (0-499 XP), Silver (500-1499 XP), Gold (1500-3499 XP), Platinum (3500-6999 XP), and Diamond (7000+ XP).
* **Multi-Scope Leaderboards**: Real-time Global, University Cohort, and Classroom rankings with Weekly and All-Time views.
* **Daily Pharmacology Challenge**: Deterministic "Drug of the Day" micro-vignette granting +25 XP with instant rationale feedback.

### 5. In-Lecture Study Tools & Classroom Hub
* **Timestamped Notes Drawer**: Take clinical notes tied to exact video timestamps with 1-click player seeking and instant Markdown/PDF export.
* **Classroom Discussions**: Course-level clinical Q&A with peer upvoting and verified faculty solutions.

### 6. Faculty Gradebook & Curriculum Analytics
* **Roster Progress Matrix**: Comprehensive student tracking with 1-click RFC-4180 CSV export.
* **Drop-off Funnel & Question Heatmap**: Identifies retention bottlenecks and difficult question topics.

---

## Tech Stack

* **Framework**: Next.js 15.5 (Pages Router) with React 19
* **Styling**: Tailwind CSS 3.4 with custom Glassmorphism tokens (`backdrop-blur-xl`, ambient glow, gradient borders)
* **Icons**: Strict SVG vector icons from `react-icons/fi`, `react-icons/fa6`, and `lucide-react` (zero emojis)
* **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS)
* **Document Generation**: `jspdf` (Vector PDF certificates) + `qrcode` (QR verification)
* **Internationalization**: `next-i18next` with full English & Arabic (RTL) support

---

## Getting Started

### Prerequisites
* Node.js $\ge 18.18.0$
* npm $\ge 9.0.0$
* Supabase account (or local Supabase instance)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/pharmacore/pharmacore.git
   cd pharmacore
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Apply Database Migrations**:
   Execute the migration SQL scripts located in `supabase/migrations/` in sequential order:
   - `001_feature_flags.sql`
   - `002_ai_consultations.sql`
   - `003_certificates_and_streaks.sql`
   - `004_question_rationales_and_gradebook.sql`

5. **Start Local Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Automated Test Suites

PharmaCore maintains a comprehensive automated testing suite with 302 unit, integration, and opaque-box end-to-end tests:

```bash
# Run Core Platform E2E Tests (98 tests)
node scripts/run-e2e-tests.mjs

# Run Platform Expansion & Gamification Tests (204 tests)
node scripts/run-expansion-tests.mjs

# Run Production Build Check
npm run build
```

---

## Project Structure

```
yo-project/
├── components/          # Reusable UI components & feature modules
│   ├── admin/           # Faculty Gradebook, Analytics, CMS
│   ├── certificates/    # Certificate modal, streak badge card
│   ├── classroom/       # Discussion hub & peer Q&A
│   ├── clinical/        # AI Clinical Assistant & Calculators
│   ├── gamification/    # Division badge, podium, leaderboard, challenge
│   ├── notes/           # In-lecture timestamped notes drawer
│   └── ui/              # Radix UI primitives & theme buttons
├── docs/                # Comprehensive technical documentation suite
│   ├── history/         # Git commit logs & phase breakdowns
│   ├── FEATURES.md      # Master features catalog
│   ├── architecture.md  # System architecture & design system
│   ├── database_schema.md # Relational tables & RLS policies
│   ├── gamification_engine.md # Division math & leaderboard logic
│   ├── ai_clinical_tools.md   # Clinical calculators & prompt schemas
│   ├── certificates_and_verification.md # PDF generation & QR validation
│   └── api_reference.md # REST / Edge API schemas
├── lib/                 # Shared business logic, calculators & exports
├── pages/               # Next.js Pages Router views & API endpoints
│   ├── admin/           # Admin dashboard & developer console
│   ├── api/             # Serverless API endpoints
│   ├── courses.tsx      # Categorized course catalog
│   ├── dashboard.tsx    # Student command center & daily challenge
│   ├── leaderboard.tsx  # Multi-scope leaderboards & podium
│   ├── lecture/[id].tsx # In-lecture player, notes & AI assistant
│   ├── profile.tsx      # Profile overhaul, notes & credentials
│   ├── quiz/[id].tsx    # Exam & Practice mode simulator
│   └── verify/[code].tsx # Public certificate verification portal
├── public/              # Static assets and bilingual locales (en / ar)
├── scripts/             # Automated test runners and build verification
├── supabase/migrations/ # Relational database DDL migrations
├── DEVELOPER_GUIDE.md   # Developer onboarding & maintainer guide
└── README.md            # Repository overview & setup guide
```

---

## License
Distributed under the MIT License. See `LICENSE` for more information.
