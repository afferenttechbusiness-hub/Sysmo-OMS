import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FolderKanban, Plus, Calendar, Users, CheckCircle2, Clock, X,
  Trash2, Paperclip, Download, Upload, UserCog, FileText, ListChecks,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Project, ProjectStatus, Priority, Task, TaskStep, Profile, TaskStatus } from '@/lib/types';
import { PageTransition, FadeIn, Skeleton, EmptyState, StaggerContainer, StaggerItem } from '@/components/ui/Animations';
import { Avatar, Badge, ProgressBar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/toast';
import { cn, statusColor, priorityColor, statusLabel, formatDate, generateId } from '@/lib/utils';
import { useProjects, useTasks, useProfiles } from '@/lib/hooks';

const STATUS_FILTERS: { key: ProjectStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'planning', label: 'Planning' },
  { key: 'active', label: 'Active' },
  { key: 'on_hold', label: 'On Hold' },
  { key: 'completed', label: 'Completed' },
];

export function ProjectsPage() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const { projects, loading, reload } = useProjects();
  const { tasks, reload: reloadTasks } = useTasks();
  const { profiles } = useProfiles();
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const canManage = profile?.role === 'admin' || profile?.role === 'moderator';

  const filtered = useMemo(() => {
    if (filter === 'all') return projects;
    return projects.filter(p => p.status === filter);
  }, [projects, filter]);

  const handleCreate = async (data: { title: string; description: string; status: ProjectStatus; priority: Priority; start_date: string; end_date: string }) => {
    if (!profile) return;
    const { error } = await supabase.from('projects').insert({ ...data, created_by: profile.id });
    if (error) {
      notify({ type: 'error', title: 'Failed to create project', message: error.message });
    } else {
      notify({ type: 'success', title: 'Project created' });
      reload();
      setShowCreate(false);
    }
  };

  return (
    <PageTransition>
      <div className="p-4 lg:p-8 space-y-6">
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold font-display text-ink-900">Projects</h1>
              <p className="text-ink-500 mt-1">Track and manage all company projects</p>
            </div>
            {canManage && (
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> New Project
              </button>
            )}
          </div>
        </FadeIn>

        {/* Status filters */}
        <FadeIn delay={0.1}>
          <div className="flex gap-1 p-1 bg-ink-100 rounded-xl overflow-x-auto scrollbar-hide w-fit">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  filter === f.key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
                )}
              >
                {f.label}
                <span className={cn('ml-1.5 text-xs', filter === f.key ? 'text-brand-600' : 'text-ink-400')}>
                  {f.key === 'all' ? projects.length : projects.filter(p => p.status === f.key).length}
                </span>
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Projects grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<FolderKanban className="w-8 h-8" />} title="No projects found" description="Projects will appear here once created." />
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(project => {
              const projectTasks = tasks.filter(t => t.project_id === project.id);
              const completedTasks = projectTasks.filter(t => t.status === 'done').length;
              const assigneeIds = [...new Set(projectTasks.map(t => t.assigned_to).filter(Boolean))] as string[];
              const assignees = profiles.filter(p => assigneeIds.includes(p.id));

              return (
                <StaggerItem key={project.id}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="card card-hover p-5 cursor-pointer"
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center">
                        <FolderKanban className="w-5 h-5 text-brand-600" />
                      </div>
                      <Badge className={statusColor(project.status)}>{statusLabel(project.status)}</Badge>
                    </div>
                    <h3 className="font-semibold text-ink-900">{project.title}</h3>
                    <p className="text-sm text-ink-500 mt-1 line-clamp-2">{project.description || 'No description'}</p>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-ink-400 mb-1.5">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <ProgressBar value={project.progress} color={project.progress === 100 ? 'success' : 'brand'} />
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3 text-xs text-ink-400">
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {completedTasks}/{projectTasks.length}</span>
                        {project.end_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(project.end_date, 'MMM d')}</span>}
                      </div>
                      <div className="flex -space-x-2">
                        {assignees.slice(0, 3).map(a => <Avatar key={a.id} src={a.avatar_url} name={a.full_name} size="xs" ring />)}
                        {assignees.length > 3 && <div className="w-6 h-6 rounded-full bg-ink-200 ring-2 ring-white flex items-center justify-center text-[10px] font-medium text-ink-600">+{assignees.length - 3}</div>}
                      </div>
                    </div>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>

      {/* Project detail with task management */}
      <Modal open={!!selectedProject} onClose={() => setSelectedProject(null)} title={selectedProject?.title || 'Project'} size="xl">
        {selectedProject && (
          <ProjectDetail
            project={projects.find(p => p.id === selectedProject.id) ?? selectedProject}
            tasks={tasks.filter(t => t.project_id === selectedProject.id)}
            profiles={profiles}
            currentUserId={profile?.id || ''}
            canManage={canManage}
            onTasksChanged={() => { reloadTasks(); reload(); }}
          />
        )}
      </Modal>

      {/* Create project */}
      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreate} />
    </PageTransition>
  );
}

