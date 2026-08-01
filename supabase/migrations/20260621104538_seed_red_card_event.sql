/*
# Add red card event to live match for demo purposes

1. Finds the live match between Acil Servis FC and Ameliyathane Gücü
2. Adds a red card event for Dr. Fatma Çelik (Ameliyathane Gücü)
3. Auto-creates a player_suspension record for the red card
*/

DO $$
DECLARE
  match_record RECORD;
  player_record RECORD;
  tournament_id_val uuid;
  team_id_val uuid;
BEGIN
  -- Find the live match
  SELECT m.id AS match_id, f.tournament_id, f.home_team_id, f.away_team_id
  INTO match_record
  FROM matches m
  JOIN fixtures f ON m.fixture_id = f.id
  WHERE m.status = 'live'
  LIMIT 1;

  IF match_record.match_id IS NULL THEN
    RAISE NOTICE 'No live match found';
    RETURN;
  END IF;

  tournament_id_val := match_record.tournament_id;

  -- Find Dr. Fatma Çelik from Ameliyathane Gücü
  SELECT p.id, p.team_id
  INTO player_record
  FROM players p
  JOIN teams t ON p.team_id = t.id
  WHERE p.name = 'Dr. Fatma Çelik'
    AND t.name = 'Ameliyathane Gücü'
  LIMIT 1;

  IF player_record.id IS NULL THEN
    RAISE NOTICE 'Player not found';
    RETURN;
  END IF;

  team_id_val := player_record.team_id;

  -- Add red card event
  INSERT INTO match_events (match_id, event_type, player_id, minute, details)
  VALUES (match_record.match_id, 'red_card', player_record.id, 42, 'Kasti sert müdahale');

  -- Add auto suspension
  INSERT INTO player_suspensions (tournament_id, player_id, team_id, reason, matches_total, matches_remaining, match_id, is_auto)
  VALUES (tournament_id_val, player_record.id, team_id_val, 'Kırmızı kart - Kasti sert müdahale', 1, 1, match_record.match_id, true);

END $$;
