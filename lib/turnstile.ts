import type { NextApiRequest } from "next"

// Official Cloudflare Turnstile test keys (Always passes)
export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA"
export const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA"

export interface TurnstileVerificationResult {
  success: boolean
  challenge_ts?: string
  hostname?: string
  "error-codes"?: string[]
  action?: string
  cdata?: string
  error?: string
}

/**
 * Extracts the real client IP from incoming Next.js API request headers.
 */
export function extractClientIp(req: NextApiRequest): string | undefined {
  const forwardedFor = req.headers["x-forwarded-for"]
  if (typeof forwardedFor === "string") {
    return forwardedFor.split(",")[0].trim()
  }
  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0].trim()
  }
  return (
    (req.headers["cf-connecting-ip"] as string) ||
    (req.headers["x-real-ip"] as string) ||
    req.socket.remoteAddress ||
    undefined
  )
}

/**
 * Verifies a Cloudflare Turnstile token server-side using Cloudflare's siteverify API.
 */
export async function verifyTurnstileToken({
  token,
  remoteIp,
  expectedAction,
}: {
  token?: string | null
  remoteIp?: string
  expectedAction?: string
}): Promise<TurnstileVerificationResult> {
  const secretKey =
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || TURNSTILE_TEST_SECRET_KEY

  // If in development/test and token is empty or test bypass token
  if (!token) {
    // In local dev without keys configured, allow graceful bypass if secret is test key
    if (secretKey === TURNSTILE_TEST_SECRET_KEY && process.env.NODE_ENV !== "production") {
      return { success: true }
    }
    return {
      success: false,
      error: "Missing Turnstile verification token",
      "error-codes": ["missing-input-response"],
    }
  }

  try {
    const formData = new URLSearchParams()
    formData.append("secret", secretKey)
    formData.append("response", token)
    if (remoteIp) {
      formData.append("remoteip", remoteIp)
    }

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    )

    if (!response.ok) {
      return {
        success: false,
        error: `Cloudflare Turnstile verification server error: ${response.statusText}`,
      }
    }

    const outcome = (await response.json()) as TurnstileVerificationResult

    if (!outcome.success) {
      return {
        success: false,
        error: "Turnstile challenge validation failed",
        "error-codes": outcome["error-codes"],
      }
    }

    // Optional action mismatch verification
    if (expectedAction && outcome.action && outcome.action !== expectedAction) {
      return {
        success: false,
        error: `Turnstile action mismatch: expected '${expectedAction}', got '${outcome.action}'`,
      }
    }

    return {
      success: true,
      challenge_ts: outcome.challenge_ts,
      hostname: outcome.hostname,
      action: outcome.action,
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown verification error"
    console.error("Turnstile verification exception:", message)
    return {
      success: false,
      error: `Network error verifying Turnstile token: ${message}`,
    }
  }
}
