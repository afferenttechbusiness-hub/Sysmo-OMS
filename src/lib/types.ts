export type UserRole = 'admin' | 'moderator' | 'employee';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  department_id: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  skills: string[];
  certifications: string[];
  achievements: string[];
  experience: ExperienceItem[];
  phone: string | null;
  address: string | null;
  position: string | null;
  is_active: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface ExperienceItem {
  id?: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string | null;
  description: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  moderator_id: string | null;
  icon: string;
  color: string;
  icon_url: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  priority: Priority;
  department_id: string | null;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskStep {
  id: string;
  label: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  project_id: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  status: TaskStatus;
  priority: Priority;
  progress: number;
  due_date: string | null;
  steps: TaskStep[];
  attachments: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

export interface TeamGroup {
  id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  status: 'active' | 'archived';
  created_by: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'lead' | 'member';
  joined_at: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'urgent' | 'success';
  posted_by: string | null;
  department_id: string | null;
  pinned: boolean;
  created_at: string;
}

export interface Schedule {
  id: string;
  title: string;
  description: string | null;
  type: 'meeting' | 'project_deadline' | 'event' | 'review';
  start_time: string;
  end_time: string | null;
  project_id: string | null;
  department_id: string | null;
  location: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  wallet_id: string | null;
  user_id: string;
  type: 'salary' | 'withdrawal' | 'transfer_in' | 'transfer_out';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string | null;
  recipient_id: string | null;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface ChatRoom {
  id: string;
  name: string | null;
  type: 'direct' | 'group' | 'department' | 'project';
  department_id: string | null;
  project_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ChatRoomMember {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string | null;
  attachments: Record<string, unknown>[];
  read_by: string[];
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  type: 'leave' | 'remote' | 'half_day' | 'other';
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  attachments: Record<string, unknown>[];
  tags: string[];
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'resolved' | 'closed';
  admin_response: string | null;
  created_at: string;
}

// Database type for Supabase
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      departments: { Row: Department; Insert: Partial<Department>; Update: Partial<Department> };
      projects: { Row: Project; Insert: Partial<Project>; Update: Partial<Project> };
      tasks: { Row: Task; Insert: Partial<Task>; Update: Partial<Task> };
      team_groups: { Row: TeamGroup; Insert: Partial<TeamGroup>; Update: Partial<TeamGroup> };
      team_members: { Row: TeamMember; Insert: Partial<TeamMember>; Update: Partial<TeamMember> };
      notices: { Row: Notice; Insert: Partial<Notice>; Update: Partial<Notice> };
      schedules: { Row: Schedule; Insert: Partial<Schedule>; Update: Partial<Schedule> };
      wallets: { Row: Wallet; Insert: Partial<Wallet>; Update: Partial<Wallet> };
      transactions: { Row: Transaction; Insert: Partial<Transaction>; Update: Partial<Transaction> };
      withdrawal_requests: { Row: WithdrawalRequest; Insert: Partial<WithdrawalRequest>; Update: Partial<WithdrawalRequest> };
      chat_rooms: { Row: ChatRoom; Insert: Partial<ChatRoom>; Update: Partial<ChatRoom> };
      chat_room_members: { Row: ChatRoomMember; Insert: Partial<ChatRoomMember>; Update: Partial<ChatRoomMember> };
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> };
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> };
      applications: { Row: Application; Insert: Partial<Application>; Update: Partial<Application> };
      posts: { Row: Post; Insert: Partial<Post>; Update: Partial<Post> };
      post_comments: { Row: PostComment; Insert: Partial<PostComment>; Update: Partial<PostComment> };
      reports: { Row: Report; Insert: Partial<Report>; Update: Partial<Report> };
    };
  };
}
