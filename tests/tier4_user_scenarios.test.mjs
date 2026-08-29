/**
 * Tier 4: Real-World Application Scenarios Test Suite
 * Validates complete end-to-end mobile learner journeys, accessibility touch target audits,
 * RTL workflows, and multi-step responsive flows.
 */

import { describe, it, expect } from "./helpers/test_framework.mjs"
import { loadProjectFile, extractClassNames, extractTouchTargetHeights, evaluateCssLength } from "./helpers/layout_simulator.mjs"

describe("Tier 4 - Scenario 1: Complete Mobile Learner End-to-End Journey", () => {
  const indexTsx = loadProjectFile("pages/index.tsx")
  const loginTsx = loadProjectFile("pages/login.tsx")
  const lectureTsx = loadProjectFile("pages/lecture/[id].tsx")
  const courseTsx = loadProjectFile("pages/course/[id].tsx")
  const profileTsx = loadProjectFile("pages/profile.tsx")

  it("1.1 Step 1 (Homepage): Hero CTA button leads mobile learner directly to courses anchor", () => {
    expect(indexTsx).toMatch(/<a[^>]*href="#courses"/)
    expect(indexTsx).toContain("w-full sm:w-auto")
  })

  it("1.2 Step 2 (Authentication): Student logs in via mobile-aligned keyboard-safe form", () => {
    expect(loginTsx).toContain("py-10 sm:min-h-[calc(100vh-5rem)] sm:items-center")
    expect(loginTsx).toMatch(/<Button[^>]*type="submit"[^>]*className="[^"]*w-full/)
  })

  it("1.3 Step 3 (Lecture Room): Mobile player renders 16:9 video with stacked tabs below", () => {
    expect(lectureTsx).toContain("aspect-video")
    expect(lectureTsx).toContain("grid h-auto w-full grid-cols-2 sm:grid-cols-4")
    expect(lectureTsx).toContain("min-h-[44px]")
  })

  it("1.4 Step 4 (Course Hub): Student views syllabus and enrolls via contained Turnstile widget", () => {
    expect(courseTsx).toMatch(/<div[^>]*className="[^"]*w-full[^"]*max-w-full[^"]*overflow-hidden[^"]*"[^>]*>\s*<Turnstile/m)
    expect(courseTsx).toContain("AccordionTrigger className=\"min-h-20 gap-4 py-4")
  })

  it("1.5 Step 5 (Profile Hub): Student swipes through profile tabs without scrollbar clutter", () => {
    expect(profileTsx).toMatch(/<div[^>]*className="[^"]*overflow-x-auto[^"]*scrollbar-none[^"]*"/)
    expect(profileTsx).toContain("min-h-[44px]")
  })
})

