import fs from "node:fs"
import path from "node:path"
import assert from "node:assert/strict"

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..")

function test(name, fn) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
  } catch (err) {
    console.error(`  ✗ ${name}`)
    console.error(err)
    process.exitCode = 1
  }
}

console.log("\n► Suite: PWA & Add to Desktop Feature Verification")

test("1. public/site.webmanifest is valid JSON with PWA install metadata", () => {
  const manifestPath = path.join(PROJECT_ROOT, "public", "site.webmanifest")
  assert.ok(fs.existsSync(manifestPath), "site.webmanifest must exist")
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"))
  assert.ok(manifest.name, "manifest must have name")
  assert.ok(manifest.short_name, "manifest must have short_name")
  assert.ok(manifest.start_url, "manifest must have start_url")
  assert.equal(manifest.display, "standalone", "display mode must be standalone")
  assert.ok(Array.isArray(manifest.display_override), "display_override must be an array")
  assert.ok(manifest.display_override.includes("window-controls-overlay"), "must support window-controls-overlay for desktop")
  assert.ok(manifest.icons.some(i => i.sizes === "192x192"), "must have 192x192 icon")
  assert.ok(manifest.icons.some(i => i.sizes === "512x512" && i.purpose === "maskable"), "must have 512x512 maskable icon")
})

test("2. public/sw.js exists and implements service worker caching lifecycle", () => {
  const swPath = path.join(PROJECT_ROOT, "public", "sw.js")
  assert.ok(fs.existsSync(swPath), "public/sw.js must exist")
  const swContent = fs.readFileSync(swPath, "utf-8")
  assert.ok(swContent.includes("CACHE_NAME"), "must define cache name")
  assert.ok(swContent.includes("addEventListener(\"install\""), "must handle install event")
  assert.ok(swContent.includes("skipWaiting()"), "must skip waiting on install")
  assert.ok(swContent.includes("addEventListener(\"activate\""), "must handle activate event")
  assert.ok(swContent.includes("clients.claim()"), "must claim clients on activate")
  assert.ok(swContent.includes("addEventListener(\"fetch\""), "must handle fetch event")
  assert.ok(swContent.includes("pharmacore-logo.svg"), "must precache wide logo")
})

test("3. pages/_app.tsx registers Service Worker on client load", () => {
  const appPath = path.join(PROJECT_ROOT, "pages", "_app.tsx")
  const appContent = fs.readFileSync(appPath, "utf-8")
  assert.ok(appContent.includes('.register("/sw.js")'), "must register /sw.js")
  assert.ok(appContent.includes('"serviceWorker" in navigator') || appContent.includes("'serviceWorker' in navigator"), "must guard against unsupported environments")
})

test("4. lib/usePwaInstall.ts manages installation prompt and platform detection", () => {
  const hookPath = path.join(PROJECT_ROOT, "lib", "usePwaInstall.ts")
  assert.ok(fs.existsSync(hookPath), "usePwaInstall.ts must exist")
  const hookContent = fs.readFileSync(hookPath, "utf-8")
  assert.ok(hookContent.includes("beforeinstallprompt"), "must listen to beforeinstallprompt")
  assert.ok(hookContent.includes("appinstalled"), "must listen to appinstalled")
  assert.ok(hookContent.includes("(display-mode: standalone)"), "must detect standalone mode")
})

test("5. components/InstallAppModal.tsx provides desktop and iOS installation guide", () => {
  const modalPath = path.join(PROJECT_ROOT, "components", "InstallAppModal.tsx")
  assert.ok(fs.existsSync(modalPath), "InstallAppModal.tsx must exist")
  const modalContent = fs.readFileSync(modalPath, "utf-8")
  assert.ok(modalContent.includes("تطبيق سطح المكتب") || modalContent.includes("Desktop App"), "must support Desktop App mode")
  assert.ok(modalContent.includes("Safari"), "must provide iOS Safari instructions")
  assert.ok(modalContent.includes("usePwaInstall"), "must use usePwaInstall hook")
})

test("6. components/Navbar.tsx and Footer.tsx render install triggers", () => {
  const navPath = path.join(PROJECT_ROOT, "components", "Navbar.tsx")
  const navContent = fs.readFileSync(navPath, "utf-8")
  assert.ok(navContent.includes("InstallAppModal"), "Navbar must render InstallAppModal")

  const footerPath = path.join(PROJECT_ROOT, "components", "Footer.tsx")
  const footerContent = fs.readFileSync(footerPath, "utf-8")
  assert.ok(footerContent.includes("InstallAppModal"), "Footer must render InstallAppModal")
})

console.log("\nAll PWA installation tests completed.\n")
