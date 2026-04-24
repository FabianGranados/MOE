import { useRef, useState } from 'react';
import { Info, XCircle } from 'lucide-react';
import { Modal } from '../shared/Modal.jsx';
import { Fld } from '../shared/Fld.jsx';
import { InputMoney } from '../shared/InputMoney.jsx';
import { AVISO_PAGO_OTRO_BANCO, BANCOS, METODOS_PAGO } from '../../constants.js';
import { hoy, money } from '../../utils/format.js';

export function ModalPago({ open, onCancel, onSave, saldo }) {
  const [data, setData] = useState({
    id: `pg_${Date.now()}`,
    fecha: hoy(),
    monto: 0,
    metodo: 'Transferencia',
    banco: 'BANCOLOMBIA',
    referencia: '',
    notas: '',
    foto: '',
    validado: false
  });
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return setErr('Foto muy grande (máx 2MB)');
    const r = new FileReader();
    r.onload = (ev) => {
      setData((d) => ({ ...d, foto: ev.target.result }));
      setErr('');
    };
    r.readAsDataURL(f);
  };

  const submit = () => {
    if (!data.monto || data.monto <= 0) return setErr('Monto obligatorio');
    if (!data.foto) return setErr('Foto del soporte obligatoria');
    onSave(data);
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="md"
      title="Registrar pago"
      subtitle={`Saldo por pagar: ${money(saldo)}`}
      footer={
        <>
          <button onClick={onCancel} className="btn-ghost">Cancelar</button>
          <button onClick={submit} className="btn-primary">Registrar</button>
        </>
      }
    >
      <div className="p-5 space-y-3">
        <Fld label="Soporte de pago" required>
          {data.foto ? (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-sunken">
              <img src={data.foto} alt="" className="w-full h-full object-contain" />
              <button
                onClick={() => setData((d) => ({ ...d, foto: '' }))}
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
              📷 Subir foto
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </Fld>

        <div className="grid grid-cols-2 gap-3">
          <Fld label="Fecha" required>
            <input type="date" value={data.fecha} onChange={(e) => setData({ ...data, fecha: e.target.value })} className="input" />
          </Fld>
          <Fld label="Monto" required>
            <InputMoney value={data.monto} onChange={(v) => setData({ ...data, monto: v })} />
          </Fld>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Fld label="Método">
            <select value={data.metodo} onChange={(e) => setData({ ...data, metodo: e.target.value })} className="input">
              {METODOS_PAGO.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Fld>
          <Fld label="Banco">
            <select value={data.banco} onChange={(e) => setData({ ...data, banco: e.target.value })} className="input">
              {BANCOS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </Fld>
        </div>

        {data.banco === 'OTRO' && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-2 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{AVISO_PAGO_OTRO_BANCO}</span>
          </div>
        )}

        <Fld label="Referencia">
          <input value={data.referencia} onChange={(e) => setData({ ...data, referencia: e.target.value })} className="input font-mono" />
        </Fld>

        <Fld label="Notas">
          <textarea value={data.notas} onChange={(e) => setData({ ...data, notas: e.target.value })} rows={2} className="input resize-none" />
        </Fld>

        {err && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-3 text-xs text-red-800 dark:text-red-300">
            {err}
          </div>
        )}
      </div>
    </Modal>
  );
}
