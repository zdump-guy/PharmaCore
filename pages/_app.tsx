import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SiteContentProvider } from '@/components/SiteContentProvider';
import { inter, tajawal } from '@/lib/fonts';
import { initAnalytics, trackPageView } from '@/lib/analytics';
import '@/styles/globals.css';

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { locale } = router;

  useEffect(() => {
    initAnalytics();
    trackPageView(router.asPath);

    const handleRouteChange = (url: string) => {
      trackPageView(url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

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
      <Analytics />
    </div>
  );
}

export default appWithTranslation(App);

