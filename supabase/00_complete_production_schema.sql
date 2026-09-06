-- ==============================================================================
-- PharmaCore — Canonical Consolidated Production Database Migration
-- Script: supabase/00_complete_production_schema.sql
-- Milestone: M2 (Database Schema Consolidation & RLS Hardening)
-- ==============================================================================
-- Idempotent, self-contained, all-in-one migration script for fresh setups or
-- existing database reconciliations.
--
-- Features consolidated:
-- 1. Extensions: uuid-ossp, pgcrypto
-- 2. 12 Core Tables (strict dependency order):
--    - public.users
--    - public.courses
--    - public.lectures
--    - public.resources
--    - public.quizzes
--    - public.questions
--    - public.community_questions
--    - public.community_answers
--    - public.mentor_course_assignments
--    - public.site_content
--    - public.course_enrollments
--    - public.analytics_events
-- 3. Incremental column synchronization (ALTER TABLE ... ADD COLUMN IF NOT EXISTS)
-- 4. Idempotent check constraints and foreign keys via DO $$ EXCEPTION blocks
-- 5. 16 High-performance indexing structures
-- 6. Helper functions: get_user_role() (SECURITY DEFINER STABLE)
-- 7. Auth triggers: handle_new_user() defaulting to 'student'
-- 8. Row Level Security (RLS) on all tables (non-recursive)
-- 9. Column Level Security (CLS) on community_questions (student email privacy)
-- 10. Enrollment gating policy (status = 'pending' for students)
-- 11. Realtime publication registration
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- SECTION 1: EXTENSIONS
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- SECTION 2: SECURITY DEFINER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Non-recursive role resolver function to eliminate PostgreSQL 42P17 recursion
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon, authenticated, service_role;

-- Profile creation trigger defaulting role strictly to 'student'
-- (Prevents student self-elevation to mentor)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke direct REST RPC execution of trigger function
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ==============================================================================
-- SECTION 3: 12 TABLES IN STRICT DEPENDENCY ORDER
-- ==============================================================================

-- 1. Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT NOT NULL,
  full_name           TEXT,
  role                TEXT NOT NULL DEFAULT 'student',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_name          TEXT,
  last_name           TEXT,
  phone_number        TEXT,
  university          TEXT,
  faculty             TEXT,
  start_year          INTEGER,
  predicted_end_year  INTEGER,
  status              TEXT DEFAULT 'active',
  must_change_password BOOLEAN DEFAULT false
);

-- Ensure all users columns exist for existing database upgrades
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS faculty TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS start_year INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS predicted_end_year INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'student';

-- Ensure Auth trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_en         TEXT NOT NULL,
  title_ar         TEXT NOT NULL,
  description_en   TEXT,
  description_ar   TEXT,
  objectives_en    TEXT,
  objectives_ar    TEXT,
  prerequisites_en TEXT,
  prerequisites_ar TEXT,
  thumbnail_url    TEXT,
  mentor_id        UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_locked        BOOLEAN DEFAULT false,
  access_policy    TEXT DEFAULT 'students_only'
);

-- Ensure all courses columns exist
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description_ar TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS objectives_en TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS objectives_ar TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS prerequisites_en TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS prerequisites_ar TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS mentor_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS access_policy TEXT DEFAULT 'students_only';

-- 3. Lectures table
CREATE TABLE IF NOT EXISTS public.lectures (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id    UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title_en     TEXT NOT NULL,
  title_ar     TEXT NOT NULL,
  details_en   TEXT,
  details_ar   TEXT,
  youtube_url  TEXT NOT NULL,
  "order"      INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all lectures columns exist
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS details_en TEXT;
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS details_ar TEXT;
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Resources table
CREATE TABLE IF NOT EXISTS public.resources (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id   UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  title_en     TEXT NOT NULL,
  title_ar     TEXT NOT NULL,
  url          TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'pdf'
);

-- Ensure all resources columns exist
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'pdf';

-- 5. Quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_en     TEXT NOT NULL,
  title_ar     TEXT NOT NULL,
  lecture_id   UUID REFERENCES public.lectures(id) ON DELETE CASCADE,
  course_id    UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  created_by   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all quizzes columns exist
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 6. Questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id         UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  text_en         TEXT NOT NULL,
  text_ar         TEXT NOT NULL,
  type            TEXT NOT NULL,
  options         JSONB,
  correct_answer  TEXT NOT NULL,
  "order"         INTEGER NOT NULL DEFAULT 0
);

