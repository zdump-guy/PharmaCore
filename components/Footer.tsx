import { useTranslation } from 'next-i18next';
import Link from 'next/link';

const teamMembers = [
  { name: 'Mohamed Mostafa Othman Ibrahim', role: 'Dev & Maintainer', links: [] },
  // Add more team members here
];

const socialLinks = [
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: '🔗' },
  { label: 'Portfolio', href: 'https://onevoxel.com', icon: '🌐' },
  { label: 'GitHub', href: 'https://github.com', icon: '💻' },
];

export default function Footer() {
  const { t } = useTranslation('common');
  const year = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer__grid">
          {/* Section 1: Team */}
          <div>
            <p className="footer__section-title">{t('footer.teamTitle', 'Our Team')}</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
              {t('footer.teamDesc', 'Built with passion by a dedicated team of pharmacy educators and developers.')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {teamMembers.map((m) => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--gradient-brand)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0
                  }}>
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Developer Credit */}
          <div>
            <p className="footer__section-title">{t('footer.devTitle', 'Developer & Maintainer')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Mohamed Mostafa Othman Ibrahim
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Freelance UI/UX & Front-End Developer
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--color-accent-1)', fontWeight: 600 }}>
                <span>⬡</span> One Voxel
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    id={`footer-link-${link.label.toLowerCase()}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem', fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-accent-1)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--color-accent-1)';
                    }}
                    onMouseOut={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                    }}
                  >
                    <span>{link.icon}</span> {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p>© {year} PharmaCore. {t('footer.rights', 'All rights reserved.')} · {t('footer.madeBy', 'Crafted by')} <strong>One Voxel</strong></p>
        </div>
      </div>
    </footer>
  );
}
