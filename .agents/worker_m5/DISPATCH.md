## 2026-08-20T15:46:45Z

You are worker_m5, an implementation worker responsible for Milestone M5: Hybrid AI Clinical Assistant (Requirement R4).
Your working directory is: /home/bravo-07/Documents/dev/yo-project/.agents/worker_m5
Your parent is the Project Orchestrator (aa81873a-183a-48db-b31d-72d9a6210c82).

Scope Documents:
- /home/bravo-07/Documents/dev/yo-project/.agents/ORIGINAL_REQUEST.md (MANDATORY: read this first)
- /home/bravo-07/Documents/dev/yo-project/PROJECT.md
- /home/bravo-07/Documents/dev/yo-project/TEST_READY.md

Exclusive Write Ownership:
- `components/clinical/` (all subcomponents)
- `pages/lecture/[id].tsx`
- `lib/clinicalCalculators.ts`
- `pages/api/ai/consult.ts`

Detailed Tasks for Milestone M5 (Requirement R4):
1. In-Lecture Context-Aware Side Drawer (`components/clinical/ClinicalAssistantDrawer.tsx`):
   - Integrated into `pages/lecture/[id].tsx` using `components/ui/sheet.tsx` (`Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`).
   - Triggered by an "AI Clinical Assistant" floating action button or player control button.
   - Gated by feature flag: dynamically checks `resolveCourseFeatures(siteContent.features, course.feature_overrides).ai_assistant`. If disabled for course, hides/disables trigger.
   - Injects current lecture context:
     - Current lecture title (`lecture.title_en` / `lecture.title_ar`).
     - Current video playback timestamp (from `YouTubePlayer` or state).
     - Course syllabus learning objectives (`course.objectives_en` / `course.objectives_ar`).
   - Includes quick prompt chips (e.g. "Explain mechanism in simple terms", "Highlight clinical contraindications", "Key side effects & monitoring parameters", "Dosing in renal impairment").
2. Clinical Calculation Engines (`lib/clinicalCalculators.ts`):
   - Implement pure deterministic calculation engines:
     a. **Renal Dose Calculator (Cockcroft-Gault CrCl)**:
        - Formula: $\text{CrCl} = \frac{(140 - \text{age}) \times \text{weight (kg)}}{72 \times \text{serum creatinine (mg/dL)}} \times (0.85 \text{ if female})$.
        - Output: CrCl (mL/min), CKD stage (Stage 1 Normal $\ge 90$, Stage 2 Mild 60-89, Stage 3 Moderate 30-59, Stage 4 Severe 15-29, Stage 5 ESRD $<15$), and specific clinical dosage adjustment guidance for narrow therapeutic index drugs (e.g. Vancomycin, Gentamicin, Enoxaparin, Digoxin).
     b. **Pediatric Dose Calculator**:
        - Weight-based dosing ($\text{mg/kg/dose}$ and $\text{mg/kg/day}$ with max adult dose cap).
        - Clark's Rule ($\text{Child Dose} = \frac{\text{Weight (lbs)}}{150} \times \text{Adult Dose}$) and Young's Rule.
     c. **Drug-Drug Interaction (DDI) Checker**:
        - Risk screening across curated pharmacology pairs (e.g., Clarithromycin + Simvastatin, Nitroglycerin + Sildenafil, Warfarin + NSAIDs/Fluconazole, ACE inhibitors + Spironolactone, MAOIs + SSRIs).
        - Returns Severity Level (`Contraindicated / Fatal`, `Major / High Risk`, `Moderate / Monitor`, `Minor`), clinical mechanism, and actionable management recommendations.
3. Full Clinical Consultation Workspace (`components/clinical/ClinicalWorkspace.tsx`):
   - Multi-tab clinical workspace:
     - Tab 1: "Lecture Q&A & Clinical Consult" (interactive chat interface with streaming/instant responses).
     - Tab 2: "Renal CrCl Calculator" (interactive input form for age, gender, weight, serum creatinine, drug selector).
     - Tab 3: "Pediatric Dose Calculator" (weight, age, adult dose input form).
     - Tab 4: "Drug-Drug Interaction Checker" (multi-drug selector and interaction matrix report).
4. Backend Consultation API (`pages/api/ai/consult.ts`):
   - Handles `AIConsultRequest` payload (`tool_type`, `prompt`, `context`).
   - If `tool_type === 'dose_calculator'`, executes renal or pediatric calculation engine.
   - If `tool_type === 'interaction_checker'`, executes DDI screening engine.
   - If `tool_type === 'general_consult'` or `'lecture_qa'`, uses hybrid pharmacology knowledge base engine with optional external LLM API if key is present in environment.
   - Logs consultation session to `public.ai_consultations` table in Supabase.
5. Verification:
   - Run `npx tsc --noEmit` -> 0 errors.
   - Run `npm run build` -> exit code 0.
   - Run `node scripts/run-e2e-tests.mjs` -> all 98 tests pass (100%).
