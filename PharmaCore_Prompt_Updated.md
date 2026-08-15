# Antigravity AI Project Prompt: PharmaCore

## Project Overview
**Project Name:** PharmaCore
**Description:** A specialized educational platform for hosting courses. The platform is openly accessible to all normal users without any sign-up or sign-in requirements. 

## Tech Stack
*   **Frontend Framework:** Next.js
*   **Backend Environment:** Node.js
*   **Hosting:** Vercel
*   **Database & Authentication:** Supabase 
    *   *Auth:* Handles login credentials and session management for Dev, Super Admin, and Mentors.
    *   *Database:* Tables will store all the structural data and links (YouTube, Google Drive for PDFs/Images) added by the admin for courses, lectures, and resources. Content is not stored directly in the DB, only the reference links.

## Design & UI/UX Guidelines
*   **Theme Mode:** Must fully support both **Light Mode** and **Dark Mode**.
*   **Color Palette:** 
    *   `#262626`
    *   `#6AA6B8`
    *   `#8BCDE1`
*   **Typography:**
    *   **English Font:** `Inter`
    *   **Arabic Font:** `Tajawal`
*   **Styling:** Modern, clean, and accessible UI, prioritizing readability for educational content.

## Roles & Permissions
*(Administrative access levels managed via Supabase Auth)*
1.  **Dev (Mohamed Mostafa Othman Ibrahim):** Full structural control, page content management, and overall platform maintenance.
2.  **Super Admin:** Complete control over adding/editing all courses, lectures, resources, quizzes, and questions.
3.  **Mentor:** Restricted access limited strictly to managing their assigned courses and lectures.

## Functional Requirements by Page

### 1. Course Page
*   **Course Name:** Clear, prominent title display.
*   **Details:** Comprehensive description, objectives, and prerequisites of the course.
*   **Lectures List:** An organized, sequential, and clickable list of all lectures associated with the course, populated dynamically from Supabase.

### 2. Lecture Page
*   **Lecture Name:** Specific title of the lecture.
*   **Lecture Details:** Brief summary and key takeaways of the session.
*   **Lecture Video:** An embedded YouTube video player that functions natively within the page (using links stored in Supabase).
*   **Resources:** A dedicated section containing downloadable or viewable materials (PDFs, images) sourced via external links (e.g., Google Drive) stored in Supabase.
*   **Quizzes:** A designated action button/link that opens a separate, dedicated Quiz page normally.
*   **Community Questions (Q&A):** An open forum section where any user can submit a question. Admins and Mentors can reply. All questions and corresponding answers must be globally visible.

### 3. Admin Dashboard Page
*   **Content Management Hub:** A secure, gated page for Devs, Super Admins, and Mentors to add and manage platform content based on their role.
*   **Data Entry:** Forms to input course details, lecture info, and external resource links (YouTube, Drive) to be pushed to Supabase tables.
*   **Q&A Management:** Interface to view, moderate, and answer community questions.

### 4. Quiz Creation Page
*   **Builder Interface:** A dedicated tool within the admin section to construct quizzes, set questions, define multiple-choice options, and assign correct answers.

### 5. Footer
The footer must be visually split into two distinct attribution sections:
*   **Team Mention:** Acknowledgments and links for the contributing team members.
*   **Developer & Maintainer:** Dedicated credit stating developed and maintained by Mohamed Mostafa Othman Ibrahim (Freelance UI/UX & Front-End Developer / One Voxel), including direct professional links.
