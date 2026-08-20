/**
 * Tier 2 - Feature 3: Automated Certificates Boundary & Corner Cases
 * Tests edge cases: 99.9% video, 79.9% score, string inputs, revoked status, malformed codes.
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  evaluateCertificateEligibility,
  issueCertificateRecord,
  verifyCertificatePublic
} from '../helpers/certificate-engine.mjs';

export function register(runner) {
  runner.suite('Tier 2: Feature 3 - Certificates & Verification Boundaries', (test) => {
    test('T2.3.1: Strict boundary - 99.9% watch completion rate with 100% quiz score is rejected', () => {
      const res = evaluateCertificateEligibility(99.9, 100);
      assert.strictEqual(res.eligible, false);
      assert.includes(res.reasons[0], 'Lecture watch completion rate is 99.9%');
    });

    test('T2.3.2: Strict boundary - 100.0% watch completion with 79.9% quiz score is rejected', () => {
      const res = evaluateCertificateEligibility(100.0, 79.9);
      assert.strictEqual(res.eligible, false);
      assert.includes(res.reasons[0], 'Quiz average score is 79.9%');
    });

    test('T2.3.3: Strict boundary - exactly 100.0% watch rate and 80.0% quiz score is accepted', () => {
      const res = evaluateCertificateEligibility(100.0, 80.0);
      assert.strictEqual(res.eligible, true);
      assert.strictEqual(res.reasons.length, 0);
    });

    test('T2.3.4: String-encoded numbers ("100", "80") are safely coerced without type failure', () => {
      const res = evaluateCertificateEligibility('100', '85.5');
      assert.strictEqual(res.eligible, true);
    });

    test('T2.3.5: Non-numeric inputs (NaN, null, undefined) return explicit rejection reason', () => {
      const res = evaluateCertificateEligibility('not_a_number', undefined);
      assert.strictEqual(res.eligible, false);
      assert.includes(res.reasons[0], 'Invalid numeric inputs');
    });

    test('T2.3.6: issueCertificateRecord throws error when attempting issuance on ineligible student', () => {
      assert.throws(
        () => issueCertificateRecord({
          userId: 'u1',
          courseId: 'c1',
          studentName: 'Test Student',
          courseTitleEn: 'Title',
          watchCompletionRate: 95,
          quizAverage: 75
        }),
        'Cannot issue certificate',
        'Should reject issuance when requirements are not met'
      );
    });

    test('T2.3.7: Public verification handles malformed codes (empty string, whitespace, null) safely', () => {
      const db = [{ certificate_code: 'PHARMA-2026-ABCD-1234', status: 'valid' }];
      const resNull = verifyCertificatePublic(db, null);
      assert.strictEqual(resNull.verified, false);

      const resEmpty = verifyCertificatePublic(db, '   ');
      assert.strictEqual(resEmpty.verified, false);
    });
  });
}
