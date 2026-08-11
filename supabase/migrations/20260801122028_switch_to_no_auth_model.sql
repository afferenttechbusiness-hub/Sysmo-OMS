/*
# Sysmobyte OMS - Switch to no-auth login model

## Changes
1. Drop the auth trigger (no longer using Supabase Auth)
2. Drop FK from profiles to auth.users
3. Change profiles.id default to gen_random_uuid()
4. Replace all RLS policies with anon-accessible ones (no real auth)
5. Add updated_at trigger for profiles

## Rationale
The app now uses a simplified login: users enter email + department, no password needed.
Admin email shows a password field. No Supabase Auth is used.
*/

-- Drop auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop FK from profiles to auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Change profiles.id default to gen_random_uuid()
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add updated_at trigger for profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Replace ALL RLS policies with anon-accessible versions

-- Profiles
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_all" ON profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_all" ON profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_delete_all" ON profiles FOR DELETE
  TO anon, authenticated USING (true);

-- Departments
DROP POLICY IF EXISTS "dept_select_all" ON departments;
CREATE POLICY "dept_select_all" ON departments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "dept_modify_admin_mod" ON departments;
CREATE POLICY "dept_modify_all" ON departments FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Projects
DROP POLICY IF EXISTS "proj_select_all" ON projects;
CREATE POLICY "proj_select_all" ON projects FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "proj_modify_admin_mod" ON projects;
CREATE POLICY "proj_modify_all" ON projects FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Tasks
DROP POLICY IF EXISTS "task_select_all" ON tasks;
CREATE POLICY "task_select_all" ON tasks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "task_insert_admin_mod" ON tasks;
CREATE POLICY "task_insert_all" ON tasks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "task_update_all" ON tasks;
CREATE POLICY "task_update_all" ON tasks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "task_delete_admin_mod" ON tasks;
CREATE POLICY "task_delete_all" ON tasks FOR DELETE
  TO anon, authenticated USING (true);

-- Team groups
DROP POLICY IF EXISTS "team_select_all" ON team_groups;
CREATE POLICY "team_select_all" ON team_groups FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "team_modify_admin" ON team_groups;
CREATE POLICY "team_modify_all" ON team_groups FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Team members
DROP POLICY IF EXISTS "tmember_select_all" ON team_members;
CREATE POLICY "tmember_select_all" ON team_members FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "tmember_modify_admin" ON team_members;
CREATE POLICY "tmember_modify_all" ON team_members FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Notices
DROP POLICY IF EXISTS "notice_select_all" ON notices;
CREATE POLICY "notice_select_all" ON notices FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "notice_insert_admin_mod" ON notices;
CREATE POLICY "notice_insert_all" ON notices FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "notice_delete_admin_mod" ON notices;
CREATE POLICY "notice_delete_all" ON notices FOR DELETE
  TO anon, authenticated USING (true);

-- Schedules
DROP POLICY IF EXISTS "sched_select_all" ON schedules;
CREATE POLICY "sched_select_all" ON schedules FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "sched_modify_admin_mod" ON schedules;
CREATE POLICY "sched_modify_all" ON schedules FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Wallets
DROP POLICY IF EXISTS "wallet_select_own_admin" ON wallets;
CREATE POLICY "wallet_select_all" ON wallets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "wallet_update_admin" ON wallets;
CREATE POLICY "wallet_update_all" ON wallets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "wallet_insert_admin" ON wallets;
CREATE POLICY "wallet_insert_all" ON wallets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Transactions
DROP POLICY IF EXISTS "txn_select_own_admin" ON transactions;
CREATE POLICY "txn_select_all" ON transactions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "txn_insert_all" ON transactions;
CREATE POLICY "txn_insert_all" ON transactions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "txn_update_admin" ON transactions;
CREATE POLICY "txn_update_all" ON transactions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Withdrawal requests
DROP POLICY IF EXISTS "wdraw_select_own_admin" ON withdrawal_requests;
CREATE POLICY "wdraw_select_all" ON withdrawal_requests FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "wdraw_insert_own" ON withdrawal_requests;
CREATE POLICY "wdraw_insert_all" ON withdrawal_requests FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "wdraw_update_admin" ON withdrawal_requests;
CREATE POLICY "wdraw_update_all" ON withdrawal_requests FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Chat rooms
DROP POLICY IF EXISTS "chat_select_members" ON chat_rooms;
CREATE POLICY "chat_select_all" ON chat_rooms FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "chat_insert_admin_mod" ON chat_rooms;
CREATE POLICY "chat_insert_all" ON chat_rooms FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Chat room members
DROP POLICY IF EXISTS "crmember_select_all" ON chat_room_members;
CREATE POLICY "crmember_select_all" ON chat_room_members FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "crmember_insert_all" ON chat_room_members;
CREATE POLICY "crmember_insert_all" ON chat_room_members FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Messages
DROP POLICY IF EXISTS "msg_select_members" ON messages;
CREATE POLICY "msg_select_all" ON messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "msg_insert_members" ON messages;
CREATE POLICY "msg_insert_all" ON messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Notifications
DROP POLICY IF EXISTS "notif_select_own" ON notifications;
CREATE POLICY "notif_select_all" ON notifications FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "notif_insert_all" ON notifications;
CREATE POLICY "notif_insert_all" ON notifications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "notif_update_own" ON notifications;
CREATE POLICY "notif_update_all" ON notifications FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "notif_delete_own" ON notifications;
CREATE POLICY "notif_delete_all" ON notifications FOR DELETE
  TO anon, authenticated USING (true);

-- Applications
DROP POLICY IF EXISTS "app_select_own_admin" ON applications;
CREATE POLICY "app_select_all" ON applications FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "app_insert_own" ON applications;
CREATE POLICY "app_insert_all" ON applications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "app_update_admin" ON applications;
CREATE POLICY "app_update_all" ON applications FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Posts
DROP POLICY IF EXISTS "post_select_all" ON posts;
CREATE POLICY "post_select_all" ON posts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "post_insert_own" ON posts;
CREATE POLICY "post_insert_all" ON posts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "post_delete_own" ON posts;
CREATE POLICY "post_delete_all" ON posts FOR DELETE
  TO anon, authenticated USING (true);

-- Post comments
DROP POLICY IF EXISTS "comment_select_all" ON post_comments;
CREATE POLICY "comment_select_all" ON post_comments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "comment_insert_own" ON post_comments;
CREATE POLICY "comment_insert_all" ON post_comments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "comment_delete_own" ON post_comments;
CREATE POLICY "comment_delete_all" ON post_comments FOR DELETE
  TO anon, authenticated USING (true);

-- Post likes
DROP POLICY IF EXISTS "like_select_all" ON post_likes;
CREATE POLICY "like_select_all" ON post_likes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "like_insert_own" ON post_likes;
CREATE POLICY "like_insert_all" ON post_likes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "like_delete_own" ON post_likes;
CREATE POLICY "like_delete_all" ON post_likes FOR DELETE
  TO anon, authenticated USING (true);

-- Reports
DROP POLICY IF EXISTS "report_select_own_admin" ON reports;
CREATE POLICY "report_select_all" ON reports FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "report_insert_own" ON reports;
CREATE POLICY "report_insert_all" ON reports FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "report_update_admin" ON reports;
CREATE POLICY "report_update_all" ON reports FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);