-- ==============================================================================
-- Migration 004: Question Clinical Rationales, Quiz Submissions & Lecture Progress Gradebook
-- Description:
--   1. Adds bilingual explanations, clinical reference, and difficulty level to public.questions.
--   2. Creates public.quiz_submissions table for recording graded and practice quiz attempts.
--   3. Creates public.lecture_progress table for tracking video watch time and completion.
--   4. Configures RLS for student ownership and faculty gradebook analytics.
-- ==============================================================================

-- ── 1. Enhance Questions with Clinical Rationales & Metadata ──────────────────
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS explanation_en TEXT,
  ADD COLUMN IF NOT EXISTS explanation_ar TEXT,
  ADD COLUMN IF NOT EXISTS clinical_reference TEXT,
  ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium';

DO $$
BEGIN
  ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;
  ALTER TABLE public.questions ADD CONSTRAINT questions_difficulty_check
    CHECK (difficulty IN ('easy', 'medium', 'hard'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

COMMENT ON COLUMN public.questions.explanation_en IS 'Clinical reasoning and rationale in English displayed after quiz submission or immediately in Practice Mode.';
COMMENT ON COLUMN public.questions.explanation_ar IS 'Clinical reasoning and rationale in Arabic displayed after quiz submission or immediately in Practice Mode.';
COMMENT ON COLUMN public.questions.clinical_reference IS 'Textbook citation or clinical guideline reference (e.g. Goodman & Gilman, Dipiro, AHA/ACC).';
COMMENT ON COLUMN public.questions.difficulty IS 'Question difficulty rating: easy, medium, or hard.';

-- ── 2. Quiz Submissions Table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id       UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  course_id     UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  answers       JSONB NOT NULL DEFAULT '{}'::jsonb,
  score         NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
  passed        BOOLEAN NOT NULL DEFAULT false,
  is_practice   BOOLEAN NOT NULL DEFAULT false,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user_id ON public.quiz_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz_id ON public.quiz_submissions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_course_id ON public.quiz_submissions(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_practice ON public.quiz_submissions(is_practice);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_submitted_at ON public.quiz_submissions(submitted_at DESC);

-- ── 3. Lecture Progress Table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lecture_progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lecture_id        UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  course_id         UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  watched_seconds   INTEGER NOT NULL DEFAULT 0 CHECK (watched_seconds >= 0),
  duration_seconds  INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  completed         BOOLEAN NOT NULL DEFAULT false,
  last_watched_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lecture_id)
);

CREATE INDEX IF NOT EXISTS idx_lecture_progress_user_id ON public.lecture_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lecture_progress_lecture_id ON public.lecture_progress(lecture_id);
CREATE INDEX IF NOT EXISTS idx_lecture_progress_course_id ON public.lecture_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_lecture_progress_completed ON public.lecture_progress(completed);

-- ── 4. Enable Row Level Security (RLS) ────────────────────────────────────────
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_progress ENABLE ROW LEVEL SECURITY;

-- ── 5. Quiz Submissions RLS Policies ──────────────────────────────────────────
DROP POLICY IF EXISTS "Users view own quiz submissions" ON public.quiz_submissions;
CREATE POLICY "Users view own quiz submissions"
  ON public.quiz_submissions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own quiz submissions" ON public.quiz_submissions;
CREATE POLICY "Users insert own quiz submissions"
  ON public.quiz_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff view all quiz submissions" ON public.quiz_submissions;
CREATE POLICY "Staff view all quiz submissions"
  ON public.quiz_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('dev', 'super_admin', 'mentor')
    )
  );

DROP POLICY IF EXISTS "Admins manage quiz submissions" ON public.quiz_submissions;
CREATE POLICY "Admins manage quiz submissions"
  ON public.quiz_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('dev', 'super_admin')
    )
  );

-- ── 6. Lecture Progress RLS Policies ──────────────────────────────────────────
DROP POLICY IF EXISTS "Users view own lecture progress" ON public.lecture_progress;
CREATE POLICY "Users view own lecture progress"
  ON public.lecture_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own lecture progress" ON public.lecture_progress;
CREATE POLICY "Users manage own lecture progress"
  ON public.lecture_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff view all lecture progress" ON public.lecture_progress;
CREATE POLICY "Staff view all lecture progress"
  ON public.lecture_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('dev', 'super_admin', 'mentor')
    )
  );

DROP POLICY IF EXISTS "Admins manage lecture progress" ON public.lecture_progress;
CREATE POLICY "Admins manage lecture progress"
  ON public.lecture_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('dev', 'super_admin')
    )
  );

-- ── 7. Grants ─────────────────────────────────────────────────────────────────
GRANT ALL ON public.quiz_submissions TO authenticated, service_role;
GRANT SELECT ON public.quiz_submissions TO anon;

GRANT ALL ON public.lecture_progress TO authenticated, service_role;
GRANT SELECT ON public.lecture_progress TO anon;

COMMENT ON TABLE public.quiz_submissions IS 'Recorded quiz attempts, scores, and practice runs for PharmaCore students.';
COMMENT ON TABLE public.lecture_progress IS 'Per-lecture watch time progress and completion flags used for student mastery and gradebook tracking.';
