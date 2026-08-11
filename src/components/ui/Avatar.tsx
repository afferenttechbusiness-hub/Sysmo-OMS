import { motion } from 'framer-motion';
import { cn, initials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  ring?: boolean;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-28 h-28 text-2xl',
};

export function Avatar({ src, name, size = 'md', className, ring, onClick }: AvatarProps) {
  const colors = [
    'from-brand-500 to-accent-500',
    'from-success-500 to-brand-500',
    'from-accent-500 to-brand-600',
    'from-warning-500 to-error-500',
    'from-brand-600 to-accent-600',
  ];
  const colorIdx = name ? name.charCodeAt(0) % colors.length : 0;

  return (
    <div
      className={cn(
        'relative shrink-0 rounded-full overflow-hidden',
        ring && 'ring-2 ring-white shadow-md',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {src ? (
        <img src={src} alt={name || 'Avatar'} className={cn('object-cover', sizeClasses[size])} />
      ) : (
        <div className={cn('flex items-center justify-center font-semibold text-white bg-gradient-to-br', colors[colorIdx], sizeClasses[size])}>
          {initials(name)}
        </div>
      )}
    </div>
  );
}

interface StatusDotProps {
  status: 'online' | 'offline' | 'away';
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  const colors = {
    online: 'bg-success-500',
    offline: 'bg-ink-400',
    away: 'bg-warning-500',
  };
  return (
    <span className={cn('absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white', colors[status], className)} />
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-ink-100 text-ink-600',
    success: 'bg-success-100 text-success-700',
    warning: 'bg-warning-100 text-warning-700',
    error: 'bg-error-100 text-error-700',
    info: 'bg-accent-100 text-accent-700',
    brand: 'bg-brand-100 text-brand-700',
  };
  return <span className={cn('badge', variants[variant], className)}>{children}</span>;
}

interface ProgressBarProps {
  value: number;
  className?: string;
  color?: 'brand' | 'success' | 'warning' | 'error';
  animated?: boolean;
}

export function ProgressBar({ value, className, color = 'brand', animated = true }: ProgressBarProps) {
  const colors = {
    brand: 'from-brand-500 to-brand-600',
    success: 'from-success-500 to-success-600',
    warning: 'from-warning-500 to-warning-600',
    error: 'from-error-500 to-error-600',
  };
  return (
    <div className={cn('h-2 rounded-full bg-ink-200 overflow-hidden', className)}>
      <motion.div
        className={cn('h-full rounded-full bg-gradient-to-r', colors[color])}
        initial={animated ? { width: 0 } : false}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}
