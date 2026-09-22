# Frontend Information Architecture & Site Map

## 1. Route Map & Accessibility Matrix

PharmaCore organizes its frontend into three main accessibility zones:

```mermaid
graph TD
    Root([PharmaCore Web Application])
    
    subgraph PublicZone ["Public Educational Zone"]
        Home["/ (Homepage)"]
        Course["/course/[id] (Syllabus)"]
        Lecture["/lecture/[id] (Lecture Streaming & Q&A)"]
        Quiz["/quiz/[id] (Interactive Quiz)"]
        Feedback["/feedback (Bug & Curriculum Feedback)"]
        Login["/login (Student & Staff Portal)"]
    end

    subgraph StudentZone ["Authenticated Student Zone"]
        Profile["/profile (Profile, Enrollments, Q&A Hub, Notifications)"]
    end

    subgraph StaffZone ["Administrative Control Zone"]
        AdminLogin["/admin/login (Staff Entry)"]
        AdminDash["/admin (Curriculum, Enrollments, Users, Community, Feedback, CMS)"]
    end

    Root --> PublicZone
    Root --> StudentZone
    Root --> StaffZone
```

---

## 2. Page Navigation Hierarchy

1. **Header Navigation (`components/Navbar.tsx`)**:
   - Brand Logo & Home Link.
   - Course Catalog Anchor (`#courses`).
   - Feedback Link (`/feedback`).
   - Language Switcher (`AR / EN`).
   - Theme Switcher (`Light / Dark`).
   - Auth Action (Login Button $\to$ `/login` or Student Avatar Menu with Notification Counter).

2. **Footer Navigation (`components/Footer.tsx`)**:
   - Academic department credits & mission statement.
   - Quick navigation links (Courses, Feedback, Login).
   - Social links & copyright attribution.

3. **Admin Console Navigation (`components/admin/AdminSidebar.tsx` & `AdminTopNav.tsx`)**:
   - Dashboard Overview & Telemetry.
   - Curriculum Manager (Courses, Lectures, Quizzes, Audio Records).
   - Course Enrollments (Pending Requests).
   - Students Directory.
   - User Accounts Management (`dev` & `super_admin`).
   - Community Q&A Moderation Hub.
   - Feedback Triage Hub.
   - Dynamic Site Content CMS.
   - Developer Health Console (`dev` only).
