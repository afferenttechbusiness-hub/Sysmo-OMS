import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles, Building2, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useAuth, ADMIN_EMAIL } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Animations';
import type { Department } from '@/lib/types';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  const isAdminEmail = email.trim().toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    supabase.from('departments').select('*').order('name').then(({ data }) => {
      if (data) setDepartments(data as Department[]);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!departmentId) {
      setError('Please select your department');
      return;
    }
    if (isAdminEmail && !password) {
      setError('Please enter the admin password');
      return;
    }

    setLoading(true);
    const { error } = await login(email, departmentId, password || undefined);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate('/app/dashboard');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden mesh-bg flex items-center justify-center p-4">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { size: 400, x: '10%', y: '20%', delay: 0, color: 'rgba(59, 130, 246, 0.15)' },
          { size: 300, x: '70%', y: '15%', delay: 2, color: 'rgba(6, 182, 212, 0.12)' },
          { size: 350, x: '60%', y: '70%', delay: 1, color: 'rgba(59, 130, 246, 0.1)' },
          { size: 250, x: '15%', y: '75%', delay: 3, color: 'rgba(34, 211, 238, 0.1)' },
        ].map((orb, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl"
            style={{ width: orb.size, height: orb.size, left: orb.x, top: orb.y, background: orb.color }}
            animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.1, 0.95, 1] }}
            transition={{ duration: 12 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: orb.delay }}
          />
        ))}
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/20"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ y: [0, -30, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 4 }}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-glow"
          >
            <Sparkles className="w-7 h-7 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold font-display text-white tracking-tight">Sysmobyte</h1>
            <p className="text-xs text-ink-400">Office Management System</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-dark rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-1">Sign in to your workspace</h2>
          <p className="text-sm text-ink-400 mb-6">Enter your email and select your department to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-ink-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition-all"
                  required
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-1.5">Department</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500 pointer-events-none z-10" />
                <select
                  value={departmentId}
                  onChange={(e) => { setDepartmentId(e.target.value); setError(null); }}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="" className="bg-ink-900">Select your department...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id} className="bg-ink-900">{d.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500 pointer-events-none" />
              </div>
            </div>

            {/* Password — only for admin email */}
            <AnimatePresence>
              {isAdminEmail && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-sm font-medium text-brand-300 mb-1.5">Admin Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                        placeholder="Enter admin password"
                        className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-brand-500/30 text-white placeholder-ink-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition-all"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-brand-400/70 mt-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Admin access detected — password required
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="px-4 py-3 rounded-xl bg-error-500/10 border border-error-500/20 text-error-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 text-white font-medium
                       hover:from-brand-500 hover:to-accent-500 active:scale-[0.98] transition-all
                       focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2 focus:ring-offset-ink-900
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-ink-500 mt-6">
            No registration needed — just enter your email and department to join.
          </p>
        </div>

        <p className="text-center text-xs text-ink-500 mt-6">
          © 2026 Sysmobyte. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
