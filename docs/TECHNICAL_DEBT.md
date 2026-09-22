# PharmaCore — Technical Debt & Architectural Trade-offs

## 1. Technical Debt Inventory

| Item ID | Category | Severity | Description | Current Workaround | Planned Remediation |
|---|---|:---:|---|---|---|
| **TD-001** | Architecture | Medium | In-memory sliding window rate limiter is stateful per serverless container. | In-memory Map in `lib/rateLimit.ts` handles traffic per-instance with fast LRU eviction. | Migrate to Upstash Redis REST API for distributed global state in Milestone M7. |
| **TD-002** | Tooling | Low | `next lint` is deprecated in Next.js 15 in favor of standalone ESLint CLI. | Maintained `npm run lint` script with compatibility flags. | Update `package.json` to execute `eslint .` directly in Next.js 16 upgrade. |
| **TD-003** | Frontend | Low | Admin dashboard tabs reside in a single monolithic page (`pages/admin/index.tsx`). | Managed via `next/dynamic` code splitting for each manager module. | Consider refactoring into nested admin routes (e.g. `/admin/curriculum`, `/admin/users`) if routing complexity increases. |
| **TD-004** | Email | Low | Resend transactional email templates are inline string templates in `lib/email.ts`. | String interpolation with robust HTML escaping function (`escapeHtml`). | Migrate to `@react-email/components` for component-driven email rendering when template volume grows. |
| **TD-005** | Database | Low | Realtime subscriptions on `analytics_events` could generate heavy WebSocket traffic at high volume. | Filtered client-side subscriptions and rate-limited event dispatching. | Implement server-side aggregation cron for high-volume telemetry. |

---

## 2. Intentional Architectural Trade-Offs

1. **Pages Router over App Router**:
   - *Rationale*: `next-i18next` provides rock-solid, production-tested bilingual Arabic/English routing with zero hydration mismatches on Pages Router. App Router i18n middleware is more prone to cookie/header desynchronization in multi-language RTL/LTR layouts.
2. **Zero-Dependency ESM Test Suite**:
   - *Rationale*: Eliminates over 150MB of heavy Jest/Vitest dependencies. Tests run natively in Node.js ESM in under 3 seconds with zero build step overhead.
3. **Reference-Only Media Storage**:
   - *Rationale*: Storing video embeds (YouTube) and documents (UploadThing / Google Drive) as URL references prevents database bloat and eliminates expensive bandwidth egress costs from PostgreSQL.
