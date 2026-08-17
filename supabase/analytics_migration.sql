-- ================================================================
-- PharmaCore — Analytics Events Table Migration (Supabase Native)
-- Run this in your Supabase SQL Editor (SQL Editor -> New Query -> Run)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name   TEXT NOT NULL,
  properties   JSONB NOT NULL DEFAULT '{}'::jsonb,
  distinct_id  TEXT,
  user_id      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  url          TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high-performance aggregations and time-range filters
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events (event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_distinct_id ON public.analytics_events (distinct_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events (user_id);

-- Enable Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anonymous visitors & authenticated students) to log events
DROP POLICY IF EXISTS "Allow public insert on analytics_events" ON public.analytics_events;
CREATE POLICY "Allow public insert on analytics_events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);

-- Allow staff (dev, super_admin, mentor) to read analytics events
DROP POLICY IF EXISTS "Allow staff to read analytics_events" ON public.analytics_events;
CREATE POLICY "Allow staff to read analytics_events"
  ON public.analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('dev', 'super_admin', 'mentor')
    )
  );

-- Enable Realtime broadcasting so the Admin Dashboard updates live
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
END $$;
