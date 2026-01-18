-- Add target_user_id column to battle_feed table
-- This allows tracking which user was targeted in attack actions

ALTER TABLE public.battle_feed
ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
