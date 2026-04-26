import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, Clock, FileText, Lock, Plus, Truck } from 'lucide-react';
import { PageHeader } from '../shared/PageHeader.jsx';
import { EmptyState } from '../shared/EmptyState.jsx';
import { fmtFechaCorta, fmtFechaLarga, money } from '../../utils/format.js';
import { calcTotal } from '../../utils/calculos.js';
import { RemisionWizard } from './RemisionWizard.jsx';
import { RemisionDetail } from './RemisionDetail.jsx';

/**
 * Vista raíz del módulo Remisiones de Pedido.
 *
 * Estados internos:
 *   · 'list'   → 3 grupos: pendientes, borrador, finalizadas
 *   · 'edit'   → wizard para crear o continuar borrador
 *   · 'detail' → ver remisión finalizada (readonly + otrosíes)
 */
export function RemisionesView({
  events,
  remisiones,
  hydrated,
  refresh,
  saveRemision,
  finalizeRemision,
  addAddendum,
  currentUser
}) {
  const [view, setView] = useState('list');
  const [activeCotizacionId, setActiveCotizacionId] = useState(null);
  const [activeRemisionId, setActiveRemisionId] = useState(null);

  const esBodegaOLog = ['jefe_bodega', 'coord_logistica', 'logistico_campo'].includes(currentUser.rol);
  const esComercial = currentUser.rol === 'asesor_comercial';

  // Mapa por (cotizacionId-version) → remisión
  const remisionPorCotizacion = useMemo(() => {
    const m = new Map();
    remisiones.forEach((r) => {
      m.set(`${r.cotizacionId}|${r.cotizacionVersion}`, r);
    });
    return m;
  }, [remisiones]);

  // Eventos vendidos visibles para este usuario
  const eventosVendidos = useMemo(() => {
    return events.filter((e) => e.estado === 'VENDIDO' && e.finalizado);
  }, [events]);

  // Agrupados:
  //   · pendientes    → vendidos sin remisión
  //   · enBorrador    → con remisión sin finalizar
  //   · finalizadas   → con remisión finalizada
  const { pendientes, enBorrador, finalizadas } = useMemo(() => {
    const pendientes = [];
    const enBorrador = [];
    const finalizadas = [];

    eventosVendidos.forEach((ev) => {
      const rem = remisionPorCotizacion.get(`${ev.id}|${ev.version || 1}`);
      if (!rem) {
        pendientes.push({ ev, rem: null });
      } else if (rem.finalizada) {
        finalizadas.push({ ev, rem });
      } else {
        enBorrador.push({ ev, rem });
      }
    });

    return { pendientes, enBorrador, finalizadas };
  }, [eventosVendidos, remisionPorCotizacion]);

  // Para bodega/logística: muestran SOLO finalizadas (es lo que RLS les permite leer)
  const finalizadasParaBodega = useMemo(() => {
    if (!esBodegaOLog) return [];
    return remisiones
      .filter((r) => r.finalizada)
      .map((r) => {
        const ev = events.find((e) => e.id === r.cotizacionId);
        return { ev, rem: r };
      });
  }, [esBodegaOLog, remisiones, events]);

  // ----- Vista WIZARD ----------------------------------------------------
  if (view === 'edit' && activeCotizacionId) {
    const ev = events.find((e) => e.id === activeCotizacionId);
    if (!ev) {
      setView('list');
      return null;
    }
    const remActual = remisionPorCotizacion.get(`${ev.id}|${ev.version || 1}`) || null;
    return (
      <RemisionWizard
        evento={ev}
        remisionInicial={remActual}
        currentUser={currentUser}
        onCancel={() => { setView('list'); setActiveCotizacionId(null); }}
        onSave={saveRemision}
        onFinalize={finalizeRemision}
        onDone={async () => { await refresh(); setView('list'); setActiveCotizacionId(null); }}
      />
    );
  }

  // ----- Vista DETALLE ---------------------------------------------------
  if (view === 'detail' && activeRemisionId) {
    const rem = remisiones.find((r) => r.id === activeRemisionId);
    if (!rem) {
      setView('list');
      return null;
    }
    const ev = events.find((e) => e.id === rem.cotizacionId);
    return (
      <RemisionDetail
        evento={ev}
        remision={rem}
        currentUser={currentUser}
        onBack={() => { setView('list'); setActiveRemisionId(null); }}
        onAddAddendum={async (texto) => {
          await addAddendum(rem.id, texto, currentUser);
        }}
      />
    );
  }

  // ----- Vista LISTA -----------------------------------------------------
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Remisiones de pedido"
        subtitle={
          esBodegaOLog
            ? 'Pedidos confirmados por el comercial · listos para alistar y despachar'
            : 'Cuando el evento esté vendido y pagado, crea aquí su remisión para enviar a logística'
        }
        eyebrow={<><Truck className="w-3.5 h-3.5" /> Logística</>}
      />

      {!hydrated ? (
        <div className="text-sm text-fg-muted">Cargando remisiones...</div>
      ) : esBodegaOLog ? (
        // Bodega/logística: sólo finalizadas
        <BodegaList items={finalizadasParaBodega} onOpen={(rem) => { setActiveRemisionId(rem.id); setView('detail'); }} />
      ) : (
        <div className="space-y-6">
          <Grupo
            titulo="Pendientes de remisión"
            subtitulo="Eventos vendidos sin remisión todavía"
            color="amber"
            items={pendientes}
            empty="No hay eventos vendidos pendientes — buen trabajo."
            onClick={({ ev }) => { setActiveCotizacionId(ev.id); setView('edit'); }}
            esComercial={esComercial}
            cta="Crear remisión"
          />
          <Grupo
            titulo="Remisiones en borrador"
            subtitulo="Empezadas pero sin finalizar"
            color="sky"
            items={enBorrador}
            empty="Ningún borrador abierto."
            onClick={({ ev }) => { setActiveCotizacionId(ev.id); setView('edit'); }}
            esComercial={esComercial}
            cta="Continuar"
          />
          <Grupo
            titulo="Finalizadas"
            subtitulo="Visibles para bodega y logística"
            color="emerald"
            items={finalizadas}
            empty="Aún no has finalizado ninguna remisión."
            onClick={({ rem }) => { setActiveRemisionId(rem.id); setView('detail'); }}
            esComercial={esComercial}
            cta="Ver"
          />
        </div>
      )}
    </div>
  );
}

