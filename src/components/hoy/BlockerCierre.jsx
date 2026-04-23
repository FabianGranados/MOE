import { AlertTriangle, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { EstadoBadge } from '../shared/Estado.jsx';
import { money, fmtFechaCorta } from '../../utils/format.js';
import { calcTotal } from '../../utils/calculos.js';
import { diasHasta } from '../../utils/format.js';

export function BlockerCierre({ pendientes, onMarcarVendida, onMarcarPerdida, onOpen }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border-2 border-red-500/40 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-500/10 dark:to-orange-500/10 p-5 mb-5 shadow-pop"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/30">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-red-900 dark:text-red-300 tracking-tight">
            Acción requerida antes de continuar
          </h2>
          <p className="text-xs text-red-800 dark:text-red-400 mt-0.5">
            Tienes <strong>{pendientes.length}</strong> cotización{pendientes.length !== 1 ? 'es' : ''} con <strong>fecha pasada</strong> sin marcar como Vendida o Perdida.
            Debes cerrarlas para ver tus KPIs y tareas del día.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {pendientes.map((ev) => {
          const d = diasHasta(ev.fechaEvento);
          return (
            <div
              key={ev.id}
              className="bg-surface border border-red-200 dark:border-red-500/30 rounded-xl p-3 flex items-start gap-3"
            >
              <div onClick={() => onOpen(ev.id)} className="flex-1 min-w-0 cursor-pointer">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] font-bold bg-surface-sunken px-1.5 py-0.5 rounded">
                    {ev.numeroEvento}-{ev.version}
                  </span>
                  <EstadoBadge estado={ev.estado} size="xs" />
                </div>
                <div className="text-sm font-semibold truncate text-fg mt-0.5">
                  {ev.razonSocial || 'Sin nombre'}
                </div>
                <div className="text-[11px] text-red-700 dark:text-red-400 mt-0.5 font-medium">
                  📅 {fmtFechaCorta(ev.fechaEvento)} · pasó hace {Math.abs(d)} día{Math.abs(d) !== 1 ? 's' : ''} · <span className="font-mono font-bold">{money(calcTotal(ev))}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 flex-shrink-0">
                <button
                  onClick={() => onMarcarVendida(ev)}
                  className="text-[10px] px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold transition active:scale-95 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" /> Vendida
                </button>
                <button
                  onClick={() => onMarcarPerdida(ev)}
                  className="text-[10px] px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition active:scale-95 flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3" /> Perdida
                </button>
                <button
                  onClick={() => onOpen(ev.id)}
                  className="text-[10px] px-2.5 py-1 border border-border hover:bg-surface-sunken text-fg-muted rounded-full font-medium transition flex items-center gap-1"
                >
                  Ver <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
