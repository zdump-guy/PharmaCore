/**
 * PharmaCore Clinical Notes & Classroom Discussion Engine
 * Provides timestamp formatting, clinical note authoring, Markdown/PDF exports, and discussion helpers.
 */

import type {
  ClinicalNoteTag,
  DiscussionCategory,
  TimestampedClinicalNote,
  UserRole,
} from "@/types"

export const VALID_DISCUSSION_CATEGORIES: DiscussionCategory[] = [
  "clinical_qa",
  "mnemonics",
  "faculty_solutions",
  "general",
]

export const VALID_NOTE_TAGS: ClinicalNoteTag[] = [
  "pearl",
  "warning",
  "exam",
  "mechanism",
  "general",
]

export interface ClinicalTagMetadata {
  tag: ClinicalNoteTag
  label_en: string
  label_ar: string
  badgeText: string
  icon: string
  colorClasses: string
  borderColor: string
  bgLight: string
}

export const CLINICAL_TAGS_CONFIG: Record<ClinicalNoteTag, ClinicalTagMetadata> = {
  pearl: {
    tag: "pearl",
    label_en: "Clinical Pearl",
    label_ar: "جوهرة سريرية",
    badgeText: "[Clinical Pearl]",
    icon: "PEARL",
    colorClasses: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    borderColor: "#10b981",
    bgLight: "#ecfdf5",
  },
  warning: {
    tag: "warning",
    label_en: "Contraindication / DDI",
    label_ar: "تحذير / تداخل دوائي",
    badgeText: "[Contraindication/Warning]",
    icon: "WARNING",
    colorClasses: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    borderColor: "#f59e0b",
    bgLight: "#fffbeb",
  },
  exam: {
    tag: "exam",
    label_en: "Exam High-Yield",
    label_ar: "تركيز اختباري عالي الأهمية",
    badgeText: "[High-Yield Exam Focus]",
    icon: "EXAM",
    colorClasses: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
    borderColor: "#06b6d4",
    bgLight: "#ecfeff",
  },
  mechanism: {
    tag: "mechanism",
    label_en: "Mechanism of Action",
    label_ar: "آلية العمل الدوائي",
    badgeText: "[Mechanism of Action]",
    icon: "MOA",
    colorClasses: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    borderColor: "#a855f7",
    bgLight: "#faf5ff",
  },
  general: {
    tag: "general",
    label_en: "Clinical Note",
    label_ar: "ملاحظة سريرية",
    badgeText: "[Clinical Note]",
    icon: "NOTE",
    colorClasses: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
    borderColor: "#71717a",
    bgLight: "#f4f4f5",
  },
}

/**
 * Converts total seconds into "MM:SS" or "HH:MM:SS" format.
 * Handles boundary conditions (null, NaN, negative numbers, multi-hour).
 */
