import { ReactNode } from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import Breadcrumb from "@/components/Breadcrumb"
import { siteMetadata } from "@/lib/siteContent"

interface LayoutProps {
  children: ReactNode
  title?: string
  description?: string
  image?: string
  keywords?: string[] | string
  type?: "website" | "article" | "profile"
  noindex?: boolean
  schema?: Record<string, unknown> | Record<string, unknown>[]
  canonical?: string
  breadcrumbs?: { label: string; href?: string }[]
}

export default function Layout({
  children,
  title,
  description,
  image,
  keywords,
  type = "website",
  noindex = false,
  schema,
  canonical,
  breadcrumbs,
}: LayoutProps) {
  const router = useRouter()
  const { locale, pathname, asPath } = router
  const isAr = locale === "ar"
  const metadata = siteMetadata[isAr ? "ar" : "en"]
  const resolvedTitle = title || metadata.title
  const resolvedDescription = description || metadata.description
  const resolvedKeywords = keywords
    ? Array.isArray(keywords)
      ? keywords.join(", ")
      : keywords
    : metadata.keywords.join(", ")

  const dir = isAr ? "rtl" : "ltr"
  const hideNavbar =
    pathname === "/login" ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")

  // Canonical & Base URLs
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://pharma-core-edu.vercel.app"
  const currentPath = asPath.split("?")[0].split("#")[0] || "/"
  const cleanPath = currentPath.replace(/^\/(?:ar|en)(?=\/|$)/, "") || "/"
  const normalizedPath = cleanPath === "/" ? "" : cleanPath
  const canonicalUrl =
    canonical ||
    `${siteUrl}${locale === "ar" ? "/ar" : ""}${normalizedPath}`
  const ogImage = image
    ? image.startsWith("http")
      ? image
      : `${siteUrl}${image.startsWith("/") ? "" : "/"}${image}`
    : `${siteUrl}/${isAr ? "og-image-ar.png" : "og-image.png"}`

  // Structured Data JSON-LD
  const baseGraph = [
    {
      "@type": "EducationalOrganization",
      "@id": `${siteUrl}/#organization`,
      "name": "PharmaCore",
      "alternateName": isAr ? "فارماكور" : "PharmaCore Education",
      "url": siteUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/pharmacore-logo.svg`,
        "width": 281,
        "height": 60,
      },
      "image": `${siteUrl}/og-image.png`,
      "description":
        "A specialized educational platform for pharmacy and clinical pharmacology courses.",
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
      "alternateName": isAr ? "فارماكور للتعليم الصيدلي" : "PharmaCore Clinical Education",
      "publisher": {
        "@id": `${siteUrl}/#organization`
      },
      "inLanguage": ["en", "ar"],
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${siteUrl}/#courses?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    }
  ]

  const customGraph = schema ? (Array.isArray(schema) ? schema : [schema]) : []
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [...baseGraph, ...customGraph]
  }

  return (
    <>
      <Head>
        {/* Core Metadata */}
        <title>{resolvedTitle}</title>
        <meta name="description" content={resolvedDescription} />
        <meta name="keywords" content={resolvedKeywords} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta charSet="utf-8" />
        <meta name="author" content="PharmaCore Clinical Education Team" />
        <meta name="creator" content="Mohamed Mostafa Othman Ibrahim (One Voxel)" />
        <meta name="publisher" content="PharmaCore" />
        <meta name="format-detection" content="telephone=no" />

        {/* Browser & OS Theme Colors */}
        <meta name="theme-color" content="#1e515d" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0d1b1e" media="(prefers-color-scheme: dark)" />
        <meta name="msapplication-TileColor" content="#1e515d" />
        <meta name="msapplication-TileImage" content="/mstile-150x150.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Apple iOS Web App Capabilities */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PharmaCore" />
        <meta name="application-name" content="PharmaCore" />

        {/* Indexing & Crawling Directives */}
        {noindex ? (
          <meta name="robots" content="noindex, nofollow" />
        ) : (
          <meta
            name="robots"
            content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
          />
        )}

        {/* Canonical Link & Multilingual Hreflang Alternates */}
        {!noindex && (
          <>
            <link rel="canonical" href={canonicalUrl} />
            <link rel="alternate" hrefLang="en" href={`${siteUrl}${normalizedPath}`} />
            <link rel="alternate" hrefLang="ar" href={`${siteUrl}/ar${normalizedPath}`} />
            <link rel="alternate" hrefLang="x-default" href={`${siteUrl}${normalizedPath}`} />
          </>
        )}

        {/* Complete Favicons & App Icons Suite */}
        <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/svg+xml" href="/pharmacore-mark.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#1e515d" />
        <link rel="manifest" href="/site.webmanifest" />
        <link
          rel="search"
          type="application/opensearchdescription+xml"
          href="/opensearch.xml"
          title="PharmaCore"
        />

        {/* Open Graph / Facebook / LinkedIn / WhatsApp */}
        <meta property="og:type" content={type} />
        <meta property="og:site_name" content="PharmaCore" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={resolvedTitle} />
        <meta property="og:description" content={resolvedDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:secure_url" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={resolvedTitle} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:locale" content={isAr ? "ar_EG" : "en_US"} />
        <meta property="og:locale:alternate" content={isAr ? "en_US" : "ar_EG"} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@PharmaCore" />
        <meta name="twitter:creator" content="@PharmaCore" />
        <meta name="twitter:title" content={resolvedTitle} />
        <meta name="twitter:description" content={resolvedDescription} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content={resolvedTitle} />

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
        {!hideNavbar && <Navbar />}
        <main id="main-content" className="flex-1">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="page-shell pt-4">
              <Breadcrumb items={breadcrumbs} />
            </div>
          )}
          {children}
        </main>
        {!hideNavbar && <Footer />}
      </div>
    </>
  )
}
