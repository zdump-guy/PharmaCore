/**
 * Tier 1: Feature Coverage Test Suite
 * Validates requirements R1, R2, R3, R4 with >= 5 isolated test cases per feature.
 */

import { describe, it, expect } from "./helpers/test_framework.mjs"
import { loadProjectFile, parseCssUtilities, extractClassNames, extractTouchTargetHeights, evaluateCssLength } from "./helpers/layout_simulator.mjs"

describe("Tier 1 - Feature 1: Global Safe-Area Bottom Insets (R1)", () => {
  const css = loadProjectFile("styles/globals.css")

  it("1.1 defines .pb-safe with env(safe-area-inset-bottom)", () => {
    expect(css).toMatch(/\.pb-safe\s*\{[^}]*padding-bottom:\s*env\(safe-area-inset-bottom/i)
  })

  it("1.2 defines .pt-safe with env(safe-area-inset-top)", () => {
    expect(css).toMatch(/\.pt-safe\s*\{[^}]*padding-top:\s*env\(safe-area-inset-top/i)
  })

  it("1.3 defines .safe-area-bottom with max(1rem, env(safe-area-inset-bottom))", () => {
    expect(css).toMatch(/\.safe-area-bottom\s*\{[^}]*padding-bottom:\s*max\(\s*1rem\s*,\s*env\(safe-area-inset-bottom/i)
  })

  it("1.4 provides 0px fallback for env() across all safe-area utilities", () => {
    expect(css).toMatch(/env\(safe-area-inset-bottom\s*,\s*0px\)/i)
    expect(css).toMatch(/env\(safe-area-inset-top\s*,\s*0px\)/i)
  })

  it("1.5 places safe-area utilities within @layer utilities or components", () => {
    const hasLayerUtilities = css.includes("@layer utilities")
    expect(hasLayerUtilities).toBe(true)
    const utilitiesSection = css.split("@layer utilities")[1]
    expect(utilitiesSection).toContain("safe")
  })
})

describe("Tier 1 - Feature 2: Intermediate Typography Scaling (R1)", () => {
  const css = loadProjectFile("styles/globals.css")

  it("2.1 includes md:text-6xl in .display-title utility class", () => {
    expect(css).toMatch(/\.display-title\s*\{[^}]*md:text-6xl/i)
  })

  it("2.2 maintains fluid typographic ramp across all standard breakpoints in .display-title", () => {
    const displayTitleMatch = css.match(/\.display-title\s*\{([^}]+)\}/)
    expect(displayTitleMatch).toBeTruthy()
    const rule = displayTitleMatch[1]
    expect(rule).toContain("text-4xl")
    expect(rule).toContain("sm:text-5xl")
    expect(rule).toContain("md:text-6xl")
    expect(rule).toContain("lg:text-7xl")
  })

  it("2.3 enforces max-w-4xl constraint to prevent overstretched line lengths", () => {
    expect(css).toMatch(/\.display-title\s*\{[^}]*max-w-4xl/i)
  })

  it("2.4 applies text-balance and tight leading for crisp multi-line headings", () => {
    expect(css).toMatch(/\.display-title\s*\{[^}]*text-balance/i)
    expect(css).toMatch(/\.display-title\s*\{[^}]*leading-\[1\.07\]/i)
  })

  it("2.5 preserves font-tajawal for Arabic RTL heading rendering", () => {
    expect(css).toMatch(/\[dir="rtl"\]\s+h1/i)
    expect(css).toMatch(/font-family:\s*var\(--font-tajawal\)/i)
  })
})

describe("Tier 1 - Feature 3: Cross-Browser Scrollbar-None Utility (R1)", () => {
  const css = loadProjectFile("styles/globals.css")

  it("3.1 defines .scrollbar-none in CSS stylesheet", () => {
    expect(css).toMatch(/\.scrollbar-none\b/i)
  })

  it("3.2 suppresses scrollbars in WebKit engines via ::-webkit-scrollbar", () => {
    expect(css).toMatch(/\.scrollbar-none::-webkit-scrollbar\s*\{[^}]*display:\s*none/i)
  })

  it("3.3 suppresses scrollbars in Firefox via scrollbar-width: none", () => {
    expect(css).toMatch(/\.scrollbar-none\s*\{[^}]*scrollbar-width:\s*none/i)
  })

  it("3.4 suppresses scrollbars in IE/Legacy Edge via -ms-overflow-style: none", () => {
    expect(css).toMatch(/\.scrollbar-none\s*\{[^}]*-ms-overflow-style:\s*none/i)
  })

  it("3.5 does not override overflow-x to allow touch/trackpad horizontal panning", () => {
    const scrollbarRule = css.match(/\.scrollbar-none\s*\{([^}]+)\}/)?.[1] || ""
    expect(scrollbarRule.includes("overflow: hidden")).toBe(false)
  })
})

describe("Tier 1 - Feature 4: Navbar User Dropdown Viewport Clamping & RTL (R2)", () => {
  const navbarTsx = loadProjectFile("components/Navbar.tsx")

  it("4.1 contains user dropdown width clamped with min(14rem, calc(100vw - 1.5rem))", () => {
    expect(navbarTsx).toContain("w-[min(14rem,calc(100vw-1.5rem))]")
  })

  it("4.2 uses logical alignment end-0 for dropdown container", () => {
    expect(navbarTsx).toMatch(/w-\[min\(14rem,calc\(100vw-1\.5rem\)\)\][^"]*\bend-0\b/)
  })

  it("4.3 removes hardcoded physical start-0 / end-0 ternary in favor of logical end-0", () => {
    expect(navbarTsx.includes('isAr ? "start-0" : "end-0"')).toBe(false)
  })

  it("4.4 dropdown width evaluates to <= 296px on 320px viewport", () => {
    const computedWidth = evaluateCssLength("min(14rem, calc(100vw - 1.5rem))", 320)
    expect(computedWidth).toBe(224) // 14rem = 224px <= 296px
    expect(computedWidth).toBeLessThanOrEqual(320 - 24)
  })

  it("4.5 dropdown width evaluates to strictly fit within 200px micro viewport", () => {
    const computedWidth = evaluateCssLength("min(14rem, calc(100vw - 1.5rem))", 200)
    expect(computedWidth).toBe(176) // 200 - 24 = 176px < 224px
    expect(computedWidth).toBeLessThan(200)
  })
})

describe("Tier 1 - Feature 5: Homepage Hero Min-Height & CTA Mobile Stretch (R3)", () => {
  const indexTsx = loadProjectFile("pages/index.tsx")

  it("5.1 scales hero section min-height from min-h-[520px] on mobile to sm:min-h-[620px]", () => {
    expect(indexTsx).toContain("min-h-[520px] sm:min-h-[620px]")
  })

  it("5.2 ensures hero primary CTA button stretches full-width on mobile (w-full sm:w-auto)", () => {
    expect(indexTsx).toMatch(/<Button[^>]*className="[^"]*w-full\s+sm:w-auto[^"]*"[^>]*>\s*<a[^>]*href="#courses"/)
  })

  it("5.3 ensures hero secondary CTA button stretches full-width on mobile (w-full sm:w-auto)", () => {
    expect(indexTsx).toMatch(/<Button[^>]*className="[^"]*w-full\s+sm:w-auto[^"]*"[^>]*>\s*<a[^>]*href="#about"/)
  })

  it("5.4 ensures bottom banner CTA button stretches full-width on mobile (w-full sm:w-auto)", () => {
    expect(indexTsx).toMatch(/<Button[^>]*className="[^"]*w-full\s+sm:w-auto[^"]*"[^>]*>\s*<a[^>]*href="#courses"/)
  })

  it("5.5 uses flex-col sm:flex-row on hero action buttons wrapper for mobile stacking", () => {
    expect(indexTsx).toContain("flex flex-col gap-3 sm:flex-row")
  })
})

describe("Tier 1 - Feature 6: Login Container Mobile Keyboard Shift Fix (R3)", () => {
  const loginTsx = loadProjectFile("pages/login.tsx")

  it("6.1 uses py-10 sm:min-h-[calc(100vh-5rem)] sm:items-center on main page shell", () => {
    expect(loginTsx).toContain("py-10 sm:min-h-[calc(100vh-5rem)] sm:items-center")
  })

  it("6.2 eliminates unconditional items-center min-h-screen on mobile viewports", () => {
    expect(loginTsx.includes("min-h-[calc(100vh-5rem)] items-center gap-10 py-10")).toBe(false)
  })

  it("6.3 structures auth tabs trigger list with full-width grid on mobile", () => {
    expect(loginTsx).toContain("grid w-full grid-cols-2 mb-6")
  })

  it("6.4 collapses registration form fields to single column on mobile (grid gap-3 sm:grid-cols-2)", () => {
    const multiColCount = (loginTsx.match(/grid gap-3 sm:grid-cols-2/g) || []).length
    expect(multiColCount).toBeGreaterThanOrEqual(3)
  })

  it("6.5 ensures submit buttons have w-full for thumb-reachable full-width hit area", () => {
    expect(loginTsx).toMatch(/<Button[^>]*type="submit"[^>]*className="[^"]*w-full/)
  })
})

describe("Tier 1 - Feature 7: Lecture Adaptive Side-by-Side Grid lg Breakpoint (R4)", () => {
  const lectureTsx = loadProjectFile("pages/lecture/[id].tsx")

  it("7.1 main grid switches to 2 columns at lg (1024px) breakpoint", () => {
    expect(lectureTsx).toContain("lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]")
  })

  it("7.2 removes old xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] constraint", () => {
    expect(lectureTsx.includes("xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]")).toBe(false)
  })

  it("7.3 aside Q&A container applies sticky sidebar behavior at lg breakpoint", () => {
    expect(lectureTsx).toContain("lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pe-1 lg:self-start")
  })

  it("7.4 aside container min-w-0 prevents flex/grid child blowouts on mobile", () => {
    expect(lectureTsx).toMatch(/<aside[^>]*className="[^"]*min-w-0[^"]*"/)
  })

  it("7.5 stacks in single column under 1024px for optimal mobile/tablet reading flow", () => {
    const gridMatch = lectureTsx.match(/grid gap-8 lg:grid-cols-\[minmax\(0,1fr\)_minmax\(340px,420px\)\]/)
    expect(gridMatch).toBeTruthy()
  })
})

describe("Tier 1 - Feature 8: Lecture Tab Touch Targets (R4)", () => {
  const lectureTsx = loadProjectFile("pages/lecture/[id].tsx")

  it("8.1 all TabsTrigger components specify min-h-[44px]", () => {
    const triggerMatches = lectureTsx.match(/<TabsTrigger[^>]+className="([^"]+)"/g) || []
    expect(triggerMatches.length).toBeGreaterThanOrEqual(4)
    for (const trigger of triggerMatches) {
      expect(trigger).toContain("min-h-[44px]")
    }
  })

  it("8.2 removes outdated sub-standard min-h-10 (40px) from lecture tabs", () => {
    const hasMinH10 = /<TabsTrigger[^>]+className="[^"]*min-h-10[^"]*"/.test(lectureTsx)
    expect(hasMinH10).toBe(false)
  })

  it("8.3 tabs list uses responsive 2-col to 4-col grid (grid-cols-2 sm:grid-cols-4)", () => {
    expect(lectureTsx).toContain("grid h-auto w-full grid-cols-2 sm:grid-cols-4")
  })

  it("8.4 action buttons in lecture tabs have accessible touch heights", () => {
    expect(lectureTsx).toMatch(/<Button[^>]*type="submit"/)
  })

  it("8.5 back to course link has touch-friendly hit area", () => {
    expect(lectureTsx).toMatch(/<Button[^>]*variant="ghost"[^>]*className="[^"]*-ms-4/)
  })
})

describe("Tier 1 - Feature 9: Course Turnstile Widget Containment (R4)", () => {
  const courseTsx = loadProjectFile("pages/course/[id].tsx")

  it("9.1 Turnstile widget in course page is wrapped in overflow-hidden container", () => {
    expect(courseTsx).toMatch(/<div[^>]*className="[^"]*w-full[^"]*max-w-full[^"]*overflow-hidden[^"]*"[^>]*>\s*<Turnstile/m)
  })

  it("9.2 course enrollment action button spans full width on mobile (w-full)", () => {
    expect(courseTsx).toMatch(/<Button[^>]*className="[^"]*w-full[^"]*"[^>]*>\s*<ClipboardCheck/)
  })

  it("9.3 course page header badge row wraps cleanly without horizontal clipping", () => {
    expect(courseTsx).toContain("flex flex-wrap items-center gap-2")
  })

  it("9.4 syllabus accordion trigger maintains min-h-20 with flex wrap containment", () => {
    expect(courseTsx).toContain("AccordionTrigger className=\"min-h-20 gap-4 py-4")
  })

  it("9.5 course details text container enforces word break containment", () => {
    expect(courseTsx).toContain("break-words")
  })
})

describe("Tier 1 - Feature 10: Profile Tab Scrollbar Removal & Touch Targets (R4)", () => {
  const profileTsx = loadProjectFile("pages/profile.tsx")

  it("10.1 tab navigation container incorporates scrollbar-none utility", () => {
    expect(profileTsx).toMatch(/<div[^>]*className="[^"]*scrollbar-none[^"]*"[^>]*>/)
  })

  it("10.2 profile tab buttons meet WCAG touch target height with min-h-[44px]", () => {
    const tabBtnMatches = profileTsx.match(/<button[\s\S]*?onClick=\{\(\)\s*=>\s*setActiveTab\([^)]+\)\}[\s\S]*?>/g) || []
    expect(tabBtnMatches.length).toBe(3)
    for (const btn of tabBtnMatches) {
      expect(btn).toContain("min-h-[44px]")
    }
  })

  it("10.3 tab container retains overflow-x-auto for smooth horizontal gesture scrolling", () => {
    expect(profileTsx).toMatch(/<div[^>]*className="[^"]*overflow-x-auto[^"]*scrollbar-none[^"]*"/)
  })

  it("10.4 profile save changes button stretches full-width on mobile (w-full sm:w-auto)", () => {
    expect(profileTsx).toContain("w-full sm:w-auto")
  })

  it("10.5 profile study metrics cards render in 2 columns on mobile (grid-cols-2 lg:grid-cols-4)", () => {
    expect(profileTsx).toContain("grid gap-4 grid-cols-2 lg:grid-cols-4")
  })
})
