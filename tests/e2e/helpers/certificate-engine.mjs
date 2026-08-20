/**
 * Certificate Mastery Evaluation & Public Verification Engine
 * Conforms to ORIGINAL_REQUEST § R3 and PROJECT.md § Interface Contracts
 */

/**
 * Evaluates whether a student meets the strict mastery criteria for certificate issuance:
 * - 100% video/lecture watch completion rate (watchCompletionRate === 100)
 * - >= 80% overall quiz average score (quizAverage >= 80)
 *
 * @param {number} watchCompletionRate - 0 to 100 percentage
 * @param {number} quizAverage - 0 to 100 percentage
 * @returns {{ eligible: boolean, reasons: string[] }}
 */
export function evaluateCertificateEligibility(watchCompletionRate, quizAverage) {
  const reasons = [];

  // Sanitize and validate inputs
  const watchRate = Number(watchCompletionRate);
  const quizScore = Number(quizAverage);

  if (isNaN(watchRate) || isNaN(quizScore)) {
    return {
      eligible: false,
      reasons: ['Invalid numeric inputs for completion rate or quiz score']
    };
  }

  if (watchRate < 100) {
    reasons.push(`Lecture watch completion rate is ${watchRate.toFixed(1)}% (requires exactly 100%)`);
  }

  if (quizScore < 80) {
    reasons.push(`Quiz average score is ${quizScore.toFixed(1)}% (requires minimum 80.0%)`);
  }

  const eligible = reasons.length === 0;

  return {
    eligible,
    reasons
  };
}

/**
 * Generates a unique, standardized certificate verification code
 * Format: PHARMA-YYYY-XXXX-XXXX
 *
 * @param {string} courseId
 * @param {string} userId
 * @param {Date} [issueDate]
 * @returns {string} Standardized certificate code
 */
export function generateCertificateCode(courseId, userId, issueDate = new Date()) {
  const year = issueDate.getFullYear();
  // Deterministic seed / random alphanumeric chunk
  const rawSeed = `${courseId}:${userId}:${issueDate.getTime()}`;
  let hash = 0;
  for (let i = 0; i < rawSeed.length; i++) {
    hash = (hash << 5) - hash + rawSeed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  const part1 = hex.slice(0, 4);
  const part2 = hex.slice(4, 8);

  return `PHARMA-${year}-${part1}-${part2}`;
}

/**
 * Creates an authoritative certificate record
 * @param {Object} params
 * @returns {Object} CertificateRecord
 */
export function issueCertificateRecord({
  id,
  userId,
  courseId,
  studentName,
  courseTitleEn,
  courseTitleAr = '',
  watchCompletionRate,
  quizAverage,
  issueDate = new Date().toISOString()
}) {
  const eligibility = evaluateCertificateEligibility(watchCompletionRate, quizAverage);
  if (!eligibility.eligible) {
    throw new Error(`Cannot issue certificate: ${eligibility.reasons.join(', ')}`);
  }

  const certificateCode = generateCertificateCode(courseId, userId, new Date(issueDate));

  return {
    id: id || `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    certificate_code: certificateCode,
    user_id: userId,
    course_id: courseId,
    student_name: studentName,
    course_title_en: courseTitleEn,
    course_title_ar: courseTitleAr,
    issue_date: issueDate,
    final_score: quizAverage,
    watch_completion_rate: watchCompletionRate,
    status: 'valid' // 'valid' | 'revoked'
  };
}

/**
 * Public certificate verification engine for /verify/[code]
 * @param {Object[]} certificateDatabase - Array of certificate records
 * @param {string} code - The code provided in URL query / QR scan
 * @returns {{ verified: boolean, certificate: Object|null, error: string|null }}
 */
export function verifyCertificatePublic(certificateDatabase, code) {
  if (!code || typeof code !== 'string') {
    return {
      verified: false,
      certificate: null,
      error: 'Missing or invalid certificate verification code'
    };
  }

  const normalizedCode = code.trim().toUpperCase();
  const record = certificateDatabase.find(c => c.certificate_code.toUpperCase() === normalizedCode);

  if (!record) {
    return {
      verified: false,
      certificate: null,
      error: 'Certificate not found with the provided verification code'
    };
  }

  if (record.status === 'revoked') {
    return {
      verified: false,
      certificate: record,
      error: 'This certificate has been revoked by administration'
    };
  }

  if (record.status !== 'valid') {
    return {
      verified: false,
      certificate: record,
      error: `Certificate status is invalid (${record.status})`
    };
  }

  return {
    verified: true,
    certificate: {
      certificate_code: record.certificate_code,
      student_name: record.student_name,
      course_title_en: record.course_title_en,
      course_title_ar: record.course_title_ar,
      issue_date: record.issue_date,
      final_score: record.final_score,
      watch_completion_rate: record.watch_completion_rate,
      status: record.status
    },
    error: null
  };
}
