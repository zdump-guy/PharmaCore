import { cn } from "@/lib/utils"

interface BrandLogoProps {
  className?: string
  priority?: boolean
}

export default function BrandLogo({ className }: BrandLogoProps) {
  return (
    <span className={cn("relative inline-flex shrink-0 items-center", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/pharmacore-logo.svg"
        alt="PharmaCore"
        width={281}
        height={60}
        className="h-8 min-[380px]:h-9 w-auto object-contain dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/pharmacore-logo-dark.svg"
        alt="PharmaCore"
        width={281}
        height={60}
        className="hidden h-8 min-[380px]:h-9 w-auto object-contain dark:block"
      />
    </span>
  )
}
