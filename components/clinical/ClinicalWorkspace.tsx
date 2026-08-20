"use client"

import React, { useState } from "react"
import { useRouter } from "next/router"
import {
  FiActivity as Activity,
  FiAlertCircle as AlertCircle,
  FiAlertTriangle as AlertTriangle,
  FiClock as Clock,
  FiCpu as Cpu,
  FiRefreshCw as RefreshCw,
  FiSend as Send,
  FiShield as Shield,
  FiTrash2 as Trash2,
  FiUser as User,
  FiZap as Zap,
  FiBookOpen as BookOpen,
} from "react-icons/fi"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  calculateCockcroftGaultCrCl,
  calculatePediatricDose,
  checkDrugInteractions,
  NARROW_THERAPEUTIC_DRUGS,
  QUICK_PROMPTS,
  type CockcroftGaultResult,
  type PediatricDoseResult,
  type DDIResult,
} from "@/lib/clinicalCalculators"

interface ClinicalWorkspaceProps {
  lectureId?: string
  lectureTitle?: string
  objectives?: string[]
  currentTimestamp?: number
  defaultTab?: "consult" | "renal" | "pediatric" | "ddi"
  onClose?: () => void
}

interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  text: string
  timestamp: string
  data?: unknown
}

export default function ClinicalWorkspace({
  lectureId,
  lectureTitle,
  objectives = [],
  currentTimestamp = 0,
  defaultTab = "consult",
}: ClinicalWorkspaceProps) {
  const { locale } = useRouter()
  const isAr = locale === "ar"

  // Active Tab state
  const [activeTab, setActiveTab] = useState<string>(defaultTab)

  // ─── TAB 1: CONSULT / LECTURE Q&A STATE ───────────────────────────────────
  const [promptInput, setPromptInput] = useState("")
  const [isConsulting, setIsConsulting] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: isAr
        ? `مرحبًا بك في المساعد السريري الذكي لعلم الأدوية. ${
            lectureTitle ? `أنا على دراية بمحتوى محاضرة "${lectureTitle}".` : ""
          } يمكنك الاستفسار عن آليات العمل الدوائي، موانع الاستعمال، التعديلات الكلوية، أو الحسابات الجرعية.`
        : `Welcome to the AI Clinical Pharmacology Assistant. ${
            lectureTitle ? `I'm synced with "${lectureTitle}".` : ""
          } Ask any clinical pharmacology question, check dosing in organ impairment, or use the calculators above.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ])

  // ─── TAB 2: RENAL CRCL CALCULATOR STATE ──────────────────────────────────
  const [renalAge, setRenalAge] = useState<number>(65)
  const [renalWeight, setRenalWeight] = useState<number>(70)
  const [renalScr, setRenalScr] = useState<number>(1.2)
  const [renalGender, setRenalGender] = useState<"male" | "female">("male")
  const [renalDrug, setRenalDrug] = useState<string>("vancomycin")
  const [renalResult, setRenalResult] = useState<CockcroftGaultResult | null>(null)
  const [renalError, setRenalError] = useState<string | null>(null)

  // ─── TAB 3: PEDIATRIC DOSE CALCULATOR STATE ──────────────────────────────
  const [pedMethod, setPedMethod] = useState<"weight_based" | "clark" | "young">("weight_based")
  const [pedWeight, setPedWeight] = useState<number>(15)
  const [pedAge, setPedAge] = useState<number>(4)
  const [pedDosePerKg, setPedDosePerKg] = useState<number>(15)
  const [pedAdultDose, setPedAdultDose] = useState<number>(500)
  const [pedMaxAdultDose, setPedMaxAdultDose] = useState<number>(500)
  const [pedResult, setPedResult] = useState<PediatricDoseResult | null>(null)
  const [pedError, setPedError] = useState<string | null>(null)

  // ─── TAB 4: DDI INTERACTION CHECKER STATE ────────────────────────────────
  const [ddiDrugA, setDdiDrugA] = useState<string>("Simvastatin")
  const [ddiDrugB, setDdiDrugB] = useState<string>("Clarithromycin")
  const [ddiResult, setDdiResult] = useState<DDIResult | null>(null)
  const [ddiError, setDdiError] = useState<string | null>(null)

  // ─── HANDLERS ─────────────────────────────────────────────────────────────

  // Handle Consult / QA Submit
  const handleSendConsult = async (customPrompt?: string) => {
    const textToSend = customPrompt || promptInput
    if (!textToSend.trim() || isConsulting) return

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!customPrompt) setPromptInput("")
    setIsConsulting(true)

    try {
      const toolType = lectureTitle ? "lecture_qa" : "general_consult"
      const res = await fetch("/api/ai/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_type: toolType,
          prompt: textToSend,
          context: {
            lecture_id: lectureId,
            lecture_title: lectureTitle,
            objectives,
            current_timestamp_seconds: currentTimestamp,
          },
        }),
      })

      const data = await res.json()
      if (res.ok && data.clinical_guidance) {
        const assistantMsg: ChatMessage = {
          id: String(Date.now() + 1),
          role: "assistant",
          text: data.clinical_guidance,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          data: data.data,
        }
        setMessages((prev) => [...prev, assistantMsg])
      } else {
        throw new Error(data.error || "Failed to generate consultation response")
      }
    } catch {
      // Fallback deterministic guidance if offline or API error
      const fallbackMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: "assistant",
        text: isAr
          ? `استجابة سريرية مبنية على الدلائل الإرشادية لـ "${textToSend}": يُوصى بمراجعة ديناميكية الدواء، والجرعات الكلوية، ونسب الارتباط بالبروتينات لضمان السلامة السريرية.`
          : `Evidence-based clinical response for "${textToSend}": Verify pharmacokinetics, renal/hepatic clearance pathways, and therapeutic monitoring thresholds.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, fallbackMsg])
    } finally {
      setIsConsulting(false)
    }
  }

  // Handle Renal Calculation
  const handleCalculateRenal = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setRenalError(null)
    try {
      const res = calculateCockcroftGaultCrCl({
        age: Number(renalAge),
        weight_kg: Number(renalWeight),
        serum_creatinine_mg_dl: Number(renalScr),
        gender: renalGender,
        drug: renalDrug !== "none" ? renalDrug : undefined,
      })
      setRenalResult(res)
    } catch (err: unknown) {
      setRenalError(err instanceof Error ? err.message : "Error calculating CrCl")
      setRenalResult(null)
    }
  }

  // Handle Pediatric Calculation
  const handleCalculatePediatric = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setPedError(null)
    try {
      const res = calculatePediatricDose({
        method: pedMethod,
        weight_kg: Number(pedWeight),
        age_years: Number(pedAge),
        dose_per_kg: Number(pedDosePerKg),
        adult_dose: Number(pedAdultDose),
        max_adult_dose: Number(pedMaxAdultDose),
      })
      setPedResult(res)
    } catch (err: unknown) {
      setPedError(err instanceof Error ? err.message : "Error calculating pediatric dose")
      setPedResult(null)
    }
  }

  // Handle DDI Check
  const handleCheckDDI = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setDdiError(null)
    try {
      const res = checkDrugInteractions(ddiDrugA, ddiDrugB)
      setDdiResult(res)
    } catch (err: unknown) {
      setDdiError(err instanceof Error ? err.message : "Error checking drug interaction")
      setDdiResult(null)
    }
  }

  // Format timestamp helper (e.g. 125 -> 02:05)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* ─── LECTURE CONTEXT BANNER ────────────────────────────────────────── */}
      {lectureTitle && (
        <div className="border-b border-border/80 bg-primary/5 p-3.5 sm:p-4 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-8 grid place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <BookOpen className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate text-foreground">{lectureTitle}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{isAr ? "سياق المحاضرة النشط" : "Active Lecture Context"}</span>
                  {currentTimestamp > 0 && (
                    <Badge variant="outline" className="text-[10px] py-0 h-4 gap-1 px-1.5 font-mono">
                      <Clock className="size-2.5" />
                      <span>{formatTime(currentTimestamp)}</span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1 text-[10px] shrink-0 font-bold bg-primary/10 text-primary">
              <Cpu className="size-3" />
              <span>PharmaAI</span>
            </Badge>
          </div>

          {objectives.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {objectives.slice(0, 2).map((obj, i) => (
                <span
                  key={i}
                  className="inline-flex items-center text-[10px] rounded-md bg-background/80 px-2 py-0.5 border text-muted-foreground truncate max-w-xs"
                >
                  🎯 {obj}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TABS NAVIGATION ──────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <div className="border-b border-border/70 px-3 pt-2 bg-muted/40 shrink-0">
          <TabsList className="grid grid-cols-4 w-full h-9 bg-background/80 p-0.5 rounded-xl border">
            <TabsTrigger value="consult" className="text-[11px] font-bold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {isAr ? "الاستشارة" : "Consult"}
            </TabsTrigger>
            <TabsTrigger value="renal" className="text-[11px] font-bold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {isAr ? "الكلوي" : "Renal CrCl"}
            </TabsTrigger>
            <TabsTrigger value="pediatric" className="text-[11px] font-bold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {isAr ? "الأطفال" : "Pediatric"}
            </TabsTrigger>
            <TabsTrigger value="ddi" className="text-[11px] font-bold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {isAr ? "التفاعلات" : "DDI Checker"}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── TAB 1: CONSULT / Q&A ────────────────────────────────────────── */}
        <TabsContent value="consult" className="flex-1 flex flex-col min-h-0 m-0 p-0">
          {/* Quick Prompt Chips */}
          <div className="p-3 border-b border-border/60 bg-muted/20 shrink-0">
            <p className="text-[10px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
              {isAr ? "استفسارات سريرية سريعة" : "Quick Clinical Prompts"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp.id}
                  type="button"
                  onClick={() => handleSendConsult(isAr ? qp.prompt_ar : qp.prompt_en)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all rounded-full px-2.5 py-1 border shadow-2xs text-foreground/80"
                >
                  <Zap className="size-2.5 text-primary" />
                  <span>{isAr ? qp.label_ar : qp.label_en}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role !== "user" && (
                  <div className="size-7 grid place-items-center rounded-xl bg-primary text-primary-foreground shrink-0 shadow-xs mt-0.5">
                    <Cpu className="size-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-xs"
                      : "bg-muted/70 text-foreground border border-border/60 rounded-bl-xs"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span className={`block text-[9px] mt-1 ${msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {msg.timestamp}
                  </span>
                </div>
                {msg.role === "user" && (
                  <div className="size-7 grid place-items-center rounded-xl bg-muted text-muted-foreground shrink-0 mt-0.5">
                    <User className="size-3.5" />
                  </div>
                )}
              </div>
            ))}
            {isConsulting && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                <RefreshCw className="size-3.5 animate-spin text-primary" />
                <span>{isAr ? "جارٍ تحليل المعطيات السريرية..." : "Analyzing clinical evidence..."}</span>
              </div>
            )}
          </div>

          {/* Chat Input Box */}
          <div className="p-3 border-t border-border/70 bg-card shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendConsult()
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder={isAr ? "اطرح استفسارك السريري أو الدوائي..." : "Ask clinical question or dosing query..."}
                className="h-10 text-xs rounded-xl"
                disabled={isConsulting}
              />
              <Button
                type="submit"
                size="sm"
                disabled={isConsulting || !promptInput.trim()}
                className="h-10 px-4 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
              >
                <Send className="size-3.5" />
              </Button>
              {messages.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMessages(messages.slice(0, 1))}
                  className="h-10 w-10 p-0 rounded-xl text-muted-foreground hover:text-destructive shrink-0"
                  title={isAr ? "مسح المحادثة" : "Clear Chat"}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </form>
          </div>
        </TabsContent>

        {/* ─── TAB 2: RENAL CRCL CALCULATOR ─────────────────────────────────── */}
        <TabsContent value="renal" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-black flex items-center gap-1.5">
                    <Activity className="size-4 text-primary" />
                    <span>{isAr ? "حاسبة تصفية الكرياتينين (Cockcroft-Gault)" : "Cockcroft-Gault CrCl Calculator"}</span>
                  </CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    {isAr
                      ? "تقدير معدل الترشيح الكبيبي وتعديل جرعات الأدوية ذات النطاق العلاجي الضيق."
                      : "Estimate GFR for renal dose adjustments and narrow therapeutic index drugs."}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  CrCl (mL/min)
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-2">
              <form onSubmit={handleCalculateRenal} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">{isAr ? "العمر (سنة)" : "Age (years)"}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={130}
                      value={renalAge}
                      onChange={(e) => setRenalAge(Number(e.target.value))}
                      required
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">{isAr ? "الجنس" : "Gender"}</Label>
                    <div className="grid grid-cols-2 gap-1 h-9">
                      <Button
                        type="button"
                        size="sm"
                        variant={renalGender === "male" ? "default" : "outline"}
                        onClick={() => setRenalGender("male")}
                        className="rounded-lg text-xs h-full p-0 font-bold"
                      >
                        {isAr ? "ذكر" : "Male"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={renalGender === "female" ? "default" : "outline"}
                        onClick={() => setRenalGender("female")}
                        className="rounded-lg text-xs h-full p-0 font-bold"
                      >
                        {isAr ? "أنثى (×0.85)" : "Female"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">{isAr ? "الوزن (كجم)" : "Weight (kg)"}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={500}
                      step="0.5"
                      value={renalWeight}
                      onChange={(e) => setRenalWeight(Number(e.target.value))}
                      required
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">{isAr ? "كرياتينين المصل (mg/dL)" : "Serum Cr (mg/dL)"}</Label>
                    <Input
                      type="number"
                      min={0.1}
                      max={30}
                      step="0.05"
                      value={renalScr}
                      onChange={(e) => setRenalScr(Number(e.target.value))}
                      required
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">{isAr ? "الدواء المراد تعديل جرعته" : "Target Drug for Adjustment"}</Label>
                  <select
                    value={renalDrug}
                    onChange={(e) => setRenalDrug(e.target.value)}
                    className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="none">{isAr ? "-- بدون تحديد دواء معين --" : "-- General Evaluation --"}</option>
                    {NARROW_THERAPEUTIC_DRUGS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Button type="submit" className="w-full h-9 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5">
                  <Activity className="size-3.5" />
                  <span>{isAr ? "حساب التصفية الكلوية" : "Calculate Renal CrCl"}</span>
                </Button>
              </form>

              {renalError && (
                <Alert variant="destructive" className="mt-3 rounded-xl p-3">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-xs font-bold">{renalError}</AlertDescription>
                </Alert>
              )}

              {/* Renal Output Display */}
              {renalResult && (
                <div className="mt-4 space-y-3 pt-3 border-t border-border/60">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {isAr ? "معدل تصفية الكرياتينين" : "Estimated CrCl"}
                      </p>
                      <p className="text-2xl font-black text-primary">
                        {renalResult.crcl_ml_min} <span className="text-xs font-bold text-foreground/70">mL/min</span>
                      </p>
                    </div>
                    <Badge
                      className={`text-xs font-black py-1 px-3 rounded-full ${
                        renalResult.crcl_ml_min >= 60
                          ? "bg-emerald-600 text-white"
                          : renalResult.crcl_ml_min >= 30
                          ? "bg-amber-500 text-white"
                          : "bg-destructive text-destructive-foreground"
                      }`}
                    >
                      {renalResult.staging}
                    </Badge>
                  </div>

                  <div className="text-xs leading-relaxed text-muted-foreground p-3 rounded-xl bg-muted/50 border">
                    <p className="font-bold text-foreground mb-1">{isAr ? "التوجيه الإكلينيكي:" : "Clinical Interpretation:"}</p>
                    <p>{renalResult.interpretation}</p>
                  </div>

                  {renalResult.drug_adjustment && (
                    <Alert
                      className={`rounded-xl ${
                        renalResult.drug_adjustment.risk_level === "contraindicated"
                          ? "border-destructive/50 bg-destructive/10 text-destructive dark:text-red-300"
                          : renalResult.drug_adjustment.risk_level === "warning"
                          ? "border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-300"
                          : "border-primary/30 bg-primary/5 text-primary"
                      }`}
                    >
                      <Shield className="size-4" />
                      <AlertTitle className="text-xs font-black">
                        {renalResult.drug_adjustment.drug} {isAr ? "إرشادات الجرعة:" : "Dosing Guidance:"}
                      </AlertTitle>
                      <AlertDescription className="text-xs font-medium mt-1 leading-relaxed">
                        {renalResult.drug_adjustment.recommendation}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 3: PEDIATRIC DOSE CALCULATOR ─────────────────────────────── */}
        <TabsContent value="pediatric" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-black flex items-center gap-1.5">
                    <Shield className="size-4 text-primary" />
                    <span>{isAr ? "حاسبة جرعات طب الأطفال" : "Pediatric Dose Calculator"}</span>
                  </CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    {isAr ? "حساب الجرعات بالوزن أو قاعدة كلارك وقاعدة يونغ مع سقف الجرعة القصوى." : "Weight-based dosing, Clark's rule, and Young's rule with adult dose caps."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-2">
              <form onSubmit={handleCalculatePediatric} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">{isAr ? "طريقة الحساب" : "Calculation Method"}</Label>
                  <div className="grid grid-cols-3 gap-1 h-9">
                    <Button
                      type="button"
                      size="sm"
                      variant={pedMethod === "weight_based" ? "default" : "outline"}
                      onClick={() => setPedMethod("weight_based")}
                      className="rounded-lg text-[11px] h-full p-0 font-bold"
                    >
                      {isAr ? "بالوزن (mg/kg)" : "Weight-based"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={pedMethod === "clark" ? "default" : "outline"}
                      onClick={() => setPedMethod("clark")}
                      className="rounded-lg text-[11px] h-full p-0 font-bold"
                    >
                      {isAr ? "قاعدة كلارك" : "Clark's Rule"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={pedMethod === "young" ? "default" : "outline"}
                      onClick={() => setPedMethod("young")}
                      className="rounded-lg text-[11px] h-full p-0 font-bold"
                    >
                      {isAr ? "قاعدة يونغ" : "Young's Rule"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">{isAr ? "وزن الطفل (كجم)" : "Child Weight (kg)"}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={120}
                      step="0.5"
                      value={pedWeight}
                      onChange={(e) => setPedWeight(Number(e.target.value))}
                      required={pedMethod !== "young"}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">{isAr ? "عمر الطفل (سنوات)" : "Child Age (years)"}</Label>
                    <Input
                      type="number"
                      min={0.1}
                      max={18}
                      step="0.5"
                      value={pedAge}
                      onChange={(e) => setPedAge(Number(e.target.value))}
                      required={pedMethod === "young"}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>

                {pedMethod === "weight_based" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold">{isAr ? "الجرعة المقررة (mg/kg)" : "Target Dose (mg/kg)"}</Label>
                      <Input
                        type="number"
                        min={0.1}
                        max={500}
                        step="0.5"
                        value={pedDosePerKg}
                        onChange={(e) => setPedDosePerKg(Number(e.target.value))}
                        required
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold">{isAr ? "الحد الأقصى للبالغين (mg)" : "Adult Max Cap (mg)"}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={5000}
                        value={pedMaxAdultDose}
                        onChange={(e) => setPedMaxAdultDose(Number(e.target.value))}
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">{isAr ? "جرعة البالغين القياسية (mg)" : "Standard Adult Dose (mg)"}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={5000}
                      value={pedAdultDose}
                      onChange={(e) => setPedAdultDose(Number(e.target.value))}
                      required
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                )}

                <Button type="submit" className="w-full h-9 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5">
                  <Shield className="size-3.5" />
                  <span>{isAr ? "حساب جرعة الطفل" : "Calculate Pediatric Dose"}</span>
                </Button>
              </form>

              {pedError && (
                <Alert variant="destructive" className="mt-3 rounded-xl p-3">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-xs font-bold">{pedError}</AlertDescription>
                </Alert>
              )}

              {/* Pediatric Output Display */}
              {pedResult && (
                <div className="mt-4 space-y-3 pt-3 border-t border-border/60">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {isAr ? "الجرعة الموصى بها للطفل" : "Calculated Pediatric Dose"}
                      </p>
                      <p className="text-2xl font-black text-primary">
                        {pedResult.calculated_dose} <span className="text-xs font-bold text-foreground/70">{pedResult.unit}</span>
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs font-bold">
                      {pedResult.method}
                    </Badge>
                  </div>

                  {pedResult.capped_at_adult_max && (
                    <Alert className="rounded-xl border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="size-4" />
                      <AlertTitle className="text-xs font-black">{isAr ? "تنبيه الحد الأقصى:" : "Max Adult Cap Applied:"}</AlertTitle>
                      <AlertDescription className="text-xs font-medium">
                        {isAr
                          ? "تم تحديد الجرعة المحسوبة بجرعة البالغين القصوى لتجنب السمية الدوائية."
                          : "Calculated weight dose exceeded adult maximum; capped strictly at adult dose limit."}
                      </AlertDescription>
                    </Alert>
                  )}

                  <p className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-xl border">
                    📝 {pedResult.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 4: DDI INTERACTION CHECKER ───────────────────────────────── */}
        <TabsContent value="ddi" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-black flex items-center gap-1.5">
                    <AlertTriangle className="size-4 text-primary" />
                    <span>{isAr ? "فاحص التفاعلات الدوائية (DDI Checker)" : "Drug-Drug Interaction Checker"}</span>
                  </CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    {isAr ? "فحص التداخلات الدوائية الخطرة ومستويات الشدة والتوصيات العلاجية." : "Screen clinical pairs for contraindicated & high-risk pharmacodynamic interactions."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-2">
              <form onSubmit={handleCheckDDI} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">{isAr ? "الدواء الأول (Drug A)" : "Primary Drug A"}</Label>
                  <Input
                    value={ddiDrugA}
                    onChange={(e) => setDdiDrugA(e.target.value)}
                    placeholder="e.g. Simvastatin, Warfarin, Sildenafil"
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">{isAr ? "الدواء الثاني (Drug B)" : "Secondary Drug B"}</Label>
                  <Input
                    value={ddiDrugB}
                    onChange={(e) => setDdiDrugB(e.target.value)}
                    placeholder="e.g. Clarithromycin, Aspirin, Nitroglycerin"
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                {/* Quick curated pairs */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground">{isAr ? "أزواج شائعة للاختبار السريع:" : "Quick Test Pairs:"}</p>
                  <div className="flex flex-wrap gap-1">
                    {[
                      ["Simvastatin", "Clarithromycin"],
                      ["Sildenafil", "Nitroglycerin"],
                      ["Warfarin", "Aspirin"],
                      ["Lisinopril", "Spironolactone"],
                    ].map(([a, b], idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setDdiDrugA(a)
                          setDdiDrugB(b)
                        }}
                        className="text-[10px] rounded-lg bg-muted hover:bg-primary/10 hover:text-primary px-2 py-0.5 border"
                      >
                        {a} + {b}
                      </button>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full h-9 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5">
                  <AlertTriangle className="size-3.5" />
                  <span>{isAr ? "فحص التداخل الدوائي" : "Screen Interaction"}</span>
                </Button>
              </form>

              {ddiError && (
                <Alert variant="destructive" className="mt-3 rounded-xl p-3">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-xs font-bold">{ddiError}</AlertDescription>
                </Alert>
              )}

              {/* DDI Result Display */}
              {ddiResult && (
                <div className="mt-4 space-y-3 pt-3 border-t border-border/60">
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/40">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">
                        {ddiResult.drug_a} + {ddiResult.drug_b}
                      </p>
                      <p className="text-sm font-black text-foreground">
                        {ddiResult.interaction_detected ? (isAr ? "تم رصد تفاعل سريري" : "Interaction Detected") : (isAr ? "لا يوجد تفاعل خطير معروف" : "No Critical Interaction")}
                      </p>
                    </div>
                    <Badge
                      className={`text-xs font-black uppercase py-1 px-2.5 rounded-full ${
                        ddiResult.severity === "contraindicated"
                          ? "bg-destructive text-destructive-foreground animate-pulse"
                          : ddiResult.severity === "major"
                          ? "bg-amber-600 text-white"
                          : ddiResult.severity === "moderate"
                          ? "bg-yellow-500 text-black"
                          : "bg-emerald-600 text-white"
                      }`}
                    >
                      {ddiResult.severity}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive dark:text-red-300">
                      <p className="font-bold mb-0.5">{isAr ? "الآلية ومخاطر السلامة:" : "Risk Summary & Mechanism:"}</p>
                      <p className="leading-relaxed">{ddiResult.risk_summary}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary-foreground">
                      <p className="font-bold mb-0.5 text-primary">{isAr ? "التوصية الإكلينيكية:" : "Clinical Recommendation:"}</p>
                      <p className="text-foreground leading-relaxed">{ddiResult.clinical_recommendation}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
