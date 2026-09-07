import { useEffect, useRef, useState } from "react"
import {
  FiDownload as Download,
  FiHeadphones as Headphones,
  FiPause as Pause,
  FiPlay as Play,
  FiRotateCcw as RotateCcw,
  FiRotateCw as RotateCw,
  FiVolume2 as Volume2,
  FiVolumeX as VolumeX,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface CustomAudioPlayerProps {
  url: string
  title: string
  durationSeconds?: number
  isAr?: boolean
  className?: string
  showDownloadButton?: boolean
}

export default function CustomAudioPlayer({
  url,
  title,
  durationSeconds,
  isAr = false,
  className = "",
  showDownloadButton = true,
}: CustomAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(durationSeconds || 0)
  const [playbackRate, setPlaybackRate] = useState<number>(1)
  const [isMuted, setIsMuted] = useState(false)

  const tr = (en: string, ar: string) => (isAr ? ar : en)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration)
      }
    }
    const handleEnded = () => setIsPlaying(false)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
    }
  }, [url])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => {})
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds))
    }
  }

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 1.75, 2]
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length
    const nextSpeed = speeds[nextIdx]
    setPlaybackRate(nextSpeed)
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00"
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = url
    a.download = title.replace(/[\\/:*?"<>|]/g, "_") + ".mp3"
    a.target = "_blank"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div
      className={`rounded-2xl border bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-primary/40 ${className}`}
      dir={isAr ? "rtl" : "ltr"}
    >
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Title & Info Bar */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
            <Headphones className="size-4" />
          </span>
          <div className="min-w-0">
            <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">{title}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-mono font-medium text-muted-foreground">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              {playbackRate !== 1 && (
                <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 h-4">
                  {playbackRate}x
                </Badge>
              )}
            </div>
          </div>
        </div>

        {showDownloadButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-8 px-2.5 text-xs font-semibold gap-1.5 shrink-0 shadow-xs"
            title={tr("Download Voice Record", "تحميل التسجيل الصوتي")}
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">{tr("Download", "تحميل")}</span>
          </Button>
        )}
      </div>

      {/* Progress Track */}
      <div className="relative w-full my-2 flex items-center">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-muted accent-primary transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={tr("Audio progress bar", "شريط تقدم الصوت")}
        />
      </div>

      {/* Playback Controls Toolbar */}
      <div className="flex items-center justify-between pt-1">
        {/* Play/Pause & Skips */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="default"
            size="icon"
            onClick={togglePlay}
            className="size-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs shrink-0"
            aria-label={isPlaying ? tr("Pause", "إيقاف مؤقت") : tr("Play", "تشغيل")}
          >
            {isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current ms-0.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSkip(-10)}
            className="size-8 text-muted-foreground hover:text-foreground shrink-0"
            title={tr("Rewind 10 seconds", "ترجيع 10 ثوانٍ")}
          >
            <RotateCcw className="size-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSkip(10)}
            className="size-8 text-muted-foreground hover:text-foreground shrink-0"
            title={tr("Forward 10 seconds", "تقديم 10 ثوانٍ")}
          >
            <RotateCw className="size-3.5" />
          </Button>
        </div>

        {/* Speed & Volume Tools */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={cycleSpeed}
            className="h-7 px-2 text-xs font-mono font-bold text-muted-foreground hover:text-foreground"
            title={tr("Playback speed", "سرعة التشغيل")}
          >
            {playbackRate}x
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="size-7 text-muted-foreground hover:text-foreground"
            title={isMuted ? tr("Unmute", "إلغاء الكتم") : tr("Mute", "كتم الصوت")}
          >
            {isMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
