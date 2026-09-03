/*
# Fix Master Admin Auth Login — "Database error querying schema"

## Problem
The master SaaS admin (ahmedforkan26@gmail.com) could not sign in.
Supabase Auth's password grant fails with "Database error querying schema"
when any of these auth.users columns are NULL: confirmation_token,
email_change, email_change_token_new, recovery_token.

## Fix
Sets those four columns to empty strings ('') for the admin user only.
This matches what Supabase Auth expects for a normal confirmed email user.

## Security
- No password change.
- No role or permission change.
- Only affects the one admin row.
*/

UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, '')
WHERE email = 'ahmedforkan26@gmail.com';