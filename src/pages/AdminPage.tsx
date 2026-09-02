import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Building2, FolderKanban, Wallet, FileText, Shield,
  TrendingUp, Search, Crown, CheckCircle2, XCircle, Clock,
  DollarSign, BarChart3, PieChart as PieChartIcon, AlertCircle,
  UserCog, Trash2, Eye, Plus, Upload, Image as ImageIcon, Sparkles
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Area, AreaChart
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Profile, Department, Project, Application, WithdrawalRequest, Report, UserRole } from '@/lib/types';
import { PageTransition, FadeIn, Skeleton, EmptyState, StaggerContainer, StaggerItem } from '@/components/ui/Animations';
import { Avatar, Badge, ProgressBar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/toast';
import { cn, statusColor, statusLabel, priorityColor, formatDate, formatCurrency, relativeTime, generateId } from '@/lib/utils';

type Tab = 'overview' | 'users' | 'projects' | 'departments' | 'applications' | 'transactions' | 'reports' | 'icons';

function DeptIcon({ dept, className }: { dept: Department; className?: string }) {
  if (dept.icon_url) {
    return <img src={dept.icon_url} alt={dept.name} className={cn('object-cover rounded-xl', className)} />;
  }
  return <Building2 className={cn('text-brand-600', className)} />;
}

export function AdminPage() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<(Application & { user: Profile })[]>([]);
  const [withdrawals, setWithdrawals] = useState<(WithdrawalRequest & { user: Profile })[]>([]);
  const [reports, setReports] = useState<(Report & { user: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const loadAll = useCallback(async () => {
    const [profRes, deptRes, projRes, appRes, wdrawRes, reportRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('departments').select('*').order('name'),
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('applications').select('*, user:profiles!user_id(*)').order('created_at', { ascending: false }),
      supabase.from('withdrawal_requests').select('*, user:profiles!user_id(*)').order('created_at', { ascending: false }),
      supabase.from('reports').select('*, user:profiles!user_id(*)').order('created_at', { ascending: false }),
    ]);

    setProfiles((profRes.data as Profile[]) || []);
    setDepartments((deptRes.data as Department[]) || []);
    setProjects((projRes.data as Project[]) || []);
    setApplications((appRes.data as (Application & { user: Profile })[]) || []);
    setWithdrawals((wdrawRes.data as (WithdrawalRequest & { user: Profile })[]) || []);
    setReports((reportRes.data as (Report & { user: Profile })[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) {
      notify({ type: 'error', title: 'Failed to update role' });
    } else {
      notify({ type: 'success', title: 'Role updated', message: `User is now ${role}.` });
      loadAll();
      setEditingUser(null);
    }
  };

  const handleDeptChange = async (userId: string, deptId: string) => {
    const { error } = await supabase.from('profiles').update({ department_id: deptId || null }).eq('id', userId);
    if (error) {
      notify({ type: 'error', title: 'Failed to update department' });
    } else {
      notify({ type: 'success', title: 'Department updated' });
      loadAll();
    }
  };

  const handleApproveApplication = async (id: string, approved: boolean) => {
    const { error } = await supabase.from('applications').update({
      status: approved ? 'approved' : 'rejected',
      reviewed_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) {
      notify({ type: 'error', title: 'Failed to update' });
    } else {
      notify({ type: 'success', title: approved ? 'Application approved' : 'Application rejected' });
      loadAll();
    }
  };

  const handleApproveWithdrawal = async (id: string, approved: boolean, userId: string, amount: number) => {
    if (approved) {
      // Deduct from wallet
      const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', userId).maybeSingle();
      if (wallet && Number(wallet.balance) >= amount) {
        await supabase.from('wallets').update({ balance: Number(wallet.balance) - amount, updated_at: new Date().toISOString() }).eq('id', wallet.id);
        await supabase.from('transactions').insert({
          wallet_id: wallet.id, user_id: userId, type: 'withdrawal', amount, status: 'completed', description: 'Withdrawal approved by admin'
        });
      } else {
        notify({ type: 'error', title: 'Insufficient balance' });
        return;
      }
    }
    const { error } = await supabase.from('withdrawal_requests').update({
      status: approved ? 'approved' : 'rejected',
      reviewed_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) {
      notify({ type: 'error', title: 'Failed to update' });
    } else {
      notify({ type: 'success', title: approved ? 'Withdrawal approved' : 'Withdrawal rejected' });
      loadAll();
    }
  };

  const handlePaySalary = async (userId: string, amount: number) => {
    // Get or create wallet
    let { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', userId).maybeSingle();
    if (!wallet) {
      const { data: newWallet } = await supabase.from('wallets').insert({ user_id: userId, balance: 0 }).select('*').single();
      wallet = newWallet;
    }
    if (!wallet) return;

    await supabase.from('wallets').update({ balance: Number(wallet.balance) + amount, updated_at: new Date().toISOString() }).eq('id', wallet.id);
    await supabase.from('transactions').insert({
      wallet_id: wallet.id, user_id: userId, type: 'salary', amount, status: 'completed', description: 'Salary payment'
    });
    notify({ type: 'success', title: 'Salary paid', message: `${formatCurrency(amount)} added to wallet.` });
    loadAll();
  };

  const handleResolveReport = async (id: string, response: string) => {
    const { error } = await supabase.from('reports').update({ status: 'resolved', admin_response: response }).eq('id', id);
    if (error) {
      notify({ type: 'error', title: 'Failed to resolve' });
    } else {
      notify({ type: 'success', title: 'Report resolved' });
      loadAll();
    }
  };

  const handleSaveProject = async (data: { id?: string; title: string; description: string; status: string; priority: string; department_id: string; start_date: string; end_date: string; progress: number }) => {
    const payload = {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      department_id: data.department_id || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      progress: data.progress,
      updated_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await supabase.from('projects').update(payload).eq('id', data.id);
      if (error) { notify({ type: 'error', title: 'Failed to update project', message: error.message }); return; }
      notify({ type: 'success', title: 'Project updated' });
    } else {
      const { error } = await supabase.from('projects').insert({ ...payload, created_by: profile?.id || null });
      if (error) { notify({ type: 'error', title: 'Failed to create project', message: error.message }); return; }
      notify({ type: 'success', title: 'Project created' });
    }
    loadAll();
    setShowProjectModal(false);
    setEditingProject(null);
  };

  const handleDeleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      notify({ type: 'error', title: 'Failed to delete project' });
    } else {
      notify({ type: 'success', title: 'Project deleted' });
      loadAll();
    }
  };

  const handleSaveDept = async (data: { id?: string; name: string; description: string; icon_url: string | null }) => {
    const payload = { name: data.name, description: data.description || null, icon_url: data.icon_url, updated_at: new Date().toISOString() };
    if (data.id) {
      const { error } = await supabase.from('departments').update(payload).eq('id', data.id);
      if (error) { notify({ type: 'error', title: 'Failed to update department', message: error.message }); return; }
      notify({ type: 'success', title: 'Department updated' });
    } else {
      const { error } = await supabase.from('departments').insert({ ...payload, icon: 'building', color: '#3b82f6' });
      if (error) { notify({ type: 'error', title: 'Failed to create department', message: error.message }); return; }
      notify({ type: 'success', title: 'Department created' });
    }
    loadAll();
    setShowDeptModal(false);
    setEditingDept(null);
  };

  const handleDeleteDept = async (id: string) => {
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) {
      notify({ type: 'error', title: 'Failed to delete department' });
    } else {
      notify({ type: 'success', title: 'Department deleted' });
      loadAll();
    }
  };

  const filteredProfiles = useMemo(() => {
    if (!search) return profiles;
    return profiles.filter(p => p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()));
  }, [profiles, search]);

  const roleData = useMemo(() => {
    const counts: Record<string, number> = {};
    profiles.forEach(p => { counts[p.role] = (counts[p.role] || 0) + 1; });
    return [
      { name: 'Admin', value: counts.admin || 0, color: '#3b82f6' },
      { name: 'Moderator', value: counts.moderator || 0, color: '#06b6d4' },
      { name: 'Employee', value: counts.employee || 0, color: '#22c55e' },
    ];
  }, [profiles]);

  const projectData = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: statusLabel(name), value, color: name === 'active' ? '#22c55e' : name === 'completed' ? '#3b82f6' : name === 'planning' ? '#94a3b8' : name === 'on_hold' ? '#f59e0b' : '#ef4444' }));
  }, [projects]);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.slice(0, 8).map(m => ({ month: m, users: Math.floor(Math.random() * 30) + 10, projects: Math.floor(Math.random() * 15) + 5 }));
  }, []);

  const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'projects', label: 'Projects', icon: FolderKanban },
    { key: 'departments', label: 'Departments', icon: Building2 },
    { key: 'applications', label: 'Applications', icon: FileText },
    { key: 'transactions', label: 'Transactions', icon: Wallet },
    { key: 'reports', label: 'Reports', icon: AlertCircle },
    { key: 'icons', label: 'Icons', icon: ImageIcon },
  ];

  return (
    <PageTransition>
      <div className="p-4 lg:p-8 space-y-6">
        <FadeIn>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold font-display text-ink-900">Admin Panel</h1>
              <p className="text-ink-500">Full system control and analytics</p>
            </div>
          </div>
        </FadeIn>

        {/* Tabs */}
        <FadeIn delay={0.1}>
          <div className="flex gap-1 p-1 bg-ink-100 rounded-xl overflow-x-auto scrollbar-hide w-fit">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  tab === t.key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700')}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
                {t.key === 'applications' && applications.filter(a => a.status === 'pending').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-error-500" />
                )}
                {t.key === 'transactions' && withdrawals.filter(w => w.status === 'pending').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-error-500" />
                )}
                {t.key === 'reports' && reports.filter(r => r.status === 'open').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-error-500" />
                )}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
              </div>
            ) : (
            <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: profiles.length, icon: Users, color: 'brand' },
                { label: 'Departments', value: departments.length, icon: Building2, color: 'accent' },
                { label: 'Active Projects', value: projects.filter(p => p.status === 'active').length, icon: FolderKanban, color: 'success' },
                { label: 'Pending Items', value: applications.filter(a => a.status === 'pending').length + withdrawals.filter(w => w.status === 'pending').length, icon: Clock, color: 'warning' },
              ].map(s => (
                <StaggerItem key={s.label}>
                  <div className="card p-5">
                    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center mb-3', `bg-${s.color}-100 text-${s.color}-600`)}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <p className="text-3xl font-bold text-ink-900">{loading ? '–' : s.value}</p>
                    <p className="text-sm text-ink-500">{s.label}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <FadeIn className="card p-6">
                <h3 className="font-semibold text-ink-900 mb-4">User Roles</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} animationDuration={1000}>
                      {roleData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {roleData.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-ink-500">{d.name}</span>
                      <span className="font-medium text-ink-700">{d.value}</span>
                    </div>
                  ))}
                </div>
              </FadeIn>

              <FadeIn delay={0.1} className="card p-6">
                <h3 className="font-semibold text-ink-900 mb-4">Project Status</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={projectData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3} animationDuration={1000}>
                      {projectData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {projectData.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-ink-500">{d.name}</span>
                      <span className="font-medium text-ink-700">{d.value}</span>
                    </div>
                  ))}
                </div>
              </FadeIn>

              <FadeIn delay={0.2} className="card p-6">
                <h3 className="font-semibold text-ink-900 mb-4">Growth Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="url(#userGrad)" strokeWidth={2} animationDuration={1000} />
                  </AreaChart>
                </ResponsiveContainer>
              </FadeIn>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-ink-100 border border-transparent text-sm focus:outline-none focus:bg-white focus:border-ink-200 transition-all" />
            </div>
            {loading ? (
              <div className="card overflow-hidden">
                <div className="space-y-2 p-4">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14" />)}
                </div>
              </div>
            ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-ink-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase">User</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase hidden sm:table-cell">Department</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase hidden md:table-cell">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-ink-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.map(user => {
                      const dept = departments.find(d => d.id === user.department_id);
                      return (
                        <tr key={user.id} className="border-b border-ink-50 hover:bg-ink-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar src={user.avatar_url} name={user.full_name} size="sm" onClick={() => navigate(`/app/profile/${user.id}`)} />
                              <div>
                                <p className="text-sm font-medium text-ink-900">{user.full_name}</p>
                                <p className="text-xs text-ink-400">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={user.role === 'admin' ? 'brand' : user.role === 'moderator' ? 'info' : 'default'} className="capitalize">{user.role}</Badge>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-sm text-ink-600">{dept?.name || '—'}</span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className={cn('w-2 h-2 rounded-full inline-block', user.is_active ? 'bg-success-500' : 'bg-ink-300')} />
                            <span className="ml-2 text-xs text-ink-500">{user.is_active ? 'Active' : 'Inactive'}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => setEditingUser(user)} className="p-2 rounded-lg hover:bg-ink-200 text-ink-500 transition-colors">
                              <UserCog className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </div>
        )}

        {/* Projects Management */}
        {tab === 'projects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wider">All Projects</h3>
              <button onClick={() => { setEditingProject(null); setShowProjectModal(true); }} className="btn-primary">
                <Plus className="w-4 h-4" /> New Project
              </button>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
              </div>
            ) : projects.length === 0 ? (
              <EmptyState icon={<FolderKanban className="w-8 h-8" />} title="No projects" description="Create a new project to get started." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(project => {
                  const dept = departments.find(d => d.id === project.department_id);
                  return (
                    <FadeIn key={project.id}>
                      <div className="card card-hover p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center">
                            <FolderKanban className="w-5 h-5 text-brand-600" />
                          </div>
                          <Badge className={statusColor(project.status)}>{statusLabel(project.status)}</Badge>
                        </div>
                        <h3 className="font-semibold text-ink-900">{project.title}</h3>
                        <p className="text-sm text-ink-500 mt-1 line-clamp-2">{project.description || 'No description'}</p>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-ink-400 mb-1.5">
                            <span>Progress</span><span>{project.progress}%</span>
                          </div>
                          <ProgressBar value={project.progress} color={project.progress === 100 ? 'success' : 'brand'} />
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <Badge className={priorityColor(project.priority)}>{project.priority}</Badge>
                          <div className="flex gap-1.5">
                            <button onClick={() => { setEditingProject(project); setShowProjectModal(true); }} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500 transition-colors">
                              <UserCog className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteProject(project.id)} className="p-2 rounded-lg hover:bg-error-50 text-ink-400 hover:text-error-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {dept && <p className="text-xs text-ink-400 mt-2">{dept.name}</p>}
                      </div>
                    </FadeIn>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Departments */}
        {tab === 'departments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wider">All Departments</h3>
              <button onClick={() => { setEditingDept(null); setShowDeptModal(true); }} className="btn-primary">
                <Plus className="w-4 h-4" /> New Department
              </button>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
              </div>
            ) : departments.length === 0 ? (
              <EmptyState icon={<Building2 className="w-8 h-8" />} title="No departments" description="Create a department to get started." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map(dept => {
                  const members = profiles.filter(p => p.department_id === dept.id);
                  const mod = profiles.find(p => p.id === dept.moderator_id);
                  return (
                    <FadeIn key={dept.id}>
                      <div className="card p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center overflow-hidden">
                            <DeptIcon dept={dept} className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-ink-900">{dept.name}</h3>
                            <p className="text-xs text-ink-400">{members.length} members</p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => { setEditingDept(dept); setShowDeptModal(true); }} className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-500 transition-colors">
                              <UserCog className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteDept(dept.id)} className="p-1.5 rounded-lg hover:bg-error-50 text-ink-400 hover:text-error-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {dept.description && <p className="text-sm text-ink-500 mt-1 line-clamp-2">{dept.description}</p>}
                        {mod && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-ink-50 mt-3">
                            <Avatar src={mod.avatar_url} name={mod.full_name} size="xs" />
                            <span className="text-xs text-ink-600">{mod.full_name}</span>
                            <Crown className="w-3 h-3 text-warning-500 ml-auto" />
                          </div>
                        )}
                      </div>
                    </FadeIn>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Applications */}
        {tab === 'applications' && (
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>
            ) : applications.length === 0 ? (
              <EmptyState icon={<FileText className="w-8 h-8" />} title="No applications" />
            ) : (
              applications.map(app => (
                <FadeIn key={app.id}>
                  <div className="card p-5 flex items-start gap-4">
                    <Avatar src={app.user?.avatar_url} name={app.user?.full_name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-ink-900">{app.title}</h3>
                        <Badge className={statusColor(app.status)}>{statusLabel(app.status)}</Badge>
                        <Badge variant="default" className="capitalize">{app.type.replace('_', ' ')}</Badge>
                      </div>
                      <p className="text-sm text-ink-500 mt-1">{app.user?.full_name} · {formatDate(app.start_date)} → {formatDate(app.end_date)}</p>
                      {app.description && <p className="text-sm text-ink-600 mt-2">{app.description}</p>}
                    </div>
                    {app.status === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleApproveApplication(app.id, true)} className="p-2 rounded-lg bg-success-100 text-success-600 hover:bg-success-200 transition-colors">
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleApproveApplication(app.id, false)} className="p-2 rounded-lg bg-error-100 text-error-600 hover:bg-error-200 transition-colors">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </FadeIn>
              ))
            )}
          </div>
        )}

        {/* Transactions */}
        {tab === 'transactions' && (
          <div className="space-y-6">
            {/* Pending withdrawals */}
            <div>
              <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-3">Pending Withdrawals</h3>
              {loading ? (
                <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-20" />)}</div>
              ) : withdrawals.filter(w => w.status === 'pending').length === 0 ? (
                <p className="text-sm text-ink-400 py-4">No pending withdrawal requests.</p>
              ) : (
                <div className="space-y-3">
                  {withdrawals.filter(w => w.status === 'pending').map(w => (
                    <FadeIn key={w.id}>
                      <div className="card p-4 flex items-center gap-4">
                        <Avatar src={w.user?.avatar_url} name={w.user?.full_name} size="md" />
                        <div className="flex-1">
                          <p className="font-medium text-ink-900">{w.user?.full_name}</p>
                          <p className="text-xs text-ink-400">{relativeTime(w.created_at)}</p>
                        </div>
                        <p className="text-lg font-bold text-ink-900">{formatCurrency(Number(w.amount))}</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveWithdrawal(w.id, true, w.user_id, Number(w.amount))} className="p-2 rounded-lg bg-success-100 text-success-600 hover:bg-success-200 transition-colors">
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleApproveWithdrawal(w.id, false, w.user_id, Number(w.amount))} className="p-2 rounded-lg bg-error-100 text-error-600 hover:bg-error-200 transition-colors">
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              )}
            </div>

            {/* Pay salary */}
            <div>
              <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-3">Pay Salary</h3>
              <div className="card p-4">
                <p className="text-sm text-ink-500 mb-3">Quick salary payment to any employee:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
                  {profiles.filter(p => p.role !== 'admin').map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-ink-50">
                      <Avatar src={p.avatar_url} name={p.full_name} size="sm" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink-900">{p.full_name}</p>
                        <p className="text-xs text-ink-400 capitalize">{p.role}</p>
                      </div>
                      <button onClick={() => {
                        const amount = prompt(`Enter salary amount for ${p.full_name}:`);
                        if (amount && Number(amount) > 0) handlePaySalary(p.id, Number(amount));
                      }} className="btn-ghost text-sm">
                        <DollarSign className="w-4 h-4" /> Pay
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports */}
        {tab === 'reports' && (
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24" />)}</div>
            ) : reports.length === 0 ? (
              <EmptyState icon={<AlertCircle className="w-8 h-8" />} title="No reports" description="Employee reports will appear here." />
            ) : (
              reports.map(r => <ReportCard key={r.id} report={r} onResolve={handleResolveReport} />)
            )}
          </div>
        )}

        {/* Icons management */}
        {tab === 'icons' && (
          <IconsTab departments={departments} loading={loading} onChanged={loadAll} />
        )}
      </div>

      {/* Create/Edit project modal */}
      <ProjectModal
        open={showProjectModal}
        onClose={() => { setShowProjectModal(false); setEditingProject(null); }}
        project={editingProject}
        departments={departments}
        onSave={handleSaveProject}
      />

      {/* Create/Edit department modal */}
      <DepartmentModal
        open={showDeptModal}
        onClose={() => { setShowDeptModal(false); setEditingDept(null); }}
        department={editingDept}
        onSave={handleSaveDept}
      />

      {/* Edit user modal */}
      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title="Manage User" size="md">
        {editingUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar src={editingUser.avatar_url} name={editingUser.full_name} size="xl" ring />
              <div>
                <p className="font-semibold text-ink-900">{editingUser.full_name}</p>
                <p className="text-sm text-ink-400">{editingUser.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Role</label>
              <div className="flex gap-2">
                {(['admin', 'moderator', 'employee'] as UserRole[]).map(r => (
                  <button
                    key={r}
                    onClick={() => handleRoleChange(editingUser.id, r)}
                    className={cn('flex-1 px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all',
                      editingUser.role === r ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200')}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Department</label>
              <select
                value={editingUser.department_id || ''}
                onChange={(e) => { handleDeptChange(editingUser.id, e.target.value); setEditingUser({ ...editingUser, department_id: e.target.value || null }); }}
                className="input-field"
              >
                <option value="">No department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className="pt-2">
              <button onClick={() => navigate(`/app/profile/${editingUser.id}`)} className="btn-secondary w-full">
                <Eye className="w-4 h-4" /> View Profile
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}

function ProjectModal({ open, onClose, project, departments, onSave }: {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  departments: Department[];
  onSave: (data: { id?: string; title: string; description: string; status: string; priority: string; department_id: string; start_date: string; end_date: string; progress: number }) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('planning');
  const [priority, setPriority] = useState('medium');
  const [deptId, setDeptId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (open) {
      setTitle(project?.title || '');
      setDescription(project?.description || '');
      setStatus(project?.status || 'planning');
      setPriority(project?.priority || 'medium');
      setDeptId(project?.department_id || '');
      setStartDate(project?.start_date || '');
      setEndDate(project?.end_date || '');
      setProgress(project?.progress || 0);
    }
  }, [open, project]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({ id: project?.id, title, description, status, priority, department_id: deptId, start_date: startDate, end_date: endDate, progress });
    setTitle(''); setDescription(''); setStatus('planning'); setPriority('medium'); setDeptId(''); setStartDate(''); setEndDate(''); setProgress(0);
  };

  return (
    <Modal open={open} onClose={onClose} title={project ? 'Edit Project' : 'New Project'} size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Project title" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-field resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field">
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input-field">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Department</label>
          <select value={deptId} onChange={(e) => setDeptId(e.target.value)} className="input-field">
            <option value="">No department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Progress: {progress}%</label>
          <input type="range" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-brand-600" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} className="btn-primary">{project ? 'Save Changes' : 'Create Project'}</button>
        </div>
      </div>
    </Modal>
  );
}

function ReportCard({ report, onResolve }: { report: Report & { user: Profile }; onResolve: (id: string, response: string) => void }) {
  const [response, setResponse] = useState('');
  const [showResolve, setShowResolve] = useState(false);

  return (
    <FadeIn>
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <Avatar src={report.user?.avatar_url} name={report.user?.full_name} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-ink-900">{report.subject}</h3>
              <Badge className={cn(report.status === 'open' ? 'bg-warning-100 text-warning-700' : 'bg-success-100 text-success-700')}>{report.status}</Badge>
            </div>
            <p className="text-xs text-ink-400 mt-0.5">{report.user?.full_name} · {relativeTime(report.created_at)}</p>
            <p className="text-sm text-ink-600 mt-2">{report.description}</p>
            {report.admin_response && (
              <div className="mt-2 p-2 rounded-lg bg-brand-50 text-xs text-brand-900">
                <span className="font-medium">Admin response:</span> {report.admin_response}
              </div>
            )}
            {report.status === 'open' && !showResolve && (
              <button onClick={() => setShowResolve(true)} className="btn-ghost text-sm mt-2">
                <CheckCircle2 className="w-4 h-4" /> Resolve
              </button>
            )}
            {showResolve && (
              <div className="mt-3 space-y-2">
                <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={2} className="input-field resize-none text-sm" placeholder="Write a response..." />
                <div className="flex gap-2">
                  <button onClick={() => { if (response.trim()) { onResolve(report.id, response); setResponse(''); setShowResolve(false); } }} className="btn-primary text-sm">Submit</button>
                  <button onClick={() => setShowResolve(false)} className="btn-secondary text-sm">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

function DepartmentModal({ open, onClose, department, onSave }: {
  open: boolean;
  onClose: () => void;
  department: Department | null;
  onSave: (data: { id?: string; name: string; description: string; icon_url: string | null }) => void;
}) {
  const { notify } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(department?.name || '');
      setDescription(department?.description || '');
      setIconUrl(department?.icon_url || null);
    }
  }, [open, department]);

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${generateId()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('department-icons').upload(fileName, file, { upsert: true });
    if (uploadError) {
      notify({ type: 'error', title: 'Upload failed', message: uploadError.message });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('department-icons').getPublicUrl(fileName);
    setIconUrl(urlData.publicUrl);
    setUploading(false);
    notify({ type: 'success', title: 'Icon uploaded' });
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({ id: department?.id, name, description, icon_url: iconUrl });
    setName(''); setDescription(''); setIconUrl(null);
  };

  return (
    <Modal open={open} onClose={onClose} title={department ? 'Edit Department' : 'New Department'} size="md">
      <div className="space-y-4">
        {/* Icon upload */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center overflow-hidden">
            {iconUrl ? (
              <img src={iconUrl} alt="Department icon" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-8 h-8 text-brand-600" />
            )}
          </div>
          <label className={cn('btn-secondary text-sm cursor-pointer', uploading && 'opacity-50 pointer-events-none')}>
            <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Custom Icon'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} disabled={uploading} />
          </label>
          {iconUrl && (
            <button onClick={() => setIconUrl(null)} className="text-xs text-error-500 hover:text-error-600">Remove icon</button>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Department Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="e.g. Engineering" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input-field resize-none" placeholder="Optional description" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} className="btn-primary">{department ? 'Save Changes' : 'Create Department'}</button>
        </div>
      </div>
    </Modal>
  );
}

function LogoUploader() {
  const { notify } = useToast();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [brandName, setBrandName] = useState('Sysmobyte');
  const [subtitle, setSubtitle] = useState('OMS Platform');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('site_settings').select('*').in('key', ['logo', 'branding']);
      for (const row of (data || [])) {
        if (row.key === 'logo' && row.value?.url) setLogoUrl(row.value.url);
        if (row.key === 'branding') {
          if (row.value?.name) setBrandName(row.value.name);
          if (row.value?.subtitle) setSubtitle(row.value.subtitle);
        }
      }
    })();
  }, []);

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}-${generateId()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('site-assets').upload(fileName, file, { upsert: true });
    if (uploadError) {
      notify({ type: 'error', title: 'Upload failed', message: uploadError.message });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(fileName);
    const url = urlData.publicUrl;
    setLogoUrl(url);
    const { error: upsertError } = await supabase.from('site_settings').upsert({ key: 'logo', value: { url } }, { onConflict: 'key' });
    if (upsertError) {
      notify({ type: 'error', title: 'Failed to save logo', message: upsertError.message });
    } else {
      notify({ type: 'success', title: 'Logo updated', message: 'The new logo will appear in the sidebar shortly.' });
    }
    setUploading(false);
  };

  const handleRemove = async () => {
    if (!logoUrl) return;
    const path = logoUrl.split('/site-assets/')[1];
    if (path) await supabase.storage.from('site-assets').remove([path]);
    await supabase.from('site_settings').upsert({ key: 'logo', value: { url: null } }, { onConflict: 'key' });
    setLogoUrl(null);
    notify({ type: 'success', title: 'Logo removed' });
  };

  const handleSaveBranding = async () => {
    setSaving(true);
    const { error } = await supabase.from('site_settings').upsert({ key: 'branding', value: { name: brandName, subtitle } }, { onConflict: 'key' });
    if (error) {
      notify({ type: 'error', title: 'Failed to save branding' });
    } else {
      notify({ type: 'success', title: 'Branding saved' });
    }
    setSaving(false);
  };

  return (
    <FadeIn>
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-ink-900">Site Logo &amp; Branding</h3>
        </div>
        <p className="text-xs text-ink-400 mb-5">Upload a custom logo that appears in the sidebar. You can also customize the platform name and subtitle.</p>

        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Logo preview + upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center overflow-hidden border border-ink-200">
              {logoUrl ? (
                <img src={logoUrl} alt="Site logo" className="w-full h-full object-contain p-1" />
              ) : (
                <Sparkles className="w-8 h-8 text-brand-600" />
              )}
            </div>
            <div className="flex gap-2">
              <label className={cn('btn-secondary text-xs cursor-pointer', uploading && 'opacity-50 pointer-events-none')}>
                <Upload className="w-3.5 h-3.5" /> {uploading ? 'Uploading...' : 'Upload Logo'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} disabled={uploading} />
              </label>
              {logoUrl && (
                <button onClick={handleRemove} className="btn-secondary text-xs text-error-600 hover:bg-error-50">
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>
          </div>

          {/* Branding fields */}
          <div className="flex-1 w-full space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Platform Name</label>
              <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} className="input-field" placeholder="e.g. Sysmobyte" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Subtitle</label>
              <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="input-field" placeholder="e.g. OMS Platform" />
            </div>
            <button onClick={handleSaveBranding} disabled={saving} className="btn-primary text-sm">
              {saving ? 'Saving...' : 'Save Branding'}
            </button>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

function IconsTab({ departments, loading, onChanged }: {
  departments: Department[];
  loading: boolean;
  onChanged: () => void;
}) {
  const { notify } = useToast();
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleUpload = async (dept: Department, file: File) => {
    if (!file) return;
    setUploadingId(dept.id);
    const ext = file.name.split('.').pop();
    const fileName = `${dept.id}/${Date.now()}-${generateId()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('department-icons').upload(fileName, file, { upsert: true });
    if (uploadError) {
      notify({ type: 'error', title: 'Upload failed', message: uploadError.message });
      setUploadingId(null);
      return;
    }
    const { data: urlData } = supabase.storage.from('department-icons').getPublicUrl(fileName);
    const { error: updateError } = await supabase.from('departments').update({ icon_url: urlData.publicUrl, updated_at: new Date().toISOString() }).eq('id', dept.id);
    if (updateError) {
      notify({ type: 'error', title: 'Failed to save icon' });
    } else {
      notify({ type: 'success', title: `Icon updated for ${dept.name}` });
      onChanged();
    }
    setUploadingId(null);
  };

  const handleRemove = async (dept: Department) => {
    if (!dept.icon_url) return;
    const path = dept.icon_url.split('/department-icons/')[1];
    if (path) await supabase.storage.from('department-icons').remove([path]);
    const { error } = await supabase.from('departments').update({ icon_url: null, updated_at: new Date().toISOString() }).eq('id', dept.id);
    if (error) {
      notify({ type: 'error', title: 'Failed to remove icon' });
    } else {
      notify({ type: 'success', title: `Icon removed for ${dept.name}` });
      onChanged();
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-44" />)}
      </div>
    );
  }

  if (departments.length === 0) {
    return <EmptyState icon={<ImageIcon className="w-8 h-8" />} title="No departments" description="Create departments first to manage their icons." />;
  }

  return (
    <div className="space-y-6">
      <LogoUploader />
      <div>
        <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wider">Department Icons</h3>
        <p className="text-xs text-ink-400 mt-1">Upload a custom icon image for each department. Icons appear on the Departments page and admin cards.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(dept => (
          <FadeIn key={dept.id}>
            <div className="card p-5 flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center overflow-hidden">
                {dept.icon_url ? (
                  <img src={dept.icon_url} alt={dept.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-8 h-8 text-brand-600" />
                )}
              </div>
              <h4 className="font-semibold text-ink-900 text-sm">{dept.name}</h4>
              <div className="flex gap-2">
                <label className={cn('btn-secondary text-xs cursor-pointer', uploadingId === dept.id && 'opacity-50 pointer-events-none')}>
                  <Upload className="w-3.5 h-3.5" /> {uploadingId === dept.id ? 'Uploading...' : 'Upload'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(dept, e.target.files[0])} disabled={uploadingId === dept.id} />
                </label>
                {dept.icon_url && (
                  <button onClick={() => handleRemove(dept)} className="btn-secondary text-xs text-error-600 hover:bg-error-50">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}
