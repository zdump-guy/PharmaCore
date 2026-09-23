# ADR-0007 — Cloudflare Turnstile for Bot Protection

## Status
Superseded (2026-09-23) by [TASK-005](../TASKS/TASK-005-complete-removal-of-cloudflare-turnstile.md)

## Date
2026-09-15 (Superseded: 2026-09-23)

## Historical Context
Traditional CAPTCHAs (Google reCAPTCHA v2/v3) created user friction, privacy concerns, and accessibility barriers for students with visual impairments. Cloudflare Turnstile was initially adopted to provide a non-interactive bot challenge gate.

## Historical Decision
We integrated **Cloudflare Turnstile** across all public write endpoints (`login.tsx`, `signup.ts`, `feedback/submit.ts`, `questions/submit.ts`), paired with a development bypass in `lib/turnstile.ts`.

## Superseding Rationale & Removal Decision (2026-09-23)
On 2026-09-23, Cloudflare Turnstile was **completely removed** in favor of high-performance, internal defense-in-depth security mechanisms for the following architectural reasons:
1. **Frictionless Student Experience**: Removed widget iframe rendering, network challenge latency (~150-300ms), and occasional false-positive challenges during registration, enrollment, and lecture Q&A.
2. **Eliminated External Third-Party Network Dependencies**: Removing `challenges.cloudflare.com` hardened the Content Security Policy (CSP) and decoupled form submissions from external cloud availability.
3. **Multi-Layered In-House Protections**:
   - **Sliding-Window IP Rate Limiting**: Managed via `lib/rateLimit.ts` across all sensitive mutations.
   - **Strict Runtime Zod Validation**: Type safety and input size bounds.
   - **Sanitization**: String normalization and control character stripping via `lib/utils.ts`.
   - **Supabase Auth & RLS**: Database-enforced Row Level Security with strict role authorization.
