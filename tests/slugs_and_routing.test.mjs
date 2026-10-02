import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { register } from "node:module"

const moduleHook = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const rel = specifier.slice(2);
    const hasExt = rel.endsWith(".ts") || rel.endsWith(".tsx") || rel.endsWith(".js") || rel.endsWith(".mjs");
    const target = "file://" + process.cwd() + "/" + rel + (hasExt ? "" : ".ts");
    return nextResolve(target, context);
  }
  return nextResolve(specifier, context);
}
`
try {
  register(`data:text/javascript;base64,${Buffer.from(moduleHook).toString("base64")}`, import.meta.url)
} catch {}

const {
  slugify,
  getCourseSlug,
  getCourseUrl,
  getLectureSlug,
  getLectureUrl,
  getQuizSlug,
  getQuizUrl,
  extractShortId,
  isUuid,
} = await import("../lib/slugs.ts")

const rootDir = process.cwd()

function readFile(relPath) {
  return fs.readFileSync(path.join(rootDir, relPath), "utf8")
}

describe("Human-Readable Slugs, Semantic Routing & Media Handling Suite", () => {
  // ─── 1. SLUG GENERATION & SANITIZATION ──────────────────────────────────
  describe("1. Slug Generation & Sanitization (slugify)", () => {
    it("1.1 converts English course title to clean kebab-case", () => {
      assert.equal(slugify("Analytical Chemistry I"), "analytical-chemistry-i")
      assert.equal(slugify("Medicinal Chemistry & Drug Design!"), "medicinal-chemistry-and-drug-design")
    })

    it("1.2 transliterates Arabic course title to phonetically readable English slug", () => {
      const arTitle = "الكيمياء التحليلية 1"
      const slug = slugify(arTitle)
      assert.ok(slug.length > 0)
      assert.match(slug, /^[a-z0-9-]+$/)
    })

    it("1.3 handles duplicate consecutive dashes and trailing spaces", () => {
      assert.equal(slugify("  Organic  Chemistry --- Lab 1  "), "organic-chemistry-lab-1")
    })

    it("1.4 handles empty or non-alphanumeric input safely", () => {
      assert.equal(slugify(""), "")
      assert.equal(slugify("???!!!"), "")
    })
  })

  // ─── 2. ENTITY SLUGS & COLLISION DISAMBIGUATION ─────────────────────────
  describe("2. Entity Slugs & Collision Disambiguation", () => {
    const course = {
      id: "de5a25ce-407f-418d-845e-2462d4a7bb8f",
      title_en: "Analytical Chemistry 1",
      title_ar: "الكيمياء التحليلية 1",
    }

    const duplicateLectures = [
      {
        id: "80e87756-1111-2222-3333-444455556666",
        title_en: "Plants lecture 1",
        title_ar: "محاضرة النباتات 1",
      },
      {
        id: "9bf42ca8-7777-8888-9999-000011112222",
        title_en: "Plants lecture 1",
        title_ar: "محاضرة النباتات 1",
      },
    ]

    it("2.1 generates clean course slug and URL without UUID when title is unique", () => {
      const slug = getCourseSlug(course)
      assert.equal(slug, "analytical-chemistry-1")
      assert.equal(getCourseUrl(course), "/course/analytical-chemistry-1")
    })

    it("2.2 disambiguates colliding lecture titles by appending short UUID suffix", () => {
      const slug1 = getLectureSlug(duplicateLectures[0], duplicateLectures)
      const slug2 = getLectureSlug(duplicateLectures[1], duplicateLectures)

      assert.equal(slug1, "plants-lecture-1-80e87756")
      assert.equal(slug2, "plants-lecture-1-9bf42ca8")
      assert.notEqual(slug1, slug2)
    })

    it("2.3 extractShortId accurately parses suffix from collision slug", () => {
      const shortId = extractShortId("plants-lecture-1-80e87756")
      assert.equal(shortId, "80e87756")

      const nonCollision = extractShortId("analytical-chemistry-1")
      assert.equal(nonCollision, null)
    })

    it("2.4 isUuid correctly identifies raw UUID vs semantic slug", () => {
      assert.equal(isUuid("de5a25ce-407f-418d-845e-2462d4a7bb8f"), true)
      assert.equal(isUuid("analytical-chemistry-1"), false)
      assert.equal(isUuid("plants-lecture-1-80e87756"), false)
    })

    it("2.5 generates clean quiz slug and URL", () => {
      const quiz = {
        id: "q-1234-5678-90ab",
        title_en: "Analytical Quiz Lec 1-2",
        title_ar: "اختبار الكيمياء التحليلية 1-2",
      }
      const slug = getQuizSlug(quiz)
      assert.equal(slug, "analytical-quiz-lec-1-2")
      assert.equal(getQuizUrl(quiz), "/quiz/analytical-quiz-lec-1-2")
    })
  })

  // ─── 3. PERMANENT 308 REDIRECT & RESOLVER INTEGRITY ─────────────────────
  describe("3. 308 Canonical Redirect & Resolver Architecture", () => {
    const coursePage = readFile("pages/course/[id].tsx")
    const lecturePage = readFile("pages/lecture/[id].tsx")
    const quizPage = readFile("pages/quiz/[id].tsx")

    it("3.1 pages/course/[id].tsx issues permanent 308 redirect when accessed with UUID", () => {
      assert.match(
        coursePage,
        /resolveCourse\(/,
        "Course page must invoke resolveCourse helper"
      )
      assert.match(
        coursePage,
        /permanent:\s*true/,
        "Course page must issue HTTP 308 permanent redirect for canonical SEO"
      )
    })

    it("3.2 pages/lecture/[id].tsx issues permanent 308 redirect and preserves query params", () => {
      assert.match(
        lecturePage,
        /resolveLecture\(/,
        "Lecture page must invoke resolveLecture helper"
      )
      assert.match(
        lecturePage,
        /permanent:\s*true/,
        "Lecture page must issue HTTP 308 permanent redirect"
      )
      assert.match(
        lecturePage,
        /queryParams|qs/,
        "Lecture page redirect must preserve query strings such as ?tab=resources"
      )
    })

    it("3.3 pages/quiz/[id].tsx issues permanent 308 redirect when accessed with UUID", () => {
      assert.match(
        quizPage,
        /resolveQuiz\(/,
        "Quiz page must invoke resolveQuiz helper"
      )
      assert.match(
        quizPage,
        /permanent:\s*true/,
        "Quiz page must issue HTTP 308 permanent redirect"
      )
    })
  })

  // ─── 4. RESOURCE MEDIA PREVIEW VS ARCHIVE DOWNLOAD ──────────────────────
  describe("4. Resource Action Card & Preview Modals", () => {
    const mediaCard = readFile("components/ui/media-action-card.tsx")

    it("4.1 media-action-card.tsx opens PdfPreviewModal for documents instead of immediate download", () => {
      assert.match(
        mediaCard,
        /<PdfPreviewModal/,
        "Must mount PdfPreviewModal for previewing PDFs"
      )
      assert.match(
        mediaCard,
        /setPdfOpen\(true\)/,
        "Must open PDF modal when viewing PDF or document kind"
      )
    })

    it("4.2 media-action-card.tsx opens ImagePreviewModal for mind maps and diagram images", () => {
      assert.match(
        mediaCard,
        /resolvedKind === ["']image["']\s*&&\s*\(\s*<ImagePreviewModal/,
        "Image items must mount ImagePreviewModal for in-app viewing"
      )
      assert.match(
        mediaCard,
        /setImageOpen\(true\)/,
        "Must open image modal when viewing image kind"
      )
    })

    it("4.3 media-action-card.tsx designates archives with prominent Download Archive button", () => {
      assert.match(
        mediaCard,
        /isArchive/,
        "Must classify archives (.zip, .rar, .7z, .tar, .gz)"
      )
      assert.match(
        mediaCard,
        /Download Archive/,
        "Must provide single clear Download Archive action without duplicate download buttons"
      )
    })
  })

  // ─── 5. SITEMAP SEMANTIC URLS ───────────────────────────────────────────
  describe("5. Sitemap Clean Semantic Slugs", () => {
    const sitemap = readFile("pages/sitemap.xml.ts")

    it("5.1 pages/sitemap.xml.ts emits clean slug URLs for courses, lectures and quizzes", () => {
      assert.match(
        sitemap,
        /getCourseSlug/,
        "Sitemap must use getCourseSlug for course URLs"
      )
      assert.match(
        sitemap,
        /getLectureSlug/,
        "Sitemap must use getLectureSlug for lecture URLs"
      )
      assert.match(
        sitemap,
        /getQuizSlug/,
        "Sitemap must use getQuizSlug for quiz URLs"
      )
    })
  })
})
