# Module: Rate Limiter (`lib/rateLimit.ts`)

## 1. Overview
`lib/rateLimit.ts` provides an in-memory sliding window rate limiter designed for Next.js serverless route handlers. It tracks request timestamps per IP or user token and returns an eviction-safe check.

---

## 2. Exported Functions & Types

```typescript
export interface RateLimitOptions {
  windowMs?: number; // Duration of sliding window in milliseconds (default: 60,000)
  max?: number;      // Maximum requests permitted in window (default: 30)
}

export interface RateLimitResult {
  allowed: boolean;  // Whether the request is permitted
  limit: number;    // Maximum quota
  remaining: number;// Remaining quota in current window
  resetTime: number;// Epoch timestamp when current window resets
}

export function checkRateLimit(
  identifier: string,
  options?: RateLimitOptions
): RateLimitResult;

export function getClientIp(req: IncomingMessage): string;
```

---

## 3. Real-IP Extraction Order
`getClientIp(req)` extracts client IP following strict precedence to prevent spoofing:
1. `cf-connecting-ip`
2. `x-real-ip`
3. `x-forwarded-for` (first non-empty comma-separated address)
4. `req.socket.remoteAddress`
