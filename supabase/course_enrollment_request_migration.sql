-- ==============================================================================
-- PharmaCore Database Migration: Course Enrollment Approval Workflow
-- Run this script in your Supabase SQL Editor: Dashboard -> SQL Editor -> New query
-- ==============================================================================

-- 1. Update course_enrollments status constraint to include 'rejected'
DO $$ 
BEGIN
  -- Drop existing status check constraint if it exists
  ALTER TABLE public.course_enrollments DROP CONSTRAINT IF EXISTS course_enrollments_status_check;
  -- Add updated check constraint allowing 'active', 'pending', 'rejected', 'completed'
  ALTER TABLE public.course_enrollments ADD CONSTRAINT course_enrollments_status_check 
    CHECK (status IN ('active', 'pending', 'rejected', 'completed'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. Create optimized composite indexes for pending queue and course queries
CREATE INDEX IF NOT EXISTS course_enrollments_course_status_idx ON public.course_enrollments(course_id, status);
CREATE INDEX IF NOT EXISTS course_enrollments_user_status_idx ON public.course_enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS course_enrollments_status_idx ON public.course_enrollments(status);
CREATE INDEX IF NOT EXISTS course_enrollments_enrolled_at_idx ON public.course_enrollments(enrolled_at DESC);

-- 3. Comment update
COMMENT ON TABLE public.course_enrollments IS 'PharmaCore student course enrollments and cohort request/approval workflow.';
