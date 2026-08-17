import { useState } from "react"
import { useRouter } from "next/router"
import {
  FiActivity as Activity,
  FiBookOpen as BookOpen,
  FiHelpCircle as HelpCircle,
  FiHome as HomeIcon,
  FiLogOut as LogOut,
  FiMoon as Moon,
  FiSearch as Search,
  FiShield as ShieldCheck,
  FiSun as Sun,
  FiType as TypeIcon,
  FiUsers as UsersIcon,
  FiX as X,
} from "react-icons/fi"
import BrandMark from "@/components/BrandMark"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTheme } from "@/components/ThemeProvider"
import { trackLocaleSwitch, trackThemeToggle } from "@/lib/analytics"
import type { UserProfile } from "@/types"

interface AdminHeaderProps {
  profile: UserProfile | null
  activeTab: string
  setActiveTab: (tab: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  unansweredCount: number
  canManageUsers: boolean
  isDev: boolean
  onLogout: () => void
}

export default function AdminHeader({
  profile,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  unansweredCount,
  canManageUsers,
  isDev,
  onLogout,
}: AdminHeaderProps) {
  const router = useRouter()
  const { pathname, query, asPath, locale } = router
  const isAr = locale === "ar"
  const { theme, toggleTheme } = useTheme()
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const switchLocale = () => {
    const nextLocale = isAr ? "en" : "ar"
    trackLocaleSwitch({ fromLocale: locale || "en", toLocale: nextLocale })
    router.push({ pathname, query }, asPath, { locale: nextLocale })
  }

  const handleToggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light"
    trackThemeToggle(nextTheme)
    toggleTheme()
  }

  const roleLabels: Record<string, { en: string; ar: string; color: string }> = {
    dev: {
      en: "Developer",
      ar: "مطور",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    },
    super_admin: {
      en: "Super Admin",
      ar: "مشرف عام",
      color: "bg-primary/10 text-primary border-primary/30",
    },
    mentor: {
      en: "Mentor",
      ar: "مرشد",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    },
  }

  const roleMeta = profile?.role ? roleLabels[profile.role] : null

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-md">
      {/* Primary Bar */}
      <div className="page-shell flex items-center justify-between gap-3 py-3">
        {/* Left: Brand & Mobile Role Pill */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setActiveTab("analytics")}
            className="flex items-center gap-2 text-start transition-opacity hover:opacity-80 shrink-0"
          >
            <BrandMark className="size-8 text-primary shrink-0" />
            <div className="leading-tight hidden sm:block">
              <span className="font-extrabold text-base tracking-tight">PharmaCore</span>
              <span className="ms-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Admin
              </span>
            </div>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold text-foreground/90 truncate max-w-[110px] sm:max-w-[180px]">
              {profile?.full_name?.split(" ")[0] || profile?.email?.split("@")[0] || "Admin"}
            </span>
            {roleMeta && (
              <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0 shrink-0 ${roleMeta.color}`}>
                <ShieldCheck className="size-2.5 me-0.5" />
                {tr(roleMeta.en, roleMeta.ar)}
              </Badge>
            )}
          </div>
        </div>

        {/* Center: Global Search (Desktop) */}
        <div className="relative w-full max-w-xs hidden md:block">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr("Search curriculum, users...", "تصفية المقررات، الأسئلة...")}
            className="h-8 ps-8 pe-3 text-xs rounded-lg bg-muted/40"
          />
        </div>

        {/* Right: Actions, Language, Theme, Home, Logout */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Mobile Search Toggle */}
          <Button
            variant={mobileSearchOpen ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="size-8 md:hidden"
            aria-label="Toggle search"
          >
            {mobileSearchOpen ? <X className="size-4" /> : <Search className="size-4" />}
          </Button>

          {/* Language Switch */}
          <Button
            variant="ghost"
            size="sm"
            onClick={switchLocale}
            className="h-8 px-2 text-xs font-bold"
            title={isAr ? "Switch to English" : "التبديل إلى العربية"}
          >
            {isAr ? "EN" : "عربي"}
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleTheme}
            className="size-8"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </Button>

          {/* Public Home Link */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/")}
            className="h-8 gap-1.5 text-xs px-2 sm:px-3"
            title={tr("Go to public website", "الموقع العام")}
          >
            <HomeIcon className="size-3.5" />
            <span className="hidden lg:inline">{tr("Public Site", "الموقع العام")}</span>
          </Button>

          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="h-8 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive px-2 sm:px-3"
            title={tr("Sign out", "تسجيل الخروج")}
          >
            <LogOut className="size-3.5" />
            <span className="hidden lg:inline">{tr("Sign out", "خروج")}</span>
          </Button>
        </div>
      </div>

      {/* Mobile Search Expandable Bar */}
      {mobileSearchOpen && (
        <div className="border-t bg-muted/40 p-2.5 md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tr("Filter items, titles, emails...", "تصفية المقررات، العناوين...")}
              className="h-9 ps-8 pe-3 text-xs bg-background"
            />
          </div>
        </div>
      )}

      {/* Categorized Primary Navigation Strip (Mobile-Optimized Touch Scroll) */}
      <div className="border-t bg-muted/30">
        <div className="page-shell flex items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-none snap-x touch-pan-x">
          <NavTabButton
            active={activeTab === "analytics"}
            onClick={() => setActiveTab("analytics")}
            icon={<Activity className="size-3.5" />}
            label={tr("Insights", "التحليلات")}
          />

          <NavTabButton
            active={activeTab === "curriculum"}
            onClick={() => setActiveTab("curriculum")}
            icon={<BookOpen className="size-3.5" />}
            label={tr("Curriculum", "المناهج")}
          />

          <NavTabButton
            active={activeTab === "qa"}
            onClick={() => setActiveTab("qa")}
            icon={<HelpCircle className="size-3.5" />}
            label={tr("Q&A", "الأسئلة")}
            badge={unansweredCount > 0 ? unansweredCount : undefined}
            badgeVariant="destructive"
          />

          {canManageUsers && (
            <NavTabButton
              active={activeTab === "users"}
              onClick={() => setActiveTab("users")}
              icon={<UsersIcon className="size-3.5" />}
              label={tr("Staff", "المستخدمون")}
            />
          )}

          {isDev && (
            <NavTabButton
              active={activeTab === "content"}
              onClick={() => setActiveTab("content")}
              icon={<TypeIcon className="size-3.5" />}
              label={tr("Site CMS", "محتوى الموقع")}
            />
          )}
        </div>
      </div>
    </header>
  )
}

function NavTabButton({
  active,
  onClick,
  icon,
  label,
  badge,
  badgeVariant = "default",
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  badge?: number
  badgeVariant?: "default" | "destructive" | "secondary"
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap snap-start shrink-0 min-h-[36px] ${
        active
          ? "bg-primary text-primary-foreground shadow-xs"
          : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && (
        <Badge
          variant={badgeVariant}
          className={`ms-1 h-4 min-w-4 px-1 text-[10px] leading-none justify-center ${
            active ? "bg-primary-foreground text-primary" : ""
          }`}
        >
          {badge}
        </Badge>
      )}
    </button>
  )
}
