/**
 * Tier 1 - Feature 5: Hybrid AI Clinical Assistant & Dose Calculators
 * Verifies Cockcroft-Gault CrCl, Pediatric formulas, DDI checks, and AI consult dispatch.
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  calculateCockcroftGaultCrCl,
  calculatePediatricDose,
  checkDrugInteractions,
  handleAIConsultRequest
} from '../helpers/clinical-calc-engine.mjs';

export function register(runner) {
  runner.suite('Tier 1: Feature 5 - AI Clinical Assistant & Calculators', (test) => {
    test('T1.5.1: Cockcroft-Gault calculates standard male renal clearance accurately', () => {
      // 60yo male, 70kg, SCr = 1.0 mg/dL: (140 - 60) * 70 / (72 * 1.0) = 5600 / 72 = 77.78 mL/min
      const result = calculateCockcroftGaultCrCl({
        age: 60,
        weight_kg: 70,
        serum_creatinine_mg_dl: 1.0,
        gender: 'male'
      });
      assert.almostEqual(result.crcl_ml_min, 77.78, 0.05);
      assert.includes(result.staging, 'Stage 2');
    });

    test('T1.5.2: Cockcroft-Gault applies 0.85 female adjustment coefficient', () => {
      // 60yo female, 70kg, SCr = 1.0 mg/dL: 77.78 * 0.85 = 66.11 mL/min
      const result = calculateCockcroftGaultCrCl({
        age: 60,
        weight_kg: 70,
        serum_creatinine_mg_dl: 1.0,
        gender: 'female'
      });
      assert.almostEqual(result.crcl_ml_min, 66.11, 0.05);
    });

    test('T1.5.3: Severe renal impairment (CrCl < 30 mL/min) identifies Stage 4 and clinical guidance', () => {
      // 75yo male, 60kg, SCr = 2.5 mg/dL: (140 - 75) * 60 / (72 * 2.5) = 3900 / 180 = 21.67 mL/min
      const result = calculateCockcroftGaultCrCl({
        age: 75,
        weight_kg: 60,
        serum_creatinine_mg_dl: 2.5,
        gender: 'male'
      });
      assert.almostEqual(result.crcl_ml_min, 21.67, 0.05);
      assert.includes(result.staging, 'Stage 4');
      assert.includes(result.interpretation, 'avoid nephrotoxic agents');
    });

    test('T1.5.4: Pediatric dosing calculates weight-based and Clark rule recommendations', () => {
      // Weight-based: 15kg child * 10mg/kg = 150mg
      const wtDose = calculatePediatricDose({
        method: 'weight_based',
        weight_kg: 15,
        dose_per_kg: 10,
        max_adult_dose: 500
      });
      assert.strictEqual(wtDose.calculated_dose, 150);

      // Clark's rule: (14kg / 70kg) * 500mg adult dose = 100mg
      const clarkDose = calculatePediatricDose({
        method: 'clark',
        weight_kg: 14,
        adult_dose: 500
      });
      assert.strictEqual(clarkDose.calculated_dose, 100);
    });

    test('T1.5.5: DDI checker detects contraindicated drug pairs and rhabdomyolysis risks', () => {
      const simvaClarithro = checkDrugInteractions('Simvastatin', 'Clarithromycin');
      assert.strictEqual(simvaClarithro.interaction_detected, true);
      assert.strictEqual(simvaClarithro.severity, 'contraindicated');
      assert.includes(simvaClarithro.risk_summary, 'rhabdomyolysis');

      const sildenafilNitro = checkDrugInteractions('Sildenafil', 'Nitroglycerin');
      assert.strictEqual(sildenafilNitro.interaction_detected, true);
      assert.strictEqual(sildenafilNitro.severity, 'contraindicated');
      assert.includes(sildenafilNitro.risk_summary, 'hypotension');

      const safePair = checkDrugInteractions('Paracetamol', 'Amoxicillin');
      assert.strictEqual(safePair.interaction_detected, false);
      assert.strictEqual(safePair.severity, 'none');
    });

    test('T1.5.6: handleAIConsultRequest processes structured tool queries properly', () => {
      const resp = handleAIConsultRequest({
        tool_type: 'dose_calculator',
        prompt: 'Calculate dose for renal patient',
        context: {
          patient_data: {
            age: 65,
            weight_kg: 80,
            serum_creatinine_mg_dl: 1.2,
            gender: 'male'
          }
        }
      });
      assert.strictEqual(resp.status, 'success');
      assert.ok(resp.data.crcl_ml_min > 0);
      assert.includes(resp.clinical_guidance, 'Calculated CrCl is');
    });
  });
}
