-- Allow admins to manage user mentors
CREATE POLICY "Admins can manage user mentors"
ON public.user_mentors
AS PERMISSIVE
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));
