import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../shared/Modal.jsx';
import { Fld } from '../shared/Fld.jsx';
import { CATEGORIAS } from '../../constants.js';

const initial = { codigo: 'MANUAL', nombre: '', categoria: 'Otros', precio: 0, foto: '' };

export function ModalManual({ open, onCancel, onSave }) {
  const [data, setData] = useState(initial);
  const [err, setErr] = useState('');
  const [recienGuardado, setRecienGuardado] = useState(false);
  const fileRef = useRef(null);
  const nombreRef = useRef(null);

  useEffect(() => {
    if (open) {
      setData(initial);
      setErr('');
      setRecienGuardado(false);
    }
  }, [open]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1024 * 1024) return setErr('Foto muy grande (máx 1MB)');
    const r = new FileReader();
    r.onload = (ev) => setData((d) => ({ ...d, foto: ev.target.result }));
    r.readAsDataURL(f);
  };

  const validar = () => {
    if (!data.nombre?.trim()) { setErr('Nombre obligatorio'); return false; }
    if (!data.precio || Number(data.precio) <= 0) { setErr('Precio obligatorio'); return false; }
    setErr('');
    return true;
  };

  const guardarYCerrar = () => {
    if (!validar()) return;
    onSave({ ...data, precio: Number(data.precio) });
  };

  const guardarYOtro = () => {
    if (!validar()) return;
    onSave({ ...data, precio: Number(data.precio) }, { keepOpen: true });
    toast.success(`Agregado: ${data.nombre}`);
    setData(initial);
    setRecienGuardado(true);
    setTimeout(() => {
      setRecienGuardado(false);
      nombreRef.current?.focus();
    }, 600);
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="md"
      title="Producto manual / externo"
      subtitle="Úsalo para productos que no están en catálogo — tercerizados, adicionales, etc."
      footer={
        <>
          <button onClick={onCancel} className="btn-ghost">Cerrar</button>
          <button onClick={guardarYOtro} className="btn-ghost">
            <CheckCircle2 className="w-3.5 h-3.5" /> Guardar y agregar otro
          </button>
          <button onClick={guardarYCerrar} className="btn-primary">
            Guardar y cerrar
          </button>
        </>
      }
    >
      <div className="p-5 space-y-3">
        {recienGuardado && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg p-2.5 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Producto agregado. Completa el siguiente o cierra.
          </div>
        )}

        {data.foto ? (
          <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-sunken">
            <img src={data.foto} alt="" className="w-full h-full object-cover" />
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
            className="w-full py-3 border-2 border-dashed border-border rounded-xl text-xs text-fg-muted hover:bg-surface-sunken transition"
          >
            📷 Subir foto (opcional)
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

        <Fld label="Nombre" required>
          <input
            ref={nombreRef}
            autoFocus
            value={data.nombre}
            onChange={(e) => setData({ ...data, nombre: e.target.value })}
            placeholder="Ej: Carpa 4x4 con faldón"
            className="input"
          />
        </Fld>
        <Fld label="Categoría">
          <select value={data.categoria} onChange={(e) => setData({ ...data, categoria: e.target.value })} className="input">
            {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Fld>
        <Fld label="Precio base (por día)" required>
          <input
            type="number"
            value={data.precio || ''}
            onChange={(e) => setData({ ...data, precio: e.target.value })}
            className="input font-mono"
            placeholder="0"
          />
        </Fld>
        {err && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-2 text-xs text-red-800 dark:text-red-300">
            {err}
          </div>
        )}
      </div>
    </Modal>
  );
}
