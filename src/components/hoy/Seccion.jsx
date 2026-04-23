import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { money } from '../../utils/format.js';
import { calcTotal } from '../../utils/calculos.js';

const TONES = {
  red:     { bg: 'bg-red-50 dark:bg-red-500/10',     border: 'border-red-200 dark:border-red-500/30',     txt: 'text-red-700 dark:text-red-300',     dot: 'bg-red-500',     badge: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300' },
  orange:  { bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/30', txt: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500', badge: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-500/10',   border: 'border-amber-200 dark:border-amber-500/30',  txt: 'text-amber-700 dark:text-amber-300',  dot: 'bg-amber-500',  badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30', txt: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', badge: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' }
};

export function Seccion({ title, subtitle, tone, items, onOpen }) {
  if (!items || items.length === 0) return null;
  const t = TONES[tone];

  return (
    <section>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-8 h-8 rounded-full ${t.bg} border ${t.border} flex items-center justify-center`}>
          <div className={`w-2 h-2 rounded-full ${t.dot} animate-pulse-slow`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold tracking-tight">{title}</h2>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${t.badge}`}>{items.length}</span>
          </div>
          <p className="text-[11px] text-fg-muted">{subtitle}</p>
        </div>
      </div>

      <div className="space-y-2">
        {items.map(({ ev, razon }, idx) => (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.25 }}
            onClick={() => onOpen(ev.id)}
            className="card-hover p-4 cursor-pointer flex items-center gap-3 active:scale-[0.99] transition"
          >
            <div className={`w-2.5 h-2.5 rounded-full ${t.dot} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-mono text-fg-muted">
                <span>{ev.numeroEvento}-{ev.version}</span>
                <span>·</span>
                <span>{ev.comercial}</span>
              </div>
              <h3 className="text-sm font-semibold truncate text-fg">{ev.razonSocial}</h3>
              <div className={`text-[11px] mt-0.5 font-medium ${t.txt}`}>{razon}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[9px] text-fg-subtle uppercase tracking-wider font-semibold">Total</div>
              <div className="text-xs font-mono font-bold text-fg">{money(calcTotal(ev))}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-fg-subtle flex-shrink-0" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
