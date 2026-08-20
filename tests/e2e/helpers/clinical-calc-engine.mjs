/**
 * Clinical Pharmacology Calculations & AI Assistant Engine
 * Conforms to ORIGINAL_REQUEST § R4 and PROJECT.md § Milestone 5
 */

/**
 * Calculates Creatinine Clearance (CrCl) using the Cockcroft-Gault Equation:
 *
 * CrCl (mL/min) = [ (140 - Age) * Weight (kg) ] / [ 72 * Serum Creatinine (mg/dL) ]
 * * 0.85 if Female
 *
 * @param {Object} params
 * @param {number} params.age - Patient age in years
 * @param {number} params.weight_kg - Patient total body weight in kilograms
 * @param {number} params.serum_creatinine_mg_dl - Serum creatinine in mg/dL
 * @param {'male'|'female'} params.gender - Patient biological sex
 * @returns {Object} { crcl_ml_min: number, staging: string, interpretation: string }
 */
export function calculateCockcroftGaultCrCl({ age, weight_kg, serum_creatinine_mg_dl, gender }) {
  if (typeof age !== 'number' || age <= 0 || age > 130) {
    throw new Error('Invalid age: must be between 1 and 130 years');
  }
  if (typeof weight_kg !== 'number' || weight_kg <= 0 || weight_kg > 500) {
    throw new Error('Invalid weight: must be positive number up to 500 kg');
  }
  if (typeof serum_creatinine_mg_dl !== 'number' || serum_creatinine_mg_dl <= 0 || serum_creatinine_mg_dl > 30) {
    throw new Error('Invalid serum creatinine: must be positive number (mg/dL)');
  }
  if (gender !== 'male' && gender !== 'female') {
    throw new Error('Invalid gender: must be "male" or "female"');
  }

  const genderFactor = gender === 'female' ? 0.85 : 1.0;
  const rawCrCl = ((140 - age) * weight_kg) / (72 * serum_creatinine_mg_dl) * genderFactor;
  const crcl = Math.round(rawCrCl * 100) / 100;

  let staging = '';
  let interpretation = '';

  if (crcl >= 90) {
    staging = 'Normal / Stage 1';
    interpretation = 'Normal renal function. Standard dosing usually appropriate.';
  } else if (crcl >= 60) {
    staging = 'Mild Impairment / Stage 2';
    interpretation = 'Mild decrease in GFR. Minor dose adjustments may be required for narrow therapeutic index drugs.';
  } else if (crcl >= 30) {
    staging = 'Moderate Impairment / Stage 3';
    interpretation = 'Moderate decrease in GFR. Dose reduction or interval extension required for renally eliminated drugs.';
  } else if (crcl >= 15) {
    staging = 'Severe Impairment / Stage 4';
    interpretation = 'Severe decrease in GFR. Significant dose adjustments required; avoid nephrotoxic agents.';
  } else {
    staging = 'Kidney Failure / Stage 5 (ESRD)';
    interpretation = 'End-stage renal disease. Dialysis support required; extreme caution with all renally cleared pharmaceuticals.';
  }

  return {
    crcl_ml_min: crcl,
    staging,
    interpretation,
    parameters_used: { age, weight_kg, serum_creatinine_mg_dl, gender, gender_factor: genderFactor }
  };
}

/**
 * Calculates Pediatric Doses using standard formulas
 * @param {Object} params
 * @param {string} params.method - 'weight_based' | 'clark' | 'young'
 * @param {number} [params.weight_kg]
 * @param {number} [params.age_years]
 * @param {number} [params.dose_per_kg]
 * @param {number} [params.adult_dose]
 * @param {number} [params.max_adult_dose]
 * @returns {Object} Calculated pediatric dose recommendations
 */
