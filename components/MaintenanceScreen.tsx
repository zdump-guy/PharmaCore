import React, { useState } from "react"
import { useRouter } from "next/router"
import {
  FiClock as Clock,
  FiGlobe as Languages,
  FiMoon as Moon,
  FiRefreshCw as RefreshCw,
  FiSun as Sun,
} from "react-icons/fi"
import { HiSparkles as Sparkles } from "react-icons/hi2"
import { FaGraduationCap as GraduationCap } from "react-icons/fa6"
import BrandMark from "@/components/BrandMark"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/ThemeProvider"
import type { MaintenanceModeConfig } from "@/lib/siteContent"

interface MaintenanceScreenProps {
  config?: MaintenanceModeConfig
}

const pharmacyFacts = [
  {
    en: "Clinical Insight: Grapefruit juice inhibits CYP3A4 enzymes, significantly increasing the bioavailability of calcium channel blockers and statins.",
    ar: "فائدة إكلينيكية: يثبط عصير الجريب فروت إنزيمات CYP3A4 في الكبد، مما يزيد تركيز حاصرات قنوات الكالسيوم ومثبطات الكوليسترول.",
  },
  {
    en: "Pharmacology Fact: Nitroglycerin relieves angina through enzymatic conversion to nitric oxide, causing potent systemic vasodilation.",
    ar: "معلومة دوائية: يعمل النيتروجليسرين على توسيع الأوعية وتخفيف الذبحة الصدرية عبر تحوله داخل الخلايا إلى أكسيد النيتريك (NO).",
  },
  {
    en: "Therapeutic Pearl: Therapeutic Drug Monitoring (TDM) is essential for Vancomycin and Aminoglycosides to balance efficacy and prevent nephrotoxicity.",
    ar: "قاعدة علاجية: مراقبة التركيز الدوائي (TDM) أمر أساسي مع الفانكومايسين والأمينوجليكوزيدات لتجنب السمية الكلوية والسمعية.",
  },
  {
    en: "Biopharmaceutics: Zero-order kinetics occurs when the rate of drug elimination remains constant regardless of the plasma concentration.",
    ar: "حركية الدواء: حركية الرتبة الصفرية (Zero-order) تعني أن معدل التخلص من الدواء ثابت في وحدة الزمن بغض النظر عن تركيزه في الدم.",
  },
]

