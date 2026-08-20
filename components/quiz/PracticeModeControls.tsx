import {
  FiAward as Award,
  FiBookOpen as BookOpen,
  FiCheckCircle as CheckCircle2,
  FiClock as Clock,
  FiLock as Lock,
  FiZap as Zap,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type QuizRunnerMode = "standard" | "practice"

interface PracticeModeControlsProps {
  mode: QuizRunnerMode
  onChangeMode: (mode: QuizRunnerMode) => void
  isPracticeAvailable: boolean
  isAr: boolean
  disabled?: boolean
}

export default function PracticeModeControls({
  mode,
  onChangeMode,
  isPracticeAvailable,
  isAr,
  disabled = false,
}: PracticeModeControlsProps) {
  const tr = (en: string, ar: string) => (isAr ? ar : en)

  return (
    <div className="rounded-3xl border border-border/80 bg-card/95 p-4 sm:p-5 shadow-sm backdrop-blur-xl space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "size-9 grid place-items-center rounded-2xl border transition-colors",
              mode === "practice"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-primary/10 text-primary border-primary/20"
            )}
          >
            {mode === "practice" ? <Zap className="size-4.5" /> : <Clock className="size-4.5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-foreground">
                {tr("Assessment Simulator Mode", "نمط المحاكاة والتقييم")}
              </h3>
              <Badge
                variant={mode === "practice" ? "success" : "secondary"}
                className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2"
              >
                {mode === "practice"
                  ? tr("Practice Active", "وضع التدريب")
                  : tr("Exam Active", "وضع الاختبار")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {mode === "practice"
                ? tr(
                    "Untimed session: Instant answer verification, bilingual clinical rationales, and textbook citations.",
                    "جلسة غير محددة بوقت: تحقق فوري من الإجابات، وتعليلات سريرية ثنائية اللغة مع مراجع الكتب."
                  )
                : tr(
                    "Standard examination: Answers are recorded and feedback is revealed upon final assessment submission.",
                    "اختبار رسمي معياري: يتم تسجيل الإجابات وكشف النتيجة والتعليلات بعد الاعتماد النهائي."
                  )}
            </p>
          </div>
        </div>

        {/* Toggle Mode Buttons */}
        <div className="flex items-center p-1 bg-muted/70 rounded-2xl border border-border/60 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChangeMode("standard")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all select-none cursor-pointer",
              mode === "standard"
                ? "bg-background text-foreground shadow-xs font-black"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Award className="size-3.5" />
            <span>{tr("Standard Exam", "اختبار معياري")}</span>
          </button>

          {isPracticeAvailable ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChangeMode("practice")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all select-none cursor-pointer",
                mode === "practice"
                  ? "bg-emerald-600 text-white shadow-xs font-black dark:bg-emerald-500"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Zap className="size-3.5" />
              <span>{tr("Practice Mode", "وضع التدريب")}</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-muted-foreground/60 cursor-not-allowed opacity-60"
              title={tr(
                "Practice mode is disabled by course policy",
                "وضع التدريب معطل وفق سياسة هذا المقرر"
              )}
            >
              <Lock className="size-3" />
              <span>{tr("Practice (Locked)", "التدريب (مغلق)")}</span>
            </div>
          )}
        </div>
      </div>

      {mode === "practice" && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
            <CheckCircle2 className="size-3.5" />
            {tr("Instant Verification", "تصحيح فوري")}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-medium">
            <BookOpen className="size-3.5" />
            {tr("Clinical Explanations & Citations", "شرح سريري ومراجع طبية")}
          </span>
          <span>•</span>
          <span className="font-medium">{tr("Untimed Self-Paced Exploration", "استكشاف حر ذاتي")}</span>
        </div>
      )}
    </div>
  )
}
