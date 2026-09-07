import { useEffect, useRef, useState } from "react"
import {
  FiAlertTriangle as AlertTriangle,
  FiCheck as Check,
  FiMic as Mic,
  FiPause as Pause,
  FiPlay as Play,
  FiRotateCcw as RotateCcw,
  FiSquare as Square,
  FiUploadCloud as UploadCloud,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { uploadFiles } from "@/lib/uploadthing"
import { supabase } from "@/lib/supabaseClient"

interface VoiceRecorderProps {
  onRecordingComplete: (url: string, durationSeconds: number) => void
  isAr?: boolean
  className?: string
}

export default function VoiceRecorder({
  onRecordingComplete,
  isAr = false,
  className = "",
}: VoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "paused" | "recorded">("idle")
  const [timer, setTimer] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPlayingPreview, setIsPlayingPreview] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  const tr = (en: string, ar: string) => (isAr ? ar : en)

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
    }
  }, [audioUrl])

  const startRecording = async () => {
    setErrorMessage(null)
    audioChunksRef.current = []

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage(tr("Microphone access is not supported in this browser.", "التسجيل الصوتي غير مدعوم في هذا المتصفح."))
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : "audio/webm"

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(audioChunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(recordedBlob)
        setAudioBlob(recordedBlob)
        setAudioUrl(url)
        setRecordingState("recorded")
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start(250)
      setRecordingState("recording")
      setTimer(0)

      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes("Permission") || msg.includes("NotAllowedError")) {
        setErrorMessage(
          tr(
            "Microphone permission denied. Please allow microphone access in your browser settings.",
            "تم رفض الإذن باستخدام الميكروفون. يرجى تفعيل إذن الميكروفون في إعدادات المتصفح."
          )
        )
      } else {
        setErrorMessage(tr("Could not start recording: ", "تعذر بدء التسجيل: ") + msg)
      }
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause()
      setRecordingState("paused")
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume()
      setRecordingState("recording")
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }

  const resetRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setRecordingState("idle")
    setTimer(0)
    setAudioUrl(null)
    setAudioBlob(null)
    setErrorMessage(null)
    setIsPlayingPreview(false)
  }

  const handleUploadAndSave = async () => {
    if (!audioBlob) return
    setUploading(true)
    setErrorMessage(null)

    try {
      const extension = audioBlob.type.includes("ogg") ? "ogg" : "webm"
      const file = new File([audioBlob], `voice-record-${Date.now()}.${extension}`, {
        type: audioBlob.type,
      })

      let token = ""
      if (supabase) {
        const { data } = await supabase.auth.getSession()
        token = data.session?.access_token || ""
      }

      const res = await uploadFiles("lectureAudio", {
        files: [file],
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        onUploadProgress: (p) => {
          setUploadProgress(typeof p === "number" ? p : p.progress)
        },
      })

      if (res && res[0] && res[0].url) {
        onRecordingComplete(res[0].url, timer)
      } else {
        throw new Error(tr("Failed to upload audio to storage", "فشل رفع التسجيل إلى مساحة التخزين"))
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMessage(msg)
    } finally {
      setUploading(false)
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return
    if (isPlayingPreview) {
      previewAudioRef.current.pause()
      setIsPlayingPreview(false)
    } else {
      previewAudioRef.current.play().catch(() => {})
      setIsPlayingPreview(true)
    }
  }

  return (
    <div className={`rounded-2xl border bg-card p-5 shadow-xs space-y-4 ${className}`} dir={isAr ? "rtl" : "ltr"}>
      {audioUrl && (
        <audio
          ref={previewAudioRef}
          src={audioUrl}
          onEnded={() => setIsPlayingPreview(false)}
          className="hidden"
        />
      )}

      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`grid size-9 place-items-center rounded-xl transition-colors ${
              recordingState === "recording"
                ? "bg-red-500 text-white animate-pulse"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
            }`}
          >
            <Mic className="size-4" />
          </span>
          <div>
            <h4 className="font-bold text-sm text-foreground">{tr("Live Voice Recorder", "مسجل الصوت المباشر")}</h4>
            <p className="text-[11px] text-muted-foreground">
              {tr("Record direct lecture voice notes with instant cloud upload.", "سجل ملحوظات وشروحات صوتية للمحاضرة فورًا من المتصفح.")}
            </p>
          </div>
        </div>

        {/* State Badge */}
        {recordingState === "recording" && (
          <Badge variant="destructive" className="animate-pulse gap-1 font-mono font-bold text-xs">
            <span className="size-2 rounded-full bg-white animate-ping" />
            <span>{tr("REC", "تسجيل")} {formatTime(timer)}</span>
          </Badge>
        )}
        {recordingState === "paused" && (
          <Badge variant="secondary" className="gap-1 font-mono font-bold text-xs bg-amber-500/10 text-amber-600 border border-amber-500/30">
            <Pause className="size-2.5" />
            <span>{tr("PAUSED", "مؤقت")} {formatTime(timer)}</span>
          </Badge>
        )}
        {recordingState === "recorded" && (
          <Badge variant="outline" className="gap-1 font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
            <Check className="size-2.5" />
            <span>{formatTime(timer)}</span>
          </Badge>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive flex items-start gap-2">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {recordingState === "idle" && (
          <Button
            type="button"
            onClick={startRecording}
            className="gap-2 bg-red-600 hover:bg-red-700 text-white font-bold h-10 px-5 rounded-xl shadow-xs"
          >
            <Mic className="size-4" />
            <span>{tr("Start Voice Recording", "بدء التسجيل الصوتي")}</span>
          </Button>
        )}

        {(recordingState === "recording" || recordingState === "paused") && (
          <div className="flex items-center gap-2">
            {recordingState === "recording" ? (
              <Button
                type="button"
                variant="outline"
                onClick={pauseRecording}
                className="gap-1.5 h-9 font-semibold text-xs"
              >
                <Pause className="size-3.5" />
                <span>{tr("Pause", "إيقاف مؤقت")}</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={resumeRecording}
                className="gap-1.5 h-9 font-semibold text-xs text-red-600 border-red-500/30"
              >
                <Play className="size-3.5 fill-current" />
                <span>{tr("Resume", "استئناف")}</span>
              </Button>
            )}

            <Button
              type="button"
              onClick={stopRecording}
              className="gap-1.5 bg-foreground text-background hover:bg-foreground/90 font-bold h-9 text-xs"
            >
              <Square className="size-3.5 fill-current" />
              <span>{tr("Finish Recording", "إنهاء التسجيل")}</span>
            </Button>
          </div>
        )}

        {recordingState === "recorded" && (
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={togglePreviewPlay}
              className="gap-1.5 h-9 text-xs font-semibold"
            >
              {isPlayingPreview ? <Pause className="size-3.5" /> : <Play className="size-3.5 fill-current" />}
              <span>{isPlayingPreview ? tr("Pause Preview", "إيقاف المعاينة") : tr("Play Preview", "سماع المعاينة")}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={resetRecording}
              disabled={uploading}
              className="gap-1.5 h-9 text-xs text-muted-foreground hover:text-destructive"
            >
              <RotateCcw className="size-3.5" />
              <span>{tr("Discard & Retake", "إلغاء وإعادة التسجيل")}</span>
            </Button>

            <Button
              type="button"
              onClick={handleUploadAndSave}
              disabled={uploading}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs ms-auto shadow-xs"
            >
              <UploadCloud className="size-4" />
              <span>{uploading ? tr(`Uploading (${uploadProgress}%)...`, `جارٍ الرفع (${uploadProgress}٪)...`) : tr("Save & Use Recording", "حفظ واعتماد التسجيل")}</span>
            </Button>
          </div>
        )}
      </div>

      {uploading && (
        <div className="space-y-1 pt-1">
          <Progress value={uploadProgress} className="h-1.5" />
          <p className="text-[11px] text-muted-foreground text-center font-mono">
            {tr("Uploading audio recording to cloud storage...", "جارٍ معالجة ورفع الملف الصوتي إلى السحابة...")}
          </p>
        </div>
      )}
    </div>
  )
}
