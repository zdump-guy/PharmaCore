# Structured Findings Catalog (UI-001 to UI-005)

This catalog details all identified findings from the Full UI & Design System Integrity Audit, formatted in accordance with Section 33 of [`UI_DESIGN_SYSTEM_INTEGRITY_AUDIT.md`](file:///home/bravo-07/Documents/dev/yo-project/UI_DESIGN_SYSTEM_INTEGRITY_AUDIT.md).

---

## UI-001 — Design System Token Source-of-Truth Discrepancy

### Severity
**P2 — Medium**

### Status
**RESOLVED** (Remediated on 2026-09-23: `design-system/pharmacore/MASTER.md` and `docs/DESIGN_SYSTEM/` fully synchronized with active cyan/teal tokens `#262626`, `#6AA6B8`, `#8BCDE1`, `--primary: 194 49% 31%`).

### Category
**Token / Source-of-Truth**

### Location
`design-system/pharmacore/MASTER.md` vs `styles/globals.css` vs `PharmaCore_Prompt_Updated.md`

### Current Behavior
`design-system/pharmacore/MASTER.md` specifies an initial pharmacy green color scheme (`#15803D`, `#22C55E`, `#0369A1`, `#F0FDF4`), whereas the runtime application code in `styles/globals.css` and `PharmaCore_Prompt_Updated.md` implements the clinical cyan/teal brand palette (`#262626`, `#6AA6B8`, `#8BCDE1`, `--primary: 194 49% 31%`).

### Expected Behavior
`design-system/pharmacore/MASTER.md` should accurately document the active runtime design tokens and clinical cyan/teal color palette.

### Evidence
- `design-system/pharmacore/MASTER.md` lines 18–28: `Primary: #15803D`.
- `styles/globals.css` lines 6–30: `--primary: 194 49% 31%`, `--brand-ink: #262626`, `--brand-mid: #6aa6b8`, `--brand-light: #8bcde1`.

### Impact
New contributors or agents referencing `MASTER.md` may make incorrect assumptions about the intended color tokens.

### Root Cause
`MASTER.md` was scaffolded during initial project ideation and was not synchronized when the brand guidelines shifted to the clinical cyan/teal theme.

### Recommended Fix
Update `design-system/pharmacore/MASTER.md` to document the active cyan/teal tokens (`#262626`, `#6AA6B8`, `#8BCDE1`) and HSL variables.

### Related Documentation
- `docs/DESIGN_SYSTEM/TOKENS.md`
- `design-system/pharmacore/MASTER.md`

---

## UI-002 — Corner Radius Token Standardization

### Severity
**P3 — Low**

### Status
**RESOLVED** (Remediated on 2026-09-23: Documented `--radius: 0.9rem` / 14.4px base scale in `design-system/pharmacore/MASTER.md` and `docs/DESIGN_SYSTEM/SPACING_AND_LAYOUT.md`).

### Category
**Spacing / Design Token**

### Location
`styles/globals.css` line 26 & `tailwind.config.ts` line 24

### Current Behavior
`--radius` is declared as `0.9rem` (14.4px) in `styles/globals.css`, while `tailwind.config.ts` computes `md: calc(var(--radius) - 2px)` and `sm: calc(var(--radius) - 4px)`.

### Expected Behavior
Standardize the token definition with clear documentation explaining the 14.4px rounded card style.

### Evidence
- `styles/globals.css`: `--radius: 0.9rem;`
- `tailwind.config.ts`: `borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" }`

### Impact
Minor documentation ambiguity regarding whether 0.9rem or 0.75rem is the baseline radius.

### Recommended Fix
Add a brief comment in `docs/DESIGN_SYSTEM/SPACING_AND_LAYOUT.md` explaining the `0.9rem` card radius scale.

---

## UI-003 — Missing Explicit ARIA Labels on Admin Icon-Only Action Buttons

### Severity
**P3 — Low**

### Status
**RESOLVED** (Remediated on 2026-09-23: Added accessible bilingual `aria-label` attributes to all icon buttons across `components/admin/UserManager.tsx` and `components/admin/CurriculumManager.tsx`).

### Category
**Accessibility (a11y)**

### Location
`components/admin/UserManager.tsx` & `components/admin/CurriculumManager.tsx`

### Current Behavior
Several table action buttons (e.g. edit/delete icon buttons) render visual SVG icons (`FaPencil`, `FaTrashCan`) without an explicit `aria-label="Edit course"` or `aria-label="Delete user"` attribute.

### Expected Behavior
All interactive icon-only buttons must provide an accessible name via `aria-label` or `<span className="sr-only">`.

### Evidence
- `components/admin/UserManager.tsx`: `<Button variant="ghost" size="sm"><FaTrashCan /></Button>` without `aria-label`.

### Impact
Screen-reader users cannot determine the function of the icon button without context.

### Recommended Fix
Add `aria-label` attributes to all icon-only buttons in admin management tables.

---

## UI-004 — Mobile Horizontal Padding Alignment

### Severity
**P3 — Low**

### Status
**RESOLVED** (Verified on 2026-09-23: `pages/lecture/[id].tsx` strictly uses `.page-shell` with `px-4 sm:px-6 lg:px-8`).

### Category
**Layout / Spacing**

### Location
`pages/feedback.tsx` (`px-4 sm:px-6`) vs `pages/lecture/[id].tsx` (`px-4 sm:px-6 lg:px-8`)

### Current Behavior
`pages/lecture/[id].tsx` uses standard `.page-shell` padding matching `pages/feedback.tsx` and `pages/index.tsx`.

### Expected Behavior
All page shells should standardize on `px-4` on mobile for consistent gutter margins.

### Impact
Zero layout shifts across page views.

### Recommended Fix
Standardize container padding on `pages/lecture/[id].tsx` to use `.page-shell` (`px-4 sm:px-6 lg:px-8`).

---

## UI-005 — Consolidate Custom Inline Stat Badges in Admin Analytics

### Severity
**P3 — Low**

### Status
**RESOLVED** (Verified on 2026-09-23: All event telemetry chips and metrics in `components/admin/AnalyticsDashboard.tsx` utilize standard `<Badge>` primitives).

### Category
**Component / Reusability**

### Location
`components/admin/AnalyticsDashboard.tsx`

### Current Behavior
Standard `<Badge>` components are used for status and metric indicators.

### Expected Behavior
Shared badge components should be utilized for all status and metric tags to maximize component reuse.

### Impact
Clean component tree and token conformity.

### Recommended Fix
Refactor custom stat pills to utilize `<Badge variant="secondary">` or `<Badge variant="outline">`.
