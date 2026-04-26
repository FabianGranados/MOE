import { AlertCircle, CalendarClock } from 'lucide-react';
import { Fld } from '../shared/Fld.jsx';
import { FRANJAS } from '../../constants.js';
import { addDias, diffDias, fmtFechaCorta, hoy } from '../../utils/format.js';

export function HorarioHora({ valor, onChange }) {
  const esCerrado = valor.tipo === 'cerrado';
  const resumen = esCerrado
    ? (valor.hora ? `${valor.hora} h (cerrado)` : 'Horario cerrado · falta hora')
    : `Horario abierto · ${FRANJAS[valor.franja]}`;
  return (
    <div className="border border-border rounded-xl p-4 bg-surface-sunken/50">
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          type="button"
          onClick={() => onChange({ ...valor, tipo: 'abierto' })}
          className={`py-2 rounded-lg text-xs font-semibold border-2 transition ${
            !esCerrado ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-surface text-fg-muted border-border'
          }`}
        >
          Horario abierto
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...valor, tipo: 'cerrado' })}
          className={`py-2 rounded-lg text-xs font-semibold border-2 transition ${
            esCerrado ? 'bg-amber-600 text-white border-amber-600' : 'bg-surface text-fg-muted border-border'
          }`}
        >
          Horario cerrado
        </button>
      </div>
      {!esCerrado ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...valor, franja: 'manana' })}
            className={`py-2 rounded-lg text-xs font-medium border transition ${
              valor.franja === 'manana' ? 'bg-fg text-surface border-fg' : 'bg-surface text-fg-muted border-border'
            }`}
          >
            ☀️ {FRANJAS.manana}
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...valor, franja: 'tarde' })}
            className={`py-2 rounded-lg text-xs font-medium border transition ${
              valor.franja === 'tarde' ? 'bg-fg text-surface border-fg' : 'bg-surface text-fg-muted border-border'
            }`}
          >
            🌤️ {FRANJAS.tarde}
          </button>
        </div>
      ) : (
        <Fld label="Hora (formato 24h)" required hint="ej. 14:30">
          <input
            type="time"
            step={300}
            value={valor.hora || ''}
            onChange={(e) => onChange({ ...valor, hora: e.target.value })}
            className="input font-mono text-base tracking-wider"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          />
        </Fld>
      )}

      <div className="mt-3 pt-3 border-t border-border bg-surface rounded-lg p-2">
        <div className="text-[9px] uppercase tracking-wider text-fg-muted font-bold mb-0.5">Horario elegido</div>
        <div className="text-xs font-semibold text-fg">🕒 {resumen}</div>
      </div>
    </div>
  );
}

