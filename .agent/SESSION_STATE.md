# Session State

## Current Milestone
- **Milestone:** Core Platform Hardening, SEO Headers, and Test Integrity Validation
- **Goal:** Maintain rock-solid stability across bilingual learning modules, API rate limiting, security headers, and test coverage.

## Active Branch & Last Commit
- **Branch:** `legacy`
- **Last Commit:** `b508db3` (`feat(seo): add static asset CORS and Cache-Control headers and optimize og image formats`)

## Done Recently
- Deep security & resilience hardening across 18 vectors: CSP v3, COOP, CORP, HSTS, Turnstile standardization, PostgREST filter escaping, real-IP resolver prioritization, JSON-LD XSS escaping, and input sanitization.
- Added comprehensive security audit test suite (`tests/security_deep_audit.test.mjs`) verified in `npm test` (16/16 assertions passing).
- Bootstrapped `.agent/` architecture context, ADR decisions registry, and session state tracking.
- `b508db3`: Added static asset CORS and Cache-Control headers, optimized OpenGraph image delivery.
- `f8bfc3a`: Enhanced `Layout` and `_document` components for improved metadata handling and document structure.
- `94eddbe`: Updated `Footer` and `Navbar` scroll handling, optimized analytics event tracking.
- `d8680eb`: Replaced `Image` with standard `img` in `BrandLogo` to optimize image priority.
- `54a72a9`: Refactored site content loading and caching mechanism; streamlined Supabase queries.
- `4d14b11`: Implemented rate limiting across admin and user API endpoints.

## Next Immediate Steps
1. Monitor production Cloudflare Turnstile telemetry and rate-limit triggers.
2. Review remaining dynamic forms for optional progressive throttling integration.
3. Validate PWA service worker caching and offline fallback capabilities in staging.


## Active Pitfalls & Blockers
- **Pages Router Only:** Never use Next.js App Router patterns (`app/` directory or server actions).
- **Service Role Isolation:** Never import `supabaseAdmin` or reference `SUPABASE_SERVICE_ROLE_KEY` in client components or client bundles.
- **Bilingual RTL Integrity:** Ensure any layout modifications maintain directional integrity (`dir="rtl"` / `dir="ltr"`).
