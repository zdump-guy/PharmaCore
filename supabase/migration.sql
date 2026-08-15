-- ================================================================
-- PharmaCore — Supabase SQL Migration
-- Run this in your Supabase SQL Editor to create all tables + RLS
-- ================================================================

-- ── Enable UUID extension ────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Users (extends Supabase Auth) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL CHECK (role IN ('dev', 'super_admin', 'mentor')) DEFAULT 'mentor',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create user profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'role', 'mentor'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 2. Courses ────────────────────────────────────────────────────
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
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Lectures ───────────────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS lectures_course_id_idx ON public.lectures(course_id);
CREATE INDEX IF NOT EXISTS lectures_order_idx ON public.lectures(course_id, "order");

-- ── 4. Resources ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resources (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id   UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  title_en     TEXT NOT NULL,
  title_ar     TEXT NOT NULL,
  url          TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('pdf', 'image', 'other')) DEFAULT 'pdf'
);

-- ── 5. Quizzes ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quizzes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_en     TEXT NOT NULL,
  title_ar     TEXT NOT NULL,
  lecture_id   UUID REFERENCES public.lectures(id) ON DELETE CASCADE,
  course_id    UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  created_by   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (lecture_id IS NOT NULL OR course_id IS NOT NULL)
);

-- ── 6. Questions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id         UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  text_en         TEXT NOT NULL,
  text_ar         TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'short_text')),
  options         JSONB,   -- array of strings for MCQ/TF
  correct_answer  TEXT NOT NULL,
  "order"         INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS questions_quiz_id_idx ON public.questions(quiz_id);

-- ── 7. Community Questions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_questions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id    UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  author_name   TEXT NOT NULL,
  author_email  TEXT NOT NULL,
  text          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cq_lecture_id_idx ON public.community_questions(lecture_id);

-- ── 8. Community Answers ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_answers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id   UUID NOT NULL REFERENCES public.community_questions(id) ON DELETE CASCADE,
  responder_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 9. Mentor Course Assignments ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mentor_course_assignments (
  mentor_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  PRIMARY KEY (mentor_id, course_id)
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_course_assignments ENABLE ROW LEVEL SECURITY;

-- ── Helper function: get caller's role ───────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Public read policies (anonymous) ─────────────────────────────
CREATE POLICY "Public read courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Public read lectures" ON public.lectures FOR SELECT USING (true);
CREATE POLICY "Public read resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Public read quizzes" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Public read questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Public read community_questions" ON public.community_questions FOR SELECT USING (true);
CREATE POLICY "Public read community_answers" ON public.community_answers FOR SELECT USING (true);

-- ── Write policies: dev + super_admin full access ─────────────────
CREATE POLICY "Admins manage courses" ON public.courses
  FOR ALL USING (public.get_user_role() IN ('dev', 'super_admin'));

CREATE POLICY "Admins manage lectures" ON public.lectures
  FOR ALL USING (public.get_user_role() IN ('dev', 'super_admin'));

CREATE POLICY "Admins manage resources" ON public.resources
  FOR ALL USING (public.get_user_role() IN ('dev', 'super_admin'));

CREATE POLICY "Admins manage quizzes" ON public.quizzes
  FOR ALL USING (public.get_user_role() IN ('dev', 'super_admin'));

CREATE POLICY "Admins manage questions" ON public.questions
  FOR ALL USING (public.get_user_role() IN ('dev', 'super_admin'));

-- ── Mentor: only assigned courses ────────────────────────────────
CREATE POLICY "Mentor manage assigned courses" ON public.courses
  FOR ALL USING (
    public.get_user_role() = 'mentor' AND
    id IN (SELECT course_id FROM public.mentor_course_assignments WHERE mentor_id = auth.uid())
  );

CREATE POLICY "Mentor manage assigned lectures" ON public.lectures
  FOR ALL USING (
    public.get_user_role() = 'mentor' AND
    course_id IN (SELECT course_id FROM public.mentor_course_assignments WHERE mentor_id = auth.uid())
  );

-- ── Community Q&A writes ──────────────────────────────────────────
-- Anyone can insert a question (via API route using service role)
CREATE POLICY "Anyone insert community questions" ON public.community_questions
  FOR INSERT WITH CHECK (true);

-- Only admins/mentors can answer
CREATE POLICY "Admins and mentors answer questions" ON public.community_answers
  FOR INSERT WITH CHECK (public.get_user_role() IN ('dev', 'super_admin', 'mentor'));

CREATE POLICY "Responder manage own answers" ON public.community_answers
  FOR ALL USING (responder_id = auth.uid());

-- ── Users: read own profile ───────────────────────────────────────
CREATE POLICY "Users read own profile" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins read all users" ON public.users
  FOR SELECT USING (public.get_user_role() IN ('dev', 'super_admin'));

-- ── Mentor assignments: admins manage ────────────────────────────
CREATE POLICY "Admins manage mentor assignments" ON public.mentor_course_assignments
  FOR ALL USING (public.get_user_role() IN ('dev', 'super_admin'));

CREATE POLICY "Mentors read own assignments" ON public.mentor_course_assignments
  FOR SELECT USING (mentor_id = auth.uid());
