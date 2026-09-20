-- ==============================================================================
-- PharmaCore — Migration 03: Notifications, Community Q&A Hub & Email Preferences
-- Script: supabase/03_notifications_and_qa_hub.sql
-- ==============================================================================

BEGIN;

-- 1. Create In-App Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type              TEXT NOT NULL DEFAULT 'mentor_reply' CHECK (type IN ('mentor_reply', 'course_update', 'announcement', 'system')),
  title_en          TEXT NOT NULL,
  title_ar          TEXT NOT NULL,
  message_en        TEXT NOT NULL,
  message_ar        TEXT NOT NULL,
  lecture_id        UUID REFERENCES public.lectures(id) ON DELETE CASCADE,
  question_id       UUID REFERENCES public.community_questions(id) ON DELETE CASCADE,
  is_read           BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist for incremental upgrades
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'mentor_reply';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message_en TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message_ar TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS question_id UUID REFERENCES public.community_questions(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Add Email Notifications Preference column to public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true;

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cq_user_created ON public.community_questions(user_id, created_at DESC);

-- 4. Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can manage all notifications" ON public.notifications;
CREATE POLICY "Staff can manage all notifications" ON public.notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role IN ('dev', 'super_admin', 'mentor')
    )
  );

-- 5. Realtime Publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

COMMIT;
