/*
# Add dynamic tournament point system and team applications

1. Modified Tables
- `tournaments`: Added `win_points`, `draw_points`, `loss_points`, `rules_text` columns for dynamic scoring.
- Existing tournaments will get default values (3, 1, -1, empty string).

2. New Tables
- `team_applications`: Stores user applications to join tournaments with a team name.
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `tournament_id` (uuid, references tournaments)
  - `team_name` (text)
  - `status` (text: pending, approved, rejected)
  - `created_at` (timestamptz)

3. Security
- Enable RLS on `team_applications`.
- Add policies for authenticated users.
*/

-- Add point columns to tournaments
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS win_points integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS draw_points integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS loss_points integer NOT NULL DEFAULT -1,
  ADD COLUMN IF NOT EXISTS rules_text text NOT NULL DEFAULT '';

-- Update existing tournaments with defaults
UPDATE tournaments SET win_points = 3, draw_points = 1, loss_points = -1, rules_text = '' WHERE win_points IS NULL;

-- Create team_applications table
CREATE TABLE IF NOT EXISTS team_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE team_applications ENABLE ROW LEVEL SECURITY;

-- Policies for team_applications
DROP POLICY IF EXISTS "select_applications" ON team_applications;
CREATE POLICY "select_applications" ON team_applications FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_applications" ON team_applications;
CREATE POLICY "insert_applications" ON team_applications FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_applications" ON team_applications;
CREATE POLICY "update_applications" ON team_applications FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_applications" ON team_applications;
CREATE POLICY "delete_applications" ON team_applications FOR DELETE
  TO authenticated USING (true);
