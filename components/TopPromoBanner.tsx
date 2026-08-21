import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import {
  FiClock as Clock,
  FiCopy as Copy,
  FiCheck as Check,
  FiArrowRight as ArrowRight,
  FiX as X,
  FiTag as Tag,
  FiZap as Zap,
} from "react-icons/fi"
import { useSiteContent } from "@/components/SiteContentProvider"
import type { MarketingBannerConfig } from "@/types"

interface TopPromoBannerProps {
  config?: MarketingBannerConfig
  isPreview?: boolean
  onDismiss?: () => void
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

export default function TopPromoBanner({
  config: propConfig,
  isPreview = false,
  onDismiss,
}: TopPromoBannerProps) {
  const router = useRouter()
  const isAr = router.locale === "ar"
  const tr = (en: string, ar: string) => (isAr ? ar : en)

  const siteContent = useSiteContent()
  const bannerConfig = propConfig || siteContent.marketing_banner

  const [dismissed, setDismissed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<TimeRemaining | null>(null)
  const [mounted, setMounted] = useState(false)

  // Determine storage key based on campaign target_date or code
  const promoKey = bannerConfig?.target_date || bannerConfig?.coupon_code || "main_promo"
  const storageKey = `pharmacore_promo_dismissed_${promoKey}`

  // Check client-side dismissal state
  useEffect(() => {
    setMounted(true)
    if (!isPreview) {
      try {
        const isDismissed = localStorage.getItem(storageKey) === "true"
        setDismissed(isDismissed)
      } catch {
        // Fallback for private browsing / blocked localStorage
      }
    }
  }, [storageKey, isPreview])

  // Countdown timer logic
  const calculateTimeLeft = useCallback((): TimeRemaining | null => {
    if (!bannerConfig?.target_date) return null

    const targetTime = new Date(bannerConfig.target_date).getTime()
    if (isNaN(targetTime)) return null

    const difference = targetTime - Date.now()

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
      }
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isExpired: false,
    }
  }, [bannerConfig?.target_date])

  useEffect(() => {
    setTimeLeft(calculateTimeLeft())

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(interval)
  }, [calculateTimeLeft])

  const handleDismiss = () => {
    setDismissed(true)
    if (!isPreview) {
      try {
        localStorage.setItem(storageKey, "true")
      } catch {}
    }
    onDismiss?.()
  }

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!bannerConfig?.coupon_code) return
    try {
      await navigator.clipboard.writeText(bannerConfig.coupon_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback if clipboard API is unavailable
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // If banner is disabled or dismissed (and not preview mode), do not render
  if (!bannerConfig?.enabled && !isPreview) return null
  if (dismissed && !isPreview) return null
  if (!mounted && !isPreview) return null

  const badgeText = isAr
    ? bannerConfig?.badge_ar || bannerConfig?.badge_en || "عرض خاص"
    : bannerConfig?.badge_en || bannerConfig?.badge_ar || "LIMITED OFFER"

  const mainText = isAr
    ? bannerConfig?.text_ar || bannerConfig?.text_en || ""
    : bannerConfig?.text_en || bannerConfig?.text_ar || ""

  const ctaText = isAr
    ? bannerConfig?.cta_text_ar || bannerConfig?.cta_text_en || "استكشف المقررات"
    : bannerConfig?.cta_text_en || bannerConfig?.cta_text_ar || "Explore Courses"

  const ctaUrl = bannerConfig?.cta_url || "/courses"

  return (
    <div
      role="region"
      aria-label={tr("Special Announcement Banner", "شريط الإعلانات الترويجية")}
      dir={isAr ? "rtl" : "ltr"}
      className="relative z-40 w-full overflow-hidden border-b border-primary/30 bg-gradient-to-r from-emerald-950/95 via-primary/95 to-teal-950/95 px-3 py-2 sm:py-2.5 text-white shadow-lg backdrop-blur-xl transition-all duration-300"
    >
      {/* Subtle background glow effect */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-xs">
        {/* Left / Center Banner Content */}
        <div className="flex flex-1 flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-3 text-center sm:text-start">
          {/* Promo Pill Badge */}
          {badgeText && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-300 shadow-2xs shrink-0">
              <Zap className="size-3 animate-pulse text-amber-400" />
              <span>{badgeText}</span>
            </span>
          )}

          {/* Main Promotional Text */}
          <span className="font-semibold text-white/95 text-[11px] sm:text-xs leading-snug">
            {mainText}
          </span>

          {/* Coupon Code 1-Click Copy Pill */}
          {bannerConfig?.coupon_code && (
            <button
              type="button"
              onClick={handleCopyCode}
              aria-label={tr(`Copy discount code ${bannerConfig.coupon_code}`, `نسخ رمز الخصم ${bannerConfig.coupon_code}`)}
              className={`group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-black transition-all cursor-pointer select-none active:scale-95 ${
                copied
                  ? "border-emerald-400/60 bg-emerald-500/30 text-emerald-200 shadow-xs"
                  : "border-white/30 bg-white/15 text-white hover:bg-white/25 hover:border-white/50"
              }`}
            >
              <Tag className="size-3 text-amber-300" />
              <span>{bannerConfig.coupon_code}</span>
              {copied ? (
                <span className="inline-flex items-center gap-0.5 text-emerald-300 font-sans text-[10px] font-bold">
                  <Check className="size-3" />
                  <span>{tr("Copied!", "تم النسخ!")}</span>
                </span>
              ) : (
                <Copy className="size-3 opacity-70 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          )}

          {/* Countdown Clock Display */}
          {timeLeft && !timeLeft.isExpired && (
            <div
              className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/25 px-2.5 py-0.5 text-[11px] font-mono text-emerald-200 shadow-inner"
              title={tr("Offer ends in", "ينتهي العرض خلال")}
            >
              <Clock className="size-3 text-emerald-400" />
              <span className="font-bold tracking-wider">
                {timeLeft.days > 0 && `${timeLeft.days}d `}
                {String(timeLeft.hours).padStart(2, "0")}:
                {String(timeLeft.minutes).padStart(2, "0")}:
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
            </div>
          )}

          {timeLeft?.isExpired && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              {tr("Offer Active", "العرض سارٍ الآن")}
            </span>
          )}
        </div>

        {/* Right CTA Action & Dismiss Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* CTA Link Button */}
          {ctaUrl && (
            <Link
              href={ctaUrl}
              className="inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1 text-[11px] font-black text-emerald-950 shadow-sm transition-all hover:bg-emerald-50 hover:shadow-md hover:scale-105 active:scale-95 shrink-0"
            >
              <span>{ctaText}</span>
              <ArrowRight className="size-3 rtl:rotate-180 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={tr("Dismiss banner", "إغلاق شريط الإعلانات")}
            className="grid size-7 place-items-center rounded-full text-white/70 hover:bg-white/15 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 cursor-pointer shrink-0"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
