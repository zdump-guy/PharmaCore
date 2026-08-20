/**
 * Clinical Pharmacology Calculations & AI Assistant Engine
 * Conforms to ORIGINAL_REQUEST § R4 and PROJECT.md § Milestone 5
 */

import type { AIConsultRequest } from "@/types"

export interface CockcroftGaultParams {
  age: number
  weight_kg: number
  serum_creatinine_mg_dl: number
  gender: "male" | "female"
  drug?: string
}

export interface CockcroftGaultResult {
  crcl_ml_min: number
  staging: string
  interpretation: string
  parameters_used: {
    age: number
    weight_kg: number
    serum_creatinine_mg_dl: number
    gender: "male" | "female"
    gender_factor: number
  }
  drug_adjustment?: {
    drug: string
    recommendation: string
    risk_level: "normal" | "caution" | "warning" | "contraindicated"
  }
}

export interface PediatricDoseParams {
  method: "weight_based" | "clark" | "young"
  weight_kg?: number
  age_years?: number
  dose_per_kg?: number
  adult_dose?: number
  max_adult_dose?: number
  drug?: string
}

export interface PediatricDoseResult {
  method: "weight_based" | "clark" | "young"
  calculated_dose: number
  unit: string
  capped_at_adult_max?: boolean
  notes: string
  drug?: string
}

export interface DDIEntry {
  drugs: [string, string]
  severity: "contraindicated" | "major" | "moderate" | "minor"
  risk: string
  recommendation: string
}

export interface DDIResult {
  interaction_detected: boolean
  drug_a: string
  drug_b: string
  severity: "contraindicated" | "major" | "moderate" | "minor" | "none"
  risk_summary: string
  clinical_recommendation: string
}

/**
 * Curated Drug-Drug Interaction Database
 */
export const DDI_DATABASE: DDIEntry[] = [
  {
    drugs: ["warfarin", "aspirin"],
    severity: "major",
    risk: "Additive antiplatelet and anticoagulant effects significantly amplify gastrointestinal hemorrhage risk.",
    recommendation: "Avoid combination unless indicated for specific cardiovascular conditions; monitor INR frequently.",
  },
  {
    drugs: ["simvastatin", "clarithromycin"],
    severity: "contraindicated",
    risk: "Potent CYP3A4 inhibition by clarithromycin markedly increases simvastatin plasma concentrations, raising rhabdomyolysis risk.",
    recommendation: "Temporarily discontinue simvastatin during clarithromycin course or substitute azithromycin.",
  },
  {
    drugs: ["sildenafil", "nitroglycerin"],
    severity: "contraindicated",
    risk: "Synergistic cGMP accumulation causes profound, refractory systemic hypotension and cardiac arrest risk.",
    recommendation: "Absolute contraindication. Never administer organic nitrates with PDE-5 inhibitors.",
  },
  {
    drugs: ["lisinopril", "spironolactone"],
    severity: "moderate",
    risk: "Concurrent inhibition of aldosterone and angiotensin II produces additive risk of severe hyperkalemia.",
    recommendation: "Monitor serum potassium and renal function within 1-2 weeks of initiating combination.",
  },
  {
    drugs: ["ciprofloxacin", "theophylline"],
    severity: "major",
    risk: "Inhibition of CYP1A2 by ciprofloxacin reduces theophylline hepatic clearance by up to 50%, causing neuro/cardiotoxicity.",
    recommendation: "Reduce theophylline dosage by 50% and perform therapeutic drug monitoring.",
  },
  {
    drugs: ["metformin", "iodinated_contrast"],
    severity: "major",
    risk: "Potential contrast-induced acute kidney injury leads to metformin accumulation and lactic acidosis.",
    recommendation: "Withhold metformin at time of procedure and for 48 hours post-procedure; verify renal recovery before restarting.",
  },
  {
    drugs: ["warfarin", "fluconazole"],
    severity: "major",
    risk: "Potent CYP2C9 inhibition by fluconazole impairs S-warfarin metabolism, sharply increasing INR and bleeding danger.",
    recommendation: "Reduce warfarin dose by 25-50% upon starting fluconazole and perform close INR surveillance.",
  },
  {
    drugs: ["phenelzine", "sertraline"],
    severity: "contraindicated",
    risk: "Co-administration of non-selective MAOI with SSRI precipitates life-threatening Serotonin Syndrome (hyperthermia, clonus, autonomic instability).",
    recommendation: "Allow a mandatory 14-day washout period between discontinuing an MAOI and starting an SSRI (5 weeks for fluoxetine).",
  },
  {
    drugs: ["digoxin", "amiodarone"],
    severity: "major",
    risk: "P-glycoprotein and renal clearance inhibition by amiodarone increases serum digoxin levels by 70-100%, causing fatal digitalis toxicity.",
    recommendation: "Empirically reduce digoxin dose by 50% when initiating amiodarone and monitor serum digoxin levels.",
  },
  {
    drugs: ["methotrexate", "ibuprofen"],
    severity: "major",
    risk: "NSAIDs inhibit renal prostaglandin synthesis and tubular excretion of methotrexate, causing severe myelosuppression and nephrotoxicity.",
    recommendation: "Avoid high-dose methotrexate co-administration with NSAIDs; monitor CBC and renal markers closely if used at low doses.",
  },
  {
    drugs: ["clopidogrel", "omeprazole"],
    severity: "moderate",
    risk: "Omeprazole inhibits CYP2C19, blocking metabolic bioactivation of clopidogrel and reducing its antiplatelet efficacy.",
    recommendation: "Consider non-CYP2C19 inhibiting PPIs like pantoprazole or H2-receptor antagonists if gastroprotection is needed.",
  },
  {
    drugs: ["lithium", "hydrochlorothiazide"],
    severity: "major",
    risk: "Thiazide diuretics cause sodium depletion, enhancing proximal tubular reabsorption of lithium and causing severe lithium toxicity.",
    recommendation: "Reduce lithium dosage by 50%, monitor serum lithium levels, and assess for tremors, ataxia, or confusion.",
  },
]

