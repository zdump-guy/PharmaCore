# Phase 1: Foundational Architecture & Core Curriculum Platform

## 1. Phase Overview & Strategic Objectives

- **Timeframe**: August 15, 2026 – August 16, 2026
- **Commit Range**: Commits 1 – 22 (`484a424` → `56db145`)
- **Primary Authors**: zdump-guy (`mohamedmostafa.dev.main@gmail.com`), mostafaelwazzany (`mostafawazzany550@gmail.com`), Vercel Bot
- **Net Diff Volume**: 44 files modified/created, +16,614 lines added, -4,996 lines refactored

Phase 1 established the bedrock for PharmaCore. The objective was to create a modern, high-performance web application capable of delivering structured clinical pharmacology curricula across medical and pharmacy faculties in both English and Arabic.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          PHASE 1 ARCHITECTURAL FOUNDATION                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   ┌─────────────────────┐     ┌─────────────────────┐     ┌──────────────────────┐    │
│   │   Next.js 15 Pages  │     │    Tailwind CSS     │     │ Supabase PostgreSQL  │    │
│   │   • pages/_app.tsx  │     │   • Dark/Light Mode │     │   • Base Tables      │    │
│   │   • /course/[id]    │ ──> │   • Glassmorphism   │ ──> │   • User Roles & RLS │    │
│   │   • /lecture/[id]   │     │   • Tajawal / Inter │     │   • RPC Functions    │    │
│   │   • /quiz/[id]      │     │   • RTL / LTR Dir   │     │   • Site Content CMS │    │
│   └─────────────────────┘     └─────────────────────┘     └──────────────────────┘    │
│              │                           │                            │                │
│              ▼                           ▼                            ▼                │
│   ┌─────────────────────┐     ┌─────────────────────┐     ┌──────────────────────┐    │
│   │ Secure Video Player │     │ Admin Management    │     │ Vercel Analytics     │    │
│   │   • YouTube Embed   │     │   • Curriculum CMS  │     │   • Web Vitals Track │    │
│   │   • Watch Tracking  │     │   • Role Auth Guard │     │   • Image CDN Helper │    │
│   └─────────────────────┘     └─────────────────────┘     └──────────────────────┘    │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Chronological Commit Breakdown (Commits 1 to 22)

### Commit 1: `484a424` — Initial Project Structure & Schema Base
- **Full Hash**: `484a424ec8ef8fba3be6fd8bfb191430d121f7e1`
- **Author**: zdump-guy <mohamedmostafa.dev.main@gmail.com>
- **Date**: 2026-08-15 20:03:58 +0300
- **Diff Stats**: 39 files changed, +8,991 insertions
- **Technical Scope**:
  - Initialized Next.js Pages router project with TypeScript, React 19, and Node.js toolchain.
  - Established base directory architecture: `pages/`, `components/`, `lib/`, `styles/`, `types/`, and `public/`.
  - Created initial database schemas for `courses`, `lectures`, `quizzes`, `quiz_questions`, and `user_progress`.
  - Implemented core pages: Home (`pages/index.tsx`), Course Detail (`pages/course/[id].tsx`), Lecture Viewer (`pages/lecture/[id].tsx`), and Quiz (`pages/quiz/[id].tsx`).

### Commit 2: `2cee341` — Admin User Creation & Role Authorization
- **Full Hash**: `2cee34113deb55d7775fb195b01195423df9c732`
- **Author**: zdump-guy <mohamedmostafa.dev.main@gmail.com>
- **Date**: 2026-08-15 20:36:00 +0300
- **Diff Stats**: 9 files changed, +326 insertions, -9 deletions
- **Technical Scope**:
  - Implemented scripts and server helpers to create initial administrator accounts.
  - Built authorization checks protecting administrative routes (`/admin/*`) against unauthorized student access.
  - Configured Supabase service role client (`lib/supabaseAdmin.ts`) for privileged backend operations.

### Commit 3: `c11ef1e` — Tailwind CSS Integration & Theme Tokens
- **Full Hash**: `c11ef1edd2808dfaf8cf8f1d55bc981076f8f0bd`
- **Author**: mostafaelwazzany <mostafawazzany550@gmail.com>
- **Date**: 2026-08-15 20:50:24 +0300
- **Diff Stats**: 41 files changed, +4,141 insertions, -2,438 deletions
- **Technical Scope**:
  - Integrated Tailwind CSS with PostCSS configuration (`tailwind.config.ts`, `postcss.config.mjs`).
  - Defined design tokens for clinical emerald (`#064e3b`, `#059669`, `#10b981`), slate neutrals, and gold accent highlights.
  - Implemented dark mode class strategies and global CSS variables in `styles/globals.css`.
  - Refactored legacy CSS into utility classes across all existing UI components.

