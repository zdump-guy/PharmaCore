import { useState } from "react"
import {
  FiDownload as Download,
  FiExternalLink as ExternalLink,
  FiFileText as FileText,
  FiMaximize2 as Maximize2,
  FiMinimize2 as Minimize2,
  FiX as X,
} from "react-icons/fi"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface PdfPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  url: string
  title: string
  isAr?: boolean
}

export default function PdfPreviewModal({
  open,
  onOpenChange,
  url,
  title,
  isAr = false,
}: PdfPreviewModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [useGoogleDocs, setUseGoogleDocs] = useState(false)

  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = url
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    const hasExt = title.toLowerCase().endsWith(".pdf")
    a.download = title.replace(/[\\/:*?"<>|]/g, "_") + (hasExt ? "" : ".pdf")
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const directPdfUrl = `${url}#toolbar=1&navpanes=0`
  const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
  const activeIframeSrc = useGoogleDocs ? googleDocsUrl : directPdfUrl

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`flex flex-col p-0 overflow-hidden bg-background border shadow-2xl transition-all duration-200 ${
          isFullscreen
            ? "fixed inset-0 z-50 w-screen h-screen max-w-none rounded-none m-0 border-0"
            : "w-[95vw] sm:max-w-4xl lg:max-w-5xl h-[88vh] rounded-2xl"
        }`}
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b bg-card/90 backdrop-blur-md shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid size-7 sm:size-8 place-items-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
              <FileText className="size-3.5 sm:size-4" />
            </span>
            <DialogTitle className="text-xs sm:text-base font-bold truncate max-w-[150px] min-[400px]:max-w-[200px] sm:max-w-md">
              {title}
            </DialogTitle>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Viewer Engine Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUseGoogleDocs((prev) => !prev)}
              className="h-7 sm:h-8 px-2 sm:px-2.5 text-[11px] sm:text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
              title={useGoogleDocs ? tr("Switch to Native Viewer", "المشغل المباشر") : tr("Switch to Web Reader", "مشغل الويب")}
            >
              <span className="hidden min-[480px]:inline">
                {useGoogleDocs ? tr("Native View", "العرض المباشر") : tr("Web Reader", "مشغل الويب")}
              </span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-7 sm:h-8 px-2 sm:px-3 text-xs font-semibold gap-1.5 shadow-xs"
              title={tr("Download PDF", "تحميل الملف")}
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">{tr("Download", "تحميل")}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-7 sm:size-8"
              onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
              title={tr("Open in new tab", "فتح في تبويب جديد")}
            >
              <ExternalLink className="size-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-7 sm:size-8"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? tr("Exit fullscreen", "تصغير") : tr("Fullscreen", "ملء الشاشة")}
            >
              {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-7 sm:size-8"
              onClick={() => onOpenChange(false)}
              title={tr("Close", "إغلاق")}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* PDF iframe viewer container */}
        <div className="relative flex-1 w-full h-full bg-muted/30">
          <iframe
            key={activeIframeSrc}
            src={activeIframeSrc}
            title={title}
            className="w-full h-full border-0"
          />
        </div>

        {/* Mobile / Fallback Helper Strip */}
        <div className="px-3 sm:px-4 py-1.5 border-t bg-muted/40 flex items-center justify-between text-[11px] text-muted-foreground gap-2 shrink-0">
          <span className="truncate">
            {tr(
              "Having display issues on mobile? Tap Open in New Tab or switch to Web Reader.",
              "هل تواجه صعوبة في العرض على الهاتف؟ افتح في تبويب جديد أو بدّل إلى مشغل الويب."
            )}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
              className="font-bold text-primary hover:underline"
            >
              {tr("Open in Tab", "فتح في تبويب")}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={handleDownload}
              className="font-bold text-primary hover:underline"
            >
              {tr("Download", "تحميل")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
