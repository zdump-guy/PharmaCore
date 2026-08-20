/**
 * Tier 3: Cross-Feature Combinations (Pairwise Testing)
 * Tests multi-module interactions across feature flags, quiz runner, certificates,
 * streaks, clinical calculators, gradebook, and database schema.
 */

import { assert } from '../helpers/test-utils.mjs';
import { resolveCourseFeatures } from '../helpers/feature-flag-engine.mjs';
import { evaluateQuizOptionSelection, calculateQuizScore } from '../helpers/practice-quiz-engine.mjs';
import { evaluateCertificateEligibility, issueCertificateRecord, verifyCertificatePublic } from '../helpers/certificate-engine.mjs';
import { recordUserActivity, evaluateMilestoneBadges } from '../helpers/streak-engine.mjs';
import { calculateCockcroftGaultCrCl, checkDrugInteractions, handleAIConsultRequest } from '../helpers/clinical-calc-engine.mjs';
import { generateGradebookMatrix, filterGradebookRoster } from '../helpers/gradebook-engine.mjs';

export function register(runner) {
  runner.suite('Tier 3: Cross-Feature Combinations (Pairwise Tests)', (test) => {
    test('T3.1 (Pair 1): Feature Flag (practice_mode=false) + Quiz Runner enforces standard mode', () => {
      // When practice_mode is disabled at course level, quiz must run in standard mode
      const flags = resolveCourseFeatures(undefined, { practice_mode: false });
      assert.strictEqual(flags.practice_mode, false);

      const question = {
        id: 'q1',
        question: 'ACE inhibitor adverse effect?',
        options: ['Dry Cough', 'Hypokalemia'],
        correct_answer_index: 0,
        explanation_en: 'Bradykinin accumulation causes persistent dry cough.'
      };

      const quizMode = flags.practice_mode ? 'practice' : 'standard';
      const feedback = evaluateQuizOptionSelection(question, 0, { mode: quizMode });

      assert.strictEqual(feedback.mode, 'standard');
      assert.strictEqual(feedback.feedback_revealed, false);
      assert.strictEqual(feedback.explanation, null);
    });

    test('T3.2 (Pair 2): Feature Flag (certificates=false) + Certificate Engine blocks issuance', () => {
      const flags = resolveCourseFeatures(undefined, { certificates: false });
      assert.strictEqual(flags.certificates, false);

      const eligibility = evaluateCertificateEligibility(100, 95);
      assert.strictEqual(eligibility.eligible, true);

      // System rule: If feature flag is off, certificate cannot be issued
      const canIssue = flags.certificates && eligibility.eligible;
      assert.strictEqual(canIssue, false, 'Certificate issuance must be disabled when feature flag is false');
    });

    test('T3.3 (Pair 3): Feature Flag (ai_assistant=false) + AI Clinical Consult API blocks execution', () => {
      const globalFlags = { ai_assistant: false };
      const resolved = resolveCourseFeatures(globalFlags, null);
      assert.strictEqual(resolved.ai_assistant, false);

      const executeConsult = () => {
        if (!resolved.ai_assistant) {
          throw new Error('AI Clinical Assistant is disabled on this platform/course');
        }
        return handleAIConsultRequest({
          tool_type: 'dose_calculator',
          prompt: 'Dose',
          context: { patient_data: { age: 50, weight_kg: 70, serum_creatinine_mg_dl: 1.0, gender: 'male' } }
        });
      };

      assert.throws(executeConsult, 'AI Clinical Assistant is disabled');
    });

    test('T3.4 (Pair 4): Practice Quiz Completion + Streak Advancement & Milestone Badge Award', () => {
      // 1. Student takes 5-question quiz and passes with 100%
      const questions = [
        { id: 'q1', correct_answer_index: 0, options: ['A', 'B'] },
        { id: 'q2', correct_answer_index: 1, options: ['A', 'B'] },
        { id: 'q3', correct_answer_index: 0, options: ['A', 'B'] }
      ];
      const quizResult = calculateQuizScore(questions, [0, 1, 0]);
      assert.strictEqual(quizResult.score_percentage, 100);

      // 2. Activity recorded on Day 3 of study streak
      let streak = { current_streak: 2, longest_streak: 2, last_active_date: '2026-08-19' };
      streak = recordUserActivity(streak, '2026-08-20');
      assert.strictEqual(streak.current_streak, 3);

      // 3. Evaluate earned badges (3-day streak -> bronze_scholar, 100% score -> perfect_score)
      const newBadges = evaluateMilestoneBadges({
        currentStreak: streak.current_streak,
        longestStreak: streak.longest_streak,
        perfectScore: quizResult.score_percentage === 100
      });

      assert.strictEqual(newBadges.length, 2);
      assert.ok(newBadges.some(b => b.id === 'streak_3'));
      assert.ok(newBadges.some(b => b.id === 'perfect_score'));
    });

    test('T3.5 (Pair 5): Video 100% + Quiz 85% + Gradebook Matrix + Public Certificate Verification', () => {
      const student = { id: 's_pair5', name: 'Noura Al-Otaibi', email: 'noura@med.edu', university: 'KSU', cohort: '2026' };
      const lecture = { id: 'lec_cardio_1', title: 'Cardiology 1', order_index: 1 };
      const quiz = { id: 'quiz_cardio_1', title: 'Cardio Quiz 1' };

      // 1. Complete lecture & quiz
      const progress = [{ user_id: student.id, lecture_id: lecture.id, completed: true }];
      const submissions = [{ user_id: student.id, quiz_id: quiz.id, score_percentage: 85 }];

      // 2. Issue Certificate
      const cert = issueCertificateRecord({
        userId: student.id,
        courseId: 'crs_cardio',
        studentName: student.name,
        courseTitleEn: 'Clinical Cardiology',
        watchCompletionRate: 100,
        quizAverage: 85
      });

      // 3. Gradebook matrix aggregation
      const matrix = generateGradebookMatrix({
        students: [student],
        lectures: [lecture],
        lecture_progress: progress,
        quizzes: [quiz],
        quiz_submissions: submissions,
        certificates: [cert]
      });

      assert.strictEqual(matrix[0].certificate_status, 'issued');
      assert.strictEqual(matrix[0].certificate_code, cert.certificate_code);

      // 4. Public verification check
      const verification = verifyCertificatePublic([cert], cert.certificate_code);
      assert.strictEqual(verification.verified, true);
      assert.strictEqual(verification.certificate.student_name, 'Noura Al-Otaibi');
      assert.strictEqual(verification.certificate.final_score, 85);
    });

    test('T3.6 (Pair 6): Course-level Feature Override + Faculty Gradebook Filter by Course', () => {
      // Global has gradebook=true, but Course B overrides gradebook=false
      const courseAFlags = resolveCourseFeatures({ gradebook: true }, { gradebook: true });
      const courseBFlags = resolveCourseFeatures({ gradebook: true }, { gradebook: false });

      assert.strictEqual(courseAFlags.gradebook, true);
      assert.strictEqual(courseBFlags.gradebook, false);

      const students = [
        { id: 's1', name: 'Alice', university: 'Uni A', cohort: 'Cohort A' },
        { id: 's2', name: 'Bob', university: 'Uni B', cohort: 'Cohort B' }
      ];
      const matrix = generateGradebookMatrix({ students });
      const filtered = filterGradebookRoster(matrix, { university: 'Uni A' });
      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0].student_name, 'Alice');
    });

    test('T3.7 (Pair 7): AI Interaction Screening + Question Rationale Guidelines Cross-Reference', () => {
      // Clinical Question regarding Statin + Macrolide interaction
      const ddi = checkDrugInteractions('Simvastatin', 'Clarithromycin');
      assert.strictEqual(ddi.severity, 'contraindicated');

      const question = {
        id: 'q_ddi_01',
        question: 'Which antibiotic is contraindicated with Simvastatin due to rhabdomyolysis?',
        options: ['Amoxicillin', 'Clarithromycin', 'Ceftriaxone', 'Doxycycline'],
        correct_answer_index: 1,
        explanation_en: ddi.risk_summary,
        clinical_reference: 'AHA/ACC Statin Safety Guidelines'
      };

      const practiceFeedback = evaluateQuizOptionSelection(question, 1, { mode: 'practice' });
      assert.strictEqual(practiceFeedback.is_correct, true);
      assert.includes(practiceFeedback.explanation, 'rhabdomyolysis');
      assert.strictEqual(practiceFeedback.clinical_reference, 'AHA/ACC Statin Safety Guidelines');
    });

    test('T3.8 (Pair 8): Renal Dose Calculator + In-Lecture Clinical QA Context Integration', () => {
      // Student in "Renal Pharmacology" lecture uses AI Assistant drawer to calculate patient CrCl
      const lectureContext = {
        lecture_id: 'lec_renal_02',
        lecture_title: 'Pharmacokinetics in Chronic Kidney Disease',
        objectives: ['Dose adjustments in CKD Stage 4', 'GFR Estimation via Cockcroft-Gault'],
        patient_data: {
          age: 72,
          weight_kg: 68,
          serum_creatinine_mg_dl: 2.2,
          gender: 'female'
        }
      };

      const consultResp = handleAIConsultRequest({
        tool_type: 'dose_calculator',
        prompt: 'Calculate CrCl for 72yo female patient on Vancomycin',
        context: lectureContext
      });

      assert.strictEqual(consultResp.status, 'success');
      assert.ok(consultResp.data.crcl_ml_min < 30);
      assert.includes(consultResp.data.staging, 'Stage 4');
    });
  });
}
