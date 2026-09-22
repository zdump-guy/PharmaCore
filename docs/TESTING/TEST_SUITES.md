# Test Suites Breakdown & Execution Reference

This document catalogs all test scripts executed as part of `npm test`.

---

## 1. Test Suite Catalog

| Script Path | Scope | Key Assertions | Pass Rate |
|---|---|---|:---:|
| `scripts/verify_responsiveness.mjs` | Responsive Layout Emulation | Tests 129 layout assertions across mobile, tablet, and desktop viewports. | 129 / 129 PASS |
| `tests/integrity_check.test.mjs` | Database & RLS Integrity | Tests RLS isolation, `get_user_role()`, and trigger defaults. | 41 / 41 PASS |
| `tests/pwa_install.test.mjs` | PWA & Service Worker | Audits `site.webmanifest`, icons, and service worker caching rules. | 13 / 13 PASS |
| `tests/e2e_requirements_audit.test.mjs` | Platform Prompt E2E Audit | Validates requirements R1 through R5 across all page routes. | 93 / 93 PASS |
| `tests/adversarial_performance_stress.test.mjs` | Adversarial Concurrency | Simulates concurrent traffic, sliding window limits, and memory usage. | 100% PASS |
| `tests/feedback_and_visual_fixes.test.mjs` | Feedback & Visual Fixes | Audits feedback Zod schemas, OpenGraph meta tags, and tab wrapping. | 26 / 26 PASS |
| `tests/security_deep_audit.test.mjs` | Deep Penetration Audit | Audits XSS, SQLi, CSRF, IDOR, and Real-IP header precedence. | 16 / 16 PASS |
| `tests/qa_and_notifications_security.test.mjs` | Q&A, Notifications & Resend | Audits notifications RLS, email template escaping, and CRLF filters. | 12 / 12 PASS |
| `tests/comprehensive_security_matrix.test.mjs` | 22-Domain Security Matrix | Full compliance verification across all 22 security domains. | 23 / 23 PASS |

---

## 2. Test Execution Commands

```bash
# Run all 9 unified suites
npm test

# Run individual suite
node tests/comprehensive_security_matrix.test.mjs
node scripts/verify_responsiveness.mjs
```
