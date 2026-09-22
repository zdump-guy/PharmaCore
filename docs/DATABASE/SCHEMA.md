# Database Schema Reference (All 13 Tables)

This document provides a field-by-field reference for all 13 PostgreSQL tables defined in `supabase/00_complete_production_schema.sql` and extension migrations.

---

## 1. `public.users` (Platform Users & Profiles)
Extends Supabase `auth.users(id)`.

| Column | Type | Nullable | Default | Description |
|---|---|:---:|---|---|
| `id` | `UUID` | No | `auth.uid()` | Primary key referencing `auth.users(id)` with `ON DELETE CASCADE`. |
| `email` | `TEXT` | No | — | User email address. |
| `full_name` | `TEXT` | Yes | — | Display full name. |
| `role` | `TEXT` | No | `'student'` | Access role: `'dev'`, `'super_admin'`, `'mentor'`, `'student'`. |
| `first_name` | `TEXT` | Yes | — | First name for student records. |
| `last_name` | `TEXT` | Yes | — | Last name for student records. |
| `phone_number`| `TEXT` | Yes | — | Contact telephone number. |
| `university` | `TEXT` | Yes | — | Academic institution. |
| `faculty` | `TEXT` | Yes | — | Academic faculty / major. |
| `start_year` | `INTEGER` | Yes | — | Academic enrollment start year. |
| `predicted_end_year`| `INTEGER` | Yes | — | Expected graduation year. |
| `status` | `TEXT` | Yes | `'active'` | Account status: `'active'`, `'pending'`, `'suspended'`, `'needs_setup'`. |
| `must_change_password`| `BOOLEAN`| Yes | `false` | Forces password change modal on first login for provisioned staff. |
| `email_notifications_enabled`| `BOOLEAN`| Yes | `true` | Preference toggle for receiving email notifications. |
| `created_at` | `TIMESTAMPTZ`| No | `NOW()` | Timestamp of account creation. |

---

## 2. `public.courses` (Educational Courses)

| Column | Type | Nullable | Default | Description |
|---|---|:---:|---|---|
| `id` | `UUID` | No | `uuid_generate_v4()` | Unique course identifier. |
| `title_en` | `TEXT` | No | — | Course title in English. |
| `title_ar` | `TEXT` | No | — | Course title in Arabic. |
| `description_en`| `TEXT` | Yes | — | English course summary and objectives. |
| `description_ar`| `TEXT` | Yes | — | Arabic course summary and objectives. |
| `objectives_en` | `TEXT` | Yes | — | Structured English course learning outcomes. |
| `objectives_ar` | `TEXT` | Yes | — | Structured Arabic course learning outcomes. |
| `prerequisites_en`| `TEXT` | Yes | — | English prerequisites. |
| `prerequisites_ar`| `TEXT` | Yes | — | Arabic prerequisites. |
| `thumbnail_url` | `TEXT` | Yes | — | Course banner/card image URL. |
| `mentor_id` | `UUID` | Yes | `NULL` | Primary assigned mentor (`public.users(id)`). |
| `is_locked` | `BOOLEAN`| Yes | `false` | Gating flag; if true, requires approved student enrollment. |
| `access_policy` | `TEXT` | Yes | `'students_only'`| Access tier: `'open'`, `'students_only'`, `'enrolled_only'`. |
| `created_at` | `TIMESTAMPTZ`| No | `NOW()` | Creation timestamp. |

---

## 3. `public.lectures` (Course Lecture Units)

| Column | Type | Nullable | Default | Description |
|---|---|:---:|---|---|
| `id` | `UUID` | No | `uuid_generate_v4()` | Unique lecture identifier. |
| `course_id` | `UUID` | No | — | Foreign key to `public.courses(id)` (`ON DELETE CASCADE`). |
| `title_en` | `TEXT` | No | — | Lecture title in English. |
| `title_ar` | `TEXT` | No | — | Lecture title in Arabic. |
| `details_en` | `TEXT` | Yes | — | English lecture summary & key takeaways. |
| `details_ar` | `TEXT` | Yes | — | Arabic lecture summary & key takeaways. |
| `youtube_url` | `TEXT` | No | — | Embedded YouTube video streaming URL. |
| `order` | `INTEGER` | No | `0` | Sequential sort order within the course syllabus. |
| `created_at` | `TIMESTAMPTZ`| No | `NOW()` | Creation timestamp. |

---

## 4. `public.resources` (Downloadable Materials)

