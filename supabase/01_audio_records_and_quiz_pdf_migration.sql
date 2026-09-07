-- ==============================================================================
-- PharmaCore — Audio Records & Quiz PDF Extension Migration
-- Script: supabase/01_audio_records_and_quiz_pdf_migration.sql
-- ==============================================================================

BEGIN;

-- 1. Create Audio Records table
CREATE TABLE IF NOT EXISTS public.audio_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id        UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  course_id         UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title_en          TEXT NOT NULL,
  title_ar          TEXT NOT NULL,
  audio_url         TEXT NOT NULL,
  duration_seconds  INTEGER DEFAULT 0,
  created_by        UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist for incremental upgrades
ALTER TABLE public.audio_records ADD COLUMN IF NOT EXISTS lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE;
ALTER TABLE public.audio_records ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE public.audio_records ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE public.audio_records ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE public.audio_records ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE public.audio_records ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;
ALTER TABLE public.audio_records ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.audio_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Extend Quizzes table for direct PDF uploads
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS solution_pdf_url TEXT;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audio_records_lecture ON public.audio_records(lecture_id);
CREATE INDEX IF NOT EXISTS idx_audio_records_course ON public.audio_records(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_lecture ON public.quizzes(lecture_id);

-- 4. Row Level Security (RLS)
ALTER TABLE public.audio_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view audio records" ON public.audio_records;
CREATE POLICY "Anyone can view audio records" ON public.audio_records
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can manage audio records" ON public.audio_records;
CREATE POLICY "Staff can manage audio records" ON public.audio_records
  FOR ALL USING (
    get_user_role() IN ('dev', 'super_admin', 'mentor')
  );

-- 5. Realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audio_records;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Table might already be in publication
  NULL;
END $$;

COMMIT;
