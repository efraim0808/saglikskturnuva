CREATE TABLE sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  sponsor_amount NUMERIC NOT NULL DEFAULT 0,
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  category TEXT CHECK (category IN ('Ana Sponsor', 'Altın Sponsor', 'Gümüş Sponsor', 'Destek Sponsoru')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved sponsors (public page)
CREATE POLICY "public_read_approved_sponsors" ON sponsors
  FOR SELECT USING (status = 'approved');

-- Anyone can submit a sponsor application (no auth required)
CREATE POLICY "public_insert_sponsors" ON sponsors
  FOR INSERT WITH CHECK (status = 'pending');

-- Only authenticated users (super admin) can update sponsors
CREATE POLICY "authenticated_update_sponsors" ON sponsors
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Only authenticated users (super admin) can delete sponsors
CREATE POLICY "authenticated_delete_sponsors" ON sponsors
  FOR DELETE TO authenticated USING (true);
