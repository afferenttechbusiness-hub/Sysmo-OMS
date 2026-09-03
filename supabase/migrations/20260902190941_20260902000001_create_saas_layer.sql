/*
# SaaS Multi-Tenant Layer for Sysmobyte OMS

## Overview
Transforms the single-tenant OMS into a multi-tenant SaaS platform.
Users sign up, purchase a subscription plan, SaaS admin approves it,
and an isolated tenant environment is automatically created.

## New Tables
1. saas_users — SaaS platform users (linked to auth.users)
2. saas_plans — Subscription packages (Starter, Professional, Enterprise)
3. tenants — Isolated OMS environments
4. tenant_members — Maps SaaS users to tenants with roles
5. saas_subscriptions — Customer subscription records

## Modified Tables
All existing OMS tables get a nullable tenant_id column for isolation.

## Security
- RLS on all new tables with proper ownership/member checks
- saas_plans: public read

## Functions
- create_tenant_for_subscription(): SECURITY DEFINER
- handle_saas_user_created(): auto-create saas_user on auth signup

## Seed Data
- 3 plans: Starter ($29), Professional ($79), Enterprise ($199)
*/

-- ============================================================
-- 1. CREATE ALL TABLES FIRST (no policies yet)
-- ============================================================

-- saas_users
CREATE TABLE IF NOT EXISTS saas_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  company_name text,
  phone text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('saas_admin', 'customer')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE saas_users ENABLE ROW LEVEL SECURITY;

-- saas_plans
CREATE TABLE IF NOT EXISTS saas_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly numeric(12,2) NOT NULL DEFAULT 0,
  price_yearly numeric(12,2) DEFAULT 0,
  max_users integer NOT NULL DEFAULT 10,
  max_departments integer DEFAULT 5,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;

-- tenants (subscription_id added later via ALTER)
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  owner_id uuid NOT NULL REFERENCES saas_users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES saas_plans(id) ON DELETE RESTRICT,
  subscription_id uuid,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','cancelled')),
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- tenant_members (FK to tenants)
CREATE TABLE IF NOT EXISTS tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  saas_user_id uuid NOT NULL REFERENCES saas_users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin','moderator','employee')),
  department_id uuid,
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, saas_user_id)
);
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

-- saas_subscriptions (FK to tenants)
CREATE TABLE IF NOT EXISTS saas_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saas_user_id uuid NOT NULL REFERENCES saas_users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES saas_plans(id) ON DELETE RESTRICT,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended','cancelled')),
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
  amount numeric(12,2) NOT NULL DEFAULT 0,
  payment_method text,
  payment_reference text,
  admin_note text,
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE saas_subscriptions ENABLE ROW LEVEL SECURITY;

-- Back-link tenants.subscription_id FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tenants_subscription_id_fkey' AND table_name = 'tenants'
  ) THEN
    ALTER TABLE tenants ADD CONSTRAINT tenants_subscription_id_fkey
    FOREIGN KEY (subscription_id) REFERENCES saas_subscriptions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 2. RLS POLICIES
-- ============================================================

-- saas_users
DROP POLICY IF EXISTS "saas_user_select_own" ON saas_users;
CREATE POLICY "saas_user_select_own" ON saas_users FOR SELECT
  TO authenticated USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM saas_users su WHERE su.id = auth.uid() AND su.role = 'saas_admin'
  ));
DROP POLICY IF EXISTS "saas_user_update_own" ON saas_users;
CREATE POLICY "saas_user_update_own" ON saas_users FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "saas_user_insert_own" ON saas_users;
CREATE POLICY "saas_user_insert_own" ON saas_users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- saas_plans
DROP POLICY IF EXISTS "plan_select_all" ON saas_plans;
CREATE POLICY "plan_select_all" ON saas_plans FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "plan_modify_admin" ON saas_plans;
CREATE POLICY "plan_modify_admin" ON saas_plans FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM saas_users WHERE id = auth.uid() AND role = 'saas_admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM saas_users WHERE id = auth.uid() AND role = 'saas_admin')
  );

-- tenants
DROP POLICY IF EXISTS "tenant_select_member" ON tenants;
CREATE POLICY "tenant_select_member" ON tenants FOR SELECT
  TO authenticated USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM tenant_members tm WHERE tm.saas_user_id = auth.uid() AND tm.tenant_id = tenants.id)
    OR EXISTS (SELECT 1 FROM saas_users WHERE id = auth.uid() AND role = 'saas_admin')
  );
DROP POLICY IF EXISTS "tenant_update_owner_admin" ON tenants;
CREATE POLICY "tenant_update_owner_admin" ON tenants FOR UPDATE
  TO authenticated USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM saas_users WHERE id = auth.uid() AND role = 'saas_admin')
  ) WITH CHECK (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM saas_users WHERE id = auth.uid() AND role = 'saas_admin')
  );

-- tenant_members
DROP POLICY IF EXISTS "tmember_select_tenant" ON tenant_members;
CREATE POLICY "tmember_select_tenant" ON tenant_members FOR SELECT
  TO authenticated USING (
    saas_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM tenant_members tm2 WHERE tm2.saas_user_id = auth.uid() AND tm2.tenant_id = tenant_members.tenant_id AND tm2.role IN ('admin','moderator'))
    OR EXISTS (SELECT 1 FROM tenants t WHERE t.owner_id = auth.uid() AND t.id = tenant_members.tenant_id)
    OR EXISTS (SELECT 1 FROM saas_users WHERE id = auth.uid() AND role = 'saas_admin')
  );
