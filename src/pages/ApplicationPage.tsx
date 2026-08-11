import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Clock, CheckCircle2, XCircle, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Application } from '@/lib/types';
import { PageTransition, FadeIn, Skeleton, EmptyState, StaggerContainer, StaggerItem } from '@/components/ui/Animations';
import { Badge } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/toast';
import { cn, formatDate, statusColor, statusLabel } from '@/lib/utils';

export function ApplicationPage() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setApplications((data as Application[]) || []);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: { type: string; title: string; description: string; start_date: string; end_date: string }) => {
    if (!profile) return;
    const { error } = await supabase.from('applications').insert({ ...data, user_id: profile.id });
    if (error) {
      notify({ type: 'error', title: 'Failed to submit', message: error.message });
    } else {
      notify({ type: 'success', title: 'Application submitted', message: 'Your request is pending admin approval.' });
      load();
      setShowCreate(false);
    }
  };

  return (
    <PageTransition>
      <div className="p-4 lg:p-8 space-y-6">
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold font-display text-ink-900">Applications</h1>
              <p className="text-ink-500 mt-1">Submit and track leave requests</p>
            </div>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> New Application
            </button>
          </div>
        </FadeIn>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pending', count: applications.filter(a => a.status === 'pending').length, icon: Clock, color: 'text-warning-600 bg-warning-100' },
            { label: 'Approved', count: applications.filter(a => a.status === 'approved').length, icon: CheckCircle2, color: 'text-success-600 bg-success-100' },
            { label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length, icon: XCircle, color: 'text-error-600 bg-error-100' },
          ].map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.1}>
              <div className="card p-4">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-2', s.color)}>
                  <s.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-ink-900">{s.count}</p>
                <p className="text-xs text-ink-400">{s.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24" />)}</div>
        ) : applications.length === 0 ? (
          <EmptyState icon={<FileText className="w-8 h-8" />} title="No applications" description="Submit a leave or absence request to get started." />
        ) : (
          <StaggerContainer className="space-y-3">
            {applications.map(app => (
              <StaggerItem key={app.id}>
                <motion.div whileHover={{ x: 4 }} className="card card-hover p-5">
                  <div className="flex items-start gap-4">
                    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                      app.status === 'pending' ? 'bg-warning-100 text-warning-600' :
                      app.status === 'approved' ? 'bg-success-100 text-success-600' :
                      'bg-error-100 text-error-600')}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-ink-900">{app.title}</h3>
                        <Badge className={statusColor(app.status)}>{statusLabel(app.status)}</Badge>
                        <Badge variant="default" className="capitalize">{app.type.replace('_', ' ')}</Badge>
                      </div>
                      {app.description && <p className="text-sm text-ink-500 mt-1">{app.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-ink-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(app.start_date)} → {formatDate(app.end_date)}</span>
                        <span>Submitted {formatDate(app.created_at)}</span>
                      </div>
                      {app.admin_note && (
                        <div className="mt-2 p-2 rounded-lg bg-ink-50 text-xs text-ink-600">
                          <span className="font-medium">Admin note:</span> {app.admin_note}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      <CreateApplicationModal open={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreate} />
    </PageTransition>
  );
}

function CreateApplicationModal({ open, onClose, onCreate }: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { type: string; title: string; description: string; start_date: string; end_date: string }) => void;
}) {
  const [type, setType] = useState('leave');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !startDate || !endDate) return;
    onCreate({ type, title, description, start_date: startDate, end_date: endDate });
    setType('leave'); setTitle(''); setDescription(''); setStartDate(''); setEndDate('');
  };

  return (
    <Modal open={open} onClose={onClose} title="New Application" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
            <option value="leave">Leave</option>
            <option value="remote">Remote Work</option>
            <option value="half_day">Half Day</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="e.g. Sick leave" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-field resize-none" />
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
          <button onClick={handleSubmit} className="btn-primary">Submit Application</button>
        </div>
      </div>
    </Modal>
  );
}
