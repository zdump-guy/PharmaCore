import { useState } from "react"
import {
  FiCheckCircle as CheckCircle2,
  FiClock as Clock,
  FiHelpCircle as HelpCircle,
  FiMessageCircle as MessageCircle,
  FiSearch as Search,
  FiSend as Send,
  FiShield as ShieldCheck,
  FiX as X,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
        className={`rounded-3xl border transition-all shadow-xs overflow-hidden ${
          isUnanswered ? "border-amber-500/40 bg-amber-500/[0.03] shadow-amber-500/5" : "border-border/80 bg-card/90"
        }`}
      >
        <CardContent className="p-5 sm:p-6 space-y-4">
          {/* Header */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="size-10 ring-2 ring-primary/20 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-black text-sm uppercase">
                  {question.author_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="font-black text-sm text-foreground truncate">{question.author_name}</p>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3 shrink-0" />
                  <span>
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
                      <span className="font-semibold truncate max-w-[180px] sm:max-w-[280px] text-foreground/80">
                        {lectureTitle}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Badge
              variant={isUnanswered ? "warning" : "success"}
              className="text-xs font-bold gap-1 shrink-0 self-start"
            >
              {isUnanswered ? (
                <>
                  <HelpCircle className="size-3 shrink-0" />
                  <span>{tr("Awaiting Answer", "بانتظار الإجابة")}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3 shrink-0" />
                  <span>{tr("Answered", "تمت الإجابة")}</span>
                </>
              )}
            </Badge>
          </div>

          {/* Question Text */}
          <div className="rounded-2xl bg-muted/40 p-4 border border-border/50">
            <p className="text-xs sm:text-sm leading-relaxed text-foreground whitespace-pre-wrap">{question.text}</p>
          </div>

          {/* Previous Staff Answers */}
          {question.answers && question.answers.length > 0 && (
            <div className="space-y-3 ps-3 sm:ps-5 border-s-2 border-primary/40">
              {question.answers.map((ans) => (
                <div key={ans.id} className="rounded-2xl bg-primary/5 border border-primary/20 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-primary text-[11px] uppercase tracking-wider">
                      <ShieldCheck className="size-3.5" />
                      <span>{tr("Staff Mentor Response", "إجابة المرشد الأكاديمي")}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
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
                  ? tr("Add a follow-up clarification (Ctrl+Enter)...", "أضف ردًا توضيحيًا إضافيًا (Ctrl+Enter)...")
                  : tr("Write a clinical educator response (Ctrl+Enter)...", "اكتب إجابة علمية واضحة للطالب (Ctrl+Enter)...")
              }
              className="rounded-xl h-11 border-border/80 bg-background/60 text-xs flex-1"
            />
            <Button
              size="sm"
              onClick={() => onSendReply(question.id)}
              disabled={!replyText.trim()}
              className="rounded-full font-bold gap-2 px-6 h-11 text-xs shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 shrink-0"
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
      <div className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-card/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="size-10 grid place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <MessageCircle className="size-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight text-foreground">{tr("Student Q&A Moderation", "إدارة أسئلة واستفسارات الطلاب")}</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {tr(
              "Review student inquiries, answer lecture questions, and build community knowledge.",
              "متابعة استفسارات الطلاب، والرد على أسئلة المحاضرات لبناء مرجع علمي يستفيد منه الجميع."
            )}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder={tr("Search questions & students...", "بحث بالاسم أو نص السؤال...")}
            className="h-10 ps-9 pe-8 rounded-xl text-xs bg-background/60"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch("")}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs: Unanswered vs Answered */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)} className="space-y-5">
        <TabsList className="grid grid-cols-2 h-11 w-full sm:w-80 p-1 bg-muted/60 rounded-2xl border border-border/60">
          <TabsTrigger value="unanswered" className="text-xs font-bold gap-2 rounded-xl">
            <span>{tr("Unanswered", "غير مجابة")}</span>
            <Badge
              variant={unanswered.length > 0 ? "destructive" : "secondary"}
              className="h-4 px-1.5 text-[10px] shrink-0 font-bold font-mono"
            >
              {unanswered.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="answered" className="text-xs font-bold gap-2 rounded-xl">
            <span>{tr("Answered", "تمت الإجابة")}</span>
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px] shrink-0 font-bold font-mono">
              {answered.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unanswered" className="space-y-4">
          {filteredUnanswered.map(renderQuestionCard)}

          {!filteredUnanswered.length && (
            <div className="grid min-h-48 place-items-center rounded-3xl border border-dashed border-border/80 p-8 text-center text-muted-foreground">
              <div>
                <CheckCircle2 className="mx-auto size-9 text-emerald-500 opacity-90" />
                <p className="mt-3 font-bold text-sm text-foreground">
                  {tr("All caught up!", "تمت الإجابة عن جميع الأسئلة!")}
                </p>
                <p className="mt-1 text-xs leading-relaxed">
                  {tr("There are no pending questions awaiting educator answers.", "لا توجد أسئلة معلقة بانتظار رد المرشد.")}
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="answered" className="space-y-4">
          {filteredAnswered.map(renderQuestionCard)}

          {!filteredAnswered.length && (
            <div className="grid min-h-48 place-items-center rounded-3xl border border-dashed border-border/80 p-8 text-center text-muted-foreground">
              <div>
                <MessageCircle className="mx-auto size-9 opacity-40" />
                <p className="mt-3 font-bold text-sm text-foreground">
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
