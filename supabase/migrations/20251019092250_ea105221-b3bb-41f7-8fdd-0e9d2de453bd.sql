-- Allow users to delete versions of their own prompts
CREATE POLICY "Users can delete versions of their prompts"
ON public.prompt_versions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.prompts
    WHERE prompts.id = prompt_versions.prompt_id
    AND prompts.user_id = auth.uid()
  )
);