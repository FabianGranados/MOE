import { useEffect, useState } from 'react';
import { XCircle } from 'lucide-react';
import { Modal } from '../shared/Modal.jsx';
import { Fld } from '../shared/Fld.jsx';
import { MOTIVOS_PERDIDA } from '../../constants.js';

export function ModalPerder({ open, ev, onCancel, onConfirm }) {
  const [motivo, setMotivo] = useState('');
  useEffect(() => { if (open) setMotivo(''); }, [open]);

  if (!ev) return null;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="md"
      tone="danger"
      title={
        <span className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-600" />
          Marcar {ev.numeroEvento}-{ev.version} como PERDIDA
        </span>
      }
      footer={
        <>
          <button onClick={onCancel} className="btn-ghost">Cancelar</button>
          <button onClick={() => motivo && onConfirm(motivo)} disabled={!motivo} className="btn-danger">
            Confirmar PERDIDA
          </button>
        </>
      }
    >
      <div className="p-5">
        <Fld label="Motivo" required>
          <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className="input">
            <option value="">Selecciona...</option>
            {MOTIVOS_PERDIDA.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Fld>
      </div>
    </Modal>
  );
}
