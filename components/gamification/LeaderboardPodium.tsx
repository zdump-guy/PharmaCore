import React from "react"
import {
  FiAward as Award,
  FiUser as UserIcon,
} from "react-icons/fi"
import {
  FaCrown as Crown,
  FaFire as Flame,
  FaMedal as Medal,
} from "react-icons/fa6"
import { HiSparkles as Sparkles } from "react-icons/hi2"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import DivisionBadge from "@/components/gamification/DivisionBadge"
import type { LeaderboardEntry, LeaderboardTimeframe } from "@/types"

export interface LeaderboardPodiumProps {
  topThree: LeaderboardEntry[]
  timeframe?: LeaderboardTimeframe
  locale?: "en" | "ar"
  onSelectUser?: (entry: LeaderboardEntry) => void
  className?: string
}

export const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({
  topThree = [],
  timeframe = "weekly",
  locale = "en",
  onSelectUser,
  className,
}) => {
  const isAr = locale === "ar"
  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const firstPlace = topThree[0] || null
  const secondPlace = topThree[1] || null
  const thirdPlace = topThree[2] || null

  const getInitials = (name?: string) => {
    if (!name) return "ST"
    return name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  const renderPodiumStep = (
    entry: LeaderboardEntry | null,
    position: 1 | 2 | 3,
    customOrder: string,
    pedestalHeight: string
  ) => {
    const isFirst = position === 1
    const isSecond = position === 2
    const isThird = position === 3

    const config = {
      1: {
        rankLabel: "1st",
        crownColor: "text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]",
        ringBorder: "border-amber-400 ring-4 ring-amber-400/30 shadow-[0_0_25px_rgba(245,158,11,0.4)]",
        pedestalBg:
          "bg-gradient-to-b from-amber-500/25 via-amber-500/10 to-amber-950/20 border-t-2 border-amber-400/80 shadow-lg shadow-amber-500/10",
        numberColor: "text-amber-400 font-extrabold",
        badgeBg: "bg-amber-500/20 text-amber-300 border-amber-400/40",
        auraGlow: "bg-amber-500/15",
      },
      2: {
        rankLabel: "2nd",
        crownColor: "text-slate-300 drop-shadow-[0_0_6px_rgba(203,213,225,0.5)]",
        ringBorder: "border-slate-300 ring-4 ring-slate-300/20 shadow-[0_0_20px_rgba(148,163,184,0.3)]",
        pedestalBg:
          "bg-gradient-to-b from-slate-400/20 via-slate-400/10 to-slate-900/20 border-t-2 border-slate-300/70 shadow-lg shadow-slate-500/10",
        numberColor: "text-slate-300 font-bold",
        badgeBg: "bg-slate-400/20 text-slate-200 border-slate-300/40",
        auraGlow: "bg-slate-400/10",
      },
      3: {
        rankLabel: "3rd",
        crownColor: "text-amber-600 drop-shadow-[0_0_6px_rgba(217,119,6,0.4)]",
        ringBorder: "border-amber-600 ring-4 ring-amber-600/20 shadow-[0_0_15px_rgba(217,119,6,0.25)]",
        pedestalBg:
          "bg-gradient-to-b from-amber-700/20 via-amber-700/10 to-amber-950/20 border-t-2 border-amber-600/70 shadow-lg shadow-amber-700/10",
        numberColor: "text-amber-600 font-bold",
        badgeBg: "bg-amber-700/20 text-amber-300 border-amber-600/40",
        auraGlow: "bg-amber-700/10",
      },
    }[position]

    if (!entry) {
      return (
        <div
          className={cn(
            "flex flex-col items-center justify-end w-full max-w-[220px] transition-all duration-300 opacity-40",
            customOrder
          )}
        >
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-3">
            <UserIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="text-xs text-muted-foreground font-medium mb-2">{tr("Empty Rank", "شاغر")}</div>
          <div
            className={cn(
              "w-full rounded-t-2xl border border-border/40 flex items-center justify-center bg-muted/20",
              pedestalHeight
            )}
          >
            <span className="text-xl font-bold text-muted-foreground/40">#{position}</span>
          </div>
        </div>
      )
    }

    const xpAmount = timeframe === "weekly" ? entry.weekly_xp : entry.total_xp

    return (
      <div
        onClick={() => onSelectUser && onSelectUser(entry)}
        className={cn(
          "group flex flex-col items-center justify-end w-full max-w-[240px] cursor-pointer transition-all duration-300 hover:translate-y-[-4px]",
          customOrder
        )}
      >
        {/* Floating Crown / Medal Icon */}
        <div className="relative mb-2 flex items-center justify-center">
          {isFirst ? (
            <div className="relative">
              <Crown className={cn("w-9 h-9 animate-bounce duration-1000", config.crownColor)} />
              <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-2 animate-pulse" />
            </div>
          ) : isSecond ? (
            <Medal className={cn("w-7 h-7", config.crownColor)} />
          ) : (
            <Award className={cn("w-7 h-7", config.crownColor)} />
          )}
        </div>

        {/* Avatar with Ambient Glow Ring */}
        <div className="relative mb-3 flex items-center justify-center">
          {/* Ambient Glow Aura */}
          <div
            className={cn(
              "absolute inset-0 rounded-full blur-xl transition-opacity duration-300 group-hover:opacity-100 opacity-60",
              config.auraGlow
            )}
          />

          <Avatar
            className={cn(
              "transition-all duration-300 bg-background relative",
              isFirst ? "w-20 h-20 md:w-24 md:h-24" : "w-16 h-16 md:w-20 md:h-20",
              config.ringBorder
            )}
          >
            {entry.avatar_url ? (
              <AvatarImage src={entry.avatar_url} alt={entry.full_name} className="object-cover" />
            ) : null}
            <AvatarFallback className="font-bold text-sm md:text-base bg-secondary text-secondary-foreground">
              {getInitials(entry.full_name)}
            </AvatarFallback>
          </Avatar>

          {/* Rank Ribbon Badge */}
          <span
            className={cn(
              "absolute -bottom-2 px-2 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase border backdrop-blur-md shadow-md",
              config.badgeBg
            )}
          >
            #{position}
          </span>
        </div>

        {/* User Info Header */}
        <div className="text-center px-1 mb-3 space-y-1 w-full">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <h4 className="font-bold text-xs md:text-sm text-foreground group-hover:text-primary transition-colors truncate max-w-[170px]">
              {entry.full_name}
            </h4>
            {entry.is_current_user && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 border-primary text-primary">
                {tr("You", "أنت")}
              </Badge>
            )}
          </div>

          {entry.university && (
            <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[180px] mx-auto font-medium">
              {entry.university}
            </p>
          )}

          {/* Division Badge */}
          <div className="pt-0.5 flex justify-center">
            <DivisionBadge tier={entry.division} size="xs" locale={locale} />
          </div>
        </div>

        {/* Pedestal Structure */}
        <div
          className={cn(
            "w-full rounded-t-2xl backdrop-blur-xl border-x border-b border-border/40 flex flex-col items-center justify-between p-3 transition-all duration-300 group-hover:border-primary/40",
            config.pedestalBg,
            pedestalHeight
          )}
        >
          {/* XP Pill */}
          <div className="w-full flex flex-col items-center justify-center space-y-1">
            <div className="px-2.5 py-1 rounded-full bg-background/80 border border-border/50 text-xs md:text-sm font-extrabold font-mono text-foreground flex items-center gap-1 shadow-sm">
              <span>{xpAmount.toLocaleString()}</span>
              <span className="text-[10px] text-primary font-bold">XP</span>
            </div>

            {/* Streak & Badges Metrics */}
            <div className="flex items-center justify-center gap-2 pt-1 text-[10px] text-muted-foreground font-mono">
              <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                <Flame className="w-3 h-3 text-orange-500" />
                {entry.streak_days}d
              </span>
              {entry.certificates_count > 0 && (
                <span className="flex items-center gap-0.5 text-emerald-500 font-medium">
                  <Award className="w-3 h-3 text-emerald-500" />
                  {entry.certificates_count}
                </span>
              )}
            </div>
          </div>

          {/* Large Roman / Arabic Number */}
          <div className={cn("text-2xl md:text-3xl tracking-tighter opacity-90 select-none pb-1", config.numberColor)}>
            {position === 1 ? "I" : position === 2 ? "II" : "III"}
          </div>
        </div>
      </div>
    )
  }

  if (topThree.length === 0) {
    return (
      <div className={cn("w-full py-12 text-center rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md", className)}>
        <Award className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <h3 className="font-bold text-foreground text-base">
          {tr("No podium champions yet", "لا يوجد أبطال على منصة التتويج حالياً")}
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
          {tr(
            "Be the first to complete lectures and earn XP to claim the top podium spot!",
            "كن أول من يتم المحاضرات ويكتسب النقاط للصعود إلى منصة التتويج!"
          )}
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "w-full flex items-end justify-center gap-2 sm:gap-4 md:gap-6 pt-4 pb-2 px-2 select-none",
        className
      )}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* 2nd Place (Left) */}
      {renderPodiumStep(secondPlace, 2, "order-1", "h-32 md:h-36")}

      {/* 1st Place (Center / Tallest) */}
      {renderPodiumStep(firstPlace, 1, "order-2", "h-44 md:h-52")}

      {/* 3rd Place (Right) */}
      {renderPodiumStep(thirdPlace, 3, "order-3", "h-24 md:h-28")}
    </div>
  )
}

export default LeaderboardPodium
