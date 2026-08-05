-- Migration: Normalize existing team names to uppercase for Türkçe locale
-- This updates existing rows in the teams and team_applications tables so all stored names appear uppercase.

UPDATE teams
SET name = UPPER(name)
WHERE name IS NOT NULL;

UPDATE team_applications
SET team_name = UPPER(team_name)
WHERE team_name IS NOT NULL;
