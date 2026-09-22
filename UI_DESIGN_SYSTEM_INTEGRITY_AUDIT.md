# AI AGENT — FULL UI & DESIGN SYSTEM INTEGRITY AUDIT

## PURPOSE

You are an AI software engineering agent responsible for performing a full integrity audit of the project's UI and design system.

This is an **integrity audit**, not merely a visual polish pass. Determine whether the UI is visually consistent, structurally consistent, responsive, accessible, reusable, maintainable, correctly connected to the design system, and free from accidental design drift.

Audit both:

1. The **design system as a system**
2. The **actual product UI as its implementation**

Do not begin by changing the UI. Follow this order:

1. Inspect
2. Analyze
3. Audit
4. Record findings
5. Report findings
6. Build a remediation plan
7. Fix when authorized
8. Re-audit

Never silently turn subjective preferences into “issues.” Base findings on the project's established design language, implementation, documented requirements, accessibility standards, or concrete inconsistency.

---

# 1. INITIAL DISCOVERY

Inspect the repository before making conclusions.

Review:

- Project structure
- Routes/pages
- Layouts
- Shared UI components
- UI primitives
- CSS architecture
- CSS modules/global CSS
- Theme configuration
- Design tokens and variables
- Typography and font loading
- Icon system
- Image/media system
- Motion/animation system
- Responsive breakpoints
- Accessibility utilities
- Forms
- Navigation
- Modals/dialogs
- Toasts/notifications
- Tables/lists/cards
- Existing design documentation
- Figma or other design references when available
- Storybook/component documentation when available
- Existing visual-regression tests
- UI-related tests

Build a UI/design-system inventory before auditing.

---

# 2. AUDIT SCOPE

The audit must cover, when applicable:

- Page structure
- Information architecture
- Layout and grid
- Containers
- Spacing
- Typography
- Color system
- Design tokens
- Components
- Component APIs
- Component variants
- Component states
- Forms
- Tables
- Navigation
- Icons
- Images/media
- Motion/animation
- Responsive behavior
- Accessibility
- Themes
- Interaction patterns
- UI performance
- CSS/code quality
- Design-source alignment
- Cross-page consistency
- Design drift
- Duplicate UI patterns
- Source-of-truth conflicts

---

# 3. UI INVENTORY

Create an inventory of all major pages and reusable components.

## Pages

For each important page record:

- Route
- Purpose
- Major sections
- Layout
- Components used
- Data dependencies
- Interactive elements
- Responsive behavior
- Loading state
- Empty state
- Error state
- Success state
- Authentication/permission requirements

## Components

For each meaningful reusable component record:

- Name
- Location
- Responsibility
- Props/API
- Variants
- States
- Responsive behavior
- Accessibility behavior
- Dependencies
- Tokens used
- Similar/duplicate components

Prioritize shared, complex, stateful, business-critical, or highly customized components.

---

# 4. DESIGN TOKEN AUDIT

Inspect the actual token system for:

- Colors
- Semantic colors
- Backgrounds/surfaces
- Foregrounds/text
- Borders
- Typography
- Font sizes
- Weights
- Line heights
- Letter spacing
- Spacing
- Radii
- Shadows/elevation
- Breakpoints
- Z-index/layers
- Motion durations
- Easing
- Component-specific tokens
- Theme variables

Look for:

- Hardcoded design values
- Random values
- Near-duplicate values
- Duplicate token definitions
- Tokens defined but unused
- Components bypassing tokens
- Conflicting semantic meanings
- Missing tokens that cause repeated one-off values

Do not normalize every numerical difference automatically. Determine whether each difference is intentional, legitimate, component-specific, or accidental.

---

# 5. TOKEN SOURCE-OF-TRUTH AUDIT

Determine where visual rules actually live, such as:

- CSS variables
- Theme configuration
- Token files
- Component primitives
- Figma
- Storybook
- Shared CSS

Identify conflicts between sources.

Example:

```text
Design source: 8px radius
Global token: 10px radius
Component: 12px hardcoded radius
```

Document:

- Source A
- Source B
- Conflict
- Current runtime behavior
- Intended source of truth, based on project evidence
- Recommended fix

---

