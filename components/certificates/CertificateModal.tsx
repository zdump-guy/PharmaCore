import { useState } from "react"
import {
  FiAward as Award,
  FiCheckCircle as CheckCircle,
  FiCopy as Copy,
  FiDownload as Download,
  FiExternalLink as ExternalLink,
  FiShield as Shield,
  FiX as X
} from "react-icons/fi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getQRCodeDataUrl, downloadCertificatePdf } from "@/lib/certificatePdf"
import type { CertificateRecord } from "@/types"

interface CertificateModalProps {
  isOpen: boolean
  onClose: () => void
  certificate: CertificateRecord | null
  locale?: string
}

export default function CertificateModal({
  isOpen,
  onClose,
  certificate,
  locale = "en"
}: CertificateModalProps) {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  if (!isOpen || !certificate) return null

  const isAr = locale === "ar"
  const tr = (en: string, ar: string) => (isAr ? ar : en)
  const verifyUrl = typeof window !== "undefined"
    ? `${window.location.origin}/verify/${certificate.certificate_code}`
    : `https://pharmacore.edu/verify/${certificate.certificate_code}`

  const qrDataUrl = getQRCodeDataUrl(verifyUrl, 160)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // Fallback
    }
  }

  const handleDownload = () => {
    setDownloading(true)
    try {
      downloadCertificatePdf(certificate)
    } finally {
      setTimeout(() => setDownloading(false), 1000)
    }
  }

  const formattedDate = new Date(certificate.issue_date).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-background rounded-3xl border border-border/80 shadow-2xl p-6 sm:p-8 space-y-6"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Top Header Actions */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Award className="size-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-foreground">
                {tr("Official Verified Certificate", "شهادة إتمام معتمدة وموثقة")}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                ID: {certificate.certificate_code}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            aria-label="Close modal"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* ─── Certificate Visual Canvas Card ────────────────────────────── */}
        <div className="relative rounded-2xl border-4 border-emerald-800/90 bg-gradient-to-b from-white via-emerald-50/20 to-white dark:from-zinc-950 dark:via-emerald-950/10 dark:to-zinc-950 p-6 sm:p-10 shadow-inner overflow-hidden text-center space-y-6">
          {/* Inner Gold Frame */}
          <div className="absolute inset-2 border-2 border-amber-500/60 rounded-xl pointer-events-none" />
          <div className="absolute inset-3 border border-emerald-600/30 rounded-lg pointer-events-none" />

          {/* Header Brand */}
          <div className="space-y-1 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-black uppercase tracking-widest">
              <Shield className="size-3.5" />
              <span>PharmaCore Academy of Clinical Pharmacology</span>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold">
              Official Certification of Clinical Mastery
            </p>
          </div>

          {/* Main Certificate Title */}
          <div className="space-y-1 relative z-10">
            <h2 className="text-2xl sm:text-4xl font-serif font-black text-foreground tracking-wide italic">
              Certificate of Clinical Mastery
            </h2>
            <p className="text-xs text-muted-foreground font-serif">
              {tr("This is proudly presented to", "تُمنح هذه الشهادة المعتمدة تقديرًا واعتزازًا إلى")}
            </p>
          </div>

          {/* Student Name */}
          <div className="py-1 relative z-10">
            <h1 className="text-2xl sm:text-4xl font-serif font-black text-emerald-800 dark:text-emerald-300 underline decoration-amber-500/60 decoration-2 underline-offset-8">
              {certificate.student_name}
            </h1>
          </div>

          {/* Achievement Description & Course */}
          <div className="space-y-2 max-w-2xl mx-auto relative z-10">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tr(
                "for demonstrating outstanding clinical competency, completing 100% of lecture modules, and successfully passing the comprehensive clinical assessment in",
                "لتحقيقه معايير الإتقان السريري، وإتمام 100% من المحاضرات، واجتياز التقييم الشامل بنجاح في"
              )}
            </p>
            <h3 className="text-lg sm:text-2xl font-black text-foreground">
              {isAr && certificate.course_title_ar
                ? certificate.course_title_ar
                : certificate.course_title_en}
            </h3>
            {certificate.course_title_ar && !isAr && (
              <p className="text-xs text-muted-foreground/80 font-sans">
                {certificate.course_title_ar}
              </p>
            )}
          </div>

          {/* Mastery Metrics Pill */}
          <div className="inline-flex flex-wrap items-center justify-center gap-3 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-800 dark:text-emerald-200">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="size-3.5 text-emerald-500" />
              100% {tr("Lecture Completion", "إتمام المحاضرات")}
            </span>
            <span>•</span>
            <span>
              {tr("Score", "النتيجة")}: {Number(certificate.final_score).toFixed(1)}%
            </span>
            <span>•</span>
            <Badge variant="success" className="text-[10px] font-bold">
              {tr("Verified & Authentic", "موثقة ومعتمدة")}
            </Badge>
          </div>

          {/* Bottom Verification & Signature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 items-center border-t border-border/40 relative z-10">
            {/* QR Code */}
            <div className="flex flex-col items-center sm:items-start gap-1 text-center sm:text-start">
              <div className="p-2 rounded-xl bg-white shadow-xs border border-border/80 inline-block">
                <img
                  src={qrDataUrl}
                  alt={`QR Code verification for ${certificate.certificate_code}`}
                  className="size-20"
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {tr("Scan to verify", "امسح للتحقق الفوري")}
              </span>
            </div>

            {/* Official Seal */}
            <div className="flex flex-col items-center justify-center">
              <div className="size-16 rounded-full bg-amber-500/10 border-2 border-amber-500 text-amber-600 dark:text-amber-400 flex flex-col items-center justify-center font-black shadow-xs">
                <span className="text-[10px] leading-none">SEAL</span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400">VERIFIED</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground mt-1">
                pharmacore.edu
              </span>
            </div>

            {/* Signature & Date */}
            <div className="flex flex-col items-center sm:items-end gap-1 text-center sm:text-end">
              <p className="font-serif font-bold text-sm text-foreground">
                Academic Oversight Board
              </p>
              <div className="w-36 h-0.5 bg-border my-0.5" />
              <p className="text-xs text-muted-foreground">{formattedDate}</p>
              <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {certificate.certificate_code}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Bottom Actions ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-2 rounded-full font-bold text-xs flex-1 sm:flex-initial"
            >
              <Copy className="size-3.5" />
              <span>{copied ? tr("Link Copied!", "تم نسخ الرابط!") : tr("Copy Verification Link", "نسخ رابط التحقق")}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2 rounded-full font-bold text-xs"
            >
              <a
                href={`/verify/${certificate.certificate_code}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3.5" />
                <span>{tr("Open Verification Page", "صفحة التحقق العامة")}</span>
              </a>
            </Button>
          </div>

          <Button
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
            className="gap-2 rounded-full font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 w-full sm:w-auto px-6 h-10"
          >
            <Download className="size-4" />
            <span>
              {downloading
                ? tr("Generating PDF...", "جارٍ إنشاء الملف...")
                : tr("Download Official PDF", "تحميل الشهادة (PDF)")}
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}
