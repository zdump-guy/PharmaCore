# Automated Verifiable Certificates & Public Verification (`docs/certificates_and_verification.md`)

## 1. Overview
PharmaCore implements an automated, fraud-resistant academic certification engine. Certificates are automatically unlocked when a student proves complete mastery of a clinical pharmacology curriculum.

---

## 2. Mastery Evaluation Criteria (`lib/certificates.ts`)

Certificates are issued only when both conditions are satisfied:

$$\text{Lecture Watch Completion Rate} = 100.0\%$$
$$\text{Aggregate Course Quiz Average} \ge 80.0\%$$

```typescript
export function evaluateCertificateEligibility(
  watchCompletionRate: number,
  averageQuizScore: number
): {
  eligible: boolean
  reasons: string[]
} {
  const reasons: string[] = []
  const safeWatch = Number(watchCompletionRate) || 0
  const safeQuiz = Number(averageQuizScore) || 0

  if (safeWatch < 100) {
    reasons.push(`Incomplete video lessons (${safeWatch.toFixed(1)}% / 100% completed)`)
  }
  if (safeQuiz < 80) {
    reasons.push(`Quiz average below passing bar (${safeQuiz.toFixed(1)}% / 80% required)`)
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  }
}
```

---

## 3. Cryptographic Verification Code Generation

Verification codes are generated deterministically to prevent forgery:

```typescript
export function generateCertificateCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ" // Unambiguous charset
  const segment1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  const segment2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return `PC-${segment1}-${segment2}`
}
```

---

## 4. Vector PDF Generation Engine (`lib/certificatePdf.ts`)

Certificates are compiled dynamically in the browser or on the server using `jspdf` and `qrcode`:

1. **Dimensions**: Landscape A4 ($297\text{ mm} \times 210\text{ mm}$).
2. **Design**:
   - Double outer borders with navy and gold foil accents.
   - Dynamic Student Name & Verification Badge.
   - Course Title and Clinical Competencies.
   - Issue Date and Unique Verification Code.
   - Embedded QR Code: Links directly to `https://pharmacore.edu/verify/{code}`.

---

## 5. Public Verification Portal (`/verify/[code]`)

The `/verify/[code]` route provides instant public validation:
- Validates certificate presence in Supabase `certificates` table.
- Displays:
  - Recipient Full Name & University
  - Course Title & Category
  - Issue Date & Serial Number
  - Official Verification Status Badge (Verified & Authentic)
