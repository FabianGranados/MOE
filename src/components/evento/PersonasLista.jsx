import { Plus, Trash2, User } from 'lucide-react';
import { Fld } from '../shared/Fld.jsx';

export function PersonasLista({ personas = [], onChange, minimo = 2, titulo = 'Personas', hint }) {
  const lista = personas.length >= minimo ? personas : [
    ...personas,
    ...Array.from({ length: minimo - personas.length }, () => ({ nombre: '', celular: '' }))
  ];

  const update = (i, patch) =>
    onChange(lista.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const add = () => onChange([...lista, { nombre: '', celular: '' }]);

  const remove = (i) => {
    if (lista.length <= minimo) return;
    onChange(lista.filter((_, idx) => idx !== i));
  };

  return (
    <div className="border border-border rounded-xl p-4 bg-surface-sunken/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-fg-muted" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-fg-muted">{titulo}</h4>
          <span className="chip bg-surface-sunken text-fg-muted border-border">{lista.length}</span>
        </div>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:text-brand-hover transition"
        >
          <Plus className="w-3 h-3" /> Agregar
        </button>
      </div>

      {hint && <p className="text-[10px] text-fg-muted mb-3">{hint}</p>}

      <div className="space-y-3">
        {lista.map((p, i) => {
          const puedeEliminar = lista.length > minimo;
          return (
            <div key={i} className="bg-surface border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">
                  {i === 0 ? 'Principal' : i === 1 ? 'Backup' : `Adicional ${i - 1}`}
                </span>
                {puedeEliminar && (
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 text-fg-subtle hover:text-red-600 rounded transition"
                    title="Quitar"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Fld label="Nombre">
                  <input
                    value={p.nombre || ''}
                    onChange={(e) => update(i, { nombre: e.target.value })}
                    placeholder={i === 0 ? 'María Pérez' : 'Carlos López'}
                    className="input"
                  />
                </Fld>
                <Fld label="Celular">
                  <input
                    value={p.celular || ''}
                    onChange={(e) => update(i, { celular: e.target.value })}
                    placeholder="+57 300 123 4567"
                    className="input font-mono"
                  />
                </Fld>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
