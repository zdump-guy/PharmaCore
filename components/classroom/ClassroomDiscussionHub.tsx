import { useState, useEffect, useMemo, useCallback } from "react"
import {
  FiMessageSquare as MessageSquare,
  FiThumbsUp as ThumbsUp,
  FiShield as ShieldCheck,
  FiTag as TagIcon,
  FiPlus as Plus,
  FiFilter as Filter,
  FiSearch as Search,
  FiChevronDown as ChevronDown,
  FiChevronUp as ChevronUp,
  FiSend as Send,
  FiCheckCircle as CheckCircle2,
  FiAward as Award,
  FiZap as Zap,
  FiBookOpen as BookOpen,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  toggleDiscussionUpvote,
  validateDiscussionThreadPayload,
  VALID_DISCUSSION_CATEGORIES,
} from "@/lib/notesExport"
import { supabase } from "@/lib/supabaseClient"
import type {
  CourseDiscussionReply,
  CourseDiscussionThread,
  DiscussionCategory,
  UserRole,
} from "@/types"

interface ClassroomDiscussionHubProps {
  courseId: string
  courseTitle?: string
  lectureId?: string | null
  lectureTitle?: string | null
  currentUserId?: string
  currentUserName?: string
  currentUserRole?: UserRole
  currentUserUniversity?: string | null
  isAr?: boolean
}

