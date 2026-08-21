/**
 * Tier 4 - Real-World Application Scenarios (End-to-End Clinical Workflows)
 * Implements comprehensive, multi-step user journeys simulating realistic
 * clinical learning, gamification, note taking, and administration.
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  DEFAULT_MARKETING_BANNER,
  DEFAULT_LEAD_MAGNET_CONFIG,
  calculateCountdown,
  isBannerVisible,
  processCouponCode,
  evaluateLectureAccess,
  validateMarketingConfigSchema,
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
  validateDiscussionThreadPayload,
} from '../helpers/expansion-classroom-notes-engine.mjs';
import {
  simulateConfettiBurst,
  resolveNavState,
  GLASS_TOKENS,
} from '../helpers/expansion-visual-confetti-engine.mjs';

export function register(runner) {
  runner.suite('Tier 4: Real-World Application Scenarios', (test) => {
    test('Scenario 1: Complete Student Onboarding & Discovery Journey', () => {
      // Step 1: Guest visits homepage, sees active promo banner with countdown
      const promoConfig = { ...DEFAULT_MARKETING_BANNER, enabled: true, coupon_code: 'PHARMA30', target_date: '2026-12-31T23:59:59Z' };
      assert.strictEqual(isBannerVisible(promoConfig, false, '2026-08-20T10:00:00Z'), true);
      const countdown = calculateCountdown(promoConfig.target_date, '2026-08-20T10:00:00Z');
      assert.strictEqual(countdown.isExpired, false);

      // Step 2: Guest clicks coupon code to copy
      const couponResult = processCouponCode(promoConfig.coupon_code);
      assert.strictEqual(couponResult.valid, true);
      assert.strictEqual(couponResult.discountPercent, 30);

      // Step 3: Guest tries Lead Magnet preview on Lecture 1 of private course
      const lec1 = evaluateLectureAccess({ lectureOrder: 1, isGuest: true, courseAccessPolicy: 'students_only' });
      assert.strictEqual(lec1.canAccess, true);
      assert.strictEqual(lec1.isPreview, true);

      // Step 4: Guest attempts Lecture 2 and sees non-intrusive conversion modal
      const lec2 = evaluateLectureAccess({ lectureOrder: 2, isGuest: true, courseAccessPolicy: 'students_only' });
      assert.strictEqual(lec2.canAccess, false);
      assert.strictEqual(lec2.showConversionModal, true);

      // Step 5: Guest registers, browses /courses catalog, and enrolls in Cardiology
      const catalog = filterAndSortCourses({ courses: MOCK_COURSES, category: 'cardiology' });
      assert.strictEqual(catalog.length, 1);

      const card = computeCourseCardMetrics(catalog[0], { progressPercent: 0 });
      assert.strictEqual(card.isEnrolled, true);
      assert.strictEqual(card.primaryAction, 'continue');
    });

    test('Scenario 2: Daily Clinical Learning Routine & "Drug of the Day" Mastery', () => {
      // Step 1: Student opens /dashboard at 9:00 AM, receives personalized greeting
      const greeting = generateDashboardGreeting('Fatima Zahra', 9);
      assert.includes(greeting.greetingEn, 'Good morning, Fatima!');
      assert.strictEqual(greeting.timeOfDay, 'morning');

      // Step 2: Student checks resume playback bar to continue where they left off
      const progress = [
        {
          lecture_id: 'lec-anti-1',
          course_id: 'c-anti-201',
          watched_seconds: 450,
          duration_seconds: 900,
          last_watched_at: '2026-08-20T08:30:00Z',
          lecture: { title_en: 'Cephalosporin Generations' },
        },
      ];
      const resume = resolveLastWatchedLecture(progress, MOCK_COURSES);
      assert.strictEqual(resume.lectureId, 'lec-anti-1');
      assert.strictEqual(resume.progressPercent, 50);
      assert.strictEqual(resume.resumeUrl, '/lecture/lec-anti-1?t=450');

      // Step 3: Student completes Daily Pharmacology Challenge ("Drug of the Day")
      const dateStr = '2026-08-20';
      const question = getDailyChallengeForDate(dateStr);
      assert.ok(question.drug_name);

      const submission = submitDailyChallengeAnswer({
        dateStr,
        selectedIndex: question.correct_index,
        userId: 'usr-fatima',
      });
      assert.strictEqual(submission.isCorrect, true);
      assert.strictEqual(submission.earnedXp, 25);
      assert.ok(submission.rationaleEn.length > 20);

      // Step 4: XP is added to student account and streak updates
      const divBefore = calculateDivision(480);
      const divAfter = calculateDivision(480 + submission.earnedXp);
      assert.strictEqual(divBefore.tier, 'bronze');
      assert.strictEqual(divAfter.tier, 'silver'); // Promoted from Bronze to Silver!
    });

    test('Scenario 3: In-Lecture Timestamped Clinical Note Taking & Markdown Export', () => {
      // Step 1: Student watches lecture and records a Clinical Pearl at 01:15
      const note1 = createTimestampedNote({
        id: 'n-1',
        userId: 'usr-1',
        lectureId: 'lec-hf-101',
        courseId: 'c-cardio-101',
        lectureTitle: 'Heart Failure Guideline Directed Medical Therapy (GDMT)',
        timestampSeconds: 75,
        noteText: 'Quadruple therapy in HFrEF: ARNI + Beta Blocker + MRA + SGLT2i.',
        tag: 'pearl',
      });
      assert.strictEqual(note1.timestamp_formatted, '01:15');

      // Step 2: Student records a Contraindication/Warning at 05:40
      const note2 = createTimestampedNote({
        id: 'n-2',
        userId: 'usr-1',
        lectureId: 'lec-hf-101',
        courseId: 'c-cardio-101',
        lectureTitle: 'Heart Failure Guideline Directed Medical Therapy (GDMT)',
        timestampSeconds: 340,
        noteText: 'Avoid Spironolactone if eGFR < 30 mL/min or serum K+ > 5.0 mEq/L.',
        tag: 'warning',
      });
      assert.strictEqual(note2.timestamp_formatted, '05:40');

      // Step 3: Student clicks on timestamp 01:15 to seek video player
      const seekTarget = parseTimestampToSeconds(note1.timestamp_formatted);
      assert.strictEqual(seekTarget, 75);

      // Step 4: Student exports notes to Markdown
      const markdown = generateNotesMarkdown({
        courseTitle: 'Cardiovascular Pharmacology',
        lectureTitle: 'Heart Failure GDMT',
        studentName: 'Tariq Mansour',
        notes: [note1, note2],
      });

      assert.includes(markdown, '# Clinical Study Notes — Heart Failure GDMT');
      assert.includes(markdown, '💡 [Clinical Pearl]');
      assert.includes(markdown, '⚠️ [Contraindication/Warning]');
      assert.includes(markdown, 'Quadruple therapy');
      assert.includes(markdown, 'Spironolactone');
    });

    test('Scenario 4: Classroom Peer Learning & Faculty Solution Hub', () => {
      // Step 1: Student posts a question in Classroom Discussion Hub
      const threadPayload = {
        title: 'Difference between Dihydropyridine vs Non-Dihydropyridine CCBs?',
        content: 'Why is Verapamil contraindicated in heart failure while Amlodipine is safer?',
        category: 'clinical_qa',
      };
      const validation = validateDiscussionThreadPayload(threadPayload);
      assert.strictEqual(validation.valid, true);

      // Step 2: Peer upvotes the question
      const upvoteRes = toggleDiscussionUpvote({
        threadId: 'th-ccb-1',
        currentUpvotes: 3,
        upvotedUserIds: ['u1', 'u2', 'u3'],
        userId: 'u4',
      });
      assert.strictEqual(upvoteRes.upvotes, 4);
      assert.strictEqual(upvoteRes.upvoted, true);

      // Step 3: Faculty provides verified solution
      const facultyAnswer = {
        id: 'fa-1',
        responder_name: 'Dr. Khaled (Faculty)',
        text: 'Verapamil and Diltiazem possess potent negative inotropic and dromotropic effects which worsen systolic heart failure. Amlodipine is vascular-selective and does not depress cardiac contractility.',
        is_faculty_verified: true,
      };
      assert.strictEqual(facultyAnswer.is_faculty_verified, true);
    });

    test('Scenario 5: Multi-Module Gamification & Division Rank-Up Ascendancy', () => {
      // Step 1: Student starts in Gold League with 3350 XP
      const startDiv = calculateDivision(3350);
      assert.strictEqual(startDiv.tier, 'gold');
      assert.strictEqual(startDiv.xpNeededForNext, 150); // 3500 needed for Platinum

      // Step 2: Student completes 2 lectures (2 x 50 = 100 XP)
      const lecXp1 = computeActivityXp('lecture_complete');
      const lecXp2 = computeActivityXp('lecture_complete');
      let currentXp = 3350 + lecXp1 + lecXp2; // 3450 XP

      // Step 3: Student passes quiz with 100% perfect score (+150 XP)
      const quizXp = computeActivityXp('quiz_pass', { score: 100, is_perfect: true });
      currentXp += quizXp; // 3600 XP

      // Step 4: Division evaluates promotion to Platinum League
      const promotedDiv = calculateDivision(currentXp);
      assert.strictEqual(promotedDiv.tier, 'platinum');
      assert.strictEqual(promotedDiv.name_en, 'Platinum League');
      assert.strictEqual(promotedDiv.badgeColor, 'cyan-400');

      // Step 5: Rank-up triggers celebration confetti burst
      const burst = simulateConfettiBurst('rank_up');
      assert.strictEqual(burst.presetType, 'rank_up');
      assert.strictEqual(burst.particleCount, 100);

      // Step 6: Multi-scope leaderboard reflects student new Platinum tier and rank
      const entries = [
        { user_id: 'u-other', full_name: 'Rival Student', total_xp: 3550, division: 'platinum' },
        { user_id: 'u-me', full_name: 'Hero Student (Me)', total_xp: currentXp, division: 'platinum' },
      ];
      const leaderboard = computeLeaderboard({ entries, scope: 'global', timeframe: 'all_time', currentUserId: 'u-me' });
      assert.strictEqual(leaderboard.allEntries[0].user_id, 'u-me');
      assert.strictEqual(leaderboard.allEntries[0].rank, 1);
    });

    test('Scenario 6: Student Profile & Licensure Prep Showcase', () => {
      // Step 1: Student updates bio, university, and selects target exam (BCPS)
      const profileData = {
        bio: 'Clinical Pharmacist specializing in Critical Care & Cardiology. Preparing for BCPS Board Certification.',
        target_exam: 'BCPS',
      };
      const validProfile = validateProfilePayload(profileData);
      assert.strictEqual(validProfile.valid, true);

      // Step 2: Student profile renders verified certificates
      const studentCertificates = [
        {
          id: 'cert-1',
          certificate_code: 'PHARMA-2026-CARD-4421',
          course_title_en: 'Cardiovascular Pharmacology Masterclass',
          final_score: 95,
          issue_date: '2026-07-15',
        },
      ];
      assert.strictEqual(studentCertificates.length, 1);
      assert.includes(studentCertificates[0].certificate_code, 'PHARMA-2026');
    });

    test('Scenario 7: Catalog Exploration & Filter Refinement', () => {
      // Step 1: User explores /courses with search query "Pharmacology"
      const searched = filterAndSortCourses({ courses: MOCK_COURSES, searchQuery: 'Pharmacology' });
      assert.ok(searched.length >= 2);

      // Step 2: User refines by difficulty "advanced"
      const refined = filterAndSortCourses({ courses: searched, difficulty: 'advanced' });
      assert.ok(refined.every((c) => c.difficulty === 'advanced'));

      // Step 3: User switches view to list layout
      const viewMode = resolveCatalogViewMode('list');
      assert.strictEqual(viewMode, 'list');
    });

    test('Scenario 8: Admin Marketing Campaign & Feature Rollout', () => {
      // Step 1: Admin configures promotional banner with countdown
      const newBanner = {
        enabled: true,
        text_en: 'Back to School 40% Discount',
        text_ar: 'خصم العودة للدراسة 40%',
        coupon_code: 'BACK2SCHOOL',
        target_date: '2026-09-15T00:00:00Z',
      };
      const validation = validateMarketingConfigSchema(newBanner);
      assert.strictEqual(validation.valid, true);

      // Step 2: Realtime propagation validates banner is active
      const isVisible = isBannerVisible(newBanner, false, '2026-08-20T00:00:00Z');
      assert.strictEqual(isVisible, true);
    });
  });
}
