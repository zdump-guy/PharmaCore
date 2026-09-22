# PharmaCore Documentation System Hub

> **Welcome to the official, authoritative engineering documentation for PharmaCore.**
> This documentation system adheres to the strict continuous documentation standards defined in [AI_AGENT_DOCUMENTATION_SYSTEM.md](../AI_AGENT_DOCUMENTATION_SYSTEM.md).

---

## 🧭 Documentation Map & Navigation

| Section | Focus Area | Description |
|---|---|---|
| [**Project Overview**](./PROJECT_OVERVIEW.md) | High-Level Orientation | Platform purpose, target personas, core capabilities, and scope. |
| [**System Architecture**](./ARCHITECTURE.md) | System Design & Topology | Full architectural blueprints, C4 diagrams, SSR/CSR model, and boundaries. |
| [**Directory Structure**](./DIRECTORY_STRUCTURE.md) | Codebase Map | File-by-file breakdown of all directories and module responsibilities. |
| [**Tech Stack**](./TECH_STACK.md) | Dependencies & Rationale | Frameworks, runtimes, UI libraries, database tiers, and upgrade paths. |
| [**Runtime Engines**](./ENGINES/README.md) | Core Subsystems | Auth, rate limiting, file upload pipelines, email, and analytics engines. |
| [**API Reference**](./APIS/README.md) | Route Contracts | Exhaustive reference for all 21 internal endpoints & external service APIs. |
| [**Database Reference**](./DATABASE/README.md) | Data Layer & Storage | 13 PostgreSQL tables, ER diagrams, migrations (00–03), and 20 indexes. |
| [**Integrations**](./INTEGRATIONS/README.md) | External Services | Supabase, Cloudflare Turnstile, Resend, UploadThing, and Vercel. |
| [**UI & UX Reference**](./UI/README.md) | Frontend Architecture | 14 routes/pages, 33+ UI & Admin components, responsive & a11y standards. |
| [**Design System**](./DESIGN_SYSTEM/README.md) | Visual System | Design tokens, clinical green & trust blue palettes, Tajawal/Inter typography. |
| [**UI & Design System Audit**](./UI_AUDIT/README.md) | Design Integrity & QA | 30-dimension audit, token parity, WCAG 2.1 AA a11y, responsive benchmarks & remediation plan. |
| [**Modules & Utilities**](./MODULES/README.md) | Core Libraries | Helper modules: `lib/rateLimit.ts`, `lib/siteContent.ts`, `lib/turnstile.ts`, etc. |
| [**Data Flows**](./DATA_FLOWS/README.md) | Pipeline Sequences | End-to-end sequence diagrams for enrollment, Q&A, feedback, and authoring. |
| [**Security Architecture**](./SECURITY/README.md) | Threat Model & Hardening | STRIDE threat model, 5-tier RBAC, input sanitization, and 22-domain audit. |
| [**Performance Strategy**](./PERFORMANCE/README.md) | Speed & Optimization | Code splitting, image formats, edge caching headers, and bundle budget. |
| [**Testing & QA**](./TESTING/README.md) | Quality Assurance | Zero-dependency ESM test framework, 4 test tiers, and verification matrices. |
| [**Deployment & DevOps**](./DEPLOYMENT/README.md) | Infrastructure & CI/CD | Environments, build pipelines, Vercel deployments, and telemetry streams. |
| [**Operations & Runbooks**](./OPERATIONS/RUNBOOK.md) | SRE & Maintenance | Emergency procedures, maintenance mode toggles, and debugging guides. |
| [**Decision Records (ADRs)**](./DECISIONS/README.md) | Architectural History | Historical records of foundational decisions (ADR-0001 through ADR-0007). |
| [**Changelog**](./CHANGELOG/CHANGELOG.md) | Version History | Structured changelog following Keep a Changelog standards. |
| [**Commit Documentation**](./COMMITS/README.md) | Commit Logs | Detailed impact logs for meaningful git commits. |
| [**Task History**](./TASKS/README.md) | Engineering Sessions | Comprehensive records of engineering work sessions. |
| [**Engineering Journal**](./ENGINEERING_JOURNAL.md) | Continuous Timeline | Chronological step-by-step engineering log. |
| [**Roadmap**](./ROADMAP.md) | Future Milestones | Planned features, enhancements, and platform expansion. |
| [**Technical Debt**](./TECHNICAL_DEBT.md) | Tracked Debt | Architectural compromises, refactor targets, and deprecations. |
| [**Known Issues**](./KNOWN_ISSUES.md) | Edge Cases & Quirks | Documented browser quirks, environment constraints, and workarounds. |

---

## ⚡ Quick Start for Developers

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local

# 3. Execute the full verification test suite (9 test suites)
npm test

# 4. Start local development server
npm run dev
```

---

## 🛡️ Core Operating Rules for Contributors & Agents

1. **Continuous Documentation Synchronization**: Any technical change (feature, API, database column, component, route) must immediately be accompanied by an update to its corresponding document in `docs/`.
2. **Zero Fabrication**: Never claim a feature, endpoint, or test passes without verifying against source code and executing automated tests.
3. **Strict Type Safety**: All additions must pass strict TypeScript compilation (`npx tsc --noEmit`) with zero errors.
4. **Security Defense-in-Depth**: All mutations must enforce authentication, role checks (`get_user_role()`), Zod validation, rate limiting, and Turnstile challenge verification where applicable.

---

*Last Documentation Audit: 2026-09-22 | Status: Production Ready | Verification: 100% Pass*
