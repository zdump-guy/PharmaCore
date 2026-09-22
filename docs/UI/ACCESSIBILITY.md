# Accessibility (a11y) & Bilingual RTL Architecture

## 1. WCAG 2.1 AA Compliance Standards

PharmaCore is built to adhere to **WCAG 2.1 Level AA** accessibility criteria:

1. **Semantic HTML Elements**: Proper usage of `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, and `<footer>` landmarks.
2. **Keyboard Navigation & Focus Rings**: All interactive controls feature visible focus rings (`focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`).
3. **Color Contrast Ratios**: Text elements exceed WCAG 2.1 AA standards in both Light Mode (`#262626` on `#F8FBFC` = **14.2:1**) and Dark Mode (`#F3F9FA` on `#0F181B` = **15.5:1**). Secondary subtext maintains **4.8:1**.
4. **Accessible Form Controls**: All inputs utilize explicit `<Label>` elements linked via `htmlFor` or wrapped inside accessible field groups.
5. **Accessible Icon Buttons**: All icon-only action buttons (edit, delete, refresh, search dismiss) declare explicit bilingual `aria-label` attributes (`aria-label={tr("...", "...")}`).
6. **Touch Targets (WCAG 2.5.5)**: Interactive controls and mobile tabs enforce a minimum touch target height of ≥ 44px (`min-h-[44px]` / `size-11`).
7. **Screen Reader Announcements**: Modals, alert banners, and drawer panels declare appropriate ARIA roles (`role="dialog"`, `aria-live="polite"`, `aria-describedby`).

---

## 2. Bilingual RTL & LTR Directional Layout

PharmaCore delivers native bidirectional layout support:

| Language | Direction (`dir`) | Primary Font | Typography Style |
|---|:---:|---|---|
| **Arabic (`ar`)** | `rtl` | `Tajawal` | Geometric modern Arabic typeface with enhanced optical kerning. |
| **English (`en`)** | `ltr` | `Inter` | Dynamic humanist sans-serif with high x-height for readability. |

### 2.1 Direction-Aware Styling Rules
- Use logical Tailwind classes throughout (`ps-*` / `pe-*` for padding-inline-start/end; `ms-*` / `me-*` for margin-inline-start/end; `start-*` / `end-*` for positioning).
- Modal drawers, navigation sheets, and chevron icons flip automatically based on `dir={isAr ? "rtl" : "ltr"}` and `side={isAr ? "left" : "right"}`.
