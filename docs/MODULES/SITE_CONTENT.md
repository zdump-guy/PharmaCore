# Module: Site Content CMS (`lib/siteContent.ts`)

## 1. Overview
`lib/siteContent.ts` defines the canonical static fallback content dictionary for all public marketing copy, hero headlines, features, and FAQs, while supporting dynamic override from `public.site_content` in Supabase.

---

## 2. Exported Interfaces & Defaults

```typescript
export interface SiteContent {
  hero: {
    badge_en: string;
    badge_ar: string;
    title_en: string;
    title_ar: string;
    subtitle_en: string;
    subtitle_ar: string;
  };
  features: { ... };
  about: { ... };
  contact: { ... };
}

export const DEFAULT_SITE_CONTENT: SiteContent = { ... };

export async function getMergedSiteContent(): Promise<SiteContent>;
```

---

## 3. Circular JSON Shielding
When saving content overrides from `components/admin/SiteContentManager.tsx`, the save handler validates that DOM event objects are stripped to prevent circular JSON serialization exceptions.
