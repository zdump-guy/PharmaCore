import React, { useId } from "react"
import { cn } from "@/lib/utils"
import { calculateSvgProgressRing } from "@/lib/gamification"

export interface CircularProgressRingProps {
  value: number // Progress percentage (0 - 100)
  size?: number // Outer diameter in pixels
  strokeWidth?: number // Stroke thickness in pixels
  trackColor?: string // SVG stroke color for background track
  progressColor?: string // Direct stroke color (if no gradient)
  gradient?:
    | { from: string; to: string; mid?: string }
    | "amber"
    | "silver"
    | "gold"
    | "cyan"
    | "purple"
    | "fire"
    | "emerald"
    | "primary"
  glow?: boolean
  animate?: boolean
  className?: string
  trackClassName?: string
  progressClassName?: string
  children?: React.ReactNode
}

const GRADIENT_PRESETS: Record<string, { from: string; mid?: string; to: string }> = {
  amber: { from: "#d97706", mid: "#f59e0b", to: "#b45309" },
  silver: { from: "#94a3b8", mid: "#cbd5e1", to: "#64748b" },
  gold: { from: "#eab308", mid: "#fef08a", to: "#ca8a04" },
  cyan: { from: "#06b6d4", mid: "#67e8f9", to: "#0284c7" },
  purple: { from: "#a855f7", mid: "#c084fc", to: "#7c3aed" },
  fire: { from: "#f97316", mid: "#ef4444", to: "#dc2626" },
  emerald: { from: "#10b981", mid: "#34d399", to: "#059669" },
  primary: { from: "hsl(var(--primary))", to: "hsl(var(--accent))" },
}

export const CircularProgressRing: React.FC<CircularProgressRingProps> = ({
  value,
  size = 96,
  strokeWidth = 8,
  trackColor = "rgba(148, 163, 184, 0.15)",
  progressColor,
  gradient = "gold",
  glow = true,
  animate = true,
  className,
  trackClassName,
  progressClassName,
  children,
}) => {
  const gradientId = useId()
  const glowId = useId()

  const radius = size / 2
  const { normalizedRadius, circumference, strokeDashoffset, progressPercent } =
    calculateSvgProgressRing({
      radius,
      strokeWidth,
      progressPercent: value,
    })

  // Resolve gradient config
  const gradientConfig =
    typeof gradient === "string" ? GRADIENT_PRESETS[gradient] || GRADIENT_PRESETS.gold : gradient

  return (
    <div
      className={cn("relative inline-flex items-center justify-center select-none", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={cn("transform -rotate-90 transition-transform duration-300", glow && "filter drop-shadow-sm")}
      >
        <defs>
          {gradientConfig && (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientConfig.from} />
              {gradientConfig.mid && <stop offset="50%" stopColor={gradientConfig.mid} />}
              <stop offset="100%" stopColor={gradientConfig.to} />
            </linearGradient>
          )}

          {glow && (
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          )}
        </defs>

        {/* Background Track Circle */}
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="transparent"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          className={cn("transition-colors duration-300", trackClassName)}
        />

        {/* Dynamic Progress Stroke */}
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="transparent"
          stroke={gradientConfig ? `url(#${gradientId})` : progressColor || "currentColor"}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          filter={glow ? `url(#${glowId})` : undefined}
          className={cn(
            animate ? "transition-all duration-700 ease-out" : "transition-none",
            progressClassName
          )}
        />
      </svg>

      {/* Center Slot for Icons, Streak Number, or Trophy */}
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {children}
        </div>
      )}
    </div>
  )
}

export default CircularProgressRing
