-- PharmaCore existing-database reconciliation
-- Safe to run once in Supabase SQL Editor after the original migration.

BEGIN;

-- Never trust a self-supplied role during Auth sign-up. Administrative roles
-- are assigned only by the protected server API after verifying the requester.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'mentor')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Ensure the editable branding/text store is present with the grants and RLS
-- expected by the public pages and the dev-only dashboard editor.
CREATE TABLE IF NOT EXISTS public.site_content (
  id          TEXT PRIMARY KEY,
  content     JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;

DROP POLICY IF EXISTS "Public read site content" ON public.site_content;
CREATE POLICY "Public read site content" ON public.site_content
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Developers manage site content" ON public.site_content;
CREATE POLICY "Developers manage site content" ON public.site_content
  FOR ALL USING (public.get_user_role() = 'dev')
  WITH CHECK (public.get_user_role() = 'dev');

-- Student questions are validated and inserted by /api/questions/submit using
-- the service role, so anonymous clients do not need direct INSERT access.
DROP POLICY IF EXISTS "Anyone insert community questions" ON public.community_questions;

-- Keep the submitted email stored for server-side workflows, but prevent all
-- browser clients (anonymous and authenticated) from selecting it directly.
REVOKE SELECT ON public.community_questions FROM anon, authenticated;
GRANT SELECT (id, lecture_id, author_name, text, created_at) ON public.community_questions TO anon;
GRANT SELECT (id, lecture_id, author_name, text, created_at) ON public.community_questions TO authenticated;

CREATE INDEX IF NOT EXISTS resources_lecture_id_idx ON public.resources(lecture_id);
CREATE INDEX IF NOT EXISTS quizzes_lecture_id_idx ON public.quizzes(lecture_id);
CREATE INDEX IF NOT EXISTS quizzes_course_id_idx ON public.quizzes(course_id);
CREATE INDEX IF NOT EXISTS community_answers_question_id_idx ON public.community_answers(question_id);

-- Keep published staff answers when the staff account itself is deleted.
ALTER TABLE public.community_answers ALTER COLUMN responder_id DROP NOT NULL;
ALTER TABLE public.community_answers DROP CONSTRAINT IF EXISTS community_answers_responder_id_fkey;
ALTER TABLE public.community_answers
  ADD CONSTRAINT community_answers_responder_id_fkey
  FOREIGN KEY (responder_id) REFERENCES public.users(id) ON DELETE SET NULL;

COMMIT;

-- Audit queries: these should return zero rows after your content is complete.
SELECT q.id, q.title_en
FROM public.quizzes q
LEFT JOIN public.lectures l ON l.id = q.lecture_id
WHERE q.lecture_id IS NULL OR q.course_id IS NULL OR l.course_id IS DISTINCT FROM q.course_id;

SELECT u.id, u.email
FROM auth.users u
LEFT JOIN public.users p ON p.id = u.id
WHERE p.id IS NULL;
