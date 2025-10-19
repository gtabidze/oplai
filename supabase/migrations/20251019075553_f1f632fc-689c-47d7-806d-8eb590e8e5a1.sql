-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create restricted policy: users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create a security definer function to get non-sensitive user info for collaboration
-- This allows viewing names and avatars (but NOT emails) for active user features
CREATE OR REPLACE FUNCTION public.get_user_display_info(user_ids uuid[])
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, full_name, avatar_url
  FROM public.profiles
  WHERE id = ANY(user_ids);
$$;