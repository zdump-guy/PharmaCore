import React from "react"
import {
  FiShield as Shield,
  FiAward as Award,
  FiZap as Zap,
  FiStar as Star,
} from "react-icons/fi"
import {
  FaCrown as Crown,
  FaGem as Gem,
} from "react-icons/fa6"
import { HiSparkles as Sparkles } from "react-icons/hi2"
import { cn } from "@/lib/utils"
import { DIVISION_METADATA, calculateDivision } from "@/lib/gamification"
import type { DivisionTier } from "@/types"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface DivisionBadgeProps {
  tier: DivisionTier | string
  size?: "xs" | "sm" | "md" | "lg"
  showLabel?: boolean
  showIcon?: boolean
  showXp?: boolean
  xp?: number
  className?: string
  interactive?: boolean
  locale?: "en" | "ar"
}

interface TierStyleConfig {
  icon: React.ComponentType<{ className?: string }>
  badgeBg: string
  borderClass: string
  textClass: string
  iconColor: string
  glowClass: string
  accentColor: string
  desc_en: string
  desc_ar: string
  rank_en: string
  rank_ar: string
}

const TIER_STYLES: Record<DivisionTier, TierStyleConfig> = {
  bronze: {
    icon: Shield,
    badgeBg: "bg-gradient-to-r from-amber-950/40 via-amber-900/30 to-amber-950/40 dark:from-amber-950/60 dark:via-amber-900/40 dark:to-amber-950/60",
    borderClass: "border-amber-600/40 hover:border-amber-500/70 shadow-amber-900/20",
    textClass: "text-amber-500 dark:text-amber-400 font-semibold",
    iconColor: "text-amber-500",
    glowClass: "group-hover:shadow-[0_0_12px_rgba(217,119,6,0.3)]",
    accentColor: "#d97706",
    desc_en: "Foundation level for aspiring clinical pharmacologists.",
    desc_ar: "المستوى التأسيسي لعلماء الصيدلة السريرية الصاعدين.",
    rank_en: "Division 1 of 5 (0 - 499 XP)",
    rank_ar: "القسم الأول من 5 (0 - 499 نقطة)",
  },
  silver: {
    icon: Star,
    badgeBg: "bg-gradient-to-r from-slate-800/40 via-slate-700/30 to-slate-800/40 dark:from-slate-800/60 dark:via-slate-700/50 dark:to-slate-800/60",
    borderClass: "border-slate-400/40 hover:border-slate-300/70 shadow-slate-700/20",
    textClass: "text-slate-300 dark:text-slate-200 font-semibold",
    iconColor: "text-slate-300",
    glowClass: "group-hover:shadow-[0_0_12px_rgba(148,163,184,0.3)]",
    accentColor: "#94a3b8",
    desc_en: "Dedicated practitioner with solid pharmacology grasp.",
    desc_ar: "ممارس متميز يمتلك فهماً صيدلانياً راسخاً.",
    rank_en: "Division 2 of 5 (500 - 1,499 XP)",
    rank_ar: "القسم الثاني من 5 (500 - 1499 نقطة)",
  },
  gold: {
    icon: Crown,
    badgeBg: "bg-gradient-to-r from-yellow-950/40 via-amber-900/30 to-yellow-950/40 dark:from-yellow-950/60 dark:via-amber-800/40 dark:to-yellow-950/60",
    borderClass: "border-yellow-500/50 hover:border-yellow-400/80 shadow-yellow-900/30",
    textClass: "text-yellow-500 dark:text-yellow-400 font-semibold",
    iconColor: "text-yellow-400",
    glowClass: "group-hover:shadow-[0_0_15px_rgba(234,179,8,0.35)]",
    accentColor: "#eab308",
    desc_en: "Top-tier student demonstrating strong clinical expertise.",
    desc_ar: "طالب متفوق يبرهن على خبرة وحصيلة سريرية قوية.",
    rank_en: "Division 3 of 5 (1,500 - 3,499 XP)",
    rank_ar: "القسم الثالث من 5 (1500 - 3499 نقطة)",
  },
  platinum: {
    icon: Zap,
    badgeBg: "bg-gradient-to-r from-cyan-950/40 via-teal-900/30 to-cyan-950/40 dark:from-cyan-950/60 dark:via-teal-800/40 dark:to-cyan-950/60",
    borderClass: "border-cyan-400/50 hover:border-cyan-300/80 shadow-cyan-900/30",
    textClass: "text-cyan-400 dark:text-cyan-300 font-semibold",
    iconColor: "text-cyan-300",
    glowClass: "group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]",
    accentColor: "#06b6d4",
    desc_en: "Master pharmacology scholar in the top percentiles.",
    desc_ar: "عالم صيدلة متقدم ضمن النخبة الأكاديمية.",
    rank_en: "Division 4 of 5 (3,500 - 6,999 XP)",
    rank_ar: "القسم الرابع من 5 (3500 - 6999 نقطة)",
  },
  diamond: {
    icon: Gem,
    badgeBg: "bg-gradient-to-r from-purple-950/40 via-fuchsia-900/30 to-indigo-950/40 dark:from-purple-950/60 dark:via-fuchsia-900/50 dark:to-indigo-950/60",
    borderClass: "border-purple-400/60 hover:border-fuchsia-300/90 shadow-purple-900/40",
    textClass: "text-purple-400 dark:text-fuchsia-300 font-bold",
    iconColor: "text-purple-300",
    glowClass: "group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]",
    accentColor: "#a855f7",
    desc_en: "Elite clinical champion — Highest honors in PharmaCore.",
    desc_ar: "بطل سريري نخبوي — أعلى مراتب الشرف في فارماكور.",
    rank_en: "Division 5 of 5 (7,000+ XP)",
    rank_ar: "القسم الخامس الأعلى (7000+ نقطة)",
  },
}

