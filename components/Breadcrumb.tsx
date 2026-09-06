import React from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { FiChevronRight as ChevronRight, FiHome as Home } from "react-icons/fi"

export interface BreadcrumbItem {
  label: string
  href?: string
  isCurrent?: boolean
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  showHome?: boolean
}

export default function Breadcrumb({ items: rawItems, className = "", showHome = true }: BreadcrumbProps) {
  const { locale } = useRouter()
  const isAr = locale === "ar"
  const homeLabel = isAr ? "الرئيسية" : "Home"
  const alreadyHasHome =
    rawItems.length > 0 &&
    (rawItems[0].href === "/" ||
      rawItems[0].label.toLowerCase() === "home" ||
      rawItems[0].label === "الرئيسية")

  const items: BreadcrumbItem[] =
    showHome && !alreadyHasHome
      ? [{ label: homeLabel, href: "/" }, ...rawItems]
      : rawItems

  return (
    <nav aria-label="Breadcrumb" className={`flex min-w-0 ${className}`} dir={isAr ? "rtl" : "ltr"}>
      <ol className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs sm:text-sm font-semibold text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isCurrent = item.isCurrent ?? isLast

          return (
            <li key={index} className="inline-flex items-center gap-1.5 sm:gap-2 min-w-0">
              {index > 0 && (
                <ChevronRight
                  className="size-3.5 text-muted-foreground/50 shrink-0 rtl:rotate-180"
                  aria-hidden="true"
                />
              )}
              {isCurrent || !item.href ? (
                <span
                  aria-current="page"
                  className="font-extrabold text-foreground truncate max-w-[180px] sm:max-w-xs md:max-w-md"
                  title={item.label}
                >
                  {index === 0 && showHome ? (
                    <span className="inline-flex items-center gap-1">
                      <Home className="size-3.5 shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                    </span>
                  ) : (
                    item.label
                  )}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1 truncate max-w-[140px] sm:max-w-[200px]"
                  title={item.label}
                >
                  {index === 0 && showHome ? (
                    <>
                      <Home className="size-3.5 shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                    </>
                  ) : (
                    item.label
                  )}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
