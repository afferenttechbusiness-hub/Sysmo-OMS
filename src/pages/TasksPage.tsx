import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare, Plus, Clock, Flag, Paperclip, CheckCircle2,
  Circle, Loader, Eye, Filter, Search
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Task, TaskStatus, TaskStep, Profile, Project } from '@/lib/types';
import { PageTransition, FadeIn, Skeleton, EmptyState } from '@/components/ui/Animations';
import { Avatar, Badge, ProgressBar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/toast';
import { cn, statusColor, priorityColor, statusLabel, formatDate, generateId } from '@/lib/utils';
import { useTasks, useProjects, useProfiles } from '@/lib/hooks';

const STATUS_TABS: { key: TaskStatus | 'all'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'all', label: 'All Tasks', icon: CheckSquare },
  { key: 'todo', label: 'To Do', icon: Circle },
  { key: 'in_progress', label: 'In Progress', icon: Loader },
  { key: 'review', label: 'Review', icon: Eye },
  { key: 'done', label: 'Done', icon: CheckCircle2 },
];

export function TasksPage() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { tasks, loading, reload } = useTasks();
  const { projects } = useProjects();
  const { profiles } = useProfiles();
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState<(Task & { project: Project }) | null>(null);

  const filtered = useMemo(() => {
    let result = tasks as (Task & { project: Project })[];
    if (filter !== 'all') result = result.filter(t => t.status === filter);
    if (search) result = result.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [tasks, filter, search]);

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    const { error } = await supabase.from('tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', taskId);
    if (error) {
      notify({ type: 'error', title: 'Update failed', message: error.message });
    } else {
      notify({ type: 'success', title: 'Task updated' });
      reload();
      if (selectedTask?.id === taskId) setSelectedTask(null);
    }
  };

  const updateTaskProgress = async (taskId: string, progress: number) => {
    const { error } = await supabase.from('tasks').update({ progress, updated_at: new Date().toISOString() }).eq('id', taskId);
    if (error) {
      notify({ type: 'error', title: 'Update failed', message: error.message });
    } else {
      notify({ type: 'success', title: 'Progress updated' });
      reload();
    }
  };

  const toggleStep = async (taskId: string, steps: TaskStep[], stepId: string) => {
    const newSteps = steps.map(s => s.id === stepId ? { ...s, done: !s.done } : s);
    const completedSteps = newSteps.filter(s => s.done).length;
    const progress = Math.round((completedSteps / newSteps.length) * 100);
    const status: TaskStatus = progress === 100 ? 'done' : progress > 0 ? 'in_progress' : 'todo';
    await supabase.from('tasks').update({ steps: newSteps, progress, status, updated_at: new Date().toISOString() }).eq('id', taskId);
    reload();
    if (selectedTask?.id === taskId) {
      const updated = filtered.find(t => t.id === taskId);
      if (updated) setSelectedTask({ ...updated, steps: newSteps, progress, status });
    }
  };

  return (
    <PageTransition>
      <div className="p-4 lg:p-8 space-y-6">
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold font-display text-ink-900">Tasks</h1>
              <p className="text-ink-500 mt-1">Manage and track your assigned tasks</p>
            </div>
          </div>
        </FadeIn>

        {/* Filter tabs */}
        <FadeIn delay={0.1}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-1 p-1 bg-ink-100 rounded-xl overflow-x-auto scrollbar-hide">
              {STATUS_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                    filter === tab.key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  <span className={cn('text-xs px-1.5 py-0.5 rounded-full', filter === tab.key ? 'bg-brand-100 text-brand-700' : 'bg-ink-200 text-ink-500')}>
                    {tab.key === 'all' ? tasks.length : tasks.filter(t => t.status === tab.key).length}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-ink-100 border border-transparent text-sm focus:outline-none focus:bg-white focus:border-ink-200 transition-all"
              />
            </div>
          </div>
        </FadeIn>

        {/* Task list */}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<CheckSquare className="w-8 h-8" />} title="No tasks found" description="Tasks assigned to you will appear here." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -2 }}
                className="card card-hover p-5 cursor-pointer"
                onClick={() => setSelectedTask(task)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-ink-900">{task.title}</h3>
                    {task.description && <p className="text-sm text-ink-500 mt-1 line-clamp-2">{task.description}</p>}
                  </div>
                  <Badge className={cn('ml-2 shrink-0', priorityColor(task.priority))}>
                    <Flag className="w-3 h-3" /> {task.priority}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <Badge className={statusColor(task.status)}>{statusLabel(task.status)}</Badge>
                  {task.project && <span className="text-xs text-ink-400 truncate">{task.project.title}</span>}
                </div>

                <ProgressBar value={task.progress} color={task.progress === 100 ? 'success' : 'brand'} />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 text-xs text-ink-400">
                    {task.due_date && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDate(task.due_date, 'MMM d')}</span>}
                    {task.steps.length > 0 && <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {task.steps.filter(s => s.done).length}/{task.steps.length} steps</span>}
                  </div>
                  {task.assigned_to && (() => {
                    const assignee = profiles.find(p => p.id === task.assigned_to);
                    return assignee ? <Avatar src={assignee.avatar_url} name={assignee.full_name} size="xs" onClick={() => navigate(`/app/profile/${assignee.id}`)} /> : null;
                  })()}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Task detail modal */}
      <Modal open={!!selectedTask} onClose={() => setSelectedTask(null)} title="Task Details" size="lg">
        {selectedTask && (
          <TaskDetail
            task={selectedTask}
            profiles={profiles}
            onStatusChange={(s) => updateTaskStatus(selectedTask.id, s)}
            onProgressChange={(p) => updateTaskProgress(selectedTask.id, p)}
            onToggleStep={(stepId) => toggleStep(selectedTask.id, selectedTask.steps, stepId)}
            onProfileClick={(uid) => navigate(`/app/profile/${uid}`)}
          />
        )}
      </Modal>
    </PageTransition>
  );
}

