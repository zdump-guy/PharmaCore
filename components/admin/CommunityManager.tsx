import { useState } from "react"
import {
  FiCheckCircle as CheckCircle2,
  FiClock as Clock,
  FiHelpCircle as HelpCircle,
  FiMessageCircle as MessageCircle,
  FiSearch as Search,
  FiSend as Send,
  FiShield as ShieldCheck,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CommunityQuestion, Lecture, UserProfile } from "@/types"

interface CommunityManagerProps {
  isAr: boolean
  searchQuery: string
  community: CommunityQuestion[]
  lectures: Lecture[]
  profile: UserProfile | null
  reply: Record<string, string>
  setReply: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onSendReply: (questionId: string) => void
}

export default function CommunityManager({
  isAr,
  searchQuery,
  community,
  lectures,
  reply,
  setReply,
  onSendReply,
}: CommunityManagerProps) {
  const [activeTab, setActiveTab] = useState<"unanswered" | "answered">("unanswered")
  const [localSearch, setLocalSearch] = useState("")

  const tr = (en: string, ar: string) => (isAr ? ar : en)
  const effectiveSearch = (searchQuery || localSearch).trim().toLowerCase()

  const getLectureName = (lectureId: string | null) => {
    const lecture = lectures.find((l) => l.id === lectureId)
    return lecture ? (isAr ? lecture.title_ar : lecture.title_en) : null
  }

  const unanswered = community.filter((q) => !q.answers?.length)
  const answered = community.filter((q) => !!q.answers?.length)

  const filterQuestions = (list: CommunityQuestion[]) => {
    if (!effectiveSearch) return list
    return list.filter(
      (q) =>
        q.author_name.toLowerCase().includes(effectiveSearch) ||
        q.text.toLowerCase().includes(effectiveSearch) ||
        (getLectureName(q.lecture_id) || "").toLowerCase().includes(effectiveSearch)
    )
  }

  const filteredUnanswered = filterQuestions(unanswered)
  const filteredAnswered = filterQuestions(answered)

  const renderQuestionCard = (question: CommunityQuestion) => {
    const isUnanswered = !question.answers?.length
    const lectureTitle = getLectureName(question.lecture_id)
    const replyText = reply[question.id] ?? ""

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (replyText.trim()) {
          onSendReply(question.id)
        }
      }
    }

    return (
      <Card
        key={question.id}
        className={`card-interactive shadow-none transition-all ${
          isUnanswered ? "border-amber-500/30 bg-amber-500/[0.02]" : ""
        }`}
      >
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Header */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid size-9 sm:size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                {question.author_name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="font-extrabold text-sm text-foreground truncate">{question.author_name}</p>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3 shrink-0" />
                  <span suppressHydrationWarning>
                    {new Date(question.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {lectureTitle && (
                    <>
                      <span>·</span>
                      <span className="font-medium truncate max-w-[160px] sm:max-w-[240px] text-foreground/80">
                        {lectureTitle}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Badge
              variant={isUnanswered ? "outline" : "secondary"}
              className={`badge-nowrap self-start text-xs font-semibold gap-1 shrink-0 ${
                isUnanswered ? "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10" : ""
              }`}
            >
              {isUnanswered ? (
                <>
                  <HelpCircle className="size-3 shrink-0" />
                  <span>{tr("Awaiting Answer", "بانتظار الإجابة")}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{tr("Answered", "تمت الإجابة")}</span>
                </>
              )}
            </Badge>
          </div>

          {/* Question Text */}
          <div className="rounded-xl bg-muted/30 p-3.5 sm:p-4">
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{question.text}</p>
          </div>

          {/* Previous Staff Answers */}
          {question.answers && question.answers.length > 0 && (
            <div className="space-y-2.5 ps-2.5 sm:ps-5 border-s-2 border-primary/40">
              {question.answers.map((ans) => (
                <div key={ans.id} className="rounded-xl bg-secondary/40 p-3 sm:p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-primary">
                      <ShieldCheck className="size-3.5" />
                      {tr("Staff Educator Answer", "إجابة المرشد / المشرف")}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(ans.created_at).toLocaleTimeString(isAr ? "ar-EG" : "en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">{ans.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Reply composer */}
          <div className="flex flex-col gap-2 sm:flex-row pt-1">
            <Input
              value={replyText}
              onChange={(e) => setReply((prev) => ({ ...prev, [question.id]: e.target.value }))}
              onKeyDown={handleKeyDown}
              placeholder={
                question.answers?.length
                  ? tr("Add a follow-up answer (Ctrl+Enter)...", "أضف ردًا توضيحيًا إضافيًا (Ctrl+Enter)...")
                  : tr("Write an educator response (Ctrl+Enter)...", "اكتب إجابة علمية واضحة للطالب (Ctrl+Enter)...")
              }
              className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]"
            />
            <Button
              size="sm"
              onClick={() => onSendReply(question.id)}
              disabled={!replyText.trim()}
              className="btn-nowrap gap-1.5 font-bold shrink-0 text-xs min-h-[40px] sm:min-h-[36px] w-full sm:w-auto"
            >
              <Send className="size-3.5 rtl:rotate-180 shrink-0" />
              <span>{tr("Send Answer", "إرسال الإجابة")}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* Header & Stats */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageCircle className="size-5 text-primary" />
            <h3 className="text-xl font-bold tracking-tight">{tr("Student Q&A Moderation", "إدارة أسئلة واستفسارات الطلاب")}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {tr(
              "Review student inquiries, answer lecture questions, and build community knowledge.",
              "متابعة استفسارات الطلاب، والرد على أسئلة المحاضرات لبناء مرجع علمي يستفيد منه الجميع."
            )}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-60">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder={tr("Search questions & students...", "بحث بالاسم أو نص السؤال...")}
            className="h-9 ps-8 pe-3 text-xs w-full"
          />
        </div>
      </div>

      {/* Tabs: Unanswered vs Answered */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)} className="space-y-4">
        <TabsList className="grid grid-cols-2 h-10 w-full sm:w-80 p-1 bg-muted/60">
          <TabsTrigger value="unanswered" className="badge-nowrap text-xs font-bold gap-2 min-h-[34px]">
            <span>{tr("Unanswered", "غير مجابة")}</span>
            <Badge
              variant={unanswered.length > 0 ? "destructive" : "secondary"}
              className="badge-nowrap h-4 px-1.5 text-[10px] shrink-0"
            >
              {unanswered.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="answered" className="badge-nowrap text-xs font-bold gap-2 min-h-[34px]">
            <span>{tr("Answered", "تمت الإجابة")}</span>
            <Badge variant="secondary" className="badge-nowrap h-4 px-1.5 text-[10px] shrink-0">
              {answered.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unanswered" className="space-y-4">
          {filteredUnanswered.map(renderQuestionCard)}

          {!filteredUnanswered.length && (
            <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              <div>
                <CheckCircle2 className="mx-auto size-8 text-emerald-500 opacity-80" />
                <p className="mt-2 font-bold text-sm text-foreground">
                  {tr("All caught up!", "تمت الإجابة عن جميع الأسئلة!")}
                </p>
                <p className="mt-1 text-xs">
                  {tr("There are no pending questions awaiting educator answers.", "لا توجد أسئلة معلقة بانتظار رد المرشد.")}
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="answered" className="space-y-4">
          {filteredAnswered.map(renderQuestionCard)}

          {!filteredAnswered.length && (
            <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              <div>
                <MessageCircle className="mx-auto size-8 opacity-40" />
                <p className="mt-2 font-bold text-sm">
                  {tr("No answered questions yet", "لا توجد أسئلة مجاب عنها بعد")}
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
