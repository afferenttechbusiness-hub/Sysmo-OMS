/*
# Sysmobyte OMS - RLS Policies

Enables RLS on all tables and creates ownership/membership-based policies.
*/

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Departments policies
DROP POLICY IF EXISTS "dept_select_all" ON departments;
CREATE POLICY "dept_select_all" ON departments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "dept_modify_admin_mod" ON departments;
CREATE POLICY "dept_modify_admin_mod" ON departments FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));

-- Projects policies
DROP POLICY IF EXISTS "proj_select_all" ON projects;
CREATE POLICY "proj_select_all" ON projects FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "proj_modify_admin_mod" ON projects;
CREATE POLICY "proj_modify_admin_mod" ON projects FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));

-- Tasks policies
DROP POLICY IF EXISTS "task_select_all" ON tasks;
CREATE POLICY "task_select_all" ON tasks FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "task_insert_admin_mod" ON tasks;
CREATE POLICY "task_insert_admin_mod" ON tasks FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));

DROP POLICY IF EXISTS "task_update_all" ON tasks;
CREATE POLICY "task_update_all" ON tasks FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "task_delete_admin_mod" ON tasks;
CREATE POLICY "task_delete_admin_mod" ON tasks FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));

-- Team groups policies
DROP POLICY IF EXISTS "team_select_all" ON team_groups;
CREATE POLICY "team_select_all" ON team_groups FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "team_modify_admin" ON team_groups;
CREATE POLICY "team_modify_admin" ON team_groups FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Team members policies
DROP POLICY IF EXISTS "tmember_select_all" ON team_members;
CREATE POLICY "tmember_select_all" ON team_members FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "tmember_modify_admin" ON team_members;
CREATE POLICY "tmember_modify_admin" ON team_members FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Notices policies
DROP POLICY IF EXISTS "notice_select_all" ON notices;
CREATE POLICY "notice_select_all" ON notices FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "notice_insert_admin_mod" ON notices;
CREATE POLICY "notice_insert_admin_mod" ON notices FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));

DROP POLICY IF EXISTS "notice_delete_admin_mod" ON notices;
CREATE POLICY "notice_delete_admin_mod" ON notices FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));

-- Schedules policies
DROP POLICY IF EXISTS "sched_select_all" ON schedules;
CREATE POLICY "sched_select_all" ON schedules FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "sched_modify_admin_mod" ON schedules;
CREATE POLICY "sched_modify_admin_mod" ON schedules FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));

-- Wallets policies
DROP POLICY IF EXISTS "wallet_select_own_admin" ON wallets;
CREATE POLICY "wallet_select_own_admin" ON wallets FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "wallet_update_admin" ON wallets;
CREATE POLICY "wallet_update_admin" ON wallets FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "wallet_insert_admin" ON wallets;
CREATE POLICY "wallet_insert_admin" ON wallets FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Transactions policies
DROP POLICY IF EXISTS "txn_select_own_admin" ON transactions;
CREATE POLICY "txn_select_own_admin" ON transactions FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "txn_insert_all" ON transactions;
CREATE POLICY "txn_insert_all" ON transactions FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "txn_update_admin" ON transactions;
CREATE POLICY "txn_update_admin" ON transactions FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Withdrawal requests policies
DROP POLICY IF EXISTS "wdraw_select_own_admin" ON withdrawal_requests;
CREATE POLICY "wdraw_select_own_admin" ON withdrawal_requests FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "wdraw_insert_own" ON withdrawal_requests;
CREATE POLICY "wdraw_insert_own" ON withdrawal_requests FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "wdraw_update_admin" ON withdrawal_requests;
CREATE POLICY "wdraw_update_admin" ON withdrawal_requests FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Chat rooms policies
DROP POLICY IF EXISTS "chat_select_members" ON chat_rooms;
CREATE POLICY "chat_select_members" ON chat_rooms FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = chat_rooms.id AND user_id = auth.uid())
    OR type IN ('department','project')
  );

DROP POLICY IF EXISTS "chat_insert_admin_mod" ON chat_rooms;
CREATE POLICY "chat_insert_admin_mod" ON chat_rooms FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));

-- Chat room members policies
DROP POLICY IF EXISTS "crmember_select_all" ON chat_room_members;
CREATE POLICY "crmember_select_all" ON chat_room_members FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "crmember_insert_all" ON chat_room_members;
CREATE POLICY "crmember_insert_all" ON chat_room_members FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- Messages policies
DROP POLICY IF EXISTS "msg_select_members" ON messages;
CREATE POLICY "msg_select_members" ON messages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = messages.room_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "msg_insert_members" ON messages;
CREATE POLICY "msg_insert_members" ON messages FOR INSERT
  TO authenticated WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = messages.room_id AND user_id = auth.uid())
  );

-- Notifications policies
DROP POLICY IF EXISTS "notif_select_own" ON notifications;
CREATE POLICY "notif_select_own" ON notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notif_insert_all" ON notifications;
CREATE POLICY "notif_insert_all" ON notifications FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "notif_update_own" ON notifications;
CREATE POLICY "notif_update_own" ON notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notif_delete_own" ON notifications;
CREATE POLICY "notif_delete_own" ON notifications FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- Applications policies
DROP POLICY IF EXISTS "app_select_own_admin" ON applications;
CREATE POLICY "app_select_own_admin" ON applications FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "app_insert_own" ON applications;
CREATE POLICY "app_insert_own" ON applications FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "app_update_admin" ON applications;
CREATE POLICY "app_update_admin" ON applications FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Posts policies
DROP POLICY IF EXISTS "post_select_all" ON posts;
CREATE POLICY "post_select_all" ON posts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "post_insert_own" ON posts;
CREATE POLICY "post_insert_own" ON posts FOR INSERT
  TO authenticated WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "post_delete_own" ON posts;
CREATE POLICY "post_delete_own" ON posts FOR DELETE
  TO authenticated USING (author_id = auth.uid());

-- Post comments policies
DROP POLICY IF EXISTS "comment_select_all" ON post_comments;
CREATE POLICY "comment_select_all" ON post_comments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "comment_insert_own" ON post_comments;
CREATE POLICY "comment_insert_own" ON post_comments FOR INSERT
  TO authenticated WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "comment_delete_own" ON post_comments;
CREATE POLICY "comment_delete_own" ON post_comments FOR DELETE
  TO authenticated USING (author_id = auth.uid());

-- Post likes policies
DROP POLICY IF EXISTS "like_select_all" ON post_likes;
CREATE POLICY "like_select_all" ON post_likes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "like_insert_own" ON post_likes;
CREATE POLICY "like_insert_own" ON post_likes FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "like_delete_own" ON post_likes;
CREATE POLICY "like_delete_own" ON post_likes FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- Reports policies
DROP POLICY IF EXISTS "report_select_own_admin" ON reports;
CREATE POLICY "report_select_own_admin" ON reports FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "report_insert_own" ON reports;
CREATE POLICY "report_insert_own" ON reports FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "report_update_admin" ON reports;
CREATE POLICY "report_update_admin" ON reports FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));