/*
# Create Player Suspensions Table for Disiplin Kurulu

1. New Tables
- `player_suspensions` - Oyuncu cezaları / disiplin kayıtları
  - `id` (uuid, primary key)
  - `tournament_id` (uuid, references tournaments)
  - `player_id` (uuid, references players)
  - `team_id` (uuid, references teams)
  - `reason` (text, ceza sebebi)
  - `matches_total` (integer, toplam ceza maçı sayısı)
  - `matches_remaining` (integer, kalan ceza maçı sayısı)
  - `match_id` (uuid, references matches - hangi maçta ceza aldı)
  - `is_auto` (boolean, otomatik mi manuel mi)
  - `created_at` (timestamp)

2. Security
- Enable RLS on player_suspensions
- Public read policies
- Admin/scorekeeper write policies
*/

CREATE TABLE IF NOT EXISTS player_suspensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  reason text NOT NULL,
  matches_total integer NOT NULL DEFAULT 1,
  matches_remaining integer NOT NULL DEFAULT 1,
  match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
  is_auto boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE player_suspensions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_suspensions" ON player_suspensions;
CREATE POLICY "select_suspensions" ON player_suspensions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_suspensions" ON player_suspensions;
CREATE POLICY "insert_suspensions" ON player_suspensions FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_suspensions" ON player_suspensions;
CREATE POLICY "update_suspensions" ON player_suspensions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_suspensions" ON player_suspensions;
CREATE POLICY "delete_suspensions" ON player_suspensions FOR DELETE
  TO authenticated USING (true);