/**
 * Narrow Therapeutic Index Drug Renal Dosage Guidance
 */
export const NARROW_THERAPEUTIC_DRUGS = [
  { id: "vancomycin", name: "Vancomycin", defaultUnit: "mg" },
  { id: "gentamicin", name: "Gentamicin", defaultUnit: "mg" },
  { id: "enoxaparin", name: "Enoxaparin", defaultUnit: "mg" },
  { id: "digoxin", name: "Digoxin", defaultUnit: "mcg" },
  { id: "ciprofloxacin", name: "Ciprofloxacin", defaultUnit: "mg" },
  { id: "metformin", name: "Metformin", defaultUnit: "mg" },
]

export function getRenalDrugAdjustment(drugName: string, crcl: number): {
  drug: string
  recommendation: string
  risk_level: "normal" | "caution" | "warning" | "contraindicated"
} {
  const norm = drugName.trim().toLowerCase()

  if (norm.includes("vancomycin")) {
    if (crcl >= 90) {
      return {
        drug: "Vancomycin",
        recommendation: "CrCl ≥ 90 mL/min: Standard dosing 15-20 mg/kg IV q8-12h. Target trough 15-20 mcg/mL for severe infections.",
        risk_level: "normal",
      }
    } else if (crcl >= 60) {
      return {
        drug: "Vancomycin",
        recommendation: "CrCl 60-89 mL/min: 15-20 mg/kg IV q12h. Monitor serum trough levels prior to 4th dose.",
        risk_level: "normal",
      }
    } else if (crcl >= 30) {
      return {
        drug: "Vancomycin",
        recommendation: "CrCl 30-59 mL/min: 15-20 mg/kg IV q24h. Extend interval and check pre-dose trough levels.",
        risk_level: "caution",
      }
    } else if (crcl >= 15) {
      return {
        drug: "Vancomycin",
        recommendation: "CrCl 15-29 mL/min: 15-20 mg/kg IV q48h or redose per serum concentration levels.",
        risk_level: "warning",
      }
    } else {
      return {
        drug: "Vancomycin",
        recommendation: "CrCl < 15 mL/min (ESRD/HD): Loading dose 20-25 mg/kg IV once, redose only when level < 15 mcg/mL (typically post-dialysis).",
        risk_level: "warning",
      }
    }
  }

  if (norm.includes("gentamicin")) {
    if (crcl >= 60) {
      return {
        drug: "Gentamicin",
        recommendation: "CrCl ≥ 60 mL/min: Extended interval 5-7 mg/kg IV q24h or traditional 1.5-2 mg/kg IV q8h.",
        risk_level: "normal",
      }
    } else if (crcl >= 40) {
      return {
        drug: "Gentamicin",
        recommendation: "CrCl 40-59 mL/min: Extended interval 5-7 mg/kg IV q36h; monitor trough (< 1 mcg/mL).",
        risk_level: "caution",
      }
    } else if (crcl >= 20) {
      return {
        drug: "Gentamicin",
        recommendation: "CrCl 20-39 mL/min: Extended interval 5-7 mg/kg IV q48h or dose by daily level monitoring.",
        risk_level: "warning",
      }
    } else {
      return {
        drug: "Gentamicin",
        recommendation: "CrCl < 20 mL/min: Avoid once-daily high-dose; give traditional loading dose 2 mg/kg then monitor levels before every subsequent dose.",
        risk_level: "contraindicated",
      }
    }
  }

  if (norm.includes("enoxaparin")) {
    if (crcl >= 30) {
      return {
        drug: "Enoxaparin",
        recommendation: "CrCl ≥ 30 mL/min: Treatment: 1 mg/kg SC q12h or 1.5 mg/kg SC q24h. Prophylaxis: 40 mg SC q24h.",
        risk_level: "normal",
      }
    } else {
      return {
        drug: "Enoxaparin",
        recommendation: "CrCl < 30 mL/min: Dose reduction mandatory! Treatment: 1 mg/kg SC q24h. Prophylaxis: 30 mg SC q24h. Monitor Anti-Xa levels.",
        risk_level: "warning",
      }
    }
  }

  if (norm.includes("digoxin")) {
    if (crcl >= 50) {
      return {
        drug: "Digoxin",
        recommendation: "CrCl ≥ 50 mL/min: 0.125 - 0.25 mg PO daily. Target serum level 0.5 - 0.9 ng/mL.",
        risk_level: "normal",
      }
    } else if (crcl >= 30) {
      return {
        drug: "Digoxin",
        recommendation: "CrCl 30-49 mL/min: 0.125 mg PO daily or 0.25 mg every other day. Increased risk of digitalis toxicity.",
        risk_level: "caution",
      }
    } else if (crcl >= 10) {
      return {
        drug: "Digoxin",
        recommendation: "CrCl 10-29 mL/min: 0.0625 - 0.125 mg PO daily. Therapeutic drug monitoring required.",
        risk_level: "warning",
      }
    } else {
      return {
        drug: "Digoxin",
        recommendation: "CrCl < 10 mL/min: 0.0625 mg every 48 hours or 3 times weekly. Extreme risk of accumulation.",
        risk_level: "warning",
      }
    }
  }

  if (norm.includes("metformin")) {
    if (crcl >= 45) {
      return {
        drug: "Metformin",
        recommendation: "CrCl ≥ 45 mL/min: Standard dosing up to 2000-2550 mg/day in divided doses.",
        risk_level: "normal",
      }
    } else if (crcl >= 30) {
      return {
        drug: "Metformin",
        recommendation: "CrCl 30-44 mL/min: Maximum recommended dose 1000 mg/day. Assess risk/benefit; monitor eGFR q3-6mo.",
        risk_level: "caution",
      }
    } else {
      return {
        drug: "Metformin",
        recommendation: "CrCl < 30 mL/min: CONTRAINDICATED due to high risk of life-threatening lactic acidosis.",
        risk_level: "contraindicated",
      }
    }
  }

  if (norm.includes("ciprofloxacin")) {
    if (crcl >= 50) {
      return {
        drug: "Ciprofloxacin",
        recommendation: "CrCl ≥ 50 mL/min: Standard dose 250-750 mg PO q12h or 200-400 mg IV q12h.",
        risk_level: "normal",
      }
    } else if (crcl >= 30) {
      return {
        drug: "Ciprofloxacin",
        recommendation: "CrCl 30-49 mL/min: 250-500 mg PO q12h or 200-400 mg IV q18-24h.",
        risk_level: "caution",
      }
    } else {
      return {
        drug: "Ciprofloxacin",
        recommendation: "CrCl < 30 mL/min: 250-500 mg PO q18-24h or 200-400 mg IV q24h.",
        risk_level: "warning",
      }
    }
  }

  return {
    drug: drugName,
    recommendation: `CrCl ${crcl} mL/min: Review prescribing information for ${drugName} to determine renal dose reduction ratio.`,
    risk_level: crcl < 30 ? "warning" : crcl < 60 ? "caution" : "normal",
  }
}

