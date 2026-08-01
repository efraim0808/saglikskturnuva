
-- Add approval status to user_roles
ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));

-- New users registered via signUp will be inserted with status 'pending'
-- Super admin (sagliksk@gmail.com) keeps 'approved' by default
