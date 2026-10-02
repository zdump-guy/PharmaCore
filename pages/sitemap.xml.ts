import type { GetServerSideProps } from "next"
import { supabase } from "@/lib/supabaseClient"
import { getCourseSlug, getLectureSlug, getQuizSlug } from "@/lib/slugs"

export default function Sitemap() {
  return null
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pharma-core-edu.vercel.app"

  let courses: { id: string; title_en: string; updated_at?: string; created_at?: string }[] = []
  let lectures: { id: string; title_en: string; updated_at?: string; created_at?: string }[] = []
  let quizzes: { id: string; title_en: string; created_at?: string }[] = []

  if (supabase) {
    try {
      const [coursesRes, lecturesRes, quizzesRes] = await Promise.all([
        supabase.from("courses").select("id, title_en, updated_at, created_at"),
        supabase.from("lectures").select("id, title_en, updated_at, created_at"),
        supabase.from("quizzes").select("id, title_en, created_at"),
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

  // Course pages with clean semantic slugs
  for (const course of courses) {
    const courseSlug = getCourseSlug(course)
    const urlEn = `${baseUrl}/course/${courseSlug}`
    const urlAr = `${baseUrl}/ar/course/${courseSlug}`
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

  // Lecture pages with clean semantic slugs
  for (const lecture of lectures) {
    const lectureSlug = getLectureSlug(lecture, lectures)
    const urlEn = `${baseUrl}/lecture/${lectureSlug}`
    const urlAr = `${baseUrl}/ar/lecture/${lectureSlug}`
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

  // Quiz assessment pages with clean semantic slugs
  for (const quiz of quizzes) {
    const quizSlug = getQuizSlug(quiz, quizzes)
    const urlEn = `${baseUrl}/quiz/${quizSlug}`
    const urlAr = `${baseUrl}/ar/quiz/${quizSlug}`
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

  if (res) {
    res.setHeader("Content-Type", "application/xml")
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=43200")
    res.write(sitemapXml)
    res.end()
  }

  return {
    props: {},
  }
}
