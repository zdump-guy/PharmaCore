# External Cloud APIs Reference

This document outlines the contracts, protocols, and integration points for all third-party services utilized by PharmaCore.

---

## 1. Supabase PostgREST & Auth API

- **Protocol**: HTTPS REST (`https://<project-ref>.supabase.co/rest/v1`) & WebSockets (`wss://<project-ref>.supabase.co/realtime/v1`)
- **Authentication**:
  - `apikey`: Public Anon Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) for browser queries.
  - `Authorization: Bearer <JWT>`: Authenticated user token.
  - `Authorization: Bearer <SERVICE_ROLE>`: Serverless admin client (`lib/supabaseAdmin.ts`).
- **Features Used**:
  - `auth.signUp()`, `auth.signInWithPassword()`, `auth.admin.createUser()`.
  - PostgREST queries with relational joins (`lectures(resources(*), quizzes(*))`).
  - Realtime publication subscriptions on `analytics_events`, `feedback_submissions`, `notifications`.

---

## 2. Cloudflare Turnstile Verification API

- **Endpoint**: `https://challenges.cloudflare.com/turnstile/v0/siteverify`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "secret": "TURNSTILE_SECRET_KEY",
    "response": "<client_turnstile_token>",
    "remoteip": "<client_ip>"
  }
  ```
- **Response Format**:
  ```json
  {
    "success": true,
    "challenge_ts": "2026-09-22T20:00:00.000Z",
    "hostname": "pharmacore.edu"
  }
  ```
- **Implementation**: `lib/turnstile.ts` with local development bypass fallback.

---

## 3. Resend Transactional Email API

- **Endpoint**: `https://api.resend.com/emails`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer RESEND_API_KEY`, `Content-Type: application/json`
- **Payload**:
  ```json
  {
    "from": "PharmaCore <notifications@pharmacore.edu>",
    "to": ["student@example.com"],
    "subject": "New Mentor Reply: Lecture 04",
    "html": "<p>...</p>"
  }
  ```
- **Implementation**: `lib/email.ts` with CRLF injection header filtering and HTML body escaping.

---

## 4. UploadThing File Ingress API

- **Protocol**: HTTPS Upload Router
- **SDK**: `uploadthing/server` & `@uploadthing/react`
- **Configuration**: `server/uploadthing.ts` (Handles presigned upload generation and webhook verification).

---

## 5. YouTube Embedded IFrame Player

- **Protocol**: Sandboxed IFrame Player (`https://www.youtube.com/embed/<video_id>`)
- **Implementation**: `components/YouTubePlayer.tsx`
- **Security Headers**: `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"` with strict `referrerpolicy="strict-origin-when-cross-origin"`.
