# PharmaCore — Complete Features Catalog (`FEATURES.md`)

> **Platform**: PharmaCore Clinical Pharmacy & Therapeutics Learning Platform  
> **Target Audience**: PharmD Students, Clinical Pharmacists, Board Candidates (NAPLEX, SPLE, DHA/MOH, BCPS), and Faculty Mentors.  
> **Tech Stack**: Next.js 15 (Pages Router), React 19, TypeScript, Tailwind CSS, Supabase (PostgreSQL, Auth, RLS, Realtime), jsPDF, QRCode.

---

## Table of Contents
1. [Core Academic Curriculum & Courseware](#1-core-academic-curriculum--courseware)
2. [Categorized Courses Catalog & Lead Magnet Engine](#2-categorized-courses-catalog--lead-magnet-engine)
3. [Interactive Practice Exam Simulator & Clinical Rationales](#3-interactive-practice-exam-simulator--clinical-rationales)
4. [Hybrid AI Clinical Pharmacology Assistant & Calculators](#4-hybrid-ai-clinical-pharmacology-assistant--calculators)
5. [Automated Verifiable PDF Certificates & Public Verification](#5-automated-verifiable-pdf-certificates--public-verification)
6. [5-Tier Division Gamification & Multi-Scope Leaderboards](#6-5-tier-division-gamification--multi-scope-leaderboards)
7. [Student Command Center & Daily Pharmacology Challenge](#7-student-command-center--daily-pharmacology-challenge)
8. [In-Lecture Timestamped Clinical Notes Drawer](#8-in-lecture-timestamped-clinical-notes-drawer)
9. [Course Classroom Discussion Hub](#9-course-classroom-discussion-hub)
10. [Faculty Gradebook, Roster Analytics & Drop-off Funnels](#10-faculty-gradebook-roster-analytics--drop-off-funnels)
11. [Dynamic In-App Marketing Engine & Top Announcement Bar](#11-dynamic-in-app-marketing-engine--top-announcement-bar)
12. [Bilingual Internationalization (EN / AR) & Accessibility](#12-bilingual-internationalization-en--ar--accessibility)

---

## 1. Core Academic Curriculum & Courseware
- **Structured Syllabus Hierarchy**: Organizes clinical pharmacology into modules, sequential video lectures, and post-lecture assessment checkpoints.
- **Adaptive Video Player (`YouTubePlayer.tsx`)**: Synchronized time tracking, playback rate persistence, responsive aspect ratio container, and progress event listeners.
- **Sequential Lesson Navigation**: Automatic next-lecture routing, completed lesson checkmarks, and dynamic course sidebar progress indicators.
- **Granular Course Access Policies**: Supports open access, guest lead magnet preview, student-only enrollments, and mentor-gated curricula.

---

## 2. Categorized Courses Catalog & Lead Magnet Engine
- **Categorized Discovery Portal (`/courses`)**:
  - Filter by high-yield clinical domains: Cardiovascular, Clinical Pharmacokinetics, Oncology, Antimicrobial Stewardship, Endocrine/Diabetes, and Neuro/Psych.
  - Filter by difficulty level: Beginner, Intermediate, Advanced.
  - Keyword search across bilingual titles, therapeutic descriptions, and clinical objectives.
  - Multi-attribute sorting: Most Popular, Newest First, Difficulty Level, and Total Duration.
  - Instant Layout Switcher: Responsive switch between multi-column Grid View and detailed List View.
- **Lead Magnet & Free Preview Mode (`LeadMagnetModal.tsx`)**:
  - Unauthenticated guests can preview designated introductory lectures and sample quizzes.
  - Non-intrusive modal triggers upon preview completion prompting free registration to preserve progress.

---

## 3. Interactive Practice Exam Simulator & Clinical Rationales
- **Dual Examination Modes (`/quiz/[id]`)**:
  - **Standard Exam Mode**: Strict timer countdown, final score grading, single attempt recording, and passing threshold enforcement.
  - **Untimed Practice Mode**: Immediate per-question feedback upon answer selection.
- **Instant Clinical Explanations (`ClinicalRationaleCard.tsx`)**:
  - Explains the exact pharmacological mechanism why the chosen option is correct or incorrect.
  - Cites standard clinical practice guidelines (e.g. ACC/AHA HF Guidelines, KDIGO, IDSA Antimicrobial Guidelines).
- **Admin Question Authoring (`AdminModals.tsx`)**:
  - Support for bilingual question stems, 4 randomized answer options, difficulty tagging (Easy, Medium, Hard), clinical explanation text, and reference citations.

---

## 4. Hybrid AI Clinical Pharmacology Assistant & Calculators
- **Context-Aware Drawer (`ClinicalAssistantDrawer.tsx` / `ClinicalWorkspace.tsx`)**:
  - Floats inside lecture and study pages, automatically loading the active lecture topic and syllabus objectives into context.
- **Evidence-Based Dose & Clearance Calculators (`lib/clinicalCalculators.ts`)**:
  - **Cockcroft-Gault Creatinine Clearance (CrCl)**: Normalizes serum creatinine, age, gender (0.85 coefficient), and weight to classify CKD staging (1 to 5) and output renal dose adjustment guidelines.
  - **Pediatric Dose Calculator**: Evaluates mg/kg/day regimens with automatic adult maximum dose capping.
  - **Drug-Drug Interaction (DDI) Checker**: Detects critical cytochrome P450 inhibition/induction, QT prolongation risks, and contraindicated drug pairs (e.g., Clopidogrel + Omeprazole, Simvastatin + Clarithromycin).
- **Consultation Endpoint (`/api/ai/consult`)**: Secure edge function routing clinical queries with structured JSON responses.

---

## 5. Automated Verifiable PDF Certificates & Public Verification
- **Strict Mastery Criteria Engine (`lib/certificates.ts`)**:
  - Evaluates student eligibility: exactly 100% lecture watch completion + >= 80% aggregate quiz average.
- **Cryptographic Certificate Code Generation**: Generates collision-resistant, URL-safe 10-character alphanumeric verification codes (e.g. `PC-A7B2-C9F1`).
- **High-Resolution Vector PDF Generator (`lib/certificatePdf.ts`)**:
  - Uses `jspdf` to render bordered credentials with gold foil seal vector styling, dynamic recipient name, course title, completion date, and embedded QR code.
- **Public Verification Portal (`/verify/[code]`)**:
  - Publicly accessible page enabling universities, employers, and licensure boards to verify certificate authenticity, issue date, and grade standing.

---

## 6. 5-Tier Division Gamification & Multi-Scope Leaderboards
- **5-Tier Division Leagues (`lib/gamification.ts`)**:
  - **Bronze**: 0 – 499 XP
  - **Silver**: 500 – 1,499 XP
  - **Gold**: 1,500 – 3,499 XP
  - **Platinum**: 3,500 – 6,999 XP
  - **Diamond**: 7,000+ XP
- **Circular SVG Progress Rings (`CircularProgressRing.tsx`)**:
  - Mathematically computed stroke-dasharray animations showing real-time tier progression and milestone proximity.
- **Multi-Scope Leaderboard Portal (`/leaderboard`)**:
  - **Global Scope**: All active students across all institutions.
  - **University Scope**: Scoped to the student's enrolled university cohort.
  - **Classroom / Course Scope**: Scoped to peers in a specific course.
  - **Timeframe Filters**: Weekly Season Standings (with Sunday countdown reset) and All-Time Hall of Fame.
  - **Top 3 Podium (`LeaderboardPodium.tsx`)**: Animated Gold, Silver, and Bronze pedestal display.

---

## 7. Student Command Center & Daily Pharmacology Challenge
- **Student Dashboard (`/dashboard`)**:
  - Personalized greeting with study streak counter, live division badge, and quick learning metrics.
  - **Active Courses Resume Bar**: Displays enrolled courses, completion percentage progress bar, and 1-click continue playback button.
- **Daily Pharmacology Challenge ("Drug of the Day") (`DailyChallengeCard.tsx`)**:
  - Deterministic 24-hour question bank rotation granting +25 XP rewards.
  - Instant clinical rationales and key takeaway clinical pearls.

---

## 8. In-Lecture Timestamped Clinical Notes Drawer
- **In-Player Slide-Over Notes Drawer (`InLectureNotesDrawer.tsx`)**:
  - Timestamp capture: Click-to-capture active video timestamp (e.g., `04:15`).
  - Interactive video seeking: Clicking any note timestamp seeks the video player to that exact second.
  - Clinical Note Tagging: Classifies notes as `[Clinical Pearl]`, `[Contraindication/Warning]`, `[High-Yield Exam Focus]`, or `[Mechanism of Action]`.
- **Instant Export Engine (`lib/notesExport.ts`)**:
  - Export to structured **Markdown** format with timestamp badges.
  - Export to print-ready **PDF Document** with clean clinical typography.

---

## 9. Course Classroom Discussion Hub
- **Course-Level Discussion Forum (`ClassroomDiscussionHub.tsx`)**:
  - Categorized threads: Clinical Cases & Drug Therapy, Mnemonics & Memory Aids, Exam Strategies, and General Licensure Prep.
  - Peer interaction: Upvoting questions and answers, threaded replies, and real-time reply counts.
  - **Verified Faculty Solution Badge**: Highlights instructor-verified answers at the top of the thread.

---

## 10. Faculty Gradebook, Roster Analytics & Drop-off Funnels
- **Faculty Gradebook Matrix (`FacultyGradebook.tsx`)**:
  - Student roster matrix listing lecture watch percentages, individual quiz scores, aggregate averages, and certificate eligibility.
  - Cohort and university search filters.
  - 1-Click RFC-4180 compliant CSV Export (`lib/gradebookExport.ts`).
- **Curriculum Analytics Dashboard (`AnalyticsDashboard.tsx`)**:
  - Lecture Drop-off Funnel: Detects difficult or lengthy lectures where student engagement declines.
  - Question Difficulty Heatmap: Flags questions with high error rates for curriculum review.

---

## 11. Dynamic In-App Marketing Engine & Top Announcement Bar
- **Top Promo Announcement Bar (`TopPromoBanner.tsx`)**:
  - Frosted glass banner with live campaign countdown timer, target course CTA link, and 1-click coupon copy pill.
  - Fully managed in Admin CMS (`SiteContentManager.tsx`).
- **Feature Flagging Matrix (`lib/featureFlags.ts`)**:
  - Real-time global toggles for all modules (`practice_mode`, `ai_assistant`, `certificates`, `leaderboards`, `discussions`, `notes_drawer`).
  - Per-course granular overrides in course editor.

---

## 12. Bilingual Internationalization (EN / AR) & Accessibility
- **Full Bilingual Parity**: Instant English <-> Arabic language switching with complete RTL (Right-to-Left) layout flipping.
- **Glassmorphism Design System**: Dark/Light mode theme switching, frosted glass translucent surfaces (`backdrop-blur-xl`), subtle gradient borders, and high-contrast text ratios.
- **Pure Vector Iconography**: 100% clean SVG icons from `react-icons/fi`, `react-icons/fa6`, and `lucide-react` with zero emojis.
- **Full Mobile Responsiveness**: Fluid layouts verified across viewports from 320px to 4K displays.
