# PharmaCore — Tech Stack & Dependency Reference

## 1. Core Frameworks & Runtimes

| Technology | Exact Version | Ecosystem Role | Rationale & Trade-Offs |
|---|---|---|---|
| **Next.js** | `^15.2.0` | Full-stack Web Framework | Provides hybrid SSR, static asset optimization, serverless API route handlers, and mature Pages Router compatibility with `next-i18next`. |
| **React** | `^19.0.0` | UI Component Library | Latest React core supporting concurrent features, high-performance DOM reconciliation, and modern hooks. |
| **React DOM** | `^19.0.0` | DOM Renderer | Browser rendering engine for React 19. |
| **TypeScript** | `^5.0.0` | Static Typing Engine | Enforces strict compile-time type safety across all frontend components, API payloads, and database entities. |
| **Node.js** | `>=20.0.0` | Serverless Runtime | Execution runtime for Next.js API routes, local development, and ESM testing scripts. |

---

## 2. Database, Storage & Authentication

| Dependency | Exact Version | Ecosystem Role | Rationale & Trade-Offs |
|---|---|---|---|
| **`@supabase/supabase-js`** | `^2.112.3` | Database Client & Auth SDK | Connects to PostgreSQL, manages JWT session tokens, executes PostgREST queries, and subscribes to Realtime event channels. |
| **UploadThing** | `^7.7.4` | File Upload Server SDK | Provides type-safe file ingress with staff-only role authentication middleware. |
| **`@uploadthing/react`** | `^7.3.3` | File Upload UI Components | React dropzone and button components with built-in upload progress tracking. |
| **Resend** | Custom REST Client | Transactional Email API | Lightweight HTTP API dispatcher in `lib/email.ts` for student notification emails without heavy SDK overhead. |

---

## 3. UI, Styling & Internationalization

| Dependency | Exact Version | Ecosystem Role | Rationale & Trade-Offs |
|---|---|---|---|
| **Tailwind CSS** | `^3.4.19` | Utility-First CSS | Rapid UI styling with compiled utility classes and custom color token extensions. |
| **`tailwindcss-animate`** | `^1.0.7` | CSS Animation Plugins | Smooth transitions for modals, sheets, accordions, and dropdown menus. |
| **`clsx`** | `^2.1.1` | Conditional Classnames | Utility to construct dynamic `className` strings conditionally. |
| **`tailwind-merge`** | `^3.6.0` | Class Conflict Resolver | Merges Tailwind class strings safely without style precedence bugs. |
| **`class-variance-authority`** | `^0.7.1` | Component Variants | Type-safe component variant declarations (buttons, badges, alerts). |
| **`@radix-ui/react-*`** | Multi | Unstyled Accessible Primitives | Accessible UI primitives for Accordion (`1.2.20`), Dialog (`1.1.23`), Label (`2.1.15`), Progress (`1.1.16`), Select (`2.3.7`), Separator (`1.1.15`), Slot (`1.3.3`), and Tabs (`1.1.21`). |
| **`react-icons`** | `^5.7.0` | Iconography | Comprehensive icon sets from FontAwesome 6, HeroIcons 2, and BoxIcons. |
| **`next-i18next`** | `^16.0.10` | Internationalization | Multi-language routing and SSR translation dictionary loader (`ar` and `en`). |
| **`i18next` / `react-i18next`** | `^26.3.6` / `^17.0.11` | Translation Runtime | React hooks (`useTranslation`) for bilingual string interpolation. |

---

## 4. Validation, Analytics & Tooling

| Dependency | Exact Version | Ecosystem Role | Rationale & Trade-Offs |
|---|---|---|---|
| **`zod`** | `^4.4.3` | Schema Validation | Strict runtime payload validation and type inference across all 21 API endpoints. |
| **`@vercel/analytics`** | `^2.0.1` | Privacy-First Analytics | Zero-config visitor analytics and pageview telemetry on Vercel. |
| **`@vercel/speed-insights`** | `^2.0.0` | Web Vitals Telemetry | Real-user Core Web Vitals (LCP, FID, CLS, INP) performance monitoring. |
| **`eslint`** | `^9.20.0` | Code Quality Linter | Static analysis preventing syntax bugs and anti-patterns. |
| **`eslint-config-next`** | `^15.2.0` | Next.js Lint Rules | Framework-specific linting rules for React 19 and Next.js 15. |
| **Native Node.js ESM Runner** | Built-in | Test Framework | Zero external dependency test runner (`node --test` compatible) executing 9 suites in under 3 seconds. |

---

## 5. Upgrade Path & Deprecation Strategy

1. **ESLint Migration**: Next.js 16 will deprecate `next lint` in favor of the standalone ESLint CLI. PharmaCore will transition to `npx eslint .` using flat configuration.
2. **Tailwind CSS v4**: When Tailwind v4 stabilizes for Next.js Pages router, CSS variables and `@theme` blocks will replace `tailwind.config.ts`.
3. **Upstash Redis**: When multi-region serverless deployment requires distributed rate limiting, `lib/rateLimit.ts` will adopt an Upstash Redis adapter while retaining its current interface.
