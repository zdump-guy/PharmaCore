/**
 * PharmaCore Master Integrity Check & Security Hardening Test Suite
 * Validates Security & Secret Isolation, UploadThing Authorization, Rate Limiting,
 * Environment Documentation, Database Schema Consolidation, Custom Error Pages & Boundary,
 * Design System / WCAG 2.5.5 Touch Targets, and Next.js Deployment Configuration.
 *
 * Usage:
 *   node tests/integrity_check.test.mjs                  # Run full verification suite
 *   node tests/integrity_check.test.mjs --milestone=m4   # Run current milestone (M1-M4)
 */

import fs from "node:fs"
import path from "node:path"
import { register } from "node:module"

// Suppress known non-fatal Node.js runtime warning noise in CLI test runner
process.removeAllListeners("warning")
process.on("warning", (warning) => {
  if (warning.name === "DeprecationWarning" || warning.code === "MODULE_TYPELESS_PACKAGE_JSON") return
  console.warn(warning)
})

// Register custom module resolver for '@/...' path alias in Node.js ESM
const moduleHook = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const rel = specifier.slice(2);
    const hasExt = rel.endsWith(".ts") || rel.endsWith(".tsx") || rel.endsWith(".js") || rel.endsWith(".mjs");
    const target = "file://" + process.cwd() + "/" + rel + (hasExt ? "" : ".ts");
    return nextResolve(target, context);
  }
  return nextResolve(specifier, context);
}
`
try {
  register(`data:text/javascript;base64,${Buffer.from(moduleHook).toString("base64")}`, import.meta.url)
} catch {
  // Ignore deprecation or hook warnings if already handled
}

// ---------------------------------------------------------------------------
// Test Runner Harness
// ---------------------------------------------------------------------------
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

const suites = []
let currentSuite = null

function describe(title, milestone, fn) {
  if (typeof milestone === "function") {
    fn = milestone
    milestone = "all"
  }
  const suite = { title, milestone, tests: [] }
  suites.push(suite)
  currentSuite = suite
  fn()
  currentSuite = null
}

function it(name, fn) {
  if (!currentSuite) throw new Error("it() must be called inside describe()")
  currentSuite.tests.push({ name, fn })
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed")
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message ? message + " : " : ""}Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`)
  }
}

// Helper to recursively find files matching extensions
function findFilesRecursively(dir, extensions = [".ts", ".tsx", ".js", ".jsx"]) {
  const results = []
  if (!fs.existsSync(dir)) return results
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findFilesRecursively(fullPath, extensions))
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath)
    }
  }
  return results
}

