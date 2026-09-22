import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

function loadFile(relPath) {
  const absPath = path.join(projectRoot, relPath);
  assert.ok(fs.existsSync(absPath), `Target file must exist: ${relPath}`);
  return fs.readFileSync(absPath, 'utf8');
}

test('📧 Enhanced Email System & Campaign Engine Test Suite', async (t) => {
  // ── 1. Database Schema & RLS Security Integrity ──────────────────────
  await t.test('1. Database Migration & RLS Security Integrity', () => {
    const migrationSql = loadFile('supabase/04_enhanced_email_system.sql');

    // Schema validation
    assert.match(migrationSql, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.email_templates/i, 'Must create email_templates table');
    assert.match(migrationSql, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.email_logs/i, 'Must create email_logs table');
    assert.match(migrationSql, /ALTER\s+TABLE\s+public\.users\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+email_marketing_enabled\s+BOOLEAN/i, 'Must add email_marketing_enabled column to users');
    
    // RLS Enforcement
    assert.match(migrationSql, /ALTER\s+TABLE\s+public\.email_templates\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i, 'Must enable RLS on email_templates');
    assert.match(migrationSql, /ALTER\s+TABLE\s+public\.email_logs\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i, 'Must enable RLS on email_logs');
    assert.match(migrationSql, /public\.get_user_role\(\)\s+IN\s+\('dev',\s*'super_admin'\)/i, 'Must restrict management to admins/devs via get_user_role()');

    // Indexing
    assert.match(migrationSql, /idx_email_logs_status/i, 'Must index email logs delivery status');
    assert.match(migrationSql, /idx_email_logs_created/i, 'Must index email logs created_at timestamp');
  });

  // ── 2. Strict TypeScript Interfaces & Type Safety ─────────────────────
  await t.test('2. Strict TypeScript Interfaces & Entity Models', () => {
    const types = loadFile('types/index.ts');

    assert.match(types, /export\s+interface\s+EmailTemplateVariable/, 'Must export EmailTemplateVariable interface');
    assert.match(types, /export\s+interface\s+EmailTemplate/, 'Must export EmailTemplate interface');
    assert.match(types, /export\s+type\s+EmailTargetAudience\s*=/, 'Must export EmailTargetAudience union');
    assert.match(types, /export\s+type\s+EmailDeliveryStatus\s*=/, 'Must export EmailDeliveryStatus union');
    assert.match(types, /export\s+interface\s+EmailLog/, 'Must export EmailLog interface');
    assert.match(types, /email_marketing_enabled\?:?\s*boolean/, 'UserProfile must include email_marketing_enabled');
  });

  // ── 3. Core Mailer Engine & Template Rendering ────────────────────────
  await t.test('3. Core Mailer Engine & Variable Interpolation', () => {
    const emailLib = loadFile('lib/email.ts');

    assert.match(emailLib, /function\s+renderEmailTemplate/, 'Must export renderEmailTemplate helper');
    assert.match(emailLib, /DEFAULT_ANNOUNCEMENT_TEMPLATE/, 'Must define DEFAULT_ANNOUNCEMENT_TEMPLATE');
    assert.match(emailLib, /DEFAULT_MARKETING_TEMPLATE/, 'Must define DEFAULT_MARKETING_TEMPLATE');
    assert.match(emailLib, /DEFAULT_DIRECT_MESSAGE_TEMPLATE/, 'Must define DEFAULT_DIRECT_MESSAGE_TEMPLATE');
    assert.match(emailLib, /DEFAULT_CONTAINER_TEMPLATE/, 'Must define DEFAULT_CONTAINER_TEMPLATE');
    assert.match(emailLib, /sendCustomEmail/, 'Must export sendCustomEmail function');
    assert.match(emailLib, /sendBatchCustomEmails/, 'Must export sendBatchCustomEmails function');
    assert.match(emailLib, /chunkSize\s*=\s*50/, 'Must batch email dispatches in chunks to avoid payload limits');
  });

  // ── 4. Template Management Endpoints (CRUD) ───────────────────────────
  await t.test('4. Template CRUD Endpoints Security & Validation', () => {
    const templatesIndexApi = loadFile('pages/api/admin/emails/templates/index.ts');
    const templatesIdApi = loadFile('pages/api/admin/emails/templates/[id].ts');

    // Index API
    assert.match(templatesIndexApi, /createTemplateSchema\s*=\s*z\.object/, 'Must validate template creation payload with Zod');
    assert.match(templatesIndexApi, /\['dev',\s*'super_admin',\s*'mentor'\]\.includes\(profile\.role\)/, 'Must restrict template operations to authorized staff');

    // Single / ID API
    assert.match(templatesIdApi, /updateTemplateSchema\s*=\s*z\.object/, 'Must validate template update payload with Zod');
    assert.match(templatesIdApi, /existing\.category\s*===\s*['"]system['"]\s*\|\|\s*existing\.is_default/, 'Must protect system templates from unauthorized deletion');
  });

  // ── 5. Campaign Dispatcher & Audience Resolution ──────────────────────
  await t.test('5. Campaign Dispatch Endpoint Audience Filtering & Safety', () => {
    const sendApi = loadFile('pages/api/admin/emails/send.ts');

    assert.match(sendApi, /sendCampaignSchema\s*=\s*z\.object/, 'Must validate campaign dispatch schema with Zod');
    assert.match(sendApi, /target_audience\s*===\s*["']all["']/, 'Must support "all" target audience');
    assert.match(sendApi, /target_audience\s*===\s*["']staff["']/, 'Must support "staff" target audience');
    assert.match(sendApi, /target_audience\s*===\s*["']students["']/, 'Must support students audience');
    assert.match(sendApi, /target_audience\s*===\s*["']course_enrolled["']/, 'Must support course-specific student audience');
    assert.match(sendApi, /target_audience\s*===\s*["']marketing["']/, 'Must support "marketing" target audience');
    assert.match(sendApi, /target_audience\s*===\s*["']custom_set["']/, 'Must support "custom_set" audience');
    assert.match(sendApi, /target_audience\s*===\s*["']single_user["']/, 'Must support "single_user" audience');
    assert.match(sendApi, /neq\(["']email_marketing_enabled["'],\s*false\)/, 'Must respect marketing email opt-out preferences');
    assert.match(sendApi, /from\(["']email_logs["']\)\s*\.insert/, 'Must record campaign dispatch in email_logs');
    assert.match(sendApi, /from\(["']notifications["']\)\s*\.insert/, 'Must mirror dispatch into in-app notifications if requested');
  });

  // ── 6. Preview, Test, Logs & Autocomplete Endpoints ───────────────────
  await t.test('6. Preview, Test, Logs and User Autocomplete Endpoints', () => {
    const previewApi = loadFile('pages/api/admin/emails/preview.ts');
    const testApi = loadFile('pages/api/admin/emails/test.ts');
    const logsApi = loadFile('pages/api/admin/emails/logs.ts');
    const searchApi = loadFile('pages/api/admin/users/search.ts');

    // Preview
    assert.match(previewApi, /previewSchema\s*=\s*z\.object/, 'Must validate preview payload with Zod');
    assert.match(previewApi, /renderEmailTemplate/, 'Must render preview with interpolated sample variables');

    // Test
    assert.match(testApi, /testEmailSchema\s*=\s*z\.object/, 'Must validate test email payload');
    assert.match(testApi, /sendCustomEmail/, 'Must dispatch test email to the current admin');

    // Logs
    assert.match(logsApi, /from\(["']email_logs["']\)/, 'Must query email_logs with pagination');
    assert.match(logsApi, /count:\s*["']exact["']/, 'Must return total count for pagination');

    // User search
    assert.match(searchApi, /from\(["']users["']\)/, 'Must query users table');
    assert.match(searchApi, /ilike/, 'Must perform case-insensitive search by name or email');
  });

  // ── 7. Admin UI Hub Component Integrity ───────────────────────────────
  await t.test('7. Admin UI Hub (EmailManager.tsx) Composition & Interactive Tabs', () => {
    const emailManager = loadFile('components/admin/EmailManager.tsx');

    assert.match(emailManager, /value=["']compose["']/, 'Must provide Compose & Broadcast tab');
    assert.match(emailManager, /value=["']templates["']/, 'Must provide Templates Library tab');
    assert.match(emailManager, /value=["']logs["']/, 'Must provide Logs & History tab');
    assert.match(emailManager, /handleFileUpload/, 'Must support HTML template file uploads');
    assert.match(emailManager, /handleSendTest/, 'Must support sending test emails');
    assert.match(emailManager, /handleDispatchCampaign/, 'Must support campaign dispatching with confirmation dialog');
    assert.match(emailManager, /<iframe/, 'Must render live preview in sandboxed iframe');
  });

  // ── 8. Navigation & Routing Integration ────────────────────────────────
  await t.test('8. Admin Navigation & Routing Integration', () => {
    const sidebar = loadFile('components/admin/AdminSidebar.tsx');
    const topNav = loadFile('components/admin/AdminTopNav.tsx');
    const adminIndex = loadFile('pages/admin/index.tsx');

    // Sidebar
    assert.match(sidebar, /id:\s*["']emails["']/, 'Sidebar must contain emails nav item');
    assert.match(sidebar, /page:\s*["']emails["']/, 'Sidebar must navigate to emails page');

    // TopNav
    assert.match(topNav, /emails:\s*\{/, 'TopNav must define metadata for emails page');

    // Admin Index Page
    assert.match(adminIndex, /import\(["']@\/components\/admin\/EmailManager["']\)/, 'Admin page must dynamically import EmailManager');
    assert.match(adminIndex, /activePage\s*===\s*["']emails["']/, 'Admin page must conditionally render EmailManager');
  });
});
