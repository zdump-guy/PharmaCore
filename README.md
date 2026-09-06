# PharmaCore — Clinical Pharmacology & Medical Education Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.2.0%20(Pages%20Router)-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.19-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%2015+-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![Radix UI](https://img.shields.io/badge/Radix%20UI-Accessible%20Primitives-161618?style=flat-square&logo=radix-ui)](https://www.radix-ui.com/)
[![PWA](https://img.shields.io/badge/PWA-Desktop%20%26%20Mobile-5A0FC8?style=flat-square&logo=pwa)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

PharmaCore is a bilingual, cloud-native Clinical Pharmacology and Medical Education Learning Management System (LMS) designed for medical residents, clinical pharmacology students, and faculty mentors. The platform delivers structured clinical curriculum modules, interactive multi-format assessments, synchronized bilingual video instruction, privacy-hardened community discussion, and granular cohort administration.

---

## Table of Contents

1. [Header & Project Overview](#header--project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Key System Capabilities](#key-system-capabilities)
4. [Security Architecture & Data Protection](#security-architecture--data-protection)
5. [Complete Database Schema Reference](#complete-database-schema-reference)
6. [API Route Catalog](#api-route-catalog)
7. [Environment Variables Reference](#environment-variables-reference)
8. [Local Development Setup](#local-development-setup)
9. [Testing & Quality Assurance](#testing--quality-assurance)
10. [Production Deployment Guide](#production-deployment-guide)

---

## 1. Header & Project Overview

PharmaCore bridges clinical pharmacology theory and diagnostic bedside application through an evidence-based pedagogical curriculum. Tailored for healthcare academic institutions, medical faculties, and clinical training programs, PharmaCore provides an enterprise learning environment with:

- **Target Audience**: Clinical pharmacy candidates, medical undergraduates, postgraduate pharmacology residents, clinical fellows, and academic faculty mentors.
- **Pedagogical Scope**: Pharmacokinetics, pharmacodynamics, clinical toxicology, drug-drug interactions, antimicrobial stewardship, therapeutic drug monitoring, and patient-specific dosage regimens.
- **Bilingual Delivery**: Native English (`en`) and Arabic (`ar`) instruction with synchronized bidirectional UI typography cascade (`Inter` and `Tajawal`).
- **Academic Governance**: Multi-tier role-based access control (`student`, `mentor`, `super_admin`, `dev`) enforcing institutional approval workflows and content curation.

---

## 2. Architecture & Tech Stack

PharmaCore is built on a resilient, high-performance web architecture combining the **Next.js Pages Router**, React 19, Supabase PostgreSQL, and modern browser standards.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             Client Layer                                 │
│  Next.js Pages Router (SSR/SSG) • React 19 • Tailwind CSS • Radix UI     │
│  Bilingual RTL/LTR Engine (next-i18next) • PWA Service Worker (Offline)  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
        [Public / Read Routes]             [Sensitive Mutations]
                    │                                 │
                    ▼                                 ▼
┌───────────────────────────────────────┐  ┌─────────────────────────────────┐
│     Supabase Client (Anon Key)        │  │     Next.js API Routes          │
│   Direct PostgreSQL queries over RLS  │  │   pages/api/** (Node.js)        │
│   • courses, lectures, resources      │  │   • Token-Bucket Rate Limiter   │
│   • public quizzes, site content      │  │   • Strict Zod Input Validation │
│   • analytics event streams           │  │   • Cloudflare Turnstile Bot Guard│
└───────────────────┬───────────────────┘  └────────────────┬────────────────┘
                    │                                       │
                    │         ┌─────────────────────────────┘
                    │         │ (Service Role Secret)
                    ▼         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   Supabase Managed Cloud Backend                         │
│  PostgreSQL 15+ Database • Row Level Security (RLS) Policies             │
│  Security Definer Functions • Auth Trigger Engine • Realtime Replication │
│  UploadThing File CDN • Cloudflare Turnstile Verification API            │
└──────────────────────────────────────────────────────────────────────────┘
```

### Core Technologies

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js (Pages Router) | `^15.2.0` | Server-Side Rendering (SSR), Static Generation (SSG), API endpoints |
| **UI Library** | React | `^19.0.0` | Declarative UI component architecture with strict hydration safety |
| **Language** | TypeScript | `^5.0.0` | Strict static typing, type guards, and interface contracts |
| **Styling** | Tailwind CSS | `^3.4.19` | Utility-first responsive CSS, dark/light theme tokens, RTL logical properties |
| **Component Primitives** | Radix UI | Latest | Headless accessible components (Dialog, Accordion, Select, Tabs) |
| **Internationalization** | `next-i18next` / `i18next` | `^16.0.10` | Locales (`en`, `ar`), translation namespaces, bidirectional direction switching |
| **Database & Auth** | Supabase (PostgreSQL) | `^2.112.3` | Relational storage, Auth triggers, non-recursive RLS, Realtime |
| **Validation** | Zod | `^4.4.3` | Strict runtime schema validation for API request bodies and queries |
| **Asset Storage** | UploadThing | `^7.7.4` | Role-gated cloud media uploads (thumbnails, PDFs, lecture attachments) |
| **Bot Mitigation** | Cloudflare Turnstile | v0 API | Invisible/managed cryptographic challenge on sensitive forms |
| **PWA Engine** | Service Worker + Manifest | Web Standard | Offline caching, app-like standalone display, window controls overlay |

---

## 3. Key System Capabilities

### 3.1 Bilingual Course & Curriculum Delivery
- **Hierarchical Syllabus Tree**: Curriculums are organized into structured courses, syllabus modules, sequential lectures, downloadable clinical resources, and modular quizzes.
- **Dynamic Directionality (RTL / LTR)**: Layouts dynamically switch text alignment, icon placement, and chevron direction (`ps-`, `pe-`, `start-`, `end-`) based on current locale (`/` vs `/ar`).
- **Interactive Lecture Player**: Embedded video player featuring custom playback speed toggles (0.75x to 2.0x), quality selection, persistent timestamps, and lecture notes tab.
- **Cross-Lecture Navigation**: Synchronized previous/next navigation controls with boundary detection (disabling previous on first lecture, advancing to final quiz on last lecture).

### 3.2 Interactive Clinical Pharmacology Quizzes
- **Formative Self-Evaluation**: Single-choice, multiple-choice, true/false, and short-answer clinical diagnostic question types.
- **Real-Time Scoring & Rationales**: Immediate score computation, question breakdown, and detailed clinical explanations for correct and incorrect answer choices.
- **Onward Curriculum Progression**: Direct deep-linking from quiz results back to the parent course syllabus or advancing to subsequent modules.

### 3.3 Privacy-Hardened Community Q&A
- **In-Lecture Clinical Discussions**: Students can post targeted questions tied directly to specific lecture timestamps or clinical concepts.
- **Mentor Verification**: Responses from verified faculty mentors and administrators display verified badges and official designations.
- **Column-Level Privacy**: Student author email addresses are completely isolated via PostgreSQL Column Level Security, shielding personal contact information from peer students and public crawlers.

### 3.4 Progressive Web App (PWA) Desktop & Mobile Support
- **Application Shell Caching**: Service worker precaches essential static assets, stylesheets, fonts, and core views for resilient offline loading.
- **Native Desktop Installation**: Custom desktop install prompt (`InstallAppModal`) supporting Window Controls Overlay (WCO), standalone launch mode, and customized icons.
- **Mobile Standalone Experience**: Full-screen mobile support with iOS Safari home-screen instructions and custom theme colors.

### 3.5 Staff Administration Console (`/admin`)
The comprehensive administrative dashboard features dynamic code-splitting via `next/dynamic` with dedicated loading skeletons, isolating 8 management modules:
- **AnalyticsDashboard**: Telemetry streams, visitor sessions, video play metrics, quiz completion ratios, and pedagogical alerts.
- **CurriculumManager**: Course authoring, module ordering, lecture creation, video linking, and resource attachment.
- **CommunityManager**: Q&A moderation, unanswered question queues, mentor response authoring, and thread resolution.
- **UserManager**: Role assignment (`student`, `mentor`, `super_admin`, `dev`), account suspension, password resets, and user creation.
- **StudentManager**: Student directory, enrollment request triage, batch approvals, rejection notices, and academic profile inspection.
- **SiteContentManager**: Live CMS editing for bilingual landing page content, FAQs, announcements, and maintenance mode toggling.
- **FeedbackManager**: Real-time bug reports and academic feedback queue with status workflows, telemetry inspection, and resolution tracking.
- **DeveloperConsole**: Database connection diagnostics, cache clearing, system telemetry, and schema health auditing.
- **AdminModals**: Asset uploaders and sensitive state change confirmation dialogs.

### 3.6 Accessible Semantic Navigation
- **Semantic Breadcrumbs**: Fully accessible `<nav aria-label="Breadcrumb">` structure across all nested views (`/course/[id]`, `/lecture/[id]`, `/quiz/[id]`, `/profile`, `/admin`) using `<ol>`, `<li>`, and `aria-current="page"` on current items.
- **RTL Chevron Mirroring**: Automatic icon flipping ensuring logical directional flow in right-to-left Arabic layouts.

---

## 4. Security Architecture & Data Protection

PharmaCore implements defense-in-depth security principles across transport, authentication, authorization, and database layers.

```
                    Security Architecture Hierarchy
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. Transport & Edge Security                                            │
│    • HSTS (max-age=63072000; includeSubDomains; preload)                │
│    • X-Frame-Options: DENY (Clickjacking prevention)                    │
│    • X-Content-Type-Options: nosniff (MIME sniffing prevention)         │
│    • Permissions-Policy: camera=(), mic=(), geo=(), browsing-topics=()  │
│    • productionBrowserSourceMaps: false (Source code obfuscation)       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. Application & API Gateway Protection                                 │
│    • In-Memory Sliding-Window Token Bucket Rate Limiter (lib/rateLimit) │
│      - 5 req/min on /api/students/signup                                │
│      - 10 req/min on /api/courses/[id]/enroll & /api/questions/submit   │
│      - 15 req/min on /api/admin/users/create                            │
│      - Standard RFC headers: X-RateLimit-Limit, Remaining, Retry-After  │
│    • Cloudflare Turnstile bot verification on signup, enroll, Q&A       │
│    • Strict Zod runtime validation schema on all incoming payloads      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. Secret Isolation & Authorization                                     │
│    • Client: Limited to NEXT_PUBLIC_SUPABASE_ANON_KEY                   │
│    • Server: SUPABASE_SERVICE_ROLE_KEY strictly isolated to /pages/api  │
│    • UploadThing Media Router: Restricted to dev, super_admin, mentor   │
│    • Anti-tampering guard: lib/supabaseAdmin throws if imported client  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. Database Hardening (PostgreSQL 15+)                                  │
│    • Row Level Security (RLS) enabled on all 12 tables                  │
│    • Non-recursive role evaluation via public.get_user_role() (STABLE)  │
│    • Column Level Security (CLS): Revoked SELECT on author_email        │
│    • Enrollment Gating: Direct student inserts forced to 'pending'      │
│    • Privilege escalation guard: handle_new_user() defaults to 'student'│
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Security Guardrails
1. **Secret Isolation**: `SUPABASE_SERVICE_ROLE_KEY` is strictly confined to server-side API handlers (`pages/api/**`). `lib/supabaseAdmin.ts` validates that execution occurs exclusively in Node.js runtime environments, preventing service role credentials from ever being bundled into client JavaScript.
2. **Rate Limiting Engine (`lib/rateLimit.ts`)**: In-memory token bucket tracking with automatic background cleanup (evicting buckets inactive for >15 minutes). Exceeded thresholds yield HTTP `429 Too Many Requests` alongside `Retry-After`, `X-RateLimit-Limit`, and `X-RateLimit-Remaining` response headers.
3. **UploadThing Staff Authorization**: The file router middleware (`server/uploadthing.ts`) inspects incoming Supabase Auth Bearer tokens, rejecting non-staff attempts with `FORBIDDEN` before file transmission can commence.
4. **Column Level Security (CLS)**: The `author_email` column in `public.community_questions` has `SELECT` privileges revoked for `anon` and `authenticated` roles. Public clients receive only `id`, `lecture_id`, `author_name`, `text`, and `created_at`.
5. **Enrollment Gating**: RLS policies restrict direct student enrollments strictly to `status = 'pending'`. Only authorized staff can transition an enrollment to `'active'`, `'rejected'`, or `'completed'`.
6. **Source Map Elimination**: `productionBrowserSourceMaps: false` is configured in `next.config.js` to ensure zero `.map` files are generated or exposed in production deployments.

---

## 5. Complete Database Schema Reference

The canonical, idempotent database migration is maintained at `supabase/00_complete_production_schema.sql`. It defines all tables, relationships, constraints, indexes, triggers, and Row Level Security policies.

### 5.1 Tables Catalog (All 12 Core Tables)

#### 1. `public.users` (User Profiles)
Extends Supabase Auth (`auth.users`) to store student and staff academic profiles.
- `id` (UUID, PK) — References `auth.users(id) ON DELETE CASCADE`.
- `email` (TEXT, NOT NULL) — Primary contact email address.
- `full_name` (TEXT) — Full display name.
- `role` (TEXT, NOT NULL, DEFAULT `'student'`) — Role enum: `'dev' | 'super_admin' | 'mentor' | 'student'`.
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`) — Registration timestamp.
- `first_name` (TEXT) — Student first name.
- `last_name` (TEXT) — Student last name.
- `phone_number` (TEXT) — Contact phone number.
- `university` (TEXT) — University or institutional affiliation.
- `faculty` (TEXT) — Faculty, college, or department.
- `start_year` (INTEGER) — Academic entry year.
- `predicted_end_year` (INTEGER) — Projected graduation year.
- `status` (TEXT, DEFAULT `'active'`) — Account status: `'active' | 'pending' | 'suspended' | 'needs_setup'`.
- `must_change_password` (BOOLEAN, DEFAULT `false`) — Temporary password flag for admin-provisioned accounts.

#### 2. `public.courses`
Curriculum courses representing distinct clinical pharmacology domains.
- `id` (UUID, PK, DEFAULT `uuid_generate_v4()`) — Course identifier.
- `title_en` (TEXT, NOT NULL) — English title.
- `title_ar` (TEXT, NOT NULL) — Arabic title.
- `description_en` (TEXT) — English syllabus description.
- `description_ar` (TEXT) — Arabic syllabus description.
- `objectives_en` (TEXT) — Learning objectives in English.
- `objectives_ar` (TEXT) — Learning objectives in Arabic.
- `prerequisites_en` (TEXT) — Course prerequisites in English.
- `prerequisites_ar` (TEXT) — Course prerequisites in Arabic.
- `thumbnail_url` (TEXT) — Cover image CDN URL.
- `mentor_id` (UUID) — Assigned lead mentor, references `public.users(id) ON DELETE SET NULL`.
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`) — Creation timestamp.
- `is_locked` (BOOLEAN, DEFAULT `false`) — Course lock state.
- `access_policy` (TEXT, DEFAULT `'students_only'`) — Policy: `'open' | 'students_only' | 'enrolled_only'`.

#### 3. `public.lectures` (Modules & Lecture Units)
Individual pedagogical lecture units and curriculum modules within a course.
- `id` (UUID, PK, DEFAULT `uuid_generate_v4()`) — Lecture identifier.
- `course_id` (UUID, NOT NULL) — Parent course, references `public.courses(id) ON DELETE CASCADE`.
- `title_en` (TEXT, NOT NULL) — English lecture title.
- `title_ar` (TEXT, NOT NULL) — Arabic lecture title.
- `details_en` (TEXT) — Clinical lecture notes in English.
- `details_ar` (TEXT) — Clinical lecture notes in Arabic.
- `youtube_url` (TEXT, NOT NULL) — Video streaming URL.
- `"order"` (INTEGER, NOT NULL, DEFAULT `0`) — Sequential syllabus presentation order.
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`) — Creation timestamp.

#### 4. `public.resources`
Downloadable supplementary materials, clinical guides, and monographs.
- `id` (UUID, PK, DEFAULT `uuid_generate_v4()`) — Resource identifier.
- `lecture_id` (UUID, NOT NULL) — Parent lecture, references `public.lectures(id) ON DELETE CASCADE`.
- `title_en` (TEXT, NOT NULL) — English resource label.
- `title_ar` (TEXT, NOT NULL) — Arabic resource label.
- `url` (TEXT, NOT NULL) — Resource CDN URL.
- `type` (TEXT, NOT NULL, DEFAULT `'pdf'`) — Resource type: `'pdf' | 'image' | 'other'`.

#### 5. `public.quizzes`
Assessments tied to lectures or overall course milestones.
- `id` (UUID, PK, DEFAULT `uuid_generate_v4()`) — Quiz identifier.
- `title_en` (TEXT, NOT NULL) — English quiz title.
- `title_ar` (TEXT, NOT NULL) — Arabic quiz title.
- `lecture_id` (UUID) — Optional parent lecture, references `public.lectures(id) ON DELETE CASCADE`.
- `course_id` (UUID) — Optional parent course, references `public.courses(id) ON DELETE CASCADE`.
- `created_by` (UUID) — Authoring mentor, references `public.users(id) ON DELETE SET NULL`.
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`) — Creation timestamp.

#### 6. `public.questions`
Item bank questions associated with a quiz.
- `id` (UUID, PK, DEFAULT `uuid_generate_v4()`) — Question identifier.
- `quiz_id` (UUID, NOT NULL) — Parent quiz, references `public.quizzes(id) ON DELETE CASCADE`.
- `text_en` (TEXT, NOT NULL) — English question text.
- `text_ar` (TEXT, NOT NULL) — Arabic question text.
- `type` (TEXT, NOT NULL) — Question type: `'multiple_choice' | 'true_false' | 'short_text'`.
- `options` (JSONB) — Candidate answer options array.
- `correct_answer` (TEXT, NOT NULL) — Verified correct key or text.
- `"order"` (INTEGER, NOT NULL, DEFAULT `0`) — Display sequence order.

#### 7. `public.community_questions`
Student clinical queries posted under lecture discussions (protected by CLS).
- `id` (UUID, PK, DEFAULT `uuid_generate_v4()`) — Question identifier.
- `lecture_id` (UUID, NOT NULL) — Associated lecture, references `public.lectures(id) ON DELETE CASCADE`.
- `author_name` (TEXT, NOT NULL) — Student display name.
- `author_email` (TEXT, NOT NULL) — Student email (CLS restricted: inaccessible to anon/authenticated client SELECT).
- `text` (TEXT, NOT NULL) — Question inquiry body.
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`) — Submission timestamp.

#### 8. `public.community_answers`
Faculty mentor and staff answers to community questions.
- `id` (UUID, PK, DEFAULT `uuid_generate_v4()`) — Answer identifier.
- `question_id` (UUID, NOT NULL) — References `public.community_questions(id) ON DELETE CASCADE`.
- `responder_id` (UUID) — References `public.users(id) ON DELETE SET NULL`.
- `text` (TEXT, NOT NULL) — Answer content.
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`) — Timestamp.

#### 9. `public.mentor_course_assignments`
Junction table linking faculty mentors to their authorized courses.
- `mentor_id` (UUID, NOT NULL) — References `public.users(id) ON DELETE CASCADE`.
- `course_id` (UUID, NOT NULL) — References `public.courses(id) ON DELETE CASCADE`.
- `PRIMARY KEY (mentor_id, course_id)`.

#### 10. `public.site_content`
Bilingual CMS configuration storing landing page strings, FAQs, announcements, and enrollment settings.
- `id` (TEXT, PK) — Unique content block identifier (e.g., `'homepage_content'`, `'enrollment_settings'`).
- `content` (JSONB, NOT NULL, DEFAULT `'{}'::jsonb`) — Structured content document.
- `updated_by` (UUID) — References `public.users(id) ON DELETE SET NULL`.
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`) — Last modification timestamp.

#### 11. `public.course_enrollments` (Enrollments)
Student course registration and cohort progression tracking.
- `id` (UUID, PK, DEFAULT `gen_random_uuid()`) — Enrollment identifier.
- `user_id` (UUID, NOT NULL) — Enrolled student, references `public.users(id) ON DELETE CASCADE`.
- `course_id` (UUID, NOT NULL) — Target course, references `public.courses(id) ON DELETE CASCADE`.
- `status` (TEXT, NOT NULL, DEFAULT `'pending'`) — Status enum: `'active' | 'pending' | 'rejected' | 'completed'`.
- `enrolled_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `timezone('utc'::text, now())`) — Enrollment request timestamp.
- `UNIQUE(user_id, course_id)` — Prevents duplicate enrollments.

#### 12. `public.analytics_events`
Visitor telemetry and platform event stream.
- `id` (UUID, PK, DEFAULT `uuid_generate_v4()`) — Event identifier.
- `event_name` (TEXT, NOT NULL) — Telemetry action (e.g., `'page_view'`, `'video_play'`, `'quiz_submit'`).
- `properties` (JSONB, NOT NULL, DEFAULT `'{}'::jsonb`) — Event context (duration, score, locale).
- `distinct_id` (TEXT) — Anonymous or session identifier.
- `user_id` (UUID) — Authenticated user ID, references `public.users(id) ON DELETE SET NULL`.
- `url` (TEXT) — Browser URL route.
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`) — Event timestamp.

#### 13. `public.feedback_submissions`
Technical bug reports, visual layout issues, and academic pharmacology feedback submissions.
- `id` (UUID, PK, DEFAULT `uuid_generate_v4()`) — Unique feedback ticket identifier.
- `user_id` (UUID) — Submitting student ID if authenticated, references `public.users(id) ON DELETE SET NULL`.
- `feedback_type` (TEXT, NOT NULL) — Type enum: `'technical' | 'academic'`.
- `category` (TEXT, NOT NULL) — Category label (e.g., `'visual'`, `'playback'`, `'quiz_bug'`, `'scientific_accuracy'`).
- `page_url` (TEXT) — Contextual page route where issue occurred.
- `course_id` (UUID) — Associated course, references `public.courses(id) ON DELETE SET NULL`.
- `lecture_id` (UUID) — Associated lecture, references `public.lectures(id) ON DELETE SET NULL`.
- `title` (TEXT, NOT NULL) — Summary issue title.
- `description` (TEXT, NOT NULL) — In-depth description and expected behavior.
- `reproduction_steps` (TEXT) — Numbered steps to reproduce the issue.
- `severity` (TEXT, NOT NULL, DEFAULT `'medium'`) — Severity enum: `'low' | 'medium' | 'high' | 'critical'`.
- `device_info` (JSONB, DEFAULT `'{}'::jsonb`) — Client telemetry (OS, Browser, Screen, Viewport, UserAgent).
- `attachment_url` (TEXT) — Screenshot or external link URL.
- `academic_reference` (TEXT) — Medical citation, guideline, or textbook reference.
- `contact_email` (TEXT) — Submitter contact email for follow-up notifications.
- `contact_name` (TEXT) — Submitter name.
- `status` (TEXT, NOT NULL, DEFAULT `'open'`) — Workflow status: `'open' | 'under_review' | 'in_progress' | 'resolved' | 'dismissed'`.
- `admin_notes` (TEXT) — Internal engineering / mentor resolution notes.
- `resolved_by` (UUID) — Staff member who resolved the issue, references `public.users(id) ON DELETE SET NULL`.
- `resolved_at` (TIMESTAMPTZ) — Resolution timestamp.
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`) — Submission timestamp.
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`) — Last update timestamp.

---

### 5.2 Security Definer Functions & Triggers

1. **`public.get_user_role()`**:
   ```sql
   CREATE OR REPLACE FUNCTION public.get_user_role()
   RETURNS TEXT AS $$
     SELECT role FROM public.users WHERE id = auth.uid();
   $$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;
   ```
   *Purpose*: Executes with owner privileges in stable mode to retrieve the current user's role without triggering PostgreSQL recursive RLS evaluation (error code `42P17`).

2. **`public.handle_new_user()`**:
   ```sql
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.users (id, email, full_name, role)
     VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'student')
     ON CONFLICT (id) DO NOTHING;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
   ```
   *Purpose*: Triggered on `auth.users` insertion. Initializes the user profile in `public.users` with the role strictly defaulted to `'student'`, preventing privilege escalation via user metadata injection.

3. **`on_auth_user_created` Trigger**:
   ```sql
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   ```

---

### 5.3 High-Performance Indexing Structures (16 Indexes)

The schema establishes 16 dedicated B-tree indexes for fast queries across foreign keys, status filters, and time series:

| Index Name | Table | Columns / Expressions | Optimization Purpose |
|---|---|---|---|
| `lectures_course_id_idx` | `public.lectures` | `(course_id)` | Fast course syllabus lookup |
| `lectures_order_idx` | `public.lectures` | `(course_id, "order")` | Ordered syllabus lecture sequence |
| `resources_lecture_id_idx` | `public.resources` | `(lecture_id)` | Fast resource retrieval per lecture |
| `quizzes_lecture_id_idx` | `public.quizzes` | `(lecture_id)` | Lecture-level assessment lookup |
| `quizzes_course_id_idx` | `public.quizzes` | `(course_id)` | Course-level capstone assessment lookup |
| `questions_quiz_id_idx` | `public.questions` | `(quiz_id)` | Quiz item bank extraction |
| `cq_lecture_id_idx` | `public.community_questions`| `(lecture_id)` | Lecture Q&A thread retrieval |
| `community_answers_question_id_idx`| `public.community_answers`| `(question_id)` | Thread answer resolution |
| `course_enrollments_course_status_idx`| `public.course_enrollments`| `(course_id, status)` | Admin cohort filtering by status |
| `course_enrollments_user_status_idx`| `public.course_enrollments`| `(user_id, status)` | Student enrolled course lookup |
| `course_enrollments_status_idx`| `public.course_enrollments`| `(status)` | Pending registration queue queries |
| `course_enrollments_enrolled_at_idx`| `public.course_enrollments`| `(enrolled_at DESC)` | Chronological enrollment auditing |
| `idx_analytics_events_name` | `public.analytics_events` | `(event_name)` | Event telemetry aggregation |
| `idx_analytics_events_created_at`| `public.analytics_events` | `(created_at DESC)` | Time-series charting and range scans |
| `idx_analytics_events_distinct_id`| `public.analytics_events` | `(distinct_id)` | Unique visitor analytics counting |
| `idx_analytics_events_user_id`| `public.analytics_events` | `(user_id)` | Individual student engagement tracking |

---

## 6. API Route Catalog

The platform exposes 14 specialized API endpoints implemented in `pages/api/**`. All endpoints enforce Zod input validation, role checks, and rate limits.

| # | Endpoint Route | HTTP Methods | Auth Level & Role | Rate Limit Policy | Purpose & Zod Contract |
|---|---|---|---|---|---|
| 1 | `/api/admin/analytics` | `GET` | Bearer: `dev`, `super_admin`, `mentor` | Standard | Returns visitor timeseries, video plays, and pedagogical insights for `today`, `7d`, `30d`. |
| 2 | `/api/admin/settings/signup` | `GET`, `POST` | `GET`: Public / Staff<br>`POST`: `dev`, `super_admin` | Standard | Configures registration mode (`approval_required`, `open_registration`, `admin_provisioned`), universities, and faculties. |
| 3 | `/api/admin/students/enrollments`| `GET`, `POST`, `PATCH`, `DELETE` | Bearer: `dev`, `super_admin`, `mentor` | Standard | Manages student enrollments. Approves, rejects, or batch-assigns students to courses. |
| 4 | `/api/admin/students` | `GET`, `POST`, `DELETE` | Bearer: `dev`, `super_admin`, `mentor` | Standard | Student directory management: search, filter by university, suspend accounts, and bulk-provision. |
| 5 | `/api/admin/users/create` | `POST` | Bearer: `dev`, `super_admin` | **15 req / 60s** (`admin_users`) | Provisions staff accounts (`dev`, `super_admin`, `mentor`) with temporary credentials. |
| 6 | `/api/admin/users` | `GET`, `PATCH`, `DELETE` | Bearer: `dev`, `super_admin` | Standard | User administration: updates names, emails, roles, ban states, or deletes user accounts. |
| 7 | `/api/courses/[id]/enroll` | `GET`, `POST`, `DELETE` | Bearer: Authenticated Student | **10 req / 60s** (`enroll`) | Checks enrollment status (`GET`), submits enrollment request with Turnstile token (`POST`), or cancels (`DELETE`). |
| 8 | `/api/profile` | `GET`, `PUT` | Bearer: Authenticated User | Standard | Retrieves user profile and stats (`GET`) or updates bio, university, faculty, and year (`PUT`). |
| 9 | `/api/questions/answer` | `POST` | Bearer: `dev`, `super_admin`, `mentor` | Standard | Submits official faculty mentor answer to a community question. |
| 10 | `/api/questions/submit` | `POST` | Public / Student | **10 req / 60s** (`questions`) | Posts student clinical question with Turnstile bot verification. Shields email via CLS. |
| 11 | `/api/students/enrollments` | `GET` | Bearer: Authenticated Student | Standard | Fetches active enrolled courses with lecture completion ratios and progress metrics. |
| 12 | `/api/students/profile` | `GET`, `PUT` | Bearer: Authenticated Student | Standard | Reads student profile (`GET`) or updates academic fields and password credentials (`PUT`). |
| 13 | `/api/students/signup` | `POST` | Public (New Students) | **5 req / 60s** (`signup`) | Student registration endpoint with Turnstile token validation and approval queuing. |
| 14 | `/api/uploadthing` | `GET`, `POST` | Bearer: `dev`, `super_admin`, `mentor` | Standard | UploadThing file router handler for course images (max 4MB) and lecture resources (max 32MB). |

---

## 7. Environment Variables Reference

PharmaCore requires 8 environment variables defined in `.env.local` (mirroring `.env.local.example`).

| Variable Name | Scope | Required | Example / Format | Purpose |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | **Yes** | `https://your-id.supabase.co` | Supabase project API gateway URL for database and auth queries. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | **Yes** | `eyJhbGciOi...` | Supabase public anonymous API key for RLS-protected queries. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server Only** | **Yes** | `eyJhbGciOi...` | Supabase secret service role key for administrative mutations in `pages/api/**`. Never exposed to client. |
| `NEXT_PUBLIC_SITE_URL` | Client & Server | **Yes** | `https://pharma-core-edu.vercel.app` | Canonical site origin used for canonical `<link>`, hreflang alternates, OpenGraph metadata, and sitemaps. |
| `UPLOADTHING_TOKEN` | Server Only | **Yes** | `eyJhcGlLZXki...` | Primary UploadThing API token for authenticated media CDN asset storage. |
| `UPLOADTHING_SECRET` | Server Only | Optional | `sk_live_...` | Legacy fallback secret key for UploadThing server integration. |
| `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` | Client Only | **Yes** | `0x4AAAAAA...` | Cloudflare Turnstile public site key for rendering bot-challenge widgets. |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | Server Only | **Yes** | `0x4AAAAAA...` | Cloudflare Turnstile secret key for server-side token outcome verification. |

---

## 8. Local Development Setup

### 8.1 Prerequisites
- **Node.js**: `v20.0.0` or higher (Recommended: `v22.x LTS`)
- **Package Manager**: `npm` `v10.x` or higher
- **Supabase Account**: A Supabase cloud project or local Docker Supabase instance

### 8.2 Installation & Initialization

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-org/pharmacore.git
   cd pharmacore
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment template and supply your credentials:
   ```bash
   cp .env.local.example .env.local
   ```
   Open `.env.local` in your editor and provide valid Supabase, UploadThing, and Cloudflare Turnstile keys.

4. **Initialize the Database**:
   - Open your Supabase Project Dashboard -> **SQL Editor**.
   - Open `supabase/00_complete_production_schema.sql` in the repository.
   - Paste the SQL script into the editor and execute it.
   - Verify that all 12 tables, functions, triggers, and indexes are created successfully.

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at:
   - **English Interface**: [http://localhost:3000](http://localhost:3000)
   - **Arabic Interface**: [http://localhost:3000/ar](http://localhost:3000/ar)
   - **Staff Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 9. Testing & Quality Assurance

PharmaCore enforces an automated 4-tier verification hierarchy ensuring code quality, security, responsiveness, and regression safety.

### 9.1 Verification Commands

Execute the following commands to validate repository health:

```bash
# 1. Run the full unified automated test suite (responsiveness, integrity, PWA)
npm test

# 2. Run the exhaustive 93-assertion E2E requirements audit (Tiers 1-4)
node tests/e2e_requirements_audit.test.mjs

# 3. Run the system integrity and RLS security test suite
node tests/integrity_check.test.mjs

# 4. Run the multi-viewport mobile responsiveness audit (320px to 1280px)
node scripts/verify_responsiveness.mjs

# 5. Run the Progressive Web App installability and service worker audit
node tests/pwa_install.test.mjs

# 6. Execute TypeScript strict type checking (0 errors required)
npx tsc --noEmit

# 7. Execute ESLint code style and quality check (0 warnings/errors required)
npm run lint

# 8. Compile production build and verify bundle optimization
npm run build
```

### 9.2 Test Suite Architecture

| Test Suite | Command | Assertions | Scope |
|---|---|---|---|
| **E2E Requirements Audit** | `node tests/e2e_requirements_audit.test.mjs` | **93 tests** | 4-tier audit covering console safety, canonical SEO, breadcrumbs, bundle code-splitting, white-labeling, and documentation. |
| **System Integrity & RLS** | `node tests/integrity_check.test.mjs` | **41 tests** | Secret isolation, UploadThing auth, rate limiter token bucket, RLS policies, CLS privacy, and HTTP headers. |
| **Responsive Emulation** | `node scripts/verify_responsiveness.mjs` | **129 tests** | Viewports (320px, 375px, 768px, 1024px, 1280px), zero horizontal overflow, touch target minimums (>= 44px). |
| **PWA Installability** | `node tests/pwa_install.test.mjs` | **13 tests** | Web App Manifest compliance, standalone display, icons, and service worker shell caching. |

---

## 10. Production Deployment Guide

### 10.1 Supabase Production Database Provisioning

1. **Create Supabase Production Project**:
   - Provision a new project on [Supabase Cloud](https://supabase.com) in your target geographic region.
2. **Execute Consolidated Schema Migration**:
   - Navigate to the **SQL Editor** in the Supabase Dashboard.
   - Run the entire contents of `supabase/00_complete_production_schema.sql`.
   - The script runs inside an idempotent transaction block (`BEGIN ... COMMIT`).
3. **Verify Row Level Security (RLS) & Permissions**:
   - Navigate to **Authentication -> Policies** to verify that all 12 tables have RLS enabled.
   - Confirm that `public.get_user_role()` exists under Database Functions.
   - Confirm Column Level Security (CLS) on `public.community_questions` by verifying that `author_email` is not selectable by `anon` or `authenticated`.
4. **Verify Realtime Replication**:
   - Navigate to **Database -> Publications** and ensure `supabase_realtime` includes `analytics_events`.

---

### 10.2 Vercel Production Deployment

1. **Import Git Repository**:
   - Push your changes to GitHub or GitLab.
   - In the [Vercel Dashboard](https://vercel.com), select **Add New Project** and import the `pharmacore` repository.
2. **Configure Build & Output Settings**:
   - **Framework Preset**: `Next.js`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
3. **Inject Production Environment Variables**:
   Add the following variables in **Project Settings -> Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (set to your custom domain, e.g., `https://pharma-core-edu.vercel.app`)
   - `UPLOADTHING_TOKEN`
   - `UPLOADTHING_SECRET`
   - `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`
   - `CLOUDFLARE_TURNSTILE_SECRET_KEY`
4. **Deploy**:
   - Click **Deploy**. Vercel compiles the optimized standalone Next.js bundles.
5. **Attach Custom Domain**:
   - Navigate to **Settings -> Domains**, assign your custom domain, and configure CNAME/A records.

---

### 10.3 Post-Deployment Verification Checklist

- [ ] **HTTP Security Headers**: Verify headers via `curl -I https://your-domain.com`:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] **Source Map Protection**: Inspect browser DevTools on production; assert that no `.map` files are loaded or exposed.
- [ ] **Bilingual Switching**: Verify language toggle between `/` and `/ar`, validating RTL alignment and Tajawal typography.
- [ ] **PWA Functionality**: Check the browser address bar for desktop install button and verify offline navigation shell.
- [ ] **Admin Dynamic Splitting**: Navigate to `/admin` and confirm management tabs load cleanly with transient skeletons.
- [ ] **Automated Test Pass**: Confirm `npm test`, `npx tsc --noEmit`, and `npm run lint` execute cleanly with 0 errors.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
