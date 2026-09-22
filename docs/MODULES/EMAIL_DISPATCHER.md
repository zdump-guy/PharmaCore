# Module: Email Dispatcher (`lib/email.ts`)

## 1. Overview
`lib/email.ts` provides a zero-dependency HTTP client for sending transactional HTML emails through the Resend API with built-in CRLF header sanitization and HTML escaping.

---

## 2. Exported Functions

```typescript
export interface MentorAnswerEmailPayload {
  to: string;
  studentName: string;
  questionText: string;
  answerText: string;
  lectureTitle: string;
  lectureUrl: string;
}

export async function sendMentorAnswerEmail(
  payload: MentorAnswerEmailPayload
): Promise<{ success: boolean; id?: string; error?: string }>;

export async function sendBroadcastEmail(
  to: string[],
  title: string,
  message: string
): Promise<{ success: boolean; sentCount: number }>;
```