-- Ensure all questions columns exist
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS text_en TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS text_ar TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS options JSONB;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS correct_answer TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- 7. Community Questions table
CREATE TABLE IF NOT EXISTS public.community_questions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id    UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  author_name   TEXT NOT NULL,
  author_email  TEXT NOT NULL,
  text          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all community_questions columns exist
ALTER TABLE public.community_questions ADD COLUMN IF NOT EXISTS lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE;
ALTER TABLE public.community_questions ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.community_questions ADD COLUMN IF NOT EXISTS author_email TEXT;
ALTER TABLE public.community_questions ADD COLUMN IF NOT EXISTS text TEXT;
ALTER TABLE public.community_questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 8. Community Answers table
CREATE TABLE IF NOT EXISTS public.community_answers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id   UUID NOT NULL REFERENCES public.community_questions(id) ON DELETE CASCADE,
  responder_id  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  text          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all community_answers columns exist
ALTER TABLE public.community_answers ADD COLUMN IF NOT EXISTS question_id UUID REFERENCES public.community_questions(id) ON DELETE CASCADE;
ALTER TABLE public.community_answers ADD COLUMN IF NOT EXISTS responder_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.community_answers ADD COLUMN IF NOT EXISTS text TEXT;
ALTER TABLE public.community_answers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.community_answers ALTER COLUMN responder_id DROP NOT NULL;

-- 9. Mentor Course Assignments table
CREATE TABLE IF NOT EXISTS public.mentor_course_assignments (
  mentor_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  PRIMARY KEY (mentor_id, course_id)
);

-- Ensure assignments columns exist
ALTER TABLE public.mentor_course_assignments ADD COLUMN IF NOT EXISTS mentor_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.mentor_course_assignments ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;

-- 10. Editable Public Website Content table
CREATE TABLE IF NOT EXISTS public.site_content (
  id          TEXT PRIMARY KEY,
  content     JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure site_content columns exist
ALTER TABLE public.site_content ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.site_content ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.site_content ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 11. Course Enrollments table
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, course_id)
);

-- Ensure course_enrollments columns exist
ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.course_enrollments ALTER COLUMN status SET DEFAULT 'pending';

-- 12. Analytics Events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name   TEXT NOT NULL,
  properties   JSONB NOT NULL DEFAULT '{}'::jsonb,
  distinct_id  TEXT,
  user_id      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  url          TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure analytics_events columns exist
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS event_name TEXT;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS properties JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS distinct_id TEXT;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 13. Feedback Submissions table
CREATE TABLE IF NOT EXISTS public.feedback_submissions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES public.users(id) ON DELETE SET NULL,
  feedback_type       TEXT NOT NULL,
  category            TEXT NOT NULL,
  page_url            TEXT,
  course_id           UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  lecture_id          UUID REFERENCES public.lectures(id) ON DELETE SET NULL,
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  reproduction_steps  TEXT,
  severity            TEXT NOT NULL DEFAULT 'medium',
  device_info         JSONB DEFAULT '{}'::jsonb,
  attachment_url      TEXT,
  academic_reference  TEXT,
  contact_email       TEXT,
  contact_name        TEXT,
  status              TEXT NOT NULL DEFAULT 'open',
  admin_notes         TEXT,
  resolved_by         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all feedback_submissions columns exist
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS feedback_type TEXT;
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS page_url TEXT;
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL;
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS lecture_id UUID REFERENCES public.lectures(id) ON DELETE SET NULL;
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS reproduction_steps TEXT;
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium';
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS academic_reference TEXT;
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.feedback_submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ==============================================================================
-- SECTION 4: IDEMPOTENT CONSTRAINTS & FOREIGN KEYS
-- ==============================================================================

