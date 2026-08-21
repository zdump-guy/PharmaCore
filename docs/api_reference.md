# REST & Edge API Reference (`docs/api_reference.md`)

## 1. Overview
PharmaCore exposes serverless API routes under `/api/*` for student operations, AI consultations, certificate generation, quiz submissions, notes, and faculty gradebook management.

---

## 2. API Endpoints

### 2.1 AI & Decision Support
#### `POST /api/ai/consult`
Executes an AI clinical pharmacology consultation with embedded calculators.
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <token>`
- **Body**: `{ prompt: string, context?: object, tool_invocation?: object }`
- **Response**: `200 OK` with `{ success: true, consultation_id: string, response: object }`

---

### 2.2 Certificates & Verification
#### `POST /api/certificates/issue`
Evaluates course completion criteria and issues a verifiable certificate.
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ course_id: string }`
- **Response**: `200 OK` with `{ success: true, certificate: object }` or `400 Bad Request` with eligibility failure reasons.

#### `GET /api/certificates/[code]`
Retrieves public certificate validation details.
- **Params**: `code` (e.g. `PC-A7B2-C9F1`)
- **Response**: `200 OK` with `{ verified: true, student_name: string, course_title: string, issue_date: string }` or `404 Not Found`.

---

### 2.3 Quizzes & Submissions
#### `POST /api/questions/answer`
Evaluates a single question in Practice Mode and returns immediate clinical rationale.
- **Body**: `{ question_id: string, selected_index: number }`
- **Response**: `200 OK` with `{ is_correct: boolean, correct_index: number, explanation: string, guideline_reference: string }`

#### `POST /api/questions/submit`
Submits a complete quiz in Standard Exam Mode.
- **Body**: `{ quiz_id: string, answers: number[], duration_seconds: number }`
- **Response**: `200 OK` with `{ score: number, passed: boolean, xp_earned: number }`

---

### 2.4 Profile & Gamification
#### `GET /api/profile`
Fetches authenticated student profile, streak stats, earned badges, and division tier.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` with `{ profile: object, streak: object, badges: array, division: object }`

#### `PUT /api/profile`
Updates student bio, target licensure exam (NAPLEX, SPLE, DHA, BCPS), and university affiliation.
- **Body**: `{ full_name?: string, bio?: string, target_exam?: string, university?: string }`
- **Response**: `200 OK` with `{ success: true, profile: object }`

---

### 2.5 Faculty & Administration
#### `GET /api/admin/analytics`
Fetches enrollment trends, completion rates, lecture drop-off funnels, and question error heatmaps.
- **Headers**: `Authorization: Bearer <admin_token>`
- **Response**: `200 OK` with `{ total_students: number, completion_funnel: array, difficulty_heatmap: array }`
