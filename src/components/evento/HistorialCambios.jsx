import { FileText } from 'lucide-react';

export function HistorialCambios({ historial }) {
  const items = (historial || []).slice().reverse();
  return (
    <div className="mt-6 pt-5 border-t-2 border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <FileText className="w-4 h-4 text-fg-muted" /> Historial
        </h3>
        <span className="chip bg-surface-sunken text-fg-muted border-border">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="card border-dashed p-6 text-center text-[11px] text-fg-muted">Sin cambios</div>
      ) : (
        <div className="relative pl-4 border-l-2 border-border space-y-3">
          {items.map((h) => (
            <div key={h.id} className="relative">
              <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-brand ring-2 ring-surface" />
              <div className="card p-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                  <div className="text-[11px] font-semibold text-fg">{h.label}</div>
                  <div className="text-[10px] text-fg-muted">
                    {h.usuarioNombre} · {new Date(h.fecha).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {h.campo === '_estado' ? (
                  <div className="text-[11px]">
                    <span className="font-mono bg-surface-sunken px-1.5 py-0.5 rounded">{h.anterior}</span> →{' '}
                    <span className="font-mono bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-semibold">
                      {h.nuevo}
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-fg-muted">
                    <span className="line-through text-fg-subtle">{h.anterior || '(vacío)'}</span> →{' '}
                    <span className="font-semibold text-fg">{h.nuevo || '(vacío)'}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
