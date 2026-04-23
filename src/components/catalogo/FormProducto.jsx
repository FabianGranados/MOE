import { useEffect, useRef, useState } from 'react';
import { XCircle } from 'lucide-react';
import { Modal } from '../shared/Modal.jsx';
import { Fld } from '../shared/Fld.jsx';
import { CATEGORIAS } from '../../constants.js';

const initial = { codigo: '', nombre: '', categoria: 'Mobiliario', precio: 0, stock: 0, foto: '' };

export function FormProducto({ open, editando, onCancel, onSave }) {
  const [data, setData] = useState(editando || initial);
  const [sinLimite, setSinLimite] = useState(editando ? editando.stock == null : false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) {
      setData(editando || initial);
      setSinLimite(editando ? editando.stock == null : false);
      setErr('');
    }
  }, [open, editando]);

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
    if (Number(data.precio) < 0) return setErr('Precio inválido');
    onSave({
      ...data,
      precio: Number(data.precio) || 0,
      stock: sinLimite ? null : Number(data.stock) || 0
    });
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="lg"
      title={editando ? 'Editar producto' : 'Agregar producto'}
      footer={
        <>
          <button onClick={onCancel} className="btn-ghost">Cancelar</button>
          <button onClick={submit} className="btn-dark">Guardar</button>
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

        <Fld label="Código">
          <input value={data.codigo} onChange={(e) => setData({ ...data, codigo: e.target.value.toUpperCase() })} className="input font-mono" />
        </Fld>
        <Fld label="Nombre" required>
          <input value={data.nombre} onChange={(e) => setData({ ...data, nombre: e.target.value })} className="input" />
        </Fld>
        <Fld label="Categoría">
          <select value={data.categoria} onChange={(e) => setData({ ...data, categoria: e.target.value })} className="input">
            {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Fld>
        <Fld label="Precio base (por día)">
          <input type="number" value={data.precio} onChange={(e) => setData({ ...data, precio: e.target.value })} className="input font-mono" />
        </Fld>

        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] text-fg-muted uppercase tracking-wider font-medium">Inventario en bodega</label>
            <label className="flex items-center gap-1.5 text-[10px] text-fg-muted cursor-pointer">
              <input type="checkbox" checked={sinLimite} onChange={(e) => setSinLimite(e.target.checked)} className="rounded" />
              Sin límite
            </label>
          </div>
          {sinLimite ? (
            <div className="input bg-surface-sunken text-fg-muted italic">♾️ Sin límite de unidades</div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={data.stock || 0}
                onChange={(e) => setData({ ...data, stock: e.target.value })}
                className="input font-mono flex-1"
              />
              <span className="text-xs text-fg-muted">unidades</span>
            </div>
          )}
        </div>

        {err && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-3 text-xs text-red-800 dark:text-red-300">
            {err}
          </div>
        )}
      </div>
    </Modal>
  );
}
