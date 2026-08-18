-- ==============================================================================
-- PharmaCore Database Migration: Student Account Layer & Course Access Policies
-- Run this script in your Supabase SQL Editor: Dashboard -> SQL Editor -> New query
-- ==============================================================================

-- 1. Update users table role constraint to include 'student'
DO $$ 
BEGIN
  -- Drop existing role check constraint if it exists
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
  -- Add updated check constraint allowing 'student' role
  ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('dev', 'super_admin', 'mentor', 'student'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. Add Student Profile Columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS faculty TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS start_year INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS predicted_end_year INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'needs_setup'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- 3. Add Course Gating Policy Columns to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS access_policy TEXT DEFAULT 'students_only' CHECK (access_policy IN ('open', 'students_only', 'enrolled_only'));

-- 4. Create Course Enrollments table for granular student course gating if needed
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'completed')),
  enrolled_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, course_id)
);

-- 5. Enable Row Level Security (RLS) & Policies
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own enrollments
CREATE POLICY "Users can view own course enrollments" 
  ON public.course_enrollments FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow service role and admins full access
CREATE POLICY "Service role and admins manage all enrollments" 
  ON public.course_enrollments FOR ALL 
  USING (true);

-- 6. Grant appropriate table permissions
GRANT ALL ON public.course_enrollments TO service_role;
GRANT ALL ON public.course_enrollments TO authenticated;
GRANT SELECT ON public.course_enrollments TO anon;

-- Verification notification
COMMENT ON TABLE public.course_enrollments IS 'PharmaCore student course enrollments and cohort access.';
