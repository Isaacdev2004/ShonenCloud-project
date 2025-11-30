-- Add level requirement column to store_items
ALTER TABLE public.store_items 
ADD COLUMN IF NOT EXISTS level_requirement integer NOT NULL DEFAULT 1;

-- Add comment explaining the column
COMMENT ON COLUMN public.store_items.level_requirement IS 'Minimum level required to purchase this item';