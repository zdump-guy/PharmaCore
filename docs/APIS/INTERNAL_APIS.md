# Internal API Routes Reference (All 30 Endpoints)

This document provides an exhaustive, authoritative contract reference for all **30 internal Next.js Serverless API endpoints** located in `pages/api/`.

---

## 1. Student & Public Endpoints (10 Endpoints)

### 1.1 `POST /api/students/signup`
- **File**: `pages/api/students/signup.ts`
- **Access**: Public (Gated by Turnstile Token + Rate Limit)
- **Rate Limit**: 3 requests / 60 seconds
- **Zod Schema**:
  - `email`: Valid email format
  - `password`: String (min 8 chars, at least 1 uppercase, 1 lowercase, 1 number)
  - `fullName`: String (min 2, max 100 chars)
  - `university`: String (optional)
  - `faculty`: String (optional)
  - `startYear`: Number (optional)
  - `predictedEndYear`: Number (optional)
  - `turnstileToken`: String (required in production)
- **Behavior**: Verifies Turnstile, creates user via `supabaseAdmin.auth.admin.createUser`, initializes `public.users` record with role `student`.
- **Response (201)**: `{ "success": true, "user": { "id": "...", "email": "..." } }`

---

### 1.2 `POST /api/courses/[id]/enroll`
- **File**: `pages/api/courses/[id]/enroll.ts`
- **Access**: Authenticated Student (`student`)
- **Rate Limit**: 5 requests / 60 seconds
- **Behavior**: Creates an enrollment record in `public.course_enrollments` with initial `status = 'pending'`.
- **Response (201)**: `{ "success": true, "enrollment": { "id": "...", "status": "pending" } }`

---

### 1.3 `GET /api/students/enrollments`
- **File**: `pages/api/students/enrollments.ts`
- **Access**: Authenticated User (reads own records via `auth.uid()`)
- **Behavior**: Retrieves all course enrollment requests for the calling student including joined course titles and thumbnails.
- **Response (200)**: `{ "success": true, "enrollments": [...] }`

---

### 1.4 `GET /api/students/notifications`
- **File**: `pages/api/students/notifications/index.ts`
- **Access**: Authenticated User (`auth.uid()`)
- **Behavior**: Returns list of student notifications ordered by `created_at DESC`.
- **Response (200)**: `{ "success": true, "notifications": [...] }`

---

### 1.5 `POST /api/students/notifications/read`
- **File**: `pages/api/students/notifications/read.ts`
- **Access**: Authenticated User
- **Zod Schema**: `{ "notificationId": "UUID" }` or `{ "markAll": true }`
- **Behavior**: Updates `is_read = true` for target notification(s) owned by `auth.uid()`.
- **Response (200)**: `{ "success": true }`

---

### 1.6 `GET /api/students/questions`
- **File**: `pages/api/students/questions.ts`
- **Access**: Authenticated User
- **Behavior**: Returns personal community questions submitted by the calling student along with associated instructor answers.
- **Response (200)**: `{ "success": true, "questions": [...] }`

---

### 1.7 `GET/PATCH /api/students/profile`
- **File**: `pages/api/students/profile.ts`
- **Access**: Authenticated User
- **Methods**:
  - `GET`: Returns profile details for `auth.uid()`.
  - `PATCH`: Updates student fields (`firstName`, `lastName`, `phoneNumber`, `university`, `faculty`, `startYear`, `predictedEndYear`, `email_notifications_enabled`).
- **Response (200)**: `{ "success": true, "profile": { ... } }`

---

### 1.8 `GET/PATCH /api/profile`
- **File**: `pages/api/profile/index.ts`
- **Access**: Authenticated User
- **Methods**:
  - `GET`: Returns active profile session metadata.
  - `PATCH`: Updates user preferences and metadata safely.
- **Response (200)**: `{ "success": true, "user": { ... } }`

---

### 1.9 `POST /api/questions/submit`
- **File**: `pages/api/questions/submit.ts`
- **Access**: Public / Authenticated Student (Rate limited + Turnstile)
- **Rate Limit**: 5 requests / 60 seconds
- **Zod Schema**:
  - `lectureId`: UUID
  - `text`: String (min 5, max 2000 chars)
  - `authorName`: String (min 2, max 100 chars)
  - `authorEmail`: String (valid email, optional for anon)
  - `isAnonymous`: Boolean
  - `turnstileToken`: String
- **Behavior**: Sanitizes text, strips Unicode control characters, inserts into `public.community_questions`.
- **Response (201)**: `{ "success": true, "question": { "id": "...", "text": "..." } }`

