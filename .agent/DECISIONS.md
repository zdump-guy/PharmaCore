# Architecture Decision Records (ADR)

## ADR-001 (Baseline): Next.js Pages Router & React 19 Foundation
- **Status:** Accepted
- **Context:** The application requires reliable SSR/SSG for educational content, dynamic API route handling, and high-performance client hydration.
- **Decision:** Adopt Next.js 15.2 Pages Router paired with React 19.
- **Consequences:** Pages and routing follow `pages/` conventions. App Router and Server Actions are not used; all backend business logic and mutations reside in `pages/api/**`.

## ADR-002 (Baseline): Supabase PostgreSQL with Row Level Security (RLS) & Multi-Tier RBAC
- **Status:** Accepted
- **Context:** Medical learning platform requiring strict multi-tenant student data isolation and mentor/admin access controls.
- **Decision:** Utilize Supabase PostgreSQL with Row Level Security (RLS) for all tables. RBAC is partitioned into `student`, `mentor`, `super_admin`, and `dev` roles.
- **Consequences:** Client-side reads leverage `supabaseClient` bound to RLS policies. Privileged operations and administrative tasks run via `supabaseAdmin` with the Service Role key exclusively inside API routes.

## ADR-003 (Baseline): Bilingual Internationalization (i18n) & RTL Typography Cascade
- **Status:** Accepted
- **Context:** The platform serves bilingual audiences with full English (`en`) and Arabic (`ar`) instruction.
- **Decision:** Implement `next-i18next` with dictionary bundles in `public/locales/`. Bind `Inter` for LTR and `Tajawal` for RTL typography with bidirectional layout mirrors.
- **Consequences:** All visible strings must be localized. Layout flex directions and padding must account for RTL mirroring.

## ADR-004 (Baseline): Media and File Storage via UploadThing & YouTube Embeds
- **Status:** Accepted
- **Context:** Platform distributes lecture videos, downloadable PDFs, and audio recordings without overloading primary PostgreSQL database storage.
- **Decision:** Use UploadThing for binary file uploads (PDFs, audio notes) and YouTube embeds with custom wrappers for lecture videos.
- **Consequences:** Database stores file URLs and metadata while binary streaming is offloaded to specialized CDNs.

## ADR-005 (Baseline): Defense-in-Depth API Security with Turnstile & Rate Limiting
- **Status:** Accepted
- **Context:** Public endpoints (anonymous feedback, quiz submissions, auth) are vulnerable to abuse, bot traffic, and credential stuffing.
- **Decision:** Guard mutation APIs with Cloudflare Turnstile bot protection and multi-tier rate limiting (in-memory + database).
- **Consequences:** API handlers must validate Turnstile tokens and enforce IP/identity rate limit headers.
