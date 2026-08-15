import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabaseClient';
import { Quiz, Question } from '@/types';

interface QuizPageProps {
  quiz: Quiz | null;
  questions: Question[];
}

interface Answer {
  questionId: string;
  value: string;
}

export default function QuizPage({ quiz, questions }: QuizPageProps) {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const isAr = locale === 'ar';

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  if (!quiz) {
    return (
      <Layout title="Quiz Not Found">
        <div className="container section">
          <div className="empty-state"><div className="empty-state__icon">🔍</div><h2>Quiz not found</h2></div>
        </div>
      </Layout>
    );
  }

  const title = isAr ? quiz.title_ar : quiz.title_en;

  const setAnswer = (questionId: string, value: string) => {
    setAnswers(prev => {
      const filtered = prev.filter(a => a.questionId !== questionId);
      return [...filtered, { questionId, value }];
    });
  };

  const getAnswer = (questionId: string) => answers.find(a => a.questionId === questionId)?.value ?? '';

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach(q => {
      const userAnswer = getAnswer(q.id).trim().toLowerCase();
      const correctAnswer = q.correct_answer.trim().toLowerCase();
      if (userAnswer === correctAnswer) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetake = () => {
    setAnswers([]);
    setSubmitted(false);
    setScore(0);
  };

  const isCorrect = (q: Question) => getAnswer(q.id).trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const backHref = quiz.lecture_id ? `/lecture/${quiz.lecture_id}` : quiz.course_id ? `/course/${quiz.course_id}` : '/';

  return (
    <Layout title={`${title} — PharmaCore`} description={`Quiz: ${title}`}>
      <div className="container" style={{ paddingTop: 32, maxWidth: 760 }}>

        {/* Back */}
        <Link href={backHref} className="btn btn-ghost btn-sm" style={{ marginBottom: 24, display: 'inline-flex' }}>
          ← {isAr ? 'رجوع' : 'Back'}
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div className="badge" style={{ marginBottom: 12 }}>📝 {isAr ? 'اختبار' : 'Quiz'}</div>
          <h1>{title}</h1>
          <p style={{ marginTop: 8, color: 'var(--text-muted)' }}>
            {questions.length} {isAr ? 'سؤال' : 'questions'}
          </p>
        </div>

        {/* ── Result Card (after submit) ── */}
        {submitted && (
          <div className="quiz-result-card" style={{ marginBottom: 48 }}>
            <div className="quiz-score">{pct}%</div>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 8 }}>{t('quiz.yourScore')}</p>
            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
              {score} / {questions.length} {isAr ? 'إجابة صحيحة' : 'correct answers'}
            </p>
            <button id="quiz-retake-btn" className="btn btn-outline" style={{ marginTop: 24 }} onClick={handleRetake}>
              🔄 {t('quiz.retake')}
            </button>
          </div>
        )}

        {/* ── Questions ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {questions.map((q, i) => {
            const questionText = isAr ? q.text_ar : q.text_en;
            const userAnswer = getAnswer(q.id);
            const correct = isCorrect(q);

            return (
              <div key={q.id} id={`question-${q.id}`} style={{
                padding: 28,
                background: 'var(--bg-card)',
                border: submitted
                  ? `2px solid ${correct ? '#48bb78' : '#e53e3e'}`
                  : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
              }}>
                {/* Question text */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
                  <div style={{
                    minWidth: 32, height: 32, borderRadius: '50%',
                    background: 'var(--gradient-brand)',
                    color: 'white', fontWeight: 700, fontSize: '0.85rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {i + 1}
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                    {questionText}
                  </p>
                </div>

                {/* MCQ / True-False Options */}
                {(q.type === 'multiple_choice' || q.type === 'true_false') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(q.type === 'true_false'
                      ? [t('quiz.trueOption'), t('quiz.falseOption')]
                      : (q.options ?? [])
                    ).map((opt, oi) => {
                      const isSelected = userAnswer === opt;
                      const isCorrectOpt = opt.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
                      let cls = 'quiz-option';
                      if (submitted) {
                        if (isCorrectOpt) cls += ' quiz-option--correct';
                        else if (isSelected && !isCorrectOpt) cls += ' quiz-option--incorrect';
                      } else if (isSelected) {
                        cls += ' quiz-option--selected';
                      }
                      return (
                        <button
                          key={oi}
                          id={`q-${q.id}-opt-${oi}`}
                          className={cls}
                          onClick={() => !submitted && setAnswer(q.id, opt)}
                          disabled={submitted}
                          type="button"
                        >
                          <span style={{
                            width: 24, height: 24, borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--color-accent-1)' : 'var(--border-color)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                            background: isSelected ? 'var(--color-accent-1)' : 'transparent',
                          }}>
                            {isSelected && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Short Text */}
                {q.type === 'short_text' && (
                  <textarea
                    id={`q-${q.id}-text`}
                    className="input"
                    value={userAnswer}
                    onChange={e => !submitted && setAnswer(q.id, e.target.value)}
                    disabled={submitted}
                    placeholder={t('quiz.shortAnswerPlaceholder')}
                    rows={2}
                  />
                )}

                {/* Correct answer reveal */}
                {submitted && !correct && (
                  <div style={{
                    marginTop: 14, padding: '10px 14px',
                    background: 'rgba(72,187,120,0.08)',
                    border: '1px solid rgba(72,187,120,0.25)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                  }}>
                    <span style={{ color: '#38a169', fontWeight: 600 }}>✓ {t('quiz.correctAnswer')}:</span>{' '}
                    <span style={{ color: 'var(--text-primary)' }}>{q.correct_answer}</span>
                  </div>
                )}
                {submitted && <div style={{ marginTop: 10, fontWeight: 700, fontSize: '0.9rem', color: correct ? '#38a169' : '#c53030' }}>
                  {correct ? `✓ ${t('quiz.correct')}` : `✗ ${t('quiz.incorrect')}`}
                </div>}
              </div>
            );
          })}
        </div>

        {/* Submit */}
        {!submitted && questions.length > 0 && (
          <div style={{ marginTop: 40, marginBottom: 60, textAlign: 'center' }}>
            <button
              id="quiz-submit-btn"
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
            >
              ✓ {t('quiz.submit')}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params, locale }) => {
  const id = params?.id as string;
  let quiz: Quiz | null = null;
  let questions: Question[] = [];

  try {
    const { data: quizData } = await supabase.from('quizzes').select('*').eq('id', id).single();
    if (quizData) quiz = quizData;

    const { data: qData } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', id)
      .order('order', { ascending: true });
    if (qData) questions = qData;
  } catch {}

  return {
    props: {
      quiz,
      questions,
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};
