import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, CheckCircle2, FileText, Loader2, Lock, Plus, Send, Share2, ShieldCheck, Trash2
} from 'lucide-react';
import { Confirm } from '../shared/Confirm.jsx';
import { Fld } from '../shared/Fld.jsx';
import { Stepper } from '../shared/Stepper.jsx';
import { InputTel, InputEmail } from '../shared/Inputs.jsx';
import { HorarioBloque, HorarioHora } from './HorarioBloque.jsx';
import { useDirtyGuard } from '../../hooks/useDirtyGuard.jsx';
import { Cotizador } from './Cotizador.jsx';
import { TabPagos } from './TabPagos.jsx';
import { ShareModal } from './ShareModal.jsx';
import {
  FORMAS_PAGO, TIPO_EVENTO, TIPOS_CLIENTE, TIPOS_DOCUMENTO_COTIZACION,
  TIPOS_DOCUMENTO_ID, TIPOS_PERSONA
} from '../../constants.js';
import { buildMapsUrl, esMapsAutoUrl, hoy, money, tiempoRelativo } from '../../utils/format.js';
import { aplicaIva } from '../../utils/calculos.js';
import { validarDatosCliente, validarEventoBorrador, validarLogistica } from '../../utils/validaciones.js';

export function EventForm({
  initial, onCancel, onSave, onFinalize, onDelete, onNuevaVersion,
  catalogo, allEvents, currentUser, isNew
}) {
  const { setDirty } = useDirtyGuard();
  const [ev, setEv] = useState(initial);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardErr, setWizardErr] = useState('');
  const [showConfirmFinalize, setShowConfirmFinalize] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [lastSaved, setLastSaved] = useState(null);
  const [, setTick] = useState(0);
  const skipAutoSave = useRef(true);

  const bloqueado = ev.finalizado === true;
  const vendido = ev.estado === 'VENDIDO';
  const perdido = ev.estado === 'PERDIDO';
  const autoSaveActivo = !perdido;
  const set = (patch) => setEv((p) => ({ ...p, ...patch }));

  // Pasos del wizard. Pagos sólo aparece cuando ya está vendida.
  const wizardSteps = [
    { key: 'cliente',   label: 'Cliente',    hint: 'Datos del comprador' },
    { key: 'logistica', label: 'Logística',  hint: 'Montaje y dirección' },
    { key: 'productos', label: 'Productos',  hint: 'Cotizador' }
  ];
  if (vendido) wizardSteps.push({ key: 'pagos', label: 'Pagos', hint: 'Cobros y validaciones' });

  useEffect(() => {
    if (!autoSaveActivo) return;
    if (skipAutoSave.current) { skipAutoSave.current = false; return; }
    setSaveStatus('dirty');
    setDirty(true);
    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      await onSave(ev);
      setLastSaved(new Date());
      setSaveStatus('saved');
      setDirty(false);
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ev, autoSaveActivo]);

  useEffect(() => () => setDirty(false), [setDirty]);

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(i);
  }, []);

  const addItem = (prod) => {
    const newItem = {
      id: `it_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      codigo: prod.codigo || 'MANUAL',
      nombre: prod.nombre,
      categoria: prod.categoria,
      foto: prod.foto || '',
      cantidad: 1,
      dias: 1,
      precioBase: prod.precio,
      precioManual: null
    };
    set({ items: [...(ev.items || []), newItem] });
  };
  const updateItem = (id, patch) => set({ items: ev.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const removeItem = (id) => set({ items: ev.items.filter((i) => i.id !== id) });

  const errores = validarEventoBorrador(ev);
  const puedeEnviar = errores.length === 0;

  const handleDelete = () => {
    setDirty(false);
    onDelete();
    toast('Cotización eliminada');
  };

  const handleFinalize = () => {
    setDirty(false);
    onFinalize(ev);
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onCancel} className="btn-icon flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold truncate tracking-tight">
                {isNew ? 'Nueva cotización' : ev.razonSocial || 'Sin nombre'}
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 bg-surface-sunken border border-border rounded">
                {ev.numeroEvento}-{ev.version}
              </span>
              {bloqueado && (
                <span className="chip bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> FINALIZADA
                </span>
              )}
              {!isNew && !bloqueado && (
                <span className="chip bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
                  BORRADOR
                </span>
              )}
            </div>
            <SaveIndicator status={saveStatus} lastSaved={lastSaved} bloqueado={bloqueado} />
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <button onClick={() => setShowShare(true)} className="btn-ghost">
              <Share2 className="w-3.5 h-3.5" /> Compartir
            </button>
          )}
          {bloqueado && onNuevaVersion && (
            <button onClick={onNuevaVersion} className="btn-primary">
              <Plus className="w-3.5 h-3.5" /> Nueva versión
            </button>
          )}
          {!isNew && !bloqueado && (
            <button onClick={() => setShowConfirmDelete(true)} className="btn-icon hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {bloqueado && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-gradient-to-r from-emerald-50 dark:from-emerald-500/10 to-emerald-50/30 dark:to-emerald-500/5 border-2 border-emerald-200 dark:border-emerald-500/30 rounded-xl p-3 flex items-start gap-2.5"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-emerald-900 dark:text-emerald-300">
            <strong>Cotización {ev.numeroEvento}-{ev.version} guardada y bloqueada</strong>
            <div className="text-emerald-800 dark:text-emerald-400/80 mt-0.5">
              Para cambios crea una <strong>nueva versión</strong>.
            </div>
          </div>
        </motion.div>
      )}

      <div className="card p-5">
        <Stepper current={wizardStep} steps={wizardSteps} />

        <motion.div
          key={`wiz-${wizardStep}`}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {wizardStep === 0 && (
            <TabComercial
              ev={ev}
              set={set}
              bloqueado={bloqueado}
              modoWizard
            />
          )}
          {wizardStep === 1 && (
            <TabLogistica ev={ev} set={set} bloqueado={bloqueado} />
          )}
          {wizardStep === 2 && (
            <fieldset disabled={bloqueado} className="disabled:opacity-80">
              <Cotizador
                items={ev.items || []}
                catalogo={catalogo}
                addItem={addItem}
                updateItem={updateItem}
                removeItem={removeItem}
                events={allEvents || []}
                fechaEvento={ev.fechaEvento}
                evId={ev.id}
              />
            </fieldset>
          )}
          {wizardStep === 3 && vendido && (
            <TabPagos ev={ev} set={set} />
          )}
        </motion.div>

        {wizardErr && (
          <div className="mt-4 bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/30 rounded-xl p-3">
            <strong className="text-xs text-red-900 dark:text-red-300">Faltan: {wizardErr}</strong>
          </div>
        )}

        <div className="mt-5 pt-5 border-t-2 border-border flex items-center justify-between gap-2">
          {wizardStep > 0 ? (
            <button onClick={() => { setWizardStep(wizardStep - 1); setWizardErr(''); }} className="btn-ghost">
              <ArrowLeft className="w-3.5 h-3.5" /> Atrás
            </button>
          ) : <div />}

          {wizardStep === 0 && (
            <button
              onClick={() => {
                const errs = validarDatosCliente(ev);
                if (errs.length) { setWizardErr(errs.join(', ')); return; }
                setWizardErr('');
                setWizardStep(1);
              }}
              className="btn-primary"
            >
              Siguiente <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {wizardStep === 1 && (
            <button
              onClick={() => {
                const errs = validarLogistica(ev);
                if (errs.length) { setWizardErr(errs.join(', ')); return; }
                setWizardErr('');
                setWizardStep(2);
              }}
              className="btn-primary"
            >
              Siguiente <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {wizardStep === 2 && !bloqueado && (
            <button
              onClick={() => {
                if (!puedeEnviar) { setWizardErr(errores.join(', ')); return; }
                setWizardErr('');
                setShowConfirmFinalize(true);
              }}
              className="btn-success"
            >
              <Send className="w-3.5 h-3.5" /> Finalizar cotización
            </button>
          )}

          {wizardStep === 2 && bloqueado && vendido && (
            <button
              onClick={() => setWizardStep(3)}
              className="btn-primary"
            >
              Ver pagos <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <Confirm
        open={showConfirmFinalize}
        onCancel={() => setShowConfirmFinalize(false)}
        onConfirm={() => {
          setShowConfirmFinalize(false);
          handleFinalize();
        }}
        title="¿Finalizar esta cotización?"
        description={`La cotización ${ev.numeroEvento}-${ev.version} quedará bloqueada. Para cambios deberás crear una nueva versión.`}
        confirmLabel="Finalizar"
        tone="success"
      />

      <Confirm
        open={showConfirmDelete}
        onCancel={() => setShowConfirmDelete(false)}
        onConfirm={() => { setShowConfirmDelete(false); handleDelete(); }}
        title="¿Eliminar cotización?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        tone="danger"
      />

      <ShareModal open={showShare} ev={ev} onClose={() => setShowShare(false)} />
    </div>
  );
}

function SaveIndicator({ status, lastSaved, bloqueado }) {
  if (bloqueado) return null;
  const rel = lastSaved ? tiempoRelativo(lastSaved) : '';

  if (status === 'saving')
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-fg-muted mt-1">
        <Loader2 className="w-3 h-3 animate-spin" /> Guardando...
      </span>
    );
  if (status === 'dirty')
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 mt-1">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Cambios sin guardar
      </span>
    );
  if (status === 'saved' || lastSaved)
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
        <CheckCircle2 className="w-3 h-3" /> Guardado {rel}
      </span>
    );
  return <span className="inline-flex items-center gap-1.5 text-[11px] text-fg-subtle mt-1">Autoguardado activo</span>;
}

function TabComercial({ ev, set, bloqueado, puedeEnviar, errores, onFinalize, modoWizard }) {
  const personaActual = TIPOS_PERSONA.find((p) => p.key === ev.tipoPersona) || TIPOS_PERSONA[0];
  const docsDisponibles = personaActual.docs;
  const labelRazonSocial = ev.tipoPersona === 'NATURAL' ? 'Nombre completo' : 'Razón social';

  return (
    <fieldset disabled={bloqueado} className="space-y-6 disabled:opacity-80">

      {/* Tipo de documento */}
      <Section
        title="Tipo de documento"
        hint="Define si el total incluye IVA"
      >
        <div className="grid grid-cols-2 gap-2">
          {TIPOS_DOCUMENTO_COTIZACION.map((t) => {
            const active = (ev.tipoDocumento || 'COTIZACION') === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => set({ tipoDocumento: t.key })}
                className={`text-left rounded-xl p-3 border-2 transition active:scale-[0.98] ${
                  active
                    ? 'border-brand bg-brand-softer'
                    : 'border-border bg-surface hover:border-border-strong'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-lg">{t.icon}</span>
                  <span className={`text-sm font-bold ${active ? 'text-brand' : 'text-fg'}`}>{t.label}</span>
                </div>
                <div className="text-[10px] text-fg-muted">{t.sub}</div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Quién cotiza */}
      <Section title="Quién cotiza" hint="Asignado automáticamente">
        <div className="grid md:grid-cols-2 gap-4">
          <Fld label="Comercial">
            <input
              value={ev.comercial}
              disabled
              className="input font-mono bg-surface-sunken text-fg-muted"
            />
          </Fld>
          <Fld label="N° Cotización">
            <input value={ev.numeroEvento} disabled className="input font-mono bg-surface-sunken text-fg-muted" />
          </Fld>
        </div>
      </Section>

      {/* Datos del cliente */}
      <Section title="Datos del cliente">
        <Fld label={labelRazonSocial} required>
          <input
            value={ev.razonSocial}
            onChange={(e) => set({ razonSocial: e.target.value })}
            placeholder={ev.tipoPersona === 'NATURAL' ? 'Juan Pérez' : 'SANTA PUBLICIDAD SAS'}
            className="input"
          />
        </Fld>

        <div className="grid md:grid-cols-3 gap-3 mt-3">
          <Fld label="Tipo de persona" required>
            <select
              value={ev.tipoPersona}
              onChange={(e) => {
                const nueva = e.target.value;
                const docDefault = TIPOS_PERSONA.find((p) => p.key === nueva)?.docs[0];
                set({ tipoPersona: nueva, tipoDocId: docDefault });
              }}
              className="input"
            >
              {TIPOS_PERSONA.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </Fld>
          <Fld label="Tipo documento" required>
            <select
              value={ev.tipoDocId}
              onChange={(e) => set({ tipoDocId: e.target.value })}
              className="input"
            >
              {docsDisponibles.map((d) => (
                <option key={d} value={d}>{TIPOS_DOCUMENTO_ID[d].label}</option>
              ))}
            </select>
          </Fld>
          <Fld label={`N° ${ev.tipoDocId || 'documento'}`} required>
            <input
              value={ev.numeroDocId || ''}
              onChange={(e) => set({ numeroDocId: e.target.value })}
              placeholder={ev.tipoDocId === 'NIT' ? '900.123.456-7' : '1.234.567.890'}
              className="input font-mono"
            />
          </Fld>
        </div>

        <Fld label="Tipo de cliente" required className="mt-3">
          <select
            value={ev.tipoCliente || ''}
            onChange={(e) => set({ tipoCliente: e.target.value })}
            className="input"
          >
            <option value="">Selecciona...</option>
            {TIPOS_CLIENTE.map((tc) => <option key={tc} value={tc}>{tc}</option>)}
          </select>
        </Fld>
      </Section>

      {/* Contacto */}
      <Section title="Contacto" hint="Al menos teléfono o email">
        <div className="grid md:grid-cols-3 gap-3">
          <Fld label="Nombre" required>
            <input value={ev.contactoNombre} onChange={(e) => set({ contactoNombre: e.target.value })} className="input" />
          </Fld>
          <Fld label="Teléfono">
            <InputTel value={ev.contactoTelefono} onChange={(v) => set({ contactoTelefono: v })} />
          </Fld>
          <Fld label="Email">
            <InputEmail value={ev.contactoEmail} onChange={(v) => set({ contactoEmail: v })} />
          </Fld>
        </div>
      </Section>

      {/* Datos del evento */}
      <Section title="Datos del evento">
        <div className="grid md:grid-cols-2 gap-3">
          <Fld label="Fecha del evento" required>
            <input type="date" min={hoy()} value={ev.fechaEvento} onChange={(e) => set({ fechaEvento: e.target.value })} className="input" />
          </Fld>
          <Fld label="Tipo de evento" required>
            <select value={ev.tipoEvento} onChange={(e) => set({ tipoEvento: e.target.value })} className="input">
              {TIPO_EVENTO.map((x) => <option key={x}>{x}</option>)}
            </select>
          </Fld>
        </div>
      </Section>

      {/* Pago */}
      <Section title="Forma de pago">
        <select value={ev.formaPago} onChange={(e) => set({ formaPago: e.target.value })} className="input">
          {FORMAS_PAGO.map((f) => <option key={f}>{f}</option>)}
        </select>
      </Section>

      {/* Proveedor externo */}
      <Section title="¿Lleva proveedor externo?" hint="Productos tercerizados">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            onClick={() => set({ llevaProveedorExterno: false })}
            className={`py-2.5 rounded-lg text-xs font-semibold border-2 transition ${
              !ev.llevaProveedorExterno
                ? 'bg-fg text-surface border-fg'
                : 'bg-surface text-fg-muted border-border hover:border-border-strong'
            }`}
          >
            No · todo lo cubre Decolounge
          </button>
          <button
            type="button"
            onClick={() => set({ llevaProveedorExterno: true })}
            className={`py-2.5 rounded-lg text-xs font-semibold border-2 transition ${
              ev.llevaProveedorExterno
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-surface text-fg-muted border-border hover:border-border-strong'
            }`}
          >
            Sí · hay productos externos
          </button>
        </div>
        {ev.llevaProveedorExterno && (
          <div className="space-y-2">
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-2.5 text-[11px] text-amber-900 dark:text-amber-300">
              ℹ️ Cuando marques esta cotización como vendida, el <strong>CAC</strong> deberá dar visto bueno al proveedor externo antes del evento. Sube la cotización del proveedor desde <strong>Solicitud de OT</strong> en tu dashboard.
            </div>
            <Fld label="Notas sobre el proveedor / qué se terceriza">
              <textarea
                value={ev.proveedorExternoNotas || ''}
                onChange={(e) => set({ proveedorExternoNotas: e.target.value })}
                rows={2}
                className="input resize-none"
                placeholder="Ej: Carpa 6x6 → Eventos LM / sonido → DJ Pérez..."
              />
            </Fld>
          </div>
        )}
      </Section>

      {/* Notas */}
      <Section title="Notas internas" hint="Solo visibles para el equipo">
        <textarea
          value={ev.comentarios}
          onChange={(e) => set({ comentarios: e.target.value })}
          rows={3}
          className="input resize-none"
          placeholder="Observaciones, contexto, detalles..."
        />
      </Section>

      {!bloqueado && !modoWizard && (
        <div className="pt-5 border-t-2 border-border">
          {!puedeEnviar && (
            <div className="bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/30 rounded-xl p-3 mb-3">
              <strong className="text-xs text-red-900 dark:text-red-300">Faltan: {errores.join(', ')}</strong>
            </div>
          )}
          <button
            onClick={() => puedeEnviar && onFinalize()}
            disabled={!puedeEnviar}
            className={`w-full py-3 font-semibold rounded-full text-sm flex items-center justify-center gap-2 transition active:scale-[0.99] ${
              puedeEnviar
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/25'
                : 'bg-surface-sunken text-fg-subtle cursor-not-allowed'
            }`}
          >
            {puedeEnviar ? (
              <><Send className="w-4 h-4" /> Finalizar cotización</>
            ) : (
              <><Lock className="w-4 h-4" /> Completa los campos</>
            )}
          </button>
          <p className="text-[10px] text-fg-muted text-center mt-2">⚠️ Una vez finalizada no podrás editarla.</p>
        </div>
      )}
    </fieldset>
  );
}

function Section({ title, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-[11px] uppercase tracking-wider font-bold text-fg-muted">{title}</h3>
        {hint && <span className="text-[10px] text-fg-subtle">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function TabLogistica({ ev, set, bloqueado }) {
  const montaje = ev.montaje || { fecha: '', tipo: 'abierto', franja: 'manana', hora: '' };
  const desmontaje = ev.desmontaje || { fecha: '', tipo: 'abierto', franja: 'tarde', hora: '' };
  const horarioEvento = ev.horarioEvento || { tipo: 'abierto', franja: 'tarde', hora: '' };

  return (
    <fieldset disabled={bloqueado} className="space-y-5 disabled:opacity-80">
      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 text-[11px] text-amber-900 dark:text-amber-300">
        <strong>Importante:</strong> estos datos van en la cotización que se envía al cliente.
        Las personas que reciben/entregan y las notas operativas se definen luego en la <strong>Remisión de Logística</strong>.
      </div>

      <Section title="Horario del evento" hint="Formato 24h">
        <HorarioHora
          valor={horarioEvento}
          onChange={(h) => set({ horarioEvento: h })}
        />
      </Section>

      <Section title="Lugar del evento" hint="El link de Maps se genera solo">
        <div className="grid md:grid-cols-2 gap-3">
          <Fld label="Dirección exacta">
            <input
              value={ev.direccion || ''}
              onChange={(e) => {
                const v = e.target.value;
                const patch = { direccion: v };
                if (esMapsAutoUrl(ev.mapsUrl)) patch.mapsUrl = buildMapsUrl(v, ev.ciudad);
                set(patch);
              }}
              placeholder="Cra 11 # 82-01"
              className="input"
            />
          </Fld>
          <Fld label="Ciudad / municipio">
            <input
              value={ev.ciudad || ''}
              onChange={(e) => {
                const v = e.target.value;
                const patch = { ciudad: v };
                if (esMapsAutoUrl(ev.mapsUrl)) patch.mapsUrl = buildMapsUrl(ev.direccion, v);
                set(patch);
              }}
              placeholder="Bogotá"
              className="input"
            />
          </Fld>
        </div>
        <div className="mt-3">
          <Fld label="Link Google Maps" hint={esMapsAutoUrl(ev.mapsUrl) ? 'Generado automáticamente' : 'Personalizado'}>
            <div className="flex gap-2">
              <input
                value={ev.mapsUrl || ''}
                onChange={(e) => set({ mapsUrl: e.target.value })}
                placeholder="https://maps.google.com/..."
                className="input flex-1"
              />
              {ev.mapsUrl && (
                <a
                  href={ev.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 flex items-center bg-fg text-surface rounded-lg text-[11px] font-medium"
                >
                  Abrir
                </a>
              )}
              {!esMapsAutoUrl(ev.mapsUrl) && (
                <button
                  type="button"
                  onClick={() => set({ mapsUrl: buildMapsUrl(ev.direccion, ev.ciudad) })}
                  title="Volver al link automático"
                  className="px-3 flex items-center border border-border hover:bg-surface-sunken rounded-lg text-[11px] font-medium"
                >
                  ↺
                </button>
              )}
            </div>
          </Fld>
        </div>
      </Section>

      <Section title="🚚 Montaje / Entrega">
        <HorarioBloque
          titulo="Fecha y hora"
          valor={montaje}
          onChange={(m) => set({ montaje: m })}
          fechaEvento={ev.fechaEvento}
        />
      </Section>

      <Section title="📤 Desmontaje / Recogida">
        <HorarioBloque
          titulo="Fecha y hora"
          valor={desmontaje}
          onChange={(m) => set({ desmontaje: m })}
          fechaEvento={ev.fechaEvento}
          esDesmontaje
        />
      </Section>
    </fieldset>
  );
}
