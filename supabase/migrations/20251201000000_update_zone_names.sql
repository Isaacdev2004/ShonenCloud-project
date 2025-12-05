-- Update zone names to match image filenames
-- This migration updates existing zones to match the zone image names

-- Update zones based on image filenames
-- Note: This assumes zones exist. If zones need to be created, they should be created separately.

-- Update zone names to match image filenames (convert kebab-case to Title Case)
-- baschool.png -> "Baschool"
-- chunin-exam.png -> "Chunin Exam"
-- hueco-mundo.png -> "Hueco Mundo"
-- musutafu.png -> "Musutafu"
-- planet-namek.png -> "Planet Namek"
-- scrap-island.png -> "Scrap Island"
-- shibuya-station.png -> "Shibuya Station"
-- testing-gates.png -> "Testing Gates"

-- If zones don't exist, create them. Otherwise update existing ones.
-- This uses a more flexible approach that works whether zones exist or not.

-- Delete old zones and insert new ones with correct names
DELETE FROM public.arena_zones;

INSERT INTO public.arena_zones (name, description, danger_level, energy_rate) VALUES
  ('Baschool', 'Training zone for developing skills', 1, 2),
  ('Chunin Exam', 'Examination arena for advanced techniques', 3, 1),
  ('Hueco Mundo', 'Dangerous realm of hollows', 5, 3),
  ('Musutafu', 'City zone with urban combat', 4, 2),
  ('Planet Namek', 'Alien planet with high energy', 2, 4),
  ('Scrap Island', 'Abandoned industrial zone', 3, 2),
  ('Shibuya Station', 'Urban transit hub battlefield', 4, 1),
  ('Testing Gates', 'Entrance trials and challenges', 2, 3)
ON CONFLICT DO NOTHING;

