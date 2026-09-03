import { useState, useEffect, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, CreditCard, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useSaaSAuth } from '@/lib/saas-auth';
import { supabase } from '@/lib/supabase';
import type { SaaSPlan } from '@/lib/types';

export function SaaSSubscribe() {
  const { planId } = useParams<{ planId: string }>();
  const { user, refreshData } = useSaaSAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<SaaSPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!planId) return;
    supabase.from('saas_plans').select('*').eq('id', planId).maybeSingle().then(({ data }) => {
      setPlan(data as SaaSPlan | null);
      setLoading(false);
    });
  }, [planId]);

  const amount = billingCycle === 'monthly' ? plan?.price_monthly || 0 : plan?.price_yearly || 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !plan) return;
    setError(null);
    setSubmitting(true);
    const { error: insertError } = await supabase.from('saas_subscriptions').insert({
      saas_user_id: user.id,
      plan_id: plan.id,
      billing_cycle: billingCycle,
      amount,
      payment_method: paymentMethod,
      status: 'pending',
    });
    setSubmitting(false);
    if (insertError) { setError(insertError.message); return; }
    setSuccess(true);
    await refreshData();
    setTimeout(() => navigate('/saas/dashboard'), 2500);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-ink-50"><Loader2 className="h-6 w-6 animate-spin text-ink-400" /></div>;
  if (!plan) return <div className="flex min-h-screen items-center justify-center bg-ink-50 text-ink-500">Plan not found</div>;

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-200/60 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <Link to="/saas/dashboard" className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-base font-semibold text-ink-900">Subscribe to {plan.name}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {success ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50"><ShieldCheck className="h-7 w-7 text-green-600" /></div>
            <h2 className="text-xl font-semibold text-ink-900">Subscription request sent!</h2>
            <p className="mt-2 text-sm text-ink-500">Your request is now pending approval. Once the SaaS admin approves it, your isolated workspace will be created automatically.</p>
            <p className="mt-4 text-xs text-ink-400">Redirecting to dashboard...</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.2fr]">
            {/* Plan summary */}
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="card p-6">
              <h3 className="text-lg font-semibold text-ink-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-ink-400">{plan.description}</p>
              <div className="mt-5 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-ink-500">Max users</span><span className="font-medium text-ink-900">{plan.max_users}</span></div>
                <div className="flex justify-between text-sm"><span className="text-ink-500">Max departments</span><span className="font-medium text-ink-900">{plan.max_departments || '—'}</span></div>
              </div>
              <ul className="mt-5 space-y-2 border-t border-ink-100 pt-5">
                {plan.features.map((f) => <li key={f} className="flex items-center gap-2 text-sm text-ink-600"><Check className="h-4 w-4 text-green-500" /> {f}</li>)}
              </ul>
            </motion.div>

            {/* Payment form */}
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="card p-6">
              <h3 className="text-lg font-semibold text-ink-900">Billing & Payment</h3>
              <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-500">Billing cycle</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['monthly', 'yearly'] as const).map((cycle) => (
                      <button key={cycle} type="button" onClick={() => setBillingCycle(cycle)} className={`rounded-xl border py-3 text-sm font-medium capitalize transition-all ${billingCycle === cycle ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-ink-200 text-ink-500 hover:border-ink-300'}`}>
                        {cycle} — ${cycle === 'monthly' ? plan.price_monthly : plan.price_yearly}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-500">Payment method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['bkash', 'nagad', 'rocket'].map((method) => (
                      <button key={method} type="button" onClick={() => setPaymentMethod(method)} className={`rounded-xl border py-3 text-sm font-medium capitalize transition-all ${paymentMethod === method ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-ink-200 text-ink-500 hover:border-ink-300'}`}>
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-ink-50 p-4">
                  <div className="flex items-center justify-between text-sm"><span className="text-ink-500">Total</span><span className="text-xl font-bold text-ink-900">${amount}</span></div>
                  <p className="mt-1 text-xs text-ink-400">Payment will be verified by the admin before approval.</p>
                </div>
                {error && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</div>}
                <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 py-3.5 text-sm font-semibold text-white transition-all hover:bg-ink-800 disabled:opacity-50">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CreditCard className="h-4 w-4" /> Submit subscription request</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
