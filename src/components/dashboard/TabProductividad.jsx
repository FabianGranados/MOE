import { useMemo } from 'react';
import { Avatar } from '../shared/Avatar.jsx';
import { EmptyState } from '../shared/EmptyState.jsx';
import { ROLES } from '../../constants.js';
import { money } from '../../utils/format.js';
import { calcTotal } from '../../utils/calculos.js';
import { Users } from 'lucide-react';

export function TabProductividad({ events }) {
  const porAsesor = useMemo(() => {
    const map = {};
    events
      .filter((e) => e.finalizado)
      .forEach((ev) => {
        const alias = ev.comercial || 'SIN ASIGNAR';
        if (!map[alias]) map[alias] = { alias, total: 0, vendidas: 0, perdidas: 0, espera: 0, valorVendido: 0 };
        map[alias].total++;
        if (ev.estado === 'VENDIDO') {
          map[alias].vendidas++;
          map[alias].valorVendido += calcTotal(ev);
        }
        if (ev.estado === 'PERDIDO') map[alias].perdidas++;
        if (ev.estado === 'EN ESPERA') map[alias].espera++;
      });
    return Object.values(map).sort((a, b) => b.valorVendido - a.valorVendido);
  }, [events]);

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-bold">Productividad por asesor</h3>
        <p className="text-[11px] text-fg-muted">Comparativo de desempeño</p>
      </div>

      {porAsesor.length === 0 ? (
        <EmptyState icon={Users} title="Sin datos aún" description="Aún no hay cotizaciones finalizadas." />
      ) : (
        <div className="space-y-3">
          {porAsesor.map((a, idx) => {
            const conv = a.total > 0 ? Math.round((a.vendidas / a.total) * 100) : 0;
            return (
              <div key={a.alias} className="card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={a.alias} color={ROLES.asesor_comercial.accent} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-fg">{a.alias}</div>
                      {idx === 0 && <span className="chip bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">🏆 Top</span>}
                    </div>
                    <div className="text-[10px] text-fg-muted">
                      {a.total} cotización{a.total !== 1 ? 'es' : ''} · {conv}% conversión
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] uppercase text-fg-muted font-bold">Vendido</div>
                    <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">{money(a.valorVendido)}</div>
                  </div>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-surface-sunken">
                  {a.vendidas > 0 && <div className="bg-emerald-500" style={{ width: `${(a.vendidas / a.total) * 100}%` }} />}
                  {a.espera > 0 && <div className="bg-amber-500" style={{ width: `${(a.espera / a.total) * 100}%` }} />}
                  {a.perdidas > 0 && <div className="bg-red-400" style={{ width: `${(a.perdidas / a.total) * 100}%` }} />}
                </div>
                <div className="flex items-center justify-between text-[10px] mt-2 flex-wrap gap-2 text-fg-muted">
                  <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {a.vendidas} ganadas</span>
                  <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {a.espera} en espera</span>
                  <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-400" /> {a.perdidas} perdidas</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