export default function MaintenanceScreen({ config }: MaintenanceScreenProps) {
  const router = useRouter()
  const { locale, pathname, asPath, query } = router
  const { theme, toggleTheme } = useTheme()
  const isAr = locale === "ar"

  const [checking, setChecking] = useState(false)
  const [showFact, setShowFact] = useState(false)
  const [factIndex, setFactIndex] = useState(0)

  // Title and message resolution
  const title =
    (isAr ? config?.title_ar : config?.title_en) ||
    (isAr ? "الموقع مغلق للصيانة والتحديث" : "Closed for maintenance")

  const message =
    (isAr ? config?.message_ar : config?.message_en) ||
    (isAr
      ? "نقوم حالياً بنشر تحديثات وترقيات جديدة للمنصة، وستكون متاحة في أقرب وقت ممكن."
      : "We are deploying new changes to the module, it will be available as soon as possible.")

  // Handle status check refresh
  const handleCheckStatus = () => {
    setChecking(true)
    setTimeout(() => {
      window.location.reload()
    }, 600)
  }

  // Switch locale
  const switchLocale = () => {
    const nextLocale = isAr ? "en" : "ar"
    router.push({ pathname, query }, asPath, { locale: nextLocale })
  }

  const handleNextFact = () => {
    setFactIndex((prev) => (prev + 1) % pharmacyFacts.length)
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-between bg-[#f8fafc] dark:bg-[#071317] text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors duration-300"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* ─── Top Header Bar ──────────────────────────────────────────────── */}
      <header className="p-4 sm:p-6 flex items-center justify-between max-w-6xl mx-auto w-full z-20">
        <div className="flex items-center gap-2.5">
          <BrandMark className="size-8 text-[#0f766e] dark:text-[#2dd4bf]" />
          <div className="leading-tight">
            <span className="text-base font-black tracking-tight block text-slate-900 dark:text-white">
              Pharma<span className="text-[#0f766e] dark:text-[#2dd4bf]">Core</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={switchLocale}
            className="h-9 px-3.5 rounded-full gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800"
            title={isAr ? "Switch to English" : "التحويل للعربية"}
          >
            <Languages className="size-3.5 text-[#0f766e] dark:text-[#2dd4bf]" />
            <span>{isAr ? "English" : "العربية"}</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="size-9 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800"
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}
          >
            {theme === "dark" ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-[#0f766e]" />}
          </Button>
        </div>
      </header>

      {/* ─── Main Content Canvas ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 z-10 max-w-4xl mx-auto w-full text-center">
        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4 sm:mb-6">
          {title}
        </h1>

        {/* ─── Static High-Contrast & Perfectly Aligned Vector Illustration ── */}
        <div className="w-full max-w-[640px] my-2 select-none relative">
          <svg
            viewBox="0 0 800 460"
            className="w-full h-auto drop-shadow-sm overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Vibrant Screen Gradients */}
              <linearGradient id="screenBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="40%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <linearGradient id="screenBlueDark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0891b2" />
                <stop offset="100%" stopColor="#0e7490" />
              </linearGradient>

              {/* High-Contrast Teal Stripes for Barricade */}
              <pattern id="barrierStripesPattern" width="24" height="24" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="24" stroke="#0f766e" strokeWidth="12" />
                <line x1="12" y1="0" x2="12" y2="24" stroke="#ffffff" strokeWidth="12" />
              </pattern>

              {/* High-Contrast Cone Stripes */}
              <pattern id="coneStripesPattern" width="16" height="16" patternTransform="rotate(0 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="16" y2="0" stroke="#0f766e" strokeWidth="8" />
                <line x1="0" y1="8" x2="16" y2="8" stroke="#ffffff" strokeWidth="8" />
              </pattern>

              {/* Card Drop Shadow */}
              <filter id="crispCardShadow" x="-10%" y="-10%" width="130%" height="130%">
                <feDropShadow dx="0" dy="6" stdDeviation="5" floodOpacity="0.22" floodColor="#0f172a" />
              </filter>
            </defs>

            {/* Background Molecular Chemistry & Tech Elements */}
            <g className="stroke-slate-400 dark:stroke-slate-600 fill-slate-300 dark:fill-slate-700 opacity-60">
              <line x1="180" y1="120" x2="230" y2="120" strokeWidth="2" strokeDasharray="3 3" />
              <line x1="280" y1="90" x2="340" y2="90" strokeWidth="2" />
              <line x1="240" y1="160" x2="300" y2="160" strokeWidth="2" />
              <line x1="690" y1="210" x2="730" y2="250" strokeWidth="2" />
              <circle cx="160" cy="220" r="7" />
              <circle cx="210" cy="280" r="4.5" />
              <circle cx="710" cy="180" r="4" />
              <circle cx="735" cy="205" r="4.5" />
              <circle cx="730" cy="250" r="6" fill="#0f766e" className="dark:fill-[#2dd4bf]" />
            </g>

            {/* ─── 1. ROADBLOCK BARRIER (LEFT) ─────────────────────────── */}
            <g id="roadblock-barrier">
              {/* Barrier Legs (Resting on baseline Y = 370) */}
              <rect
                x="115"
                y="318"
                width="12"
                height="52"
                rx="2"
                className="fill-slate-700 dark:fill-slate-600 stroke-slate-900 dark:stroke-slate-200"
                strokeWidth="3"
              />
              <rect
                x="185"
                y="318"
                width="12"
                height="52"
                rx="2"
                className="fill-slate-700 dark:fill-slate-600 stroke-slate-900 dark:stroke-slate-200"
                strokeWidth="3"
              />
              {/* Barrier Top Board with Bold Stripes */}
              <rect
                x="100"
                y="270"
                width="112"
                height="52"
                rx="6"
                fill="url(#barrierStripesPattern)"
                className="stroke-slate-900 dark:stroke-slate-200"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
            </g>

            {/* ─── 2. CENTER WORKSTATION COMPUTER MONITOR ──────────────── */}
            <g id="monitor-assembly">
              {/* Monitor Stand Base (Resting on baseline Y = 370) */}
              <path
                d="M 330 360 L 450 360 C 455 360 458 363 455 367 L 450 370 L 330 370 L 325 367 C 322 363 325 360 330 360 Z"
                className="fill-white dark:fill-slate-800 stroke-slate-900 dark:stroke-slate-200"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Monitor Neck Stem */}
              <rect
                x="376"
                y="315"
                width="28"
                height="46"
                className="fill-white dark:fill-slate-800 stroke-slate-900 dark:stroke-slate-200"
                strokeWidth="3.5"
              />

              {/* Monitor Outer Frame */}
              <rect
                x="260"
                y="170"
                width="260"
                height="150"
                rx="16"
                className="fill-white dark:fill-slate-900 stroke-slate-900 dark:stroke-slate-200"
                strokeWidth="4"
                strokeLinejoin="round"
              />

              {/* Inner Screen Display Glass */}
              <rect
                x="272"
                y="182"
                width="236"
                height="110"
                rx="10"
                className="fill-[url(#screenBlueGrad)] dark:fill-[url(#screenBlueDark)] stroke-slate-900 dark:stroke-slate-200"
                strokeWidth="3"
              />

              {/* Screen Reflection Glare Lines */}
              <g stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.75">
                <line x1="295" y1="230" x2="335" y2="195" />
                <line x1="315" y1="235" x2="355" y2="200" />
                <line x1="335" y1="240" x2="375" y2="205" />
              </g>

              {/* Monitor Camera / Status Dots */}
              <circle cx="475" cy="305" r="3.5" className="fill-slate-900 dark:fill-slate-200" />
              <circle cx="487" cy="305" r="3.5" className="fill-slate-900 dark:fill-slate-200" />
              <circle cx="499" cy="305" r="3.5" className="fill-slate-900 dark:fill-slate-200" />
            </g>

            {/* ─── 3. SAFETY TRAFFIC CONE ──────────────────────────────── */}
            <g id="traffic-cone">
              {/* Cone Base (Resting on baseline Y = 370) */}
              <rect
                x="545"
                y="362"
                width="46"
                height="8"
                rx="2"
                className="fill-slate-900 dark:fill-slate-700 stroke-slate-900 dark:stroke-slate-200"
                strokeWidth="2.5"
              />
              {/* Cone Body */}
              <path
                d="M 568 318 L 549 362 L 587 362 Z"
                fill="url(#coneStripesPattern)"
                className="stroke-slate-900 dark:stroke-slate-200"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
            </g>

            {/* ─── 4. TOWER CRANE (RIG & TRUSS - PERFECTLY CONNECTED) ────── */}
            <g id="tower-crane-structure">
              {/* Triangular Jib Support Apex Top */}
              <polygon
                points="621,30 420,74 670,74"
                className="fill-slate-100 dark:fill-slate-800 stroke-slate-900 dark:stroke-slate-200"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Center Apex Support Strut */}
              <line
                x1="621"
                y1="30"
                x2="621"
                y2="74"
                className="stroke-slate-900 dark:stroke-slate-200"
                strokeWidth="3"
              />

              {/* Warning Beacon on Apex Peak */}
              <circle cx="621" cy="26" r="5.5" fill="#f59e0b" className="stroke-slate-900 dark:stroke-slate-200" strokeWidth="2" />

              {/* Horizontal Jib Truss Arm (Spans across from X=390 above monitor to X=680) */}
              <rect
                x="390"
                y="74"
                width="290"
                height="26"
                rx="3"
                className="fill-white dark:fill-slate-800 stroke-slate-900 dark:stroke-slate-200"
                strokeWidth="3.5"
              />

              {/* Jib Internal Diagonal Lattice Cross Bracings */}
              <g className="stroke-slate-900 dark:stroke-slate-200" strokeWidth="2.5">
                <line x1="390" y1="74" x2="419" y2="100" /><line x1="419" y1="74" x2="390" y2="100" />
                <line x1="419" y1="74" x2="448" y2="100" /><line x1="448" y1="74" x2="419" y2="100" />
                <line x1="448" y1="74" x2="477" y2="100" /><line x1="477" y1="74" x2="448" y2="100" />
                <line x1="477" y1="74" x2="506" y2="100" /><line x1="506" y1="74" x2="477" y2="100" />
                <line x1="506" y1="74" x2="535" y2="100" /><line x1="535" y1="74" x2="506" y2="100" />
                <line x1="535" y1="74" x2="564" y2="100" /><line x1="564" y1="74" x2="535" y2="100" />
                <line x1="564" y1="74" x2="593" y2="100" /><line x1="593" y1="74" x2="564" y2="100" />
                <line x1="593" y1="74" x2="622" y2="100" /><line x1="622" y1="74" x2="593" y2="100" />
                <line x1="622" y1="74" x2="651" y2="100" /><line x1="651" y1="74" x2="622" y2="100" />
                <line x1="651" y1="74" x2="680" y2="100" /><line x1="680" y1="74" x2="651" y2="100" />
              </g>

              {/* Vertical Mast Tower (Connected from Y=100 down to baseline Y=370) */}
              <rect
                x="605"
                y="100"
                width="32"
                height="270"
                className="fill-white dark:fill-slate-800 stroke-slate-900 dark:stroke-slate-200"
                strokeWidth="3.5"
              />

              {/* Vertical Mast Internal Diagonal Lattice Cross Bracings */}
              <g className="stroke-slate-900 dark:stroke-slate-200" strokeWidth="2.5">
                <line x1="605" y1="100" x2="637" y2="130" /><line x1="637" y1="100" x2="605" y2="130" />
                <line x1="605" y1="130" x2="637" y2="160" /><line x1="637" y1="130" x2="605" y2="160" />
                <line x1="605" y1="160" x2="637" y2="190" /><line x1="637" y1="160" x2="605" y2="190" />
                <line x1="605" y1="190" x2="637" y2="220" /><line x1="637" y1="190" x2="605" y2="220" />
                <line x1="605" y1="220" x2="637" y2="250" /><line x1="637" y1="220" x2="605" y2="250" />
                <line x1="605" y1="250" x2="637" y2="280" /><line x1="637" y1="250" x2="605" y2="280" />
                <line x1="605" y1="280" x2="637" y2="310" /><line x1="637" y1="280" x2="605" y2="310" />
                <line x1="605" y1="310" x2="637" y2="340" /><line x1="637" y1="310" x2="605" y2="340" />
                <line x1="605" y1="340" x2="637" y2="370" /><line x1="637" y1="340" x2="605" y2="370" />
              </g>
            </g>

            {/* ─── 5. CRANE TROLLEY, CABLE & HOOK (ATTACHED ON JIB) ──────── */}
            <g id="crane-payload-rig">
              {/* Crane Trolley Slider (Attached directly to underside of jib at Y=100) */}
              <rect
                x="440"
                y="100"
                width="70"
                height="14"
                rx="3"
                fill="#0f766e"
                className="dark:fill-[#2dd4bf] stroke-slate-900 dark:stroke-slate-200"
                strokeWidth="3.5"
              />

              {/* Steel Hoist Cable (Drops straight from trolley center X=475) */}
              <line
                x1="475"
                y1="114"
                x2="475"
                y2="185"
                className="stroke-slate-900 dark:stroke-slate-200"
                strokeWidth="3.5"
              />

              {/* Cable Pulley Swivel Ring & Hook */}
              <circle
                cx="475"
                cy="189"
                r="6"
                className="fill-white dark:fill-slate-800 stroke-slate-900 dark:stroke-slate-200"
                strokeWidth="3"
              />
              <path
                d="M 475 195 C 469 195 465 200 465 205 C 465 210 470 213 475 213 C 479 213 483 209 483 205"
                fill="none"
                className="stroke-slate-900 dark:stroke-slate-200"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Rigging Sling Lines to Card */}
              <line
                x1="475"
                y1="203"
                x2="440"
                y2="218"
                className="stroke-slate-900 dark:stroke-slate-200"
                strokeWidth="2.5"
              />
              <line
                x1="475"
                y1="203"
                x2="495"
                y2="222"
                className="stroke-slate-900 dark:stroke-slate-200"
                strokeWidth="2.5"
              />

              {/* Suspended PharmaCore Academic Module Card */}
              <g transform="translate(410, 210) rotate(-4)">
                {/* Card Container */}
                <rect
                  x="0"
                  y="0"
                  width="125"
                  height="78"
                  rx="10"
                  fill="#ffffff"
                  className="stroke-slate-900 dark:stroke-slate-200"
                  strokeWidth="3.5"
                  filter="url(#crispCardShadow)"
                />

                {/* PharmaCore Medical Capsule Icon Badge on Card */}
                <rect x="14" y="15" width="22" height="10" rx="5" fill="#0f766e" />
                <circle cx="19" cy="20" r="2.5" fill="#a5f3fc" />

                {/* Simulated Clinical Module / Lecture Content Lines */}
                <rect x="42" y="16" width="68" height="8" rx="4" fill="#0f766e" />
                <rect x="14" y="33" width="96" height="7" rx="3.5" fill="#0284c7" />
                <rect x="14" y="47" width="75" height="7" rx="3.5" fill="#38bdf8" />
                <rect x="14" y="60" width="50" height="6" rx="3" fill="#64748b" opacity="0.8" />
              </g>
            </g>
          </svg>
        </div>

        {/* ─── Explanatory Subtitle ──────────────────────────────────────── */}
        <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200 max-w-xl mx-auto leading-relaxed mt-4">
          {message}
        </p>

        {/* Estimated Completion Timer if configured */}
        {config?.estimated_until && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-xs mt-4">
            <Clock className="size-4 text-[#0f766e] dark:text-[#2dd4bf]" />
            <span>
              {isAr ? "الموعد المقدر للانتهاء:" : "Estimated completion:"}{" "}
              <strong className="text-[#0f766e] dark:text-[#2dd4bf] font-bold">{config.estimated_until}</strong>
            </span>
          </div>
        )}

        {/* ─── High-Contrast Primary Pill Action Button ─────────────────────── */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={handleCheckStatus}
            disabled={checking}
            className="h-12 px-8 rounded-full font-bold text-sm bg-[#0f766e] hover:bg-[#115e59] text-white shadow-md hover:shadow-lg transition-all gap-2"
          >
            <RefreshCw className={`size-4 ${checking ? "animate-spin" : ""}`} />
            <span>
              {checking
                ? isAr
                  ? "جارٍ التحقق..."
                  : "Checking..."
                : isAr
                ? "التحقق من حالة المنصة"
                : "Check status"}
            </span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowFact(!showFact)}
            className="h-12 px-6 rounded-full font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 gap-1.5 shadow-xs"
          >
            <Sparkles className="size-4 text-amber-500" />
            <span>{isAr ? "معلومة صيدلانية سريعة" : "Quick Pharmacy Fact"}</span>
          </Button>
        </div>

        {/* Optional Interactive Pharmacy Fact Pop-in */}
        {showFact && (
          <div className="mt-6 max-w-lg w-full p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-start space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0f766e] dark:text-[#2dd4bf] flex items-center gap-1.5">
                <GraduationCap className="size-4" />
                <span>{isAr ? "معلومة اليوم" : "Clinical Pearl"}</span>
              </span>
              <button
                type="button"
                onClick={handleNextFact}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="size-3" />
                <span>{isAr ? "معلومة أخرى" : "Next Fact"}</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 italic leading-relaxed">
              &ldquo;{isAr ? pharmacyFacts[factIndex].ar : pharmacyFacts[factIndex].en}&rdquo;
            </p>
          </div>
        )}
      </main>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 z-10">
        <p>© {new Date().getFullYear()} PharmaCore. {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}</p>
      </footer>
    </div>
  )
}
