import { useRef, useState } from 'react';
import { XCircle } from 'lucide-react';
import { Modal } from '../shared/Modal.jsx';
import { Fld } from '../shared/Fld.jsx';
import { CATEGORIAS } from '../../constants.js';

export function ModalManual({ open, onCancel, onSave }) {
  const [data, setData] = useState({ codigo: 'MANUAL', nombre: '', categoria: 'Otros', precio: 0, foto: '' });
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1024 * 1024) return setErr('Foto muy grande (máx 1MB)');
    const r = new FileReader();
    r.onload = (ev) => setData((d) => ({ ...d, foto: ev.target.result }));
    r.readAsDataURL(f);
  };

  const submit = () => {
    if (!data.nombre?.trim()) return setErr('Nombre obligatorio');
    if (!data.precio || Number(data.precio) <= 0) return setErr('Precio obligatorio');
    onSave({ ...data, precio: Number(data.precio) });
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="md"
      title="Producto manual (temporal)"
      subtitle="Se guarda solo en esta cotización"
      footer={
        <>
          <button onClick={onCancel} className="btn-ghost">Cancelar</button>
          <button onClick={submit} className="btn-primary">Agregar</button>
        </>
      }
    >
      <div className="p-5 space-y-3">
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
          <input autoFocus value={data.nombre} onChange={(e) => setData({ ...data, nombre: e.target.value })} className="input" />
        </Fld>
        <Fld label="Categoría">
          <select value={data.categoria} onChange={(e) => setData({ ...data, categoria: e.target.value })} className="input">
            {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Fld>
        <Fld label="Precio base" required>
          <input
            type="number"
            value={data.precio || ''}
            onChange={(e) => setData({ ...data, precio: e.target.value })}
            className="input font-mono"
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
