import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from '@/components/ThemeProvider';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const { locale, pathname, asPath, query } = router;
  const isAr = locale === 'ar';

  const switchLocale = (newLocale: string) => {
    router.push({ pathname, query }, asPath, { locale: newLocale });
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="container navbar__inner">
        {/* Logo */}
        <Link href="/" className="navbar__logo" id="navbar-logo">
          <div className="navbar__logo-icon" aria-hidden="true">Rx</div>
          <span>PharmaCore</span>
        </Link>

        {/* Controls */}
        <div className="navbar__controls">
          {/* Language Switcher */}
          <div className="lang-switcher" role="group" aria-label="Language switcher">
            <button
              id="lang-en-btn"
              className={`lang-switcher__btn${locale === 'en' ? ' lang-switcher__btn--active' : ''}`}
              onClick={() => switchLocale('en')}
              aria-pressed={locale === 'en'}
            >
              EN
            </button>
            <button
              id="lang-ar-btn"
              className={`lang-switcher__btn${locale === 'ar' ? ' lang-switcher__btn--active' : ''}`}
              onClick={() => switchLocale('ar')}
              aria-pressed={locale === 'ar'}
            >
              ع
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? (isAr ? 'تفعيل الوضع الفاتح' : 'Switch to light mode') : (isAr ? 'تفعيل الوضع الداكن' : 'Switch to dark mode')}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </nav>
  );
}
