import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const router = useRouter();
  const isAr = locale === 'ar';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      console.error('Login error:', error);
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      router.replace('/admin');
    }
  };

  return (
    <Layout
      title={isAr ? 'تسجيل دخول المشرف — فارما كور' : 'Admin Login — PharmaCore'}
      description="Secure admin access for PharmaCore platform management."
    >
      <div style={{
        minHeight: 'calc(100vh - var(--navbar-height) - 200px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px 36px',
          boxShadow: 'var(--shadow-lg)',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 56, height: 56,
              background: 'var(--gradient-brand)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', fontWeight: 800, color: 'white',
              margin: '0 auto 16px',
            }}>
              Rx
            </div>
            <h1 style={{ fontSize: '1.5rem' }}>{t('login.title')}</h1>
            <p style={{ marginTop: 6, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {t('login.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label htmlFor="login-email">{t('login.email')}</label>
              <input
                id="login-email"
                type="email"
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@pharmacore.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">{t('login.password')}</label>
              <input
                id="login-password"
                type="password"
                className="input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            {status === 'error' && (
              <p className="error-message" role="alert">{errorMsg || t('login.error')}</p>
            )}

            <button
              id="login-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={status === 'submitting'}
              style={{ marginTop: 8 }}
            >
              {status === 'submitting' ? t('login.submitting') : t('login.submit')}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};