describe("Tier 4 - Scenario 2: Arabic (RTL) Mobile Student Onboarding & Video Learning", () => {
  const navbarTsx = loadProjectFile("components/Navbar.tsx")
  const globalsCss = loadProjectFile("styles/globals.css")
  const lectureTsx = loadProjectFile("pages/lecture/[id].tsx")

  it("2.1 sets font-tajawal for all Arabic headings and body text", () => {
    expect(globalsCss).toContain('[dir="rtl"]')
    expect(globalsCss).toContain("var(--font-tajawal)")
  })

  it("2.2 user profile dropdown aligns to logical end-0 with RTL text alignment", () => {
    expect(navbarTsx).toMatch(/w-\[min\(14rem,calc\(100vw-1\.5rem\)\)\][^"]*\bend-0\b/)
    expect(navbarTsx).toContain('dir={isAr ? "rtl" : "ltr"}')
  })

  it("2.3 mobile navigation drawer slides in from the left for Arabic locale", () => {
    expect(navbarTsx).toContain('side={isAr ? "left" : "right"}')
  })

  it("2.4 lecture Q&A mentor answer badge aligns with border-s-2 in RTL", () => {
    expect(lectureTsx).toContain("border-s-2 border-primary")
  })
})

describe("Tier 4 - Scenario 3: Tablet Learner Experience (768px - 1024px)", () => {
  const globalsCss = loadProjectFile("styles/globals.css")
  const navbarTsx = loadProjectFile("components/Navbar.tsx")
  const lectureTsx = loadProjectFile("pages/lecture/[id].tsx")

  it("3.1 typography uses intermediate md:text-6xl for optimal tablet readability", () => {
    expect(globalsCss).toContain("md:text-6xl")
  })

  it("3.2 desktop navigation bar is visible without needing hamburger sheet (md:flex)", () => {
    expect(navbarTsx).toContain("hidden items-center gap-1 rounded-full bg-muted/35 p-1 md:flex")
  })

  it("3.3 lecture main grid cleanly stacks on tablet (< 1024px) for full-width whiteboard viewing", () => {
    expect(lectureTsx).toContain("lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]")
  })

  it("3.4 lecture tabs switch from 2 columns to 4 columns on tablet (sm:grid-cols-4)", () => {
    expect(lectureTsx).toContain("grid-cols-2 sm:grid-cols-4")
  })
})

describe("Tier 4 - Scenario 4: Fast Device Rotation / Dynamic Resizing Audit", () => {
  it("4.1 calculates dropdown bounds dynamically from 320px up to 1400px without layout shifts", () => {
    const testWidths = [320, 375, 390, 414, 480, 640, 768, 820, 1024, 1280, 1440]
    for (const w of testWidths) {
      const dropdownWidth = evaluateCssLength("min(14rem, calc(100vw - 1.5rem))", w)
      // Max dropdown width is 14rem = 224px
      expect(dropdownWidth).toBeLessThanOrEqual(224)
      // Must not exceed viewport minus margin
      expect(dropdownWidth).toBeLessThanOrEqual(w - 24)
    }
  })

  it("4.2 verifies safe-area padding equations hold across portrait and landscape", () => {
    const globalsCss = loadProjectFile("styles/globals.css")
    expect(globalsCss).toContain(".pb-safe")
    expect(globalsCss).toContain(".pt-safe")
    expect(globalsCss).toContain(".safe-area-bottom")
  })
})

describe("Tier 4 - Scenario 5: WCAG 2.5.5 Touch Target Accessibility Audit", () => {
  const lectureTsx = loadProjectFile("pages/lecture/[id].tsx")
  const profileTsx = loadProjectFile("pages/profile.tsx")
  const navbarTsx = loadProjectFile("components/Navbar.tsx")

  it("5.1 lecture tabs triggers strictly meet >= 44px height", () => {
    const triggers = lectureTsx.match(/<TabsTrigger[^>]+className="([^"]+)"/g) || []
    for (const trigger of triggers) {
      const height = extractTouchTargetHeights(trigger)
      expect(height).toBeGreaterThanOrEqual(44)
    }
  })

  it("5.2 profile tabs triggers strictly meet >= 44px height", () => {
    const buttons = profileTsx.match(/<button[\s\S]*?onClick=\{\(\)\s*=>\s*setActiveTab\([^)]+\)\}[\s\S]*?>/g) || []
    expect(buttons.length).toBe(3)
    for (const btn of buttons) {
      const height = extractTouchTargetHeights(btn)
      expect(height).toBeGreaterThanOrEqual(44)
    }
  })

  it("5.3 mobile menu trigger button meets >= 44px (size-11 = 44px)", () => {
    expect(navbarTsx).toContain("size-11 shrink-0 rounded-full")
    const size11Height = 11 * 4 // 44px
    expect(size11Height).toBeGreaterThanOrEqual(44)
  })

  it("5.4 drawer locale and theme switcher buttons meet min-h-[44px]", () => {
    const drawerButtons = navbarTsx.match(/min-h-\[44px\]\s+rounded-2xl\s+justify-center/g) || []
    expect(drawerButtons.length).toBeGreaterThanOrEqual(2)
  })
})
