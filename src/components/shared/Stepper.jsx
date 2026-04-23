import { Check } from 'lucide-react';

export function Stepper({ steps, current }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition ${
                    done
                      ? 'bg-emerald-600 text-white'
                      : active
                      ? 'bg-brand text-white ring-4 ring-brand/20'
                      : 'bg-surface-sunken text-fg-muted border border-border'
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-[11px] font-bold uppercase tracking-wider truncate ${
                      active ? 'text-fg' : done ? 'text-emerald-700 dark:text-emerald-400' : 'text-fg-muted'
                    }`}
                  >
                    {s.label}
                  </div>
                  <div className="text-[10px] text-fg-subtle truncate hidden sm:block">{s.hint}</div>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full ${done ? 'bg-emerald-500' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