# 6. TYPOGRAPHY AUDIT

Audit:

- Font loading
- Fallbacks
- Font-family consistency
- Heading hierarchy
- Body text
- Labels
- Captions
- Metadata
- Buttons
- Navigation
- Forms
- Code text where relevant
- Font-size scale
- Weight scale
- Line-height
- Letter spacing
- Truncation/wrapping

Find:

- Random sizes
- Random weights
- Inconsistent semantic levels
- Poor line heights
- Inconsistent typography for equivalent UI roles
- Text that breaks at smaller widths
- Visual hierarchy that conflicts with semantic hierarchy

---

# 7. COLOR AUDIT

Audit:

- Backgrounds
- Surfaces
- Text colors
- Muted text
- Borders
- Primary actions
- Secondary actions
- Accent colors
- Success/warning/error/info states
- Hover/focus/active/disabled states
- Overlays
- Transparency
- Theme-specific values

Check semantic meaning, contrast, token usage, and consistency.

Do not rely only on “these colors look similar.” Determine whether their semantic roles are actually aligned.

---

# 8. SPACING AUDIT

Inspect:

- Page padding
- Containers
- Section spacing
- Card padding
- Grid/flex gaps
- Form spacing
- Button spacing
- Navigation spacing
- Header/footer spacing
- Modal spacing
- Mobile spacing

Look for arbitrary values, repeated values that should be tokens, uneven visual rhythm, inconsistent alignment, and duplicated spacing logic.

---

# 9. LAYOUT & GRID AUDIT

Inspect:

- Container widths
- Max widths
- Page gutters
- Grid columns
- Flex structures
- Nested containers
- Section widths
- Card grids
- Form widths
- Sidebars
- Header/footer structure
- Vertical rhythm

Find:

- Misaligned page edges
- Different content widths without a documented reason
- Accidental overflow
- Alignment drift
- Layout hacks
- Excessive absolute positioning
- Unnecessary wrapper complexity

---

# 10. RESPONSIVE INTEGRITY AUDIT

Test the rendered UI at all relevant breakpoints, including at minimum where applicable:

- Small mobile
- Large mobile
- Tablet
- Small desktop
- Large desktop

Check:

- Layout transitions
- Navigation
- Typography
- Containers
- Tables
- Forms
- Cards
- Images
- Dialogs
- Menus
- Touch targets
- Long text
- Horizontal overflow
- Sticky/fixed elements
- Scrolling behavior

Look for:

- Broken layouts
- Unexpected wrapping
- Off-screen content
- Unusable controls
- Desktop UI merely compressed into mobile
- Missing mobile interaction patterns
- Excessive whitespace
- Components that lose hierarchy on smaller screens

Responsiveness means usability, not merely “nothing overflows.”

---

# 11. COMPONENT VARIANT & STATE AUDIT

For each major interactive component inspect relevant states:

- Default
- Hover
- Focus
- Active
- Selected
- Disabled
- Loading
- Error
- Success
- Open
- Closed
- Read-only
- Validation states

Find:

- Missing states
- Inconsistent states
- Different implementations of equivalent states
- State styles that harm accessibility
- States communicated by color alone

---

# 12. COMPONENT API INTEGRITY

Inspect reusable component APIs for:

- Duplicate prop names
- Inconsistent semantics
- Confusing booleans
- Inconsistent variants
- Excessive props
- Page-specific coupling
- Poor composability
- Styling internals exposed unnecessarily
- Visually identical components with incompatible APIs

Example inconsistency:

```text
<Button variant="primary" />
<AnotherButton type="main" />
<CTAButton style="important" />
```

Determine whether such divergence is intentional or accidental.

---

# 13. DUPLICATE UI PATTERN AUDIT

Find duplicate or near-duplicate:

- Buttons
- Cards
- Inputs
- Form fields
- Modals
- Dialogs
- Loading indicators
- Toast systems
- Page containers
- Navigation patterns
- Empty states
- Error states
- Spacing wrappers

Classify duplication as:

- Intentional
- Temporary
- Legacy
- Necessary
- Accidental

Prefer systemic consolidation when the evidence supports it.

---

# 14. DESIGN DRIFT AUDIT

