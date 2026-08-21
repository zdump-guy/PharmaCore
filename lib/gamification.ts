import { supabase } from "@/lib/supabaseClient"
import type {
  DivisionTier,
  DivisionInfo,
  XpRulesConfig,
  LeaderboardScope,
  LeaderboardTimeframe,
  LeaderboardEntry,
  UserProfile,
} from "@/types"

export type {
  DivisionTier,
  DivisionInfo,
  XpRulesConfig,
  LeaderboardScope,
  LeaderboardTimeframe,
  LeaderboardEntry,
}

export interface UserGamificationProfile {
  user_id: string
  total_xp: number
  weekly_xp: number
  division: DivisionTier
  current_streak: number
  longest_streak: number
  last_activity_date: string | null
  badges_count: number
  certificates_count: number
  updated_at?: string
}

export interface DivisionProgress {
  tier: DivisionTier
  name_en: string
  name_ar: string
  totalXp: number
  currentTierMinXp: number
  nextTierMinXp: number | null
  progressPercent: number
  xpNeededForNext: number
  badgeColor: string
  bgGradient: string
  borderColor: string
  textColor: string
  iconName: string
  isMaxTier: boolean
}

export interface SvgProgressRingResult {
  radius: number
  strokeWidth: number
  normalizedRadius: number
  circumference: number
  strokeDashoffset: number
  progressPercent: number
}

export interface LeaderboardResult {
  scope: LeaderboardScope
  timeframe: LeaderboardTimeframe
  totalEntries: number
  podium: LeaderboardEntry[]
  remaining: LeaderboardEntry[]
  allEntries: LeaderboardEntry[]
  currentUserEntry: LeaderboardEntry | null
}

export const DEFAULT_XP_RULES: XpRulesConfig = {
  lecture_completion_xp: 50,
  quiz_pass_xp: 100,
  quiz_perfect_bonus_xp: 50,
  daily_challenge_xp: 25,
  certificate_issued_xp: 200,
  discussion_upvote_xp: 10,
  division_thresholds: {
    bronze: 0,
    silver: 500,
    gold: 1500,
    platinum: 3500,
    diamond: 7000,
  },
}

export const DIVISION_METADATA: Record<DivisionTier, DivisionInfo> = {
  bronze: {
    tier: 'bronze',
    name_en: 'Bronze League',
    name_ar: 'الدوري البرونزي',
    minXp: 0,
    nextTierMinXp: 500,
    badgeColor: 'amber-600',
    bgGradient: 'from-amber-700/20 to-amber-900/30',
    borderColor: 'border-amber-600/30',
    textColor: 'text-amber-500',
    iconName: 'ShieldBronze',
  },
  silver: {
    tier: 'silver',
    name_en: 'Silver League',
    name_ar: 'الدوري الفضي',
    minXp: 500,
    nextTierMinXp: 1500,
    badgeColor: 'slate-300',
    bgGradient: 'from-slate-400/20 to-slate-600/30',
    borderColor: 'border-slate-400/30',
    textColor: 'text-slate-200',
    iconName: 'ShieldSilver',
  },
  gold: {
    tier: 'gold',
    name_en: 'Gold League',
    name_ar: 'الدوري الذهبي',
    minXp: 1500,
    nextTierMinXp: 3500,
    badgeColor: 'yellow-400',
    bgGradient: 'from-yellow-500/20 to-amber-600/30',
    borderColor: 'border-yellow-400/40',
    textColor: 'text-yellow-400',
    iconName: 'ShieldGold',
  },
  platinum: {
    tier: 'platinum',
    name_en: 'Platinum League',
    name_ar: 'الدوري البلاتيني',
    minXp: 3500,
    nextTierMinXp: 7000,
    badgeColor: 'cyan-400',
    bgGradient: 'from-cyan-500/20 to-blue-600/30',
    borderColor: 'border-cyan-400/40',
    textColor: 'text-cyan-300',
    iconName: 'ShieldPlatinum',
  },
  diamond: {
    tier: 'diamond',
    name_en: 'Diamond League',
    name_ar: 'الدوري الماسي',
    minXp: 7000,
    nextTierMinXp: null,
    badgeColor: 'purple-400',
    bgGradient: 'from-purple-500/20 to-pink-600/30',
    borderColor: 'border-purple-400/40',
    textColor: 'text-purple-300',
    iconName: 'ShieldDiamond',
  },
}

export const DIVISION_DEFINITIONS = DIVISION_METADATA

/**
 * Calculates student's current division tier and progress towards next tier
 */
