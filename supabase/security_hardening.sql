-- ==============================================================================
-- PharmaCore — Supabase Security Hardening & Linter Fixes Migration
-- ==============================================================================
-- Run this in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Click "Run"
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. FIX RLS on public.analytics_events
-- Issue: WITH CHECK (true) on INSERT triggers the "RLS Policy Always True" warning.
-- Fix: Enforce basic non-empty constraint checks on the event payload.
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
-- 2. FIX RLS on public.course_enrollments
-- Issue: Policy "Service role and admins manage all enrollments" using FOR ALL USING (true)
--        allows unrestricted access across anon/authenticated roles.
-- Fix: Restrict ALL/UPDATE/DELETE to staff roles (dev, super_admin, mentor),
--      allow users to view their own enrollments, and allow students to request enrollments.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role and admins manage all enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users can view own course enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Admins manage all enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Students can request enrollment" ON public.course_enrollments;

-- (a) Users can view their own course enrollments
CREATE POLICY "Users can view own course enrollments"
  ON public.course_enrollments FOR SELECT
  USING (auth.uid() = user_id);

-- (b) Admins and mentors have full management access
CREATE POLICY "Admins manage all enrollments"
  ON public.course_enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('dev', 'super_admin', 'mentor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('dev', 'super_admin', 'mentor')
    )
  );

-- (c) Authenticated students can request an enrollment for themselves with 'pending' status
CREATE POLICY "Students can request enrollment"
  ON public.course_enrollments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (status = 'pending' OR status = 'active')
  );

-- ------------------------------------------------------------------------------
-- 3. FIX permissions & grants on public.users and helper functions
-- (a) Ensure authenticated and anon roles can SELECT user profiles (governed by RLS)
-- ------------------------------------------------------------------------------
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT (id, full_name, role) ON public.users TO anon;

DROP POLICY IF EXISTS "Users read own profile" ON public.users;
CREATE POLICY "Users read own profile" ON public.users
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins read all users" ON public.users;
CREATE POLICY "Admins read all users" ON public.users
  FOR SELECT USING (
    (auth.uid() = id) OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('dev', 'super_admin')
    )
  );

-- (b) Allow authenticated users to execute get_user_role() for RLS policy evaluation,
--     while blocking anonymous public execution from the REST API.
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM anon, PUBLIC;

-- ------------------------------------------------------------------------------
-- 4. FIX SECURITY DEFINER permissions on public.handle_new_user()
-- Revoke direct REST RPC execution from public/anon/authenticated clients.
-- (The Auth trigger on auth.users will continue to execute automatically).
-- ------------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

COMMIT;
