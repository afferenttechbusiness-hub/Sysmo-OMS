import { type ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn('relative w-full bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col', sizes[size])}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
                <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-ink-100 transition-colors">
                  <X className="w-5 h-5 text-ink-500" />
                </button>
              </div>
            )}
            <div className="overflow-y-auto p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
