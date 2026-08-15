import { ReactNode } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useSiteContent } from '@/components/SiteContentProvider';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function Layout({
  children,
  title,
  description,
}: LayoutProps) {
  const { locale, pathname } = useRouter();
  const siteContent = useSiteContent();
  const isAr = locale === 'ar';
  const localeContent = siteContent[isAr ? 'ar' : 'en'];
  const resolvedTitle = title || localeContent.meta_title;
  const resolvedDescription = description || localeContent.meta_description;
  const dir = isAr ? 'rtl' : 'ltr';
  const hideNavbar = pathname === '/login' || pathname === '/admin' || pathname.startsWith('/admin/');

  return (
    <>
      <Head>
        <title>{resolvedTitle}</title>
        <meta name="description" content={resolvedDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <link rel="icon" href={siteContent.branding.favicon_url || "/favicon.ico"} />
        {/* Open Graph */}
        <meta property="og:title" content={resolvedTitle} />
        <meta property="og:description" content={resolvedDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="PharmaCore" />
        {siteContent.branding.preview_image_url && <meta property="og:image" content={siteContent.branding.preview_image_url} />}
        <meta name="twitter:card" content={siteContent.branding.preview_image_url ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={resolvedTitle} />
        <meta name="twitter:description" content={resolvedDescription} />
        {siteContent.branding.preview_image_url && <meta name="twitter:image" content={siteContent.branding.preview_image_url} />}
      </Head>

      <div
        lang={locale}
        dir={dir}
        className="flex min-h-screen flex-col"
      >
        <a href="#main-content" className="fixed left-4 top-3 z-50 -translate-y-20 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-transform focus:translate-y-0">
          {isAr ? 'تخطي إلى المحتوى' : 'Skip to content'}
        </a>
        {!hideNavbar && <Navbar />}
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
