/*
# Create Main SaaS Admin Account

## Overview
Sets up the main SaaS platform administrator with the email ahmedforkan26@gmail.com.
The auth user already exists; this migration:
1. Creates the saas_users row with role = 'saas_admin'
2. Updates the auth user's password to the admin password
3. Sets email confirmation to true so login works immediately

## Security
- The saas_admin role grants full access to the SaaS admin panel
- Only this specific user is granted the admin role
*/

-- Create saas_users entry with saas_admin role
INSERT INTO saas_users (id, email, full_name, role, is_active)
SELECT id, email, 'Ahmed Forkan', 'saas_admin', true
FROM auth.users
WHERE email = 'ahmedforkan26@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'saas_admin', is_active = true;

-- Update password for the admin user
UPDATE auth.users
SET encrypted_password = crypt('01641526137@#$', gen_salt('bf')),
    email_confirmed_at = now(),
    raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{full_name}',
      '"Ahmed Forkan"'
    )
WHERE email = 'ahmedforkan26@gmail.com';