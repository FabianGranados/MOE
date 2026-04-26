import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, FileText, Send, Truck, User } from 'lucide-react';
import { Confirm } from '../shared/Confirm.jsx';
import { Fld } from '../shared/Fld.jsx';
import { Stepper } from '../shared/Stepper.jsx';
import { PersonasLista } from '../evento/PersonasLista.jsx';
import { fmtFechaLarga, fmtFechaCorta } from '../../utils/format.js';
import { audit } from '../../data/audit.js';

const DEFAULT_PERSONAS = [{ nombre: '', celular: '' }, { nombre: '', celular: '' }];

/**
 * Wizard para crear/continuar una remisión de pedido.
 *
 *   Paso 1 — Resumen del evento (readonly de la cotización)
 *   Paso 2 — Personas que reciben (mín 2) y que entregan (mín 2)
 *   Paso 3 — Notas operativas + Finalizar
 *
 * Persiste en autoguardado al avanzar de paso. Al finalizar, llama a
 * onFinalize y vuelve a la lista (se generará el PDF desde el detalle).
 */
export function RemisionWizard({
  evento,
  remisionInicial,
  currentUser,
  onCancel,
  onSave,
  onFinalize,
  onDone
}) {
  const [step, setStep] = useState(0);
  const [err, setErr] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Estado local de la remisión (editable). Si no había, arranca en blanco.
  const [rem, setRem] = useState(() => remisionInicial || {
    cotizacionId: evento.id,
    cotizacionVersion: evento.version || 1,
    personasMontaje: DEFAULT_PERSONAS,
    personasDesmontaje: DEFAULT_PERSONAS,
    notasOperativas: '',
    finalizada: false,
    creadoPor: currentUser?.id
  });

  const set = (patch) => setRem((p) => ({ ...p, ...patch }));

  const validarPersonas = () => {
    const errores = [];
    const pm = (rem.personasMontaje || []).filter((p) => p?.nombre?.trim() && p?.celular?.trim());
    if (pm.length < 2) errores.push('Mínimo 2 personas que reciben (nombre y celular)');
    const pd = (rem.personasDesmontaje || []).filter((p) => p?.nombre?.trim() && p?.celular?.trim());
    if (pd.length < 2) errores.push('Mínimo 2 personas que entregan (nombre y celular)');
    return errores;
  };

  const guardarBorrador = async () => {
    const result = await onSave(rem);
    if (result?.ok && result.data) {
      setRem((p) => ({ ...p, id: result.data.id }));
    }
    return result;
  };

  const onSiguiente = async () => {
    setErr('');
    if (step === 0) { setStep(1); return; }
    if (step === 1) {
      const errs = validarPersonas();
      if (errs.length) { setErr(errs.join(' · ')); return; }
      setBusy(true);
      const result = await guardarBorrador();
      setBusy(false);
      if (!result?.ok) {
        setErr(`No se pudo guardar el borrador: ${result?.error || 'sin detalle'}${result?.hint ? ' · Hint: ' + result.hint : ''}`);
        return;
      }
      setStep(2);
    }
  };

  const onAtras = () => {
    setErr('');
    setStep((s) => Math.max(0, s - 1));
  };

  const handleFinalizar = async () => {
    setBusy(true);
    // Asegurarnos de tener id (guarda borrador si aún no se ha guardado)
    let actual = rem;
    if (!rem.id) {
      const result = await guardarBorrador();
      if (!result?.ok) {
        setBusy(false);
        setErr(`No se pudo guardar antes de finalizar: ${result?.error || 'sin detalle'}`);
        return;
      }
      actual = { ...rem, id: result.data.id };
    }
    const fin = await onFinalize(actual, evento);
    setBusy(false);
    if (!fin?.ok) {
      setErr(`No se pudo finalizar la remisión: ${fin?.error || 'sin detalle'}`);
      return;
    }
    audit({
      modulo: 'logistica',
      accion: 'finalizar_remision',
      entidadTipo: 'remision',
      entidadId: fin.data.id,
      observaciones: `${evento.numeroEvento}-${evento.version || 1}`
    }, currentUser);
    toast.success('Remisión enviada a logística', { description: 'Bodega y logística la ven en tiempo real' });
    await onDone();
  };

  const steps = [
    { key: 'resumen',  label: 'Resumen',  hint: 'Datos de la cotización' },
    { key: 'personas', label: 'Personas', hint: 'Recibe y entrega' },
    { key: 'notas',    label: 'Notas',    hint: 'Operativas + finalizar' }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onCancel} className="btn-icon flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold truncate tracking-tight">
                Remisión de pedido
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 bg-surface-sunken border border-border rounded">
                {evento.numeroEvento}-{evento.version || 1}
              </span>
            </div>
            <p className="text-xs text-fg-muted mt-0.5">{evento.razonSocial || 'Sin nombre'}</p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <Stepper current={step} steps={steps} />

        <motion.div
          key={`rem-step-${step}`}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {step === 0 && (
            <ResumenEvento evento={evento} />
          )}
          {step === 1 && (
            <div className="space-y-4">
              <Bloque titulo="🚚 Personas que RECIBEN (montaje / entrega)">
                <PersonasLista
                  titulo="Recibe en sitio"
                  hint="Mínimo 2. Quienes confirman que llegó todo."
                  minimo={2}
                  personas={rem.personasMontaje || DEFAULT_PERSONAS}
                  onChange={(p) => set({ personasMontaje: p })}
                />
              </Bloque>
              <Bloque titulo="📤 Personas que ENTREGAN (desmontaje / recogida)">
                <PersonasLista
                  titulo="Entrega al final"
                  hint="Mínimo 2. Firman la devolución del material."
                  minimo={2}
                  personas={rem.personasDesmontaje || DEFAULT_PERSONAS}
                  onChange={(p) => set({ personasDesmontaje: p })}
                />
              </Bloque>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <Fld label="Notas operativas" hint="Acceso, parqueo, ascensor, restricciones, etc.">
                <textarea
                  value={rem.notasOperativas || ''}
                  onChange={(e) => set({ notasOperativas: e.target.value })}
                  rows={6}
                  className="input resize-none"
                  placeholder="Ej: acceso por portería sur. Parqueo restringido después de 6pm. Ascensor de servicio disponible. El cliente solicita usar guantes blancos en el montaje..."
                />
              </Fld>
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-300">
                <strong>Recordatorio:</strong> al finalizar, la remisión queda <strong>bloqueada</strong>.
                Bodega y logística la verán en tiempo real. Para cambios después de finalizar, deberás
                anexar un <strong>otrosí</strong> desde la vista de detalle.
              </div>
            </div>
          )}
        </motion.div>

        {err && (
          <div className="mt-4 bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/30 rounded-xl p-3">
            <strong className="text-xs text-red-900 dark:text-red-300">{err}</strong>
          </div>
        )}

        <div className="mt-5 pt-5 border-t-2 border-border flex items-center justify-between gap-2">
          {step > 0 ? (
            <button onClick={onAtras} className="btn-ghost" disabled={busy}>
              <ArrowLeft className="w-3.5 h-3.5" /> Atrás
            </button>
          ) : <div />}

          {step < 2 ? (
            <button onClick={onSiguiente} className="btn-primary" disabled={busy}>
              Siguiente <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button onClick={() => setConfirmOpen(true)} className="btn-success" disabled={busy}>
              <Send className="w-3.5 h-3.5" /> Finalizar y enviar a logística
            </button>
          )}
        </div>
      </div>

      <Confirm
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); handleFinalizar(); }}
        title="¿Finalizar y enviar a logística?"
        description="La remisión queda bloqueada y visible en tiempo real para bodega y logística. Cualquier cambio posterior debe ir como otrosí."
        confirmLabel="Enviar"
        tone="success"
      />
    </div>
  );
}

