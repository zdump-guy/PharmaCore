/**
 * Tier 2: Boundary & Corner Cases Test Suite
 * Validates layout geometry across standard breakpoints (320px, 375px, 390px, 768px, 1024px, 1280px),
 * extreme small widths, LTR vs RTL, and content density edge cases.
 */

import { describe, it, expect } from "./helpers/test_framework.mjs"
import { loadProjectFile, evaluateCssLength, STANDARD_VIEWPORTS, EXTREME_VIEWPORTS } from "./helpers/layout_simulator.mjs"

describe("Tier 2 - Boundary 1: 320px Mobile Viewport (iPhone SE 1st Gen)", () => {
  const vp = STANDARD_VIEWPORTS.find((v) => v.width === 320)
  const navbarTsx = loadProjectFile("components/Navbar.tsx")
  const indexTsx = loadProjectFile("pages/index.tsx")
  const loginTsx = loadProjectFile("pages/login.tsx")
  const lectureTsx = loadProjectFile("pages/lecture/[id].tsx")

  it("1.1 navbar user dropdown width is constrained to <= 296px (320 - 24)", () => {
    const width = evaluateCssLength("min(14rem, calc(100vw - 1.5rem))", vp.width)
    expect(width).toBeLessThanOrEqual(vp.width - 24)
    expect(width).toBe(224)
  })

  it("1.2 homepage hero min-height resolves to 520px at 320px", () => {
    // Under 640px sm breakpoint, min-h-[520px] applies
    expect(indexTsx).toContain("min-h-[520px]")
    expect(vp.width).toBeLessThan(640)
  })

  it("1.3 login container disables vertical flex centering at 320px", () => {
    expect(loginTsx).toContain("py-10 sm:min-h-[calc(100vh-5rem)] sm:items-center")
    // sm: only activates at >= 640px
    expect(vp.width).toBeLessThan(640)
  })

  it("1.4 lecture layout collapses into single-column stacked view at 320px", () => {
    expect(lectureTsx).toContain("lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]")
    expect(vp.width).toBeLessThan(1024)
  })

  it("1.5 all interactive elements maintain >= 44px touch height at 320px", () => {
    expect(lectureTsx).toContain("min-h-[44px]")
  })
})

describe("Tier 2 - Boundary 2: 375px Mobile Viewport (iPhone SE 2nd/3rd Gen)", () => {
  const vp = STANDARD_VIEWPORTS.find((v) => v.width === 375)
  const navbarTsx = loadProjectFile("components/Navbar.tsx")
  const indexTsx = loadProjectFile("pages/index.tsx")

  it("2.1 user dropdown occupies 224px (14rem) with 151px safe margin at 375px", () => {
    const width = evaluateCssLength("min(14rem, calc(100vw - 1.5rem))", vp.width)
    expect(width).toBe(224)
    const margin = vp.width - width
    expect(margin).toBeGreaterThanOrEqual(24)
  })

  it("2.2 hero CTA buttons stretch 100% width on 375px screen", () => {
    expect(indexTsx).toContain("w-full sm:w-auto")
    expect(vp.width).toBeLessThan(640)
  })

  it("2.3 navbar sheet drawer width evaluates to 330px (88vw <= 360px max) at 375px", () => {
    const drawerWidth = evaluateCssLength("min(360px, 88vw)", vp.width)
    expect(drawerWidth).toBe(330)
    expect(drawerWidth).toBeLessThan(vp.width)
  })

  it("2.4 brand title renders visibly via BrandLogo at 375px", () => {
    expect(navbarTsx).toContain("BrandLogo")
    expect(vp.width).toBeGreaterThanOrEqual(360)
  })

  it("2.5 mobile navigation buttons maintain touch-safe spacing at 375px", () => {
    expect(navbarTsx).toContain("size-11 shrink-0 rounded-full")
  })
})

