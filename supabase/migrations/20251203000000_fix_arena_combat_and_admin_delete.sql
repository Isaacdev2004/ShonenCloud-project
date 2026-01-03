-- Fix Arena Combat Updates and Admin Delete
-- This migration adds policies to allow arena combat damage updates and fixes admin delete

-- Allow users in arena to update other users' profiles for arena combat
-- This is necessary for the attack system to work (updating HP, armor, aura)
CREATE POLICY "Users in arena can update combat stats of others"
ON public.profiles
FOR UPDATE
USING (
  -- Attacker must be in arena (has a position)
  EXISTS (
    SELECT 1 FROM public.player_positions
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  -- Allow the update (application logic ensures only combat stats are updated)
  true
);

-- Fix admin delete: Add a more permissive policy that checks both admin role and admin_id
-- Drop the old restrictive policy first
DROP POLICY IF EXISTS "Admins can delete arena messages" ON public.arena_admin_messages;

-- Create new policy that allows deletion if user is admin OR created the message
CREATE POLICY "Admins can delete arena messages"
ON public.arena_admin_messages
FOR DELETE
USING (
  -- Allow if user has admin role
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Or if user is the admin who created the message
  admin_id = auth.uid()
);

-- Add RLS policy for admins to delete battle_feed entries
CREATE POLICY "Admins can delete battle feed entries"
ON public.battle_feed
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

