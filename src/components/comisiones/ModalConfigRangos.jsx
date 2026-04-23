import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Modal } from '../shared/Modal.jsx';
import { Fld } from '../shared/Fld.jsx';
import { money } from '../../utils/format.js';

export function ModalConfigRangos({ open, rangos, onCancel, onSave }) {
  const [draft, setDraft] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setDraft(rangos.map((r) => ({ ...r, hasta: r.hasta === Infinity ? '' : r.hasta })));
      setErr('');
    }
  }, [open, rangos]);

  const updateRango = (i, patch) =>
    setDraft((d) => d.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const submit = () => {
    const finalRangos = draft.map((r, i) => ({
      hasta: i === draft.length - 1 ? Infinity : Number(r.hasta),
      porcentaje: Number(r.porcentaje)
    }));
    for (let i = 0; i < finalRangos.length - 1; i++) {
      if (finalRangos[i].hasta >= finalRangos[i + 1].hasta && finalRangos[i + 1].hasta !== Infinity) {
        return setErr(`Rango ${i + 1} debe ser < rango ${i + 2}`);
      }
    }
    onSave(finalRangos);
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-brand" /> Configurar rangos
        </span>
      }
      footer={
        <>
          <button onClick={onCancel} className="btn-ghost">Cancelar</button>
          <button onClick={submit} className="btn-primary">Guardar</button>
        </>
      }
    >
      <div className="p-5 space-y-3">
        {draft.map((r, i) => {
          const esUltimo = i === draft.length - 1;
          const minimo = i === 0 ? 0 : Number(draft[i - 1].hasta) || 0;
          return (
            <div key={i} className="bg-surface-sunken border border-border rounded-xl p-3">
              <div className="text-[10px] font-bold text-fg-muted uppercase mb-2">Rango {i + 1}</div>
              <div className="grid grid-cols-2 gap-2">
                <Fld label={esUltimo ? 'Desde' : 'Hasta'}>
                  {esUltimo ? (
                    <div className="input bg-surface-sunken font-mono text-fg-muted">{money(minimo)} en adelante</div>
                  ) : (
                    <input type="number" value={r.hasta} onChange={(e) => updateRango(i, { hasta: e.target.value })} className="input font-mono" />
                  )}
                </Fld>
                <Fld label="% Comisión">
                  <input type="number" min="0" max="100" step="0.5" value={r.porcentaje} onChange={(e) => updateRango(i, { porcentaje: e.target.value })} className="input font-mono" />
                </Fld>
              </div>
            </div>
          );
        })}
        {err && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-2 text-xs text-red-800 dark:text-red-300">
            {err}
          </div>
        )}
      </div>
    </Modal>
  );
}