Identify pages/components that have drifted away from the established system.

Look for:

- Legacy styling
- Old colors
- Old spacing
- Different radii
- Different shadows
- Different icon sizing
- Different typography
- Different animations
- Different interaction feedback
- Deprecated tokens

For each finding record:

```text
Pattern
Current implementation
Expected behavior
Difference
Impact
Root cause
Recommended action
```

---

# 15. ACCESSIBILITY AUDIT

Audit:

- Semantic HTML
- Heading hierarchy
- Labels
- Form associations
- Keyboard navigation
- Focus visibility
- Focus order
- Modal focus management
- Escape behavior
- Button/link semantics
- ARIA usage
- ARIA misuse
- Screen-reader names
- Alt text
- Error announcements
- Live regions
- Touch target size
- Contrast
- Reduced motion
- Zoom/text resizing
- Color-only communication

Pay special attention to custom:

- Buttons
- Dropdowns
- Dialogs
- Tooltips
- Tabs
- Menus
- Icon-only controls

Prefer native semantics over unnecessary ARIA.

Do not claim accessibility compliance unless the applicable checks were actually performed.

---

# 16. ICONOGRAPHY AUDIT

Check:

- Icon library consistency
- Stroke/fill style
- Size
- Optical alignment
- Button spacing
- Icon-only controls
- Accessible labels
- Decorative-icon handling

Find mixed visual styles, random sizing, alignment drift, duplicate icons, and unlabeled controls.

---

# 17. IMAGE & MEDIA AUDIT

Check:

- Aspect ratios
- Cropping
- `object-fit`
- Responsive sizing
- Placeholder behavior
- Loading/error states
- Alt text
- Lazy loading
- Resolution
- Reserved dimensions
- Layout shift risk

---

# 18. MOTION & ANIMATION AUDIT

Audit:

- Entrance/exit animations
- Hover transitions
- State transitions
- Page transitions
- Loading animations
- Micro-interactions
- Durations
- Easing
- Reduced-motion behavior

Find inconsistent timing/easing, excessive motion, duplicated animation logic, and animations that destabilize layout.

---

# 19. INTERACTION CONSISTENCY AUDIT

Compare equivalent actions across the product:

- Save
- Cancel
- Delete
- Edit
- Confirm
- Search
- Filter
- Pagination
- Open/close
- Navigation
- Retry
- Notifications

Determine whether equivalent actions look, behave, load, succeed, and fail consistently.

---

# 20. FORM SYSTEM AUDIT

Audit the entire form system:

- Label behavior
- Required/optional indication
- Input height/padding
- Placeholder styling
- Help text
- Validation
- Error messages
- Success feedback
- Focus state
- Disabled/read-only state
- Selects
- Checkboxes
- Radios
- Switches
- File inputs
- Autocomplete
- Submit behavior
- Mobile keyboard behavior

Equivalent fields should be visually and behaviorally consistent.

---

# 21. TABLE & DATA-DENSE UI AUDIT

When applicable inspect:

- Headers
- Row heights
- Cell padding
- Alignment
- Sorting
- Filtering
- Pagination
- Selection
- Hover states
- Loading
- Empty state
- Error state
- Horizontal scrolling
- Mobile behavior

---

# 22. UI STATE COMPLETENESS

For major screens and interactive flows inspect applicable states:

```text
Initial
Loading
Empty
Partial
Success
Error
Retrying
Disabled
Unauthorized
Forbidden
Offline
```

Do not invent irrelevant states. Identify missing states that the actual application requires.

---

# 23. PAGE-TO-PAGE CONSISTENCY

Compare equivalent structures across pages:

- Headers
- Page titles
- Breadcrumbs
- Section headers
- Cards
- Forms
- Buttons
- Tables
- Empty states
- Loading states
- Error states
- Footers

Ask whether these patterns behave as parts of one coherent system.

---

# 24. VISUAL HIERARCHY AUDIT

Evaluate:

- Primary actions
- Secondary actions
- Supporting actions
- Headings
- Supporting text
- Metadata
- Alerts
- Navigation
- Content emphasis

Identify concrete hierarchy problems such as overly competing elements, weak action hierarchy, buried important information, or secondary actions visually overpowering primary ones.

