-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;

-- Create a new policy that allows everyone to view all profiles
CREATE POLICY "Anyone can view profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- The update policies remain unchanged (users can update own profile, admins can update all)