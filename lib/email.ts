/**
 * PharmaCore Transactional Email Dispatcher (Resend API Integration)
 * Includes defense-in-depth HTML escaping, CRLF injection defense, logo branding,
 * strict "Do Not Reply" alerts, and bilingual announcement broadcast templates.
 */

function escapeHtml(str: string | null | undefined): string {
  if (!str) return ""
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function sanitizeEmailHeader(str: string | null | undefined): string {
  if (!str) return ""
  return str.replace(/[\r\n\x00-\x1F\x7F]/g, "").trim()
}

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

/**
 * /**
 * Builds the responsive, bilingual HTML template for mentor answer notifications.
 * Designed to mirror the modern PharmaCore platform interface.
 */
export function buildMentorReplyEmailHtml({
  studentName,
  mentorName,
  mentorRole = "Academic Mentor / مشرف أكاديمي",
  lectureId,
  lectureTitleEn,
  lectureTitleAr,
  questionText,
  answerText,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pharma-core-edu.vercel.app",
}: Omit<MentorReplyEmailOptions, "toEmail">): string {
  const safeStudentName = escapeHtml(studentName || "Student / طالب")
  const safeMentorName = escapeHtml(mentorName || "Faculty Instructor / المحاضر")
  const safeMentorRole = escapeHtml(mentorRole)
  const safeLectureEn = escapeHtml(lectureTitleEn || "Clinical Pharmacology Lecture")
  const safeLectureAr = escapeHtml(lectureTitleAr || "محاضرة علم الأدوية السريري")
  const safeQuestion = escapeHtml(questionText.length > 350 ? questionText.slice(0, 350) + "..." : questionText)
  const safeAnswer = escapeHtml(answerText.length > 800 ? answerText.slice(0, 800) + "..." : answerText)

  const cleanBaseUrl = siteUrl.replace(/\/+$/, "")
  const lectureUrl = `${cleanBaseUrl}/lecture/${encodeURIComponent(lectureId)}#discussion`
  const profileUrl = `${cleanBaseUrl}/profile?tab=info`
  const logoUrl = `${cleanBaseUrl}/android-chrome-192x192.png`

  const preheaderText = `New response from ${safeMentorName} on "${safeLectureEn}". View your answer on PharmaCore.`

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>New Mentor Response — PharmaCore</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      height: 100% !important;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, 'Tajawal', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-container {
      max-width: 620px;
      margin: 32px auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04);
    }
    .header-bg {
      background: linear-gradient(135deg, #092e3b 0%, #0e5a6f 50%, #083344 100%);
      padding: 36px 28px 30px 28px;
      text-align: center;
      color: #ffffff;
      border-bottom: 3px solid #14b8a6;
    }
    .logo-wrapper {
      display: inline-block;
      width: 68px;
      height: 68px;
      background: #ffffff;
      border-radius: 18px;
      padding: 4px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
      margin-bottom: 14px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
      color: #ffffff;
      line-height: 1.2;
    }
    .brand-subtitle {
      font-size: 13px;
      font-weight: 500;
      color: #99f6e4;
      margin: 6px 0 0 0;
      letter-spacing: 0.2px;
    }
    .badge-do-not-reply {
      display: inline-block;
      background: rgba(255, 255, 255, 0.14);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.28);
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 5px 14px;
      border-radius: 30px;
      margin-top: 14px;
    }
    .content-body {
      padding: 36px 32px;
      color: #1e293b;
    }
    .greeting-text {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
      letter-spacing: -0.3px;
    }
    .lead-text {
      font-size: 15px;
      line-height: 1.65;
      color: #334155;
      margin: 0 0 24px 0;
    }
    .context-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px 18px;
      margin-bottom: 22px;
    }
    .context-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .context-value {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .question-card {
      background-color: #f8fafc;
      border-left: 4px solid #64748b;
      border-radius: 0 14px 14px 0;
      padding: 18px 20px;
      margin-bottom: 20px;
    }
    .card-meta-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
    }
    .question-text {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      font-style: italic;
    }
    .answer-card {
      background: linear-gradient(180deg, #f0fdfa 0%, #e6fffa 100%);
      border: 1px solid #99f6e4;
      border-left: 5px solid #0d9488;
      border-radius: 0 16px 16px 0;
      padding: 22px 22px;
      margin-bottom: 28px;
      box-shadow: 0 4px 14px -3px rgba(13, 148, 136, 0.12);
    }
    .mentor-tag {
      display: inline-block;
      background-color: #0d9488;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 0.3px;
    }
    .answer-text {
      font-size: 15px;
      line-height: 1.7;
      color: #115e59;
      font-weight: 500;
      white-space: pre-line;
    }
    .cta-wrapper {
      text-align: center;
      margin: 34px 0 28px 0;
    }
    .cta-btn {
      display: inline-block;
      background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 700;
      padding: 16px 36px;
      border-radius: 14px;
      box-shadow: 0 6px 20px -2px rgba(13, 148, 136, 0.4);
      letter-spacing: 0.2px;
    }
    .ar-divider {
      margin: 28px 0 24px 0;
      border: 0;
      height: 1px;
      background: linear-gradient(to right, rgba(226, 232, 240, 0), rgba(203, 213, 225, 1), rgba(226, 232, 240, 0));
    }
    .ar-card {
      direction: rtl;
      text-align: right;
      font-family: 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, sans-serif;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px 22px;
      margin-bottom: 24px;
    }
    .ar-greeting {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
    }
    .ar-body {
      font-size: 13.5px;
      line-height: 1.7;
      color: #334155;
      margin: 0;
    }
    .alert-box {
      background-color: #fff1f2;
      border: 1px solid #fecdd3;
      border-radius: 14px;
      padding: 18px 20px;
      text-align: center;
      margin: 28px 0 0 0;
    }
    .alert-title {
      font-size: 13px;
      font-weight: 800;
      color: #9f1239;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 6px;
    }
    .alert-desc-en {
      font-size: 12.5px;
      line-height: 1.55;
      color: #881337;
      font-weight: 600;
    }
    .alert-desc-ar {
      font-size: 12px;
      line-height: 1.6;
      color: #9f1239;
      direction: rtl;
      font-family: 'Tajawal', Tahoma, sans-serif;
      margin-top: 6px;
      font-weight: 500;
    }
    .footer-section {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 28px 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }
    .footer-links {
      margin-bottom: 12px;
    }
    .footer-links a {
      color: #0d9488;
      text-decoration: none;
      font-weight: 600;
      margin: 0 8px;
    }
    .footer-links a:hover {
      text-decoration: underline;
    }
    @media only screen and (max-width: 600px) {
      .email-container { margin: 0 !important; border-radius: 0 !important; border: none !important; }
      .content-body { padding: 24px 18px !important; }
      .header-bg { padding: 28px 18px !important; }
      .brand-title { font-size: 22px !important; }
      .cta-btn { display: block !important; padding: 14px 20px !important; }
    }
  </style>
</head>
<body>
  <!-- Preheader text preview snippet -->
  <div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">
    ${preheaderText}
  </div>

  <div class="email-container">
    <!-- Platform Header with Brand Gradient and Official Logo -->
    <div class="header-bg">
      <div class="logo-wrapper">
        <img src="${logoUrl}" alt="PharmaCore Logo" width="60" height="60" style="display:block; border-radius: 12px;" />
      </div>
      <h1 class="brand-title">PharmaCore | فارما كور</h1>
      <p class="brand-subtitle">Clinical Pharmacology & Medical Education Platform</p>
      <div>
        <span class="badge-do-not-reply">⚠️ Automated Notification • Do Not Reply</span>
      </div>
    </div>

    <!-- Main Content Body -->
    <div class="content-body">
      <div class="greeting-text">Hello, ${safeStudentName} 👋</div>
      
      <p class="lead-text">
        An academic mentor has answered your clinical pharmacology inquiry on the <strong>PharmaCore Q&amp;A Hub</strong>.
      </p>

      <!-- Lecture Context Banner -->
      <div class="context-card">
        <div class="context-label">Course Lecture / المحاضرة المعنية</div>
        <div class="context-value">${safeLectureEn} <span style="font-weight: normal; color: #64748b;">(${safeLectureAr})</span></div>
      </div>

      <!-- Student Question Box -->
      <div class="question-card">
        <div class="card-meta-title" style="color: #64748b;">
          ❓ Your Question / استفسارك:
        </div>
        <div class="question-text">
          "${safeQuestion}"
        </div>
      </div>

      <!-- Instructor Response Box -->
      <div class="answer-card">
        <div style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 13px; font-weight: 800; color: #0f766e;">
            👨‍⚕️ ${safeMentorName}
          </span>
          <span class="mentor-tag">
            ✓ ${safeMentorRole}
          </span>
        </div>
        <div class="answer-text">
          ${safeAnswer}
        </div>
      </div>

      <!-- Primary Action CTA -->
      <div class="cta-wrapper">
        <a href="${lectureUrl}" class="cta-btn" target="_blank" rel="noopener noreferrer">
          View Discussion &amp; Continue Lecture →
        </a>
        <div style="margin-top: 10px; font-size: 12px; color: #94a3b8;">
          Or copy link: <a href="${lectureUrl}" style="color: #0d9488; word-break: break-all;">${lectureUrl}</a>
        </div>
      </div>

      <hr class="ar-divider" />

      <!-- Arabic RTL Card -->
      <div class="ar-card">
        <div class="ar-greeting">مرحبًا ${safeStudentName}،</div>
        <p class="ar-body">
          قام المشرف الأكاديمي <strong>${safeMentorName}</strong> بالرد على استفسارك المتعلق بمحاضرة <strong>"${safeLectureAr}"</strong>. يمكنك مراجعة الشرح الكامل والتفاعل عبر منصة فارما كور من خلال الرابط أعلاه.
        </p>
      </div>

      <!-- Strict Do Not Reply Security Warning -->
      <div class="alert-box">
        <div class="alert-title">⚠️ Do Not Reply • بريد آلي غير مخصص لاستقبال الردود</div>
        <div class="alert-desc-en">
          This is an automated notification from an unmonitored mailbox. Please do not reply directly to this email as incoming messages are not delivered. To ask follow-up questions, use the lecture discussion section on PharmaCore.
        </div>
        <div class="alert-desc-ar">
          تنبيه: هذا إشعار تلقائي صادر من نظام فارما كور. يرجى عدم الرد على هذا الإيميل مباشرة، واستخدام تبويب النقاش داخل المنصة لأي استفسارات إضافية.
        </div>
      </div>
    </div>

    <!-- Email Footer -->
    <div class="footer-section">
      <div class="footer-links">
        <a href="${cleanBaseUrl}" target="_blank">PharmaCore Platform</a> &bull;
        <a href="${profileUrl}" target="_blank">Notification Settings</a> &bull;
        <a href="${cleanBaseUrl}/feedback" target="_blank">Support &amp; Feedback</a>
      </div>
      <p style="margin: 0 0 6px 0;">
        You received this notification because you are enrolled in PharmaCore and submitted a question.
        <br>
        To manage your email preferences or opt out, visit your <a href="${profileUrl}" style="color: #0d9488; font-weight: 600;">Profile Settings</a>.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} PharmaCore Clinical Education &amp; Pharmacology Platform. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Builds the responsive, bilingual HTML template for admin broadcast announcements.
 * Styled to match the modern executive PharmaCore theme.
 */
