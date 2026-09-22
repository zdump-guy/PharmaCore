# Accessibility (a11y) & Bilingual RTL Architecture

## 1. WCAG 2.1 AA Compliance Standards

PharmaCore is built to adhere to **WCAG 2.1 Level AA** accessibility criteria:

1. **Semantic HTML Elements**: Proper usage of `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, and `<footer>` landmarks.
2. **Keyboard Navigation & Focus Rings**: All interactive controls feature visible focus rings (`focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`).
3. **Color Contrast Ratios**: Text elements maintain a minimum contrast ratio of `4.5:1` against their backgrounds in both Light Mode (`#14532D` on `#F0FDF4`) and Dark Mode (`#F0FDF4` on `#0B0F19`).
4. **Accessible Form Controls**: All inputs utilize explicit `<Label>` elements linked via `htmlFor` or wrapped inside accessible field groups.
5. **Screen Reader Announcements**: Modals, alert banners, and drawer panels declare appropriate ARIA roles (`role="dialog"`, `aria-live="polite"`, `aria-describedby`).

---

## 2. Bilingual RTL & LTR Directional Layout

PharmaCore delivers native bidirectional layout support:

| Language | Direction (`dir`) | Primary Font | Typography Style |
|---|:---:|---|---|
| **Arabic (`ar`)** | `rtl` | `Tajawal` | Geometric modern Arabic typeface with enhanced optical kerning. |
| **English (`en`)** | `ltr` | `Inter` | Dynamic humanist sans-serif with high x-height for readability. |

### 2.1 Direction-Aware Styling Rules
- Use logical Tailwind classes where possible (`ps-*` / `pe-*` for padding-inline-start/end; `ms-*` / `me-*` for margin-inline-start/end).
- Modal close buttons and back arrows flip automatically based on `document.dir`.
