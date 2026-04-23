import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '../shared/PageHeader.jsx';
import { fmtFechaLarga, hoy } from '../../utils/format.js';
import { calcTotal } from '../../utils/calculos.js';
import { TabResumen } from './TabResumen.jsx';
import { TabPipeline } from './TabPipeline.jsx';
import { TabProductividad } from './TabProductividad.jsx';
import { TabProductos } from './TabProductos.jsx';
import { TabLeads } from './TabLeads.jsx';

const TABS = [
  { k: 'resumen',       l: 'Resumen' },
  { k: 'pipeline',      l: 'Pipeline' },
  { k: 'productividad', l: 'Productividad' },
  { k: 'productos',     l: 'Productos' },
  { k: 'leads',         l: 'Leads' }
];

const fechaCapital = (() => {
  const s = fmtFechaLarga(hoy());
  return s.charAt(0).toUpperCase() + s.slice(1);
})();

export function DashboardView({ events, onOpen }) {
  const [tab, setTab] = useState('resumen');

  const stats = useMemo(() => {
    const fin = events.filter((e) => e.finalizado);
    const vend = fin.filter((e) => e.estado === 'VENDIDO');
    const perd = fin.filter((e) => e.estado === 'PERDIDO');
    const espera = fin.filter((e) => e.estado === 'EN ESPERA');
    const valorVendido = vend.reduce((s, e) => s + calcTotal(e), 0);
    const valorEnJuego = espera.reduce((s, e) => s + calcTotal(e), 0);
    const valorPerdido = perd.reduce((s, e) => s + calcTotal(e), 0);
    return {
      total: fin.length,
      vendidos: vend.length,
      enEspera: espera.length,
      perdidos: perd.length,
      valorVendido,
      valorEnJuego,
      valorPerdido,
      conversion: fin.length > 0 ? Math.round((vend.length / fin.length) * 100) : 0,
      ticketPromedio: vend.length > 0 ? Math.round(valorVendido / vend.length) : 0
    };
  }, [events]);

  return (
    <div>
      <PageHeader title="Dashboard ejecutivo" subtitle={fechaCapital} />

      <div className="relative flex border-b-2 border-border mb-5 overflow-x-auto scrollbar-none">
        {TABS.map((t) => {
          const active = tab === t.k;
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`relative px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition ${
                active ? 'text-brand' : 'text-fg-muted hover:text-fg'
              }`}
            >
              {t.l}
              {active && (
                <motion.div
                  layoutId="dashboard-tab-underline"
                  className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-brand rounded-full"
                  transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {tab === 'resumen'       && <TabResumen stats={stats} events={events} onOpen={onOpen} />}
        {tab === 'pipeline'      && <TabPipeline events={events} onOpen={onOpen} />}
        {tab === 'productividad' && <TabProductividad events={events} />}
        {tab === 'productos'     && <TabProductos events={events} />}
        {tab === 'leads'         && <TabLeads events={events} />}
      </motion.div>
    </div>
  );
}
