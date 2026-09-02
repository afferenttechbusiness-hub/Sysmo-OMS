import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 mesh-bg flex items-center justify-center z-[200]">
      <div className="flex flex-col items-center gap-6">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as const }}
          className="relative"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-glow-lg"
          >
            <Sparkles className="w-12 h-12 text-white" />
          </motion.div>

          {/* Orbiting dots */}
          {[0, 120, 240].map((angle, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-accent-400"
              style={{ originX: 0, originY: 0, x: 0, y: 0 }}
              animate={{ rotate: angle + 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <div style={{ transform: `translateX(50px)` }} className="w-3 h-3 rounded-full bg-accent-400" />
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold font-display text-white"
          >
            Sysmobyte
          </motion.h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 'auto' }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="overflow-hidden whitespace-nowrap"
          >
            <p className="text-sm text-ink-400 mt-1">Loading your workspace...</p>
          </motion.div>
        </div>

        {/* Progress bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 200 }}
          transition={{ delay: 0.4, duration: 1.5, ease: 'easeInOut' }}
          className="h-1 rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
        />
      </div>
    </div>
  );
}
