-- ═══════════════════════════════════════════════════════════════════════════
-- PharmaCore Migration 02: Anonymous Q&A Discussion & Rate Limiting Support
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Ensure columns exist on public.community_questions
ALTER TABLE public.community_questions ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
ALTER TABLE public.community_questions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Create index for fast user_id queries
CREATE INDEX IF NOT EXISTS cq_user_id_idx ON public.community_questions(user_id);
CREATE INDEX IF NOT EXISTS cq_is_anonymous_idx ON public.community_questions(is_anonymous);

-- 3. Update Column Level Security (CLS) grants
REVOKE SELECT ON public.community_questions FROM anon, authenticated;
GRANT SELECT (id, lecture_id, user_id, author_name, text, created_at, is_anonymous) ON public.community_questions TO anon;
GRANT SELECT (id, lecture_id, user_id, author_name, text, created_at, is_anonymous) ON public.community_questions TO authenticated;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.community_questions ENABLE ROW LEVEL SECURITY;

-- 5. Policies: Public can read all questions (author_email is restricted via CLS)
DROP POLICY IF EXISTS "Public read community_questions" ON public.community_questions;
CREATE POLICY "Public read community_questions" ON public.community_questions
  FOR SELECT USING (true);

-- 6. Admins & Mentors manage all community questions
DROP POLICY IF EXISTS "Admins manage community questions" ON public.community_questions;
CREATE POLICY "Admins manage community questions" ON public.community_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role IN ('dev', 'super_admin', 'mentor')
    )
  );

COMMENT ON COLUMN public.community_questions.is_anonymous IS 'Flag indicating whether student requested name masking from peers.';
COMMENT ON COLUMN public.community_questions.user_id IS 'Reference to the authenticated user account if submitted while logged in.';
