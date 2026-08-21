# Phase 3: In-App Marketing, Categorized Catalog, Daily Challenge, Gamification Leagues & Social Learning

## 1. Phase Overview & Strategic Objectives

- **Timeframe**: August 21, 2026 (Expansion Engineering Suite)
- **Primary Authors**: PharmaCore Engineering Team
- **Net Diff Volume**: 18 new components & modules, +14,800 lines added

Phase 3 transformed PharmaCore into a high-engagement, gamified clinical learning ecosystem. By combining conversion-focused marketing tools, an intuitive course catalog, a 5-tier Division League system, daily spaced repetition challenges, in-lecture timestamped clinical note-taking, and peer classroom discussions, Phase 3 created an immersive experience for healthcare students and professionals.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              PHASE 3 EXPANSION ARCHITECTURE                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   ┌────────────────────────────────┐            ┌──────────────────────────────────┐   │
│   │     Marketing & Acquisition    │            │     Course Catalog (/courses)    │   │
│   │   • TopPromoBanner (Discounts) │            │     • 8 Organ System Filters     │   │
│   │   • LeadMagnetModal (Top 200)  │ ──>        │     • Difficulty & Exam Tags     │   │
│   │   • 1-Click Clipboard Voucher  │            │     • Grid / List Layout Switch  │   │
│   └────────────────────────────────┘            └──────────────────────────────────┘   │
│                   │                                               │                    │
│                   ▼                                               ▼                    │
│   ┌────────────────────────────────┐            ┌──────────────────────────────────┐   │
│   │  5-Tier Division Leagues (XP)  │            │    Daily Clinical Challenge      │   │
│   │   • Bronze (0-499 XP)          │            │    • "Drug of the Day" Spaced    │   │
│   │   • Silver (500-1499 XP)       │ ──>        │    • Deterministic Day Hash      │   │
│   │   • Gold (1500-3499 XP)        │            │    • +25 XP Daily Study Streak   │   │
│   │   • Platinum (3500-6999 XP)    │            │    • Clinical Pearls & Evidence  │   │
│   │   • Diamond (7000+ XP)         │            └──────────────────────────────────┘   │
│   │   • /leaderboard & 3D Podium   │                              │                    │
│   └────────────────────────────────┘                              │                    │
│                   │                                               │                    │
│                   ▼                                               ▼                    │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │                     In-Lecture Active & Social Learning                        │   │
│   │   • ClassroomDiscussionHub: Threaded Q&A, Upvotes (+10 XP), Verified Badges    │   │
│   │   • InLectureNotesDrawer: Timestamped Video Sync, Clinical Tags, MD/JSON Export│   │
│   │   • Unified Student Command Center Dashboard (/dashboard)                      │   │
│   └────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Feature Modules & Detailed Implementations

### 2.1 In-App Marketing Engine
1. **Top Promotional Banner (`components/TopPromoBanner.tsx`)**:
   - Sticky top bar announcing promotional campaigns and board review discount codes.
   - Features a countdown timer, discount badge (`e.g., PHARMA30`), 1-click clipboard copy with animated visual confirmation, and CTA navigation link.
   - Fully customizable via the Admin CMS.
2. **Lead Magnet Modal (`components/LeadMagnetModal.tsx`)**:
   - High-yield clinical pharmacology guide download modal (e.g. *"Top 200 Drugs Dosing & Antidotes Clinical Handbook"*).
   - Captures prospective student emails and names, triggering instant simulated downloads while converting guest visitors into enrolled students.

### 2.2 Standalone Categorized Course Catalog (`pages/courses.tsx`)
- **Organ System Multi-Filter**: Cardiovascular, Antimicrobial, CNS & Psychopharmacology, Endocrine & Metabolic, Renal, Oncology, and Pediatric/Neonatal.
- **Difficulty Multi-Filter**: Introductory, Intermediate, and Advanced.
- **Target Licensing Exam Tags**: NAPLEX, USMLE Step 1/2, BCPS, PEBC, FPGEE, DHA/MOH.
- **Real-Time Search & View Switcher**: Instant keyword filtering across English and Arabic titles/descriptions with toggle between high-density grid cards and detailed list rows (`components/CourseGridList.tsx`).

