-- Drop the overly permissive SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new restricted SELECT policy
-- Users can only view their own profile, or admins can view all profiles
CREATE POLICY "Users can view own profile or admins can view all"
ON public.profiles
FOR SELECT
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));