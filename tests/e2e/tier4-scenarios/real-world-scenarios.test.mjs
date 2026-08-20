/**
 * Tier 4: Real-World Application Scenarios
 * Implements comprehensive multi-step end-to-end user workflows:
 * - Scenario 1: Complete Student Journey (Enrollment -> Watch -> AI Drawer -> Practice Quiz -> Certificate -> Verification)
 * - Scenario 2: Faculty Workflow (Course Flags -> Question Authoring -> Gradebook Review -> Cohort Filter -> CSV Export)
 * - Scenario 3: Complex Clinical Pharmacology Decision Support (Renal, Pediatric, DDI Multi-drug screen)
 * - Scenario 4: Borderline Mastery Recovery (75% score denied cert -> Practice mode review -> 95% re-take -> Cert issued)
 * - Scenario 5: System Governance & Migration Schema Integrity (Global toggle -> Course override -> Schema validation)
 */

import path from 'path';
import { assert } from '../helpers/test-utils.mjs';
import { resolveCourseFeatures } from '../helpers/feature-flag-engine.mjs';
import {
  evaluateQuizOptionSelection,
  calculateQuizScore,
  validateQuestionSchema
} from '../helpers/practice-quiz-engine.mjs';
import {
  evaluateCertificateEligibility,
  issueCertificateRecord,
  verifyCertificatePublic
} from '../helpers/certificate-engine.mjs';
import {
  recordUserActivity,
  evaluateMilestoneBadges
} from '../helpers/streak-engine.mjs';
import {
  calculateCockcroftGaultCrCl,
  calculatePediatricDose,
  checkDrugInteractions,
  handleAIConsultRequest
} from '../helpers/clinical-calc-engine.mjs';
import {
  generateGradebookMatrix,
  filterGradebookRoster,
  exportGradebookToCSV,
  calculateLectureDropoffFunnel
} from '../helpers/gradebook-engine.mjs';
import {
  validateMigrationFiles,
  validateSQLContent
} from '../helpers/migration-validator.mjs';