export function calculatePediatricDose({ method, weight_kg, age_years, dose_per_kg, adult_dose, max_adult_dose }) {
  if (method === 'weight_based') {
    if (!weight_kg || !dose_per_kg) {
      throw new Error('Weight-based dosing requires weight_kg and dose_per_kg');
    }
    const calculatedDose = weight_kg * dose_per_kg;
    const cappedDose = max_adult_dose ? Math.min(calculatedDose, max_adult_dose) : calculatedDose;
    return {
      method: 'weight_based',
      calculated_dose: Math.round(cappedDose * 100) / 100,
      unit: 'mg',
      capped_at_adult_max: max_adult_dose ? calculatedDose > max_adult_dose : false,
      notes: `${weight_kg}kg * ${dose_per_kg}mg/kg${max_adult_dose ? ` (Max: ${max_adult_dose}mg)` : ''}`
    };
  }

  if (method === 'clark') {
    if (!weight_kg || !adult_dose) {
      throw new Error("Clark's rule requires weight_kg and adult_dose");
    }
    // Clark's rule: (weight in kg / 70 kg) * adult dose
    const childDose = (weight_kg / 70) * adult_dose;
    return {
      method: 'clark',
      calculated_dose: Math.round(childDose * 100) / 100,
      unit: 'mg',
      notes: `(Weight ${weight_kg}kg / 70kg standard adult weight) * Adult dose ${adult_dose}mg`
    };
  }

  if (method === 'young') {
    if (!age_years || !adult_dose) {
      throw new Error("Young's rule requires age_years and adult_dose");
    }
    // Young's rule: [Age / (Age + 12)] * adult dose
    const childDose = (age_years / (age_years + 12)) * adult_dose;
    return {
      method: 'young',
      calculated_dose: Math.round(childDose * 100) / 100,
      unit: 'mg',
      notes: `[Age ${age_years} / (${age_years} + 12)] * Adult dose ${adult_dose}mg`
    };
  }

  throw new Error(`Unsupported pediatric dosing method: "${method}"`);
}

/**
 * Known Drug-Drug Interactions Database
 */
export const DDI_DATABASE = [
  {
    drugs: ['warfarin', 'aspirin'],
    severity: 'major',
    risk: 'Additive antiplatelet and anticoagulant effects significantly amplify gastrointestinal hemorrhage risk.',
    recommendation: 'Avoid combination unless indicated for specific cardiovascular conditions; monitor INR frequently.'
  },
  {
    drugs: ['simvastatin', 'clarithromycin'],
    severity: 'contraindicated',
    risk: 'Potent CYP3A4 inhibition by clarithromycin markedly increases simvastatin plasma concentrations, raising rhabdomyolysis risk.',
    recommendation: 'Temporarily discontinue simvastatin during clarithromycin course or substitute azithromycin.'
  },
  {
    drugs: ['sildenafil', 'nitroglycerin'],
    severity: 'contraindicated',
    risk: 'Synergistic cGMP accumulation causes profound, refractory systemic hypotension and cardiac arrest risk.',
    recommendation: 'Absolute contraindication. Never administer organic nitrates with PDE-5 inhibitors.'
  },
  {
    drugs: ['lisinopril', 'spironolactone'],
    severity: 'moderate',
    risk: 'Concurrent inhibition of aldosterone and angiotensin II produces additive risk of severe hyperkalemia.',
    recommendation: 'Monitor serum potassium and renal function within 1-2 weeks of initiating combination.'
  },
  {
    drugs: ['ciprofloxacin', 'theophylline'],
    severity: 'major',
    risk: 'Inhibition of CYP1A2 by ciprofloxacin reduces theophylline hepatic clearance by up to 50%, causing neuro/cardiotoxicity.',
    recommendation: 'Reduce theophylline dosage by 50% and perform therapeutic drug monitoring.'
  },
  {
    drugs: ['metformin', 'iodinated_contrast'],
    severity: 'major',
    risk: 'Potential contrast-induced acute kidney injury leads to metformin accumulation and lactic acidosis.',
    recommendation: 'Withhold metformin at time of procedure and for 48 hours post-procedure; verify renal recovery before restarting.'
  }
];

