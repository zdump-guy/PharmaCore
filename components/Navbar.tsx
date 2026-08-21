import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import {
  FiActivity as Activity,
  FiAward as Award,
  FiBookOpen as BookOpen,
  FiChevronDown as ChevronDown,
  FiChevronRight as ChevronRight,
  FiGlobe as Languages,
  FiHome as HomeIcon,
  FiLogIn as LogIn,
  FiLogOut as LogOut,
  FiMenu as Menu,
  FiMoon as Moon,
  FiShield as ShieldCheck,
  FiSun as Sun,
  FiUser as UserIcon,
} from "react-icons/fi"
import BrandMark from "@/components/BrandMark"
import { useTheme } from "@/components/ThemeProvider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { supabase } from "@/lib/supabaseClient"
import { trackLocaleSwitch, trackThemeToggle, resetUser } from "@/lib/analytics"

interface AuthUser {
  id: string
  email: string
  fullName: string
  role: string
}

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const { locale, pathname, asPath, query } = router
  const isAr = locale === "ar"
  const [activeSection, setActiveSection] = useState<"home" | "about" | "courses">("home")
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)

  // Track active section on scroll when on homepage
  useEffect(() => {
    if (pathname !== "/") return

    const handleScroll = () => {
      const scrollY = window.scrollY
      const aboutEl = document.getElementById("about")
      const coursesEl = document.getElementById("courses")

      const aboutOffset = (aboutEl?.offsetTop ?? 600) - 150
      const coursesOffset = (coursesEl?.offsetTop ?? 1200) - 150

      if (scrollY >= coursesOffset) {
        setActiveSection("courses")
      } else if (scrollY >= aboutOffset) {
        setActiveSection("about")
      } else {
        setActiveSection("home")
      }
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [pathname])

  // Real-time Supabase Auth state listener
  useEffect(() => {
    if (!supabase) return

    async function loadUser() {
      try {
        const {
          data: { session },
        } = await supabase!.auth.getSession()

        if (session?.user) {
          const { data: profile } = await supabase!
            .from("users")
            .select("full_name, role")
            .eq("id", session.user.id)
            .maybeSingle()

          setAuthUser({
            id: session.user.id,
            email: session.user.email || "",
            fullName: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
            role: profile?.role || session.user.user_metadata?.role || "student",
          })
        } else {
          setAuthUser(null)
        }
      } catch {
        setAuthUser(null)
      }
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          const { data: profile } = await supabase!
            .from("users")
            .select("full_name, role")
            .eq("id", session.user.id)
            .maybeSingle()

          setAuthUser({
            id: session.user.id,
            email: session.user.email || "",
            fullName: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
            role: profile?.role || session.user.user_metadata?.role || "student",
          })
        } else {
          setAuthUser(null)
        }
      } catch {
        setAuthUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    resetUser()
    setAuthUser(null)
    router.push("/")
  }

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    _sectionId: string
  ) => {
    if (href === "/" && pathname === "/") {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: "smooth" })
      window.history.replaceState(null, "", "/")
      setActiveSection("home")
    }
  }

  const nav = [
    { href: "/", label: isAr ? "الرئيسية" : "Home", icon: HomeIcon, sectionId: "home" },
    { href: "/courses", label: isAr ? "دليل المقررات" : "Courses", icon: BookOpen, sectionId: "courses_catalog" },
    { href: "/leaderboard", label: isAr ? "المتصدرون" : "Leaderboard", icon: Award, sectionId: "leaderboard" },
    ...(authUser
      ? [{ href: "/dashboard", label: isAr ? "لوحة التعلم" : "Dashboard", icon: Activity, sectionId: "dashboard" }]
      : []),
  ]

  const isNavActive = (_sectionId: string, href: string) => {
    if (href === "/") {
      return pathname === "/" && activeSection === "home"
    }
    return pathname.startsWith(href)
  }

  const tr = (en: string, ar: string) => (isAr ? ar : en)
  const isStaff = authUser && ["dev", "super_admin", "mentor"].includes(authUser.role)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4 transition-all">
      <nav
        className="glass-nav mx-auto flex h-16 w-full min-w-0 max-w-7xl items-center justify-between rounded-full px-3 text-foreground sm:px-5 md:grid md:grid-cols-[1fr_auto_1fr]"
        aria-label={isAr ? "التنقل الرئيسي" : "Main navigation"}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={(e) => handleNavClick(e, "/", "home")}
          className="group flex min-h-11 min-w-0 items-center gap-2.5 rounded-full px-2 outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={isAr ? "فارما كور - الرئيسية" : "PharmaCore home"}
        >
          <div className="relative flex items-center justify-center">
            <BrandMark className="size-9 sm:size-10 transition-transform group-hover:rotate-6" />
          </div>
          <div className="hidden flex-col min-[380px]:flex">
            <span className="text-base sm:text-lg font-black tracking-tight leading-none">
              Pharma<span className="text-primary">Core</span>
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none mt-0.5">
              Clinical
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-1 rounded-full border border-border/60 bg-muted/40 p-1.5 backdrop-blur-md md:flex shrink-0">
          {nav.map((item) => {
            const active = isNavActive(item.sectionId, item.href)
            return (
              <Button
                key={item.href}
                variant={active ? "default" : "ghost"}
                size="sm"
                className={`h-9 rounded-full px-4 text-xs font-bold transition-all focus-visible:ring-ring shrink-0 ${
                  active
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
                }`}
                asChild
              >
                <Link
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href, item.sectionId)}
                >
                  {item.label}
                </Link>
              </Button>
            )
          })}
        </div>

        {/* Controls & User Profile & Mobile Hamburger */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5 md:justify-self-end">
          {/* Desktop Language Switcher */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden size-9 shrink-0 rounded-full text-foreground/80 hover:bg-muted/70 focus-visible:ring-ring md:inline-flex"
            onClick={switchLocale}
            aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
            title={isAr ? "English" : "العربية"}
          >
            <Languages className="size-4" />
          </Button>

          {/* Desktop Theme Switcher */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden size-9 shrink-0 rounded-full text-foreground/80 hover:bg-muted/70 focus-visible:ring-ring md:inline-flex"
            onClick={handleToggleTheme}
            aria-label={theme === "dark" ? tr("Switch to light mode", "الوضع الفاتح") : tr("Switch to dark mode", "الوضع الداكن")}
          >
            {theme === "dark" ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-primary" />}
          </Button>

          {/* User Profile / Sign In Button */}
          {authUser ? (
            <DropdownMenu dir={isAr ? "rtl" : "ltr"}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 rounded-full ps-2 pe-3 gap-2 border-border/80 bg-background/80 hover:bg-background shadow-xs shrink-0 focus-visible:ring-primary"
                >
                  <Avatar className="size-6 ring-1 ring-primary/30">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black">
                      {getInitials(authUser.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline max-w-[110px] truncate text-xs font-bold">
                    {authUser.fullName}
                  </span>
                  <ChevronDown className="size-3 text-muted-foreground shrink-0 opacity-70" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align={isAr ? "start" : "end"}
                className="w-60 rounded-2xl p-2 shadow-2xl"
              >
                <DropdownMenuLabel className="p-2 font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none truncate text-foreground">{authUser.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{authUser.email}</p>
                    <div className="pt-1">
                      <Badge variant={isStaff ? "mentor" : "success"} className="text-[10px] px-2 py-0">
                        {isStaff ? tr("Faculty / Staff", "هيئة التدريس / إدارة") : tr("Student Portal", "حساب طالب")}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2.5 py-2 cursor-pointer font-semibold">
                    <Activity className="size-4 text-primary" />
                    <span>{tr("Student Dashboard", "لوحة تحكم الطالب")}</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2.5 py-2 cursor-pointer font-semibold">
                    <UserIcon className="size-4 text-primary" />
                    <span>{tr("My Profile & Badges", "الملف الشخصي والأوسمة")}</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/leaderboard" className="flex items-center gap-2.5 py-2 cursor-pointer font-semibold">
                    <Award className="size-4 text-primary" />
                    <span>{tr("Leaderboard Rankings", "لوحة المتصدرين")}</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/courses" className="flex items-center gap-2.5 py-2 cursor-pointer font-semibold">
                    <BookOpen className="size-4 text-primary" />
                    <span>{tr("Courses Catalog", "دليل المقررات الكامل")}</span>
                  </Link>
                </DropdownMenuItem>

                {isStaff && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2.5 py-2 cursor-pointer font-bold text-primary">
                        <ShieldCheck className="size-4" />
                        <span>{tr("Admin Dashboard", "لوحة الإدارة الأكاديمية")}</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 py-2 cursor-pointer font-semibold text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="size-4" />
                  <span>{tr("Sign Out", "تسجيل الخروج")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              className="h-10 rounded-full px-4 text-xs font-bold gap-2 shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95"
              asChild
            >
              <Link href="/login">
                <LogIn className="size-3.5 shrink-0" />
                <span>{tr("Sign In", "تسجيل الدخول")}</span>
              </Link>
            </Button>
          )}

          {/* Mobile Drawer */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-10 shrink-0 rounded-full text-foreground hover:bg-muted/70 md:hidden"
                aria-label={isAr ? "فتح القائمة" : "Open menu"}
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side={isAr ? "left" : "right"}
              className="w-[88vw] max-w-[360px] p-6 flex flex-col justify-between bg-background/95 backdrop-blur-2xl border-s shadow-2xl"
              dir={isAr ? "rtl" : "ltr"}
            >
              {/* Drawer Top Header */}
              <div className="space-y-6">
                <SheetHeader className="text-start pe-10">
                  <SheetTitle className="flex items-center gap-3">
                    <BrandMark className="size-10 shrink-0" />
                    <div>
                      <span className="text-lg font-black tracking-tight block">
                        Pharma<span className="text-primary">Core</span>
                      </span>
                      <span className="text-xs font-medium text-muted-foreground block -mt-0.5">
                        {tr("Open Clinical Pharmacy", "منصة التعليم الصيدلي المفتوح")}
                      </span>
                    </div>
                  </SheetTitle>
                </SheetHeader>

                {/* User Status Card if Logged In */}
                {authUser && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-9 ring-1 ring-primary/40">
                        <AvatarFallback className="bg-primary text-primary-foreground font-black text-xs">
                          {getInitials(authUser.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-foreground">{authUser.fullName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{authUser.email}</p>
                      </div>
                    </div>
                    {isStaff ? (
                      <Badge variant="mentor" className="text-[10px] px-2 py-0.5">
                        {tr("Staff", "إدارة")}
                      </Badge>
                    ) : (
                      <Badge variant="success" className="text-[10px] px-2 py-0.5">
                        {tr("Student", "طالب")}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Navigation Items List */}
                <div className="space-y-2 pt-1">
                  {nav.map((item) => {
                    const active = isNavActive(item.sectionId, item.href)
                    const Icon = item.icon
                    return (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          onClick={(e) => handleNavClick(e, item.href, item.sectionId)}
                          className={`group flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all min-h-[48px] ${
                            active
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                              : "bg-muted/40 hover:bg-muted text-foreground/85 hover:text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`grid size-8 place-items-center rounded-xl transition-colors ${
                                active
                                  ? "bg-primary-foreground/20 text-primary-foreground"
                                  : "bg-background text-primary shadow-2xs"
                              }`}
                            >
                              <Icon className="size-4" />
                            </span>
                            <span>{item.label}</span>
                          </div>

                          <ChevronRight
                            className={`size-4 transition-transform group-hover:translate-x-0.5 ${
                              isAr ? "rotate-180 group-hover:-translate-x-0.5" : ""
                            } ${active ? "opacity-90" : "text-muted-foreground opacity-60"}`}
                          />
                        </Link>
                      </SheetClose>
                    )
                  })}

                  {authUser && (
                    <>
                      <SheetClose asChild>
                        <Link
                          href="/profile"
                          className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-bold bg-muted/40 hover:bg-muted text-foreground transition-all min-h-[48px]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
                              <UserIcon className="size-4" />
                            </span>
                            <span>{tr("My Profile & Progress", "ملفي الأكاديمي والتقدم")}</span>
                          </div>
                          <ChevronRight className={`size-4 ${isAr ? "rotate-180" : ""}`} />
                        </Link>
                      </SheetClose>

                      {isStaff && (
                        <SheetClose asChild>
                          <Link
                            href="/admin"
                            className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-all min-h-[48px]"
                          >
                            <div className="flex items-center gap-3">
                              <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
                                <ShieldCheck className="size-4" />
                              </span>
                              <span>{tr("Admin Dashboard", "لوحة الإدارة الأكاديمية")}</span>
                            </div>
                            <ChevronRight className={`size-4 ${isAr ? "rotate-180" : ""}`} />
                          </Link>
                        </SheetClose>
                      )}
                    </>
                  )}

                  {!authUser && (
                    <SheetClose asChild>
                      <Link
                        href="/login"
                        className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all min-h-[48px]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 place-items-center rounded-xl bg-primary-foreground/20 text-primary-foreground">
                            <LogIn className="size-4" />
                          </span>
                          <span>{tr("Sign In / Register", "تسجيل الدخول / حساب جديد")}</span>
                        </div>
                        <ChevronRight className={`size-4 ${isAr ? "rotate-180" : ""}`} />
                      </Link>
                    </SheetClose>
                  )}
                </div>
              </div>

              {/* Drawer Bottom Controls & Status */}
              <div className="space-y-3 pt-6 border-t border-border/80">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="min-h-[44px] rounded-2xl justify-center gap-2 text-xs font-bold bg-muted/40 hover:bg-muted"
                    onClick={switchLocale}
                  >
                    <Languages className="size-4 text-primary" />
                    <span>{isAr ? "English" : "العربية"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="min-h-[44px] rounded-2xl justify-center gap-2 text-xs font-bold bg-muted/40 hover:bg-muted"
                    onClick={handleToggleTheme}
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="size-4 text-amber-400" />
                        <span>{tr("Light", "فاتح")}</span>
                      </>
                    ) : (
                      <>
                        <Moon className="size-4 text-primary" />
                        <span>{tr("Dark", "داكن")}</span>
                      </>
                    )}
                  </Button>
                </div>

                {authUser && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full rounded-2xl h-11 gap-2 font-bold"
                    onClick={handleSignOut}
                  >
                    <LogOut className="size-4" />
                    <span>{tr("Sign Out", "تسجيل الخروج")}</span>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
