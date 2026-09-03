import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Building2, ArrowRight, AlertCircle } from 'lucide-react';
import { useSaaSAuth } from '@/lib/saas-auth';
import { useSiteBranding } from '@/lib/hooks';
import { Spinner } from '@/components/ui/Animations';

export function SaaSSignIn() {
  const { signIn } = useSaaSAuth();
  const { branding } = useSiteBranding();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    setLoading(false);
    if (signInError) { setError(signInError); return; }
    navigate('/saas/dashboard');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950 text-white">
      <div className="cinematic-backdrop" aria-hidden="true">
        <div className="cinematic-grid" />
        <motion.div className="light-orb light-orb-blue" animate={{ x: [0, 50, -20, 0], y: [0, -25, 35, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="light-orb light-orb-cyan" animate={{ x: [0, -40, 25, 0], y: [0, 30, -20, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-md">
          <Link to="/saas" className="mb-8 flex items-center justify-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight">{branding.name}</span>
          </Link>

          <div className="premium-login-card rounded-[28px] p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.025em]">Welcome back</h2>
            <p className="mt-2 text-sm text-white/45">Sign in to your SaaS dashboard.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Email</label>
                <div className="premium-input-wrap">
                  <Mail className="premium-input-icon" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="premium-input" required />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Password</label>
                <div className="premium-input-wrap">
                  <Lock className="premium-input-icon" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="premium-input" required />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="premium-submit group w-full">
                {loading ? <Spinner size="sm" /> : <><span>Sign in</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-white/35">
              Don't have an account? <Link to="/saas/signup" className="font-medium text-cyan-200 hover:text-cyan-100">Sign up</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
