-- Fix Arena for non-admin users
-- Goals:
-- 1) Ensure arena sessions can be synced without requiring an admin client online
-- 2) Allow non-admin arena participants to apply combat effects (HP/armor/aura updates) and apply statuses
--
-- NOTE: This project currently performs combat calculations client-side.
-- The UPDATE policy below enables those updates when the attacker is in the arena (has a position).
-- For a more secure approach, move combat to a SECURITY DEFINER RPC that validates inputs.

-- ---------------------------------------------------------------------------
-- Arena session sync RPC (server-authoritative open/close window)
-- ---------------------------------------------------------------------------
-- Keeps ONE "current" session row up to date (latest row), so timers work for everyone
-- even if no admin is connected.

CREATE OR REPLACE FUNCTION public.sync_arena_session()
RETURNS public.arena_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.arena_sessions;
  now_ts timestamptz := now();
  cycle_start timestamptz := date_trunc('hour', now_ts);
  opened_at_ts timestamptz := cycle_start;
  closed_at_ts timestamptz := cycle_start + interval '40 minutes';
  is_open_now boolean := (now_ts >= opened_at_ts AND now_ts < closed_at_ts);
BEGIN
  -- Pick the most recent session row as the "current" session record
  SELECT *
  INTO s
  FROM public.arena_sessions
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.arena_sessions (session_number, opened_at, closed_at, is_open)
    VALUES (1, opened_at_ts, closed_at_ts, is_open_now)
    RETURNING * INTO s;
    RETURN s;
  END IF;

  -- Increment session_number when the hour window changes
  IF s.opened_at IS NULL OR date_trunc('hour', s.opened_at) <> cycle_start THEN
    s.session_number := COALESCE(s.session_number, 0) + 1;
  END IF;

  UPDATE public.arena_sessions
  SET
    session_number = s.session_number,
    opened_at = opened_at_ts,
    closed_at = closed_at_ts,
    is_open = is_open_now
  WHERE id = s.id
  RETURNING * INTO s;

  RETURN s;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_arena_session() TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS policy hardening / fixes
-- ---------------------------------------------------------------------------

-- Ensure arena sessions are always readable
ALTER TABLE public.arena_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view arena sessions" ON public.arena_sessions;
CREATE POLICY "Anyone can view arena sessions"
ON public.arena_sessions FOR SELECT
USING (true);

-- Allow arena participants (users with a position) to update combat stats of others.
-- WARNING: This is permissive; application logic should limit columns updated.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users in arena can update combat stats of others" ON public.profiles;
CREATE POLICY "Users in arena can update combat stats of others"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.player_positions
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (true);

-- Allow applying statuses to other players (for techniques that inflict opponent_status).
ALTER TABLE public.player_statuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can apply statuses to others" ON public.player_statuses;
CREATE POLICY "Users can apply statuses to others"
ON public.player_statuses
FOR INSERT
WITH CHECK (
  auth.uid() = applied_by_user_id
);

