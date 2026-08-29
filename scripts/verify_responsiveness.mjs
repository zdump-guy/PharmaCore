#!/usr/bin/env node

/**
 * PharmaCore Automated Responsiveness & Layout Verification Script
 *
 * Runs comprehensive responsive verification across all components, styles,
 * and page layouts for PharmaCore:
 * - Tier 1: Feature Coverage (R1, R2, R3, R4)
 * - Tier 2: Boundary & Corner Cases (320px - 1280px, extreme micro screens, RTL/LTR)
 * - Tier 3: Cross-Feature Interactions & Combinations
 * - Tier 4: Real-World Mobile Learner Application Scenarios
 *
 * Usage:
 *   node scripts/verify_responsiveness.mjs
 */

import { run } from "../tests/responsive_test.mjs"

async function main() {
  try {
    const summary = await run()
    if (summary.exitCode === 0) {
      console.log(`\x1b[32m\x1b[1m[SUCCESS] All ${summary.passed} responsiveness and layout tests passed!\x1b[0m\n`)
      process.exit(0)
    } else {
      console.error(`\x1b[31m\x1b[1m[FAILURE] ${summary.failed} tests failed out of ${summary.total}.\x1b[0m\n`)
      process.exit(1)
    }
  } catch (err) {
    console.error(`\x1b[31m\x1b[1m[FATAL] Error running test suite:\x1b[0m`, err)
    process.exit(1)
  }
}

main()
