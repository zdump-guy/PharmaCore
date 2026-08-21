#!/usr/bin/env node

/**
 * PharmaCore Expansion Suite E2E Test Runner
 * Executes all 4 tiers of tests for the Expansion Suite:
 * - Tier 1: Feature Coverage (90 tests across all 17 features)
 * - Tier 2: Boundary & Corner Cases (90 tests across all 17 features)
 * - Tier 3: Cross-Feature Combinations (16 pairwise integration tests)
 * - Tier 4: Real-World Application Scenarios (8 comprehensive clinical workflows)
 */

import { TestRunner } from '../tests/e2e/helpers/test-utils.mjs';

// Tier 1 Expansion Suites
import { register as registerT1Marketing } from '../tests/e2e/tier1-features/08-marketing-promo.test.mjs';
import { register as registerT1Catalog } from '../tests/e2e/tier1-features/09-courses-catalog.test.mjs';
import { register as registerT1Dashboard } from '../tests/e2e/tier1-features/10-dashboard-daily-profile.test.mjs';
import { register as registerT1Gamification } from '../tests/e2e/tier1-features/11-gamification-leaderboard.test.mjs';
import { register as registerT1Classroom } from '../tests/e2e/tier1-features/12-classroom-notes.test.mjs';
import { register as registerT1VisualNav } from '../tests/e2e/tier1-features/13-visual-confetti-nav.test.mjs';

// Tier 2 Expansion Boundaries
import { register as registerT2MarketingBoundaries } from '../tests/e2e/tier2-boundaries/08-marketing-promo-boundaries.test.mjs';
import { register as registerT2CatalogBoundaries } from '../tests/e2e/tier2-boundaries/09-courses-catalog-boundaries.test.mjs';
import { register as registerT2DashboardBoundaries } from '../tests/e2e/tier2-boundaries/10-dashboard-daily-profile-boundaries.test.mjs';
import { register as registerT2GamificationBoundaries } from '../tests/e2e/tier2-boundaries/11-gamification-leaderboard-boundaries.test.mjs';
import { register as registerT2ClassroomBoundaries } from '../tests/e2e/tier2-boundaries/12-classroom-notes-boundaries.test.mjs';
import { register as registerT2VisualNavBoundaries } from '../tests/e2e/tier2-boundaries/13-visual-confetti-nav-boundaries.test.mjs';

// Tier 3 Expansion Combinations
import { register as registerT3ExpansionCombinations } from '../tests/e2e/tier3-combinations/expansion-pairwise-combinations.test.mjs';

// Tier 4 Expansion Scenarios
import { register as registerT4ExpansionScenarios } from '../tests/e2e/tier4-scenarios/expansion-real-world-scenarios.test.mjs';

export async function runExpansionSuite() {
  const runner = new TestRunner('PharmaCore Expansion Suite (Tiers 1-4)');

  // Tier 1: Feature Coverage (17 features)
  registerT1Marketing(runner);
  registerT1Catalog(runner);
  registerT1Dashboard(runner);
  registerT1Gamification(runner);
  registerT1Classroom(runner);
  registerT1VisualNav(runner);

  // Tier 2: Boundary & Corner Cases (17 features)
  registerT2MarketingBoundaries(runner);
  registerT2CatalogBoundaries(runner);
  registerT2DashboardBoundaries(runner);
  registerT2GamificationBoundaries(runner);
  registerT2ClassroomBoundaries(runner);
  registerT2VisualNavBoundaries(runner);

  // Tier 3: Cross-Feature Combinations
  registerT3ExpansionCombinations(runner);

  // Tier 4: Real-World Application Scenarios
  registerT4ExpansionScenarios(runner);

  return await runner.run();
}

async function main() {
  const passed = await runExpansionSuite();
  process.exit(passed ? 0 : 1);
}

// Execute if run directly as CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('Fatal Expansion Suite Runner Error:', err);
    process.exit(1);
  });
}
