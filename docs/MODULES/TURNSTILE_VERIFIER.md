# Module: Turnstile Verifier (`lib/turnstile.ts`)

## 1. Overview
`lib/turnstile.ts` handles server-side token validation against Cloudflare's Turnstile verification API (`https://challenges.cloudflare.com/turnstile/v0/siteverify`).

---

## 2. Exported Function

```typescript
export interface TurnstileVerificationResult {
  success: boolean;
  errorCodes?: string[];
  challengeTs?: string;
  hostname?: string;
}

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<TurnstileVerificationResult>;
```

---

## 3. Local Development Bypass Mode
If `process.env.NODE_ENV !== 'production'` and the token matches known Cloudflare test tokens (`1x0000000000000000000000000000000AA`), the function returns `{ success: true }` without making external network calls.
