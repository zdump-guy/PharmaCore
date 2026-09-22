/**
 * PharmaCore Enhanced Email & Campaign Engine (Resend API Integration)
 * Includes defense-in-depth HTML escaping, CRLF injection defense, logo branding,
 * strict "Do Not Reply" alerts, dynamic template interpolation, marketing promo templates,
 * and chunked batch dispatching.
 */

export function escapeHtml(str: string | null | undefined): string {
  if (!str) return ""
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function sanitizeEmailHeader(str: string | null | undefined): string {
  if (!str) return ""
  return str.replace(/[\r\n\x00-\x1F\x7F]/g, "").trim()
}

/**
 * Dynamic Template Rendering Engine.
 * Replaces {{key}} or {{ key }} with provided variable values.
 * Triple brackets {{{raw_key}}} allow raw HTML injection without escaping.
 */
export function renderEmailTemplate(
  templateHtml: string,
  variables: Record<string, string | number | boolean | null | undefined> = {}
): string {
  if (!templateHtml) return ""

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://pharma-core-edu.vercel.app").replace(/\/+$/, "")
  const defaultGlobals: Record<string, string> = {
    site_url: siteUrl,
    logo_url: `${siteUrl}/android-chrome-192x192.png`,
    current_year: new Date().getFullYear().toString(),
    profile_url: `${siteUrl}/profile?tab=info`,
    feedback_url: `${siteUrl}/feedback`,
    company_name: "PharmaCore",
    support_email: "support@pharmacore.edu",
  }

  const mergedVariables: Record<string, string> = {
    ...defaultGlobals,
    ...Object.fromEntries(
      Object.entries(variables).map(([k, v]) => [k, v === null || v === undefined ? "" : String(v)])
    ),
  }

  let rendered = templateHtml

  // 1. Process raw HTML injection: {{{key}}} or {{{ key }}}
  rendered = rendered.replace(/\{\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}\}/g, (_match, key) => {
    return mergedVariables[key] !== undefined ? mergedVariables[key] : ""
  })

  // 2. Process escaped variables: {{key}} or {{ key }}
  rendered = rendered.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_match, key) => {
    if (mergedVariables[key] === undefined) return ""
    // If the key is specifically marked as safe HTML, return directly, else escape
    if (key.startsWith("raw_") || key === "html_content" || key === "content_html") {
      return mergedVariables[key]
    }
    return escapeHtml(mergedVariables[key])
  })

  return rendered
}

// ─── Default Built-in Email Templates ─────────────────────────────────────────