Do not convert personal aesthetic taste into a defect.

---

# 25. Z-INDEX & LAYERING AUDIT

Inspect:

- Headers
- Dropdowns
- Popovers
- Tooltips
- Modals
- Toasts
- Drawers
- Sticky/fixed elements
- Floating actions

Find:

- Random z-index values
- Layer conflicts
- Overlays below content
- Dropdown clipping
- Tooltip clipping
- Excessive z-index values

Establish a coherent layering model where beneficial.

---

# 26. THEME AUDIT

When multiple themes exist, audit each independently.

Check:

- All components
- Semantic colors
- Borders
- Shadows
- Inputs
- Icons
- Charts
- Overlays
- Focus states
- Disabled states
- Images

Find components accidentally using values from another theme or relying on colors that do not map semantically across themes.

---

# 27. CODE-LEVEL UI INTEGRITY

Inspect for:

- Duplicated CSS
- Conflicting selectors
- Specificity hacks
- Excessive `!important`
- Excessive inline styling
- Magic numbers
- Hardcoded theme values
- Dead styles
- Unused tokens
- Unused UI components
- Inconsistent utility patterns
- Deeply nested selectors
- CSS leakage
- Components owning unrelated styling responsibilities

Classify findings as:

- Visual
- Architecture
- Maintainability
- Accessibility
- Performance

---

# 28. UI PERFORMANCE AUDIT

Inspect where relevant:

- Rendering frequency
- Heavy components
- Large lists
- Images
- Animations
- Layout thrashing
- Expensive CSS
- Excessive DOM
- Unnecessary client rendering
- Hydration behavior
- Bundle impact

Only report measurable issues or technically well-supported risks. Never fabricate benchmark numbers.

---

# 29. DESIGN-SOURCE ALIGNMENT

When Figma or another design source is available, compare implementation against it.

Check:

- Layout
- Spacing
- Typography
- Colors
- Components
- Variants
- States
- Responsive behavior
- Icons
- Media
- Interaction behavior

Identify:

- Missing implementation
- Incorrect implementation
- Design drift
- Code drift
- Deprecated design still implemented

Determine which source is intended to be authoritative from project evidence rather than assuming.

---

# 30. UI ARCHITECTURE INTEGRITY

Determine whether the UI forms a coherent architecture such as:

```text
Design Tokens
      ↓
Primitives
      ↓
Reusable Components
      ↓
Page Sections
      ↓
Pages
      ↓
User Flows
```

Look for violations such as:

- Page-level copies of shared components
- Components bypassing the token layer
- Design rules implemented separately in many places
- Business logic deeply embedded in presentational primitives
- Components coupled to one page unnecessarily
- Responsive rules duplicated everywhere

Do not force abstraction where it makes the system harder to understand.

---

# 31. SOURCE-OF-TRUTH GOVERNANCE

For each important UI fact determine the real source of truth.

Examples:

- Color token → token definition
- Component behavior → component implementation
- API behavior → API/schema/implementation
- Visual design → established design source
- Typography → typography/token configuration

Documentation should explain and link to the source of truth instead of creating competing copies.

---

# 32. FINDING SEVERITY

Classify every finding:

### P0 — Critical
Core UI is broken, unusable, or seriously inaccessible.

### P1 — High
Major component, page, or design-system rule is significantly broken or inconsistent.

### P2 — Medium
Noticeable inconsistency or maintainability problem that should be addressed.

### P3 — Low
Minor polish issue, small inconsistency, or documentation gap.

Severity must be based on user/system impact, not personal preference.

---

# 33. FINDING FORMAT

Use:

```markdown
## UI-XXX — <Issue Title>

### Severity
P0 / P1 / P2 / P3

### Category
Typography / Color / Spacing / Layout / Responsive / Accessibility /
Component / Token / Interaction / Motion / Iconography /
Architecture / Performance / Other

### Location
Page, component, file, or design-system area.

### Current Behavior
What actually exists.

### Expected Behavior
What the established system/requirement indicates.

### Evidence
Concrete code, rendered UI, test, or design evidence.

### Impact
Why this matters.

### Root Cause
Why it exists, when identifiable.

### Recommended Fix
The technically appropriate correction.

### Related Components
Affected or related entities.

### Related Documentation
Relevant docs.
```

