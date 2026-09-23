# PharmaCore — Core Helper Modules & Utilities

This directory documents the core reusable utility modules and backend helper engines located in `lib/`.

---

## Module Index

| Module Document | Source File | Responsibility |
|---|---|---|
| [**Rate Limiter**](./RATE_LIMITER.md) | `lib/rateLimit.ts` | In-memory sliding window rate limiting and client IP extraction. |
| [**Site Content CMS**](./SITE_CONTENT.md) | `lib/siteContent.ts` | Landing page dynamic CMS copy dictionary and fallback loader. |
| [**Email Dispatcher**](./EMAIL_DISPATCHER.md) | `lib/email.ts` | Resend API client, CRLF defense, and branded HTML templates. |
| [**PWA Installer**](./PWA_INSTALLER.md) | `lib/usePwaInstall.ts` | Service worker registration, beforeinstallprompt event hook. |