export function calculateDivision(
  totalXp: number = 0,
  customRules: Partial<XpRulesConfig> = DEFAULT_XP_RULES
): DivisionProgress {
  const xp = Math.max(0, Number(totalXp) || 0)
  const thresholds = customRules.division_thresholds || DEFAULT_XP_RULES.division_thresholds

  let tier: DivisionTier = 'bronze'
  if (xp >= thresholds.diamond) {
    tier = 'diamond'
  } else if (xp >= thresholds.platinum) {
    tier = 'platinum'
  } else if (xp >= thresholds.gold) {
    tier = 'gold'
  } else if (xp >= thresholds.silver) {
    tier = 'silver'
  } else {
    tier = 'bronze'
  }

  const meta = DIVISION_METADATA[tier]
  const currentTierMin = thresholds[tier]
  let nextTierMin: number | null = null
  let progressPercent = 100
  let xpNeededForNext = 0

  if (tier === 'bronze') {
    nextTierMin = thresholds.silver
  } else if (tier === 'silver') {
    nextTierMin = thresholds.gold
  } else if (tier === 'gold') {
    nextTierMin = thresholds.platinum
  } else if (tier === 'platinum') {
    nextTierMin = thresholds.diamond
  }

  if (nextTierMin !== null) {
    const range = nextTierMin - currentTierMin
    const progressIntoTier = xp - currentTierMin
    progressPercent = Math.min(100, Math.max(0, Math.round((progressIntoTier / range) * 100)))
    xpNeededForNext = Math.max(0, nextTierMin - xp)
  }

  return {
    tier,
    name_en: meta.name_en,
    name_ar: meta.name_ar,
    totalXp: xp,
    currentTierMinXp: currentTierMin,
    nextTierMinXp: nextTierMin,
    progressPercent,
    xpNeededForNext,
    badgeColor: meta.badgeColor,
    bgGradient: meta.bgGradient,
    borderColor: meta.borderColor,
    textColor: meta.textColor,
    iconName: meta.iconName,
    isMaxTier: tier === 'diamond',
  }
}

/**
 * Returns division metadata info for a given XP amount
 */
export function getDivisionFromXp(
  xp: number,
  thresholds: XpRulesConfig['division_thresholds'] = DEFAULT_XP_RULES.division_thresholds
): DivisionInfo {
  const result = calculateDivision(xp, { division_thresholds: thresholds })
  return DIVISION_METADATA[result.tier]
}

/**
 * Calculates division progress details
 */
export function calculateDivisionProgress(
  xp: number,
  thresholds: XpRulesConfig['division_thresholds'] = DEFAULT_XP_RULES.division_thresholds
): {
  currentTier: DivisionInfo
  nextTier: DivisionInfo | null
  progressPercent: number
  xpInCurrentTier: number
  xpNeededForNextTier: number
} {
  const progress = calculateDivision(xp, { division_thresholds: thresholds })
  const currentTier = DIVISION_METADATA[progress.tier]
  const nextTier = progress.nextTierMinXp ? getDivisionFromXp(progress.nextTierMinXp, thresholds) : null
  const xpInCurrentTier = Math.max(0, progress.totalXp - progress.currentTierMinXp)

  return {
    currentTier,
    nextTier,
    progressPercent: progress.progressPercent,
    xpInCurrentTier,
    xpNeededForNextTier: progress.xpNeededForNext,
  }
}

export function formatXp(xp: number): string {
  return Number(xp || 0).toLocaleString()
}

export function getUserDivisionInfo(xp: number) {
  const result = calculateDivisionProgress(xp)
  return {
    tier: result.currentTier,
    nextTier: result.nextTier,
    progressPercent: result.progressPercent,
    xpInCurrentTier: result.xpInCurrentTier,
    xpNeededForNextTier: result.xpNeededForNextTier,
  }
}

/**
 * Computes XP earned from an activity
 */
export function computeActivityXp(
  activityType: string,
  details: {
    score?: number
    is_perfect?: boolean
    is_correct?: boolean
    upvote_count?: number
  } = {},
  rules: XpRulesConfig = DEFAULT_XP_RULES
): number {
  switch (activityType) {
    case 'lecture_complete':
      return rules.lecture_completion_xp
    case 'quiz_pass': {
      let xp = rules.quiz_pass_xp
      if (details.is_perfect || details.score === 100) {
        xp += rules.quiz_perfect_bonus_xp
      }
      return xp
    }
    case 'daily_challenge':
      return details.is_correct ? rules.daily_challenge_xp : 0
    case 'certificate_issued':
      return rules.certificate_issued_xp
    case 'discussion_upvote':
      return (details.upvote_count || 1) * rules.discussion_upvote_xp
    default:
      return 0
  }
}

/**
 * Circular SVG Progress Ring Math
 */