| Column | Type | Nullable | Default | Description |
|---|---|:---:|---|---|
| `id` | `UUID` | No | `uuid_generate_v4()` | Unique resource identifier. |
| `lecture_id` | `UUID` | No | — | Foreign key to `public.lectures(id)` (`ON DELETE CASCADE`). |
| `title_en` | `TEXT` | No | — | English resource label. |
| `title_ar` | `TEXT` | No | — | Arabic resource label. |
| `url` | `TEXT` | No | — | Download or external link (UploadThing / Google Drive). |
| `type` | `TEXT` | No | `'pdf'` | Resource format: `'pdf'`, `'image'`, `'other'`. |

---

## 5. `public.audio_records` (Lecture Voice Notes & Audio)

| Column | Type | Nullable | Default | Description |
|---|---|:---:|---|---|
| `id` | `UUID` | No | `gen_random_uuid()` | Unique audio record identifier. |
| `lecture_id` | `UUID` | No | — | Foreign key to `public.lectures(id)` (`ON DELETE CASCADE`). |
| `course_id` | `UUID` | Yes | `NULL` | Foreign key to `public.courses(id)`. |
| `title_en` | `TEXT` | No | — | English audio title. |
| `title_ar` | `TEXT` | No | — | Arabic audio title. |
| `audio_url` | `TEXT` | No | — | UploadThing CDN URL for audio stream. |
| `duration_seconds`| `INTEGER` | Yes | `0` | Audio length in seconds. |
| `created_by` | `UUID` | Yes | `NULL` | Instructor creator (`public.users(id)`). |
| `created_at` | `TIMESTAMPTZ`| No | `NOW()` | Creation timestamp. |

---

## 6. `public.quizzes` (Interactive & PDF Assessments)

| Column | Type | Nullable | Default | Description |
|---|---|:---:|---|---|
| `id` | `UUID` | No | `uuid_generate_v4()` | Unique quiz identifier. |
| `title_en` | `TEXT` | No | — | English quiz title. |
| `title_ar` | `TEXT` | No | — | Arabic quiz title. |
| `lecture_id` | `UUID` | Yes | `NULL` | Foreign key to `public.lectures(id)`. |
| `course_id` | `UUID` | Yes | `NULL` | Foreign key to `public.courses(id)`. |
| `pdf_url` | `TEXT` | Yes | `NULL` | Downloadable question PDF URL. |
| `solution_pdf_url`| `TEXT` | Yes | `NULL` | Downloadable solution/answer key PDF URL. |
| `description_en`| `TEXT` | Yes | — | English assessment guidelines. |
| `description_ar`| `TEXT` | Yes | — | Arabic assessment guidelines. |
| `created_by` | `UUID` | Yes | `NULL` | Author user ID (`public.users(id)`). |
| `created_at` | `TIMESTAMPTZ`| No | `NOW()` | Creation timestamp. |

---

## 7. `public.questions` (Quiz Question Items)

| Column | Type | Nullable | Default | Description |
|---|---|:---:|---|---|
| `id` | `UUID` | No | `uuid_generate_v4()` | Unique question item identifier. |
| `quiz_id` | `UUID` | No | — | Foreign key to `public.quizzes(id)` (`ON DELETE CASCADE`). |
| `text_en` | `TEXT` | No | — | English question prompt. |
| `text_ar` | `TEXT` | No | — | Arabic question prompt. |
| `type` | `TEXT` | No | — | `'multiple_choice'`, `'true_false'`, `'short_text'`. |
| `options` | `JSONB` | Yes | `NULL` | Array of choices `[{ "id": "A", "text_en": "...", "text_ar": "..." }]`. |
| `correct_answer`| `TEXT` | No | — | Correct option key or exact text. |
| `order` | `INTEGER` | No | `0` | Sequential sort order in quiz runner. |

---

## 8. `public.community_questions` (Student Q&A Forum)

| Column | Type | Nullable | Default | Description |
|---|---|:---:|---|---|
| `id` | `UUID` | No | `uuid_generate_v4()` | Unique question identifier. |
| `lecture_id` | `UUID` | No | — | Foreign key to `public.lectures(id)` (`ON DELETE CASCADE`). |
| `user_id` | `UUID` | Yes | `NULL` | Authenticated student (`public.users(id)`). |
| `author_name` | `TEXT` | No | — | Display author name (or masked if anonymous). |
| `author_email`| `TEXT` | Yes | `NULL` | Student contact email (Protected via Column Level Security). |
| `is_anonymous` | `BOOLEAN`| Yes | `false` | Flag masking student identity from peers. |
| `text` | `TEXT` | No | — | Question content. |
| `created_at` | `TIMESTAMPTZ`| No | `NOW()` | Submission timestamp. |

