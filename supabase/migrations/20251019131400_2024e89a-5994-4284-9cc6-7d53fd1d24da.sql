-- Create table for playbook collaborators
CREATE TABLE public.playbook_collaborators (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playbook_id uuid NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'editor',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(playbook_id, user_id)
);

-- Create table for share links
CREATE TABLE public.playbook_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playbook_id uuid NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

-- Enable RLS on new tables
ALTER TABLE public.playbook_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_shares ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user is playbook owner or collaborator
CREATE OR REPLACE FUNCTION public.is_playbook_collaborator(playbook_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.playbooks WHERE id = playbook_uuid AND user_id = user_uuid
    UNION
    SELECT 1 FROM public.playbook_collaborators WHERE playbook_id = playbook_uuid AND user_id = user_uuid
  )
$$;

-- RLS policies for playbook_collaborators
CREATE POLICY "Users can view collaborators of their playbooks"
ON public.playbook_collaborators
FOR SELECT
TO authenticated
USING (is_playbook_collaborator(playbook_id, auth.uid()));

CREATE POLICY "Playbook owners can add collaborators"
ON public.playbook_collaborators
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.playbooks WHERE id = playbook_id AND user_id = auth.uid()
));

CREATE POLICY "Playbook owners can remove collaborators"
ON public.playbook_collaborators
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.playbooks WHERE id = playbook_id AND user_id = auth.uid()
));

-- RLS policies for playbook_shares
CREATE POLICY "Users can view shares of their playbooks"
ON public.playbook_shares
FOR SELECT
TO authenticated
USING (is_playbook_collaborator(playbook_id, auth.uid()));

CREATE POLICY "Playbook owners can create shares"
ON public.playbook_shares
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.playbooks WHERE id = playbook_id AND user_id = auth.uid()
));

CREATE POLICY "Playbook owners can update shares"
ON public.playbook_shares
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.playbooks WHERE id = playbook_id AND user_id = auth.uid()
));

CREATE POLICY "Playbook owners can delete shares"
ON public.playbook_shares
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.playbooks WHERE id = playbook_id AND user_id = auth.uid()
));

-- Update playbooks RLS to allow collaborators to view and edit
DROP POLICY IF EXISTS "Users can view their own playbooks" ON public.playbooks;
DROP POLICY IF EXISTS "Users can update their own playbooks" ON public.playbooks;

CREATE POLICY "Users can view their own playbooks and collaborations"
ON public.playbooks
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_playbook_collaborator(id, auth.uid()));

CREATE POLICY "Users can update their own playbooks and collaborations"
ON public.playbooks
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR is_playbook_collaborator(id, auth.uid()));

-- Update questions RLS to allow collaborators
DROP POLICY IF EXISTS "Users can view their own questions" ON public.questions;
DROP POLICY IF EXISTS "Users can create their own questions" ON public.questions;
DROP POLICY IF EXISTS "Users can update their own questions" ON public.questions;
DROP POLICY IF EXISTS "Users can delete their own questions" ON public.questions;

CREATE POLICY "Users can view questions from their playbooks"
ON public.questions
FOR SELECT
TO authenticated
USING (is_playbook_collaborator(playbook_id, auth.uid()));

CREATE POLICY "Users can create questions in their playbooks"
ON public.questions
FOR INSERT
TO authenticated
WITH CHECK (is_playbook_collaborator(playbook_id, auth.uid()));

CREATE POLICY "Users can update questions in their playbooks"
ON public.questions
FOR UPDATE
TO authenticated
USING (is_playbook_collaborator(playbook_id, auth.uid()));

CREATE POLICY "Users can delete questions in their playbooks"
ON public.questions
FOR DELETE
TO authenticated
USING (is_playbook_collaborator(playbook_id, auth.uid()));

-- Update answers RLS to allow collaborators
DROP POLICY IF EXISTS "Users can view their own answers" ON public.answers;
DROP POLICY IF EXISTS "Users can create their own answers" ON public.answers;
DROP POLICY IF EXISTS "Users can update their own answers" ON public.answers;
DROP POLICY IF EXISTS "Users can delete their own answers" ON public.answers;

CREATE POLICY "Users can view answers from their playbook questions"
ON public.answers
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.questions 
  WHERE questions.id = answers.question_id 
  AND is_playbook_collaborator(questions.playbook_id, auth.uid())
));

CREATE POLICY "Users can create answers in their playbook questions"
ON public.answers
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.questions 
  WHERE questions.id = question_id 
  AND is_playbook_collaborator(questions.playbook_id, auth.uid())
));

CREATE POLICY "Users can update answers in their playbook questions"
ON public.answers
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.questions 
  WHERE questions.id = answers.question_id 
  AND is_playbook_collaborator(questions.playbook_id, auth.uid())
));

CREATE POLICY "Users can delete answers in their playbook questions"
ON public.answers
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.questions 
  WHERE questions.id = answers.question_id 
  AND is_playbook_collaborator(questions.playbook_id, auth.uid())
));