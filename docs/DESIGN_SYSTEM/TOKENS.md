# Design Tokens & Color Palettes
 
## 1. Global Color Tokens
 
Derived from `design-system/pharmacore/MASTER.md` and `styles/globals.css`:
 
### Light Mode Palette
| Role | Hex / HSL | CSS Variable | Semantic Usage |
|---|---|---|---|
| **Primary** | `hsl(194 49% 31%)` (`#286576`) | `--primary` | Main brand clinical cyan/teal; CTAs, active links, primary buttons. |
| **On Primary** | `hsl(0 0% 100%)` (`#FFFFFF`) | `--primary-foreground` | High-contrast text on primary buttons and badges. |
| **Secondary** | `hsl(194 31% 92%)` (`#E6F4F8`) | `--secondary` | Soft clinical cyan background for secondary tags and badges. |
| **Secondary Foreground** | `hsl(194 49% 24%)` (`#1F4E5B`) | `--secondary-foreground` | High-contrast text on secondary components. |
| **Accent** | `hsl(194 56% 71%)` (`#8BCDE1`) | `--accent` | Light cyan accent; interactive highlights and hover accents. |
| **Accent Foreground** | `hsl(194 55% 18%)` (`#143B47`) | `--accent-foreground` | High-contrast text on accent badges. |
| **Brand Ink** | `#262626` | `--brand-ink` | Deep charcoal for headings, dark cards, and high-contrast text. |
| **Brand Mid** | `#6AA6B8` | `--brand-mid` | Mid-tone clinical cyan for graphic accents & active indicators. |
| **Brand Light** | `#8BCDE1` | `--brand-light` | Light cyan for highlights, skeletons, and badges. |
| **Background** | `hsl(195 33% 98%)` (`#F8FBFC`) | `--background` | Clean clinical off-white canvas. |
| **Foreground** | `hsl(0 0% 15%)` (`#262626`) | `--foreground` | Charcoal dark text for maximum legibility (14.2:1 contrast). |
| **Muted** | `hsl(195 25% 94%)` (`#EEF5F7`) | `--muted` | Subtle surface backgrounds and card headers. |
| **Muted Foreground** | `hsl(195 13% 39%)` (`#566A70`) | `--muted-foreground` | Secondary subtext and metadata (4.8:1 contrast). |
| **Border** | `hsl(195 22% 84%)` (`#D3E3E8`) | `--border` | Clean boundary lines for cards and inputs. |
| **Destructive** | `hsl(0 72% 46%)` (`#CE2323`) | `--destructive` | Warning / error red; deletion buttons, form errors. |
| **Ring** | `hsl(194 49% 31%)` (`#286576`) | `--ring` | Accessibility focus outline ring. |
 
---
 
### Dark Mode Palette
| Role | Hex / HSL | CSS Variable | Semantic Usage |
|---|---|---|---|
| **Primary** | `hsl(194 56% 71%)` (`#8BCDE1`) | `--primary` | Bright cyan/teal for dark mode high contrast. |
| **On Primary** | `hsl(195 48% 12%)` (`#0F252C`) | `--primary-foreground` | Deep dark text on bright primary buttons. |
| **Secondary** | `hsl(195 25% 17%)` (`#202E33`) | `--secondary` | Dark slate-teal container surfaces. |
| **Secondary Foreground** | `hsl(194 50% 84%)` (`#C4E7F2`) | `--secondary-foreground` | Light text on secondary containers. |
| **Accent** | `hsl(194 36% 57%)` (`#6AA6B8`) | `--accent` | Mid-tone cyan accent for dark mode highlights. |
| **Accent Foreground** | `hsl(196 45% 10%)` (`#0E1E24`) | `--accent-foreground` | Dark text on dark mode accents. |
| **Background** | `hsl(196 25% 8%)` (`#0F181B`) | `--background` | Deep slate-teal dark canvas. |
| **Foreground** | `hsl(195 28% 96%)` (`#F3F9FA`) | `--foreground` | High-contrast soft white text (15.5:1 contrast). |
| **Muted** | `hsl(195 21% 15%)` (`#1E2A2E`) | `--muted` | Dark slate surface panels and card fills. |
| **Muted Foreground** | `hsl(195 16% 68%)` (`#A3BFC7`) | `--muted-foreground` | Secondary subtext for dark mode. |
| **Border** | `hsl(195 18% 23%)` (`#304147`) | `--border` | Subtle dark slate border outlines. |
| **Destructive** | `hsl(0 66% 52%)` (`#DC3535`) | `--destructive` | High-visibility error red in dark mode. |
| **Ring** | `hsl(194 56% 71%)` (`#8BCDE1`) | `--ring` | Focus ring in dark mode. |
 
---
 
## 2. Corner Radius Tokens
 
| Token | Class | Value | Semantic Application |
|---|---|---|---|
| **Base / Large** | `rounded-2xl` | `var(--radius)` = `0.9rem` (14.4px) | Cards, modal sheets, and primary callouts |
| **Medium** | `rounded-xl` | `calc(var(--radius) - 2px)` (12.4px) | Sub-cards, dropdown menus, and media items |
| **Small** | `rounded-lg` | `calc(var(--radius) - 4px)` (10.4px) | Buttons, form inputs, and tab triggers |
| **Pill** | `rounded-full` | `9999px` | Badges, status pills, and avatars |
