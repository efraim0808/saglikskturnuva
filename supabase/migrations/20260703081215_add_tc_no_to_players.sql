/*
# Add TC Kimlik Number to Players Table

## Purpose
Adds a `tc_no` column to the `players` table to store Turkish Identity Numbers (TC Kimlik No).
This enables tournament-wide duplicate player detection (preventing "kaçak transfer" / illegal transfers)
and enforces per-tournament uniqueness of TC numbers.

## Changes
1. New Column
   - `players.tc_no` (text, nullable, max 11 characters)
     - Stores the 11-digit TC Kimlik number.
     - Nullable initially so existing player rows are not broken.
     - Frontend will enforce: 11 digits, numbers only, required for new players.

2. Index
   - Added a B-tree index on `players(tc_no)` to speed up duplicate-check queries.

## Security
- No RLS policy changes. Existing policies on `players` remain unchanged.
- TC No is treated as sensitive personal data — the frontend masks it and only shows it
  to the player's own team captain (team_manager) or super_admin/scorekeeper.

## Notes
1. The column is nullable so the migration is safe for existing data.
2. Uniqueness is NOT enforced at the DB level (to allow nulls and multi-tournament scenarios);
   the frontend checks for duplicates within the same tournament before insert/update.
3. If a stricter DB-level unique constraint is needed later, a partial unique index can be added:
   CREATE UNIQUE INDEX IF NOT EXISTS players_tc_no_unique
   ON players(tc_no) WHERE tc_no IS NOT NULL;
*/

-- Add tc_no column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'tc_no'
  ) THEN
    ALTER TABLE players ADD COLUMN tc_no text;
  END IF;
END $$;

-- Add index for faster duplicate checks
CREATE INDEX IF NOT EXISTS idx_players_tc_no ON players(tc_no);
