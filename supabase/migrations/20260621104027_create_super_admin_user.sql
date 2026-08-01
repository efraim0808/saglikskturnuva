/*
# Create super_admin user account

1. Creates the auth user with email sagliksk@gmail.com and password Efraim+08
2. Assigns super_admin role in user_roles table
*/

-- Create auth user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'sagliksk@gmail.com',
  crypt('Efraim+08', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  '',
  'authenticated',
  'authenticated'
)
ON CONFLICT (email) WHERE (is_sso_user = false) DO NOTHING;

-- Assign super_admin role
INSERT INTO user_roles (user_id, role, team_id)
SELECT id, 'super_admin', NULL
FROM auth.users
WHERE email = 'sagliksk@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin', team_id = NULL;
