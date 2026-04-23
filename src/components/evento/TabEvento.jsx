import { CheckCircle2, Truck } from 'lucide-react';
import { Fld } from '../shared/Fld.jsx';
import { HorarioBloque, HorarioHora } from './HorarioBloque.jsx';
import { HistorialCambios } from './HistorialCambios.jsx';
import { PersonasLista } from './PersonasLista.jsx';
import { fmtFechaLarga } from '../../utils/format.js';

const DEFAULT_MONTAJE = { fecha: '', tipo: 'abierto', franja: 'manana', hora: '' };
const DEFAULT_DESMONTAJE = { fecha: '', tipo: 'abierto', franja: 'tarde', hora: '' };
const DEFAULT_HORARIO = { tipo: 'abierto', franja: 'tarde', hora: '' };
const DEFAULT_PERSONAS = [{ nombre: '', celular: '' }, { nombre: '', celular: '' }];

export function TabEvento({ ev, set }) {
  const vendido = ev.estado === 'VENDIDO';
  return (
    <div className="space-y-5">
      {vendido ? (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span><strong>Evento VENDIDO</strong>{ev.fechaEvento && <> · <strong>{fmtFechaLarga(ev.fechaEvento)}</strong></>}</span>
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
          <Truck className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Estos datos van en la cotización y forman la <strong>Remisión de Entrega</strong> que usará logística cuando se confirme la venta.</span>
        </div>
      )}

      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-2">Horario del evento</div>
        <HorarioHora
          valor={ev.horarioEvento || DEFAULT_HORARIO}
          onChange={(h) => set({ horarioEvento: h })}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Fld label="Dirección exacta">
          <input value={ev.direccion || ''} onChange={(e) => set({ direccion: e.target.value })} className="input" />
        </Fld>
        <Fld label="Ciudad / municipio">
          <input value={ev.ciudad || ''} onChange={(e) => set({ ciudad: e.target.value })} className="input" />
        </Fld>
      </div>

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

      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-2">🚚 Montaje / Entrega</div>
        <HorarioBloque
          titulo="Fecha y hora"
          valor={ev.montaje || DEFAULT_MONTAJE}
          onChange={(m) => set({ montaje: m })}
          fechaEvento={ev.fechaEvento}
        />
        <div className="mt-3">
          <PersonasLista
            titulo="Personas que reciben"
            minimo={2}
            personas={ev.personasMontaje || DEFAULT_PERSONAS}
            onChange={(p) => set({ personasMontaje: p })}
          />
        </div>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-2">📤 Desmontaje / Recogida</div>
        <HorarioBloque
          titulo="Fecha y hora"
          valor={ev.desmontaje || DEFAULT_DESMONTAJE}
          onChange={(m) => set({ desmontaje: m })}
          fechaEvento={ev.fechaEvento}
          esDesmontaje
        />
        <div className="mt-3">
          <PersonasLista
            titulo="Personas que entregan"
            minimo={2}
            personas={ev.personasDesmontaje || DEFAULT_PERSONAS}
            onChange={(p) => set({ personasDesmontaje: p })}
          />
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
