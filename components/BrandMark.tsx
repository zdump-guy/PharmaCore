import Image from "next/image"
import { cn } from "@/lib/utils"

export default function BrandMark({ className }: { className?: string }) {
  return (
    <Image src="/pharmacore-mark.svg" alt="" width={40} height={40} className={cn("size-10 shrink-0", className)} />
  )
}
