-- ==============================================================================
-- Migration 003: Verifiable Certificates, Study Streaks & Gamification Badges
-- Description:
--   1. Creates public.certificates table with unique verification codes & public verification policy.
--   2. Creates public.user_streaks table for daily active learning streak tracking.
--   3. Creates public.user_badges table for milestone achievement awards.
-- ==============================================================================

-- ── 1. Certificates Table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.certificates (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_code      TEXT UNIQUE NOT NULL,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id             UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  student_name          TEXT NOT NULL,
  course_title_en       TEXT NOT NULL,
  course_title_ar       TEXT,
  final_score           NUMERIC NOT NULL CHECK (final_score >= 0 AND final_score <= 100),
  watch_completion_rate NUMERIC NOT NULL CHECK (watch_completion_rate >= 0 AND watch_completion_rate <= 100),
  status                TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'revoked')),
  issue_date            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata              JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_certificates_code ON public.certificates(certificate_code);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON public.certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);

-- ── 2. User Streaks Table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak      INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak      INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_date  DATE,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_streaks_last_activity ON public.user_streaks(last_activity_date);

-- ── 3. User Badges Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type  TEXT NOT NULL,
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata    JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, badge_type)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_type ON public.user_badges(badge_type);

-- ── 4. Enable Row Level Security (RLS) ────────────────────────────────────────
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- ── 5. Certificates RLS Policies ──────────────────────────────────────────────
-- Public verification policy: Anyone (anon or authenticated) can verify valid certificates
DROP POLICY IF EXISTS "Public verify valid certificates" ON public.certificates;
CREATE POLICY "Public verify valid certificates"
  ON public.certificates FOR SELECT
  USING (status = 'valid');

-- Users can view their own certificates
DROP POLICY IF EXISTS "Users can view own certificates" ON public.certificates;
CREATE POLICY "Users can view own certificates"
  ON public.certificates FOR SELECT
  USING (auth.uid() = user_id);

-- Staff (dev, super_admin, mentor) can view all certificates
DROP POLICY IF EXISTS "Staff view all certificates" ON public.certificates;
CREATE POLICY "Staff view all certificates"
  ON public.certificates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('dev', 'super_admin', 'mentor')
    )
  );

-- Admins can manage certificates
DROP POLICY IF EXISTS "Admins manage certificates" ON public.certificates;
CREATE POLICY "Admins manage certificates"
  ON public.certificates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('dev', 'super_admin')
    )
  );

-- ── 6. User Streaks RLS Policies ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Users view own streaks" ON public.user_streaks;
CREATE POLICY "Users view own streaks"
  ON public.user_streaks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own streaks" ON public.user_streaks;
CREATE POLICY "Users update own streaks"
  ON public.user_streaks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff view all streaks" ON public.user_streaks;
CREATE POLICY "Staff view all streaks"
  ON public.user_streaks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('dev', 'super_admin', 'mentor')
    )
  );

DROP POLICY IF EXISTS "Admins manage all streaks" ON public.user_streaks;
CREATE POLICY "Admins manage all streaks"
  ON public.user_streaks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('dev', 'super_admin')
    )
  );

-- ── 7. User Badges RLS Policies ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Users view own badges" ON public.user_badges;
CREATE POLICY "Users view own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff view all badges" ON public.user_badges;
CREATE POLICY "Staff view all badges"
  ON public.user_badges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('dev', 'super_admin', 'mentor')
    )
  );

DROP POLICY IF EXISTS "Admins manage all badges" ON public.user_badges;
CREATE POLICY "Admins manage all badges"
  ON public.user_badges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('dev', 'super_admin')
    )
  );

-- ── 8. Table Permissions Grants ───────────────────────────────────────────────
GRANT SELECT ON public.certificates TO anon, authenticated;
GRANT ALL ON public.certificates TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.certificates TO authenticated;

GRANT ALL ON public.user_streaks TO authenticated, service_role;
GRANT SELECT ON public.user_streaks TO anon;

GRANT ALL ON public.user_badges TO authenticated, service_role;
GRANT SELECT ON public.user_badges TO anon;

COMMENT ON TABLE public.certificates IS 'Verified course completion certificates with tamper-proof unique codes.';
COMMENT ON TABLE public.user_streaks IS 'Daily active learning streak tracking per student.';
COMMENT ON TABLE public.user_badges IS 'Milestone achievement awards earned by students.';
