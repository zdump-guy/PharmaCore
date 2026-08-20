/**
 * Tier 2 - Feature 5: Clinical Assistant & Dose Calculators Boundaries
 * Tests edge cases: extreme elderly, high creatinine, pediatric max dose capping, DDI normalization.
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  calculateCockcroftGaultCrCl,
  calculatePediatricDose,
  checkDrugInteractions,
  handleAIConsultRequest
} from '../helpers/clinical-calc-engine.mjs';

export function register(runner) {
  runner.suite('Tier 2: Feature 5 - Clinical Assistant Boundaries', (test) => {
    test('T2.5.1: Extreme elderly (95yo) with elevated creatinine (6.5 mg/dL) calculates Stage 5 without crash', () => {
      // 95yo female, 45kg, SCr 6.5 mg/dL
      const res = calculateCockcroftGaultCrCl({
        age: 95,
        weight_kg: 45,
        serum_creatinine_mg_dl: 6.5,
        gender: 'female'
      });
      // (140 - 95) * 45 / (72 * 6.5) * 0.85 = 45 * 45 / 468 * 0.85 = 2025 / 468 * 0.85 = 4.33 * 0.85 = 3.68 mL/min
      assert.almostEqual(res.crcl_ml_min, 3.68, 0.05);
      assert.includes(res.staging, 'Stage 5');
    });

    test('T2.5.2: Invalid physiological inputs (negative age, 0 weight, 0 creatinine) throw explicit errors', () => {
      assert.throws(
        () => calculateCockcroftGaultCrCl({ age: -5, weight_kg: 70, serum_creatinine_mg_dl: 1.0, gender: 'male' }),
        'Invalid age'
      );
      assert.throws(
        () => calculateCockcroftGaultCrCl({ age: 40, weight_kg: 0, serum_creatinine_mg_dl: 1.0, gender: 'male' }),
        'Invalid weight'
      );
      assert.throws(
        () => calculateCockcroftGaultCrCl({ age: 40, weight_kg: 70, serum_creatinine_mg_dl: 0, gender: 'male' }),
        'Invalid serum creatinine'
      );
      assert.throws(
        () => calculateCockcroftGaultCrCl({ age: 40, weight_kg: 70, serum_creatinine_mg_dl: 1.0, gender: 'other' }),
        'Invalid gender'
      );
    });

    test('T2.5.3: Pediatric weight-based dose caps strictly at adult maximum dose', () => {
      // 40kg child * 20mg/kg = 800mg, but max adult dose is 500mg
      const res = calculatePediatricDose({
        method: 'weight_based',
        weight_kg: 40,
        dose_per_kg: 20,
        max_adult_dose: 500
      });
      assert.strictEqual(res.calculated_dose, 500);
      assert.strictEqual(res.capped_at_adult_max, true);
    });

    test('T2.5.4: DDI checker normalizes drug names (case-insensitive and leading/trailing whitespace)', () => {
      const res1 = checkDrugInteractions('  WARFARIN  ', '  aSpIrIn ');
      assert.strictEqual(res1.interaction_detected, true);
      assert.strictEqual(res1.severity, 'major');

      // Inverted order
      const res2 = checkDrugInteractions('Aspirin', 'Warfarin');
      assert.strictEqual(res2.interaction_detected, true);
    });

    test('T2.5.5: DDI checker handles unlisted benign drugs safely without throwing', () => {
      const res = checkDrugInteractions('Ascorbic Acid', 'Calcium Carbonate');
      assert.strictEqual(res.interaction_detected, false);
      assert.strictEqual(res.severity, 'none');
    });

    test('T2.5.6: handleAIConsultRequest rejects invalid tool types or missing payload', () => {
      assert.throws(
        () => handleAIConsultRequest(null),
        'Invalid consultation request'
      );
      assert.throws(
        () => handleAIConsultRequest({ tool_type: 'unsupported_tool' }),
        'Invalid tool_type'
      );
      assert.throws(
        () => handleAIConsultRequest({ tool_type: 'dose_calculator', context: {} }),
        'requires context.patient_data'
      );
    });
  });
}