export function calculateSvgProgressRing({
  radius = 40,
  strokeWidth = 6,
  progressPercent = 0,
}: {
  radius?: number
  strokeWidth?: number
  progressPercent?: number
}): SvgProgressRingResult {
  if (radius <= 0 || strokeWidth < 0) {
    return {
      radius: Math.max(0, radius),
      strokeWidth: Math.max(0, strokeWidth),
      normalizedRadius: 0,
      circumference: 0,
      strokeDashoffset: 0,
      progressPercent: Math.min(100, Math.max(0, progressPercent)),
    }
  }

  const clamped = Math.min(100, Math.max(0, progressPercent))
  const normalizedRadius = Math.max(0, radius - strokeWidth / 2)
  const circumference = 2 * Math.PI * normalizedRadius
  const strokeDashoffset = circumference - (clamped / 100) * circumference

  return {
    radius,
    strokeWidth,
    normalizedRadius,
    circumference: Number(circumference.toFixed(3)),
    strokeDashoffset: Number(strokeDashoffset.toFixed(3)),
    progressPercent: clamped,
  }
}

/**
 * Filter and rank leaderboard entries
 */
export function computeLeaderboard({
  entries = [],
  scope = 'global',
  timeframe = 'weekly',
  userUniversity = null,
  courseId = null,
  currentUserId = null,
}: {
  entries?: LeaderboardEntry[]
  scope?: LeaderboardScope
  timeframe?: LeaderboardTimeframe
  userUniversity?: string | null
  courseId?: string | null
  currentUserId?: string | null
}): LeaderboardResult {
  let filtered = [...(entries || [])]

  // Apply scope filtering
  if (scope === 'university' && userUniversity) {
    filtered = filtered.filter(
      (e) => (e.university || '').trim().toLowerCase() === userUniversity.trim().toLowerCase()
    )
  } else if (scope === 'course' && courseId) {
    filtered = filtered.filter((e) => {
      if (e.course_id === courseId) return true
      const anyE = e as unknown as { enrolled_courses?: string[] }
      if (Array.isArray(anyE.enrolled_courses) && anyE.enrolled_courses.includes(courseId)) {
        return true
      }
      return false
    })
  }

  // Sort by appropriate timeframe XP descending
  const xpKey = timeframe === 'weekly' ? 'weekly_xp' : 'total_xp'
  filtered.sort((a, b) => (b[xpKey] || 0) - (a[xpKey] || 0))

  // Assign ranks
  const ranked = filtered.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    is_current_user: Boolean(currentUserId && entry.user_id === currentUserId),
  }))

  // Podium (Top 3)
  const podium = ranked.slice(0, 3)
  const remaining = ranked.slice(3)

  // Find current user position
  const currentUserEntry = ranked.find((e) => e.user_id === currentUserId) || null

  return {
    scope,
    timeframe,
    totalEntries: ranked.length,
    podium,
    remaining,
    allEntries: ranked,
    currentUserEntry,
  }
}

// ─── Persistence & Sync Engine ──────────────────────────────────────────────

const STORAGE_KEY_PREFIX = 'pharmacore_gamification_'

/**
 * Loads user gamification state with Supabase and localStorage fallback
 */
export async function getUserGamificationProfile(
  userId: string,
  userProfile?: UserProfile | null
): Promise<UserGamificationProfile> {
  const defaultProfile: UserGamificationProfile = {
    user_id: userId,
    total_xp: userProfile?.xp || 0,
    weekly_xp: 0,
    division: (userProfile?.division || calculateDivision(userProfile?.xp || 0).tier) as DivisionTier,
    current_streak: 0,
    longest_streak: 0,
    last_activity_date: new Date().toISOString().split('T')[0],
    badges_count: 0,
    certificates_count: 0,
    updated_at: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          ...defaultProfile,
          ...parsed,
          division: calculateDivision(parsed.total_xp || defaultProfile.total_xp).tier,
        }
      }
    } catch {
      // Ignore localStorage parse error
    }
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (!error && data) {
        const xp = data.total_xp || 0
        const profile: UserGamificationProfile = {
          user_id: data.user_id,
          total_xp: xp,
          weekly_xp: data.weekly_xp || 0,
          division: calculateDivision(xp).tier,
          current_streak: data.current_streak || 0,
          longest_streak: data.longest_streak || 0,
          last_activity_date: data.last_activity_date || null,
          badges_count: data.badges_count || 0,
          certificates_count: data.certificates_count || 0,
          updated_at: data.updated_at,
        }
        return profile
      }
    } catch {
      // Fallback
    }
  }

  return defaultProfile
}

/**
 * Awards XP to user, recalculates division, and saves state
 */
