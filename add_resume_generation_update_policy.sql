-- ============================================================
-- Migration: allow users to update their own resume_generations
-- Required for persisting generated cover_letter_text
-- ============================================================

ALTER TABLE public.resume_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own generations." ON public.resume_generations;
CREATE POLICY "Users can update own generations."
ON public.resume_generations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
