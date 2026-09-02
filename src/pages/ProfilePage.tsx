import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MapPin, Briefcase, GraduationCap, Award, Edit3, Camera,
  MessageSquare, ThumbsUp, Share2, Send, Plus, X, Trash2,
  Linkedin, Mail, Phone, Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Profile, Post, PostComment, ExperienceItem } from '@/lib/types';
import { PageTransition, FadeIn, Skeleton, EmptyState } from '@/components/ui/Animations';
import { Avatar, Badge } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/toast';
import { cn, formatDate, relativeTime, generateId } from '@/lib/utils';

export function ProfilePage() {
  const { id } = useParams();
  const { profile: myProfile, refreshProfile } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const targetId = id || myProfile?.id;
  const isOwn = !id || id === myProfile?.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<(Post & { author: Profile; comments: (PostComment & { author: Profile })[]; likes: { user_id: string }[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [showSkills, setShowSkills] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!targetId) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', targetId).maybeSingle();
    setProfile(data as Profile | null);
    setLoading(false);
  }, [targetId]);

  const loadPosts = useCallback(async () => {
    if (!targetId) return;
    const { data: postData } = await supabase
      .from('posts')
      .select('*, author:profiles!author_id(*)')
      .eq('author_id', targetId)
      .order('created_at', { ascending: false });

    if (!postData) { setPosts([]); return; }

    const postsWithExtras = await Promise.all(
      (postData as (Post & { author: Profile })[]).map(async (post) => {
        const [commentsRes, likesRes] = await Promise.all([
          supabase.from('post_comments').select('*, author:profiles!author_id(*)').eq('post_id', post.id).order('created_at', { ascending: true }),
          supabase.from('post_likes').select('user_id').eq('post_id', post.id),
        ]);
        return {
          ...post,
          comments: (commentsRes.data as (PostComment & { author: Profile })[]) || [],
          likes: (likesRes.data as { user_id: string }[]) || [],
        };
      })
    );
    setPosts(postsWithExtras);
  }, [targetId]);

  useEffect(() => { loadProfile(); loadPosts(); }, [loadProfile, loadPosts]);

  const handleSaveProfile = async (updates: Partial<Profile>) => {
    if (!myProfile) return;
    const { error } = await supabase.from('profiles').update(updates).eq('id', myProfile.id);
    if (error) {
      notify({ type: 'error', title: 'Update failed', message: error.message });
    } else {
      notify({ type: 'success', title: 'Profile updated' });
      await refreshProfile();
      loadProfile();
      setEditMode(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || !myProfile) return;
    const { error } = await supabase.from('posts').insert({
      author_id: myProfile.id,
      content: newPost,
    });
    if (error) {
      notify({ type: 'error', title: 'Failed to post', message: error.message });
    } else {
      setNewPost('');
      notify({ type: 'success', title: 'Post shared' });
      loadPosts();
    }
  };

  const handleLike = async (postId: string, hasLiked: boolean) => {
    if (!myProfile) return;
    if (hasLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', myProfile.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: myProfile.id });
    }
    loadPosts();
  };

  const handleComment = async (postId: string, content: string) => {
    if (!myProfile || !content.trim()) return;
    await supabase.from('post_comments').insert({ post_id: postId, author_id: myProfile.id, content });
    loadPosts();
  };

  const handleDeletePost = async (postId: string) => {
    await supabase.from('posts').delete().eq('id', postId);
    loadPosts();
    notify({ type: 'success', title: 'Post deleted' });
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="p-8"><Skeleton className="h-96" /></div>
      </PageTransition>
    );
  }

  if (!profile) {
    return (
      <PageTransition>
        <EmptyState icon={<ProfileIcon />} title="Profile not found" description="This profile may have been removed." />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Cover + Profile header */}
        <FadeIn>
          <div className="card overflow-hidden">
            {/* Cover */}
            <div className="relative h-48 sm:h-64 bg-gradient-to-br from-brand-600 via-accent-500 to-brand-700">
              {profile.cover_url && (
                <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
              )}
              {isOwn && (
                <button className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/20 backdrop-blur-md text-white text-sm font-medium hover:bg-white/30 transition-colors">
                  <Camera className="w-4 h-4" /> Edit Cover
                </button>
              )}
            </div>

            {/* Profile info */}
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16">
                <div className="relative">
                  <Avatar src={profile.avatar_url} name={profile.full_name} size="2xl" ring />
                  {profile.is_active && <span className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-success-500 border-4 border-white" />}
                  {isOwn && (
                    <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-md hover:bg-brand-700 transition-colors border-2 border-white">
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex-1 sm:pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold font-display text-ink-900">{profile.full_name || 'User'}</h1>
                    <Badge variant="brand" className="capitalize">{profile.role}</Badge>
                  </div>
                  <p className="text-ink-600 mt-1">{profile.position || 'Employee'} {profile.bio && `· ${profile.bio}`}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-ink-400">
                    {profile.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.address}</span>}
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Joined {formatDate(profile.created_at)}</span>
                  </div>
                </div>

                <div className="flex gap-2 sm:pb-2">
                  {isOwn ? (
                    <button onClick={() => setEditMode(true)} className="btn-primary">
                      <Edit3 className="w-4 h-4" /> Edit Profile
                    </button>
                  ) : (
                    <>
                      <button onClick={() => navigate('/app/messenger')} className="btn-primary">
                        <MessageSquare className="w-4 h-4" /> Message
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Bio / Skills / Experience */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* About */}
          <FadeIn delay={0.1} className="card p-6">
            <h3 className="font-semibold text-ink-900 mb-3">About</h3>
            <p className="text-sm text-ink-600 leading-relaxed">{profile.bio || 'No bio added yet.'}</p>

            <div className="mt-4 space-y-2 text-sm">
              {profile.email && <div className="flex items-center gap-2 text-ink-500"><Mail className="w-4 h-4" /> {profile.email}</div>}
              {profile.phone && <div className="flex items-center gap-2 text-ink-500"><Phone className="w-4 h-4" /> {profile.phone}</div>}
              {profile.address && <div className="flex items-center gap-2 text-ink-500"><MapPin className="w-4 h-4" /> {profile.address}</div>}
            </div>
          </FadeIn>

          {/* Skills */}
          <FadeIn delay={0.2} className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-ink-900">Skills</h3>
              {isOwn && (
                <button onClick={() => setShowSkills(true)} className="text-xs text-brand-600 hover:text-brand-700 font-medium">+ Add</button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.skills.length === 0 ? (
                <p className="text-sm text-ink-400">No skills added yet.</p>
              ) : (
                profile.skills.map((skill, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Badge variant="info">{skill}</Badge>
                  </motion.div>
                ))
              )}
            </div>

            {profile.certifications.length > 0 && (
              <>
                <h4 className="font-medium text-ink-700 mt-5 mb-2 text-sm flex items-center gap-2"><Award className="w-4 h-4 text-warning-500" /> Certifications</h4>
                <div className="space-y-1">
                  {profile.certifications.map((c, i) => (
                    <p key={i} className="text-sm text-ink-600 flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5 text-ink-400" /> {c}</p>
                  ))}
                </div>
              </>
            )}

            {profile.achievements.length > 0 && (
              <>
                <h4 className="font-medium text-ink-700 mt-5 mb-2 text-sm flex items-center gap-2"><Award className="w-4 h-4 text-success-500" /> Achievements</h4>
                <div className="space-y-1">
                  {profile.achievements.map((a, i) => (
                    <p key={i} className="text-sm text-ink-600 flex items-center gap-2"><Award className="w-3.5 h-3.5 text-ink-400" /> {a}</p>
                  ))}
                </div>
              </>
            )}
          </FadeIn>

          {/* Experience */}
          <FadeIn delay={0.3} className="card p-6">
            <h3 className="font-semibold text-ink-900 mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Experience</h3>
            {profile.experience.length === 0 ? (
              <p className="text-sm text-ink-400">No experience added yet.</p>
            ) : (
              <div className="space-y-4">
                {profile.experience.map((exp: ExperienceItem, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="border-l-2 border-ink-200 pl-4"
                  >
                    <p className="font-medium text-ink-900 text-sm">{exp.title}</p>
                    <p className="text-xs text-ink-500">{exp.company}</p>
                    <p className="text-xs text-ink-400 mt-0.5">{exp.startDate} — {exp.endDate || 'Present'}</p>
                    {exp.description && <p className="text-sm text-ink-600 mt-1">{exp.description}</p>}
                  </motion.div>
                ))}
              </div>
            )}
          </FadeIn>
        </div>

        {/* Posts section */}
        <FadeIn delay={0.2}>
          <div className="card p-6">
            <h3 className="font-semibold text-ink-900 mb-4">Posts</h3>

            {/* Create post */}
            {isOwn && (
              <div className="flex gap-3 mb-6">
                <Avatar src={myProfile?.avatar_url} name={myProfile?.full_name} size="md" />
                <div className="flex-1">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Share an update..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-ink-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                  />
                  <div className="flex justify-end mt-2">
                    <button onClick={handleCreatePost} disabled={!newPost.trim()} className="btn-primary disabled:opacity-50">
                      <Send className="w-4 h-4" /> Post
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Posts list */}
            {posts.length === 0 ? (
              <EmptyState icon={<MessageSquare className="w-8 h-8" />} title="No posts yet" description="Share your first post to get started." />
            ) : (
              <div className="space-y-4">
                {posts.map((post) => {
                  const hasLiked = post.likes.some(l => l.user_id === myProfile?.id);
                  return <PostCard key={post.id} post={post} hasLiked={hasLiked} onLike={() => handleLike(post.id, hasLiked)} onComment={(c) => handleComment(post.id, c)} onDelete={isOwn ? () => handleDeletePost(post.id) : undefined} />;
                })}
              </div>
            )}
          </div>
        </FadeIn>
      </div>

      {/* Edit profile modal */}
      <EditProfileModal open={editMode} onClose={() => setEditMode(false)} profile={profile} onSave={handleSaveProfile} />
      <SkillsModal open={showSkills} onClose={() => setShowSkills(false)} skills={profile.skills} onSave={(skills) => handleSaveProfile({ skills })} />
    </PageTransition>
  );
}

function PostCard({ post, hasLiked, onLike, onComment, onDelete }: {
  post: Post & { author: Profile; comments: (PostComment & { author: Profile })[]; likes: { user_id: string }[] };
  hasLiked: boolean;
  onLike: () => void;
  onComment: (content: string) => void;
  onDelete?: () => void;
}) {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border border-ink-200 hover:border-ink-300 transition-colors"
    >
      <div className="flex items-start gap-3">
        <Avatar src={post.author.avatar_url} name={post.author.full_name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-ink-900 text-sm">{post.author.full_name}</p>
              <p className="text-xs text-ink-400">{relativeTime(post.created_at)}</p>
            </div>
            {onDelete && (
              <button onClick={onDelete} className="p-1.5 rounded-lg text-ink-400 hover:text-error-500 hover:bg-error-50 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-ink-700 mt-2 whitespace-pre-wrap">{post.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3">
            <button onClick={onLike} className={cn('flex items-center gap-1.5 text-xs font-medium transition-colors', hasLiked ? 'text-brand-600' : 'text-ink-400 hover:text-ink-600')}>
              <ThumbsUp className={cn('w-4 h-4', hasLiked && 'fill-brand-600')} /> {post.likes.length}
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-ink-600 transition-colors">
              <MessageSquare className="w-4 h-4" /> {post.comments.length}
            </button>
            <button className="flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-ink-600 transition-colors">
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>

          {/* Comments */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2"
              >
                {post.comments.map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <Avatar src={c.author.avatar_url} name={c.author.full_name} size="xs" />
                    <div className="flex-1 bg-ink-50 rounded-xl px-3 py-2">
                      <p className="text-xs font-medium text-ink-900">{c.author.full_name}</p>
                      <p className="text-sm text-ink-600">{c.content}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && commentText.trim()) { onComment(commentText); setCommentText(''); } }}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 rounded-xl bg-ink-50 border border-ink-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                  />
                  <button onClick={() => { if (commentText.trim()) { onComment(commentText); setCommentText(''); } }} className="px-3 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function EditProfileModal({ open, onClose, profile, onSave }: {
  open: boolean;
  onClose: () => void;
  profile: Profile;
  onSave: (updates: Partial<Profile>) => void;
}) {
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [position, setPosition] = useState(profile.position || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [address, setAddress] = useState(profile.address || '');

  useEffect(() => {
    if (open) {
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
      setPosition(profile.position || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
    }
  }, [open, profile]);

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Full Name</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Position</label>
          <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} className="input-field" placeholder="e.g. Senior Developer" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="input-field resize-none" placeholder="Tell us about yourself..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Phone</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Address</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="input-field" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSave({ full_name: fullName, bio, position, phone, address })} className="btn-primary">Save Changes</button>
        </div>
      </div>
    </Modal>
  );
}

function SkillsModal({ open, onClose, skills, onSave }: {
  open: boolean;
  onClose: () => void;
  skills: string[];
  onSave: (skills: string[]) => void;
}) {
  const [skillList, setSkillList] = useState<string[]>(skills);
  const [input, setInput] = useState('');

  useEffect(() => { if (open) setSkillList(skills); }, [open, skills]);

  const addSkill = () => {
    if (input.trim() && !skillList.includes(input.trim())) {
      setSkillList([...skillList, input.trim()]);
      setInput('');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Manage Skills" size="sm">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
            placeholder="Add a skill..."
            className="input-field"
          />
          <button onClick={addSkill} className="btn-primary shrink-0"><Plus className="w-4 h-4" /></button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skillList.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-100 text-accent-700 text-sm">
              {s}
              <button onClick={() => setSkillList(skillList.filter((_, idx) => idx !== i))} className="hover:text-error-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSave(skillList)} className="btn-primary">Save</button>
        </div>
      </div>
    </Modal>
  );
}

function ProfileIcon() {
  return <Linkedin className="w-8 h-8" />;
}
