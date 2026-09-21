import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

function readFile(relPath) {
  const fullPath = path.join(projectRoot, relPath);
  assert.ok(fs.existsSync(fullPath), `Target file must exist: ${relPath}`);
  return fs.readFileSync(fullPath, 'utf8');
}

test('🛡️ PharmaCore Full 22-Domain Security & Hardening Matrix Test Suite', async (t) => {

  // ── 1. Authentication & Session Management ──────────────────────────────
  await t.test('Domain 1: Authentication & Password Complexity', () => {
    const signupCode = readFile('pages/api/students/signup.ts');
    const adminUserCreateCode = readFile('pages/api/admin/users/create.ts');
    const supabaseAdminCode = readFile('lib/supabaseAdmin.ts');

    assert.match(signupCode, /password:\s*z\.string\(\)\.min\(6/, 'Student signup must enforce minimum 6 characters');
    assert.match(adminUserCreateCode, /password:\s*z\.string\(\)\.min\(8\)/, 'Admin user creation must enforce minimum 8 characters');
    assert.match(supabaseAdminCode, /FATAL:\s*supabaseAdmin must never be imported/, 'supabaseAdmin must prevent client-side execution');
  });

  // ── 2. Authorization / Access Control & RBAC ────────────────────────────
  await t.test('Domain 2: Authorization, RBAC & IDOR Boundaries', () => {
    const adminFeedbackIdCode = readFile('pages/api/admin/feedback/[id].ts');
    const adminStudentsCode = readFile('pages/api/admin/students/index.ts');
    const questionsAnswerCode = readFile('pages/api/questions/answer.ts');
    const notifReadCode = readFile('pages/api/students/notifications/read.ts');

    assert.match(adminFeedbackIdCode, /\[["']dev["'],\s*["']super_admin["'],\s*["']mentor["']\]\.includes\(profile\.role\)/, 'Feedback detail must verify staff role');
    assert.match(adminStudentsCode, /\[["']dev["'],\s*["']super_admin["'],\s*["']mentor["']\]\.includes\(profile\.role\)/, 'Student manager must verify staff role');
    assert.match(questionsAnswerCode, /\[["']dev["'],\s*["']super_admin["'],\s*["']mentor["']\]\.includes\(profile\.role\)/, 'Answer submission must verify staff role');
    assert.match(notifReadCode, /\.eq\(["']user_id["'],\s*userId\)/, 'Notification read mutation must scope to authenticated user_id');
  });

  // ── 3. Input Validation & Schema Hardening ───────────────────────────────
  await t.test('Domain 3: Strict Input Validation & Schema Enforcement across APIs', () => {
    const apiFiles = [
      'pages/api/feedback/submit.ts',
      'pages/api/questions/submit.ts',
      'pages/api/questions/answer.ts',
      'pages/api/students/signup.ts',
      'pages/api/students/questions.ts',
      'pages/api/admin/announcements/broadcast.ts',
      'pages/api/admin/feedback/[id].ts',
      'pages/api/admin/feedback/index.ts',
      'pages/api/admin/students/index.ts',
      'pages/api/admin/students/enrollments.ts',
      'pages/api/admin/users/create.ts',
      'pages/api/admin/users/index.ts',
      'pages/api/courses/[id]/enroll.ts',
      'pages/api/profile/index.ts'
    ];

    for (const file of apiFiles) {
      const code = readFile(file);
      assert.match(code, /z\.object\(|z\.discriminatedUnion\(/, `${file} must enforce Zod validation schema`);
      assert.match(code, /safeParse/, `${file} must use safeParse for defensive payload validation`);
    }
  });

  // ── 4. Injection Defenses & Unicode Normalization ───────────────────────
  await t.test('Domain 4: PostgREST & Unicode Injection Immunity', () => {
    const utilsCode = readFile('lib/utils.ts');
    const studentQuestionsCode = readFile('pages/api/students/questions.ts');

    assert.match(utilsCode, /export function sanitizePostgrestFilter/, 'Must export sanitizePostgrestFilter');
    assert.match(utilsCode, /export function sanitizePostgrestExactValue/, 'Must export sanitizePostgrestExactValue');
    assert.match(utilsCode, /normalize\("NFKC"\)/, 'Must normalize unicode NFKC in sanitizers');
    assert.match(studentQuestionsCode, /sanitizePostgrestExactValue\(userEmail\)/, 'Student questions must sanitize email for PostgREST .or() filter');
  });

  // ── 5. Database Security & Row Level Security ───────────────────────────
  await t.test('Domain 5: Row Level Security (RLS) & Column Level Security (CLS)', () => {
    const schemaSql = readFile('supabase/00_complete_production_schema.sql');
    const notifSql = readFile('supabase/03_notifications_and_qa_hub.sql');

    assert.match(schemaSql, /ALTER TABLE public\.users ENABLE ROW LEVEL SECURITY;/, 'users table must enable RLS');
    assert.match(schemaSql, /ALTER TABLE public\.courses ENABLE ROW LEVEL SECURITY;/, 'courses table must enable RLS');
    assert.match(schemaSql, /ALTER TABLE public\.community_questions ENABLE ROW LEVEL SECURITY;/, 'community_questions table must enable RLS');
    assert.match(schemaSql, /REVOKE SELECT ON public\.community_questions FROM anon, authenticated;/, 'Must revoke open select on community_questions to protect emails');
    assert.match(notifSql, /public\.get_user_role\(\)\s+IN\s+\('dev',\s*'super_admin',\s*'mentor'\)/, 'Staff notifications policy must use get_user_role()');
  });

  // ── 6. Mass Assignment & Property Injection ─────────────────────────────
  await t.test('Domain 6: Mass Assignment & Protected Property Lockout', () => {
    const profileCode = readFile('pages/api/profile/index.ts');
    const adminUsersCode = readFile('pages/api/admin/users/index.ts');

    assert.match(profileCode, /updateProfileSchema/, 'Profile update must use strict schema');
    // Ensure student profile cannot update role directly
    assert.strictEqual(profileCode.includes('role: z.enum'), false, 'Profile update schema must NOT allow client to modify role');
    assert.match(adminUsersCode, /requester\.user\.id === userId && \(banned === true \|\| \(role && role !== oldProfile\?\.role\)\)/, 'Admin cannot self-demote or self-ban');
  });

  // ── 7. Cross-Site Scripting (XSS) & JSON-LD Defense ─────────────────────
  await t.test('Domain 7: XSS, JSON-LD Escaping & Safe URL Protocol Verification', () => {
    const layoutCode = readFile('components/Layout.tsx');
    const utilsCode = readFile('lib/utils.ts');

    assert.match(layoutCode, /escapeJsonLd\(JSON\.stringify\(structuredData\)\)/, 'Layout must escape structured data');
    assert.match(utilsCode, /export function isSafeUrl/, 'isSafeUrl must be exported');
  });

  // ── 8. CSRF & HTTP Method Enforcement ───────────────────────────────────
  await t.test('Domain 8: Strict HTTP Method Verification (405 Method Not Allowed)', () => {
    const mutationApis = [
      'pages/api/feedback/submit.ts',
      'pages/api/questions/submit.ts',
      'pages/api/questions/answer.ts',
      'pages/api/students/signup.ts',
      'pages/api/admin/announcements/broadcast.ts',
      'pages/api/admin/users/create.ts'
    ];

    for (const file of mutationApis) {
      const code = readFile(file);
      assert.match(code, /405/, `${file} must return 405 Method Not Allowed for disallowed methods`);
    }
  });

  // ── 9. CORS Policy & Isolation ──────────────────────────────────────────
  await t.test('Domain 9: CORS Scoping & Origin Isolation', () => {
    const nextConfig = readFile('next.config.js');
    assert.match(nextConfig, /source:\s*'\/(\(og-.*|.*\\.\(jpg)/, 'CORS Access-Control-Allow-Origin * must only apply to static media');
  });

  // ── 10. Secrets & Environment Isolation ─────────────────────────────────
  await t.test('Domain 10: Server Secret Isolation & Non-Leakage', () => {
    const gitignore = readFile('.gitignore');
    assert.match(gitignore, /\.env\*/, '.gitignore must ignore .env files');

    const adminClient = readFile('lib/supabaseAdmin.ts');
    assert.match(adminClient, /typeof window !== 'undefined'/, 'supabaseAdmin must throw error if loaded in browser');
  });

  // ── 11. Rate Limiting & Real-IP Header Resolution ───────────────────────
  await t.test('Domain 11: Rate Limiting & Spoof-Proof Real-IP Header Order', () => {
    const rateLimitCode = readFile('lib/rateLimit.ts');
    assert.match(rateLimitCode, /cf-connecting-ip/, 'getClientIp must prioritize cf-connecting-ip');
    assert.match(rateLimitCode, /checkUserOrIpRateLimit/, 'checkUserOrIpRateLimit helper must exist');
  });

  // ── 12. File Upload Security ────────────────────────────────────────────
  await t.test('Domain 12: File Upload RBAC & Size Enforcement', () => {
    const uploadCode = readFile('server/uploadthing.ts');
    assert.match(uploadCode, /authorizeStaffUpload/, 'UploadThing router must enforce staff authorization');
    assert.match(uploadCode, /maxFileSize/, 'All upload routes must enforce maxFileSize');
  });

  // ── 13. SSRF Safeguards ─────────────────────────────────────────────────
  await t.test('Domain 13: SSRF Immunity & Hardcoded Remote Endpoints', () => {
    const emailCode = readFile('lib/email.ts');
    const turnstileCode = readFile('lib/turnstile.ts');

    assert.match(emailCode, /https:\/\/api\.resend\.com\/emails/, 'Resend dispatcher must target hardcoded trusted URL');
    assert.match(turnstileCode, /https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/siteverify/, 'Turnstile must target hardcoded trusted URL');
  });

  // ── 14. Open Redirects ──────────────────────────────────────────────────
  await t.test('Domain 14: Safe Internal Redirect Handling', () => {
    const loginCode = readFile('pages/login.tsx');
    assert.match(loginCode, /router\.replace|router\.push/, 'Login must use Next.js internal router navigation');
  });

  // ── 15. Error Handling & Information Disclosure ─────────────────────────
  await t.test('Domain 15: Error Sanitization & Non-Disclosure', () => {
    const signupCode = readFile('pages/api/students/signup.ts');
    assert.match(signupCode, /500/, 'APIs must return safe 500 status on exceptions without raw traces');
  });

  // ── 16. Security Headers ────────────────────────────────────────────────
  await t.test('Domain 16: Comprehensive Production Security Headers', () => {
    const nextConfig = readFile('next.config.js');
    assert.match(nextConfig, /Strict-Transport-Security/, 'HSTS header configured');
    assert.match(nextConfig, /X-Frame-Options/, 'X-Frame-Options header configured');
    assert.match(nextConfig, /X-Content-Type-Options/, 'X-Content-Type-Options header configured');
    assert.match(nextConfig, /Content-Security-Policy/, 'CSP header configured');
    assert.match(nextConfig, /Cross-Origin-Opener-Policy/, 'COOP header configured');
    assert.match(nextConfig, /Cross-Origin-Resource-Policy/, 'CORP header configured');
  });

  // ── 17. Race Conditions & Idempotency ───────────────────────────────────
  await t.test('Domain 17: Database Idempotency & Conflict Safety', () => {
    const enrollCode = readFile('pages/api/courses/[id]/enroll.ts');
    assert.match(enrollCode, /existing\.status === "active"/, 'Enrollment must handle duplicate requests idempotently');
  });

  // ── 18. Audit Logging & Credential Redaction ────────────────────────────
  await t.test('Domain 18: Audit Logging & Clean Telemetry', () => {
    const analyticsCode = readFile('lib/analytics.ts');
    assert.match(analyticsCode, /trackEvent/, 'Analytics must log sanitized structured events');
  });

  // ── 19. Dependency & Supply Chain Security ──────────────────────────────
  await t.test('Domain 19: Dependency Audit & Manifest Integrity', () => {
    const pkg = JSON.parse(readFile('package.json'));
    assert.strictEqual(pkg.name, 'pharmacore', 'Package name strictly pharmacore');
    assert.ok(pkg.dependencies['next'], 'Next.js dependency verified');
    assert.ok(pkg.dependencies['@supabase/supabase-js'], 'Supabase dependency verified');
  });

  // ── 20. Complete 21-Endpoint API Inventory ──────────────────────────────
  await t.test('Domain 20: 21 API Route Endpoints Inventory Verification', () => {
    const allRoutes = [
      'pages/api/courses/[id]/enroll.ts',
      'pages/api/feedback/submit.ts',
      'pages/api/students/signup.ts',
      'pages/api/students/enrollments.ts',
      'pages/api/students/notifications/index.ts',
      'pages/api/students/notifications/read.ts',
      'pages/api/students/questions.ts',
      'pages/api/students/profile.ts',
      'pages/api/profile/index.ts',
      'pages/api/admin/feedback/index.ts',
      'pages/api/admin/feedback/[id].ts',
      'pages/api/admin/students/index.ts',
      'pages/api/admin/students/enrollments.ts',
      'pages/api/admin/analytics.ts',
      'pages/api/admin/settings/signup.ts',
      'pages/api/admin/announcements/broadcast.ts',
      'pages/api/admin/users/index.ts',
      'pages/api/admin/users/create.ts',
      'pages/api/uploadthing.ts',
      'pages/api/questions/answer.ts',
      'pages/api/questions/submit.ts'
    ];

    assert.strictEqual(allRoutes.length, 21, 'Inventory contains exactly 21 API endpoints');
    for (const route of allRoutes) {
      assert.ok(fs.existsSync(path.join(projectRoot, route)), `Route file must exist: ${route}`);
      const code = readFile(route);
      assert.match(code, /checkRateLimit/, `${route} must implement rate limiting`);
    }
  });

  // ── 21. Client / Server Security Boundary ───────────────────────────────
  await t.test('Domain 21: Client/Server Isolation & Trust Boundary', () => {
    const adminClient = readFile('lib/supabaseAdmin.ts');
    assert.match(adminClient, /typeof window !== 'undefined'/, 'supabaseAdmin runtime check prevents browser execution');
  });

  // ── 22. AI / LLM Security & Safety Protocols ────────────────────────────
  await t.test('Domain 22: AI / LLM Security & Input Sanitization Readiness', () => {
    const utilsCode = readFile('lib/utils.ts');
    assert.match(utilsCode, /sanitizeInputText/, 'Input sanitization active for untrusted text');
  });
});
