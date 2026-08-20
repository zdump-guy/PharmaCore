/**
 * Tier 2 - Feature 2: Practice Mode & Rationales Boundary & Corner Cases
 * Tests edge cases: out-of-bounds index, missing translations, 0 questions, 0% vs 100%.
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  evaluateQuizOptionSelection,
  calculateQuizScore,
  validateQuestionSchema
} from '../helpers/practice-quiz-engine.mjs';

export function register(runner) {
  runner.suite('Tier 2: Feature 2 - Practice Mode Boundaries', (test) => {
    const baseQuestion = {
      id: 'q_bound_1',
      question: 'Digoxin therapeutic drug monitoring question',
      options: ['Option A', 'Option B'],
      correct_answer_index: 0
    };

    test('T2.2.1: Selecting negative or out-of-bounds option index throws descriptive error', () => {
      assert.throws(
        () => evaluateQuizOptionSelection(baseQuestion, -1),
        'out of bounds',
        'Should throw on negative index'
      );

      assert.throws(
        () => evaluateQuizOptionSelection(baseQuestion, 5),
        'out of bounds',
        'Should throw on index exceeding options length'
      );
    });

    test('T2.2.2: Question with missing bilingual rationales returns default fallback message', () => {
      const qNoExp = { ...baseQuestion };
      const resEn = evaluateQuizOptionSelection(qNoExp, 0, { mode: 'practice', locale: 'en' });
      assert.strictEqual(resEn.explanation, 'No clinical explanation available.');

      const resAr = evaluateQuizOptionSelection(qNoExp, 0, { mode: 'practice', locale: 'ar' });
      assert.strictEqual(resAr.explanation, 'لا يوجد شرح متاح حالياً.');
    });

    test('T2.2.3: Quiz score calculation with 0 questions returns 0% without NaN error', () => {
      const res = calculateQuizScore([], []);
      assert.strictEqual(res.total, 0);
      assert.strictEqual(res.correct, 0);
      assert.strictEqual(res.score_percentage, 0);
      assert.strictEqual(res.passed, false);
      assert.strictEqual(isNaN(res.score_percentage), false);
    });

    test('T2.2.4: Quiz score calculation with mismatched answers array throws error', () => {
      assert.throws(
        () => calculateQuizScore([baseQuestion], [0, 1]),
        'Mismatch between questions length',
        'Should detect mismatched lengths'
      );
    });

    test('T2.2.5: Perfect score (100%) and zero score (0%) evaluate boundaries accurately', () => {
      const qList = [
        { id: 'q1', correct_answer_index: 0, options: ['A', 'B'] },
        { id: 'q2', correct_answer_index: 1, options: ['A', 'B'] }
      ];

      const zeroScore = calculateQuizScore(qList, [1, 0]);
      assert.strictEqual(zeroScore.score_percentage, 0);
      assert.strictEqual(zeroScore.passed, false);

      const perfectScore = calculateQuizScore(qList, [0, 1]);
      assert.strictEqual(perfectScore.score_percentage, 100);
      assert.strictEqual(perfectScore.passed, true);
    });

    test('T2.2.6: Question schema validator rejects single option or invalid difficulty values', () => {
      const singleOption = { id: 'q1', question: 'Q?', options: ['A'], correct_answer_index: 0 };
      const res1 = validateQuestionSchema(singleOption);
      assert.strictEqual(res1.valid, false);

      const invalidDiff = { id: 'q2', question: 'Q?', options: ['A', 'B'], correct_answer_index: 0, difficulty: 'impossible' };
      const res2 = validateQuestionSchema(invalidDiff);
      assert.strictEqual(res2.valid, false);
      assert.includes(res2.errors[0], 'Invalid difficulty');
    });
  });
}
