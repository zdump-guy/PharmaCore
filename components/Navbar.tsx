import Link from "next/link"
import { useRouter } from "next/router"
import { Languages, Menu, Moon, Sun } from "lucide-react"
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

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <nav className="page-shell flex h-20 items-center justify-between" aria-label={isAr ? "التنقل الرئيسي" : "Main navigation"}>
        <Link href="/" className="flex min-h-11 items-center gap-3 rounded-lg" aria-label={isAr ? "فارما كور - الرئيسية" : "PharmaCore home"}>
          <BrandMark />
          <span className="text-lg font-extrabold tracking-tight">Pharma<span className="text-primary">Core</span></span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {nav.map((item) => <Button key={item.href} variant="ghost" asChild><Link href={item.href}>{item.label}</Link></Button>)}
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={switchLocale} aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"} title={isAr ? "English" : "العربية"}><Languages /></Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={theme === "dark" ? (isAr ? "تفعيل الوضع الفاتح" : "Switch to light mode") : (isAr ? "تفعيل الوضع الداكن" : "Switch to dark mode")}>{theme === "dark" ? <Sun /> : <Moon />}</Button>
          <Button className="hidden sm:inline-flex" asChild><Link href="/login">{isAr ? "دخول المشرف" : "Admin login"}</Link></Button>
          <Sheet>
            <SheetTrigger asChild><Button variant="outline" size="icon" className="md:hidden" aria-label={isAr ? "فتح القائمة" : "Open menu"}><Menu /></Button></SheetTrigger>
            <SheetContent side={isAr ? "right" : "left"} className="w-[86vw] max-w-sm">
              <SheetHeader className="text-start"><SheetTitle className="flex items-center gap-3"><BrandMark /> PharmaCore</SheetTitle></SheetHeader>
              <div className="mt-10 flex flex-col gap-2">
                {nav.map((item) => <SheetClose asChild key={item.href}><Button variant="ghost" className="h-12 justify-start text-base" asChild><Link href={item.href}>{item.label}</Link></Button></SheetClose>)}
                <SheetClose asChild><Button className="mt-4 h-12" asChild><Link href="/login">{isAr ? "دخول المشرف" : "Admin login"}</Link></Button></SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
