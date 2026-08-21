/**
 * PharmaCore Expansion Suite - TypeScript E2E Integration Suite
 * Entry point for TypeScript runners and CI/CD test commands.
 */

import { runExpansionSuite } from '../../scripts/run-expansion-tests.mjs';

export async function run() {
  const result = await runExpansionSuite();
  if (!result) {
    throw new Error('PharmaCore Expansion Suite failed assertion tests.');
  }
  return result;
}

if (typeof require !== 'undefined' && require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
