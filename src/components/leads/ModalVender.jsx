import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, DollarSign, Info, XCircle } from 'lucide-react';
import { Modal } from '../shared/Modal.jsx';
import { Fld } from '../shared/Fld.jsx';
import { InputMoney } from '../shared/InputMoney.jsx';
import { AVISO_PAGO_OTRO_BANCO, BANCOS, FRANJAS, METODOS_PAGO } from '../../constants.js';
import { fmtFechaCorta, fmtFechaLarga, hoy, money } from '../../utils/format.js';
import { calcTotal } from '../../utils/calculos.js';

function resumenHorario(h) {
  if (!h) return 'sin definir';
  if (h.tipo === 'cerrado') return h.hora ? `${h.hora} h (cerrado)` : 'cerrado · sin hora';
  return `abierto · ${FRANJAS[h.franja] || ''}`;
}

function resumenFechaHora(bloque) {
  if (!bloque?.fecha) return 'sin definir';
  return `${fmtFechaCorta(bloque.fecha)} · ${resumenHorario(bloque)}`;
}

const TIPOS_PAGO = [
  { key: 'ANTICIPO_50',   label: 'Anticipo 50%', pct: 0.5 },
  { key: 'ANTICIPO_PARC', label: 'Anticipo parcial',  pct: null },
  { key: 'TOTAL_100',     label: 'Pago 100%', pct: 1.0 }
];

