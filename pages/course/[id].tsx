import type { GetServerSideProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState, useRef } from "react"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import {
  FiArrowLeft as ArrowLeft,
  FiArrowRight as ArrowRight,
  FiBookOpen as BookOpen,
  FiCheckCircle as CheckCircle2,
  FiClipboard as ClipboardCheck,
  FiClock as Clock,
  FiLock as LockKeyhole,
  FiPlayCircle as PlayCircle,
  FiGlobe as Globe,
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
import { trackCourseView } from "@/lib/analytics"
import type { Course, Lecture } from "@/types"

interface CoursePageProps {
  course: Course | null
  lectures: Lecture[]
  siteContent: SiteContent
}

export default function CoursePage({ course, lectures }: CoursePageProps) {
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
        <div className="page-shell section-space text-center">
          <BookOpen className="mx-auto size-12 text-muted-foreground" />
          <h1 className="mt-5 text-3xl font-bold">{isAr ? "المقرر غير موجود" : "Course not found"}</h1>
          <Button className="mt-6" asChild>
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

  const title = isAr ? course.title_ar : course.title_en
  const description = (isAr ? course.description_ar : course.description_en) ?? ""
  const objectives = ((isAr ? course.objectives_ar : course.objectives_en) ?? "").split(/[.،]\s*/).filter(Boolean)
  const prerequisites = (isAr ? course.prerequisites_ar : course.prerequisites_en) ?? ""

  const progressPercent = lectures.length > 0 ? Math.round((completedLecturesCount / lectures.length) * 100) : 0

  const copy = isAr
    ? {
        label: "مقرر تعليمي",
        back: "كل المقررات",
        lectures: "محتوى المقرر",
        intro: "رحلة متدرجة من المفاهيم الأساسية إلى التطبيق.",
        overview: "نظرة عامة",
        goals: "ماذا ستتعلم",
        req: "قبل أن تبدأ",
        start: "ابدأ المحاضرة الأولى",
        continue: "متابعة الدراسة",
        startLocked: "سجل الدخول لبدء المحاضرة",
        startEnroll: isPendingApproval ? "طلبك قيد المراجعة والاعتماد" : "اشترك في المقرر للمشاهدة",
        enrollBtn: isEnrolledOnly ? "طلب الانضمام للمقرر (بانتظار الاعتماد)" : "اشترك في هذا المقرر مجانًا",
        enrolledBadge: "أنت مسجل في هذا المقرر",
        pendingBadge: "طلب الانضمام قيد مراجعة الإدارة",
        lesson: "محاضرة",
        mins: "دقيقة",
        open: "فتح المحاضرة",
        openLocked: "تسجيل الدخول للمشاهدة",
        openEnroll: isPendingApproval ? "بانتظار الاعتماد" : "اشترك في المقرر",
        progress: "تقدمك في المقرر",
        ready: "جاهز للبدء",
        free: "وصول مفتوح للجميع",
        lockedBadge: "للطلاب المسجلين",
        enrolledOnlyBadge: "يتطلب موافقة وإذن تسجيل",
        lockedNotice: "هذا المقرر متاح مجانًا للطلاب المسجلين. سجّل حسابك في 30 ثانية للمتابعة.",
        enrolledNotice: isPendingApproval
          ? "تم إرسال طلب انضمامك إلى هذا المقرر بنجاح وهو الآن قيد مراجعة واعتماد المشرف. سيتم تفعيل وصولك فور الموافقة."
          : "هذا المقرر مخصص للمسجلين فيه فقط. انقر على زر طلب الانضمام أدناه لإرسال طلبك لإدارة المنصة.",
      }
    : {
        label: "Learning course",
        back: "All courses",
        lectures: "Course content",
        intro: "A progressive journey from first principles to practical application.",
        overview: "Overview",
        goals: "What you will learn",
        req: "Before you start",
        start: "Start lecture one",
        continue: "Continue Learning",
        startLocked: "Sign in to start lecture",
        startEnroll: isPendingApproval ? "Pending Admin Approval" : "Enroll in course to watch",
        enrollBtn: isEnrolledOnly ? "Request Course Enrollment (Approval Required)" : "Enroll in this Course (Free)",
        enrolledBadge: "Enrolled in Course",
        pendingBadge: "Enrollment Request Pending Review",
        lesson: "Lecture",
        mins: "min",
        open: "Open lecture",
        openLocked: "Sign in to watch",
        openEnroll: isPendingApproval ? "Pending Review" : "Enroll to watch",
        progress: "Course progress",
        ready: "Ready to begin",
        free: "Open access for all",
        lockedBadge: "Registered Students Only",
        enrolledOnlyBadge: "Approval Required",
        lockedNotice: "This course is free for registered students. Create your free account to access all lectures and quizzes.",
        enrolledNotice: isPendingApproval
          ? "Your enrollment request has been submitted and is currently pending admin review. You will receive access once approved."
          : "This course is restricted to enrolled students. Click Request Enrollment below to submit your access request.",
      }

  return (
    <Layout title={`${title} — PharmaCore`} description={description}>
      <section className="border-b bg-muted/45">
        <div className="page-shell py-8 sm:py-10 lg:py-14">
          <Button variant="ghost" className="-ms-4 mb-6 sm:mb-8" asChild>
            <Link href="/#courses">
              <DirectionArrow className="size-4" />
              <span>{copy.back}</span>
            </Link>
          </Button>

          <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="badge-nowrap gap-2 bg-card">
                  <GraduationCap className="size-3.5 shrink-0" />
                  <span>{copy.label}</span>
                </Badge>
                {isEnrolledOnly ? (
                  <Badge variant="secondary" className="badge-nowrap gap-1.5 border-purple-500/30 bg-purple-500/10 text-purple-800 dark:text-purple-300 font-bold">
                    <LockKeyhole className="size-3 shrink-0" />
                    <span>{copy.enrolledOnlyBadge}</span>
                  </Badge>
                ) : isStudentsOnly ? (
                  <Badge variant="secondary" className="badge-nowrap gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold">
                    <LockKeyhole className="size-3 shrink-0" />
                    <span>{copy.lockedBadge}</span>
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="badge-nowrap gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold">
                    <Globe className="size-3 shrink-0" />
                    <span>{copy.free}</span>
                  </Badge>
                )}

                {isEnrolled && (
                  <Badge className="badge-nowrap bg-emerald-600 hover:bg-emerald-600 text-white font-bold gap-1 text-xs">
                    <CheckCircle2 className="size-3 shrink-0" />
                    <span>{copy.enrolledBadge}</span>
                  </Badge>
                )}

                {isPendingApproval && (
                  <Badge className="badge-nowrap bg-amber-500 hover:bg-amber-500 text-white font-bold gap-1 text-xs animate-pulse">
                    <Clock className="size-3 shrink-0" />
                    <span>{copy.pendingBadge}</span>
                  </Badge>
                )}
              </div>

              <h1 className="mt-4 sm:mt-5 max-w-4xl text-balance text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl break-words">
                {title}
              </h1>
              <p className="body-lead mt-4 sm:mt-5 break-words">{description}</p>

              <div className="mt-6 sm:mt-7 flex flex-wrap gap-2.5 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                <span className="flex min-h-9 sm:min-h-10 items-center gap-2 rounded-full border bg-card px-3 sm:px-4 whitespace-nowrap shrink-0">
                  <BookOpen className="size-3.5 sm:size-4 text-primary shrink-0" />
                  <span>{lectures.length} {copy.lesson}</span>
                </span>
                <span className="flex min-h-9 sm:min-h-10 items-center gap-2 rounded-full border bg-card px-3 sm:px-4 whitespace-nowrap shrink-0">
                  {isEnrolledOnly ? (
                    <LockKeyhole className="size-3.5 sm:size-4 text-purple-600 shrink-0" />
                  ) : isStudentsOnly ? (
                    <LockKeyhole className="size-3.5 sm:size-4 text-amber-600 shrink-0" />
                  ) : (
                    <Globe className="size-3.5 sm:size-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="truncate">{isEnrolledOnly ? copy.enrolledOnlyBadge : isStudentsOnly ? copy.lockedBadge : copy.free}</span>
                </span>
              </div>
            </div>

            <Card className="border-primary/20 shadow-none">
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-bold whitespace-nowrap">{copy.progress}</span>
                  <span className="font-mono font-bold text-primary whitespace-nowrap">{progressPercent}% ({completedLecturesCount}/{lectures.length})</span>
                </div>
                <Progress value={progressPercent} className="h-2.5" />

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {needsAuth
                    ? copy.lockedNotice
                    : isPendingApproval
                    ? copy.enrolledNotice
                    : needsEnrollment
                    ? copy.enrolledNotice
                    : isEnrolled
                    ? (isAr ? `أنت مسجل في هذا المقرر. أنجزت ${completedLecturesCount} من ${lectures.length} محاضرة.` : `You are enrolled in this course. You have completed ${completedLecturesCount} of ${lectures.length} lectures.`)
                    : copy.intro}
                </p>

                {/* Enrollment Action CTA */}
                {isAuthenticated && !isEnrolled && !isPendingApproval && (
                  <>
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
                      className="btn-nowrap w-full font-bold shadow-xs gap-2"
                    >
                      <ClipboardCheck className="size-4 shrink-0" />
                      <span>{enrolling ? (isAr ? "جارٍ إرسال الطلب..." : "Submitting...") : copy.enrollBtn}</span>
                    </Button>
                  </>
                )}

                {isPendingApproval && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2">
                    <Clock className="size-4 animate-spin shrink-0" />
                    <span>{isAr ? "طلبك قيد المراجعة من الإدارة — سنعلمك فور اعتماده" : "Enrollment request submitted — awaiting administrator review"}</span>
                  </div>
                )}

                {enrollMessage && (
                  <p className="text-xs font-bold text-primary text-center bg-primary/10 p-2.5 rounded-xl">
                    {enrollMessage}
                  </p>
                )}

                {lectures[0] && (
                  <Button size="lg" variant={isEnrolled ? "default" : "outline"} className="btn-nowrap w-full font-bold" asChild>
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

      <section className="section-space">
        <div className="page-shell grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-14">
          <div>
            <div className="mb-6">
              <span className="eyebrow">{copy.overview}</span>
              <h2 className="mt-4 text-3xl font-bold">{copy.lectures}</h2>
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
                    className="rounded-xl border bg-card px-5 data-[state=open]:border-primary/35"
                  >
                    <AccordionTrigger className="min-h-20 gap-4 py-4 text-start hover:no-underline">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary font-bold text-primary">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 flex items-center justify-between gap-3 min-w-0">
                        <span className="block text-base font-bold truncate">{lectureTitle}</span>
                        {needsAuthToWatch && (
                          <Badge variant="outline" className="badge-nowrap text-[10px] gap-1 text-muted-foreground border-amber-500/30">
                            <LockKeyhole className="size-2.5 text-amber-600 shrink-0" />
                            <span>{isAr ? "مغلق للزوار" : "Locked"}</span>
                          </Badge>
                        )}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 ps-14">
                      <p className="text-sm text-muted-foreground leading-relaxed">{details}</p>
                      <Button variant={needsAuthToWatch ? "default" : "outline"} className="btn-nowrap mt-4" asChild>
                        <Link href={targetHref}>
                          {needsAuthToWatch ? <LockKeyhole className="shrink-0" /> : <PlayCircle className="shrink-0" />}
                          <span>{needsAuthToWatch ? copy.openLocked : copy.open}</span>
                        </Link>
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <span className="icon-tile size-10">
                    <ClipboardCheck className="size-4" />
                  </span>
                  {copy.goals}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {objectives.map((item) => (
                  <div key={item} className="flex gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">{copy.req}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{prerequisites}</p>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-secondary/60 p-4 text-sm">
              <CheckCircle2 className="size-5 text-primary" />
              <span className="font-semibold">{copy.ready}</span>
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
