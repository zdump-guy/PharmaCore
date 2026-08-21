import React, { useState, useMemo, useRef } from "react"
import {
  FiSearch as Search,
  FiChevronLeft as ChevronLeft,
  FiChevronRight as ChevronRight,
  FiAward as Award,
  FiUser as UserIcon,
  FiX as X,
  FiArrowUp as ArrowUp,
} from "react-icons/fi"
import {
  FaFire as Flame,
  FaCrown as Crown,
  FaMedal as Medal,
} from "react-icons/fa6"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import DivisionBadge from "@/components/gamification/DivisionBadge"
import type { LeaderboardEntry, LeaderboardTimeframe, DivisionTier } from "@/types"

export interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserId?: string | null
  timeframe?: LeaderboardTimeframe
  locale?: "en" | "ar"
  pageSize?: number
  onUserClick?: (entry: LeaderboardEntry) => void
  className?: string
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  entries = [],
  currentUserId,
  timeframe = "weekly",
  locale = "en",
  pageSize = 10,
  onUserClick,
  className,
}) => {
  const isAr = locale === "ar"
  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDivision, setSelectedDivision] = useState<DivisionTier | "all">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const userRowRef = useRef<HTMLTableRowElement | null>(null)

  const getInitials = (name?: string) => {
    if (!name) return "ST"
    return name
      .split(" ")
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase()
  }

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Search match
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        entry.full_name.toLowerCase().includes(query) ||
        (entry.university && entry.university.toLowerCase().includes(query)) ||
        (entry.faculty && entry.faculty.toLowerCase().includes(query))

      // Division match
      const matchesDivision =
        selectedDivision === "all" || entry.division === selectedDivision

      return matchesSearch && matchesDivision
    })
  }, [entries, searchQuery, selectedDivision])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize))
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredEntries.slice(start, start + pageSize)
  }, [filteredEntries, currentPage, pageSize])

  // Current user entry in full dataset
  const currentUser = useMemo(() => {
    if (!currentUserId) return null
    return entries.find((e) => e.user_id === currentUserId) || null
  }, [entries, currentUserId])

  interface RankDistanceInfo {
    isFirst: boolean
    aheadByRank?: number
    aheadByXp?: number
  }

  // Current user ahead/behind XP math
  const rankDistance = useMemo<RankDistanceInfo | null>(() => {
    if (!currentUser) return null
    const userIndex = entries.findIndex((e) => e.user_id === currentUserId)
    if (userIndex === -1) return null

    const xpKey = timeframe === "weekly" ? "weekly_xp" : "total_xp"
    const currentXp = currentUser[xpKey]

    if (userIndex > 0) {
      const aheadEntry = entries[userIndex - 1]
      const diff = (aheadEntry[xpKey] || 0) - currentXp
      return {
        aheadByRank: aheadEntry.rank,
        aheadByXp: Math.max(1, diff),
        isFirst: false,
      }
    }

    return { isFirst: true }
  }, [entries, currentUser, currentUserId, timeframe])

  // Jump to user row handler
  const handleJumpToUser = () => {
    if (!currentUser) return
    // Find page of user
    const indexInFiltered = filteredEntries.findIndex((e) => e.user_id === currentUserId)
    if (indexInFiltered !== -1) {
      const page = Math.floor(indexInFiltered / pageSize) + 1
      setCurrentPage(page)
      setTimeout(() => {
        userRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)
    } else {
      // Clear filters so user shows up
      setSearchQuery("")
      setSelectedDivision("all")
      const userIdx = entries.findIndex((e) => e.user_id === currentUserId)
      const page = Math.floor(userIdx / pageSize) + 1
      setCurrentPage(page)
      setTimeout(() => {
        userRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)
    }
  }

  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-extrabold border border-amber-400/50 shadow-sm shadow-amber-500/20">
          <Crown className="w-3.5 h-3.5" />
        </span>
      )
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-400/20 text-slate-200 font-bold border border-slate-300/40">
          <Medal className="w-3.5 h-3.5" />
        </span>
      )
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-500 font-bold border border-amber-600/40">
          <Award className="w-3.5 h-3.5" />
        </span>
      )
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted/60 text-muted-foreground font-mono text-xs font-semibold">
        #{rank}
      </span>
    )
  }

  const divisionsList: Array<{ key: DivisionTier | "all"; label_en: string; label_ar: string }> = [
    { key: "all", label_en: "All Divisions", label_ar: "كل الأقسام" },
    { key: "diamond", label_en: "Diamond", label_ar: "الماسي" },
    { key: "platinum", label_en: "Platinum", label_ar: "البلاتيني" },
    { key: "gold", label_en: "Gold", label_ar: "الذهبي" },
    { key: "silver", label_en: "Silver", label_ar: "الفضي" },
    { key: "bronze", label_en: "Bronze", label_ar: "البرونزي" },
  ]

  return (
    <div className={cn("w-full space-y-4", className)} dir={isAr ? "rtl" : "ltr"}>
      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder={tr("Search scholars or universities...", "ابحث عن الطلاب أو الجامعات...")}
            className="pl-9 pr-8 bg-background/70 border-border/60 rounded-xl text-xs sm:text-sm h-9 focus-visible:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Division Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {divisionsList.map((div) => {
            const isSelected = selectedDivision === div.key
            return (
              <button
                key={div.key}
                onClick={() => {
                  setSelectedDivision(div.key)
                  setCurrentPage(1)
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border select-none",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background/60 text-muted-foreground border-border/50 hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {isAr ? div.label_ar : div.label_en}
              </button>
            )
          })}
        </div>
      </div>

      {/* Roster Table Card */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" dir={isAr ? "rtl" : "ltr"}>
            <thead className="border-b border-border/60 bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3 text-center w-16">
                  {tr("Rank", "الترتيب")}
                </th>
                <th scope="col" className="px-4 py-3">
                  {tr("Scholar", "الطالب")}
                </th>
                <th scope="col" className="px-4 py-3 hidden sm:table-cell">
                  {tr("Division", "القسم")}
                </th>
                <th scope="col" className="px-4 py-3 hidden md:table-cell">
                  {tr("University", "الجامعة")}
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  {tr("Streak", "المواظبة")}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {timeframe === "weekly" ? tr("Weekly XP", "نقاط الأسبوع") : tr("Total XP", "مجموع النقاط")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <UserIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-sm">{tr("No scholars found", "لم يتم العثور على نتائج")}</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      {tr("Try adjusting your search query or division filter", "جرّب تعديل البحث أو مرشح الأقسام")}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((entry) => {
                  const isUser = Boolean(currentUserId && entry.user_id === currentUserId)
                  const xpVal = timeframe === "weekly" ? entry.weekly_xp : entry.total_xp

                  return (
                    <tr
                      key={entry.user_id}
                      ref={isUser ? userRowRef : null}
                      onClick={() => onUserClick && onUserClick(entry)}
                      className={cn(
                        "group transition-colors hover:bg-muted/40 cursor-pointer",
                        isUser && "bg-primary/10 hover:bg-primary/15 border-l-4 border-l-primary"
                      )}
                    >
                      {/* Rank Position */}
                      <td className="px-4 py-3.5 text-center font-mono">{renderRankBadge(entry.rank)}</td>

                      {/* Scholar Info */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 border border-border/80 bg-background">
                            {entry.avatar_url ? (
                              <AvatarImage src={entry.avatar_url} alt={entry.full_name} />
                            ) : null}
                            <AvatarFallback className="text-xs font-bold bg-secondary text-secondary-foreground">
                              {getInitials(entry.full_name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  "font-bold text-xs sm:text-sm truncate group-hover:text-primary transition-colors",
                                  isUser ? "text-primary" : "text-foreground"
                                )}
                              >
                                {entry.full_name}
                              </span>
                              {isUser && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1 py-0 bg-primary/20 text-primary border-primary/30 font-bold"
                                >
                                  {tr("YOU", "أنت")}
                                </Badge>
                              )}
                            </div>

                            {/* Mobile-only university & division fallback */}
                            <div className="flex sm:hidden items-center gap-1.5 text-[10px] text-muted-foreground truncate">
                              <DivisionBadge tier={entry.division} size="xs" locale={locale} />
                              {entry.university && <span className="truncate">• {entry.university}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Division Badge */}
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <DivisionBadge tier={entry.division} size="xs" locale={locale} />
                      </td>

                      {/* University & Faculty */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="max-w-[200px]">
                          <p className="text-xs font-medium text-foreground truncate">
                            {entry.university || tr("Global Scholar", "طالب دولي")}
                          </p>
                          {entry.faculty && (
                            <p className="text-[10px] text-muted-foreground truncate">{entry.faculty}</p>
                          )}
                        </div>
                      </td>

                      {/* Streak Flame */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-mono font-bold">
                          <Flame className="w-3 h-3 text-orange-500 animate-pulse" />
                          {entry.streak_days}d
                        </span>
                      </td>

                      {/* XP Total */}
                      <td className="px-4 py-3.5 text-right font-mono">
                        <span className="font-extrabold text-xs sm:text-sm text-foreground">
                          {xpVal.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1 font-sans">XP</span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-muted/20 text-xs text-muted-foreground">
          <div>
            {tr(
              `Showing ${filteredEntries.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to ${Math.min(
                currentPage * pageSize,
                filteredEntries.length
              )} of ${filteredEntries.length} scholars`,
              `عرض ${filteredEntries.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} إلى ${Math.min(
                currentPage * pageSize,
                filteredEntries.length
              )} من أصل ${filteredEntries.length} طالب`
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="h-7 px-2 text-xs rounded-lg"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="font-mono text-xs px-1">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="h-7 px-2 text-xs rounded-lg"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky "My Position" Bar if user is found */}
      {currentUser && (
        <div className="sticky bottom-4 z-40 w-full rounded-2xl border-2 border-primary/40 bg-card/95 backdrop-blur-2xl p-3 md:p-4 shadow-2xl shadow-primary/10 animate-fade-up">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-primary/20 text-primary border border-primary/40 font-mono font-extrabold text-sm">
                #{currentUser.rank}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">
                    {currentUser.full_name}
                  </h4>
                  <DivisionBadge tier={currentUser.division} size="xs" locale={locale} />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                  <span className="font-mono font-bold text-foreground">
                    {(timeframe === "weekly" ? currentUser.weekly_xp : currentUser.total_xp).toLocaleString()} XP
                  </span>
                  {rankDistance && !rankDistance.isFirst && rankDistance.aheadByXp !== undefined && (
                    <span className="text-amber-500 font-medium">
                      • {rankDistance.aheadByXp.toLocaleString()} XP {tr("behind rank", "خلف الترتيب")} #{rankDistance.aheadByRank}
                    </span>
                  )}
                  {rankDistance && rankDistance.isFirst && (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      • <Crown className="size-3 text-amber-500 inline shrink-0" />
                      <span>{tr("Rank 1 Champion", "بطل المركز الأول")}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              size="sm"
              variant="default"
              onClick={handleJumpToUser}
              className="w-full sm:w-auto h-8 text-xs font-bold rounded-xl gap-1.5 shadow-md"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              {tr("Jump to My Rank", "انتقل إلى ترتيبي")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaderboardTable
