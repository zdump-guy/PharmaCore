# Integration: Vercel (Edge Platform, Compute & Telemetry)

## 1. Overview & Purpose
Vercel hosts PharmaCore's production application, executing Next.js SSR at the edge, serving static assets via global CDN, and executing serverless API route handlers.

---

## 2. Configuration & Edge Network Rules

- **Static Cache Headers**: Set in `next.config.js` (`Cache-Control: public, max-age=31536000, immutable` for static assets).
- **Security Headers**: Comprehensive Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), X-Content-Type-Options, X-Frame-Options, Cross-Origin-Opener-Policy (COOP), and Permissions-Policy.
- **Dynamic Site URL Resolution**: Dynamically resolves production domain checking `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_VERCEL_URL` for absolute OpenGraph and sitemap generation.
