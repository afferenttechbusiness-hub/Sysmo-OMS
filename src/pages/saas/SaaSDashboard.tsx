import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, LogOut, Package, CheckCircle2, Clock, XCircle, ArrowRight, CreditCard, Users, Calendar, Settings, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { useSaaSAuth } from '@/lib/saas-auth';
import { useSiteBranding } from '@/lib/hooks';
import type { SaaSPlan, SaaSSubscription, Tenant } from '@/lib/types';

export function SaaSDashboard() {
  const { user, subscriptions, tenants, signOut, refreshData } = useSaaSAuth();
  const { branding } = useSiteBranding();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('saas_plans').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      setPlans((data as SaaSPlan[]) || []);
      setLoading(false);
    });
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/saas');
  }, [signOut, navigate]);

  const approvedTenants = tenants.filter((t) => t.status === 'active');
  const pendingSubs = subscriptions.filter((s) => s.status === 'pending');
  const approvedSubs = subscriptions.filter((s) => s.status === 'approved');

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-30 border-b border-ink-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-base font-semibold text-ink-900">{branding.name} <span className="text-xs font-normal text-ink-400">SaaS</span></span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === 'saas_admin' && <Link to="/saas/admin" className="flex items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-2 text-xs font-medium text-white hover:bg-ink-800"><ShieldCheck className="h-3.5 w-3.5" /> Admin Panel</Link>}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-700">{user?.full_name?.charAt(0).toUpperCase() || 'U'}</div>
              <span className="hidden text-sm font-medium text-ink-700 sm:block">{user?.full_name || user?.email}</span>
            </div>
            <button onClick={handleSignOut} className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-500"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold tracking-tight text-ink-900">Dashboard</h1>
          <p className="mt-1.5 text-sm text-ink-500">Welcome back, {user?.full_name || user?.email}. Manage your subscriptions and workspaces.</p>
        </motion.div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={<Building2 />} label="Active Workspaces" value={approvedTenants.length} color="blue" />
          <StatCard icon={<Clock />} label="Pending Subscriptions" value={pendingSubs.length} color="amber" />
          <StatCard icon={<CheckCircle2 />} label="Approved Subscriptions" value={approvedSubs.length} color="green" />
        </div>

        {/* Active Workspaces */}
        {approvedTenants.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-ink-900">Your Workspaces</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {approvedTenants.map((tenant, i) => (
                <motion.div key={tenant.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card card-hover p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Building2 className="h-5 w-5" /></div>
                      <div>
                        <h3 className="font-semibold text-ink-900">{tenant.name}</h3>
                        <p className="text-xs text-ink-400">/{tenant.slug}</p>
                      </div>
                    </div>
                    <span className="badge bg-green-50 text-green-700"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active</span>
                  </div>
                  <Link to={`/t/${tenant.slug}`} className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-ink-900 py-2.5 text-sm font-medium text-white transition-all hover:bg-ink-800">
                    Open workspace <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Pending Subscriptions */}
        {pendingSubs.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-ink-900">Pending Approvals</h2>
            <div className="space-y-3">
              {pendingSubs.map((sub) => (
                <div key={sub.id} className="card flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Clock className="h-5 w-5" /></div>
                    <div>
                      <p className="font-medium text-ink-900">{(sub as SaaSSubscription & { plan: SaaSPlan }).plan?.name || 'Plan'}</p>
                      <p className="text-xs text-ink-400">${sub.amount} / {sub.billing_cycle}</p>
                    </div>
                  </div>
                  <span className="badge bg-amber-50 text-amber-700">Awaiting approval</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Available Plans */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Subscribe to a Plan</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-ink-400" /></div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {plans.map((plan, i) => (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className={`card card-hover p-6 ${plan.name === 'Professional' ? 'ring-2 ring-blue-500' : ''}`}>
                  {plan.name === 'Professional' && <div className="mb-3 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">Recommended</div>}
                  <h3 className="text-lg font-semibold text-ink-900">{plan.name}</h3>
                  <p className="mt-1 text-xs text-ink-400">{plan.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight text-ink-900">${plan.price_monthly}</span>
                    <span className="text-sm text-ink-400">/mo</span>
                  </div>
                  <ul className="mt-5 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-ink-600"><CheckCircle2 className="h-4 w-4 text-green-500" /> {f}</li>
                    ))}
                  </ul>
                  <Link to={`/saas/subscribe/${plan.id}`} className="mt-6 block rounded-xl bg-ink-900 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-ink-800">
                    Subscribe to {plan.name}
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colors: Record<string, string> = { blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600', green: 'bg-green-50 text-green-600' };
  return (
    <div className="card p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]} [&>svg]:h-5 [&>svg]:w-5`}>{icon}</div>
      <p className="mt-3 text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-xs text-ink-400">{label}</p>
    </div>
  );
}

import { supabase } from '@/lib/supabase';
