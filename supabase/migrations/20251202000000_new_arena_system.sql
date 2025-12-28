-- New Arena System Migration
-- This migration implements the complete new arena system with stats, statuses, timers, and enhanced techniques

-- Add new columns to profiles table for arena stats
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS max_hp INTEGER DEFAULT 100 NOT NULL,
ADD COLUMN IF NOT EXISTS current_hp INTEGER DEFAULT 100 NOT NULL,
ADD COLUMN IF NOT EXISTS max_atk INTEGER DEFAULT 20 NOT NULL,
ADD COLUMN IF NOT EXISTS current_atk INTEGER DEFAULT 20 NOT NULL,
ADD COLUMN IF NOT EXISTS aura INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS aura_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS mastery DECIMAL(3,2) DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS current_target_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS current_target_zone_id UUID REFERENCES public.arena_zones(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_targeting_zone BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS last_action_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_attack_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_technique_at TIMESTAMPTZ;

-- Create arena_sessions table for join system and timers
CREATE TABLE IF NOT EXISTS public.arena_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_number INTEGER NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ NOT NULL,
  battle_started_at TIMESTAMPTZ,
  battle_timer_ends_at TIMESTAMPTZ,
  is_open BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create arena_participants table (players who joined)
CREATE TABLE IF NOT EXISTS public.arena_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.arena_sessions(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, session_id)
);

-- Create player_statuses table (active statuses on players)
CREATE TABLE IF NOT EXISTS public.player_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  applied_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  applied_by_mastery DECIMAL(3,2) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create action_cooldowns table
CREATE TABLE IF NOT EXISTS public.action_cooldowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'attack', 'observe', 'change_zone'
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, action_type)
);

-- Create technique_cooldowns table
CREATE TABLE IF NOT EXISTS public.technique_cooldowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  technique_id UUID NOT NULL REFERENCES public.techniques(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, technique_id)
);

-- Create battle_feed table (actions log)
CREATE TABLE IF NOT EXISTS public.battle_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'attack', 'move_around', 'technique', 'observe', 'change_zone'
  technique_id UUID REFERENCES public.techniques(id) ON DELETE SET NULL,
  technique_name TEXT,
  technique_image_url TEXT,
  technique_description TEXT,
  description TEXT,
  zone_id UUID REFERENCES public.arena_zones(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add new columns to techniques table for enhanced system
ALTER TABLE public.techniques
ADD COLUMN IF NOT EXISTS damage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS armor_damage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS armor_given INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS aura_damage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS given_aura INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS heal INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags TEXT[], -- Array of tags
ADD COLUMN IF NOT EXISTS energy_cost INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS energy_given INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cooldown_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS opponent_status TEXT,
ADD COLUMN IF NOT EXISTS self_status TEXT,
ADD COLUMN IF NOT EXISTS no_hit_m INTEGER,
ADD COLUMN IF NOT EXISTS specific_status_hit TEXT,
ADD COLUMN IF NOT EXISTS mastery_given DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS mastery_taken DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS no_hit_e INTEGER,
ADD COLUMN IF NOT EXISTS no_use_e INTEGER,
ADD COLUMN IF NOT EXISTS no_use_m DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS atk_boost INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS atk_debuff INTEGER DEFAULT 0;

-- Create observe_status table (tracks when players are observing)
CREATE TABLE IF NOT EXISTS public.observe_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Create red_orb_effects table (tracks temporary ATK boosts)
CREATE TABLE IF NOT EXISTS public.red_orb_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  atk_boost INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.arena_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_cooldowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technique_cooldowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observe_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.red_orb_effects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for arena_sessions
CREATE POLICY "Anyone can view arena sessions"
ON public.arena_sessions FOR SELECT
USING (true);

CREATE POLICY "Admins can manage arena sessions"
ON public.arena_sessions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for arena_participants
CREATE POLICY "Anyone can view arena participants"
ON public.arena_participants FOR SELECT
USING (true);

CREATE POLICY "Users can join arena"
ON public.arena_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for player_statuses
CREATE POLICY "Anyone can view player statuses"
ON public.player_statuses FOR SELECT
USING (true);

CREATE POLICY "Users can manage own statuses"
ON public.player_statuses FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for action_cooldowns
CREATE POLICY "Anyone can view action cooldowns"
ON public.action_cooldowns FOR SELECT
USING (true);

CREATE POLICY "Users can manage own cooldowns"
ON public.action_cooldowns FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for technique_cooldowns
CREATE POLICY "Anyone can view technique cooldowns"
ON public.technique_cooldowns FOR SELECT
USING (true);

CREATE POLICY "Users can manage own technique cooldowns"
ON public.technique_cooldowns FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for battle_feed
CREATE POLICY "Anyone can view battle feed"
ON public.battle_feed FOR SELECT
USING (true);

CREATE POLICY "Users can insert own battle feed entries"
ON public.battle_feed FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for observe_status
CREATE POLICY "Anyone can view observe status"
ON public.observe_status FOR SELECT
USING (true);

CREATE POLICY "Users can manage own observe status"
ON public.observe_status FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for red_orb_effects
CREATE POLICY "Anyone can view red orb effects"
ON public.red_orb_effects FOR SELECT
USING (true);

CREATE POLICY "Users can manage own red orb effects"
ON public.red_orb_effects FOR ALL
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_arena_participants_user_id ON public.arena_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_arena_participants_session_id ON public.arena_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_player_statuses_user_id ON public.player_statuses(user_id);
CREATE INDEX IF NOT EXISTS idx_player_statuses_expires_at ON public.player_statuses(expires_at);
CREATE INDEX IF NOT EXISTS idx_action_cooldowns_user_id ON public.action_cooldowns(user_id);
CREATE INDEX IF NOT EXISTS idx_technique_cooldowns_user_id ON public.technique_cooldowns(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_feed_user_id ON public.battle_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_feed_created_at ON public.battle_feed(created_at);

-- Function to initialize max stats based on level
CREATE OR REPLACE FUNCTION initialize_arena_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate max HP: 100 + (level - 1) * 5
  NEW.max_hp := 100 + (NEW.level - 1) * 5;
  NEW.current_hp := NEW.max_hp;
  
  -- Calculate max ATK: 20 + (level - 1) * 2
  NEW.max_atk := 20 + (NEW.level - 1) * 2;
  NEW.current_atk := NEW.max_atk;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update stats when level changes
CREATE OR REPLACE FUNCTION update_arena_stats_on_level_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.level != NEW.level THEN
    -- Recalculate max HP and ATK
    NEW.max_hp := 100 + (NEW.level - 1) * 5;
    NEW.max_atk := 20 + (NEW.level - 1) * 2;
    
    -- Update current values if they exceed new max (cap them)
    IF NEW.current_hp > NEW.max_hp THEN
      NEW.current_hp := NEW.max_hp;
    END IF;
    IF NEW.current_atk > NEW.max_atk THEN
      NEW.current_atk := NEW.max_atk;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new profiles
DROP TRIGGER IF EXISTS trigger_initialize_arena_stats ON public.profiles;
CREATE TRIGGER trigger_initialize_arena_stats
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_arena_stats();

-- Create trigger for level updates
DROP TRIGGER IF EXISTS trigger_update_arena_stats_on_level ON public.profiles;
CREATE TRIGGER trigger_update_arena_stats_on_level
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_arena_stats_on_level_change();

