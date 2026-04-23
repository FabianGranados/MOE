export function Fld({ label, hint, error, required, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-fg-muted">
            {label}
            {required && <span className="text-brand ml-0.5">*</span>}
          </span>
          {hint && <span className="text-[10px] text-fg-subtle">{hint}</span>}
        </label>
      )}
      {children}
      {error && <div className="mt-1 text-[11px] text-red-600 dark:text-red-400">{error}</div>}
    </div>
  );
}
