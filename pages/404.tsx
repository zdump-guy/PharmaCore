import type { GetStaticProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations"
import { FiAlertCircle, FiArrowLeft, FiHome } from "react-icons/fi"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { loadSiteContent, type SiteContent } from "@/lib/siteContent"

interface NotFoundProps {
  siteContent?: SiteContent
}

export default function Custom404() {
  const { locale } = useRouter()
  const isAr = locale === "ar"

  return (
    <Layout title={isAr ? "الصفحة غير موجودة - 404" : "Page Not Found - 404"}>
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 text-primary mb-2">
            <FiAlertCircle className="w-10 h-10" />
          </div>
          <h1 className="text-6xl font-black text-foreground tracking-tight">404</h1>
          <h2 className="text-2xl font-bold text-foreground">
            {isAr ? "الصفحة غير موجودة" : "Page Not Found"}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {isAr
              ? "عذراً، الصفحة التي تبحث عنها غير متوفرة أو قد تم نقلها."
              : "Sorry, the page you are looking for does not exist or has been moved."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/" className="inline-flex items-center gap-2">
                <FiHome className="w-4 h-4" />
                {isAr ? "الرئيسية" : "Home"}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/#courses" className="inline-flex items-center gap-2">
                <FiArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {isAr ? "تصفح المقررات" : "Browse Courses"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export const getStaticProps: GetStaticProps<NotFoundProps> = async ({ locale }) => {
  const siteContent = await loadSiteContent()
  return {
    props: {
      siteContent,
      ...(await serverSideTranslations(locale ?? "en", ["common"])),
    },
    revalidate: 60,
  }
}
