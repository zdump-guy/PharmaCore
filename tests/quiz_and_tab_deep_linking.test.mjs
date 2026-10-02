import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const rootDir = process.cwd()

function readFile(relPath) {
  return fs.readFileSync(path.join(rootDir, relPath), "utf8")
}

describe("Quiz Dual-Mode, Tab Deep-Linking & Admin Email Resilience Test Suite", () => {
  // ─── 1. PURE PDF ASSESSMENT & WORKSHEET INTEGRITY ─────────────────────────
  describe("1. Pure PDF Assessment & Worksheet Support", () => {
    const quizPage = readFile("pages/quiz/[id].tsx")

    it("1.1 pages/quiz/[id].tsx imports PdfPreviewModal component", () => {
      assert.match(
        quizPage,
        /import\s+PdfPreviewModal\s+from\s+["']@\/components\/ui\/pdf-preview-modal["']/,
        "Quiz page must import PdfPreviewModal for rendering PDF worksheet assessments"
      )
    })

    it("1.2 pages/quiz/[id].tsx has eliminated interactive questions table queries and MCQ states", () => {
      assert.doesNotMatch(
        quizPage,
        /\.from\(["']questions["']\)/,
        "Quiz page must no longer query questions table"
      )
      assert.doesNotMatch(
        quizPage,
        /selectedAnswers|correctCount|scorePercentage/,
        "Interactive quiz scoring and state variables must be removed"
      )
    })

    it("1.3 pages/quiz/[id].tsx provides PDF preview modal triggers for question and solution sheets", () => {
      assert.match(
        quizPage,
        /setActiveModal\(\s*\{[\s\S]*open:\s*true[\s\S]*url:\s*quiz\.pdf_url/,
        "Must provide preview trigger for questions PDF"
      )
      assert.match(
        quizPage,
        /<PdfPreviewModal[^>]*open=\{activeModal\.open\}/,
        "Must mount PdfPreviewModal with open state"
      )
    })

    it("1.4 pages/quiz/[id].tsx provides direct download actions for offline study", () => {
      assert.match(
        quizPage,
        /handleDownloadFile\(\s*quiz\.pdf_url/,
        "Must provide download handler for question sheet"
      )
    })

    it("1.5 pages/quiz/[id].tsx provides student completion toggle with analytics tracking", () => {
      assert.match(
        quizPage,
        /handleTogglePdfCompleted/,
        "Must provide handleTogglePdfCompleted handler"
      )
      assert.match(
        quizPage,
        /trackQuizSubmit\(\{[\s\S]*quizId:\s*quiz\.id/,
        "Must record completion telemetry via trackQuizSubmit"
      )
    })

    it("1.6 pages/quiz/[id].tsx displays informative empty state when no PDFs are uploaded", () => {
      assert.match(
        quizPage,
        /pendingWorksheet/,
        "Must render empty state card when question PDF is not yet available"
      )
    })

    it("1.7 CurriculumManager.tsx has completely eliminated Question Explorer table", () => {
      const curriculumManager = readFile("components/admin/CurriculumManager.tsx")
      assert.doesNotMatch(
        curriculumManager,
        /Interactive Question Explorer|currentQuizQuestions|onOpenQuestionEditor/,
        "CurriculumManager must have zero residual Question Explorer code"
      )
    })

    it("1.8 AdminModals.tsx has completely eliminated the Question Editor Dialog", () => {
      const adminModals = readFile("components/admin/AdminModals.tsx")
      assert.doesNotMatch(
        adminModals,
        /editor === "question"|onSaveQuestion|questionForm/,
        "AdminModals must have zero residual Question Dialog code"
      )
    })

    it("1.9 media-action-card.tsx renders a single Download Archive button and mounts preview modals", () => {
      const mediaCard = readFile("components/ui/media-action-card.tsx")
      assert.match(
        mediaCard,
        /Download Archive/,
        "Must render prominent Download Archive button for archives"
      )
      assert.match(
        mediaCard,
        /<PdfPreviewModal/,
        "Must mount PdfPreviewModal for in-app document viewing"
      )
      assert.match(
        mediaCard,
        /<ImagePreviewModal/,
        "Must mount ImagePreviewModal for in-app image viewing"
      )
    })

    it("1.10 pdf-preview-modal.tsx correctly configures fullscreen view and suppresses default dialog close button", () => {
      const pdfModal = readFile("components/ui/pdf-preview-modal.tsx")
      assert.match(
        pdfModal,
        /<DialogContent[^>]*hideCloseButton/,
        "PdfPreviewModal must set hideCloseButton on DialogContent"
      )
      assert.match(
        pdfModal,
        /!fixed\s+!inset-0\s+!left-0\s+!top-0\s+!translate-x-0\s+!translate-y-0\s+!transform-none/,
        "PdfPreviewModal must override translate and position transforms to fill viewport edge-to-edge"
      )
      assert.match(
        pdfModal,
        /onEscapeKeyDown/,
        "PdfPreviewModal must handle Escape key to smoothly exit fullscreen"
      )
    })

    it("1.11 image-preview-modal.tsx correctly configures fullscreen view and suppresses default dialog close button", () => {
      const imgModal = readFile("components/ui/image-preview-modal.tsx")
      assert.match(
        imgModal,
        /<DialogContent[^>]*hideCloseButton/,
        "ImagePreviewModal must set hideCloseButton on DialogContent"
      )
      assert.match(
        imgModal,
        /!fixed\s+!inset-0\s+!left-0\s+!top-0\s+!translate-x-0\s+!translate-y-0\s+!transform-none/,
        "ImagePreviewModal must override translate and position transforms to fill viewport edge-to-edge"
      )
    })

    it("1.12 dialog.tsx supports hideCloseButton prop", () => {
      const dialog = readFile("components/ui/dialog.tsx")
      assert.match(
        dialog,
        /hideCloseButton\?: boolean/,
        "DialogContent prop types must define hideCloseButton optional boolean"
      )
      assert.match(
        dialog,
        /!hideCloseButton\s*&&\s*\(\s*<DialogPrimitive\.Close/,
        "DialogContent must conditionally render the close button based on hideCloseButton"
      )
    })
  })

  // ─── 2. LECTURE TAB DEEP-LINKING & CONTROLLED STATE ───────────────────────
  describe("2. Lecture Tab Deep-Linking & Controlled State", () => {
    const lecturePage = readFile("pages/lecture/[id].tsx")
    const coursePage = readFile("pages/course/[id].tsx")

    it("2.1 pages/lecture/[id].tsx defines VALID_TABS at module level", () => {
      assert.match(
        lecturePage,
        /const\s+VALID_TABS\s*=\s*\["summary",\s*"records",\s*"resources",\s*"quizzes",\s*"discussion"\]/,
        "Must declare VALID_TABS array supporting all tabs"
      )
    })

    it("2.2 pages/lecture/[id].tsx synchronizes activeTab with router.query.tab", () => {
      assert.match(
        lecturePage,
        /router\.query\.tab/,
        "Must read tab parameter from router.query"
      )
      assert.match(
        lecturePage,
        /setActiveTab\(tabQuery\)/,
        "Must set active tab when valid tab query is present in URL"
      )
    })

    it("2.3 pages/lecture/[id].tsx mounts Tabs in controlled mode with handleTabChange", () => {
      assert.match(
        lecturePage,
        /<Tabs\s+value=\{activeTab\}\s+onValueChange=\{handleTabChange\}/,
        "Tabs component must be controlled via activeTab state and handleTabChange handler"
      )
    })

    it("2.4 pages/lecture/[id].tsx includes educational descriptions for empty states", () => {
      assert.match(
        lecturePage,
        /noRecordsDesc/,
        "Must provide descriptive text for empty voice records"
      )
      assert.match(
        lecturePage,
        /noResourcesDesc/,
        "Must provide descriptive text for empty resources"
      )
      assert.match(
        lecturePage,
        /noQuizzesDesc/,
        "Must provide descriptive text for empty quizzes"
      )
    })

    it("2.5 pages/course/[id].tsx links lecture quiz directly to ?tab=quizzes", () => {
      assert.match(
        coursePage,
        /\/lecture\/\$\{quiz\.lecture_id\}\?tab=quizzes|\$\{getLectureUrl\([^)]*\)\}\?tab=quizzes/,
        "Lecture quiz button must deep-link to ?tab=quizzes on lecture page"
      )
    })
  })

  // ─── 3. ADMIN EMAIL HUB RESILIENCE ────────────────────────────────────────
  describe("3. Admin Email Hub API Resilience against Unapplied Migrations", () => {
    const emailLogsApi = readFile("pages/api/admin/emails/logs.ts")
    const emailTemplatesApi = readFile("pages/api/admin/emails/templates/index.ts")

    it("3.1 pages/api/admin/emails/logs.ts handles PGRST205/42P01 count errors gracefully", () => {
      assert.match(
        emailLogsApi,
        /countError\.code\s*===\s*['"]PGRST205['"]\s*\|\|\s*countError\.code\s*===\s*['"]42P01['"]\s*\|\|\s*countError\.message\?\.includes\(['"]email_logs['"]\)/,
        "Must detect missing table error on count query and avoid 500"
      )
    })

    it("3.2 pages/api/admin/emails/logs.ts returns HTTP 200 with empty array and tablePending indicator", () => {
      assert.match(
        emailLogsApi,
        /tablePending:\s*true/,
        "Response must return tablePending: true when table has not been created yet"
      )
    })

    it("3.3 pages/api/admin/emails/logs.ts handles PGRST205/42P01 data query errors gracefully", () => {
      assert.match(
        emailLogsApi,
        /logsError\.code\s*===\s*['"]PGRST205['"]\s*\|\|\s*logsError\.code\s*===\s*['"]42P01['"]\s*\|\|\s*logsError\.message\?\.includes\(['"]email_logs['"]\)/,
        "Must detect missing table error on logs select query and avoid 500"
      )
    })

    it("3.4 pages/api/admin/emails/templates/index.ts returns informative 503 if email_templates table is missing", () => {
      assert.match(
        emailTemplatesApi,
        /insertError\.code\s*===\s*['"]PGRST205['"]\s*\|\|\s*insertError\.code\s*===\s*['"]42P01['"]\s*\|\|\s*insertError\.message\?\.includes\(['"]email_templates['"]\)/,
        "Must detect missing email_templates table on template insertion and guide admin to run migration"
      )
    })
  })

  // ─── 4. ACCESSIBILITY & ARIA ATTRIBUTES ───────────────────────────────────
  describe("4. Accessibility & ARIA Attributes", () => {
    const coursePage = readFile("pages/course/[id].tsx")

    it("4.1 pages/course/[id].tsx Progress bar includes accessible aria-label and aria-valuenow", () => {
      assert.match(
        coursePage,
        /<Progress[\s\S]*aria-label=\{isAr\s*\?[\s\S]*aria-valuenow=\{progressPercent\}/,
        "Course Progress bar must have aria-label and aria-valuenow for screen readers"
      )
    })
  })
})
