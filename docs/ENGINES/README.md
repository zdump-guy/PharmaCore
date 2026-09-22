# PharmaCore — Runtime Engines & Core Subsystems

This directory documents the core runtime engines and server subsystems driving PharmaCore.

---

## Subsystem Index

| Engine Document | Focus Area | Source Implementation |
|---|---|---|
| [**Auth Engine**](./AUTH_ENGINE.md) | Supabase Auth, RBAC & Tokens | `components/AuthProvider.tsx`, `lib/supabaseClient.ts`, `lib/supabaseAdmin.ts` |
| [**Rate Limit Engine**](./RATE_LIMIT_ENGINE.md) | In-Memory Sliding Window Throttling | `lib/rateLimit.ts` |
| [**Upload Engine**](./UPLOAD_ENGINE.md) | UploadThing File Ingress & Validation | `server/uploadthing.ts`, `components/ui/file-uploader.tsx` |
| [**Email Engine**](./EMAIL_ENGINE.md) | Resend Transactional Dispatcher | `lib/email.ts` |
| [**Analytics Engine**](./ANALYTICS_ENGINE.md) | Dual Telemetry Event Stream | `lib/analytics.ts`, `supabase/analytics_migration.sql` |
