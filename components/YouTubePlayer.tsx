import { useEffect, useRef, useState, type ChangeEvent } from "react"
import {
  FiAlertCircle as AlertCircle,
  FiMaximize as Maximize,
  FiMinimize as Minimize,
  FiPause as Pause,
  FiPlay as Play,
  FiRefreshCw as RefreshCw,
  FiTv as TvIcon,
  FiVolume2 as Volume2,
  FiVolumeX as VolumeX,
} from "react-icons/fi"
import { trackVideoEvent } from "@/lib/analytics"

/**
 * Universal YouTube Video ID Parser
 * Supports:
 * - standard: https://www.youtube.com/watch?v=VIDEO_ID
 * - short: https://youtu.be/VIDEO_ID
 * - embed: https://www.youtube.com/embed/VIDEO_ID
 * - shorts: https://www.youtube.com/shorts/VIDEO_ID
 * - live: https://www.youtube.com/live/VIDEO_ID
 * - with query strings / timestamps: ?si=..., ?t=..., &feature=...
 * - raw 11-char ID: VIDEO_ID
 */
export function parseYouTubeVideoId(input?: string | null): string | null {
  if (!input) return null
  const trimmed = input.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : null
}

interface YouTubePlayerInstance {
  destroy: () => void
  getAvailablePlaybackRates: () => number[]
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
  getPlaybackRate: () => number
  getVideoLoadedFraction: () => number
  getVolume: () => number
  isMuted: () => boolean
  mute: () => void
  pauseVideo: () => void
  playVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  setPlaybackRate: (rate: number) => void
  setVolume: (volume: number) => void
  unMute: () => void
}

interface YouTubeNamespace {
  Player: new (
    element: HTMLElement | string,
    options: {
      videoId?: string
      playerVars?: Record<string, number | string>
      events?: {
        onReady?: (event: { target: YouTubePlayerInstance }) => void
        onStateChange?: (event: { data: number }) => void
        onPlaybackQualityChange?: (event: { data: string }) => void
        onPlaybackRateChange?: (event: { data: number }) => void
        onError?: (event: { data: number }) => void
      }
    }
  ) => YouTubePlayerInstance
}

declare global {
  interface Window {
    YT?: YouTubeNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let youTubeApiPromise: Promise<YouTubeNamespace> | undefined

function loadYouTubeApi(): Promise<YouTubeNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is undefined"))
  }
  if (window.YT?.Player) {
    return Promise.resolve(window.YT)
  }
  if (youTubeApiPromise) {
    return youTubeApiPromise
  }

  youTubeApiPromise = new Promise((resolve, reject) => {
    // If already available
    if (window.YT?.Player) {
      resolve(window.YT)
      return
    }

    const timeout = window.setTimeout(() => {
      reject(new Error("YouTube API load timed out (adblock or network policy)."))
    }, 4000)

    const prevCallback = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout)
      if (prevCallback) prevCallback()
      if (window.YT?.Player) {
        resolve(window.YT)
      } else {
        reject(new Error("YouTube namespace missing after ready event."))
      }
    }

    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]')
    if (!existingScript) {
      const script = document.createElement("script")
      script.src = "https://www.youtube.com/iframe_api"
      script.async = true
      script.onerror = () => {
        window.clearTimeout(timeout)
        reject(new Error("YouTube API script blocked or failed to load."))
      }
      document.head.appendChild(script)
    }
  })

  return youTubeApiPromise
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")
  return `${minutes}:${remainder}`
}

const qualityLabel = (quality: string) =>
  ({
    auto: "Auto",
    small: "240p",
    medium: "360p",
    large: "480p",
    hd720: "720p",
    hd1080: "1080p",
    highres: "High res",
  }[quality] ?? "Auto")

interface YouTubePlayerProps {
  videoId: string
  title: string
  lectureId?: string
  lectureTitle?: string
  isAr?: boolean
}

