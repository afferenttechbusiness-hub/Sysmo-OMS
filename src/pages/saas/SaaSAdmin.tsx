import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, XCircle, Clock, Loader2, LogOut, Users, Building2, DollarSign, Package, Sparkles } from 'lucide-react';
import { useSaaSAuth } from '@/lib/saas-auth';
import { useSiteBranding } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast';
import type { SaaSSubscription, SaaSPlan, SaaSUser, Tenant } from '@/lib/types';

type SubWithRelations = SaaSSubscription & { plan: SaaSPlan; saas_user: SaaSUser };

export function SaaSAdmin() {
  const { user, signOut } = useSaaSAuth();
  const { branding } = useSiteBranding();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [subs, setSubs] = useState<SubWithRelations[]>([]);
  const [allTenants, setAllTenants] = useState<(Tenant & { plan: SaaSPlan })[]>([]);
  const [allUsers, setAllUsers] = useState<SaaSUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<'subscriptions' | 'tenants' | 'users' | 'plans'>('subscriptions');

  const loadData = useCallback(async () => {
    const [subRes, tenantRes, userRes] = await Promise.all([
      supabase.from('saas_subscriptions').select('*, plan:saas_plans(*), saas_user:saas_users(*)').order('created_at', { ascending: false }),
      supabase.from('tenants').select('*, plan:saas_plans(*)').order('created_at', { ascending: false }),
      supabase.from('saas_users').select('*').order('created_at', { ascending: false }),
    ]);
    setSubs((subRes.data as SubWithRelations[]) || []);
    setAllTenants((tenantRes.data as (Tenant & { plan: SaaSPlan })[]) || []);
    setAllUsers((userRes.data as SaaSUser[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = async (subId: string) => {
    setActionLoading(subId);
    const { error } = await supabase.rpc('create_tenant_for_subscription', { sub_uuid: subId });
    setActionLoading(null);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'error' }); return; }
    toast({ title: 'Approved', description: 'Tenant workspace created successfully.', variant: 'success' });
    loadData();
  };

  const handleReject = async (subId: string) => {
    setActionLoading(subId);
    const { error } = await supabase.from('saas_subscriptions').update({ status: 'rejected', admin_note: 'Rejected by admin', updated_at: new Date().toISOString() }).eq('id', subId);
    setActionLoading(null);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'error' }); return; }
    toast({ title: 'Rejected', description: 'Subscription request rejected.', variant: 'info' });
    loadData();
  };

  const handleSignOut = async () => { await signOut(); navigate('/saas'); };

  if (user?.role !== 'saas_admin') {
    return <div className="flex min-h-screen items-center justify-center bg-ink-50 text-ink-500">Access denied. SaaS admin only.</div>;
  }

  const pendingSubs = subs.filter((s) => s.status === 'pending');
  const totalRevenue = subs.filter((s) => s.status === 'approved').reduce((sum, s) => sum + Number(s.amount), 0);

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-30 border-b border-ink-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-white"><ShieldCheck className="h-5 w-5" /></div>
            <span className="text-base font-semibold text-ink-900">SaaS Admin Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/saas/dashboard" className="text-sm text-ink-500 hover:text-ink-900">Dashboard</Link>
            <button onClick={handleSignOut} className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-500"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight text-ink-900">Admin Panel</h1>
          <p className="mt-1.5 text-sm text-ink-500">Manage subscriptions, tenants, and users across the platform.</p>
        </motion.div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={<Clock />} label="Pending" value={pendingSubs.length} color="amber" />
          <StatCard icon={<Building2 />} label="Tenants" value={allTenants.length} color="blue" />
          <StatCard icon={<Users />} label="Users" value={allUsers.length} color="purple" />
          <StatCard icon={<DollarSign />} label="Revenue" value={`$${totalRevenue.toFixed(0)}`} color="green" />
        </div>

        <div className="mt-8 flex gap-1 border-b border-ink-200">
          {(['subscriptions', 'tenants', 'users', 'plans'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`border-b-2 px-4 py-2.5 text-sm font-medium capitalize transition-colors ${tab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-ink-400 hover:text-ink-600'}`}>{t}</button>
          ))}
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-ink-400" /></div>
          ) : tab === 'subscriptions' ? (
            <div className="space-y-3">
              {subs.length === 0 && <p className="py-8 text-center text-sm text-ink-400">No subscriptions yet.</p>}
              {subs.map((sub) => (
                <div key={sub.id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIcon status={sub.status} />
                    <div>
                      <p className="font-medium text-ink-900">{sub.plan.name} — ${sub.amount} / {sub.billing_cycle}</p>
                      <p className="text-xs text-ink-400">{sub.saas_user?.email} — {new Date(sub.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${sub.status === 'approved' ? 'bg-green-50 text-green-700' : sub.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{sub.status}</span>
                    {sub.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(sub.id)} disabled={actionLoading === sub.id} className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50">
                          {actionLoading === sub.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Approve
                        </button>
                        <button onClick={() => handleReject(sub.id)} disabled={actionLoading === sub.id} className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50">
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : tab === 'tenants' ? (
            <div className="space-y-3">
              {allTenants.length === 0 && <p className="py-8 text-center text-sm text-ink-400">No tenants yet.</p>}
              {allTenants.map((t) => (
                <div key={t.id} className="card flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Building2 className="h-5 w-5" /></div>
                    <div><p className="font-medium text-ink-900">{t.name}</p><p className="text-xs text-ink-400">/{t.slug} — {t.plan.name}</p></div>
                  </div>
                  <span className={`badge ${t.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{t.status}</span>
                </div>
              ))}
            </div>
          ) : tab === 'users' ? (
            <div className="space-y-3">
              {allUsers.length === 0 && <p className="py-8 text-center text-sm text-ink-400">No users yet.</p>}
              {allUsers.map((u) => (
                <div key={u.id} className="card flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-sm font-semibold text-ink-700">{u.full_name?.charAt(0).toUpperCase() || 'U'}</div>
                    <div><p className="font-medium text-ink-900">{u.full_name || u.email}</p><p className="text-xs text-ink-400">{u.company_name || 'No company'}</p></div>
                  </div>
                  <span className={`badge ${u.role === 'saas_admin' ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600'}`}>{u.role}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {subs.length === 0 && <p className="py-8 text-center text-sm text-ink-400 col-span-full">Plans are seeded automatically.</p>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = { blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600', green: 'bg-green-50 text-green-600', purple: 'bg-purple-50 text-purple-600' };
  return (
    <div className="card p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]} [&>svg]:h-5 [&>svg]:w-5`}>{icon}</div>
      <p className="mt-3 text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-xs text-ink-400">{label}</p>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'approved') return <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600"><CheckCircle2 className="h-5 w-5" /></div>;
  if (status === 'pending') return <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Clock className="h-5 w-5" /></div>;
  return <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"><XCircle className="h-5 w-5" /></div>;
}
