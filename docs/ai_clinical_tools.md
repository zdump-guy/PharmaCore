# Hybrid Clinical AI Assistant & Pharmacology Calculators (`docs/ai_clinical_tools.md`)

## 1. Architecture Overview
PharmaCore embeds a hybrid clinical AI assistant and evidence-based clinical pharmacology calculators directly inside lectures (`/lecture/[id]`) and study workspaces.

```
┌─────────────────────────────────────────────────────────────┐
│                 Lecture Player & Study Page                 │
│                                                             │
│  ┌───────────────────────┐   ┌───────────────────────────┐  │
│  │ Active Video Context  │   │  Floating AI Assistant    │  │
│  │ (Topic, Objectives)   │───▶  Context Drawer           │  │
│  └───────────────────────┘   └─────────────┬─────────────┘  │
└────────────────────────────────────────────┼────────────────┘
                                             │
               ┌─────────────────────────────┴────────────────────────────┐
               ▼                                                          ▼
   ┌───────────────────────┐                                  ┌───────────────────────┐
   │ Deterministic Math &  │                                  │ LLM Consultation API  │
   │ Clinical Calculators  │                                  │ (/api/ai/consult)     │
   │ (CrCl, Dosing, DDI)   │                                  │ RAG over Guidelines   │
   └───────────────────────┘                                  └───────────────────────┘
```

---

## 2. Evidence-Based Clinical Calculators (`lib/clinicalCalculators.ts`)

### 2.1 Cockcroft-Gault Creatinine Clearance (CrCl)
Estimates glomerular filtration rate for renal drug dose adjustments.

$$\text{CrCl (Male)} = \frac{(140 - \text{Age}) \times \text{Weight (kg)}}{72 \times \text{Serum Creatinine (mg/dL)}}$$
$$\text{CrCl (Female)} = \text{CrCl (Male)} \times 0.85$$

#### CKD Staging & Clinical Interpretation:
- **$\ge 90 \text{ mL/min}$**: Stage 1 (Normal renal function - standard dosing).
- **$60 - 89 \text{ mL/min}$**: Stage 2 (Mild impairment - monitor narrow therapeutic index drugs).
- **$30 - 59 \text{ mL/min}$**: Stage 3 (Moderate impairment - extend dosing interval or reduce dose).
- **$15 - 29 \text{ mL/min}$**: Stage 4 (Severe impairment - strict dose reduction required; avoid nephrotoxins).
- **$< 15 \text{ mL/min}$**: Stage 5 (End-Stage Renal Disease - evaluate dialysis clearance).

### 2.2 Pediatric Dosing Calculator
Calculates weight-based pediatric regimens with adult maximum dose capping.

$$\text{Calculated Daily Dose} = \text{Weight (kg)} \times \text{Dose per kg}$$
$$\text{Individual Single Dose} = \frac{\text{Calculated Daily Dose}}{\text{Dosing Frequency (doses/day)}}$$
$$\text{Final Safe Dose} = \min(\text{Calculated Single Dose}, \text{Adult Maximum Single Dose})$$

### 2.3 Drug-Drug Interaction (DDI) Checker
Pre-compiled clinical matrix identifying high-risk pharmacokinetic and pharmacodynamic interactions:
- **Clopidogrel + Omeprazole**: CYP2C19 competitive inhibition reduces active clopidogrel metabolite formation.
- **Simvastatin + Clarithromycin**: Potent CYP3A4 inhibition increases statin AUC $> 500\%$, elevating rhabdomyolysis risk.
- **Warfarin + Amiodarone**: CYP2C9 inhibition impairs S-warfarin clearance, elevating INR and bleeding risk.
- **Fluoxetine + Selegiline**: Severe risk of Serotonin Syndrome via combined 5-HT reuptake inhibition and MAO blockade.
- **ACE Inhibitor (Lisinopril) + Spironolactone + Trimethoprim**: Synergistic potassium retention inducing life-threatening hyperkalemia.

---

## 3. Consultation API Schema (`/api/ai/consult`)

### Request Payload:
```json
{
  "prompt": "What is the recommended GDMT titration strategy for HFrEF in a patient with CrCl 25 mL/min and baseline potassium 4.8 mEq/L?",
  "context": {
    "course_id": "course-cardio-01",
    "lecture_id": "lec-01",
    "lecture_title": "Heart Failure GDMT Titration",
    "course_objectives": "Titration of ARNI, SGLT2i, beta-blockers, and MRAs."
  },
  "tool_invocation": {
    "tool": "cockcroft_gault",
    "params": {
      "age": 68,
      "weight_kg": 74,
      "serum_creatinine_mg_dl": 2.1,
      "is_female": false
    }
  }
}
```

### Response Payload:
```json
{
  "success": true,
  "consultation_id": "ai-cons-987123",
  "response": {
    "clinical_summary": "Initiate SGLT2i (Dapagliflozin/Empagliflozin) as renal benefit persists down to eGFR 20 mL/min. Titrate Beta-blocker (Carvedilol or Metoprolol Succinate). Hold or use reduced dose ARNI/ACEi with close creatinine monitoring.",
    "calculator_results": {
      "crcl": 29.4,
      "stage": "Stage 4 (Severe)",
      "dosage_guideline": "Extend dosing intervals by 50% for renally cleared agents."
    },
    "guideline_citations": [
      "2022 AHA/ACC/HFSA Guideline for the Management of Heart Failure",
      "KDIGO 2023 Clinical Practice Guideline for Diabetes Management in CKD"
    ]
  }
}
```
