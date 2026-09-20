# PharmaCore Architecture

## Core Stack
- **Framework:** Next.js 15.2.0 (Pages Router), React 19, TypeScript 5.x
- **UI & Styling:** Tailwind CSS 3.4, Radix UI Primitives, Lucide / React Icons
- **Database & Auth:** Supabase (PostgreSQL 15+ with RLS), Supabase Auth
- **Media & Storage:** UploadThing, YouTube Player Integration
- **Internationalization:** next-i18next (Dual typography: Inter / Tajawal)

## Project Structure
- `pages/`: Pages Router file-based views (`/course`, `/quiz`, `/admin`) and serverless API endpoints (`/api/**`).
- `components/`: Modular UI primitives (`/ui`), layout shells, providers, and admin controls.
- `lib/`: Shared utilities, Supabase client/admin singletons, rate limiters, and Turnstile validators.
- `server/`: Server-side handlers and UploadThing file router configurations.
- `supabase/`: SQL schemas, RLS security policies, and migration scripts.
- `styles/`: Global CSS styling, Tailwind directives, and font variable bindings.
- `types/`: Domain TypeScript interfaces and database record definitions.
- `tests/`: Automated test suite (e2e requirements audit, stress tests, integrity checks).
- `scripts/`: Dev utilities and viewport responsiveness validation scripts.
- `public/`: Static media, PWA manifest, and localization dictionaries (`locales/en`, `locales/ar`).

## Key Invariants & Constraints
- **Routing:** Exclusively use Next.js Pages Router (`pages/`); do not introduce App Router conventions.
- **Data Access:** Client queries use `supabaseClient` (anon key + RLS); server mutations use `supabaseAdmin` exclusively inside `pages/api/**`.
- **Typing:** Strict TypeScript without `any`; domain entities defined in `types/index.ts`.
- **Bilingual Support:** Every UI component must support RTL/LTR and fetch strings via `next-i18next`.
- **Security:** Public mutation endpoints must enforce Cloudflare Turnstile token validation and rate limiting.

## Core Commands
- **Dev:** `npm run dev`
- **Build:** `npm run build`
- **Start:** `npm run start`
- **Lint:** `npm run lint`
- **Test:** `npm test`
