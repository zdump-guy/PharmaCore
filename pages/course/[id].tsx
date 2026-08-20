import type { GetServerSideProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState, useRef } from "react"
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations"
import {
  FiArrowLeft as ArrowLeft,
  FiArrowRight as ArrowRight,
  FiAward as Award,
  FiBookOpen as BookOpen,
  FiCheckCircle as CheckCircle2,
  FiCheckSquare as CheckSquare,
  FiClipboard as ClipboardCheck,
  FiClock as Clock,
  FiCpu as Cpu,
  FiFileText as FileText,
  FiGlobe as Globe,
  FiLayers as Layers,
  FiLock as LockKeyhole,
  FiMessageSquare as MessageSquare,
  FiPlayCircle as PlayCircle,
} from "react-icons/fi"
import { FaGraduationCap as GraduationCap } from "react-icons/fa6"
import Layout from "@/components/Layout"
import Turnstile, { type TurnstileRef } from "@/components/Turnstile"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabaseClient"
import { loadSiteContent, type SiteContent } from "@/lib/siteContent"
import { resolveCourseFeatures } from "@/lib/featureFlags"
import { getDirectImageUrl } from "@/lib/utils"
import { trackCourseView } from "@/lib/analytics"
import type { Course, Lecture } from "@/types"

interface CoursePageProps {
  course: Course | null
  lectures: Lecture[]
  siteContent: SiteContent
}

