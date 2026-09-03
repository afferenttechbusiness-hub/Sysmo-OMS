import { useState, useEffect, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Building2, ChevronDown, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Animations';
import type { Department, Tenant } from '@/lib/types';

const TENANT_SESSION_KEY = 'sysmobyte_tenant_session';

export function TenantLoginPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase.from('tenants').select('*').eq('slug', slug).maybeSingle().then(({ data }) => {
      setTenant(data as Tenant | null);
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    if (!tenant) return;
    supabase.from('departments').select('*').eq('tenant_id', tenant.id).order('name').then(({ data }) => {
      setDepartments((data as Department[]) || []);
    });
  }, [tenant]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!tenant) return;
    if (!email.trim()) { setError('Please enter your email'); return; }
    if (!departmentId) { setError('Please select your department'); return; }

    setSubmitting(true);
    const normalizedEmail = email.trim().toLowerCase();

    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('tenant_id', tenant.id)
      .maybeSingle();

    let profile;
    if (existing) {
      if (departmentId && existing.department_id !== departmentId) {
        await supabase.from('profiles').update({ department_id: departmentId }).eq('id', existing.id);
        existing.department_id = departmentId;
      }
      profile = existing;
    } else {
      const fullName = normalizedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const { data: created, error: createError } = await supabase
        .from('profiles')
        .insert({ email: normalizedEmail, full_name: fullName, role: 'employee', department_id: departmentId, tenant_id: tenant.id })
        .select('*')
        .single();
      if (createError) { setError(createError.message); setSubmitting(false); return; }
      profile = created;
    }

    const session = { ...profile, tenant_slug: slug, tenant_id: tenant.id };
    localStorage.setItem(TENANT_SESSION_KEY, JSON.stringify(session));
    setSubmitting(false);
    navigate(`/t/${slug}/app/dashboard`);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-ink-950"><Spinner size="lg" /></div>;
  }
  if (!tenant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-950 text-white">
        <p className="text-lg font-medium">Workspace not found</p>
        <button onClick={() => navigate('/saas/dashboard')} className="flex items-center gap-2 text-sm text-cyan-200 hover:text-cyan-100"><ArrowLeft className="h-4 w-4" /> Back to dashboard</button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950 text-white">
      <div className="cinematic-backdrop" aria-hidden="true">
        <div className="cinematic-grid" />
        <motion.div className="light-orb light-orb-blue" animate={{ x: [0, 50, -20, 0], y: [0, -25, 35, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="light-orb light-orb-cyan" animate={{ x: [0, -40, 25, 0], y: [0, 30, -20, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg"><Building2 className="h-6 w-6 text-white" /></div>
            <h1 className="text-2xl font-semibold tracking-tight">{tenant.name}</h1>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/40">Workspace sign in</p>
          </div>

          <div className="premium-login-card rounded-[28px] p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Work email</label>
                <div className="premium-input-wrap">
                  <Mail className="premium-input-icon" />
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} placeholder="you@company.com" className="premium-input" required />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Department</label>
                <div className="premium-input-wrap">
                  <Building2 className="premium-input-icon" />
                  <select value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setError(null); }} className="premium-input appearance-none" required>
                    <option value="" className="bg-ink-900">Select department...</option>
                    {departments.map((d) => <option key={d.id} value={d.id} className="bg-ink-900">{d.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-white/35" />
                </div>
              </div>
              {error && <div className="flex items-center gap-2 rounded-xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</div>}
              <button type="submit" disabled={submitting} className="premium-submit group w-full">
                {submitting ? <Spinner size="sm" /> : <><span>Enter workspace</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
              </button>
            </form>
          </div>
          <button onClick={() => navigate('/saas/dashboard')} className="mt-6 flex w-full items-center justify-center gap-2 text-xs text-white/35 hover:text-white/60"><ArrowLeft className="h-3.5 w-3.5" /> Back to SaaS dashboard</button>
        </motion.div>
      </div>
    </div>
  );
}
