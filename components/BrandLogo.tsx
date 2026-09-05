import Image from "next/image"
import { cn } from "@/lib/utils"

interface BrandLogoProps {
  className?: string
  priority?: boolean
}

export default function BrandLogo({ className, priority = true }: BrandLogoProps) {
  return (
    <span className={cn("relative inline-flex shrink-0 items-center", className)}>
      <Image
        src="/pharmacore-logo.svg"
        alt="PharmaCore"
        width={281}
        height={60}
        className="h-8 min-[380px]:h-9 w-auto object-contain dark:hidden"
        priority={priority}
      />
      <Image
        src="/pharmacore-logo-dark.svg"
        alt="PharmaCore"
        width={281}
        height={60}
        className="hidden h-8 min-[380px]:h-9 w-auto object-contain dark:block"
        priority={priority}
      />
    </span>
  )
}