---

### 1.10 `POST /api/feedback/submit`
- **File**: `pages/api/feedback/submit.ts`
- **Access**: Public / Authenticated (Rate limited + Turnstile)
- **Rate Limit**: 3 requests / 60 seconds
- **Zod Schema**:
  - `feedbackType`: `'technical' | 'academic'`
  - `category`: String
  - `title`: String (min 3, max 200 chars)
  - `description`: String (min 10, max 4000 chars)
  - `severity`: `'low' | 'medium' | 'high' | 'critical'` (default: `'medium'`)
  - `pageUrl`: String (optional)
  - `courseId`: UUID (optional)
  - `lectureId`: UUID (optional)
  - `reproductionSteps`: String (optional)
  - `academicReference`: String (optional)
  - `contactEmail`: String (optional)
  - `contactName`: String (optional)
  - `deviceInfo`: JSON object (browser, OS, viewport)
  - `turnstileToken`: String
- **Behavior**: Inserts into `public.feedback_submissions` with status `'open'`.
- **Response (201)**: `{ "success": true, "id": "..." }`

---

## 2. Staff & Developer Endpoints (13 Endpoints)

### 2.1 `POST /api/questions/answer`
- **File**: `pages/api/questions/answer.ts`
- **Access**: Staff (`dev`, `super_admin`, `mentor`)
- **Zod Schema**: `{ "questionId": "UUID", "text": "String (min 2 chars)" }`
- **Behavior**: Inserts answer into `public.community_answers`, generates in-app notification in `public.notifications`, and dispatches email via `lib/email.ts` if student has notifications enabled.
- **Response (201)**: `{ "success": true, "answer": { "id": "...", "text": "..." } }`

---

### 2.2 `GET /api/admin/feedback`
- **File**: `pages/api/admin/feedback/index.ts`
- **Access**: Staff (`dev`, `super_admin`, `mentor`)
- **Behavior**: Returns paginated, filterable list of feedback submissions (filter by `status`, `feedback_type`, `severity`).
- **Response (200)**: `{ "success": true, "submissions": [...] }`

---

### 2.3 `PATCH/DELETE /api/admin/feedback/[id]`
- **File**: `pages/api/admin/feedback/[id].ts`
- **Access**: Staff (`dev`, `super_admin`, `mentor`)
- **Methods**:
  - `PATCH`: Updates feedback status (`'open'`, `'under_review'`, `'in_progress'`, `'resolved'`, `'dismissed'`) and `admin_notes`.
  - `DELETE`: Permanently deletes feedback record (Super Admin / Dev only).
- **Response (200)**: `{ "success": true }`

---

### 2.4 `GET /api/admin/students`
- **File**: `pages/api/admin/students/index.ts`
- **Access**: Staff (`dev`, `super_admin`, `mentor`)
- **Behavior**: Returns directory of registered students with university details and active enrollment counts.
- **Response (200)**: `{ "success": true, "students": [...] }`

---

### 2.5 `GET/PATCH /api/admin/students/enrollments`
- **File**: `pages/api/admin/students/enrollments.ts`
- **Access**: Staff (`dev`, `super_admin`, `mentor`)
- **Methods**:
  - `GET`: Returns pending and active course enrollment requests.
  - `PATCH`: Modifies enrollment status (`'active'`, `'rejected'`).
- **Response (200)**: `{ "success": true }`

---

### 2.6 `GET /api/admin/analytics`
- **File**: `pages/api/admin/analytics.ts`
- **Access**: Staff (`dev`, `super_admin`, `mentor`)
- **Behavior**: Computes aggregated metrics: total students, total course views, active lectures, feedback resolution rate, and daily event counts.
- **Response (200)**: `{ "success": true, "analytics": { ... } }`

---

### 2.7 `GET/POST /api/admin/settings/signup`
- **File**: `pages/api/admin/settings/signup.ts`
- **Access**: Staff (`dev`, `super_admin`)
- **Behavior**: Reads or updates global configuration allowing or disabling open student self-registration.
- **Response (200)**: `{ "success": true, "signupEnabled": boolean }`

---

### 2.8 `POST /api/admin/announcements/broadcast`
- **File**: `pages/api/admin/announcements/broadcast.ts`
- **Access**: Staff (`dev`, `super_admin`)
- **Rate Limit**: 2 requests / 60 seconds
- **Zod Schema**: `{ "titleEn": "...", "titleAr": "...", "messageEn": "...", "messageAr": "...", "courseId": "UUID (optional)" }`
- **Behavior**: Creates in-app notifications for all enrolled students or platform-wide user base.
- **Response (200)**: `{ "success": true, "dispatchedCount": number }`

