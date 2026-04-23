const VARIANTS = {
  neutral: 'bg-surface-sunken text-fg-muted border-border',
  brand: 'bg-brand-softer text-brand border-brand/20',
  success: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  warning: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  danger:  'bg-red-100 text-red-700 border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
  violet:  'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
  dark:    'bg-fg text-surface border-fg'
};

export function Badge({ variant = 'neutral', children, icon: Icon, className = '' }) {
  return (
    <span className={`chip ${VARIANTS[variant]} ${className}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}
