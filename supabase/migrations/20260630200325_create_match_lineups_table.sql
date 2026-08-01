/*
# Create match_lineups table (esame listesi)

1. New Tables
- `match_lineups`
  - `id` (uuid, primary key)
  - `fixture_id` (uuid, FK to fixtures, ON DELETE CASCADE)
  - `team_id` (uuid, FK to teams, ON DELETE CASCADE)
  - `player_id` (uuid, FK to players, ON DELETE CASCADE)
  - `status` (text: 'starter' | 'substitute' | 'unavailable', default 'unavailable')
  - `created_at` (timestamptz, default now())
  - Unique constraint on (fixture_id, player_id) to prevent duplicate entries per match per player.

2. Security
- Enable RLS on `match_lineups`.
- Authenticated users can read all lineups (tournament staff, captains, admins).
- Authenticated users can insert/update/delete lineups (admins/scorekeepers/captains manage via frontend).
*/

CREATE TABLE IF NOT EXISTS match_lineups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'unavailable' CHECK (status IN ('starter', 'substitute', 'unavailable')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (fixture_id, player_id)
);

ALTER TABLE match_lineups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_match_lineups" ON match_lineups;
CREATE POLICY "select_match_lineups" ON match_lineups FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_match_lineups" ON match_lineups;
CREATE POLICY "insert_match_lineups" ON match_lineups FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_match_lineups" ON match_lineups;
CREATE POLICY "update_match_lineups" ON match_lineups FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_match_lineups" ON match_lineups;
CREATE POLICY "delete_match_lineups" ON match_lineups FOR DELETE
  TO authenticated USING (true);