const SIZE_CONFIGS = {
  xs: {
    padding: "px-1.5 py-0.5",
    text: "text-[10px]",
    iconSize: "w-2.5 h-2.5",
    gap: "gap-1",
  },
  sm: {
    padding: "px-2.5 py-1",
    text: "text-xs",
    iconSize: "w-3.5 h-3.5",
    gap: "gap-1.5",
  },
  md: {
    padding: "px-3.5 py-1.5",
    text: "text-sm",
    iconSize: "w-4 h-4",
    gap: "gap-2",
  },
  lg: {
    padding: "px-4 py-2",
    text: "text-base",
    iconSize: "w-5 h-5",
    gap: "gap-2.5",
  },
}

export const DivisionBadge: React.FC<DivisionBadgeProps> = ({
  tier,
  size = "sm",
  showLabel = true,
  showIcon = true,
  showXp = false,
  xp,
  className,
  interactive = true,
  locale = "en",
}) => {
  const isAr = locale === "ar"
  const normalizedTier = (tier || "bronze").toLowerCase() as DivisionTier
  const meta = DIVISION_METADATA[normalizedTier] || DIVISION_METADATA.bronze
  const style = TIER_STYLES[normalizedTier] || TIER_STYLES.bronze
  const sizeConfig = SIZE_CONFIGS[size] || SIZE_CONFIGS.sm
  const IconComponent = style.icon

  const label = isAr ? meta.name_ar : meta.name_en

  const badgeContent = (
    <div
      className={cn(
        "group relative inline-flex items-center rounded-full border backdrop-blur-md transition-all duration-300 select-none",
        style.badgeBg,
        style.borderClass,
        style.glowClass,
        sizeConfig.padding,
        sizeConfig.gap,
        interactive && "cursor-pointer hover:scale-[1.03]",
        className
      )}
    >
      {/* Subtle metallic shine overlay on hover */}
      <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300" />

      {showIcon && (
        <span className={cn("flex-shrink-0 flex items-center justify-center", style.iconColor)}>
          <IconComponent className={sizeConfig.iconSize} />
        </span>
      )}

      {showLabel && (
        <span className={cn(sizeConfig.text, style.textClass, "tracking-tight whitespace-nowrap")}>
          {label}
        </span>
      )}

      {showXp && xp !== undefined && (
        <span
          className={cn(
            sizeConfig.text,
            "opacity-80 font-mono font-medium pl-0.5 whitespace-nowrap text-muted-foreground"
          )}
        >
          • {xp.toLocaleString()} XP
        </span>
      )}
    </div>
  )

  if (!interactive) {
    return badgeContent
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs border border-border/80 bg-popover/95 p-3 shadow-xl backdrop-blur-xl rounded-xl text-left"
        >
          <div className="space-y-1.5" dir={isAr ? "rtl" : "ltr"}>
            <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className={cn("p-1 rounded-md bg-muted/40", style.iconColor)}>
                  <IconComponent className="w-3.5 h-3.5" />
                </span>
                <span className={cn("font-bold text-xs", style.textClass)}>{label}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                {isAr ? style.rank_ar : style.rank_en}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isAr ? style.desc_ar : style.desc_en}
            </p>
            {xp !== undefined && (
              <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground/90 font-mono">
                <span>{isAr ? "النقاط الحالية:" : "Current XP:"}</span>
                <span className="font-bold text-foreground">{xp.toLocaleString()} XP</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default DivisionBadge