export default function YouTubePlayer({
  videoId: rawVideoId,
  title,
  lectureId,
  lectureTitle,
  isAr = false,
}: YouTubePlayerProps) {
  const videoId = parseYouTubeVideoId(rawVideoId) || rawVideoId

  const host = useRef<HTMLDivElement>(null)
  const shell = useRef<HTMLDivElement>(null)
  const player = useRef<YouTubePlayerInstance | null>(null)
  const milestonesFired = useRef<{ [key: string]: boolean }>({
    "25%": false,
    "50%": false,
    "75%": false,
    "100%": false,
  })
  const hasStartedRef = useRef(false)

  const [activated, setActivated] = useState(false)
  const [posterError, setPosterError] = useState(false)
  const [ready, setReady] = useState(false)
  const [useNativeFallback, setUseNativeFallback] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loaded, setLoaded] = useState(0)
  const [volume, setVolume] = useState(100)
  const [muted, setMuted] = useState(false)
  const [rate, setRate] = useState(1)
  const [rates, setRates] = useState([0.75, 1, 1.25, 1.5, 1.75, 2])
  const [quality, setQuality] = useState("auto")
  const [fullscreen, setFullscreen] = useState(false)

  const tr = (en: string, ar: string) => (isAr ? ar : en)

  useEffect(() => {
    setActivated(false)
    setPosterError(false)
    setUseNativeFallback(false)
    setUnavailable(false)
  }, [videoId])

  useEffect(() => {
    if (!activated || useNativeFallback) return
    let disposed = false
    milestonesFired.current = { "25%": false, "50%": false, "75%": false, "100%": false }
    hasStartedRef.current = false
    setReady(false)
    setUnavailable(false)
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setLoaded(0)
    setQuality("auto")

    let isReady = false
    const initTimeout = window.setTimeout(() => {
      if (!disposed && !isReady) {
        // Fall back seamlessly to native embed if API initialization takes too long
        setUseNativeFallback(true)
      }
    }, 3000)

    loadYouTubeApi()
      .then((YT) => {
        if (disposed || !host.current) return

        const iframe = document.createElement("iframe")
        const query = new URLSearchParams({
          autoplay: "1",
          enablejsapi: "1",
          controls: "0",
          disablekb: "1",
          fs: "0",
          iv_load_policy: "3",
          playsinline: "1",
          rel: "0",
          origin: window.location.origin,
        })
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?${query.toString()}`
        iframe.title = title
        iframe.className = "h-full w-full border-0"
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        iframe.allowFullscreen = true
        host.current.replaceChildren(iframe)

        player.current = new YT.Player(iframe, {
          events: {
            onReady: ({ target }) => {
              if (disposed) return
              isReady = true
              window.clearTimeout(initTimeout)
              player.current = target
              try {
                const dur = target.getDuration?.() || 0
                if (dur > 0) setDuration(dur)
                setVolume(target.getVolume?.() ?? 100)
                setMuted(Boolean(target.isMuted?.()))
                setRate(target.getPlaybackRate?.() || 1)
                const availableRates = target.getAvailablePlaybackRates?.()
                if (availableRates && availableRates.length > 0) setRates(availableRates)
              } catch {}
              setReady(true)
              try {
                target.playVideo()
              } catch {}
            },
            onStateChange: ({ data }) => {
              const isNowPlaying = data === 1
              const isEnded = data === 0
              const isPaused = data === 2
              setPlaying(isNowPlaying)

              if (isNowPlaying && !hasStartedRef.current) {
                hasStartedRef.current = true
                trackVideoEvent({
                  action: "started",
                  videoId,
                  lectureId,
                  lectureTitle: lectureTitle || title,
                  duration: player.current?.getDuration?.(),
                })
              } else if (isPaused) {
                trackVideoEvent({
                  action: "paused",
                  videoId,
                  lectureId,
                  lectureTitle: lectureTitle || title,
                  currentTime: player.current?.getCurrentTime?.(),
                  duration: player.current?.getDuration?.(),
                })
              } else if (isEnded) {
                trackVideoEvent({
                  action: "completed",
                  videoId,
                  lectureId,
                  lectureTitle: lectureTitle || title,
                  duration: player.current?.getDuration?.(),
                })
              }
            },
            onPlaybackQualityChange: ({ data }) => setQuality(data || "auto"),
            onPlaybackRateChange: ({ data }) => {
              setRate(data)
              trackVideoEvent({
                action: "rate_changed",
                videoId,
                lectureId,
                lectureTitle: lectureTitle || title,
                playbackRate: data,
              })
            },
            onError: () => {
              window.clearTimeout(initTimeout)
              setUseNativeFallback(true)
            },
          },
        })
      })
      .catch(() => {
        window.clearTimeout(initTimeout)
        setUseNativeFallback(true)
      })

    return () => {
      disposed = true
      window.clearTimeout(initTimeout)
      try {
        player.current?.destroy?.()
      } catch {}
      player.current = null
    }
  }, [activated, useNativeFallback, title, videoId, lectureId, lectureTitle])

  useEffect(() => {
    const updateFullscreen = () => setFullscreen(document.fullscreenElement === shell.current)
    document.addEventListener("fullscreenchange", updateFullscreen)
    return () => document.removeEventListener("fullscreenchange", updateFullscreen)
  }, [])

  useEffect(() => {
    if (useNativeFallback) return
    const timer = window.setInterval(() => {
      const instance = player.current
      if (!instance || !ready) return
      try {
        const current = instance.getCurrentTime()
        const total = instance.getDuration()
        setCurrentTime(current)
        setDuration(total)
        setLoaded((instance.getVideoLoadedFraction?.() || 0) * total)
        setVolume(instance.getVolume?.() ?? 100)
        setMuted(Boolean(instance.isMuted?.()))

        // Check milestones
        if (total > 0) {
          const ratio = current / total
          const milestones: [number, "25%" | "50%" | "75%" | "100%"][] = [
            [0.25, "25%"],
            [0.5, "50%"],
            [0.75, "75%"],
            [0.98, "100%"],
          ]
          for (const [threshold, milestone] of milestones) {
            if (ratio >= threshold && !milestonesFired.current[milestone]) {
              milestonesFired.current[milestone] = true
              trackVideoEvent({
                action: "milestone",
                videoId,
                lectureId,
                lectureTitle: lectureTitle || title,
                currentTime: current,
                duration: total,
                milestone,
              })
            }
          }
        }
      } catch {}
    }, 400)
    return () => window.clearInterval(timer)
  }, [ready, useNativeFallback, videoId, lectureId, lectureTitle, title])

  const togglePlay = () => {
    if (!player.current) return
    try {
      if (player.current.getPlayerState?.() === 1) player.current.pauseVideo()
      else player.current.playVideo()
    } catch {}
  }

  const seek = (event: ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(event.target.value)
    setCurrentTime(nextTime)
    try {
      player.current?.seekTo(nextTime, true)
      trackVideoEvent({
        action: "seeked",
        videoId,
        lectureId,
        lectureTitle: lectureTitle || title,
        currentTime: nextTime,
        duration: player.current?.getDuration?.(),
      })
    } catch {}
  }

  const changeVolume = (event: ChangeEvent<HTMLInputElement>) => setPlayerVolume(Number(event.target.value))

  const toggleMute = () => {
    if (!player.current) return
    try {
      if (player.current.isMuted?.()) {
        player.current.unMute()
        setMuted(false)
      } else {
        player.current.mute()
        setMuted(true)
      }
    } catch {}
  }

  const setPlayerVolume = (nextVolume: number) => {
    const normalized = Math.max(0, Math.min(100, nextVolume))
    try {
      player.current?.setVolume(normalized)
      if (normalized > 0) {
        player.current?.unMute?.()
        setMuted(false)
      } else {
        player.current?.mute?.()
        setMuted(true)
      }
      setVolume(normalized)
    } catch {}
  }

  const changeRate = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextRate = Number(event.target.value)
    setRate(nextRate)
    try {
      player.current?.setPlaybackRate(nextRate)
    } catch {}
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.()
    } else {
      void shell.current?.requestFullscreen?.()
    }
  }

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target
      if (
        !ready ||
        useNativeFallback ||
        !shell.current?.contains(document.activeElement) ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement
      )
        return
      if (target instanceof HTMLButtonElement && (event.code === "Space" || event.code === "Enter")) return
      const instance = player.current
      if (!instance) return
      try {
        const seekBy = (seconds: number) => {
          const nextTime = Math.max(0, Math.min(instance.getDuration(), instance.getCurrentTime() + seconds))
          instance.seekTo(nextTime, true)
          setCurrentTime(nextTime)
        }
        if (event.code === "Space" || event.code === "KeyK") {
          event.preventDefault()
          togglePlay()
        } else if (event.code === "ArrowRight") {
          event.preventDefault()
          seekBy(5)
        } else if (event.code === "ArrowLeft") {
          event.preventDefault()
          seekBy(-5)
        } else if (event.code === "ArrowUp") {
          event.preventDefault()
          setPlayerVolume(instance.getVolume() + 5)
        } else if (event.code === "ArrowDown") {
          event.preventDefault()
          setPlayerVolume(instance.getVolume() - 5)
        } else if (event.code === "KeyM") {
          event.preventDefault()
          toggleMute()
        } else if (event.code === "KeyF") {
          event.preventDefault()
          toggleFullscreen()
        } else if (event.code === "Home") {
          event.preventDefault()
          instance.seekTo(0, true)
          setCurrentTime(0)
        } else if (event.code === "End") {
          event.preventDefault()
          instance.seekTo(instance.getDuration(), true)
          setCurrentTime(instance.getDuration())
        }
      } catch {}
    }
    window.addEventListener("keydown", handleKeydown)
    return () => window.removeEventListener("keydown", handleKeydown)
  }, [ready, useNativeFallback])

  // Initial Play Poster
  if (!activated) {
    const posterSrc = posterError
      ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      : `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`

    return (
      <div
        className="group relative h-full w-full cursor-pointer overflow-hidden bg-[#101819] text-white select-none"
        tabIndex={0}
        role="button"
        aria-label={`${tr("Play video", "تشغيل الفيديو")}: ${title}`}
        onClick={() => setActivated(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setActivated(true)
          }
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterSrc}
          onError={() => setPosterError(true)}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-85 group-hover:opacity-95"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="flex size-14 min-[420px]:size-16 sm:size-20 items-center justify-center rounded-full bg-[#1e515d]/90 text-white shadow-2xl backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-[#8BCDE1] group-hover:text-black">
            <Play className="ms-1 size-6 min-[420px]:size-7 sm:size-9 fill-current" />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none">
          <p className="text-xs sm:text-base font-semibold text-white drop-shadow line-clamp-1">{title}</p>
          <span className="text-[11px] sm:text-xs text-white/70">
            {tr("Click to start lecture", "انقر لبدء تشغيل المحاضرة")}
          </span>
        </div>
      </div>
    )
  }

  // Native Embed Fallback Mode (Fail-Safe)
  if (useNativeFallback) {
    return (
      <div
        ref={shell}
        className="relative h-full w-full overflow-hidden bg-[#101819] text-white"
        aria-label={`${title}. Video player`}
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={title}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
        {/* Reconnect / Info bar */}
        <div className="absolute top-2 end-2 z-10 flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setUseNativeFallback(false)}
            className="flex items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white/90 hover:text-white border border-white/20 transition-colors"
            title={tr("Switch to Smart Player", "التبديل للمشغل المخصص")}
          >
            <RefreshCw className="size-3" />
            <span className="hidden sm:inline">{tr("Smart Player", "المشغل المخصص")}</span>
          </button>
        </div>
      </div>
    )
  }

  // Smart Interactive Player Mode
  return (
    <div
      ref={shell}
      className="group relative h-full w-full overflow-hidden bg-[#101819] text-white"
      tabIndex={0}
      aria-label={`${title}. Video player`}
      onClick={(event) => {
        event.currentTarget.focus()
        if (event.target === event.currentTarget) togglePlay()
      }}
    >
      <div ref={host} className="pointer-events-none h-full w-full" aria-label={title} />

      {unavailable ? (
        <div className="absolute inset-0 grid place-items-center bg-[#101819] p-6 text-center">
          <div className="max-w-sm space-y-3">
            <AlertCircle className="mx-auto size-10 text-[#8BCDE1]" />
            <p className="font-semibold text-sm sm:text-base">
              {tr("Video playback needs standard mode", "تشغيل الفيديو يتطلب المشغل القياسي")}
            </p>
            <p className="text-xs text-white/70">
              {tr(
                "Your browser or ad-blocker restricted custom overlay playback.",
                "تم تفعيل وضع التوافق لضمان استمرار المشاهدة بلا انقطاع."
              )}
            </p>
            <button
              type="button"
              onClick={() => setUseNativeFallback(true)}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#8BCDE1] px-4 py-2 text-xs font-bold text-black hover:bg-[#8BCDE1]/90 transition-colors"
            >
              <TvIcon className="size-4" />
              <span>{tr("Play in Standard YouTube Player", "تشغيل بالمشغل القياسي")}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {!ready && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#101819]">
              <div className="size-9 animate-spin rounded-full border-2 border-white/25 border-t-[#8BCDE1]" />
              <span className="sr-only">{tr("Loading video", "جارٍ تحميل الفيديو")}</span>
            </div>
          )}

          {/* Player Controls Bar */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-2.5 pb-2.5 pt-10 sm:px-4 sm:pb-4">
            {/* Touch-Friendly Scrub Bar */}
            <div className="relative flex items-center h-6 cursor-pointer group/scrub">
              <div className="relative h-1.5 w-full rounded-full bg-white/30 overflow-hidden transition-all group-hover/scrub:h-2">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white/35"
                  style={{ width: `${duration ? Math.min(100, (loaded / duration) * 100) : 0}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-[#8BCDE1]"
                  style={{ width: `${duration ? Math.min(100, (currentTime / duration) * 100) : 0}%` }}
                />
              </div>
              <input
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={currentTime}
                onChange={seek}
                disabled={!ready}
                aria-label="Video progress"
              />
            </div>

            {/* Controls Row */}
            <div className="mt-1 flex items-center justify-between gap-1.5 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Play/Pause Button */}
                <button
                  type="button"
                  className="grid size-9 min-h-[36px] min-w-[36px] place-items-center rounded-full transition-colors hover:bg-white/15 disabled:opacity-50"
                  onClick={togglePlay}
                  disabled={!ready}
                  aria-label={playing ? tr("Pause video", "إيقاف مؤقت") : tr("Play video", "تشغيل")}
                >
                  {playing ? <Pause className="size-4.5" /> : <Play className="ms-0.5 size-4.5" />}
                </button>

                {/* Time Display */}
                <span className="min-w-[68px] sm:min-w-[76px] text-[11px] sm:text-xs tabular-nums text-white/85 select-none">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                {/* Volume Button */}
                <button
                  type="button"
                  className="grid size-9 min-h-[36px] min-w-[36px] place-items-center rounded-full transition-colors hover:bg-white/15 disabled:opacity-50"
                  onClick={toggleMute}
                  disabled={!ready}
                  aria-label={muted || volume === 0 ? tr("Unmute video", "إلغاء الكتم") : tr("Mute video", "كتم الصوت")}
                >
                  {muted || volume === 0 ? <VolumeX className="size-4.5" /> : <Volume2 className="size-4.5" />}
                </button>

                {/* Desktop Volume Slider */}
                <input
                  className="hidden h-1.5 w-16 md:w-20 cursor-pointer accent-[#8BCDE1] sm:block"
                  type="range"
                  min="0"
                  max="100"
                  value={muted ? 0 : volume}
                  onChange={changeVolume}
                  disabled={!ready}
                  aria-label="Volume"
                />
              </div>

              {/* Right Side Settings */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                {/* Quality Label */}
                <span
                  className="hidden rounded bg-white/15 px-2 py-1 text-[11px] font-semibold text-white/85 md:inline"
                  title="YouTube automatically selects the optimal stream bitrate"
                >
                  {qualityLabel(quality)}
                </span>

                {/* Playback Rate */}
                <label className="sr-only" htmlFor={`playback-rate-${videoId}`}>
                  Playback speed
                </label>
                <select
                  id={`playback-rate-${videoId}`}
                  value={rate}
                  onChange={changeRate}
                  disabled={!ready}
                  className="h-7 sm:h-8 rounded-md border border-white/20 bg-black/40 px-1 sm:px-1.5 text-[11px] sm:text-xs font-semibold text-white outline-none focus:ring-1 focus:ring-[#8BCDE1] disabled:opacity-50"
                >
                  {rates.map((option) => (
                    <option key={option} value={option}>
                      {option}×
                    </option>
                  ))}
                </select>

                {/* Switch to Standard Player */}
                <button
                  type="button"
                  onClick={() => setUseNativeFallback(true)}
                  className="hidden min-[480px]:grid size-8 sm:size-9 place-items-center rounded-full transition-colors hover:bg-white/15 text-white/80 hover:text-white"
                  title={tr("Switch to Standard YouTube Embed", "التبديل إلى المشغل القياسي")}
                  aria-label={tr("Standard player", "المشغل القياسي")}
                >
                  <TvIcon className="size-4" />
                </button>

                {/* Fullscreen Button */}
                <button
                  type="button"
                  className="grid size-9 min-h-[36px] min-w-[36px] place-items-center rounded-full transition-colors hover:bg-white/15"
                  onClick={toggleFullscreen}
                  aria-label={fullscreen ? tr("Exit fullscreen", "تصغير") : tr("Enter fullscreen", "ملء الشاشة")}
                >
                  {fullscreen ? <Minimize className="size-4.5" /> : <Maximize className="size-4.5" />}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
