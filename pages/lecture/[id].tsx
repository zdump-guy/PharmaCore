import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabaseClient';
import { Lecture, Resource, Quiz, CommunityQuestion } from '@/types';

interface LecturePageProps {
  lecture: Lecture | null;
  resources: Resource[];
  quizzes: Quiz[];
  questions: CommunityQuestion[];
  courseId: string | null;
}

// ── Q&A Submission Form ─────────────────────────────────────────
function QAForm({ lectureId, onSubmitted }: { lectureId: string; onSubmitted: () => void }) {
  const { t } = useTranslation('common');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !text.trim()) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/questions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureId, authorName: name, authorEmail: email, text }),
      });
      if (res.ok) {
        setStatus('success');
        setName(''); setEmail(''); setText('');
        onSubmitted();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="form-group">
          <label htmlFor="qa-name">{t('lecture.qaNamePlaceholder')}</label>
          <input id="qa-name" className="input" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder={t('lecture.qaNamePlaceholder')} />
        </div>
        <div className="form-group">
          <label htmlFor="qa-email">{t('lecture.qaEmailPlaceholder')}</label>
          <input id="qa-email" className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={t('lecture.qaEmailPlaceholder')} />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="qa-text">{t('lecture.qa')}</label>
        <textarea id="qa-text" className="input" value={text} onChange={e => setText(e.target.value)} required placeholder={t('lecture.qaPlaceholder')} rows={3} />
      </div>
      <div>
        <button id="qa-submit-btn" type="submit" className="btn btn-primary" disabled={status === 'submitting'}>
          {status === 'submitting' ? t('lecture.qaSubmitting') : t('lecture.qaSubmit')}
        </button>
      </div>
      {status === 'success' && (
        <p style={{ color: '#38a169', fontWeight: 600, fontSize: '0.9rem' }}>✓ {t('lecture.qaSuccess')}</p>
      )}
      {status === 'error' && (
        <p className="error-message">{t('common.error')}</p>
      )}
    </form>
  );
}

// ── Main Page ───────────────────────────────────────────────────
export default function LecturePage({ lecture, resources, quizzes, questions: initialQuestions, courseId }: LecturePageProps) {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const isAr = locale === 'ar';
  const [questions, setQuestions] = useState(initialQuestions);

  if (!lecture) {
    return (
      <Layout title="Lecture Not Found">
        <div className="container section">
          <div className="empty-state"><div className="empty-state__icon">🔍</div><h2>Lecture not found</h2></div>
        </div>
      </Layout>
    );
  }

  const title = isAr ? lecture.title_ar : lecture.title_en;
  const details = isAr ? lecture.details_ar : lecture.details_en;

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/\s]{11})/);
    return match ? match[1] : null;
  };
  const videoId = getYouTubeId(lecture.youtube_url);

  const refreshQuestions = async () => {
    const { data } = await supabase
      .from('community_questions')
      .select('*, answers:community_answers(*, responder:users(full_name, role))')
      .eq('lecture_id', lecture.id)
      .order('created_at', { ascending: false });
    if (data) setQuestions(data);
  };

  return (
    <Layout title={`${title} — PharmaCore`} description={details}>
      {/* Back */}
      {courseId && (
        <div className="container" style={{ paddingTop: 24 }}>
          <Link href={`/course/${courseId}`} className="btn btn-ghost btn-sm">
            {t('common.backToCourse')}
          </Link>
        </div>
      )}

      {/* Lecture Header */}
      <div className="container section--sm">
        <div className="badge" style={{ marginBottom: 12 }}>📖 {isAr ? 'محاضرة' : 'Lecture'}</div>
        <h1 style={{ marginBottom: 16 }}>{title}</h1>
        {details && <p style={{ fontSize: '1.05rem', maxWidth: 680 }}>{details}</p>}
      </div>

      {/* Video */}
      {videoId && (
        <div className="container" style={{ marginBottom: 48 }}>
          <div className="video-wrapper">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: 'none' }}
            />
          </div>
        </div>
      )}

      {/* Resources + Quiz (side by side) */}
      <div className="container" style={{ marginBottom: 64 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'start' }}>

          {/* Resources */}
          <div>
            <h2 style={{ marginBottom: 20, fontSize: '1.3rem' }}>📎 {t('lecture.resources')}</h2>
            {resources.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('lecture.noResources')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {resources.map(res => {
                  const resTitle = isAr ? res.title_ar : res.title_en;
                  const icon = res.type === 'pdf' ? '📄' : res.type === 'image' ? '🖼️' : '📎';
                  return (
                    <a
                      key={res.id}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      id={`resource-${res.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem', fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--color-accent-1)')}
                      onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                    >
                      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                      {resTitle}
                      <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.8rem' }}>↗</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quizzes */}
          {quizzes.length > 0 && (
            <div>
              <h2 style={{ marginBottom: 20, fontSize: '1.3rem' }}>📝 {isAr ? 'الاختبارات' : 'Quizzes'}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {quizzes.map(quiz => (
                  <Link
                    key={quiz.id}
                    href={`/quiz/${quiz.id}`}
                    id={`quiz-btn-${quiz.id}`}
                    className="btn btn-outline"
                  >
                    📝 {isAr ? quiz.title_ar : quiz.title_en}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Q&A */}
      <div className="container section--sm" style={{ borderTop: '1px solid var(--border-color)' }}>
        <h2 style={{ marginBottom: 28 }}>💬 {t('lecture.qa')}</h2>

        <QAForm lectureId={lecture.id} onSubmitted={refreshQuestions} />

        {/* Questions List */}
        <div className="qa-section">
          {questions.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 24px' }}>
              <div className="empty-state__icon">💬</div>
              <p>{t('lecture.qaNoQuestions')}</p>
            </div>
          ) : (
            questions.map(q => (
              <div key={q.id} className="qa-question-card">
                <div className="qa-question-header">
                  <div className="qa-author">
                    <div className="qa-avatar">{q.author_name.charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{q.author_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(q.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
                <p style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>{q.text}</p>
                {q.answers && q.answers.map(ans => (
                  <div key={ans.id} className="qa-answer">
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent-1)', marginBottom: 6 }}>
                      ✦ {ans.responder?.full_name ?? 'Admin'} · {isAr ? 'مشرف' : 'Admin'}
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{ans.text}</p>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params, locale }) => {
  const id = params?.id as string;
  let lecture: Lecture | null = null;
  let resources: Resource[] = [];
  let quizzes: Quiz[] = [];
  let questions: CommunityQuestion[] = [];
  let courseId: string | null = null;

  try {
    const { data: lec } = await supabase.from('lectures').select('*').eq('id', id).single();
    if (lec) { lecture = lec; courseId = lec.course_id; }

    const { data: res } = await supabase.from('resources').select('*').eq('lecture_id', id);
    if (res) resources = res;

    const { data: qz } = await supabase.from('quizzes').select('*').eq('lecture_id', id);
    if (qz) quizzes = qz;

    const { data: qa } = await supabase
      .from('community_questions')
      .select('*, answers:community_answers(*)')
      .eq('lecture_id', id)
      .order('created_at', { ascending: false });
    if (qa) questions = qa;
  } catch {}

  return {
    props: {
      lecture,
      resources,
      quizzes,
      questions,
      courseId,
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};