### Commit 4: `b1e0d50` — User Authentication Scripts & Footer Update
- **Full Hash**: `b1e0d506e8cacc355da8f7d96e5520654d5ca8cc`
- **Author**: zdump-guy <mohamedmostafa.dev.main@gmail.com>
- **Date**: 2026-08-15 20:50:51 +0300
- **Diff Stats**: 6 files changed, +72 insertions, -11 deletions
- **Technical Scope**:
  - Added user authentication utility scripts for password resets and verification.
  - Updated global `Footer.tsx` component with platform credits, institutional attribution, and developer contact details.

### Commits 5 & 6: `6a840ff` & `574476d` — Branch Merges
- **Full Hashes**: `6a840ff11af784558449f7607e594ec2c85d0ddd` & `574476d9a21a3e56178fbbbeb498818e0529257c`
- **Author**: mostafaelwazzany <mostafawazzany550@gmail.com>
- **Dates**: 2026-08-15 20:51:50 & 20:52:08 +0300
- **Diff Stats**: 15 files merged, +1,777 insertions
- **Technical Scope**:
  - Synchronized feature branch with `main` repository containing core styling and authentication updates.

### Commit 7: `23614e5` — Navbar & Footer Refactoring & Login Error Handling
- **Full Hash**: `23614e5105f1e7c49f74e3e9434d86c9dbdc0452`
- **Author**: zdump-guy <mohamedmostafa.dev.main@gmail.com>
- **Date**: 2026-08-15 21:14:36 +0300
- **Diff Stats**: 6 files changed, +17 insertions, -564 deletions
- **Technical Scope**:
  - Pruned unused legacy CSS blocks and redundant navigation markup.
  - Improved error messaging on login forms (`pages/login.tsx`, `pages/admin/login.tsx`) to display clear user-facing feedback upon invalid credentials.

### Commit 8: `f38e08e` — RTL Support, Tajawal Font, User Roles Migration & Reconciliation
- **Full Hash**: `f38e08eceabc64b6ee9f05321dcc6ae9011cf9ea`
- **Author**: mostafaelwazzany <mostafawazzany550@gmail.com>
- **Date**: 2026-08-15 23:15:39 +0300
- **Diff Stats**: 36 files changed, +804 insertions, -1,584 deletions
- **Technical Scope**:
  - Implemented bilingual Right-to-Left (RTL) layout switching via `dir="rtl"` attribute bindings.
  - Configured Google Fonts integration (`lib/fonts.ts`) loading **Tajawal** for Arabic script and **Inter** for Latin characters.
  - Authored Supabase database migration adding `users.role` enum (`admin`, `student`) and `site_content` table for dynamic CMS control.
  - Created reconciliation script (`reconcile_db.js`) to guarantee database consistency between auth users and public user profiles.
  - Relaxed TypeScript types across data models to permit explicit null values for optional course fields.

### Commits 9 & 11: `6cf7c6e` & `f433fb2` — Vercel Web Analytics Integration
- **Full Hashes**: `6cf7c6ed65426d1a4051d8d70b2b4b0804088b0d` & `f433fb2977c8c2f74a20a6e3cd11b3e7a55304f7`
- **Authors**: Vercel Bot & Mohamed <mohamedmostafa.dev.main@gmail.com>
- **Dates**: 2026-08-16 08:15:16 & 11:26:24 +0300
- **Diff Stats**: 3 files changed, +46 insertions, -42 deletions
- **Technical Scope**:
  - Integrated `@vercel/analytics` package in `pages/_app.tsx` to monitor Core Web Vitals and user traffic telemetry.
  - Merged official Pull Request #1 into `main`.

### Commit 10: `4e22870` — User Creation Upsert Optimization
- **Full Hash**: `4e22870865dbd0473fe878adf72742a6b54d9e51`
- **Author**: zdump-guy <mohamedmostafa.dev.main@gmail.com>
- **Date**: 2026-08-16 11:25:44 +0300
- **Diff Stats**: 3 files changed, +14 insertions, -223 deletions
- **Technical Scope**:
  - Refactored user registration logic to use PostgreSQL `UPSERT` (`onConflict: 'id'`), eliminating race conditions during student registration.

### Commit 12: `df454f9` — Clean Login Logging
- **Full Hash**: `df454f9a98d5641c4a98adda7ccc54e4cca0ed1e`
- **Author**: zdump-guy <mohamedmostafa.dev.main@gmail.com>
- **Date**: 2026-08-16 11:57:15 +0300
- **Diff Stats**: 1 file changed, -1 deletion
- **Technical Scope**:
  - Removed verbose console error logs in client login flow.

