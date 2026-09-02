import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CheckSquare, FolderKanban, Users, Building2,
  CalendarDays, Bell, MessageSquare, Wallet, Settings, FileText,
  ChevronLeft, Sparkles, UserCircle, Search, LogOut, X, ShieldCheck
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useSiteBranding } from '@/lib/hooks';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/types';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
  { label: 'Tasks', icon: CheckSquare, path: '/app/tasks' },
  { label: 'Projects', icon: FolderKanban, path: '/app/projects' },
  { label: 'Team', icon: Users, path: '/app/team' },
  { label: 'Department', icon: Building2, path: '/app/department' },
  { label: 'Schedule', icon: CalendarDays, path: '/app/schedule' },
  { label: 'Notice', icon: Bell, path: '/app/notice' },
  { label: 'Messenger', icon: MessageSquare, path: '/app/messenger' },
  { label: 'Transaction', icon: Wallet, path: '/app/transaction' },
  { label: 'Application', icon: FileText, path: '/app/application' },
  { label: 'Profile', icon: UserCircle, path: '/app/profile' },
  { label: 'Settings', icon: Settings, path: '/app/settings' },
];

const adminItems: NavItem[] = [
  { label: 'Admin Panel', icon: ShieldCheck, path: '/app/admin', roles: ['admin'] },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const { profile, logout } = useAuth();
  const { branding } = useSiteBranding();
  const navigate = useNavigate();
  const role = profile?.role || 'employee';

  const visibleItems = navItems.filter(item => !item.roles || item.roles.includes(role));
  const adminNav = adminItems.filter(item => !item.roles || item.roles.includes(role));

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink-950/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        className={`fixed lg:sticky top-0 left-0 h-screen z-40 lg:z-10
                    bg-white border-r border-ink-200/60 flex flex-col
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-ink-100 shrink-0">
          {branding.logoUrl ? (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-white border border-ink-200"
            >
              <img src={branding.logoUrl} alt={branding.name} className="w-full h-full object-contain p-0.5" />
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shrink-0 shadow-glow"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <h1 className="text-lg font-bold font-display text-ink-900 leading-none">{branding.name}</h1>
                <p className="text-[10px] text-ink-400 mt-0.5 uppercase tracking-wider">{branding.subtitle}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden p-2 rounded-lg hover:bg-ink-100"
          >
            <X className="w-5 h-5 text-ink-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
          {visibleItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn('nav-item group', isActive ? 'nav-item-active' : 'nav-item-inactive')
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-brand-600"
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                  <motion.div
                    initial={false}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <item.icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-brand-600' : 'text-ink-400 group-hover:text-ink-600')} />
                  </motion.div>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {/* Animated triangle indicator */}
                  {isActive && !collapsed && (
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="ml-auto"
                    >
                      <div className="w-0 h-0 border-l-[5px] border-l-brand-600 border-y-[4px] border-y-transparent" />
                    </motion.div>
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* Admin section */}
          {adminNav.length > 0 && (
            <>
              <div className="pt-4 pb-2">
                {!collapsed && <p className="px-3 text-[10px] font-semibold text-ink-400 uppercase tracking-wider">Administration</p>}
              </div>
              {adminNav.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => cn('nav-item group', isActive ? 'nav-item-active' : 'nav-item-inactive')}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="activeNavIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-brand-600"
                        />
                      )}
                      <item.icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-brand-600' : 'text-ink-400 group-hover:text-ink-600')} />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="truncate">
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-ink-100 p-3 shrink-0">
          <div className={cn('flex items-center gap-3 rounded-xl p-2 hover:bg-ink-50 cursor-pointer transition-colors', collapsed && 'justify-center')}>
            <Avatar src={profile?.avatar_url} name={profile?.full_name} size="sm" />
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                  onClick={() => navigate('/app/profile')}
                >
                  <p className="text-sm font-medium text-ink-900 truncate">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-ink-400 capitalize">{role}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {!collapsed && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleSignOut}
                  className="p-2 rounded-lg text-ink-400 hover:text-error-500 hover:bg-error-50 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