---

### 2.9 `GET /api/admin/users`
- **File**: `pages/api/admin/users/index.ts`
- **Access**: Staff (`dev`, `super_admin`)
- **Behavior**: Lists all staff and administrative user accounts and assigned mentor courses.
- **Response (200)**: `{ "success": true, "users": [...] }`

---

### 2.10 `POST /api/admin/users/create`
- **File**: `pages/api/admin/users/create.ts`
- **Access**: Developer only (`dev`)
- **Zod Schema**: `{ "email": "...", "password": "...", "fullName": "...", "role": "'mentor' | 'super_admin'" }`
- **Behavior**: Creates new administrative user with `must_change_password = true`.
- **Response (201)**: `{ "success": true, "userId": "..." }`

---

### 2.11 `GET/POST /api/uploadthing`
- **File**: `pages/api/uploadthing.ts`
- **Access**: Handled via UploadThing server router (`server/uploadthing.ts`)
- **Behavior**: Authenticates upload requests and receives post-upload webhook notifications.
- **Response (200)**: Handled by `@uploadthing/react` router.

---

### 2.12 `DELETE /api/questions/[id]`
- **File**: `pages/api/questions/[id].ts`
- **Access**: Developer only (`dev`)
- **Rate Limit**: 20 requests / 60 seconds
- **Zod Schema**: `id: UUID` (query parameter)
- **Behavior**: Validates bearer token, verifies caller has `dev` role in `public.users`, checks question existence, and permanently deletes target question from `public.community_questions`. PostgreSQL cascades deletion to associated answers in `public.community_answers` and in-app notifications in `public.notifications`.
- **Response (200)**: `{ "success": true, "message": "Question and associated replies deleted successfully", "questionId": "..." }`
- **Error Codes**: `400` (invalid UUID), `401` (unauthorized), `403` (forbidden, non-dev role), `404` (not found), `405` (non-DELETE method), `429` (rate limited), `500` (database error).

---

### 2.13 `DELETE /api/questions/answers/[id]`
- **File**: `pages/api/questions/answers/[id].ts`
- **Access**: Developer only (`dev`)
- **Rate Limit**: 30 requests / 60 seconds
- **Zod Schema**: `id: UUID` (query parameter)
- **Behavior**: Validates bearer token, verifies caller has `dev` role in `public.users`, checks answer existence, and permanently deletes target reply from `public.community_answers`.
- **Response (200)**: `{ "success": true, "message": "Answer deleted successfully", "answerId": "...", "questionId": "..." }`
- **Error Codes**: `400` (invalid UUID), `401` (unauthorized), `403` (forbidden, non-dev role), `404` (not found), `405` (non-DELETE method), `429` (rate limited), `500` (database error).

---

## 3. Email Campaigns & Template Management Endpoints (7 Endpoints)

### 3.1 `GET/POST /api/admin/emails/templates`
- **File**: `pages/api/admin/emails/templates/index.ts`
- **Access**: Staff (`dev`, `super_admin`, `mentor` for GET; `dev`, `super_admin` for POST)
- **Rate Limit**: 30 requests / 60 seconds
- **Methods**:
  - `GET`: Returns list of built-in system defaults and custom user-uploaded email templates stored in `public.email_templates`.
  - `POST`: Validates and inserts a new custom HTML template. Supports Zod-validated template metadata, subject placeholder patterns, HTML content, and custom dynamic variables schema.
- **Response (200/201)**: `{ "success": true, "templates": [...] }` or `{ "success": true, "template": { ... } }`

---

### 3.2 `GET/PATCH/DELETE /api/admin/emails/templates/[id]`
- **File**: `pages/api/admin/emails/templates/[id].ts`
- **Access**: Staff (`dev`, `super_admin`, `mentor` for GET; `dev`, `super_admin` for PATCH/DELETE)
- **Rate Limit**: 30 requests / 60 seconds
- **Methods**:
  - `GET`: Fetches a single email template by UUID.
  - `PATCH`: Updates custom template title, subject template, HTML markup, and variable definitions.
  - `DELETE`: Permanently deletes a custom email template. Protected built-in system defaults (`is_default = true` or `category = 'system'`) are rejected with `HTTP 400`.
- **Response (200)**: `{ "success": true, "template": { ... } }` or `{ "success": true, "message": "Template deleted successfully" }`

---

