import { useEffect, useState, useCallback } from "react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export type PwaPlatform = "desktop" | "android" | "ios" | "unknown"

export interface PwaInstallState {
  canInstall: boolean
  isInstalled: boolean
  isIOS: boolean
  platform: PwaPlatform
  promptInstall: () => Promise<boolean>
  dismissPrompt: () => void
}

export function usePwaInstall(): PwaInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [platform, setPlatform] = useState<PwaPlatform>("unknown")

  useEffect(() => {
    if (typeof window === "undefined") return

    // 1. Check if already installed / running in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://")

    if (isStandalone) {
      setIsInstalled(true)
    }

    // 2. Detect platform
    const userAgent = window.navigator.userAgent || ""
    const isIosDevice =
      /iPad|iPhone|iPod/.test(userAgent) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1)

    if (isIosDevice) {
      setIsIOS(true)
      setPlatform("ios")
    } else if (/Android/.test(userAgent)) {
      setPlatform("android")
    } else if (/Macintosh|Windows|Linux|CrOS/.test(userAgent)) {
      setPlatform("desktop")
    }

    // 3. Listen for beforeinstallprompt event (Chromium, Edge, Desktop Chrome, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    // 4. Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice
        if (choice.outcome === "accepted") {
          setIsInstalled(true)
          setDeferredPrompt(null)
          return true
        }
      } catch (err) {
        console.warn("[PWA] Installation prompt error:", err)
      }
    }
    return false
  }, [deferredPrompt])

  const dismissPrompt = useCallback(() => {
    setDeferredPrompt(null)
  }, [])

  // canInstall is true if native prompt is available OR if it is an uninstalled iOS device
  const canInstall = !isInstalled && (Boolean(deferredPrompt) || isIOS)

  return {
    canInstall,
    isInstalled,
    isIOS,
    platform,
    promptInstall,
    dismissPrompt,
  }
}
