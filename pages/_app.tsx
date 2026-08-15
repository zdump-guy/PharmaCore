import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SiteContentProvider } from '@/components/SiteContentProvider';
import { inter, tajawal } from '@/lib/fonts';
import '@/styles/globals.css';

function App({ Component, pageProps }: AppProps) {
  const { locale } = useRouter();

  useEffect(() => {
    const isArabic = locale === 'ar';
    document.documentElement.lang = isArabic ? 'ar' : 'en';
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
  }, [locale]);

  return (
    <div className={`${inter.variable} ${tajawal.variable} font-sans`}>
      <ThemeProvider>
        <SiteContentProvider initialContent={pageProps.siteContent}>
          <Component {...pageProps} />
        </SiteContentProvider>
      </ThemeProvider>
    </div>
  );
}

export default appWithTranslation(App);
