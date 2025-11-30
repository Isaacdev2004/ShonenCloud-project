-- Make mentor_id optional for store items
ALTER TABLE store_items ALTER COLUMN mentor_id DROP NOT NULL;

-- Add index for efficient cleanup of old messages
CREATE INDEX IF NOT EXISTS idx_global_chat_created_at ON global_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_arena_posts_created_at ON arena_posts(created_at);

-- Add index for user_titles expiration queries
CREATE INDEX IF NOT EXISTS idx_user_titles_expires_at ON user_titles(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_titles_user_expires ON user_titles(user_id, expires_at);