# Integration: Cloudflare Turnstile

## 1. Overview & Purpose
Cloudflare Turnstile provides privacy-preserving bot detection and CAPTCHA challenge verification across PharmaCore's public write endpoints (Login, Student Signup, Question Submission, and Feedback).

---

## 2. Configuration & Keys

| Variable | Scope | Purpose | Sensitive |
|---|---|---|:---:|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Client & Server | Public site key injected into the Turnstile frontend widget. | No |
| `TURNSTILE_SECRET_KEY` | Server-Only | Secret key used by serverless handlers to verify tokens via Cloudflare. | Yes |

---

## 3. Implementation Details

- **Client Widget (`components/Turnstile.tsx`)**: Embeds the Turnstile iframe widget, handles success callbacks, and refreshes tokens after form submission.
- **Server Verification (`lib/turnstile.ts`)**: Sends a POST request to `https://challenges.cloudflare.com/turnstile/v0/siteverify` passing the secret key, response token, and client IP.
- **Development Fallback**: In non-production environments (`NODE_ENV !== 'production'`), dummy test keys are recognized and automatically passed to unblock local test workflows.
