#!/usr/bin/env node

/**
 * Direct Executable Test Runner for PharmaCore Expansion Suite
 * Executable via `node tests/e2e/test_runner.js` or `npm test`
 */

import { runExpansionSuite } from '../../scripts/run-expansion-tests.mjs';

runExpansionSuite()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((err) => {
    console.error('Test Runner Failed:', err);
    process.exit(1);
  });
