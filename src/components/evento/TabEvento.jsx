import { CheckCircle2 } from 'lucide-react';
import { Fld } from '../shared/Fld.jsx';
import { HorarioBloque } from './HorarioBloque.jsx';
import { HistorialCambios } from './HistorialCambios.jsx';
import { fmtFechaLarga } from '../../utils/format.js';

const DEFAULT_MONTAJE = { fecha: '', tipo: 'abierto', franja: 'manana', hora: '' };
const DEFAULT_DESMONTAJE = { fecha: '', tipo: 'abierto', franja: 'tarde', hora: '' };

export function TabEvento({ ev, set }) {
  return (
    <div className="space-y-5">
      <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4" />
        <span><strong>Evento VENDIDO</strong>{ev.fechaEvento && <> · <strong>{fmtFechaLarga(ev.fechaEvento)}</strong></>}</span>
      </div>

      <Fld label="Dirección exacta">
        <input value={ev.direccion || ''} onChange={(e) => set({ direccion: e.target.value })} className="input" />
      </Fld>

      <Fld label="Link Google Maps">
        <div className="flex gap-2">
          <input
            value={ev.mapsUrl || ''}
            onChange={(e) => set({ mapsUrl: e.target.value })}
            className="input flex-1"
            placeholder="https://maps.google.com/..."
          />
          {ev.mapsUrl && (
            <a
              href={ev.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 flex items-center bg-fg text-surface rounded-lg text-[11px] font-medium"
            >
              Abrir
            </a>
          )}
        </div>
      </Fld>

      <HorarioBloque titulo="🚚 Montaje / Entrega" valor={ev.montaje || DEFAULT_MONTAJE} onChange={(m) => set({ montaje: m })} fechaEvento={ev.fechaEvento} />
      <HorarioBloque titulo="📤 Desmontaje / Recogida" valor={ev.desmontaje || DEFAULT_DESMONTAJE} onChange={(m) => set({ desmontaje: m })} fechaEvento={ev.fechaEvento} esDesmontaje />

      <div className="pt-3 border-t border-border">
        <div className="text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-2">Contacto principal</div>
        <div className="grid grid-cols-2 gap-3">
          <Fld label="Nombre">
            <input
              value={ev.contactoPrincipal?.nombre || ''}
              onChange={(e) => set({ contactoPrincipal: { ...(ev.contactoPrincipal || {}), nombre: e.target.value } })}
              className="input"
            />
          </Fld>
          <Fld label="Celular">
            <input
              value={ev.contactoPrincipal?.celular || ''}
              onChange={(e) => set({ contactoPrincipal: { ...(ev.contactoPrincipal || {}), celular: e.target.value } })}
              className="input font-mono"
            />
          </Fld>
        </div>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-2">Contacto backup</div>
        <div className="grid grid-cols-2 gap-3">
          <Fld label="Nombre">
            <input
              value={ev.contactoBackup?.nombre || ''}
              onChange={(e) => set({ contactoBackup: { ...(ev.contactoBackup || {}), nombre: e.target.value } })}
              className="input"
            />
          </Fld>
          <Fld label="Celular">
            <input
              value={ev.contactoBackup?.celular || ''}
              onChange={(e) => set({ contactoBackup: { ...(ev.contactoBackup || {}), celular: e.target.value } })}
              className="input font-mono"
            />
          </Fld>
        </div>
      </div>

      <Fld label="Notas operativas">
        <textarea
          value={ev.notasOperativas || ''}
          onChange={(e) => set({ notasOperativas: e.target.value })}
          rows={3}
          className="input resize-none"
        />
      </Fld>

      <HistorialCambios historial={ev.historial || []} />
    </div>
  );
}
