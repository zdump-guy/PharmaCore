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

interface TurnstileRenderParams {
  sitekey: string
  callback: (token: string) => void
  "error-callback"?: (error: unknown) => void
  "expired-callback"?: () => void
  action?: string
  cData?: string
  theme?: "auto" | "light" | "dark"
  size?: "normal" | "flexible" | "compact" | "invisible"
  retry?: "auto" | "never"
  "refresh-expired"?: "auto" | "manual" | "never"
  appearance?: "always" | "execute" | "interaction-only"
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
  theme?: "auto" | "light" | "dark"
  size?: "normal" | "flexible" | "compact" | "invisible"
  appearance?: "always" | "execute" | "interaction-only"
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
      size = "invisible",
      appearance = "always",
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

    const resolvedSiteKey =
      siteKey ||
      process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ||
      TURNSTILE_TEST_SITE_KEY

    // Stable callback refs
    const onVerifyRef = useRef(onVerify)
    onVerifyRef.current = onVerify

    const onErrorRef = useRef(onError)
    onErrorRef.current = onError

    const onExpireRef = useRef(onExpire)
    onExpireRef.current = onExpire

    const renderWidget = useCallback(() => {
      if (!containerRef.current || !window.turnstile || widgetIdRef.current) {
        return
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: resolvedSiteKey,
          action,
          cData,
          theme,
          size,
          appearance,
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
      } catch (err) {
        console.warn("Turnstile render warning:", err)
      }
    }, [resolvedSiteKey, action, cData, theme, size, appearance])

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current)
        }
      },
      execute: () => {
        if (containerRef.current && window.turnstile) {
          window.turnstile.execute(containerRef.current)
        }
      },
      getResponse: () => {
        if (widgetIdRef.current && window.turnstile) {
          return window.turnstile.getResponse(widgetIdRef.current)
        }
        return undefined
      },
    }))

    useEffect(() => {
      setIsMounted(true)
      loadTurnstileScript(() => {
        renderWidget()
      })

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
    }, [renderWidget])

    if (!isMounted) {
      return null
    }

    return (
      <div
        ref={containerRef}
        className={className || (size === "invisible" ? "hidden" : "my-2")}
        aria-hidden={size === "invisible" ? "true" : undefined}
      />
    )
  }
)

Turnstile.displayName = "Turnstile"

export default Turnstile
