import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import {
  FiBookOpen as BookOpen,
  FiChevronRight as ChevronRight,
  FiDownload as Download,
  FiGlobe as Languages,
  FiHome as HomeIcon,
  FiInfo as InfoIcon,
  FiLogIn as LogIn,
  FiLogOut as LogOut,
  FiMenu as Menu,
  FiMoon as Moon,
  FiShield as ShieldCheck,
  FiSun as Sun,
  FiUser as UserIcon,
} from "react-icons/fi"
import { FaGraduationCap as GraduationCap } from "react-icons/fa6"
import BrandLogo from "@/components/BrandLogo"
import InstallAppModal from "@/components/InstallAppModal"
import { useTheme } from "@/components/ThemeProvider"
import { Button } from "@/components/ui/button"
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
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [userMenuOpen])

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

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, sectionId: "home" | "about" | "courses") => {
    if (pathname === "/") {
      e.preventDefault()
      if (sectionId === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" })
        window.history.replaceState(null, "", "/")
      } else {
        const el = document.getElementById(sectionId)
        if (el) {
          el.scrollIntoView({ behavior: "smooth" })
          window.history.replaceState(null, "", `#${sectionId}`)
        }
      }
      setActiveSection(sectionId)
    }
  }

  const nav = [
    { href: "/", label: isAr ? "الرئيسية" : "Home", icon: HomeIcon, sectionId: "home" as const },
    { href: "/#about", label: isAr ? "عن المنصة" : "About", icon: InfoIcon, sectionId: "about" as const },
    { href: "/#courses", label: isAr ? "المقررات" : "Courses", icon: BookOpen, sectionId: "courses" as const },
  ]

  const isNavActive = (sectionId: "home" | "about" | "courses", href: string) => {
    if (pathname === "/") {
      return activeSection === sectionId
    }
    return asPath.startsWith(href)
  }

  const tr = (en: string, ar: string) => (isAr ? ar : en)
  const isStaff = authUser && ["dev", "super_admin", "mentor"].includes(authUser.role)

  return (
    <header className="sticky top-0 z-40 px-2 pt-2 sm:px-5 sm:pt-3">
      <nav
        className="mx-auto flex h-16 w-full min-w-0 max-w-[1400px] items-center justify-between rounded-full border border-border/70 bg-background/65 px-2 text-foreground shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/55 sm:px-5 md:grid md:grid-cols-[1fr_auto_1fr]"
        aria-label={isAr ? "التنقل الرئيسي" : "Main navigation"}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={(e) => handleNavClick(e, "/", "home")}
          className="flex min-h-11 min-w-0 items-center rounded-full px-1 outline-none transition-colors hover:bg-accent/35 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-2"
          aria-label={isAr ? "فارما كور - الرئيسية" : "PharmaCore home"}
        >
          <BrandLogo />
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-1 rounded-full bg-muted/35 p-1 md:flex shrink-0">
          {nav.map((item) => {
            const active = isNavActive(item.sectionId, item.href)
            return (
              <Button
                key={item.href}
                variant="ghost"
                className={`h-11 rounded-full px-5 text-sm transition-all focus-visible:ring-ring whitespace-nowrap shrink-0 ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground font-bold"
                    : "text-foreground/70 hover:bg-accent/45 hover:text-foreground"
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
        <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:justify-self-end">
          {/* Desktop Language Switcher */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden shrink-0 rounded-full text-foreground/75 hover:bg-accent/45 hover:text-foreground focus-visible:ring-ring md:inline-flex"
            onClick={switchLocale}
            aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
            title={isAr ? "English" : "العربية"}
          >
            <Languages />
          </Button>

          {/* Desktop Theme Switcher */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden shrink-0 rounded-full text-foreground/75 hover:bg-accent/45 hover:text-foreground focus-visible:ring-ring md:inline-flex"
            onClick={handleToggleTheme}
            aria-label={
              theme === "dark"
                ? isAr
                  ? "تفعيل الوضع الفاتح"
                  : "Switch to light mode"
                : isAr
                ? "تفعيل الوضع الداكن"
                : "Switch to dark mode"
            }
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>

          {/* Desktop Install App Button */}
          <InstallAppModal
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="hidden shrink-0 rounded-full text-foreground/75 hover:bg-accent/45 hover:text-foreground focus-visible:ring-ring lg:inline-flex"
                aria-label={isAr ? "تثبيت تطبيق فارما كور" : "Install PharmaCore App"}
                title={isAr ? "تثبيت التطبيق" : "Install App"}
              >
                <Download className="size-4" />
              </Button>
            }
          />

          {/* User Profile / Sign In Button */}
          {authUser ? (
            <div className="relative shrink-0" ref={userMenuRef}>
              <Button
                variant="outline"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="min-h-[44px] h-11 rounded-full ps-2 pe-3 gap-2 border-primary/30 bg-card/60 hover:bg-card shadow-xs shrink-0 whitespace-nowrap"
                aria-expanded={userMenuOpen}
              >
                <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                  {isStaff ? <ShieldCheck className="size-3.5" /> : <GraduationCap className="size-3.5" />}
                </span>
                <span className="hidden sm:inline max-w-[120px] truncate text-xs font-bold">
                  {authUser.fullName}
                </span>
              </Button>

              {userMenuOpen && (
                <div
                  className="absolute w-[min(14rem,calc(100vw-1.5rem))] end-0 mt-2 rounded-2xl border bg-card/95 backdrop-blur-xl p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100"
                  dir={isAr ? "rtl" : "ltr"}
                >
                  <div className="px-2.5 py-2 border-b mb-1">
                    <p className="text-sm font-bold leading-none truncate">{authUser.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{authUser.email}</p>
                    <span className="mt-1.5 inline-block text-[10px] font-semibold text-primary uppercase tracking-wider">
                      {isStaff ? tr("Staff / Mentor", "كادر تدريسي / إدارة") : tr("Student Member", "حساب طالب")}
                    </span>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold hover:bg-muted transition-colors cursor-pointer text-foreground whitespace-nowrap"
                  >
                    <UserIcon className="size-4 text-primary shrink-0" />
                    <span>{tr("My Profile & Progress", "ملفي الأكاديمي والتقدم")}</span>
                  </Link>

                  <Link
                    href="/#courses"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold hover:bg-muted transition-colors cursor-pointer text-foreground whitespace-nowrap"
                  >
                    <BookOpen className="size-4 text-primary shrink-0" />
                    <span>{tr("Browse Courses", "استعراض المقررات")}</span>
                  </Link>

                  {isStaff && (
                    <Link
                      href="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold hover:bg-muted transition-colors cursor-pointer text-foreground border-t mt-1 pt-2 whitespace-nowrap"
                    >
                      <ShieldCheck className="size-4 text-primary shrink-0" />
                      <span>{tr("Admin Dashboard", "لوحة الإدارة")}</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
                      handleSignOut()
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer border-t mt-1 pt-2 whitespace-nowrap"
                  >
                    <LogOut className="size-4 shrink-0" />
                    <span>{tr("Sign Out", "تسجيل الخروج")}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              size="sm"
              className="min-h-[44px] h-11 rounded-full px-3.5 sm:px-4 text-xs font-bold gap-1.5 shadow-xs whitespace-nowrap shrink-0"
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
                className="size-11 shrink-0 rounded-full text-foreground hover:bg-accent/45 hover:text-foreground focus-visible:ring-ring md:hidden"
                aria-label={isAr ? "فتح القائمة" : "Open menu"}
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side={isAr ? "left" : "right"}
              className="w-[88vw] max-w-[360px] p-5 sm:p-6 flex flex-col justify-between bg-background/95 backdrop-blur-2xl border-s shadow-2xl"
              dir={isAr ? "rtl" : "ltr"}
            >
              {/* Drawer Top Header */}
              <div className="space-y-6">
                <SheetHeader className="text-start pe-10">
                  <SheetTitle className="flex flex-col items-start gap-1">
                    <BrandLogo className="h-8 w-auto" />
                    <span className="text-[11px] font-normal text-muted-foreground block">
                      {tr("Open Pharmacy Education", "منصة التعليم الصيدلي المفتوح")}
                    </span>
                  </SheetTitle>
                </SheetHeader>

                {/* User Status Card if Logged In */}
                {authUser && (
                  <div className="rounded-2xl border bg-primary/5 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground font-bold text-xs">
                        {authUser.fullName.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{authUser.fullName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{authUser.email}</p>
                      </div>
                    </div>
                    {isStaff ? (
                      <Button size="sm" variant="outline" className="text-xs min-h-[44px] h-11 px-3" asChild>
                        <Link href="/admin">
                          <ShieldCheck className="size-3.5" />
                        </Link>
                      </Button>
                    ) : null}
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

                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-bold bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-all min-h-[48px]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 place-items-center rounded-xl bg-rose-500 text-white">
                            <LogOut className="size-4" />
                          </span>
                          <span>{tr("Sign Out", "تسجيل الخروج")}</span>
                        </div>
                      </button>
                    </>
                  )}

                  {!authUser && (
                    <SheetClose asChild>
                      <Link
                        href="/login"
                        className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-bold bg-primary/10 text-primary hover:bg-primary/15 transition-all min-h-[48px]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
                            <LogIn className="size-4" />
                          </span>
                          <span>{tr("Sign In / Register", "تسجيل الدخول / إنشاء حساب")}</span>
                        </div>
                        <ChevronRight className={`size-4 ${isAr ? "rotate-180" : ""}`} />
                      </Link>
                    </SheetClose>
                  )}

                  {/* PWA Install Action Card in Mobile Drawer */}
                  <InstallAppModal
                    trigger={
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-bold bg-primary/10 text-primary hover:bg-primary/15 transition-all min-h-[48px] cursor-pointer"
                        aria-label={isAr ? "تثبيت تطبيق فارما كور" : "Install PharmaCore App"}
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
                            <Download className="size-4" />
                          </span>
                          <div className="text-start">
                            <p className="text-xs font-bold leading-none">{isAr ? "تثبيت التطبيق" : "Install App"}</p>
                            <p className="text-[10px] text-muted-foreground mt-1 font-normal leading-none">{isAr ? "إضافة لسطح المكتب أو الهاتف" : "Add to Desktop / Phone"}</p>
                          </div>
                        </div>
                        <ChevronRight className={`size-4 ${isAr ? "rotate-180" : ""}`} />
                      </button>
                    }
                  />
                </div>
              </div>

              {/* Drawer Bottom Controls & Status */}
              <div className="space-y-4 pt-6 border-t">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="min-h-[44px] rounded-2xl justify-center gap-2 text-xs font-bold bg-muted/30 hover:bg-muted/60"
                    onClick={switchLocale}
                  >
                    <Languages className="size-4 text-primary" />
                    <span>{isAr ? "English" : "العربية"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="min-h-[44px] rounded-2xl justify-center gap-2 text-xs font-bold bg-muted/30 hover:bg-muted/60"
                    onClick={handleToggleTheme}
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="size-4 text-amber-500" />
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
                    className="w-full rounded-2xl min-h-[44px] h-11 gap-2 font-bold"
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