export const DEFAULT_ANNOUNCEMENT_TEMPLATE = `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title_en}} — PharmaCore</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Tajawal', sans-serif; }
    .email-container { max-width: 620px; margin: 32px auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.08); }
    .header-bg { background: linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #075985 100%); padding: 36px 28px 30px; text-align: center; color: #ffffff; border-bottom: 3px solid #38bdf8; }
    .logo-wrapper { display: inline-block; width: 68px; height: 68px; background: #ffffff; border-radius: 18px; padding: 4px; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25); margin-bottom: 14px; }
    .brand-title { font-size: 26px; font-weight: 800; margin: 0; color: #ffffff; }
    .brand-subtitle { font-size: 13px; color: #bae6fd; margin: 6px 0 0; }
    .badge-do-not-reply { display: inline-block; background: rgba(255, 255, 255, 0.14); border: 1px solid rgba(255, 255, 255, 0.28); color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 5px 14px; border-radius: 30px; margin-top: 14px; }
    .content-body { padding: 36px 32px; color: #1e293b; }
    .greeting-text { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 18px; }
    .announcement-card { background: linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #bae6fd; border-left: 5px solid #0284c7; border-radius: 0 16px 16px 0; padding: 24px; margin-bottom: 26px; }
    .announcement-badge { display: inline-block; background: #0284c7; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; margin-bottom: 12px; }
    .announcement-headline { font-size: 18px; font-weight: 800; color: #0369a1; margin: 0 0 12px; }
    .announcement-body { font-size: 15px; line-height: 1.7; color: #0c4a6e; white-space: pre-line; margin: 0; }
    .cta-wrapper { text-align: center; margin: 34px 0 28px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 700; padding: 16px 36px; border-radius: 14px; box-shadow: 0 6px 20px -2px rgba(2, 132, 199, 0.4); }
    .ar-card { direction: rtl; text-align: right; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px 24px; margin-bottom: 24px; }
    .ar-greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
    .ar-headline { font-size: 17px; font-weight: 800; color: #0f172a; margin-bottom: 10px; }
    .ar-body { font-size: 14px; line-height: 1.75; color: #334155; white-space: pre-line; margin: 0 0 14px; }
    .alert-box { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 14px; padding: 18px 20px; text-align: center; margin-top: 28px; }
    .alert-title { font-size: 13px; font-weight: 800; color: #9f1239; margin-bottom: 6px; }
    .alert-desc { font-size: 12px; color: #881337; line-height: 1.55; }
    .footer-section { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 28px 24px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6; }
    .footer-links a { color: #0284c7; text-decoration: none; font-weight: 600; margin: 0 8px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header-bg">
      <div class="logo-wrapper">
        <img src="{{logo_url}}" alt="PharmaCore Logo" width="60" height="60" style="display:block; border-radius: 12px;" />
      </div>
      <h1 class="brand-title">PharmaCore | فارما كور</h1>
      <p class="brand-subtitle">Official Academic Announcement</p>
      <div><span class="badge-do-not-reply">⚠️ Automated Broadcast • Do Not Reply</span></div>
    </div>
    <div class="content-body">
      <div class="greeting-text">Hello, {{user_name}} 👋</div>
      <div class="announcement-card">
        <span class="announcement-badge">📢 Official Notice</span>
        <h2 class="announcement-headline">{{title_en}}</h2>
        <div class="announcement-body">{{message_en}}</div>
      </div>
      <div class="cta-wrapper">
        <a href="{{action_url}}" class="cta-btn" target="_blank" rel="noopener noreferrer">{{action_text_en}}</a>
      </div>
      <div class="ar-card">
        <div class="ar-greeting">مرحبًا {{user_name}}،</div>
        <div class="ar-headline">📢 {{title_ar}}</div>
        <div class="ar-body">{{message_ar}}</div>
        <div style="text-align: center;"><a href="{{action_url}}" style="color: #0284c7; font-weight: 700;">{{action_text_ar}}</a></div>
      </div>
      <div class="alert-box">
        <div class="alert-title">⚠️ Do Not Reply • بريد آلي غير مخصص لاستقبال الردود</div>
        <div class="alert-desc">This is an automated announcement from an unmonitored mailbox. Please do not reply directly to this email.</div>
      </div>
    </div>
    <div class="footer-section">
      <div class="footer-links">
        <a href="{{site_url}}">PharmaCore Platform</a> &bull;
        <a href="{{profile_url}}">Notification Settings</a> &bull;
        <a href="{{feedback_url}}">Support &amp; Feedback</a>
      </div>
      <p style="margin: 6px 0 0;">&copy; {{current_year}} PharmaCore Clinical Education. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`

