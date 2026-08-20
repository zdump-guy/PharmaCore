-- ==============================================================================
-- Migration 002: Hybrid AI Clinical Consultations
-- Description:
--   Creates public.ai_consultations table for logging and caching AI interactions
--   (clinical calculators, drug-drug interaction checkers, lecture Q&A, general consults).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.ai_consultations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lecture_id      UUID REFERENCES public.lectures(id) ON DELETE SET NULL,
  tool_type       TEXT NOT NULL,
  prompt          TEXT NOT NULL,
  response        TEXT NOT NULL,
  patient_context JSONB DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance & Query Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_ai_consultations_user_id ON public.ai_consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_consultations_lecture_id ON public.ai_consultations(lecture_id);
CREATE INDEX IF NOT EXISTS idx_ai_consultations_tool_type ON public.ai_consultations(tool_type);
CREATE INDEX IF NOT EXISTS idx_ai_consultations_created_at ON public.ai_consultations(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ai_consultations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own AI consultations" ON public.ai_consultations;
CREATE POLICY "Users can view own AI consultations"
  ON public.ai_consultations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own AI consultations" ON public.ai_consultations;
CREATE POLICY "Users can insert own AI consultations"
  ON public.ai_consultations FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.uid() IS NULL AND user_id IS NULL)
  );

DROP POLICY IF EXISTS "Staff can view all AI consultations" ON public.ai_consultations;
CREATE POLICY "Staff can view all AI consultations"
  ON public.ai_consultations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('dev', 'super_admin', 'mentor')
    )
  );

DROP POLICY IF EXISTS "Admins manage all AI consultations" ON public.ai_consultations;
CREATE POLICY "Admins manage all AI consultations"
  ON public.ai_consultations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('dev', 'super_admin')
    )
  );

-- Grants
GRANT ALL ON public.ai_consultations TO authenticated, service_role;
GRANT SELECT ON public.ai_consultations TO anon;

COMMENT ON TABLE public.ai_consultations IS 'Logs and persistent history for PharmaCore Hybrid AI Clinical Pharmacology Assistant.';
