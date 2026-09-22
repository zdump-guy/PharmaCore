# Integration: Resend (Transactional Email)

## 1. Overview & Purpose
Resend provides transactional email delivery for student notifications when instructors answer their community questions, when staff dispatch broadcasts, and for welcome emails.

---

## 2. Configuration & Keys

| Variable | Scope | Purpose | Sensitive |
|---|---|---|:---:|
| `RESEND_API_KEY` | Server-Only | API key used for HTTP Bearer authentication against `https://api.resend.com`. | Yes |
| `RESEND_FROM_EMAIL` | Server-Only | Verified sender address (e.g. `notifications@pharmacore.edu`). | No |

---

## 3. Implementation Details

- Defined in `lib/email.ts`.
- Uses native `fetch` with no third-party SDK dependencies.
- Formats emails using branded HTML templates containing the PharmaCore green accent palette (`#15803D`), explicit "Do Not Reply" warnings, and direct lecture links.
- Employs CRLF sanitization to mitigate header injection vulnerabilities.
