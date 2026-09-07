import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback,
} from "react"
import { TURNSTILE_TEST_SITE_KEY } from "@/lib/turnstile"

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        params: TurnstileRenderParams
      ) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
      execute: (container?: string | HTMLElement, params?: unknown) => void
      getResponse: (widgetId?: string) => string | undefined
    }
    onloadTurnstileCallback?: () => void
  }
}

export type TurnstileSize = "normal" | "flexible" | "compact"
export type TurnstileAppearance = "always" | "execute" | "interaction-only"
export type TurnstileTheme = "auto" | "light" | "dark"

interface TurnstileRenderParams {
  sitekey: string
  callback: (token: string) => void
  "error-callback"?: (error: unknown) => void
  "expired-callback"?: () => void
  action?: string
  cData?: string
  theme?: TurnstileTheme
  size?: TurnstileSize
  retry?: "auto" | "never"
  "refresh-expired"?: "auto" | "manual" | "never"
  appearance?: TurnstileAppearance
}

export interface TurnstileRef {
  reset: () => void
  execute: () => void
  getResponse: () => string | undefined
}

export interface TurnstileProps {
  siteKey?: string
  action?: string
  cData?: string
  theme?: TurnstileTheme
  size?: TurnstileSize | "invisible"
  appearance?: TurnstileAppearance
  onVerify: (token: string) => void
  onError?: (error?: unknown) => void
  onExpire?: () => void
  className?: string
}

let turnstileScriptLoading = false
let turnstileScriptLoaded = false
const scriptCallbacks: Array<() => void> = []

function loadTurnstileScript(onLoaded: () => void) {
  if (typeof window === "undefined") return

  if (window.turnstile || turnstileScriptLoaded) {
    onLoaded()
    return
  }

  scriptCallbacks.push(onLoaded)

  if (turnstileScriptLoading) {
    return
  }

  turnstileScriptLoading = true

  const scriptId = "cf-turnstile-script"
  if (document.getElementById(scriptId)) {
    return
  }

  window.onloadTurnstileCallback = () => {
    turnstileScriptLoaded = true
    scriptCallbacks.forEach((cb) => cb())
    scriptCallbacks.length = 0
  }

  const script = document.createElement("script")
  script.id = scriptId
  script.src =
    "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit"
  script.async = true
  script.defer = true
  script.onerror = () => {
    console.error("Failed to load Cloudflare Turnstile script")
  }
  document.head.appendChild(script)
}

export const Turnstile = forwardRef<TurnstileRef, TurnstileProps>(
  (
    {
      siteKey,
      action,
      cData,
      theme = "auto",
      size = "flexible",
      appearance = "interaction-only",
      onVerify,
      onError,
      onExpire,
      className,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)
    const [isMounted, setIsMounted] = useState(false)

    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "[::1]")

    const rawSiteKey =
      siteKey ||
      process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ||
      TURNSTILE_TEST_SITE_KEY

    // If running on localhost and the key is a production domain key (starts with 0x),
    // use Cloudflare's official testing site key (1x00000000000000000000AA)
    // to prevent Cloudflare 400 Bad Request / 110200 Domain Not Allowed errors in dev
    const resolvedSiteKey =
      isLocalhost && !rawSiteKey.startsWith("1x") && !rawSiteKey.startsWith("2x") && !rawSiteKey.startsWith("3x")
        ? TURNSTILE_TEST_SITE_KEY
        : rawSiteKey

    // Normalize size: Turnstile strictly requires "normal" | "flexible" | "compact"
    const resolvedSize: TurnstileSize =
      size === "compact"
        ? "compact"
        : size === "normal"
        ? "normal"
        : "flexible"

    const resolvedAppearance: TurnstileAppearance =
      size === "invisible" ? "interaction-only" : appearance || "interaction-only"

    // Stable callback refs
    const onVerifyRef = useRef(onVerify)
    onVerifyRef.current = onVerify

    const onErrorRef = useRef(onError)
    onErrorRef.current = onError

    const onExpireRef = useRef(onExpire)
    onExpireRef.current = onExpire

    // Local development pass-through token
    const devTokenRef = useRef<string>("XXXX.DUMMY.DEV.TOKEN.PASSTHROUGH")

    const renderWidget = useCallback(() => {
      if (!containerRef.current) return

      // In local development, bypass remote Cloudflare script to eliminate 400 Bad Request & reportAllChanges exceptions
      if (isLocalhost) {
        onVerifyRef.current?.(devTokenRef.current)
        return
      }

      if (!window.turnstile || widgetIdRef.current) {
        return
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: resolvedSiteKey,
          action,
          cData,
          theme,
          size: resolvedSize,
          appearance: resolvedAppearance,
          callback: (token: string) => {
            onVerifyRef.current?.(token)
          },
          "error-callback": (err: unknown) => {
            onErrorRef.current?.(err)
          },
          "expired-callback": () => {
            onExpireRef.current?.()
          },
        })
        widgetIdRef.current = id
      } catch {
        // Safe catch
      }
    }, [isLocalhost, resolvedSiteKey, action, cData, theme, resolvedSize, resolvedAppearance])

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (isLocalhost) {
          onVerifyRef.current?.(devTokenRef.current)
          return
        }
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.reset(widgetIdRef.current)
          } catch {}
        }
      },
      execute: () => {
        if (isLocalhost) {
          onVerifyRef.current?.(devTokenRef.current)
          return
        }
        if (containerRef.current && window.turnstile) {
          try {
            window.turnstile.execute(containerRef.current)
          } catch {}
        }
      },
      getResponse: () => {
        if (isLocalhost) {
          return devTokenRef.current
        }
        if (widgetIdRef.current && window.turnstile) {
          try {
            return window.turnstile.getResponse(widgetIdRef.current)
          } catch {}
        }
        return undefined
      },
    }))

    useEffect(() => {
      setIsMounted(true)
      if (isLocalhost) {
        // Immediate local verification
        onVerifyRef.current?.(devTokenRef.current)
      } else {
        loadTurnstileScript(() => {
          renderWidget()
        })
      }

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current)
          } catch {
            // Ignore on unmount
          }
          widgetIdRef.current = null
        }
      }
    }, [isLocalhost, renderWidget])

    if (!isMounted) {
      return null
    }

    return (
      <div
        ref={containerRef}
        className={className || "my-1 flex justify-center"}
        style={{ minHeight: resolvedAppearance === "interaction-only" ? 0 : 65 }}
      />
    )
  }
)

Turnstile.displayName = "Turnstile"

export default Turnstile
