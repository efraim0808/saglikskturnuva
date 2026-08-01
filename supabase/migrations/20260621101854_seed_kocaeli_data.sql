/*
# Seed Kocaeli Şehir Hastanesi Sample Data

1. New Data
- 2 tournaments: "Kocaeli Şehir Hastanesi Güz Ligi 2026" (active) and "Bahar Turnuvası 2025" (archived)
- 4 teams in active tournament: Acil Servis FC, Ameliyathane Gücü, Radyoloji Gençlik, Pediatri Gücü
- Players for each team
- One fixture in week 1 set to "live" with match record
- Standings entries for approved teams
2. Security
- Data inserted directly (no policy restrictions for seeding)
*/

-- Insert tournaments
INSERT INTO tournaments (id, name, season, status) VALUES
  (gen_random_uuid(), 'Kocaeli Şehir Hastanesi Güz Ligi 2026', '2025-2026', 'active'),
  (gen_random_uuid(), 'Bahar Turnuvası 2025', '2024-2025', 'archived')
ON CONFLICT DO NOTHING;

-- Get tournament IDs
DO $$
DECLARE
  active_tournament_id uuid;
  archived_tournament_id uuid;
  team1_id uuid;
  team2_id uuid;
  team3_id uuid;
  team4_id uuid;
  fixture_id uuid;
  match_id uuid;
BEGIN
  SELECT id INTO active_tournament_id FROM tournaments WHERE name = 'Kocaeli Şehir Hastanesi Güz Ligi 2026';
  SELECT id INTO archived_tournament_id FROM tournaments WHERE name = 'Bahar Turnuvası 2025';

  -- Insert teams for active tournament
  team1_id := gen_random_uuid();
  team2_id := gen_random_uuid();
  team3_id := gen_random_uuid();
  team4_id := gen_random_uuid();

  INSERT INTO teams (id, tournament_id, name, manager_name, status) VALUES
    (team1_id, active_tournament_id, 'Acil Servis FC', 'Dr. Mehmet Kaya', 'approved'),
    (team2_id, active_tournament_id, 'Ameliyathane Gücü', 'Dr. Selin Yıldız', 'approved'),
    (team3_id, active_tournament_id, 'Radyoloji Gençlik', 'Dr. Can Özdemir', 'approved'),
    (team4_id, active_tournament_id, 'Pediatri Gücü', 'Dr. Elif Şahin', 'approved');

  -- Insert players for each team
  INSERT INTO players (team_id, name, jersey_number, position) VALUES
    -- Acil Servis FC
    (team1_id, 'Dr. Ahmet Yılmaz', 10, 'Forvet'),
    (team1_id, 'Dr. Burak Demir', 7, 'Orta Saha'),
    (team1_id, 'Dr. Cemal Koç', 1, 'Kaleci'),
    (team1_id, 'Dr. Deniz Aydın', 4, 'Defans'),
    -- Ameliyathane Gücü
    (team2_id, 'Dr. Fatma Çelik', 9, 'Forvet'),
    (team2_id, 'Dr. Gökhan Arslan', 8, 'Orta Saha'),
    (team2_id, 'Dr. Hüseyin Toprak', 1, 'Kaleci'),
    (team2_id, 'Dr. İrem Korkmaz', 3, 'Defans'),
    -- Radyoloji Gençlik
    (team3_id, 'Dr. Jale Yıldırım', 11, 'Forvet'),
    (team3_id, 'Dr. Kemal Bulut', 6, 'Orta Saha'),
    (team3_id, 'Dr. Leyla Akgün', 1, 'Kaleci'),
    (team3_id, 'Dr. Murat Şen', 2, 'Defans'),
    -- Pediatri Gücü
    (team4_id, 'Dr. Nilay Erdoğan', 10, 'Forvet'),
    (team4_id, 'Dr. Osman Güneş', 5, 'Orta Saha'),
    (team4_id, 'Dr. Pelin Yavuz', 1, 'Kaleci'),
    (team4_id, 'Dr. Rıza Kaplan', 4, 'Defans');

  -- Create a live fixture for week 1
  fixture_id := gen_random_uuid();
  INSERT INTO fixtures (id, tournament_id, week, home_team_id, away_team_id, match_date, venue, status)
  VALUES (fixture_id, active_tournament_id, 1, team1_id, team2_id, NOW(), 'Kocaeli Şehir Hastanesi Spor Salonu', 'live');

  -- Create match record
  match_id := gen_random_uuid();
  INSERT INTO matches (id, fixture_id, home_score, away_score, status, timer_seconds, timer_running)
  VALUES (match_id, fixture_id, 1, 0, 'live', 1380, true);

  -- Add a goal event
  INSERT INTO match_events (match_id, event_type, player_id, minute, details)
  SELECT match_id, 'goal', p.id, 23, 'Dr. Ahmet Yılmaz açıyı iyi değerlendirdi'
  FROM players p WHERE p.name = 'Dr. Ahmet Yılmaz' AND p.team_id = team1_id;

  -- Create standings
  INSERT INTO standings (tournament_id, team_id, played, won, drawn, lost, goals_for, goals_against, penalty_points, points)
  VALUES
    (active_tournament_id, team1_id, 0, 0, 0, 0, 0, 0, 0, 0),
    (active_tournament_id, team2_id, 0, 0, 0, 0, 0, 0, 0, 0),
    (active_tournament_id, team3_id, 0, 0, 0, 0, 0, 0, 0, 0),
    (active_tournament_id, team4_id, 0, 0, 0, 0, 0, 0, 0, 0);

END $$;
