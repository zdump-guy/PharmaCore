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

test('🔒 Community Q&A, Notifications & Resend Security Test Suite', async (t) => {
  // ── 1. Database Schema & RLS Policies ──────────────────────────────────
  await t.test('1. Database Migration & RLS Security Integrity', () => {
    const migrationSql = loadFile('supabase/03_notifications_and_qa_hub.sql');

    assert.match(migrationSql, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.notifications/i, 'Must create notifications table');
    assert.match(migrationSql, /ALTER\s+TABLE\s+public\.notifications\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i, 'Must enable RLS on notifications table');
    assert.match(migrationSql, /auth\.uid\(\)\s*=\s*user_id/i, 'Must enforce auth.uid() = user_id policy');
    assert.match(migrationSql, /email_notifications_enabled\s+BOOLEAN\s+DEFAULT\s+true/i, 'Must add email_notifications_enabled column to users');
    assert.match(migrationSql, /idx_notifications_user_read/i, 'Must include composite index for user and read status');
  });

  // ── 2. TypeScript Definitions ──────────────────────────────────────────
  await t.test('2. Strict TypeScript Interfaces & Entity Models', () => {
    const types = loadFile('types/index.ts');

    assert.match(types, /email_notifications_enabled\?:?\s*boolean/, 'UserProfile must include email_notifications_enabled');
    assert.match(types, /export\s+type\s+NotificationType\s*=/, 'Must export NotificationType union');
    assert.match(types, /export\s+interface\s+NotificationItem/, 'Must export NotificationItem interface');
    assert.match(types, /export\s+interface\s+StudentQuestionItem\s+extends\s+CommunityQuestion/, 'Must export StudentQuestionItem interface');
  });

  // ── 3. Student Questions API IDOR & Query Security ────────────────────
  await t.test('3. Student Questions API IDOR & PostgREST Injection Defense', () => {
    const questionsApi = loadFile('pages/api/students/questions.ts');

    assert.match(questionsApi, /supabaseAdmin\.auth\.getUser\(token\)/, 'Must authenticate request bearer token');
    assert.match(questionsApi, /\.or\(`user_id\.eq\.\$\{userId\}/, 'Must strictly scope question queries to caller userId to prevent IDOR');
    assert.match(questionsApi, /z\.enum\(\["all",\s*"answered",\s*"pending"\]\)/, 'Must validate filter query parameters with Zod schema');
    assert.match(questionsApi, /limit:\s*z\.coerce\.number\(\)\.min\(1\)\.max\(100\)/, 'Must bound pagination limit (max 100) to prevent DoS');
    assert.match(questionsApi, /checkRateLimit\(req,\s*res/, 'Must enforce rate limiting on questions API');
  });

  // ── 4. Notifications API IDOR & State Mutation Immunity ───────────────
  await t.test('4. Notifications List & Read Mutation IDOR Immunity', () => {
    const listApi = loadFile('pages/api/students/notifications/index.ts');
    const readApi = loadFile('pages/api/students/notifications/read.ts');

    // Index API
    assert.match(listApi, /\.eq\(["']user_id["'],\s*userId\)/, 'List API must restrict query to authenticated user_id');
    assert.match(listApi, /unreadCount/, 'List API must return unread notifications count');

    // Read API
    assert.match(readApi, /\.eq\(["']user_id["'],\s*userId\)/, 'Read mutation API must strictly enforce user_id ownership');
    assert.match(readApi, /z\.string\(\)\.uuid\(\)/, 'Read mutation API must validate notification_id with strict UUID schema');
    assert.match(readApi, /checkRateLimit\(req,\s*res/, 'Read mutation API must enforce write rate limit');
  });

  // ── 5. Email Dispatcher CRLF & HTML Injection Sanitization ────────────
  await t.test('5. Resend Email Dispatcher CRLF Defense & HTML Escaping', () => {
    const emailLib = loadFile('lib/email.ts');

    assert.match(emailLib, /function\s+sanitizeEmailHeader/, 'Must define sanitizeEmailHeader helper for email headers');
    assert.match(emailLib, /function\s+escapeHtml/, 'Must define escapeHtml helper for email HTML templates');
    assert.match(emailLib, /replace\(\/\[\\r\\n\\x00-\\x1F\\x7F\]\/g,\s*["']["']\)/, 'Must strip CRLF characters from dynamic email subject/sender');
    assert.match(emailLib, /sendMentorReplyEmail/, 'Must export sendMentorReplyEmail function');
    assert.match(emailLib, /if\s*\(!resendApiKey\)\s*\{/, 'Must gracefully handle dispatch when API key is missing');
  });

  // ── 6. Mentor Answer Route Dispatch & Notification Trigger ───────────
  await t.test('6. Mentor Answer Endpoint Notification & Preference Respect', () => {
    const answerApi = loadFile('pages/api/questions/answer.ts');

    assert.match(answerApi, /\['dev',\s*'super_admin',\s*'mentor'\]\.includes\(profile\.role\)/, 'Must enforce mentor/admin role verification');
    assert.match(answerApi, /from\('notifications'\)\.insert/, 'Must insert in-app notification upon answer submission');
    assert.match(answerApi, /sendMentorReplyEmail\(\{/, 'Must trigger email dispatch function');
    assert.match(answerApi, /userPref\.email_notifications_enabled\s*===\s*false/, 'Must respect student email notification opt-out preference');
  });

  // ── 7. Profile API & Preferences Persistence ──────────────────────────
  await t.test('7. Profile API Preferences Validation & Persistence', () => {
    const profileApi = loadFile('pages/api/profile/index.ts');

    assert.match(profileApi, /email_notifications_enabled:\s*z\.boolean\(\)\.optional\(\)/, 'Profile schema must validate email_notifications_enabled boolean');
    assert.match(profileApi, /\.select\(["']\*["']\)/, 'Profile GET response selects all user columns including preferences');
  });

  // ── 8. Profile Frontend UI & Accessibility Integration ────────────────
  await t.test('8. Profile Page Q&A Hub, Banner & Accessible Toggles', () => {
    const profilePage = loadFile('pages/profile.tsx');

    assert.match(profilePage, /activeTab\s*===\s*["']qa["']/, 'Must support activeTab = qa');
    assert.match(profilePage, /role=["']switch["']/, 'Email notification toggle must have accessible role="switch"');
    assert.match(profilePage, /aria-checked=\{emailNotificationsEnabled\}/, 'Email notification toggle must have aria-checked attribute');
    assert.match(profilePage, /\/api\/students\/questions/, 'Profile page must fetch questions from secure student API');
    assert.match(profilePage, /\/api\/students\/notifications/, 'Profile page must fetch notifications from secure student API');
    assert.match(profilePage, /handleMarkAllNotificationsRead/, 'Profile page must provide mark all as read handler');
    assert.match(profilePage, /handleMarkNotificationRead/, 'Profile page must provide single notification read handler');
    assert.match(profilePage, /qaFilter/, 'Must provide Q&A status filtering (all, answered, pending)');
    assert.match(profilePage, /qaSearch/, 'Must provide real-time search input for Q&A hub');
  });

  // ── 9. Email Template Logo & Do Not Reply Warnings ────────────────────
  await t.test('9. Email Template Logo Branding & Do Not Reply Warnings', () => {
    const emailLib = loadFile('lib/email.ts');

    assert.match(emailLib, /android-chrome-192x192\.png/, 'Must embed PharmaCore logo PNG in email templates');
    assert.match(emailLib, /Do Not Reply/i, 'Must include Do Not Reply notice in subject, header badge, and body');
    assert.match(emailLib, /no-reply@pharmacore\.edu/, 'Default sender must specify no-reply address');
    assert.match(emailLib, /buildAnnouncementEmailHtml/, 'Must export buildAnnouncementEmailHtml for broadcast messages');
    assert.match(emailLib, /sendBroadcastAnnouncementEmail/, 'Must export sendBroadcastAnnouncementEmail function');
  });

  // ── 10. Admin Announcement Broadcast API & UI ─────────────────────────
  await t.test('10. Admin Announcement Broadcast API & UI Moderation Hub', () => {
    const broadcastApi = loadFile('pages/api/admin/announcements/broadcast.ts');
    const communityUi = loadFile('components/admin/CommunityManager.tsx');

    // Broadcast API
    assert.match(broadcastApi, /\[["']dev["'],\s*["']super_admin["']\]\.includes\(profile\.role\)/, 'Broadcast API must restrict to dev/super_admin');
    assert.match(broadcastApi, /checkRateLimit\(req,\s*res/, 'Broadcast API must enforce rate limits');
    assert.match(broadcastApi, /from\(["']notifications["']\)\.insert/, 'Broadcast API must batch insert in-app notifications');
    assert.match(broadcastApi, /sendBroadcastAnnouncementEmail/, 'Broadcast API must integrate with Resend broadcast dispatcher');

    // Community Manager UI
    assert.match(communityUi, /value=["']broadcast["']/, 'CommunityManager must include broadcast announcement tab');
    assert.match(communityUi, /handleSendBroadcast/, 'CommunityManager must provide broadcast submission handler');
    assert.match(communityUi, /\/api\/admin\/announcements\/broadcast/, 'CommunityManager must call broadcast API');
  });
});
