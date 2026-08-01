CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  caption TEXT,
  category TEXT NOT NULL DEFAULT 'Genel',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gallery_select_public" ON gallery FOR SELECT
  USING (true);

CREATE POLICY "gallery_insert_authenticated" ON gallery FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "gallery_delete_authenticated" ON gallery FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "gallery_update_authenticated" ON gallery FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);