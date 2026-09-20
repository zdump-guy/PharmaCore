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
 * Builds the responsive, bilingual HTML template for mentor answer notifications.
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
  const safeMentorName = escapeHtml(mentorName || "Instructor / المحاضر")
  const safeMentorRole = escapeHtml(mentorRole)
  const safeLectureEn = escapeHtml(lectureTitleEn || "Clinical Pharmacology Lecture")
  const safeLectureAr = escapeHtml(lectureTitleAr || "محاضرة علم الأدوية السريري")
  const safeQuestion = escapeHtml(questionText.length > 250 ? questionText.slice(0, 250) + "..." : questionText)
  const safeAnswer = escapeHtml(answerText.length > 500 ? answerText.slice(0, 500) + "..." : answerText)

  const cleanBaseUrl = siteUrl.replace(/\/+$/, "")
  const lectureUrl = `${cleanBaseUrl}/lecture/${encodeURIComponent(lectureId)}#discussion`
  const profileUrl = `${cleanBaseUrl}/profile?tab=info`
  const logoUrl = `${cleanBaseUrl}/android-chrome-192x192.png`

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Mentor Response — PharmaCore</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #0f172a; }
    .wrapper { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); }
    .header { background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 32px 24px 28px 24px; text-align: center; color: #ffffff; }
    .logo-img { display: inline-block; width: 64px; height: 64px; border-radius: 14px; margin-bottom: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.18); background: #ffffff; padding: 2px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.92; }
    .do-not-reply-badge { display: inline-block; background-color: rgba(255, 255, 255, 0.2); color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-top: 10px; border: 1px solid rgba(255, 255, 255, 0.35); text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
    .announcement { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
    .box { background-color: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 14px; padding: 18px; margin-bottom: 20px; }
    .box-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0f766e; margin-bottom: 8px; }
    .box-content { font-size: 14px; line-height: 1.5; color: #134e4a; font-style: italic; }
    .mentor-badge { display: inline-block; background: #14b8a6; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; margin-top: 6px; }
    .cta-container { text-align: center; margin: 32px 0 24px 0; }
    .cta-button { display: inline-block; background-color: #0d9488; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 30px; border-radius: 12px; box-shadow: 0 3px 8px rgba(13, 148, 136, 0.35); }
    .cta-button:hover { background-color: #0f766e; }
    .ar-section { direction: rtl; text-align: right; margin-top: 24px; padding-top: 20px; border-top: 1px dashed #e2e8f0; }
    .no-reply-alert { background-color: #fff1f2; border: 1px solid #ffe4e6; border-radius: 12px; padding: 14px 16px; margin: 24px 0 0 0; text-align: center; color: #9f1239; font-size: 12px; line-height: 1.5; font-weight: 600; }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 24px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5; }
    .footer a { color: #0d9488; text-decoration: underline; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- Header with PharmaCore Logo -->
    <div class="header">
      <img src="${logoUrl}" alt="PharmaCore Logo" class="logo-img" width="64" height="64" />
      <h1>PharmaCore | فارما كور</h1>
      <p>Clinical Pharmacology & Medical Education Platform</p>
      <div>
        <span class="do-not-reply-badge">⚠️ Automated Notification • Do Not Reply</span>
      </div>
    </div>

    <!-- Main Content -->
    <div class="content">
      <div class="greeting">Hello, ${safeStudentName} 👋</div>
      <p class="announcement">
        <strong>${safeMentorName}</strong> (<span class="mentor-badge">${safeMentorRole}</span>) has replied to your clinical question regarding the lecture:
        <br>
        <strong>"${safeLectureEn}"</strong>
      </p>

      <div class="box">
        <div class="box-title">Your Question / استفسارك:</div>
        <div class="box-content">"${safeQuestion}"</div>
      </div>

      <div class="box" style="background-color: #f8fafc; border-color: #cbd5e1;">
        <div class="box-title" style="color: #334155;">Instructor's Answer / إجابة المشرف الأكاديمي:</div>
        <div class="box-content" style="color: #1e293b; font-style: normal; font-weight: 500;">
          ${safeAnswer}
        </div>
      </div>

      <div class="cta-container">
        <a href="${lectureUrl}" class="cta-button" target="_blank">
          View Discussion & Continue Lecture →
        </a>
      </div>

      <!-- Arabic Translation Section -->
      <div class="ar-section">
        <div class="greeting" style="font-size: 16px;">مرحبًا ${safeStudentName}،</div>
        <p class="announcement" style="margin-bottom: 0;">
          قام الدكتور/المشرف <strong>${safeMentorName}</strong> بالرد على استفسارك في محاضرة <strong>"${safeLectureAr}"</strong>. يمكنك مراجعة النقاش الكامل ومتابعة دراسة المحاضرة عبر الرابط أعلاه.
        </p>
      </div>

      <!-- Strict Do Not Reply Banner -->
      <div class="no-reply-alert">
        <div>⚠️ <strong>Do Not Reply:</strong> This is an automated email from an unmonitored mailbox. Please do not reply directly to this message.</div>
        <div style="direction: rtl; margin-top: 4px; font-weight: normal; font-size: 11px;">
          ⚠️ <strong>تنبيه:</strong> هذا إشعار تلقائي صادر من بريد آلي غير مخصص لاستقبال الرسائل. يرجى عدم الرد على هذا الإيميل، واستخدام قسم النقاش داخل المنصة لأي استفسار.
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        You received this notification because you are enrolled in PharmaCore and asked a lecture question.
        <br>
        To manage your email alert preferences, visit your <a href="${profileUrl}">Profile Notification Settings</a>.
      </p>
      <p style="margin-top: 8px; font-size: 11px; color: #94a3b8;">
        © ${new Date().getFullYear()} PharmaCore Clinical Education. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Builds the responsive, bilingual HTML template for admin broadcast announcements.
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

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitleEn} — PharmaCore</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #0f172a; }
    .wrapper { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); }
    .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 32px 24px 28px 24px; text-align: center; color: #ffffff; }
    .logo-img { display: inline-block; width: 64px; height: 64px; border-radius: 14px; margin-bottom: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.18); background: #ffffff; padding: 2px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.92; }
    .do-not-reply-badge { display: inline-block; background-color: rgba(255, 255, 255, 0.2); color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-top: 10px; border: 1px solid rgba(255, 255, 255, 0.35); text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
    .announcement-box { background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 14px; padding: 20px; margin-bottom: 24px; }
    .announcement-title { font-size: 16px; font-weight: 800; color: #0369a1; margin-bottom: 10px; }
    .announcement-text { font-size: 14px; line-height: 1.6; color: #0c4a6e; white-space: pre-line; }
    .cta-container { text-align: center; margin: 32px 0 24px 0; }
    .cta-button { display: inline-block; background-color: #0284c7; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 30px; border-radius: 12px; box-shadow: 0 3px 8px rgba(2, 132, 199, 0.35); }
    .cta-button:hover { background-color: #0369a1; }
    .ar-section { direction: rtl; text-align: right; margin-top: 24px; padding-top: 20px; border-top: 1px dashed #e2e8f0; }
    .no-reply-alert { background-color: #fff1f2; border: 1px solid #ffe4e6; border-radius: 12px; padding: 14px 16px; margin: 24px 0 0 0; text-align: center; color: #9f1239; font-size: 12px; line-height: 1.5; font-weight: 600; }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 24px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5; }
    .footer a { color: #0284c7; text-decoration: underline; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- Header with Logo -->
    <div class="header">
      <img src="${logoUrl}" alt="PharmaCore Logo" class="logo-img" width="64" height="64" />
      <h1>PharmaCore | فارما كور</h1>
      <p>Official Academic Announcement</p>
      <div>
        <span class="do-not-reply-badge">⚠️ Automated Broadcast • Do Not Reply</span>
      </div>
    </div>

    <!-- Main Content -->
    <div class="content">
      <div class="greeting">Hello, ${safeStudentName} 👋</div>
      
      <div class="announcement-box">
        <div class="announcement-title">📢 ${safeTitleEn}</div>
        <div class="announcement-text">${safeMessageEn}</div>
      </div>

      <div class="cta-container">
        <a href="${safeActionUrl}" class="cta-button" target="_blank">
          ${escapeHtml(actionTextEn)}
        </a>
      </div>

      <!-- Arabic Translation Section -->
      <div class="ar-section">
        <div class="greeting" style="font-size: 16px;">مرحبًا ${safeStudentName}،</div>
        <div class="announcement-box" style="background-color: #f8fafc; border-color: #e2e8f0; margin-top: 12px;">
          <div class="announcement-title" style="color: #0f172a;">📢 ${safeTitleAr}</div>
          <div class="announcement-text" style="color: #334155;">${safeMessageAr}</div>
        </div>
        <div style="text-align: center; margin-top: 16px;">
          <a href="${safeActionUrl}" style="color: #0284c7; font-weight: 700; text-decoration: underline; font-size: 13px;" target="_blank">
            ${escapeHtml(actionTextAr)}
          </a>
        </div>
      </div>

      <!-- Strict Do Not Reply Banner -->
      <div class="no-reply-alert">
        <div>⚠️ <strong>Do Not Reply:</strong> This is an automated announcement from an unmonitored mailbox. Please do not reply directly to this message.</div>
        <div style="direction: rtl; margin-top: 4px; font-weight: normal; font-size: 11px;">
          ⚠️ <strong>تنبيه:</strong> هذا إعلان تلقائي صادر من بريد آلي غير مخصص لاستقبال الرسائل. يرجى عدم الرد على هذا الإيميل.
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        You received this announcement because you are an active student at PharmaCore.
        <br>
        To manage your email alert preferences, visit your <a href="${profileUrl}">Profile Notification Settings</a>.
      </p>
      <p style="margin-top: 8px; font-size: 11px; color: #94a3b8;">
        © ${new Date().getFullYear()} PharmaCore Clinical Education. All rights reserved.
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
