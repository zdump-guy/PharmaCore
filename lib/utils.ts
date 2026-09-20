import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDirectImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  if (url.includes("drive.google.com")) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`
    }
  }
  return url
}

/**
 * Sanitizes user-provided input text by stripping control characters,
 * null bytes, and normalizing unicode to prevent injection attacks.
 */
export function sanitizeInputText(input: string | null | undefined): string {
  if (!input) return ""
  return input
    .normalize("NFKC")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Strip control characters
    .trim()
}

/**
 * Sanitizes search terms for PostgREST .or() / .ilike() filter queries
 * to prevent PostgREST query syntax manipulation.
 */
export function sanitizePostgrestFilter(term: string | null | undefined): string {
  if (!term) return ""
  return term
    .normalize("NFKC")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/[(),."%_\\]/g, "") // Strip PostgREST operators & wildcards
    .trim()
}

/**
 * Validates that a user-supplied URL uses a safe protocol (http or https).
 * Blocks dangerous schemes like javascript:, data:, vbscript:.
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false
  const trimmed = url.trim().toLowerCase()
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(url.trim())
      return parsed.protocol === "http:" || parsed.protocol === "https:"
    } catch {
      return false
    }
  }
  return false
}

/**
 * Escapes characters in JSON strings destined for inline <script> tags
 * (e.g. JSON-LD) to prevent HTML / script breakout XSS.
 */
export function escapeJsonLd(jsonString: string): string {
  return jsonString
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
}

