import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import {
  FolderKanban, CheckSquare, Clock, TrendingUp, Users,
  CalendarDays, Bell, ArrowUpRight, Activity, Target, Zap
} from 'lucide-react';
import { useDashboardData } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem, Skeleton } from '@/components/ui/Animations';
import { Avatar, ProgressBar, Badge } from '@/components/ui/Avatar';
import { cn, statusColor, statusLabel, formatDate, smartDate, formatTime } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  planning: '#94a3b8',
  active: '#22c55e',
  on_hold: '#f59e0b',
  completed: '#3b82f6',
  cancelled: '#ef4444',
};

const TASK_COLORS: Record<string, string> = {
  todo: '#94a3b8',
  in_progress: '#06b6d4',
  review: '#f59e0b',
  done: '#22c55e',
};

export function Dashboard() {
  const { profile } = useAuth();
  const { projects, tasks, notices, schedules, loading } = useDashboardData();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Pie chart moves right and up on scroll down
  const pieX = useTransform(scrollYProgress, [0, 0.3], [0, 100]);
  const pieY = useTransform(scrollYProgress, [0, 0.3], [0, -30]);
  const pieScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.9]);

  const projectStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: STATUS_COLORS[name] }));
  }, [projects]);

  const taskStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: TASK_COLORS[name] }));
  }, [tasks]);

  const weeklyActivity = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, i) => ({
      day,
      tasks: Math.floor(Math.random() * 8) + 2,
      completed: Math.floor(Math.random() * 6) + 1,
    }));
  }, []);

  const stats = [
    { label: 'Active Projects', value: projects.filter(p => p.status === 'active').length, total: projects.length, icon: FolderKanban, color: 'brand' },
    { label: 'My Tasks', value: tasks.length, total: tasks.length, icon: CheckSquare, color: 'accent' },
    { label: 'Completed', value: tasks.filter(t => t.status === 'done').length, total: tasks.length, icon: Target, color: 'success' },
    { label: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, total: tasks.length, icon: Zap, color: 'warning' },
  ];

  return (
    <PageTransition>
      <div ref={containerRef} className="p-4 lg:p-8 space-y-6">
        {/* Welcome header */}
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold font-display text-ink-900">
                Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-ink-500 mt-1">Here's what's happening in your workspace today.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-500">
              <CalendarDays className="w-4 h-4" />
              {formatDate(new Date(), 'EEEE, MMMM d, yyyy')}
            </div>
          </div>
        </FadeIn>

        {/* Stats cards */}
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StaggerItem key={stat.label}>
              <div className="card card-hover p-5 group cursor-pointer" onClick={() => navigate(stat.label.includes('Project') ? '/app/projects' : '/app/tasks')}>
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', `bg-${stat.color}-100 text-${stat.color}-600`)}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-ink-300 group-hover:text-ink-500 transition-colors" />
                </div>
                <p className="text-3xl font-bold text-ink-900">{loading ? '–' : stat.value}</p>
                <p className="text-sm text-ink-500 mt-0.5">{stat.label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project pie chart — animated on scroll */}
          <motion.div
            style={{ x: pieX, y: pieY, scale: pieScale }}
            className="card p-6 lg:col-span-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-ink-900">Project Analysis</h3>
                <p className="text-xs text-ink-400">Status distribution</p>
              </div>
              <Activity className="w-5 h-5 text-ink-400" />
            </div>
            {loading ? (
              <Skeleton className="h-48" />
            ) : projectStatusData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-ink-400">No projects yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    animationDuration={1000}
                    animationBegin={200}
                  >
                    {projectStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                    formatter={(value) => [`${value} project${value !== 1 ? 's' : ''}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {projectStatusData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-ink-500 capitalize">{statusLabel(d.name)}</span>
                  <span className="text-ink-700 font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Task status pie chart */}
          <FadeIn delay={0.1} className="card p-6 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-ink-900">My Tasks</h3>
                <p className="text-xs text-ink-400">Status breakdown</p>
              </div>
              <CheckSquare className="w-5 h-5 text-ink-400" />
            </div>
            {loading ? (
              <Skeleton className="h-48" />
            ) : taskStatusData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-ink-400">No tasks assigned</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    paddingAngle={3}
                    animationDuration={1000}
                    animationBegin={300}
                  >
                    {taskStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                    formatter={(value) => [`${value} task${value !== 1 ? 's' : ''}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {taskStatusData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-ink-500 capitalize">{statusLabel(d.name)}</span>
                  <span className="text-ink-700 font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Weekly activity bar chart */}
          <FadeIn delay={0.2} className="card p-6 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-ink-900">Weekly Activity</h3>
                <p className="text-xs text-ink-400">Tasks vs completed</p>
              </div>
              <TrendingUp className="w-5 h-5 text-ink-400" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyActivity} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={800} />
                <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} animationDuration={800} animationBegin={200} />
              </BarChart>
            </ResponsiveContainer>
          </FadeIn>
        </div>

        {/* Portfolio + Project list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio card */}
          <FadeIn delay={0.1} className="card p-6 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink-900">My Portfolio</h3>
              <button onClick={() => navigate('/app/profile')} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Edit</button>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar src={profile?.avatar_url} name={profile?.full_name} size="2xl" ring />
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-success-500 border-2 border-white" />
              </div>
              <h4 className="font-semibold text-ink-900 mt-3">{profile?.full_name || 'User'}</h4>
              <p className="text-sm text-ink-500">{profile?.position || 'Employee'}</p>
              <Badge variant="brand" className="mt-2 capitalize">{profile?.role || 'employee'}</Badge>
              {profile?.bio && <p className="text-sm text-ink-600 mt-3 text-balance">{profile.bio}</p>}
              <div className="flex gap-4 mt-4 w-full">
                <div className="flex-1 text-center p-3 rounded-xl bg-ink-50">
                  <p className="text-lg font-bold text-ink-900">{tasks.filter(t => t.status === 'done').length}</p>
                  <p className="text-xs text-ink-500">Done</p>
                </div>
                <div className="flex-1 text-center p-3 rounded-xl bg-ink-50">
                  <p className="text-lg font-bold text-ink-900">{tasks.filter(t => t.status === 'in_progress').length}</p>
                  <p className="text-xs text-ink-500">Active</p>
                </div>
                <div className="flex-1 text-center p-3 rounded-xl bg-ink-50">
                  <p className="text-lg font-bold text-ink-900">{projects.length}</p>
                  <p className="text-xs text-ink-500">Projects</p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* My Projects */}
          <FadeIn delay={0.2} className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-ink-900">Assigned Projects</h3>
                <p className="text-xs text-ink-400">Projects you're working on</p>
              </div>
              <button onClick={() => navigate('/app/projects')} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                View all <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}</div>
            ) : projects.length === 0 ? (
              <div className="py-8 text-center text-sm text-ink-400">No projects assigned yet</div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide">
                {projects.slice(0, 6).map((project, i) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-ink-50 cursor-pointer transition-colors"
                    onClick={() => navigate('/app/projects')}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center shrink-0">
                      <FolderKanban className="w-5 h-5 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-900 truncate">{project.title}</p>
                      <p className="text-xs text-ink-400 truncate">{project.description || 'No description'}</p>
                    </div>
                    <div className="hidden sm:block w-32">
                      <ProgressBar value={project.progress} color={project.progress === 100 ? 'success' : 'brand'} />
                      <p className="text-xs text-ink-400 mt-1">{project.progress}%</p>
                    </div>
                    <Badge className={statusColor(project.status)}>{statusLabel(project.status)}</Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </FadeIn>
        </div>

        {/* Schedule + Notices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming schedule */}
          <FadeIn className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-ink-900">Upcoming Schedule</h3>
                <p className="text-xs text-ink-400">Meetings and deadlines</p>
              </div>
              <button onClick={() => navigate('/app/schedule')} className="text-xs text-brand-600 hover:text-brand-700 font-medium">View all</button>
            </div>
            {loading ? (
              <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-16" />)}</div>
            ) : schedules.length === 0 ? (
              <div className="py-8 text-center text-sm text-ink-400">No upcoming events</div>
            ) : (
              <div className="space-y-2">
                {schedules.slice(0, 5).map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-ink-50 cursor-pointer transition-colors"
                    onClick={() => navigate('/app/schedule')}
                  >
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      s.type === 'meeting' ? 'bg-brand-100 text-brand-600' :
                      s.type === 'project_deadline' ? 'bg-error-100 text-error-600' :
                      s.type === 'review' ? 'bg-warning-100 text-warning-600' :
                      'bg-accent-100 text-accent-600')}>
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-900 text-sm truncate">{s.title}</p>
                      <p className="text-xs text-ink-400">{smartDate(s.start_time)} {s.end_time && `· ${formatTime(s.start_time)}`}</p>
                    </div>
                    {s.location && <Badge variant="default" className="hidden sm:inline-flex">{s.location}</Badge>}
                  </motion.div>
                ))}
              </div>
            )}
          </FadeIn>

          {/* Recent notices */}
          <FadeIn delay={0.1} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-ink-900">Recent Notices</h3>
                <p className="text-xs text-ink-400">Latest announcements</p>
              </div>
              <button onClick={() => navigate('/app/notice')} className="text-xs text-brand-600 hover:text-brand-700 font-medium">View all</button>
            </div>
            {loading ? (
              <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-16" />)}</div>
            ) : notices.length === 0 ? (
              <div className="py-8 text-center text-sm text-ink-400">No notices yet</div>
            ) : (
              <div className="space-y-2">
                {notices.slice(0, 5).map((n, i) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-ink-50 cursor-pointer transition-colors"
                    onClick={() => navigate('/app/notice')}
                  >
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      n.type === 'urgent' ? 'bg-error-100 text-error-600' :
                      n.type === 'warning' ? 'bg-warning-100 text-warning-600' :
                      n.type === 'success' ? 'bg-success-100 text-success-600' :
                      'bg-accent-100 text-accent-600')}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-900 text-sm truncate">{n.title}</p>
                      <p className="text-xs text-ink-400 truncate">{n.content}</p>
                    </div>
                    {n.pinned && <Badge variant="warning" className="shrink-0">Pinned</Badge>}
                  </motion.div>
                ))}
              </div>
            )}
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
}
