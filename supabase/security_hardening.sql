-- ==============================================================================
-- PharmaCore — Supabase Security Hardening & Linter Fixes Migration
-- ==============================================================================
-- Run this in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Click "Run"
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Helper function: get_user_role() with SECURITY DEFINER to bypass RLS recursion
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 2. FIX RLS on public.users (Eliminate Infinite Recursion Error 42P17)
-- ------------------------------------------------------------------------------
GRANT SELECT ON public.users TO authenticated, anon;

DROP POLICY IF EXISTS "Users read own profile" ON public.users;
CREATE POLICY "Users read own profile" ON public.users
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins read all users" ON public.users;
CREATE POLICY "Admins read all users" ON public.users
  FOR SELECT USING (public.get_user_role() IN ('dev', 'super_admin', 'mentor'));

-- ------------------------------------------------------------------------------
-- 3. FIX RLS on public.analytics_events
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public insert on analytics_events" ON public.analytics_events;
CREATE POLICY "Allow public insert on analytics_events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (
    event_name IS NOT NULL AND
    length(event_name) > 0 AND
    length(event_name) <= 120
  );

-- ------------------------------------------------------------------------------
-- 4. FIX RLS on public.course_enrollments
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role and admins manage all enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users can view own course enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Admins manage all enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Students can request enrollment" ON public.course_enrollments;

-- (a) Users can view their own course enrollments
CREATE POLICY "Users can view own course enrollments"
  ON public.course_enrollments FOR SELECT
  USING (auth.uid() = user_id);

-- (b) Admins and mentors have full management access (non-recursive)
CREATE POLICY "Admins manage all enrollments"
  ON public.course_enrollments FOR ALL
  USING (public.get_user_role() IN ('dev', 'super_admin', 'mentor'))
  WITH CHECK (public.get_user_role() IN ('dev', 'super_admin', 'mentor'));

-- (c) Authenticated students can request an enrollment for themselves with 'pending' status
CREATE POLICY "Students can request enrollment"
  ON public.course_enrollments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (status = 'pending' OR status = 'active')
  );

-- ------------------------------------------------------------------------------
-- 5. FIX SECURITY DEFINER permissions on public.handle_new_user()
-- Revoke direct REST RPC execution from public/anon/authenticated clients.
-- (The Auth trigger on auth.users will continue to execute automatically).
-- ------------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

COMMIT;
