import { useState, useEffect, useMemo, useCallback } from "react"
import {
  FiEdit3 as Edit3,
  FiTrash2 as Trash2,
  FiDownload as Download,
  FiPrinter as Printer,
  FiClock as Clock,
  FiSearch as Search,
  FiX as X,
  FiPlus as Plus,
  FiPlay as Play,
  FiCheck as Check,
  FiBookmark as Bookmark,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  formatTimestamp,
  createTimestampedNote,
  exportNotesToMarkdownFile,
  exportNotesToPrintablePdf,
  CLINICAL_TAGS_CONFIG,
  VALID_NOTE_TAGS,
} from "@/lib/notesExport"
import { supabase } from "@/lib/supabaseClient"
import type { ClinicalNoteTag, TimestampedClinicalNote } from "@/types"

interface InLectureNotesDrawerProps {
  isOpen: boolean
  onClose: () => void
  lectureId: string
  lectureTitle: string
  lectureOrder?: number
  courseId?: string | null
  courseTitle?: string
  currentVideoTime?: number
  onSeek?: (seconds: number) => void
  isAr?: boolean
  userName?: string
  userId?: string
}

export default function InLectureNotesDrawer({
  isOpen,
  onClose,
  lectureId,
  lectureTitle,
  lectureOrder = 1,
  courseId = null,
  courseTitle = "Clinical Pharmacology",
  currentVideoTime = 0,
  onSeek,
  isAr = false,
  userName = "Student",
  userId = "guest",
}: InLectureNotesDrawerProps) {
  const [notes, setNotes] = useState<TimestampedClinicalNote[]>([])
  const [selectedTag, setSelectedTag] = useState<ClinicalNoteTag>("pearl")
  const [noteText, setNoteText] = useState("")
  const [capturedSeconds, setCapturedSeconds] = useState<number>(0)
  const [manualTimeStr, setManualTimeStr] = useState("00:00")
  const [isManualTime, setIsManualTime] = useState(false)
  const [filterTag, setFilterTag] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [editTag, setEditTag] = useState<ClinicalNoteTag>("pearl")
  const [isSaving, setIsSaving] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "info"; text: string } | null>(null)

  const storageKey = `pharmacore_notes_${userId || "guest"}_${lectureId}`

  // Load notes from localStorage and Supabase on mount
  useEffect(() => {
    if (!lectureId) return

    // 1. LocalStorage load
    let localNotes: TimestampedClinicalNote[] = []
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        localNotes = JSON.parse(saved)
      }
    } catch {
      localNotes = []
    }

    setNotes(localNotes)

    // 2. Supabase load if authenticated
    if (supabase && userId && userId !== "guest") {
      void (async () => {
        try {
          const { data, error } = await supabase
            .from("user_lecture_notes")
            .select("*")
            .eq("user_id", userId)
            .eq("lecture_id", lectureId)
            .order("timestamp_seconds", { ascending: true })

          if (!error && data && data.length > 0) {
            const mappedNotes: TimestampedClinicalNote[] = data.map((d) => ({
              id: d.id,
              user_id: d.user_id,
              lecture_id: d.lecture_id,
              course_id: d.course_id,
              lecture_title: d.lecture_title || lectureTitle,
              timestamp_seconds: d.timestamp_seconds,
              timestamp_formatted: d.timestamp_formatted || formatTimestamp(d.timestamp_seconds),
              note_text: d.note_text,
              tag: (d.tag as ClinicalNoteTag) || "general",
              created_at: d.created_at,
              updated_at: d.updated_at,
            }))

            // Merge local and remote notes without duplicates
            const combinedMap = new Map<string, TimestampedClinicalNote>()
            localNotes.forEach((n) => combinedMap.set(n.id, n))
            mappedNotes.forEach((n) => combinedMap.set(n.id, n))
            const combined = Array.from(combinedMap.values())
            setNotes(combined)
            localStorage.setItem(storageKey, JSON.stringify(combined))
          }
        } catch {
          // Keep local notes
        }
      })()
    }
  }, [lectureId, storageKey, userId, lectureTitle])

  // Save notes to localStorage
  const saveNotesToStorage = useCallback(
    (updatedNotes: TimestampedClinicalNote[]) => {
      setNotes(updatedNotes)
      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedNotes))
      } catch (err) {
        console.error("Failed to save notes to localStorage:", err)
      }
    },
    [storageKey]
  )

  // Update captured time when drawer opens or current video time changes (unless manual override)
  useEffect(() => {
    if (!isManualTime) {
      const sec = Math.max(0, Math.floor(currentVideoTime || 0))
      setCapturedSeconds(sec)
      setManualTimeStr(formatTimestamp(sec))
    }
  }, [currentVideoTime, isManualTime, isOpen])

  // Capture current time button
  const handleCaptureCurrentTime = () => {
    // Check if window helper is available
    let latestSec = currentVideoTime
    if (typeof window !== "undefined") {
      const helperSec = (window as unknown as { pharmacoreGetCurrentTime?: () => number })
        .pharmacoreGetCurrentTime?.()
      if (typeof helperSec === "number" && !isNaN(helperSec)) {
        latestSec = helperSec
      }
    }
    const sec = Math.max(0, Math.floor(latestSec || 0))
    setCapturedSeconds(sec)
    setManualTimeStr(formatTimestamp(sec))
    setIsManualTime(false)
    showFeedback("info", isAr ? `تم التقاط توقيت الفيديو: ${formatTimestamp(sec)}` : `Captured video time: ${formatTimestamp(sec)}`)
  }

  const showFeedback = (type: "success" | "info", text: string) => {
    setFeedbackMsg({ type, text })
    setTimeout(() => setFeedbackMsg(null), 3000)
  }

  // Handle Add Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteText.trim()) return
    setIsSaving(true)

    const newNote = createTimestampedNote({
      userId,
      lectureId,
      courseId,
      lectureTitle,
      timestampSeconds: capturedSeconds,
      noteText: noteText.trim(),
      tag: selectedTag,
    })

    const updatedNotes = [...notes, newNote]
    saveNotesToStorage(updatedNotes)
    setNoteText("")
    setIsSaving(false)
    showFeedback(
      "success",
      isAr ? "تم حفظ الملاحظة السريرية بنجاح!" : "Clinical note saved successfully!"
    )

    // Sync to Supabase in background
    if (supabase && userId && userId !== "guest") {
      try {
        await supabase.from("user_lecture_notes").insert({
          id: newNote.id,
          user_id: newNote.user_id,
          lecture_id: newNote.lecture_id,
          course_id: newNote.course_id,
          lecture_title: newNote.lecture_title,
          timestamp_seconds: newNote.timestamp_seconds,
          timestamp_formatted: newNote.timestamp_formatted,
          note_text: newNote.note_text,
          tag: newNote.tag,
          created_at: newNote.created_at,
          updated_at: newNote.updated_at,
        })
      } catch {}
    }
  }

  // Handle Seek
  const handleSeek = (seconds: number) => {
    if (onSeek) {
      onSeek(seconds)
    } else if (typeof window !== "undefined") {
      // Global fallback seeking
      const seekHelper = (window as unknown as { pharmacoreSeekTo?: (s: number) => void })
        .pharmacoreSeekTo
      if (seekHelper) {
        seekHelper(seconds)
      } else {
        window.dispatchEvent(
          new CustomEvent("pharmacore-seek", { detail: { seconds } })
        )
      }
    }
    showFeedback(
      "info",
      isAr ? `الانتقال إلى التوقيت ${formatTimestamp(seconds)}` : `Seeking to ${formatTimestamp(seconds)}`
    )
  }

  // Handle Delete Note
  const handleDeleteNote = async (noteId: string) => {
    const updatedNotes = notes.filter((n) => n.id !== noteId)
    saveNotesToStorage(updatedNotes)
    showFeedback("info", isAr ? "تم حذف الملاحظة." : "Note deleted.")

    if (supabase && userId && userId !== "guest") {
      try {
        await supabase.from("user_lecture_notes").delete().eq("id", noteId)
      } catch {}
    }
  }

  // Handle Edit Note
  const startEditing = (note: TimestampedClinicalNote) => {
    setEditingNoteId(note.id)
    setEditText(note.note_text)
    setEditTag(note.tag)
  }

  const saveEdit = async (noteId: string) => {
    if (!editText.trim()) return
    const updatedNotes = notes.map((n) => {
      if (n.id === noteId) {
        return {
          ...n,
          note_text: editText.trim(),
          tag: editTag,
          updated_at: new Date().toISOString(),
        }
      }
      return n
    })
    saveNotesToStorage(updatedNotes)
    setEditingNoteId(null)
    showFeedback("success", isAr ? "تم تعديل الملاحظة." : "Note updated.")

    if (supabase && userId && userId !== "guest") {
      try {
        await supabase
          .from("user_lecture_notes")
          .update({
            note_text: editText.trim(),
            tag: editTag,
            updated_at: new Date().toISOString(),
          })
          .eq("id", noteId)
      } catch {}
    }
  }

  // Handle Markdown Export
  const handleMarkdownExport = () => {
    exportNotesToMarkdownFile({
      courseTitle,
      lectureTitle,
      studentName: userName,
      notes,
    })
    showFeedback(
      "success",
      isAr ? "تم تنزيل ملف الملاحظات (Markdown) بنجاح." : "Markdown notes exported!"
    )
  }

  // Handle PDF Export
  const handlePdfExport = () => {
    exportNotesToPrintablePdf({
      courseTitle,
      lectureTitle,
      studentName: userName,
      lectureOrder,
      notes,
    })
  }

  // Filtered and sorted notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        const matchesTag = filterTag === "all" || n.tag === filterTag
        const matchesQuery =
          !searchQuery.trim() ||
          n.note_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.timestamp_formatted.includes(searchQuery)
        return matchesTag && matchesQuery
      })
      .sort((a, b) => (a.timestamp_seconds || 0) - (b.timestamp_seconds || 0))
  }, [notes, filterTag, searchQuery])

  if (!isOpen) return null

  const copy = isAr
    ? {
        drawerTitle: "الملاحظات واللآلئ السريرية الموقوتة",
        subtitle: "دوّن ملاحظاتك مرتبطة بلحظات الفيديو مع إمكانية القفز المباشر والتصدير",
        captureTime: "توقيت الفيديو الحالي",
        refreshTime: "تحديث اللحظة الحالية",
        tagLabel: "التصنيف السريري",
        notePlaceholder: "اكتب ملاحظتك الدوائية أو التنبيه السريري هنا...",
        addNoteBtn: "حفظ الملاحظة",
        saving: "جارٍ الحفظ...",
        savedNotes: "الملاحظات المحفوظة",
        noNotes: "لا توجد ملاحظات سريرية مدونة لهذه المحاضرة بعد.",
        exportMd: "تصدير Markdown (.md)",
        exportPdf: "طباعة / تصدير PDF",
        searchPlaceholder: "بحث في الملاحظات أو التوقيت...",
        allTags: "الكل",
        seekTip: "انقر على التوقيت للقفز بالفيديو فورًا",
        edit: "تعديل",
        delete: "حذف",
        save: "حفظ",
        cancel: "إلغاء",
      }
    : {
        drawerTitle: "Timestamped Clinical Notes",
        subtitle: "Capture timestamped pearls, warnings & exam notes with 1-click video seeking & instant exports",
        captureTime: "Current Video Time",
        refreshTime: "Sync with Player",
        tagLabel: "Clinical Domain Tag",
        notePlaceholder: "Record clinical pearls, drug interactions, contraindications, or exam high-yields...",
        addNoteBtn: "Save Clinical Note",
        saving: "Saving...",
        savedNotes: "Saved Notes",
        noNotes: "No timestamped notes recorded for this lecture yet.",
        exportMd: "Export Markdown (.md)",
        exportPdf: "Print / Export PDF",
        searchPlaceholder: "Search notes or MM:SS timestamp...",
        allTags: "All Tags",
        seekTip: "Click timestamp to jump video player directly",
        edit: "Edit",
        delete: "Delete",
        save: "Save",
        cancel: "Cancel",
      }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className={`fixed inset-y-0 ${
          isAr ? "left-0" : "right-0"
        } flex max-w-full sm:pl-10 w-full sm:max-w-xl z-50`}
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="w-full bg-card/95 backdrop-blur-2xl border-s border-border/80 shadow-2xl flex flex-col h-full text-foreground">
          {/* ─── DRAWER HEADER ────────────────────────────────────────────── */}
          <div className="p-5 border-b border-border/70 bg-muted/40 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="size-8 grid place-items-center rounded-xl bg-primary/10 text-primary">
                  <Bookmark className="size-4" />
                </div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                  {copy.drawerTitle}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lectureTitle}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full size-8 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Close notes drawer"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Feedback Banner */}
          {feedbackMsg && (
            <div
              className={`px-4 py-2 text-xs font-bold transition-all ${
                feedbackMsg.type === "success"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-b border-emerald-500/20"
                  : "bg-primary/15 text-primary border-b border-primary/20"
              }`}
            >
              {feedbackMsg.text}
            </div>
          )}

          {/* ─── DRAWER BODY (SCROLLABLE) ─────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Note Authoring Form */}
            <Card className="rounded-2xl border-border/80 bg-background/80 p-4 sm:p-5 shadow-xs space-y-4">
              <form onSubmit={handleAddNote} className="space-y-4">
                {/* Timestamp capture badge + sync */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">{copy.captureTime}:</span>
                    <Badge
                      variant="outline"
                      className="font-mono text-xs px-2.5 py-1 font-bold bg-primary/10 text-primary border-primary/30 flex items-center gap-1 cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => handleSeek(capturedSeconds)}
                      title={copy.seekTip}
                    >
                      <Play className="size-3 fill-primary" />
                      <span>{manualTimeStr}</span>
                    </Badge>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCaptureCurrentTime}
                    className="rounded-full text-[11px] h-7 px-2.5 font-bold gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Clock className="size-3" />
                    <span>{copy.refreshTime}</span>
                  </Button>
                </div>

                {/* Clinical Tag Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground">{copy.tagLabel}</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {VALID_NOTE_TAGS.map((tag) => {
                      const config = CLINICAL_TAGS_CONFIG[tag]
                      const isSelected = selectedTag === tag
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSelectedTag(tag)}
                          className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all border ${
                            isSelected
                              ? `${config.colorClasses} ring-2 ring-primary/40 shadow-xs scale-105`
                              : "bg-muted/50 border-border/60 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <span className="me-1">{config.icon}</span>
                          <span>{isAr ? config.label_ar : config.label_en}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Note Textarea */}
                <div className="space-y-1.5">
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder={copy.notePlaceholder}
                    rows={3}
                    className="rounded-xl text-xs leading-relaxed resize-none focus-visible:ring-primary/40"
                    required
                  />
                </div>

                {/* Add Note Button */}
                <Button
                  type="submit"
                  disabled={isSaving || !noteText.trim()}
                  size="sm"
                  className="w-full rounded-xl font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                >
                  <Plus className="size-4" />
                  <span>{isSaving ? copy.saving : copy.addNoteBtn}</span>
                </Button>
              </form>
            </Card>

            {/* Saved Notes Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-foreground">{copy.savedNotes}</h3>
                  <Badge variant="secondary" className="rounded-full text-[10px] font-bold px-2">
                    {notes.length}
                  </Badge>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkdownExport}
                    disabled={notes.length === 0}
                    className="rounded-full text-[11px] h-7 px-2.5 font-bold gap-1 hover:border-primary/50"
                    title={copy.exportMd}
                  >
                    <Download className="size-3" />
                    <span>MD</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePdfExport}
                    disabled={notes.length === 0}
                    className="rounded-full text-[11px] h-7 px-2.5 font-bold gap-1 hover:border-primary/50"
                    title={copy.exportPdf}
                  >
                    <Printer className="size-3" />
                    <span>PDF</span>
                  </Button>
                </div>
              </div>

              {/* Search & Tag Filter Bar */}
              {notes.length > 0 && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="size-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={copy.searchPlaceholder}
                      className="ps-8 rounded-xl h-8 text-xs bg-muted/30"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setFilterTag("all")}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                        filterTag === "all"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/40 border-border/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {copy.allTags}
                    </button>
                    {VALID_NOTE_TAGS.map((tag) => {
                      const config = CLINICAL_TAGS_CONFIG[tag]
                      const isSelected = filterTag === tag
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setFilterTag(tag)}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                            isSelected
                              ? `${config.colorClasses} border-primary`
                              : "bg-muted/40 border-border/50 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <span>{config.icon} {isAr ? config.label_ar : config.label_en}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Notes List */}
              <div className="space-y-3">
                {filteredNotes.length > 0 ? (
                  filteredNotes.map((note) => {
                    const config = CLINICAL_TAGS_CONFIG[note.tag] || CLINICAL_TAGS_CONFIG.general
                    const isEditing = editingNoteId === note.id

                    return (
                      <Card
                        key={note.id}
                        className="rounded-2xl border-border/70 bg-card/90 p-4 shadow-2xs hover:border-primary/40 transition-all space-y-2.5 group"
                      >
                        {/* Note Header: Timestamp pill + Tag badge + Actions */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleSeek(note.timestamp_seconds)}
                              className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1 shadow-2xs"
                              title={copy.seekTip}
                            >
                              <Play className="size-2.5 fill-current" />
                              <span>{note.timestamp_formatted}</span>
                            </button>

                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold px-2 py-0.5 border ${config.colorClasses}`}
                            >
                              <span className="me-1">{config.icon}</span>
                              <span>{isAr ? config.label_ar : config.label_en}</span>
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {!isEditing && (
                              <button
                                type="button"
                                onClick={() => startEditing(note)}
                                className="size-6 grid place-items-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title={copy.edit}
                              >
                                <Edit3 className="size-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              className="size-6 grid place-items-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title={copy.delete}
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        </div>

                        {/* Note Content / Inline Edit */}
                        {isEditing ? (
                          <div className="space-y-2 pt-1">
                            <div className="flex flex-wrap gap-1">
                              {VALID_NOTE_TAGS.map((t) => {
                                const c = CLINICAL_TAGS_CONFIG[t]
                                return (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => setEditTag(t)}
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                                      editTag === t ? c.colorClasses : "bg-muted/40 border-border/50 text-muted-foreground"
                                    }`}
                                  >
                                    {c.icon} {isAr ? c.label_ar : c.label_en}
                                  </button>
                                )
                              })}
                            </div>
                            <Textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={2}
                              className="rounded-xl text-xs"
                            />
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingNoteId(null)}
                                className="rounded-lg h-7 px-2 text-xs font-bold"
                              >
                                {copy.cancel}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => saveEdit(note.id)}
                                className="rounded-lg h-7 px-3 text-xs font-bold gap-1 bg-primary text-primary-foreground"
                              >
                                <Check className="size-3" />
                                <span>{copy.save}</span>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                            {note.note_text}
                          </p>
                        )}
                      </Card>
                    )
                  })
                ) : (
                  <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-border/70 bg-muted/20">
                    <Clock className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-xs text-muted-foreground font-semibold">
                      {notes.length === 0
                        ? copy.noNotes
                        : isAr
                        ? "لا توجد نتائج مطابقة للبحث أو التصفية."
                        : "No notes match your search or filter."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── DRAWER FOOTER ────────────────────────────────────────────── */}
          <div className="p-4 border-t border-border/70 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold">
              {isAr ? "PharmaCore المساعد الدراسي السريري" : "PharmaCore Clinical Study Suite"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkdownExport}
                disabled={notes.length === 0}
                className="rounded-full text-xs font-bold gap-1 h-8"
              >
                <Download className="size-3" />
                <span>{copy.exportMd}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
