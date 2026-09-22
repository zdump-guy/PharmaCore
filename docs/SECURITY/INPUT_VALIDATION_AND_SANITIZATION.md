# Input Validation & Sanitization Pipeline

## 1. Zod Runtime Schema Enforcement

All API route payloads must pass strict Zod schema validation before touching internal business logic or database queries.

Example Zod Schema (`pages/api/feedback/submit.ts`):
```typescript
const FeedbackSubmitSchema = z.object({
  feedbackType: z.enum(['technical', 'academic']),
  category: z.string().min(2).max(100),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(4000),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  pageUrl: z.string().url().optional().or(z.literal('')),
  courseId: z.string().uuid().optional().nullable(),
  lectureId: z.string().uuid().optional().nullable(),
  reproductionSteps: z.string().max(4000).optional(),
  academicReference: z.string().max(2000).optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactName: z.string().max(100).optional(),
  deviceInfo: z.record(z.any()).optional(),
  turnstileToken: z.string().min(1)
});
```

---

## 2. Unicode & PostgREST Control Character Sanitization

To eliminate PostgREST query injection vulnerabilities and malformed JSON parsing exceptions, user-supplied strings are cleaned using `sanitizeString` in `lib/utils.ts`:

```typescript
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    // Strip non-printable ASCII and control characters except \n and \t
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    // Normalize Unicode representation
    .normalize('NFC')
    .trim();
}
```

---

## 3. XSS Defense & JSON-LD Escaping

1. **React Automatic Escaping**: All JSX string interpolations are automatically sanitized against HTML injection.
2. **Safe Schema JSON-LD**: When embedding Course and EducationalOrganization JSON-LD in `components/Layout.tsx`, script contents are serialized with safe string replacement:
```typescript
dangerouslySetInnerHTML={{
  __html: JSON.stringify(schemaData).replace(/</g, '\\u003c')
}}
```
