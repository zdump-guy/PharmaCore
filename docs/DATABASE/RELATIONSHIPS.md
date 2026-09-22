# Database Entity Relationships & Integrity Rules

## 1. Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    USERS ||--o{ COURSES : "creates / mentors"
    USERS ||--o{ MENTOR_COURSE_ASSIGNMENTS : "assigned"
    COURSES ||--o{ MENTOR_COURSE_ASSIGNMENTS : "has"
    COURSES ||--o{ LECTURES : "contains"
    COURSES ||--o{ COURSE_ENROLLMENTS : "enrolled in"
    USERS ||--o{ COURSE_ENROLLMENTS : "submits"
    LECTURES ||--o{ RESOURCES : "attaches"
    LECTURES ||--o{ AUDIO_RECORDS : "attaches"
    LECTURES ||--o{ QUIZZES : "contains"
    COURSES ||--o{ QUIZZES : "contains"
    QUIZZES ||--o{ QUESTIONS : "contains"
    LECTURES ||--o{ COMMUNITY_QUESTIONS : "receives"
    USERS ||--o{ COMMUNITY_QUESTIONS : "authors"
    COMMUNITY_QUESTIONS ||--o{ COMMUNITY_ANSWERS : "answered by"
    USERS ||--o{ COMMUNITY_ANSWERS : "authors"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ FEEDBACK_SUBMISSIONS : "submits"
    COURSES ||--o{ FEEDBACK_SUBMISSIONS : "references"
    LECTURES ||--o{ FEEDBACK_SUBMISSIONS : "references"

    USERS {
        uuid id PK
        string email
        string full_name
        string role
        string status
        boolean must_change_password
        boolean email_notifications_enabled
    }

    COURSES {
        uuid id PK
        string title_en
        string title_ar
        boolean is_locked
        string access_policy
        uuid mentor_id FK
    }

    LECTURES {
        uuid id PK
        uuid course_id FK
        string title_en
        string title_ar
        string youtube_url
        int order
    }

    RESOURCES {
        uuid id PK
        uuid lecture_id FK
        string title_en
        string url
        string type
    }

    AUDIO_RECORDS {
        uuid id PK
        uuid lecture_id FK
        uuid course_id FK
        string audio_url
        int duration_seconds
    }

    QUIZZES {
        uuid id PK
        uuid lecture_id FK
        uuid course_id FK
        string title_en
        string pdf_url
        string solution_pdf_url
    }

    QUESTIONS {
        uuid id PK
        uuid quiz_id FK
        string text_en
        string type
        jsonb options
        string correct_answer
    }

    COMMUNITY_QUESTIONS {
        uuid id PK
        uuid lecture_id FK
        uuid user_id FK
        string author_name
        string author_email
        boolean is_anonymous
        string text
    }

    COMMUNITY_ANSWERS {
        uuid id PK
        uuid question_id FK
        uuid responder_id FK
        string text
    }

    COURSE_ENROLLMENTS {
        uuid id PK
        uuid user_id FK
        uuid course_id FK
        string status
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        string type
        string title_en
        string message_en
        boolean is_read
    }

    FEEDBACK_SUBMISSIONS {
        uuid id PK
        uuid user_id FK
        string feedback_type
        string severity
        string status
        string title
        string description
    }
```

---

## 2. Foreign Key Cascade & Orphan Prevention Rules

1. **Course Deletion (`ON DELETE CASCADE`)**:
   - Deleting a course automatically cascades and purges all child `lectures`, `mentor_course_assignments`, `quizzes`, and `course_enrollments`.
2. **Lecture Deletion (`ON DELETE CASCADE`)**:
   - Deleting a lecture automatically cascades and purges all child `resources`, `audio_records`, `quizzes`, and `community_questions`.
3. **Question Deletion (`ON DELETE CASCADE`)**:
   - Deleting a community question purges all associated `community_answers`.
4. **User Deletion / Account Removal**:
   - Deleting a user account sets `mentor_id` to `NULL` on courses, sets `responder_id` to `NULL` on community answers, and sets `resolved_by` to `NULL` on feedback, preserving curriculum and historical discussion records.
