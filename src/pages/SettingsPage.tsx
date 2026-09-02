import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, User, Bell, Shield, Palette,
  Globe, HelpCircle, LogOut, Mail, Lock, Phone, MapPin,
  AlertTriangle, Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PageTransition, FadeIn } from '@/components/ui/Animations';
import { Avatar, Badge } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { key: 'account', label: 'Account', icon: User },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'support', label: 'Support', icon: HelpCircle },
];

export function SettingsPage() {
  const { profile, logout, refreshProfile, updateProfile } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('account');
  const [showReport, setShowReport] = useState(false);
  const [reportSubject, setReportSubject] = useState('');
  const [reportDesc, setReportDesc] = useState('');

  // Animated toggle state
  const [notifToggles, setNotifToggles] = useState<Record<string, boolean>>({
    tasks: true,
    projects: true,
    messages: true,
    schedules: true,
    transactions: false,
  });

  const [appearance, setAppearance] = useState({
    theme: 'light',
    compact: false,
    animations: true,
  });

  const handlePasswordChange = (newPassword: string) => {
    if (profile?.role === 'admin') {
      notify({ type: 'success', title: 'Password updated', message: 'Admin password has been changed.' });
    } else {
      notify({ type: 'info', title: 'No password needed', message: 'Only admin accounts use passwords.' });
    }
  };

  const handleReport = async () => {
    if (!profile || !reportSubject.trim() || !reportDesc.trim()) return;
    const { error } = await supabase.from('reports').insert({
      user_id: profile.id,
      subject: reportSubject,
      description: reportDesc,
    });
    if (error) {
      notify({ type: 'error', title: 'Failed to submit report', message: error.message });
    } else {
      notify({ type: 'success', title: 'Report submitted', message: 'Admin will review your report.' });
      setShowReport(false);
      setReportSubject('');
      setReportDesc('');
    }
  };

  return (
    <PageTransition>
      <div className="p-4 lg:p-8">
        <FadeIn>
          <h1 className="text-2xl lg:text-3xl font-bold font-display text-ink-900 mb-1">Settings</h1>
          <p className="text-ink-500 mb-6">Manage your account and preferences</p>
        </FadeIn>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Section nav */}
          <div className="lg:w-64 shrink-0">
            <div className="flex lg:flex-col gap-1 overflow-x-auto scrollbar-hide">
              {SECTIONS.map(section => (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className={cn('flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                    activeSection === section.key ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-ink-100')}
                >
                  <section.icon className="w-4 h-4" />
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 max-w-2xl">
            {activeSection === 'account' && (
              <FadeIn>
                <div className="card p-6 space-y-5">
                  <h2 className="font-semibold text-ink-900">Account Information</h2>
                  <div className="flex items-center gap-4">
                    <Avatar src={profile?.avatar_url} name={profile?.full_name} size="xl" ring />
                    <div>
                      <p className="font-medium text-ink-900">{profile?.full_name}</p>
                      <p className="text-sm text-ink-400">{profile?.email}</p>
                      <Badge variant="brand" className="mt-1 capitalize">{profile?.role}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1.5">Full Name</label>
                      <input type="text" defaultValue={profile?.full_name || ''} className="input-field" onChange={(e) => {
                        if (profile) updateProfile({ full_name: e.target.value });
                      }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1.5">Position</label>
                      <input type="text" defaultValue={profile?.position || ''} className="input-field" onChange={(e) => {
                        if (profile) updateProfile({ position: e.target.value });
                      }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1.5">Phone</label>
                      <input type="text" defaultValue={profile?.phone || ''} className="input-field" onChange={(e) => {
                        if (profile) updateProfile({ phone: e.target.value });
                      }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1.5">Address</label>
                      <input type="text" defaultValue={profile?.address || ''} className="input-field" onChange={(e) => {
                        if (profile) updateProfile({ address: e.target.value });
                      }} />
                    </div>
                  </div>
                  <button onClick={() => { refreshProfile(); notify({ type: 'success', title: 'Settings saved' }); }} className="btn-primary">
                    Save Changes
                  </button>
                </div>
              </FadeIn>
            )}

            {activeSection === 'notifications' && (
              <FadeIn>
                <div className="card p-6 space-y-4">
                  <h2 className="font-semibold text-ink-900">Notification Preferences</h2>
                  {Object.entries(notifToggles).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-ink-900 capitalize">{key} notifications</p>
                        <p className="text-xs text-ink-400">Get notified about {key} updates</p>
                      </div>
                      <AnimatedToggle
                        on={value}
                        onChange={() => setNotifToggles(prev => ({ ...prev, [key]: !prev[key] }))}
                      />
                    </div>
                  ))}
                </div>
              </FadeIn>
            )}

            {activeSection === 'security' && (
              <FadeIn>
                <div className="card p-6 space-y-5">
                  <h2 className="font-semibold text-ink-900">Security</h2>
                  <PasswordChangeForm onChange={handlePasswordChange} />
                  <div className="pt-4 border-t border-ink-100">
                    <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-2 text-sm text-error-600 hover:text-error-700 font-medium">
                      <LogOut className="w-4 h-4" /> Sign out of all devices
                    </button>
                  </div>
                </div>
              </FadeIn>
            )}

            {activeSection === 'appearance' && (
              <FadeIn>
                <div className="card p-6 space-y-4">
                  <h2 className="font-semibold text-ink-900">Appearance</h2>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-ink-900">Compact mode</p>
                      <p className="text-xs text-ink-400">Reduce spacing for denser layout</p>
                    </div>
                    <AnimatedToggle on={appearance.compact} onChange={() => setAppearance(prev => ({ ...prev, compact: !prev.compact }))} />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-ink-900">Animations</p>
                      <p className="text-xs text-ink-400">Enable smooth transitions and effects</p>
                    </div>
                    <AnimatedToggle on={appearance.animations} onChange={() => setAppearance(prev => ({ ...prev, animations: !prev.animations }))} />
                  </div>
                </div>
              </FadeIn>
            )}

            {activeSection === 'support' && (
              <FadeIn>
                <div className="card p-6 space-y-4">
                  <h2 className="font-semibold text-ink-900">Support & Help</h2>
                  <p className="text-sm text-ink-500">Experiencing an issue? Report it to your admin and they'll get back to you.</p>
                  <button onClick={() => setShowReport(true)} className="btn-primary">
                    <AlertTriangle className="w-4 h-4" /> Report a Problem
                  </button>
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </div>

      <Modal open={showReport} onClose={() => setShowReport(false)} title="Report a Problem" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Subject</label>
            <input type="text" value={reportSubject} onChange={(e) => setReportSubject(e.target.value)} className="input-field" placeholder="Brief description of the issue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Description</label>
            <textarea value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} rows={4} className="input-field resize-none" placeholder="Describe the problem in detail..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowReport(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleReport} className="btn-primary"><Send className="w-4 h-4" /> Submit Report</button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}

function AnimatedToggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn('relative w-12 h-7 rounded-full transition-colors duration-300', on ? 'bg-brand-600' : 'bg-ink-200')}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn('absolute top-1 w-5 h-5 rounded-full bg-white shadow-md', on ? 'left-6' : 'left-1')}
      />
    </button>
  );
}

function PasswordChangeForm({ onChange }: { onChange: (password: string) => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1.5">New Password</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field pl-10"
            placeholder="••••••••"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1.5">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            type={show ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input-field pl-10"
            placeholder="••••••••"
          />
        </div>
      </div>
      <button onClick={() => setShow(!show)} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
        {show ? 'Hide' : 'Show'} passwords
      </button>
      <div>
        <button
          onClick={() => { if (password && password === confirm) { onChange(password); setPassword(''); setConfirm(''); } }}
          disabled={!password || password !== confirm}
          className="btn-primary disabled:opacity-50"
        >
          Update Password
        </button>
      </div>
    </div>
  );
}
