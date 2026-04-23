import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, Clock, DollarSign, KeyRound, Sparkles } from 'lucide-react';
import { PageHeader } from '../shared/PageHeader.jsx';
import { Kpi } from '../shared/Kpi.jsx';
import { EmptyState } from '../shared/EmptyState.jsx';
import { Avatar } from '../shared/Avatar.jsx';
import { ModalConfigRangos } from './ModalConfigRangos.jsx';
import { ROLES } from '../../constants.js';
import { money } from '../../utils/format.js';
import { calcPagado, calcTotal } from '../../utils/calculos.js';
import { calcBaseComision, calcComision, calcPorcentajeComision, esComisionGanada } from '../../utils/comisiones.js';

export function ComisionesView({ events, currentUser, rangosComision, persistRangos, onOpen }) {
  const [mesFiltro, setMesFiltro] = useState('actual');
  const [asesorSeleccionado, setAsesorSeleccionado] = useState(null);
  const [showConfig, setShowConfig] = useState(false);

  const esGerencia = currentUser.rol === 'gerencia_general';
  const esAsesor = currentUser.rol === 'asesor_comercial';

  const eventosBase = useMemo(() => {
    let vs = events.filter((e) => e.estado === 'VENDIDO');
    if (esAsesor) vs = vs.filter((e) => e.comercial === currentUser.alias || e.createdBy === currentUser.id);
    return vs;
  }, [events, currentUser, esAsesor]);

  const eventosFiltrados = useMemo(() => {
    if (mesFiltro === 'todos') return eventosBase;
    const now = new Date();
    let mes;
    if (mesFiltro === 'actual') mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    else if (mesFiltro === 'anterior') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      mes = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    } else mes = mesFiltro;
    return eventosBase.filter((e) => (e.fechaEvento || '').startsWith(mes));
  }, [eventosBase, mesFiltro]);

  const porAsesor = useMemo(() => {
    const map = {};
    eventosFiltrados.forEach((ev) => {
      const alias = ev.comercial || 'SIN ASIGNAR';
      if (!map[alias]) map[alias] = { alias, ventas: [], totalVentas: 0, ganada: 0, pendiente: 0 };
      const com = calcComision(ev, rangosComision);
      map[alias].ventas.push(ev);
      map[alias].totalVentas += calcTotal(ev);
      if (esComisionGanada(ev)) map[alias].ganada += com;
      else map[alias].pendiente += com;
    });
    return Object.values(map).sort((a, b) => (b.ganada + b.pendiente) - (a.ganada + a.pendiente));
  }, [eventosFiltrados, rangosComision]);

  const totales = useMemo(
    () =>
      porAsesor.reduce(
        (acc, a) => ({
          ganada: acc.ganada + a.ganada,
          pendiente: acc.pendiente + a.pendiente,
          ventas: acc.ventas + a.totalVentas,
          count: acc.count + a.ventas.length
        }),
        { ganada: 0, pendiente: 0, ventas: 0, count: 0 }
      ),
    [porAsesor]
  );

  const topAsesor = porAsesor[0];

  const opcionesMes = useMemo(() => {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
      opts.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return opts;
  }, []);

  return (
    <div>
      <PageHeader
        title="Comisiones"
        subtitle={esAsesor ? 'Tus comisiones ganadas y pendientes' : 'Seguimiento por asesor'}
        action={
          esGerencia && (
            <button onClick={() => setShowConfig(true)} className="btn-ghost">
              <KeyRound className="w-3.5 h-3.5" /> Configurar rangos
            </button>
          )
        }
      />

      <div className="card p-3 mb-4 flex flex-wrap gap-2 items-center">
        <span className="text-[10px] uppercase tracking-wider font-bold text-fg-muted mr-1">Período:</span>
        <FiltroChip active={mesFiltro === 'actual'} onClick={() => setMesFiltro('actual')}>Mes actual</FiltroChip>
        <FiltroChip active={mesFiltro === 'anterior'} onClick={() => setMesFiltro('anterior')}>Mes anterior</FiltroChip>
        <FiltroChip active={mesFiltro === 'todos'} onClick={() => setMesFiltro('todos')}>Histórico</FiltroChip>
        <select
          value={['actual', 'anterior', 'todos'].includes(mesFiltro) ? '' : mesFiltro}
          onChange={(e) => e.target.value && setMesFiltro(e.target.value)}
          className="input w-auto ml-auto"
        >
          <option value="">Mes específico...</option>
          {opcionesMes.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Kpi label="Ganadas" value={money(totales.ganada)} small icon={CheckCircle2} tone="success" sub="100% pagadas" />
        <Kpi label="Pendientes" value={money(totales.pendiente)} small icon={Clock} tone="warning" sub="Falta cobrar" />
        <Kpi label="Ventas" value={money(totales.ventas)} small icon={DollarSign} tone="violet" sub={`${totales.count} cotiz.`} />
        <Kpi label="Top asesor" value={topAsesor?.alias || '—'} small icon={Sparkles} />
      </div>

      {porAsesor.length === 0 ? (
        <EmptyState icon={DollarSign} title="Sin comisiones en este período" description="Aún no hay ventas registradas en el período seleccionado." />
      ) : (
        <div className="card overflow-hidden">
          {porAsesor.map((a) => {
            const expandido = asesorSeleccionado === a.alias;
            return (
              <div key={a.alias} className="border-b border-border last:border-0">
                <button
                  onClick={() => setAsesorSeleccionado(expandido ? null : a.alias)}
                  className="w-full p-4 hover:bg-surface-sunken text-left transition flex items-center gap-3 flex-wrap"
                >
                  <Avatar name={a.alias} color={ROLES.asesor_comercial.accent} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-fg">{a.alias}</div>
                    <div className="text-[10px] text-fg-muted">
                      {a.ventas.length} venta{a.ventas.length !== 1 ? 's' : ''} · {money(a.totalVentas)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-emerald-700 dark:text-emerald-400 uppercase font-bold">Ganada</div>
                    <div className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">{money(a.ganada)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-amber-700 dark:text-amber-400 uppercase font-bold">Pendiente</div>
                    <div className="text-sm font-mono text-amber-700 dark:text-amber-400">{money(a.pendiente)}</div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-fg-subtle transition ${expandido ? 'rotate-90' : ''}`} />
                </button>

                {expandido && (
                  <div className="bg-surface-sunken border-t border-border px-4 py-3">
                    <div className="space-y-1.5">
                      {a.ventas.map((ev) => {
                        const ganada = esComisionGanada(ev);
                        const com = calcComision(ev, rangosComision);
                        const base = calcBaseComision(ev);
                        const pct = calcPorcentajeComision(base, rangosComision);
                        const total = calcTotal(ev);
                        const pagado = calcPagado(ev);
                        const pctPagado = total > 0 ? Math.round((pagado / total) * 100) : 0;
                        return (
                          <div
                            key={ev.id}
                            onClick={() => onOpen(ev.id)}
                            className="bg-surface border border-border hover:border-brand/40 rounded-lg p-2.5 cursor-pointer flex items-start gap-2 transition"
                          >
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${ganada ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[10px] font-bold bg-surface-sunken px-1.5 py-0.5 rounded">
                                  {ev.numeroEvento}-{ev.version}
                                </span>
                                <span className="text-xs font-semibold truncate text-fg">{ev.razonSocial}</span>
                                {ganada ? (
                                  <span className="chip bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">✓ Ganada</span>
                                ) : (
                                  <span className="chip bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">{pctPagado}% pagado</span>
                                )}
                              </div>
                              <div className="text-[10px] text-fg-muted mt-0.5">
                                Base: {money(base)} × {pct}% ={' '}
                                <strong className={ganada ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}>
                                  {money(com)}
                                </strong>
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-fg-subtle flex-shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ModalConfigRangos
        open={showConfig && esGerencia}
        rangos={rangosComision}
        onCancel={() => setShowConfig(false)}
        onSave={async (r) => {
          await persistRangos(r);
          setShowConfig(false);
        }}
      />
    </div>
  );
}

function FiltroChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
        active ? 'bg-fg text-surface' : 'bg-surface-sunken text-fg-muted hover:bg-border'
      }`}
    >
      {children}
    </button>
  );
}
