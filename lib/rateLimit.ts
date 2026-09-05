import type { NextApiRequest, NextApiResponse } from "next"

export interface RateLimitOptions {
  limit: number
  windowMs: number
  prefix?: string
}

interface Bucket {
  tokens: number
  lastRefill: number
}

// In-memory token bucket store
const buckets = new Map<string, Bucket>()

// Background cleanup: purge buckets that have been inactive for more than 15 minutes
const CLEANUP_INTERVAL_MS = 1000 * 60 * 5 // 5 minutes
if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of buckets.entries()) {
      if (now - bucket.lastRefill > 1000 * 60 * 15) {
        buckets.delete(key)
      }
    }
  }, CLEANUP_INTERVAL_MS)

  // Avoid keeping the Node.js process alive in CLI scripts or unit tests
  if (cleanupTimer.unref) {
    cleanupTimer.unref()
  }
}

/**
 * Extracts client IP from request headers or socket remote address.
 */
export function getClientIp(req: NextApiRequest): string {
  if (!req) return "127.0.0.1"

  const forwarded = req.headers?.["x-forwarded-for"]
  if (typeof forwarded === "string" && forwarded.trim().length > 0) {
    return forwarded.split(",")[0].trim()
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(",")[0].trim()
  }

  const realIp = req.headers?.["x-real-ip"]
  if (typeof realIp === "string" && realIp.trim().length > 0) {
    return realIp.trim()
  }

  return req.socket?.remoteAddress || "127.0.0.1"
}

/**
 * Checks whether an incoming request exceeds the configured rate limit
 * using an in-memory sliding-window token bucket algorithm.
 * Sets standard headers (X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After)
 * and returns false with a 429 status when limit is exceeded.
 */
export function checkRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  options: RateLimitOptions
): boolean {
  const limit = Math.max(1, options.limit)
  const windowMs = Math.max(1000, options.windowMs)
  const prefix = options.prefix || "api"

  const ip = getClientIp(req)
  const key = `${prefix}:${ip}`
  const now = Date.now()

  let bucket = buckets.get(key)
  if (!bucket) {
    bucket = { tokens: limit, lastRefill: now }
    buckets.set(key, bucket)
  } else {
    const elapsed = now - bucket.lastRefill
    const refill = (elapsed / windowMs) * limit
    bucket.tokens = Math.min(limit, bucket.tokens + refill)
    bucket.lastRefill = now
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    const remaining = Math.floor(bucket.tokens)
    res.setHeader("X-RateLimit-Limit", limit)
    res.setHeader("X-RateLimit-Remaining", remaining)
    return true
  }

  // Token bucket exhausted: calculate seconds until 1 token is refilled
  const needed = 1 - bucket.tokens
  const waitMs = Math.ceil((needed / limit) * windowMs)
  const retryAfter = Math.max(1, Math.ceil(waitMs / 1000))

  res.setHeader("X-RateLimit-Limit", limit)
  res.setHeader("X-RateLimit-Remaining", 0)
  res.setHeader("Retry-After", retryAfter)

  res.status(429).json({
    error: "Too Many Requests",
    message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
    retryAfter,
  })

  return false
}

/**
 * Clears all rate limit tracking buckets (useful for test resets).
 */
export function resetRateLimits(): void {
  buckets.clear()
}
