# ADR-0001 — Selection of Next.js Pages Router over App Router

## Status
Accepted

## Date
2026-08-15

## Context
PharmaCore requires a mature, bilingual-first routing model with sub-second page loads, server-side translation injection (`ar`/`en`), and stable integration with `next-i18next`. Next.js 15 supports both the legacy Pages Router (`pages/`) and App Router (`app/`).

## Decision
We chose the **Next.js Pages Router (`pages/`)** for the entire application.

## Alternatives Considered
- **App Router (`app/`)**: High flexibility with Server Components, but i18n required complex custom middleware with potential hydration mismatches during RTL/LTR layout transitions.
- **Vite SPA**: Simple client-only build, but lacked built-in SSR/ISR for SEO sitemap generation and serverless API endpoints.

## Rationale
- `next-i18next` provides rock-solid, production-tested bilingual routing on Pages Router with zero hydration flickers.
- Serverless API routes in `pages/api/` provide isolated execution per endpoint.

## Consequences
- Requires standard `getStaticProps` / `getServerSideProps` data fetching patterns.
- Future migration to App Router can be undertaken incrementally if required.