/**
 * Calculates Creatinine Clearance (CrCl) using the Cockcroft-Gault Equation:
 *
 * CrCl (mL/min) = [ (140 - Age) * Weight (kg) ] / [ 72 * Serum Creatinine (mg/dL) ]
 * * 0.85 if Female
 */
export function calculateCockcroftGaultCrCl({
  age,
  weight_kg,
  serum_creatinine_mg_dl,
  gender,
  drug,
}: CockcroftGaultParams): CockcroftGaultResult {
  if (typeof age !== "number" || age <= 0 || age > 130) {
    throw new Error("Invalid age: must be between 1 and 130 years")
  }
  if (typeof weight_kg !== "number" || weight_kg <= 0 || weight_kg > 500) {
    throw new Error("Invalid weight: must be positive number up to 500 kg")
  }
  if (typeof serum_creatinine_mg_dl !== "number" || serum_creatinine_mg_dl <= 0 || serum_creatinine_mg_dl > 30) {
    throw new Error("Invalid serum creatinine: must be positive number (mg/dL)")
  }
  if (gender !== "male" && gender !== "female") {
    throw new Error('Invalid gender: must be "male" or "female"')
  }

  const genderFactor = gender === "female" ? 0.85 : 1.0
  const rawCrCl = (((140 - age) * weight_kg) / (72 * serum_creatinine_mg_dl)) * genderFactor
  const crcl = Math.round(rawCrCl * 100) / 100

  let staging = ""
  let interpretation = ""

  if (crcl >= 90) {
    staging = "Normal / Stage 1"
    interpretation = "Normal renal function. Standard dosing usually appropriate."
  } else if (crcl >= 60) {
    staging = "Mild Impairment / Stage 2"
    interpretation = "Mild decrease in GFR. Minor dose adjustments may be required for narrow therapeutic index drugs."
  } else if (crcl >= 30) {
    staging = "Moderate Impairment / Stage 3"
    interpretation = "Moderate decrease in GFR. Dose reduction or interval extension required for renally eliminated drugs."
  } else if (crcl >= 15) {
    staging = "Severe Impairment / Stage 4"
    interpretation = "Severe decrease in GFR. Significant dose adjustments required; avoid nephrotoxic agents."
  } else {
    staging = "Kidney Failure / Stage 5 (ESRD)"
    interpretation = "End-stage renal disease. Dialysis support required; extreme caution with all renally cleared pharmaceuticals."
  }

  const result: CockcroftGaultResult = {
    crcl_ml_min: crcl,
    staging,
    interpretation,
    parameters_used: { age, weight_kg, serum_creatinine_mg_dl, gender, gender_factor: genderFactor },
  }

  if (drug) {
    result.drug_adjustment = getRenalDrugAdjustment(drug, crcl)
  }

  return result
}

