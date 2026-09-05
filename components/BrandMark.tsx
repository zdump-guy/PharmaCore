import Image from "next/image"
import { cn } from "@/lib/utils"

export default function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center size-10", className)}>
      <Image
        src="/pharmacore-mark.svg"
        alt="PharmaCore mark"
        width={40}
        height={40}
        className="size-full object-contain dark:hidden"
        priority
      />
      <Image
        src="/pharmacore-mark-dark.svg"
        alt="PharmaCore mark"
        width={40}
        height={40}
        className="hidden size-full object-contain dark:block"
        priority
      />
    </span>
  )
}

