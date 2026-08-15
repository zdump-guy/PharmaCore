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
        style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <Navbar />
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