// =====================================================================
// Grupo (sección con título + lista)
// =====================================================================
function Grupo({ titulo, subtitulo, color, items, empty, onClick, esComercial, cta }) {
  const colorClasses = {
    amber:  { bg: 'bg-amber-50 dark:bg-amber-500/10',  border: 'border-amber-200 dark:border-amber-500/30',   icon: Clock,         iconColor: 'text-amber-600' },
    sky:    { bg: 'bg-sky-50 dark:bg-sky-500/10',      border: 'border-sky-200 dark:border-sky-500/30',       icon: FileText,      iconColor: 'text-sky-600' },
    emerald:{ bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30', icon: CheckCircle2, iconColor: 'text-emerald-600' }
  }[color];
  const Icon = colorClasses.icon;

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${colorClasses.iconColor}`} />
        <h2 className="text-sm font-bold tracking-tight">{titulo}</h2>
        <span className="text-[11px] text-fg-muted">· {items.length}</span>
        <span className="text-[11px] text-fg-subtle ml-auto">{subtitulo}</span>
      </div>

      {items.length === 0 ? (
        <div className={`${colorClasses.bg} ${colorClasses.border} border rounded-xl p-4 text-xs text-fg-muted text-center`}>
          {empty}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map(({ ev, rem }) => (
            <li key={ev.id + (rem?.id || '')}>
              <button
                onClick={() => onClick({ ev, rem })}
                className="w-full text-left card hover:border-brand/40 transition p-4 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono px-1.5 py-0.5 bg-surface-sunken border border-border rounded">
                      {ev.numeroEvento}-{ev.version || 1}
                    </span>
                    <span className="font-semibold truncate">{ev.razonSocial || 'Sin nombre'}</span>
                    {rem?.finalizada && (
                      <span className="chip bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300">
                        <Lock className="w-3 h-3" /> Finalizada
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-fg-muted mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    {ev.fechaEvento && <span>📅 {fmtFechaCorta(ev.fechaEvento)}</span>}
                    {ev.ciudad && <span>📍 {ev.ciudad}</span>}
                    <span className="font-mono">{money(calcTotal(ev))}</span>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-brand flex items-center gap-1">
                  {cta} <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// =====================================================================
// Vista bodega/logística — lista plana de finalizadas
// =====================================================================
function BodegaList({ items, onOpen }) {
  if (items.length === 0) {
    return <EmptyState icon={Truck} title="Sin remisiones" description="Aún no hay remisiones finalizadas por los comerciales." />;
  }
  return (
    <ul className="space-y-2">
      {items.map(({ ev, rem }) => (
        <li key={rem.id}>
          <button
            onClick={() => onOpen(rem)}
            className="w-full text-left card hover:border-brand/40 transition p-4 flex items-center gap-3"
          >
            <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono px-1.5 py-0.5 bg-surface-sunken border border-border rounded">
                  {rem.numero || `${ev?.numeroEvento || '?'}-R-${rem.cotizacionVersion}`}
                </span>
                <span className="font-semibold truncate">{ev?.razonSocial || 'Sin nombre'}</span>
              </div>
              <div className="text-[11px] text-fg-muted mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                {ev?.fechaEvento && <span>📅 {fmtFechaLarga(ev.fechaEvento)}</span>}
                {ev?.ciudad && <span>📍 {ev.ciudad}</span>}
                {rem.fechaFinalizacion && <span>Enviada {fmtFechaCorta(rem.fechaFinalizacion)}</span>}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-fg-subtle" />
          </button>
        </li>
      ))}
    </ul>
  );
}