export default function CoursePage({ course, lectures, siteContent }: CoursePageProps) {
  const { locale } = useRouter()
  const isAr = locale === "ar"
  const DirectionArrow = isAr ? ArrowRight : ArrowLeft
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrollmentStatus, setEnrollmentStatus] = useState<"active" | "pending" | "rejected" | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollMessage, setEnrollMessage] = useState<string | null>(null)
  const [completedLecturesCount, setCompletedLecturesCount] = useState(0)
  const [turnstileToken, setTurnstileToken] = useState("")
  const turnstileRef = useRef<TurnstileRef>(null)

  // Track session status and check enrollment
  useEffect(() => {
    if (!supabase || !course) return

    async function checkAuthAndEnrollment() {
      const {
        data: { session },
      } = await supabase!.auth.getSession()
      const isAuth = Boolean(session?.user)
      setIsAuthenticated(isAuth)
      setSessionToken(session?.access_token || null)

      if (session?.user && session?.access_token) {
        try {
          const res = await fetch(`/api/courses/${course!.id}/enroll`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
          if (res.ok) {
            const data = await res.json()
            setIsEnrolled(Boolean(data.isEnrolled))
            setEnrollmentStatus(data.status || null)
          }

          // Fetch user completed lectures for this course from analytics
          const { data: events } = await supabase!
            .from("analytics_events")
            .select("properties")
            .eq("user_id", session.user.id)
            .eq("event_name", "video_milestone")

          if (events) {
            const completedIds = new Set<string>()
            for (const evt of events) {
              const props = evt.properties as Record<string, unknown> | null
              if ((props?.percent === 100 || props?.milestone === 100) && typeof props?.lectureId === "string") {
                completedIds.add(props.lectureId)
              }
            }
            const count = lectures.filter((l) => completedIds.has(l.id)).length
            setCompletedLecturesCount(count)
          }
        } catch {
          // Continue
        }
      }
    }

    checkAuthAndEnrollment()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user))
      setSessionToken(session?.access_token || null)
    })

    return () => subscription.unsubscribe()
  }, [course, lectures])

  const handleEnroll = async () => {
    if (!sessionToken || !course) return
    setEnrolling(true)
    setEnrollMessage(null)
    try {
      const res = await fetch(`/api/courses/${course.id}/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          turnstileToken,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        if (data.status === "active") {
          setIsEnrolled(true)
          setEnrollmentStatus("active")
        } else if (data.status === "pending") {
          setIsEnrolled(false)
          setEnrollmentStatus("pending")
        }
        setEnrollMessage(isAr ? data.message_ar || data.message : data.message)
        turnstileRef.current?.reset()
      } else {
        turnstileRef.current?.reset()
        setEnrollMessage(data.error || (isAr ? "تعذر إتمام التسجيل" : "Failed to enroll"))
      }
    } catch {
      turnstileRef.current?.reset()
      setEnrollMessage(isAr ? "حدث خطأ أثناء الاشتراك" : "An error occurred during enrollment")
    } finally {
      setEnrolling(false)
    }
  }

  useEffect(() => {
    if (course) {
      trackCourseView({
        courseId: course.id,
        courseTitle: isAr ? course.title_ar : course.title_en,
        locale: locale || "en",
      })
    }
  }, [course, isAr, locale])

  if (!course) {
    return (
      <Layout title="Course not found">
        <div className="page-shell section-space text-center py-24">
          <div className="size-16 grid place-items-center rounded-3xl bg-muted/60 text-muted-foreground mx-auto">
            <BookOpen className="size-8" />
          </div>
          <h1 className="mt-6 text-3xl font-black">{isAr ? "المقرر غير موجود" : "Course not found"}</h1>
          <Button className="mt-6 rounded-full px-6" asChild>
            <Link href="/#courses">{isAr ? "العودة للمقررات" : "Back to courses"}</Link>
          </Button>
        </div>
      </Layout>
    )
  }

  const isEnrolledOnly = course.access_policy === "enrolled_only"
  const isStudentsOnly = course.access_policy === "students_only" || course.is_locked
  const needsAuth = (isStudentsOnly || isEnrolledOnly) && !isAuthenticated
  const isPendingApproval = enrollmentStatus === "pending"
  const needsEnrollment = isEnrolledOnly && isAuthenticated && !isEnrolled
  const needsAuthToWatch = needsAuth || needsEnrollment

  const resolvedFeatures = resolveCourseFeatures(
    siteContent?.features,
    course.feature_overrides
  )

  const title = isAr ? course.title_ar : course.title_en
  const description = (isAr ? course.description_ar : course.description_en) ?? ""
  const objectives = ((isAr ? course.objectives_ar : course.objectives_en) ?? "").split(/[.،]\s*/).filter(Boolean)
  const prerequisites = (isAr ? course.prerequisites_ar : course.prerequisites_en) ?? ""
  const coverUrl = getDirectImageUrl(course.thumbnail_url)

  const progressPercent = lectures.length > 0 ? Math.round((completedLecturesCount / lectures.length) * 100) : 0

  const copy = isAr
    ? {
        label: "مقرر سريري معتمد",
        back: "العودة إلى المقررات",
        lectures: "المنهج والمحاضرات",
        intro: "منهج سريري متكامل من المفاهيم الأساسية إلى التطبيق الدوائي.",
        overview: "نظرة عامة على المنهج",
        goals: "المخرجات التعليمية والأهداف",
        req: "المتطلبات القبلية",
        start: "بدء المحاضرة الأولى",
        continue: "متابعة المحاضرات",
        startLocked: "تسجيل الدخول لبدء المتابعة",
        startEnroll: isPendingApproval ? "طلبك قيد المراجعة والاعتماد" : "طلب الانضمام للمقرر",
        enrollBtn: isEnrolledOnly ? "طلب الانضمام للمقرر (بانتظار الاعتماد)" : "اشترك في هذا المقرر مجانًا",
        enrolledBadge: "أنت مسجل في هذا المقرر",
        pendingBadge: "طلب الانضمام قيد المراجعة",
        lesson: "محاضرة",
        open: "فتح المحاضرة",
        openLocked: "تسجيل الدخول للمشاهدة",
        progress: "نسبة إنجازك للمقرر",
        ready: "جاهز للبدء والتطبيق السريري",
        free: "وصول مفتوح",
        lockedBadge: "للطلاب المسجلين",
        enrolledOnlyBadge: "يتطلب موافقة تسجيل",
        lockedNotice: "هذا المقرر متاح مجانًا للطلاب المسجلين. سجّل حسابك في ثوانٍ للوصول لجميع المحاضرات والاختبارات.",
        enrolledNotice: isPendingApproval
          ? "تم استلام طلب انضمامك وهو الآن قيد مراجعة المشرف الأكاديمي. سيتم تفعيل وصولك فور الاعتماد."
          : "هذا المقرر مخصص للمسجلين فيه فقط. انقر على زر طلب الانضمام أدناه لإرسال طلبك للإدارة.",
      }
    : {
        label: "Clinical Course",
        back: "Back to Courses",
        lectures: "Curriculum & Lectures",
        intro: "A comprehensive clinical curriculum from first principles to therapeutics.",
        overview: "Curriculum Overview",
        goals: "Clinical Learning Objectives",
        req: "Prerequisites",
        start: "Start First Lecture",
        continue: "Continue Learning",
        startLocked: "Sign in to watch",
        startEnroll: isPendingApproval ? "Pending Admin Approval" : "Enroll in Course",
        enrollBtn: isEnrolledOnly ? "Request Enrollment (Approval Required)" : "Enroll in Course (Free)",
        enrolledBadge: "Enrolled in Course",
        pendingBadge: "Enrollment Pending Review",
        lesson: "Lectures",
        open: "Open Lecture",
        openLocked: "Sign In to Watch",
        progress: "Course Completion Progress",
        ready: "Ready for clinical application",
        free: "Open Access",
        lockedBadge: "Registered Students Only",
        enrolledOnlyBadge: "Approval Required",
        lockedNotice: "This course is free for registered students. Create your free account to access all lectures and quizzes.",
        enrolledNotice: isPendingApproval
          ? "Your enrollment request is pending review by the academic supervisor. Access will be granted upon approval."
          : "This course requires approved enrollment. Click below to submit your access request.",
      }

  return (
    <Layout title={`${title} — PharmaCore`} description={description}>
      {/* ─── COURSE HERO HEADER ───────────────────────────────────────────── */}
      <section className="relative border-b border-border/70 bg-muted/30">
        <div className="hero-glow pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="page-shell py-8 sm:py-12 lg:py-16 relative">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            className="-ms-3 mb-6 rounded-full text-xs font-bold gap-1.5 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/#courses">
              <DirectionArrow className="size-3.5 shrink-0" />
              <span>{copy.back}</span>
            </Link>
          </Button>

          <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
            {/* Left Header Content */}
            <div className="space-y-4 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1.5 bg-background/80 backdrop-blur-md text-primary font-bold">
                  <GraduationCap className="size-3.5 shrink-0" />
                  <span>{copy.label}</span>
                </Badge>

                {isEnrolledOnly ? (
                  <Badge variant="warning" className="gap-1">
                    <LockKeyhole className="size-3 shrink-0" />
                    <span>{copy.enrolledOnlyBadge}</span>
                  </Badge>
                ) : isStudentsOnly ? (
                  <Badge variant="secondary" className="gap-1">
                    <LockKeyhole className="size-3 shrink-0" />
                    <span>{copy.lockedBadge}</span>
                  </Badge>
                ) : (
                  <Badge variant="success" className="gap-1">
                    <Globe className="size-3 shrink-0" />
                    <span>{copy.free}</span>
                  </Badge>
                )}

                {isEnrolled && (
                  <Badge variant="success" className="gap-1 font-bold">
                    <CheckCircle2 className="size-3 shrink-0" />
                    <span>{copy.enrolledBadge}</span>
                  </Badge>
                )}

                {isPendingApproval && (
                  <Badge variant="warning" className="gap-1 font-bold animate-pulse">
                    <Clock className="size-3 shrink-0" />
                    <span>{copy.pendingBadge}</span>
                  </Badge>
                )}
              </div>

              <h1 className="text-balance text-3xl font-black leading-tight sm:text-4xl lg:text-5xl text-foreground">
                {title}
              </h1>

              <p className="body-lead text-base sm:text-lg text-muted-foreground leading-relaxed">
                {description}
              </p>

              {/* Course Badges */}
              <div className="flex flex-wrap gap-2.5 pt-2 text-xs font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-3.5 py-1.5 shadow-2xs">
                  <Layers className="size-3.5 text-primary shrink-0" />
                  <span>{lectures.length} {copy.lesson}</span>
                </span>
                {resolvedFeatures.certificates && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-3.5 py-1.5 shadow-2xs">
                    <Award className="size-3.5 text-primary shrink-0" />
                    <span>{isAr ? "شهادة إتمام عند النجاح" : "Certificate on Completion"}</span>
                  </span>
                )}
                {resolvedFeatures.ai_assistant && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/5 text-purple-700 dark:text-purple-300 px-3.5 py-1.5 shadow-2xs font-semibold">
                    <Cpu className="size-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>{isAr ? "المساعد الإكلينيكي الذكي" : "AI Clinical Assistant"}</span>
                  </span>
                )}
                {resolvedFeatures.practice_mode && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 px-3.5 py-1.5 shadow-2xs font-semibold">
                    <CheckSquare className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{isAr ? "وضع التدريب والتعليلات" : "Practice Mode & Rationales"}</span>
                  </span>
                )}
                {resolvedFeatures.community_qa && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-300 px-3.5 py-1.5 shadow-2xs font-semibold">
                    <MessageSquare className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>{isAr ? "مجتمع النقاش والأسئلة" : "Mentor & Peer Q&A"}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right Card: Sticky Progress & Enrollment */}
            <Card className="border-border/80 bg-card/95 backdrop-blur-xl shadow-xl shadow-primary/5 rounded-3xl overflow-hidden">
              {coverUrl && (
                <div
                  className="h-44 bg-cover bg-center relative border-b border-border/60"
                  style={{ backgroundImage: `url(${coverUrl})` }}
                  role="img"
                  aria-label={`${title} cover`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                </div>
              )}

              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-foreground">{copy.progress}</span>
                    <span className="font-mono text-primary font-black">{progressPercent}% ({completedLecturesCount}/{lectures.length})</span>
                  </div>
                  <Progress value={progressPercent} className="h-2.5" />
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {needsAuth
                    ? copy.lockedNotice
                    : isPendingApproval
                    ? copy.enrolledNotice
                    : needsEnrollment
                    ? copy.enrolledNotice
                    : isEnrolled
                    ? (isAr ? `أنت مسجل في هذا المقرر. أنجزت ${completedLecturesCount} من أصل ${lectures.length} محاضرة.` : `You are enrolled in this course. You have completed ${completedLecturesCount} of ${lectures.length} lectures.`)
                    : copy.intro}
                </p>

                {/* Enrollment Button */}
                {isAuthenticated && !isEnrolled && !isPendingApproval && (
                  <div className="space-y-2.5">
                    <Turnstile
                      ref={turnstileRef}
                      action="course_enroll"
                      size="flexible"
                      appearance="interaction-only"
                      onVerify={(token) => setTurnstileToken(token)}
                      onExpire={() => setTurnstileToken("")}
                    />
                    <Button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      size="lg"
                      className="w-full rounded-full font-bold shadow-md shadow-primary/20 gap-2 bg-primary hover:bg-primary/90 h-12"
                    >
                      <ClipboardCheck className="size-4 shrink-0" />
                      <span>{enrolling ? (isAr ? "جارٍ إرسال الطلب..." : "Submitting...") : copy.enrollBtn}</span>
                    </Button>
                  </div>
                )}

                {isPendingApproval && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-center text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center justify-center gap-2">
                    <Clock className="size-4 animate-spin shrink-0" />
                    <span>{isAr ? "طلبك قيد مراجعة واعتماد الإدارة" : "Enrollment request submitted — pending review"}</span>
                  </div>
                )}

                {enrollMessage && (
                  <p className="text-xs font-bold text-primary text-center bg-primary/10 p-3 rounded-2xl border border-primary/20">
                    {enrollMessage}
                  </p>
                )}

                {lectures[0] && (
                  <Button
                    size="lg"
                    variant={isEnrolled ? "default" : "outline"}
                    className="w-full rounded-full font-bold h-12 gap-2 shadow-xs"
                    asChild
                  >
                    <Link
                      href={
                        needsAuth
                          ? `/login?returnUrl=/lecture/${lectures[0].id}&tab=signup`
                          : `/lecture/${lectures[0].id}`
                      }
                    >
                      {needsAuthToWatch ? <LockKeyhole className="size-4 shrink-0" /> : <PlayCircle className="size-4 shrink-0" />}
                      <span>{needsAuth ? copy.startLocked : needsEnrollment ? copy.startEnroll : completedLecturesCount > 0 ? copy.continue : copy.start}</span>
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── SYLLABUS & OBJECTIVES GRID ───────────────────────────────────── */}
      <section className="section-space">
        <div className="page-shell grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
          {/* Main Column: Accordion Syllabus */}
          <div className="space-y-6">
            <div>
              <span className="eyebrow">{copy.overview}</span>
              <h2 className="section-title mt-3">{copy.lectures}</h2>
            </div>

            <Accordion type="single" collapsible defaultValue={lectures[0]?.id} className="space-y-3">
              {lectures.map((lecture, index) => {
                const lectureTitle = isAr ? lecture.title_ar : lecture.title_en
                const details = isAr ? lecture.details_ar : lecture.details_en
                const targetHref = needsAuthToWatch
                  ? `/login?returnUrl=/lecture/${lecture.id}&tab=signup`
                  : `/lecture/${lecture.id}`

                return (
                  <AccordionItem
                    key={lecture.id}
                    value={lecture.id}
                    className="rounded-2xl border border-border/80 bg-card/90 px-5 shadow-2xs data-[state=open]:border-primary/50 data-[state=open]:shadow-md transition-all"
                  >
                    <AccordionTrigger className="min-h-20 gap-4 py-4 text-start hover:no-underline">
                      <div className="size-11 shrink-0 grid place-items-center rounded-xl bg-primary/10 text-primary font-black text-sm border border-primary/20">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
                        <span className="text-base font-bold text-foreground truncate">{lectureTitle}</span>
                        {needsAuthToWatch && (
                          <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400 shrink-0">
                            <LockKeyhole className="size-2.5" />
                            <span>{isAr ? "مغلق" : "Locked"}</span>
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="pb-5 ps-15 space-y-4 border-t border-border/40 pt-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">{details}</p>
                      <Button
                        variant={needsAuthToWatch ? "default" : "outline"}
                        size="sm"
                        className="rounded-full px-5 text-xs font-bold gap-2"
                        asChild
                      >
                        <Link href={targetHref}>
                          {needsAuthToWatch ? <LockKeyhole className="size-3.5" /> : <PlayCircle className="size-3.5" />}
                          <span>{needsAuthToWatch ? copy.openLocked : copy.open}</span>
                        </Link>
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </div>

          {/* Sidebar Column: Learning Objectives & Prerequisites */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2.5 text-base">
                  <div className="size-8 grid place-items-center rounded-lg bg-primary/10 text-primary">
                    <ClipboardCheck className="size-4" />
                  </div>
                  <span>{copy.goals}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs leading-relaxed">
                {objectives.map((item) => (
                  <div key={item} className="flex gap-2.5 text-muted-foreground">
                    <CheckCircle2 className="size-4 shrink-0 text-primary mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {prerequisites && (
              <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2.5 text-base">
                    <div className="size-8 grid place-items-center rounded-lg bg-amber-500/10 text-amber-600">
                      <FileText className="size-4" />
                    </div>
                    <span>{copy.req}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">{prerequisites}</p>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 text-xs font-bold text-primary">
              <CheckCircle2 className="size-5 shrink-0" />
              <span>{copy.ready}</span>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps<CoursePageProps> = async ({ params, locale }) => {
  const id = params?.id as string
  let course: Course | null = null
  let lectures: Lecture[] = []

  if (supabase) {
    try {
      const { data: courseData } = await supabase.from("courses").select("*").eq("id", id).maybeSingle()
      if (courseData) course = courseData

      const { data: lecturesData } = await supabase
        .from("lectures")
        .select("*")
        .eq("course_id", id)
        .order("order", { ascending: true })

      if (lecturesData) lectures = lecturesData
    } catch {}
  }

  return {
    props: {
      course,
      lectures,
      siteContent: await loadSiteContent(),
      ...(await serverSideTranslations(locale ?? "en", ["common"])),
    },
  }
}
