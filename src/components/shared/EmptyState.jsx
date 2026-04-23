export function EmptyState({ icon: Icon, title, description, action, variant = 'card' }) {
  const base = variant === 'card'
    ? 'card border-dashed p-10 sm:p-12 text-center'
    : 'py-10 text-center';
  return (
    <div className={base}>
      {Icon && (
        <div className="inline-flex w-14 h-14 rounded-2xl bg-surface-sunken items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-fg-subtle" />
        </div>
      )}
      {title && <h3 className="text-sm font-semibold text-fg">{title}</h3>}
      {description && <p className="text-xs text-fg-muted mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
