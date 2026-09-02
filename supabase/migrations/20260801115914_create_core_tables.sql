/*
# Sysmobyte OMS - Core Schema (Tables Only)

Creates all tables first. Policies applied in a separate migration.
*/

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin','moderator','employee')),
  department_id uuid,
  avatar_url text,
  cover_url text,
  bio text,
  skills text[] DEFAULT '{}',
  certifications text[] DEFAULT '{}',
  achievements text[] DEFAULT '{}',
  experience jsonb DEFAULT '[]',
  phone text,
  address text,
  position text,
  is_active boolean DEFAULT true,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  moderator_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  icon text DEFAULT 'Building2',
  color text DEFAULT 'blue',
  created_at timestamptz DEFAULT now()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','active','on_hold','completed','cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  start_date date,
  end_date date,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','review','done')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date date,
  steps jsonb DEFAULT '[]',
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Team groups
CREATE TABLE IF NOT EXISTS team_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES team_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('lead','member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Notices
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info','warning','urgent','success')),
  posted_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Schedules
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('meeting','project_deadline','event','review')),
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  location text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Wallets
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  balance numeric(12,2) DEFAULT 0,
  currency text DEFAULT 'BDT',
  updated_at timestamptz DEFAULT now()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES wallets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('salary','withdrawal','transfer_in','transfer_out')),
  amount numeric(12,2) NOT NULL,
  status text DEFAULT 'completed' CHECK (status IN ('pending','completed','failed')),
  description text,
  recipient_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- Chat rooms
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  type text NOT NULL CHECK (type IN ('direct','group','department','project')),
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Chat room members
CREATE TABLE IF NOT EXISTS chat_room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text,
  attachments jsonb DEFAULT '[]',
  read_by uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Applications (leave requests)
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'leave' CHECK (type IN ('leave','remote','half_day','other')),
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  attachments jsonb DEFAULT '[]',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Post comments
CREATE TABLE IF NOT EXISTS post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Post likes
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open','resolved','closed')),
  admin_response text,
  created_at timestamptz DEFAULT now()
);

-- Add FK from profiles to departments
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_department_id_fkey;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_department_id_fkey
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department_id);