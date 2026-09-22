# PharmaCore — Directory & File Map

## 1. Project Root Directory Layout

```
.
├── .agent/                       # Persistent agent memory & architecture snapshots
│   ├── ARCHITECTURE.md           # Condensed static context for AI agent sessions
│   ├── DECISIONS.md              # Key foundational decisions snapshot
│   └── SESSION_STATE.md          # Active milestone and task state tracking
├── components/                   # Reusable React components & UI design system
│   ├── admin/                    # Administrative management views & controllers
│   ├── ui/                       # Accessible UI primitive components (Radix + Tailwind)
│   └── *.tsx                     # Global layout, auth, theme, and shell components
├── design-system/                # Design tokens and visual specifications
│   └── pharmacore/MASTER.md      # Master design token rules (colors, fonts, layout)
├── docs/                         # Authoritative Comprehensive Documentation System
│   └── archive/                  # Archived legacy root documentation files
├── lib/                          # Core backend utilities, helpers, clients, and engines
├── logos_favicon/                # Brand vectors, SVG marks, and master icon assets
├── pages/                        # Next.js Pages Router views & API route handlers
│   ├── admin/                    # Staff login and full administrative dashboard
│   ├── api/                      # 21 Serverless API route endpoints
│   ├── course/                   # Dynamic course syllabus views
│   ├── lecture/                  # Dynamic lecture player & Q&A views
│   ├── quiz/                     # Dynamic interactive quiz runner views
│   └── *.tsx                     # Global pages (index, login, profile, feedback, errors)
├── public/                       # Static public web assets, manifests, icons & PWA worker
│   ├── locales/                  # Internationalization JSON dictionaries (ar, en)
│   └── sw.js                     # Service worker for offline caching and PWA
├── scripts/                      # Build, verification, and responsiveness scripts
├── server/                       # UploadThing backend router definition
├── styles/                       # Global Tailwind CSS and typography rules
├── supabase/                     # PostgreSQL database migrations and schema scripts
├── tests/                        # Zero-dependency ESM test suites & test runner helpers
│   └── helpers/                  # Test assertion framework & layout simulator
├── types/                        # Global TypeScript interfaces & entity definitions
├── AI_AGENT_DOCUMENTATION_SYSTEM.md # Continuous documentation system specification
├── components.json               # Shadcn/ui component scaffolding configuration
├── eslint.config.mjs             # ESLint configuration
├── next.config.js                # Next.js build config, security headers & redirects
├── next-i18next.config.js        # Internationalization locale configuration
├── package.json                  # Project manifest, scripts, and dependencies
├── README.md                     # Root repository README
├── security.md                   # Comprehensive 22-domain security audit documentation
├── tailwind.config.ts            # Tailwind CSS theme configuration and tokens
└── tsconfig.json                 # Strict TypeScript configuration
```

---

## 2. Exhaustive Directory Breakdown

### 2.1 `components/` (Frontend React Components)
- **`components/ui/` (19 Accessible Primitives)**:
  - `accordion.tsx`: Collapsible accordion sections (used in lecture list and FAQs).
  - `alert.tsx`: Callout banner with destructive, warning, and info variants.
  - `badge.tsx`: Status indicator badges (`pending`, `active`, `rejected`, `open`, `resolved`).
  - `button.tsx`: Multi-variant accessible button (`default`, `outline`, `secondary`, `destructive`, `ghost`).
  - `card.tsx`: Card container with Header, Title, Description, Content, and Footer subcomponents.
  - `custom-audio-player.tsx`: High-fidelity HTML5 audio player for lecture voice notes with play/pause, scrub bar, volume, and playback speed controls.
  - `dialog.tsx`: Accessible modal dialog wrapper built on `@radix-ui/react-dialog`.
  - `file-uploader.tsx`: UploadThing file dropzone component with upload progress indicator.
  - `image-preview-modal.tsx`: Fullscreen image preview lightbox with zoom and dismiss.
  - `input.tsx`: Form text input with focus ring, error styling, and RTL support.
  - `label.tsx`: Accessible form label powered by `@radix-ui/react-label`.
  - `media-action-card.tsx`: Card component for displaying course/lecture media links.
  - `pdf-preview-modal.tsx`: PDF viewer dialog supporting embedded inline PDF browsing.
  - `progress.tsx`: Horizontal animated progress bar (`@radix-ui/react-progress`).
  - `select.tsx`: Accessible dropdown selector (`@radix-ui/react-select`).
  - `separator.tsx`: Visual dividing rule (`@radix-ui/react-separator`).
  - `sheet.tsx`: Slide-over drawer panel for mobile navigation menus.
  - `skeleton.tsx`: Animated loading placeholder skeleton.
  - `tabs.tsx`: Accessible tab group wrapper (`@radix-ui/react-tabs`).
  - `textarea.tsx`: Multi-line text input with character counting support.

