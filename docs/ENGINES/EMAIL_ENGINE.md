# Email Engine & Transactional Messaging

## 1. Overview & Architecture

PharmaCore delivers transactional notification emails via **Resend** using a custom, zero-dependency HTTP client defined in `lib/email.ts`. This dispatcher handles notifications for mentor question replies, student account creation, and platform-wide administrative broadcasts.

```mermaid
sequenceDiagram
    autonumber
    actor Mentor as Mentor / Admin
    participant Endpoint as POST /api/questions/answer
    participant DB as PostgreSQL (public.community_answers)
    participant Dispatcher as Email Dispatcher (lib/email.ts)
    participant Resend as Resend API (https://api.resend.com/emails)
    actor Student as Student Email Inbox

    Mentor->>Endpoint: Submit Answer to Student Question
    Endpoint->>DB: Insert Answer Record
    Endpoint->>DB: Create in-app notification in public.notifications
    Endpoint->>DB: Query Student Email & email_notifications_enabled
    alt Student Opted-In for Emails
        Endpoint->>Dispatcher: sendMentorAnswerNotification({ to, questionText, answerText, lectureTitle, lectureUrl })
        Dispatcher->>Dispatcher: Escape HTML & Sanitize CRLF Headers
        Dispatcher->>Resend: POST /emails (Bearer RESEND_API_KEY)
        Resend-->>Student: Deliver Branded HTML Email
    end
    Endpoint-->>Mentor: Return 200 OK
```

---

## 2. Security Protections in `lib/email.ts`

### 2.1 CRLF Injection Defense
To prevent email header injection attacks (where attackers inject `\r\n` characters to add arbitrary `Bcc:` or `Subject:` headers), all input strings passed into headers are sanitized:
```typescript
function sanitizeHeader(val: string): string {
  return val.replace(/[\r\n]/g, '').trim();
}
```

### 2.2 Strict HTML Entity Escaping
User-generated content (question text, mentor answer, course title) interpolated into HTML email templates is escaped to prevent email client HTML injection:
```typescript
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

### 2.3 Non-Blocking Execution
Email dispatch is treated as an asynchronous side effect. If the Resend API encounters a rate limit or network error, the error is logged without failing the underlying database mutation.
