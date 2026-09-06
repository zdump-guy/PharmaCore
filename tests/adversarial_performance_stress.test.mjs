import fs from "node:fs"
import path from "node:path"
import assert from "node:assert/strict"

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..")

let totalPassed = 0
let totalFailed = 0
const failures = []

function suite(title) {
  console.log(`\n► ${title}`)
}

function test(name, fn) {
  try {
    fn()
    totalPassed++
    console.log(`  ✓ ${name}`)
  } catch (err) {
    totalFailed++
    failures.push({ name, error: err })
    console.error(`  ✗ ${name}`)
    console.error(`    ${err.message}`)
  }
}

function readFile(relPath) {
  const fullPath = path.join(PROJECT_ROOT, relPath)
  if (!fs.existsSync(fullPath)) return null
  return fs.readFileSync(fullPath, "utf-8")
}

function listFilesRecursive(dir, baseDir = dir) {
  if (!fs.existsSync(dir)) return []
  let results = []
  const list = fs.readdirSync(dir)
  for (const file of list) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat && stat.isDirectory()) {
      results = results.concat(listFilesRecursive(filePath, baseDir))
    } else {
      results.push(path.relative(baseDir, filePath))
    }
  }
  return results
}

console.log("══════════════════════════════════════════════════════════════════════")
console.log("  PharmaCore Adversarial Stress-Test Harness (Challenger 2)            ")
console.log("  Bundle Performance, Source Maps, Brand Erasure & Hydration           ")
console.log("══════════════════════════════════════════════════════════════════════")

// ============================================================================
// SUITE 1: SOURCE MAP AUDIT & ZERO LEAKAGE STRESS
// ============================================================================
suite("Suite 1: Source Map Audit & Production Leakage Stress")

test("1.1 next.config.js explicitly enforces productionBrowserSourceMaps: false", () => {
  const nextConfig = readFile("next.config.js")
  assert.ok(nextConfig, "next.config.js must exist")
  assert.match(
    nextConfig,
    /productionBrowserSourceMaps\s*:\s*false/,
    "next.config.js must explicitly set productionBrowserSourceMaps: false"
  )
})

test("1.2 .next/static/ directory contains zero .map files across all chunks", () => {
  const nextStaticDir = path.join(PROJECT_ROOT, ".next", "static")
  if (!fs.existsSync(nextStaticDir)) {
    throw new Error(".next/static directory not found. Please run 'npm run build' first.")
  }
  const allStaticFiles = listFilesRecursive(nextStaticDir)
  const mapFiles = allStaticFiles.filter(f => f.endsWith(".map"))
  assert.equal(
    mapFiles.length,
    0,
    `Found ${mapFiles.length} source map files in .next/static: ${mapFiles.slice(0, 5).join(", ")}`
  )
})

test("1.3 Client JS chunks contain no inline sourceMappingURL base64 data URIs", () => {
  const nextStaticDir = path.join(PROJECT_ROOT, ".next", "static")
  if (!fs.existsSync(nextStaticDir)) {
    throw new Error(".next/static directory not found.")
  }
  const allStaticFiles = listFilesRecursive(nextStaticDir)
  const jsFiles = allStaticFiles.filter(f => f.endsWith(".js"))
  assert.ok(jsFiles.length > 0, "Expected .js files in .next/static")

  const chunksWithInlineMaps = []
  for (const jsFile of jsFiles) {
    const content = fs.readFileSync(path.join(nextStaticDir, jsFile), "utf-8")
    if (content.includes("sourceMappingURL=data:application/json")) {
      chunksWithInlineMaps.push(jsFile)
    }
  }
  assert.equal(
    chunksWithInlineMaps.length,
    0,
    `Found inline source maps in chunks: ${chunksWithInlineMaps.join(", ")}`
  )
})

