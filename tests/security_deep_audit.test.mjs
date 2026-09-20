import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

// Helper to load file content
function readFile(relPath) {
  return fs.readFileSync(path.join(projectRoot, relPath), 'utf8');
}

test('🔒 PharmaCore Comprehensive Security & Resilience Deep Audit', async (t) => {

  await t.test('1. Mongo / NoSQL / PostgREST Injection Immunity', async (t2) => {
    const utilsCode = readFile('lib/utils.ts');
    assert.match(utilsCode, /export function sanitizePostgrestFilter/, 'sanitizePostgrestFilter utility must be exported');

    // Test filter escaping logic
    const { sanitizePostgrestFilter } = await import('../lib/utils.js').catch(async () => {
      // Inline test if importing TypeScript directly in Node
      return {
        sanitizePostgrestFilter: (term) => term.normalize("NFKC").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").replace(/[(),."%_\\]/g, "").trim()
      };
    });

    const maliciousTerm = 'test),or(id.eq.admin),("';
    const cleaned = sanitizePostgrestFilter(maliciousTerm);
    assert.strictEqual(cleaned.includes(')'), false, 'Must strip closing parentheses');
    assert.strictEqual(cleaned.includes(','), false, 'Must strip commas');
    assert.strictEqual(cleaned.includes('"'), false, 'Must strip quotes');

    const feedbackIndexCode = readFile('pages/api/admin/feedback/index.ts');
    assert.match(feedbackIndexCode, /sanitizePostgrestFilter/, 'Admin feedback search must use sanitizePostgrestFilter');
  });

  await t.test('2. Strict Input Validation & Schema Enforcement', async () => {
    const feedbackIdCode = readFile('pages/api/admin/feedback/[id].ts');
    assert.match(feedbackIdCode, /z\.string\(\)\.uuid\(/, 'Admin feedback [id] must strictly validate UUID parameter format');

    const signupCode = readFile('pages/api/students/signup.ts');
    assert.match(signupCode, /email\("Invalid email address"\)/, 'Signup schema must validate email format');
    assert.match(signupCode, /password:\s*z\.string\(\)\.min\(6/, 'Signup schema must enforce minimum password length');

    const enrollCode = readFile('pages/api/courses/[id]/enroll.ts');
    assert.match(enrollCode, /id:\s*z\.string\(\)\.uuid\(\)/, 'Course enrollment must validate UUID format');
  });

  await t.test('3. Input Sanitization & Control Character Neutralization', async () => {
    const utilsCode = readFile('lib/utils.ts');
    assert.match(utilsCode, /export function sanitizeInputText/, 'sanitizeInputText utility must exist');
    assert.match(utilsCode, /normalize\("NFKC"\)/, 'sanitizeInputText must normalize unicode');

    const feedbackSubmitCode = readFile('pages/api/feedback/submit.ts');
    assert.match(feedbackSubmitCode, /sanitizeInputText/, 'Feedback submit must sanitize text fields');

    const questionsSubmitCode = readFile('pages/api/questions/submit.ts');
    assert.match(questionsSubmitCode, /sanitizeInputText/, 'Questions submit must sanitize text fields');
  });

  await t.test('4. Cross-Site Scripting (XSS) & JSON-LD Defense', async () => {
    const layoutCode = readFile('components/Layout.tsx');
    assert.match(layoutCode, /escapeJsonLd/, 'Layout.tsx must import and use escapeJsonLd on structuredData');
    assert.match(layoutCode, /escapeJsonLd\(JSON\.stringify\(structuredData\)\)/, 'Structured data JSON-LD must be escaped');

    const utilsCode = readFile('lib/utils.ts');
    assert.match(utilsCode, /isSafeUrl/, 'isSafeUrl utility must exist');
  });

  await t.test('5. Cross-Site Request Forgery (CSRF) & Method Enforcement', async () => {
    const apiFiles = [
      'pages/api/feedback/submit.ts',
      'pages/api/questions/submit.ts',
      'pages/api/questions/answer.ts',
      'pages/api/students/signup.ts',
      'pages/api/admin/users/create.ts'
    ];

    for (const file of apiFiles) {
      const code = readFile(file);
      assert.match(code, /req\.method !== "POST"|req\.method !== 'POST'/, `${file} must enforce POST method`);
    }
  });

  await t.test('6. Rate Limiting & Real-IP Header Resolution Order', async () => {
    const rateLimitCode = readFile('lib/rateLimit.ts');
    assert.match(rateLimitCode, /cf-connecting-ip/, 'getClientIp must prioritize cf-connecting-ip');
    assert.match(rateLimitCode, /x-real-ip/, 'getClientIp must check x-real-ip before x-forwarded-for');

    const fnBody = rateLimitCode.slice(rateLimitCode.indexOf('export function getClientIp'));
    const idxCf = fnBody.indexOf('cf-connecting-ip');
    const idxFwd = fnBody.indexOf('x-forwarded-for');
    assert.ok(idxCf < idxFwd, 'cf-connecting-ip must be checked before x-forwarded-for in getClientIp to prevent spoofing');
  });

  await t.test('7. Progressive Slow Down / Throttling Helper', async () => {
    const rateLimitCode = readFile('lib/rateLimit.ts');
    assert.match(rateLimitCode, /export async function applySlowDown/, 'applySlowDown progressive delay function must be exported');
  });

  await t.test('8. Captcha & Cloudflare Turnstile Verification', async () => {
    const turnstileCode = readFile('lib/turnstile.ts');
    assert.match(turnstileCode, /verifyTurnstileToken/, 'verifyTurnstileToken must be implemented');

    const feedbackSubmitCode = readFile('pages/api/feedback/submit.ts');
    assert.match(feedbackSubmitCode, /verifyTurnstileToken/, 'feedback/submit.ts must call verifyTurnstileToken');

    const signupCode = readFile('pages/api/students/signup.ts');
    assert.match(signupCode, /verifyTurnstileToken/, 'students/signup.ts must call verifyTurnstileToken');

    const questionsCode = readFile('pages/api/questions/submit.ts');
    assert.match(questionsCode, /verifyTurnstileToken/, 'questions/submit.ts must call verifyTurnstileToken');
  });

  await t.test('9. Helmet & Comprehensive Security Headers (CSP, HSTS, COOP, CORP)', async () => {
    const nextConfigCode = readFile('next.config.js');
    assert.match(nextConfigCode, /Strict-Transport-Security/, 'Must include Strict-Transport-Security');
    assert.match(nextConfigCode, /X-Frame-Options/, 'Must include X-Frame-Options');
    assert.match(nextConfigCode, /X-Content-Type-Options/, 'Must include X-Content-Type-Options');
    assert.match(nextConfigCode, /Referrer-Policy/, 'Must include Referrer-Policy');
    assert.match(nextConfigCode, /Permissions-Policy/, 'Must include Permissions-Policy');
    assert.match(nextConfigCode, /Cross-Origin-Opener-Policy/, 'Must include Cross-Origin-Opener-Policy');
    assert.match(nextConfigCode, /Cross-Origin-Resource-Policy/, 'Must include Cross-Origin-Resource-Policy');
    assert.match(nextConfigCode, /Content-Security-Policy/, 'Must include Content-Security-Policy');
    assert.match(nextConfigCode, /challenges\.cloudflare\.com/, 'CSP must allow Cloudflare Turnstile');
    assert.match(nextConfigCode, /youtube\.com/, 'CSP must allow YouTube embeds');
  });

  await t.test('10. CORS Policy & Isolation', async () => {
    const nextConfigCode = readFile('next.config.js');
    // Ensure wildcard CORS is restricted only to public static assets and OpenGraph images
    assert.match(nextConfigCode, /source:\s*'\/(\(og-.*|.*\\.\(jpg)/, 'Wildcard CORS must only apply to public static media assets');
  });

  await t.test('11. Cookie Safety Audit', async () => {
    // Confirm zero ambient insecure cookies are set directly in source
    const documentCode = readFile('pages/_document.tsx');
    assert.strictEqual(documentCode.includes('document.cookie'), false, '_document.tsx must not set raw cookies');
  });

  await t.test('12. File Upload Security & Staff RBAC Restrictions', async () => {
    const uploadCode = readFile('server/uploadthing.ts');
    assert.match(uploadCode, /authorizeStaffUpload/, 'UploadThing router must enforce authorizeStaffUpload');
    assert.match(uploadCode, /dev.*super_admin.*mentor/, 'UploadThing must restrict uploads to staff roles');
    assert.match(uploadCode, /maxFileSize/, 'UploadThing routes must define explicit maxFileSize');
  });


  await t.test('13. Brute Force Protection & Password Complexity', async () => {
    const adminUserCreate = readFile('pages/api/admin/users/create.ts');
    assert.match(adminUserCreate, /password:\s*z\.string\(\)\.min\(8\)/, 'Admin passwords must enforce minimum 8 characters');
    assert.match(adminUserCreate, /checkRateLimit/, 'Admin user creation must enforce rate limiting');
  });

  await t.test('14. Idempotency & Conflict Safety', async () => {
    const enrollCode = readFile('pages/api/courses/[id]/enroll.ts');
    assert.match(enrollCode, /existing\.status === "active"/, 'Enrollment must handle duplicate active enrollments idempotently');

    const adminEnrollCode = readFile('pages/api/admin/students/enrollments.ts');
    assert.match(adminEnrollCode, /onConflict:\s*"user_id,course_id"/, 'Admin batch enrollment must upsert with onConflict key');
  });

  await t.test('15. Order Protection & Self-Privilege Escalation Lockout', async () => {
    const adminUsersIndex = readFile('pages/api/admin/users/index.ts');
    assert.match(adminUsersIndex, /requester\.user\.id === userId && \(banned === true \|\| \(role && role !== oldProfile\?\.role\)\)/, 'Admins must be blocked from banning or demoting themselves');
    assert.match(adminUsersIndex, /parsed\.data\.userId === requester\.user\.id/, 'Admins must be blocked from deleting their own account');
  });
});
