import { useState, useEffect } from "react"
import {
  FiCheckCircle as CheckCircle2,
  FiXCircle as XCircle,
  FiZap as Zap,
  FiBookOpen as BookOpen,
  FiInfo as Info,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDailyChallengeForDate, type DailyChallengeQuestion } from "@/lib/dailyChallenge"

interface DailyChallengeCardProps {
  isAr: boolean
  onRewardXp?: (xp: number) => void
}

export default function DailyChallengeCard({ isAr, onRewardXp }: DailyChallengeCardProps) {
  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const todayStr = new Date().toISOString().slice(0, 10)
  const challenge: DailyChallengeQuestion = getDailyChallengeForDate(todayStr)

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false)
  const [hasCompletedToday, setHasCompletedToday] = useState<boolean>(false)

  const storageKey = `pharmacore_daily_challenge_${todayStr}`

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        setSelectedIndex(parsed.selectedIndex)
        setIsSubmitted(true)
        setHasCompletedToday(true)
      }
    } catch {
      // ignore
    }
  }, [storageKey])

  const handleSelectOption = (idx: number) => {
    if (isSubmitted) return
    setSelectedIndex(idx)
    setIsSubmitted(true)
    setHasCompletedToday(true)

    const isCorrect = idx === challenge.correct_index
    if (isCorrect && onRewardXp) {
      onRewardXp(challenge.xp_reward)
    }

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          selectedIndex: idx,
          isCorrect,
          completedAt: new Date().toISOString(),
        })
      )
    } catch {
      // ignore
    }
  }

  const options = isAr ? challenge.options_ar : challenge.options_en
  const isCorrect = selectedIndex === challenge.correct_index

  return (
    <Card className="rounded-3xl border border-border/80 bg-card/90 shadow-md backdrop-blur-xl overflow-hidden transition-all duration-300 hover:shadow-primary/5 hover:border-primary/30">
      <CardHeader className="p-5 sm:p-6 pb-3 border-b border-border/60 flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 grid place-items-center">
            <Zap className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base sm:text-lg font-black tracking-tight text-foreground">
                {tr("Drug of the Day Challenge", "تحدي عقار اليوم السريري")}
              </CardTitle>
              <Badge className="rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border-primary/20">
                +{challenge.xp_reward} XP
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {challenge.drug_name} •{" "}
              <span className="font-mono text-foreground/80">{challenge.drug_class}</span>
            </p>
          </div>
        </div>

        {hasCompletedToday && (
          <Badge
            variant="outline"
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold gap-1 ${
              isCorrect
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                : "border-rose-500/30 bg-rose-500/10 text-rose-600"
            }`}
          >
            {isCorrect ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
            <span>{isCorrect ? tr("Solved (+25 XP)", "تم الحل (+25 XP)") : tr("Attempted", "تمت المحاولة")}</span>
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Vignette Text */}
        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
          {isAr ? challenge.question_ar : challenge.question_en}
        </p>

        {/* Options */}
        <div className="space-y-2">
          {options.map((opt, idx) => {
            const isThisSelected = selectedIndex === idx
            const isThisCorrect = idx === challenge.correct_index

            let btnStyle =
              "border-border/70 bg-background/50 hover:bg-muted/60 text-foreground hover:border-primary/40"

            if (isSubmitted) {
              if (isThisCorrect) {
                btnStyle =
                  "border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold"
              } else if (isThisSelected && !isThisCorrect) {
                btnStyle =
                  "border-rose-500/60 bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold line-through"
              } else {
                btnStyle = "border-border/40 bg-background/20 text-muted-foreground opacity-60"
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isSubmitted}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-start p-3.5 rounded-2xl border text-xs sm:text-sm transition-all flex items-start gap-3 ${btnStyle}`}
              >
                <span className="size-5 rounded-full border border-current/30 grid place-items-center text-[10px] font-bold shrink-0 mt-0.5">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1 leading-snug">{opt}</span>
              </button>
            )
          })}
        </div>

        {/* Instant Clinical Rationale Feedback */}
        {isSubmitted && (
          <div className="mt-4 p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 text-primary font-bold text-xs">
              <BookOpen className="size-3.5" />
              <span>{tr("Clinical Rationale & Evidence", "التعليل السريري والأدلة العلمية")}</span>
            </div>

            <p className="text-xs text-foreground/80 leading-relaxed">
              {isAr ? challenge.rationale_ar : challenge.rationale_en}
            </p>

            {challenge.clinical_pearl_en && (
              <div className="pt-2 border-t border-primary/10 flex items-start gap-2 text-[11px] text-amber-700 dark:text-amber-300">
                <Info className="size-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>{tr("Clinical Pearl: ", "فائدة سريرية: ")}</strong>
                  {isAr ? challenge.clinical_pearl_ar : challenge.clinical_pearl_en}
                </span>
              </div>
            )}

            {challenge.reference && (
              <p className="text-[10px] font-mono text-muted-foreground">
                Ref: {challenge.reference}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