- **`components/admin/` (14 Administrative Managers)**:
  - `AdminLoadingSkeleton.tsx`: Full-page loading skeleton for admin console transitions.
  - `AdminModals.tsx`: Modal dialogs for course creation, lecture editing, and resource uploads.
  - `AdminSidebar.tsx`: Collapsible sidebar navigation for staff roles.
  - `AdminTopNav.tsx`: Header navigation bar with role badge, theme toggle, and logout button.
  - `AnalyticsDashboard.tsx`: Telemetry charts and aggregate statistics (pageviews, user counts).
  - `CommunityManager.tsx`: Moderation table for student questions and mentor answer authoring.
  - `CourseEnrollmentManager.tsx`: Workflow table to approve/reject student course requests.
  - `CurriculumManager.tsx`: Complete CRUD interface for courses, lectures, quizzes, and resources.
  - `DeveloperConsole.tsx`: Dev-only diagnostics (Supabase latency, rate limiter state).
  - `FeedbackManager.tsx`: Triage dashboard for technical bug reports and academic feedback.
  - `SiteContentManager.tsx`: CMS editor for modifying public landing page headlines and text.
  - `StudentManager.tsx`: Student directory, university breakdown, and status controls.
  - `UserManager.tsx`: Administrative user provisioning and role assignment.
  - `VoiceRecorder.tsx`: In-browser microphone audio recorder with UploadThing integration.

- **`components/` (Root Shell & Context Providers)**:
  - `AuthProvider.tsx`: Supabase session lifecycle manager and user state provider.
  - `BrandLogo.tsx`: SVG vector platform logo with bilingual dark/light variants.
  - `BrandMark.tsx`: Compact badge icon mark for mobile headers and favicons.
  - `Breadcrumb.tsx`: Accessible navigation breadcrumb component.
  - `ErrorBoundary.tsx`: React error boundary catching client-side rendering exceptions.
  - `Footer.tsx`: Global footer with navigation links, copyright, and feedback portal link.
  - `InstallAppModal.tsx`: Modal prompt guiding users to install PharmaCore as a PWA.
  - `Layout.tsx`: Master layout wrapper with SEO meta tags, OpenGraph images, and JSON-LD.
  - `MaintenanceScreen.tsx`: Gated emergency maintenance screen when platform is locked.
  - `Navbar.tsx`: Responsive navigation bar with language switcher and student profile menu.
  - `SiteContentProvider.tsx`: React context supplying dynamic CMS copy across the app.
  - `StudentSetupModal.tsx`: Mandatory onboarding modal prompting new students for university details.
  - `ThemeProvider.tsx`: Light/Dark mode provider syncing HTML class and local storage.
  - `Turnstile.tsx`: Cloudflare Turnstile widget wrapper with challenge callbacks.
  - `YouTubePlayer.tsx`: Responsive iframe video player for lecture streaming.

---