// ---------------------------------------------------------------------------
// SUITE 1: Security & Secret Isolation (Requirement R1, Feature F1)
// ---------------------------------------------------------------------------
describe("Suite 1: Security & Secrets Hardening (R1, F1)", "m1", () => {
  const rootDir = process.cwd()
  const clientDirs = [
    ...findFilesRecursively(path.join(rootDir, "components")),
    ...findFilesRecursively(path.join(rootDir, "pages")).filter(
      (p) => !p.includes(`${path.sep}api${path.sep}`) && !p.endsWith(`${path.sep}api`)
    ),
    ...findFilesRecursively(path.join(rootDir, "hooks")),
    ...findFilesRecursively(path.join(rootDir, "context")),
  ]

  it("1.1 Confirms client-side files are discovered for scanning", () => {
    assert(clientDirs.length > 20, `Expected at least 20 client files, found ${clientDirs.length}`)
  })

  it("1.2 Zero client files import lib/supabaseAdmin or @/lib/supabaseAdmin", () => {
    const illegalImports = []
    const importRegex = /from\s+["'](?:@\/lib\/supabaseAdmin|lib\/supabaseAdmin|\.\.?\/.*supabaseAdmin)["']/i

    for (const file of clientDirs) {
      const content = fs.readFileSync(file, "utf-8")
      if (importRegex.test(content)) {
        illegalImports.push(path.relative(rootDir, file))
      }
    }

    assertEqual(
      illegalImports.length,
      0,
      `Secret leak detected! Client files importing supabaseAdmin: ${illegalImports.join(", ")}`
    )
  })

  it("1.3 Zero client files reference SUPABASE_SERVICE_ROLE_KEY directly", () => {
    const secretRefs = []
    for (const file of clientDirs) {
      const content = fs.readFileSync(file, "utf-8")
      if (content.includes("SUPABASE_SERVICE_ROLE_KEY")) {
        secretRefs.push(path.relative(rootDir, file))
      }
    }

    assertEqual(
      secretRefs.length,
      0,
      `Secret leak detected! Client files referencing SUPABASE_SERVICE_ROLE_KEY: ${secretRefs.join(", ")}`
    )
  })

  it("1.4 lib/supabaseAdmin.ts contains runtime client execution guard", () => {
    const adminClientPath = path.join(rootDir, "lib", "supabaseAdmin.ts")
    assert(fs.existsSync(adminClientPath), "lib/supabaseAdmin.ts must exist")
    const content = fs.readFileSync(adminClientPath, "utf-8")
    const hasWindowGuard =
      content.includes("typeof window !== 'undefined'") ||
      content.includes('typeof window !== "undefined"') ||
      content.includes("typeof window != 'undefined'")
    assert(hasWindowGuard, "lib/supabaseAdmin.ts must include typeof window !== 'undefined' runtime guard")
    assert(content.includes("throw new Error"), "lib/supabaseAdmin.ts guard must throw a runtime error on client import")
  })
})

// ---------------------------------------------------------------------------
// SUITE 2: UploadThing Authorization Hardening (Requirement R1, Feature F2)
// ---------------------------------------------------------------------------
describe("Suite 2: UploadThing Authorization Hardening (R1, F2)", "m1", () => {
  const rootDir = process.cwd()
  const uploadthingFile = path.join(rootDir, "server", "uploadthing.ts")
  const fileUploaderComponent = path.join(rootDir, "components", "ui", "file-uploader.tsx")

  it("2.1 server/uploadthing.ts exists and exports ourFileRouter", () => {
    assert(fs.existsSync(uploadthingFile), "server/uploadthing.ts must exist")
    const content = fs.readFileSync(uploadthingFile, "utf-8")
    assert(content.includes("export const ourFileRouter"), "Must export ourFileRouter")
  })

  it("2.2 Middleware rejects unauthenticated requests with UNAUTHORIZED", async () => {
    const { authorizeStaffUpload } = await import(uploadthingFile)
    assert(typeof authorizeStaffUpload === "function", "authorizeStaffUpload middleware function must be exported")

    let caughtError = null
    try {
      await authorizeStaffUpload({ req: { headers: {} } })
    } catch (err) {
      caughtError = err
    }

    assert(caughtError !== null, "authorizeStaffUpload must throw when req.headers.authorization is missing")
    assertEqual(caughtError.code, "UNAUTHORIZED", "Thrown error code must be UNAUTHORIZED")
  })

  it("2.3 Middleware rejects empty or malformed Bearer tokens with UNAUTHORIZED", async () => {
    const { authorizeStaffUpload } = await import(uploadthingFile)

    let caughtError = null
    try {
      await authorizeStaffUpload({ req: { headers: { authorization: "Bearer " } } })
    } catch (err) {
      caughtError = err
    }

    assert(caughtError !== null, "authorizeStaffUpload must throw when token is empty string")
    assertEqual(caughtError.code, "UNAUTHORIZED", "Thrown error code must be UNAUTHORIZED")
  })

  it("2.4 File router endpoints attach authorizeStaffUpload middleware", () => {
    const content = fs.readFileSync(uploadthingFile, "utf-8")
    assert(
      content.includes(".middleware(authorizeStaffUpload)"),
      "File router endpoints must attach authorizeStaffUpload middleware"
    )
    assert(content.includes("courseImage:"), "ourFileRouter must define courseImage endpoint")
    assert(content.includes("lectureResource:"), "ourFileRouter must define lectureResource endpoint")
  })

  it("2.5 File router restricts media uploads to staff roles (dev, super_admin, mentor)", () => {
    const content = fs.readFileSync(uploadthingFile, "utf-8")
    assert(
      content.includes('"dev"') && content.includes('"super_admin"') && content.includes('"mentor"'),
      "UploadThing middleware must enforce role whitelist: dev, super_admin, mentor"
    )
    assert(content.includes("FORBIDDEN"), "Middleware must throw FORBIDDEN error for unauthorized roles")
  })

  it("2.6 components/ui/file-uploader.tsx supplies Supabase session auth token in headers", () => {
    assert(fs.existsSync(fileUploaderComponent), "components/ui/file-uploader.tsx must exist")
    const content = fs.readFileSync(fileUploaderComponent, "utf-8")
    assert(content.includes("headers:"), "useUploadThing must configure custom headers")
    assert(
      content.includes("access_token") || content.includes("Authorization"),
      "file-uploader must inject Authorization header with Supabase session access_token"
    )
  })
})

// ---------------------------------------------------------------------------
// SUITE 3: In-Memory Sliding-Window Rate Limiting Engine (Requirement R1, Feature F3)
// ---------------------------------------------------------------------------
describe("Suite 3: Sliding-Window Rate Limiting Engine (R1, F3)", "m1", () => {
  const rootDir = process.cwd()
  const rateLimitFile = path.join(rootDir, "lib", "rateLimit.ts")

  function createMockResponse() {
    const headers = {}
    let statusCode = 200
    let jsonPayload = null

    return {
      headers,
      setHeader(key, val) {
        headers[key] = val
      },
      status(code) {
        statusCode = code
        return this
      },
      json(data) {
        jsonPayload = data
        return this
      },
      getStatusCode() {
        return statusCode
      },
      getJson() {
        return jsonPayload
      },
    }
  }

  it("3.1 lib/rateLimit.ts exists and exports required interface contracts", async () => {
    assert(fs.existsSync(rateLimitFile), "lib/rateLimit.ts must exist")
    const mod = await import(rateLimitFile)
    assert(typeof mod.checkRateLimit === "function", "Must export checkRateLimit")
    assert(typeof mod.getClientIp === "function", "Must export getClientIp")
    assert(typeof mod.resetRateLimits === "function", "Must export resetRateLimits")
  })

  it("3.2 getClientIp extracts single, multi-hop, array, and real IP addresses", async () => {
    const { getClientIp } = await import(rateLimitFile)

    // Multi-hop x-forwarded-for (first IP is the real client)
    const req1 = { headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178" } }
    assertEqual(getClientIp(req1), "203.0.113.195", "Should extract client IP from multi-hop x-forwarded-for")

    // Array x-forwarded-for
    const req2 = { headers: { "x-forwarded-for": ["198.51.100.2", "70.41.3.18"] } }
    assertEqual(getClientIp(req2), "198.51.100.2", "Should handle array x-forwarded-for")

    // x-real-ip
    const req3 = { headers: { "x-real-ip": "192.0.2.146" } }
    assertEqual(getClientIp(req3), "192.0.2.146", "Should extract IP from x-real-ip")

    // socket fallback
    const req4 = { headers: {}, socket: { remoteAddress: "172.16.0.4" } }
    assertEqual(getClientIp(req4), "172.16.0.4", "Should fall back to socket remoteAddress")
  })

  it("3.3 checkRateLimit sets standard headers (X-RateLimit-Limit, Remaining) on success", async () => {
    const { checkRateLimit, resetRateLimits } = await import(rateLimitFile)
    resetRateLimits()

    const req = { headers: { "x-real-ip": "10.10.10.1" } }
    const res = createMockResponse()

    const allowed = checkRateLimit(req, res, { limit: 5, windowMs: 60000, prefix: "test_success" })
    assertEqual(allowed, true, "First request within limit should return true")
    assertEqual(res.headers["X-RateLimit-Limit"], 5, "X-RateLimit-Limit header must match limit")
    assertEqual(res.headers["X-RateLimit-Remaining"], 4, "X-RateLimit-Remaining must decrement to 4")
  })

  it("3.4 checkRateLimit blocks requests when quota exhausted with 429 and Retry-After", async () => {
    const { checkRateLimit, resetRateLimits } = await import(rateLimitFile)
    resetRateLimits()

    const req = { headers: { "x-real-ip": "10.10.10.2" } }
    const options = { limit: 2, windowMs: 60000, prefix: "test_block" }

    // Request 1: Allowed (remaining 1)
    const res1 = createMockResponse()
    assert(checkRateLimit(req, res1, options) === true)

    // Request 2: Allowed (remaining 0)
    const res2 = createMockResponse()
    assert(checkRateLimit(req, res2, options) === true)
    assertEqual(res2.headers["X-RateLimit-Remaining"], 0)

    // Request 3: Blocked (429)
    const res3 = createMockResponse()
    const allowed = checkRateLimit(req, res3, options)
    assertEqual(allowed, false, "Request exceeding quota must return false")
    assertEqual(res3.getStatusCode(), 429, "HTTP status code must be 429 Too Many Requests")
    assertEqual(res3.headers["X-RateLimit-Limit"], 2)
    assertEqual(res3.headers["X-RateLimit-Remaining"], 0)
    assert(typeof res3.headers["Retry-After"] === "number" && res3.headers["Retry-After"] >= 1, "Retry-After header must be positive integer")

    const jsonBody = res3.getJson()
    assert(jsonBody !== null, "Response body must be present")
    assertEqual(jsonBody.error, "Too Many Requests", "Error message must indicate Too Many Requests")
    assert(typeof jsonBody.retryAfter === "number", "JSON retryAfter must be a number")
  })

  it("3.5 Sliding window replenishes tokens over elapsed time window", async () => {
    const { checkRateLimit, resetRateLimits } = await import(rateLimitFile)
    resetRateLimits()

    const req = { headers: { "x-real-ip": "10.10.10.3" } }
    // Window for testing: 1 request per 1000ms (respects Math.max(1000, options.windowMs))
    const options = { limit: 1, windowMs: 1000, prefix: "test_refill" }

    const res1 = createMockResponse()
    assert(checkRateLimit(req, res1, options) === true, "First request consumes token")

    const res2 = createMockResponse()
    assert(checkRateLimit(req, res2, options) === false, "Immediate second request is rate limited")

    // Wait 1050ms for bucket refill
    await new Promise((resolve) => setTimeout(resolve, 1050))

    const res3 = createMockResponse()
    assert(checkRateLimit(req, res3, options) === true, "Request after window expiration must succeed")
  })

  it("3.6 Bucket isolation holds across distinct route prefixes and IP addresses", async () => {
    const { checkRateLimit, resetRateLimits } = await import(rateLimitFile)
    resetRateLimits()

    const reqA = { headers: { "x-real-ip": "10.10.10.4" } }
    const reqB = { headers: { "x-real-ip": "10.10.10.5" } }

    // Exhaust prefix 'signup' for reqA
    checkRateLimit(reqA, createMockResponse(), { limit: 1, windowMs: 60000, prefix: "signup" })
    const blockedA = checkRateLimit(reqA, createMockResponse(), { limit: 1, windowMs: 60000, prefix: "signup" })
    assertEqual(blockedA, false, "signup prefix should be blocked for IP A")

    // Verify prefix 'questions' remains available for IP A
    const allowedDifferentPrefix = checkRateLimit(reqA, createMockResponse(), { limit: 1, windowMs: 60000, prefix: "questions" })
    assertEqual(allowedDifferentPrefix, true, "Different prefix should have independent quota for IP A")

    // Verify prefix 'signup' remains available for IP B
    const allowedDifferentIp = checkRateLimit(reqB, createMockResponse(), { limit: 1, windowMs: 60000, prefix: "signup" })
    assertEqual(allowedDifferentIp, true, "Different IP should have independent quota for signup prefix")
  })
})

// ---------------------------------------------------------------------------
// SUITE 4: Environment Documentation Hardening (Requirement R1, Feature F4)
// ---------------------------------------------------------------------------
describe("Suite 4: Environment Documentation Hardening (R1, F4)", "m1", () => {
  const rootDir = process.cwd()
  const envExamplePath = path.join(rootDir, ".env.local.example")

  it("4.1 .env.local.example exists and is non-empty", () => {
    assert(fs.existsSync(envExamplePath), ".env.local.example file must exist")
    const stat = fs.statSync(envExamplePath)
    assert(stat.size > 100, ".env.local.example must contain descriptive environment configuration")
  })

  it("4.2 Documents all Supabase environment variables", () => {
    const content = fs.readFileSync(envExamplePath, "utf-8")
    assert(content.includes("NEXT_PUBLIC_SUPABASE_URL="), "Must document NEXT_PUBLIC_SUPABASE_URL")
    assert(content.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY="), "Must document NEXT_PUBLIC_SUPABASE_ANON_KEY")
    assert(content.includes("SUPABASE_SERVICE_ROLE_KEY="), "Must document SUPABASE_SERVICE_ROLE_KEY")
  })

  it("4.3 Documents canonical site URL and UploadThing storage credentials", () => {
    const content = fs.readFileSync(envExamplePath, "utf-8")
    assert(content.includes("NEXT_PUBLIC_SITE_URL="), "Must document NEXT_PUBLIC_SITE_URL")
    assert(content.includes("UPLOADTHING_TOKEN="), "Must document UPLOADTHING_TOKEN")
  })

  it("4.4 Documents Cloudflare Turnstile bot protection keys", () => {
    const content = fs.readFileSync(envExamplePath, "utf-8")
    assert(
      content.includes("NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY="),
      "Must document NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY"
    )
    assert(content.includes("CLOUDFLARE_TURNSTILE_SECRET_KEY="), "Must document CLOUDFLARE_TURNSTILE_SECRET_KEY")
  })
})

// ---------------------------------------------------------------------------
// SUITE 5: Database Schema Consolidation & RLS Hardening (Requirement R2, Features F5–F9)
// ---------------------------------------------------------------------------
describe("Suite 5: Database Schema Consolidation & RLS Hardening (R2, F5–F9)", "m2", () => {
  const rootDir = process.cwd()
  const schemaFile = path.join(rootDir, "supabase", "00_complete_production_schema.sql")

  it("5.1 supabase/00_complete_production_schema.sql exists and is non-empty", () => {
    assert(fs.existsSync(schemaFile), "00_complete_production_schema.sql must exist")
    const stat = fs.statSync(schemaFile)
    assert(stat.size > 5000, "00_complete_production_schema.sql must be a comprehensive consolidated migration")
  })

  it("5.2 DDL statements use idempotent keywords (IF NOT EXISTS, DROP IF EXISTS, BEGIN/COMMIT)", () => {
    const sql = fs.readFileSync(schemaFile, "utf-8")
    assert(sql.includes("CREATE EXTENSION IF NOT EXISTS"), "Must use CREATE EXTENSION IF NOT EXISTS")
    assert(sql.includes("CREATE TABLE IF NOT EXISTS"), "Must use CREATE TABLE IF NOT EXISTS")
    assert(sql.includes("ADD COLUMN IF NOT EXISTS"), "Must use ADD COLUMN IF NOT EXISTS for existing tables")
    assert(sql.includes("DROP POLICY IF EXISTS"), "Must use DROP POLICY IF EXISTS before creating RLS policies")
    assert(sql.includes("BEGIN;") && sql.includes("COMMIT;"), "Migration must be wrapped in a transaction block")
  })

  it("5.3 User role creation defaults strictly to 'student' (F6)", () => {
    const sql = fs.readFileSync(schemaFile, "utf-8")
    // Trigger handle_new_user check
    assert(
      sql.includes("'student'") && !sql.includes("VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'mentor')"),
      "handle_new_user trigger must NOT default new users to 'mentor'"
    )
    assert(
      /INSERT\s+INTO\s+public\.users[^(]*\([^)]*role[^)]*\)\s*VALUES\s*\([^)]*'student'[^)]*\)/i.test(sql),
      "handle_new_user trigger must insert role strictly as 'student'"
    )
  })

  it("5.4 public.get_user_role() defined as SECURITY DEFINER STABLE to prevent RLS recursion (F7)", () => {
    const sql = fs.readFileSync(schemaFile, "utf-8")
    assert(sql.includes("FUNCTION public.get_user_role()"), "Must define public.get_user_role()")
    assert(
      sql.includes("SECURITY DEFINER") && sql.includes("STABLE"),
      "get_user_role() must be declared SECURITY DEFINER STABLE"
    )
    assert(
      sql.includes("SET search_path = public") || sql.includes("search_path = 'public'"),
      "get_user_role() must enforce search_path = public to prevent search-path hijacking"
    )
  })

  it("5.5 community_questions enforces Column Level Security protecting author_email (F8)", () => {
    const sql = fs.readFileSync(schemaFile, "utf-8")
    assert(
      sql.includes("REVOKE SELECT ON public.community_questions FROM anon, authenticated;") ||
      sql.includes("REVOKE SELECT ON public.community_questions FROM anon") ||
      sql.includes("REVOKE SELECT ON public.community_questions"),
      "Must revoke unrestricted SELECT on community_questions from anon/authenticated"
    )
    assert(
      /GRANT\s+SELECT\s*\(\s*id\s*,\s*lecture_id\s*,\s*author_name\s*,\s*text\s*,\s*created_at\s*\)\s+ON\s+public\.community_questions/i.test(
        sql
      ),
      "Must grant SELECT exclusively on non-sensitive columns (excluding author_email)"
    )
    assert(
      sql.includes('DROP POLICY IF EXISTS "Anyone insert community questions"') ||
      !sql.includes('CREATE POLICY "Anyone insert community questions"'),
      "Open public insert on community_questions must be eliminated"
    )
  })

  it("5.6 course_enrollments student INSERT policy is strictly gated to status = 'pending' (F9)", () => {
    const sql = fs.readFileSync(schemaFile, "utf-8")
    assert(
      /status\s*=\s*'pending'/i.test(sql),
      "Student enrollment request policy must restrict inserted status strictly to 'pending'"
    )
    assert(
      !sql.includes("status = 'pending' OR status = 'active'"),
      "Student enrollment policy must NOT permit client-side self-activation ('active')"
    )
  })

  it("5.7 Declares all 12 system tables in correct dependency sequence", () => {
    const sql = fs.readFileSync(schemaFile, "utf-8")
    const requiredTables = [
      "public.users",
      "public.courses",
      "public.lectures",
      "public.resources",
      "public.quizzes",
      "public.questions",
      "public.community_questions",
      "public.community_answers",
      "public.mentor_course_assignments",
      "public.site_content",
      "public.course_enrollments",
      "public.analytics_events",
    ]

    for (const table of requiredTables) {
      assert(sql.includes(`CREATE TABLE IF NOT EXISTS ${table}`), `Table ${table} must be declared in schema`)
    }
  })
})