-- 1. Users role check constraint
DO $$ BEGIN
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
  ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('dev', 'super_admin', 'mentor', 'student'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 2. Users status check constraint
DO $$ BEGIN
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_status_check;
  ALTER TABLE public.users ADD CONSTRAINT users_status_check 
    CHECK (status IN ('active', 'pending', 'suspended', 'needs_setup'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 3. Courses access_policy check constraint
DO $$ BEGIN
  ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_access_policy_check;
  ALTER TABLE public.courses ADD CONSTRAINT courses_access_policy_check 
    CHECK (access_policy IN ('open', 'students_only', 'enrolled_only'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 4. Resources type check constraint
DO $$ BEGIN
  ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_type_check;
  ALTER TABLE public.resources ADD CONSTRAINT resources_type_check 
    CHECK (type IN ('pdf', 'image', 'other'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 5. Quizzes scope check constraint
DO $$ BEGIN
  ALTER TABLE public.quizzes DROP CONSTRAINT IF EXISTS quizzes_scope_check;
  ALTER TABLE public.quizzes ADD CONSTRAINT quizzes_scope_check 
    CHECK (lecture_id IS NOT NULL OR course_id IS NOT NULL);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 6. Questions type check constraint
DO $$ BEGIN
  ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_type_check;
  ALTER TABLE public.questions ADD CONSTRAINT questions_type_check 
    CHECK (type IN ('multiple_choice', 'true_false', 'short_text'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 7. Community answers responder_id foreign key (safe deletion)
DO $$ BEGIN
  ALTER TABLE public.community_answers DROP CONSTRAINT IF EXISTS community_answers_responder_id_fkey;
  ALTER TABLE public.community_answers ADD CONSTRAINT community_answers_responder_id_fkey 
    FOREIGN KEY (responder_id) REFERENCES public.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 8. Course enrollments status check constraint
DO $$ BEGIN
  ALTER TABLE public.course_enrollments DROP CONSTRAINT IF EXISTS course_enrollments_status_check;
  ALTER TABLE public.course_enrollments ADD CONSTRAINT course_enrollments_status_check 
    CHECK (status IN ('active', 'pending', 'rejected', 'completed'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 9. Course enrollments unique user_id + course_id constraint
DO $$ BEGIN
  ALTER TABLE public.course_enrollments DROP CONSTRAINT IF EXISTS course_enrollments_user_id_course_id_key;
  ALTER TABLE public.course_enrollments ADD CONSTRAINT course_enrollments_user_id_course_id_key 
    UNIQUE (user_id, course_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 10. Feedback submissions check constraints
DO $$ BEGIN
  ALTER TABLE public.feedback_submissions DROP CONSTRAINT IF EXISTS feedback_type_check;
  ALTER TABLE public.feedback_submissions ADD CONSTRAINT feedback_type_check 
    CHECK (feedback_type IN ('technical', 'academic'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.feedback_submissions DROP CONSTRAINT IF EXISTS feedback_severity_check;
  ALTER TABLE public.feedback_submissions ADD CONSTRAINT feedback_severity_check 
    CHECK (severity IN ('low', 'medium', 'high', 'critical'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.feedback_submissions DROP CONSTRAINT IF EXISTS feedback_status_check;
  ALTER TABLE public.feedback_submissions ADD CONSTRAINT feedback_status_check 
    CHECK (status IN ('open', 'under_review', 'in_progress', 'resolved', 'dismissed'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ==============================================================================
-- SECTION 5: 20 HIGH-PERFORMANCE INDEXES
-- ==============================================================================

-- Lectures indexes (2)
CREATE INDEX IF NOT EXISTS lectures_course_id_idx ON public.lectures(course_id);
CREATE INDEX IF NOT EXISTS lectures_order_idx ON public.lectures(course_id, "order");

-- Resources indexes (1)
CREATE INDEX IF NOT EXISTS resources_lecture_id_idx ON public.resources(lecture_id);

-- Quizzes indexes (2)
CREATE INDEX IF NOT EXISTS quizzes_lecture_id_idx ON public.quizzes(lecture_id);
CREATE INDEX IF NOT EXISTS quizzes_course_id_idx ON public.quizzes(course_id);

-- Questions indexes (1)
CREATE INDEX IF NOT EXISTS questions_quiz_id_idx ON public.questions(quiz_id);

-- Community Q&A indexes (2)
CREATE INDEX IF NOT EXISTS cq_lecture_id_idx ON public.community_questions(lecture_id);
CREATE INDEX IF NOT EXISTS community_answers_question_id_idx ON public.community_answers(question_id);

-- Course enrollments indexes (4)
CREATE INDEX IF NOT EXISTS course_enrollments_course_status_idx ON public.course_enrollments(course_id, status);
CREATE INDEX IF NOT EXISTS course_enrollments_user_status_idx ON public.course_enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS course_enrollments_status_idx ON public.course_enrollments(status);
CREATE INDEX IF NOT EXISTS course_enrollments_enrolled_at_idx ON public.course_enrollments(enrolled_at DESC);

-- Analytics events indexes (4)
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_distinct_id ON public.analytics_events(distinct_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);

-- Feedback submissions indexes (4)
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback_submissions(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback_submissions(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback_submissions(user_id);

-- ==============================================================================
-- SECTION 6: ROW LEVEL SECURITY & PERMISSIONS
-- ==============================================================================

-- Enable RLS across all 13 tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. public.users policies
-- ------------------------------------------------------------------------------
GRANT SELECT ON public.users TO authenticated, anon;

DROP POLICY IF EXISTS "Users read own profile" ON public.users;
CREATE POLICY "Users read own profile" ON public.users
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins read all users" ON public.users;
CREATE POLICY "Admins read all users" ON public.users
  FOR SELECT USING (public.get_user_role() IN ('dev', 'super_admin', 'mentor'));

-- ------------------------------------------------------------------------------
-- 2. public.courses policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read courses" ON public.courses;
CREATE POLICY "Public read courses" ON public.courses
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage courses" ON public.courses;
CREATE POLICY "Admins manage courses" ON public.courses
  FOR ALL USING (public.get_user_role() IN ('dev', 'super_admin'));

DROP POLICY IF EXISTS "Mentor manage assigned courses" ON public.courses;
CREATE POLICY "Mentor manage assigned courses" ON public.courses
  FOR ALL USING (
    public.get_user_role() = 'mentor' AND
    id IN (SELECT course_id FROM public.mentor_course_assignments WHERE mentor_id = auth.uid())
  );

-- ------------------------------------------------------------------------------
-- 3. public.lectures policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read lectures" ON public.lectures;
CREATE POLICY "Public read lectures" ON public.lectures
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage lectures" ON public.lectures;
CREATE POLICY "Admins manage lectures" ON public.lectures
  FOR ALL USING (public.get_user_role() IN ('dev', 'super_admin'));

DROP POLICY IF EXISTS "Mentor manage assigned lectures" ON public.lectures;
CREATE POLICY "Mentor manage assigned lectures" ON public.lectures
  FOR ALL USING (
    public.get_user_role() = 'mentor' AND
    course_id IN (SELECT course_id FROM public.mentor_course_assignments WHERE mentor_id = auth.uid())
  );

-- ------------------------------------------------------------------------------
-- 4. public.resources policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read resources" ON public.resources;
CREATE POLICY "Public read resources" ON public.resources
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage resources" ON public.resources;
CREATE POLICY "Admins manage resources" ON public.resources
  FOR ALL USING (public.get_user_role() IN ('dev', 'super_admin'));

-- ------------------------------------------------------------------------------
-- 5. public.quizzes policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read quizzes" ON public.quizzes;
CREATE POLICY "Public read quizzes" ON public.quizzes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage quizzes" ON public.quizzes;
CREATE POLICY "Admins manage quizzes" ON public.quizzes
  FOR ALL USING (public.get_user_role() IN ('dev', 'super_admin'));

-- ------------------------------------------------------------------------------
-- 6. public.questions policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read questions" ON public.questions;
CREATE POLICY "Public read questions" ON public.questions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage questions" ON public.questions;
CREATE POLICY "Admins manage questions" ON public.questions
  FOR ALL USING (public.get_user_role() IN ('dev', 'super_admin'));

-- ------------------------------------------------------------------------------
-- 7. public.community_questions policies & Column Level Security (CLS)
-- ------------------------------------------------------------------------------
-- Prevent browser clients from selecting student email addresses directly
REVOKE SELECT ON public.community_questions FROM anon, authenticated;
GRANT SELECT (id, lecture_id, author_name, text, created_at) ON public.community_questions TO anon;
GRANT SELECT (id, lecture_id, author_name, text, created_at) ON public.community_questions TO authenticated;

-- Disallow open client-side insertion; questions must flow through /api/questions/submit
DROP POLICY IF EXISTS "Anyone insert community questions" ON public.community_questions;
DROP POLICY IF EXISTS "Public insert community questions" ON public.community_questions;

DROP POLICY IF EXISTS "Public read community_questions" ON public.community_questions;
CREATE POLICY "Public read community_questions" ON public.community_questions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage community questions" ON public.community_questions;
CREATE POLICY "Admins manage community questions" ON public.community_questions
  FOR ALL USING (public.get_user_role() IN ('dev', 'super_admin', 'mentor'));

-- ------------------------------------------------------------------------------
-- 8. public.community_answers policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read community_answers" ON public.community_answers;
CREATE POLICY "Public read community_answers" ON public.community_answers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins and mentors answer questions" ON public.community_answers;
CREATE POLICY "Admins and mentors answer questions" ON public.community_answers
  FOR INSERT WITH CHECK (public.get_user_role() IN ('dev', 'super_admin', 'mentor'));

DROP POLICY IF EXISTS "Responder manage own answers" ON public.community_answers;
CREATE POLICY "Responder manage own answers" ON public.community_answers
  FOR ALL USING (responder_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 9. public.mentor_course_assignments policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage mentor assignments" ON public.mentor_course_assignments;
CREATE POLICY "Admins manage mentor assignments" ON public.mentor_course_assignments
  FOR ALL USING (public.get_user_role() IN ('dev', 'super_admin'));

DROP POLICY IF EXISTS "Mentors read own assignments" ON public.mentor_course_assignments;
CREATE POLICY "Mentors read own assignments" ON public.mentor_course_assignments
  FOR SELECT USING (mentor_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 10. public.site_content policies & Grants
-- ------------------------------------------------------------------------------
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;

DROP POLICY IF EXISTS "Public read site content" ON public.site_content;
CREATE POLICY "Public read site content" ON public.site_content
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Developers manage site content" ON public.site_content;
CREATE POLICY "Developers manage site content" ON public.site_content
  FOR ALL USING (public.get_user_role() = 'dev')
  WITH CHECK (public.get_user_role() = 'dev');

-- ------------------------------------------------------------------------------
-- 11. public.course_enrollments policies & Grants
-- ------------------------------------------------------------------------------
GRANT ALL ON public.course_enrollments TO service_role;
GRANT ALL ON public.course_enrollments TO authenticated;
GRANT SELECT ON public.course_enrollments TO anon;

DROP POLICY IF EXISTS "Service role and admins manage all enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users can view own course enrollments" ON public.course_enrollments;
CREATE POLICY "Users can view own course enrollments"
  ON public.course_enrollments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage all enrollments" ON public.course_enrollments;
CREATE POLICY "Admins manage all enrollments"
  ON public.course_enrollments FOR ALL
  USING (public.get_user_role() IN ('dev', 'super_admin', 'mentor'))
  WITH CHECK (public.get_user_role() IN ('dev', 'super_admin', 'mentor'));

-- Restrict student direct enrollment requests to status = 'pending'
DROP POLICY IF EXISTS "Students can request enrollment" ON public.course_enrollments;
CREATE POLICY "Students can request enrollment"
  ON public.course_enrollments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND status = 'pending'
  );

-- ------------------------------------------------------------------------------
-- 12. public.analytics_events policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public insert on analytics_events" ON public.analytics_events;
CREATE POLICY "Allow public insert on analytics_events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (
    event_name IS NOT NULL AND
    length(event_name) > 0 AND
    length(event_name) <= 120
  );

-- Non-recursive staff query using public.get_user_role()
DROP POLICY IF EXISTS "Allow staff to read analytics_events" ON public.analytics_events;
CREATE POLICY "Allow staff to read analytics_events"
  ON public.analytics_events FOR SELECT
  USING (public.get_user_role() IN ('dev', 'super_admin', 'mentor'));

-- ------------------------------------------------------------------------------
-- 13. public.feedback_submissions policies
-- ------------------------------------------------------------------------------
GRANT ALL ON public.feedback_submissions TO service_role;
GRANT ALL ON public.feedback_submissions TO authenticated;
GRANT ALL ON public.feedback_submissions TO anon;

DROP POLICY IF EXISTS "Allow public insert on feedback_submissions" ON public.feedback_submissions;
CREATE POLICY "Allow public insert on feedback_submissions"
  ON public.feedback_submissions FOR INSERT
  WITH CHECK (
    title IS NOT NULL AND length(title) > 0 AND
    description IS NOT NULL AND length(description) > 0
  );

DROP POLICY IF EXISTS "Users can read own feedback submissions" ON public.feedback_submissions;
CREATE POLICY "Users can read own feedback submissions"
  ON public.feedback_submissions FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff manage feedback submissions" ON public.feedback_submissions;
CREATE POLICY "Staff manage feedback submissions"
  ON public.feedback_submissions FOR ALL
  USING (public.get_user_role() IN ('dev', 'super_admin', 'mentor'))
  WITH CHECK (public.get_user_role() IN ('dev', 'super_admin', 'mentor'));

-- ==============================================================================
-- SECTION 7: REALTIME PUBLICATION REGISTRATION
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'analytics_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_events;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'feedback_submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback_submissions;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Table metadata comments
COMMENT ON TABLE public.course_enrollments IS 'PharmaCore student course enrollments and cohort request/approval workflow.';
COMMENT ON TABLE public.analytics_events IS 'PharmaCore telemetry and visitor analytics event stream.';
COMMENT ON TABLE public.community_questions IS 'PharmaCore student community Q&A with Column Level Security on author_email.';
COMMENT ON TABLE public.feedback_submissions IS 'PharmaCore technical bug reports and academic curriculum feedback submissions.';

COMMIT;
