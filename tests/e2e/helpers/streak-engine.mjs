/**
 * Study Streak & Milestone Badges Engine
 * Conforms to ORIGINAL_REQUEST § R3 and PROJECT.md § Milestone 4
 */

export const BADGE_DEFINITIONS = [
  { id: 'streak_3', name: 'Bronze Scholar', description: 'Maintained a 3-day study streak', category: 'streak', threshold: 3 },
  { id: 'streak_7', name: 'Silver Scholar', description: 'Maintained a 7-day study streak', category: 'streak', threshold: 7 },
  { id: 'streak_30', name: 'Gold Scholar', description: 'Maintained a 30-day study streak', category: 'streak', threshold: 30 },
  { id: 'course_mastery', name: 'Course Mastery', description: 'Completed 100% of course lectures and passed final quiz', category: 'mastery' },
  { id: 'perfect_score', name: 'Perfect Score', description: 'Achieved 100% score on a pharmacology assessment', category: 'performance' }
];

/**
 * Calculates calendar day difference between two dates (YYYY-MM-DD)
 * @param {string} dateA - Earlier or comparison date (YYYY-MM-DD)
 * @param {string} dateB - Later or current date (YYYY-MM-DD)
 * @returns {number} Integer day difference (dateB - dateA in days)
 */
export function getDaysDifference(dateA, dateB) {
  const d1 = new Date(dateA);
  const d2 = new Date(dateB);
  // Strip time components to compare calendar days
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Updates a user's daily study streak based on a new activity event
 *
 * Rules:
 * 1. If first activity ever (last_active_date is null): current_streak = 1, longest_streak = 1.
 * 2. If activity occurs on the same calendar day (diff === 0): streak does not change.
 * 3. If activity occurs on the consecutive calendar day (diff === 1): current_streak += 1, longest_streak = max(longest_streak, current_streak).
 * 4. If activity occurs after a gap > 1 day (diff > 1): streak resets to 1, longest_streak preserved.
 *
 * @param {Object} currentStreakRecord - { current_streak: number, longest_streak: number, last_active_date: string|null }
 * @param {string} activityDate - YYYY-MM-DD date string of the activity
 * @returns {Object} Updated streak record
 */
export function recordUserActivity(currentStreakRecord, activityDate) {
  if (!activityDate || typeof activityDate !== 'string') {
    throw new Error('activityDate must be a valid YYYY-MM-DD string');
  }

  const record = currentStreakRecord || {
    current_streak: 0,
    longest_streak: 0,
    last_active_date: null
  };

  const { current_streak, longest_streak, last_active_date } = record;

  if (!last_active_date) {
    return {
      current_streak: 1,
      longest_streak: Math.max(1, longest_streak || 0),
      last_active_date: activityDate
    };
  }

  const diff = getDaysDifference(last_active_date, activityDate);

  if (diff < 0) {
    // Activity occurred in the past relative to last recorded active date; don't roll back streak
    return {
      current_streak,
      longest_streak,
      last_active_date
    };
  }

  if (diff === 0) {
    // Same day activity; streak remains unchanged
    return {
      current_streak,
      longest_streak,
      last_active_date
    };
  }

  if (diff === 1) {
    // Consecutive day activity! Increment streak
    const newStreak = current_streak + 1;
    const newLongest = Math.max(longest_streak, newStreak);
    return {
      current_streak: newStreak,
      longest_streak: newLongest,
      last_active_date: activityDate
    };
  }

  // Gap > 1 day; streak resets to 1
  return {
    current_streak: 1,
    longest_streak: Math.max(longest_streak, 1),
    last_active_date: activityDate
  };
}

/**
 * Evaluates all earned badges for a student given current stats
 * @param {Object} stats - { currentStreak: number, longestStreak: number, courseCompleted: boolean, perfectScore: boolean }
 * @param {string[]} existingBadgeIds - List of badge IDs already awarded to user
 * @returns {Object[]} List of new badges to award
 */
export function evaluateMilestoneBadges(stats, existingBadgeIds = []) {
  const existingSet = new Set(existingBadgeIds);
  const newlyAwarded = [];

  const streak = Math.max(stats.currentStreak || 0, stats.longestStreak || 0);

  // Check streak badges
  if (streak >= 3 && !existingSet.has('streak_3')) {
    newlyAwarded.push(BADGE_DEFINITIONS.find(b => b.id === 'streak_3'));
  }
  if (streak >= 7 && !existingSet.has('streak_7')) {
    newlyAwarded.push(BADGE_DEFINITIONS.find(b => b.id === 'streak_7'));
  }
  if (streak >= 30 && !existingSet.has('streak_30')) {
    newlyAwarded.push(BADGE_DEFINITIONS.find(b => b.id === 'streak_30'));
  }

  // Check mastery badge
  if (stats.courseCompleted && !existingSet.has('course_mastery')) {
    newlyAwarded.push(BADGE_DEFINITIONS.find(b => b.id === 'course_mastery'));
  }

  // Check perfect score badge
  if (stats.perfectScore && !existingSet.has('perfect_score')) {
    newlyAwarded.push(BADGE_DEFINITIONS.find(b => b.id === 'perfect_score'));
  }

  return newlyAwarded;
}
