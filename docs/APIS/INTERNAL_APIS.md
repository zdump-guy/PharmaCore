# Internal API Routes Reference (All 21 Endpoints)

This document provides an exhaustive, authoritative contract reference for all **21 internal Next.js Serverless API endpoints** located in `pages/api/`.

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

## 2. Staff & Administrative Endpoints (11 Endpoints)

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
