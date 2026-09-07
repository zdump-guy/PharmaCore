import { useState } from "react"
import {
  FiDownload as Download,
  FiEye as Eye,
  FiFileText as FileText,
  FiHeadphones as Headphones,
  FiImage as FileImage,
  FiPlay as Play,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import PdfPreviewModal from "@/components/ui/pdf-preview-modal"
import ImagePreviewModal from "@/components/ui/image-preview-modal"
import CustomAudioPlayer from "@/components/ui/custom-audio-player"

export type MediaKind = "pdf" | "image" | "audio" | "other"

interface MediaActionCardProps {
  url: string
  title: string
  kind?: MediaKind
  badgeLabel?: string
  durationSeconds?: number
  isAr?: boolean
  className?: string
  onTrackClick?: () => void
}

export default function MediaActionCard({
  url,
  title,
  kind,
  badgeLabel,
  durationSeconds,
  isAr = false,
  className = "",
  onTrackClick,
}: MediaActionCardProps) {
  const [pdfOpen, setPdfOpen] = useState(false)
  const [imageOpen, setImageOpen] = useState(false)
  const [showAudioPlayer, setShowAudioPlayer] = useState(false)

  const tr = (en: string, ar: string) => (isAr ? ar : en)

  // Auto-detect kind if not explicitly passed
  const resolvedKind: MediaKind =
    kind ||
    (url.toLowerCase().match(/\.(pdf)(\?.*)?$/i)
      ? "pdf"
      : url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i)
      ? "image"
      : url.toLowerCase().match(/\.(mp3|wav|m4a|ogg|webm|aac)(\?.*)?$/i)
      ? "audio"
      : "pdf")

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    onTrackClick?.()
    const a = document.createElement("a")
    a.href = url
    const ext = resolvedKind === "pdf" ? ".pdf" : resolvedKind === "audio" ? ".mp3" : ""
    a.download = title.replace(/[\\/:*?"<>|]/g, "_") + ext
    a.target = "_blank"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleView = () => {
    onTrackClick?.()
    if (resolvedKind === "pdf") {
      setPdfOpen(true)
    } else if (resolvedKind === "image") {
      setImageOpen(true)
    } else if (resolvedKind === "audio") {
      setShowAudioPlayer((prev) => !prev)
    } else {
      window.open(url, "_blank")
    }
  }

  const iconConfig = {
    pdf: {
      Icon: FileText,
      tileClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      badgeClass: "border-red-500/30 text-red-700 dark:text-red-300 bg-red-500/5",
      defaultBadge: tr("PDF Document", "ملف PDF"),
      viewLabel: tr("View PDF", "معاينة الملف"),
      ViewIcon: Eye,
    },
    image: {
      Icon: FileImage,
      tileClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      badgeClass: "border-sky-500/30 text-sky-700 dark:text-sky-300 bg-sky-500/5",
      defaultBadge: tr("Diagram / Image", "مخطط / صورة"),
      viewLabel: tr("View Image", "عرض الصورة"),
      ViewIcon: Eye,
    },
    audio: {
      Icon: Headphones,
      tileClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      badgeClass: "border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/5",
      defaultBadge: tr("Voice Record", "تسجيل صوتي"),
      viewLabel: showAudioPlayer ? tr("Hide Player", "إخفاء المشغل") : tr("Listen", "استماع"),
      ViewIcon: showAudioPlayer ? Eye : Play,
    },
    other: {
      Icon: FileText,
      tileClass: "bg-primary/10 text-primary border-primary/20",
      badgeClass: "border-primary/30 text-primary bg-primary/5",
      defaultBadge: tr("Attachment", "مرفق"),
      viewLabel: tr("Open", "فتح"),
      ViewIcon: Eye,
    },
  }[resolvedKind]

  const { Icon, tileClass, badgeClass, defaultBadge, viewLabel, ViewIcon } = iconConfig

  return (
    <>
      <div
        className={`rounded-2xl border bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-primary/45 hover:shadow-sm ${className}`}
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* File Information */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl border ${tileClass}`}>
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 h-4.5 ${badgeClass}`}>
                  {badgeLabel || defaultBadge}
                </Badge>
              </div>
              <h4 className="font-bold text-sm sm:text-base text-foreground break-words">{title}</h4>
            </div>
          </div>

          {/* 2 Custom Action Buttons */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 justify-end">
            {/* Button 1: View / Listen */}
            <Button
              variant="default"
              size="sm"
              onClick={handleView}
              className="flex-1 sm:flex-none h-9 px-3.5 text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
            >
              <ViewIcon className="size-3.5 shrink-0" />
              <span>{viewLabel}</span>
            </Button>

            {/* Button 2: Direct Download */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex-1 sm:flex-none h-9 px-3.5 text-xs font-bold gap-1.5 border-border hover:border-primary/40 hover:bg-muted/80 shadow-xs"
            >
              <Download className="size-3.5 text-muted-foreground shrink-0" />
              <span>{tr("Download", "تحميل")}</span>
            </Button>
          </div>
        </div>

        {/* Inline Audio Player Dropdown (for Audio Kind) */}
        {resolvedKind === "audio" && showAudioPlayer && (
          <div className="mt-4 pt-4 border-t animate-in fade-in slide-in-from-top-2 duration-200">
            <CustomAudioPlayer
              url={url}
              title={title}
              durationSeconds={durationSeconds}
              isAr={isAr}
              showDownloadButton={false}
              className="bg-muted/30 border-0 p-3"
            />
          </div>
        )}
      </div>

      {/* PDF Modal Viewer */}
      {resolvedKind === "pdf" && (
        <PdfPreviewModal
          open={pdfOpen}
          onOpenChange={setPdfOpen}
          url={url}
          title={title}
          isAr={isAr}
        />
      )}

      {/* Image Modal Lightbox */}
      {resolvedKind === "image" && (
        <ImagePreviewModal
          open={imageOpen}
          onOpenChange={setImageOpen}
          url={url}
          title={title}
          isAr={isAr}
        />
      )}
    </>
  )
}
