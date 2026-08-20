/**
 * Tier 1 - Feature 6: Faculty Gradebook, Drop-off & Difficulty Analytics
 * Verifies student roster matrix, cohort filtering, CSV export, and analytics.
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  generateGradebookMatrix,
  filterGradebookRoster,
  exportGradebookToCSV,
  calculateLectureDropoffFunnel,
  calculateQuestionDifficultyHeatmap
} from '../helpers/gradebook-engine.mjs';

export function register(runner) {
  runner.suite('Tier 1: Feature 6 - Faculty Gradebook & Analytics', (test) => {
    const mockStudents = [
      { id: 's1', name: 'Zaid Al-Harbi', email: 'zaid@ksu.edu.sa', university: 'King Saud University', cohort: 'PharmD-2026' },
      { id: 's2', name: 'Mona El-Sayed', email: 'mona@cu.edu.eg', university: 'Cairo University', cohort: 'PharmD-2026' },
      { id: 's3', name: 'Omar Khaled', email: 'omar@ksu.edu.sa', university: 'King Saud University', cohort: 'BSc-2027' }
    ];

    const mockLectures = [
      { id: 'lec_1', title: 'Pharmacokinetics', order_index: 1 },
      { id: 'lec_2', title: 'Pharmacodynamics', order_index: 2 }
    ];

    const mockProgress = [
      { user_id: 's1', lecture_id: 'lec_1', completed: true },
      { user_id: 's1', lecture_id: 'lec_2', completed: true }, // s1: 100%
      { user_id: 's2', lecture_id: 'lec_1', completed: true }, // s2: 50%
      { user_id: 's3', lecture_id: 'lec_1', completed: false } // s3: 0%
    ];

    const mockQuizzes = [
      { id: 'q_mid', title: 'Midterm Assessment' },
      { id: 'q_fin', title: 'Final Assessment' }
    ];

    const mockSubmissions = [
      { user_id: 's1', quiz_id: 'q_mid', score_percentage: 90 },
      { user_id: 's1', quiz_id: 'q_fin', score_percentage: 85 }, // s1 avg: 87.5% -> eligible
      { user_id: 's2', quiz_id: 'q_mid', score_percentage: 70 }  // s2 avg: 70.0%
    ];

    const mockCertificates = [
      { user_id: 's1', course_id: 'crs_1', certificate_code: 'PHARMA-2026-ZAID-0001', status: 'valid' }
    ];

    test('T1.6.1: Gradebook matrix aggregates completion rate, quiz averages, and certificate status', () => {
      const matrix = generateGradebookMatrix({
        students: mockStudents,
        lectures: mockLectures,
        lecture_progress: mockProgress,
        quizzes: mockQuizzes,
        quiz_submissions: mockSubmissions,
        certificates: mockCertificates
      });

      assert.strictEqual(matrix.length, 3);

      const zaid = matrix.find(m => m.student_id === 's1');
      assert.strictEqual(zaid.watch_completion_rate, 100);
      assert.strictEqual(zaid.quiz_average, 87.5);
      assert.strictEqual(zaid.certificate_status, 'issued');
      assert.strictEqual(zaid.certificate_code, 'PHARMA-2026-ZAID-0001');

      const mona = matrix.find(m => m.student_id === 's2');
      assert.strictEqual(mona.watch_completion_rate, 50);
      assert.strictEqual(mona.quiz_average, 70);
      assert.strictEqual(mona.certificate_status, 'not_eligible');
    });

    test('T1.6.2: filterGradebookRoster filters by university and cohort accurately', () => {
      const matrix = generateGradebookMatrix({
        students: mockStudents,
        lectures: mockLectures,
        lecture_progress: mockProgress,
        quizzes: mockQuizzes,
        quiz_submissions: mockSubmissions,
        certificates: mockCertificates
      });

      const ksuFiltered = filterGradebookRoster(matrix, { university: 'King Saud University' });
      assert.strictEqual(ksuFiltered.length, 2);

      const cohortFiltered = filterGradebookRoster(matrix, { cohort: 'BSc-2027' });
      assert.strictEqual(cohortFiltered.length, 1);
      assert.strictEqual(cohortFiltered[0].student_name, 'Omar Khaled');
    });

    test('T1.6.3: filterGradebookRoster filters by certificate status', () => {
      const matrix = generateGradebookMatrix({
        students: mockStudents,
        lectures: mockLectures,
        lecture_progress: mockProgress,
        quizzes: mockQuizzes,
        quiz_submissions: mockSubmissions,
        certificates: mockCertificates
      });

      const issued = filterGradebookRoster(matrix, { certificate_status: 'issued' });
      assert.strictEqual(issued.length, 1);
      assert.strictEqual(issued[0].student_name, 'Zaid Al-Harbi');
    });

    test('T1.6.4: exportGradebookToCSV creates RFC 4180 compliant CSV string', () => {
      const matrix = generateGradebookMatrix({
        students: mockStudents,
        lectures: mockLectures,
        lecture_progress: mockProgress,
        quizzes: mockQuizzes,
        quiz_submissions: mockSubmissions,
        certificates: mockCertificates
      });

      const csv = exportGradebookToCSV(matrix);
      assert.includes(csv, 'Student ID,Student Name,Email,University,Cohort');
      assert.includes(csv, 's1,Zaid Al-Harbi,zaid@ksu.edu.sa,King Saud University,PharmD-2026,2,2,100,87.5,issued,PHARMA-2026-ZAID-0001');
    });

    test('T1.6.5: calculateLectureDropoffFunnel computes sequential completion drop-off', () => {
      const funnel = calculateLectureDropoffFunnel(mockLectures, mockProgress, 3);
      assert.strictEqual(funnel.length, 2);
      assert.strictEqual(funnel[0].completions, 2); // 2 out of 3 = 66.7%
      assert.almostEqual(funnel[0].completion_percentage, 66.7, 0.1);
      assert.strictEqual(funnel[1].completions, 1); // 1 out of 3 = 33.3%
      assert.almostEqual(funnel[1].completion_percentage, 33.3, 0.1);
    });

    test('T1.6.6: calculateQuestionDifficultyHeatmap computes error rate and tier classification', () => {
      const questions = [
        { id: 'q1', question: 'Easy Question' },
        { id: 'q2', question: 'Hard Question' }
      ];
      const attempts = [
        { question_id: 'q1', is_correct: true },
        { question_id: 'q1', is_correct: true },
        { question_id: 'q2', is_correct: false },
        { question_id: 'q2', is_correct: false },
        { question_id: 'q2', is_correct: true }
      ];

      const heatmap = calculateQuestionDifficultyHeatmap(questions, attempts);
      assert.strictEqual(heatmap[0].calculated_difficulty, 'easy');
      assert.strictEqual(heatmap[0].error_rate_percentage, 0);

      assert.strictEqual(heatmap[1].calculated_difficulty, 'hard'); // 2/3 = 66.7% error rate
      assert.almostEqual(heatmap[1].error_rate_percentage, 66.7, 0.1);
    });
  });
}
