-- Add self_damage and energy_taken columns to techniques table
ALTER TABLE techniques
ADD COLUMN IF NOT EXISTS self_damage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS energy_taken INTEGER DEFAULT 0;
