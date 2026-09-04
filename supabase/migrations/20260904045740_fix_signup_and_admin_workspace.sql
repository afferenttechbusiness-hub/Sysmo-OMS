/*
# Fix SaaS User Sign-Up + Admin Workspace Access

## Problems Fixed

### 1. Sign-up failure — trigger function search_path
The `handle_saas_user_created()` trigger fires AFTER INSERT on auth.users
to create the matching saas_users row. It is SECURITY DEFINER but does
NOT set search_path, so it can fail to resolve the `saas_users` table
depending on the caller's search_path. When the trigger fails, the
entire auth.users INSERT is rolled back — sign-up appears to fail.

Fix: recreate the function with `SET search_path = public` so the
table name always resolves correctly.

### 2. create_tenant_for_subscription search_path
Same mutable search_path warning — fixed with SET search_path = public.

### 3. Security hardening
- Revoke EXECUTE on handle_saas_user_created from anon/authenticated
  (it's a trigger function, only the trigger should call it).
- Revoke EXECUTE on create_tenant_for_subscription from anon
  (only authenticated SaaS admins should call it).
*/

-- 1. Fix handle_saas_user_created with proper search_path
CREATE OR REPLACE FUNCTION public.handle_saas_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO saas_users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Revoke direct execution from anon/authenticated (trigger-only function)
REVOKE EXECUTE ON FUNCTION public.handle_saas_user_created() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_saas_user_created() FROM authenticated;

-- 2. Fix create_tenant_for_subscription with proper search_path
CREATE OR REPLACE FUNCTION public.create_tenant_for_subscription(sub_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_record RECORD;
  new_tenant_id uuid;
  slug_base text;
  unique_slug text;
  counter integer := 0;
BEGIN
  SELECT * INTO sub_record FROM saas_subscriptions WHERE id = sub_uuid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Subscription not found'; END IF;
  IF sub_record.status != 'pending' THEN RAISE EXCEPTION 'Subscription is not pending'; END IF;

  slug_base := COALESCE(
    (SELECT su.company_name FROM saas_users su WHERE su.id = sub_record.saas_user_id),
    split_part((SELECT su.email FROM saas_users su WHERE su.id = sub_record.saas_user_id), '@', 1)
  );
  slug_base := lower(regexp_replace(slug_base, '[^a-zA-Z0-9]', '-', 'g'));
  slug_base := regexp_replace(slug_base, '-+', '-', 'g');
  slug_base := trim(both '-' from slug_base);

  unique_slug := slug_base;
  WHILE EXISTS (SELECT 1 FROM tenants WHERE slug = unique_slug) LOOP
    counter := counter + 1;
    unique_slug := slug_base || '-' || counter;
  END LOOP;

  INSERT INTO tenants (name, slug, owner_id, plan_id, subscription_id, status)
  VALUES (
    COALESCE((SELECT su.company_name FROM saas_users su WHERE su.id = sub_record.saas_user_id), slug_base),
    unique_slug, sub_record.saas_user_id, sub_record.plan_id, sub_uuid, 'active'
  ) RETURNING id INTO new_tenant_id;

  INSERT INTO tenant_members (tenant_id, saas_user_id, role, joined_at)
  VALUES (new_tenant_id, sub_record.saas_user_id, 'admin', now());

  UPDATE saas_subscriptions
  SET status = 'approved', tenant_id = new_tenant_id, approved_at = now(), updated_at = now()
  WHERE id = sub_uuid;

  INSERT INTO departments (tenant_id, name, description, icon, color)
  VALUES
    (new_tenant_id, 'Administration', 'Administrative department', 'Building2', 'blue'),
    (new_tenant_id, 'Human Resources', 'HR department', 'Users', 'green'),
    (new_tenant_id, 'Development', 'Development team', 'Code', 'purple');

  RETURN new_tenant_id;
END;
$$;

-- Revoke from anon (only authenticated admins should call this)
REVOKE EXECUTE ON FUNCTION public.create_tenant_for_subscription(uuid) FROM anon;

-- 3. Fix update_updated_at search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4. Ensure the admin's own tenant has departments
INSERT INTO departments (tenant_id, name, description, icon, color)
SELECT '57a48317-bc7d-45e4-98dc-bde06579a3a1', d.name, d.description, d.icon, d.color
FROM (VALUES
  ('Administration', 'Administrative department', 'Building2', 'blue'),
  ('Human Resources', 'HR department', 'Users', 'green'),
  ('Development', 'Development team', 'Code', 'purple')
) AS d(name, description, icon, color)
WHERE NOT EXISTS (
  SELECT 1 FROM departments WHERE tenant_id = '57a48317-bc7d-45e4-98dc-bde06579a3a1'
);