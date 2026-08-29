/**
 * Layout Simulator & CSS Math Evaluation Engine
 * Evaluates responsive CSS calculations, breakpoint logic, touch targets, and AST properties.
 */

import fs from "fs"
import path from "path"

export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
}

export const STANDARD_VIEWPORTS = [
  { name: "iPhone SE (1st gen)", width: 320, height: 568, category: "mobile-xs" },
  { name: "iPhone SE (2nd/3rd gen)", width: 375, height: 667, category: "mobile-sm" },
  { name: "iPhone 14/15 Pro", width: 390, height: 844, category: "mobile-md" },
  { name: "iPad Mini / Tablet Portrait", width: 768, height: 1024, category: "tablet" },
  { name: "iPad Pro / Desktop Standard", width: 1024, height: 768, category: "desktop-sm" },
  { name: "MacBook / Large Desktop", width: 1280, height: 800, category: "desktop-lg" },
]

export const EXTREME_VIEWPORTS = [
  { name: "Galaxy Fold Cover", width: 280, height: 653, category: "extreme-xs" },
  { name: "Ultra-compact screen", width: 240, height: 320, category: "extreme-micro" },
  { name: "4K Display", width: 3840, height: 2160, category: "extreme-4k" },
]

/**
 * Evaluates CSS clamp / min / max / calc expressions given a viewport width.
 * Standard base font size is 16px.
 */
export function evaluateCssLength(expression, viewportWidth, baseFontSize = 16) {
  let expr = expression.trim()

  // Handle calc() or min() or max()
  // Example: min(14rem, calc(100vw - 1.5rem))
  // or w-[min(14rem,calc(100vw-1.5rem))]
  const minMatch = expr.match(/min\(\s*([^,]+)\s*,\s*(.+)\s*\)/)
  if (minMatch) {
    const valA = evaluateCssLength(minMatch[1], viewportWidth, baseFontSize)
    const valB = evaluateCssLength(minMatch[2], viewportWidth, baseFontSize)
    return Math.min(valA, valB)
  }

  const maxMatch = expr.match(/max\(\s*([^,]+)\s*,\s*(.+)\s*\)/)
  if (maxMatch) {
    const valA = evaluateCssLength(maxMatch[1], viewportWidth, baseFontSize)
    const valB = evaluateCssLength(maxMatch[2], viewportWidth, baseFontSize)
    return Math.max(valA, valB)
  }

  const calcMatch = expr.match(/calc\((.+)\)/)
  if (calcMatch) {
    return evaluateCalcExpression(calcMatch[1], viewportWidth, baseFontSize)
  }

  // Unit conversions
  if (expr.endsWith("rem")) {
    return parseFloat(expr) * baseFontSize
  }
  if (expr.endsWith("px")) {
    return parseFloat(expr)
  }
  if (expr.endsWith("vw")) {
    return (parseFloat(expr) / 100) * viewportWidth
  }
  if (expr.endsWith("%")) {
    return (parseFloat(expr) / 100) * viewportWidth
  }

  const num = parseFloat(expr)
  return isNaN(num) ? 0 : num
}

function evaluateCalcExpression(calcBody, viewportWidth, baseFontSize) {
  // Replace 100vw, rem, px with pixel numbers
  let sanitized = calcBody
    .replace(/(\d+(?:\.\d+)?)vw/g, (_, v) => (parseFloat(v) / 100) * viewportWidth)
    .replace(/(\d+(?:\.\d+)?)rem/g, (_, r) => parseFloat(r) * baseFontSize)
    .replace(/(\d+(?:\.\d+)?)px/g, (_, p) => parseFloat(p))

  // Simple safe arithmetic evaluation
  // Only allow digits, decimals, +, -, *, /, spaces, parentheses
  if (!/^[\d\.\+\-\*\/\s\(\)]+$/.test(sanitized)) {
    throw new Error(`Unsafe calc expression: ${sanitized}`)
  }

  try {
    return Function(`"use strict"; return (${sanitized})`)()
  } catch (err) {
    throw new Error(`Failed to evaluate calc expression "${calcBody}": ${err.message}`)
  }
}

/**
 * Load and inspect file content.
 */
export function loadProjectFile(relativePath) {
  const fullPath = path.resolve(process.cwd(), relativePath)
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File does not exist: ${fullPath}`)
  }
  return fs.readFileSync(fullPath, "utf-8")
}

/**
 * Check if a CSS file contains expected selector or utility definitions.
 */
export function parseCssUtilities(cssContent) {
  const utilityClasses = new Map()

  // Match class rules like .scrollbar-none { ... } or .display-title { ... }
  const ruleRegex = /\.([a-zA-Z0-9_\-\:]+)\s*\{([^}]+)\}/g
  let match
  while ((match = ruleRegex.exec(cssContent)) !== null) {
    utilityClasses.set(match[1], match[2].trim())
  }

  return utilityClasses
}

/**
 * Extract JSX className attributes from TSX content.
 */
export function extractClassNames(tsxContent) {
  const classes = []
  // Matches className="..." and className={`...`}
  const staticClassRegex = /className\s*=\s*"([^"]+)"/g
  let match
  while ((match = staticClassRegex.exec(tsxContent)) !== null) {
    classes.push(match[1])
  }

  const templateClassRegex = /className\s*=\s*\{`([^`]+)`\}/g
  while ((match = templateClassRegex.exec(tsxContent)) !== null) {
    classes.push(match[1])
  }

  return classes
}

/**
 * Extract touch target elements and their min-height classes.
 */
export function extractTouchTargetHeights(className) {
  const minHMatch = className.match(/min-h-\[(\d+)px\]/)
  if (minHMatch) {
    return parseInt(minHMatch[1], 10)
  }
  const hMatch = className.match(/\bh-(\d+)\b/)
  if (hMatch) {
    return parseInt(hMatch[1], 10) * 4 // Tailwind unit = 4px
  }
  const sizeMatch = className.match(/\bsize-(\d+)\b/)
  if (sizeMatch) {
    return parseInt(sizeMatch[1], 10) * 4
  }
  return null
}
