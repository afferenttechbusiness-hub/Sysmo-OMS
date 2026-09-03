import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building2, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSaaSAuth } from '@/lib/saas-auth';
import { useSiteBranding } from '@/lib/hooks';
import { Spinner } from '@/components/ui/Animations';

export function SaaSSignUp() {
  const { signUp } = useSaaSAuth();
  const { branding } = useSiteBranding();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error: signUpError } = await signUp(email, password, fullName, companyName || undefined);
    setLoading(false);
    if (signUpError) { setError(signUpError); return; }
    setSuccess(true);
    setTimeout(() => navigate('/saas/signin'), 2500);
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
            <h2 className="text-2xl font-semibold tracking-[-0.025em]">Create your account</h2>
            <p className="mt-2 text-sm text-white/45">Start your SaaS journey in seconds.</p>

            {success ? (
              <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-green-300/20 bg-green-400/10 p-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-300" />
                <p className="text-sm text-green-200">Account created successfully! Redirecting to sign in...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Full name</label>
                  <div className="premium-input-wrap">
                    <User className="premium-input-icon" />
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="premium-input" required />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Company name <span className="text-white/25 normal-case">(optional)</span></label>
                  <div className="premium-input-wrap">
                    <Building2 className="premium-input-icon" />
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Inc." className="premium-input" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Work email</label>
                  <div className="premium-input-wrap">
                    <Mail className="premium-input-icon" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="premium-input" required />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Password</label>
                  <div className="premium-input-wrap">
                    <Lock className="premium-input-icon" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" className="premium-input" required />
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}
                <button type="submit" disabled={loading} className="premium-submit group w-full">
                  {loading ? <Spinner size="sm" /> : <><span>Create account</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-xs text-white/35">
              Already have an account? <Link to="/saas/signin" className="font-medium text-cyan-200 hover:text-cyan-100">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
