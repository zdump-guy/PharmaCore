import type { GetServerSideProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations"
import {
  FiArrowLeft as ArrowLeft,
  FiArrowRight as ArrowRight,
  FiCheck as Check,
  FiCheckCircle as CheckCircle2,
  FiClipboard as ClipboardCheck,
  FiDownload as Download,
  FiExternalLink as ExternalLink,
  FiEye as Eye,
  FiFileText as FileText,
  FiLock as LockKeyhole,
  FiLogIn as LogIn,
} from "react-icons/fi"
import Layout from "@/components/Layout"
import Breadcrumb from "@/components/Breadcrumb"
import PdfPreviewModal from "@/components/ui/pdf-preview-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/AuthProvider"
import { loadSiteContent, type SiteContent } from "@/lib/siteContent"
import { trackQuizStart, trackQuizSubmit } from "@/lib/analytics"
import { getCourseUrl, getLectureUrl, getQuizUrl, getQuizSlug, resolveQuiz, isUuid } from "@/lib/slugs"
import type { Course, Lecture, Quiz } from "@/types"

interface QuizPageProps {
  quiz: Quiz | null
  isLocked: boolean
  course?: Course | null
  lecture?: Lecture | null
  siteContent: SiteContent
}

export default function QuizPage({ quiz, isLocked, course = null, lecture = null }: QuizPageProps) {
  const { locale } = useRouter()
  const isAr = locale === "ar"
  const [activeModal, setActiveModal] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: "",
    title: "",
  })
  const [isPdfCompleted, setIsPdfCompleted] = useState(false)
  const { isAuthenticated } = useAuth()
  const DirectionArrow = isAr ? ArrowRight : ArrowLeft

  const title = quiz ? (isAr ? quiz.title_ar : quiz.title_en) : ""
  const description = quiz ? (isAr ? quiz.description_ar : quiz.description_en) : ""
  const courseTitle = course ? (isAr ? course.title_ar : course.title_en) : ""
  const lectureTitle = lecture ? (isAr ? lecture.title_ar : lecture.title_en) : ""

  useEffect(() => {
    if (quiz) {
      trackQuizStart({
        quizId: quiz.id,
        quizTitle: title,
        lectureId: quiz.lecture_id,
        courseId: quiz.course_id,
        totalQuestions: 1,
      })
    }
  }, [quiz, title])

  if (!quiz) {
    return (
      <Layout title="Quiz not found">
        <div className="page-shell section-space text-center">
          <ClipboardCheck className="mx-auto size-12 text-muted-foreground" />
          <h1 className="mt-5 text-3xl font-bold">{isAr ? "الاختبار غير موجود" : "Assessment not found"}</h1>
          <Button className="mt-4" asChild>
            <Link href="/#courses">{isAr ? "العودة للمقررات" : "Browse Courses"}</Link>
          </Button>
        </div>
      </Layout>
    )
  }

  const isGated = isLocked && !isAuthenticated
  const backHref = lecture
    ? getLectureUrl(lecture, isAr)
    : course
    ? getCourseUrl(course, isAr)
    : "/#courses"

  const handleTogglePdfCompleted = () => {
    const next = !isPdfCompleted
    setIsPdfCompleted(next)
    if (next) {
      trackQuizSubmit({
        quizId: quiz.id,
        quizTitle: title,
        score: 1,
        totalQuestions: 1,
        percentage: 100,
        passed: true,
      })
    }
  }

  const handleDownloadFile = (fileUrl: string, fileTitle: string) => {
    const a = document.createElement("a")
    a.href = fileUrl
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    const hasExt = fileTitle.toLowerCase().endsWith(".pdf")
    a.download = fileTitle.replace(/[\\/:*?"<>|]/g, "_") + (hasExt ? "" : ".pdf")
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const copy = isAr
    ? {
        back: "العودة للمحاضرة",
        assessmentBadge: "ورقة تقييم وتدريب إكلينيكي (PDF)",
        introTitle: "ورقة الاختبار والتقييم السريري",
        introDesc:
          "يوفر هذا التقييم ملف أسئلة إكلينيكية بصيغة PDF معدة من قبل المرشد الأكاديمي، ونموذج إجابات تفصيلي للمراجعة الذاتية وتثبيت المفاهيم الصيدلانية.",
        previewWorksheet: "معاينة ورقة الأسئلة",
        downloadWorksheet: "تحميل ورقة الأسئلة",
        previewSolution: "معاينة نموذج الإجابة والشرح",
        downloadSolution: "تحميل نموذج الإجابة",
        openNewTab: "فتح في نافذة جديدة",
        markCompleted: "تحديد ورقة الاختبار كمكتملة ومُراجَعة",
        completedBadge: "تم إكمال ومراجعة ورقة التقييم بنجاح",
        pendingWorksheet: "ورقة الأسئلة قيد التجهيز من قبل المرشد الأكاديمي.",
        solutionTitle: "نموذج الإجابات والشرح التفصيلي",
        solutionDesc: "راجع إجاباتك النموذجية مع التفسيرات الدوائية والشروح السريرية المعتمدة.",
        questionsSheetTitle: "ورقة أسئلة التقييم",
        questionsSheetDesc: "تحتوي على الحالات الإكلينيكية والأسئلة التحليلية الخاصة بالمحاضرة.",
        lockedTitle: "هذا التقييم مخصص للطلاب المسجلين",
        lockedDesc: "سجل الدخول بحساب الطالب الخاص بك للوصول إلى أوراق التقييم ونماذج الإجابات.",
        signInCta: "تسجيل الدخول / إنشاء حساب",
        reviewLecture: "مراجعة المحاضرة",
        courseOverview: "فهرس المقرر",
      }
    : {
        back: "Back to lecture",
        assessmentBadge: "Clinical PDF Assessment & Worksheet",
        introTitle: "Clinical Assessment Worksheet",
        introDesc:
          "This module provides a clinical worksheet assessment prepared by your academic mentor along with official model answers and pharmacological explanations for self-review.",
        previewWorksheet: "Preview Questions Sheet",
        downloadWorksheet: "Download Worksheet PDF",
        previewSolution: "Preview Model Solutions",
        downloadSolution: "Download Solutions PDF",
        openNewTab: "Open in New Tab",
        markCompleted: "Mark Worksheet as Completed & Reviewed",
        completedBadge: "Worksheet completed and reviewed",
        pendingWorksheet: "Assessment worksheet is currently being prepared by the instructor.",
        solutionTitle: "Model Solutions & Explanations",
        solutionDesc: "Review verified clinical answers with in-depth pharmacological rationales.",
        questionsSheetTitle: "Questions Assessment Sheet",
        questionsSheetDesc: "Contains clinical scenario cases, checkpoint questions, and problem sets.",
        lockedTitle: "This assessment is reserved for registered students",
        lockedDesc: "Sign in with your student account to access full assessment sheets and solution keys.",
        signInCta: "Sign In / Register Free",
        reviewLecture: "Review Lecture",
        courseOverview: "Course Overview",
      }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pharma-core-edu.vercel.app"
  const quizUrl = `${siteUrl}${getQuizUrl(quiz, isAr)}`
  const courseFullUrl = course ? `${siteUrl}${getCourseUrl(course, isAr)}` : undefined
  const lectureFullUrl = lecture ? `${siteUrl}${getLectureUrl(lecture, isAr)}` : undefined

  const quizSchema = [
    {
      "@type": "Quiz",
      "@id": `${quizUrl}#quiz`,
      "name": title,
      "description": description || title,
      "learningResourceType": "Assessment Worksheet",
      "educationalLevel": "HigherEducation",
      "inLanguage": isAr ? "ar" : "en",
      "url": quizUrl,
      ...(courseFullUrl ? {
        "isPartOf": {
          "@type": "Course",
          "name": courseTitle,
          "url": courseFullUrl,
        }
      } : {}),
      ...(lectureFullUrl ? {
        "about": {
          "@type": "LearningResource",
          "name": lectureTitle,
          "url": lectureFullUrl,
        }
      } : {}),
    }
  ]

  const breadcrumbs = [
    { label: isAr ? "المقررات" : "Courses", href: "/#courses" },
    ...(course
      ? [{ label: courseTitle, href: getCourseUrl(course, isAr) }]
      : []),
    ...(lecture
      ? [{ label: lectureTitle, href: getLectureUrl(lecture, isAr) }]
      : []),
    { label: title },
  ]

  return (
    <Layout
      title={`${title} — PharmaCore`}
      description={description || `${title} assessment sheet and model solutions on PharmaCore.`}
      type="article"
      schema={quizSchema}
    >
      <section className="border-b bg-muted/40">
        <div className="page-shell py-6 sm:py-8 lg:py-12">
          <Breadcrumb items={breadcrumbs} className="mb-4" />

          <Button variant="ghost" className="-ms-4 mb-4 sm:mb-6" asChild>
            <Link href={backHref}>
              <DirectionArrow className="size-4" />
              <span>{copy.back}</span>
            </Link>
          </Button>

          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 font-bold text-xs gap-1.5 py-1 px-2.5">
                <FileText className="size-3.5" />
                <span>{copy.assessmentBadge}</span>
              </Badge>
              {course && (
                <Badge variant="secondary" className="text-xs font-semibold">
                  {courseTitle}
                </Badge>
              )}
              {lecture && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  {isAr ? `المحاضرة ${lecture.order}` : `Lecture ${lecture.order}`}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                {description}
              </p>
            ) : (
              <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                {copy.introDesc}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-shell max-w-4xl space-y-6">
          {/* Gated Access Banner for logged-out users */}
          {isGated && (
            <Card className="border-amber-500/30 bg-amber-500/5 shadow-none mb-6">
              <CardContent className="p-6 text-center space-y-3">
                <LockKeyhole className="mx-auto size-8 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-lg text-foreground">{copy.lockedTitle}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  {copy.lockedDesc}
                </p>
                <Button size="default" className="font-bold gap-2" asChild>
                  <Link href={`/login?returnUrl=${encodeURIComponent(getQuizUrl(quiz, false))}&tab=signup`}>
                    <LogIn className="size-4 shrink-0" />
                    <span>{copy.signInCta}</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* 1. Questions Sheet Card */}
          <Card className="rounded-2xl border bg-card shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 shrink-0">
                  <FileText className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-bold border-red-500/30 text-red-700 dark:text-red-300 bg-red-500/5">
                      PDF Worksheet
                    </Badge>
                  </div>
                  <CardTitle className="text-base sm:text-lg font-bold mt-0.5">
                    {copy.questionsSheetTitle}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {copy.questionsSheetDesc}
              </p>

              {quiz.pdf_url ? (
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() =>
                      setActiveModal({
                        open: true,
                        url: quiz.pdf_url!,
                        title: `${title} — ${isAr ? "ورقة الأسئلة" : "Questions Sheet"}`,
                      })
                    }
                    className="min-h-[40px] h-10 px-4 text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
                  >
                    <Eye className="size-3.5 shrink-0" />
                    <span>{copy.previewWorksheet}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleDownloadFile(
                        quiz.pdf_url!,
                        `${title}_Questions_Sheet`
                      )
                    }
                    className="min-h-[40px] h-10 px-4 text-xs font-bold gap-1.5 border-border hover:border-primary/40 hover:bg-muted/80 shadow-xs cursor-pointer"
                  >
                    <Download className="size-3.5 text-muted-foreground shrink-0" />
                    <span>{copy.downloadWorksheet}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(quiz.pdf_url!, "_blank", "noopener,noreferrer")}
                    className="min-h-[40px] h-10 px-3 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground"
                    title={copy.openNewTab}
                  >
                    <ExternalLink className="size-3.5 shrink-0" />
                    <span className="hidden sm:inline">{copy.openNewTab}</span>
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground bg-muted/20">
                  {copy.pendingWorksheet}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Model Solution & Explanation Card (if present) */}
          {quiz.solution_pdf_url && (
            <Card className="rounded-2xl border bg-card shadow-xs overflow-hidden">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    <CheckCircle2 className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/5">
                        {isAr ? "نموذج الإجابة" : "Solution Key"}
                      </Badge>
                    </div>
                    <CardTitle className="text-base sm:text-lg font-bold mt-0.5">
                      {copy.solutionTitle}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {copy.solutionDesc}
                </p>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() =>
                      setActiveModal({
                        open: true,
                        url: quiz.solution_pdf_url!,
                        title: `${title} — ${isAr ? "نموذج الإجابة والشرح" : "Model Answers & Explanation"}`,
                      })
                    }
                    className="min-h-[40px] h-10 px-4 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                  >
                    <Eye className="size-3.5 shrink-0" />
                    <span>{copy.previewSolution}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleDownloadFile(
                        quiz.solution_pdf_url!,
                        `${title}_Solution_Explanation`
                      )
                    }
                    className="min-h-[40px] h-10 px-4 text-xs font-bold gap-1.5 border-border hover:border-emerald-500/40 hover:bg-muted/80 shadow-xs cursor-pointer"
                  >
                    <Download className="size-3.5 text-muted-foreground shrink-0" />
                    <span>{copy.downloadSolution}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(quiz.solution_pdf_url!, "_blank", "noopener,noreferrer")}
                    className="min-h-[40px] h-10 px-3 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground"
                    title={copy.openNewTab}
                  >
                    <ExternalLink className="size-3.5 shrink-0" />
                    <span className="hidden sm:inline">{copy.openNewTab}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3. Student Completion Tracker */}
          <div className="rounded-2xl border p-4 sm:p-5 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-bold text-sm sm:text-base text-foreground">
                {isPdfCompleted ? (isAr ? "✅ تم تقييم ومراجعة ورقة الاختبار" : "✅ Assessment Sheet Completed") : (isAr ? "إتمام التقييم الذاتي" : "Self-Assessment Progress")}
              </h4>
              <p className="text-xs text-muted-foreground">
                {isPdfCompleted ? copy.completedBadge : copy.introDesc}
              </p>
            </div>

            <Button
              type="button"
              variant={isPdfCompleted ? "default" : "outline"}
              size="sm"
              onClick={handleTogglePdfCompleted}
              className={`min-h-[42px] px-4 font-bold text-xs gap-2 shrink-0 rounded-xl transition-all cursor-pointer ${
                isPdfCompleted
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm"
                  : "border-border hover:border-primary/40 text-foreground"
              }`}
            >
              {isPdfCompleted ? <Check className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0 text-muted-foreground" />}
              <span>{isPdfCompleted ? copy.completedBadge : copy.markCompleted}</span>
            </Button>
          </div>

          {/* 4. Sequential Navigation Footer */}
          <nav className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t" aria-label="Assessment Navigation">
            {lecture ? (
              <Button variant="outline" className="w-full sm:w-auto min-h-[44px] gap-2 rounded-xl" asChild>
                <Link href={getLectureUrl(lecture, isAr)}>
                  <DirectionArrow className="size-4 shrink-0 text-primary" />
                  <span>{copy.reviewLecture}: {lectureTitle}</span>
                </Link>
              </Button>
            ) : course ? (
              <Button variant="outline" className="w-full sm:w-auto min-h-[44px] gap-2 rounded-xl" asChild>
                <Link href={getCourseUrl(course, isAr)}>
                  <DirectionArrow className="size-4 shrink-0 text-primary" />
                  <span>{copy.courseOverview}: {courseTitle}</span>
                </Link>
              </Button>
            ) : null}

            {course && (
              <Button variant="secondary" className="w-full sm:w-auto min-h-[44px] gap-2 rounded-xl ms-auto" asChild>
                <Link href={getCourseUrl(course, isAr)}>
                  <span>{copy.courseOverview}</span>
                  {isAr ? <ArrowLeft className="size-4 shrink-0" /> : <ArrowRight className="size-4 shrink-0" />}
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </section>

      {/* PDF Modal Viewer */}
      <PdfPreviewModal
        open={activeModal.open}
        onOpenChange={(open) => setActiveModal((prev) => ({ ...prev, open }))}
        url={activeModal.url}
        title={activeModal.title}
        isAr={isAr}
      />
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps<QuizPageProps> = async ({ params, query, locale, res }) => {
  const id = params?.id as string
  let quiz: Quiz | null = null
  let isLocked = false
  let course: Course | null = null
  let lecture: Lecture | null = null

  if (res) {
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300")
  }

  if (supabase && id) {
    try {
      const { quiz: resolvedQuiz, allQuizzes } = await resolveQuiz(id)
      if (resolvedQuiz) {
        // If accessed by old raw UUID, issue permanent 308 redirect to clean slug URL
        if (isUuid(id)) {
          const canonicalSlug = getQuizSlug(resolvedQuiz, allQuizzes)
          const prefix = locale === "ar" ? "/ar" : ""
          const queryParams = { ...query }
          delete queryParams.id
          const qs = new URLSearchParams(queryParams as Record<string, string>).toString()
          return {
            redirect: {
              destination: `${prefix}/quiz/${canonicalSlug}${qs ? `?${qs}` : ""}`,
              permanent: true,
            },
          }
        }

        quiz = resolvedQuiz
        const courseId = resolvedQuiz.course_id
        const lectureId = resolvedQuiz.lecture_id

        const [courseResult, lectureResult, siteContent, translations] = await Promise.all([
          courseId ? supabase.from("courses").select("*").eq("id", courseId).maybeSingle() : Promise.resolve({ data: null }),
          lectureId ? supabase.from("lectures").select("*").eq("id", lectureId).maybeSingle() : Promise.resolve({ data: null }),
          loadSiteContent(),
          serverSideTranslations(locale ?? "en", ["common"]),
        ])

        const courseData = courseResult.data
        if (courseData) {
          course = courseData
          isLocked = Boolean(
            courseData.is_locked ||
            courseData.access_policy === "students_only" ||
            courseData.access_policy === "enrolled_only"
          )
        }

        if (lectureResult.data) {
          lecture = lectureResult.data
        }

        return {
          props: {
            quiz,
            isLocked,
            course,
            lecture,
            siteContent,
            ...translations,
          },
        }
      }
    } catch {}
  }

  const [siteContent, translations] = await Promise.all([
    loadSiteContent(),
    serverSideTranslations(locale ?? "en", ["common"]),
  ])

  return {
    props: {
      quiz,
      isLocked,
      course,
      lecture,
      siteContent,
      ...translations,
    },
  }
}
