-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "public_read_approved_sponsors" ON sponsors;

-- Public (anonymous) visitors can only read approved sponsors
CREATE POLICY "anon_read_approved_sponsors" ON sponsors
  FOR SELECT TO anon USING (status = 'approved');

-- Authenticated users (including super_admin) can read ALL sponsors
CREATE POLICY "authenticated_read_all_sponsors" ON sponsors
  FOR SELECT TO authenticated USING (true);
