-- ==============================================================================
-- PharmaCore — Migration 04: Enhanced Email System, Templates & Campaign Logs
-- Script: supabase/04_enhanced_email_system.sql
-- ==============================================================================

BEGIN;

-- 1. Create Email Templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL UNIQUE,
  title_en            TEXT NOT NULL,
  title_ar            TEXT NOT NULL,
  description_en      TEXT,
  description_ar      TEXT,
  category            TEXT NOT NULL DEFAULT 'custom' CHECK (category IN ('system', 'announcement', 'marketing', 'custom')),
  subject_template    TEXT NOT NULL,
  html_content        TEXT NOT NULL,
  variables_schema    JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default          BOOLEAN NOT NULL DEFAULT false,
  created_by          UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist for incremental upgrades
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS description_ar TEXT;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'custom';
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS subject_template TEXT;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS html_content TEXT;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS variables_schema JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create Email Campaign / Dispatch Logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id           UUID REFERENCES public.users(id) ON DELETE SET NULL,
  campaign_type       TEXT NOT NULL DEFAULT 'announcement' CHECK (campaign_type IN ('announcement', 'marketing', 'direct_message', 'system')),
  target_audience     TEXT NOT NULL CHECK (target_audience IN ('all', 'staff', 'students', 'marketing', 'custom_set', 'single_user', 'course_enrolled')),
  subject             TEXT NOT NULL,
  template_id         UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  template_name       TEXT,
  recipient_count     INTEGER NOT NULL DEFAULT 0,
  delivery_status     TEXT NOT NULL DEFAULT 'completed' CHECK (delivery_status IN ('completed', 'partial', 'failed', 'simulated')),
  sample_recipients   JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure email_logs columns exist
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS campaign_type TEXT DEFAULT 'announcement';
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS template_name TEXT;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS recipient_count INTEGER DEFAULT 0;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'completed';
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS sample_recipients JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Add Marketing Preferences column to public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_marketing_enabled BOOLEAN DEFAULT true;

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON public.email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_created ON public.email_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON public.email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_sender ON public.email_logs(sender_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign ON public.email_logs(campaign_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(delivery_status);

-- 5. Row Level Security (RLS)
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Email Templates RLS Policies
DROP POLICY IF EXISTS "Staff can read all email templates" ON public.email_templates;
CREATE POLICY "Staff can read all email templates" ON public.email_templates
  FOR SELECT USING (
    public.get_user_role() IN ('dev', 'super_admin', 'mentor')
  );

DROP POLICY IF EXISTS "Super Admins and Devs can manage email templates" ON public.email_templates;
CREATE POLICY "Super Admins and Devs can manage email templates" ON public.email_templates
  FOR ALL USING (
    public.get_user_role() IN ('dev', 'super_admin')
  );

-- Email Logs RLS Policies
DROP POLICY IF EXISTS "Staff can view email logs" ON public.email_logs;
CREATE POLICY "Staff can view email logs" ON public.email_logs
  FOR SELECT USING (
    public.get_user_role() IN ('dev', 'super_admin', 'mentor')
  );

DROP POLICY IF EXISTS "Super Admins and Devs can insert email logs" ON public.email_logs;
CREATE POLICY "Super Admins and Devs can insert email logs" ON public.email_logs
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('dev', 'super_admin')
  );

COMMIT;
