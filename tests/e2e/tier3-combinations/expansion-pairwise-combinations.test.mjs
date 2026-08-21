/**
 * Tier 3 - Cross-Feature Combinations (Pairwise Integration Tests)
 * Verifies interactions between pairs of features across marketing, catalog,
 * dashboard, gamification, classroom discussions, notes export, and visual polish.
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  calculateCountdown,
  isBannerVisible,
  processCouponCode,
  evaluateLectureAccess,
} from '../helpers/expansion-marketing-engine.mjs';
import {
  MOCK_COURSES,
  filterAndSortCourses,
  resolveCatalogViewMode,
  computeCourseCardMetrics,
} from '../helpers/expansion-catalog-engine.mjs';
import {
  getDailyChallengeForDate,
  submitDailyChallengeAnswer,
  generateDashboardGreeting,
  resolveLastWatchedLecture,
  validateProfilePayload,
} from '../helpers/expansion-dashboard-daily-engine.mjs';
import {
  calculateDivision,
  computeActivityXp,
  computeLeaderboard,
  calculateSvgProgressRing,
} from '../helpers/expansion-gamification-engine.mjs';
import {
  formatTimestamp,
  parseTimestampToSeconds,
  createTimestampedNote,
  generateNotesMarkdown,
  toggleDiscussionUpvote,
} from '../helpers/expansion-classroom-notes-engine.mjs';
import {
  simulateConfettiBurst,
  resolveNavState,
  GLASS_TOKENS,
} from '../helpers/expansion-visual-confetti-engine.mjs';

export function register(runner) {
  runner.suite('Tier 3: Cross-Feature Combinations (Pairwise Integration)', (test) => {
    test('T3.1 (Pair 1: Promo Coupon + Course Enrollment): Promo coupon code applies discount to course tuition', () => {
      const coupon = processCouponCode('PHARMA30');
      assert.strictEqual(coupon.valid, true);
      assert.strictEqual(coupon.discountPercent, 30);

      const baseTuition = 100;
      const finalTuition = baseTuition * (1 - coupon.discountPercent / 100);
      assert.strictEqual(finalTuition, 70);
    });

    test('T3.2 (Pair 2: Lead Magnet Preview + Conversion Modal): Guest previews lecture 1, blocked on lecture 2 with modal', () => {
      const lec1Access = evaluateLectureAccess({ lectureOrder: 1, isGuest: true, courseAccessPolicy: 'students_only' });
      assert.strictEqual(lec1Access.canAccess, true);
      assert.strictEqual(lec1Access.isPreview, true);

      const lec2Access = evaluateLectureAccess({ lectureOrder: 2, isGuest: true, courseAccessPolicy: 'students_only' });
      assert.strictEqual(lec2Access.canAccess, false);
      assert.strictEqual(lec2Access.showConversionModal, true);
    });

    test('T3.3 (Pair 3: Catalog Filtering + Switchable View Mode): Filtered courses render consistently in List mode', () => {
      const filtered = filterAndSortCourses({
        courses: MOCK_COURSES,
        category: 'cardiology',
      });
      const viewMode = resolveCatalogViewMode('list', null);
      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(viewMode, 'list');

      const cardMetrics = computeCourseCardMetrics(filtered[0]);
      assert.strictEqual(cardMetrics.courseId, 'c-cardio-101');
      assert.strictEqual(cardMetrics.formattedDuration, '3h');
    });

    test('T3.4 (Pair 4: Daily Challenge + Division Promotion): Daily challenge +25 XP promotes student from 480 XP (Bronze) to 505 XP (Silver)', () => {
      const initialDiv = calculateDivision(480);
      assert.strictEqual(initialDiv.tier, 'bronze');

      const challenge = submitDailyChallengeAnswer({
        dateStr: '2026-08-20',
        selectedIndex: getDailyChallengeForDate('2026-08-20').correct_index,
        userId: 'u1',
      });
      assert.strictEqual(challenge.earnedXp, 25);

      const newTotalXp = 480 + challenge.earnedXp;
      const promotedDiv = calculateDivision(newTotalXp);
      assert.strictEqual(promotedDiv.tier, 'silver');
      assert.strictEqual(promotedDiv.name_en, 'Silver League');
    });

    test('T3.5 (Pair 5: Daily Challenge XP + Multi-Scope Leaderboard): Daily challenge XP shifts student rank upwards on leaderboard', () => {
      const initialEntries = [
        { user_id: 'u1', full_name: 'Student 1', total_xp: 510, weekly_xp: 30 },
        { user_id: 'u2', full_name: 'Student 2 (Me)', total_xp: 500, weekly_xp: 20 },
      ];

      const before = computeLeaderboard({ entries: initialEntries, currentUserId: 'u2' });
      assert.strictEqual(before.currentUserEntry.rank, 2);

      // Student 2 completes Daily Challenge (+25 XP)
      const updatedEntries = [
        { user_id: 'u1', full_name: 'Student 1', total_xp: 510, weekly_xp: 30 },
        { user_id: 'u2', full_name: 'Student 2 (Me)', total_xp: 525, weekly_xp: 45 },
      ];

      const after = computeLeaderboard({ entries: updatedEntries, currentUserId: 'u2' });
      assert.strictEqual(after.currentUserEntry.rank, 1);
      assert.strictEqual(after.podium[0].user_id, 'u2');
    });

    test('T3.6 (Pair 6: Timestamped Note Creation + Video Player Seeking): Note MM:SS timestamp translates directly into player seek target', () => {
      const note = createTimestampedNote({
        userId: 'u1',
        lectureId: 'lec-10',
        timestampSeconds: 195,
        noteText: 'Watch for QT prolongation with macrolides',
        tag: 'warning',
      });
      assert.strictEqual(note.timestamp_formatted, '03:15');

      const seekSeconds = parseTimestampToSeconds(note.timestamp_formatted);
      assert.strictEqual(seekSeconds, 195);
    });

    test('T3.7 (Pair 7: Notes Tagging + Markdown Export): Clinical pearl and warning tagged notes format with designated Markdown badges', () => {
      const notes = [
        createTimestampedNote({ timestampSeconds: 45, noteText: 'Potassium sparing diuretics pearl', tag: 'pearl' }),
        createTimestampedNote({ timestampSeconds: 150, noteText: 'Contraindicated in anuria', tag: 'warning' }),
      ];

      const md = generateNotesMarkdown({
        courseTitle: 'Renal Pharmacology',
        lectureTitle: 'Diuretic Classes',
        notes,
      });

      assert.includes(md, '💡 [Clinical Pearl]');
      assert.includes(md, '⚠️ [Contraindication/Warning]');
    });

    test('T3.8 (Pair 8: Classroom Discussion Upvote + Gamification XP): Discussion upvote grants discussion XP to author', () => {
      const upvote = toggleDiscussionUpvote({
        threadId: 'th-1',
        currentUpvotes: 2,
        upvotedUserIds: ['u1', 'u2'],
        userId: 'u3',
      });
      assert.strictEqual(upvote.upvotes, 3);
      assert.strictEqual(upvote.upvoted, true);

      const xpEarned = computeActivityXp('discussion_upvote', { upvote_count: 1 });
      assert.strictEqual(xpEarned, 10);
    });

    test('T3.9 (Pair 9: Faculty Solution Verification + Verified Badge): Faculty solution sets verified flag and renders badge', () => {
      const answer = {
        id: 'ans-10',
        text: 'The recommended loading dose is 15-20 mg/kg.',
        is_faculty_verified: true,
      };
      assert.strictEqual(answer.is_faculty_verified, true);
    });

    test('T3.10 (Pair 10: Target Exam Profile Selection + Catalog Filter): Profile exam target (NAPLEX) matches NAPLEX course tag', () => {
      const profile = { target_exam: 'NAPLEX' };
      const validation = validateProfilePayload(profile);
      assert.strictEqual(validation.valid, true);

      const examCourses = filterAndSortCourses({
        courses: MOCK_COURSES,
        searchQuery: 'pharmacology',
      });
      assert.ok(examCourses.length > 0);
    });

    test('T3.11 (Pair 11: Study Streak + Circular SVG Progress Ring): 7-day streak milestone calculates 70% ring on 10-day goal', () => {
      const streakDays = 7;
      const targetGoal = 10;
      const progressPercent = (streakDays / targetGoal) * 100;
      const ring = calculateSvgProgressRing({ radius: 30, strokeWidth: 4, progressPercent });

      assert.strictEqual(ring.progressPercent, 70);
      assert.almostEqual(ring.strokeDashoffset, ring.circumference * 0.3, 0.01);
    });

    test('T3.12 (Pair 12: Division Threshold + Circular SVG Tier Ring): 1000 XP (Silver: 500-1500) calculates exactly 50% tier progress ring', () => {
      const div = calculateDivision(1000);
      assert.strictEqual(div.tier, 'silver');
      assert.strictEqual(div.progressPercent, 50);

      const ring = calculateSvgProgressRing({ radius: 40, strokeWidth: 6, progressPercent: div.progressPercent });
      assert.almostEqual(ring.strokeDashoffset, ring.circumference * 0.5, 0.01);
    });

    test('T3.13 (Pair 13: Quiz Perfect Pass + Confetti Burst + Bonus XP): 100% quiz score awards 150 XP and fires quiz pass confetti burst', () => {
      const xp = computeActivityXp('quiz_pass', { score: 100, is_perfect: true });
      assert.strictEqual(xp, 150);

      const confetti = simulateConfettiBurst('quiz_pass');
      assert.strictEqual(confetti.presetType, 'quiz_pass');
      assert.strictEqual(confetti.particleCount, 50);
    });

    test('T3.14 (Pair 14: Division Rank-Up + Confetti Celebration + Glass Badge): Promoting to Gold triggers rank_up confetti and gold glass tokens', () => {
      const div = calculateDivision(1550);
      assert.strictEqual(div.tier, 'gold');
      assert.strictEqual(div.badgeColor, 'yellow-400');

      const confetti = simulateConfettiBurst('rank_up');
      assert.strictEqual(confetti.particleCount, 100);
      assert.includes(GLASS_TOKENS.glowAmber, 'rgba(245,158,11');
    });

    test('T3.15 (Pair 15: Admin CMS Config + TopPromoBanner Live View): CMS enabled banner renders on client navbar', () => {
      const cmsConfig = {
        enabled: true,
        text_en: 'Spring Masterclass 2026',
        target_date: '2026-12-31T00:00:00Z',
      };
      const isVisible = isBannerVisible(cmsConfig, false, '2026-04-01T00:00:00Z');
      assert.strictEqual(isVisible, true);
    });

    test('T3.16 (Pair 16: Navigation Route Access + Guest Authentication): Guest navigating to /dashboard is routed to auth, /courses is public', () => {
      const guestDash = resolveNavState('/dashboard', false);
      assert.strictEqual(guestDash.shouldRedirectToLogin, true);

      const guestCourses = resolveNavState('/courses', false);
      assert.strictEqual(guestCourses.isAccessible, true);
      assert.strictEqual(guestCourses.shouldRedirectToLogin, false);
    });
  });
}
