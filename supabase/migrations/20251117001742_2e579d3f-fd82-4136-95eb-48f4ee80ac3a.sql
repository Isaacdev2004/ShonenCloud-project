-- Allow everyone to view all user mentors (not just their own)
DROP POLICY IF EXISTS "Users can view own mentors" ON user_mentors;

CREATE POLICY "Anyone can view mentors"
ON user_mentors
FOR SELECT
USING (true);