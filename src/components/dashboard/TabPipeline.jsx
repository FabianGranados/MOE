import { useMemo } from 'react';
import { money } from '../../utils/format.js';
import { calcTotal } from '../../utils/calculos.js';

const ETAPAS = [
  { key: 'EN ESPERA', label: 'En espera', color: 'bg-amber-500',   txt: 'text-amber-700 dark:text-amber-300',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
  { key: 'VENDIDO',   label: 'Vendidas',  color: 'bg-emerald-500', txt: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { key: 'PERDIDO',   label: 'Perdidas',  color: 'bg-red-400',     txt: 'text-red-700 dark:text-red-300',     bg: 'bg-red-50 dark:bg-red-500/10' }
];

export function TabPipeline({ events, onOpen }) {
  const fin = events.filter((e) => e.finalizado);

  const porEstado = useMemo(
    () => ETAPAS.map((e) => ({ ...e, items: fin.filter((f) => f.estado === e.key) })),
    [fin]
  );

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-bold">Pipeline de ventas</h3>
        <p className="text-[11px] text-fg-muted">Vista tipo Kanban · {fin.length} cotizaciones finalizadas</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {porEstado.map((et) => {
          const total = et.items.reduce((s, e) => s + calcTotal(e), 0);
          return (
            <div key={et.key} className={`${et.bg} border border-border rounded-2xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${et.color}`} />
                  <h4 className="text-xs font-bold uppercase tracking-wider">{et.label}</h4>
                </div>
                <span className={`text-[10px] font-bold ${et.txt}`}>{et.items.length}</span>
              </div>
              <div className={`text-base font-bold font-mono ${et.txt} mb-3`}>{money(total)}</div>
              <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                {et.items.length === 0 ? (
                  <div className="text-[10px] text-fg-subtle text-center py-4">Vacío</div>
                ) : (
                  et.items.slice(0, 10).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => onOpen(ev.id)}
                      className="bg-surface border border-border rounded-lg p-2 cursor-pointer hover:shadow-soft hover:border-border-strong transition"
                    >
                      <div className="text-[9px] font-mono text-fg-muted">{ev.numeroEvento}-{ev.version}</div>
                      <div className="text-[11px] font-semibold truncate text-fg">{ev.razonSocial}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] text-fg-muted">{ev.comercial}</span>
                        <span className="text-[10px] font-bold font-mono text-fg">{money(calcTotal(ev))}</span>
                      </div>
                    </div>
                  ))
                )}
                {et.items.length > 10 && (
                  <div className="text-[10px] text-fg-muted text-center pt-1">+ {et.items.length - 10} más</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
