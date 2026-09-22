# Spacing Grid, Elevation & Layout Constraints

## 1. Spatial Grid (8pt Baseline)

PharmaCore adheres to an **8pt spatial increment grid**:

| Token | Class | Pixel Value | Standard Application |
|---|---|---|---|
| `space-1` | `p-1` / `m-1` | 4px | Micro padding inside compact badges. |
| `space-2` | `p-2` / `m-2` | 8px | Button inline gap, icon padding. |
| `space-3` | `p-3` / `m-3` | 12px | Compact card padding, input padding. |
| `space-4` | `p-4` / `m-4` | 16px | Standard card body padding, modal body. |
| `space-6` | `p-6` / `m-6` | 24px | Large card containers, section padding. |
| `space-8` | `p-8` / `m-8` | 32px | Page header padding, admin tab padding. |
| `space-12`| `py-12` | 48px | Landing page section vertical spacing. |
| `space-16`| `py-16` | 64px | Hero section spacing. |

---

## 2. Corner Radii & Elevation Shadows

PharmaCore standardizes corner radii on a base `--radius: 0.9rem` (14.4px) scale:

- **Card & Container Radius**: `rounded-2xl` (`var(--radius)` = 14.4px) for educational cards, modals, and callouts.
- **Medium Surface Radius**: `rounded-xl` (`calc(var(--radius) - 2px)` = 12.4px) for sub-panels and dropdown menus.
- **Button & Input Radius**: `rounded-lg` (`calc(var(--radius) - 4px)` = 10.4px) for interactive controls and form inputs.
- **Badge & Avatar Radius**: `rounded-full` (9999px) for status pills and user avatars.

- **Elevation Shadows**:
  - `shadow-xs`: Subtle card outline enhancement on dark/light surfaces.
  - `shadow-sm`: Interactive cards, tables, and tab groups.
  - `shadow-md`: Hovered course cards and contextual dropdowns.
  - `shadow-xl`: Accessible modal dialogs and fullscreen PDF/image preview lightboxes.
