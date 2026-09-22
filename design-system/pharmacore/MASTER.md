# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** PharmaCore
**Generated:** 2026-08-15 20:11:56
**Category:** Newsletter Platform
**Design Dials:** Variance 5/10 (Balanced / Modern) | Motion 4/10 (Standard) | Density 6/10 (Standard)

---

## Global Rules

### Color Palette

| Role | Hex / HSL | CSS Variable | Semantic Usage |
|------|-----------|--------------|----------------|
| Primary | `hsl(194 49% 31%)` (`#286576`) | `--primary` | Main brand clinical cyan/teal; CTAs, primary buttons, active tabs |
| On Primary | `hsl(0 0% 100%)` (`#FFFFFF`) | `--primary-foreground` | High-contrast white text on primary buttons and badges |
| Secondary | `hsl(194 31% 92%)` (`#E6F4F8`) | `--secondary` | Soft clinical cyan fill for secondary cards and pills |
| Secondary Foreground | `hsl(194 49% 24%)` (`#1F4E5B`) | `--secondary-foreground` | High-contrast dark teal text on secondary elements |
| Accent | `hsl(194 56% 71%)` (`#8BCDE1`) | `--accent` | Light cyan accent; interactive highlights and focus rings |
| Accent Foreground | `hsl(194 55% 18%)` (`#143B47`) | `--accent-foreground` | Deep slate contrast text on accent backgrounds |
| Brand Ink | `#262626` | `--brand-ink` | Deep charcoal neutral for high-contrast headings & dark surfaces |
| Brand Mid | `#6AA6B8` | `--brand-mid` | Mid-tone clinical cyan for graphic accents & active badges |
| Brand Light | `#8BCDE1` | `--brand-light` | Light cyan for highlights, skeletons, and badges |
| Background | `hsl(195 33% 98%)` (`#F8FBFC`) | `--background` | Clean clinical off-white canvas |
| Foreground | `hsl(0 0% 15%)` (`#262626`) | `--foreground` | Charcoal dark text for maximum legibility (14.2:1 contrast) |
| Muted | `hsl(195 25% 94%)` (`#EEF5F7`) | `--muted` | Subdued surface backgrounds and table headers |
| Muted Foreground | `hsl(195 13% 39%)` (`#566A70`) | `--muted-foreground` | Secondary subtext and timestamps (4.8:1 contrast) |
| Border | `hsl(195 22% 84%)` (`#D3E3E8`) | `--border` | Clean boundary lines for cards and input containers |
| Input | `hsl(195 22% 78%)` (`#C2D7DE`) | `--input` | Form input border baseline |
| Destructive | `hsl(0 72% 46%)` (`#CE2323`) | `--destructive` | Warning / error red; deletion buttons, form errors |
| Ring | `hsl(194 49% 31%)` (`#286576`) | `--ring` | Accessibility focus outline ring |

**Color Notes:** Clinical cyan/teal (`#286576`, `#6AA6B8`, `#8BCDE1`) + Charcoal ink (`#262626`)

### Typography

- **English Font:** Inter
- **Arabic Font:** Tajawal
- **Mood:** modern, clinical, bilingual, readable
- **Google Fonts:** [Inter + Tajawal](https://fonts.google.com/?query=Inter%20Tajawal)

**CSS Import:**
```css
/* Loaded through next/font/google: Inter for English, Tajawal for Arabic. */
```

### Spacing Variables

*Density: 6/10 — Standard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

### Corner Radius Scale

| Token | Class / Value | Calculated Size | Usage |
|-------|---------------|-----------------|-------|
| Base / Large | `rounded-2xl` / `var(--radius)` | `0.9rem` (14.4px) | Cards, modals, feature callouts |
| Medium | `rounded-xl` / `calc(var(--radius) - 2px)` | `12.4px` | Sub-panels, dropdowns, media cards |
| Small | `rounded-lg` / `calc(var(--radius) - 4px)` | `10.4px` | Buttons, inputs, tab items |
| Full / Pill | `rounded-full` | `9999px` | Badges, avatars, status tags |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  padding: 10px 20px;
  border-radius: calc(var(--radius) - 4px);
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
  border: 1px solid hsl(var(--border));
  padding: 10px 20px;
  border-radius: calc(var(--radius) - 4px);
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: all 200ms ease;
}

.card:hover {
  border-color: hsl(var(--primary) / 0.4);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 10px 14px;
  border: 1px solid hsl(var(--input));
  border-radius: calc(var(--radius) - 4px);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 14px;
  transition: border-color 200ms ease, box-shadow 200ms ease;
}

.input:focus {
  border-color: hsl(var(--ring));
  outline: none;
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Flat Design

**Keywords:** 2D, minimalist, bold colors, no shadows, clean lines, simple shapes, typography-focused, modern, icon-heavy

**Best For:** Web apps, mobile apps, cross-platform, startup MVPs, user-friendly, SaaS, dashboards, corporate

**Key Effects:** No gradients/shadows, simple hover (color/opacity shift), fast loading, clean transitions (150-200ms ease), minimal icons

### Page Pattern

**Pattern Name:** Feature-Rich Showcase

- **Conversion Strategy:** Clear feature hierarchy. One key message per card. Strong CTA repetition.
- **CTA Placement:** Hero (sticky) + After features + Bottom
- **Section Order:** 1. Hero (value prop), 2. Feature grid/cards (4-6), 3. Use cases or benefits, 4. Social proof or logos, 5. CTA

---

## Motion

**Stagger List** (Standard) — Trigger: load or scroll | Duration: 300-450ms | Easing: `back.out(1.4)`

```js
gsap.from('.grid-item', { opacity: 0, scale: 0.92, y: 16, duration: 0.4, stagger: { each: 0.06, from: 'start', grid: 'auto' }, ease: 'back.out(1.4)' });
```

**Framework notes:** grid: 'auto' lets GSAP infer rows/columns from a CSS grid layout for a natural wave stagger

- ✅ Combine with from: 'center' for a bento-grid layout to draw the eye inward first
- ❌ Don't use back.out on dense data tables; the overshoot reads as sloppy on informational UI
- ⚡ Group DOM writes; avoid interleaving layout reads (getBoundingClientRect) between staggered tweens

---

## Anti-Patterns (Do NOT Use)

- ❌ Complex signup
- ❌ No preview

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
