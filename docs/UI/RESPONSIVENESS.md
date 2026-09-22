# Responsive Layout Architecture & Breakpoints

## 1. Breakpoint Grid System

PharmaCore utilizes Tailwind CSS breakpoint tokens to ensure seamless layout scaling across mobile, tablet, and widescreen displays:

| Breakpoint | Minimum Width | Target Devices | Primary Layout Adaptations |
|---|:---:|---|---|
| **Mobile (`default`)** | `< 640px` | Smart phones | Single-column cards, hamburger drawer (`Sheet`), stacked tabs, fixed bottom action bars. |
| **`sm`** | `640px` | Large phones / phablets | 2-column course catalog grid, inline search filters. |
| **`md`** | `768px` | Tablets / iPad | Horizontal tab lists, side-by-side lecture resource grids, modal dialogs with max-w-lg. |
| **`lg`** | `1024px` | Laptops / Desktops | Persistent administrative sidebar (`AdminSidebar`), 3-column course grid. |
| **`xl`** | `1280px` | Large desktop monitors | Max-width container centering (`max-w-7xl mx-auto`), enhanced padding. |

---

## 2. Key Mobile Layout Patterns

1. **Sheet Drawer Menus (`components/ui/sheet.tsx`)**:
   - Navigation links and language switchers collapse into an accessible slide-out drawer on viewports `< 768px`.
2. **Dynamic Tab Wrapping (`components/ui/tabs.tsx`)**:
   - Tab lists (`TabsList`) specify `h-auto min-h-9 flex-wrap` to prevent small viewport text truncation.
3. **Responsive Tables (`components/admin/*`)**:
   - Administrative data tables wrap inside `overflow-x-auto` containers with sticky header columns.
4. **Touch Target Ergonomics**:
   - All clickable elements (buttons, inputs, dropdowns) enforce a minimum touch target height of `44px` on mobile.

---

## 3. Automated Responsiveness Verification

PharmaCore includes an automated responsiveness verification script (`scripts/verify_responsiveness.mjs`) testing 129 layout assertions across 4 simulated viewports:
- Mobile Small (320px)
- Mobile Standard (375px)
- Tablet (768px)
- Desktop (1280px)