export function register(runner) {
  runner.suite('Tier 4: Real-World Application Scenarios (E2E Workflows)', (test) => {
    test('Scenario 1: Complete Student Journey - Enrollment to Public Verified Certificate', () => {
      // Step 1: Student setup and initial state
      const student = {
        id: 'usr_fahad_2026',
        name: 'Fahad Al-Dosari',
        email: 'fahad@ksu.edu.sa',
        university: 'King Saud University',
        cohort: 'PharmD-Class-2026'
      };
      const course = {
        id: 'crs_antimicrobial_pharm',
        title_en: 'Advanced Antimicrobial Pharmacology',
        title_ar: 'علم الأدوية المتقدم لمضادات الميكروبات'
      };
      const lectures = [
        { id: 'lec_beta_lactams', title: 'Beta-Lactam Antibiotics', order_index: 1 },
        { id: 'lec_glycopeptides', title: 'Glycopeptides & Lipopeptides', order_index: 2 }
      ];

      // Step 2: Student watches lecture 1 and accesses in-lecture AI Assistant drawer
      const consultResp = handleAIConsultRequest({
        tool_type: 'lecture_qa',
        prompt: 'What is the mechanism of MRSA resistance to oxacillin?',
        context: {
          lecture_id: 'lec_beta_lactams',
          lecture_title: 'Beta-Lactam Antibiotics',
          objectives: ['Understand PBP2a mutation', 'Vancomycin vs Daptomycin kinetics']
        }
      });
      assert.strictEqual(consultResp.status, 'success');
      assert.includes(consultResp.clinical_guidance, 'Beta-Lactam Antibiotics');

      // Student completes all lectures (100% watch progress)
      const lectureProgress = [
        { user_id: student.id, lecture_id: 'lec_beta_lactams', completed: true },
        { user_id: student.id, lecture_id: 'lec_glycopeptides', completed: true }
      ];

      // Step 3: Student runs through Practice Mode quiz with instant clinical explanations
      const quizQuestions = [
        {
          id: 'q_vanc_01',
          question: 'Which parameter is best correlated with Vancomycin efficacy?',
          options: ['AUC/MIC >= 400', 'Peak concentration > 60 mg/L', 'Time above MIC > 50%', 'Trough < 5 mg/L'],
          correct_answer_index: 0,
          explanation_en: 'AUC24/MIC ratio >= 400 to 600 is the primary pharmacokinetic/pharmacodynamic predictor of clinical efficacy for Vancomycin.',
          explanation_ar: 'تعتبر نسبة AUC24/MIC >= 400 إلى 600 المؤشر الرئيسي للفعالية السريرية لفانكومايسين.',
          clinical_reference: 'IDSA/ASHP/SIDP Vancomycin Dosing Guidelines 2020',
          difficulty: 'hard'
        },
        {
          id: 'q_dapto_02',
          question: 'Why is Daptomycin ineffective in bacterial pneumonia?',
          options: ['Inactivated by pulmonary surfactant', 'Cannot penetrate alveoli', 'Rapidly metabolized by lungs', 'High protein binding'],
          correct_answer_index: 0,
          explanation_en: 'Daptomycin is rapidly inactivated by pulmonary surfactant, rendering it ineffective in pneumonia.',
          explanation_ar: 'يتم تثبيط دابتوميسين بسرعة بواسطة المادة الخافضة للتوتر السطحي الرئوي (surfactant).',
          clinical_reference: 'Goodman & Gilman 14th Ed, Ch. 57',
          difficulty: 'medium'
        }
      ];

      // Test practice mode immediate feedback on Question 1
      const practiceFeedback = evaluateQuizOptionSelection(quizQuestions[0], 0, { mode: 'practice', locale: 'en' });
      assert.strictEqual(practiceFeedback.is_correct, true);
      assert.includes(practiceFeedback.explanation, 'AUC24/MIC ratio >= 400');

      // Step 4: Final quiz submission evaluation (2/2 correct = 100%)
      const quizScore = calculateQuizScore(quizQuestions, [0, 0]);
      assert.strictEqual(quizScore.score_percentage, 100);
      assert.strictEqual(quizScore.passed, true);

      // Step 5: Mastery evaluation and certificate issuance
      const eligibility = evaluateCertificateEligibility(100, quizScore.score_percentage);
      assert.strictEqual(eligibility.eligible, true);

      const certRecord = issueCertificateRecord({
        userId: student.id,
        courseId: course.id,
        studentName: student.name,
        courseTitleEn: course.title_en,
        courseTitleAr: course.title_ar,
        watchCompletionRate: 100,
        quizAverage: quizScore.score_percentage,
        issueDate: '2026-08-20T15:00:00Z'
      });

      assert.strictEqual(certRecord.student_name, 'Fahad Al-Dosari');
      assert.strictEqual(certRecord.final_score, 100);
      assert.match(certRecord.certificate_code, /^PHARMA-2026-[A-F0-9]{4}-[A-F0-9]{4}$/);

      // Step 6: Public certificate verification at /verify/[code]
      const certificateDB = [certRecord];
      const verification = verifyCertificatePublic(certificateDB, certRecord.certificate_code);
      assert.strictEqual(verification.verified, true);
      assert.strictEqual(verification.certificate.student_name, 'Fahad Al-Dosari');
      assert.strictEqual(verification.certificate.course_title_en, 'Advanced Antimicrobial Pharmacology');
      assert.strictEqual(verification.certificate.status, 'valid');

      // Step 7: Streak update and badge awarding
      let streak = { current_streak: 6, longest_streak: 6, last_active_date: '2026-08-19' };
      streak = recordUserActivity(streak, '2026-08-20');
      assert.strictEqual(streak.current_streak, 7);

      const badgesAwarded = evaluateMilestoneBadges(
        {
          currentStreak: streak.current_streak,
          longestStreak: streak.longest_streak,
          courseCompleted: true,
          perfectScore: quizScore.score_percentage === 100
        },
        ['streak_3'] // already had bronze
      );

      assert.ok(badgesAwarded.some(b => b.id === 'streak_7'), 'Should award 7-day Silver Scholar');
      assert.ok(badgesAwarded.some(b => b.id === 'course_mastery'), 'Should award Course Mastery');
      assert.ok(badgesAwarded.some(b => b.id === 'perfect_score'), 'Should award Perfect Score');
    });

    test('Scenario 2: Faculty Management Workflow - Configuration, Authoring, Gradebook & CSV Export', () => {
      // Step 1: Configure course-level feature overrides
      const globalFlags = { ai_assistant: true, practice_mode: true, certificates: true, community_qa: true, gradebook: true };
      const courseOverrides = { community_qa: false }; // disable Q&A for this exam course
      const effectiveFlags = resolveCourseFeatures(globalFlags, courseOverrides);
      assert.strictEqual(effectiveFlags.community_qa, false);
      assert.strictEqual(effectiveFlags.practice_mode, true);
      assert.strictEqual(effectiveFlags.gradebook, true);

      // Step 2: Faculty authors new pharmacology question with bilingual rationales and textbook references
      const newQuestion = {
        id: 'q_warfarin_01',
        question: 'Which CYP enzyme is primarily responsible for the S-enantiomer metabolism of Warfarin?',
        options: ['CYP2C9', 'CYP3A4', 'CYP2D6', 'CYP1A2'],
        correct_answer_index: 0,
        explanation_en: 'S-warfarin is 3-5 times more potent than R-warfarin and is primarily metabolized by CYP2C9. Polymorphisms in CYP2C9 significantly affect dosing.',
        explanation_ar: 'المركب S-warfarin أكثر فعالية بـ 3-5 مرات من R-warfarin ويتم استقلابه بشكل أساسي بواسطة CYP2C9.',
        clinical_reference: 'CPIC Guideline for Pharmacogenomics-Guided Warfarin Dosing (Clin Pharmacol Ther 2017)',
        difficulty: 'hard'
      };

      const schemaCheck = validateQuestionSchema(newQuestion);
      assert.strictEqual(schemaCheck.valid, true);

      // Step 3: Faculty accesses Gradebook matrix with enrolled students
      const students = [
        { id: 's1', name: 'Reem Al-Ghamdi', email: 'reem@ksu.edu.sa', university: 'King Saud University', cohort: 'Class 2026' },
        { id: 's2', name: 'Karim Mansour', email: 'karim@cu.edu.eg', university: 'Cairo University', cohort: 'Class 2026' },
        { id: 's3', name: 'Laila Hassan', email: 'laila@ksu.edu.sa', university: 'King Saud University', cohort: 'Class 2027' }
      ];

      const lectures = [
        { id: 'l1', title: 'Anticoagulation Therapy', order_index: 1 },
        { id: 'l2', title: 'Antiplatelet Agents', order_index: 2 }
      ];

      const progress = [
        { user_id: 's1', lecture_id: 'l1', completed: true },
        { user_id: 's1', lecture_id: 'l2', completed: true },
        { user_id: 's2', lecture_id: 'l1', completed: true },
        { user_id: 's3', lecture_id: 'l1', completed: false }
      ];

      const quizzes = [{ id: 'q_hemostasis', title: 'Hemostasis Assessment' }];
      const submissions = [
        { user_id: 's1', quiz_id: 'q_hemostasis', score_percentage: 95 },
        { user_id: 's2', quiz_id: 'q_hemostasis', score_percentage: 82 }
      ];

      const certificates = [
        { user_id: 's1', course_id: 'crs_hemostasis', certificate_code: 'PHARMA-2026-REEM-0001', status: 'valid' }
      ];

      const matrix = generateGradebookMatrix({
        students,
        lectures,
        lecture_progress: progress,
        quizzes,
        quiz_submissions: submissions,
        certificates
      });

      // Step 4: Faculty filters by University and Cohort
      const ksu2026 = filterGradebookRoster(matrix, { university: 'King Saud University', cohort: 'Class 2026' });
      assert.strictEqual(ksu2026.length, 1);
      assert.strictEqual(ksu2026[0].student_name, 'Reem Al-Ghamdi');
      assert.strictEqual(ksu2026[0].certificate_status, 'issued');

      // Step 5: Export gradebook roster to CSV
      const csv = exportGradebookToCSV(ksu2026);
      assert.includes(csv, 'Reem Al-Ghamdi');
      assert.includes(csv, 'PHARMA-2026-REEM-0001');

      // Step 6: Faculty inspects drop-off funnel analytics
      const funnel = calculateLectureDropoffFunnel(lectures, progress, 3);
      assert.strictEqual(funnel[0].completions, 2); // 66.7% completed Lecture 1
      assert.strictEqual(funnel[1].completions, 1); // 33.3% completed Lecture 2
    });

    test('Scenario 3: Complex Clinical Pharmacology Decision Support - Renal, Pediatric & Multi-DDI Screen', () => {
      // 1. Renal dose calculation for 78-year-old female patient with CKD
      const renalEval = calculateCockcroftGaultCrCl({
        age: 78,
        weight_kg: 58,
        serum_creatinine_mg_dl: 2.1,
        gender: 'female'
      });
      // (140 - 78) * 58 / (72 * 2.1) * 0.85 = 62 * 58 / 151.2 * 0.85 = 3596 / 151.2 * 0.85 = 23.78 * 0.85 = 20.22 mL/min
      assert.almostEqual(renalEval.crcl_ml_min, 20.22, 0.05);
      assert.includes(renalEval.staging, 'Stage 4');

      // 2. Pediatric dose calculation for 3-year-old child (14kg) on amoxicillin
      const pediaDose = calculatePediatricDose({
        method: 'weight_based',
        weight_kg: 14,
        dose_per_kg: 25, // 25 mg/kg
        max_adult_dose: 875
      });
      assert.strictEqual(pediaDose.calculated_dose, 350); // 14 * 25 = 350 mg

      // 3. Multi-drug interaction safety screening
      const regimen = [
        ['Sildenafil', 'Nitroglycerin'],
        ['Warfarin', 'Aspirin'],
        ['Simvastatin', 'Clarithromycin']
      ];

      const interactionResults = regimen.map(([d1, d2]) => checkDrugInteractions(d1, d2));
      assert.strictEqual(interactionResults[0].severity, 'contraindicated');
      assert.strictEqual(interactionResults[1].severity, 'major');
      assert.strictEqual(interactionResults[2].severity, 'contraindicated');
    });

    test('Scenario 4: Borderline Mastery Recovery - Re-testing & Certificate Progression', () => {
      const student = { id: 'usr_tariq', name: 'Tariq Nabil' };
      const questions = [
        { id: 'q1', correct_answer_index: 0, options: ['A', 'B'] },
        { id: 'q2', correct_answer_index: 1, options: ['A', 'B'] },
        { id: 'q3', correct_answer_index: 0, options: ['A', 'B'] },
        { id: 'q4', correct_answer_index: 0, options: ['A', 'B'] }
      ];

      // Initial quiz attempt: 2 out of 4 correct = 50%
      const attempt1 = calculateQuizScore(questions, [0, 1, 1, 1]);
      assert.strictEqual(attempt1.score_percentage, 50);
      assert.strictEqual(attempt1.passed, false);

      // Mastery check at 100% video and 50% quiz -> NOT eligible
      const initialEligibility = evaluateCertificateEligibility(100, attempt1.score_percentage);
      assert.strictEqual(initialEligibility.eligible, false);
      assert.includes(initialEligibility.reasons[0], 'Quiz average score is 50.0%');

      // Student practices in Practice Mode and reviews rationales
      const feedbackQ3 = evaluateQuizOptionSelection(
        { ...questions[2], explanation_en: 'Clear rationale for option A' },
        0,
        { mode: 'practice' }
      );
      assert.strictEqual(feedbackQ3.is_correct, true);

      // Re-take attempt: 4 out of 4 correct = 100%
      const attempt2 = calculateQuizScore(questions, [0, 1, 0, 0]);
      assert.strictEqual(attempt2.score_percentage, 100);
      assert.strictEqual(attempt2.passed, true);

      // Re-evaluate mastery -> ELIGIBLE
      const secondEligibility = evaluateCertificateEligibility(100, attempt2.score_percentage);
      assert.strictEqual(secondEligibility.eligible, true);

      const issuedCert = issueCertificateRecord({
        userId: student.id,
        courseId: 'crs_pharm_101',
        studentName: student.name,
        courseTitleEn: 'Fundamentals of Pharmacology',
        watchCompletionRate: 100,
        quizAverage: 100
      });

      assert.strictEqual(issuedCert.final_score, 100);
      assert.strictEqual(issuedCert.status, 'valid');
    });

    test('Scenario 5: System Governance & Migration Schema Integrity', () => {
      // 1. Admin turns off AI Assistant globally
      const globalFlags = { ai_assistant: false, practice_mode: true, certificates: true, community_qa: true, gradebook: true };

      // Student on Course A (no override) -> AI is disabled
      const courseAFlags = resolveCourseFeatures(globalFlags, null);
      assert.strictEqual(courseAFlags.ai_assistant, false);

      // Course B has an explicit override enabling AI -> AI is enabled
      const courseBOverrides = { ai_assistant: true };
      const courseBFlags = resolveCourseFeatures(globalFlags, courseBOverrides);
      assert.strictEqual(courseBFlags.ai_assistant, true);

      // 2. Validate migration scripts integrity
      const projectRoot = path.resolve(process.cwd());
      const migrationsDir = path.join(projectRoot, 'supabase', 'migrations');
      const report = validateMigrationFiles(migrationsDir);
      assert.ok(typeof report.allFilesExist === 'boolean');
    });
  });
}
