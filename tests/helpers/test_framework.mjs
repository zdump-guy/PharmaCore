/**
 * PharmaCore Test Runner Framework
 * Lightweight, zero-dependency async test framework for Node.js ESM.
 */

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
}

class TestSuite {
  constructor(name) {
    this.name = name
    this.tests = []
    this.beforeEachHooks = []
    this.afterEachHooks = []
    this.beforeAllHooks = []
    this.afterAllHooks = []
  }

  beforeEach(fn) {
    this.beforeEachHooks.push(fn)
  }

  afterEach(fn) {
    this.afterEachHooks.push(fn)
  }

  beforeAll(fn) {
    this.beforeAllHooks.push(fn)
  }

  afterAll(fn) {
    this.afterAllHooks.push(fn)
  }

  it(description, fn) {
    this.tests.push({ description, fn })
  }

  async run(reporter) {
    reporter.suiteStart(this.name)
    let passed = 0
    let failed = 0
    const results = []

    try {
      for (const hook of this.beforeAllHooks) {
        await hook()
      }

      for (const test of this.tests) {
        const start = performance.now()
        let error = null
        try {
          for (const hook of this.beforeEachHooks) {
            await hook()
          }
          await test.fn()
          for (const hook of this.afterEachHooks) {
            await hook()
          }
          passed++
          const duration = performance.now() - start
          results.push({ description: test.description, passed: true, duration })
          reporter.testPass(test.description, duration)
        } catch (err) {
          failed++
          const duration = performance.now() - start
          error = err
          results.push({ description: test.description, passed: false, duration, error: err })
          reporter.testFail(test.description, duration, err)
        }
      }

      for (const hook of this.afterAllHooks) {
        await hook()
      }
    } catch (suiteErr) {
      reporter.suiteError(this.name, suiteErr)
    }

    reporter.suiteEnd(this.name, passed, failed)
    return { name: this.name, passed, failed, total: this.tests.length, results }
  }
}

const suites = []
let currentSuite = null

export function describe(name, fn) {
  const suite = new TestSuite(name)
  suites.push(suite)
  const prevSuite = currentSuite
  currentSuite = suite
  fn()
  currentSuite = prevSuite
}

export function it(description, fn) {
  if (!currentSuite) {
    throw new Error("Cannot call it() outside of a describe() block")
  }
  currentSuite.it(description, fn)
}

export function beforeEach(fn) {
  if (currentSuite) currentSuite.beforeEach(fn)
}

export function afterEach(fn) {
  if (currentSuite) currentSuite.afterEach(fn)
}

export function beforeAll(fn) {
  if (currentSuite) currentSuite.beforeAll(fn)
}

export function afterAll(fn) {
  if (currentSuite) currentSuite.afterAll(fn)
}