export async function awardUserXp(
  userId: string,
  xpGained: number,
  _activityType?: string
): Promise<{
  profile: UserGamificationProfile
  previousDivision: DivisionTier
  newDivision: DivisionTier
  didRankUp: boolean
}> {
  void _activityType
  const current = await getUserGamificationProfile(userId)
  const previousDivision = current.division
  const newTotalXp = Math.max(0, current.total_xp + xpGained)
  const newWeeklyXp = Math.max(0, current.weekly_xp + xpGained)
  const newDivision = calculateDivision(newTotalXp).tier
  const didRankUp = newDivision !== previousDivision

  const updated: UserGamificationProfile = {
    ...current,
    total_xp: newTotalXp,
    weekly_xp: newWeeklyXp,
    division: newDivision,
    updated_at: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(updated))
    } catch {
      // Ignore storage error
    }
  }

  if (supabase) {
    try {
      await supabase.from('user_gamification').upsert({
        user_id: userId,
        total_xp: newTotalXp,
        weekly_xp: newWeeklyXp,
        current_division: newDivision,
        updated_at: new Date().toISOString(),
      })
    } catch {
      // Ignore remote error
    }
  }

  return {
    profile: updated,
    previousDivision,
    newDivision,
    didRankUp,
  }
}

/**
 * Fetches leaderboard entries from live Supabase database for a given scope and timeframe
 */
export async function fetchLeaderboardEntries(options: {
  scope?: LeaderboardScope
  timeframe?: LeaderboardTimeframe
  userUniversity?: string | null
  courseId?: string | null
  currentUserId?: string | null
  currentUserProfile?: UserProfile | null
}): Promise<LeaderboardResult> {
  const { scope = 'global', timeframe = 'weekly', userUniversity, courseId, currentUserId, currentUserProfile } =
    options

  let entries: LeaderboardEntry[] = []

  // If Supabase is available, query remote active players
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_gamification')
        .select(`
          user_id,
          total_xp,
          weekly_xp,
          current_division,
          users:user_id (id, full_name, university, faculty)
        `)
        .order(timeframe === 'weekly' ? 'weekly_xp' : 'total_xp', { ascending: false })
        .limit(50)

      if (!error && data && data.length > 0) {
        interface RemoteLeaderboardRow {
          user_id: string
          total_xp?: number
          weekly_xp?: number
          current_division?: string
          users?: { full_name?: string | null; university?: string | null; faculty?: string | null } | { full_name?: string | null; university?: string | null; faculty?: string | null }[]
        }
        entries = (data as unknown as RemoteLeaderboardRow[]).map((item) => {
          const userObj = Array.isArray(item.users) ? item.users[0] : item.users
          const xp = item.total_xp || 0
          return {
            rank: 0,
            user_id: item.user_id,
            full_name: userObj?.full_name || 'Pharmacology Scholar',
            avatar_url: null,
            university: userObj?.university || 'University of Medical Sciences',
            faculty: userObj?.faculty || 'Faculty of Pharmacy',
            division: (item.current_division || calculateDivision(xp).tier) as DivisionTier,
            total_xp: xp,
            weekly_xp: item.weekly_xp || 0,
            streak_days: 0,
            badges_count: 0,
            certificates_count: 0,
            is_current_user: item.user_id === currentUserId,
          }
        })
      }
    } catch {
      // Fallback to empty
    }
  }

  // If user is logged in, ensure their entry is present if they have XP or are viewing their rank
  if (currentUserId) {
    const userGam = await getUserGamificationProfile(currentUserId, currentUserProfile)
    const existingIndex = entries.findIndex((e) => e.user_id === currentUserId)

    const userEntry: LeaderboardEntry = {
      rank: 0,
      user_id: currentUserId,
      full_name: currentUserProfile?.full_name || 'My Student Account',
      avatar_url: null,
      university: currentUserProfile?.university || userUniversity || undefined,
      faculty: currentUserProfile?.faculty || undefined,
      division: userGam.division,
      total_xp: userGam.total_xp,
      weekly_xp: userGam.weekly_xp,
      streak_days: userGam.current_streak,
      badges_count: userGam.badges_count,
      certificates_count: userGam.certificates_count,
      course_id: courseId || undefined,
      is_current_user: true,
    }

    if (existingIndex >= 0) {
      entries[existingIndex] = {
        ...entries[existingIndex],
        ...userEntry,
      }
    } else if (userGam.total_xp > 0) {
      entries.push(userEntry)
    }
  }

  return computeLeaderboard({
    entries,
    scope,
    timeframe,
    userUniversity,
    courseId,
    currentUserId,
  })
}
