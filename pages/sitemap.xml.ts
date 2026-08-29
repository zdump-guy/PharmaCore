import type { GetServerSideProps } from "next"
import { supabase } from "@/lib/supabaseClient"

export default function Sitemap() {
  return null
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pharma-core-edu.vercel.app"

  let courses: { id: string; updated_at?: string; created_at?: string }[] = []
  let lectures: { id: string; updated_at?: string; created_at?: string }[] = []
  let quizzes: { id: string; created_at?: string }[] = []

  if (supabase) {
    try {
      const [coursesRes, lecturesRes, quizzesRes] = await Promise.all([
        supabase.from("courses").select("id, updated_at, created_at"),
        supabase.from("lectures").select("id, updated_at, created_at"),
        supabase.from("quizzes").select("id, created_at"),
      ])
      if (coursesRes.data) courses = coursesRes.data
      if (lecturesRes.data) lectures = lecturesRes.data
      if (quizzesRes.data) quizzes = quizzesRes.data
    } catch {
      // Fallback
    }
  }

  const staticPages = [
    { path: "", priority: "1.0", changefreq: "daily" },
    { path: "login", priority: "0.8", changefreq: "monthly" },
  ]

  const urls: string[] = []

  // Static pages
  for (const page of staticPages) {
    const urlEn = page.path ? `${baseUrl}/${page.path}` : `${baseUrl}`
    const urlAr = page.path ? `${baseUrl}/ar/${page.path}` : `${baseUrl}/ar`
    const lastmod = new Date().toISOString().split("T")[0]

    urls.push(`  <url>
    <loc>${urlEn}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${urlEn}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${urlAr}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${urlEn}"/>
  </url>`)

    urls.push(`  <url>
    <loc>${urlAr}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${urlEn}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${urlAr}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${urlEn}"/>
  </url>`)
  }

  // Course pages
  for (const course of courses) {
    const urlEn = `${baseUrl}/course/${course.id}`
    const urlAr = `${baseUrl}/ar/course/${course.id}`
    const lastmod = (course.updated_at || course.created_at || new Date().toISOString()).split("T")[0]

    urls.push(`  <url>
    <loc>${urlEn}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${urlEn}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${urlAr}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${urlEn}"/>
  </url>`)

    urls.push(`  <url>
    <loc>${urlAr}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${urlEn}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${urlAr}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${urlEn}"/>
  </url>`)
  }

  // Lecture pages
  for (const lecture of lectures) {
    const urlEn = `${baseUrl}/lecture/${lecture.id}`
    const urlAr = `${baseUrl}/ar/lecture/${lecture.id}`
    const lastmod = (lecture.updated_at || lecture.created_at || new Date().toISOString()).split("T")[0]

    urls.push(`  <url>
    <loc>${urlEn}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${urlEn}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${urlAr}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${urlEn}"/>
  </url>`)

    urls.push(`  <url>
    <loc>${urlAr}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${urlEn}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${urlAr}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${urlEn}"/>
  </url>`)
  }

  // Quiz pages
  for (const quiz of quizzes) {
    const urlEn = `${baseUrl}/quiz/${quiz.id}`
    const urlAr = `${baseUrl}/ar/quiz/${quiz.id}`
    const lastmod = (quiz.created_at || new Date().toISOString()).split("T")[0]

    urls.push(`  <url>
    <loc>${urlEn}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${urlEn}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${urlAr}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${urlEn}"/>
  </url>`)

    urls.push(`  <url>
    <loc>${urlAr}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${urlEn}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${urlAr}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${urlEn}"/>
  </url>`)
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`

  res.setHeader("Content-Type", "text/xml; charset=utf-8")
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=43200")
  res.write(sitemapXml)
  res.end()

  return {
    props: {},
  }
}