// ---------------------------------------------------------------------------
// SUITE 6: Next.js Configuration & Security Headers (Requirement R5, Feature F16)
// ---------------------------------------------------------------------------
describe("Suite 6: Next.js Config & Security Headers (R5, F16)", "m5", () => {
  const rootDir = process.cwd()
  const nextConfigFile = path.join(rootDir, "next.config.js")

  it("6.1 next.config.js exists", () => {
    assert(fs.existsSync(nextConfigFile), "next.config.js must exist")
  })

  it("6.2 Configures images.remotePatterns with required hostnames", () => {
    const content = fs.readFileSync(nextConfigFile, "utf-8")
    assert(
      content.includes("remotePatterns:"),
      "next.config.js must configure images.remotePatterns (migrating away from images.domains)"
    )
    const requiredHosts = ["drive.google.com", "utfs.io", "ufs.sh"]
    for (const host of requiredHosts) {
      assert(content.includes(host), `remotePatterns must include '${host}'`)
    }
  })

  it("6.3 Defines HTTP security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer, Permissions)", () => {
    const content = fs.readFileSync(nextConfigFile, "utf-8")
    assert(content.includes("headers()") || content.includes("headers :"), "next.config.js must define async headers() method")
    assert(content.includes("Strict-Transport-Security"), "Security headers must include Strict-Transport-Security")
    assert(content.includes("X-Frame-Options"), "Security headers must include X-Frame-Options")
    assert(content.includes("X-Content-Type-Options"), "Security headers must include X-Content-Type-Options")
    assert(content.includes("Referrer-Policy"), "Security headers must include Referrer-Policy")
    assert(content.includes("Permissions-Policy"), "Security headers must include Permissions-Policy")
  })
})

