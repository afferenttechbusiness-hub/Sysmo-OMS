import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles, Building2, ChevronDown, Eye, EyeOff, ShieldCheck, Activity, Globe2 } from 'lucide-react';
import { useAuth, ADMIN_EMAIL } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useSiteBranding } from '@/lib/hooks';
import { Spinner } from '@/components/ui/Animations';
import type { Department } from '@/lib/types';

const particles = Array.from({ length: 26 }, (_, index) => ({
  left: `${(index * 37) % 101}%`,
  top: `${(index * 61) % 97}%`,
  size: index % 4 === 0 ? 3 : 2,
  delay: (index % 7) * 0.7,
  duration: 5 + (index % 5),
}));

export function LoginPage() {
  const { login } = useAuth();
  const { branding } = useSiteBranding();
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

  const handleSubmit = async (e: FormEvent) => {
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
    const { error: loginError } = await login(email, departmentId, password || undefined);
    if (loginError) {
      setError(loginError);
      setLoading(false);
    } else {
      navigate('/app/dashboard');
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink-950 text-white">
      <div className="cinematic-backdrop" aria-hidden="true">
        <div className="cinematic-grid" />
        <motion.div className="light-orb light-orb-blue" animate={{ x: [0, 80, -30, 0], y: [0, -35, 50, 0], scale: [1, 1.12, 0.94, 1] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="light-orb light-orb-cyan" animate={{ x: [0, -70, 40, 0], y: [0, 55, -30, 0], scale: [1, 0.9, 1.16, 1] }} transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
        <motion.div className="light-orb light-orb-slate" animate={{ x: [0, 40, -55, 0], y: [0, 30, -45, 0] }} transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
        <div className="cinematic-scanline" />
        {particles.map((particle, index) => (
          <motion.span
            key={index}
            className="cinematic-particle"
            style={{ left: particle.left, top: particle.top, width: particle.size, height: particle.size }}
            animate={{ y: [0, -28, 0], opacity: [0.08, 0.75, 0.08], scale: [1, 1.5, 1] }}
            transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1440px] items-center px-5 py-8 sm:px-8 lg:px-16">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <motion.section
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="hidden max-w-xl lg:block"
          >
            <div className="mb-10 flex items-center gap-3">
              <BrandMark logoUrl={branding.logoUrl} name={branding.name} />
              <div>
                <p className="text-lg font-semibold tracking-tight text-white">{branding.name}</p>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">{branding.subtitle}</p>
              </div>
            </div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" /> Enterprise workspace
            </div>
            <h1 className="max-w-lg text-5xl font-semibold leading-[1.08] tracking-[-0.04em] text-white xl:text-6xl">
              Make every workday <span className="premium-gradient-text">move smarter.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/55">
              One calm, connected workspace for people, projects, communication and the decisions that keep your organization moving.
            </p>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
              <TrustMetric icon={<Activity />} value="Live" label="Operations" />
              <TrustMetric icon={<ShieldCheck />} value="Secure" label="Workspace" />
              <TrustMetric icon={<Globe2 />} value="Unified" label="Teams" />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-[480px] lg:ml-auto"
          >
            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
              <BrandMark logoUrl={branding.logoUrl} name={branding.name} />
              <div>
                <p className="text-xl font-semibold tracking-tight text-white">{branding.name}</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{branding.subtitle}</p>
              </div>
            </div>

            <div className="premium-login-card rounded-[28px] p-6 sm:p-9">
              <div className="mb-8">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-200/15 bg-cyan-200/10 text-cyan-200">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-semibold tracking-[-0.025em] text-white">Welcome back</h2>
                <p className="mt-2 text-sm leading-6 text-white/45">Sign in to continue to your workspace.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <FieldLabel label="Work email">
                  <div className="premium-input-wrap">
                    <Mail className="premium-input-icon" />
                    <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} placeholder="you@company.com" className="premium-input" required />
                  </div>
                </FieldLabel>

                <FieldLabel label="Department">
                  <div className="premium-input-wrap">
                    <Building2 className="premium-input-icon" />
                    <select value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setError(null); }} className="premium-input appearance-none" required>
                      <option value="" className="bg-ink-900">Select your department...</option>
                      {departments.map((department) => <option key={department.id} value={department.id} className="bg-ink-900">{department.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-white/35" />
                  </div>
                </FieldLabel>

                <AnimatePresence>
                  {isAdminEmail && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <FieldLabel label="Admin password" accent>
                        <div className="premium-input-wrap">
                          <Lock className="premium-input-icon" />
                          <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} placeholder="Enter admin password" className="premium-input pr-12" autoFocus />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-white/35 transition-colors hover:text-white/80">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FieldLabel>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </motion.div>
                )}

                <button type="submit" disabled={loading} className="premium-submit group">
                  {loading ? <Spinner size="sm" /> : <><span>Enter workspace</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
                </button>
              </form>

              <div className="mt-7 flex items-start gap-2 border-t border-white/[0.07] pt-5 text-xs leading-5 text-white/35">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300/60" />
                <span>No registration needed. Use your work email and department to continue.</span>
              </div>
            </div>
            <p className="mt-6 text-center text-xs text-white/25">© 2026 {branding.name}. All rights reserved.</p>
          </motion.section>
        </div>
      </div>
    </main>
  );
}

function BrandMark({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  return logoUrl ? (
    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-1 shadow-2xl">
      <img src={logoUrl} alt={name} className="h-full w-full object-contain" />
    </div>
  ) : (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-[0_12px_35px_rgba(14,165,233,0.35)]">
      <Sparkles className="h-6 w-6 text-white" />
    </div>
  );
}

function TrustMetric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3 backdrop-blur-sm">
      <div className="mb-2 text-cyan-200/70 [&>svg]:h-4 [&>svg]:w-4">{icon}</div>
      <p className="text-sm font-medium text-white/80">{value}</p>
      <p className="mt-0.5 text-[11px] text-white/35">{label}</p>
    </div>
  );
}

function FieldLabel({ label, accent = false, children }: { label: string; accent?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold uppercase tracking-[0.12em] ${accent ? 'text-cyan-200/80' : 'text-white/55'}`}>{label}</span>
      {children}
    </label>
  );
}
