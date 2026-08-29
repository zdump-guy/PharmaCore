/**
 * Master Responsive Test Suite Entrypoint
 * Aggregates and executes Tiers 1 through 4.
 */

import { runAllSuites } from "./helpers/test_framework.mjs"

// Import all test suites
import "./tier1_feature_coverage.test.mjs"
import "./tier2_boundary_cases.test.mjs"
import "./tier3_cross_feature.test.mjs"
import "./tier4_user_scenarios.test.mjs"

export async function run() {
  console.log(`\x1b[1m\x1b[36m======================================================================\x1b[0m`)
  console.log(`\x1b[1m\x1b[36m  PharmaCore Mobile Responsiveness & Layout Verification Suite        \x1b[0m`)
  console.log(`\x1b[1m\x1b[36m  Executing Tiers 1-4 (Features, Boundaries, Combinations, Scenarios) \x1b[0m`)
  console.log(`\x1b[1m\x1b[36m======================================================================\x1b[0m`)

  const summary = await runAllSuites()
  return summary
}

if (process.argv[1] && process.argv[1].endsWith("responsive_test.mjs")) {
  run().then((summary) => {
    process.exit(summary.exitCode)
  }).catch((err) => {
    console.error("Test execution failed:", err)
    process.exit(1)
  })
}
