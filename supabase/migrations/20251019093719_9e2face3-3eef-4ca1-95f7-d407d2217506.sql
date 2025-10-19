-- Create table to store data source connections
CREATE TABLE public.data_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('dropbox', 'google-drive', 'onedrive', 'box', 'aws-s3', 'icloud', 'notion', 'confluence', 'sharepoint', 'github', 'evernote')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  provider_user_id TEXT,
  provider_user_email TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own data sources"
ON public.data_sources
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own data sources"
ON public.data_sources
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data sources"
ON public.data_sources
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data sources"
ON public.data_sources
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_data_sources_updated_at
BEFORE UPDATE ON public.data_sources
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create table to store synced files
CREATE TABLE public.synced_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_source_id UUID NOT NULL REFERENCES public.data_sources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  provider_file_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  file_path TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(data_source_id, provider_file_id)
);

-- Enable RLS
ALTER TABLE public.synced_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own synced files"
ON public.synced_files
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own synced files"
ON public.synced_files
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own synced files"
ON public.synced_files
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own synced files"
ON public.synced_files
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_synced_files_updated_at
BEFORE UPDATE ON public.synced_files
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for better performance
CREATE INDEX idx_data_sources_user_provider ON public.data_sources(user_id, provider);
CREATE INDEX idx_synced_files_data_source ON public.synced_files(data_source_id);
CREATE INDEX idx_synced_files_user ON public.synced_files(user_id);