/**
 * Calculates Pediatric Doses using standard formulas (Weight-based, Clark's rule, Young's rule)
 */
export function calculatePediatricDose({
  method,
  weight_kg,
  age_years,
  dose_per_kg,
  adult_dose,
  max_adult_dose,
  drug,
}: PediatricDoseParams): PediatricDoseResult {
  if (method === "weight_based") {
    if (!weight_kg || !dose_per_kg) {
      throw new Error("Weight-based dosing requires weight_kg and dose_per_kg")
    }
    const calculatedDose = weight_kg * dose_per_kg
    const cappedDose = max_adult_dose ? Math.min(calculatedDose, max_adult_dose) : calculatedDose
    return {
      method: "weight_based",
      calculated_dose: Math.round(cappedDose * 100) / 100,
      unit: "mg",
      capped_at_adult_max: max_adult_dose ? calculatedDose > max_adult_dose : false,
      notes: `${weight_kg}kg * ${dose_per_kg}mg/kg${max_adult_dose ? ` (Max: ${max_adult_dose}mg)` : ""}`,
      drug,
    }
  }

  if (method === "clark") {
    if (!weight_kg || !adult_dose) {
      throw new Error("Clark's rule requires weight_kg and adult_dose")
    }
    // Clark's rule: (weight in kg / 70 kg) * adult dose
    const childDose = (weight_kg / 70) * adult_dose
    return {
      method: "clark",
      calculated_dose: Math.round(childDose * 100) / 100,
      unit: "mg",
      notes: `(Weight ${weight_kg}kg / 70kg standard adult weight) * Adult dose ${adult_dose}mg`,
      drug,
    }
  }

  if (method === "young") {
    if (!age_years || !adult_dose) {
      throw new Error("Young's rule requires age_years and adult_dose")
    }
    // Young's rule: [Age / (Age + 12)] * adult dose
    const childDose = (age_years / (age_years + 12)) * adult_dose
    return {
      method: "young",
      calculated_dose: Math.round(childDose * 100) / 100,
      unit: "mg",
      notes: `[Age ${age_years} / (${age_years} + 12)] * Adult dose ${adult_dose}mg`,
      drug,
    }
  }

  throw new Error(`Unsupported pediatric dosing method: "${method}"`)
}

