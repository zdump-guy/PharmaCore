/**
 * Tier 2 - Feature 4: Study Streaks & Badges Boundary & Corner Cases
 * Tests edge cases: year-end transitions, leap years, historical activity, threshold boundaries.
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  getDaysDifference,
  recordUserActivity,
  evaluateMilestoneBadges
} from '../helpers/streak-engine.mjs';

export function register(runner) {
  runner.suite('Tier 2: Feature 4 - Study Streaks Boundaries', (test) => {
    test('T2.4.1: Year-end transition (Dec 31 to Jan 1) calculates exactly 1 day difference and increments streak', () => {
      const diff = getDaysDifference('2026-12-31', '2027-01-01');
      assert.strictEqual(diff, 1);

      const state = { current_streak: 5, longest_streak: 5, last_active_date: '2026-12-31' };
      const updated = recordUserActivity(state, '2027-01-01');
      assert.strictEqual(updated.current_streak, 6);
      assert.strictEqual(updated.longest_streak, 6);
      assert.strictEqual(updated.last_active_date, '2027-01-01');
    });

    test('T2.4.2: Leap year transition (Feb 28 -> Feb 29 -> Mar 01) maintains streak accurately', () => {
      let state = { current_streak: 10, longest_streak: 10, last_active_date: '2028-02-28' };
      state = recordUserActivity(state, '2028-02-29');
      assert.strictEqual(state.current_streak, 11);

      state = recordUserActivity(state, '2028-03-01');
      assert.strictEqual(state.current_streak, 12);
    });

    test('T2.4.3: Out-of-order historical activity (date earlier than last_active_date) does not reduce streak', () => {
      const state = { current_streak: 4, longest_streak: 4, last_active_date: '2026-08-10' };
      const res = recordUserActivity(state, '2026-08-08');
      assert.strictEqual(res.current_streak, 4);
      assert.strictEqual(res.last_active_date, '2026-08-10');
    });

    test('T2.4.4: 365-day inactivity gap resets streak to 1 while retaining longest streak', () => {
      const state = { current_streak: 45, longest_streak: 45, last_active_date: '2025-08-01' };
      const res = recordUserActivity(state, '2026-08-01');
      assert.strictEqual(res.current_streak, 1);
      assert.strictEqual(res.longest_streak, 45);
    });

    test('T2.4.5: Streak threshold boundaries for badges (2 -> none, 3 -> bronze, 6 -> bronze, 7 -> silver)', () => {
      // 2 days
      const b2 = evaluateMilestoneBadges({ currentStreak: 2 });
      assert.strictEqual(b2.length, 0);

      // 3 days
      const b3 = evaluateMilestoneBadges({ currentStreak: 3 });
      assert.strictEqual(b3.length, 1);
      assert.strictEqual(b3[0].id, 'streak_3');

      // 6 days (with bronze owned)
      const b6 = evaluateMilestoneBadges({ currentStreak: 6 }, ['streak_3']);
      assert.strictEqual(b6.length, 0);

      // 7 days (with bronze owned)
      const b7 = evaluateMilestoneBadges({ currentStreak: 7 }, ['streak_3']);
      assert.strictEqual(b7.length, 1);
      assert.strictEqual(b7[0].id, 'streak_7');
    });

    test('T2.4.6: Invalid activity date string throws validation error', () => {
      assert.throws(
        () => recordUserActivity(null, null),
        'activityDate must be a valid',
        'Should reject null date'
      );
    });
  });
}
