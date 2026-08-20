/**
 * Tier 1 - Feature 4: Study Streaks & Milestone Badges
 * Verifies daily streak increments, streak resets on missed days, and badge awards.
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  recordUserActivity,
  evaluateMilestoneBadges,
  BADGE_DEFINITIONS
} from '../helpers/streak-engine.mjs';

export function register(runner) {
  runner.suite('Tier 1: Feature 4 - Study Streaks & Milestone Badges', (test) => {
    test('T1.4.1: Initial user activity initializes streak to 1 and records last active date', () => {
      const initial = recordUserActivity(null, '2026-08-01');
      assert.strictEqual(initial.current_streak, 1);
      assert.strictEqual(initial.longest_streak, 1);
      assert.strictEqual(initial.last_active_date, '2026-08-01');
    });

    test('T1.4.2: Consecutive day activity increments current_streak and updates longest_streak', () => {
      let state = { current_streak: 1, longest_streak: 1, last_active_date: '2026-08-01' };
      state = recordUserActivity(state, '2026-08-02');
      assert.strictEqual(state.current_streak, 2);
      assert.strictEqual(state.longest_streak, 2);

      state = recordUserActivity(state, '2026-08-03');
      assert.strictEqual(state.current_streak, 3);
      assert.strictEqual(state.longest_streak, 3);
    });

    test('T1.4.3: Multiple activities on the same calendar day do not increment streak count', () => {
      let state = { current_streak: 2, longest_streak: 2, last_active_date: '2026-08-02' };
      state = recordUserActivity(state, '2026-08-02');
      assert.strictEqual(state.current_streak, 2);
      assert.strictEqual(state.longest_streak, 2);
      assert.strictEqual(state.last_active_date, '2026-08-02');
    });

    test('T1.4.4: Inactivity gap greater than 1 day resets current_streak to 1 but retains longest_streak', () => {
      let state = { current_streak: 5, longest_streak: 5, last_active_date: '2026-08-01' };
      // User returns on 2026-08-04 (gap of 3 days)
      state = recordUserActivity(state, '2026-08-04');
      assert.strictEqual(state.current_streak, 1);
      assert.strictEqual(state.longest_streak, 5);
      assert.strictEqual(state.last_active_date, '2026-08-04');
    });

    test('T1.4.5: Streak milestone badges awarded at 3-day, 7-day, and 30-day milestones', () => {
      // 3-day streak
      const badges3 = evaluateMilestoneBadges({ currentStreak: 3, longestStreak: 3 }, []);
      assert.strictEqual(badges3.length, 1);
      assert.strictEqual(badges3[0].id, 'streak_3');
      assert.strictEqual(badges3[0].name, 'Bronze Scholar');

      // 7-day streak with bronze already owned
      const badges7 = evaluateMilestoneBadges({ currentStreak: 7, longestStreak: 7 }, ['streak_3']);
      assert.strictEqual(badges7.length, 1);
      assert.strictEqual(badges7[0].id, 'streak_7');
      assert.strictEqual(badges7[0].name, 'Silver Scholar');

      // 30-day streak
      const badges30 = evaluateMilestoneBadges({ currentStreak: 30, longestStreak: 30 }, ['streak_3', 'streak_7']);
      assert.strictEqual(badges30.length, 1);
      assert.strictEqual(badges30[0].id, 'streak_30');
      assert.strictEqual(badges30[0].name, 'Gold Scholar');
    });

    test('T1.4.6: Course mastery and perfect score badges awarded correctly without duplicates', () => {
      const badges = evaluateMilestoneBadges(
        { currentStreak: 1, longestStreak: 1, courseCompleted: true, perfectScore: true },
        []
      );
      assert.strictEqual(badges.length, 2);
      assert.ok(badges.some(b => b.id === 'course_mastery'));
      assert.ok(badges.some(b => b.id === 'perfect_score'));

      // If already awarded, return empty array
      const existing = evaluateMilestoneBadges(
        { currentStreak: 1, longestStreak: 1, courseCompleted: true, perfectScore: true },
        ['course_mastery', 'perfect_score']
      );
      assert.strictEqual(existing.length, 0);
    });
  });
}