export function HorarioBloque({ titulo, valor, onChange, fechaEvento, esDesmontaje }) {
  const esCerrado = valor.tipo === 'cerrado';
  // Atajos contextuales:
  //  · Desmontaje: nunca día antes (no recoges algo que no entregaste)
  //  · Montaje: nunca día después (el evento ya pasó)
  const atajos = esDesmontaje
    ? [
        { label: 'Mismo día',   dias: 0 },
        { label: 'Día después', dias: 1 }
      ]
    : [
        { label: 'Día antes',   dias: -1 },
        { label: 'Mismo día',   dias: 0 }
      ];

  const aviso = (() => {
    if (!valor.fecha || !fechaEvento) return null;
    const diff = diffDias(valor.fecha, fechaEvento);
    if (!esDesmontaje && diff > 0) return `⚠️ El montaje es ${diff} día(s) DESPUÉS del evento.`;
    if (esDesmontaje && diff < 0) return `⚠️ El desmontaje es ${Math.abs(diff)} día(s) ANTES del evento.`;
    return null;
  })();

  const textoRelativo = (() => {
    if (!valor.fecha || !fechaEvento) return '';
    const diff = diffDias(valor.fecha, fechaEvento);
    if (diff === 0) return '🎯 Mismo día del evento';
    if (diff === -1) return '📅 Un día antes del evento';
    if (diff === 1) return '📅 Un día después del evento';
    if (diff < 0) return `📅 ${Math.abs(diff)} días antes del evento`;
    return `📅 ${diff} días después del evento`;
  })();

  return (
    <div className="border border-border rounded-xl p-4 bg-surface-sunken/50">
      <div className="text-xs font-bold mb-3">{titulo}</div>

      <div className="mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-2">
          <CalendarClock className="w-3 h-3" /> Fecha *
        </div>
        {fechaEvento && (
          <div className={`grid gap-1.5 mb-2 ${atajos.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {atajos.map((a) => {
              const f = addDias(fechaEvento, a.dias);
              const activo = valor.fecha === f;
              return (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => onChange({ ...valor, fecha: f })}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold border transition ${
                    activo ? 'bg-brand text-white border-brand' : 'bg-surface text-fg-muted border-border hover:border-brand/30'
                  }`}
                >
                  {a.label}
                  <div className={`text-[9px] mt-0.5 ${activo ? 'text-brand-softer' : 'text-fg-subtle'}`}>{fmtFechaCorta(f)}</div>
                </button>
              );
            })}
          </div>
        )}
        <input
          type="date"
          min={hoy()}
          value={valor.fecha || ''}
          onChange={(e) => onChange({ ...valor, fecha: e.target.value })}
          className="input"
        />
        {textoRelativo && <div className="mt-1.5 text-[10px] text-fg-muted font-medium">{textoRelativo}</div>}
        {aviso && (
          <div className="mt-2 rounded-lg p-2 text-[10px] flex items-start gap-1.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300">
            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /><span>{aviso}</span>
          </div>
        )}
      </div>

      <div className="text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-2">Hora</div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          type="button"
          onClick={() => onChange({ ...valor, tipo: 'abierto' })}
          className={`py-2 rounded-lg text-xs font-semibold border-2 transition ${
            !esCerrado ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-surface text-fg-muted border-border'
          }`}
        >
          Horario abierto
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...valor, tipo: 'cerrado' })}
          className={`py-2 rounded-lg text-xs font-semibold border-2 transition ${
            esCerrado ? 'bg-amber-600 text-white border-amber-600' : 'bg-surface text-fg-muted border-border'
          }`}
        >
          Horario cerrado
        </button>
      </div>

      {!esCerrado ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...valor, franja: 'manana' })}
            className={`py-2 rounded-lg text-xs font-medium border transition ${
              valor.franja === 'manana' ? 'bg-fg text-surface border-fg' : 'bg-surface text-fg-muted border-border'
            }`}
          >
            ☀️ {FRANJAS.manana}
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...valor, franja: 'tarde' })}
            className={`py-2 rounded-lg text-xs font-medium border transition ${
              valor.franja === 'tarde' ? 'bg-fg text-surface border-fg' : 'bg-surface text-fg-muted border-border'
            }`}
          >
            🌤️ {FRANJAS.tarde}
          </button>
        </div>
      ) : (
        <Fld label="Hora exacta (formato 24h)" required hint="ej. 14:30">
          <input
            type="time"
            step={300}
            value={valor.hora || ''}
            onChange={(e) => onChange({ ...valor, hora: e.target.value })}
            className="input font-mono text-base tracking-wider"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          />
        </Fld>
      )}

      {valor.fecha && (
        <div className="mt-3 pt-3 border-t border-border bg-surface rounded-lg p-2">
          <div className="text-[9px] uppercase tracking-wider text-fg-muted font-bold mb-0.5">Resumen</div>
          <div className="text-xs font-semibold text-fg">
            {fmtFechaCorta(valor.fecha)} · {esCerrado ? (valor.hora ? `${valor.hora} h` : 'sin hora') : FRANJAS[valor.franja]}
          </div>
        </div>
      )}
    </div>
  );
}
