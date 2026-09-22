# Design Tokens & Color Palettes

## 1. Global Color Tokens

Derived from `design-system/pharmacore/MASTER.md` and `styles/globals.css`:

### Light Mode Palette
| Role | Hex Code | CSS Variable | Semantic Usage |
|---|---|---|---|
| **Primary** | `#15803D` | `--primary` | Main brand emerald green; CTAs, active links, primary buttons. |
| **On Primary** | `#FFFFFF` | `--primary-foreground` | High-contrast text on primary buttons and badges. |
| **Secondary** | `#22C55E` | `--secondary` | Vibrant green accent; success states and secondary highlights. |
| **Accent / CTA** | `#0369A1` | `--accent` | Deep trust blue; external links, badges, focus rings. |
| **Background** | `#F0FDF4` | `--background` | Soft mint-tinted off-white background. |
| **Foreground** | `#14532D` | `--foreground` | Deep forest green for readable body copy. |
| **Muted** | `#E8F0F1` | `--muted` | Subtle surface backgrounds and card headers. |
| **Border** | `#BBF7D0` | `--border` | Soft green boundary lines for cards and inputs. |
| **Destructive** | `#DC2626` | `--destructive` | Warning / error red; deletion buttons, form errors. |
| **Ring** | `#15803D` | `--ring` | Accessibility focus outline ring. |

---

### Dark Mode Palette
| Role | Hex Code | CSS Variable | Semantic Usage |
|---|---|---|---|
| **Primary** | `#22C55E` | `--primary` | Bright emerald green for dark mode visibility. |
| **On Primary** | `#0B0F19` | `--primary-foreground` | Dark text on bright primary buttons. |
| **Background** | `#0B0F19` | `--background` | Deep navy-black surface background. |
| **Foreground** | `#F0FDF4` | `--foreground` | High-contrast soft white text. |
| **Muted** | `#1E293B` | `--muted` | Dark slate surface panels and card fills. |
| **Border** | `#1E3A2F` | `--border` | Subtle dark green border outlines. |
| **Destructive** | `#EF4444` | `--destructive` | High-visibility error red. |
