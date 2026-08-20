import { useState } from "react"
import {
  FiAward as Award,
  FiBookOpen as BookOpen,
  FiCheckCircle as CheckCircle2,
  FiGlobe as Globe,
  FiHelpCircle as HelpCircle,
  FiXCircle as XCircle,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Question } from "@/types"

interface ClinicalRationaleCardProps {
  question: Question
  selectedAnswer?: string
  isCorrect: boolean
  isAr: boolean
  showApprovedAnswer?: boolean
}

export default function ClinicalRationaleCard({
  question,
  isCorrect,
  isAr,
  showApprovedAnswer = true,
}: ClinicalRationaleCardProps) {
  const tr = (en: string, ar: string) => (isAr ? ar : en)
  const [activeLang, setActiveLang] = useState<"primary" | "secondary">("primary")

  const primaryExplanation = isAr
    ? question.explanation_ar || question.explanation_en
    : question.explanation_en || question.explanation_ar

  const secondaryExplanation = isAr
    ? (question.explanation_ar ? question.explanation_en : null)
    : (question.explanation_en ? question.explanation_ar : null)

  const hasBilingual = Boolean(question.explanation_en && question.explanation_ar)

  const displayedExplanation =
    activeLang === "primary"
      ? primaryExplanation || tr("No clinical explanation available.", "لا يوجد شرح سريري متاح حالياً.")
      : secondaryExplanation || primaryExplanation

  const displayedLangLabel =
    activeLang === "primary"
      ? isAr
        ? "العربية"
        : "English"
      : isAr
      ? "English"
      : "العربية"

  const displayedDir =
    activeLang === "primary" ? (isAr ? "rtl" : "ltr") : isAr ? "ltr" : "rtl"

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 sm:p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200",
        isCorrect
          ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20"
          : "border-rose-500/40 bg-rose-500/5 dark:bg-rose-950/20"
      )}
    >
      {/* Header Feedback Status */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {isCorrect ? (
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-xs py-1 px-3 rounded-full"
            >
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{tr("Correct Clinical Decision", "قرار سريري دقيق وصحيح")}</span>
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="gap-1.5 border-rose-500/50 bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold text-xs py-1 px-3 rounded-full"
            >
              <XCircle className="size-3.5 text-rose-600 dark:text-rose-400" />
              <span>{tr("Clinical Discrepancy", "إجابة غير دقيقة سريريًا")}</span>
            </Badge>
          )}

          {question.difficulty && (
            <Badge
              variant="outline"
              className={`text-[10px] font-bold capitalize ${
                question.difficulty === "easy"
                  ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                  : question.difficulty === "hard"
                  ? "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10"
                  : "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
              }`}
            >
              {question.difficulty === "easy"
                ? tr("Easy", "سهل")
                : question.difficulty === "hard"
                ? tr("Hard", "متقدم")
                : tr("Medium", "متوسط")}
            </Badge>
          )}
        </div>

        {/* Bilingual Language Switcher if both languages provided */}
        {hasBilingual && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveLang((prev) => (prev === "primary" ? "secondary" : "primary"))}
            className="h-7 text-xs font-bold gap-1 rounded-full text-muted-foreground hover:text-foreground"
          >
            <Globe className="size-3" />
            <span>{displayedLangLabel}</span>
          </Button>
        )}
      </div>

      {/* Correct Answer Callout on Error */}
      {showApprovedAnswer && !isCorrect && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
            <HelpCircle className="size-3.5 shrink-0" />
            <span>{tr("Approved Correct Answer:", "الإجابة المعتمدة:")}</span>
          </div>
          <p className="font-bold text-foreground ps-5">{question.correct_answer}</p>
        </div>
      )}

      {/* Clinical Rationale Content */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-black text-foreground">
          <div className="size-5 grid place-items-center rounded-md bg-primary/10 text-primary">
            <Award className="size-3" />
          </div>
          <span>{tr("Clinical Rationale & Mechanism", "التعليل السريري والآلية الدوائية")}</span>
        </div>

        <div
          dir={displayedDir}
          className="rounded-xl border border-border/60 bg-background/80 p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed text-foreground/90 font-medium"
        >
          {displayedExplanation}
        </div>
      </div>

      {/* Clinical Reference / Textbook Citation */}
      {question.clinical_reference && (
        <div className="flex items-start gap-2 pt-1 border-t border-border/50 text-xs text-muted-foreground">
          <BookOpen className="size-3.5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-foreground">
              {tr("Reference Citation:", "المرجع الإكلينيكي المعتمد:")}{" "}
            </span>
            <span className="italic font-sans">{question.clinical_reference}</span>
          </div>
        </div>
      )}
    </div>
  )
}
