import { useState } from "react"
import Link from "next/link"
import {
  FiAward as Award,
  FiDownload as Download,
  FiEye as Eye,
  FiExternalLink as ExternalLink,
  FiShield as Shield
} from "react-icons/fi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import CertificateModal from "@/components/certificates/CertificateModal"
import { downloadCertificatePdf } from "@/lib/certificatePdf"
import type { CertificateRecord } from "@/types"

interface CertificateCardProps {
  certificate: CertificateRecord
  locale?: string
}

export default function CertificateCard({ certificate, locale = "en" }: CertificateCardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const isAr = locale === "ar"
  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDownloading(true)
    try {
      downloadCertificatePdf(certificate)
    } finally {
      setTimeout(() => setDownloading(false), 1000)
    }
  }

  const formattedDate = new Date(certificate.issue_date).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  })

  return (
    <>
      <div
        className="rounded-3xl border border-border/80 bg-card/90 p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition-all shadow-xs group"
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="space-y-3">
          {/* Header Badge & Icon */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Award className="size-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                  {certificate.certificate_code}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tr("Issued", "تاريخ الإصدار")}: {formattedDate}
                </span>
              </div>
            </div>

            <Badge variant="success" className="font-bold text-[10px] gap-1 shrink-0">
              <Shield className="size-3" />
              <span>{tr("Verified", "موثقة")}</span>
            </Badge>
          </div>

          {/* Course Title */}
          <div>
            <h4 className="font-bold text-sm leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {isAr && certificate.course_title_ar
                ? certificate.course_title_ar
                : certificate.course_title_en}
            </h4>
            {certificate.course_title_ar && !isAr && (
              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                {certificate.course_title_ar}
              </p>
            )}
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-muted/40 border border-border/60 text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block">{tr("Lecture Watch", "حضور المحاضرات")}</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {certificate.watch_completion_rate}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">{tr("Quiz Score", "نتيجة الاختبار")}</span>
              <span className="font-black text-primary font-mono">
                {Number(certificate.final_score).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="flex-1 rounded-full font-bold text-xs gap-1.5 h-9"
          >
            <Eye className="size-3.5" />
            <span>{tr("View Certificate", "عرض الشهادة")}</span>
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-full font-bold text-xs gap-1.5 h-9 px-3.5"
            title={tr("Download PDF", "تحميل PDF")}
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">{tr("PDF", "تحميل")}</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            asChild
            className="size-9 p-0 rounded-full text-muted-foreground hover:text-foreground"
            title={tr("Public Verification Page", "صفحة التحقق العامة")}
          >
            <Link href={`/verify/${certificate.certificate_code}`} target="_blank">
              <ExternalLink className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      <CertificateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        certificate={certificate}
        locale={locale}
      />
    </>
  )
}
