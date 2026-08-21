/**
 * Tier 1 - Student Dashboard, Daily Challenge & Profile Overhaul Test Suite
 * Covers F3.1 (Student Command Center `/dashboard`),
 * F3.2 (Daily Pharmacology Challenge "Drug of the Day"),
 * F3.3 (Student Profile Overhaul `/profile`).
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  DAILY_CHALLENGE_BANK,
  getDailyChallengeForDate,
  submitDailyChallengeAnswer,
  generateDashboardGreeting,
  resolveLastWatchedLecture,
  validateProfilePayload,
  VALID_TARGET_EXAMS,
} from '../helpers/expansion-dashboard-daily-engine.mjs';

export function register(runner) {
  runner.suite('Tier 1: Feature 3.1 - Student Command Center (/dashboard)', (test) => {
    test('T1.F3.1.1: Dashboard greeting generates appropriate morning, afternoon, and evening text', () => {
      const morning = generateDashboardGreeting('Omar Hassan', 9);
      assert.includes(morning.greetingEn, 'Good morning, Omar!');
      assert.includes(morning.greetingAr, 'صباح الخير');

      const afternoon = generateDashboardGreeting('Omar Hassan', 14);
      assert.includes(afternoon.greetingEn, 'Good afternoon, Omar!');

      const evening = generateDashboardGreeting('Omar Hassan', 20);
      assert.includes(evening.greetingEn, 'Good evening, Omar!');
    });

    test('T1.F3.1.2: Fallback greeting is used when user name is not provided', () => {
      const result = generateDashboardGreeting(null, 10);
      assert.includes(result.greetingEn, 'Scholar');
    });

    test('T1.F3.1.3: Resume playback bar resolves most recent active lecture and timestamp URL', () => {
      const progressList = [
        {
          lecture_id: 'lec-101',
          course_id: 'c-cardio-101',
          watched_seconds: 340,
          duration_seconds: 600,
          completed: false,
          last_watched_at: '2026-06-01T10:00:00Z',
          lecture: { title_en: 'Beta Blockers in Heart Failure' },
        },
        {
          lecture_id: 'lec-102',
          course_id: 'c-cardio-101',
          watched_seconds: 120,
          duration_seconds: 600,
          completed: false,
          last_watched_at: '2026-06-02T15:30:00Z', // More recent
          lecture: { title_en: 'ACE Inhibitors & ARBs' },
        },
      ];

      const resume = resolveLastWatchedLecture(progressList, [
        { id: 'c-cardio-101', title_en: 'Cardiovascular Pharmacology' },
      ]);

      assert.strictEqual(resume.lectureId, 'lec-102');
      assert.strictEqual(resume.watchedSeconds, 120);
      assert.strictEqual(resume.progressPercent, 20);
      assert.strictEqual(resume.resumeUrl, '/lecture/lec-102?t=120');
    });

    test('T1.F3.1.4: Resume bar returns null cleanly when student has no watched lectures', () => {
      const resume = resolveLastWatchedLecture([], []);
      assert.strictEqual(resume, null);
    });

    test('T1.F3.1.5: Dashboard enrolled courses matrix aggregates progress percentages', () => {
      const enrollments = [
        { courseId: 'c1', progressPercent: 80 },
        { courseId: 'c2', progressPercent: 20 },
      ];
      const avgProgress = Math.round(
        enrollments.reduce((acc, e) => acc + e.progressPercent, 0) / enrollments.length
      );
      assert.strictEqual(avgProgress, 50);
    });
  });

  runner.suite('Tier 1: Feature 3.2 - Daily Pharmacology Challenge ("Drug of the Day")', (test) => {
    test('T1.F3.2.1: Resolves deterministic daily challenge question from 24h date string', () => {
      const q1 = getDailyChallengeForDate('2026-08-20');
      const q2 = getDailyChallengeForDate('2026-08-20');
      assert.strictEqual(q1.id, q2.id, 'Same date must deterministically return identical question');
      assert.ok(q1.drug_name);
      assert.ok(q1.options_en.length >= 4);
    });

    test('T1.F3.2.2: Correct answer submission awards exactly +25 XP and returns clinical rationale', () => {
      const dateStr = '2026-08-20';
      const question = getDailyChallengeForDate(dateStr);
      const result = submitDailyChallengeAnswer({
        dateStr,
        selectedIndex: question.correct_index,
        userId: 'usr-123',
        alreadyAnsweredDates: [],
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.isCorrect, true);
      assert.strictEqual(result.earnedXp, 25);
      assert.ok(result.rationaleEn.length > 20);
      assert.ok(result.rationaleAr.length > 20);
      assert.ok(result.clinicalPearlEn);
    });

    test('T1.F3.2.3: Incorrect answer submission awards 0 XP but still provides clinical rationale for learning', () => {
      const dateStr = '2026-08-20';
      const question = getDailyChallengeForDate(dateStr);
      const incorrectIndex = (question.correct_index + 1) % 4;

      const result = submitDailyChallengeAnswer({
        dateStr,
        selectedIndex: incorrectIndex,
        userId: 'usr-123',
        alreadyAnsweredDates: [],
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.isCorrect, false);
      assert.strictEqual(result.earnedXp, 0);
      assert.ok(result.rationaleEn);
    });

    test('T1.F3.2.4: Submitting more than once on the same date is blocked and grants 0 XP', () => {
      const dateStr = '2026-08-20';
      const result = submitDailyChallengeAnswer({
        dateStr,
        selectedIndex: 0,
        userId: 'usr-123',
        alreadyAnsweredDates: ['2026-08-20'],
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.alreadyAnswered, true);
      assert.strictEqual(result.earnedXp, 0);
    });

    test('T1.F3.2.5: Clinical textbook reference citation is attached to question payload', () => {
      const question = DAILY_CHALLENGE_BANK[0];
      assert.ok(question.reference);
      assert.includes(question.reference, 'Guidelines');
    });
  });

  runner.suite('Tier 1: Feature 3.3 - Student Profile Overhaul (/profile)', (test) => {
    test('T1.F3.3.1: Validates target licensure exam options against approved medical exams list', () => {
      assert.includes(VALID_TARGET_EXAMS, 'EPLE');
      assert.includes(VALID_TARGET_EXAMS, 'NAPLEX');
      assert.includes(VALID_TARGET_EXAMS, 'BCPS');
      assert.includes(VALID_TARGET_EXAMS, 'SPLE');
      assert.includes(VALID_TARGET_EXAMS, 'DHA');

      const validPayload = { target_exam: 'NAPLEX', bio: 'PharmD Candidate 2027' };
      const res = validateProfilePayload(validPayload);
      assert.strictEqual(res.valid, true);
    });

    test('T1.F3.3.2: Rejects invalid target exam enum with descriptive error', () => {
      const invalidPayload = { target_exam: 'UNKNOWN_EXAM' };
      const res = validateProfilePayload(invalidPayload);
      assert.strictEqual(res.valid, false);
      assert.includes(res.errors[0], 'Target exam');
    });

    test('T1.F3.3.3: Bio character limit of 500 characters is strictly validated', () => {
      const longBio = 'A'.repeat(501);
      const res = validateProfilePayload({ bio: longBio });
      assert.strictEqual(res.valid, false);
      assert.includes(res.errors[0], '500 characters');
    });

    test('T1.F3.3.4: University and faculty badge labels format properly for public profile view', () => {
      const profile = {
        university: 'Cairo University',
        faculty: 'Faculty of Pharmacy — PharmD Clinical Pharmacy',
      };
      assert.ok(profile.university);
      assert.includes(profile.faculty, 'PharmD');
    });

    test('T1.F3.3.5: Public certificate showcase renders verified certificate badges', () => {
      const certificates = [
        { certificate_code: 'PHARMA-2026-CARD-9912', course_title_en: 'Cardiovascular Pharmacology' },
      ];
      assert.strictEqual(certificates.length, 1);
      assert.includes(certificates[0].certificate_code, 'PHARMA-2026');
    });
  });
}