function TaskDetail({ task, profiles, onStatusChange, onProgressChange, onToggleStep, onProfileClick }: {
  task: Task & { project: Project };
  profiles: Profile[];
  onStatusChange: (s: TaskStatus) => void;
  onProgressChange: (p: number) => void;
  onToggleStep: (stepId: string) => void;
  onProfileClick: (uid: string) => void;
}) {
  const assignee = profiles.find(p => p.id === task.assigned_to);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-ink-900">{task.title}</h2>
        {task.description && <p className="text-sm text-ink-600 mt-2">{task.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-ink-50">
          <p className="text-xs text-ink-400">Status</p>
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {(['todo', 'in_progress', 'review', 'done'] as TaskStatus[]).map(s => (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                  task.status === s ? statusColor(s) + ' ring-2 ring-offset-1 ring-current' : 'bg-white text-ink-500 hover:bg-ink-100'
                )}
              >
                {statusLabel(s)}
              </button>
            ))}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-ink-50">
          <p className="text-xs text-ink-400">Priority</p>
          <Badge className={cn('mt-1.5', priorityColor(task.priority))}>{task.priority}</Badge>
        </div>
      </div>

      <div>
        <p className="text-xs text-ink-400 mb-2">Progress: {task.progress}%</p>
        <input
          type="range"
          min={0}
          max={100}
          value={task.progress}
          onChange={(e) => onProgressChange(Number(e.target.value))}
          className="w-full accent-brand-600"
        />
        <ProgressBar value={task.progress} animated={false} />
      </div>

      {task.project && (
        <div className="p-3 rounded-xl bg-brand-50">
          <p className="text-xs text-brand-400">Project</p>
          <p className="text-sm font-medium text-brand-900">{task.project.title}</p>
        </div>
      )}

      {assignee && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-ink-50">
          <Avatar src={assignee.avatar_url} name={assignee.full_name} size="md" onClick={() => onProfileClick(assignee.id)} />
          <div>
            <p className="text-xs text-ink-400">Assigned to</p>
            <p className="text-sm font-medium text-ink-900">{assignee.full_name}</p>
          </div>
        </div>
      )}

      {task.steps.length > 0 && (
        <div>
          <p className="text-sm font-medium text-ink-700 mb-2">Steps</p>
          <div className="space-y-2">
            {task.steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-ink-50 cursor-pointer" onClick={() => onToggleStep(step.id)}>
                <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all', step.done ? 'bg-success-500 border-success-500' : 'border-ink-300')}>
                  {step.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <span className={cn('text-sm', step.done ? 'text-ink-400 line-through' : 'text-ink-700')}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {task.due_date && (
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <Clock className="w-4 h-4" /> Due {formatDate(task.due_date)}
        </div>
      )}
    </div>
  );
}