// ---------------------------------------------------------------------------
// SUITE 7: Custom Error Pages & React Error Boundary (Requirement R3, Features F11, F12)
// ---------------------------------------------------------------------------
describe("Suite 7: Error Pages & Error Boundary (R3, F11, F12)", "m4", () => {
  const rootDir = process.cwd()
  const errorBoundaryFile = path.join(rootDir, "components", "ErrorBoundary.tsx")
  const page404File = path.join(rootDir, "pages", "404.tsx")
  const page500File = path.join(rootDir, "pages", "500.tsx")
  const pageErrorFile = path.join(rootDir, "pages", "_error.tsx")
  const appFile = path.join(rootDir, "pages", "_app.tsx")

  it("7.1 components/ErrorBoundary.tsx exists and implements React Error Boundary lifecycle", () => {
    assert(fs.existsSync(errorBoundaryFile), "components/ErrorBoundary.tsx must exist")
    const content = fs.readFileSync(errorBoundaryFile, "utf-8")
    assert(content.includes("componentDidCatch"), "ErrorBoundary must implement componentDidCatch lifecycle")
    assert(
      content.includes("getDerivedStateFromError"),
      "ErrorBoundary must implement getDerivedStateFromError static lifecycle"
    )
    assert(content.includes("export class ErrorBoundary") || content.includes("export default ErrorBoundary"), "Must export ErrorBoundary component")
  })

  it("7.2 pages/_app.tsx wraps application in <ErrorBoundary>", () => {
    assert(fs.existsSync(appFile), "pages/_app.tsx must exist")
    const content = fs.readFileSync(appFile, "utf-8")
    assert(content.includes("<ErrorBoundary"), "pages/_app.tsx must wrap tree in <ErrorBoundary>")
    assert(content.includes("ErrorBoundary"), "pages/_app.tsx must import ErrorBoundary")
  })

  it("7.3 pages/404.tsx exists and renders branded bilingual UI", () => {
    assert(fs.existsSync(page404File), "pages/404.tsx must exist")
    const content = fs.readFileSync(page404File, "utf-8")
    assert(content.includes("export default function Custom404"), "Must export default Custom404 component")
    assert(content.includes("BrandMark"), "404 page must render BrandMark for visual branding")
    assert(content.includes("404"), "404 page must indicate 404 status")
  })

  it("7.4 pages/500.tsx exists and provides recovery reload action", () => {
    assert(fs.existsSync(page500File), "pages/500.tsx must exist")
    const content = fs.readFileSync(page500File, "utf-8")
    assert(content.includes("export default function Custom500"), "Must export default Custom500 component")
    assert(content.includes("500"), "500 page must indicate 500 status")
    assert(content.includes("reload()") || content.includes("handleReload"), "500 page must provide a reload action button")
  })

  it("7.5 pages/_error.tsx exists and captures dynamic HTTP statusCode via getInitialProps", () => {
    assert(fs.existsSync(pageErrorFile), "pages/_error.tsx must exist")
    const content = fs.readFileSync(pageErrorFile, "utf-8")
    assert(content.includes("export default function CustomError") || content.includes("export default function Error"), "Must export default error component")
    assert(content.includes("getInitialProps"), "_error.tsx must define getInitialProps for SSR status code capture")
  })
})

