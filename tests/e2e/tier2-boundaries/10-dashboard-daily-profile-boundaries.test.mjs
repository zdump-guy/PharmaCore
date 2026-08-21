/**
 * Tier 2 - Dashboard, Daily Challenge & Profile Boundaries Test Suite
 * Covers F3.1 (Dashboard Greeting/Resume Boundaries),
 * F3.2 (Daily Challenge Date/Index Boundaries),
 * F3.3 (Profile Bio & Exam Target Boundaries).
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  getDailyChallengeForDate,
  submitDailyChallengeAnswer,
  generateDashboardGreeting,
  resolveLastWatchedLecture,
  validateProfilePayload,
} from '../helpers/expansion-dashboard-daily-engine.mjs';

export function register(runner) {
  runner.suite('Tier 2: Feature 3.1 - Dashboard & Resume Boundaries', (test) => {
    test('T2.F3.1.1: Dashboard greeting handles midnight (00:00) and noon (12:00) hour boundaries', () => {
      const midnight = generateDashboardGreeting('Student', 0);
      assert.strictEqual(midnight.timeOfDay, 'evening'); // Late night/evening

      const morningStart = generateDashboardGreeting('Student', 5);
      assert.strictEqual(morningStart.timeOfDay, 'morning');

      const noon = generateDashboardGreeting('Student', 12);
      assert.strictEqual(noon.timeOfDay, 'afternoon');

      const eveningStart = generateDashboardGreeting('Student', 17);
      assert.strictEqual(eveningStart.timeOfDay, 'evening');
    });

    test('T2.F3.1.2: Empty string or non-string user name falls back cleanly in greeting', () => {
      const emptyName = generateDashboardGreeting('', 10);
      assert.includes(emptyName.greetingEn, 'Scholar');

      const whitespaceName = generateDashboardGreeting('   ', 10);
      assert.includes(whitespaceName.greetingEn, 'Scholar');
    });

    test('T2.F3.1.3: Resume playback calculation with duration_seconds = 0 avoids division by zero', () => {
      const progressList = [
        {
          lecture_id: 'lec-zero',
          course_id: 'c-1',
          watched_seconds: 0,
          duration_seconds: 0,
          completed: false,
          last_watched_at: '2026-08-20T10:00:00Z',
        },
      ];
      const resume = resolveLastWatchedLecture(progressList);
      assert.strictEqual(resume.progressPercent, 0);
      assert.strictEqual(resume.resumeUrl, '/lecture/lec-zero?t=0');
    });

    test('T2.F3.1.4: Progress list with corrupted dates sorts safely without NaN errors', () => {
      const progressList = [
        {
          lecture_id: 'lec-bad-date',
          course_id: 'c-1',
          watched_seconds: 50,
          duration_seconds: 100,
          last_watched_at: 'corrupted-date',
        },
        {
          lecture_id: 'lec-good-date',
          course_id: 'c-1',
          watched_seconds: 80,
          duration_seconds: 100,
          last_watched_at: '2026-08-20T12:00:00Z',
        },
      ];
      const resume = resolveLastWatchedLecture(progressList);
      assert.ok(resume.lectureId);
    });

    test('T2.F3.1.5: Watched seconds exceeding total duration caps progress at 100%', () => {
      const progressList = [
        {
          lecture_id: 'lec-overflow',
          course_id: 'c-1',
          watched_seconds: 800,
          duration_seconds: 600,
          last_watched_at: '2026-08-20T12:00:00Z',
        },
      ];
      const resume = resolveLastWatchedLecture(progressList);
      assert.strictEqual(resume.progressPercent, 100);
    });
  });

  runner.suite('Tier 2: Feature 3.2 - Daily Challenge Boundaries', (test) => {
    test('T2.F3.2.1: Leap day (Feb 29) resolves valid daily question without throwing', () => {
      const qLeap = getDailyChallengeForDate('2028-02-29');
      assert.ok(qLeap.drug_name);
      assert.strictEqual(qLeap.date, '2028-02-29');
    });

    test('T2.F3.2.2: Year boundary transition (Dec 31 to Jan 01) resolves valid challenge', () => {
      const qDec31 = getDailyChallengeForDate('2026-12-31');
      const qJan01 = getDailyChallengeForDate('2027-01-01');
      assert.ok(qDec31.drug_name);
      assert.ok(qJan01.drug_name);
    });

    test('T2.F3.2.3: Negative or out-of-bounds selectedIndex evaluates to isCorrect = false and 0 XP', () => {
      const resNeg = submitDailyChallengeAnswer({
        dateStr: '2026-08-20',
        selectedIndex: -1,
        userId: 'usr-1',
      });
      assert.strictEqual(resNeg.isCorrect, false);
      assert.strictEqual(resNeg.earnedXp, 0);

      const resHigh = submitDailyChallengeAnswer({
        dateStr: '2026-08-20',
        selectedIndex: 99,
        userId: 'usr-1',
      });
      assert.strictEqual(resHigh.isCorrect, false);
    });

    test('T2.F3.2.4: Null or empty date string falls back to default question bank entry', () => {
      const qNull = getDailyChallengeForDate(null);
      assert.ok(qNull.drug_name);

      const qEmpty = getDailyChallengeForDate('');
      assert.ok(qEmpty.drug_name);
    });

    test('T2.F3.2.5: Consecutive submissions across distinct calendar dates are permitted and reward XP', () => {
      const resDay1 = submitDailyChallengeAnswer({
        dateStr: '2026-08-20',
        selectedIndex: getDailyChallengeForDate('2026-08-20').correct_index,
        userId: 'u1',
        alreadyAnsweredDates: [],
      });
      assert.strictEqual(resDay1.isCorrect, true);
      assert.strictEqual(resDay1.earnedXp, 25);

      const resDay2 = submitDailyChallengeAnswer({
        dateStr: '2026-08-21',
        selectedIndex: getDailyChallengeForDate('2026-08-21').correct_index,
        userId: 'u1',
        alreadyAnsweredDates: ['2026-08-20'], // Completed day 1, now doing day 2
      });
      assert.strictEqual(resDay2.isCorrect, true);
      assert.strictEqual(resDay2.earnedXp, 25);
    });
  });

  runner.suite('Tier 2: Feature 3.3 - Profile Overhaul Boundaries', (test) => {
    test('T2.F3.3.1: Exactly 500 characters bio is accepted by validator', () => {
      const bio500 = 'A'.repeat(500);
      const res = validateProfilePayload({ bio: bio500, target_exam: 'EPLE' });
      assert.strictEqual(res.valid, true);
    });

    test('T2.F3.3.2: 501 characters bio fails validation', () => {
      const bio501 = 'A'.repeat(501);
      const res = validateProfilePayload({ bio: bio501 });
      assert.strictEqual(res.valid, false);
      assert.includes(res.errors[0], '500 characters');
    });

    test('T2.F3.3.3: Empty string bio and null bio are accepted as valid empty bio state', () => {
      assert.strictEqual(validateProfilePayload({ bio: '' }).valid, true);
      assert.strictEqual(validateProfilePayload({ bio: null }).valid, true);
    });

    test('T2.F3.3.4: Target exam is case-sensitive: lowercase "naplex" is rejected', () => {
      const res = validateProfilePayload({ target_exam: 'naplex' });
      assert.strictEqual(res.valid, false);
      assert.includes(res.errors[0], 'Target exam');
    });

    test('T2.F3.3.5: Non-object payload returns error', () => {
      assert.strictEqual(validateProfilePayload('invalid').valid, false);
      assert.strictEqual(validateProfilePayload(null).valid, false);
    });
  });
}
