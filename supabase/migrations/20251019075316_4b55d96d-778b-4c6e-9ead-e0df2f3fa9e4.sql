-- Create prompts table for storing user prompts
CREATE TABLE public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('question', 'answer')),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, type, name)
);

-- Create prompt_versions table for version history
CREATE TABLE public.prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prompt_id, version_number)
);

-- Enable RLS
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompts
CREATE POLICY "Users can view their own prompts"
ON public.prompts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own prompts"
ON public.prompts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts"
ON public.prompts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts"
ON public.prompts FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for prompt_versions
CREATE POLICY "Users can view versions of their prompts"
ON public.prompt_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.prompts
    WHERE prompts.id = prompt_versions.prompt_id
    AND prompts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create versions for their prompts"
ON public.prompt_versions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.prompts
    WHERE prompts.id = prompt_versions.prompt_id
    AND prompts.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER on_prompts_updated
BEFORE UPDATE ON public.prompts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Function to ensure only one active prompt per type per user
CREATE OR REPLACE FUNCTION public.ensure_one_active_prompt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.prompts
    SET is_active = false
    WHERE user_id = NEW.user_id
    AND type = NEW.type
    AND id != NEW.id
    AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_one_active_prompt_trigger
BEFORE INSERT OR UPDATE ON public.prompts
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION public.ensure_one_active_prompt();