export function buildAnnouncementEmailHtml({
  titleEn,
  titleAr,
  messageEn,
  messageAr,
  studentName,
  actionUrl,
  actionTextEn = "Open PharmaCore Platform →",
  actionTextAr = "الانتقال إلى منصة فارما كور ←",
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pharma-core-edu.vercel.app",
}: Omit<BroadcastAnnouncementEmailOptions, "toEmail">): string {
  const safeTitleEn = escapeHtml(titleEn || "Important Announcement from PharmaCore")
  const safeTitleAr = escapeHtml(titleAr || "إعلان هام من إدارة فارما كور")
  const safeMessageEn = escapeHtml(messageEn)
  const safeMessageAr = escapeHtml(messageAr)
  const safeStudentName = escapeHtml(studentName || "Student / طالب")

  const cleanBaseUrl = siteUrl.replace(/\/+$/, "")
  const safeActionUrl = actionUrl || cleanBaseUrl
  const profileUrl = `${cleanBaseUrl}/profile?tab=info`
  const logoUrl = `${cleanBaseUrl}/android-chrome-192x192.png`

  const preheaderText = `Official announcement from PharmaCore: ${safeTitleEn}.`

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${safeTitleEn} — PharmaCore</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      height: 100% !important;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, 'Tajawal', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-container {
      max-width: 620px;
      margin: 32px auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04);
    }
    .header-bg {
      background: linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #075985 100%);
      padding: 36px 28px 30px 28px;
      text-align: center;
      color: #ffffff;
      border-bottom: 3px solid #38bdf8;
    }
    .logo-wrapper {
      display: inline-block;
      width: 68px;
      height: 68px;
      background: #ffffff;
      border-radius: 18px;
      padding: 4px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
      margin-bottom: 14px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
      color: #ffffff;
      line-height: 1.2;
    }
    .brand-subtitle {
      font-size: 13px;
      font-weight: 500;
      color: #bae6fd;
      margin: 6px 0 0 0;
      letter-spacing: 0.2px;
    }
    .badge-do-not-reply {
      display: inline-block;
      background: rgba(255, 255, 255, 0.14);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.28);
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 5px 14px;
      border-radius: 30px;
      margin-top: 14px;
    }
    .content-body {
      padding: 36px 32px;
      color: #1e293b;
    }
    .greeting-text {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 18px 0;
      letter-spacing: -0.3px;
    }
    .announcement-card {
      background: linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #bae6fd;
      border-left: 5px solid #0284c7;
      border-radius: 0 16px 16px 0;
      padding: 24px 24px;
      margin-bottom: 26px;
      box-shadow: 0 4px 14px -3px rgba(2, 132, 199, 0.12);
    }
    .announcement-badge {
      display: inline-block;
      background-color: #0284c7;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 12px;
      letter-spacing: 0.4px;
    }
    .announcement-headline {
      font-size: 18px;
      font-weight: 800;
      color: #0369a1;
      margin: 0 0 12px 0;
      line-height: 1.35;
    }
    .announcement-body {
      font-size: 15px;
      line-height: 1.7;
      color: #0c4a6e;
      white-space: pre-line;
      margin: 0;
    }
    .cta-wrapper {
      text-align: center;
      margin: 34px 0 28px 0;
    }
    .cta-btn {
      display: inline-block;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 700;
      padding: 16px 36px;
      border-radius: 14px;
      box-shadow: 0 6px 20px -2px rgba(2, 132, 199, 0.4);
      letter-spacing: 0.2px;
    }
    .ar-divider {
      margin: 28px 0 24px 0;
      border: 0;
      height: 1px;
      background: linear-gradient(to right, rgba(226, 232, 240, 0), rgba(203, 213, 225, 1), rgba(226, 232, 240, 0));
    }
    .ar-card {
      direction: rtl;
      text-align: right;
      font-family: 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, sans-serif;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 22px 24px;
      margin-bottom: 24px;
    }
    .ar-greeting {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 10px;
    }
    .ar-headline {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 10px;
    }
    .ar-body {
      font-size: 14px;
      line-height: 1.75;
      color: #334155;
      white-space: pre-line;
      margin: 0 0 14px 0;
    }
    .alert-box {
      background-color: #fff1f2;
      border: 1px solid #fecdd3;
      border-radius: 14px;
      padding: 18px 20px;
      text-align: center;
      margin: 28px 0 0 0;
    }
    .alert-title {
      font-size: 13px;
      font-weight: 800;
      color: #9f1239;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 6px;
    }
    .alert-desc-en {
      font-size: 12.5px;
      line-height: 1.55;
      color: #881337;
      font-weight: 600;
    }
    .alert-desc-ar {
      font-size: 12px;
      line-height: 1.6;
      color: #9f1239;
      direction: rtl;
      font-family: 'Tajawal', Tahoma, sans-serif;
      margin-top: 6px;
      font-weight: 500;
    }
    .footer-section {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 28px 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }
    .footer-links {
      margin-bottom: 12px;
    }
    .footer-links a {
      color: #0284c7;
      text-decoration: none;
      font-weight: 600;
      margin: 0 8px;
    }
    .footer-links a:hover {
      text-decoration: underline;
    }
    @media only screen and (max-width: 600px) {
      .email-container { margin: 0 !important; border-radius: 0 !important; border: none !important; }
      .content-body { padding: 24px 18px !important; }
      .header-bg { padding: 28px 18px !important; }
      .brand-title { font-size: 22px !important; }
      .cta-btn { display: block !important; padding: 14px 20px !important; }
    }
  </style>
