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

- **Card Radius**: `rounded-xl` (12px) for educational content cards.
- **Button Radius**: `rounded-lg` (8px) for buttons and inputs.
- **Badge Radius**: `rounded-full` (9999px) for status pills.
- **Elevation Shadows**:
  - `shadow-sm`: Interactive cards and table rows.
  - `shadow-md`: Hovered course cards and dropdown menus.
  - `shadow-xl`: Modal dialogs and preview lightboxes.
