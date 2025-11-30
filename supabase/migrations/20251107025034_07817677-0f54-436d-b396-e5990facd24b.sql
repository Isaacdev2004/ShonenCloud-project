-- Create arena zones table
CREATE TABLE IF NOT EXISTS public.arena_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  danger_level INTEGER NOT NULL DEFAULT 1,
  energy_rate INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create player positions table for tracking players in zones
CREATE TABLE IF NOT EXISTS public.player_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES public.arena_zones(id) ON DELETE CASCADE,
  last_moved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create arena posts for technique sharing
CREATE TABLE IF NOT EXISTS public.arena_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  technique_name TEXT NOT NULL,
  description TEXT NOT NULL,
  zone_id UUID REFERENCES public.arena_zones(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.arena_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for arena_zones
CREATE POLICY "Anyone can view zones"
ON public.arena_zones FOR SELECT
USING (true);

CREATE POLICY "Admins can manage zones"
ON public.arena_zones FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for player_positions
CREATE POLICY "Anyone can view player positions"
ON public.player_positions FOR SELECT
USING (true);

CREATE POLICY "Users can insert own position"
ON public.player_positions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own position"
ON public.player_positions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own position"
ON public.player_positions FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for arena_posts
CREATE POLICY "Anyone can view arena posts"
ON public.arena_posts FOR SELECT
USING (true);

CREATE POLICY "Users can insert own posts"
ON public.arena_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
ON public.arena_posts FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any post"
ON public.arena_posts FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default zones
INSERT INTO public.arena_zones (name, description, danger_level, energy_rate) VALUES
  ('Training Grounds', 'Safe zone for beginners to practice', 1, 2),
  ('Shadow District', 'Dark alleys where stealth is key', 3, 1),
  ('Thunder Peak', 'High altitude combat zone', 5, 3),
  ('Ancient Ruins', 'Mysterious zone with hidden techniques', 4, 2),
  ('Crystal Caverns', 'Energy-rich underground zone', 2, 4),
  ('Inferno Arena', 'Extreme heat and intense battles', 6, 1)
ON CONFLICT DO NOTHING;

-- Enable realtime for player positions
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_posts;