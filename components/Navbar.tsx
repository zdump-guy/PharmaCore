import Link from "next/link"
import { useRouter } from "next/router"
import { FiGlobe as Languages, FiMenu as Menu, FiMoon as Moon, FiSun as Sun } from "react-icons/fi"
import BrandMark from "@/components/BrandMark"
import { useTheme } from "@/components/ThemeProvider"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const { locale, pathname, asPath, query } = router
  const isAr = locale === "ar"
  const nav = [
    { href: "/", label: isAr ? "الرئيسية" : "Home" },
    { href: "/#courses", label: isAr ? "المقررات" : "Courses" },
    { href: "/#about", label: isAr ? "عن المنصة" : "About" },
  ]

  const switchLocale = () => router.push({ pathname, query }, asPath, { locale: isAr ? "en" : "ar" })
  const isActive = (href: string) => href === "/" ? asPath === "/" : asPath.startsWith(href)

  return (
    <header className="sticky top-0 z-40 px-2 pt-2 sm:px-5 sm:pt-3">
      <nav className="mx-auto flex h-16 w-full min-w-0 max-w-[1400px] items-center justify-between rounded-full border border-border/70 bg-background/65 px-2 text-foreground shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/55 sm:px-5 md:grid md:grid-cols-[1fr_auto_1fr]" aria-label={isAr ? "التنقل الرئيسي" : "Main navigation"}>
        <Link href="/" className="flex min-h-11 min-w-0 items-center gap-2 rounded-full px-1 outline-none transition-colors hover:bg-accent/35 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-2" aria-label={isAr ? "فارما كور - الرئيسية" : "PharmaCore home"}>
          <BrandMark className="size-9 sm:size-10" />
          <span className="hidden truncate text-sm font-extrabold tracking-tight min-[360px]:inline sm:text-lg">Pharma<span className="text-primary">Core</span></span>
        </Link>

        <div className="hidden items-center gap-1 rounded-full bg-muted/35 p-1 md:flex">
          {nav.map((item) => (
            <Button key={item.href} variant="ghost" className={`h-11 rounded-full px-5 text-sm text-foreground/70 hover:bg-accent/45 hover:text-foreground focus-visible:ring-ring ${isActive(item.href) ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground" : ""}`} asChild>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5 md:justify-self-end">
          <Button variant="ghost" size="icon" className="hidden shrink-0 rounded-full text-foreground/75 hover:bg-accent/45 hover:text-foreground focus-visible:ring-ring md:inline-flex" onClick={switchLocale} aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"} title={isAr ? "English" : "العربية"}><Languages /></Button>
          <Button variant="ghost" size="icon" className="hidden shrink-0 rounded-full text-foreground/75 hover:bg-accent/45 hover:text-foreground focus-visible:ring-ring md:inline-flex" onClick={toggleTheme} aria-label={theme === "dark" ? (isAr ? "تفعيل الوضع الفاتح" : "Switch to light mode") : (isAr ? "تفعيل الوضع الداكن" : "Switch to dark mode")}>{theme === "dark" ? <Sun /> : <Moon />}</Button>
          <Sheet>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="size-11 shrink-0 rounded-full text-foreground hover:bg-accent/45 hover:text-foreground focus-visible:ring-ring md:hidden" aria-label={isAr ? "فتح القائمة" : "Open menu"}><Menu /></Button></SheetTrigger>
            <SheetContent side={isAr ? "right" : "left"} className="w-[86vw] max-w-sm">
              <SheetHeader className="text-start"><SheetTitle className="flex items-center gap-3"><BrandMark /> PharmaCore</SheetTitle></SheetHeader>
              <div className="mt-10 flex flex-col gap-2">
                {nav.map((item) => <SheetClose asChild key={item.href}><Button variant="ghost" className="h-12 justify-start text-base" asChild><Link href={item.href}>{item.label}</Link></Button></SheetClose>)}
              </div>
              <div className="mt-6 flex items-center gap-2 border-t pt-5">
                <Button variant="outline" className="min-h-11 flex-1 justify-start" onClick={switchLocale} aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}><Languages />{isAr ? "English" : "العربية"}</Button>
                <Button variant="outline" size="icon" className="size-11 shrink-0" onClick={toggleTheme} aria-label={theme === "dark" ? (isAr ? "تفعيل الوضع الفاتح" : "Switch to light mode") : (isAr ? "تفعيل الوضع الداكن" : "Switch to dark mode")}>{theme === "dark" ? <Sun /> : <Moon />}</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
