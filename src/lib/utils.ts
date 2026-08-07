import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns';

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: string | Date, formatStr = 'MMM d, yyyy'): string {
  return format(new Date(date), formatStr);
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'h:mm a');
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function relativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function smartDate(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`;
  if (isTomorrow(d)) return `Tomorrow, ${format(d, 'h:mm a')}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, yyyy');
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatCurrency(amount: number, currency = 'BDT'): string {
  const symbols: Record<string, string> = { BDT: '৳', USD: '$', EUR: '€', GBP: '£' };
  const symbol = symbols[currency] || '';
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    planning: 'bg-ink-100 text-ink-600',
    active: 'bg-success-100 text-success-700',
    on_hold: 'bg-warning-100 text-warning-700',
    completed: 'bg-brand-100 text-brand-700',
    cancelled: 'bg-error-100 text-error-700',
    todo: 'bg-ink-100 text-ink-600',
    in_progress: 'bg-accent-100 text-accent-700',
    review: 'bg-warning-100 text-warning-700',
    done: 'bg-success-100 text-success-700',
    pending: 'bg-warning-100 text-warning-700',
    approved: 'bg-success-100 text-success-700',
    rejected: 'bg-error-100 text-error-700',
    open: 'bg-accent-100 text-accent-700',
    resolved: 'bg-success-100 text-success-700',
    closed: 'bg-ink-100 text-ink-600',
  };
  return colors[status] || 'bg-ink-100 text-ink-600';
}

export function priorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'bg-ink-100 text-ink-500',
    medium: 'bg-accent-100 text-accent-700',
    high: 'bg-warning-100 text-warning-700',
    urgent: 'bg-error-100 text-error-700',
  };
  return colors[priority] || colors.medium;
}

export function statusLabel(status: string): string {
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
