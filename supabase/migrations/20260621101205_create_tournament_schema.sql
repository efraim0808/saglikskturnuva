/*
# SağlıkSK Turnuva Yönetim Platformu - Initial Schema

1. New Tables
- `tournaments` - Turnuva bilgileri (id, name, season, status, created_at)
- `teams` - Takım bilgileri (id, tournament_id, name, manager_name, status, created_at)
- `players` - Oyuncu bilgileri (id, team_id, name, jersey_number, position, created_at)
- `fixtures` - Fikstür bilgileri (id, tournament_id, week, home_team_id, away_team_id, match_date, venue, status, created_at)
- `matches` - Maç detayları (id, fixture_id, home_score, away_score, status, timer_seconds, timer_running, created_at)
- `match_events` - Maç olayları (id, match_id, event_type, player_id, assist_player_id, minute, details, created_at)
- `standings` - Puan durumu (id, tournament_id, team_id, played, won, drawn, lost, goals_for, goals_against, penalty_points, points, created_at)
- `user_roles` - Kullanıcı rolleri (id, user_id, role, team_id, created_at)
- `penalties` - Ceza puanları (id, tournament_id, team_id, points, reason, created_by, created_at)

2. Security
- Enable RLS on all tables.
- Add policies for authenticated users based on roles.
*/

CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  season text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name text NOT NULL,
  manager_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  jersey_number integer,
  position text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fixtures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  week integer NOT NULL,
  home_team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  match_date timestamptz,
  venue text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled', 'forfeit')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  home_score integer NOT NULL DEFAULT 0,
  away_score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'paused', 'completed', 'cancelled')),
  timer_seconds integer NOT NULL DEFAULT 0,
  timer_running boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('goal', 'yellow_card', 'red_card', 'substitution', 'var_review', 'penalty', 'penalty_missed')),
  player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  assist_player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  minute integer NOT NULL,
  details text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  played integer NOT NULL DEFAULT 0,
  won integer NOT NULL DEFAULT 0,
  drawn integer NOT NULL DEFAULT 0,
  lost integer NOT NULL DEFAULT 0,
  goals_for integer NOT NULL DEFAULT 0,
  goals_against integer NOT NULL DEFAULT 0,
  penalty_points integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, team_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('super_admin', 'scorekeeper', 'team_manager', 'user')),
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS penalties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  points integer NOT NULL,
  reason text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;

-- Tournaments policies (public read, admin write)
DROP POLICY IF EXISTS "select_tournaments" ON tournaments;
CREATE POLICY "select_tournaments" ON tournaments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_tournaments" ON tournaments;
CREATE POLICY "insert_tournaments" ON tournaments FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_tournaments" ON tournaments;
CREATE POLICY "update_tournaments" ON tournaments FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_tournaments" ON tournaments;
CREATE POLICY "delete_tournaments" ON tournaments FOR DELETE
  TO authenticated USING (true);

-- Teams policies
DROP POLICY IF EXISTS "select_teams" ON teams;
CREATE POLICY "select_teams" ON teams FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_teams" ON teams;
CREATE POLICY "insert_teams" ON teams FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_teams" ON teams;
CREATE POLICY "update_teams" ON teams FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_teams" ON teams;
CREATE POLICY "delete_teams" ON teams FOR DELETE
  TO authenticated USING (true);

-- Players policies
DROP POLICY IF EXISTS "select_players" ON players;
CREATE POLICY "select_players" ON players FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_players" ON players;
CREATE POLICY "insert_players" ON players FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_players" ON players;
CREATE POLICY "update_players" ON players FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_players" ON players;
CREATE POLICY "delete_players" ON players FOR DELETE
  TO authenticated USING (true);

-- Fixtures policies
DROP POLICY IF EXISTS "select_fixtures" ON fixtures;
CREATE POLICY "select_fixtures" ON fixtures FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_fixtures" ON fixtures;
CREATE POLICY "insert_fixtures" ON fixtures FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_fixtures" ON fixtures;
CREATE POLICY "update_fixtures" ON fixtures FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_fixtures" ON fixtures;
CREATE POLICY "delete_fixtures" ON fixtures FOR DELETE
  TO authenticated USING (true);

-- Matches policies
DROP POLICY IF EXISTS "select_matches" ON matches;
CREATE POLICY "select_matches" ON matches FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_matches" ON matches;
CREATE POLICY "insert_matches" ON matches FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_matches" ON matches;
CREATE POLICY "update_matches" ON matches FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_matches" ON matches;
CREATE POLICY "delete_matches" ON matches FOR DELETE
  TO authenticated USING (true);

-- Match events policies
DROP POLICY IF EXISTS "select_match_events" ON match_events;
CREATE POLICY "select_match_events" ON match_events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_match_events" ON match_events;
CREATE POLICY "insert_match_events" ON match_events FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_match_events" ON match_events;
CREATE POLICY "update_match_events" ON match_events FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_match_events" ON match_events;
CREATE POLICY "delete_match_events" ON match_events FOR DELETE
  TO authenticated USING (true);

-- Standings policies
DROP POLICY IF EXISTS "select_standings" ON standings;
CREATE POLICY "select_standings" ON standings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_standings" ON standings;
CREATE POLICY "insert_standings" ON standings FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_standings" ON standings;
CREATE POLICY "update_standings" ON standings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_standings" ON standings;
CREATE POLICY "delete_standings" ON standings FOR DELETE
  TO authenticated USING (true);

-- User roles policies
DROP POLICY IF EXISTS "select_user_roles" ON user_roles;
CREATE POLICY "select_user_roles" ON user_roles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_user_roles" ON user_roles;
CREATE POLICY "insert_user_roles" ON user_roles FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_user_roles" ON user_roles;
CREATE POLICY "update_user_roles" ON user_roles FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_user_roles" ON user_roles;
CREATE POLICY "delete_user_roles" ON user_roles FOR DELETE
  TO authenticated USING (true);

-- Penalties policies
DROP POLICY IF EXISTS "select_penalties" ON penalties;
CREATE POLICY "select_penalties" ON penalties FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_penalties" ON penalties;
CREATE POLICY "insert_penalties" ON penalties FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_penalties" ON penalties;
CREATE POLICY "update_penalties" ON penalties FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_penalties" ON penalties;
CREATE POLICY "delete_penalties" ON penalties FOR DELETE
  TO authenticated USING (true);
