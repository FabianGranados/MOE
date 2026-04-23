import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, DollarSign, Plus, Sparkles, Sun, Target, TrendingUp } from 'lucide-react';
import { PageHeader } from '../shared/PageHeader.jsx';
import { EmptyState } from '../shared/EmptyState.jsx';
import { Kpi } from '../shared/Kpi.jsx';
import { Seccion } from './Seccion.jsx';
import { BlockerCierre } from './BlockerCierre.jsx';
import { ModalVender } from '../leads/ModalVender.jsx';
import { ModalPerder } from '../leads/ModalPerder.jsx';
import { clasificar } from '../../utils/eventos.js';
import { requiereCierre } from '../../utils/semaforo.js';
import { fmtFechaLarga, hoy, money } from '../../utils/format.js';
import { calcTotal } from '../../utils/calculos.js';
import { calcComision, esComisionGanada } from '../../utils/comisiones.js';

const fechaCapital = (() => {
  const s = fmtFechaLarga(hoy());
  return s.charAt(0).toUpperCase() + s.slice(1);
})();

export function HoyView({ events, onOpen, onNew, onMarcarVendida, onMarcarPerdida, rangosComision, currentUser }) {
  const [accion, setAccion] = useState(null);

  const pendientesCierre = useMemo(() => events.filter(requiereCierre), [events]);

  const kpis = useMemo(() => {
    const mesActual = new Date().toISOString().slice(0, 7);
    let ganada = 0;
    let pendiente = 0;
    let vendidas = 0;
    let enEspera = 0;
    let totalFinalizadas = 0;

    events.forEach((ev) => {
      if (!ev.finalizado) return;
      totalFinalizadas++;
      if (ev.estado === 'EN ESPERA') enEspera++;
      if ((ev.fechaEvento || '').startsWith(mesActual) && ev.estado === 'VENDIDO') {
        vendidas++;
        const com = calcComision(ev, rangosComision);
        if (esComisionGanada(ev)) ganada += com;
        else pendiente += com;
      }
    });

    const totalMes = events.filter(
      (e) => e.finalizado && (e.fechaEvento || '').startsWith(mesActual)
    );
    const vendidasMes = totalMes.filter((e) => e.estado === 'VENDIDO').length;
    const conv = totalMes.length > 0 ? Math.round((vendidasMes / totalMes.length) * 100) : 0;

    return { ganada, pendiente, vendidas, enEspera, conv };
  }, [events, rangosComision]);

  const clasif = useMemo(() => {
    const secs = { 1: [], 2: [], 3: [], 5: [] };
    events.forEach((ev) => {
      const c = clasificar(ev);
      if (c && secs[c.seccion]) secs[c.seccion].push({ ev, ...c });
    });
    return secs;
  }, [events]);

  const totalAlertas = Object.values(clasif).reduce((s, a) => s + a.length, 0);
  const bloqueado = pendientesCierre.length > 0;

  return (
    <div className="pb-24 md:pb-0">
      <PageHeader
        eyebrow={<><Sun className="w-3.5 h-3.5" />{fechaCapital}</>}
        title="HOY"
        subtitle={
          bloqueado
            ? 'Resuelve las cotizaciones pendientes antes de ver el resto.'
            : totalAlertas === 0
            ? 'Todo bajo control.'
            : `${totalAlertas} ${totalAlertas === 1 ? 'cosa requiere' : 'cosas requieren'} tu atención.`
        }
        action={
          !bloqueado && (
            <button onClick={onNew} className="hidden md:inline-flex btn-primary py-2">
              <Plus className="w-3.5 h-3.5" /> Nueva cotización
            </button>
          )
        }
      />

      {bloqueado && (
        <BlockerCierre
          pendientes={pendientesCierre}
          onOpen={onOpen}
          onMarcarVendida={(ev) => setAccion({ tipo: 'vender', ev })}
          onMarcarPerdida={(ev) => setAccion({ tipo: 'perder', ev })}
        />
      )}

      {!bloqueado && (
        <>
          {/* KPIs personales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <Kpi
              label="Comisión ganada"
              value={money(kpis.ganada)}
              sub="Este mes · cobradas"
              icon={CheckCircle2}
              tone="success"
              small
            />
            <Kpi
              label="Comisión pendiente"
              value={money(kpis.pendiente)}
              sub="Falta cobrar total"
              icon={Clock}
              tone="warning"
              small
            />
            <Kpi
              label="En espera"
              value={kpis.enEspera}
              sub="Cotizaciones activas"
              icon={Target}
              small
            />
            <Kpi
              label="Conversión"
              value={`${kpis.conv}%`}
              sub="Mes actual"
              icon={TrendingUp}
              tone={kpis.conv >= 50 ? 'success' : kpis.conv >= 30 ? 'warning' : 'default'}
              small
            />
          </div>

          <div className="space-y-6">
            <Seccion title="Acción obligatoria" subtitle="Eventos ya pasaron" tone="red" items={clasif[1]} onOpen={onOpen} onMarcarVendida={(ev) => setAccion({ tipo: 'vender', ev })} onMarcarPerdida={(ev) => setAccion({ tipo: 'perder', ev })} />
            <Seccion title="Urgente" subtitle="En ≤7 días sin confirmar" tone="orange" items={clasif[2]} onOpen={onOpen} onMarcarVendida={(ev) => setAccion({ tipo: 'vender', ev })} onMarcarPerdida={(ev) => setAccion({ tipo: 'perder', ev })} />
            <Seccion title="Atención" subtitle="En 15 días · sin actividad" tone="amber" items={clasif[3]} onOpen={onOpen} onMarcarVendida={(ev) => setAccion({ tipo: 'vender', ev })} onMarcarPerdida={(ev) => setAccion({ tipo: 'perder', ev })} />
            <Seccion title="Próximos eventos" subtitle="Vendidos en 15 días" tone="emerald" items={clasif[5]} onOpen={onOpen} />

            {totalAlertas === 0 && (
              <EmptyState
                icon={Sparkles}
                title="Día tranquilo"
                description="Todo bajo control. Aprovecha para crear nuevas cotizaciones o revisar el pipeline."
                action={
                  <button onClick={onNew} className="btn-dark">
                    <Plus className="w-3.5 h-3.5" /> Nueva cotización
                  </button>
                }
              />
            )}
          </div>
        </>
      )}

      {!bloqueado && (
        <motion.button
          onClick={onNew}
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 260, delay: 0.1 }}
          className="md:hidden fixed bottom-20 right-5 bg-brand hover:bg-brand-hover text-white rounded-full shadow-pop shadow-brand/40 flex items-center gap-2 px-5 py-3.5 z-20 font-semibold text-sm active:scale-95"
        >
          <Plus className="w-5 h-5" /> Nueva
        </motion.button>
      )}

      <ModalVender
        open={accion?.tipo === 'vender'}
        ev={accion?.ev}
        onCancel={() => setAccion(null)}
        onConfirm={(datos) => { onMarcarVendida(accion.ev, datos); setAccion(null); }}
      />
      <ModalPerder
        open={accion?.tipo === 'perder'}
        ev={accion?.ev}
        onCancel={() => setAccion(null)}
        onConfirm={(motivo) => { onMarcarPerdida(accion.ev, motivo); setAccion(null); }}
      />
    </div>
  );
}