---

## 9. `public.community_answers` (Instructor Replies)

| Column | Type | Nullable | Default | Description |
|---|---|:---:|---|---|
| `id` | `UUID` | No | `uuid_generate_v4()` | Unique answer identifier. |
| `question_id` | `UUID` | No | — | Foreign key to `public.community_questions(id)` (`ON DELETE CASCADE`). |
| `responder_id`| `UUID` | Yes | `NULL` | Instructor author (`public.users(id)`). |
| `text` | `TEXT` | No | — | Mentor response content. |
| `created_at` | `TIMESTAMPTZ`| No | `NOW()` | Response timestamp. |

---

## 10. `public.mentor_course_assignments` (Mentor RBAC Mapping)

| Column | Type | Nullable | Default | Description |
|---|---|:---:|---|---|
| `mentor_id` | `UUID` | No | — | Composite primary key referencing `public.users(id)`. |
| `course_id` | `UUID` | No | — | Composite primary key referencing `public.courses(id)`. |

---

## 11. `public.site_content` (Dynamic CMS Copy)

| Column | Type | Nullable | Default | Description |
|---|---|:---:|---|---|
| `id` | `TEXT` | No | — | Content section key (e.g. `'home'`, `'about'`, `'contact'`). |
| `content` | `JSONB` | No | `'{}'::jsonb`| Serialized bilingual copy dictionary. |
| `updated_by` | `UUID` | Yes | `NULL` | Last editor user ID (`public.users(id)`). |
| `updated_at` | `TIMESTAMPTZ`| No | `NOW()` | Last modification timestamp. |

---

## 12. `public.course_enrollments` (Student Cohort Requests)

| Column | Type | Nullable | Default | Description |
|---|---|:---:|---|---|
| `id` | `UUID` | No | `gen_random_uuid()` | Unique enrollment record identifier. |
| `user_id` | `UUID` | No | — | Student requesting access (`public.users(id)`). |
| `course_id` | `UUID` | No | — | Target course (`public.courses(id)`). |
| `status` | `TEXT` | No | `'pending'` | State: `'pending'`, `'active'`, `'rejected'`, `'completed'`. |
| `enrolled_at` | `TIMESTAMPTZ`| No | `NOW()` | Request timestamp. |

---

## 13. `public.feedback_submissions` (Bug & Academic Triage)

| Column | Type | Nullable | Default | Description |
|---|---|:---:|---|---|
| `id` | `UUID` | No | `uuid_generate_v4()` | Unique feedback submission identifier. |
| `user_id` | `UUID` | Yes | `NULL` | Submitter user ID if authenticated. |
| `feedback_type`| `TEXT` | No | — | `'technical'` (bug) or `'academic'` (curriculum). |
| `category` | `TEXT` | No | — | Feedback classification category. |
| `page_url` | `TEXT` | Yes | — | URL where issue was observed. |
| `course_id` | `UUID` | Yes | `NULL` | Related course identifier. |
| `lecture_id` | `UUID` | Yes | `NULL` | Related lecture identifier. |
| `title` | `TEXT` | No | — | Submission headline. |
| `description` | `TEXT` | No | — | Detailed issue explanation. |
| `reproduction_steps`| `TEXT` | Yes | — | Step-by-step bug reproduction guide. |
| `severity` | `TEXT` | No | `'medium'` | `'low'`, `'medium'`, `'high'`, `'critical'`. |
| `device_info` | `JSONB` | Yes | `'{}'::jsonb`| Client browser, OS, and viewport telemetry. |
| `attachment_url`| `TEXT` | Yes | — | Screenshot or log file attachment URL. |
| `academic_reference`| `TEXT`| Yes | — | Textbook citation or scientific reference. |
| `contact_email`| `TEXT` | Yes | — | Submitter contact email address. |
| `contact_name` | `TEXT` | Yes | — | Submitter contact name. |
| `status` | `TEXT` | No | `'open'` | `'open'`, `'under_review'`, `'in_progress'`, `'resolved'`, `'dismissed'`. |
| `admin_notes` | `TEXT` | Yes | — | Internal staff triage notes. |
| `resolved_by` | `UUID` | Yes | `NULL` | Resolving staff member (`public.users(id)`). |
| `resolved_at` | `TIMESTAMPTZ`| Yes | `NULL` | Resolution timestamp. |
| `created_at` | `TIMESTAMPTZ`| No | `NOW()` | Submission timestamp. |
| `updated_at` | `TIMESTAMPTZ`| No | `NOW()` | Last update timestamp. |
