import React, { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"

export interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: ReactNode
  className?: string
  cardClassName?: string
  isCard?: boolean
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
  cardClassName = "",
  isCard = true,
}: EmptyStateProps) {
  const content = (
    <div className={`flex flex-col items-center justify-center text-center space-y-4 ${className}`}>
      <div className="size-14 grid place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
        <Icon className="size-7" />
      </div>
      <div className="space-y-1.5 max-w-md">
        <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">{title}</h3>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  )

  if (!isCard) {
    return content
  }

  return (
    <Card
      className={`rounded-3xl border-2 border-dashed border-border/80 bg-card/60 backdrop-blur-xl p-8 sm:p-12 text-center max-w-xl mx-auto my-6 shadow-xs ${cardClassName}`}
    >
      <CardContent className="p-0">{content}</CardContent>
    </Card>
  )
}
