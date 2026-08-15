import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabaseClient';
import { Course } from '@/types';
import { useRouter } from 'next/router';

interface HomeProps {
  courses: Course[];
}

export default function Home({ courses }: HomeProps) {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const isAr = locale === 'ar';

  const getTitle = (course: Course) => isAr ? course.title_ar : course.title_en;

  return (
    <Layout
      title={isAr ? 'فارما كور — منصة التعليم الصيدلاني' : 'PharmaCore — Pharmacy Education Platform'}
      description={isAr
        ? 'دورات صيدلانية شاملة على مستوى جامعي — متاحة مجانًا لجميع الطلاب.'
        : 'Comprehensive, university-level pharmacology courses freely accessible to all students.'}
    >
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="animate-fade-up">
            <div className="hero__eyebrow">
              <span>⚗️</span>
              {t('hero.eyebrow')}
            </div>
          </div>
          <h1 id="hero-title" className="hero__title animate-fade-up animate-fade-up--delay-1">
            {t('hero.title')}{' '}
            <span style={{ color: '#8BCDE1' }}>{t('hero.titleAccent')}</span>
          </h1>
          <p className="hero__subtitle animate-fade-up animate-fade-up--delay-2">
            {t('hero.subtitle')}
          </p>
          <div className="hero__cta animate-fade-up animate-fade-up--delay-3">
            <a href="#courses" className="btn btn-primary btn-lg">
              {t('hero.ctaPrimary')}
            </a>
            <a href="#about" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '2px solid rgba(255,255,255,0.25)' }}>
              {t('hero.ctaSecondary')}
            </a>
          </div>
        </div>

        {/* Decorative blobs */}
        <div aria-hidden="true" style={{
          position: 'absolute', bottom: -60, right: isAr ? 'auto' : -60, left: isAr ? -60 : 'auto',
          width: 300, height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,205,225,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
      </section>

      {/* ── About / Features ─────────────────────────── */}
      <section id="about" className="section" aria-labelledby="about-title">
        <div className="container">
          <div className="section-header">
            <span className="section-header__eyebrow">{t('about.eyebrow')}</span>
            <h2 id="about-title" className="section-header__title">{t('about.title')}</h2>
            <p className="section-header__subtitle">{t('about.subtitle')}</p>
          </div>

          <div className="features-grid">
            {[
              { icon: '🎓', titleKey: 'about.feature1Title', descKey: 'about.feature1Desc' },
              { icon: '📹', titleKey: 'about.feature2Title', descKey: 'about.feature2Desc' },
              { icon: '📝', titleKey: 'about.feature3Title', descKey: 'about.feature3Desc' },
              { icon: '💬', titleKey: 'about.feature4Title', descKey: 'about.feature4Desc' },
            ].map((feat, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-card__icon">{feat.icon}</div>
                <h3 className="feature-card__title">{t(feat.titleKey)}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  {t(feat.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Courses ───────────────────────────────────── */}
      <section id="courses" className="section" style={{ background: 'var(--bg-surface)' }} aria-labelledby="courses-title">
        <div className="container">
          <div className="section-header">
            <span className="section-header__eyebrow">{t('courses.eyebrow')}</span>
            <h2 id="courses-title" className="section-header__title">{t('courses.title')}</h2>
            <p className="section-header__subtitle">{t('courses.subtitle')}</p>
          </div>

          {courses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">⚗️</div>
              <p>{t('courses.noCourses')}</p>
            </div>
          ) : (
            <div className="course-grid">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/course/${course.id}`}
                  className="course-card"
                  id={`course-card-${course.id}`}
                  aria-label={getTitle(course)}
                >
                  <div className="course-card__thumb">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={getTitle(course)}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="course-card__thumb-placeholder">⚗️</div>
                    )}
                  </div>
                  <div className="course-card__body">
                    <h3 className="course-card__title">{getTitle(course)}</h3>
                    <div className="course-card__arrow">
                      {t('courses.viewCourse')}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  let courses: Course[] = [];

  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      courses = data;
    }
  } catch {
    // Supabase not yet configured — return empty list
  }

  return {
    props: {
      courses,
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
    revalidate: 60,
  };
};
