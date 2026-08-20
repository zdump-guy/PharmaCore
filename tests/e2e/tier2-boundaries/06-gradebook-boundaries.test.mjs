/**
 * Tier 2 - Feature 6: Faculty Gradebook & Analytics Boundaries
 * Tests edge cases: 0 students, 0 lectures, CSV escaping with quotes/commas, 0 attempts.
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
  runner.suite('Tier 2: Feature 6 - Gradebook Boundaries', (test) => {
    test('T2.6.1: Empty data collections return empty gradebook matrix without errors', () => {
      const res = generateGradebookMatrix({
        students: [],
        lectures: [],
        lecture_progress: [],
        quizzes: [],
        quiz_submissions: [],
        certificates: []
      });
      assert.strictEqual(Array.isArray(res), true);
      assert.strictEqual(res.length, 0);
    });

    test('T2.6.2: Student with 0 lectures watched and 0 quiz attempts calculates 0% rates cleanly', () => {
      const students = [{ id: 's0', name: 'New Student', email: 'new@med.edu' }];
      const lectures = [{ id: 'l1', title: 'Lec 1' }];
      const quizzes = [{ id: 'q1', title: 'Quiz 1' }];

      const res = generateGradebookMatrix({
        students,
        lectures,
        quizzes,
        lecture_progress: [],
        quiz_submissions: [],
        certificates: []
      });

      assert.strictEqual(res[0].watch_completion_rate, 0);
      assert.strictEqual(res[0].quiz_average, 0);
      assert.strictEqual(res[0].certificate_status, 'not_eligible');
      assert.strictEqual(isNaN(res[0].watch_completion_rate), false);
      assert.strictEqual(isNaN(res[0].quiz_average), false);
    });

    test('T2.6.3: CSV export safely escapes fields containing commas, double quotes, and linebreaks', () => {
      const complexRows = [
        {
          student_id: 's_quote',
          student_name: 'Dr. John "Jack" Doe, MD',
          email: 'jack@hospital.org',
          university: 'King Fahd University, Medical Center',
          cohort: 'Class of "2026"',
          lectures_watched: 1,
          total_lectures: 1,
          watch_completion_rate: 100,
          quiz_average: 90,
          certificate_status: 'issued',
          certificate_code: 'PHARMA-2026-JACK-0001'
        }
      ];

      const csv = exportGradebookToCSV(complexRows);
      // Double quotes should be escaped as "" and string wrapped in ""
      assert.includes(csv, '"Dr. John ""Jack"" Doe, MD"');
      assert.includes(csv, '"King Fahd University, Medical Center"');
      assert.includes(csv, '"Class of ""2026"""');
    });

    test('T2.6.4: filterGradebookRoster handles empty results or search queries safely', () => {
      const rows = [
        { student_id: 's1', student_name: 'Alice', email: 'alice@uni.edu', university: 'Uni A', cohort: 'C1', certificate_status: 'not_eligible' }
      ];

      const noMatch = filterGradebookRoster(rows, { university: 'NonExistentUni' });
      assert.strictEqual(noMatch.length, 0);

      const searchMatch = filterGradebookRoster(rows, { search: 'ALI' });
      assert.strictEqual(searchMatch.length, 1);
    });

    test('T2.6.5: Drop-off funnel with 0 enrolled students produces safe 0% rates', () => {
      const lectures = [{ id: 'l1', title: 'Lec 1' }];
      const funnel = calculateLectureDropoffFunnel(lectures, [], 0);
      assert.strictEqual(funnel.length, 1);
      assert.strictEqual(funnel[0].completion_percentage, 0);
    });

    test('T2.6.6: Question difficulty calculation with 0 attempts yields safe easy tier and 0% error', () => {
      const questions = [{ id: 'q1', question: 'Untested Question' }];
      const heatmap = calculateQuestionDifficultyHeatmap(questions, []);
      assert.strictEqual(heatmap[0].error_rate_percentage, 0);
      assert.strictEqual(heatmap[0].calculated_difficulty, 'easy');
    });
  });
}