export default function ClassroomDiscussionHub({
  courseId,
  courseTitle = "Clinical Pharmacology",
  lectureId = null,
  lectureTitle = null,
  currentUserId = "guest",
  currentUserName = "Student",
  currentUserRole = "student",
  currentUserUniversity = null,
  isAr = false,
}: ClassroomDiscussionHubProps) {
  const [threads, setThreads] = useState<CourseDiscussionThread[]>([])
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"upvotes" | "newest" | "replies">("upvotes")
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null)

  // New Thread Form state
  const [isCreatingThread, setIsCreatingThread] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [newCategory, setNewCategory] = useState<DiscussionCategory>("clinical_qa")
  const [newTagsStr, setNewTagsStr] = useState("")
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [formSuccess, setFormSuccess] = useState(false)

  // Reply Form state
  const [replyContent, setReplyContent] = useState<Record<string, string>>({})
  const [isReplying, setIsReplying] = useState(false)

  const isStaff =
    currentUserRole === "mentor" ||
    currentUserRole === "super_admin" ||
    currentUserRole === "dev"

  const storageKey = `pharmacore_classroom_discussions_${courseId || "default"}`

  // Load threads from localStorage & Supabase
  useEffect(() => {
    let localThreads: CourseDiscussionThread[] = []
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        localThreads = JSON.parse(saved)
      }
    } catch {
      localThreads = []
    }

    setThreads(localThreads)

    // Load from Supabase if connected
    if (supabase && courseId) {
      void (async () => {
        try {
          const { data: dbThreads, error } = await supabase
            .from("course_discussions")
            .select(`
              *,
              replies:course_discussion_replies(*)
            `)
            .eq("course_id", courseId)
            .order("created_at", { ascending: false })

          if (!error && dbThreads && dbThreads.length > 0) {
            const mapped: CourseDiscussionThread[] = dbThreads.map((t) => ({
              id: t.id,
              course_id: t.course_id,
              lecture_id: t.lecture_id,
              lecture_title: t.lecture_title,
              author_id: t.author_id,
              author_name: t.author_name,
              author_role: (t.author_role as UserRole) || "student",
              author_avatar: t.author_avatar,
              author_university: t.author_university,
              title: t.title,
              content: t.content,
              category: (t.category as DiscussionCategory) || "clinical_qa",
              tags: t.tags || [],
              upvotes_count: t.upvotes_count || 0,
              replies_count: t.replies?.length || t.replies_count || 0,
              has_faculty_solution: Boolean(
                t.has_faculty_solution || t.replies?.some((r: CourseDiscussionReply) => r.is_faculty_solution)
              ),
              is_pinned: Boolean(t.is_pinned),
              created_at: t.created_at,
              updated_at: t.updated_at,
              upvoted_user_ids: t.upvoted_user_ids || [],
              user_has_upvoted: t.upvoted_user_ids?.includes(currentUserId),
              replies: (t.replies || []).map((r: CourseDiscussionReply) => ({
                id: r.id,
                thread_id: r.thread_id,
                author_id: r.author_id,
                author_name: r.author_name,
                author_role: (r.author_role as UserRole) || "student",
                author_avatar: r.author_avatar,
                author_university: r.author_university,
                content: r.content,
                is_faculty_solution: Boolean(r.is_faculty_solution),
                is_faculty_verified: Boolean(r.is_faculty_verified || r.is_faculty_solution),
                verifier_title: r.verifier_title,
                upvotes_count: r.upvotes_count || 0,
                created_at: r.created_at,
              })),
            }))

            // Merge with local threads
            const threadMap = new Map<string, CourseDiscussionThread>()
            localThreads.forEach((th) => threadMap.set(th.id, th))
            mapped.forEach((th) => threadMap.set(th.id, th))
            const combined = Array.from(threadMap.values())
            setThreads(combined)
            localStorage.setItem(storageKey, JSON.stringify(combined))
          }
        } catch {
          // Use local fallback
        }
      })()
    }
  }, [courseId, currentUserId, storageKey])

  // Save threads to storage helper
  const persistThreads = useCallback(
    (updated: CourseDiscussionThread[]) => {
      setThreads(updated)
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated))
      } catch (err) {
        console.error("Failed to persist threads:", err)
      }
    },
    [storageKey]
  )

  // Handle Thread Upvote
  const handleToggleUpvote = async (threadId: string) => {
    const thread = threads.find((t) => t.id === threadId)
    if (!thread) return

    const result = toggleDiscussionUpvote({
      threadId,
      currentUpvotes: thread.upvotes_count,
      upvotedUserIds: thread.upvoted_user_ids || [],
      userId: currentUserId || "guest",
    })

    const updatedThreads = threads.map((t) => {
      if (t.id === threadId) {
        return {
          ...t,
          upvotes_count: result.upvotes,
          upvoted_user_ids: result.upvotedUserIds,
          user_has_upvoted: result.upvoted,
        }
      }
      return t
    })

    persistThreads(updatedThreads)

    if (supabase && currentUserId && currentUserId !== "guest") {
      try {
        await supabase
          .from("course_discussions")
          .update({ upvotes_count: result.upvotes })
          .eq("id", threadId)
      } catch {}
    }
  }

  // Handle Reply Upvote
  const handleToggleReplyUpvote = async (threadId: string, replyId: string) => {
    const updatedThreads = threads.map((th) => {
      if (th.id === threadId && th.replies) {
        const updatedReplies = th.replies.map((rep) => {
          if (rep.id === replyId) {
            const hasUpvoted = rep.user_has_upvoted
            const newCount = hasUpvoted
              ? Math.max(0, rep.upvotes_count - 1)
              : rep.upvotes_count + 1
            return {
              ...rep,
              upvotes_count: newCount,
              user_has_upvoted: !hasUpvoted,
            }
          }
          return rep
        })
        return { ...th, replies: updatedReplies }
      }
      return th
    })
    persistThreads(updatedThreads)
  }

  // Handle Faculty Endorsement Verification Toggle
  const handleToggleFacultyVerification = async (threadId: string, replyId: string) => {
    if (!isStaff) return

    const updatedThreads = threads.map((th) => {
      if (th.id === threadId && th.replies) {
        const updatedReplies = th.replies.map((rep) => {
          if (rep.id === replyId) {
            const nextStatus = !rep.is_faculty_solution
            return {
              ...rep,
              is_faculty_solution: nextStatus,
              is_faculty_verified: nextStatus,
              verifier_title: nextStatus ? "Verified Clinical Faculty" : undefined,
            }
          }
          return rep
        })

        const hasAnyFacultySolution = updatedReplies.some((r) => r.is_faculty_solution)
        return {
          ...th,
          has_faculty_solution: hasAnyFacultySolution,
          replies: updatedReplies,
        }
      }
      return th
    })

    persistThreads(updatedThreads)

    if (supabase) {
      try {
        const th = updatedThreads.find((t) => t.id === threadId)
        const rep = th?.replies?.find((r) => r.id === replyId)
        if (rep) {
          await supabase
            .from("course_discussion_replies")
            .update({
              is_faculty_solution: rep.is_faculty_solution,
            })
            .eq("id", replyId)
        }
      } catch {}
    }
  }

  // Handle Create New Thread
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors([])
    setFormSuccess(false)

    const payload = {
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      course_id: courseId,
      author_id: currentUserId,
    }

    const validation = validateDiscussionThreadPayload(payload)
    if (!validation.valid) {
      setFormErrors(validation.errors)
      return
    }

    const parsedTags = newTagsStr
      .split(/[,،]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    const newThread: CourseDiscussionThread = {
      id: `thread-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      course_id: courseId,
      lecture_id: lectureId,
      lecture_title: lectureTitle,
      author_id: currentUserId,
      author_name: currentUserName,
      author_role: currentUserRole,
      author_university: currentUserUniversity,
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      tags: parsedTags.length ? parsedTags : [newCategory],
      upvotes_count: 1,
      replies_count: 0,
      has_faculty_solution: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
      upvoted_user_ids: [currentUserId],
      user_has_upvoted: true,
      replies: [],
    }

    const updated = [newThread, ...threads]
    persistThreads(updated)

    setNewTitle("")
    setNewContent("")
    setNewTagsStr("")
    setFormSuccess(true)
    setIsCreatingThread(false)
    setExpandedThreadId(newThread.id)

    // Save to Supabase
    if (supabase && currentUserId && currentUserId !== "guest") {
      try {
        await supabase.from("course_discussions").insert({
          id: newThread.id,
          course_id: newThread.course_id,
          lecture_id: newThread.lecture_id,
          author_id: newThread.author_id,
          author_name: newThread.author_name,
          author_role: newThread.author_role,
          title: newThread.title,
          content: newThread.content,
          category: newThread.category,
          tags: newThread.tags,
          upvotes_count: newThread.upvotes_count,
          replies_count: 0,
          has_faculty_solution: false,
          is_pinned: false,
          created_at: newThread.created_at,
        })
      } catch {}
    }
  }

  // Handle Post Reply
  const handleAddReply = async (threadId: string) => {
    const text = (replyContent[threadId] || "").trim()
    if (!text || text.length < 3) return
    setIsReplying(true)

    const newReply: CourseDiscussionReply = {
      id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      thread_id: threadId,
      author_id: currentUserId,
      author_name: currentUserName,
      author_role: currentUserRole,
      author_university: currentUserUniversity,
      content: text,
      is_faculty_solution: isStaff,
      is_faculty_verified: isStaff,
      verifier_title: isStaff ? "Clinical Faculty Response" : undefined,
      upvotes_count: 0,
      created_at: new Date().toISOString(),
      user_has_upvoted: false,
    }

    const updatedThreads = threads.map((th) => {
      if (th.id === threadId) {
        const existingReplies = th.replies || []
        const nextReplies = [...existingReplies, newReply]
        return {
          ...th,
          replies_count: nextReplies.length,
          has_faculty_solution: th.has_faculty_solution || isStaff,
          replies: nextReplies,
        }
      }
      return th
    })

    persistThreads(updatedThreads)
    setReplyContent((prev) => ({ ...prev, [threadId]: "" }))
    setIsReplying(false)

    // Sync to Supabase
    if (supabase && currentUserId && currentUserId !== "guest") {
      try {
        await supabase.from("course_discussion_replies").insert({
          id: newReply.id,
          thread_id: newReply.thread_id,
          author_id: newReply.author_id,
          author_name: newReply.author_name,
          author_role: newReply.author_role,
          content: newReply.content,
          is_faculty_solution: newReply.is_faculty_solution,
          created_at: newReply.created_at,
        })
      } catch {}
    }
  }

  // Filtered & Sorted Threads
  const filteredThreads = useMemo(() => {
    return threads
      .filter((th) => {
        const matchesCategory =
          activeCategory === "all" || th.category === activeCategory
        const matchesQuery =
          !searchQuery.trim() ||
          th.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          th.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          th.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
          th.author_name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesQuery
      })
      .sort((a, b) => {
        // Pinned threads always on top
        if (a.is_pinned !== b.is_pinned) {
          return a.is_pinned ? -1 : 1
        }
        if (sortBy === "upvotes") {
          return (b.upvotes_count || 0) - (a.upvotes_count || 0)
        }
        if (sortBy === "newest") {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        if (sortBy === "replies") {
          return (b.replies_count || 0) - (a.replies_count || 0)
        }
        return 0
      })
  }, [threads, activeCategory, searchQuery, sortBy])

  const copy = isAr
    ? {
        hubTitle: "ساحة النقاشات السريرية وحفظ الأدوية (Classroom Hub)",
        hubDesc: "مجتمع طلاب الصيدلة للأسئلة العلاجية، حفظ الأدوية بالاستذكار الصوري (Mnemonics)، وحلول هيئة التدريس المعتمدة",
        newThreadBtn: "طرح سؤال / مشاركة استذكار",
        cancel: "إلغاء",
        publish: "نشر الموضوع",
        categories: {
          all: "كافة الموضوعات",
          clinical_qa: "حالات واستفسارات سريرية",
          mnemonics: "استذكار دوائي (Mnemonics)",
          faculty_solutions: "حلول هيئة التدريس المعتمدة",
          general: "مجموعات المذاكرة والترخيص",
        },
        sortLabels: {
          upvotes: "الأعلى تصويتًا",
          newest: "الأحدث",
          replies: "الأكثر نقاشًا",
        },
        searchPlaceholder: "بحث في الأسئلة، الاستذكارات، الأدوية، أو الوسوم...",
        verifiedBadge: "حل سريري معتمد من هيئة التدريس",
        markFacultySolution: "اعتماد كحل سريري موثق",
        unmarkFacultySolution: "إلغاء الاعتماد",
        replyPlaceholder: "أضف مشاركتك أو تعقيبك السريري...",
        postReply: "إرسال الرد",
        replies: "الردود والنقاشات",
        noThreads: "لا توجد مناقشات بعد - كن أول من يطرح سؤالاً سريرياً",
        noThreadsDesc: "كن أول من يطرح استفساراً دوائياً، أو يشارك وسيلة تذكر سريرية، أو يناقش تفاصيل الحالات مع زملائك وهيئة التدريس.",
        askFirstQuestion: "طرح أول سؤال سريري",
        pinned: "مثبت بأمر الإشراف",
        facultyAuthor: "مشرف سريري / عضو هيئة تدريس",
      }
    : {
        hubTitle: "Classroom Clinical Discussion & Mnemonics Hub",
        hubDesc: "Peer clinical Q&A, pharmacology memory aids (mnemonics), and verified faculty solutions",
        newThreadBtn: "New Clinical Question / Mnemonic",
        cancel: "Cancel",
        publish: "Publish Thread",
        categories: {
          all: "All Categories",
          clinical_qa: "Clinical Cases & Drug Therapy",
          mnemonics: "Mnemonics & Memory Aids",
          faculty_solutions: "Verified Faculty Solutions",
          general: "Study Cohorts & Licensure Prep",
        },
        sortLabels: {
          upvotes: "Most Upvoted",
          newest: "Newest",
          replies: "Most Replies",
        },
        searchPlaceholder: "Search topics, drugs, mnemonics, or clinical tags...",
        verifiedBadge: "Verified Faculty Clinical Solution",
        markFacultySolution: "Verify as Faculty Solution",
        unmarkFacultySolution: "Remove Faculty Verification",
        replyPlaceholder: "Write your clinical rationale or peer response...",
        postReply: "Post Reply",
        replies: "Discussion Replies",
        noThreads: "No discussions yet — be the first to ask a clinical question",
        noThreadsDesc: "Be the first to ask a clinical pharmacology question, share a high-yield memory aid mnemonic, or discuss therapeutic nuances with peers and faculty.",
        askFirstQuestion: "Start New Discussion",
        pinned: "Pinned Topic",
        facultyAuthor: "Clinical Faculty / Mentor",
      }

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* ─── HUB HEADER & BANNER ────────────────────────────────────────── */}
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/80 to-accent/10 p-6 sm:p-8 backdrop-blur-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5 bg-primary/15 text-primary font-bold px-2.5 py-1 text-xs">
                <Zap className="size-3.5" />
                <span>{courseTitle}</span>
              </Badge>
              <Badge variant="secondary" className="gap-1 font-bold text-xs">
                <BookOpen className="size-3" />
                <span>{threads.length} {isAr ? "موضوع" : "Threads"}</span>
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {copy.hubTitle}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {copy.hubDesc}
            </p>
          </div>

          <Button
            onClick={() => setIsCreatingThread(!isCreatingThread)}
            className="rounded-full font-bold gap-2 px-6 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 self-start md:self-center"
          >
            <Plus className="size-4" />
            <span>{isCreatingThread ? copy.cancel : copy.newThreadBtn}</span>
          </Button>
        </div>
      </div>

      {/* ─── NEW THREAD AUTHORING ACCORDION ──────────────────────────────── */}
      {isCreatingThread && (
        <Card className="rounded-3xl border-primary/40 bg-card/95 backdrop-blur-xl p-6 sm:p-8 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleCreateThread} className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-5 text-primary" />
                <h3 className="font-black text-foreground text-base sm:text-lg">
                  {isAr ? "إنشاء موضوع جديد" : "Create New Discussion Thread"}
                </h3>
              </div>
              <Badge variant="outline" className="text-[11px] font-bold">
                {currentUserName} ({currentUserRole})
              </Badge>
            </div>

            {formErrors.length > 0 && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertDescription className="text-xs font-bold space-y-1">
                  {formErrors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            {formSuccess && (
              <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 rounded-2xl">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <AlertDescription className="text-xs font-bold">
                  {isAr ? "تم نشر الموضوع بنجاح!" : "Thread published successfully!"}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{isAr ? "عنوان الموضوع" : "Thread Title"}</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={
                  isAr
                    ? "مثال: استذكار تصنيف أدوية الضغط أو استفسار حول جرعات الفانكوميسين..."
                    : "e.g. High-Yield Mnemonic for Antiarrhythmics or Warfarin DDI Case..."
                }
                required
                className="rounded-xl h-11 text-xs"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{isAr ? "القسم" : "Category"}</Label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as DiscussionCategory)}
                  className="w-full h-11 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="clinical_qa">{copy.categories.clinical_qa}</option>
                  <option value="mnemonics">{copy.categories.mnemonics}</option>
                  <option value="faculty_solutions">{copy.categories.faculty_solutions}</option>
                  <option value="general">{copy.categories.general}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  {isAr ? "الوسوم السريرية (مفصولة بفواصل)" : "Clinical Tags (comma separated)"}
                </Label>
                <Input
                  value={newTagsStr}
                  onChange={(e) => setNewTagsStr(e.target.value)}
                  placeholder={isAr ? "قلب، ضغط، كلى، CYP450" : "Cardio, BetaBlockers, DDI, Renal"}
                  className="rounded-xl h-11 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{isAr ? "محتوى الموضوع والتفاصيل السريرية" : "Detailed Content & Clinical Rationale"}</Label>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={5}
                placeholder={
                  isAr
                    ? "اشرح الحالة السريرية أو طريقة الاستذكار بوضوح لدعم زملائك..."
                    : "Elaborate on the clinical case, pharmacological mechanism, or mnemonic analogy..."
                }
                required
                className="rounded-xl text-xs leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreatingThread(false)}
                className="rounded-full px-5 text-xs font-bold"
              >
                {copy.cancel}
              </Button>
              <Button
                type="submit"
                className="rounded-full px-7 font-bold gap-2 bg-primary text-primary-foreground shadow-sm"
              >
                <Send className="size-3.5" />
                <span>{copy.publish}</span>
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ─── FILTERS & SEARCH CONTROLS ───────────────────────────────────── */}
      <div className="space-y-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all border ${
              activeCategory === "all"
                ? "bg-primary text-primary-foreground border-primary shadow-xs scale-105"
                : "bg-card/90 border-border/70 text-muted-foreground hover:bg-muted"
            }`}
          >
            {copy.categories.all}
          </button>
          {VALID_DISCUSSION_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs scale-105"
                    : "bg-card/90 border-border/70 text-muted-foreground hover:bg-muted"
                }`}
              >
                {copy.categories[cat]}
              </button>
            )
          })}
        </div>

        {/* Search & Sort Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:max-w-md">
            <Search className="size-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={copy.searchPlaceholder}
              className="ps-10 rounded-2xl h-10 text-xs bg-card/80 border-border/80"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Filter className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground">{isAr ? "الترتيب:" : "Sort:"}</span>
            <div className="flex rounded-xl bg-muted/60 p-1 border border-border/60">
              <button
                type="button"
                onClick={() => setSortBy("upvotes")}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  sortBy === "upvotes" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                {copy.sortLabels.upvotes}
              </button>
              <button
                type="button"
                onClick={() => setSortBy("newest")}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  sortBy === "newest" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                {copy.sortLabels.newest}
              </button>
              <button
                type="button"
                onClick={() => setSortBy("replies")}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  sortBy === "replies" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                {copy.sortLabels.replies}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── THREADS ROSTER ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        {filteredThreads.length > 0 ? (
          filteredThreads.map((thread) => {
            const isExpanded = expandedThreadId === thread.id
            const replies = thread.replies || []
            const sortedReplies = [...replies].sort((a, b) => {
              if (a.is_faculty_solution !== b.is_faculty_solution) {
                return a.is_faculty_solution ? -1 : 1
              }
              return (b.upvotes_count || 0) - (a.upvotes_count || 0)
            })

            const isAuthorStaff =
              thread.author_role === "mentor" ||
              thread.author_role === "super_admin" ||
              thread.author_role === "dev"

            return (
              <Card
                key={thread.id}
                className={`rounded-3xl border transition-all overflow-hidden ${
                  thread.is_pinned
                    ? "border-amber-500/40 bg-card/95 shadow-sm ring-1 ring-amber-500/20"
                    : "border-border/80 bg-card/90 hover:border-primary/40 shadow-xs"
                }`}
              >
                <CardContent className="p-5 sm:p-7 space-y-4">
                  {/* Thread Header: Tags, Pinned badge, Faculty verification badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {thread.is_pinned && (
                        <Badge variant="warning" className="gap-1 text-[10px] font-bold px-2.5 py-0.5">
                          <Award className="size-3" />
                          <span>{copy.pinned}</span>
                        </Badge>
                      )}

                      <Badge variant="secondary" className="text-[10px] font-bold px-2.5 py-0.5">
                        {copy.categories[thread.category]}
                      </Badge>

                      {thread.has_faculty_solution && (
                        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 gap-1 text-[10px] font-bold px-2.5 py-0.5">
                          <ShieldCheck className="size-3" />
                          <span>{copy.verifiedBadge}</span>
                        </Badge>
                      )}
                    </div>

                    {thread.lecture_title && (
                      <span className="text-[10px] text-muted-foreground font-semibold truncate max-w-xs">
                        📍 {thread.lecture_title}
                      </span>
                    )}
                  </div>

                  {/* Title & Author Meta */}
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-black text-foreground leading-snug">
                      {thread.title}
                    </h3>

                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap">
                      <Avatar className="size-6">
                        <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                          {thread.author_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-foreground">{thread.author_name}</span>
                      {isAuthorStaff && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-bold text-primary border-primary/30">
                          {copy.facultyAuthor}
                        </Badge>
                      )}
                      {thread.author_university && (
                        <span className="text-[11px] text-muted-foreground/80 truncate max-w-xs">
                          • {thread.author_university}
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        • {new Date(thread.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                    {thread.content}
                  </p>

                  {/* Clinical Tags */}
                  {thread.tags && thread.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {thread.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-lg bg-muted/60 border border-border/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                        >
                          <TagIcon className="size-2.5" />
                          <span>{t}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer Controls: Upvote, Replies Toggle */}
                  <div className="flex items-center justify-between border-t border-border/60 pt-3 gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleUpvote(thread.id)}
                        className={`rounded-full h-8 px-3 text-xs font-bold gap-1.5 transition-all ${
                          thread.user_has_upvoted
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "hover:border-primary/50 text-foreground"
                        }`}
                      >
                        <ThumbsUp className={`size-3.5 ${thread.user_has_upvoted ? "fill-current" : ""}`} />
                        <span>{thread.upvotes_count || 0}</span>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedThreadId(isExpanded ? null : thread.id)}
                        className="rounded-full h-8 px-3 text-xs font-bold gap-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <MessageSquare className="size-3.5" />
                        <span>{replies.length} {copy.replies}</span>
                        {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedThreadId(isExpanded ? null : thread.id)}
                      className="text-xs font-bold text-primary hover:text-primary/90"
                    >
                      {isExpanded ? (isAr ? "إخفاء الردود" : "Collapse") : (isAr ? "عرض الردود والمشاركة" : "Join Discussion")}
                    </Button>
                  </div>

                  {/* ─── EXPANDED REPLIES & REASONING SECTION ──────────────── */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border/70 space-y-4 animate-in fade-in duration-200">
                      <h4 className="text-xs font-black text-foreground uppercase tracking-wider">
                        {copy.replies} ({replies.length})
                      </h4>

                      {/* Replies List */}
                      <div className="space-y-3">
                        {sortedReplies.length > 0 ? (
                          sortedReplies.map((reply) => (
                            <div
                              key={reply.id}
                              className={`rounded-2xl p-4 space-y-2.5 transition-all ${
                                reply.is_faculty_solution
                                  ? "border border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20"
                                  : "border border-border/60 bg-muted/30"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <Avatar className="size-6">
                                    <AvatarFallback className="text-[10px] font-bold bg-primary/15 text-primary">
                                      {reply.author_name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-bold text-foreground">{reply.author_name}</span>
                                  {reply.author_role && reply.author_role !== "student" && (
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-bold text-primary border-primary/30">
                                      {reply.author_role}
                                    </Badge>
                                  )}
                                  {reply.author_university && (
                                    <span className="text-[10px] text-muted-foreground truncate max-w-xs">
                                      • {reply.author_university}
                                    </span>
                                  )}
                                </div>

                                {reply.is_faculty_solution && (
                                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 gap-1 text-[10px] font-bold">
                                    <ShieldCheck className="size-3" />
                                    <span>{reply.verifier_title || copy.verifiedBadge}</span>
                                  </Badge>
                                )}
                              </div>

                              <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                                {reply.content}
                              </p>

                              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                                <span>{new Date(reply.created_at).toLocaleDateString()}</span>

                                <div className="flex items-center gap-2">
                                  {isStaff && (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleFacultyVerification(thread.id, reply.id)}
                                      className={`text-[10px] font-bold flex items-center gap-1 transition-colors ${
                                        reply.is_faculty_solution
                                          ? "text-amber-600 hover:text-amber-700"
                                          : "text-muted-foreground hover:text-amber-500"
                                      }`}
                                    >
                                      <ShieldCheck className="size-3" />
                                      <span>
                                        {reply.is_faculty_solution
                                          ? copy.unmarkFacultySolution
                                          : copy.markFacultySolution}
                                      </span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleToggleReplyUpvote(thread.id, reply.id)}
                                    className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded-md transition-colors ${
                                      reply.user_has_upvoted
                                        ? "bg-primary/20 text-primary"
                                        : "hover:bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    <ThumbsUp className="size-2.5" />
                                    <span>{reply.upvotes_count || 0}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-xs text-muted-foreground italic">
                            {isAr ? "لا توجد ردود بعد. كن أول من يشارك!" : "No replies yet. Be the first to share your thoughts!"}
                          </div>
                        )}
                      </div>

                      {/* Reply Authoring Input */}
                      <div className="space-y-2 pt-2">
                        <Textarea
                          value={replyContent[thread.id] || ""}
                          onChange={(e) =>
                            setReplyContent((prev) => ({
                              ...prev,
                              [thread.id]: e.target.value,
                            }))
                          }
                          rows={2}
                          placeholder={copy.replyPlaceholder}
                          className="rounded-2xl text-xs leading-relaxed"
                        />
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleAddReply(thread.id)}
                            disabled={isReplying || !(replyContent[thread.id] || "").trim()}
                            className="rounded-full px-5 text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-xs"
                          >
                            <Send className="size-3" />
                            <span>{copy.postReply}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card className="rounded-3xl p-10 sm:p-12 text-center border-2 border-dashed border-border/80 bg-card/60 backdrop-blur-xl max-w-xl mx-auto my-4 shadow-xs">
            <CardContent className="flex flex-col items-center justify-center space-y-4 p-0">
              <div className="size-14 grid place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <MessageSquare className="size-7" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">{copy.noThreads}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {copy.noThreadsDesc}
                </p>
              </div>
              <Button
                onClick={() => setIsCreatingThread(true)}
                className="rounded-full px-6 text-xs font-bold gap-2 bg-primary text-primary-foreground shadow-sm mt-2"
              >
                <Plus className="size-3.5" />
                <span>{copy.askFirstQuestion}</span>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