export function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)} (${typeof expected}) but got ${JSON.stringify(actual)} (${typeof actual})`)
      }
    },
    toEqual(expected) {
      const a = JSON.stringify(actual)
      const b = JSON.stringify(expected)
      if (a !== b) {
        throw new Error(`Expected equal:\n  Expected: ${b}\n  Received: ${a}`)
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy value, but received: ${JSON.stringify(actual)}`)
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected falsy value, but received: ${JSON.stringify(actual)}`)
      }
    },
    toBeGreaterThan(num) {
      if (!(actual > num)) {
        throw new Error(`Expected ${actual} to be greater than ${num}`)
      }
    },
    toBeGreaterThanOrEqual(num) {
      if (!(actual >= num)) {
        throw new Error(`Expected ${actual} to be greater than or equal to ${num}`)
      }
    },
    toBeLessThan(num) {
      if (!(actual < num)) {
        throw new Error(`Expected ${actual} to be less than ${num}`)
      }
    },
    toBeLessThanOrEqual(num) {
      if (!(actual <= num)) {
        throw new Error(`Expected ${actual} to be less than or equal to ${num}`)
      }
    },
    toContain(substr) {
      if (typeof actual === "string" && !actual.includes(substr)) {
        throw new Error(`Expected string to contain "${substr}". Received:\n${actual.slice(0, 300)}...`)
      } else if (Array.isArray(actual) && !actual.includes(substr)) {
        throw new Error(`Expected array to contain ${JSON.stringify(substr)}`)
      }
    },
    toMatch(regex) {
      if (!regex.test(actual)) {
        throw new Error(`Expected string to match regex ${regex}. Received:\n${actual.slice(0, 300)}...`)
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined, but got undefined`)
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null, but received: ${JSON.stringify(actual)}`)
      }
    },
    toThrow(expectedMsg) {
      if (typeof actual !== "function") {
        throw new Error(`Expected function for toThrow, but got ${typeof actual}`)
      }
      let threw = false
      let thrownError = null
      try {
        actual()
      } catch (err) {
        threw = true
        thrownError = err
      }
      if (!threw) {
        throw new Error(`Expected function to throw an error, but it returned successfully`)
      }
      if (expectedMsg && !thrownError.message.includes(expectedMsg)) {
        throw new Error(`Expected error message to include "${expectedMsg}", but got "${thrownError.message}"`)
      }
    }
  }
}

export class ConsoleReporter {
  constructor() {
    this.totalSuites = 0
    this.totalTests = 0
    this.totalPassed = 0
    this.totalFailed = 0
  }

  suiteStart(name) {
    this.totalSuites++
    console.log(`\n${colors.bold}${colors.cyan}► ${name}${colors.reset}`)
  }

  testPass(description, duration) {
    this.totalTests++
    this.totalPassed++
    const durStr = duration > 10 ? ` ${colors.dim}(${duration.toFixed(1)}ms)${colors.reset}` : ""
    console.log(`  ${colors.green}✓${colors.reset} ${colors.gray}${description}${colors.reset}${durStr}`)
  }

  testFail(description, duration, err) {
    this.totalTests++
    this.totalFailed++
    console.log(`  ${colors.red}✗ ${description}${colors.reset} ${colors.dim}(${duration.toFixed(1)}ms)${colors.reset}`)
    console.log(`    ${colors.red}Error:${colors.reset} ${err.message}`)
    if (err.stack) {
      const filteredStack = err.stack.split("\n").slice(1, 4).join("\n    ")
      console.log(`    ${colors.dim}${filteredStack}${colors.reset}`)
    }
  }

  suiteError(name, err) {
    console.log(`  ${colors.red}Suite Level Error in "${name}":${colors.reset} ${err.message}`)
  }

  suiteEnd(name, passed, failed) {
    const statusColor = failed === 0 ? colors.green : colors.red
    console.log(`  ${statusColor}Summary: ${passed} passed, ${failed} failed${colors.reset}`)
  }

  summary(totalDuration) {
    console.log(`\n${colors.bold}══════════════════════════════════════════════════════════════════════${colors.reset}`)
    console.log(`${colors.bold}  Test Execution Summary${colors.reset}`)
    console.log(`══════════════════════════════════════════════════════════════════════`)
    console.log(`  Suites:  ${this.totalSuites}`)
    console.log(`  Tests:   ${this.totalTests}`)
    console.log(`  Passed:  ${colors.green}${this.totalPassed}${colors.reset}`)
    console.log(`  Failed:  ${this.totalFailed > 0 ? colors.red + this.totalFailed + colors.reset : colors.green + '0' + colors.reset}`)
    console.log(`  Time:    ${(totalDuration / 1000).toFixed(2)}s`)
    console.log(`══════════════════════════════════════════════════════════════════════\n`)
  }
}

export async function runAllSuites() {
  const reporter = new ConsoleReporter()
  const startTime = performance.now()
  const results = []

  for (const suite of suites) {
    const res = await suite.run(reporter)
    results.push(res)
  }

  const totalDuration = performance.now() - startTime
  reporter.summary(totalDuration)

  return {
    passed: reporter.totalPassed,
    failed: reporter.totalFailed,
    total: reporter.totalTests,
    duration: totalDuration,
    results,
    exitCode: reporter.totalFailed === 0 ? 0 : 1,
  }
}

export function clearSuites() {
  suites.length = 0
}
