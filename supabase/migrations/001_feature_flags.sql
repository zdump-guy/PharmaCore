-- ==============================================================================
-- Migration 001: Feature Flags & Modular Activation Engine
-- Description:
--   1. Adds feature_overrides JSONB column to public.courses for course-level overrides.
--   2. Seeds/ensures default global feature flags in public.site_content (id: 'main').
-- ==============================================================================

-- 1. Add feature_overrides column to courses table
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS feature_overrides JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.courses.feature_overrides IS 'Course-level feature overrides (e.g. {"ai_assistant": false, "practice_mode": true}). Inherits from global site_content.features if null or omitted.';

-- 2. Ensure default global feature flags in site_content table
-- Default flags: ai_assistant: true, practice_mode: true, certificates: true, community_qa: true, gradebook: true
INSERT INTO public.site_content (id, content, updated_at)
VALUES (
  'main',
  jsonb_build_object(
    'features', jsonb_build_object(
      'ai_assistant', true,
      'practice_mode', true,
      'certificates', true,
      'community_qa', true,
      'gradebook', true
    )
  ),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET content = CASE
  WHEN NOT (public.site_content.content ? 'features') THEN
    public.site_content.content || jsonb_build_object(
      'features', jsonb_build_object(
        'ai_assistant', true,
        'practice_mode', true,
        'certificates', true,
        'community_qa', true,
        'gradebook', true
      )
    )
  ELSE
    -- Merge default feature keys with any existing values
    jsonb_set(
      public.site_content.content,
      '{features}',
      jsonb_build_object(
        'ai_assistant', true,
        'practice_mode', true,
        'certificates', true,
        'community_qa', true,
        'gradebook', true
      ) || COALESCE(public.site_content.content->'features', '{}'::jsonb)
    )
END,
updated_at = NOW();

-- 3. Ensure publication contains site_content and courses for realtime synchronization
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'site_content'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'courses'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.courses;
    END IF;
  END IF;
END $$;
