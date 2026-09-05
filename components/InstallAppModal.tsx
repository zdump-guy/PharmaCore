import { useState } from "react"
import { useRouter } from "next/router"
import {
  FiDownload as Download,
  FiMonitor as Monitor,
  FiSmartphone as Smartphone,
  FiShare as ShareIcon,
  FiPlusSquare as PlusSquare,
  FiCheck as Check,
  FiZap as Zap,
  FiBookOpen as BookOpen,
  FiShield as Shield,
} from "react-icons/fi"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import BrandLogo from "@/components/BrandLogo"
import { usePwaInstall } from "@/lib/usePwaInstall"

interface InstallAppModalProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function InstallAppModal({
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: InstallAppModalProps) {
  const router = useRouter()
  const isAr = router.locale === "ar"
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen
  const setIsOpen = isControlled ? setControlledOpen! : setUncontrolledOpen

  const { isInstalled, isIOS, platform, promptInstall } = usePwaInstall()

  const handleInstallClick = async () => {
    setIsInstalling(true)
    try {
      const success = await promptInstall()
      if (success) {
        setIsOpen(false)
      }
    } finally {
      setIsInstalling(false)
    }
  }

  const isDesktop = platform === "desktop"

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : null}

      <DialogContent
        className="w-[92vw] max-w-lg rounded-3xl p-6 sm:p-8 bg-card border border-border shadow-2xl"
        dir={isAr ? "rtl" : "ltr"}
      >
        <DialogHeader className="text-start space-y-3">
          <div className="flex items-center justify-between">
            <BrandLogo className="h-8 sm:h-9 w-auto" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Download className="size-3.5" />
              {isDesktop
                ? isAr
                  ? "تطبيق سطح المكتب"
                  : "Desktop App"
                : isAr
                ? "تطبيق الهاتف"
                : "Mobile App"}
            </span>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            {isInstalled
              ? isAr
                ? "تم تثبيت فارما كور بنجاح"
                : "PharmaCore is Installed"
              : isDesktop
              ? isAr
                ? "تثبيت فارما كور على سطح المكتب"
                : "Install PharmaCore on Desktop"
              : isAr
              ? "إضافة فارما كور إلى الشاشة الرئيسية"
              : "Add PharmaCore to Home Screen"}
          </DialogTitle>

          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {isInstalled
              ? isAr
                ? "التطبيق متاح الآن للتشغيل المباشر من جهازك كنافذة مستقلة وسريعة."
                : "The app is ready to launch directly from your desktop or home screen in a standalone window."
              : isAr
              ? "احصل على تجربة تعليمية فائقة السرعة مع نافذة مستقلة ووصول سريع للمحاضرات والملخصات."
              : "Enjoy instant launch from your desktop or dock, offline summary access, and a distraction-free window."}
          </DialogDescription>
        </DialogHeader>

        {/* Feature Benefits Grid */}
        <div className="grid gap-3 py-2 sm:grid-cols-3">
          <div className="flex flex-col items-center sm:items-start p-3 rounded-2xl bg-muted/40 border border-border/50 text-center sm:text-start">
            <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary mb-2">
              <Zap className="size-4" />
            </div>
            <p className="text-xs font-bold text-foreground">
              {isAr ? "تشغيل فوري" : "Instant Launch"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isAr ? "بدون فتح المتصفح" : "Dedicated window"}
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-start p-3 rounded-2xl bg-muted/40 border border-border/50 text-center sm:text-start">
            <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary mb-2">
              <BookOpen className="size-4" />
            </div>
            <p className="text-xs font-bold text-foreground">
              {isAr ? "وصول للملخصات" : "Course Access"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isAr ? "محاضرات وتلخيصات" : "High-yield lectures"}
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-start p-3 rounded-2xl bg-muted/40 border border-border/50 text-center sm:text-start">
            <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary mb-2">
              <Shield className="size-4" />
            </div>
            <p className="text-xs font-bold text-foreground">
              {isAr ? "مساحة آمنة" : "Secure Storage"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isAr ? "حفظ تقدم التعلم" : "Save your progress"}
            </p>
          </div>
        </div>

        {/* iOS Step-by-Step Guide vs Native Install Action */}
        {isIOS && !isInstalled ? (
          <div className="space-y-3 rounded-2xl bg-primary/5 border border-primary/20 p-4">
            <p className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Smartphone className="size-4" />
              {isAr ? "خطوات التثبيت على آيفون / آيباد (Safari):" : "How to install on iOS Safari:"}
            </p>
            <ol className="text-xs space-y-2 text-foreground/90 font-medium list-decimal list-inside">
              <li className="flex items-center gap-2">
                <span>1.</span>
                <span>
                  {isAr ? "اضغط على زر المشاركة" : "Tap the Share button"}
                </span>
                <span className="inline-grid size-5 place-items-center rounded bg-muted">
                  <ShareIcon className="size-3 text-primary" />
                </span>
                <span>{isAr ? "في شريط سفاري" : "in Safari toolbar"}</span>
              </li>
              <li className="flex items-center gap-2">
                <span>2.</span>
                <span>
                  {isAr ? "اختر 'إضافة إلى الشاشة الرئيسية'" : "Scroll and tap 'Add to Home Screen'"}
                </span>
                <span className="inline-grid size-5 place-items-center rounded bg-muted">
                  <PlusSquare className="size-3 text-primary" />
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span>3.</span>
                <span>
                  {isAr ? "اضغط على 'إضافة' في الزاوية العلوية" : "Tap 'Add' in top right corner"}
                </span>
              </li>
            </ol>
          </div>
        ) : isInstalled ? (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-600 dark:text-emerald-400">
            <Check className="size-5 shrink-0" />
            <p className="text-xs font-semibold">
              {isAr
                ? "فارما كور مثبت بالفعل على جهازك."
                : "PharmaCore is already installed on your device."}
            </p>
          </div>
        ) : null}

        {/* Dialog Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto h-11 rounded-2xl px-5 text-sm font-semibold"
            onClick={() => setIsOpen(false)}
          >
            {isAr ? "إغلاق" : "Close"}
          </Button>

          {!isIOS && !isInstalled && (
            <Button
              className="w-full sm:w-auto h-11 rounded-2xl px-6 text-sm font-bold bg-primary text-primary-foreground shadow-md hover:bg-primary/90 flex items-center justify-center gap-2"
              onClick={handleInstallClick}
              disabled={isInstalling}
            >
              {isDesktop ? (
                <Monitor className="size-4 shrink-0" />
              ) : (
                <Smartphone className="size-4 shrink-0" />
              )}
              <span>
                {isDesktop
                  ? isAr
                    ? "تثبيت على سطح المكتب الآن"
                    : "Install to Desktop Now"
                  : isAr
                  ? "تثبيت التطبيق الآن"
                  : "Install App Now"}
              </span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
