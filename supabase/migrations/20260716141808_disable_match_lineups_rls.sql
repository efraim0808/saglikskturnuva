/*
# Disable RLS on match_lineups for public read access

1. Security Changes
- Disable RLS on `match_lineups` so that unauthenticated (guest) users can view lineup data when browsing fixtures.
- The app has a mix of public (fixture browsing) and admin-only (lineup management) use cases.
- Disabling RLS allows the anon-key frontend client to read lineup rows (including joined player names) without requiring authentication.
- Write operations are still controlled by the frontend's role-based access (canManageSuspensions / isScorekeeper checks).
*/

ALTER TABLE match_lineups DISABLE ROW LEVEL SECURITY;
