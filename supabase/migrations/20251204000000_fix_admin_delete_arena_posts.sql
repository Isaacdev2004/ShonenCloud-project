-- Ensure admin can delete arena_posts and battle_feed entries
-- This migration ensures RLS policies are correctly set for admin deletion

-- Ensure admin can delete arena_posts
DROP POLICY IF EXISTS "Admins can delete any post" ON public.arena_posts;

CREATE POLICY "Admins can delete any post"
ON public.arena_posts
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Ensure admin can delete battle_feed entries
DROP POLICY IF EXISTS "Admins can delete battle feed entries" ON public.battle_feed;

CREATE POLICY "Admins can delete battle feed entries"
ON public.battle_feed
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

