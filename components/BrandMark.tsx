import { FiPlus as Cross } from "react-icons/fi"
import { cn } from "@/lib/utils"
import { useSiteContent } from "@/components/SiteContentProvider"

export default function BrandMark({ className }: { className?: string }) {
  const { branding } = useSiteContent()
  return (
    <span className={cn("relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary bg-contain bg-center bg-no-repeat text-primary-foreground", className)} style={branding.logo_url ? { backgroundImage: `url(${branding.logo_url})` } : undefined} aria-hidden="true">
      {!branding.logo_url && <><Cross className="size-5" /><span className="absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-background bg-[#8BCDE1]" /></>}
    </span>
  )
}
