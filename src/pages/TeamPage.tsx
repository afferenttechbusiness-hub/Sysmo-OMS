import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, FolderKanban, Crown, MessageSquare, Plus, UserPlus,
  Trash2, X, UserMinus, ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { TeamGroup, TeamMember, Project, Profile } from '@/lib/types';
import { PageTransition, FadeIn, Skeleton, EmptyState, StaggerContainer, StaggerItem } from '@/components/ui/Animations';
import { Avatar, Badge } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { useTeams, useProfiles, useProjects } from '@/lib/hooks';

export function TeamPage() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { teams, loading, reload } = useTeams() as unknown as {
    teams: (TeamGroup & { project: Project })[];
    loading: boolean;
    reload: () => void;
  };
  const { profiles } = useProfiles();
  const { projects } = useProjects();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<(TeamGroup & { project: Project }) | null>(null);

  const canManage = profile?.role === 'admin' || profile?.role === 'moderator';

  const handleDelete = async (teamId: string) => {
    const { error } = await supabase.from('team_groups').delete().eq('id', teamId);
    if (error) {
      notify({ type: 'error', title: 'Failed to delete team' });
    } else {
      notify({ type: 'success', title: 'Team deleted' });
      reload();
    }
  };

  return (
    <PageTransition>
      <div className="p-4 lg:p-8 space-y-6">
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold font-display text-ink-900">Teams</h1>
              <p className="text-ink-500 mt-1">Cross-department project teams</p>
            </div>
            {canManage && (
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> Create Team
              </button>
            )}
          </div>
        </FadeIn>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-56" />)}
          </div>
        ) : teams.length === 0 ? (
          <EmptyState icon={<Users className="w-8 h-8" />} title="No teams yet" description={canManage ? 'Create a team to organize project work.' : 'Teams will appear here once created.'} />
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map(team => (
              <StaggerItem key={team.id}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="card card-hover p-6 cursor-pointer"
                  onClick={() => setSelectedTeam(team)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center">
                        <Users className="w-6 h-6 text-brand-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-ink-900">{team.name}</h3>
                        {team.project && (
                          <p className="text-xs text-ink-400 flex items-center gap-1">
                            <FolderKanban className="w-3 h-3" /> {team.project.title}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={cn(team.status === 'active' ? 'bg-success-100 text-success-700' : 'bg-ink-100 text-ink-500')}>
                      {team.status}
                    </Badge>
                  </div>

                  {team.description && <p className="text-sm text-ink-500 mb-4 line-clamp-2">{team.description}</p>}

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-ink-100 ring-2 ring-white flex items-center justify-center text-xs font-medium text-ink-500">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <span className="text-xs text-brand-600 font-medium flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> View team
                    </span>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      {/* Team detail modal */}
      {selectedTeam && (
        <TeamDetailModal
          team={selectedTeam}
          profiles={profiles}
          currentUserId={profile?.id || ''}
          canManage={canManage}
          onClose={() => setSelectedTeam(null)}
          onTeamDeleted={() => { setSelectedTeam(null); reload(); }}
          onNavigateMessenger={(roomId) => { setSelectedTeam(null); navigate(`/app/messenger?room=${roomId}`); }}
        />
      )}

      {/* Create team modal */}
      {showCreate && (
        <CreateTeamModal
          open={showCreate}
          projects={projects}
          profiles={profiles}
          currentUserId={profile?.id || ''}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); reload(); }}
        />
      )}
    </PageTransition>
  );
}

function TeamDetailModal({ team, profiles, currentUserId, canManage, onClose, onTeamDeleted, onNavigateMessenger }: {
  team: TeamGroup & { project: Project };
  profiles: Profile[];
  currentUserId: string;
  canManage: boolean;
  onClose: () => void;
  onTeamDeleted: () => void;
  onNavigateMessenger: (roomId: string) => void;
}) {
  const { notify } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);

  const loadMembers = useCallback(async () => {
    const { data } = await supabase.from('team_members').select('*').eq('team_id', team.id);
    setMembers((data as TeamMember[]) || []);
    setLoading(false);
  }, [team.id]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const memberProfiles = members.map(m => ({
    ...m,
    profile: profiles.find(p => p.id === m.user_id),
  })).filter(m => m.profile);

  const availableProfiles = profiles.filter(p => !members.some(m => m.user_id === p.id));

  const handleAddMember = async (userId: string, role: 'lead' | 'member' = 'member') => {
    const { error } = await supabase.from('team_members').insert({ team_id: team.id, user_id: userId, role });
    if (error) {
      notify({ type: 'error', title: 'Failed to add member', message: error.message });
    } else {
      notify({ type: 'success', title: 'Member added' });
      loadMembers();
    }
    setShowAddMember(false);
  };

  const handleRemoveMember = async (userId: string) => {
    const { error } = await supabase.from('team_members').delete().eq('team_id', team.id).eq('user_id', userId);
    if (error) {
      notify({ type: 'error', title: 'Failed to remove member' });
    } else {
      notify({ type: 'success', title: 'Member removed' });
      loadMembers();
    }
  };

  const handleCreateGroupChat = async () => {
    // Check if a project chat already exists for this team's project
    if (team.project_id) {
      const { data: existing } = await supabase.from('chat_rooms').select('*').eq('project_id', team.project_id).eq('type', 'project').maybeSingle();
      if (existing) {
        // Ensure all members are in the room
        await supabase.from('chat_room_members').delete().eq('room_id', existing.id);
        const memberInserts = members.map(m => ({ room_id: existing.id, user_id: m.user_id }));
        if (memberInserts.length > 0) await supabase.from('chat_room_members').insert(memberInserts);
        onNavigateMessenger(existing.id);
        return;
      }
    }

    // Create new group chat
    const { data: newRoom, error } = await supabase.from('chat_rooms').insert({
      name: `${team.name} Team`,
      type: 'group',
      project_id: team.project_id,
      created_by: currentUserId,
    }).select('*').single();

    if (error || !newRoom) {
      notify({ type: 'error', title: 'Failed to create group chat' });
      return;
    }

    // Add all team members + current user to the room
    const memberInserts = [
      { room_id: newRoom.id, user_id: currentUserId },
      ...members.map(m => ({ room_id: newRoom.id, user_id: m.user_id })),
    ];
    // Deduplicate
    const seen = new Set<string>();
    const unique = memberInserts.filter(mi => {
      if (seen.has(mi.user_id)) return false;
      seen.add(mi.user_id);
      return true;
    });
    await supabase.from('chat_room_members').insert(unique);
    notify({ type: 'success', title: 'Group chat created' });
    onNavigateMessenger(newRoom.id);
  };

  const handleDeleteTeam = async () => {
    const { error } = await supabase.from('team_groups').delete().eq('id', team.id);
    if (error) {
      notify({ type: 'error', title: 'Failed to delete team' });
    } else {
      notify({ type: 'success', title: 'Team deleted' });
      onTeamDeleted();
    }
  };

  return (
    <Modal open={true} onClose={onClose} title={team.name} size="md">
      <div className="space-y-5">
        {/* Info */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={cn(team.status === 'active' ? 'bg-success-100 text-success-700' : 'bg-ink-100 text-ink-500')}>{team.status}</Badge>
          {team.project && <span className="text-sm text-ink-500 flex items-center gap-1"><FolderKanban className="w-3.5 h-3.5" /> {team.project.title}</span>}
        </div>
        {team.description && <p className="text-sm text-ink-600">{team.description}</p>}

        {/* Members */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ink-700">Members ({memberProfiles.length})</h3>
            {canManage && (
              <button onClick={() => setShowAddMember(true)} className="btn-ghost text-sm py-1 px-2">
                <UserPlus className="w-4 h-4" /> Add
              </button>
            )}
          </div>
          {loading ? (
            <Skeleton className="h-20" />
          ) : memberProfiles.length === 0 ? (
            <p className="text-sm text-ink-400 py-4 text-center">No members yet.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
              {memberProfiles.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-ink-50">
                  <Avatar src={m.profile?.avatar_url} name={m.profile?.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{m.profile?.full_name}</p>
                    <p className="text-xs text-ink-400">{m.profile?.position || m.profile?.email}</p>
                  </div>
                  {m.role === 'lead' && <Crown className="w-4 h-4 text-warning-500" />}
                  {canManage && (
                    <button onClick={() => handleRemoveMember(m.user_id)} className="p-1.5 rounded-lg hover:bg-error-50 text-ink-400 hover:text-error-500 transition-colors">
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {canManage && (
          <div className="flex gap-2 pt-2 border-t border-ink-100">
            <button onClick={handleCreateGroupChat} className="btn-primary flex-1 text-sm">
              <MessageSquare className="w-4 h-4" /> Create Group Chat
            </button>
            <button onClick={handleDeleteTeam} className="btn-secondary text-error-600 hover:bg-error-50">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Add member modal */}
        {showAddMember && (
          <Modal open={true} onClose={() => setShowAddMember(false)} title="Add Member" size="sm">
            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
              {availableProfiles.length === 0 ? (
                <p className="text-sm text-ink-400 text-center py-4">All users are already in this team.</p>
              ) : (
                availableProfiles.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-ink-50">
                    <Avatar src={p.avatar_url} name={p.full_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{p.full_name}</p>
                      <p className="text-xs text-ink-400">{p.position || p.email}</p>
                    </div>
                    <button onClick={() => handleAddMember(p.id)} className="btn-ghost text-sm py-1 px-2">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Modal>
        )}
      </div>
    </Modal>
  );
}

function CreateTeamModal({ open, projects, profiles, currentUserId, onClose, onCreated }: {
  open: boolean;
  projects: Project[];
  profiles: Profile[];
  currentUserId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { notify } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const { data: team, error } = await supabase.from('team_groups').insert({
      name,
      description: description || null,
      project_id: projectId || null,
      created_by: currentUserId,
    }).select('*').single();

    if (error || !team) {
      notify({ type: 'error', title: 'Failed to create team', message: error?.message });
      return;
    }

    // Add selected members
    const memberInserts = selectedMembers.map(userId => ({ team_id: team.id, user_id: userId, role: 'member' as const }));
    if (memberInserts.length > 0) await supabase.from('team_members').insert(memberInserts);

    notify({ type: 'success', title: 'Team created' });
    setName(''); setDescription(''); setProjectId(''); setSelectedMembers([]);
    onCreated();
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Team" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Team Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="e.g. Frontend Squad" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input-field resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Project</label>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="input-field">
            <option value="">No project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Add Members</label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-hide">
            {profiles.filter(p => p.id !== currentUserId).map(p => (
              <label key={p.id} className={cn(
                'flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors',
                selectedMembers.includes(p.id) ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-ink-50'
              )}>
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(p.id)}
                  onChange={() => toggleMember(p.id)}
                  className="w-4 h-4 rounded accent-brand-600"
                />
                <Avatar src={p.avatar_url} name={p.full_name} size="xs" />
                <span className="text-sm font-medium text-ink-900">{p.full_name}</span>
                <span className="text-xs text-ink-400 ml-auto">{p.position || ''}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} className="btn-primary">Create Team</button>
        </div>
      </div>
    </Modal>
  );
}
