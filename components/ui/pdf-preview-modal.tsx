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

  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = url
    a.download = title.replace(/[\\/:*?"<>|]/g, "_") + ".pdf"
    a.target = "_blank"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

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
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b bg-card/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid size-8 place-items-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
              <FileText className="size-4" />
            </span>
            <DialogTitle className="text-sm sm:text-base font-bold truncate max-w-[200px] sm:max-w-md">
              {title}
            </DialogTitle>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 text-xs font-semibold gap-1.5 shadow-xs"
              title={tr("Download PDF", "تحميل الملف")}
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">{tr("Download", "تحميل")}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => window.open(url, "_blank")}
              title={tr("Open in new tab", "فتح في تبويب جديد")}
            >
              <ExternalLink className="size-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? tr("Exit fullscreen", "تصغير") : tr("Fullscreen", "ملء الشاشة")}
            >
              {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-8"
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
            src={`${url}#toolbar=1&navpanes=0`}
            title={title}
            className="w-full h-full border-0"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