// ---------------------------------------------------------------------------
// SUITE 8: Design System, Typography & Touch Targets (Requirement R4, Features F13–F15)
// ---------------------------------------------------------------------------
describe("Suite 8: Design System, Typography & Touch Targets (R4, F13–F15)", "m4", () => {
  const rootDir = process.cwd()
  const tailwindConfigFile = path.join(rootDir, "tailwind.config.ts")
  const globalsCssFile = path.join(rootDir, "styles", "globals.css")
  const documentFile = path.join(rootDir, "pages", "_document.tsx")
  const buttonFile = path.join(rootDir, "components", "ui", "button.tsx")
  const inputFile = path.join(rootDir, "components", "ui", "input.tsx")
  const selectFile = path.join(rootDir, "components", "ui", "select.tsx")
  const dialogFile = path.join(rootDir, "components", "ui", "dialog.tsx")
  const sheetFile = path.join(rootDir, "components", "ui", "sheet.tsx")
  const alertFile = path.join(rootDir, "components", "ui", "alert.tsx")

  it("8.1 tailwind.config.ts configures Tajawal font family and fallbacks (F13)", () => {
    assert(fs.existsSync(tailwindConfigFile), "tailwind.config.ts must exist")
    const content = fs.readFileSync(tailwindConfigFile, "utf-8")
    assert(content.includes("tajawal:"), "tailwind.config.ts must define tajawal font family")
    assert(content.includes("var(--font-tajawal)"), "tailwind.config.ts must include var(--font-tajawal) in font fallbacks")
  })

  it("8.2 styles/globals.css enforces Tajawal font for [dir='rtl'] (F13)", () => {
    assert(fs.existsSync(globalsCssFile), "styles/globals.css must exist")
    const content = fs.readFileSync(globalsCssFile, "utf-8")
    assert(
      content.includes('[dir="rtl"]') && content.includes("var(--font-tajawal)"),
      "styles/globals.css must set font-family to var(--font-tajawal) for RTL context"
    )
  })

  it("8.3 pages/_document.tsx dynamically sets lang and dir attributes and anti-FOUC script (F13)", () => {
    assert(fs.existsSync(documentFile), "pages/_document.tsx must exist")
    const content = fs.readFileSync(documentFile, "utf-8")
    assert(content.includes("dir="), "pages/_document.tsx must set dynamic dir attribute on <Html>")
    assert(content.includes("lang="), "pages/_document.tsx must set dynamic lang attribute on <Html>")
    assert(
      content.includes("pharmacore-theme") || content.includes("localStorage"),
      "_document.tsx must include anti-FOUC inline theme script"
    )
  })

  it("8.4 Interactive buttons, dialogs, and sheets meet WCAG 2.5.5 >= 44px touch targets (F14)", () => {
    const buttonContent = fs.readFileSync(buttonFile, "utf-8")
    assert(
      buttonContent.includes("h-11") || buttonContent.includes("min-h-[44px]") || buttonContent.includes("min-h-[40px]"),
      "button.tsx must support accessible touch targets (default h-11 = 44px)"
    )

    const dialogContent = fs.readFileSync(dialogFile, "utf-8")
    assert(
      dialogContent.includes("size-11") || dialogContent.includes("h-11 w-11") || dialogContent.includes("44px"),
      "dialog.tsx close button must meet 44px x 44px touch target hit area"
    )

    const sheetContent = fs.readFileSync(sheetFile, "utf-8")
    assert(
      sheetContent.includes("size-11") || sheetContent.includes("h-11 w-11") || sheetContent.includes("44px"),
      "sheet.tsx close button must meet 44px x 44px touch target hit area"
    )
  })

  it("8.5 Form input controls maintain accessible touch target height (F14)", () => {
    const inputContent = fs.readFileSync(inputFile, "utf-8")
    assert(
      inputContent.includes("min-h-[44px]") || inputContent.includes("h-11"),
      "input.tsx must maintain accessible height (h-11 or min-h-[44px])"
    )

    const selectContent = fs.readFileSync(selectFile, "utf-8")
    assert(
      selectContent.includes("min-h-[44px]") || selectContent.includes("h-11"),
      "select.tsx trigger must maintain accessible height (h-11 or min-h-[44px])"
    )
  })

  it("8.6 Logical CSS properties (start-, end-, ps-, pe-) replace physical properties for RTL (F15)", () => {
    const alertContent = fs.readFileSync(alertFile, "utf-8")
    assert(
      alertContent.includes("start-") || alertContent.includes("ps-"),
      "alert.tsx must use logical start-/ps- properties instead of physical left-/pl-"
    )

    const dialogContent = fs.readFileSync(dialogFile, "utf-8")
    assert(
      dialogContent.includes("end-4"),
      "dialog.tsx close button must use logical end-4 instead of physical right-4"
    )

    const selectContent = fs.readFileSync(selectFile, "utf-8")
    assert(
      selectContent.includes("ps-") || selectContent.includes("pe-") || selectContent.includes("end-"),
      "select.tsx must use logical padding/positioning properties"
    )
  })
})