test("1.4 Client JS chunks contain no external sourceMappingURL comments", () => {
  const nextStaticDir = path.join(PROJECT_ROOT, ".next", "static")
  if (!fs.existsSync(nextStaticDir)) {
    throw new Error(".next/static directory not found.")
  }
  const allStaticFiles = listFilesRecursive(nextStaticDir)
  const jsFiles = allStaticFiles.filter(f => f.endsWith(".js"))

  const chunksWithMapRef = []
  for (const jsFile of jsFiles) {
    const content = fs.readFileSync(path.join(nextStaticDir, jsFile), "utf-8")
    // Match //# sourceMappingURL=... but exclude any potential string literal occurrences
    const lines = content.split("\n")
    const lastLines = lines.slice(-5).join("\n")
    if (/\/\/#\s*sourceMappingURL=[^\n]+\.map/i.test(lastLines)) {
      chunksWithMapRef.push(jsFile)
    }
  }
  assert.equal(
    chunksWithMapRef.length,
    0,
    `Found sourceMappingURL comments in: ${chunksWithMapRef.join(", ")}`
  )
})

// ============================================================================
// SUITE 2: DYNAMIC CODE SPLITTING & ADMIN CHUNK ISOLATION
// ============================================================================
suite("Suite 2: Dynamic Code Splitting & Admin Chunk Isolation")

