# E2E Test Infra: PharmaCore Enhancement

## Test Philosophy
- Opaque-box, requirement-driven testing. Derived strictly from `ORIGINAL_REQUEST.md`.
- No dependency on internal module implementations.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Feature Flag Matrix (Global & Course Overrides) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | Practice Exam Simulator & Clinical Rationales | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 3 | Automated Certificates & Public Verification | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 4 | Study Streaks & Milestone Badges | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 5 | Hybrid AI Clinical Assistant & Dose Calculators | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 6 | Faculty Gradebook, Drop-off & Difficulty Analytics | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ |
| 7 | Incremental Database Migrations Structure | ORIGINAL_REQUEST §R6 | 5 | 5 | ✓ |

## Test Architecture
- **Test Runner Location**: `scripts/run-e2e-tests.mjs` or `test/e2e-suite.mjs`
- **Invocation**: `node scripts/run-e2e-tests.mjs` (or via `npm test` script)
- **Pass/Fail Semantics**: Exits with code 0 on all tests passing; exits with code 1 with detailed failure output on any failure.
- **Test Case Format**: Structured assertions verifying API routes, feature flag resolution, clinical calculations, certificate issuance rules, and data models.
- **Directory Layout**:
  - `tests/e2e/tier1-features/`
  - `tests/e2e/tier2-boundaries/`
  - `tests/e2e/tier3-combinations/`
  - `tests/e2e/tier4-scenarios/`
  - `scripts/run-e2e-tests.mjs`

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Complete Student Journey: Enrollment, Lecture Viewing with AI Drawer, Practice Mode Quiz, Mastery Certificate Issuance, Public QR Verification | F1, F2, F3, F4, F5 | High |
| 2 | Faculty Workflow: Feature Flag Override per Course, Question Authoring with Bilingual Rationales, Gradebook Review, Cohort Filtering, CSV Export | F1, F2, F6 | High |
| 3 | Clinical Decision Support: Renal dose calculation with CrCl estimation, pediatric dosing check, and drug-drug interaction screening during lecture | F5 | Medium |
| 4 | Edge-case Handling: Student with 100% video but 79% quiz score (no certificate), retakes in practice mode then standard mode, reaches 85% score, certificate issued | F2, F3 | Medium |
| 5 | System Governance: Disabling AI Assistant globally hides drawer; overriding course to enabled allows it; migration integrity validation | F1, F5, F7 | Medium |

## Coverage Thresholds
- **Tier 1 (Feature Coverage)**: ≥5 test cases per feature (7 features × 5 = 35 test cases).
- **Tier 2 (Boundary & Corner Cases)**: ≥5 test cases per feature (7 features × 5 = 35 test cases).
- **Tier 3 (Cross-Feature Combinations)**: ≥7 pairwise tests covering major interactions.
- **Tier 4 (Real-World Application Scenarios)**: ≥5 realistic multi-step workflow test cases.
- **Total Minimum Test Cases**: ~82 test cases.
