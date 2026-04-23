import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Lock, Plus, Search } from 'lucide-react';
import { PageHeader } from '../shared/PageHeader.jsx';
import { EmptyState } from '../shared/EmptyState.jsx';
import { EstadoBadge } from '../shared/Estado.jsx';
import { ModalVender } from './ModalVender.jsx';
import { ModalPerder } from './ModalPerder.jsx';
import { ESTADOS } from '../../constants.js';
import { money, fmtFecha } from '../../utils/format.js';
import { calcTotal } from '../../utils/calculos.js';

export function LeadsView({ events, currentUser, onOpen, onNew, onMarcarVendida, onMarcarPerdida, onNuevaVersion }) {
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('TODOS');
  const [accion, setAccion] = useState(null);

  const filtered = useMemo(() => {
    return events
      .filter((e) => {
        if (filtro !== 'TODOS' && e.estado !== filtro) return false;
        if (search) {
          const s = search.toLowerCase();
          return `${e.numeroEvento} ${e.razonSocial} ${e.contactoNombre}`.toLowerCase().includes(s);
        }
        return true;
      })
      .sort(
        (a, b) =>
          (b.numeroEvento || '').localeCompare(a.numeroEvento || '') ||
          (b.version || 0) - (a.version || 0)
      );
  }, [events, filtro, search]);

  const puedeCrear = ['coord_comercial', 'asesor_comercial'].includes(currentUser.rol);

  return (
    <div>
      <PageHeader
        title="Leads & Cotizaciones"
        subtitle="Gestión de oportunidades"
        action={
          puedeCrear && (
            <button onClick={onNew} className="btn-dark">
              <Plus className="w-3.5 h-3.5" /> Nueva cotización
            </button>
          )
        }
      />

      <div className="card p-3 mb-4 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, contacto, número..."
            className="input pl-8"
          />
        </div>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="input w-auto">
          <option value="TODOS">Todos</option>
          {ESTADOS.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>
        <span className="text-[10px] text-fg-muted ml-auto font-mono">{filtered.length} / {events.length}</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={events.length === 0 ? 'Sin eventos aún' : 'Sin resultados'}
          description={events.length === 0 ? 'Crea la primera cotización para comenzar.' : 'Ajusta los filtros para encontrar lo que buscas.'}
          action={events.length === 0 && puedeCrear ? (
            <button onClick={onNew} className="btn-primary">
              <Plus className="w-3.5 h-3.5" /> Nueva cotización
            </button>
          ) : null}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((e, idx) => {
            const puedeAccion = e.finalizado && e.estado === 'EN ESPERA';
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.02, 0.3), duration: 0.2 }}
                className="card-hover p-3"
              >
                <div className="flex items-start gap-3">
                  <div onClick={() => onOpen(e.id)} className="flex-1 cursor-pointer min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-[11px] font-semibold bg-surface-sunken px-2 py-0.5 rounded">
                        {e.numeroEvento}-{e.version}
                      </span>
                      <EstadoBadge estado={e.estado} />
                      {!e.finalizado && (
                        <span className="chip bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
                          BORRADOR
                        </span>
                      )}
                      {e.finalizado && (
                        <span className="chip bg-fg text-surface border-fg">
                          <Lock className="w-2.5 h-2.5" />BLOQUEADA
                        </span>
                      )}
                      <span className="text-[10px] text-fg-subtle">· {e.comercial || '—'}</span>
                    </div>
                    <div className="text-sm font-semibold truncate text-fg">
                      {e.razonSocial || <span className="text-fg-subtle">Sin nombre</span>}
                    </div>
                    <div className="text-[11px] text-fg-muted mt-0.5">
                      {e.fechaEvento ? fmtFecha(e.fechaEvento) : '—'} · <span className="font-mono font-semibold">{money(calcTotal(e))}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {puedeAccion && (
                      <>
                        <button
                          onClick={() => setAccion({ tipo: 'vender', ev: e })}
                          className="text-[10px] px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-semibold transition active:scale-95"
                        >
                          ✓ Vendida
                        </button>
                        <button
                          onClick={() => setAccion({ tipo: 'perder', ev: e })}
                          className="text-[10px] px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition active:scale-95"
                        >
                          ✗ Perdida
                        </button>
                        <button
                          onClick={() => onNuevaVersion(e)}
                          className="text-[10px] px-2.5 py-1 border border-border hover:bg-surface-sunken text-fg-muted rounded-full font-medium transition"
                        >
                          + Versión
                        </button>
                      </>
                    )}
                    {e.estado === 'VENDIDO' && (
                      <button
                        onClick={() => onNuevaVersion(e)}
                        className="text-[10px] px-2.5 py-1 border border-border hover:bg-surface-sunken text-fg-muted rounded-full font-medium transition"
                      >
                        + Versión
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <ModalVender
        open={accion?.tipo === 'vender'}
        ev={accion?.ev}
        onCancel={() => setAccion(null)}
        onConfirm={(datos) => {
          onMarcarVendida(accion.ev, datos);
          setAccion(null);
        }}
      />
      <ModalPerder
        open={accion?.tipo === 'perder'}
        ev={accion?.ev}
        onCancel={() => setAccion(null)}
        onConfirm={(motivo) => {
          onMarcarPerdida(accion.ev, motivo);
          setAccion(null);
        }}
      />
    </div>
  );
}
