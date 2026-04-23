import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles, Sun } from 'lucide-react';
import { PageHeader } from '../shared/PageHeader.jsx';
import { EmptyState } from '../shared/EmptyState.jsx';
import { Seccion } from './Seccion.jsx';
import { clasificar } from '../../utils/eventos.js';
import { fmtFechaLarga, hoy } from '../../utils/format.js';

const fechaCapital = (() => {
  const s = fmtFechaLarga(hoy());
  return s.charAt(0).toUpperCase() + s.slice(1);
})();

export function HoyView({ events, onOpen, onNew }) {
  const clasif = useMemo(() => {
    const secs = { 1: [], 2: [], 3: [], 5: [] };
    events.forEach((ev) => {
      const c = clasificar(ev);
      if (c && secs[c.seccion]) secs[c.seccion].push({ ev, ...c });
    });
    return secs;
  }, [events]);

  const total = Object.values(clasif).reduce((s, a) => s + a.length, 0);

  return (
    <div className="pb-24 md:pb-0">
      <PageHeader
        eyebrow={<><Sun className="w-3.5 h-3.5" />{fechaCapital}</>}
        title="HOY"
        subtitle={total === 0 ? 'Todo bajo control.' : `${total} ${total === 1 ? 'cosa requiere' : 'cosas requieren'} tu atención.`}
        action={
          <button onClick={onNew} className="hidden md:inline-flex btn-primary py-2">
            <Plus className="w-3.5 h-3.5" /> Nueva cotización
          </button>
        }
      />

      <div className="space-y-6">
        <Seccion title="Acción obligatoria" subtitle="Eventos ya pasaron" tone="red" items={clasif[1]} onOpen={onOpen} />
        <Seccion title="Urgente" subtitle="En ≤7 días sin confirmar" tone="orange" items={clasif[2]} onOpen={onOpen} />
        <Seccion title="Atención" subtitle="En 15 días · sin actividad" tone="amber" items={clasif[3]} onOpen={onOpen} />
        <Seccion title="Próximos eventos" subtitle="Vendidos en 15 días" tone="emerald" items={clasif[5]} onOpen={onOpen} />

        {total === 0 && (
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

      <motion.button
        onClick={onNew}
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 260, delay: 0.1 }}
        className="md:hidden fixed bottom-20 right-5 bg-brand hover:bg-brand-hover text-white rounded-full shadow-pop shadow-brand/40 flex items-center gap-2 px-5 py-3.5 z-20 font-semibold text-sm active:scale-95"
      >
        <Plus className="w-5 h-5" /> Nueva
      </motion.button>
    </div>
  );
}
