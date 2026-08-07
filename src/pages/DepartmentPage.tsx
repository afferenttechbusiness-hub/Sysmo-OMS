import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Crown, MessageSquare } from 'lucide-react';
import { PageTransition, FadeIn, Skeleton, EmptyState, StaggerContainer, StaggerItem } from '@/components/ui/Animations';
import { Avatar, Badge } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { useDepartments, useProfiles } from '@/lib/hooks';
import type { Department } from '@/lib/types';

function DeptIcon({ dept, className }: { dept: Department; className?: string }) {
  if (dept.icon_url) {
    return <img src={dept.icon_url} alt={dept.name} className={cn('object-cover rounded-xl', className)} />;
  }
  return <Building2 className={cn('text-brand-600', className)} />;
}

export function DepartmentPage() {
  const { departments, loading } = useDepartments();
  const { profiles } = useProfiles();
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="p-4 lg:p-8 space-y-6">
        <FadeIn>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display text-ink-900">Departments</h1>
            <p className="text-ink-500 mt-1">Browse and manage departments</p>
          </div>
        </FadeIn>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : departments.length === 0 ? (
          <EmptyState icon={<Building2 className="w-8 h-8" />} title="No departments" description="Departments will appear here once created." />
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map(dept => {
              const members = profiles.filter(p => p.department_id === dept.id);
              const moderator = profiles.find(p => p.id === dept.moderator_id);
              return (
                <StaggerItem key={dept.id}>
                  <motion.div whileHover={{ y: -4 }} className="card card-hover p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center overflow-hidden">
                        <DeptIcon dept={dept} className="w-6 h-6" />
                      </div>
                      <Badge variant="brand">{members.length} members</Badge>
                    </div>
                    <h3 className="font-semibold text-ink-900">{dept.name}</h3>
                    <p className="text-sm text-ink-500 mt-1 line-clamp-2">{dept.description || 'No description'}</p>

                    {moderator && (
                      <div className="flex items-center gap-2 mt-4 p-2.5 rounded-xl bg-ink-50">
                        <Avatar src={moderator.avatar_url} name={moderator.full_name} size="sm" onClick={() => navigate(`/app/profile/${moderator.id}`)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-ink-400 flex items-center gap-1"><Crown className="w-3 h-3 text-warning-500" /> Moderator</p>
                          <p className="text-sm font-medium text-ink-900 truncate">{moderator.full_name}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex -space-x-2">
                        {members.slice(0, 4).map(m => (
                          <Avatar key={m.id} src={m.avatar_url} name={m.full_name} size="xs" ring onClick={() => navigate(`/app/profile/${m.id}`)} />
                        ))}
                        {members.length > 4 && <div className="w-6 h-6 rounded-full bg-ink-200 ring-2 ring-white flex items-center justify-center text-[10px] font-medium text-ink-600">+{members.length - 4}</div>}
                      </div>
                      <button onClick={() => navigate('/app/messenger')} className="btn-ghost text-sm">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>
    </PageTransition>
  );
}
