import { useState } from 'react';
import { CheckCircle2, Lock, Send, Truck } from 'lucide-react';
import { Confirm } from '../shared/Confirm.jsx';
import { Fld } from '../shared/Fld.jsx';
import { HorarioBloque, HorarioHora } from './HorarioBloque.jsx';
import { HistorialCambios } from './HistorialCambios.jsx';
import { PersonasLista } from './PersonasLista.jsx';
import { buildMapsUrl, esMapsAutoUrl, fmtFechaLarga } from '../../utils/format.js';
import { getRemisionEnviadaInfo, isRemisionEnviada } from '../../utils/eventos.js';
import { audit } from '../../data/audit.js';

const DEFAULT_MONTAJE = { fecha: '', tipo: 'abierto', franja: 'manana', hora: '' };
const DEFAULT_DESMONTAJE = { fecha: '', tipo: 'abierto', franja: 'tarde', hora: '' };
const DEFAULT_HORARIO = { tipo: 'abierto', franja: 'tarde', hora: '' };
const DEFAULT_PERSONAS = [{ nombre: '', celular: '' }, { nombre: '', celular: '' }];

export function TabEvento({ ev, set, currentUser }) {
  const vendido = ev.estado === 'VENDIDO';
  const remisionEnviada = isRemisionEnviada(ev);
  const remInfo = getRemisionEnviadaInfo(ev);
  const bloqueado = remisionEnviada;

  const [showConfirmRemision, setShowConfirmRemision] = useState(false);

  const handleEnviarRemision = () => {
    const ts = new Date().toISOString();
    const entry = {
      id: `h_${Date.now()}_rem`,
      campo: '_remision_enviada',
      label: 'Remisión enviada a logística',
      anterior: '',
      nuevo: ts,
      usuarioId: currentUser?.id,
      usuarioNombre: currentUser?.nombre || '',
      fecha: ts
    };
    set({ historial: [...(ev.historial || []), entry] });
    audit({
      modulo: 'logistica',
      accion: 'enviar_remision',
      entidadTipo: 'cotizacion',
      entidadId: ev.id,
      observaciones: `${ev.numeroEvento}-${ev.version}`
    }, currentUser);
  };

  return (
    <div className="space-y-5">
      {bloqueado ? (
        <div className="bg-stone-900 dark:bg-stone-800 border border-stone-700 rounded-xl p-3 text-xs text-stone-100 flex items-start gap-2">
          <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Remisión enviada a logística</strong>
            {remInfo?.fecha && <> el <strong>{fmtFechaLarga(remInfo.fecha)}</strong></>}
            {remInfo?.usuarioNombre && <> por <strong>{remInfo.usuarioNombre}</strong></>}
            <div className="mt-0.5 text-stone-300">Estos datos quedan bloqueados. Para cualquier cambio, coordina con logística.</div>
          </div>
        </div>
      ) : vendido ? (
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

      <fieldset disabled={bloqueado} className="space-y-5 disabled:opacity-70">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-2">Horario del evento</div>
          <HorarioHora
            valor={ev.horarioEvento || DEFAULT_HORARIO}
            onChange={(h) => set({ horarioEvento: h })}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <Fld label="Dirección exacta">
            <input
              value={ev.direccion || ''}
              onChange={(e) => {
                const v = e.target.value;
                const patch = { direccion: v };
                if (esMapsAutoUrl(ev.mapsUrl)) patch.mapsUrl = buildMapsUrl(v, ev.ciudad);
                set(patch);
              }}
              placeholder="Cra 11 # 82-01"
              className="input"
            />
          </Fld>
          <Fld label="Ciudad / municipio">
            <input
              value={ev.ciudad || ''}
              onChange={(e) => {
                const v = e.target.value;
                const patch = { ciudad: v };
                if (esMapsAutoUrl(ev.mapsUrl)) patch.mapsUrl = buildMapsUrl(ev.direccion, v);
                set(patch);
              }}
              placeholder="Bogotá"
              className="input"
            />
          </Fld>
        </div>

        <Fld label="Link Google Maps" hint={esMapsAutoUrl(ev.mapsUrl) ? 'Generado automáticamente' : 'Personalizado'}>
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
            {!esMapsAutoUrl(ev.mapsUrl) && (
              <button
                type="button"
                onClick={() => set({ mapsUrl: buildMapsUrl(ev.direccion, ev.ciudad) })}
                title="Volver al link automático"
                className="px-3 flex items-center border border-border hover:bg-surface-sunken rounded-lg text-[11px] font-medium"
              >
                ↺
              </button>
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
      </fieldset>

      {vendido && !bloqueado && (
        <div className="bg-surface-sunken/50 border-2 border-dashed border-border rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Send className="w-4 h-4 text-fg-muted flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-fg">¿Datos completos?</div>
              <div className="text-[11px] text-fg-muted mt-0.5">
                Al enviar la remisión a logística, fechas, direcciones y personas quedarán <strong>bloqueadas</strong>. Asegúrate de que todo esté correcto.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowConfirmRemision(true)}
            className="btn-dark whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" /> Enviar a logística
          </button>
        </div>
      )}

      <HistorialCambios historial={ev.historial || []} />

      <Confirm
        open={showConfirmRemision}
        onCancel={() => setShowConfirmRemision(false)}
        onConfirm={() => { setShowConfirmRemision(false); handleEnviarRemision(); }}
        title="¿Enviar remisión a logística?"
        description="Después de este paso, los datos de entrega y recogida quedan bloqueados. Esta acción se registra en el historial."
        confirmLabel="Enviar"
        tone="success"
      />
    </div>
  );
}
