import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const rootDir = process.cwd()

function readFile(relPath) {
  return fs.readFileSync(path.join(rootDir, relPath), "utf8")
}

describe("Feedback System, Visual Fixes, SEO Images & CMS Integrity Suite", () => {
  // ─── 1. VISUAL & RESPONSIVE TABS INTEGRITY ─────────────────────────────────
  describe("1. Tabs & Responsive Button Layout Integrity", () => {
    const tabsComponent = readFile("components/ui/tabs.tsx")
    const loginPage = readFile("pages/login.tsx")
    const communityManager = readFile("components/admin/CommunityManager.tsx")

    it("1.1 components/ui/tabs.tsx TabsList specifies dynamic h-auto min-h-9", () => {
      assert.match(
        tabsComponent,
        /h-auto\s+min-h-9/,
        "TabsList must use dynamic h-auto min-h-9 to prevent child trigger button clipping"
      )
    })

    it("1.2 pages/login.tsx TabsList uses h-auto with rounded container and padding", () => {
      assert.match(
        loginPage,
        /<TabsList[^>]*\bh-auto\b/,
        "pages/login.tsx TabsList must have h-auto"
      )
    })

    it("1.3 pages/login.tsx English signUpTab copy is concise to prevent small viewport overflow", () => {
      assert.match(
        loginPage,
        /signUpTab:\s*"Create Account"/,
        "signUpTab copy must be 'Create Account' for mobile screen fit"
      )
    })

    it("1.4 pages/login.tsx TabsTriggers use truncate to guarantee zero text spillage", () => {
      assert.match(
        loginPage,
        /<span\s+className="truncate">\{copy\.signInTab\}<\/span>/,
        "signInTab span must have truncate"
      )
      assert.match(
        loginPage,
        /<span\s+className="truncate">\{copy\.signUpTab\}<\/span>/,
        "signUpTab span must have truncate"
      )
    })

    it("1.5 CommunityManager TabsList uses responsive h-auto min-h-10", () => {
      assert.match(
        communityManager,
        /h-auto\s+min-h-10/,
        "CommunityManager TabsList must use h-auto min-h-10"
      )
    })
  })

  // ─── 2. SEO & PREVIEW IMAGE (OG / TWITTER) AUDIT ───────────────────────────
  describe("2. OpenGraph & Twitter Card SEO Image Resolution", () => {
    const layout = readFile("components/Layout.tsx")

    it("2.1 Layout.tsx dynamically resolves siteUrl checking NEXT_PUBLIC_VERCEL_URL", () => {
      assert.match(
        layout,
        /process\.env\.NEXT_PUBLIC_VERCEL_URL/,
        "Layout.tsx must check NEXT_PUBLIC_VERCEL_URL for dynamic preview deployments"
      )
    })

    it("2.2 Layout.tsx resolves absolute HTTPS ogImage for both relative and external assets", () => {
      assert.match(
        layout,
        /image\.startsWith\("http:\/\/|\"https:\/\/"\)/,
        "Layout.tsx must detect absolute protocols in image URLs"
      )
      assert.match(
        layout,
        /\$\{siteUrl\}\$\{cleanImgPath\}/,
        "Layout.tsx must prepend siteUrl to relative image paths"
      )
    })

    it("2.3 Layout.tsx injects og:image:secure_url, og:image:width 1200, and og:image:height 630", () => {
      assert.match(layout, /<meta\s+property="og:image:secure_url"/)
      assert.match(layout, /<meta\s+property="og:image:width"\s+content="1200"/)
      assert.match(layout, /<meta\s+property="og:image:height"\s+content="630"/)
    })

    it("2.4 Layout.tsx dynamically assigns og:image:type based on image format", () => {
      assert.match(layout, /property="og:image:type"/)
      assert.match(layout, /image\/jpeg/)
      assert.match(layout, /image\/png/)
    })

    it("2.5 Static OG image assets exist in public/ directory", () => {
      assert.ok(fs.existsSync(path.join(rootDir, "public/og-image.png")), "public/og-image.png must exist")
      assert.ok(fs.existsSync(path.join(rootDir, "public/og-image-ar.png")), "public/og-image-ar.png must exist")
      assert.ok(fs.existsSync(path.join(rootDir, "public/og-course.png")), "public/og-course.png must exist")
      assert.ok(fs.existsSync(path.join(rootDir, "public/og-quiz.png")), "public/og-quiz.png must exist")
    })
  })

  // ─── 3. SITE CONTENT CMS CIRCULAR JSON SERIALIZATION FIX ───────────────────
  describe("3. Site Content CMS Circular JSON Exception Shielding", () => {
    const adminIndex = readFile("pages/admin/index.tsx")
    const siteContentManager = readFile("components/admin/SiteContentManager.tsx")

    it("3.1 pages/admin/index.tsx saveSiteContent validates overrideContent against React DOM events", () => {
      assert.match(
        adminIndex,
        /!\("nativeEvent" in \(overrideContent as object\)\)/,
        "saveSiteContent must reject React SyntheticEvents"
      )
      assert.match(
        adminIndex,
        /!\("target" in \(overrideContent as object\)\)/,
        "saveSiteContent must reject DOM event targets"
      )
      assert.match(
        adminIndex,
        /"en" in \(overrideContent as object\)/,
        "saveSiteContent must check for bilingual 'en' key before using overrideContent"
      )
    })

    it("3.2 SiteContentManager invokes onSaveContent safely without event forwarding", () => {
      assert.match(
        siteContentManager,
        /onClick=\{.*=>\s*onSaveContent\(\)\}/,
        "SiteContentManager must invoke onSaveContent via arrow function"
      )
    })
  })

  // ─── 4. FEEDBACK TYPES & DATABASE SCHEMA ───────────────────────────────────
  describe("4. Feedback Types, Schema & Security RLS Model", () => {
    const typesIndex = readFile("types/index.ts")
    const schemaSql = readFile("supabase/00_complete_production_schema.sql")

    it("4.1 types/index.ts defines FeedbackType, FeedbackCategory, FeedbackSeverity, FeedbackStatus, and FeedbackSubmission", () => {
      assert.match(typesIndex, /export type FeedbackType = 'technical' \| 'academic';/)
      assert.match(typesIndex, /export type FeedbackSeverity = 'low' \| 'medium' \| 'high' \| 'critical';/)
      assert.match(typesIndex, /export type FeedbackStatus =/)
      assert.match(typesIndex, /export interface FeedbackSubmission \{/)
    })

    it("4.2 00_complete_production_schema.sql defines public.feedback_submissions table", () => {
      assert.match(
        schemaSql,
        /CREATE TABLE IF NOT EXISTS public\.feedback_submissions/,
        "Schema must create feedback_submissions table"
      )
    })

    it("4.3 00_complete_production_schema.sql configures check constraints for feedback_type, severity, and status", () => {
      assert.match(schemaSql, /CHECK \(feedback_type IN \('technical', 'academic'\)\)/)
      assert.match(schemaSql, /CHECK \(severity IN \('low', 'medium', 'high', 'critical'\)\)/)
      assert.match(schemaSql, /CHECK \(status IN \('open', 'under_review', 'in_progress', 'resolved', 'dismissed'\)\)/)
    })

    it("4.4 00_complete_production_schema.sql creates performance indexes for feedback queries", () => {
      assert.match(schemaSql, /CREATE INDEX IF NOT EXISTS idx_feedback_status ON public\.feedback_submissions\(status\)/)
      assert.match(schemaSql, /CREATE INDEX IF NOT EXISTS idx_feedback_type ON public\.feedback_submissions\(feedback_type\)/)
      assert.match(schemaSql, /CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public\.feedback_submissions\(created_at DESC\)/)
    })

    it("4.5 00_complete_production_schema.sql enables RLS and defines policies for anon insert and staff manage", () => {
      assert.match(schemaSql, /ALTER TABLE public\.feedback_submissions ENABLE ROW LEVEL SECURITY;/)
      assert.match(schemaSql, /CREATE POLICY "Allow public insert on feedback_submissions"/)
      assert.match(schemaSql, /CREATE POLICY "Staff manage feedback submissions"/)
    })
  })

  // ─── 5. API ENDPOINTS INTEGRITY ────────────────────────────────────────────
  describe("5. Feedback API Endpoints Architecture", () => {
    it("5.1 pages/api/feedback/submit.ts exists and validates submissions with Zod", () => {
      const submitApi = readFile("pages/api/feedback/submit.ts")
      assert.match(submitApi, /feedbackSubmitSchema = z\.object\(/)
      assert.match(submitApi, /feedback_type: z\.enum\(\["technical", "academic"\]\)/)
      assert.match(submitApi, /severity: z\.enum\(\["low", "medium", "high", "critical"\]\)/)
    })

    it("5.2 pages/api/admin/feedback/index.ts exists and enforces staff authorization", () => {
      const listApi = readFile("pages/api/admin/feedback/index.ts")
      assert.match(listApi, /\["dev", "super_admin", "mentor"\]\.includes\(profile\.role\)/)
      assert.match(listApi, /from\("feedback_submissions"\)/)
    })

    it("5.3 pages/api/admin/feedback/[id].ts supports PATCH status/notes and DELETE", () => {
      const itemApi = readFile("pages/api/admin/feedback/[id].ts")
      assert.match(itemApi, /req\.method === "PATCH"/)
      assert.match(itemApi, /req\.method === "DELETE"/)
      assert.match(itemApi, /updates\.resolved_by = requester\.user\.id/)
    })
  })

  // ─── 6. PUBLIC FEEDBACK PORTAL & ADMIN HUB ─────────────────────────────────
  describe("6. Public Feedback Portal & Admin Dashboard Hub", () => {
    const feedbackPage = readFile("pages/feedback.tsx")
    const feedbackManager = readFile("components/admin/FeedbackManager.tsx")
    const adminIndex = readFile("pages/admin/index.tsx")
    const adminSidebar = readFile("components/admin/AdminSidebar.tsx")
    const adminTopNav = readFile("components/admin/AdminTopNav.tsx")
    const navbar = readFile("components/Navbar.tsx")
    const footer = readFile("components/Footer.tsx")

    it("6.1 pages/feedback.tsx provides dual technical and academic tabs with telemetry capture", () => {
      assert.match(feedbackPage, /value="technical"/)
      assert.match(feedbackPage, /value="academic"/)
      assert.match(feedbackPage, /function detectBrowser\(\)/)
      assert.match(feedbackPage, /function detectOS\(\)/)
      assert.match(feedbackPage, /Turnstile/)
    })

    it("6.2 components/admin/FeedbackManager.tsx provides stats cards, filtering, and detail modal", () => {
      assert.match(feedbackManager, /openTechnicalCount/)
      assert.match(feedbackManager, /openAcademicCount/)
      assert.match(feedbackManager, /handleUpdateSubmission/)
      assert.match(feedbackManager, /handleDeleteSubmission/)
    })

    it("6.3 pages/admin/index.tsx integrates FeedbackManager with dynamic code splitting", () => {
      assert.match(adminIndex, /const FeedbackManager = dynamic\(/)
      assert.match(adminIndex, /activePage === "feedback"/)
    })

    it("6.4 AdminSidebar and AdminTopNav include feedback navigation with badge counter", () => {
      assert.match(adminSidebar, /page:\s*"feedback"/)
      assert.match(adminSidebar, /openFeedbackCount/)
      assert.match(adminTopNav, /feedback:\s*\{/)
    })

    it("6.5 Navbar and Footer contain links to /feedback", () => {
      assert.match(navbar, /href:\s*"(\/feedback|\/#feedback)"/)
      assert.match(footer, /href="\/feedback"/)
    })

    it("6.6 Homepage contains dedicated #feedback section with CTA button", () => {
      const homeIndex = readFile("pages/index.tsx")
      assert.match(homeIndex, /id="feedback"/)
      assert.match(homeIndex, /href="\/feedback"/)
    })
  })
})
