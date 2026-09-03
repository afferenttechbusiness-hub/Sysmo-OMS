import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Menu, ChevronLeft, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/ui/Avatar';
import { cn, relativeTime } from '@/lib/utils';
import type { Notification, Profile, Department, Project, Notice } from '@/lib/types';
import { useParams } from 'react-router-dom';

interface TopbarProps {
  onMenuClick: () => void;
  onCollapse: () => void;
  collapsed: boolean;
}

export function Topbar({ onMenuClick, onCollapse, collapsed }: TopbarProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const basePath = slug ? `/t/${slug}/app` : '/app';
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchResults, setSearchResults] = useState<{
    employees: Profile[];
    departments: Department[];
    projects: Project[];
    notices: Notice[];
  }>({ employees: [], departments: [], projects: [], notices: [] });

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile?.id}` },
        () => loadNotifications()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ employees: [], departments: [], projects: [], notices: [] });
      return;
    }
    const timeout = setTimeout(() => doSearch(searchQuery), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadNotifications = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const doSearch = async (q: string) => {
    const [emp, dept, proj, not] = await Promise.all([
      supabase.from('profiles').select('*').ilike('full_name', `%${q}%`).limit(5),
      supabase.from('departments').select('*').ilike('name', `%${q}%`).limit(5),
      supabase.from('projects').select('*').ilike('title', `%${q}%`).limit(5),
      supabase.from('notices').select('*').ilike('title', `%${q}%`).limit(5),
    ]);
    setSearchResults({
      employees: (emp.data as Profile[]) || [],
      departments: (dept.data as Department[]) || [],
      projects: (proj.data as Project[]) || [],
      notices: (not.data as Notice[]) || [],
    });
  };

  const markAllRead = async () => {
    if (!profile?.id) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).neq('is_read', true);
    loadNotifications();
  };

  const hasResults = searchResults.employees.length + searchResults.departments.length + searchResults.projects.length + searchResults.notices.length > 0;

  return (
    <header className="shrink-0 h-16 bg-white/80 backdrop-blur-xl border-b border-ink-200/60 flex items-center gap-3 px-4 lg:px-6 z-20 relative">
      {/* Collapse button */}
      <button
        onClick={onCollapse}
        className="hidden lg:flex p-2 rounded-lg hover:bg-ink-100 transition-colors"
      >
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronLeft className="w-5 h-5 text-ink-500" />
        </motion.div>
      </button>

      {/* Mobile menu */}
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-ink-100">
        <Menu className="w-5 h-5 text-ink-600" />
      </button>

      {/* Search */}
      <div ref={searchRef} className="relative flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search employees, departments, projects, notices..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ink-100/70 border border-transparent text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:bg-white focus:border-ink-200 focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-ink-200">
              <X className="w-4 h-4 text-ink-400" />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        <AnimatePresence>
          {searchOpen && searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-card-hover border border-ink-200 max-h-[70vh] overflow-y-auto z-50"
            >
              {!hasResults ? (
                <div className="p-6 text-center text-sm text-ink-400">No results found for "{searchQuery}"</div>
              ) : (
                <div className="p-2">
                  {searchResults.employees.length > 0 && (
                    <SearchSection title="Employees">
                      {searchResults.employees.map((emp) => (
                        <SearchItem key={emp.id} onClick={() => { navigate(`${basePath}/profile/${emp.id}`); setSearchOpen(false); setSearchQuery(''); }}>
                          <Avatar src={emp.avatar_url} name={emp.full_name} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-ink-900">{emp.full_name}</p>
                            <p className="text-xs text-ink-400">{emp.position || emp.email}</p>
                          </div>
                          <span className={cn('ml-auto w-2 h-2 rounded-full', emp.is_active ? 'bg-success-500' : 'bg-ink-300')} />
                        </SearchItem>
                      ))}
                    </SearchSection>
                  )}
                  {searchResults.departments.length > 0 && (
                    <SearchSection title="Departments">
                      {searchResults.departments.map((d) => (
                        <SearchItem key={d.id} onClick={() => { navigate(`${basePath}/department`); setSearchOpen(false); setSearchQuery(''); }}>
                          <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600 font-semibold text-xs">
                            {d.name.slice(0, 2).toUpperCase()}
                          </div>
                          <p className="text-sm font-medium text-ink-900">{d.name}</p>
                        </SearchItem>
                      ))}
                    </SearchSection>
                  )}
                  {searchResults.projects.length > 0 && (
                    <SearchSection title="Projects">
                      {searchResults.projects.map((p) => (
                        <SearchItem key={p.id} onClick={() => { navigate(`${basePath}/projects`); setSearchOpen(false); setSearchQuery(''); }}>
                          <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center text-accent-600">
                            <FolderIcon />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-ink-900">{p.title}</p>
                            <p className="text-xs text-ink-400 capitalize">{p.status.replace('_', ' ')}</p>
                          </div>
                        </SearchItem>
                      ))}
                    </SearchSection>
                  )}
                  {searchResults.notices.length > 0 && (
                    <SearchSection title="Notices">
                      {searchResults.notices.map((n) => (
                        <SearchItem key={n.id} onClick={() => { navigate(`${basePath}/notice`); setSearchOpen(false); setSearchQuery(''); }}>
                          <div className="w-8 h-8 rounded-lg bg-warning-100 flex items-center justify-center text-warning-600">
                            <BellIcon />
                          </div>
                          <p className="text-sm font-medium text-ink-900">{n.title}</p>
                        </SearchItem>
                      ))}
                    </SearchSection>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notifications */}
      <div ref={notifRef} className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2.5 rounded-xl hover:bg-ink-100 transition-colors"
        >
          <Bell className="w-5 h-5 text-ink-600" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1 right-1 w-4 h-4 rounded-full bg-error-500 text-white text-[10px] font-bold flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </button>

        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-card-hover border border-ink-200 max-h-[70vh] overflow-hidden z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
                <h3 className="font-semibold text-ink-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-ink-400">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn('flex gap-3 px-4 py-3 border-b border-ink-50 hover:bg-ink-50 cursor-pointer transition-colors', !n.is_read && 'bg-brand-50/30')}
                    >
                      <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', n.is_read ? 'bg-transparent' : 'bg-brand-500')} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-900">{n.title}</p>
                        {n.message && <p className="text-xs text-ink-500 mt-0.5">{n.message}</p>}
                        <p className="text-[10px] text-ink-400 mt-1">{relativeTime(n.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile avatar */}
      <button onClick={() => navigate(`${basePath}/profile`)} className="shrink-0">
        <Avatar src={profile?.avatar_url} name={profile?.full_name} size="md" ring />
      </button>
    </header>
  );
}

function SearchSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-3 py-1.5 text-[10px] font-semibold text-ink-400 uppercase tracking-wider">{title}</p>
      {children}
    </div>
  );
}

function SearchItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-ink-100 transition-colors text-left">
      {children}
    </button>
  );
}

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  );
}
