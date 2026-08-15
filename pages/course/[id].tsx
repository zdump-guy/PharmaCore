import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabaseClient';
import { Course, Lecture } from '@/types';

interface CoursePageProps {
  course: Course | null;
  lectures: Lecture[];
}

export default function CoursePage({ course, lectures }: CoursePageProps) {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const isAr = locale === 'ar';

  if (!course) {
    return (
      <Layout title="Course Not Found">
        <div className="container section">
          <div className="empty-state">
            <div className="empty-state__icon">🔍</div>
            <h2>Course not found</h2>
          </div>
        </div>
      </Layout>
    );
  }

  const title = isAr ? course.title_ar : course.title_en;
  const description = isAr ? course.description_ar : course.description_en;
  const objectives = isAr ? course.objectives_ar : course.objectives_en;
  const prerequisites = isAr ? course.prerequisites_ar : course.prerequisites_en;

  return (
    <Layout
      title={`${title} — PharmaCore`}
      description={description}
    >
      {/* Course Header */}
      <div style={{ background: 'var(--gradient-hero)', paddingBlock: '64px 80px', position: 'relative', overflow: 'hidden' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/#courses" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', marginBottom: 24, display: 'inline-flex' }}>
            {t('common.backToCourses')}
          </Link>
          {course.thumbnail_url && (
            <div style={{ marginBottom: 24 }}>
              <img
                src={course.thumbnail_url}
                alt={title}
                style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}
              />
            </div>
          )}
          <div className="badge" style={{ background: 'rgba(139,205,225,0.15)', borderColor: 'rgba(139,205,225,0.3)', color: '#8BCDE1', marginBottom: 16 }}>
            ⚗️ {isAr ? 'دورة' : 'Course'}
          </div>
          <h1 style={{ color: 'white', marginBottom: 16 }}>{title}</h1>
          {description && (
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.05rem', maxWidth: 680, lineHeight: 1.7 }}>
              {description}
            </p>
          )}
          <div style={{ marginTop: 24, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
            📚 {t('course.lectureCount', { count: lectures.length })}
          </div>
        </div>
      </div>

      {/* Course Body */}
      <div className="container section--sm">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 48, alignItems: 'start' }}>

          {/* Lecture List */}
          <div>
            <h2 style={{ marginBottom: 24 }}>{t('course.lectures')}</h2>
            {lectures.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">📭</div>
                <p>{isAr ? 'لا توجد محاضرات بعد.' : 'No lectures yet.'}</p>
              </div>
            ) : (
              <ul className="lecture-list" aria-label={t('course.lectures')}>
                {lectures.map((lecture, i) => (
                  <li key={lecture.id}>
                    <Link
                      href={`/lecture/${lecture.id}`}
                      className="lecture-item"
                      id={`lecture-item-${lecture.id}`}
                    >
                      <div className="lecture-item__num">{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div className="lecture-item__title">
                          {isAr ? lecture.title_ar : lecture.title_en}
                        </div>
                        {(isAr ? lecture.details_ar : lecture.details_en) && (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {(isAr ? lecture.details_ar : lecture.details_en).substring(0, 80)}…
                          </div>
                        )}
                      </div>
                      <span className="lecture-item__icon" aria-hidden="true">▶</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Sidebar: Objectives & Prerequisites */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'sticky', top: 'calc(var(--navbar-height) + 24px)' }}>
            {objectives && (
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: '1rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  🎯 {t('course.objectives')}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{objectives}</p>
              </div>
            )}
            {prerequisites && (
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: '1rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  📋 {t('course.prerequisites')}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{prerequisites}</p>
              </div>
            )}
            {lectures.length > 0 && (
              <Link href={`/lecture/${lectures[0].id}`} className="btn btn-primary">
                {t('course.startLearning')}
              </Link>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params, locale }) => {
  const id = params?.id as string;

  let course: Course | null = null;
  let lectures: Lecture[] = [];

  try {
    const { data: courseData } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (courseData) course = courseData;

    const { data: lectureData } = await supabase
      .from('lectures')
      .select('*')
      .eq('course_id', id)
      .order('order', { ascending: true });

    if (lectureData) lectures = lectureData;
  } catch {}

  return {
    props: {
      course,
      lectures,
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};
