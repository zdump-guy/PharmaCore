import assert from "node:assert"
import {
  evaluateCertificateEligibility,
  generateCertificateCode,
  issueCertificateRecord,
  verifyCertificatePublic,
  getDaysDifference,
  recordUserActivity,
  evaluateMilestoneBadges,
  BADGE_DEFINITIONS,
  lookupCertificateByCode
} from "../../lib/certificates"
import {
  getQRCodeDataUrl,
  buildCertificatePdfBuffer
} from "../../lib/certificatePdf"

console.log("=================================================================")
console.log("=== MILESTONE M4 FORENSIC AUDIT EMPIRICAL TEST SUITE ==========")
console.log("=================================================================")

let passedTests = 0
let totalTests = 0

function runTest(name: string, fn: () => void | Promise<void>) {
  totalTests++
  try {
    const res = fn()
    if (res instanceof Promise) {
      return res.then(() => {
        passedTests++
        console.log(`[PASS] ${name}`)
      }).catch((err) => {
        console.error(`[FAIL] ${name}:`, err)
        throw err
      })
    } else {
      passedTests++
      console.log(`[PASS] ${name}`)
    }
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err)
    throw err
  }
}

async function main() {
  // ── TEST GROUP 1: Mastery Criteria & Eligibility Engine ─────────────────────
  console.log("\n--- TEST GROUP 1: Mastery Criteria & Eligibility ---")

  runTest("Exact threshold: 100% watch rate and 80.0% quiz score -> ELIGIBLE", () => {
    const res = evaluateCertificateEligibility(100, 80)
    assert.strictEqual(res.eligible, true)
    assert.strictEqual(res.reasons.length, 0)
  })

  runTest("Above threshold: 100% watch rate and 95.5% quiz score -> ELIGIBLE", () => {
    const res = evaluateCertificateEligibility(100, 95.5)
    assert.strictEqual(res.eligible, true)
    assert.strictEqual(res.reasons.length, 0)
  })

  runTest("Below watch threshold: 99.9% watch rate and 100% quiz score -> NOT ELIGIBLE", () => {
    const res = evaluateCertificateEligibility(99.9, 100)
    assert.strictEqual(res.eligible, false)
    assert.strictEqual(res.reasons.length, 1)
    assert.match(res.reasons[0], /requires exactly 100%/)
  })

  runTest("Below quiz threshold: 100% watch rate and 79.9% quiz score -> NOT ELIGIBLE", () => {
    const res = evaluateCertificateEligibility(100, 79.9)
    assert.strictEqual(res.eligible, false)
    assert.strictEqual(res.reasons.length, 1)
    assert.match(res.reasons[0], /requires minimum 80.0%/)
  })

  runTest("Both fail: 50% watch rate and 60% quiz score -> NOT ELIGIBLE with 2 reasons", () => {
    const res = evaluateCertificateEligibility(50, 60)
    assert.strictEqual(res.eligible, false)
    assert.strictEqual(res.reasons.length, 2)
  })

  runTest("Invalid / NaN input handling", () => {
    const res = evaluateCertificateEligibility("abc", 85)
    assert.strictEqual(res.eligible, false)
    assert.strictEqual(res.reasons[0], "Invalid numeric inputs for completion rate or quiz score")
  })

  // ── TEST GROUP 2: Certificate Code Generation & Issuance ───────────────────
  console.log("\n--- TEST GROUP 2: Code Generation & Record Issuance ---")

  runTest("Code format conforms to PHARMA-YYYY-XXXX-XXXX", () => {
    const code = generateCertificateCode("course-123", "user-456", new Date("2026-08-20T12:00:00Z"))
    assert.match(code, /^PHARMA-2026-[0-9A-F]{4}-[0-9A-F]{4}$/)
  })

  runTest("Distinct codes for different inputs", () => {
    const code1 = generateCertificateCode("course-1", "user-1", new Date(1000000000000))
    const code2 = generateCertificateCode("course-2", "user-2", new Date(2000000000000))
    assert.notStrictEqual(code1, code2)
  })

  runTest("issueCertificateRecord produces valid certificate when eligible", () => {
    const cert = issueCertificateRecord({
      userId: "usr_auditor_1",
      courseId: "crs_neuro_101",
      studentName: "Dr. Forensic Auditor",
      courseTitleEn: "Clinical Neuropharmacology",
      courseTitleAr: "علم الأدوية العصبية السريري",
      watchCompletionRate: 100,
      quizAverage: 92.5
    })
    assert.strictEqual(cert.user_id, "usr_auditor_1")
    assert.strictEqual(cert.course_id, "crs_neuro_101")
    assert.strictEqual(cert.student_name, "Dr. Forensic Auditor")
    assert.strictEqual(cert.watch_completion_rate, 100)
    assert.strictEqual(cert.final_score, 92.5)
    assert.strictEqual(cert.status, "valid")
    assert.match(cert.certificate_code, /^PHARMA-\d{4}-[0-9A-F]{4}-[0-9A-F]{4}$/)
  })

  runTest("issueCertificateRecord throws Error if mastery criteria not met", () => {
    assert.throws(() => {
      issueCertificateRecord({
        userId: "usr_fail_1",
        courseId: "crs_fail_1",
        studentName: "Cheating Student",
        courseTitleEn: "Fake Course",
        watchCompletionRate: 75,
        quizAverage: 85
      })
    }, /Cannot issue certificate:/)
  })

  // ── TEST GROUP 3: Public Verification Engine ──────────────────────────────
  console.log("\n--- TEST GROUP 3: Public Verification Engine ---")

  const mockDb = [
    {
      id: "cert_1",
      certificate_code: "PHARMA-2026-TEST-VALID",
      user_id: "usr_1",
      course_id: "crs_1",
      student_name: "Alice Smith",
      course_title_en: "Advanced Cardiology",
      course_title_ar: "أمراض القلب المتقدمة",
      issue_date: "2026-08-20T10:00:00Z",
      final_score: 90,
      watch_completion_rate: 100,
      status: "valid" as const,
      metadata: null
    },
    {
      id: "cert_2",
      certificate_code: "PHARMA-2026-TEST-REVK",
      user_id: "usr_2",
      course_id: "crs_2",
      student_name: "Bob Revoked",
      course_title_en: "Pharmacokinetics",
      issue_date: "2026-01-01T10:00:00Z",
      final_score: 85,
      watch_completion_rate: 100,
      status: "revoked" as const,
      metadata: null
    }
  ]

  runTest("verifyCertificatePublic: Valid certificate returns verified=true and sanitized payload", () => {
    const res = verifyCertificatePublic(mockDb, "PHARMA-2026-TEST-VALID")
    assert.strictEqual(res.verified, true)
    assert.strictEqual(res.error, null)
    assert.strictEqual(res.certificate?.student_name, "Alice Smith")
    assert.strictEqual(res.certificate?.course_title_en, "Advanced Cardiology")
  })

  runTest("verifyCertificatePublic: Case-insensitivity support", () => {
    const res = verifyCertificatePublic(mockDb, "pharma-2026-test-valid")
    assert.strictEqual(res.verified, true)
    assert.strictEqual(res.certificate?.certificate_code, "PHARMA-2026-TEST-VALID")
  })

  runTest("verifyCertificatePublic: Revoked certificate returns verified=false and revoked error", () => {
    const res = verifyCertificatePublic(mockDb, "PHARMA-2026-TEST-REVK")
    assert.strictEqual(res.verified, false)
    assert.strictEqual(res.certificate?.status, "revoked")
    assert.match(res.error || "", /revoked/i)
  })

  runTest("verifyCertificatePublic: Missing / unknown code returns verified=false and not found error", () => {
    const res = verifyCertificatePublic(mockDb, "PHARMA-DOES-NOT-EXIST")
    assert.strictEqual(res.verified, false)
    assert.strictEqual(res.certificate, null)
    assert.match(res.error || "", /not found/i)
  })

  runTest("verifyCertificatePublic: Empty / null input returns verified=false", () => {
    const res = verifyCertificatePublic(mockDb, "")
    assert.strictEqual(res.verified, false)
    assert.strictEqual(res.certificate, null)
    assert.match(res.error || "", /missing or invalid/i)
  })

  // ── TEST GROUP 4: Study Streak Tracking & Gamification Badges ──────────────
  console.log("\n--- TEST GROUP 4: Study Streaks & Gamification ---")

  runTest("Date difference calculation across calendar days", () => {
    assert.strictEqual(getDaysDifference("2026-08-19", "2026-08-20"), 1)
    assert.strictEqual(getDaysDifference("2026-08-20", "2026-08-20"), 0)
    assert.strictEqual(getDaysDifference("2026-08-15", "2026-08-20"), 5)
  })

  runTest("recordUserActivity: First activity initializes streak to 1", () => {
    const res = recordUserActivity(null, "2026-08-20")
    assert.strictEqual(res.current_streak, 1)
    assert.strictEqual(res.longest_streak, 1)
    assert.strictEqual(res.last_active_date, "2026-08-20")
  })

  runTest("recordUserActivity: Same day activity preserves streak", () => {
    const res = recordUserActivity({ current_streak: 5, longest_streak: 10, last_active_date: "2026-08-20" }, "2026-08-20")
    assert.strictEqual(res.current_streak, 5)
    assert.strictEqual(res.longest_streak, 10)
  })

  runTest("recordUserActivity: Next consecutive day activity increments streak and updates longest", () => {
    const res = recordUserActivity({ current_streak: 5, longest_streak: 5, last_active_date: "2026-08-19" }, "2026-08-20")
    assert.strictEqual(res.current_streak, 6)
    assert.strictEqual(res.longest_streak, 6)
  })

  runTest("recordUserActivity: Broken streak (> 1 day gap) resets current streak to 1 while preserving longest", () => {
    const res = recordUserActivity({ current_streak: 15, longest_streak: 20, last_active_date: "2026-08-10" }, "2026-08-20")
    assert.strictEqual(res.current_streak, 1)
    assert.strictEqual(res.longest_streak, 20)
  })

  runTest("evaluateMilestoneBadges: Correctly identifies unearned streak & mastery badges", () => {
    const badges1 = evaluateMilestoneBadges({ currentStreak: 3 }, [])
    assert.strictEqual(badges1.length, 1)
    assert.strictEqual(badges1[0].id, "streak_3")

    const badges2 = evaluateMilestoneBadges({ currentStreak: 7 }, ["streak_3"])
    assert.strictEqual(badges2.length, 1)
    assert.strictEqual(badges2[0].id, "streak_7")

    const badges3 = evaluateMilestoneBadges({ currentStreak: 30, courseCompleted: true, perfectScore: true }, ["streak_3", "streak_7"])
    assert.strictEqual(badges3.length, 3)
    const ids = badges3.map(b => b.id)
    assert.ok(ids.includes("streak_30"))
    assert.ok(ids.includes("course_mastery"))
    assert.ok(ids.includes("perfect_score"))
  })

  // ── TEST GROUP 5: QR Code Generator & PDF Binary Output ───────────────────
  console.log("\n--- TEST GROUP 5: QR Code & PDF Structure ---")

  runTest("Pure TS QR code generates valid SVG data URL with proper dimensions & XML", () => {
    const dataUrl = getQRCodeDataUrl("https://pharmacore.edu/verify/PHARMA-2026-A1B2-C3D4", 200)
    assert.ok(dataUrl.startsWith("data:image/svg+xml;base64,"))
    const base64 = dataUrl.split(",")[1]
    const svg = Buffer.from(base64, "base64").toString("utf-8")
    assert.ok(svg.includes("<svg"))
    assert.ok(svg.includes("xmlns=\"http://www.w3.org/2000/svg\""))
    assert.ok(svg.includes("viewBox=\"0 0 200 200\""))
    assert.ok(svg.includes("<path d="))
  })

  runTest("buildCertificatePdfBuffer creates valid PDF 1.4 binary structure", () => {
    // Mock canvas element structure for node environment
    const mockCanvas = {
      width: 2000,
      height: 1414,
      toDataURL: (type: string, quality: number) => {
        // Minimal valid JPEG header / fake data
        return "data:image/jpeg;base64," + Buffer.from("FAKE_JPEG_STREAM_FOR_PDF_TESTING").toString("base64")
      }
    } as any

    const blob = buildCertificatePdfBuffer(mockCanvas)
    assert.strictEqual(blob.type, "application/pdf")
    return blob.arrayBuffer().then((buf) => {
      const text = Buffer.from(buf).toString("binary")
      assert.ok(text.startsWith("%PDF-1.4\n"))
      assert.ok(text.includes("/Type /Catalog"))
      assert.ok(text.includes("/Type /Pages"))
      assert.ok(text.includes("/MediaBox [0 0 842 595]"))
      assert.ok(text.includes("/Type /XObject /Subtype /Image"))
      assert.ok(text.includes("xref\n0 6\n"))
      assert.ok(text.includes("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n"))
      assert.ok(text.endsWith("%%EOF\n"))
    })
  })

  // ── TEST GROUP 6: Fallback Database & lookupCertificateByCode ─────────────
  console.log("\n--- TEST GROUP 6: Certificate Lookup & Demo Fallbacks ---")

  await runTest("lookupCertificateByCode finds demo certificate 1", async () => {
    const res = await lookupCertificateByCode("PHARMA-2026-A1B2-C3D4")
    assert.strictEqual(res.verified, true)
    assert.strictEqual(res.certificate?.student_name, "Dr. Tariq Hassan")
  })

  await runTest("lookupCertificateByCode correctly identifies revoked demo certificate", async () => {
    const res = await lookupCertificateByCode("PHARMA-2026-REV0-0001")
    assert.strictEqual(res.verified, false)
    assert.strictEqual(res.certificate?.status, "revoked")
    assert.match(res.error || "", /revoked/i)
  })

  await runTest("lookupCertificateByCode returns not found for invalid code", async () => {
    const res = await lookupCertificateByCode("NON_EXISTENT_CODE")
    assert.strictEqual(res.verified, false)
    assert.strictEqual(res.certificate, null)
  })

  console.log(`\n=================================================================`)
  console.log(`=== AUDIT TEST SUMMARY: ${passedTests} / ${totalTests} CHECKS PASSED ===`)
  console.log(`=================================================================`)
}

main().catch((err) => {
  console.error("Audit test suite failure:", err)
  process.exit(1)
})
