import { useMemo } from 'react';
import { Briefcase, PartyPopper } from 'lucide-react';
import { EmptyState } from '../shared/EmptyState.jsx';
import { money } from '../../utils/format.js';
import { calcTotal } from '../../utils/calculos.js';

export function TabLeads({ events }) {
  const porTipo = useMemo(() => {
    const map = {};
    events
      .filter((e) => e.finalizado)
      .forEach((ev) => {
        const t = ev.tipoEvento || 'OTRO';
        if (!map[t]) map[t] = { tipo: t, total: 0, vendidas: 0, perdidas: 0, valor: 0 };
        map[t].total++;
        if (ev.estado === 'VENDIDO') {
          map[t].vendidas++;
          map[t].valor += calcTotal(ev);
        }
        if (ev.estado === 'PERDIDO') map[t].perdidas++;
      });
    return Object.values(map).sort((a, b) => b.valor - a.valor);
  }, [events]);

  const motivos = useMemo(() => {
    const map = {};
    events.filter((e) => e.estado === 'PERDIDO').forEach((ev) => {
      const m = ev.motivoPerdida || 'Sin motivo';
      map[m] = (map[m] || 0) + 1;
    });
    return Object.entries(map).map(([motivo, count]) => ({ motivo, count })).sort((a, b) => b.count - a.count);
  }, [events]);

  const totalPerdidas = motivos.reduce((s, m) => s + m.count, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card p-5">
        <h3 className="text-sm font-bold mb-3">Conversión por tipo de evento</h3>
        {porTipo.length === 0 ? (
          <EmptyState icon={Briefcase} description="Sin datos" variant="plain" />
        ) : (
          <div className="space-y-3">
            {porTipo.map((t) => {
              const conv = t.total > 0 ? Math.round((t.vendidas / t.total) * 100) : 0;
              return (
                <div key={t.tipo} className="border border-border rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold">{t.tipo}</span>
                    <span className="text-[10px] text-fg-muted">{t.total} total</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600" style={{ width: `${conv}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">{conv}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-fg-muted mt-1.5">
                    <span>{t.vendidas} vendidas · {t.perdidas} perdidas</span>
                    <span className="font-mono font-bold text-fg">{money(t.valor)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-bold mb-3">Razones de pérdida</h3>
        {motivos.length === 0 ? (
          <EmptyState icon={PartyPopper} title="¡Sin pérdidas!" description="No hay cotizaciones perdidas en este período 🎉" variant="plain" />
        ) : (
          <div className="space-y-2.5">
            {motivos.map((m) => {
              const pct = totalPerdidas > 0 ? (m.count / totalPerdidas) * 100 : 0;
              return (
                <div key={m.motivo}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-medium text-fg">{m.motivo}</span>
                    <span className="font-bold">{m.count} ({Math.round(pct)}%)</span>
                  </div>
                  <div className="h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                    <div className="h-full bg-red-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
