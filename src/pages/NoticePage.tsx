import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bell, Pin, Plus, AlertTriangle, CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Notice } from '@/lib/types';
import { PageTransition, FadeIn, Skeleton, EmptyState, StaggerContainer, StaggerItem } from '@/components/ui/Animations';
import { Avatar, Badge } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/toast';
import { cn, relativeTime } from '@/lib/utils';
import { useNotices } from '@/lib/hooks';

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  urgent: AlertCircle,
  success: CheckCircle2,
};

const TYPE_COLORS: Record<string, string> = {
  info: 'bg-accent-100 text-accent-600',
  warning: 'bg-warning-100 text-warning-600',
  urgent: 'bg-error-100 text-error-600',
  success: 'bg-success-100 text-success-600',
};

export function NoticePage() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const { notices, loading, reload } = useNotices();
  const [showCreate, setShowCreate] = useState(false);

  const canPost = profile?.role === 'admin' || profile?.role === 'moderator';

  const sorted = useMemo(() => {
    return [...notices].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [notices]);

  const handleCreate = async (data: { title: string; content: string; type: string; pinned: boolean }) => {
    if (!profile) return;
    const { error } = await supabase.from('notices').insert({ ...data, posted_by: profile.id });
    if (error) {
      notify({ type: 'error', title: 'Failed to post notice', message: error.message });
    } else {
      notify({ type: 'success', title: 'Notice posted' });
      reload();
      setShowCreate(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) {
      notify({ type: 'error', title: 'Failed to delete' });
    } else {
      notify({ type: 'success', title: 'Notice deleted' });
      reload();
    }
  };

  return (
    <PageTransition>
      <div className="p-4 lg:p-8 space-y-6">
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold font-display text-ink-900">Notice Board</h1>
              <p className="text-ink-500 mt-1">Company announcements and updates</p>
            </div>
            {canPost && (
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> Post Notice
              </button>
            )}
          </div>
        </FadeIn>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}</div>
        ) : sorted.length === 0 ? (
          <EmptyState icon={<Bell className="w-8 h-8" />} title="No notices" description="Announcements will appear here." />
        ) : (
          <StaggerContainer className="space-y-4">
            {sorted.map(notice => {
              const Icon = TYPE_ICONS[notice.type] || Info;
              const author = (notice as Notice & { author: { id: string; full_name: string | null; avatar_url: string | null } }).author;
              return (
                <StaggerItem key={notice.id}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    className={cn('card p-5', notice.pinned && 'ring-2 ring-warning-200')}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', TYPE_COLORS[notice.type])}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-ink-900">{notice.title}</h3>
                          {notice.pinned && <Badge variant="warning"><Pin className="w-3 h-3" /> Pinned</Badge>}
                          <Badge className={cn(TYPE_COLORS[notice.type], 'capitalize')}>{notice.type}</Badge>
                        </div>
                        <p className="text-sm text-ink-600 mt-2 leading-relaxed">{notice.content}</p>
                        {author && (
                          <div className="flex items-center gap-2 mt-3">
                            <Avatar src={author.avatar_url} name={author.full_name} size="xs" />
                            <span className="text-xs text-ink-400">{author.full_name} · {relativeTime(notice.created_at)}</span>
                          </div>
                        )}
                      </div>
                      {canPost && (
                        <button onClick={() => handleDelete(notice.id)} className="p-2 rounded-lg text-ink-300 hover:text-error-500 hover:bg-error-50 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>

      <CreateNoticeModal open={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreate} />
    </PageTransition>
  );
}

function CreateNoticeModal({ open, onClose, onCreate }: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { title: string; content: string; type: string; pinned: boolean }) => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('info');
  const [pinned, setPinned] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    onCreate({ title, content, type, pinned });
    setTitle(''); setContent(''); setType('info'); setPinned(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Post Notice" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Notice title" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Content</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="input-field resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Pin to top</label>
            <button
              onClick={() => setPinned(!pinned)}
              className={cn('w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                pinned ? 'bg-warning-100 border-warning-300 text-warning-700' : 'bg-white border-ink-200 text-ink-500')}
            >
              {pinned ? 'Pinned' : 'Not pinned'}
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} className="btn-primary">Post Notice</button>
        </div>
      </div>
    </Modal>
  );
}
