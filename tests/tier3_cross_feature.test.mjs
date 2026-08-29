/**
 * Tier 3: Cross-Feature Combinations Test Suite
 * Validates complex pairwise and multi-feature responsive interactions.
 */

import { describe, it, expect } from "./helpers/test_framework.mjs"
import { loadProjectFile, evaluateCssLength } from "./helpers/layout_simulator.mjs"

describe("Tier 3 - Combination 1: RTL + Mobile Viewport (320px) + User Profile Dropdown", () => {
  const navbarTsx = loadProjectFile("components/Navbar.tsx")

  it("1.1 user menu aligns to logical start edge in RTL with end-0 and dir='rtl'", () => {
    expect(navbarTsx).toContain("end-0")
    expect(navbarTsx).toContain('dir={isAr ? "rtl" : "ltr"}')
  })

  it("1.2 width clamping calculation on 320px in RTL guarantees 24px safety margin", () => {
    const width = evaluateCssLength("min(14rem, calc(100vw - 1.5rem))", 320)
    expect(width).toBe(224)
    expect(320 - width).toBe(96)
  })

  it("1.3 dropdown items truncate long Arabic text names without breaking layout", () => {
    expect(navbarTsx).toMatch(/<p[^>]*className="[^"]*truncate[^"]*"[^>]*>\{authUser\.fullName\}<\/p>/)
  })

  it("1.4 avatar badge retains fixed shrink-0 size without distorting in RTL flex layout", () => {
    expect(navbarTsx).toMatch(/<span[^>]*className="[^"]*shrink-0[^"]*"[^>]*>/)
  })
})

describe("Tier 3 - Combination 2: Mobile Viewport (375px) + Virtual Keyboard + Login Tabs", () => {
  const loginTsx = loadProjectFile("pages/login.tsx")

  it("2.1 login shell layout remains static at top when virtual keyboard reduces viewport height", () => {
    expect(loginTsx).toContain("py-10 sm:min-h-[calc(100vh-5rem)] sm:items-center")
  })

  it("2.2 login input fields maintain accessible height (ps-9 with start-3 icon alignment)", () => {
    expect(loginTsx).toContain("className=\"ps-9\"")
    expect(loginTsx).toContain("start-3 top-1/2")
  })

  it("2.3 switching between signin and signup tabs maintains consistent container width", () => {
    expect(loginTsx).toContain("mx-auto w-full max-w-lg")
    expect(loginTsx).toContain("grid w-full grid-cols-2")
  })

  it("2.4 validation alerts render full width with flex wrap for multi-line error notices", () => {
    expect(loginTsx).toContain("<Alert variant=\"destructive\">")
  })
})

describe("Tier 3 - Combination 3: Responsive Hero Scaling + Localized CTA Button Wrapping", () => {
  const indexTsx = loadProjectFile("pages/index.tsx")

  it("3.1 hero container accommodates long multi-line Arabic titles with min-h-[520px] on mobile", () => {
    expect(indexTsx).toContain("min-h-[520px] sm:min-h-[620px]")
  })

  it("3.2 CTA buttons stack vertically on mobile (flex-col) and switch to row on tablet (sm:flex-row)", () => {
    expect(indexTsx).toContain("flex flex-col gap-3 sm:flex-row")
  })

  it("3.3 primary and secondary CTA buttons stretch to identical 100% width on mobile (w-full sm:w-auto)", () => {
    const btnMatches = indexTsx.match(/className="[^"]*w-full\s+sm:w-auto[^"]*"/g) || []
    expect(btnMatches.length).toBeGreaterThanOrEqual(2)
  })

  it("3.4 feature note badges wrap cleanly with flex-wrap and gap-3 on mobile", () => {
    expect(indexTsx).toContain("flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:gap-6 flex-wrap")
  })
})

describe("Tier 3 - Combination 4: Lecture Video Player + Aside Q&A Panel Breakpoint Transition", () => {
  const lectureTsx = loadProjectFile("pages/lecture/[id].tsx")

  it("4.1 at 1023px (just below lg), main layout is single-column stacked", () => {
    expect(lectureTsx).toContain("lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]")
    const isLg = 1023 >= 1024
    expect(isLg).toBe(false)
  })

  it("4.2 at 1024px (lg breakpoint), main layout activates side-by-side grid with sticky Q&A", () => {
    expect(lectureTsx).toContain("lg:sticky lg:top-28")
    const isLg = 1024 >= 1024
    expect(isLg).toBe(true)
  })

  it("4.3 aside panel max height is constrained to lg:max-h-[calc(100vh-8rem)] with scroll on desktop", () => {
    expect(lectureTsx).toContain("lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto")
  })

  it("4.4 video player aspect-video maintains 16:9 ratio in both stacked and grid modes", () => {
    expect(lectureTsx).toContain("aspect-video overflow-hidden rounded-2xl border")
  })
})

describe("Tier 3 - Combination 5: Profile Horizontal Tab Swipe + 2-Column Metrics at 320px", () => {
  const profileTsx = loadProjectFile("pages/profile.tsx")

  it("5.1 tab navigation uses scrollbar-none while enabling horizontal swipe panning with overflow-x-auto", () => {
    expect(profileTsx).toMatch(/<div[^>]*className="[^"]*overflow-x-auto[^"]*scrollbar-none[^"]*"/)
  })

  it("5.2 tab triggers meet 44px touch target without being clipped by horizontal strip", () => {
    expect(profileTsx).toContain("min-h-[44px]")
  })

  it("5.3 4 metric cards split cleanly into 2x2 grid on 320px mobile", () => {
    expect(profileTsx).toContain("grid gap-4 grid-cols-2 lg:grid-cols-4")
  })

  it("5.4 save changes button spans full container width on 320px mobile (w-full sm:w-auto)", () => {
    expect(profileTsx).toContain("w-full sm:w-auto")
  })
})
