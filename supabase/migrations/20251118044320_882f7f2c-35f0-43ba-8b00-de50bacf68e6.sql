-- Update existing store items without a mentor to have a default mentor (Yuji Itadori)
UPDATE store_items 
SET mentor_id = '7fc8c2b6-44ca-4533-86b5-5031177e1e38'
WHERE mentor_id IS NULL;

-- Now make mentor_id required for all future items
ALTER TABLE store_items 
ALTER COLUMN mentor_id SET NOT NULL;