</head>
<body>
  <!-- Preheader text preview snippet -->
  <div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">
    ${preheaderText}
  </div>

  <div class="email-container">
    <!-- Platform Header with Blue Academic Gradient and Official Logo -->
    <div class="header-bg">
      <div class="logo-wrapper">
        <img src="${logoUrl}" alt="PharmaCore Logo" width="60" height="60" style="display:block; border-radius: 12px;" />
      </div>
      <h1 class="brand-title">PharmaCore | فارما كور</h1>
      <p class="brand-subtitle">Official Academic Announcement</p>
      <div>
        <span class="badge-do-not-reply">⚠️ Automated Broadcast • Do Not Reply</span>
      </div>
    </div>

    <!-- Main Content Body -->
    <div class="content-body">
      <div class="greeting-text">Hello, ${safeStudentName} 👋</div>
      
      <div class="announcement-card">
        <span class="announcement-badge">📢 Official Notice</span>
        <h2 class="announcement-headline">${safeTitleEn}</h2>
        <div class="announcement-body">${safeMessageEn}</div>
      </div>

      <!-- Primary Action CTA -->
      <div class="cta-wrapper">
        <a href="${safeActionUrl}" class="cta-btn" target="_blank" rel="noopener noreferrer">
          ${escapeHtml(actionTextEn)}
        </a>
        <div style="margin-top: 10px; font-size: 12px; color: #94a3b8;">
          Or copy link: <a href="${safeActionUrl}" style="color: #0284c7; word-break: break-all;">${safeActionUrl}</a>
        </div>
      </div>

      <hr class="ar-divider" />

      <!-- Arabic RTL Section -->
      <div class="ar-card">
        <div class="ar-greeting">مرحبًا ${safeStudentName}،</div>
        <div class="ar-headline">📢 ${safeTitleAr}</div>
        <div class="ar-body">${safeMessageAr}</div>
        <div style="text-align: center; margin-top: 14px;">
          <a href="${safeActionUrl}" style="color: #0284c7; font-weight: 700; text-decoration: underline; font-size: 13.5px;" target="_blank">
            ${escapeHtml(actionTextAr)}
          </a>
        </div>
      </div>

      <!-- Strict Do Not Reply Security Warning -->
      <div class="alert-box">
        <div class="alert-title">⚠️ Do Not Reply • بريد آلي غير مخصص لاستقبال الردود</div>
        <div class="alert-desc-en">
          This is an automated announcement from an unmonitored mailbox. Please do not reply directly to this email. For inquiries or technical support, visit the PharmaCore platform.
        </div>
        <div class="alert-desc-ar">
          تنبيه: هذا إعلان تلقائي صادر من نظام فارما كور. يرجى عدم الرد على هذا الإيميل مباشرة.
        </div>
      </div>
    </div>

    <!-- Email Footer -->
    <div class="footer-section">
      <div class="footer-links">
        <a href="${cleanBaseUrl}" target="_blank">PharmaCore Platform</a> &bull;
        <a href="${profileUrl}" target="_blank">Notification Settings</a> &bull;
        <a href="${cleanBaseUrl}/feedback" target="_blank">Support &amp; Feedback</a>
      </div>
      <p style="margin: 0 0 6px 0;">
        You received this announcement because you are an active student at PharmaCore.
        <br>
        To manage your email preferences or opt out, visit your <a href="${profileUrl}" style="color: #0284c7; font-weight: 600;">Profile Settings</a>.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} PharmaCore Clinical Education &amp; Pharmacology Platform. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Dispatches a transactional email alert via Resend REST API when a mentor answers a question.
 * Gracefully handles missing API keys in local development.
 */