// ---------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------

function Bloque({ titulo, children }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-2">{titulo}</div>
      {children}
    </div>
  );
}

function ResumenEvento({ evento }) {
  return (
    <div className="space-y-4">
      <div className="bg-surface-sunken/50 border border-border rounded-xl p-4 space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">Cliente</div>
        <div className="text-sm font-semibold">{evento.razonSocial || '—'}</div>
        <div className="text-[11px] text-fg-muted">
          {evento.tipoDocId} {evento.numeroDocId} · {evento.tipoCliente}
        </div>
        <div className="text-[11px] text-fg-muted">
          📞 {evento.contactoTelefono} · ✉️ {evento.contactoEmail}
        </div>
      </div>

      <div className="bg-surface-sunken/50 border border-border rounded-xl p-4 space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">Evento</div>
        <div className="text-sm font-semibold">{evento.tipoEvento}</div>
        {evento.fechaEvento && (
          <div className="text-[11px] text-fg-muted">📅 {fmtFechaLarga(evento.fechaEvento)}</div>
        )}
        {evento.direccion && (
          <div className="text-[11px] text-fg-muted">📍 {evento.direccion}{evento.ciudad && ` · ${evento.ciudad}`}</div>
        )}
        {evento.mapsUrl && (
          <a href={evento.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-brand hover:underline inline-block">
            Abrir en Maps ↗
          </a>
        )}
      </div>

      <div className="bg-surface-sunken/50 border border-border rounded-xl p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-2">Montaje y desmontaje</div>
        <div className="grid sm:grid-cols-2 gap-3 text-[11px]">
          <div>
            <div className="font-semibold">🚚 Montaje</div>
            <div className="text-fg-muted">{evento.montaje?.fecha ? fmtFechaCorta(evento.montaje.fecha) : '—'}</div>
            <div className="text-fg-muted">
              {evento.montaje?.tipo === 'cerrado' ? `Hora exacta: ${evento.montaje.hora || '—'}` : `Franja: ${evento.montaje?.franja || '—'}`}
            </div>
          </div>
          <div>
            <div className="font-semibold">📤 Desmontaje</div>
            <div className="text-fg-muted">{evento.desmontaje?.fecha ? fmtFechaCorta(evento.desmontaje.fecha) : '—'}</div>
            <div className="text-fg-muted">
              {evento.desmontaje?.tipo === 'cerrado' ? `Hora exacta: ${evento.desmontaje.hora || '—'}` : `Franja: ${evento.desmontaje?.franja || '—'}`}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-sunken/50 border border-border rounded-xl p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-2">Productos ({(evento.items || []).length})</div>
        <ul className="space-y-1.5 text-[11px]">
          {(evento.items || []).map((it) => (
            <li key={it.id} className="flex items-baseline gap-3">
              <span className="font-mono text-fg-muted whitespace-nowrap">×{it.cantidad}</span>
              <span className="flex-1">{it.nombre}</span>
              {(Number(it.dias) || 1) > 1 && (
                <span className="text-[10px] text-fg-subtle whitespace-nowrap">{it.dias} días</span>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-3 pt-3 border-t border-border text-[10px] text-fg-subtle">
          La remisión sólo lleva cantidades y descripciones — los precios viven en la cotización.
        </div>
      </div>
    </div>
  );
}
