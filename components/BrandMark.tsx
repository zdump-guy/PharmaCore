import { Cross } from "lucide-react"
import { cn } from "@/lib/utils"

export default function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground", className)} aria-hidden="true">
      <Cross className="size-5" strokeWidth={2.5} />
      <span className="absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-background bg-[#8BCDE1]" />
    </span>
  )
}
