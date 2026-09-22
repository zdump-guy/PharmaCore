# Page Views & Routes Reference (All 14 Views)

This document details the functionality, state management, data dependencies, and layout structure for all 14 pages/views in PharmaCore.

---

## 1. Public Pages

### 1.1 Homepage (`pages/index.tsx`)
- **Route**: `/`
- **Purpose**: Landing page showcasing featured pharmacy courses, platform mission, interactive features, student testimonials, and feedback CTA.
- **Data Fetching**: `getStaticProps` with `revalidate: 60` (ISR) fetching public courses from `public.courses`.
- **Key Sections**: Hero Section, Course Catalog Grid, Key Features (Audio notes, interactive quizzes, community Q&A), Feedback Section.

---

### 1.2 Course Syllabus View (`pages/course/[id].tsx`)
- **Route**: `/course/[id]`
- **Purpose**: Displays course details, prerequisites, objectives, assigned mentor profile, and sequential lecture syllabus.
- **Access Gating**: Detects `is_locked` and `access_policy`. For locked courses, prompts non-enrolled students with an "Enrollment Request" dialog.
- **Data Fetching**: `getServerSideProps` fetching course details and child lectures ordered by `"order" ASC`.

---

### 1.3 Lecture Study & Discussion Hub (`pages/lecture/[id].tsx`)
- **Route**: `/lecture/[id]`
- **Purpose**: Core interactive learning interface.
- **Features**:
  - Embedded YouTube Player (`YouTubePlayer.tsx`).
  - Custom Multi-Track Audio Player (`CustomAudioPlayer.tsx`) for voice notes.
  - Resource Download Section (PDFs and images with modal preview).
  - Quizzes Navigation Button.
  - Live Community Q&A Forum with question submission form and instructor inline reply cards.

---

### 1.4 Interactive Assessment View (`pages/quiz/[id].tsx`)
- **Route**: `/quiz/[id]`
- **Purpose**: Step-by-step quiz runner.
- **Features**: Real-time score calculation, immediate answer explanations, and integrated modal viewers for Quiz PDF and Solution PDF files.

---

### 1.5 Unified Login & Student Signup (`pages/login.tsx`)
- **Route**: `/login`
- **Purpose**: Centralized authentication portal with tabbed views for Student Login, Staff Login, and Student Registration.
- **Security**: Protected by Cloudflare Turnstile bot challenges.

---

### 1.6 Student Profile & Notification Center (`pages/profile.tsx`)
- **Route**: `/profile`
- **Purpose**: Authenticated student dashboard.
- **Tabs**:
  1. **Profile Info**: Editable university, faculty, and phone number fields.
  2. **My Enrollments**: Status of requested course cohorts (Pending / Active / Rejected).
  3. **My Questions**: Personal community questions and instructor answer threads.
  4. **Notifications**: Unread notification counter with single-click mark-as-read.
  5. **Preferences**: Email notification toggle.

---

### 1.7 Feedback & Bug Reporting (`pages/feedback.tsx`)
- **Route**: `/feedback`
- **Purpose**: Public bug report and academic feedback submission portal.
- **Features**: Automatic device telemetry capture (OS, browser, viewport), severity selector, Turnstile token verification.

---

## 2. Administrative Pages

### 2.1 Admin Staff Login (`pages/admin/login.tsx`)
- **Route**: `/admin/login`
- **Purpose**: Dedicated staff entrance redirecting directly to `/admin` upon successful authentication.

### 2.2 Administrative Control Center (`pages/admin/index.tsx`)
- **Route**: `/admin`
- **Access**: Gated to `dev`, `super_admin`, and `mentor`.
- **Managers**:
  - `CurriculumManager.tsx` (Courses, lectures, quizzes, audio records).
  - `CourseEnrollmentManager.tsx` (Student cohort triage).
  - `StudentManager.tsx` (Student directory).
  - `UserManager.tsx` (Staff account management).
  - `CommunityManager.tsx` (Global Q&A moderation).
  - `FeedbackManager.tsx` (Bug report triage).
  - `SiteContentManager.tsx` (CMS headlines & FAQs).
  - `AnalyticsDashboard.tsx` (Traffic and completion statistics).
  - `DeveloperConsole.tsx` (Dev health diagnostics).

---

## 3. System & Error Views

- `pages/_app.tsx`: Application shell wrapping `AuthProvider`, `ThemeProvider`, `SiteContentProvider`, and Vercel Analytics.
- `pages/_document.tsx`: HTML document structure injecting font preconnects and metadata.
- `pages/404.tsx`: Custom branded 404 Not Found page.
- `pages/500.tsx`: Custom branded 500 Server Error page.
- `pages/_error.tsx`: Catch-all Next.js rendering error handler.
- `pages/sitemap.xml.ts`: Dynamic sitemap generator indexing public courses and lectures for search engines.
