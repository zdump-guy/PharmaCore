import { useState } from "react"
import {
  FiAlertTriangle as AlertTriangle,
  FiCheck as Check,
  FiExternalLink as ExternalLink,
  FiFileText as FileText,
  FiImage as FileImage,
  FiLink as LinkIcon,
  FiLoader as Loader2,
  FiRefreshCw as RefreshCw,
  FiTrash2 as Trash2,
  FiUploadCloud as UploadCloud,
  FiX as X,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useUploadThing } from "@/lib/uploadthing"
import { supabase } from "@/lib/supabaseClient"

export interface UploadedFileMeta {
  url: string
  name: string
  size?: number
  type?: "pdf" | "image" | "other"
}

interface FileUploaderProps {
  endpoint: "courseImage" | "lectureResource"
  value: string
  onChange: (url: string, meta?: UploadedFileMeta) => void
  isAr?: boolean
  label?: string
  hint?: string
  acceptPdfOnly?: boolean
  acceptImagesOnly?: boolean
  className?: string
}

export default function FileUploader({
  endpoint,
  value,
  onChange,
  isAr = false,
  label,
  hint,
  acceptPdfOnly = false,
  acceptImagesOnly = false,
  className = "",
}: FileUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [fileName, setFileName] = useState("")
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    headers: async (): Promise<Record<string, string>> => {
      if (!supabase) return {}
      const {
        data: { session },
      } = await supabase.auth.getSession()
      return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
    },
    onUploadProgress: (p) => {
      setUploadProgress(p)
    },
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        const file = res[0]
        const url = file.url
        const name = file.name
        const size = file.size

        const isPdf = name.toLowerCase().endsWith(".pdf") || url.toLowerCase().includes(".pdf")
        const isImg =
          name.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|svg)$/) !== null ||
          url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|svg)$/) !== null

        const detectedType: "pdf" | "image" | "other" = isPdf
          ? "pdf"
          : isImg
          ? "image"
          : "other"

        setFileName(name)
        setFileSize(size)
        setUploadError(null)
        onChange(url, { url, name, size, type: detectedType })
      }
    },
    onUploadError: (e) => {
      const msg = e.message || ""
      if (
        msg.toLowerCase().includes("unauthorized") ||
        msg.toLowerCase().includes("forbidden")
      ) {
        setUploadError(
          tr(
            "Access denied: Only staff members (mentors, admins) are authorized to upload media.",
            "تم رفض الوصول: يُسمح فقط للكادر التعليمي والإداري برفع الملفات."
          )
        )
      } else if (
        msg.toLowerCase().includes("token") ||
        msg.toLowerCase().includes("api key") ||
        msg.toLowerCase().includes("500") ||
        msg.toLowerCase().includes("uploadthing_token_missing")
      ) {
        setUploadError(
          tr(
            "Uploadthing token is not configured yet in .env.local. Please add UPLOADTHING_TOKEN to enable direct uploads, or paste a link below.",
            "مفتاح Uploadthing غير مهيأ بعد في .env.local. يرجى إضافة UPLOADTHING_TOKEN لتفعيل الرفع المباشر أو لصق رابط خارجي."
          )
        )
      } else {
        setUploadError(msg || tr("Upload failed. Please check your file.", "فشل الرفع. يرجى التحقق من حجم ونوع الملف."))
      }
    },
  })

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setUploadError(null)
      try {
        await startUpload([files[0]])
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        if (
          message.toLowerCase().includes("unauthorized") ||
          message.toLowerCase().includes("forbidden")
        ) {
          setUploadError(
            tr(
              "Access denied: Only staff members (mentors, admins) are authorized to upload media.",
              "تم رفض الوصول: يُسمح فقط للكادر التعليمي والإداري برفع الملفات."
            )
          )
        } else if (message.toLowerCase().includes("token") || message.toLowerCase().includes("500")) {
          setUploadError(
            tr(
              "Uploadthing token is not configured yet. Please add UPLOADTHING_TOKEN in .env.local, or paste a link.",
              "مفتاح Uploadthing غير مهيأ في .env.local. يرجى إضافته أو لصق الرابط يدويًا."
            )
          )
        } else {
          setUploadError(message || tr("Upload failed.", "فشل الرفع."))
        }
      }
    }
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    e.target.value = ""
    if (files.length > 0) {
      setUploadError(null)
      try {
        await startUpload([files[0]])
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        if (
          message.toLowerCase().includes("unauthorized") ||
          message.toLowerCase().includes("forbidden")
        ) {
          setUploadError(
            tr(
              "Access denied: Only staff members (mentors, admins) are authorized to upload media.",
              "تم رفض الوصول: يُسمح فقط للكادر التعليمي والإداري برفع الملفات."
            )
          )
        } else if (message.toLowerCase().includes("token") || message.toLowerCase().includes("500")) {
          setUploadError(
            tr(
              "Uploadthing token is not configured yet. Please add UPLOADTHING_TOKEN in .env.local, or paste a link.",
              "مفتاح Uploadthing غير مهيأ في .env.local. يرجى إضافته أو لصق الرابط يدويًا."
            )
          )
        } else {
          setUploadError(message || tr("Upload failed.", "فشل الرفع."))
        }
      }
    }
  }



  const isImageValue =
    endpoint === "courseImage" ||
    acceptImagesOnly ||
    value.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i) !== null ||
    value.includes("images.unsplash.com")

  const isPdfValue =
    acceptPdfOnly ||
    value.toLowerCase().endsWith(".pdf") ||
    value.toLowerCase().includes(".pdf")

  const formatBytes = (bytes?: number | null) => {
    if (!bytes) return null
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={`space-y-2 ${className}`} dir={isAr ? "rtl" : "ltr"}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">{label}</span>
          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            {showManualInput
              ? tr("← Use Direct Upload Dropzone", "← العودة إلى منطقة الرفع المباشر")
              : tr("Paste external link instead", "لصق رابط خارجي بدلاً من ذلك")}
          </button>
        </div>
      )}

      {/* Manual Input Fallback */}
      {showManualInput ? (
        <div className="space-y-1.5">
          <div className="relative">
            <LinkIcon className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://..."
              className="h-9 ps-8 pe-3 text-xs"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {tr("Manual URL override. Files uploaded directly to Uploadthing are faster and more reliable.", "لصق رابط يدوي. يُفضل الرفع المباشر لضمان السرعة والاعتمادية.")}
          </p>
        </div>
      ) : value && !isUploading ? (
        /* Uploaded Preview Card */
        <div className="rounded-xl border bg-muted/20 p-3 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {isImageValue ? (
                <div className="size-14 sm:size-16 rounded-lg overflow-hidden border bg-background shrink-0 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={value}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : isPdfValue ? (
                <span className="grid size-12 sm:size-14 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                  <FileText className="size-6" />
                </span>
              ) : (
                <span className="grid size-12 sm:size-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <FileImage className="size-6" />
                </span>
              )}

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    <Check className="size-2.5" />
                    {tr("Ready & Stored", "تم الرفع بنجاح")}
                  </Badge>
                  {formatBytes(fileSize) && (
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {formatBytes(fileSize)}
                    </span>
                  )}
                </div>
                <p className="font-bold text-xs text-foreground truncate max-w-[200px] sm:max-w-[320px]">
                  {fileName || value.split("/").pop() || tr("Uploaded file", "ملف مرفوع")}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground truncate max-w-[200px] sm:max-w-[320px]">
                  {value}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border bg-background text-xs font-semibold hover:bg-muted"
              >
                <ExternalLink className="size-3" />
                <span>{tr("View", "عرض")}</span>
              </a>

              <label className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border bg-background text-xs font-semibold cursor-pointer hover:bg-muted">
                <RefreshCw className="size-3" />
                <span>{tr("Replace", "استبدال")}</span>
                <input
                  type="file"
                  className="hidden"
                  accept={
                    endpoint === "courseImage" || acceptImagesOnly
                      ? "image/*"
                      : acceptPdfOnly
                      ? ".pdf,application/pdf"
                      : ".pdf,image/*,application/pdf"
                  }
                  onChange={handleFileInputChange}
                />
              </label>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  onChange("")
                  setFileName("")
                  setFileSize(null)
                }}
                title={tr("Remove file", "إزالة الملف")}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Drag and Drop Zone */
        <div
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onDrop={handleFileDrop}
          className={`relative rounded-2xl border-2 border-dashed transition-all text-center p-5 sm:p-6 ${
            isUploading
              ? "border-primary bg-primary/5 cursor-wait"
              : "border-border hover:border-primary/50 hover:bg-muted/30 cursor-pointer"
          }`}
        >
          <label className="cursor-pointer block space-y-2">
            <input
              type="file"
              className="hidden"
              disabled={isUploading}
              accept={
                endpoint === "courseImage" || acceptImagesOnly
                  ? "image/*"
                  : acceptPdfOnly
                  ? ".pdf,application/pdf"
                  : ".pdf,image/*,application/pdf"
              }
              onChange={handleFileInputChange}
            />

            {isUploading ? (
              <div className="space-y-3 py-2">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="size-5 animate-spin text-primary" />
                  <span className="font-bold text-sm text-primary">
                    {tr(`Uploading to Uploadthing CDN (${uploadProgress}%)...`, `جارٍ الرفع (${uploadProgress}٪)...`)}
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-2 w-full max-w-xs mx-auto" />
                <p className="text-[11px] text-muted-foreground">
                  {tr("Optimizing and storing securely on global edge servers...", "جارٍ المعالجة والحفظ على خوادم التوزيع العالمية...")}
                </p>
              </div>
            ) : (
              <>
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <UploadCloud className="size-6" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">
                    {tr("Click to browse or drag & drop file here", "انقر للاختيار أو اسحب الملف وأفلته هنا")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {hint ||
                      (endpoint === "courseImage" || acceptImagesOnly
                        ? tr("High-resolution JPEG, PNG, or WebP up to 4MB (16:9 recommended)", "صور بصيغة JPEG أو PNG أو WebP حتى 4 ميجابايت (نسبة 16:9)")
                        : tr("Lecture notes PDF, diagrams, or reference slides up to 32MB", "ملفات PDF للمحاضرات أو صور ومخططات حتى 32 ميجابايت"))}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-1.5 pt-1">
                  {endpoint === "courseImage" || acceptImagesOnly ? (
                    <>
                      <Badge variant="secondary" className="text-[10px]">JPG</Badge>
                      <Badge variant="secondary" className="text-[10px]">PNG</Badge>
                      <Badge variant="secondary" className="text-[10px]">WebP</Badge>
                      <Badge variant="outline" className="text-[10px]">Max 4MB</Badge>
                    </>
                  ) : (
                    <>
                      <Badge variant="secondary" className="text-[10px] bg-red-500/10 text-red-600 dark:text-red-400">PDF</Badge>
                      <Badge variant="secondary" className="text-[10px]">Images</Badge>
                      <Badge variant="outline" className="text-[10px]">Max 32MB</Badge>
                    </>
                  )}
                </div>
              </>
            )}
          </label>
        </div>
      )}

      {/* Error notification */}
      {uploadError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
            <span>{uploadError}</span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowManualInput(true)
                setUploadError(null)
              }}
              className="text-[11px] font-bold underline hover:no-underline text-foreground cursor-pointer"
            >
              {tr("Paste link instead", "لصق رابط بديل")}
            </button>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="shrink-0 p-1 hover:bg-destructive/10 rounded-md cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

