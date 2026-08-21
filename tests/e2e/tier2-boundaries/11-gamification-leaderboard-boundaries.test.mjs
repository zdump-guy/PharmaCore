/**
 * Tier 2 - Gamification, Divisions & Progress Rings Boundaries Test Suite
 * Covers F4.1 (Division Threshold Exact Boundaries),
 * F4.2 (Leaderboard Empty/Tie Boundaries),
 * F4.3 (Circular SVG Geometry Boundaries).
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  calculateDivision,
  computeActivityXp,
  computeLeaderboard,
  calculateSvgProgressRing,
  DEFAULT_XP_RULES,
} from '../helpers/expansion-gamification-engine.mjs';

export function register(runner) {
  runner.suite('Tier 2: Feature 4.1 - Division Threshold Boundaries', (test) => {
    test('T2.F4.1.1: Exact threshold 499 XP vs 500 XP transitions strictly between Bronze and Silver', () => {
      const b = calculateDivision(499);
      assert.strictEqual(b.tier, 'bronze');
      assert.strictEqual(b.xpNeededForNext, 1);

      const s = calculateDivision(500);
      assert.strictEqual(s.tier, 'silver');
      assert.strictEqual(s.progressPercent, 0);
      assert.strictEqual(s.xpNeededForNext, 1000);
    });

    test('T2.F4.1.2: Exact threshold 1499 XP vs 1500 XP transitions strictly between Silver and Gold', () => {
      const s = calculateDivision(1499);
      assert.strictEqual(s.tier, 'silver');
      assert.strictEqual(s.xpNeededForNext, 1);

      const g = calculateDivision(1500);
      assert.strictEqual(g.tier, 'gold');
      assert.strictEqual(g.progressPercent, 0);
      assert.strictEqual(g.xpNeededForNext, 2000);
    });

    test('T2.F4.1.3: Exact threshold 3499 XP vs 3500 XP transitions strictly between Gold and Platinum', () => {
      const g = calculateDivision(3499);
      assert.strictEqual(g.tier, 'gold');
      assert.strictEqual(g.xpNeededForNext, 1);

      const p = calculateDivision(3500);
      assert.strictEqual(p.tier, 'platinum');
      assert.strictEqual(p.progressPercent, 0);
      assert.strictEqual(p.xpNeededForNext, 3500);
    });

    test('T2.F4.1.4: Exact threshold 6999 XP vs 7000 XP transitions strictly between Platinum and Diamond', () => {
      const p = calculateDivision(6999);
      assert.strictEqual(p.tier, 'platinum');
      assert.strictEqual(p.xpNeededForNext, 1);

      const d = calculateDivision(7000);
      assert.strictEqual(d.tier, 'diamond');
      assert.strictEqual(d.isMaxTier, true);
    });

    test('T2.F4.1.5: Negative total XP is clamped to 0 and evaluates to Bronze 0% progress', () => {
      const neg = calculateDivision(-150);
      assert.strictEqual(neg.tier, 'bronze');
      assert.strictEqual(neg.totalXp, 0);
      assert.strictEqual(neg.progressPercent, 0);
    });
  });

  runner.suite('Tier 2: Feature 4.2 - Leaderboard Boundaries', (test) => {
    test('T2.F4.2.1: Empty leaderboard entries array returns 0 totalEntries, empty podium, and null user entry', () => {
      const res = computeLeaderboard({
        entries: [],
        scope: 'global',
        timeframe: 'all_time',
        currentUserId: 'u1',
      });
      assert.strictEqual(res.totalEntries, 0);
      assert.strictEqual(res.podium.length, 0);
      assert.strictEqual(res.remaining.length, 0);
      assert.strictEqual(res.currentUserEntry, null);
    });

    test('T2.F4.2.2: Single entry leaderboard places lone user on podium at Rank 1', () => {
      const res = computeLeaderboard({
        entries: [{ user_id: 'u1', full_name: 'Dr. Sarah', total_xp: 500 }],
        scope: 'global',
        timeframe: 'all_time',
      });
      assert.strictEqual(res.totalEntries, 1);
      assert.strictEqual(res.podium.length, 1);
      assert.strictEqual(res.podium[0].rank, 1);
      assert.strictEqual(res.remaining.length, 0);
    });

    test('T2.F4.2.3: Tied XP scores assign deterministic ranks without crashing', () => {
      const entries = [
        { user_id: 'u1', full_name: 'Student A', total_xp: 1000 },
        { user_id: 'u2', full_name: 'Student B', total_xp: 1000 },
      ];
      const res = computeLeaderboard({ entries, scope: 'global', timeframe: 'all_time' });
      assert.strictEqual(res.totalEntries, 2);
      assert.strictEqual(res.allEntries[0].rank, 1);
      assert.strictEqual(res.allEntries[1].rank, 2);
    });

    test('T2.F4.2.4: Non-matching university filter returns 0 entries safely', () => {
      const entries = [{ user_id: 'u1', university: 'Cairo University', total_xp: 1000 }];
      const res = computeLeaderboard({
        entries,
        scope: 'university',
        userUniversity: 'Alexandria University',
      });
      assert.strictEqual(res.totalEntries, 0);
    });

    test('T2.F4.2.5: User not in entries returns null currentUserEntry without errors', () => {
      const entries = [{ user_id: 'u1', total_xp: 100 }];
      const res = computeLeaderboard({ entries, currentUserId: 'unknown_user_99' });
      assert.strictEqual(res.currentUserEntry, null);
    });
  });

  runner.suite('Tier 2: Feature 4.3 - Circular SVG Math Boundaries', (test) => {
    test('T2.F4.3.1: Radius 0 calculation returns 0 circumference without throwing', () => {
      const ring = calculateSvgProgressRing({ radius: 0, strokeWidth: 0, progressPercent: 50 });
      assert.strictEqual(ring.circumference, 0);
      assert.strictEqual(ring.strokeDashoffset, 0);
    });

    test('T2.F4.3.2: Extremely large radius (e.g. 1000px) calculates precise circumference', () => {
      const ring = calculateSvgProgressRing({ radius: 1000, strokeWidth: 20, progressPercent: 25 });
      // normalizedRadius = 990. Circumference = 2 * PI * 990 = 6220.353
      assert.almostEqual(ring.circumference, 6220.353, 0.01);
      assert.almostEqual(ring.strokeDashoffset, 6220.353 * 0.75, 0.01);
    });

    test('T2.F4.3.3: Negative progress percent is clamped to 0%', () => {
      const ring = calculateSvgProgressRing({ radius: 50, progressPercent: -999 });
      assert.strictEqual(ring.progressPercent, 0);
      assert.strictEqual(ring.strokeDashoffset, ring.circumference);
    });

    test('T2.F4.3.4: Progress percent > 100% is clamped to 100%', () => {
      const ring = calculateSvgProgressRing({ radius: 50, progressPercent: 500 });
      assert.strictEqual(ring.progressPercent, 100);
      assert.strictEqual(ring.strokeDashoffset, 0);
    });

    test('T2.F4.3.5: Fractional progress percent (33.33%) calculates precise float offset', () => {
      const ring = calculateSvgProgressRing({ radius: 50, strokeWidth: 10, progressPercent: 33.33 });
      assert.strictEqual(ring.progressPercent, 33.33);
      assert.almostEqual(ring.strokeDashoffset, ring.circumference * (1 - 0.3333), 0.1);
    });
  });
}
