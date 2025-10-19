-- Create API endpoints table
CREATE TABLE IF NOT EXISTS public.api_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  selected_playbooks JSONB DEFAULT '[]'::jsonb,
  data_points JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_endpoints ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own API endpoints"
  ON public.api_endpoints
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API endpoints"
  ON public.api_endpoints
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API endpoints"
  ON public.api_endpoints
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API endpoints"
  ON public.api_endpoints
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_api_endpoints_updated_at
  BEFORE UPDATE ON public.api_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();