import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface ToastContextValue {
  notify: (n: Omit<Notification, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Notification[]>([]);

  const notify = useCallback((n: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...n, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-success-500" />,
  error: <XCircle className="w-5 h-5 text-error-500" />,
  info: <Info className="w-5 h-5 text-accent-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning-500" />,
};

const borders = {
  success: 'border-l-success-500',
  error: 'border-l-error-500',
  info: 'border-l-accent-500',
  warning: 'border-l-warning-500',
};

function Toast({ toast }: { toast: Notification }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.9 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`pointer-events-auto flex items-start gap-3 bg-white rounded-xl shadow-card-hover border border-ink-200 border-l-4 ${borders[toast.type]} px-4 py-3 min-w-[300px] max-w-md`}
      >
        {icons[toast.type]}
        <div>
          <p className="text-sm font-medium text-ink-900">{toast.title}</p>
          {toast.message && <p className="text-xs text-ink-500 mt-0.5">{toast.message}</p>}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
