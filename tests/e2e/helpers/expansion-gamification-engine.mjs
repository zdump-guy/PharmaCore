/**
 * Gamification & Division League Engine for PharmaCore Expansion Suite Tests
 * Implements opaque-box models for 5-tier Division Leagues, XP calculations,
 * Multi-Scope Leaderboards, Top 3 Podium, and Circular SVG Progress Rings.
 */

export const DEFAULT_XP_RULES = {
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
};

export const DIVISION_METADATA = {
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
};

/**
 * Calculates student's current division tier and progress towards next tier
 */
export function calculateDivision(totalXp = 0, customRules = DEFAULT_XP_RULES) {
  const xp = Math.max(0, totalXp);
  const thresholds = customRules.division_thresholds || DEFAULT_XP_RULES.division_thresholds;

  let tier = 'bronze';
  if (xp >= thresholds.diamond) {
    tier = 'diamond';
  } else if (xp >= thresholds.platinum) {
    tier = 'platinum';
  } else if (xp >= thresholds.gold) {
    tier = 'gold';
  } else if (xp >= thresholds.silver) {
    tier = 'silver';
  } else {
    tier = 'bronze';
  }

  const meta = DIVISION_METADATA[tier];
  const currentTierMin = thresholds[tier];
  let nextTierMin = null;
  let progressPercent = 100;
  let xpNeededForNext = 0;

  if (tier === 'bronze') {
    nextTierMin = thresholds.silver;
  } else if (tier === 'silver') {
    nextTierMin = thresholds.gold;
  } else if (tier === 'gold') {
    nextTierMin = thresholds.platinum;
  } else if (tier === 'platinum') {
    nextTierMin = thresholds.diamond;
  }

  if (nextTierMin !== null) {
    const range = nextTierMin - currentTierMin;
    const progressIntoTier = xp - currentTierMin;
    progressPercent = Math.min(100, Math.max(0, Math.round((progressIntoTier / range) * 100)));
    xpNeededForNext = Math.max(0, nextTierMin - xp);
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
  };
}

/**
 * Computes XP earned from an activity
 */
export function computeActivityXp(activityType, details = {}, rules = DEFAULT_XP_RULES) {
  switch (activityType) {
    case 'lecture_complete':
      return rules.lecture_completion_xp;
    case 'quiz_pass': {
      let xp = rules.quiz_pass_xp;
      if (details.is_perfect || details.score === 100) {
        xp += rules.quiz_perfect_bonus_xp;
      }
      return xp;
    }
    case 'daily_challenge':
      return details.is_correct ? rules.daily_challenge_xp : 0;
    case 'certificate_issued':
      return rules.certificate_issued_xp;
    case 'discussion_upvote':
      return (details.upvote_count || 1) * rules.discussion_upvote_xp;
    default:
      return 0;
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
}) {
  let filtered = [...entries];

  // Apply scope filtering
  if (scope === 'university' && userUniversity) {
    filtered = filtered.filter((e) => e.university === userUniversity);
  } else if (scope === 'course' && courseId) {
    filtered = filtered.filter((e) => e.course_id === courseId || e.enrolled_courses?.includes(courseId));
  }

  // Sort by appropriate timeframe XP descending
  const xpKey = timeframe === 'weekly' ? 'weekly_xp' : 'total_xp';
  filtered.sort((a, b) => (b[xpKey] || 0) - (a[xpKey] || 0));

  // Assign ranks
  const ranked = filtered.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    is_current_user: entry.user_id === currentUserId,
  }));

  // Podium (Top 3)
  const podium = ranked.slice(0, 3);
  const remaining = ranked.slice(3);

  // Find current user position
  const currentUserEntry = ranked.find((e) => e.user_id === currentUserId) || null;

  return {
    scope,
    timeframe,
    totalEntries: ranked.length,
    podium,
    remaining,
    allEntries: ranked,
    currentUserEntry,
  };
}

/**
 * Circular SVG Progress Ring Math
 */
export function calculateSvgProgressRing({
  radius = 40,
  strokeWidth = 6,
  progressPercent = 0,
}) {
  const clamped = Math.min(100, Math.max(0, progressPercent));
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return {
    radius,
    strokeWidth,
    normalizedRadius,
    circumference: Number(circumference.toFixed(3)),
    strokeDashoffset: Number(strokeDashoffset.toFixed(3)),
    progressPercent: clamped,
  };
}
