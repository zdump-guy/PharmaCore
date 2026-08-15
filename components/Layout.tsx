import { ReactNode } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function Layout({
  children,
  title = 'PharmaCore',
  description = 'A specialized educational platform for pharmacy and pharmacology courses.',
}: LayoutProps) {
  const { locale } = useRouter();
  const isAr = locale === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
      </Head>

      <div
        lang={locale}
        dir={dir}
        className="flex min-h-screen flex-col"
      >
        <a href="#main-content" className="fixed left-4 top-3 z-50 -translate-y-20 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-transform focus:translate-y-0">
          {isAr ? 'تخطي إلى المحتوى' : 'Skip to content'}
        </a>
        <Navbar />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
