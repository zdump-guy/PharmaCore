# ADR-0007 — Cloudflare Turnstile for Bot Protection

## Status
Accepted

## Date
2026-09-15

## Context
Traditional CAPTCHAs (Google reCAPTCHA v2/v3) create user friction, privacy concerns, and accessibility barriers for students with visual impairments.

## Decision
We integrated **Cloudflare Turnstile** across all public write endpoints (`login.tsx`, `signup.ts`, `feedback/submit.ts`, `questions/submit.ts`), paired with a development bypass in `lib/turnstile.ts`.

## Rationale
- Frictionless, non-interactive verification for legitimate human users.
- Privacy-first data handling with no third-party ad tracking.
- Cryptographically verified server-side tokens.