/**
 * Checks for Drug-Drug Interactions between two agents
 * @param {string} drugA - First drug name
 * @param {string} drugB - Second drug name
 * @returns {Object} Interaction assessment
 */
export function checkDrugInteractions(drugA, drugB) {
  if (!drugA || !drugB || typeof drugA !== 'string' || typeof drugB !== 'string') {
    throw new Error('Two valid drug names are required');
  }

  const nameA = drugA.trim().toLowerCase();
  const nameB = drugB.trim().toLowerCase();

  const match = DDI_DATABASE.find(item => {
    return (item.drugs[0] === nameA && item.drugs[1] === nameB) ||
           (item.drugs[0] === nameB && item.drugs[1] === nameA);
  });

  if (match) {
    return {
      interaction_detected: true,
      drug_a: drugA,
      drug_b: drugB,
      severity: match.severity,
      risk_summary: match.risk,
      clinical_recommendation: match.recommendation
    };
  }

  return {
    interaction_detected: false,
    drug_a: drugA,
    drug_b: drugB,
    severity: 'none',
    risk_summary: 'No critical drug-drug interaction found in knowledge base.',
    clinical_recommendation: 'Standard administration guidelines apply; observe routine patient monitoring.'
  };
}

/**
 * Handles `/api/ai/consult` Hybrid Clinical Assistant API logic
 * @param {Object} reqBody - Request body conforming to AIConsultRequest
 * @returns {Object} Structured clinical consultation response
 */
export function handleAIConsultRequest(reqBody) {
  if (!reqBody || typeof reqBody !== 'object') {
    throw new Error('Invalid consultation request body');
  }

  const { tool_type, prompt, context } = reqBody;

  if (!tool_type || !['general_consult', 'dose_calculator', 'interaction_checker', 'lecture_qa'].includes(tool_type)) {
    throw new Error(`Invalid tool_type: "${tool_type}"`);
  }

  if (tool_type === 'dose_calculator') {
    const patientData = context?.patient_data;
    if (!patientData) {
      throw new Error('Dose calculator requires context.patient_data');
    }
    if (patientData.serum_creatinine_mg_dl !== undefined) {
      const crclResult = calculateCockcroftGaultCrCl({
        age: patientData.age || 65,
        weight_kg: patientData.weight_kg || 70,
        serum_creatinine_mg_dl: patientData.serum_creatinine_mg_dl,
        gender: patientData.gender || 'male'
      });
      return {
        status: 'success',
        tool_type,
        data: crclResult,
        clinical_guidance: `Calculated CrCl is ${crclResult.crcl_ml_min} mL/min (${crclResult.staging}). ${crclResult.interpretation}`
      };
    }
  }

  if (tool_type === 'interaction_checker') {
    const patientData = context?.patient_data;
    if (!patientData?.drug_a || !patientData?.drug_b) {
      throw new Error('Interaction checker requires context.patient_data.drug_a and drug_b');
    }
    const ddiResult = checkDrugInteractions(patientData.drug_a, patientData.drug_b);
    return {
      status: 'success',
      tool_type,
      data: ddiResult,
      clinical_guidance: `Interaction Severity: ${ddiResult.severity.toUpperCase()}. ${ddiResult.risk_summary} Recommendation: ${ddiResult.clinical_recommendation}`
    };
  }

  if (tool_type === 'lecture_qa') {
    const lectureTitle = context?.lecture_title || 'Pharmacology Lecture';
    const objectives = context?.objectives || [];
    return {
      status: 'success',
      tool_type,
      lecture_id: context?.lecture_id || null,
      clinical_guidance: `Contextual clinical insights for "${lectureTitle}" covering [${objectives.join(', ')}]: In response to "${prompt}", evidence-based clinical guidelines highlight mechanism of action and receptor kinetics.`
    };
  }

  // general_consult
  return {
    status: 'success',
    tool_type: 'general_consult',
    clinical_guidance: `Clinical pharmacology assessment for "${prompt}": Verify drug indications, contraindications, and patient renal/hepatic clearance pathways.`
  };
}
