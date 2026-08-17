import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import {
  FiBookOpen as BookOpen,
  FiChevronRight as ChevronRight,
  FiGlobe as Languages,
  FiHome as HomeIcon,
  FiInfo as InfoIcon,
  FiMenu as Menu,
  FiMoon as Moon,
  FiShield as ShieldCheck,
  FiSun as Sun,
} from "react-icons/fi"
import BrandMark from "@/components/BrandMark"
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
import { trackLocaleSwitch, trackThemeToggle } from "@/lib/analytics"

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const { locale, pathname, asPath, query } = router
  const isAr = locale === "ar"
  const [activeSection, setActiveSection] = useState<"home" | "about" | "courses">("home")

  // Nav order matches page layout: 1. Home, 2. About, 3. Courses
  const nav = [
    { href: "/", label: isAr ? "الرئيسية" : "Home", icon: HomeIcon, sectionId: "home" as const },
    { href: "/#about", label: isAr ? "عن المنصة" : "About", icon: InfoIcon, sectionId: "about" as const },
    { href: "/#courses", label: isAr ? "المقررات" : "Courses", icon: BookOpen, sectionId: "courses" as const },
  ]

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

  const isNavActive = (sectionId: "home" | "about" | "courses", href: string) => {
    if (pathname === "/") {
      return activeSection === sectionId
    }
    return asPath.startsWith(href)
  }

  const tr = (en: string, ar: string) => (isAr ? ar : en)

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
          className="flex min-h-11 min-w-0 items-center gap-2 rounded-full px-1 outline-none transition-colors hover:bg-accent/35 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-2"
          aria-label={isAr ? "فارما كور - الرئيسية" : "PharmaCore home"}
        >
          <BrandMark className="size-9 sm:size-10" />
          <span className="hidden truncate text-sm font-extrabold tracking-tight min-[360px]:inline sm:text-lg">
            Pharma<span className="text-primary">Core</span>
          </span>
        </Link>

        {/* Desktop Navigation Links (Home -> About -> Courses) */}
        <div className="hidden items-center gap-1 rounded-full bg-muted/35 p-1 md:flex">
          {nav.map((item) => {
            const active = isNavActive(item.sectionId, item.href)
            return (
              <Button
                key={item.href}
                variant="ghost"
                className={`h-11 rounded-full px-5 text-sm transition-all focus-visible:ring-ring ${
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

        {/* Controls & Mobile Hamburger */}
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5 md:justify-self-end">
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

          {/* Mobile Drawer (Slides from trailing side of navbar) */}
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
                  <SheetTitle className="flex items-center gap-3">
                    <BrandMark className="size-9 shrink-0" />
                    <div>
                      <span className="text-base font-black tracking-tight block">
                        Pharma<span className="text-primary">Core</span>
                      </span>
                      <span className="text-[11px] font-normal text-muted-foreground block -mt-0.5">
                        {tr("Open Pharmacy Education", "منصة التعليم الصيدلي المفتوح")}
                      </span>
                    </div>
                  </SheetTitle>
                </SheetHeader>

                {/* Navigation Items List in Correct Page Order */}
                <div className="space-y-2 pt-2">
                  {nav.map((item) => {
                    const active = isNavActive(item.sectionId, item.href)
                    const Icon = item.icon
                    return (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          onClick={(e) => handleNavClick(e, item.href, item.sectionId)}
                          className={`group flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all min-h-[52px] ${
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
                </div>
              </div>

              {/* Drawer Bottom Controls & Status */}
              <div className="space-y-4 pt-6 border-t">
                <div className="grid grid-cols-2 gap-2">
                  {/* Language Toggle Button */}
                  <Button
                    variant="outline"
                    className="min-h-[46px] rounded-2xl justify-center gap-2 text-xs font-bold bg-muted/30 hover:bg-muted/60"
                    onClick={switchLocale}
                  >
                    <Languages className="size-4 text-primary" />
                    <span>{isAr ? "English" : "العربية"}</span>
                  </Button>

                  {/* Theme Toggle Button */}
                  <Button
                    variant="outline"
                    className="min-h-[46px] rounded-2xl justify-center gap-2 text-xs font-bold bg-muted/30 hover:bg-muted/60"
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

                {/* Educator Reviewed Trust Pill */}
                <div className="flex items-center justify-center gap-2 rounded-xl bg-primary/5 border border-primary/15 py-2 px-3 text-[11px] font-semibold text-primary">
                  <ShieldCheck className="size-3.5 shrink-0" />
                  <span>{tr("Educator-guided curriculum", "محتوى معتمد بإشراف متخصصين")}</span>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
