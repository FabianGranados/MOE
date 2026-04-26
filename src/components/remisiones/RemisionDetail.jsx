import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Download, FileText, Lock, Plus, User } from 'lucide-react';
import { fmtFechaCorta, fmtFechaLarga } from '../../utils/format.js';
import { audit } from '../../data/audit.js';
import { generarRemisionPDF } from './pdfRemision.js';

/**
 * Vista de detalle de una remisión finalizada (readonly).
 * Permite descargar el PDF y anexar otrosíes.
 */
export function RemisionDetail({ evento, remision, currentUser, onBack, onAddAddendum }) {
  const [nuevoTexto, setNuevoTexto] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [descargando, setDescargando] = useState(false);

  const handleAgregar = async () => {
    if (!nuevoTexto.trim()) return;
    setAgregando(true);
    await onAddAddendum(nuevoTexto.trim());
    audit({
      modulo: 'logistica',
      accion: 'addendum_remision',
      entidadTipo: 'remision',
      entidadId: remision.id,
      observaciones: nuevoTexto.trim().slice(0, 200)
    }, currentUser);
    setNuevoTexto('');
    setAgregando(false);
    toast.success('Otrosí anexado', { description: 'Visible para bodega y logística' });
  };

  const handleDescargarPDF = async () => {
    setDescargando(true);
    try {
      await generarRemisionPDF(evento, remision);
    } catch (e) {
      console.warn('[RemisionDetail] PDF error:', e);
      toast.error('No se pudo generar el PDF');
    } finally {
      setDescargando(false);
    }
  };

  const esComercialDueno =
    currentUser.rol === 'asesor_comercial' &&
    (evento?.comercial === currentUser.alias || evento?.createdBy === currentUser.id);
  const puedeAddAddendum =
    ['gerencia_general', 'direccion_comercial'].includes(currentUser.rol) || esComercialDueno;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="btn-icon flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold truncate tracking-tight">
                Remisión de pedido
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 bg-surface-sunken border border-border rounded">
                {remision.numero || `${evento?.numeroEvento}-R-${remision.cotizacionVersion}`}
              </span>
              {remision.finalizada && (
                <span className="chip bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Lock className="w-3 h-3" /> Finalizada
                </span>
              )}
            </div>
            <p className="text-xs text-fg-muted mt-0.5">{evento?.razonSocial || '—'}</p>
          </div>
        </div>
        <button onClick={handleDescargarPDF} disabled={descargando} className="btn-dark">
          <Download className="w-3.5 h-3.5" /> {descargando ? 'Generando...' : 'Descargar PDF'}
        </button>
      </div>

      {/* Banner finalización */}
      {remision.finalizada && (
        <div className="bg-stone-900 dark:bg-stone-800 border border-stone-700 rounded-xl p-3 text-xs text-stone-100 flex items-center gap-2 mb-5">
          <Lock className="w-4 h-4 flex-shrink-0" />
          <span>
            Enviada a logística el <strong>{fmtFechaLarga(remision.fechaFinalizacion)}</strong>.
            Cualquier cambio debe ir como otrosí.
          </span>
        </div>
      )}

      {/* Datos */}
      <div className="space-y-4">
        <Card title="Cliente">
          <div className="text-sm font-semibold">{evento?.razonSocial || '—'}</div>
          <div className="text-[11px] text-fg-muted">
            {evento?.tipoDocId} {evento?.numeroDocId} · {evento?.tipoCliente}
          </div>
          <div className="text-[11px] text-fg-muted">
            📞 {evento?.contactoTelefono} · ✉️ {evento?.contactoEmail}
          </div>
        </Card>

        <Card title="Evento">
          <div className="text-sm font-semibold">{evento?.tipoEvento}</div>
          {evento?.fechaEvento && (
            <div className="text-[11px] text-fg-muted">📅 {fmtFechaLarga(evento.fechaEvento)}</div>
          )}
          {evento?.direccion && (
            <div className="text-[11px] text-fg-muted">📍 {evento.direccion}{evento.ciudad && ` · ${evento.ciudad}`}</div>
          )}
          {evento?.mapsUrl && (
            <a href={evento.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-brand hover:underline inline-block">
              Abrir en Maps ↗
            </a>
          )}
        </Card>

        <Card title="Montaje y desmontaje">
          <div className="grid sm:grid-cols-2 gap-3 text-[11px]">
            <div>
              <div className="font-semibold">🚚 Montaje</div>
              <div className="text-fg-muted">{evento?.montaje?.fecha ? fmtFechaCorta(evento.montaje.fecha) : '—'}</div>
              <div className="text-fg-muted">
                {evento?.montaje?.tipo === 'cerrado' ? `Hora: ${evento.montaje.hora || '—'}` : `Franja: ${evento?.montaje?.franja || '—'}`}
              </div>
            </div>
            <div>
              <div className="font-semibold">📤 Desmontaje</div>
              <div className="text-fg-muted">{evento?.desmontaje?.fecha ? fmtFechaCorta(evento.desmontaje.fecha) : '—'}</div>
              <div className="text-fg-muted">
                {evento?.desmontaje?.tipo === 'cerrado' ? `Hora: ${evento.desmontaje.hora || '—'}` : `Franja: ${evento?.desmontaje?.franja || '—'}`}
              </div>
            </div>
          </div>
        </Card>

        <Card title={`Personas que reciben (${(remision.personasMontaje || []).length})`}>
          <ListaPersonas personas={remision.personasMontaje || []} />
        </Card>

        <Card title={`Personas que entregan (${(remision.personasDesmontaje || []).length})`}>
          <ListaPersonas personas={remision.personasDesmontaje || []} />
        </Card>

        {remision.notasOperativas && (
          <Card title="Notas operativas">
            <p className="text-[12px] whitespace-pre-wrap text-fg">{remision.notasOperativas}</p>
          </Card>
        )}

        <Card title={`Productos (${(evento?.items || []).length})`} hint="Sin precios — están en la cotización">
          <ul className="space-y-1.5 text-[11px]">
            {(evento?.items || []).map((it) => (
              <li key={it.id} className="flex items-baseline gap-3">
                <span className="font-mono text-fg-muted whitespace-nowrap">×{it.cantidad}</span>
                <span className="flex-1">{it.nombre}</span>
                {(Number(it.dias) || 1) > 1 && (
                  <span className="text-[10px] text-fg-subtle whitespace-nowrap">{it.dias} días</span>
                )}
              </li>
            ))}
          </ul>
        </Card>

        {/* Otrosíes */}
        <Card title={`Otrosíes (${(remision.addendums || []).length})`} hint="Notas anexas — visibles para bodega y logística">
          {(remision.addendums || []).length === 0 && !puedeAddAddendum && (
            <div className="text-[11px] text-fg-muted">Sin otrosíes anexados.</div>
          )}
          <ul className="space-y-2">
            {(remision.addendums || []).map((a) => (
              <li key={a.id} className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-3">
                <div className="text-[10px] text-amber-900 dark:text-amber-300 mb-1">
                  <strong>{a.creadoPorNombre || '—'}</strong> · {fmtFechaLarga(a.creadoEn)}
                </div>
                <div className="text-[12px] whitespace-pre-wrap">{a.texto}</div>
              </li>
            ))}
          </ul>
          {puedeAddAddendum && (
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">Anexar nuevo otrosí</div>
              <textarea
                value={nuevoTexto}
                onChange={(e) => setNuevoTexto(e.target.value)}
                rows={3}
                className="input resize-none text-xs"
                placeholder="Ej: el cliente quitó 6 mesas faltando 6 horas para el evento. Bodega: bajar 6 unidades del despacho."
              />
              <button
                onClick={handleAgregar}
                disabled={agregando || !nuevoTexto.trim()}
                className="btn-primary"
              >
                <Plus className="w-3.5 h-3.5" /> {agregando ? 'Anexando...' : 'Anexar otrosí'}
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({ title, hint, children }) {
  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">{title}</h3>
        {hint && <span className="text-[10px] text-fg-subtle">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ListaPersonas({ personas }) {
  if (!personas || personas.length === 0) {
    return <div className="text-[11px] text-fg-muted">Sin personas registradas.</div>;
  }
  return (
    <ul className="space-y-1.5">
      {personas.map((p, i) => (
        <li key={i} className="flex items-center gap-2 text-[12px]">
          <User className="w-3.5 h-3.5 text-fg-subtle flex-shrink-0" />
          <span className="font-semibold">{p.nombre || '—'}</span>
          <span className="text-fg-muted">·</span>
          <span className="font-mono text-fg-muted">{p.celular || '—'}</span>
          <span className="text-[10px] text-fg-subtle ml-auto">
            {i === 0 ? 'Principal' : i === 1 ? 'Backup' : `Adicional ${i - 1}`}
          </span>
        </li>
      ))}
    </ul>
  );
}