export const DEFAULT_MARKETING_TEMPLATE = `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title_en}} — Special Announcement</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Tajawal', sans-serif; }
    .email-container { max-width: 620px; margin: 32px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.4); }
    .hero-banner { background: linear-gradient(135deg, #092e3b 0%, #0d9488 60%, #14b8a6 100%); padding: 44px 32px 36px; text-align: center; color: #ffffff; position: relative; }
    .badge-promo { display: inline-block; background: #f59e0b; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 16px; border-radius: 30px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4); }
    .hero-title { font-size: 28px; font-weight: 800; line-height: 1.25; margin: 0 0 10px; }
    .hero-subtitle { font-size: 15px; color: #ccfbf1; margin: 0; font-weight: 500; }
    .content-body { padding: 36px 32px; color: #334155; }
    .promo-highlight-box { background: linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%); border: 2px dashed #22c55e; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
    .promo-code-title { font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
    .promo-code-pill { display: inline-block; font-family: monospace; font-size: 20px; font-weight: 800; color: #15803d; background: #ffffff; padding: 8px 24px; border-radius: 10px; border: 1px solid #86efac; letter-spacing: 2px; }
    .body-paragraph { font-size: 15px; line-height: 1.7; color: #334155; margin-bottom: 18px; }
    .cta-wrapper { text-align: center; margin: 36px 0 24px; }
    .cta-btn-marketing { display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff !important; text-decoration: none; font-size: 16px; font-weight: 800; padding: 18px 40px; border-radius: 16px; box-shadow: 0 8px 24px -4px rgba(13, 148, 136, 0.5); letter-spacing: 0.3px; }
    .ar-section { direction: rtl; text-align: right; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-top: 24px; }
    .ar-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 10px; }
    .footer-section { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 28px 24px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6; }
    .footer-links a { color: #0d9488; text-decoration: none; font-weight: 600; margin: 0 8px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="hero-banner">
      <div class="badge-promo">⭐ {{promo_badge}}</div>
      <h1 class="hero-title">{{title_en}}</h1>
      <p class="hero-subtitle">{{subtitle_en}}</p>
    </div>
    <div class="content-body">
      <p class="body-paragraph">Hello <strong>{{user_name}}</strong>,</p>
      <div class="body-paragraph">{{message_en}}</div>

      <div class="promo-highlight-box">
        <div class="promo-code-title">Your Exclusive Access Code / كود الوصول الحصري:</div>
        <div class="promo-code-pill">{{promo_code}}</div>
      </div>

      <div class="cta-wrapper">
        <a href="{{action_url}}" class="cta-btn-marketing" target="_blank">{{action_text_en}}</a>
      </div>

      <div class="ar-section">
        <div class="ar-title">📢 {{title_ar}}</div>
        <p style="font-size: 14px; line-height: 1.8; color: #334155; margin: 0 0 14px;">{{message_ar}}</p>
        <div style="text-align: center;"><a href="{{action_url}}" style="color: #0d9488; font-weight: 800; font-size: 14px;">{{action_text_ar}} ←</a></div>
      </div>
    </div>
    <div class="footer-section">
      <div class="footer-links">
        <a href="{{site_url}}">PharmaCore Platform</a> &bull;
        <a href="{{profile_url}}">Email Preferences &amp; Opt-Out</a> &bull;
        <a href="{{feedback_url}}">Help Center</a>
      </div>
      <p style="margin: 8px 0 0; font-size: 11px; color: #94a3b8;">
        You received this promotional message because you have an active account with PharmaCore.
        <br>To manage marketing email preferences or opt out, visit <a href="{{profile_url}}" style="color: #0d9488;">Profile Preferences</a>.
      </p>
    </div>
  </div>
</body>
</html>`

