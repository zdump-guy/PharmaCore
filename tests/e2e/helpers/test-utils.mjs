/**
 * Test Utilities and Assertion Harness for PharmaCore E2E Testing Track
 */

class AssertionError extends Error {
  constructor(message, actual, expected) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

export const assert = {
  ok(value, message = 'Expected value to be truthy') {
    if (!value) {
      throw new AssertionError(message, value, true);
    }
  },

  strictEqual(actual, expected, message) {
    if (actual !== expected) {
      const msg = message || `Expected ${JSON.stringify(actual)} to strictly equal ${JSON.stringify(expected)}`;
      throw new AssertionError(msg, actual, expected);
    }
  },

  deepStrictEqual(actual, expected, message) {
    const act = JSON.stringify(actual);
    const exp = JSON.stringify(expected);
    if (act !== exp) {
      const msg = message || `Expected deep equality:\nActual:   ${act}\nExpected: ${exp}`;
      throw new AssertionError(msg, actual, expected);
    }
  },

  almostEqual(actual, expected, tolerance = 0.01, message) {
    const diff = Math.abs(actual - expected);
    if (diff > tolerance) {
      const msg = message || `Expected ${actual} to be within ${tolerance} of ${expected} (diff: ${diff})`;
      throw new AssertionError(msg, actual, expected);
    }
  },

  throws(fn, expectedError, message) {
    let threw = false;
    let thrownError = null;
    try {
      fn();
    } catch (err) {
      threw = true;
      thrownError = err;
    }
    if (!threw) {
      throw new AssertionError(message || 'Expected function to throw an error, but it did not', null, expectedError);
    }
    if (expectedError && typeof expectedError === 'string') {
      if (!thrownError.message.includes(expectedError)) {
        throw new AssertionError(
          message || `Expected error message to include "${expectedError}", got "${thrownError.message}"`,
          thrownError.message,
          expectedError
        );
      }
    }
  },

  includes(container, item, message) {
    let ok = false;
    if (typeof container === 'string') {
      ok = container.includes(item);
    } else if (Array.isArray(container)) {
      ok = container.includes(item);
    } else if (container && typeof container === 'object') {
      ok = item in container;
    }
    if (!ok) {
      throw new AssertionError(message || `Expected ${JSON.stringify(container)} to include ${JSON.stringify(item)}`, container, item);
    }
  },

  match(text, regex, message) {
    if (!regex.test(text)) {
      throw new AssertionError(message || `Expected "${text}" to match regex ${regex}`, text, regex.toString());
    }
  }
};

/**
 * Test Suite Collector & Runner
 */
export class TestRunner {
  constructor(name = 'PharmaCore E2E Suite') {
    this.name = name;
    this.suites = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.failures = [];
  }

  suite(suiteName, fn) {
    const suiteObj = {
      name: suiteName,
      tests: []
    };

    const test = (testName, testFn) => {
      suiteObj.tests.push({ name: testName, fn: testFn });
    };

    fn(test);
    this.suites.push(suiteObj);
  }

  async run() {
    console.log(`\n=======================================================`);
    console.log(`🚀 Starting ${this.name}`);
    console.log(`=======================================================\n`);

    const startTime = Date.now();

    for (const s of this.suites) {
      console.log(`📦 Suite: ${s.name}`);
      for (const t of s.tests) {
        this.totalTests++;
        try {
          await t.fn();
          this.passedTests++;
          console.log(`  ✓ ${t.name}`);
        } catch (err) {
          this.failedTests++;
          console.error(`  ✗ ${t.name}`);
          console.error(`    Error: ${err.message}`);
          if (err.actual !== undefined && err.expected !== undefined) {
            console.error(`    Actual:   ${JSON.stringify(err.actual)}`);
            console.error(`    Expected: ${JSON.stringify(err.expected)}`);
          }
          this.failures.push({
            suite: s.name,
            test: t.name,
            error: err
          });
        }
      }
      console.log('');
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`=======================================================`);
    console.log(`🏁 Test Summary: ${this.name}`);
    console.log(`   Total Tests:  ${this.totalTests}`);
    console.log(`   Passed:       ${this.passedTests} (${((this.passedTests / Math.max(1, this.totalTests)) * 100).toFixed(1)}%)`);
    console.log(`   Failed:       ${this.failedTests}`);
    console.log(`   Duration:     ${duration}s`);
    console.log(`=======================================================\n`);

    if (this.failedTests > 0) {
      console.error(`❌ FAILING TESTS (${this.failedTests}):`);
      this.failures.forEach((f, idx) => {
        console.error(`  ${idx + 1}) [${f.suite}] ${f.test}: ${f.error.message}`);
      });
      return false;
    }

    console.log(`🎉 ALL TESTS PASSED!`);
    return true;
  }
}