/**
 * Checks for Drug-Drug Interactions between two agents
 */
export function checkDrugInteractions(drugA: string, drugB: string): DDIResult {
  if (!drugA || !drugB || typeof drugA !== "string" || typeof drugB !== "string") {
    throw new Error("Two valid drug names are required")
  }

  const nameA = drugA.trim().toLowerCase()
  const nameB = drugB.trim().toLowerCase()

  const match = DDI_DATABASE.find((item) => {
    const d0 = item.drugs[0].toLowerCase()
    const d1 = item.drugs[1].toLowerCase()
    return (
      (nameA.includes(d0) && nameB.includes(d1)) ||
      (nameA.includes(d1) && nameB.includes(d0)) ||
      (d0 === nameA && d1 === nameB) ||
      (d0 === nameB && d1 === nameA)
    )
  })

  if (match) {
    return {
      interaction_detected: true,
      drug_a: drugA,
      drug_b: drugB,
      severity: match.severity,
      risk_summary: match.risk,
      clinical_recommendation: match.recommendation,
    }
  }

  return {
    interaction_detected: false,
    drug_a: drugA,
    drug_b: drugB,
    severity: "none",
    risk_summary: "No critical drug-drug interaction found in knowledge base.",
    clinical_recommendation: "Standard administration guidelines apply; observe routine patient monitoring.",
  }
}

/**
 * Quick prompt templates for lecture context
 */
export const QUICK_PROMPTS = [
  {
    id: "mechanism",
    label_en: "Explain mechanism in simple terms",
    label_ar: "شرح آلية العمل بأسلوب مبسط",
    prompt_en: "Explain the biochemical mechanism of action and receptor kinetics in clear clinical terms.",
    prompt_ar: "اشرح آلية العمل الدوائي وحركية المستقبلات بأسلوب سريري مبسط وواضح.",
  },
  {
    id: "contraindications",
    label_en: "Highlight clinical contraindications",
    label_ar: "أبرز موانع الاستعمال السريرية",
    prompt_en: "What are the absolute and relative clinical contraindications, high-risk populations, and pregnancy categories?",
    prompt_ar: "ما هي موانع الاستعمال المطلقة والنسبية، وفئات المرضى عالية الخطورة وتصنيف الحمل؟",
  },
  {
    id: "side_effects",
    label_en: "Key side effects & monitoring parameters",
    label_ar: "الآثار الجانبية ومعايير المراقبة",
    prompt_en: "List the primary adverse effects, therapeutic index risks, and recommended laboratory monitoring parameters.",
    prompt_ar: "اذكر الآثار الجانبية الرئيسية، ومخاطر النطاق العلاجي الضيق، ومعايير المراقبة المخبرية الموصى بها.",
  },
  {
    id: "renal_dosing",
    label_en: "Dosing in renal impairment",
    label_ar: "تعديل الجرعات في القصور الكلوي",
    prompt_en: "Detail the dose adjustments and interval modifications required across CKD stages (1-5) and dialysis.",
    prompt_ar: "فصّل تعديلات الجرعات والفترات الزمنية المطلوبة عبر مراحل القصور الكلوي المختلفة وغسيل الكلى.",
  },
]

