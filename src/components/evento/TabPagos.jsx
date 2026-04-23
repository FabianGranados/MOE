import { useState } from 'react';
import { DollarSign, FileText, Plus, Trash2 } from 'lucide-react';
import { Confirm } from '../shared/Confirm.jsx';
import { ModalPago } from './ModalPago.jsx';
import { REGLAS_PAGO } from '../../constants.js';
import { fmtFecha, money } from '../../utils/format.js';
import { calcPagado, calcTotal } from '../../utils/calculos.js';

export function TabPagos({ ev, set }) {
  const [showForm, setShowForm] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const total = calcTotal(ev);
  const pagado = calcPagado(ev);
  const saldo = total - pagado;
  const pct = total > 0 ? Math.round((pagado / total) * 100) : 0;

  const addPago = (pago) => {
    set({ pagos: [...(ev.pagos || []), pago] });
    setShowForm(false);
  };
  const removePago = (id) => {
    set({ pagos: ev.pagos.filter((p) => p.id !== id) });
    setConfirmDel(null);
  };
  const validarPago = (id) =>
    set({
      pagos: ev.pagos.map((p) =>
        p.id === id ? { ...p, validado: true, fechaValidacion: new Date().toISOString() } : p
      )
    });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-violet-200 dark:border-violet-500/30 bg-gradient-to-br from-violet-50 dark:from-violet-500/10 to-violet-100/50 dark:to-violet-500/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] text-violet-700 dark:text-violet-400 uppercase tracking-wider font-bold">{ev.formaPago}</div>
            <div className="text-[11px] text-fg-muted mt-0.5">{REGLAS_PAGO[ev.formaPago]}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-violet-700 dark:text-violet-400">{pct}%</div>
            <div className="text-[10px] text-fg-muted">pagado</div>
          </div>
        </div>
        <div className="h-2 bg-surface rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all duration-700"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[9px] text-fg-muted uppercase">Total</div>
            <div className="text-xs font-bold font-mono text-fg">{money(total)}</div>
          </div>
          <div>
            <div className="text-[9px] text-emerald-700 dark:text-emerald-400 uppercase">Pagado</div>
            <div className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400">{money(pagado)}</div>
          </div>
          <div>
            <div className="text-[9px] text-amber-700 dark:text-amber-400 uppercase">Saldo</div>
            <div className="text-xs font-bold font-mono text-amber-700 dark:text-amber-400">{money(saldo)}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {(ev.pagos || []).length} pago{(ev.pagos || []).length !== 1 ? 's' : ''}
        </h3>
        <button onClick={() => setShowForm(true)} className="btn-primary py-2">
          <Plus className="w-3.5 h-3.5" /> Registrar pago
        </button>
      </div>

      {(ev.pagos || []).length === 0 ? (
        <div className="bg-surface-sunken border border-dashed border-border rounded-xl p-8 text-center">
          <DollarSign className="w-10 h-10 text-fg-subtle mx-auto mb-2" />
          <p className="text-xs text-fg-muted font-medium">Sin pagos registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(ev.pagos || []).map((p) => (
            <div key={p.id} className="card p-3 flex items-start gap-3">
              {p.foto ? (
                <a href={p.foto} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-lg overflow-hidden bg-surface-sunken flex-shrink-0">
                  <img src={p.foto} alt="" className="w-full h-full object-cover" />
                </a>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-surface-sunken flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-fg-subtle" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-sm font-bold font-mono">{money(p.monto)}</div>
                  <span className="chip bg-surface-sunken text-fg-muted border-border">{p.metodo}</span>
                  {p.validado ? (
                    <span className="chip bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">✓ Validado</span>
                  ) : (
                    <span className="chip bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">Por validar</span>
                  )}
                </div>
                <div className="text-[11px] text-fg-muted mt-0.5">
                  {fmtFecha(p.fecha)} · {p.banco || '—'} {p.referencia && `· Ref: ${p.referencia}`}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {!p.validado && (
                  <button
                    onClick={() => validarPago(p.id)}
                    className="text-[10px] px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium transition"
                  >
                    ✓ Validar
                  </button>
                )}
                <button
                  onClick={() => setConfirmDel(p.id)}
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 text-fg-subtle hover:text-red-600 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalPago open={showForm} onCancel={() => setShowForm(false)} onSave={addPago} saldo={saldo} />

      <Confirm
        open={!!confirmDel}
        onCancel={() => setConfirmDel(null)}
        onConfirm={() => removePago(confirmDel)}
        title="¿Eliminar pago?"
        description="No se puede deshacer."
        confirmLabel="Eliminar"
      />
    </div>
  );
}
