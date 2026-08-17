import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { FiMaximize as Maximize, FiMinimize as Minimize, FiPause as Pause, FiPlay as Play, FiVolume2 as Volume2, FiVolumeX as VolumeX } from "react-icons/fi"
import { trackVideoEvent } from "@/lib/analytics"

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
  Player: new (element: HTMLElement, options: {
    videoId?: string
    playerVars?: Record<string, number | string>
    events: {
      onReady: (event: { target: YouTubePlayerInstance }) => void
      onStateChange: (event: { data: number }) => void
      onPlaybackQualityChange: (event: { data: string }) => void
      onPlaybackRateChange: (event: { data: number }) => void
      onError: () => void
    }
  }) => YouTubePlayerInstance
}

declare global {
  interface Window {
    YT?: YouTubeNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let youTubeApi: Promise<YouTubeNamespace> | undefined

function loadYouTubeApi() {
  if (youTubeApi) return youTubeApi
  youTubeApi = new Promise((resolve, reject) => {
    if (window.YT?.Player) { resolve(window.YT); return }
    const existingCallback = window.onYouTubeIframeAPIReady
    const script = document.createElement("script")
    script.src = "https://www.youtube.com/iframe_api"
    script.async = true
    script.onerror = () => reject(new Error("Could not load the YouTube player."))
    window.onYouTubeIframeAPIReady = () => { existingCallback?.(); resolve(window.YT!) }
    document.head.appendChild(script)
  })
  return youTubeApi
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0")
  return `${minutes}:${remainder}`
}

const qualityLabel = (quality: string) => ({
  auto: "Auto",
  small: "240p",
  medium: "360p",
  large: "480p",
  hd720: "720p",
  hd1080: "1080p",
  highres: "High res",
}[quality] ?? "Auto")

export default function YouTubePlayer({
  videoId,
  title,
  lectureId,
  lectureTitle,
}: {
  videoId: string
  title: string
  lectureId?: string
  lectureTitle?: string
}) {
  const host = useRef<HTMLDivElement>(null)
  const shell = useRef<HTMLDivElement>(null)
  const player = useRef<YouTubePlayerInstance | null>(null)
  const milestonesFired = useRef<{ [key: string]: boolean }>({ "25%": false, "50%": false, "75%": false, "100%": false })
  const hasStartedRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loaded, setLoaded] = useState(0)
  const [volume, setVolume] = useState(100)
  const [muted, setMuted] = useState(false)
  const [rate, setRate] = useState(1)
  const [rates, setRates] = useState([1])
  const [quality, setQuality] = useState("auto")
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    let disposed = false
    milestonesFired.current = { "25%": false, "50%": false, "75%": false, "100%": false }
    hasStartedRef.current = false
    setReady(false); setUnavailable(false); setPlaying(false); setCurrentTime(0); setDuration(0); setLoaded(0); setQuality("auto")
    void loadYouTubeApi().then((YT) => {
      if (disposed || !host.current) return
      const iframe = document.createElement("iframe")
      const query = new URLSearchParams({ enablejsapi: "1", controls: "0", disablekb: "1", fs: "0", iv_load_policy: "3", playsinline: "1", rel: "0", origin: window.location.origin })
      iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?${query}`
      iframe.title = title
      iframe.className = "h-full w-full"
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      iframe.allowFullscreen = true
      host.current.replaceChildren(iframe)
      player.current = new YT.Player(iframe, {
        events: {
          onReady: ({ target }) => {
            if (disposed) return
            player.current = target
            setDuration(target.getDuration())
            setVolume(target.getVolume())
            setMuted(target.isMuted())
            setRate(target.getPlaybackRate())
            setRates(target.getAvailablePlaybackRates())
            setReady(true)
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
                duration: player.current?.getDuration(),
              })
            } else if (isPaused) {
              trackVideoEvent({
                action: "paused",
                videoId,
                lectureId,
                lectureTitle: lectureTitle || title,
                currentTime: player.current?.getCurrentTime(),
                duration: player.current?.getDuration(),
              })
            } else if (isEnded) {
              trackVideoEvent({
                action: "completed",
                videoId,
                lectureId,
                lectureTitle: lectureTitle || title,
                duration: player.current?.getDuration(),
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
          onError: () => setUnavailable(true),
        },
      })
    }).catch(() => setUnavailable(true))
    return () => { disposed = true; player.current?.destroy(); player.current = null }
  }, [title, videoId, lectureId, lectureTitle])

  useEffect(() => {
    const updateFullscreen = () => setFullscreen(document.fullscreenElement === shell.current)
    document.addEventListener("fullscreenchange", updateFullscreen)
    return () => document.removeEventListener("fullscreenchange", updateFullscreen)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const instance = player.current
      if (!instance || !ready) return
      const current = instance.getCurrentTime()
      const total = instance.getDuration()
      setCurrentTime(current)
      setDuration(total)
      setLoaded(instance.getVideoLoadedFraction() * total)
      setVolume(instance.getVolume())
      setMuted(instance.isMuted())

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
    }, 400)
    return () => window.clearInterval(timer)
  }, [ready, videoId, lectureId, lectureTitle, title])

  const togglePlay = () => {
    if (!player.current) return
    if (player.current.getPlayerState() === 1) player.current.pauseVideo()
    else player.current.playVideo()
  }
  const seek = (event: ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(event.target.value)
    player.current?.seekTo(nextTime, true)
    trackVideoEvent({
      action: "seeked",
      videoId,
      lectureId,
      lectureTitle: lectureTitle || title,
      currentTime: nextTime,
      duration: player.current?.getDuration(),
    })
  }

  const changeVolume = (event: ChangeEvent<HTMLInputElement>) => setPlayerVolume(Number(event.target.value))
  const toggleMute = () => {
    if (!player.current) return
    if (player.current.isMuted()) player.current.unMute()
    else player.current.mute()
    setMuted(player.current.isMuted())
  }
  const setPlayerVolume = (nextVolume: number) => {
    const normalized = Math.max(0, Math.min(100, nextVolume))
    player.current?.setVolume(normalized)
    if (normalized > 0) player.current?.unMute()
    else player.current?.mute()
    setVolume(normalized); setMuted(normalized === 0)
  }
  const changeRate = (event: ChangeEvent<HTMLSelectElement>) => player.current?.setPlaybackRate(Number(event.target.value))
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void shell.current?.requestFullscreen?.()
  }

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target
      if (!ready || !shell.current?.contains(document.activeElement) || target instanceof HTMLInputElement || target instanceof HTMLSelectElement) return
      if (target instanceof HTMLButtonElement && (event.code === "Space" || event.code === "Enter")) return
      const instance = player.current
      if (!instance) return
      const seekBy = (seconds: number) => {
        const nextTime = Math.max(0, Math.min(instance.getDuration(), instance.getCurrentTime() + seconds))
        instance.seekTo(nextTime, true); setCurrentTime(nextTime)
      }
      if (event.code === "Space" || event.code === "KeyK") { event.preventDefault(); togglePlay() }
      else if (event.code === "ArrowRight") { event.preventDefault(); seekBy(5) }
      else if (event.code === "ArrowLeft") { event.preventDefault(); seekBy(-5) }
      else if (event.code === "ArrowUp") { event.preventDefault(); setPlayerVolume(instance.getVolume() + 5) }
      else if (event.code === "ArrowDown") { event.preventDefault(); setPlayerVolume(instance.getVolume() - 5) }
      else if (event.code === "KeyM") { event.preventDefault(); toggleMute() }
      else if (event.code === "KeyF") { event.preventDefault(); toggleFullscreen() }
      else if (event.code === "Home") { event.preventDefault(); instance.seekTo(0, true); setCurrentTime(0) }
      else if (event.code === "End") { event.preventDefault(); instance.seekTo(instance.getDuration(), true); setCurrentTime(instance.getDuration()) }
    }
    window.addEventListener("keydown", handleKeydown)
    return () => window.removeEventListener("keydown", handleKeydown)
  }, [ready])

  return (
    <div ref={shell} className="group relative h-full w-full overflow-hidden bg-[#101819] text-white" tabIndex={0} aria-label={`${title}. Video player`} onClick={(event) => { event.currentTarget.focus(); if (event.target === event.currentTarget) togglePlay() }}>
      <div ref={host} className="pointer-events-none h-full w-full" aria-label={title} />
      {unavailable ? <div className="absolute inset-0 grid place-items-center bg-[#101819] p-6 text-center"><div><p className="font-semibold">This video cannot be played here.</p><p className="mt-2 text-sm text-white/70">Its YouTube embed settings may not allow playback.</p></div></div> : <>
        {!ready && <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#101819]"><div className="size-9 animate-spin rounded-full border-2 border-white/25 border-t-[#8BCDE1]" /><span className="sr-only">Loading video</span></div>}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pb-3 pt-14 sm:px-4 sm:pb-4">
          <div className="relative h-1.5 rounded-full bg-white/30">
            <div className="absolute inset-y-0 left-0 rounded-full bg-white/35" style={{ width: `${duration ? Math.min(100, loaded / duration * 100) : 0}%` }} />
            <input className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent accent-[#8BCDE1]" type="range" min="0" max={duration || 0} step="0.1" value={currentTime} onChange={seek} disabled={!ready} aria-label="Video progress" />
          </div>
          <div className="mt-3 flex items-center gap-2 sm:gap-3">
            <button type="button" className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/15 disabled:opacity-50" onClick={togglePlay} disabled={!ready} aria-label={playing ? "Pause video" : "Play video"}>{playing ? <Pause className="size-5" /> : <Play className="ms-0.5 size-5" />}</button>
            <span className="min-w-[74px] text-xs tabular-nums text-white/85">{formatTime(currentTime)} / {formatTime(duration)}</span>
            <button type="button" className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/15 disabled:opacity-50" onClick={toggleMute} disabled={!ready} aria-label={muted || volume === 0 ? "Unmute video" : "Mute video"}>{muted || volume === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}</button>
            <input className="hidden h-1.5 w-20 cursor-pointer accent-[#8BCDE1] sm:block" type="range" min="0" max="100" value={muted ? 0 : volume} onChange={changeVolume} disabled={!ready} aria-label="Volume" />
            <div className="ms-auto flex items-center gap-1.5">
              <span className="hidden rounded bg-white/15 px-2 py-1 text-[11px] font-semibold text-white/85 sm:inline" title="YouTube chooses the best available resolution automatically">{qualityLabel(quality)}</span>
              <label className="sr-only" htmlFor={`playback-rate-${videoId}`}>Playback speed</label>
              <select id={`playback-rate-${videoId}`} value={rate} onChange={changeRate} disabled={!ready} className="h-8 rounded-md border border-white/20 bg-black/30 px-1.5 text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-[#8BCDE1] disabled:opacity-50">
                {rates.map((option) => <option key={option} value={option}>{option}×</option>)}
              </select>
              <button type="button" className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/15" onClick={toggleFullscreen} aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}>{fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}</button>
            </div>
          </div>
        </div>
      </>}
    </div>
  )
}
