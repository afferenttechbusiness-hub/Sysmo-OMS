import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Sparkles, Shield, Zap, Users, Building2, BarChart3, MessageSquare, Wallet, Calendar } from 'lucide-react';
import { useSiteBranding } from '@/lib/hooks';

export function SaaSLanding() {
  const { branding } = useSiteBranding();

  const features = [
    { icon: Users, title: 'Team Management', desc: 'Organize your team, departments, and roles with granular control.' },
    { icon: BarChart3, title: 'Project Analytics', desc: 'Track progress, deadlines, and performance with real-time dashboards.' },
    { icon: MessageSquare, title: 'Built-in Messenger', desc: 'Keep your team connected with department and project-based chat rooms.' },
    { icon: Wallet, title: 'Wallet & Transactions', desc: 'Manage salaries, withdrawals, and financial records in one place.' },
    { icon: Calendar, title: 'Schedule Management', desc: 'Never miss a meeting or deadline with shared team calendars.' },
    { icon: Shield, title: 'Enterprise Security', desc: 'Row-level security isolates every tenant. Your data stays yours.' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950 text-white">
      <div className="cinematic-backdrop" aria-hidden="true">
        <div className="cinematic-grid" />
        <motion.div className="light-orb light-orb-blue" animate={{ x: [0, 60, -20, 0], y: [0, -30, 40, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="light-orb light-orb-cyan" animate={{ x: [0, -50, 30, 0], y: [0, 40, -20, 0] }} transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
      </div>

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">{branding.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/saas/signin" className="px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white">
            Sign in
          </Link>
          <Link to="/saas/signup" className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-ink-900 transition-transform hover:scale-105">
            Get started
          </Link>
        </div>
      </nav>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-32 text-center lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" /> Enterprise SaaS Platform
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            The all-in-one workspace for <span className="premium-gradient-text">modern organizations</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-white/55">
            Manage teams, projects, communication, schedules, and finances — all in one beautifully designed platform. Subscribe, get approved, and launch your own isolated workspace in minutes.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/saas/signup" className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(8,145,178,0.3)] transition-all hover:scale-105">
              Start your workspace
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/saas/signin" className="rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10">
              Sign in to dashboard
            </Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="mx-auto mt-24 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.08 }} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 text-left backdrop-blur-sm transition-all hover:border-cyan-300/20 hover:bg-white/[0.06]">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/45">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-24">
          <div className="mb-10 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-white/40">
            <Zap className="h-3.5 w-3.5" /> Simple, transparent pricing
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { name: 'Starter', price: '$29', period: '/mo', desc: 'For small teams', features: ['10 users', '3 departments', 'Task management', 'Team chat', 'Basic analytics'], popular: false },
              { name: 'Professional', price: '$79', period: '/mo', desc: 'For growing orgs', features: ['50 users', '10 departments', 'Advanced analytics', 'Project management', 'Wallet & transactions', 'Priority support'], popular: true },
              { name: 'Enterprise', price: '$199', period: '/mo', desc: 'For large orgs', features: ['500 users', '50 departments', 'Full feature access', 'Custom roles', 'Dedicated support', 'SLA guarantee'], popular: false },
            ].map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 + i * 0.1 }} className={`relative rounded-2xl border p-7 text-left backdrop-blur-sm ${plan.popular ? 'border-cyan-400/30 bg-cyan-400/[0.06]' : 'border-white/[0.08] bg-white/[0.035]'}`}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Most popular</div>}
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="mt-1 text-xs text-white/40">{plan.desc}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-white">{plan.price}</span>
                  <span className="text-sm text-white/40">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                      <Check className="h-4 w-4 text-cyan-300" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/saas/signup" className={`mt-7 block rounded-xl py-3 text-center text-sm font-semibold transition-all ${plan.popular ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:scale-105' : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'}`}>
                  Choose {plan.name}
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <p className="mt-20 text-xs text-white/25">© 2026 {branding.name}. All rights reserved.</p>
      </section>
    </div>
  );
}
