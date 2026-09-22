# Component Styling Rules & Interaction States

## 1. Button Hierarchy & Variants

Configured via `class-variance-authority` in `components/ui/button.tsx`:

| Variant | Styling Rules | Semantic Application |
|---|---|---|
| `default` | `bg-primary text-primary-foreground hover:bg-primary/90` | Primary page call-to-actions, Submit buttons, Start Quiz. |
| `secondary` | `bg-secondary text-secondary-foreground hover:bg-secondary/80` | Supporting actions, Download Handouts, Filter toggles. |
| `outline` | `border border-input bg-background hover:bg-accent hover:text-accent-foreground` | Secondary navigation, Cancel buttons, View Syllabus. |
| `destructive`| `bg-destructive text-destructive-foreground hover:bg-destructive/90` | Account deletion, Reject enrollment, Permanent purge. |
| `ghost` | `hover:bg-accent hover:text-accent-foreground` | Icon buttons (theme toggle, language switch, close modal). |
| `link` | `text-primary underline-offset-4 hover:underline` | Inline references, Breadcrumbs, Footer links. |

---

## 2. Interactive States Guidelines

1. **Focus Visible State**:
   - `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
2. **Disabled State**:
   - `disabled:pointer-events-none disabled:opacity-50 cursor-not-allowed`
3. **Loading State**:
   - Buttons render an animated SVG spinner (`animate-spin`) and disable pointer interactions.