### 3.3 `POST /api/admin/emails/send`
- **File**: `pages/api/admin/emails/send.ts`
- **Access**: Staff (`dev`, `super_admin`, `mentor`)
- **Rate Limit**: 10 requests / 60 seconds
- **Zod Schema**:
  - `target_audience`: `'all' | 'staff' | 'students' | 'marketing' | 'custom_set' | 'single_user' | 'course_enrolled'`
  - `student_status`: `'all' | 'active_only'` (optional)
  - `course_id`: UUID (optional)
  - `university`: String (optional)
  - `target_user_ids`: Array of UUIDs (optional)
  - `target_emails`: Array of valid emails (optional)
  - `single_user_id`: UUID (optional)
  - `single_email`: Valid email (optional)
  - `template_id`: UUID (optional)
  - `template_name`: String (optional)
  - `custom_subject`: String (min 2, max 250 chars)
  - `custom_html`: String (optional)
  - `campaign_type`: `'announcement' | 'marketing' | 'direct_message' | 'system'` (default: `'announcement'`)
  - `variables`: Record of key-value string pairs (optional)
  - `send_in_app_notification`: Boolean (default: `true`)
- **Behavior**:
  1. Resolves recipient list based on targeted audience mode and filters out opt-outs (`email_notifications_enabled === false` or `email_marketing_enabled === false` for marketing campaigns).
  2. Resolves selected template or default fallback and safely interpolates dynamic placeholders (`{{user_name}}`, `{{action_url}}`, `{{current_year}}`, etc.) with strict HTML sanitization.
  3. Batches dispatches in chunks of 50 via Resend API (or logs simulation in dev).
  4. Optionally mirrors dispatch into `public.notifications`.
  5. Inserts execution audit log into `public.email_logs`.
- **Response (200)**: `{ "success": true, "count": 42, "emailsDispatched": 42, "simulated": false, "logId": "...", "message": "..." }`

---

### 3.4 `POST /api/admin/emails/preview`
- **File**: `pages/api/admin/emails/preview.ts`
- **Access**: Staff (`dev`, `super_admin`, `mentor`)
- **Rate Limit**: 30 requests / 60 seconds
- **Zod Schema**:
  - `template_id`: UUID (optional)
  - `template_name`: String (optional)
  - `html_content`: String (optional)
  - `variables`: Record of key-value string pairs (optional)
- **Behavior**: Performs server-side variable interpolation with sample student data and returns rendered HTML for safe iframe preview.
- **Response (200)**: `{ "success": true, "html": "...", "subject": "..." }`

---

### 3.5 `POST /api/admin/emails/test`
- **File**: `pages/api/admin/emails/test.ts`
- **Access**: Staff (`dev`, `super_admin`, `mentor`)
- **Rate Limit**: 10 requests / 60 seconds
- **Zod Schema**:
  - `target_email`: Valid email (defaults to calling staff member's email)
  - `subject`: String
  - `html_content`: String
  - `variables`: Record of key-value string pairs (optional)
- **Behavior**: Renders template with current staff user's sample data and sends a test email instantly to verify visual formatting and link rendering before mass broadcasting.
- **Response (200)**: `{ "success": true, "message": "Test email sent successfully to ...", "simulated": false }`

---

### 3.6 `GET /api/admin/emails/logs`
- **File**: `pages/api/admin/emails/logs.ts`
- **Access**: Staff (`dev`, `super_admin`, `mentor`)
- **Rate Limit**: 30 requests / 60 seconds
- **Query Parameters**:
  - `limit`: Integer (1-100, default: 20)
  - `offset`: Integer (default: 0)
  - `campaign_type`: String (optional)
  - `status`: `'completed' | 'partial' | 'failed' | 'simulated'` (optional)
- **Behavior**: Retrieves paginated audit trail of all email dispatches from `public.email_logs` joined with sender user details.
- **Response (200)**: `{ "success": true, "logs": [...], "total": 128, "limit": 20, "offset": 0 }`

---

### 3.7 `GET /api/admin/users/search`
- **File**: `pages/api/admin/users/search.ts`
- **Access**: Staff (`dev`, `super_admin`, `mentor`)
- **Rate Limit**: 60 requests / 60 seconds
- **Query Parameters**: `q: String (min 2 chars)`
- **Behavior**: Performs ILIKE search against `full_name` and `email` across `public.users` to support real-time autocomplete chips in the single/cohort recipient pickers.
- **Response (200)**: `{ "success": true, "users": [{ "id": "...", "full_name": "...", "email": "...", "role": "..." }] }`


