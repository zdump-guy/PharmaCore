import { ReactNode } from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import TopPromoBanner from "@/components/TopPromoBanner"
import { siteMetadata } from "@/lib/siteContent"

interface LayoutProps {
  children: ReactNode
  title?: string
  description?: string
  image?: string
  noindex?: boolean
}

export default function Layout({
  children,
  title,
  description,
  image,
  noindex = false,
}: LayoutProps) {
  const router = useRouter()
  const { locale, pathname, asPath } = router
  const isAr = locale === "ar"
  const metadata = siteMetadata[isAr ? "ar" : "en"]
  const resolvedTitle = title || metadata.title
  const resolvedDescription = description || metadata.description
  const dir = isAr ? "rtl" : "ltr"
  const hideNavbar =
    pathname === "/login" ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")

  // Canonical & Base URLs
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://pharmacore-edu.com"
  const currentPath = asPath.split("?")[0] || ""
  const canonicalUrl = `${siteUrl}${locale === "ar" ? "/ar" : ""}${currentPath === "/" ? "" : currentPath}`
  const ogImage = image || `${siteUrl}/og-image.png`

  // Structured Data JSON-LD
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${siteUrl}/#organization`,
        "name": "PharmaCore",
        "url": siteUrl,
        "logo": `${siteUrl}/pharmacore-logo.svg`,
        "description":
          "A specialized educational platform for pharmacy and pharmacology courses.",
        "sameAs": [
          "https://t.me",
          "https://facebook.com",
          "https://youtube.com"
        ]
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "url": siteUrl,
        "name": "PharmaCore",
        "publisher": {
          "@id": `${siteUrl}/#organization`
        },
        "inLanguage": ["en", "ar"]
      }
    ]
  }

  return (
    <>
      <Head>
        {/* Core Metadata */}
        <title>{resolvedTitle}</title>
        <meta name="description" content={resolvedDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#1e515d" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0d1b1e" media="(prefers-color-scheme: dark)" />

        {/* Indexing Rules */}
        {noindex ? (
          <meta name="robots" content="noindex, nofollow" />
        ) : (
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        )}

        {/* Canonical Link */}
        <link rel="canonical" href={canonicalUrl} />

        {/* Multilingual Hreflang Alternates */}
        <link rel="alternate" hrefLang="en" href={`${siteUrl}${currentPath === "/" ? "" : currentPath}`} />
        <link rel="alternate" hrefLang="ar" href={`${siteUrl}/ar${currentPath === "/" ? "" : currentPath}`} />
        <link rel="alternate" hrefLang="x-default" href={`${siteUrl}${currentPath === "/" ? "" : currentPath}`} />

        {/* Favicons & App Manifest */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/pharmacore-mark.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/pharmacore-mark.svg" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="PharmaCore" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={resolvedTitle} />
        <meta property="og:description" content={resolvedDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="PharmaCore — Specialized Pharmacy Education" />
        <meta property="og:locale" content={isAr ? "ar_EG" : "en_US"} />
        <meta property="og:locale:alternate" content={isAr ? "en_US" : "ar_EG"} />

        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@PharmaCore" />
        <meta name="twitter:creator" content="@PharmaCore" />
        <meta name="twitter:title" content={resolvedTitle} />
        <meta name="twitter:description" content={resolvedDescription} />
        <meta name="twitter:image" content={ogImage} />

        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <div
        lang={locale}
        dir={dir}
        className="flex min-h-screen flex-col"
      >
        <a
          href="#main-content"
          className="fixed left-4 top-3 z-50 -translate-y-20 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-transform focus:translate-y-0 shadow-lg"
        >
          {isAr ? "تخطي إلى المحتوى" : "Skip to content"}
        </a>
        {!hideNavbar && <TopPromoBanner />}
        {!hideNavbar && <Navbar />}
        <main id="main-content" className="flex-1">
          {children}
        </main>
        {!hideNavbar && <Footer />}
      </div>
    </>
  )
}
