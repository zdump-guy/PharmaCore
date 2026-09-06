import React from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import {
  FiExternalLink as ExternalLink,
  FiGlobe as Languages,
  FiHelpCircle as HelpCircle,
  FiMenu as Menu,
  FiMoon as Moon,
  FiSearch as Search,
  FiSun as Sun,
  FiX as X,
  FiChevronRight as ChevronRight,
  FiChevronLeft as ChevronLeft,
} from "react-icons/fi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTheme } from "@/components/ThemeProvider"
import { trackLocaleSwitch, trackThemeToggle } from "@/lib/analytics"

interface AdminTopNavProps {
  isAr: boolean
  onToggleMobile: () => void
  activePage: string
  activeSubpage?: string
  searchQuery: string
  setSearchQuery: (query: string) => void
  unansweredCount: number
  onGoToQA: () => void
}

export default function AdminTopNav({
  isAr,
  onToggleMobile,
  activePage,
  activeSubpage,
  searchQuery,
  setSearchQuery,
  unansweredCount,
  onGoToQA,
}: AdminTopNavProps) {
  const router = useRouter()
  const { pathname, query, asPath, locale } = router
  const { theme, toggleTheme } = useTheme()
  const tr = (en: string, ar: string) => (isAr ? ar : en)
  const BreadcrumbArrow = isAr ? ChevronLeft : ChevronRight

  const switchLocale = () => {
    const nextLocale = isAr ? "en" : "ar"
    trackLocaleSwitch({ fromLocale: locale || "en", toLocale: nextLocale })
    router.push({ pathname, query }, asPath, { locale: nextLocale })
  }

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark"
    trackThemeToggle({ theme: nextTheme })
    toggleTheme()
  }

  // Titles mapping
  const pageTitles: Record<string, { en: string; ar: string; category_en: string; category_ar: string }> = {
    analytics: {
      en: "Platform Analytics",
      ar: "تحليلات المنصة",
      category_en: "Insights",
      category_ar: "المؤشرات",
    },
    curriculum: {
      en: "Curriculum Hub",
      ar: "إدارة المناهج والمساقات",
      category_en: "Curriculum",
      category_ar: "المناهج",
    },
    students: {
      en: "Student Affairs",
      ar: "شؤون الطلاب والتسجيل",
      category_en: "Students",
      category_ar: "الطلاب",
    },
    qa: {
      en: "Community Q&A",
      ar: "نقاشات واستفسارات الطلاب",
      category_en: "Interaction",
      category_ar: "التفاعل",
    },
    users: {
      en: "Staff & Faculty Access",
      ar: "الكادر الإداري والتدريسي",
      category_en: "Governance",
      category_ar: "النظام",
    },
    content: {
      en: "Site CMS & Branding",
      ar: "محتوى ونصوص المنصة",
      category_en: "Governance",
      category_ar: "النظام",
    },
    dev: {
      en: "Developer Console",
      ar: "بوابة المطورين والتحكم",
      category_en: "Developer",
      category_ar: "المطور",
    },
  }

  const subpageTitles: Record<string, { en: string; ar: string }> = {
    courses: { en: "Courses Library", ar: "المقررات الدراسية" },
    enrollments: { en: "Course Enrollments", ar: "تسجيلات المقررات والطلبات" },
    lectures: { en: "Video Lectures", ar: "محاضرات الفيديو" },
    quizzes: { en: "Quizzes & MCQs", ar: "الاختبارات والأسئلة" },
    resources: { en: "Resources & Documents", ar: "المراجع والملفات" },
    roster: { en: "Students Roster", ar: "سجل الطلاب" },
    pending: { en: "Pending Approvals", ar: "طلبات الاعتماد" },
    provision: { en: "Account Generator", ar: "توليد الحسابات" },
    controller: { en: "Signup Controller", ar: "إعدادات التسجيل" },
    directories: { en: "Universities & Faculties", ar: "الجامعات والكليات" },
    logs: { en: "Live Tracking Logs", ar: "سجل التتبع المباشر" },
    system: { en: "System Diagnostics", ar: "فحص النظام والبيئة" },
    maintenance: { en: "Maintenance Mode", ar: "وضع الصيانة والتحديث" },
  }

  const currentMeta = pageTitles[activePage] || {
    en: "Admin Dashboard",
    ar: "لوحة التحكم",
    category_en: "Administration",
    category_ar: "الإدارة",
  }

  const currentSubMeta = activeSubpage ? subpageTitles[activeSubpage] : null

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-card/85 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile Drawer Trigger + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleMobile}
          className="lg:hidden size-9 text-muted-foreground hover:text-foreground shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="size-5" />
        </Button>

        {/* Dynamic Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center text-xs font-semibold text-muted-foreground min-w-0 max-w-[220px] sm:max-w-md lg:max-w-xl truncate">
          <ol className="flex items-center gap-1.5 min-w-0 truncate">
            <li className="hidden sm:inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <span>{isAr ? currentMeta.category_ar : currentMeta.category_en}</span>
              <BreadcrumbArrow className="size-3 text-muted-foreground/50 rtl:rotate-180" aria-hidden="true" />
            </li>
            <li className="inline-flex items-center gap-1.5 min-w-0 truncate whitespace-nowrap">
              <span className={`${currentSubMeta ? "text-muted-foreground" : "font-bold text-foreground"} truncate`} {...(!currentSubMeta ? { "aria-current": "page" as const } : {})}>
                {isAr ? currentMeta.ar : currentMeta.en}
              </span>
              {currentSubMeta && (
                <BreadcrumbArrow className="size-3 shrink-0 text-muted-foreground/50 rtl:rotate-180" aria-hidden="true" />
              )}
            </li>
            {currentSubMeta && (
              <li className="inline-flex items-center min-w-0 truncate whitespace-nowrap">
                <span aria-current="page" className="font-extrabold text-foreground truncate">
                  {isAr ? currentSubMeta.ar : currentSubMeta.en}
                </span>
              </li>
            )}
          </ol>
        </nav>
      </div>

      {/* Right: Search + Quick Site View + Notification + Toggles */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Global Filter/Search (Curriculum & Users & QA) */}
        {["curriculum", "users", "qa"].includes(activePage) && (
          <div className="relative hidden md:block w-40 lg:w-56">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground shrink-0" />
            <Input
              type="search"
              placeholder={tr("Filter items...", "بحث وتصفية...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 ps-8 pe-7 text-xs bg-muted/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        )}

        {/* View Live Public Site */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="btn-nowrap hidden sm:inline-flex h-8 px-2.5 text-xs font-bold gap-1.5 border-primary/20 bg-card hover:bg-muted shrink-0"
        >
          <Link href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5 text-primary shrink-0" />
            <span>{tr("Public Site", "الموقع العام")}</span>
          </Link>
        </Button>

        {/* Q&A Notification Bell if any questions pending */}
        {unansweredCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onGoToQA}
            className="btn-nowrap h-8 px-2 text-xs font-bold gap-1.5 text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 shrink-0"
          >
            <HelpCircle className="size-3.5 animate-pulse shrink-0" />
            <span>{unansweredCount}</span>
          </Button>
        )}

        {/* Locale Switcher */}
        <Button
          variant="ghost"
          size="sm"
          onClick={switchLocale}
          className="btn-nowrap h-8 px-2 text-xs font-bold gap-1 shrink-0"
        >
          <Languages className="size-3.5 shrink-0" />
          <span>{isAr ? "English" : "العربية"}</span>
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleTheme}
          className="size-8 shrink-0"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-3.5 text-amber-500" /> : <Moon className="size-3.5 text-primary" />}
        </Button>
      </div>
    </header>
  )
}
