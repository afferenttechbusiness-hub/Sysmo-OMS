import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { useSiteBranding } from '@/lib/hooks';

const startupParticles = Array.from({ length: 18 }, (_, index) => ({
  left: `${(index * 43) % 100}%`,
  top: `${(index * 67) % 100}%`,
  delay: (index % 6) * 0.35,
}));

export function LoadingScreen() {
  const { branding } = useSiteBranding();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-ink-950 text-white">
      <div className="cinematic-backdrop" aria-hidden="true">
        <div className="cinematic-grid" />
        <motion.div className="light-orb light-orb-blue" animate={{ x: [0, 50, -20, 0], y: [0, -25, 35, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="light-orb light-orb-cyan" animate={{ x: [0, -40, 25, 0], y: [0, 30, -20, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} />
        <div className="cinematic-scanline" />
        {startupParticles.map((particle, index) => (
          <motion.span key={index} className="cinematic-particle" style={{ left: particle.left, top: particle.top, width: 2, height: 2 }} animate={{ opacity: [0.1, 0.8, 0.1], y: [0, -20, 0] }} transition={{ duration: 3.5, delay: particle.delay, repeat: Infinity, ease: 'easeInOut' }} />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="relative">
          {branding.logoUrl ? (
            <motion.div animate={{ scale: [1, 1.08, 1], rotate: [0, 3, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[26px] border border-white/15 bg-white/10 p-2 shadow-[0_20px_70px_rgba(8,145,178,0.3)] backdrop-blur-xl">
              <img src={branding.logoUrl} alt={branding.name} className="h-full w-full object-contain" />
            </motion.div>
          ) : (
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} className="flex h-14 items-center justify-center">
              <span className="text-3xl font-semibold tracking-[-0.04em] text-white">{branding.name.charAt(0).toUpperCase()}</span>
            </motion.div>
          )}
          <motion.div className="absolute -inset-4 rounded-[32px] border border-cyan-300/20" animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.7, 0.1, 0.7] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }} className="mt-8">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white">{branding.name}</h1>
          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-white/40">{branding.subtitle}</p>
        </motion.div>

        <div className="mt-9 w-56">
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} className="h-full w-1/2 rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-transparent" />
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-white/40"><ShieldCheck className="h-3.5 w-3.5 text-cyan-200/70" /> Preparing your workspace</p>
        </div>
      </div>
    </div>
  );
}