export function formatTimestamp(totalSeconds: number | null | undefined): string {
  if (typeof totalSeconds !== "number" || isNaN(totalSeconds) || totalSeconds < 0) {
    return "00:00"
  }
  const s = Math.floor(totalSeconds)
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60

  const pad = (n: number) => String(n).padStart(2, "0")
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${pad(minutes)}:${pad(seconds)}`
}

/**
 * Alias for formatTimestamp (seconds to "MM:SS").
 */
export const secondsToMMSS = formatTimestamp

/**
 * Parses timestamp string "MM:SS" or "HH:MM:SS" back to total seconds.
 * Handles malformed strings, null, out-of-range formats.
 */
export function parseTimestampToSeconds(str: string | null | undefined): number {
  if (!str || typeof str !== "string") return 0
  const parts = str.trim().split(":").map((p) => parseInt(p, 10))
  if (parts.some((p) => isNaN(p))) return 0

  if (parts.length === 2) {
    const [minutes, seconds] = parts
    return Math.max(0, minutes * 60 + seconds)
  }
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    return Math.max(0, hours * 3600 + minutes * 60 + seconds)
  }
  return 0
}

/**
 * Alias for parseTimestampToSeconds.
 */
export const parseMMSSToSeconds = parseTimestampToSeconds

export interface CreateNoteParams {
  id?: string
  userId?: string
  lectureId: string
  courseId?: string | null
  lectureTitle?: string
  timestampSeconds?: number
  noteText: string
  tag?: string
}

/**
 * Creates and formats a timestamped clinical note object.
 */
export function createTimestampedNote({
  id = `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  userId = "guest",
  lectureId,
  courseId = null,
  lectureTitle = "Lecture",
  timestampSeconds = 0,
  noteText = "",
  tag = "general",
}: CreateNoteParams): TimestampedClinicalNote {
  const cleanTag: ClinicalNoteTag = VALID_NOTE_TAGS.includes(tag as ClinicalNoteTag)
    ? (tag as ClinicalNoteTag)
    : "general"
  const cleanSeconds = Math.max(0, Math.floor(timestampSeconds || 0))

  return {
    id,
    user_id: userId,
    lecture_id: lectureId,
    course_id: courseId,
    lecture_title: lectureTitle,
    timestamp_seconds: cleanSeconds,
    timestamp_formatted: formatTimestamp(cleanSeconds),
    note_text: noteText.trim(),
    tag: cleanTag,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export interface MarkdownExportParams {
  courseTitle?: string
  lectureTitle?: string
  studentName?: string
  notes?: TimestampedClinicalNote[]
}

/**
 * Generates structured Markdown text from an array of timestamped clinical notes.
 */
export function generateNotesMarkdown({
  courseTitle = "Clinical Pharmacology",
  lectureTitle = "Lecture Notes",
  studentName = "Student",
  notes = [],
}: MarkdownExportParams): string {
  const lines: string[] = [
    `# Clinical Study Notes — ${lectureTitle}`,
    `**Course**: ${courseTitle}`,
    `**Student**: ${studentName}`,
    `**Generated**: ${new Date().toISOString().split("T")[0]}`,
    `**Total Notes**: ${notes.length}`,
    "",
    "---",
    "",
  ]

  if (notes.length === 0) {
    lines.push("_No notes recorded for this lecture._")
    return lines.join("\n")
  }

  // Sort notes chronologically by timestamp
  const sorted = [...notes].sort((a, b) => (a.timestamp_seconds || 0) - (b.timestamp_seconds || 0))

  sorted.forEach((note, idx) => {
    const config = CLINICAL_TAGS_CONFIG[note.tag] || CLINICAL_TAGS_CONFIG.general
    const header = `${idx + 1}. **[${note.timestamp_formatted}]** ${config.badgeText}`
    lines.push(header)
    lines.push(`> ${note.note_text}`)
    lines.push("")
  })

  lines.push("---")
  lines.push("Generated with PharmaCore Clinical Study Suite")

  return lines.join("\n")
}

/**
 * Triggers instant browser download of a Markdown file containing the notes.
 */
export function exportNotesToMarkdownFile({
  courseTitle = "Clinical Pharmacology",
  lectureTitle = "Lecture Notes",
  studentName = "Student",
  notes = [],
  filename,
}: MarkdownExportParams & { filename?: string }): boolean {
  if (typeof window === "undefined") return false

  const markdownContent = generateNotesMarkdown({
    courseTitle,
    lectureTitle,
    studentName,
    notes,
  })

  const safeTitle = (lectureTitle || "Lecture")
    .replace(/[^a-zA-Z0-9_\-\u0600-\u06FF]/g, "_")
    .slice(0, 50)
  const targetFilename = filename || `${safeTitle}_Clinical_Notes.md`

  try {
    const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = targetFilename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
    return true
  } catch (err) {
    console.error("Failed to export Markdown file:", err)
    return false
  }
}

export interface PrintablePdfParams {
  courseTitle?: string
  lectureTitle?: string
  studentName?: string
  lectureOrder?: number
  notes?: TimestampedClinicalNote[]
}

/**
 * Renders and triggers a browser printable clinical note sheet formatted with PharmaCore branding.
 */
export function exportNotesToPrintablePdf({
  courseTitle = "Clinical Pharmacology",
  lectureTitle = "Lecture Notes",
  studentName = "Student",
  lectureOrder = 1,
  notes = [],
}: PrintablePdfParams): boolean {
  if (typeof window === "undefined") return false

  const sortedNotes = [...notes].sort((a, b) => (a.timestamp_seconds || 0) - (b.timestamp_seconds || 0))
  const formattedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const notesRowsHtml = sortedNotes.length
    ? sortedNotes
        .map((n, i) => {
          const config = CLINICAL_TAGS_CONFIG[n.tag] || CLINICAL_TAGS_CONFIG.general
          return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 14px; font-weight: 700; font-family: monospace; font-size: 13px; color: #0284c7; white-space: nowrap;">
              ▶ ${n.timestamp_formatted}
            </td>
            <td style="padding: 12px 14px; white-space: nowrap;">
              <span style="display: inline-block; padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: ${config.bgLight}; color: ${config.borderColor}; border: 1px solid ${config.borderColor}40;">
                ${config.icon} ${config.label_en}
              </span>
            </td>
            <td style="padding: 12px 14px; font-size: 13px; line-height: 1.6; color: #1e293b;">
              ${escapeHtml(n.note_text)}
            </td>
          </tr>
        `
        })
        .join("")
    : `
      <tr>
        <td colspan="3" style="padding: 32px; text-align: center; color: #64748b; font-style: italic;">
          No clinical notes recorded for this lecture.
        </td>
      </tr>
    `

  const printHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(lectureTitle)} — PharmaCore Clinical Notes</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm 15mm 15mm 15mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 24px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #0f766e;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .brand-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: linear-gradient(135deg, #0f766e, #06b6d4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 900;
          font-size: 18px;
        }
        .brand-title {
          font-size: 20px;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
        }
        .brand-tagline {
          font-size: 11px;
          color: #64748b;
          margin: 0;
        }
        .meta-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .meta-item {
          font-size: 12px;
        }
        .meta-label {
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.5px;
        }
        .meta-value {
          font-weight: 600;
          color: #0f172a;
          margin-top: 2px;
          font-size: 13px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }
        th {
          background-color: #f1f5f9;
          text-align: left;
          padding: 10px 14px;
          font-size: 11px;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #cbd5e1;
        }
        .footer {
          margin-top: 32px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">
          <div class="brand-icon">⚕</div>
          <div>
            <h1 class="brand-title">PharmaCore</h1>
            <p class="brand-tagline">Clinical Pharmacology & Therapeutics Suite</p>
          </div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #64748b;">
          <strong>Clinical Study Sheet</strong><br />
          ${escapeHtml(formattedDate)}
        </div>
      </div>

      <div class="meta-box">
        <div class="meta-item">
          <div class="meta-label">Course</div>
          <div class="meta-value">${escapeHtml(courseTitle)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Lecture</div>
          <div class="meta-value">#${lectureOrder} — ${escapeHtml(lectureTitle)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Student</div>
          <div class="meta-value">${escapeHtml(studentName)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Total Notes Captured</div>
          <div class="meta-value">${sortedNotes.length} timestamped entries</div>
        </div>
      </div>

      <h2 style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">
        Timestamped Clinical Observations & Pearls
      </h2>

      <table>
        <thead>
          <tr>
            <th style="width: 90px;">Time</th>
            <th style="width: 170px;">Clinical Domain</th>
            <th>Observation / High-Yield Pearl</th>
          </tr>
        </thead>
        <tbody>
          ${notesRowsHtml}
        </tbody>
      </table>

      <div class="footer">
        <span>PharmaCore Interactive Clinical Learning Environment</span>
        <span>Confidential & Academic Study Material</span>
      </div>

      <script>
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
          }, 300);
        });
      </script>
    </body>
    </html>
  `

  const printWindow = window.open("", "_blank", "width=860,height=920")
  if (!printWindow) {
    alert("Please allow popups to print/export your clinical notes.")
    return false
  }

  printWindow.document.open()
  printWindow.document.write(printHtml)
  printWindow.document.close()
  return true
}

function escapeHtml(str: string): string {
  if (!str) return ""
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

/**
 * Toggle discussion upvote state for an individual user.
 */
export function toggleDiscussionUpvote({
  threadId: _threadId,
  currentUpvotes = 0,
  upvotedUserIds = [],
  userId,
}: {
  threadId: string
  currentUpvotes?: number
  upvotedUserIds?: string[]
  userId?: string | null
}) {
  if (!userId) {
    return { upvotes: currentUpvotes, upvoted: false, upvotedUserIds }
  }

  const alreadyUpvoted = upvotedUserIds.includes(userId)
  let newUpvotes = currentUpvotes
  let newUpvotedUserIds = [...upvotedUserIds]

  if (alreadyUpvoted) {
    newUpvotes = Math.max(0, currentUpvotes - 1)
    newUpvotedUserIds = newUpvotedUserIds.filter((id) => id !== userId)
  } else {
    newUpvotes = currentUpvotes + 1
    newUpvotedUserIds.push(userId)
  }

  return {
    upvotes: newUpvotes,
    upvoted: !alreadyUpvoted,
    upvotedUserIds: newUpvotedUserIds,
  }
}

/**
 * Validates discussion thread creation payloads.
 */
export function validateDiscussionThreadPayload(payload: {
  title?: string
  content?: string
  category?: string
  course_id?: string
  author_id?: string
}) {
  const errors: string[] = []
  if (!payload || typeof payload !== "object") {
    return { valid: false, errors: ["Payload must be an object"] }
  }

  if (!payload.title || typeof payload.title !== "string" || payload.title.trim().length < 5) {
    errors.push("Title must be at least 5 characters")
  }

  if (!payload.content || typeof payload.content !== "string" || payload.content.trim().length < 10) {
    errors.push("Content must be at least 10 characters")
  }

  if (
    payload.category &&
    !VALID_DISCUSSION_CATEGORIES.includes(payload.category as DiscussionCategory)
  ) {
    errors.push(`Category must be one of: ${VALID_DISCUSSION_CATEGORIES.join(", ")}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
