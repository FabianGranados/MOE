import { useMemo } from 'react';
import {
  AlertCircle, Briefcase, Calendar, CheckCircle2, ChevronRight, Clock,
  DollarSign, FileText, Sparkles, XCircle
} from 'lucide-react';
import { Kpi, BarraValor } from '../shared/Kpi.jsx';
import { EmptyState } from '../shared/EmptyState.jsx';
import { money, fmtFecha, fmtMes } from '../../utils/format.js';
import { calcPagado, calcTotal } from '../../utils/calculos.js';
import { diasHasta } from '../../utils/format.js';

export function TabResumen({ stats, events, onOpen }) {
  const proximos = useMemo(
    () =>
      events
        .filter(
          (e) =>
            e.finalizado &&
            e.estado === 'VENDIDO' &&
            diasHasta(e.fechaEvento) !== null &&
            diasHasta(e.fechaEvento) >= 0 &&
            diasHasta(e.fechaEvento) <= 14
        )
        .sort((a, b) => a.fechaEvento.localeCompare(b.fechaEvento)),
    [events]
  );

  const topCerrar = useMemo(
    () =>
      events
        .filter((e) => e.finalizado && e.estado === 'EN ESPERA')
        .sort((a, b) => calcTotal(b) - calcTotal(a))
        .slice(0, 5),
    [events]
  );

  const recomendaciones = useMemo(() => {
    const recs = [];
    const vencidos = events.filter(
      (e) =>
        e.finalizado &&
        e.estado === 'EN ESPERA' &&
        diasHasta(e.fechaEvento) !== null &&
        diasHasta(e.fechaEvento) < 0
    );
    if (vencidos.length > 0) recs.push({ tipo: 'urgente', icon: AlertCircle, texto: `${vencidos.length} cotización(es) en espera ya pasaron su fecha` });
    const por7d = events.filter(
      (e) =>
        e.finalizado &&
        e.estado === 'EN ESPERA' &&
        diasHasta(e.fechaEvento) !== null &&
        diasHasta(e.fechaEvento) >= 0 &&
        diasHasta(e.fechaEvento) <= 7
    );
    if (por7d.length > 0) recs.push({ tipo: 'alerta', icon: Clock, texto: `${por7d.length} evento(s) en ≤7 días sin confirmar` });
    const sinPagos = events.filter(
      (e) =>
        e.estado === 'VENDIDO' &&
        calcPagado(e) < calcTotal(e) &&
        diasHasta(e.fechaEvento) !== null &&
        diasHasta(e.fechaEvento) <= 3
    );
    if (sinPagos.length > 0) recs.push({ tipo: 'alerta', icon: DollarSign, texto: `${sinPagos.length} evento(s) próximos con saldo pendiente` });
    if (recs.length === 0) recs.push({ tipo: 'ok', icon: CheckCircle2, texto: 'Todo en orden · No hay pendientes críticos' });
    return recs;
  }, [events]);

  const maxValor = Math.max(stats.valorVendido, stats.valorEnJuego, stats.valorPerdido, 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Cotizaciones" value={stats.total} icon={FileText} />
          <Kpi label="Vendidas" value={stats.vendidos} sub={`${stats.conversion}% conv.`} icon={CheckCircle2} tone="success" />
          <Kpi label="En espera" value={stats.enEspera} icon={Clock} tone="warning" />
          <Kpi label="Perdidas" value={stats.perdidos} icon={XCircle} tone="danger" />
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold">Valor del pipeline</h3>
              <p className="text-[11px] text-fg-muted">Estado financiero de las oportunidades</p>
            </div>
            <DollarSign className="w-4 h-4 text-fg-subtle" />
          </div>
          <div className="space-y-2.5">
            <BarraValor label="Vendido" valor={stats.valorVendido} max={maxValor} tone="emerald" formatter={money} />
            <BarraValor label="En juego (por cerrar)" valor={stats.valorEnJuego} max={maxValor} tone="amber" formatter={money} />
            <BarraValor label="Perdido" valor={stats.valorPerdido} max={maxValor} tone="red" formatter={money} />
          </div>
          <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-fg-muted font-semibold">Ticket promedio</div>
              <div className="text-base font-bold font-mono text-fg">{money(stats.ticketPromedio)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-fg-muted font-semibold">Tasa conversión</div>
              <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">{stats.conversion}%</div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold">Top cotizaciones a cerrar</h3>
              <p className="text-[11px] text-fg-muted">Mayor valor · estado EN ESPERA</p>
            </div>
            <Briefcase className="w-4 h-4 text-fg-subtle" />
          </div>
          {topCerrar.length === 0 ? (
            <EmptyState icon={Briefcase} description="Sin cotizaciones por cerrar" variant="plain" />
          ) : (
            <div className="space-y-1">
              {topCerrar.map((ev, i) => (
                <div
                  key={ev.id}
                  onClick={() => onOpen(ev.id)}
                  className="flex items-center gap-3 p-2 hover:bg-surface-sunken rounded-lg cursor-pointer transition"
                >
                  <div className="w-6 h-6 rounded-full bg-surface-sunken flex items-center justify-center text-[10px] font-bold text-fg-muted">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate text-fg">{ev.razonSocial}</div>
                    <div className="text-[10px] text-fg-muted">{ev.comercial} · {fmtFecha(ev.fechaEvento)}</div>
                  </div>
                  <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {money(calcTotal(ev))}
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-fg-subtle" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-softer to-brand-softer/30 p-5">
          <h3 className="text-sm font-bold flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand" /> Recomendaciones
          </h3>
          <div className="space-y-2">
            {recomendaciones.map((r, i) => {
              const Icon = r.icon;
              const colors = {
                urgente: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
                alerta: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
                ok: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
              };
              return (
                <div key={i} className="flex items-start gap-2 bg-surface rounded-lg p-2.5">
                  <div className={`w-6 h-6 rounded-full ${colors[r.tipo]} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="text-[11px] text-fg font-medium leading-snug">{r.texto}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">Próximos eventos</h3>
            <Calendar className="w-4 h-4 text-fg-subtle" />
          </div>
          {proximos.length === 0 ? (
            <div className="text-center py-6 text-fg-subtle text-xs">Sin eventos próximos</div>
          ) : (
            <div className="space-y-1">
              {proximos.slice(0, 5).map((ev) => {
                const d = diasHasta(ev.fechaEvento);
                return (
                  <div
                    key={ev.id}
                    onClick={() => onOpen(ev.id)}
                    className="flex items-center gap-2 p-2 hover:bg-surface-sunken rounded-lg cursor-pointer transition"
                  >
                    <div className="w-10 text-center flex-shrink-0">
                      <div className="text-[8px] uppercase text-fg-subtle font-semibold">{fmtMes(ev.fechaEvento)}</div>
                      <div className="text-base font-bold text-fg">
                        {new Date(ev.fechaEvento + 'T00:00:00').getDate()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold truncate text-fg">{ev.razonSocial}</div>
                      <div className="text-[9px] text-fg-muted">{ev.comercial}</div>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        d === 0
                          ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                          : d <= 3
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                          : 'bg-surface-sunken text-fg-muted'
                      }`}
                    >
                      {d === 0 ? 'HOY' : `${d}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