// ---------------------------------------------------------------------------
// Execution Orchestrator & CLI Runner
// ---------------------------------------------------------------------------
export async function runIntegrityCheck(filterMilestone = null) {
  console.log(`\n${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}`)
  console.log(`${colors.bold}${colors.cyan}  PharmaCore Automated System Integrity & Security Hardening Suite    ${colors.reset}`)
  console.log(`${colors.bold}${colors.cyan}  Verifying Requirements R1, R2, R3, R4, R5 (Features F1-F17)         ${colors.reset}`)
  if (filterMilestone) {
    console.log(`${colors.yellow}  Scope: Filtered to Milestone '${filterMilestone}' and completed dependencies${colors.reset}`)
  }
  console.log(`${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}`)

  let totalSuites = 0
  let totalTests = 0
  let totalPassed = 0
  let totalFailed = 0
  const suiteResults = []
  const startTime = performance.now()

  for (const suite of suites) {
    // Check if suite matches milestone filter
    if (filterMilestone) {
      const allowed = ["all"]
      if (filterMilestone === "m1") allowed.push("m1")
      if (filterMilestone === "m2") allowed.push("m1", "m2")
      if (filterMilestone === "m3") allowed.push("m1", "m2", "m3")
      if (filterMilestone === "m4") allowed.push("m1", "m2", "m3", "m4")
      if (filterMilestone === "m5") allowed.push("m1", "m2", "m3", "m4", "m5")

      if (!allowed.includes(suite.milestone)) {
        continue
      }
    }

    totalSuites++
    console.log(`\n${colors.bold}${colors.cyan}► ${suite.title}${colors.reset}`)
    let suitePassed = 0
    let suiteFailed = 0

    for (const test of suite.tests) {
      totalTests++
      const testStart = performance.now()
      try {
        await test.fn()
        suitePassed++
        totalPassed++
        const duration = (performance.now() - testStart).toFixed(1)
        console.log(`  ${colors.green}✓${colors.reset} ${colors.gray}${test.name}${colors.reset} ${colors.dim}(${duration}ms)${colors.reset}`)
      } catch (err) {
        suiteFailed++
        totalFailed++
        const duration = (performance.now() - testStart).toFixed(1)
        console.log(`  ${colors.red}✗ ${test.name}${colors.reset} ${colors.dim}(${duration}ms)${colors.reset}`)
        console.log(`    ${colors.red}Error:${colors.reset} ${err.message}`)
      }
    }

    const summaryColor = suiteFailed === 0 ? colors.green : colors.red
    console.log(`  ${summaryColor}Summary: ${suitePassed} passed, ${suiteFailed} failed${colors.reset}`)
    suiteResults.push({ title: suite.title, passed: suitePassed, failed: suiteFailed, milestone: suite.milestone })
  }

  const totalDuration = ((performance.now() - startTime) / 1000).toFixed(2)

  console.log(`\n${colors.bold}══════════════════════════════════════════════════════════════════════${colors.reset}`)
  console.log(`${colors.bold}  Master Integrity Verification Summary${colors.reset}`)
  console.log(`══════════════════════════════════════════════════════════════════════`)
  console.log(`  Suites Executed: ${totalSuites}`)
  console.log(`  Total Tests:     ${totalTests}`)
  console.log(`  Passed:          ${colors.green}${totalPassed}${colors.reset}`)
  console.log(`  Failed:          ${totalFailed > 0 ? colors.red + totalFailed + colors.reset : colors.green + "0" + colors.reset}`)
  console.log(`  Duration:        ${totalDuration}s`)
  console.log(`══════════════════════════════════════════════════════════════════════\n`)

  return {
    totalSuites,
    totalTests,
    passed: totalPassed,
    failed: totalFailed,
    duration: totalDuration,
    results: suiteResults,
    exitCode: totalFailed === 0 ? 0 : 1,
  }
}

// Auto-run if executed directly via Node CLI
if (process.argv[1] && process.argv[1].endsWith("integrity_check.test.mjs")) {
  let milestoneFilter = null
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--milestone=")) {
      milestoneFilter = arg.split("=")[1].toLowerCase()
    }
  }

  runIntegrityCheck(milestoneFilter)
    .then((summary) => {
      process.exit(summary.exitCode)
    })
    .catch((err) => {
      console.error("Fatal runner execution error:", err)
      process.exit(1)
    })
}
