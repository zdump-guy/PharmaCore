import { useRouter } from "next/router"
import Link from "next/link"
import {
  FiAward as Award,
  FiBookOpen as BookOpen,
  FiFileText as FileText,
  FiPlayCircle as PlayCircle,
  FiUserPlus as UserPlus,
  FiZap as Zap,
} from "react-icons/fi"
import { FaGraduationCap as GraduationCap } from "react-icons/fa6"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSiteContent } from "@/components/SiteContentProvider"

interface LeadMagnetModalProps {
  isOpen: boolean
  onClose: () => void
  courseTitle?: string
  courseId?: string
  lectureTitle?: string
  source?: "preview_complete" | "locked_resource" | "manual" | string
}

export default function LeadMagnetModal({
  isOpen,
  onClose,
  courseTitle,
  courseId,
  lectureTitle,
  source = "manual",
}: LeadMagnetModalProps) {
  const router = useRouter()
  const isAr = router.locale === "ar"
  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const siteContent = useSiteContent()
  const config = siteContent.lead_magnet

  const redirectTarget = courseId
    ? `/course/${courseId}`
    : router.asPath || "/courses"
  const loginUrl = `/login?redirect=${encodeURIComponent(redirectTarget)}`

  const title = isAr
    ? config?.modal_title_ar || "افتح كامل المنهج الإكلينيكي المعتمد"
    : config?.modal_title_en || "Unlock the Full Clinical Curriculum"

  const body = isAr
    ? config?.modal_body_ar ||
      "انضم إلى أكثر من 5,000 طالب وطبيبة صيدلانية. أنشئ حسابك المجاني للوصول إلى الحالات الإكلينيكية، والاختبارات التفاعلية، والشهادات المعتمدة برمز QR، وتدوين الملاحظات المتزامنة."
    : config?.modal_body_en ||
      "Join 5,000+ medical and pharmacy students. Create your free account to access interactive clinical vignettes, board-certified quizzes, verifiable PDF certificates, and in-lecture note-taking."

  const benefits = [
    {
      icon: PlayCircle,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      title_en: "Full HD Video Curriculum",
      title_ar: "المنهج المرئي الكامل بجودة عالية",
      desc_en: "Unrestricted access to all course modules, drug mechanisms, and clinical whiteboard breakdowns.",
      desc_ar: "وصول غير محدود لكافة وحدات المقرر، وشرح آليات عمل الأدوية والحالات السريرية.",
    },
    {
      icon: Zap,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      title_en: "Board-Level Clinical Quizzes & XP",
      title_ar: "اختبارات البورد السريرية ونقاط XP",
      desc_en: "Targeted question sets with instant rationales, Daily Pharmacology Challenges, and Division League ranking.",
      desc_ar: "أسئلة تدريبية مع توضيحات إكلينيكية فورية وتحدي الدواء اليومي وتصنيفات الدوريات.",
    },
    {
      icon: Award,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      title_en: "Verifiable Certificates with QR",
      title_ar: "شهادات إتمام معتمدة برمز QR",
      desc_en: "Earn verifiable digital certificates upon lecture completion and passing graded clinical assessments.",
      desc_ar: "احصل على شهادات إنجاز موثقة برمز تحقق رقمي عند إتمام المحاضرات واجتياز الاختبارات.",
    },
    {
      icon: FileText,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      title_en: "Timestamped Notes & PDF Export",
      title_ar: "تدوين الملاحظات وتصدير PDF",
      desc_en: "Capture synchronized clinical pearls during lectures and export beautifully formatted study guides.",
      desc_ar: "دوّن ملاحظاتك المرتبطة بتوقيت الفيديو وصدّرها فوراً كملف PDF أو Markdown جاهز للمذاكرة.",
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        dir={isAr ? "rtl" : "ltr"}
        className="max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 sm:p-8 rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl"
      >
        {/* Top Header & Glowing Badge */}
        <DialogHeader className="space-y-4 text-center sm:text-start">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-12 grid place-items-center rounded-2xl bg-gradient-to-br from-primary/20 via-emerald-500/15 to-teal-500/10 text-primary border border-primary/30 shadow-md">
                <GraduationCap className="size-6" />
              </div>
              <div>
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20 text-[10px] sm:text-xs font-bold uppercase tracking-wider"
                >
                  {source === "preview_complete"
                    ? tr("Preview Lesson Completed", "اكتملت المحاضرة التجريبية")
                    : tr("Free Student Access", "وصول طلابي مجاني")}
                </Badge>
                <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground mt-1">
                  {title}
                </DialogTitle>
              </div>
            </div>
          </div>

          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-start">
            {body}
          </DialogDescription>
        </DialogHeader>

          {/* Optional Context Pill */}
          {courseTitle && (
            <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs text-start">
              <BookOpen className="size-4 text-primary shrink-0" />
              <div className="truncate">
                <span className="text-muted-foreground">
                  {tr("Course: ", "المقرر: ")}
                </span>
                <span className="font-bold text-foreground truncate">{courseTitle}</span>
                {lectureTitle && (
                  <span className="text-muted-foreground truncate">
                    {" • " + lectureTitle}
                  </span>
                )}
              </div>
            </div>
          )}

        {/* Value Proposition Highlights */}
        <div className="grid gap-2.5 sm:gap-3 my-4">
          {benefits.map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/60 p-3 sm:p-3.5 transition-colors hover:border-primary/40 hover:bg-muted/30 text-start"
              >
                <div
                  className={`size-9 grid place-items-center rounded-xl border shrink-0 ${item.color}`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">
                    {isAr ? item.title_ar : item.title_en}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    {isAr ? item.desc_ar : item.desc_en}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA Actions */}
        <div className="space-y-3 pt-2">
          <Button
            asChild
            size="lg"
            className="w-full h-12 rounded-full font-bold text-xs sm:text-sm shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 transition-all hover:scale-[1.01]"
          >
            <Link href={loginUrl}>
              <UserPlus className="size-4" />
              <span>{tr("Create Free Student Account", "إنشاء حساب طالب مجاناً")}</span>
            </Link>
          </Button>

          <div className="flex items-center justify-between gap-3 text-xs">
            <Link
              href={loginUrl}
              className="text-muted-foreground hover:text-primary font-semibold transition-colors"
            >
              {tr("Already registered? Sign In →", "لديك حساب بالفعل؟ تسجيل الدخول ←")}
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
            >
              {tr("Continue previewing", "متابعة التصفح")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
