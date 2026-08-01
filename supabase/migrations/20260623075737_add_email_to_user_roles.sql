-- Add email column to user_roles so client-side can list users without admin API
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS email text;

-- Index for fast lookup by email
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles (email);
