-- Fix Nobara mentor image URL to include mentor: prefix
UPDATE mentors 
SET image_url = 'mentor:nobara'
WHERE name = 'Nobara';

-- Add mentor_id column to store_items for mentor-based unlocking
ALTER TABLE store_items 
ADD COLUMN mentor_id UUID REFERENCES mentors(id);

-- Create index for better performance
CREATE INDEX idx_store_items_mentor_id ON store_items(mentor_id);

-- Update existing profile picture store items with their mentor IDs
-- This links profile pictures to the mentors that unlock them
UPDATE store_items SET mentor_id = (SELECT id FROM mentors WHERE name = 'Yuji Itadori') WHERE name LIKE '%Yuji%' AND type = 'profile_picture';
UPDATE store_items SET mentor_id = (SELECT id FROM mentors WHERE name = 'Sasuke Uchiha') WHERE name LIKE '%Sasuke%' AND type = 'profile_picture';
UPDATE store_items SET mentor_id = (SELECT id FROM mentors WHERE name = 'Sakura Haruno') WHERE name LIKE '%Sakura%' AND type = 'profile_picture';
UPDATE store_items SET mentor_id = (SELECT id FROM mentors WHERE name = 'Rukia Kuchiki') WHERE name LIKE '%Rukia%' AND type = 'profile_picture';
UPDATE store_items SET mentor_id = (SELECT id FROM mentors WHERE name = 'Roy Mustang') WHERE name LIKE '%Roy%' AND type = 'profile_picture';
UPDATE store_items SET mentor_id = (SELECT id FROM mentors WHERE name = 'Nobara') WHERE name LIKE '%Nobara%' AND type = 'profile_picture';
UPDATE store_items SET mentor_id = (SELECT id FROM mentors WHERE name = 'Naruto Uzumaki') WHERE name LIKE '%Naruto%' AND type = 'profile_picture';
UPDATE store_items SET mentor_id = (SELECT id FROM mentors WHERE name = 'Monkey D. Luffy') WHERE name LIKE '%Luffy%' AND type = 'profile_picture';
UPDATE store_items SET mentor_id = (SELECT id FROM mentors WHERE name = 'Krillin') WHERE name LIKE '%Krillin%' AND type = 'profile_picture';
UPDATE store_items SET mentor_id = (SELECT id FROM mentors WHERE name = 'Kakashi Hatake') WHERE name LIKE '%Kakashi%' AND type = 'profile_picture';
UPDATE store_items SET mentor_id = (SELECT id FROM mentors WHERE name = 'Izuku Midoriya') WHERE name LIKE '%Izuku%' AND type = 'profile_picture';
UPDATE store_items SET mentor_id = (SELECT id FROM mentors WHERE name = 'Ichigo Kurosaki') WHERE name LIKE '%Ichigo%' AND type = 'profile_picture';
UPDATE store_items SET mentor_id = (SELECT id FROM mentors WHERE name = 'Gon Freecss') WHERE name LIKE '%Gon%' AND type = 'profile_picture';
UPDATE store_items SET mentor_id = (SELECT id FROM mentors WHERE name = 'Hisoka Morow') WHERE name LIKE '%Hisoka%' AND type = 'profile_picture';
UPDATE store_items SET mentor_id = (SELECT id FROM mentors WHERE name = 'Son Goku') WHERE name LIKE '%Goku%' AND type = 'profile_picture';
UPDATE store_items SET mentor_id = (SELECT id FROM mentors WHERE name = 'Edward Elric') WHERE name LIKE '%Edward%' AND type = 'profile_picture';
UPDATE store_items SET mentor_id = (SELECT id FROM mentors WHERE name = 'Cell') WHERE name LIKE '%Cell%' AND type = 'profile_picture';
UPDATE store_items SET mentor_id = (SELECT id FROM mentors WHERE name = 'Android 18') WHERE name LIKE '%Android%' OR name LIKE '%18%' AND type = 'profile_picture';
UPDATE store_items SET mentor_id = (SELECT id FROM mentors WHERE name = 'Portgas D. Ace') WHERE name LIKE '%Ace%' AND type = 'profile_picture';
UPDATE store_items SET mentor_id = (SELECT id FROM mentors WHERE name = 'Katsuki Bakugo') WHERE name LIKE '%Bakugo%' AND type = 'profile_picture';