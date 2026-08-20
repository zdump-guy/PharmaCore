import { useState } from "react"
import {
  FiAward as Award,
  FiCheck as Check,
  FiLock as Lock,
  FiX as X,
  FiZap as Zap
} from "react-icons/fi"
import { FaFire as Flame } from "react-icons/fa6"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BADGE_DEFINITIONS, type BadgeDefinition } from "@/lib/certificates"
import type { UserStreak, UserBadge } from "@/types"

interface StreakBadgeCardProps {
  streak: UserStreak
  badges: UserBadge[]
  locale?: string
}

export default function StreakBadgeCard({ streak, badges, locale = "en" }: StreakBadgeCardProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null)

  const isAr = locale === "ar"
  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const currentStreak = streak.current_streak || 0
  const longestStreak = Math.max(streak.longest_streak || 0, currentStreak)
  const lastActiveDate = streak.last_activity_date || new Date().toISOString().split("T")[0]

  // Calculate next streak goal
  let nextGoal = 3
  if (currentStreak >= 30) nextGoal = currentStreak + 10
  else if (currentStreak >= 7) nextGoal = 30
  else if (currentStreak >= 3) nextGoal = 7

  const streakProgressPercent = Math.min(100, Math.round((currentStreak / nextGoal) * 100))

  const earnedBadgeTypes = new Set(badges.map((b) => b.badge_type))

  // Find badge icon & metallic color styling
  const getBadgeStyle = (badgeId: string, unlocked: boolean) => {
    if (!unlocked) {
      return {
        bg: "bg-muted/40 border-border/80 text-muted-foreground/50",
        iconColor: "text-muted-foreground/40",
        glow: ""
      }
    }
    switch (badgeId) {
      case "streak_3":
        return {
          bg: "bg-gradient-to-br from-amber-700/20 via-amber-600/10 to-amber-900/20 border-amber-600/40 text-amber-900 dark:text-amber-200",
          iconColor: "text-amber-700 dark:text-amber-400",
          glow: "shadow-amber-500/10 shadow-lg"
        }
      case "streak_7":
        return {
          bg: "bg-gradient-to-br from-slate-400/20 via-slate-300/10 to-slate-600/20 border-slate-400/50 text-slate-900 dark:text-slate-200",
          iconColor: "text-slate-600 dark:text-slate-300",
          glow: "shadow-slate-500/10 shadow-lg"
        }
      case "streak_30":
        return {
          bg: "bg-gradient-to-br from-yellow-500/25 via-amber-400/15 to-yellow-600/20 border-yellow-500/60 text-amber-950 dark:text-yellow-200",
          iconColor: "text-yellow-600 dark:text-yellow-400",
          glow: "shadow-yellow-500/20 shadow-lg ring-1 ring-yellow-500/30"
        }
      case "course_mastery":
        return {
          bg: "bg-gradient-to-br from-emerald-600/20 via-teal-500/10 to-emerald-800/20 border-emerald-500/50 text-emerald-950 dark:text-emerald-200",
          iconColor: "text-emerald-600 dark:text-emerald-400",
          glow: "shadow-emerald-500/15 shadow-lg"
        }
      case "perfect_score":
        return {
          bg: "bg-gradient-to-br from-blue-600/20 via-indigo-500/10 to-blue-800/20 border-blue-500/50 text-blue-950 dark:text-blue-200",
          iconColor: "text-blue-600 dark:text-blue-400",
          glow: "shadow-blue-500/15 shadow-lg"
        }
      default:
        return {
          bg: "bg-primary/10 border-primary/30 text-primary",
          iconColor: "text-primary",
          glow: ""
        }
    }
  }

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* ─── 1. Streak Tracker Hero Card ─────────────────────────────────── */}
      <div className="rounded-3xl border border-border/80 bg-card/90 p-6 sm:p-7 shadow-sm relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 end-0 size-60 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          {/* Flame Icon & Streak Numbers */}
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0 animate-pulse">
              <Flame className="size-9" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl font-black font-mono text-foreground">
                  {currentStreak}
                </span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {tr("Day Streak", "أيام متتالية")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span>
                  {tr("Longest Record", "أطول سلسلة مواظبة")}:{" "}
                  <strong className="font-mono text-foreground">{longestStreak} {tr("days", "يوم")}</strong>
                </span>
                <span>•</span>
                <span>
                  {tr("Last Active", "آخر نشاط")}:{" "}
                  <strong className="text-foreground">{lastActiveDate}</strong>
                </span>
              </p>
            </div>
          </div>

          {/* Next Goal Progress Box */}
          <div className="sm:max-w-xs w-full p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Zap className="size-3.5 text-amber-500" />
                <span>{tr("Next Milestone Goal", "الهدف القادم")}</span>
              </span>
              <span className="font-mono font-bold text-foreground">
                {currentStreak} / {nextGoal} {tr("Days", "يوم")}
              </span>
            </div>
            <Progress value={streakProgressPercent} className="h-2" />
            <p className="text-[11px] text-muted-foreground text-center">
              {currentStreak >= nextGoal
                ? tr("Milestone unlocked!", "تم فتح الإنجاز بنجاح!")
                : tr(
                    `${nextGoal - currentStreak} more day(s) to reach the next tier`,
                    `متبقي ${nextGoal - currentStreak} يوم للوصول للإنجاز التالي`
                  )}
            </p>
          </div>
        </div>
      </div>

      {/* ─── 2. Milestone Achievement Badges Showcase ─────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="size-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">
              {tr("Milestone Achievement Badges", "أوسمة الإنجاز والتميز الأكاديمي")}
            </h3>
          </div>
          <Badge variant="secondary" className="font-mono text-xs font-bold">
            {badges.length} / {BADGE_DEFINITIONS.length} {tr("Unlocked", "مكتمل")}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {BADGE_DEFINITIONS.map((badge) => {
            const isUnlocked = earnedBadgeTypes.has(badge.id)
            const earnedRecord = badges.find((b) => b.badge_type === badge.id)
            const style = getBadgeStyle(badge.id, isUnlocked)

            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 relative overflow-hidden ${style.bg} ${style.glow} hover:-translate-y-0.5`}
              >
                {/* Badge Icon */}
                <div
                  className={`size-12 rounded-2xl border border-white/20 dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs ${
                    isUnlocked ? "bg-background/80" : "bg-muted/60"
                  }`}
                >
                  {isUnlocked ? (
                    <Award className={`size-6 ${style.iconColor}`} />
                  ) : (
                    <Lock className="size-5 text-muted-foreground/60" />
                  )}
                </div>

                {/* Badge Details */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold text-xs text-foreground truncate">
                      {isAr && badge.name_ar ? badge.name_ar : badge.name}
                    </h4>
                    {isUnlocked ? (
                      <Badge variant="success" className="text-[9px] px-1.5 py-0 font-bold gap-0.5 shrink-0">
                        <Check className="size-2.5" />
                        <span>{tr("Unlocked", "مكتمل")}</span>
                      </Badge>
                    ) : (
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                        {badge.threshold ? `${currentStreak}/${badge.threshold}d` : tr("Locked", "مغلق")}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {isAr && badge.description_ar ? badge.description_ar : badge.description}
                  </p>

                  {earnedRecord && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
                      {tr("Awarded", "تم المنح")}: {new Date(earnedRecord.awarded_at).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── 3. Selected Badge Detail Modal ───────────────────────────────── */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-sm bg-background rounded-3xl border border-border/80 shadow-2xl p-6 space-y-4 text-center"
            dir={isAr ? "rtl" : "ltr"}
          >
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 end-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>

            <div className="size-16 rounded-3xl bg-primary/10 text-primary mx-auto flex items-center justify-center shadow-md">
              <Award className="size-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-foreground">
                {isAr && selectedBadge.name_ar ? selectedBadge.name_ar : selectedBadge.name}
              </h4>
              <Badge
                variant={earnedBadgeTypes.has(selectedBadge.id) ? "success" : "secondary"}
                className="text-xs font-bold"
              >
                {earnedBadgeTypes.has(selectedBadge.id)
                  ? tr("Earned & Unlocked", "مكتمل وممنوح")
                  : tr("In Progress", "قيد الإنجاز")}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {isAr && selectedBadge.description_ar
                ? selectedBadge.description_ar
                : selectedBadge.description}
            </p>

            <Button
              size="sm"
              onClick={() => setSelectedBadge(null)}
              className="w-full rounded-full font-bold text-xs h-9"
            >
              {tr("Close", "إغلاق")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