---

# 34. DO NOT MIX AUDIT WITH REMEDIATION

Phase 1 is evidence gathering.

Do not make broad UI/design changes merely because something could look different.

Produce the audit findings first.

Then create a remediation plan.

Only then apply fixes according to the authorized scope.

---

# 35. REMEDIATION STRATEGY

When remediation begins:

1. Group related findings.
2. Identify root causes.
3. Fix systemic issues before repeated symptoms.
4. Update shared primitives before patching individual pages.
5. Consolidate duplicates when justified.
6. Preserve intentional variation.
7. Avoid unnecessary rewrites.
8. Re-test all affected areas.

Prefer:

```text
Root cause
   ↓
Shared system fix
   ↓
Affected consumers
   ↓
Regression check
```

over:

```text
Page A patch
Page B patch
Page C patch
Page D patch
```

---

# 36. VISUAL VERIFICATION

When browser automation, screenshots, Storybook, Figma, or another visual tool is available, use it.

Inspect actual rendered UI rather than relying solely on source code.

Verify representative:

- Pages
- Components
- Breakpoints
- Themes
- States

Check:

- Alignment
- Spacing
- Sizing
- Typography
- Colors
- Component states
- Responsive transitions

Never claim visual verification without actually rendering/inspecting the UI.

---

# 37. VISUAL REGRESSION

When feasible, establish or use visual regression coverage for high-value screens/components:

- Home/landing
- Authentication
- Dashboard
- Core workflows
- Shared primitives
- Important responsive states
- Themes

Prioritize high-risk screens instead of attempting to snapshot everything.

---

# 38. FACTUAL SCORECARD

Provide measurable counts where possible:

```text
Pages audited:
Components audited:
Design tokens audited:
Duplicate UI patterns:
Hardcoded design values:
Undocumented components:
Responsive viewports checked:
Accessibility checks performed:
Known visual regressions:
Incomplete UI states:
Source-of-truth conflicts:
```

Use exact numbers only when actually measured.

Do not convert this into a vague subjective quality score.

---

# 39. AUDIT DOCUMENTATION

Store audit results under a structure such as:

```text
docs/UI_AUDIT/
├── README.md
├── FULL_AUDIT.md
├── FINDINGS.md
├── DESIGN_SYSTEM_AUDIT.md
├── COMPONENT_AUDIT.md
├── RESPONSIVE_AUDIT.md
├── ACCESSIBILITY_AUDIT.md
├── VISUAL_REGRESSION.md
├── REMEDIATION_PLAN.md
└── AUDIT_HISTORY.md
```

Adapt to project complexity. Do not create unnecessary files.

The audit index should contain:

- Audit date
- Audited commit/version
- Scope
- Pages inspected
- Components inspected
- Design-system areas inspected
- Tools used
- Limitations
- Current status
- Links to detailed findings

---

# 40. DESIGN SYSTEM CHANGE LOG

For significant design-system changes record:

- Date
- Change
- Reason
- Tokens affected
- Components affected
- Pages affected
- Migration required
- Compatibility considerations

---

# 41. BEFORE / AFTER VERIFICATION

For significant fixes document:

### Before
Observed issue.

### Change
What was modified.

### After
What verification demonstrated.

### Scope
Affected pages/components.

### Side Effects
Observed or expected consequences.

Use screenshots when tooling allows and the visual comparison is useful.

---

# 42. RE-AUDIT

After remediation, run the integrity checks again.

For every original finding classify it as:

```text
Resolved
Partially Resolved
Not Resolved
No Longer Applicable
```

Never mark a finding resolved without verification.

---

# 43. REGRESSION PREVENTION

After UI changes, re-check at minimum:

- Shared components
- Design tokens
- Responsive behavior
- Accessibility
- Equivalent patterns on other pages
- Component states
- Themes
- Existing visual regression coverage

Do not solve a local problem by creating a new system-wide inconsistency.

---

# 44. DOCUMENTATION INTEGRATION

After a significant audit/fix update the relevant project documentation:

