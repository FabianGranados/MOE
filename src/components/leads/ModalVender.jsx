import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from '../shared/Modal.jsx';
import { Fld } from '../shared/Fld.jsx';
import { HorarioBloque } from '../evento/HorarioBloque.jsx';
import { validarDatosOperativos } from '../../utils/validaciones.js';
import { fmtFechaLarga } from '../../utils/format.js';

export function ModalVender({ open, ev, onCancel, onConfirm }) {
  const [data, setData] = useState({
    direccion: '',
    mapsUrl: '',
    montaje: { fecha: '', tipo: 'abierto', franja: 'manana', hora: '' },
    desmontaje: { fecha: '', tipo: 'abierto', franja: 'tarde', hora: '' },
    contactoPrincipal: { nombre: '', celular: '' },
    contactoBackup: { nombre: '', celular: '' },
    notasOperativas: ''
  });
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open && ev) {
      setData({
        direccion: '',
        mapsUrl: '',
        montaje: { fecha: ev.fechaEvento || '', tipo: 'abierto', franja: 'manana', hora: '' },
        desmontaje: { fecha: ev.fechaEvento || '', tipo: 'abierto', franja: 'tarde', hora: '' },
        contactoPrincipal: { nombre: '', celular: '' },
        contactoBackup: { nombre: '', celular: '' },
        notasOperativas: ''
      });
      setErr('');
    }
  }, [open, ev]);

  if (!ev) return null;

  const submit = () => {
    const errores = validarDatosOperativos(data);
    if (errores.length) return setErr(errores.join(', '));
    onConfirm(data);
  };

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
      subtitle={ev.fechaEvento ? `📅 Evento: ${fmtFechaLarga(ev.fechaEvento)}` : undefined}
      footer={
        <>
          <button onClick={onCancel} className="btn-ghost">Cancelar</button>
          <button onClick={submit} className="btn-success">Confirmar VENDIDA</button>
        </>
      }
    >
      <div className="p-5 space-y-4">
        <Fld label="Dirección exacta" required>
          <input
            value={data.direccion}
            onChange={(e) => setData({ ...data, direccion: e.target.value })}
            placeholder="Cra 11 # 82-01, Bogotá"
            className="input"
          />
        </Fld>
        <Fld label="Link Google Maps">
          <input value={data.mapsUrl} onChange={(e) => setData({ ...data, mapsUrl: e.target.value })} className="input" />
        </Fld>

        <HorarioBloque titulo="🚚 Montaje / Entrega" valor={data.montaje} onChange={(m) => setData({ ...data, montaje: m })} fechaEvento={ev.fechaEvento} />
        <HorarioBloque titulo="📤 Desmontaje / Recogida" valor={data.desmontaje} onChange={(m) => setData({ ...data, desmontaje: m })} fechaEvento={ev.fechaEvento} esDesmontaje />

        <div className="pt-3 border-t border-border">
          <div className="text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-2">Contacto principal *</div>
          <div className="grid grid-cols-2 gap-2">
            <Fld label="Nombre">
              <input
                value={data.contactoPrincipal.nombre}
                onChange={(e) => setData({ ...data, contactoPrincipal: { ...data.contactoPrincipal, nombre: e.target.value } })}
                className="input"
              />
            </Fld>
            <Fld label="Celular">
              <input
                value={data.contactoPrincipal.celular}
                onChange={(e) => setData({ ...data, contactoPrincipal: { ...data.contactoPrincipal, celular: e.target.value } })}
                className="input font-mono"
              />
            </Fld>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-2">Contacto backup</div>
          <div className="grid grid-cols-2 gap-2">
            <Fld label="Nombre">
              <input
                value={data.contactoBackup.nombre}
                onChange={(e) => setData({ ...data, contactoBackup: { ...data.contactoBackup, nombre: e.target.value } })}
                className="input"
              />
            </Fld>
            <Fld label="Celular">
              <input
                value={data.contactoBackup.celular}
                onChange={(e) => setData({ ...data, contactoBackup: { ...data.contactoBackup, celular: e.target.value } })}
                className="input font-mono"
              />
            </Fld>
          </div>
        </div>
        <Fld label="Notas operativas">
          <textarea
            value={data.notasOperativas}
            onChange={(e) => setData({ ...data, notasOperativas: e.target.value })}
            rows={2}
            className="input resize-none"
          />
        </Fld>
        {err && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-2 text-xs text-red-800 dark:text-red-300">
            <strong>Faltan:</strong> {err}
          </div>
        )}
      </div>
    </Modal>
  );
}