### Commits 13 & 14: `f0c1940` & `0ab22ef` — Secure YouTube Player, Video Theater & SEO Meta
- **Full Hashes**: `f0c1940700a4a5c90d8a06dfca23567e3f9bd147` & `0ab22efba9817db1938ef04c96906f990126c994`
- **Authors**: zdump-guy & Mohamed <mohamedmostafa.dev.main@gmail.com>
- **Dates**: 2026-08-16 15:08:08 & 15:09:25 +0300
- **Diff Stats**: 12 files changed, +343 insertions, -30 deletions
- **Technical Scope**:
  - Built custom `YouTubePlayer.tsx` component with privacy-enhanced mode (`youtube-nocookie.com`), disabling related videos, annotations, and UI clutter.
  - Implemented client-side video tracking dispatching completion signals to update `user_progress`.
  - Added comprehensive SEO metadata, OpenGraph tags, and structured data headers.

### Commit 15: `f448988` — Modular Code Structure Refactoring
- **Full Hash**: `f448988f94491b27f7f070e0ea2d9c34a28aa12c`
- **Author**: zdump-guy <mohamedmostafa.dev.main@gmail.com>
- **Date**: 2026-08-16 15:27:50 +0300
- **Diff Stats**: 4 files changed, +60 insertions, -72 deletions
- **Technical Scope**:
  - Extracted shared modal dialogs and navigation drawers into modular component files.
  - Cleaned up prop interfaces across lecture and course cards.

### Commit 16: `45b1d23` — Streamline Site Content Loading
- **Full Hash**: `45b1d231095c6d101802dfec232374f006f67750`
- **Author**: zdump-guy <mohamedmostafa.dev.main@gmail.com>
- **Date**: 2026-08-16 15:55:10 +0300
- **Diff Stats**: 3 files changed, +7 insertions, -23 deletions
- **Technical Scope**:
  - Optimized `SiteContentContext` caching to minimize redundant Supabase queries during page transitions.

### Commits 17, 18 & 19: `2fd4470`, `54a4eef` & `88956eb` — Direct Image URL Resolution (`getDirectImageUrl`)
- **Full Hashes**: `2fd4470ebfdd528af882b7f82b252573110f04ef`, `54a4eef6024d495bdb99f0e3acd841de2ffc4b5b` & `88956eb349b2a513faa459c969d5bca3b5f3e8f3`
- **Authors**: zdump-guy & Mohamed <mohamedmostafa.dev.main@gmail.com>
- **Dates**: 2026-08-16 16:03:13, 16:04:54 & 16:05:35 +0300
- **Diff Stats**: 8 files changed, +82 insertions, -97 deletions
- **Technical Scope**:
  - Created `getDirectImageUrl` helper to resolve raw image links from external CDNs (Google Drive, Cloudinary, Imgur, Unsplash) into direct embeddable URLs for course thumbnails.
  - Merged PR #4 into `main`.

### Commits 20, 21 & 22: `db88e13`, `7ff4f58` & `56db145` — SiteContentProvider Final Polish & Sync
- **Full Hashes**: `db88e1334e100e2869267afcd7ca3a170f61e38f`, `7ff4f58311b228d84940bdad10d7ab1d6a44806e` & `56db145f0d8a871d6c7f660deffb4e3e3a401b9c`
- **Authors**: zdump-guy & Mohamed <mohamedmostafa.dev.main@gmail.com>
- **Dates**: 2026-08-16 16:07:47, 16:12:33 & 16:31:41 +0300
- **Diff Stats**: 2 files changed, +3 insertions, -6 deletions
- **Technical Scope**:
  - Removed obsolete `useEffect` dependencies and unused imports in `SiteContentProvider.tsx`.
  - Merged PR #6 into `main`, concluding the Phase 1 architectural milestone.

---

## 3. Key Architectural Decisions in Phase 1

1. **Pages Router over App Router**: Next.js Pages Router was selected to ensure rock-solid stability, zero SSR hydration mismatches with dynamic audio/video embeds, and straightforward integration with `next-i18next`.
2. **Supabase PostgreSQL & Security-Definer Roles**: Direct integration with Supabase Auth coupled with a dedicated `public.users` table synchronized via PostgreSQL triggers, enforcing strict role-based access control (`admin` vs `student`).
3. **Bilingual Design System**: Native Right-to-Left (RTL) support built directly into the Tailwind configuration, enabling seamless switching between Arabic (`Tajawal`) and English (`Inter`) typography.
4. **Privacy-Preserving Video Delivery**: Custom YouTube player implementation using `youtube-nocookie.com` to eliminate third-party ad tracking, disable distracting recommended videos, and provide reliable progress event hooks.
