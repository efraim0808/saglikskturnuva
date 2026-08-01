CREATE TABLE IF NOT EXISTS password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (anon / authenticated) can insert a reset request
CREATE POLICY "insert_password_reset" ON password_reset_requests FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Only authenticated users can read (super_admin checks all requests)
CREATE POLICY "select_password_reset" ON password_reset_requests FOR SELECT
  TO authenticated USING (true);

-- Only authenticated users can update (super_admin marks resolved)
CREATE POLICY "update_password_reset" ON password_reset_requests FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Only authenticated users can delete
CREATE POLICY "delete_password_reset" ON password_reset_requests FOR DELETE
  TO authenticated USING (true);