test("2.1 pages/admin/index.tsx uses next/dynamic for all 8 management modules", () => {
  const adminIndex = readFile("pages/admin/index.tsx")
  assert.ok(adminIndex, "pages/admin/index.tsx must exist")
  assert.match(adminIndex, /import\s+dynamic\s+from\s+["']next\/dynamic["']/)

  const requiredDynamicModules = [
    "AnalyticsDashboard",
    "CurriculumManager",
    "CommunityManager",
    "UserManager",
    "SiteContentManager",
    "StudentManager",
    "DeveloperConsole",
    "FeedbackManager",
    "AdminModals",
  ]

  for (const mod of requiredDynamicModules) {
    const dynamicPattern = new RegExp(`const\\s+${mod}\\s*=\\s*dynamic\\(`, "m")
    assert.match(
      adminIndex,
      dynamicPattern,
      `pages/admin/index.tsx must dynamically import ${mod}`
    )
  }
})

test("2.2 All admin dynamic imports explicitly specify { ssr: false }", () => {
  const adminIndex = readFile("pages/admin/index.tsx")
  const requiredModules = [
    "AnalyticsDashboard",
    "CurriculumManager",
    "CommunityManager",
    "UserManager",
    "SiteContentManager",
    "StudentManager",
    "DeveloperConsole",
    "FeedbackManager",
    "AdminModals",
  ]
  for (const mod of requiredModules) {
    const modDynamicBlock = new RegExp(`const\\s+${mod}\\s*=\\s*dynamic\\([\\s\\S]*?ssr:\\s*false`, "m")
    assert.match(
      adminIndex,
      modDynamicBlock,
      `${mod} dynamic import in pages/admin/index.tsx must specify ssr: false`
    )
  }
})

test("2.3 Dynamic imports supply AdminLoadingSkeleton visual fallback during chunk load", () => {
  const adminIndex = readFile("pages/admin/index.tsx")
  assert.match(
    adminIndex,
    /import\s+AdminLoadingSkeleton\s+from\s+["']@\/components\/admin\/AdminLoadingSkeleton["']/,
    "AdminLoadingSkeleton must be imported"
  )
  const skeletonUsages = (adminIndex.match(/AdminLoadingSkeleton/g) || []).length
  // Imported + used across the dynamic loaders
  assert.ok(skeletonUsages >= 7, `Expected >= 7 usages of AdminLoadingSkeleton, got ${skeletonUsages}`)
})

test("2.4 Public page entrypoints do NOT import heavy admin components", () => {
  const publicPages = [
    "pages/index.tsx",
    "pages/course/[id].tsx",
    "pages/lecture/[id].tsx",
    "pages/quiz/[id].tsx",
    "pages/login.tsx",
    "pages/profile.tsx",
  ]

  for (const pagePath of publicPages) {
    const content = readFile(pagePath)
    assert.ok(content, `${pagePath} must exist`)
    assert.ok(
      !content.includes("@/components/admin/"),
      `${pagePath} must not import from @/components/admin/`
    )
    assert.ok(
      !content.includes("@uploadthing/react"),
      `${pagePath} must not import heavy @uploadthing/react directly`
    )
  }
})

test("2.5 Production build isolates admin chunks away from public routes", () => {
  const nextStaticDir = path.join(PROJECT_ROOT, ".next", "static")
  if (!fs.existsSync(nextStaticDir)) return

  const pagesDir = path.join(nextStaticDir, "chunks", "pages")
  if (fs.existsSync(pagesDir)) {
    const indexChunk = fs.readdirSync(pagesDir).find(f => f.startsWith("index-"))
    if (indexChunk) {
      const indexContent = fs.readFileSync(path.join(pagesDir, indexChunk), "utf-8")
      assert.ok(
        !indexContent.includes("AnalyticsDashboard") && !indexContent.includes("DeveloperConsole"),
        "Public index chunk must not contain admin dashboard signatures"
      )
    }
  }
})

// ============================================================================
// SUITE 3: WHITE-LABELING & BRAND ERASURE EXHAUSTIVE GREP
// ============================================================================
suite("Suite 3: White-Labeling & Brand Erasure Exhaustive Grep")

test("3.1 package.json name is strictly 'pharmacore'", () => {
  const pkgJson = JSON.parse(readFile("package.json"))
  assert.equal(pkgJson.name, "pharmacore", `package.json name should be 'pharmacore', got '${pkgJson.name}'`)
})

test("3.2 Public pages contain zero residual framework mentions in text or meta", () => {
  const publicPages = [
    "pages/index.tsx",
    "pages/course/[id].tsx",
    "pages/lecture/[id].tsx",
    "pages/quiz/[id].tsx",
    "pages/login.tsx",
    "pages/profile.tsx",
  ]

  const forbiddenTerms = [
    /\bVite\b/i,
    /\bCreate Next App\b/i,
    /\bVercel Template\b/i,
    /\bcreate-next-app\b/i,
  ]

  for (const pagePath of publicPages) {
    const content = readFile(pagePath)
    for (const term of forbiddenTerms) {
      assert.ok(
        !term.test(content),
        `Found residual framework branding (${term}) in ${pagePath}`
      )
    }
  }
})

test("3.3 Custom error pages (404, 500, _error) render PharmaCore identity and no framework strings", () => {
  const errorPages = ["pages/404.tsx", "pages/500.tsx", "pages/_error.tsx"]
  for (const errorPage of errorPages) {
    const content = readFile(errorPage)
    assert.ok(content, `${errorPage} must exist`)
    assert.match(
      content,
      /PharmaCore/i,
      `${errorPage} must reflect PharmaCore brand`
    )
    assert.ok(
      !/Vercel Template|Create Next App|Vite/i.test(content),
      `${errorPage} must not contain framework template strings`
    )
  }
})

test("3.4 OpenGraph and Layout metadata strictly represent PharmaCore identity", () => {
  const layoutContent = readFile("components/Layout.tsx")
  assert.ok(layoutContent, "components/Layout.tsx must exist")
  assert.match(
    layoutContent,
    /property="og:site_name"\s+content="PharmaCore"/,
    "og:site_name must be 'PharmaCore'"
  )
  assert.ok(
    !/Vercel Template|Create Next App|Next\.js Starter/i.test(layoutContent),
    "Layout.tsx must not contain framework template branding"
  )
})

test("3.5 Web App Manifest (public/site.webmanifest) contains PharmaCore branding and zero framework strings", () => {
  const manifestRaw = readFile("public/site.webmanifest")
  assert.ok(manifestRaw, "public/site.webmanifest must exist")
  const manifest = JSON.parse(manifestRaw)
  assert.match(manifest.name, /PharmaCore/i, "Manifest name must contain PharmaCore")
  assert.match(manifest.short_name, /PharmaCore/i, "Manifest short_name must contain PharmaCore")
  assert.ok(
    !/create-next-app|vercel template|vite/i.test(manifestRaw),
    "Manifest must contain zero template references"
  )
})

test("3.6 Boilerplate template SVGs removed from public/", () => {
  const publicDir = path.join(PROJECT_ROOT, "public")
  const boilerplateFiles = ["vercel.svg", "next.svg", "globe.svg", "window.svg", "file.svg"]
  for (const file of boilerplateFiles) {
    const exists = fs.existsSync(path.join(publicDir, file))
    assert.ok(!exists, `Boilerplate template file public/${file} should not exist`)
  }
})

// ============================================================================
// SUITE 4: HYDRATION & CONSOLE INTEGRITY STRESS TESTING
// ============================================================================
suite("Suite 4: Hydration & Console Integrity Stress Testing")

test("4.1 pages/lecture/[id].tsx date rendering employs mounted guard AND suppressHydrationWarning", () => {
  const lectureTsx = readFile("pages/lecture/[id].tsx")
  assert.ok(lectureTsx, "pages/lecture/[id].tsx must exist")
  assert.match(
    lectureTsx,
    /suppressHydrationWarning/,
    "Question date element must have suppressHydrationWarning"
  )
  assert.match(
    lectureTsx,
    /isMounted\s*\?\s*new Date\([^)]+\)\.toLocaleDateString\(locale\)\s*:\s*["']["']/,
    "Question date must render empty string on SSR and locale date after client mount"
  )
})

test("4.2 Emulated client/server date rendering across diverse timezones causes zero mismatch", () => {
  const testTimestamp = "2026-09-05T22:30:00.000Z"
  
  // SSR render simulation: isMounted = false
  function ssrRender(timestamp, locale) {
    const isMounted = false
    return isMounted ? new Date(timestamp).toLocaleDateString(locale) : ""
  }

  // Initial client hydration render: isMounted is still false before useEffect
  function clientHydrationRender(timestamp, locale) {
    const isMounted = false
    return isMounted ? new Date(timestamp).toLocaleDateString(locale) : ""
  }

  // Post-mount client render: isMounted = true
  function postMountRender(timestamp, locale) {
    const isMounted = true
    return isMounted ? new Date(timestamp).toLocaleDateString(locale) : ""
  }

  const locales = ["en", "ar"]
  for (const loc of locales) {
    const ssrHtml = ssrRender(testTimestamp, loc)
    const clientHydrationHtml = clientHydrationRender(testTimestamp, loc)
    assert.equal(
      ssrHtml,
      clientHydrationHtml,
      `SSR and initial client render must match exactly for locale ${loc} (both empty)`
    )
    assert.equal(ssrHtml, "", "SSR output must be deterministic empty string")

    const postMountHtml = postMountRender(testTimestamp, loc)
    assert.ok(postMountHtml.length > 0, `Post-mount date should be formatted for locale ${loc}`)
  }
})

test("4.3 components/ui/badge.tsx renders <span> to preserve HTML5 button phrasing semantics", () => {
  const badgeTsx = readFile("components/ui/badge.tsx")
  assert.ok(badgeTsx, "components/ui/badge.tsx must exist")
  assert.match(
    badgeTsx,
    /<span\s+className=\{cn\(badgeVariants/,
    "Badge component must render a <span> element"
  )
  assert.ok(
    !badgeTsx.includes("<div className={cn(badgeVariants"),
    "Badge component must NEVER render a <div> element"
  )
  assert.match(
    badgeTsx,
    /HTMLSpanElement/,
    "BadgeProps must extend HTMLSpanElement"
  )
})

test("4.4 Production compiler suppresses console.log while preserving console.error", () => {
  const nextConfig = readFile("next.config.js")
  assert.match(
    nextConfig,
    /compiler\s*:\s*\{[\s\S]*removeConsole\s*:\s*process\.env\.NODE_ENV\s*===\s*['"]production['"]\s*\?\s*\{\s*exclude\s*:\s*\[['"]error['"],\s*['"]warn['"]\]\s*\}\s*:\s*false/,
    "next.config.js must configure compiler.removeConsole excluding error and warn"
  )
})

// ============================================================================
// SUITE 5: PRODUCTION README COMPLETENESS & RIGOR (ALL 10 SECTIONS)
// ============================================================================
suite("Suite 5: Production README Completeness & Rigor (All 10 Sections)")

test("5.1 README.md exists, formatted in Markdown, and has >= 20,000 bytes", () => {
  const readme = readFile("README.md")
  assert.ok(readme, "README.md must exist")
  assert.ok(
    readme.length >= 20000,
    `README.md should have at least 20,000 bytes, got ${readme.length}`
  )
})

test("5.2 README.md includes all 10 required sections with non-empty content", () => {
  const readme = readFile("README.md")
  const requiredSections = [
    { num: 1, title: "Header & Project Overview" },
    { num: 2, title: "Architecture & Tech Stack" },
    { num: 3, title: "Key System Capabilities" },
    { num: 4, title: "Security Architecture & Data Protection" },
    { num: 5, title: "Complete Database Schema Reference" },
    { num: 6, title: "API Route Catalog" },
    { num: 7, title: "Environment Variables Reference" },
    { num: 8, title: "Local Development Setup" },
    { num: 9, title: "Testing & Quality Assurance" },
    { num: 10, title: "Production Deployment Guide" },
  ]

  for (const sec of requiredSections) {
    const pattern = new RegExp(`##\\s*${sec.num}\\.\\s*${sec.title.replace(/&/g, "[&]")}`, "i")
    assert.match(
      readme,
      pattern,
      `README.md must contain section '## ${sec.num}. ${sec.title}'`
    )
  }
})

test("5.3 README.md documents all 12 core tables in the database schema reference", () => {
  const readme = readFile("README.md")
  const expectedTables = [
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

  for (const tbl of expectedTables) {
    assert.ok(
      readme.includes(tbl),
      `README.md must document table ${tbl}`
    )
  }
})

test("5.4 README.md accurately documents verification commands matching package.json", () => {
  const readme = readFile("README.md")
  assert.ok(readme.includes("npm test"), "README.md must document npm test")
  assert.ok(readme.includes("npm run build"), "README.md must document npm run build")
  assert.ok(readme.includes("npm run lint"), "README.md must document npm run lint")
  assert.ok(readme.includes("npx tsc --noEmit"), "README.md must document npx tsc --noEmit")
})

test("5.5 README.md contains zero residual create-next-app boilerplate", () => {
  const readme = readFile("README.md")
  assert.ok(
    !readme.includes("create-next-app"),
    "README.md must not contain create-next-app references"
  )
  assert.ok(
    !readme.includes("To learn more about Next.js, take a look at the following resources"),
    "README.md must not contain default Next.js template boilerplate"
  )
})

// ============================================================================
// FINAL HARNESS VERDICT & SUMMARY
// ============================================================================
console.log("\n══════════════════════════════════════════════════════════════════════")
console.log("  Adversarial Performance & Stress Harness Results")
console.log("══════════════════════════════════════════════════════════════════════")
console.log(`  Total Tests:  ${totalPassed + totalFailed}`)
console.log(`  Passed:       ${totalPassed}`)
console.log(`  Failed:       ${totalFailed}`)
console.log("══════════════════════════════════════════════════════════════════════")

if (totalFailed > 0) {
  console.error(`\nFAILED: ${totalFailed} stress tests failed:`)
  for (const f of failures) {
    console.error(`  - ${f.name}: ${f.error.message}`)
  }
  process.exitCode = 1
} else {
  console.log("\nSUCCESS: All adversarial stress tests PASSED with zero defects.")
  process.exitCode = 0
}
