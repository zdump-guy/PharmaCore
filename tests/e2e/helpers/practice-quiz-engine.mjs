/**
 * Practice Mode Quiz Simulator & Bilingual Clinical Rationales Engine
 * Conforms to ORIGINAL_REQUEST § R2 and PROJECT.md § Interface Contracts
 */

/**
 * Validates a Question structure including new rationales and difficulty fields
 * @param {Object} question
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateQuestionSchema(question) {
  const errors = [];
  if (!question || typeof question !== 'object') {
    return { valid: false, errors: ['Question must be an object'] };
  }
  if (!question.id || typeof question.id !== 'string') {
    errors.push('Question missing valid id string');
  }
  if (!question.question || typeof question.question !== 'string') {
    errors.push('Question missing question text');
  }
  if (!Array.isArray(question.options) || question.options.length < 2) {
    errors.push('Question options must be an array of at least 2 strings');
  }
  if (
    typeof question.correct_answer_index !== 'number' ||
    question.correct_answer_index < 0 ||
    (Array.isArray(question.options) && question.correct_answer_index >= question.options.length)
  ) {
    errors.push('Question correct_answer_index is out of range');
  }
  if (question.difficulty && !['easy', 'medium', 'hard'].includes(question.difficulty)) {
    errors.push(`Invalid difficulty: "${question.difficulty}". Must be easy, medium, or hard`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Simulates selecting an answer in Practice Mode vs Standard Mode
 * @param {Object} question - The Question object
 * @param {number} selectedIndex - The option index chosen by student
 * @param {Object} options - Config options { mode: 'practice'|'standard', locale: 'en'|'ar' }
 * @returns {Object} Instant feedback in practice mode, or deferred response in standard mode
 */
export function evaluateQuizOptionSelection(question, selectedIndex, options = { mode: 'practice', locale: 'en' }) {
  const mode = options.mode || 'practice';
  const locale = options.locale || 'en';

  if (!question || !Array.isArray(question.options)) {
    throw new Error('Invalid question object provided');
  }

  if (typeof selectedIndex !== 'number' || selectedIndex < 0 || selectedIndex >= question.options.length) {
    throw new Error(`Selected option index ${selectedIndex} is out of bounds [0, ${question.options.length - 1}]`);
  }

  const isCorrect = selectedIndex === question.correct_answer_index;

  if (mode === 'standard') {
    // In standard mode, feedback is withheld during the quiz
    return {
      mode: 'standard',
      question_id: question.id,
      selected_index: selectedIndex,
      feedback_revealed: false,
      is_correct: null,
      explanation: null,
      clinical_reference: null
    };
  }

  // In practice mode, instant feedback with bilingual rationale and clinical reference
  const primaryExplanation = locale === 'ar' 
    ? (question.explanation_ar || question.explanation_en || 'لا يوجد شرح متاح حالياً.')
    : (question.explanation_en || question.explanation_ar || 'No clinical explanation available.');

  return {
    mode: 'practice',
    question_id: question.id,
    selected_index: selectedIndex,
    selected_option_text: question.options[selectedIndex],
    correct_index: question.correct_answer_index,
    correct_option_text: question.options[question.correct_answer_index],
    feedback_revealed: true,
    is_correct: isCorrect,
    locale_used: locale,
    explanation: primaryExplanation,
    explanation_en: question.explanation_en || null,
    explanation_ar: question.explanation_ar || null,
    clinical_reference: question.clinical_reference || null,
    difficulty: question.difficulty || 'medium'
  };
}

/**
 * Calculates quiz submission score and itemized breakdown
 * @param {Object[]} questions - List of questions
 * @param {number[]} userAnswers - Array of selected indices
 * @returns {{ total: number, correct: number, score_percentage: number, passed: boolean, breakdown: Object[] }}
 */
export function calculateQuizScore(questions, userAnswers) {
  if (!Array.isArray(questions) || !Array.isArray(userAnswers)) {
    throw new Error('questions and userAnswers must be arrays');
  }
  if (questions.length !== userAnswers.length) {
    throw new Error(`Mismatch between questions length (${questions.length}) and answers length (${userAnswers.length})`);
  }

  let correctCount = 0;
  const breakdown = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const userAns = userAnswers[i];
    const isCorrect = userAns === q.correct_answer_index;
    if (isCorrect) correctCount++;
    breakdown.push({
      question_id: q.id,
      selected_index: userAns,
      correct_index: q.correct_answer_index,
      is_correct: isCorrect
    });
  }

  const scorePercentage = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;

  return {
    total: questions.length,
    correct: correctCount,
    score_percentage: Math.round(scorePercentage * 100) / 100,
    passed: scorePercentage >= 80, // Mastery threshold is 80%
    breakdown
  };
}
