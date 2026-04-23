const TONES = {
  default: 'text-fg',
  brand: 'text-brand',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
  violet: 'text-violet-600 dark:text-violet-400'
};

export function Kpi({ label, value, sub, small, icon: Icon, tone = 'default', trend, onClick }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={`card p-4 text-left w-full ${onClick ? 'hover:shadow-elev hover:border-border-strong transition cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-fg-muted">{label}</div>
        {Icon && <Icon className="w-3.5 h-3.5 text-fg-subtle" />}
      </div>
      <div className={`${small ? 'text-lg' : 'text-2xl md:text-3xl'} font-bold tracking-tight ${TONES[tone]}`}>
        {value}
      </div>
      {(sub || trend) && (
        <div className="flex items-center gap-2 mt-1">
          {sub && <div className="text-[10px] text-fg-subtle">{sub}</div>}
          {trend && <div className={`text-[10px] font-semibold ${trend.up ? 'text-emerald-600' : 'text-red-600'}`}>{trend.label}</div>}
        </div>
      )}
    </Comp>
  );
}

export function BarraValor({ label, valor, max, tone = 'emerald', formatter }) {
  const pct = max > 0 ? (valor / max) * 100 : 0;
  const colors = {
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-400 to-amber-500',
    red: 'from-red-400 to-red-500',
    brand: 'from-brand to-brand-hover',
    violet: 'from-violet-500 to-violet-600'
  };
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-fg-muted font-medium">{label}</span>
        <span className="font-mono font-bold">{formatter ? formatter(valor) : valor}</span>
      </div>
      <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colors[tone]} transition-[width] duration-700`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}