### 2.2 `lib/` (Core Libraries & Utility Engines)
- `analytics.ts`: Custom in-app event tracking engine dispatching to `public.analytics_events`.
- `email.ts`: Resend API transactional email dispatcher with CRLF defense and HTML templates.
- `fonts.ts`: Next.js Google font loaders for `Inter` and `Tajawal`.
- `rateLimit.ts`: In-memory sliding window rate limiter with real-IP extraction header precedence.
- `siteContent.ts`: Default content dictionary and Supabase CMS synchronization helper.
- `supabaseAdmin.ts`: Privileged Supabase client initialized with `SUPABASE_SERVICE_ROLE_KEY`.
- `supabaseClient.ts`: Public anonymous Supabase client initialized with `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `turnstile.ts`: Server-side Cloudflare Turnstile token verification helper.
- `uploadthing.ts`: Client-side UploadThing hook helpers (`generateUploadButton`, `generateUploadDropzone`).
- `usePwaInstall.ts`: Custom React hook capturing `beforeinstallprompt` event for PWA installation.
- `utils.ts`: Utility helpers (`cn` class merge, input sanitizers, Unicode control character scrubbers).

---

### 2.3 `pages/` (Routes & API Handlers)
- **`pages/api/` (21 API Endpoints)**:
  - `courses/[id]/enroll.ts`: Course enrollment request submission.
  - `feedback/submit.ts`: Public bug report and academic feedback submission.
  - `students/signup.ts`: Student registration endpoint.
  - `students/enrollments.ts`: Student personal enrollment history.
  - `students/notifications/index.ts`: Student notifications retrieval.
  - `students/notifications/read.ts`: Notification mark-as-read mutation.
  - `students/questions.ts`: Student personal question history.
  - `students/profile.ts`: Student profile retrieval and update.
  - `profile/index.ts`: User profile endpoint.
  - `admin/feedback/index.ts`: Staff feedback submissions list.
  - `admin/feedback/[id].ts`: Staff feedback status patch and delete.
  - `admin/students/index.ts`: Staff student management directory.
  - `admin/students/enrollments.ts`: Staff enrollment approval/rejection.
  - `admin/analytics.ts`: Staff aggregate analytics data.
  - `admin/settings/signup.ts`: Toggle open student registration setting.
  - `admin/announcements/broadcast.ts`: Broadcast announcement to students.
  - `admin/users/index.ts`: Staff user list.
  - `admin/users/create.ts`: Dev-only admin user provisioning.
  - `uploadthing.ts`: UploadThing serverless file router handler.
  - `questions/answer.ts`: Staff/mentor answer authoring for community questions.
  - `questions/submit.ts`: Public/student community question submission.

- **`pages/` (Page Views)**:
  - `index.tsx`: Homepage with hero, course catalog, features, and feedback CTA.
  - `course/[id].tsx`: Dynamic course syllabus, prerequisites, and lecture list.
  - `lecture/[id].tsx`: Lecture video player, audio notes, resources, and Q&A forum.
  - `quiz/[id].tsx`: Interactive assessment runner with PDF viewer modal.
  - `login.tsx`: Unified login/signup portal for students and staff.
  - `profile.tsx`: Student personal profile, enrollment tracker, and notification center.
  - `feedback.tsx`: Dedicated public feedback and bug reporting page.
  - `admin/login.tsx`: Dedicated administrative login portal.
  - `admin/index.tsx`: Multi-tab administrative control dashboard.
  - `_app.tsx`: Next.js root application component initializing providers.
  - `_document.tsx`: HTML document wrapper injecting font preloads and meta tags.
  - `_error.tsx`, `404.tsx`, `500.tsx`: Custom error pages with brand styling.
  - `sitemap.xml.ts`: Dynamic XML sitemap generator for SEO.

---

### 2.4 `supabase/` (Database Migrations)
- `00_complete_production_schema.sql`: Consolidated production schema with 13 tables, RLS, functions, and 20 indexes.
- `01_audio_records_and_quiz_pdf_migration.sql`: Audio records table and quiz PDF support migration.
- `02_anonymous_qa_and_rate_limits.sql`: Anonymous question support and Column Level Security (CLS).
- `03_notifications_and_qa_hub.sql`: In-app notifications table and email preferences.
- `analytics_migration.sql`: Analytics events table definition.
- `course_enrollment_request_migration.sql`: Course enrollment table and pending state constraints.
- `student_layer_migration.sql`: Student profile fields extension on `public.users`.
- `security_hardening.sql`: Security hardening patches and role checks.

---

### 2.5 `tests/` (Automated Test Suites)
- `adversarial_performance_stress.test.mjs`: Stress test for rate limiting, concurrent requests, and memory usage.
- `api_validation.test.mjs`: Schema validation and error handling for API endpoints.
- `comprehensive_security_matrix.test.mjs`: 22-domain security compliance verification.
- `e2e_requirements_audit.test.mjs`: End-to-end audit of all platform prompt requirements.
- `feedback_and_visual_fixes.test.mjs`: Feedback system, visual integrity, and SEO image tests.
- `integrity_check.test.mjs`: System integrity, RLS, auth, and rate limit validation.
- `pwa_install.test.mjs`: PWA manifest, service worker, and install prompt audit.
- `qa_and_notifications_security.test.mjs`: Q&A hub, notifications, and Resend email security audit.
- `security_deep_audit.test.mjs`: Deep penetration tests for XSS, SQLi, CSRF, and IDOR.
- `tier1_feature_coverage.test.mjs` through `tier4_user_scenarios.test.mjs`: 4-tier testing pyramid suites.
- `scripts/verify_responsiveness.mjs`: Mobile viewport and layout emulation test suite.
