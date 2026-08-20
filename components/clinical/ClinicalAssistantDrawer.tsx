"use client"

import React, { useState } from "react"
import { useRouter } from "next/router"
import {
  FiCpu as Cpu,
  FiZap as Zap,
} from "react-icons/fi"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ClinicalWorkspace from "@/components/clinical/ClinicalWorkspace"

interface ClinicalAssistantDrawerProps {
  lectureId?: string
  lectureTitle?: string
  objectives?: string[]
  currentTimestamp?: number
  defaultOpen?: boolean
  triggerLabel?: string
  customTrigger?: React.ReactNode
  variant?: "floating" | "inline" | "button"
}

export default function ClinicalAssistantDrawer({
  lectureId,
  lectureTitle,
  objectives = [],
  currentTimestamp = 0,
  defaultOpen = false,
  triggerLabel,
  customTrigger,
  variant = "floating",
}: ClinicalAssistantDrawerProps) {
  const { locale } = useRouter()
  const isAr = locale === "ar"
  const [open, setOpen] = useState(defaultOpen)

  const side = isAr ? "left" : "right"
  const defaultLabel = isAr ? "المساعد السريري الذكي" : "AI Clinical Assistant"

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {customTrigger ? (
        <SheetTrigger asChild>{customTrigger}</SheetTrigger>
      ) : variant === "floating" ? (
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 end-6 z-40 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-2xl gap-2.5 px-5 py-3 border-2 border-primary-foreground/20 hover:scale-105 active:scale-95 transition-all animate-in fade-in slide-in-from-bottom-5"
            aria-label={triggerLabel || defaultLabel}
          >
            <div className="size-6 grid place-items-center rounded-full bg-primary-foreground/20 shrink-0">
              <Cpu className="size-3.5" />
            </div>
            <span className="text-xs">{triggerLabel || defaultLabel}</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </Button>
        </SheetTrigger>
      ) : (
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full font-bold text-xs gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary shadow-xs"
          >
            <Zap className="size-3.5 text-primary" />
            <span>{triggerLabel || defaultLabel}</span>
          </Button>
        </SheetTrigger>
      )}

      <SheetContent
        side={side}
        className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl p-0 flex flex-col h-full border-border/80 bg-background overflow-hidden z-50 shadow-2xl"
      >
        <SheetHeader className="p-4 border-b border-border/80 bg-card/90 shrink-0 text-start">
          <div className="flex items-center gap-2.5">
            <div className="size-9 grid place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Cpu className="size-5" />
            </div>
            <div>
              <SheetTitle className="text-base font-black text-foreground flex items-center gap-2">
                <span>{defaultLabel}</span>
                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/30 font-bold">
                  v2.0
                </Badge>
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {isAr
                  ? "تحليل سياقي فوري للمحاضرة، حاسبات تصفية كلوية، وجرعات الأطفال وفحص التفاعلات."
                  : "Contextual lecture Q&A, Cockcroft-Gault CrCl, pediatric dosing, & DDI screening."}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Embedded Clinical Workspace */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <ClinicalWorkspace
            lectureId={lectureId}
            lectureTitle={lectureTitle}
            objectives={objectives}
            currentTimestamp={currentTimestamp}
            onClose={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
