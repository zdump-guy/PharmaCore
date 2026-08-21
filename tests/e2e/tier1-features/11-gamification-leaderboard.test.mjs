/**
 * Tier 1 - Gamification, Division Leagues & Leaderboards Test Suite
 * Covers F4.1 (5-Tier Division League System),
 * F4.2 (Multi-Scope Leaderboards `/leaderboard`),
 * F4.3 (Circular SVG Progress Rings).
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  calculateDivision,
  computeActivityXp,
  computeLeaderboard,
  calculateSvgProgressRing,
  DEFAULT_XP_RULES,
  DIVISION_METADATA,
} from '../helpers/expansion-gamification-engine.mjs';

export function register(runner) {
  runner.suite('Tier 1: Feature 4.1 - 5-Tier Division League System', (test) => {
    test('T1.F4.1.1: Division calculation resolves Bronze tier for 0 to 499 XP', () => {
      const div0 = calculateDivision(0);
      assert.strictEqual(div0.tier, 'bronze');
      assert.strictEqual(div0.name_en, 'Bronze League');
      assert.strictEqual(div0.nextTierMinXp, 500);

      const div499 = calculateDivision(499);
      assert.strictEqual(div499.tier, 'bronze');
      assert.strictEqual(div499.xpNeededForNext, 1);
    });

    test('T1.F4.1.2: Division calculation promotes to Silver, Gold, Platinum, and Diamond tiers accurately', () => {
      assert.strictEqual(calculateDivision(500).tier, 'silver');
      assert.strictEqual(calculateDivision(1500).tier, 'gold');
      assert.strictEqual(calculateDivision(3500).tier, 'platinum');
      assert.strictEqual(calculateDivision(7000).tier, 'diamond');
      assert.strictEqual(calculateDivision(12000).tier, 'diamond');
    });

    test('T1.F4.1.3: Diamond tier identifies maximum rank without next tier threshold', () => {
      const diamond = calculateDivision(8500);
      assert.strictEqual(diamond.tier, 'diamond');
      assert.strictEqual(diamond.nextTierMinXp, null);
      assert.strictEqual(diamond.isMaxTier, true);
      assert.strictEqual(diamond.progressPercent, 100);
      assert.strictEqual(diamond.xpNeededForNext, 0);
    });

    test('T1.F4.1.4: XP scoring engine awards correct XP across all activity types', () => {
      const lectureXp = computeActivityXp('lecture_complete');
      assert.strictEqual(lectureXp, 50);

      const quizPassXp = computeActivityXp('quiz_pass', { score: 85, is_perfect: false });
      assert.strictEqual(quizPassXp, 100);

      const quizPerfectXp = computeActivityXp('quiz_pass', { score: 100, is_perfect: true });
      assert.strictEqual(quizPerfectXp, 150); // 100 + 50 bonus

      const dailyXp = computeActivityXp('daily_challenge', { is_correct: true });
      assert.strictEqual(dailyXp, 25);

      const certXp = computeActivityXp('certificate_issued');
      assert.strictEqual(certXp, 200);

      const upvoteXp = computeActivityXp('discussion_upvote', { upvote_count: 3 });
      assert.strictEqual(upvoteXp, 30);
    });

    test('T1.F4.1.5: Division badge metadata contains color tokens, gradients, and icon names', () => {
      Object.keys(DIVISION_METADATA).forEach((tierKey) => {
        const meta = DIVISION_METADATA[tierKey];
        assert.ok(meta.badgeColor);
        assert.ok(meta.bgGradient);
        assert.ok(meta.iconName);
      });
    });
  });

  runner.suite('Tier 1: Feature 4.2 - Multi-Scope Leaderboards (/leaderboard)', (test) => {
    const mockLeaderboardEntries = [
      { user_id: 'u1', full_name: 'Dr. Sarah', university: 'Cairo University', total_xp: 4200, weekly_xp: 350 },
      { user_id: 'u2', full_name: 'Ahmed Youssef', university: 'Ain Shams University', total_xp: 5100, weekly_xp: 120 },
      { user_id: 'u3', full_name: 'Nour El-Din', university: 'Cairo University', total_xp: 2800, weekly_xp: 480 },
      { user_id: 'u4', full_name: 'Mona Aly', university: 'Alexandria University', total_xp: 1900, weekly_xp: 90 },
    ];

    test('T1.F4.2.1: Global scope ranks entries by total_xp descending for all-time timeframe', () => {
      const result = computeLeaderboard({
        entries: mockLeaderboardEntries,
        scope: 'global',
        timeframe: 'all_time',
      });

      assert.strictEqual(result.allEntries[0].user_id, 'u2'); // 5100 XP
      assert.strictEqual(result.allEntries[0].rank, 1);
      assert.strictEqual(result.allEntries[1].user_id, 'u1'); // 4200 XP
      assert.strictEqual(result.allEntries[1].rank, 2);
    });

    test('T1.F4.2.2: Weekly timeframe ranks entries by weekly_xp descending', () => {
      const result = computeLeaderboard({
        entries: mockLeaderboardEntries,
        scope: 'global',
        timeframe: 'weekly',
      });

      assert.strictEqual(result.allEntries[0].user_id, 'u3'); // 480 weekly XP
      assert.strictEqual(result.allEntries[0].rank, 1);
      assert.strictEqual(result.allEntries[1].user_id, 'u1'); // 350 weekly XP
    });

    test('T1.F4.2.3: University scope filters leaderboard strictly to students from that institution', () => {
      const result = computeLeaderboard({
        entries: mockLeaderboardEntries,
        scope: 'university',
        timeframe: 'all_time',
        userUniversity: 'Cairo University',
      });

      assert.strictEqual(result.totalEntries, 2);
      assert.ok(result.allEntries.every((e) => e.university === 'Cairo University'));
    });

    test('T1.F4.2.4: Podium isolates top 3 students while remaining students populate table', () => {
      const result = computeLeaderboard({
        entries: mockLeaderboardEntries,
        scope: 'global',
        timeframe: 'all_time',
      });

      assert.strictEqual(result.podium.length, 3);
      assert.strictEqual(result.remaining.length, 1);
      assert.strictEqual(result.remaining[0].user_id, 'u4');
    });

    test('T1.F4.2.5: Identifies current user entry and pins rank position', () => {
      const result = computeLeaderboard({
        entries: mockLeaderboardEntries,
        scope: 'global',
        timeframe: 'all_time',
        currentUserId: 'u3',
      });

      assert.ok(result.currentUserEntry);
      assert.strictEqual(result.currentUserEntry.user_id, 'u3');
      assert.strictEqual(result.currentUserEntry.rank, 3);
      assert.strictEqual(result.currentUserEntry.is_current_user, true);
    });
  });

  runner.suite('Tier 1: Feature 4.3 - Circular SVG Progress Rings', (test) => {
    test('T1.F4.3.1: Calculates exact circle circumference from radius and stroke width', () => {
      const ring = calculateSvgProgressRing({ radius: 50, strokeWidth: 8, progressPercent: 0 });
      // normalizedRadius = 50 - 4 = 46. Circumference = 2 * PI * 46 = 289.027
      assert.almostEqual(ring.circumference, 289.027, 0.01);
      assert.almostEqual(ring.strokeDashoffset, 289.027, 0.01); // 0% progress
    });

    test('T1.F4.3.2: 50% progress calculates strokeDashoffset at exactly half circumference', () => {
      const ring = calculateSvgProgressRing({ radius: 50, strokeWidth: 8, progressPercent: 50 });
      assert.almostEqual(ring.strokeDashoffset, ring.circumference / 2, 0.01);
    });

    test('T1.F4.3.3: 100% progress calculates strokeDashoffset at 0', () => {
      const ring = calculateSvgProgressRing({ radius: 50, strokeWidth: 8, progressPercent: 100 });
      assert.strictEqual(ring.strokeDashoffset, 0);
    });

    test('T1.F4.3.4: Progress percentage is clamped between 0% and 100%', () => {
      const underflow = calculateSvgProgressRing({ radius: 40, progressPercent: -20 });
      assert.strictEqual(underflow.progressPercent, 0);

      const overflow = calculateSvgProgressRing({ radius: 40, progressPercent: 150 });
      assert.strictEqual(overflow.progressPercent, 100);
    });

    test('T1.F4.3.5: SVG progress ring supports custom radius and stroke configurations for badges and dashboard widgets', () => {
      const miniBadge = calculateSvgProgressRing({ radius: 20, strokeWidth: 3, progressPercent: 75 });
      assert.strictEqual(miniBadge.radius, 20);
      assert.strictEqual(miniBadge.strokeWidth, 3);
      assert.almostEqual(miniBadge.strokeDashoffset, miniBadge.circumference * 0.25, 0.01);
    });
  });
}