function ProjectDetail({ project, tasks, profiles, currentUserId, canManage, onTasksChanged }: {
  project: Project;
  tasks: Task[];
  profiles: Profile[];
  currentUserId: string;
  canManage: boolean;
  onTasksChanged: () => void;
}) {
  const { notify } = useToast();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showFileManager, setShowFileManager] = useState<Task | null>(null);

  const myTasks = tasks.filter(t => t.assigned_to === currentUserId);
  const completedTasks = tasks.filter(t => t.status === 'done').length;

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      notify({ type: 'error', title: 'Failed to delete task' });
    } else {
      notify({ type: 'success', title: 'Task deleted' });
      onTasksChanged();
    }
  };

  const handleSaveTask = async (data: {
    id?: string;
    title: string;
    description: string;
    assigned_to: string;
    priority: Priority;
    due_date: string;
    steps: TaskStep[];
  }) => {
    const payload = {
      title: data.title,
      description: data.description,
      project_id: project.id,
      assigned_to: data.assigned_to || null,
      assigned_by: currentUserId,
      priority: data.priority,
      due_date: data.due_date || null,
      steps: data.steps,
      updated_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', data.id);
      if (error) { notify({ type: 'error', title: 'Failed to update task', message: error.message }); return; }
      notify({ type: 'success', title: 'Task updated' });
    } else {
      const { error } = await supabase.from('tasks').insert({ ...payload, status: 'todo' as TaskStatus, progress: 0 });
      if (error) { notify({ type: 'error', title: 'Failed to create task', message: error.message }); return; }
      notify({ type: 'success', title: 'Task created & assigned' });
    }
    onTasksChanged();
    setShowTaskModal(false);
    setEditingTask(null);
  };

  return (
    <div className="space-y-5">
      {/* Description */}
      <div>
        <p className="text-sm text-ink-600">{project.description || 'No description provided.'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-ink-50 text-center">
          <p className="text-2xl font-bold text-ink-900">{tasks.length}</p>
          <p className="text-xs text-ink-400">Total</p>
        </div>
        <div className="p-3 rounded-xl bg-ink-50 text-center">
          <p className="text-2xl font-bold text-success-600">{completedTasks}</p>
          <p className="text-xs text-ink-400">Done</p>
        </div>
        <div className="p-3 rounded-xl bg-ink-50 text-center">
          <p className="text-2xl font-bold text-accent-600">{tasks.filter(t => t.status === 'in_progress').length}</p>
          <p className="text-xs text-ink-400">Active</p>
        </div>
        <div className="p-3 rounded-xl bg-ink-50 text-center">
          <p className="text-2xl font-bold text-brand-600">{myTasks.length}</p>
          <p className="text-xs text-ink-400">Mine</p>
        </div>
      </div>

      {/* Progress + meta */}
      <div className="space-y-2">
        <div>
          <p className="text-xs text-ink-400 mb-1.5">Progress: {project.progress}%</p>
          <ProgressBar value={project.progress} color={project.progress === 100 ? 'success' : 'brand'} />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={statusColor(project.status)}>{statusLabel(project.status)}</Badge>
          <Badge className={priorityColor(project.priority)}>{project.priority} priority</Badge>
          {project.start_date && <span className="text-xs text-ink-400">{formatDate(project.start_date)} → {project.end_date ? formatDate(project.end_date) : 'TBD'}</span>}
        </div>
      </div>

      {/* Tasks header */}
      <div className="flex items-center justify-between pt-2 border-t border-ink-100">
        <h3 className="text-sm font-semibold text-ink-700 flex items-center gap-2">
          <ListChecks className="w-4 h-4" /> Tasks ({tasks.length})
        </h3>
        {canManage && (
          <button onClick={() => { setEditingTask(null); setShowTaskModal(true); }} className="btn-primary text-sm py-1.5 px-3">
            <Plus className="w-3.5 h-3.5" /> Assign Task
          </button>
        )}
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <p className="text-sm text-ink-400 py-4 text-center">No tasks yet. {canManage && 'Assign a task to get started.'}</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-hide">
          {tasks.map(task => {
            const assignee = profiles.find(p => p.id === task.assigned_to);
            const attachmentCount = (task.attachments || []).length;
            return (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-ink-50 hover:bg-ink-100 transition-colors">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  task.status === 'done' ? 'bg-success-100 text-success-600' :
                  task.status === 'in_progress' ? 'bg-accent-100 text-accent-600' :
                  'bg-ink-200 text-ink-500')}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-ink-400">{statusLabel(task.status)} · {task.progress}%</p>
                    {attachmentCount > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-ink-400">
                        <Paperclip className="w-3 h-3" /> {attachmentCount}
                      </span>
                    )}
                  </div>
                </div>
                {assignee && <Avatar src={assignee.avatar_url} name={assignee.full_name} size="xs" />}
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setShowFileManager(task)}
                    className="p-1.5 rounded-lg hover:bg-ink-200 text-ink-500 transition-colors"
                    title="Files"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </button>
                  {canManage && (
                    <>
                      <button
                        onClick={() => { setEditingTask(task); setShowTaskModal(true); }}
                        className="p-1.5 rounded-lg hover:bg-ink-200 text-ink-500 transition-colors"
                        title="Edit"
                      >
                        <UserCog className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 rounded-lg hover:bg-error-50 text-ink-400 hover:text-error-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task create/edit modal */}
      {showTaskModal && (
        <TaskModal
          open={showTaskModal}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          task={editingTask}
          profiles={profiles}
          onSave={handleSaveTask}
        />
      )}

      {/* File manager modal */}
      {showFileManager && (
        <FileManagerModal
          task={showFileManager}
          allTasks={tasks}
          project={project}
          canManage={canManage}
          currentUserId={currentUserId}
          onClose={() => setShowFileManager(null)}
          onUpdated={onTasksChanged}
        />
      )}
    </div>
  );
}

function TaskModal({ open, onClose, task, profiles, onSave }: {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  profiles: Profile[];
  onSave: (data: { id?: string; title: string; description: string; assigned_to: string; priority: Priority; due_date: string; steps: TaskStep[] }) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [steps, setSteps] = useState<TaskStep[]>([]);
  const [stepInput, setStepInput] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(task?.title || '');
      setDescription(task?.description || '');
      setAssignedTo(task?.assigned_to || '');
      setPriority(task?.priority || 'medium');
      setDueDate(task?.due_date || '');
      setSteps(task?.steps || []);
      setStepInput('');
    }
  }, [open, task]);

  const addStep = () => {
    if (!stepInput.trim()) return;
    setSteps([...steps, { id: generateId(), label: stepInput.trim(), done: false }]);
    setStepInput('');
  };

  const removeStep = (id: string) => setSteps(steps.filter(s => s.id !== id));

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({ id: task?.id, title, description, assigned_to: assignedTo, priority, due_date: dueDate, steps });
    setTitle(''); setDescription(''); setAssignedTo(''); setPriority('medium'); setDueDate(''); setSteps([]);
  };

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edit Task' : 'Assign New Task'} size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Task Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="e.g. Design homepage mockup" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input-field resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Assign To</label>
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="input-field">
              <option value="">Unassigned</option>
              {profiles.filter(p => p.role === 'employee' || p.role === 'moderator').map(p => (
                <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="input-field">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Due Date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-field" />
        </div>
        {/* Steps */}
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Checklist Steps</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={stepInput}
              onChange={(e) => setStepInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStep(); } }}
              placeholder="Add a step..."
              className="input-field flex-1"
            />
            <button onClick={addStep} className="btn-secondary px-3"><Plus className="w-4 h-4" /></button>
          </div>
          {steps.length > 0 && (
            <div className="space-y-1.5">
              {steps.map(s => (
                <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-ink-50">
                  <span className="text-sm text-ink-700 flex-1">{s.label}</span>
                  <button onClick={() => removeStep(s.id)} className="p-1 rounded hover:bg-ink-200 text-ink-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} className="btn-primary">{task ? 'Save Changes' : 'Create & Assign'}</button>
        </div>
      </div>
    </Modal>
  );
}

function FileManagerModal({ task, allTasks, project, canManage, currentUserId, onClose, onUpdated }: {
  task: Task;
  allTasks: Task[];
  project: Project;
  canManage: boolean;
  currentUserId: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { notify } = useToast();
  const [attachments, setAttachments] = useState<Record<string, unknown>[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const alreadySubmitted = task.status === 'done';

  const loadAttachments = useCallback(async () => {
    const { data } = await supabase.from('tasks').select('attachments').eq('id', task.id).maybeSingle();
    setAttachments((data?.attachments as Record<string, unknown>[]) || []);
  }, [task.id]);

  useEffect(() => { loadAttachments(); }, [loadAttachments]);

  const handleUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newAttachments: Record<string, unknown>[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${task.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('task-files').upload(fileName, file, { upsert: true });
      if (uploadError) {
        notify({ type: 'error', title: 'Upload failed', message: uploadError.message });
        continue;
      }
      const { data: urlData } = supabase.storage.from('task-files').getPublicUrl(fileName);
      newAttachments.push({
        id: generateId(),
        name: file.name,
        url: urlData.publicUrl,
        size: file.size,
        uploaded_at: new Date().toISOString(),
      });
    }

    if (newAttachments.length > 0) {
      const updated = [...attachments, ...newAttachments];
      await supabase.from('tasks').update({ attachments: updated, updated_at: new Date().toISOString() }).eq('id', task.id);
      setAttachments(updated);
      onUpdated();
      notify({ type: 'success', title: `${newAttachments.length} file(s) uploaded` });
    }
    setUploading(false);
  };

  const handleDeleteAttachment = async (attachment: Record<string, unknown>) => {
    const url = attachment.url as string;
    const path = url.split('/task-files/')[1];
    if (path) await supabase.storage.from('task-files').remove([path]);
    const updated = attachments.filter(a => a.id !== attachment.id);
    await supabase.from('tasks').update({ attachments: updated, updated_at: new Date().toISOString() }).eq('id', task.id);
    setAttachments(updated);
    onUpdated();
    notify({ type: 'success', title: 'File removed' });
  };

  const handleSubmitTask = async () => {
    if (attachments.length === 0) {
      notify({ type: 'error', title: 'No files attached', message: 'Please upload at least one file before submitting.' });
      return;
    }
    setSubmitting(true);

    // Calculate task progress from steps, or 100 if no steps
    const steps = task.steps || [];
    const taskProgress = steps.length > 0
      ? Math.round((steps.filter(s => s.done).length / steps.length) * 100)
      : 100;

    await supabase.from('tasks').update({
      status: 'review' as TaskStatus,
      progress: Math.max(task.progress, taskProgress),
      updated_at: new Date().toISOString(),
    }).eq('id', task.id);

    // Recalculate project progress using only tasks belonging to this project
    const projectTasks = allTasks.filter(t => t.project_id === project.id);
    const updatedProjectTasks = projectTasks.map(t =>
      t.id === task.id ? { ...t, status: 'review' as TaskStatus, progress: Math.max(task.progress, taskProgress) } : t
    );
    const total = updatedProjectTasks.length;
    if (total > 0) {
      const projectProgress = Math.round(
        updatedProjectTasks.reduce((sum, t) => {
          if (t.status === 'done') return sum + 100;
          if (t.status === 'review') return sum + 75;
          if (t.status === 'in_progress') return sum + 50;
          return sum;
        }, 0) / total
      );
      await supabase.from('projects').update({ progress: projectProgress, updated_at: new Date().toISOString() }).eq('id', project.id);
    }

    setSubmitting(false);
    notify({ type: 'success', title: 'Task submitted for review', message: 'Progress has been updated automatically.' });
    onUpdated();
    onClose();
  };

  return (
    <Modal open={true} onClose={onClose} title={`Files: ${task.title}`} size="md">
      <div className="space-y-4">
        {/* Upload area */}
        <label className={cn(
          'flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer',
          uploading ? 'border-brand-300 bg-brand-50' : 'border-ink-200 hover:border-brand-300 hover:bg-brand-50'
        )}>
          <Upload className={cn('w-6 h-6', uploading ? 'text-brand-500 animate-pulse' : 'text-ink-400')} />
          <p className="text-sm text-ink-500">{uploading ? 'Uploading...' : 'Click to upload files'}</p>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
            disabled={uploading}
          />
        </label>

        {/* File list */}
        {attachments.length === 0 ? (
          <p className="text-sm text-ink-400 text-center py-4">No files uploaded yet.</p>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto scrollbar-hide">
            {attachments.map(att => (
              <div key={att.id as string} className="flex items-center gap-3 p-3 rounded-xl bg-ink-50">
                <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{att.name as string}</p>
                  <p className="text-xs text-ink-400">{((att.size as number) / 1024).toFixed(1)} KB</p>
                </div>
                <a
                  href={att.url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-ink-200 text-ink-500 transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                {canManage && (
                  <button
                    onClick={() => handleDeleteAttachment(att)}
                    className="p-1.5 rounded-lg hover:bg-error-50 text-ink-400 hover:text-error-500 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Submit button */}
        {(
          <div className="flex items-center justify-between pt-3 border-t border-ink-100">
            <div className="text-xs text-ink-400">
              {alreadySubmitted
                ? <span className="text-success-600 font-medium">Task already submitted</span>
                : 'Upload files above then submit when ready'}
            </div>
            <button
              onClick={handleSubmitTask}
              disabled={submitting || alreadySubmitted || uploading}
              className={cn(
                'btn-primary text-sm',
                (alreadySubmitted) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {submitting ? 'Submitting...' : alreadySubmitted ? 'Submitted' : 'Submit Task'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function CreateProjectModal({ open, onClose, onCreate }: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { title: string; description: string; status: ProjectStatus; priority: Priority; start_date: string; end_date: string }) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('planning');
  const [priority, setPriority] = useState<Priority>('medium');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onCreate({ title, description, status, priority, start_date: startDate, end_date: endDate });
    setTitle(''); setDescription(''); setStatus('planning'); setPriority('medium'); setStartDate(''); setEndDate('');
  };

  return (
    <Modal open={open} onClose={onClose} title="New Project" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Project Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="e.g. Website Redesign" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-field resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} className="input-field">
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="input-field">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
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
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} className="btn-primary">Create Project</button>
        </div>
      </div>
    </Modal>
  );
}
