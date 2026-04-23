import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '../shared/Modal.jsx';
import { Fld } from '../shared/Fld.jsx';
import { FRANJAS } from '../../constants.js';
import { fmtFechaCorta, fmtFechaLarga } from '../../utils/format.js';

function resumenHorario(h) {
  if (!h) return 'sin definir';
  if (h.tipo === 'cerrado') return h.hora ? `${h.hora} h (cerrado)` : 'cerrado · sin hora';
  return `abierto · ${FRANJAS[h.franja] || ''}`;
}

function resumenFechaHora(bloque) {
  if (!bloque?.fecha) return 'sin definir';
  return `${fmtFechaCorta(bloque.fecha)} · ${resumenHorario(bloque)}`;
}

export function ModalVender({ open, ev, onCancel, onConfirm }) {
  const [notasBodega, setNotasBodega] = useState('');
  const [confirmaHorarios, setConfirmaHorarios] = useState(true);

  useEffect(() => {
    if (open) {
      setNotasBodega('');
      setConfirmaHorarios(true);
    }
  }, [open]);

  if (!ev) return null;

  const submit = () => {
    onConfirm({
      notasOperativas: notasBodega
        ? `${ev.notasOperativas ? ev.notasOperativas + '\n\n--- Al marcar vendida ---\n' : ''}${notasBodega}`
        : ev.notasOperativas || '',
      horariosConfirmados: confirmaHorarios,
      fechaConfirmacionVenta: new Date().toISOString()
    });
  };

  const tieneLogistica = ev.direccion || ev.montaje?.fecha || ev.desmontaje?.fecha;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="lg"
      tone="success"
      title={
        <span className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Marcar {ev.numeroEvento}-{ev.version} como VENDIDA
        </span>
      }
      subtitle={ev.fechaEvento ? `📅 Evento: ${fmtFechaLarga(ev.fechaEvento)}` : undefined}
      footer={
        <>
          <button onClick={onCancel} className="btn-ghost">Cancelar</button>
          <button onClick={submit} className="btn-success">Confirmar VENDIDA</button>
        </>
      }
    >
      <div className="p-5 space-y-4">
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-3 text-[11px] text-emerald-900 dark:text-emerald-300">
          🎉 El cliente aceptó. Revisa que los horarios siguen igual y agrega notas para bodega/logística si necesitas.
        </div>

        {tieneLogistica ? (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-fg-muted">Resumen de logística</h4>
              <span className="chip bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                Según cotización
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <Linea label="Dirección" value={ev.direccion || '—'} />
              <Linea label="Horario del evento" value={resumenHorario(ev.horarioEvento)} />
              <Linea label="Montaje" value={resumenFechaHora(ev.montaje)} />
              <Linea label="Desmontaje" value={resumenFechaHora(ev.desmontaje)} />
              {ev.contactoPrincipal?.nombre && (
                <Linea
                  label="Contacto principal"
                  value={`${ev.contactoPrincipal.nombre} · ${ev.contactoPrincipal.celular || ''}`}
                />
              )}
            </div>

            <label className="flex items-start gap-2.5 mt-4 pt-3 border-t border-border cursor-pointer">
              <input
                type="checkbox"
                checked={confirmaHorarios}
                onChange={(e) => setConfirmaHorarios(e.target.checked)}
                className="mt-0.5"
              />
              <div>
                <div className="text-xs font-semibold text-fg">Confirmo que los horarios y logística siguen igual</div>
                <div className="text-[10px] text-fg-muted mt-0.5">
                  Si el cliente cambió algo, desmarca esto y luego edita los datos desde el detalle de la cotización.
                </div>
              </div>
            </label>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Esta cotización no tiene datos de logística. Recuerda completarlos desde el detalle después de marcar vendida para que bodega y logística puedan operar.</span>
          </div>
        )}

        <Fld
          label="Notas para bodega y logística"
          hint="Opcional · las verá el equipo operativo"
        >
          <textarea
            value={notasBodega}
            onChange={(e) => setNotasBodega(e.target.value)}
            rows={4}
            className="input resize-none"
            placeholder="Ej: el cliente solicita mantelería extra de repuesto, hay escaleras para el montaje, acceso limitado por la mañana..."
          />
        </Fld>
      </div>
    </Modal>
  );
}

function Linea({ label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[10px] uppercase tracking-wider font-bold text-fg-muted w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-fg flex-1 min-w-0">{value}</span>
    </div>
  );
}