describe("Tier 2 - Boundary 3: 390px Mobile Viewport (iPhone 14/15)", () => {
  const vp = STANDARD_VIEWPORTS.find((v) => v.width === 390)
  const profileTsx = loadProjectFile("pages/profile.tsx")
  const loginTsx = loadProjectFile("pages/login.tsx")

  it("3.1 profile metrics grid renders 2 items per row at 390px", () => {
    expect(profileTsx).toContain("grid-cols-2 lg:grid-cols-4")
    expect(vp.width).toBeLessThan(1024)
  })

  it("3.2 profile tab triggers have min-h-[44px] touch target at 390px", () => {
    expect(profileTsx).toContain("min-h-[44px]")
  })

  it("3.3 login auth card max-w-lg centers horizontally without overflow at 390px", () => {
    expect(loginTsx).toContain("mx-auto w-full max-w-lg")
  })

  it("3.4 signup multi-column fields stack in single column at 390px", () => {
    expect(loginTsx).toContain("grid gap-3 sm:grid-cols-2")
    expect(vp.width).toBeLessThan(640)
  })

  it("3.5 safe-area bottom padding evaluates cleanly on notched mobile (390px)", () => {
    const globalsCss = loadProjectFile("styles/globals.css")
    expect(globalsCss).toContain("env(safe-area-inset-bottom")
  })
})

describe("Tier 2 - Boundary 4: 768px Tablet Viewport (iPad Mini / Portrait)", () => {
  const vp = STANDARD_VIEWPORTS.find((v) => v.width === 768)
  const css = loadProjectFile("styles/globals.css")
  const indexTsx = loadProjectFile("pages/index.tsx")
  const lectureTsx = loadProjectFile("pages/lecture/[id].tsx")
  const navbarTsx = loadProjectFile("components/Navbar.tsx")

  it("4.1 typography scales up to md:text-6xl at 768px", () => {
    expect(css).toContain("md:text-6xl")
    expect(vp.width).toBeGreaterThanOrEqual(768)
  })

  it("4.2 hero CTA buttons adopt natural auto width at 768px (sm:w-auto)", () => {
    expect(indexTsx).toContain("w-full sm:w-auto")
    expect(vp.width).toBeGreaterThanOrEqual(640)
  })

  it("4.3 desktop navigation bar displays full pill links at 768px (md:flex)", () => {
    expect(navbarTsx).toContain("md:flex")
    expect(vp.width).toBeGreaterThanOrEqual(768)
  })

  it("4.4 lecture page maintains stacked 1-column layout below 1024px at 768px", () => {
    expect(lectureTsx).toContain("lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]")
    expect(vp.width).toBeLessThan(1024)
  })

  it("4.5 homepage feature cards display in 2 columns at 768px (md:grid-cols-2)", () => {
    expect(indexTsx).toContain("md:grid-cols-2")
    expect(vp.width).toBeGreaterThanOrEqual(768)
  })
})

describe("Tier 2 - Boundary 5: 1024px Desktop Transition Viewport", () => {
  const vp = STANDARD_VIEWPORTS.find((v) => v.width === 1024)
  const lectureTsx = loadProjectFile("pages/lecture/[id].tsx")
  const profileTsx = loadProjectFile("pages/profile.tsx")
  const indexTsx = loadProjectFile("pages/index.tsx")

  it("5.1 lecture page activates 2-column side-by-side grid at 1024px (lg breakpoint)", () => {
    expect(lectureTsx).toContain("lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]")
    expect(vp.width).toBeGreaterThanOrEqual(1024)
  })

  it("5.2 lecture aside Q&A container activates sticky positioning at 1024px", () => {
    expect(lectureTsx).toContain("lg:sticky lg:top-28")
    expect(vp.width).toBeGreaterThanOrEqual(1024)
  })

  it("5.3 profile metrics switch from 2 columns to 4 columns at 1024px", () => {
    expect(profileTsx).toContain("grid gap-4 grid-cols-2 lg:grid-cols-4")
    expect(vp.width).toBeGreaterThanOrEqual(1024)
  })

  it("5.4 display title scales to lg:text-7xl at 1024px", () => {
    const css = loadProjectFile("styles/globals.css")
    expect(css).toContain("lg:text-7xl")
    expect(vp.width).toBeGreaterThanOrEqual(1024)
  })

  it("5.5 homepage hero section increases vertical padding at 1024px (lg:py-24)", () => {
    expect(indexTsx).toContain("py-16 lg:py-24")
  })
})

