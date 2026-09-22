# PharmaCore — Testing Strategy & QA Architecture

## 1. Testing Philosophy

PharmaCore employs a **zero-dependency, native Node.js ESM test framework** (`tests/helpers/test_framework.mjs`) executing 9 automated test suites in under 3 seconds. The testing pyramid covers unit assertions, boundary conditions, cross-feature integration, adversarial stress tests, and 22-domain security audits.

---

## 2. Testing Documentation Index

| Document | Focus Area | Description |
|---|---|---|
| [**Testing Strategy**](./STRATEGY.md) | 4-Tier Test Architecture | Architecture of the custom ESM runner and pyramid hierarchy. |
| [**Test Suites Reference**](./TEST_SUITES.md) | Suite-by-Suite Breakdown | Detailed documentation of all 14 test scripts in `tests/` and `scripts/`. |
| [**Coverage & Verification**](./COVERAGE_AND_VERIFICATION.md) | Requirements Traceability | Prompt requirements (R1–R5) mapping to passing test cases. |