export async function sendMentorReplyEmail(options: MentorReplyEmailOptions): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
  const cleanTo = sanitizeEmailHeader(options.toEmail)
  if (!cleanTo || !cleanTo.includes("@")) {
    return { success: false, error: "Invalid recipient email address" }
  }

  const subject = sanitizeEmailHeader(`[PharmaCore - Do Not Reply] New response to your question: "${options.lectureTitleEn || "Lecture"}"`)
  const html = buildMentorReplyEmailHtml(options)

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Resend Email Mock] To: ${cleanTo} | Subject: ${subject} | (Set RESEND_API_KEY for live delivery)`)
    }
    return { success: true, simulated: true }
  }

  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || "PharmaCore (Do Not Reply) <no-reply@pharmacore.edu>"
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
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
 * Dispatches a broadcast announcement email via Resend REST API to an individual recipient.
 */
export async function sendBroadcastAnnouncementEmail(options: BroadcastAnnouncementEmailOptions): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
  const cleanTo = sanitizeEmailHeader(options.toEmail)
  if (!cleanTo || !cleanTo.includes("@")) {
    return { success: false, error: "Invalid recipient email address" }
  }

  const subject = sanitizeEmailHeader(`[PharmaCore - Do Not Reply] 📢 ${options.titleEn || "Academic Announcement"}`)
  const html = buildAnnouncementEmailHtml(options)

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Resend Broadcast Mock] To: ${cleanTo} | Subject: ${subject}`)
    }
    return { success: true, simulated: true }
  }

  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || "PharmaCore (Do Not Reply) <no-reply@pharmacore.edu>"
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
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
      console.warn("Resend broadcast dispatch error:", errorData)
      return { success: false, error: `Resend error: ${response.statusText}` }
    }

    const data = await response.json()
    return { success: true, messageId: data?.id }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown broadcast email dispatch error"
    console.error("Broadcast email dispatch exception:", msg)
    return { success: false, error: msg }
  }
}