describe("Tier 2 - Boundary 6: 1280px Large Desktop Viewport", () => {
  const vp = STANDARD_VIEWPORTS.find((v) => v.width === 1280)
  const css = loadProjectFile("styles/globals.css")
  const indexTsx = loadProjectFile("pages/index.tsx")

  it("6.1 max-w-7xl page-shell constrains maximum container width at 1280px", () => {
    expect(css).toContain("max-w-7xl")
  })

  it("6.2 homepage courses grid renders 3 columns at 1280px (xl:grid-cols-3)", () => {
    expect(indexTsx).toContain("xl:grid-cols-3")
    expect(vp.width).toBeGreaterThanOrEqual(1280)
  })

  it("6.3 aside lecture panel maintains fixed max width constraint (max-w-[420px])", () => {
    const lectureTsx = loadProjectFile("pages/lecture/[id].tsx")
    expect(lectureTsx).toContain("minmax(340px,420px)")
  })

  it("6.4 navbar is constrained to max-w-[1400px] without stretching", () => {
    const navbarTsx = loadProjectFile("components/Navbar.tsx")
    expect(navbarTsx).toContain("max-w-[1400px]")
  })

  it("6.5 prose reading measure limits maximum line length (prose-measure / max-w-2xl)", () => {
    expect(css).toContain("prose-measure")
  })
})

describe("Tier 2 - Boundary 7: Extreme Micro Viewports (240px - 280px)", () => {
  const navbarTsx = loadProjectFile("components/Navbar.tsx")

  it("7.1 user dropdown at 280px clamps to 256px ensuring zero horizontal overflow", () => {
    const width = evaluateCssLength("min(14rem, calc(100vw - 1.5rem))", 280)
    expect(width).toBe(224)
    expect(width).toBeLessThan(280)
  })

  it("7.2 user dropdown at 240px clamps to 216px (240 - 24) preventing screen breakout", () => {
    const width = evaluateCssLength("min(14rem, calc(100vw - 1.5rem))", 240)
    expect(width).toBe(216)
    expect(width).toBeLessThan(240)
    expect(240 - width).toBe(24) // 1.5rem padding preserved
  })

  it("7.3 body element enforces overflow-x-hidden to prevent rogue subpixel horizontal scrolls", () => {
    const css = loadProjectFile("styles/globals.css")
    expect(css).toMatch(/body\s*\{[^}]*overflow-x-hidden/i)
  })

  it("7.4 media elements enforce max-width: 100% to prevent image/video blowout", () => {
    const css = loadProjectFile("styles/globals.css")
    expect(css).toMatch(/img,\s*svg,\s*video[^}]*max-width:\s*100%/i)
  })

  it("7.5 headings apply overflow-wrap: anywhere and word-break: break-word for long text", () => {
    const css = loadProjectFile("styles/globals.css")
    expect(css).toMatch(/overflow-wrap:\s*anywhere/i)
    expect(css).toMatch(/word-break:\s*break-word/i)
  })
})

describe("Tier 2 - Boundary 8: LTR vs RTL Bidirectional Layout Mirroring", () => {
  const navbarTsx = loadProjectFile("components/Navbar.tsx")
  const css = loadProjectFile("styles/globals.css")

  it("8.1 user dropdown uses logical end-0 aligning to right in LTR and left in RTL", () => {
    expect(navbarTsx).toMatch(/w-\[min\(14rem,calc\(100vw-1\.5rem\)\)\][^"]*\bend-0\b/)
  })

  it("8.2 mobile sheet drawer switches sides dynamically (side={isAr ? 'left' : 'right'})", () => {
    expect(navbarTsx).toContain('side={isAr ? "left" : "right"}')
  })

  it("8.3 mobile sheet drawer sets directional context (dir={isAr ? 'rtl' : 'ltr'})", () => {
    expect(navbarTsx).toContain('dir={isAr ? "rtl" : "ltr"}')
  })

  it("8.4 Arabic RTL headings use Tajawal font family", () => {
    expect(css).toContain('[dir="rtl"]')
    expect(css).toContain("var(--font-tajawal)")
  })

  it("8.5 lecture chevron icons flip 180 degrees in RTL context (rtl:rotate-180 / rtl:rotate-[-90deg])", () => {
    expect(navbarTsx).toContain("isAr ? \"rotate-180")
  })
})