export const DEFAULT_DIRECT_MESSAGE_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Tajawal', sans-serif; }
    .email-container { max-width: 600px; margin: 28px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px 28px; }
    .header-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
    .sender-badge { display: inline-block; background: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; }
    .message-content { font-size: 15px; line-height: 1.7; color: #1e293b; margin: 20px 0; white-space: pre-line; }
    .cta-btn { display: inline-block; background: #0f766e; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 10px; margin-top: 14px; }
    .footer-note { margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header-logo">
      <img src="{{logo_url}}" width="40" height="40" alt="PharmaCore" style="border-radius: 8px;" />
      <div>
        <div style="font-weight: 800; font-size: 16px; color: #0f172a;">PharmaCore Academic Advisory</div>
        <div class="sender-badge">{{sender_name}}</div>
      </div>
    </div>
    <div style="font-size: 16px; font-weight: 700; color: #0f172a;">Dear {{user_name}},</div>
    <div class="message-content">{{message_content}}</div>
    <div style="text-align: center;"><a href="{{action_url}}" class="cta-btn">{{action_text}}</a></div>
    <div class="footer-note">
      This is an official communication dispatched from PharmaCore Platform.<br>
      <a href="{{profile_url}}" style="color: #0f766e;">Manage preferences</a> &bull; <a href="{{site_url}}" style="color: #0f766e;">Visit Platform</a>
    </div>
  </div>
</body>
</html>`

export const DEFAULT_CONTAINER_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Tajawal', sans-serif; }
    .wrapper { max-width: 640px; margin: 28px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
    .body { padding: 32px 28px; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="{{logo_url}}" width="48" height="48" alt="Logo" style="border-radius: 10px; margin-bottom: 8px;" />
      <h2 style="margin: 0; font-size: 20px;">PharmaCore</h2>
    </div>
    <div class="body">
      {{{content_html}}}
    </div>
    <div class="footer">
      <p style="margin: 0;">&copy; {{current_year}} PharmaCore Platform &bull; <a href="{{profile_url}}" style="color: #0284c7;">Settings</a></p>
    </div>
  </div>
</body>
</html>`

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface MentorReplyEmailOptions {
  toEmail: string
  studentName: string
  mentorName: string
  mentorRole?: string
  lectureId: string
  lectureTitleEn: string
  lectureTitleAr: string
  questionText: string
  answerText: string
  siteUrl?: string
}

export interface BroadcastAnnouncementEmailOptions {
  toEmail: string
  studentName: string
  titleEn: string
  titleAr: string
  messageEn: string
  messageAr: string
  actionUrl?: string
  actionTextEn?: string
  actionTextAr?: string
  siteUrl?: string
}

export interface SendCustomEmailOptions {
  toEmail: string
  subject: string
  htmlContent: string
  fromAddress?: string
}

export interface SendBatchCustomEmailsOptions {
  recipients: Array<{
    toEmail: string
    userName?: string
    customVariables?: Record<string, string>
  }>
  subjectTemplate: string
  htmlTemplate: string
  defaultVariables?: Record<string, string>
  fromAddress?: string
}

// ─── Backward-Compatible HTML Builders ───────────────────────────────────────

export function buildMentorReplyEmailHtml(options: Omit<MentorReplyEmailOptions, "toEmail">): string {
  const safeStudentName = escapeHtml(options.studentName || "Student / طالب")
  const safeMentorName = escapeHtml(options.mentorName || "Faculty Instructor / المحاضر")
  const safeMentorRole = escapeHtml(options.mentorRole || "Academic Mentor / مشرف أكاديمي")
  const safeLectureEn = escapeHtml(options.lectureTitleEn || "Clinical Pharmacology Lecture")
  const safeLectureAr = escapeHtml(options.lectureTitleAr || "محاضرة علم الأدوية السريري")
  const safeQuestion = escapeHtml(options.questionText.length > 350 ? options.questionText.slice(0, 350) + "..." : options.questionText)
  const safeAnswer = escapeHtml(options.answerText.length > 800 ? options.answerText.slice(0, 800) + "..." : options.answerText)

  const cleanBaseUrl = (options.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://pharma-core-edu.vercel.app").replace(/\/+$/, "")
  const lectureUrl = `${cleanBaseUrl}/lecture/${encodeURIComponent(options.lectureId)}#discussion`
  const profileUrl = `${cleanBaseUrl}/profile?tab=info`
  const logoUrl = `${cleanBaseUrl}/android-chrome-192x192.png`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>New Mentor Response — PharmaCore</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Tajawal', sans-serif; }
    .email-container { max-width: 620px; margin: 32px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header-bg { background: linear-gradient(135deg, #092e3b 0%, #0e5a6f 50%, #083344 100%); padding: 36px 28px 30px; text-align: center; color: #ffffff; }
    .logo-wrapper { display: inline-block; width: 68px; height: 68px; background: #ffffff; border-radius: 18px; padding: 4px; margin-bottom: 14px; }
    .badge-do-not-reply { display: inline-block; background: rgba(255, 255, 255, 0.14); border: 1px solid rgba(255, 255, 255, 0.28); color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 5px 14px; border-radius: 30px; margin-top: 14px; }
    .content-body { padding: 36px 32px; color: #1e293b; }
    .context-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; margin-bottom: 22px; }
    .question-card { background-color: #f8fafc; border-left: 4px solid #64748b; border-radius: 0 14px 14px 0; padding: 18px 20px; margin-bottom: 20px; }
    .answer-card { background: linear-gradient(180deg, #f0fdfa 0%, #e6fffa 100%); border: 1px solid #99f6e4; border-left: 5px solid #0d9488; border-radius: 0 16px 16px 0; padding: 22px; margin-bottom: 28px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 700; padding: 16px 36px; border-radius: 14px; }
    .alert-box { background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 14px; padding: 18px 20px; text-align: center; margin: 28px 0 0 0; }
    .footer-section { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 28px 24px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header-bg">
      <div class="logo-wrapper">
        <img src="${logoUrl}" alt="PharmaCore Logo" width="60" height="60" style="display:block; border-radius: 12px;" />
      </div>
      <h1 style="margin:0; font-size:26px;">PharmaCore | فارما كور</h1>
      <p style="margin:6px 0 0; color:#99f6e4; font-size:13px;">Clinical Pharmacology & Medical Education Platform</p>
      <div><span class="badge-do-not-reply">⚠️ Automated Notification • Do Not Reply</span></div>
    </div>
    <div class="content-body">
      <div style="font-size:20px; font-weight:700; color:#0f172a; margin-bottom:16px;">Hello, ${safeStudentName} 👋</div>
      <p style="font-size:15px; color:#334155; line-height:1.65;">An academic mentor has answered your question on the <strong>PharmaCore Q&amp;A Hub</strong>.</p>
      <div class="context-card">
        <div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Course Lecture / المحاضرة المعنية</div>
        <div style="font-size:14px; font-weight:700; color:#0f172a;">${safeLectureEn} <span style="font-weight:normal; color:#64748b;">(${safeLectureAr})</span></div>
      </div>
      <div class="question-card">
        <div style="font-size:12px; font-weight:700; color:#64748b; margin-bottom:8px;">❓ Your Question / استفسارك:</div>
        <div style="font-size:14px; color:#475569; font-style:italic;">"${safeQuestion}"</div>
      </div>
      <div class="answer-card">
        <div style="margin-bottom:12px; font-size:13px; font-weight:800; color:#0f766e;">👨‍⚕️ ${safeMentorName} &bull; <span style="background:#0d9488; color:#fff; padding:2px 8px; border-radius:4px; font-size:11px;">${safeMentorRole}</span></div>
        <div style="font-size:15px; color:#115e59; line-height:1.7; white-space:pre-line;">${safeAnswer}</div>
      </div>
      <div style="text-align:center; margin:30px 0;"><a href="${lectureUrl}" class="cta-btn" target="_blank">View Discussion &amp; Continue Lecture →</a></div>
      <div class="alert-box">
        <div style="font-size:13px; font-weight:800; color:#9f1239; margin-bottom:6px;">⚠️ Do Not Reply • بريد آلي غير مخصص لاستقبال الردود</div>
        <div style="font-size:12px; color:#881337;">This is an automated notification from an unmonitored mailbox. Please do not reply directly to this email.</div>
      </div>
    </div>
    <div class="footer-section">
      <div><a href="${cleanBaseUrl}" style="color:#0d9488; text-decoration:none;">PharmaCore Platform</a> &bull; <a href="${profileUrl}" style="color:#0d9488; text-decoration:none;">Notification Settings</a></div>
      <p style="margin:10px 0 0;">&copy; ${new Date().getFullYear()} PharmaCore. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
}

export function buildAnnouncementEmailHtml(options: Omit<BroadcastAnnouncementEmailOptions, "toEmail">): string {
  return renderEmailTemplate(DEFAULT_ANNOUNCEMENT_TEMPLATE, {
    title_en: options.titleEn,
    title_ar: options.titleAr,
    message_en: options.messageEn,
    message_ar: options.messageAr,
    user_name: options.studentName,
    action_url: options.actionUrl || options.siteUrl || "https://pharma-core-edu.vercel.app",
    action_text_en: options.actionTextEn || "Open PharmaCore Platform →",
    action_text_ar: options.actionTextAr || "الانتقال إلى منصة فارما كور ←",
    site_url: options.siteUrl,
  })
}

// ─── Dispatch Functions ───────────────────────────────────────────────────────

/**
 * Dispatches a single custom email via Resend API.
 */
export async function sendCustomEmail(
  options: SendCustomEmailOptions
): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
  const cleanTo = sanitizeEmailHeader(options.toEmail)
  if (!cleanTo || !cleanTo.includes("@")) {
    return { success: false, error: "Invalid recipient email address" }
  }

  const subject = sanitizeEmailHeader(options.subject || "PharmaCore Notification")
  const html = options.htmlContent

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Resend Email Mock] To: ${cleanTo} | Subject: ${subject} | (Set RESEND_API_KEY for live delivery)`)
    }
    return { success: true, simulated: true }
  }

  try {
    const fromAddress = options.fromAddress || process.env.RESEND_FROM_EMAIL || "PharmaCore (Do Not Reply) <no-reply@pharmacore.edu>"
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [cleanTo],
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.warn("Resend email dispatch error:", errorData)
      return { success: false, error: `Resend error: ${response.statusText}` }
    }

    const data = await response.json()
    return { success: true, messageId: data?.id }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown email dispatch error"
    console.error("Email dispatch exception:", msg)
    return { success: false, error: msg }
  }
}

/**
 * Dispatches a batch of custom templated emails to multiple recipients.
 */
export async function sendBatchCustomEmails(
  options: SendBatchCustomEmailsOptions
): Promise<{ success: boolean; total: number; dispatched: number; simulated?: boolean; errors?: string[] }> {
  const { recipients, subjectTemplate, htmlTemplate, defaultVariables = {}, fromAddress } = options
  if (!recipients.length) {
    return { success: true, total: 0, dispatched: 0 }
  }

  const errors: string[] = []
  let dispatched = 0
  let isSimulated = false

  // Process in chunks of 50
  const chunkSize = 50
  for (let i = 0; i < recipients.length; i += chunkSize) {
    const chunk = recipients.slice(i, i + chunkSize)
    const promises = chunk.map(async (r) => {
      const recipientVars = {
        ...defaultVariables,
        user_name: r.userName || defaultVariables.user_name || "Student",
        user_email: r.toEmail,
        ...(r.customVariables || {}),
      }

      const individualSubject = renderEmailTemplate(subjectTemplate, recipientVars)
      const individualHtml = renderEmailTemplate(htmlTemplate, recipientVars)

      const result = await sendCustomEmail({
        toEmail: r.toEmail,
        subject: individualSubject,
        htmlContent: individualHtml,
        fromAddress,
      })

      if (result.simulated) isSimulated = true
      if (result.success) {
        dispatched += 1
      } else if (result.error) {
        errors.push(`${r.toEmail}: ${result.error}`)
      }
    })

    await Promise.allSettled(promises)
  }

  return {
    success: errors.length === 0 || dispatched > 0,
    total: recipients.length,
    dispatched,
    simulated: isSimulated,
    errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
  }
}

/**
 * Dispatches a mentor Q&A answer email.
 */
export async function sendMentorReplyEmail(
  options: MentorReplyEmailOptions
): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
  const subject = `[PharmaCore - Do Not Reply] New response to your question: "${options.lectureTitleEn || "Lecture"}"`
  const html = buildMentorReplyEmailHtml(options)
  return sendCustomEmail({
    toEmail: options.toEmail,
    subject,
    htmlContent: html,
  })
}

/**
 * Dispatches a broadcast announcement email.
 */
export async function sendBroadcastAnnouncementEmail(
  options: BroadcastAnnouncementEmailOptions
): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
  const subject = `[PharmaCore - Do Not Reply] 📢 ${options.titleEn || "Academic Announcement"}`
  const html = buildAnnouncementEmailHtml(options)
  return sendCustomEmail({
    toEmail: options.toEmail,
    subject,
    htmlContent: html,
  })
}
