# Typography & Bilingual Font Scales

## 1. Bilingual Typeface Pairing

PharmaCore pairs two Google Fonts loaded through `next/font/google` in `lib/fonts.ts`:

1. **English (Latin)**: `Inter` — Clean, modern humanist sans-serif with tall x-height and clear numerals.
2. **Arabic**: `Tajawal` — Geometric Arabic typeface optimized for screen legibility and educational reading.

---

## 2. Type Scale Hierarchy

| Token | Class | Size (px / rem) | Line Height | Weight | Typical Application |
|---|---|---|---|---|---|
| **Display** | `text-4xl lg:text-5xl` | 36px – 48px | 1.1 | Bold (700) | Landing page hero headline. |
| **H1** | `text-3xl lg:text-4xl` | 30px – 36px | 1.2 | Bold (700) | Course title, Lecture title. |
| **H2** | `text-2xl` | 24px | 1.3 | SemiBold (600) | Section headers, Admin tab titles. |
| **H3** | `text-xl` | 20px | 1.4 | SemiBold (600) | Card titles, Modal headers. |
| **H4** | `text-lg` | 18px | 1.4 | Medium (500) | Subsection headers, Question prompts. |
| **Body** | `text-base` | 16px | 1.5 | Normal (400) | Standard paragraphs, Lecture details. |
| **Small** | `text-sm` | 14px | 1.4 | Normal (400) | Badges, Table cells, Metadata. |
| **Muted / Micro** | `text-xs` | 12px | 1.3 | Medium (500) | Timestamps, Character counters. |
