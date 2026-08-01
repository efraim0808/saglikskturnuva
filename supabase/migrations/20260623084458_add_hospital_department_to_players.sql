ALTER TABLE players
  ADD COLUMN IF NOT EXISTS hospital text,
  ADD COLUMN IF NOT EXISTS department text;
