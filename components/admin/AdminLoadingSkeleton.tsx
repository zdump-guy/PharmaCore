import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface AdminLoadingSkeletonProps {
  title?: string
}

export default function AdminLoadingSkeleton({ title }: AdminLoadingSkeletonProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={title ? `Loading ${title}` : "Loading admin section"}
      className="space-y-6 p-6 animate-pulse"
    >
      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-2">
          {title ? (
            <h2 className="text-xl font-bold tracking-tight text-foreground/80">
              {title}
            </h2>
          ) : (
            <Skeleton className="h-7 w-48" />
          )}
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>

      <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-64 w-full rounded-md" />
        <div className="flex justify-end gap-2 pt-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  )
}
