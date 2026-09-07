import { useState } from "react"
import {
  FiDownload as Download,
  FiExternalLink as ExternalLink,
  FiImage as FileImage,
  FiMaximize2 as Maximize2,
  FiMinimize2 as Minimize2,
  FiX as X,
  FiZoomIn as ZoomIn,
  FiZoomOut as ZoomOut,
} from "react-icons/fi"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ImagePreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  url: string
  title: string
  isAr?: boolean
}

export default function ImagePreviewModal({
  open,
  onOpenChange,
  url,
  title,
  isAr = false,
}: ImagePreviewModalProps) {
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = url
    a.download = title.replace(/[\\/:*?"<>|]/g, "_")
    a.target = "_blank"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-xl border shadow-2xl transition-all duration-200 ${
          isFullscreen
            ? "fixed inset-0 z-50 w-screen h-screen max-w-none rounded-none m-0 border-0"
            : "w-[95vw] sm:max-w-3xl lg:max-w-4xl h-[85vh] rounded-2xl"
        }`}
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b bg-card/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
              <FileImage className="size-4" />
            </span>
            <DialogTitle className="text-sm sm:text-base font-bold truncate max-w-[200px] sm:max-w-md">
              {title}
            </DialogTitle>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              title={tr("Zoom out", "تصغير")}
            >
              <ZoomOut className="size-3.5" />
            </Button>
            <span className="text-xs font-mono font-bold w-12 text-center text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              title={tr("Zoom in", "تكبير")}
            >
              <ZoomIn className="size-3.5" />
            </Button>

            <div className="h-4 w-px bg-border mx-1" />

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 text-xs font-semibold gap-1.5 shadow-xs"
              title={tr("Download Image", "تحميل الصورة")}
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

        {/* Image viewport */}
        <div className="relative flex-1 w-full h-full overflow-auto flex items-center justify-center p-4 sm:p-6 bg-black/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={title}
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
            className="max-h-full max-w-full object-contain transition-transform duration-150 ease-out select-none shadow-lg rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
