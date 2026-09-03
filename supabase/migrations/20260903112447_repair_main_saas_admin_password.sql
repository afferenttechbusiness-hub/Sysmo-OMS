/*
# Repair Main SaaS Admin Password

## Overview
Regenerates the master SaaS administrator password using the standard bcrypt work factor expected by Supabase Auth.

## Changes
- Replaces the existing password hash for ahmedforkan26@gmail.com.
- Keeps the email confirmed so password sign-in is available immediately.
- Does not change the administrator's role or any tenant data.
*/

UPDATE auth.users
SET encrypted_password = crypt('01641526137@#$', gen_salt('bf', 10)),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email = 'ahmedforkan26@gmail.com';