### 2.3 Daily Clinical Challenge ("Drug of the Day")
- **Implementation**: `lib/dailyChallenge.ts` & `components/gamification/DailyChallengeCard.tsx`.
- **Mechanics**:
  - Deterministic daily hashing algorithm selects a high-yield clinical case question based on the calendar date:
    $$\text{hash} = \left( \sum_{i=0}^{n-1} (\text{hash} \times 31 + \text{charCode}(i)) \right) \bmod \text{bankLength}$$
  - Awards **+25 XP** upon correct answer.
  - Automatically updates and extends active study streaks.
  - Provides bilingual question prompts, distractor rationales, clinical pearls, and guideline citations (e.g. ADA/AHA Heart Failure Guidelines, ANNEXA-4 study).

### 2.4 5-Tier Division League Gamification Engine
- **Implementation**: `lib/gamification.ts`, `components/gamification/DivisionBadge.tsx`, `components/gamification/LeaderboardPodium.tsx`, `components/gamification/LeaderboardTable.tsx`, and `pages/leaderboard.tsx`.
- **XP Economy Structure**:
  - Lecture Completion: **+50 XP**
  - Quiz Pass ($\ge 80\%$): **+100 XP**
  - Perfect Quiz Score (100%): **+50 XP Bonus** (Total 150 XP)
  - Daily Clinical Challenge: **+25 XP**
  - Certificate Issuance: **+200 XP**
  - Discussion Post Upvote: **+10 XP**
- **Division Tiers & Thresholds**:

| Division Tier | XP Threshold | Badge Color | Metallic Theme Styling |
|---|---|---|---|
| **Bronze League** | 0 – 499 XP | Amber / Bronze | `from-amber-700/20 to-amber-900/30`, `border-amber-600/30` |
| **Silver League** | 500 – 1,499 XP | Slate / Silver | `from-slate-400/20 to-slate-600/30`, `border-slate-400/30` |
| **Gold League** | 1,500 – 3,499 XP | Gold / Amber | `from-yellow-500/20 to-amber-600/30`, `border-yellow-400/40` |
| **Platinum League** | 3,500 – 6,999 XP | Cyan / Electric Blue | `from-cyan-500/20 to-blue-600/30`, `border-cyan-400/40` |
| **Diamond League** | 7,000+ XP | Amethyst / Violet | `from-purple-500/20 to-pink-600/30`, `border-purple-400/40` |

- **Multi-Scope Leaderboard**:
  - **Global Scope**: Global ranking across all registered clinicians.
  - **University / Cohort Scope**: Filter by medical/pharmacy university (e.g. King Saud University, Cairo University, Ain Shams, Jordan University of Science and Technology).
  - **Course Scope**: Filter by enrolled course cohort.
  - **3D Podium**: Visual 1st, 2nd, and 3rd place podium with avatar badges, crown icons, and division indicators.
  - **Sticky User Highlight**: Pinned row showing current student rank, XP gap to next rank, and division status.

### 2.5 Circular SVG Progress Rings
- **Implementation**: `components/gamification/CircularProgressRing.tsx` & `lib/gamification.ts`.
- **Trigonometric Formula**:
  $$\text{Normalized Radius } r_n = r - \frac{\text{strokeWidth}}{2}$$
  $$\text{Circumference } C = 2 \times \pi \times r_n$$
  $$\text{Stroke Dashoffset } = C \times \left( 1 - \frac{\text{progressPercent}}{100} \right)$$
- Displays smooth SVG animated progress rings on course cards, student dashboards, and profile badges.

### 2.6 In-Lecture Interactive Social Learning
1. **Classroom Discussion Hub (`components/classroom/ClassroomDiscussionHub.tsx`)**:
   - Threaded Q&A drawer situated directly beneath lecture video theaters.
   - Markdown rendering for chemical equations and drug names.
   - Upvoting mechanism awarding **+10 XP** to helpful contributors.
   - Faculty-verified solution badges highlighting authoritative instructor responses.
2. **Timestamped In-Lecture Notes Drawer (`components/notes/InLectureNotesDrawer.tsx`, `lib/notesExport.ts`)**:
   - Floating slide-over drawer enabling students to type timestamped clinical notes during video playback.
   - Clicking a timestamp (`MM:SS`) instantly seeks the YouTube video to the exact lecture second.
   - Clinical Tagging: *Clinical Pearl*, *Contraindication / Warning*, *Dosing Algorithm*, *Exam High-Yield*.
   - **Export Engine**: 1-click export of the entire lecture notebook to structured Markdown (`.md`) or formatted JSON (`.json`).

### 2.7 Student Command Center Dashboard (`pages/dashboard.tsx`)
- Centralized hub aggregating active study streak, resume playback shortcuts, daily challenge widget, division standing, and enrolled courses.