/**
 * Handles `/api/ai/consult` Hybrid Clinical Assistant API logic
 */
export function handleAIConsultRequest(reqBody: unknown): {
  status: "success" | "error"
  tool_type: string
  data?: unknown
  clinical_guidance: string
  lecture_id?: string | null
} {
  if (!reqBody || typeof reqBody !== "object") {
    throw new Error("Invalid consultation request body")
  }

  const { tool_type, prompt, context } = reqBody as AIConsultRequest

  if (!tool_type || !["general_consult", "dose_calculator", "interaction_checker", "lecture_qa"].includes(tool_type)) {
    throw new Error(`Invalid tool_type: "${tool_type}"`)
  }

  if (tool_type === "dose_calculator") {
    const patientData = context?.patient_data
    if (!patientData) {
      throw new Error("Dose calculator requires context.patient_data")
    }

    if (patientData.serum_creatinine_mg_dl !== undefined) {
      const crclResult = calculateCockcroftGaultCrCl({
        age: patientData.age ?? 65,
        weight_kg: patientData.weight_kg ?? 70,
        serum_creatinine_mg_dl: patientData.serum_creatinine_mg_dl,
        gender: patientData.gender ?? "male",
        drug: (patientData.drug_a as string) || (patientData.indication as string),
      })
      let guidance = `Calculated CrCl is ${crclResult.crcl_ml_min} mL/min (${crclResult.staging}). ${crclResult.interpretation}`
      if (crclResult.drug_adjustment) {
        guidance += ` Drug Guidance: ${crclResult.drug_adjustment.recommendation}`
      }
      return {
        status: "success",
        tool_type,
        data: crclResult,
        clinical_guidance: guidance,
      }
    }

    if (patientData.weight_kg !== undefined && patientData.age !== undefined && patientData.age < 18) {
      const pedResult = calculatePediatricDose({
        method: (patientData.method as "weight_based" | "clark" | "young") || "weight_based",
        weight_kg: patientData.weight_kg,
        age_years: patientData.age,
        dose_per_kg: (patientData.dose_per_kg as number) || 10,
        adult_dose: (patientData.adult_dose as number) || 500,
        max_adult_dose: (patientData.max_adult_dose as number) || 500,
        drug: patientData.drug_a as string,
      })
      return {
        status: "success",
        tool_type,
        data: pedResult,
        clinical_guidance: `Pediatric Dose: ${pedResult.calculated_dose} ${pedResult.unit} (${pedResult.notes}). ${pedResult.capped_at_adult_max ? "Note: Dose capped at maximum adult dose." : ""}`,
      }
    }
  }

  if (tool_type === "interaction_checker") {
    const patientData = context?.patient_data
    if (!patientData?.drug_a || !patientData?.drug_b) {
      throw new Error("Interaction checker requires context.patient_data.drug_a and drug_b")
    }
    const ddiResult = checkDrugInteractions(patientData.drug_a, patientData.drug_b)
    return {
      status: "success",
      tool_type,
      data: ddiResult,
      clinical_guidance: `Interaction Severity: ${ddiResult.severity.toUpperCase()}. ${ddiResult.risk_summary} Recommendation: ${ddiResult.clinical_recommendation}`,
    }
  }

  if (tool_type === "lecture_qa") {
    const lectureTitle = context?.lecture_title || "Pharmacology Lecture"
    const objectives = context?.objectives || []
    const objectivesText = objectives.length ? ` covering [${objectives.join(", ")}]` : ""
    return {
      status: "success",
      tool_type,
      lecture_id: context?.lecture_id || null,
      clinical_guidance: `Contextual clinical insights for "${lectureTitle}"${objectivesText}: In response to "${prompt}", evidence-based clinical guidelines highlight mechanism of action and receptor kinetics.`,
    }
  }

  // general_consult
  return {
    status: "success",
    tool_type: "general_consult",
    clinical_guidance: `Clinical pharmacology assessment for "${prompt}": Verify drug indications, contraindications, and patient renal/hepatic clearance pathways.`,
  }
}