export function ModalVender({ open, ev, onCancel, onConfirm }) {
  // Las notas operativas para bodega/logística viven en la Remisión de
  // Logística, NO acá. Por eso este modal sólo cierra la venta + el pago.
  const [confirmaHorarios, setConfirmaHorarios] = useState(true);

  // Pago
  const [tipoPago, setTipoPago] = useState('ANTICIPO_50');
  const [monto, setMonto] = useState(0);
  const [fechaPago, setFechaPago] = useState(hoy());
  const [metodo, setMetodo] = useState('Transferencia');
  const [banco, setBanco] = useState('BANCOLOMBIA');
  const [referencia, setReferencia] = useState('');
  const [notasPago, setNotasPago] = useState('');
  const [foto, setFoto] = useState('');
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  const total = ev ? calcTotal(ev) : 0;

  useEffect(() => {
    if (open && ev) {
      setConfirmaHorarios(true);
      setTipoPago('ANTICIPO_50');
      setMonto(Math.round(total * 0.5));
      setFechaPago(hoy());
      setMetodo('Transferencia');
      setBanco('BANCOLOMBIA');
      setReferencia('');
      setNotasPago('');
      setFoto('');
      setErr('');
    }
  }, [open, ev, total]);

  // Al cambiar tipo de pago, sugerir el monto
  useEffect(() => {
    const tp = TIPOS_PAGO.find((x) => x.key === tipoPago);
    if (tp && tp.pct != null) setMonto(Math.round(total * tp.pct));
  }, [tipoPago, total]);

  if (!ev) return null;

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return setErr('Foto muy grande (máx 2MB)');
    const r = new FileReader();
    r.onload = (ev) => { setFoto(ev.target.result); setErr(''); };
    r.readAsDataURL(f);
  };

  const submit = () => {
    if (!monto || monto <= 0) return setErr('El monto del pago es obligatorio');
    if (monto > total) return setErr(`El monto no puede superar el total (${money(total)})`);
    if (!foto) return setErr('Debes adjuntar el soporte del pago');

    const pago = {
      id: `pg_${Date.now()}`,
      fecha: fechaPago,
      monto: Number(monto),
      metodo,
      banco,
      referencia,
      notas: notasPago,
      foto,
      tipoPago,
      validado: false
    };

    onConfirm({
      horariosConfirmados: confirmaHorarios,
      fechaConfirmacionVenta: new Date().toISOString(),
      pagoInicial: pago
    });
  };

  const tieneLogistica =
    ev.direccion || ev.ciudad || ev.montaje?.fecha || ev.desmontaje?.fecha ||
    (Array.isArray(ev.personasMontaje) && ev.personasMontaje.some(p => p?.nombre)) ||
    (Array.isArray(ev.personasDesmontaje) && ev.personasDesmontaje.some(p => p?.nombre));

  const pctMonto = total > 0 ? Math.round((monto / total) * 100) : 0;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="xl"
      tone="success"
      title={
        <span className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Marcar {ev.numeroEvento}-{ev.version} como VENDIDA
        </span>
      }
      subtitle={ev.fechaEvento ? `📅 Evento: ${fmtFechaLarga(ev.fechaEvento)} · Total: ${money(total)}` : undefined}
      footer={
        <>
          <button onClick={onCancel} className="btn-ghost">Cancelar</button>
          <button onClick={submit} className="btn-success">Confirmar venta</button>
        </>
      }
    >
      <div className="p-5 space-y-5">
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-3 text-[11px] text-emerald-900 dark:text-emerald-300">
          🎉 El cliente aceptó. Confirma los horarios, registra el pago recibido y agrega notas para bodega/logística.
        </div>

        {/* Logística */}
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
              {ev.ciudad && <Linea label="Ciudad" value={ev.ciudad} />}
              <Linea label="Horario del evento" value={resumenHorario(ev.horarioEvento)} />
              <Linea label="Montaje" value={resumenFechaHora(ev.montaje)} />
              <Linea label="Desmontaje" value={resumenFechaHora(ev.desmontaje)} />
              {Array.isArray(ev.personasMontaje) && ev.personasMontaje.filter(p => p.nombre).length > 0 && (
                <Linea
                  label="Reciben"
                  value={ev.personasMontaje.filter(p => p.nombre).map(p => `${p.nombre}${p.celular ? ` (${p.celular})` : ''}`).join(' · ')}
                />
              )}
              {Array.isArray(ev.personasDesmontaje) && ev.personasDesmontaje.filter(p => p.nombre).length > 0 && (
                <Linea
                  label="Entregan"
                  value={ev.personasDesmontaje.filter(p => p.nombre).map(p => `${p.nombre}${p.celular ? ` (${p.celular})` : ''}`).join(' · ')}
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
                  Si el cliente cambió algo, desmarca esto y edita desde el tab Logística del detalle.
                </div>
              </div>
            </label>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Esta cotización no tiene datos de logística. Recuerda completarlos desde el tab Logística del detalle después de marcar vendida.</span>
          </div>
        )}

        {/* Pago */}
        <div className="card p-4 border-violet-300 dark:border-violet-500/30 bg-gradient-to-br from-violet-50/50 to-transparent dark:from-violet-500/5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-fg">Registro de pago *</h4>
          </div>
          <p className="text-[11px] text-fg-muted mb-3">
            Este pago queda <strong>pendiente de validación por contabilidad</strong>. Adjunta el soporte.
          </p>

          <div className="bg-surface-sunken border border-border rounded-lg p-3 mb-3 text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-fg-muted">Total de la cotización</span>
              <span className="font-mono font-bold text-fg">{money(total)}</span>
            </div>
          </div>

          <Fld label="Tipo de pago" required>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS_PAGO.map((tp) => {
                const active = tipoPago === tp.key;
                const sugerido = tp.pct != null ? Math.round(total * tp.pct) : null;
                return (
                  <button
                    key={tp.key}
                    type="button"
                    onClick={() => setTipoPago(tp.key)}
                    className={`py-2 px-2 rounded-lg text-[11px] font-semibold border-2 transition text-center ${
                      active
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-surface text-fg-muted border-border hover:border-border-strong'
                    }`}
                  >
                    <div>{tp.label}</div>
                    {sugerido != null && (
                      <div className={`text-[9px] mt-0.5 font-mono ${active ? 'text-violet-100' : 'text-fg-subtle'}`}>
                        {money(sugerido)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Fld>

          <div className="grid md:grid-cols-2 gap-3 mt-3">
            <Fld
              label="Monto pagado por el cliente"
              required
              hint={pctMonto > 0 ? `${pctMonto}% del total` : undefined}
            >
              <InputMoney value={monto} onChange={setMonto} />
            </Fld>
            <Fld label="Fecha del pago" required>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="input"
              />
            </Fld>
          </div>

          <div className="grid md:grid-cols-2 gap-3 mt-3">
            <Fld label="Método">
              <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className="input">
                {METODOS_PAGO.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Fld>
            <Fld label="Banco">
              <select value={banco} onChange={(e) => setBanco(e.target.value)} className="input">
                {BANCOS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </Fld>
          </div>

          {banco === 'OTRO' && (
            <div className="mt-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-2 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{AVISO_PAGO_OTRO_BANCO}</span>
            </div>
          )}

          <Fld label="Referencia del pago" className="mt-3">
            <input
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej: transf 123456 / recibo 4567"
              className="input font-mono"
            />
          </Fld>

          <Fld label="Soporte de pago (foto)" required className="mt-3">
            {foto ? (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-sunken">
                <img src={foto} alt="" className="w-full h-full object-contain" />
                <button
                  onClick={() => setFoto('')}
                  className="absolute top-2 right-2 p-1.5 bg-surface rounded-full shadow text-fg-muted"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full py-6 border-2 border-dashed border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/5 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-medium transition hover:bg-amber-100/60"
              >
                📷 Subir comprobante / captura de pantalla
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </Fld>

          <Fld label="Notas del pago (opcional)" className="mt-3">
            <textarea
              value={notasPago}
              onChange={(e) => setNotasPago(e.target.value)}
              rows={2}
              className="input resize-none"
              placeholder="Algo que contabilidad deba saber..."
            />
          </Fld>
        </div>

        {err && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-3 text-xs text-red-800 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{err}</span>
          </div>
        )}
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
