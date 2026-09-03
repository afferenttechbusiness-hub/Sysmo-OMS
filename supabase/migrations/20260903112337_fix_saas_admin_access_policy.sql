/*
# Fix SaaS Admin Access Policy

## Overview
Fixes the SaaS user read policy that recursively queried `saas_users` while checking whether the current user is an administrator. That recursion can make authenticated requests fail with a database error instead of loading the master admin profile.

## Security changes
- Removes the recursive SaaS user policy.
- Adds a SECURITY DEFINER helper that checks the current user's role without invoking the table's RLS policy.
- Keeps access limited to the signed-in user and verified SaaS administrators.
- Grants the helper only to authenticated users.
*/

CREATE OR REPLACE FUNCTION public.is_saas_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.saas_users
    WHERE id = auth.uid()
      AND role = 'saas_admin'
      AND is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_saas_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_saas_admin() TO authenticated;

DROP POLICY IF EXISTS "saas_user_select_own" ON public.saas_users;
CREATE POLICY "saas_user_select_own" ON public.saas_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_saas_admin());

DROP POLICY IF EXISTS "saas_user_update_own" ON public.saas_users;
CREATE POLICY "saas_user_update_own" ON public.saas_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_saas_admin())
  WITH CHECK (auth.uid() = id OR public.is_saas_admin());
