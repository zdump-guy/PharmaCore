/**
 * Tier 1 - Feature 3: Automated Certificates & Public Verification
 * Verifies mastery criteria evaluation, code generation, and public verification rules.
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  evaluateCertificateEligibility,
  generateCertificateCode,
  issueCertificateRecord,
  verifyCertificatePublic
} from '../helpers/certificate-engine.mjs';

export function register(runner) {
  runner.suite('Tier 1: Feature 3 - Automated Certificates & Verification', (test) => {
    test('T1.3.1: Eligibility evaluation qualifies student meeting 100% watch rate and >=80% quiz score', () => {
      const result = evaluateCertificateEligibility(100, 85);
      assert.strictEqual(result.eligible, true);
      assert.strictEqual(result.reasons.length, 0);
    });

    test('T1.3.2: Eligibility evaluation rejects student with 100% watch rate but <80% quiz score', () => {
      const result = evaluateCertificateEligibility(100, 78);
      assert.strictEqual(result.eligible, false);
      assert.includes(result.reasons[0], 'Quiz average score is 78.0% (requires minimum 80.0%)');
    });

    test('T1.3.3: Eligibility evaluation rejects student with <100% watch rate even with 100% quiz score', () => {
      const result = evaluateCertificateEligibility(90, 100);
      assert.strictEqual(result.eligible, false);
      assert.includes(result.reasons[0], 'Lecture watch completion rate is 90.0% (requires exactly 100%)');
    });

    test('T1.3.4: issueCertificateRecord generates valid record with standardized code format', () => {
      const cert = issueCertificateRecord({
        userId: 'usr_sarah_101',
        courseId: 'crs_cardio_pharm',
        studentName: 'Sarah Al-Mansoor',
        courseTitleEn: 'Clinical Cardiovascular Pharmacology',
        courseTitleAr: 'علم الأدوية السريرية للقلب والأوعية الدموية',
        watchCompletionRate: 100,
        quizAverage: 92.5
      });

      assert.strictEqual(cert.student_name, 'Sarah Al-Mansoor');
      assert.strictEqual(cert.final_score, 92.5);
      assert.strictEqual(cert.watch_completion_rate, 100);
      assert.strictEqual(cert.status, 'valid');
      assert.match(cert.certificate_code, /^PHARMA-\d{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);
    });

    test('T1.3.5: verifyCertificatePublic verifies valid certificate and returns full metadata', () => {
      const db = [
        {
          id: 'cert_1',
          certificate_code: 'PHARMA-2026-A1B2-C3D4',
          user_id: 'usr_1',
          course_id: 'crs_1',
          student_name: 'Dr. Tariq Hassan',
          course_title_en: 'Advanced Neuropharmacology',
          course_title_ar: 'علم الأدوية العصبية المتقدم',
          issue_date: '2026-08-20T12:00:00Z',
          final_score: 88,
          watch_completion_rate: 100,
          status: 'valid'
        }
      ];

      const lookup = verifyCertificatePublic(db, 'PHARMA-2026-A1B2-C3D4');
      assert.strictEqual(lookup.verified, true);
      assert.strictEqual(lookup.error, null);
      assert.strictEqual(lookup.certificate.student_name, 'Dr. Tariq Hassan');
      assert.strictEqual(lookup.certificate.course_title_en, 'Advanced Neuropharmacology');
      assert.strictEqual(lookup.certificate.final_score, 88);
    });

    test('T1.3.6: verifyCertificatePublic rejects unknown or revoked certificate code', () => {
      const db = [
        {
          id: 'cert_revoked',
          certificate_code: 'PHARMA-2026-REV0-0001',
          user_id: 'usr_2',
          student_name: 'Revoked Student',
          status: 'revoked'
        }
      ];

      const revokedCheck = verifyCertificatePublic(db, 'PHARMA-2026-REV0-0001');
      assert.strictEqual(revokedCheck.verified, false);
      assert.includes(revokedCheck.error, 'has been revoked');

      const notFoundCheck = verifyCertificatePublic(db, 'PHARMA-9999-FAKE-CODE');
      assert.strictEqual(notFoundCheck.verified, false);
      assert.includes(notFoundCheck.error, 'Certificate not found');
    });
  });
}