DROP POLICY IF EXISTS "tmember_insert_admin" ON tenant_members;
CREATE POLICY "tmember_insert_admin" ON tenant_members FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM tenants t WHERE t.owner_id = auth.uid() AND t.id = tenant_members.tenant_id)
    OR EXISTS (SELECT 1 FROM tenant_members tm3 WHERE tm3.saas_user_id = auth.uid() AND tm3.tenant_id = tenant_members.tenant_id AND tm3.role = 'admin')
    OR EXISTS (SELECT 1 FROM saas_users WHERE id = auth.uid() AND role = 'saas_admin')
  );
DROP POLICY IF EXISTS "tmember_update_admin" ON tenant_members;
CREATE POLICY "tmember_update_admin" ON tenant_members FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM tenants t WHERE t.owner_id = auth.uid() AND t.id = tenant_members.tenant_id)
    OR EXISTS (SELECT 1 FROM saas_users WHERE id = auth.uid() AND role = 'saas_admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM tenants t WHERE t.owner_id = auth.uid() AND t.id = tenant_members.tenant_id)
    OR EXISTS (SELECT 1 FROM saas_users WHERE id = auth.uid() AND role = 'saas_admin')
  );
DROP POLICY IF EXISTS "tmember_delete_admin" ON tenant_members;
CREATE POLICY "tmember_delete_admin" ON tenant_members FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM tenants t WHERE t.owner_id = auth.uid() AND t.id = tenant_members.tenant_id)
    OR EXISTS (SELECT 1 FROM saas_users WHERE id = auth.uid() AND role = 'saas_admin')
  );

-- saas_subscriptions
DROP POLICY IF EXISTS "sub_select_own_admin" ON saas_subscriptions;
CREATE POLICY "sub_select_own_admin" ON saas_subscriptions FOR SELECT
  TO authenticated USING (
    saas_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM saas_users WHERE id = auth.uid() AND role = 'saas_admin')
  );
DROP POLICY IF EXISTS "sub_insert_own" ON saas_subscriptions;
CREATE POLICY "sub_insert_own" ON saas_subscriptions FOR INSERT
  TO authenticated WITH CHECK (saas_user_id = auth.uid());
DROP POLICY IF EXISTS "sub_update_admin" ON saas_subscriptions;
CREATE POLICY "sub_update_admin" ON saas_subscriptions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM saas_users WHERE id = auth.uid() AND role = 'saas_admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM saas_users WHERE id = auth.uid() AND role = 'saas_admin')
  );

-- ============================================================
-- 3. ADD tenant_id TO EXISTING OMS TABLES
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tenant_id') THEN
    ALTER TABLE profiles ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'tenant_id') THEN
    ALTER TABLE departments ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'tenant_id') THEN
    ALTER TABLE projects ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'tenant_id') THEN
    ALTER TABLE tasks ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notices' AND column_name = 'tenant_id') THEN
    ALTER TABLE notices ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'tenant_id') THEN
    ALTER TABLE schedules ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'tenant_id') THEN
    ALTER TABLE wallets ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'tenant_id') THEN
    ALTER TABLE transactions ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'withdrawal_requests' AND column_name = 'tenant_id') THEN
    ALTER TABLE withdrawal_requests ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_rooms' AND column_name = 'tenant_id') THEN
    ALTER TABLE chat_rooms ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_room_members' AND column_name = 'tenant_id') THEN
    ALTER TABLE chat_room_members ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'tenant_id') THEN
    ALTER TABLE messages ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'tenant_id') THEN
    ALTER TABLE notifications ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'tenant_id') THEN
    ALTER TABLE applications ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'tenant_id') THEN
    ALTER TABLE posts ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'post_comments' AND column_name = 'tenant_id') THEN
    ALTER TABLE post_comments ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'post_likes' AND column_name = 'tenant_id') THEN
    ALTER TABLE post_likes ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'tenant_id') THEN
    ALTER TABLE reports ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_groups' AND column_name = 'tenant_id') THEN
    ALTER TABLE team_groups ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_members' AND column_name = 'tenant_id') THEN
    ALTER TABLE team_members ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_departments_tenant ON departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notices_tenant ON notices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_schedules_tenant ON schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wallets_tenant ON wallets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_tenant ON withdrawal_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_tenant ON chat_rooms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_applications_tenant ON applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_posts_tenant ON posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_team_groups_tenant ON team_groups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saas_subscriptions_user ON saas_subscriptions(saas_user_id);

-- ============================================================
-- 4. SECURITY DEFINER FUNCTION: create_tenant_for_subscription
-- ============================================================
CREATE OR REPLACE FUNCTION create_tenant_for_subscription(sub_uuid uuid)
RETURNS uuid AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. AUTH TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION handle_saas_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO saas_users (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 'customer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_saas ON auth.users;
CREATE TRIGGER on_auth_user_created_saas
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_saas_user_created();

-- ============================================================
-- 6. SEED PLANS
-- ============================================================
INSERT INTO saas_plans (name, description, price_monthly, price_yearly, max_users, max_departments, features, sort_order)
VALUES
  ('Starter', 'Perfect for small teams getting started with office management.', 29.00, 290.00, 10, 3, '["Up to 10 users","3 departments","Task management","Team chat","Basic analytics"]'::jsonb, 1),
  ('Professional', 'For growing organizations that need more power and flexibility.', 79.00, 790.00, 50, 10, '["Up to 50 users","10 departments","Advanced analytics","Project management","Schedule management","Wallet & transactions","Priority support"]'::jsonb, 2),
  ('Enterprise', 'For large organizations with advanced needs and custom requirements.', 199.00, 1990.00, 500, 50, '["Up to 500 users","50 departments","Full feature access","Custom roles","Advanced security","Dedicated support","SLA guarantee"]'::jsonb, 3)
ON CONFLICT DO NOTHING;