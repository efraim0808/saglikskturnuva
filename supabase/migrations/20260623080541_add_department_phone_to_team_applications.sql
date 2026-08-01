-- Add extra fields to team_applications for richer form data
ALTER TABLE team_applications
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS phone text;
