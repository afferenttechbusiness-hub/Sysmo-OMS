import { motion } from 'framer-motion';
import { CalendarDays, Video, MapPin, Clock, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Schedule } from '@/lib/types';
import { PageTransition, FadeIn, Skeleton, EmptyState, StaggerContainer, StaggerItem } from '@/components/ui/Animations';
import { Badge } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/toast';
import { cn, smartDate, formatTime, formatDate } from '@/lib/utils';
import { useSchedules } from '@/lib/hooks';
import { useState } from 'react';

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  meeting: Video,
  project_deadline: AlertCircle,
  event: CalendarDays,
  review: CheckCircle2,
};

const TYPE_COLORS: Record<string, string> = {
  meeting: 'bg-brand-100 text-brand-600',
  project_deadline: 'bg-error-100 text-error-600',
  event: 'bg-accent-100 text-accent-600',
  review: 'bg-warning-100 text-warning-600',
};

export function SchedulePage() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const { schedules, loading, reload } = useSchedules();
  const [showCreate, setShowCreate] = useState(false);

  const canManage = profile?.role === 'admin' || profile?.role === 'moderator';

  const handleCreate = async (data: { title: string; description: string; type: string; start_time: string; end_time: string; location: string }) => {
    if (!profile) return;
    const { error } = await supabase.from('schedules').insert({ ...data, created_by: profile.id });
    if (error) {
      notify({ type: 'error', title: 'Failed to create schedule', message: error.message });
    } else {
      notify({ type: 'success', title: 'Schedule created' });
      reload();
      setShowCreate(false);
    }
  };

  const upcoming = schedules.filter(s => new Date(s.start_time) >= new Date());
  const past = schedules.filter(s => new Date(s.start_time) < new Date());

  return (
    <PageTransition>
      <div className="p-4 lg:p-8 space-y-6">
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold font-display text-ink-900">Schedule</h1>
              <p className="text-ink-500 mt-1">Upcoming meetings and project deadlines</p>
            </div>
            {canManage && (
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> Add Event
              </button>
            )}
          </div>
        </FadeIn>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}</div>
        ) : upcoming.length === 0 ? (
          <EmptyState icon={<CalendarDays className="w-8 h-8" />} title="No upcoming events" description="Scheduled meetings and deadlines will appear here." />
        ) : (
          <div>
            <h2 className="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-3">Upcoming</h2>
            <StaggerContainer className="space-y-3">
              {upcoming.map(s => <ScheduleItem key={s.id} schedule={s} />)}
            </StaggerContainer>

            {past.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-3 mt-8">Past</h2>
                <div className="space-y-3 opacity-60">
                  {past.slice(0, 5).map(s => <ScheduleItem key={s.id} schedule={s} />)}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <CreateScheduleModal open={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreate} />
    </PageTransition>
  );
}

function ScheduleItem({ schedule }: { schedule: Schedule }) {
  const Icon = TYPE_ICONS[schedule.type] || CalendarDays;
  return (
    <StaggerItem>
      <motion.div whileHover={{ x: 4 }} className="card card-hover p-4 flex items-center gap-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', TYPE_COLORS[schedule.type])}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-ink-900 truncate">{schedule.title}</h3>
          <div className="flex items-center gap-3 text-xs text-ink-400 mt-1">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {smartDate(schedule.start_time)}</span>
            {schedule.end_time && <span>{formatTime(schedule.start_time)} – {formatTime(schedule.end_time)}</span>}
            {schedule.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {schedule.location}</span>}
          </div>
        </div>
        <Badge variant="default" className="capitalize hidden sm:inline-flex">{schedule.type.replace('_', ' ')}</Badge>
      </motion.div>
    </StaggerItem>
  );
}

function CreateScheduleModal({ open, onClose, onCreate }: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { title: string; description: string; type: string; start_time: string; end_time: string; location: string }) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('meeting');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !startTime) return;
    onCreate({ title, description, type, start_time: new Date(startTime).toISOString(), end_time: endTime ? new Date(endTime).toISOString() : '', location });
    setTitle(''); setDescription(''); setType('meeting'); setStartTime(''); setEndTime(''); setLocation('');
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Schedule Event" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="e.g. Team Meeting" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input-field resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
              <option value="meeting">Meeting</option>
              <option value="project_deadline">Project Deadline</option>
              <option value="event">Event</option>
              <option value="review">Review</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="input-field" placeholder="Optional" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Start</label>
            <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">End</label>
            <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-field" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} className="btn-primary">Create</button>
        </div>
      </div>
    </Modal>
  );
}
