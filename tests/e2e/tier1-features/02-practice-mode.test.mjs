/**
 * Tier 1 - Feature 2: Practice Exam Simulator & Clinical Rationales
 * Verifies instant feedback, bilingual explanations, and quiz scoring.
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  evaluateQuizOptionSelection,
  calculateQuizScore,
  validateQuestionSchema
} from '../helpers/practice-quiz-engine.mjs';

export function register(runner) {
  runner.suite('Tier 1: Feature 2 - Practice Mode & Clinical Rationales', (test) => {
    const mockQuestion = {
      id: 'q_renal_01',
      question: 'Which of the following beta-blockers requires dose adjustment in severe renal impairment?',
      options: ['Atenolol', 'Metoprolol', 'Propranolol', 'Carvedilol'],
      correct_answer_index: 0,
      explanation_en: 'Atenolol is eliminated primarily by the kidneys (~85% excreted unchanged in urine), requiring dosage adjustment in renal impairment. Metoprolol and propranolol undergo extensive hepatic metabolism.',
      explanation_ar: 'يتم التخلص من أتينولول بشكل أساسي عن طريق الكلى (~85٪ يُفرز دون تغيير في البول)، مما يتطلب تعديل الجرعة في القصور الكلوي.',
      clinical_reference: 'Goodman & Gilman Pharmacological Basis of Therapeutics, 14th Ed, Ch. 12',
      difficulty: 'medium'
    };

    test('T1.2.1: Selecting correct option in practice mode reveals instant feedback with English rationale', () => {
      const result = evaluateQuizOptionSelection(mockQuestion, 0, { mode: 'practice', locale: 'en' });
      assert.strictEqual(result.mode, 'practice');
      assert.strictEqual(result.feedback_revealed, true);
      assert.strictEqual(result.is_correct, true);
      assert.strictEqual(result.selected_option_text, 'Atenolol');
      assert.strictEqual(result.correct_option_text, 'Atenolol');
      assert.includes(result.explanation, 'Atenolol is eliminated primarily by the kidneys');
      assert.strictEqual(result.clinical_reference, 'Goodman & Gilman Pharmacological Basis of Therapeutics, 14th Ed, Ch. 12');
    });

    test('T1.2.2: Selecting incorrect option in practice mode reveals instant feedback with is_correct: false', () => {
      const result = evaluateQuizOptionSelection(mockQuestion, 1, { mode: 'practice', locale: 'en' });
      assert.strictEqual(result.feedback_revealed, true);
      assert.strictEqual(result.is_correct, false);
      assert.strictEqual(result.selected_option_text, 'Metoprolol');
      assert.strictEqual(result.correct_option_text, 'Atenolol');
      assert.includes(result.explanation, 'Metoprolol and propranolol undergo extensive hepatic metabolism');
    });

    test('T1.2.3: Practice mode with Arabic locale returns Arabic clinical rationale', () => {
      const result = evaluateQuizOptionSelection(mockQuestion, 0, { mode: 'practice', locale: 'ar' });
      assert.strictEqual(result.locale_used, 'ar');
      assert.includes(result.explanation, 'يتم التخلص من أتينولول بشكل أساسي عن طريق الكلى');
    });

    test('T1.2.4: Standard mode suppresses immediate feedback during quiz progression', () => {
      const result = evaluateQuizOptionSelection(mockQuestion, 0, { mode: 'standard' });
      assert.strictEqual(result.mode, 'standard');
      assert.strictEqual(result.feedback_revealed, false);
      assert.strictEqual(result.is_correct, null);
      assert.strictEqual(result.explanation, null);
      assert.strictEqual(result.clinical_reference, null);
    });

    test('T1.2.5: calculateQuizScore evaluates total, percentage, and passing threshold (>=80%)', () => {
      const questions = [
        mockQuestion,
        { id: 'q2', question: 'Q2', options: ['A', 'B'], correct_answer_index: 1 },
        { id: 'q3', question: 'Q3', options: ['A', 'B'], correct_answer_index: 0 },
        { id: 'q4', question: 'Q4', options: ['A', 'B'], correct_answer_index: 0 },
        { id: 'q5', question: 'Q5', options: ['A', 'B'], correct_answer_index: 1 }
      ];

      // 4 out of 5 correct = 80% (Pass)
      const passingScore = calculateQuizScore(questions, [0, 1, 0, 0, 0]);
      assert.strictEqual(passingScore.total, 5);
      assert.strictEqual(passingScore.correct, 4);
      assert.strictEqual(passingScore.score_percentage, 80);
      assert.strictEqual(passingScore.passed, true);

      // 3 out of 5 correct = 60% (Fail)
      const failingScore = calculateQuizScore(questions, [0, 0, 1, 0, 0]);
      assert.strictEqual(failingScore.correct, 2);
      assert.strictEqual(failingScore.score_percentage, 40);
      assert.strictEqual(failingScore.passed, false);
    });

    test('T1.2.6: validateQuestionSchema validates complete schema with difficulty tiers', () => {
      const valid = validateQuestionSchema(mockQuestion);
      assert.strictEqual(valid.valid, true);

      const invalid = validateQuestionSchema({ id: 'bad', options: ['OnlyOne'] });
      assert.strictEqual(invalid.valid, false);
      assert.includes(invalid.errors.join('; '), 'options must be an array of at least 2');
    });
  });
}
