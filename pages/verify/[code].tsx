import type { GetServerSideProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { useState } from "react"
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations"
import {
  FiAlertTriangle as AlertTriangle,
  FiAward as Award,
  FiCheckCircle as CheckCircle,
  FiClock as Clock,
  FiCopy as Copy,
  FiDownload as Download,
  FiGlobe as Globe,
  FiShield as Shield,
  FiUser as User,
  FiXCircle as XCircle
} from "react-icons/fi"
import Layout from "@/components/Layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { lookupCertificateByCode } from "@/lib/certificates"
import { getQRCodeDataUrl, downloadCertificatePdf } from "@/lib/certificatePdf"
import { loadSiteContent, type SiteContent } from "@/lib/siteContent"
import type { CertificateRecord } from "@/types"

interface VerifyPageProps {
  siteContent?: SiteContent
  code: string
  verified: boolean
  certificate: CertificateRecord | null
  error: string | null
}

export default function CertificateVerificationPage({
  code,
  verified,
  certificate,
  error
}: VerifyPageProps) {
  const router = useRouter()
  const { locale } = router
  const isAr = locale === "ar"
  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const fullVerifyUrl = typeof window !== "undefined"
    ? `${window.location.origin}/verify/${code}`
    : `https://pharmacore.edu/verify/${code}`

  const qrDataUrl = getQRCodeDataUrl(fullVerifyUrl, 200)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullVerifyUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // Fallback
    }
  }

  const handleDownload = () => {
    if (!certificate) return
    setDownloading(true)
    try {
      downloadCertificatePdf(certificate)
    } finally {
      setTimeout(() => setDownloading(false), 1200)
    }
  }

  const formattedDate = certificate?.issue_date
    ? new Date(certificate.issue_date).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : ""

  const isRevoked = certificate?.status === "revoked"

  return (
    <Layout
      title={tr(
        `Certificate Verification: ${code} — PharmaCore`,
        `التحقق من صحة الشهادة: ${code} — فارما كور`
      )}
      description={tr(
        "Official public certificate verification service for PharmaCore Academy of Clinical Pharmacology.",
        "خدمة التحقق الرسمية المعتمدة لشهادات أكاديمية فارما كور لعلم الأدوية السريرية."
      )}
    >
      <div className="page-shell section-space space-y-8 max-w-4xl mx-auto" dir={isAr ? "rtl" : "ltr"}>
        {/* ─── Hero Header & Status Announcement ────────────────────────────── */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider">
            <Shield className="size-4" />
            <span>{tr("Public Credential Registry", "السجل الأكاديمي العام المعتمد")}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            {tr("Certificate Verification", "التحقق من صحة الشهادة الأكاديمية")}
          </h1>

          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            {tr(
              "Verify the authenticity, course completion records, and clinical assessment metrics of PharmaCore credentials.",
              "التحقق من صحة الشهادة وبيانات اجتياز الساعات المعتمدة ونتائج التقييم السريري الصادرة عن فارما كور."
            )}
          </p>
        </div>

        {/* ─── Main Verification Result Card ───────────────────────────────── */}
        {verified && certificate ? (
          <Card className="rounded-3xl border-2 border-emerald-500/30 bg-card/95 shadow-xl relative overflow-hidden backdrop-blur-xl">
            {/* Background Glow */}
            <div className="absolute top-0 end-0 size-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Top Verification Status Banner */}
            <div className="bg-emerald-500/15 border-b border-emerald-500/20 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle className="size-5" />
                </div>
                <div>
                  <span className="font-black text-sm text-emerald-950 dark:text-emerald-200">
                    {tr("Verified & Authentic Credential", "شهادة رسمية موثقة ومعتمدة")}
                  </span>
                  <span className="text-xs text-muted-foreground block font-mono">
                    {certificate.certificate_code}
                  </span>
                </div>
              </div>

              <Badge variant="success" className="font-bold text-xs px-3 py-1 gap-1.5">
                <Shield className="size-3.5" />
                <span>{tr("Status: Valid", "الحالة: سارية ومعتمدة")}</span>
              </Badge>
            </div>

            <CardContent className="p-6 sm:p-8 space-y-8">
              {/* Recipient & Course Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column: Student Details */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <User className="size-3.5" />
                      <span>{tr("Authenticated Student", "اسم الطالب المعتمد")}</span>
                    </span>
                    <p className="text-2xl sm:text-3xl font-serif font-black text-foreground">
                      {certificate.student_name}
                    </p>
                  </div>

                  <div className="space-y-1 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      <span>{tr("Date of Issuance", "تاريخ الإصدار")}</span>
                    </span>
                    <p className="text-sm font-bold text-foreground">
                      {formattedDate}
                    </p>
                  </div>

                  <div className="space-y-1 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Globe className="size-3.5" />
                      <span>{tr("Issuing Authority", "الجهة المانحة")}</span>
                    </span>
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                      PharmaCore Academy of Clinical Pharmacology
                    </p>
                  </div>
                </div>

                {/* Right Column: Course Details */}
                <div className="space-y-4 rounded-2xl bg-muted/40 p-5 border border-border/60">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Award className="size-3.5 text-primary" />
                      <span>{tr("Curriculum / Course Title", "المقرر الأكاديمي المعتمد")}</span>
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-foreground">
                      {isAr && certificate.course_title_ar
                        ? certificate.course_title_ar
                        : certificate.course_title_en}
                    </h3>
                    {certificate.course_title_ar && !isAr && (
                      <p className="text-xs text-muted-foreground">
                        {certificate.course_title_ar}
                      </p>
                    )}
                  </div>

                  {/* Mastery Criteria Audit Box */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/60">
                    <div className="p-3 rounded-xl bg-card border border-border/60 space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        {tr("Lecture Watch Rate", "إنجاز المحاضرات")}
                      </span>
                      <p className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {certificate.watch_completion_rate}%
                      </p>
                      <span className="text-[10px] text-muted-foreground block font-medium">
                        {tr("100% Required", "100% مطلوب")}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-card border border-border/60 space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        {tr("Clinical Assessment Score", "نتيجة التقييم")}
                      </span>
                      <p className="text-xl font-black font-mono text-primary">
                        {Number(certificate.final_score).toFixed(1)}%
                      </p>
                      <span className="text-[10px] text-muted-foreground block font-medium">
                        {tr(">= 80% Passing", ">= 80% مطلوب")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code & Sharing Section */}
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-5 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-2xl bg-white shadow-md border border-border/80 shrink-0">
                    <img
                      src={qrDataUrl}
                      alt={`QR Code verification for ${certificate.certificate_code}`}
                      className="size-24"
                    />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {tr("Verifiable QR Code", "رمز الاستجابة السريع للتحقق")}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                      {tr(
                        "Scan this code with any mobile camera or scanner to independently verify this credential against the public registry.",
                        "امسح الرمز بكاميرا الجوال للتحقق المباشر من السجل الأكاديمي المعتمد."
                      )}
                    </p>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="w-full sm:w-auto rounded-full font-bold text-xs gap-2 h-10 px-4"
                  >
                    <Copy className="size-3.5" />
                    <span>{copied ? tr("Link Copied!", "تم نسخ الرابط!") : tr("Copy Share Link", "نسخ الرابط")}</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full sm:w-auto rounded-full font-bold text-xs gap-2 h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
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
            </CardContent>
          </Card>
        ) : (
          /* ─── Invalid / Revoked / Not Found State ────────────────────────── */
          <Card className="rounded-3xl border-2 border-destructive/40 bg-card/95 shadow-xl text-center p-8 sm:p-12 space-y-6">
            <div className="size-16 rounded-full bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
              {isRevoked ? <AlertTriangle className="size-8" /> : <XCircle className="size-8" />}
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <Badge variant="destructive" className="font-bold text-xs px-3 py-1">
                {isRevoked
                  ? tr("Certificate Revoked", "شهادة ملغاة")
                  : tr("Invalid / Unverified Code", "رمز غير صالح أو غير موجود")}
              </Badge>

              <h2 className="text-2xl font-black text-foreground">
                {isRevoked
                  ? tr("This Certificate Has Been Revoked", "تم إلغاء هذه الشهادة رسميًا")
                  : tr("No Record Found", "لم يتم العثور على سجل لهذه الشهادة")}
              </h2>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {error ||
                  tr(
                    "The certificate code provided is not recognized in our database, has been revoked, or the issuance requirements were not satisfied.",
                    "رمز التحقق المدخل غير مسجل في قاعدة البيانات، أو تم إلغاؤه، أو لم يستوفِ شروط الإصدار الأكاديمي."
                  )}
              </p>

              <p className="text-xs font-mono text-muted-foreground pt-2">
                Code: <span className="font-bold text-foreground">{code}</span>
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <Button variant="outline" size="sm" className="rounded-full px-6 font-bold" asChild>
                <Link href="/">{tr("Return to Home", "العودة للرئيسية")}</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params, locale }) => {
  const code = (params?.code as string) || ""
  const siteContent = await loadSiteContent()

  const lookupResult = await lookupCertificateByCode(code)

  return {
    props: {
      siteContent,
      code,
      verified: lookupResult.verified,
      certificate: lookupResult.certificate,
      error: lookupResult.error,
      ...(await serverSideTranslations(locale ?? "en", ["common"]))
    }
  }
}
