#!/usr/bin/env node

/**
 * PharmaCore End-to-End Test Suite Runner
 * Executes Tier 1, Tier 2, Tier 3, and Tier 4 E2E Test Cases.
 */

import { TestRunner } from '../tests/e2e/helpers/test-utils.mjs';

// Tier 1 Suites
import { register as registerT1FeatureFlags } from '../tests/e2e/tier1-features/01-feature-flags.test.mjs';
import { register as registerT1PracticeMode } from '../tests/e2e/tier1-features/02-practice-mode.test.mjs';
import { register as registerT1Certificates } from '../tests/e2e/tier1-features/03-certificates-verification.test.mjs';
import { register as registerT1Streaks } from '../tests/e2e/tier1-features/04-streaks-badges.test.mjs';
import { register as registerT1ClinicalAssistant } from '../tests/e2e/tier1-features/05-clinical-assistant.test.mjs';
import { register as registerT1Gradebook } from '../tests/e2e/tier1-features/06-faculty-gradebook.test.mjs';
import { register as registerT1Migrations } from '../tests/e2e/tier1-features/07-database-migrations.test.mjs';

// Tier 2 Suites
import { register as registerT2FeatureFlagsBoundaries } from '../tests/e2e/tier2-boundaries/01-feature-flags-boundaries.test.mjs';
import { register as registerT2PracticeModeBoundaries } from '../tests/e2e/tier2-boundaries/02-practice-mode-boundaries.test.mjs';
import { register as registerT2CertificatesBoundaries } from '../tests/e2e/tier2-boundaries/03-certificates-boundaries.test.mjs';
import { register as registerT2StreaksBoundaries } from '../tests/e2e/tier2-boundaries/04-streaks-boundaries.test.mjs';
import { register as registerT2ClinicalBoundaries } from '../tests/e2e/tier2-boundaries/05-clinical-boundaries.test.mjs';
import { register as registerT2GradebookBoundaries } from '../tests/e2e/tier2-boundaries/06-gradebook-boundaries.test.mjs';
import { register as registerT2MigrationsBoundaries } from '../tests/e2e/tier2-boundaries/07-migrations-boundaries.test.mjs';

// Tier 3 Suites
import { register as registerT3Combinations } from '../tests/e2e/tier3-combinations/pairwise-combinations.test.mjs';

// Tier 4 Suites
import { register as registerT4Scenarios } from '../tests/e2e/tier4-scenarios/real-world-scenarios.test.mjs';

async function main() {
  const runner = new TestRunner('PharmaCore Opaque-Box E2E Test Suite');

  // Register Tier 1: Feature Coverage (7 features)
  registerT1FeatureFlags(runner);
  registerT1PracticeMode(runner);
  registerT1Certificates(runner);
  registerT1Streaks(runner);
  registerT1ClinicalAssistant(runner);
  registerT1Gradebook(runner);
  registerT1Migrations(runner);

  // Register Tier 2: Boundary & Corner Cases (7 features)
  registerT2FeatureFlagsBoundaries(runner);
  registerT2PracticeModeBoundaries(runner);
  registerT2CertificatesBoundaries(runner);
  registerT2StreaksBoundaries(runner);
  registerT2ClinicalBoundaries(runner);
  registerT2GradebookBoundaries(runner);
  registerT2MigrationsBoundaries(runner);

  // Register Tier 3: Cross-Feature Combinations (Pairwise)
  registerT3Combinations(runner);

  // Register Tier 4: Real-World Application Scenarios (Workflows)
  registerT4Scenarios(runner);

  const passed = await runner.run();
  process.exit(passed ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