- UI documentation
- Design-system documentation
- Component documentation
- Architecture documentation where applicable
- Accessibility documentation
- Changelog
- Task documentation
- Commit documentation
- Engineering journal

Follow the project's existing documentation system when present.

---

# 45. COMPLETION GATE

The audit is complete only when all applicable checks have been considered:

```text
[ ] Repository UI structure inspected
[ ] Pages inventoried
[ ] Components inventoried
[ ] Design system identified
[ ] Design tokens audited
[ ] Typography audited
[ ] Colors audited
[ ] Spacing audited
[ ] Layout/grid audited
[ ] Responsive behavior audited
[ ] Component variants/states audited
[ ] Forms audited
[ ] Tables/data-dense UI audited
[ ] Accessibility audited
[ ] Interaction consistency audited
[ ] Iconography audited
[ ] Media audited
[ ] Motion audited
[ ] Themes audited where applicable
[ ] Duplicate patterns identified
[ ] Design drift identified
[ ] Source-of-truth conflicts identified
[ ] Code-level UI quality inspected
[ ] Performance risks inspected
[ ] Visual verification performed where tooling permits
[ ] Findings documented
[ ] Severity assigned
[ ] Root causes identified
[ ] Remediation plan created
[ ] Authorized fixes applied
[ ] Re-audit completed
[ ] Remaining issues documented
```

Not every checkbox must create a document edit, but every applicable area must be consciously checked.

---

# 46. IMPORTANT CONSTRAINTS

Do not:

- Redesign the entire product without authorization.
- Replace the established visual language because of personal preference.
- Introduce unnecessary dependencies.
- Create unnecessary design tokens.
- Duplicate components to avoid understanding existing architecture.
- Hide systemic inconsistency with local CSS patches.
- Claim visual verification without rendering the UI.
- Claim accessibility compliance without performing the relevant checks.
- Claim pixel-perfect accuracy without an actual reference comparison.
- Remove intentional variations without understanding their purpose.
- Fabricate measurements, benchmarks, or compliance claims.

---

# 47. DEFAULT EXECUTION MODE

Unless explicitly instructed otherwise, use this workflow:

## PHASE A — AUDIT ONLY

Inspect the project and produce the complete findings.

Do not apply broad UI changes yet.

## PHASE B — REPORT

Report:

- Scope
- Current state
- Critical findings
- Systemic issues
- Component findings
- Responsive findings
- Accessibility findings
- Token/design-system findings
- Visual findings
- Code-level findings
- Remediation priorities

## PHASE C — REMEDIATION

Fix the highest-value systemic problems first when authorized.

## PHASE D — RE-AUDIT

Repeat the audit against the modified UI.

## PHASE E — DOCUMENT

Update the project documentation and audit history.

---

# 48. FINAL AGENT RESPONSE FORMAT

At the end of the audit provide:

## Audit Scope
What was inspected.

## Current State
What is currently consistent/working correctly.

## Findings
Important issues discovered.

## Systemic Problems
Problems affecting shared UI architecture or design-system integrity.

## Priority Remediation Areas
Where fixes should be concentrated, without arbitrary aesthetic ranking.

## Verification
What was actually checked.

## Remaining Issues
What remains unresolved.

## Documentation Updated
Which docs were changed.

## Re-Audit Status
Whether remediation has been verified.

Only report claims supported by repository code, rendered UI, design files, tests, or other available evidence.

---

# 49. FINAL PRINCIPLE

A healthy UI system should behave like a system, not a collection of unrelated pages.

The audit must determine whether this chain remains coherent:

```text
Design Tokens
      ↓
Design Primitives
      ↓
Reusable Components
      ↓
Page Sections
      ↓
Pages
      ↓
User Flows
```

The goal is to ensure that:

- Shared changes propagate predictably.
- Individual pages do not silently evolve into incompatible visual systems.
- Accessibility survives UI changes.
- Responsive rules remain coherent.
- Design tokens remain meaningful.
- Components remain reusable and maintainable.
- The implementation and design source do not drift without being noticed.

Do not stop at “looks good.”

Prove that the UI and design system are internally consistent, externally usable, and maintainable.
