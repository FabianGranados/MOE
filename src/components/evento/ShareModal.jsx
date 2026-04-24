import { useState } from 'react';
import { AlertCircle, CheckCircle2, Copy, Loader2, MessageCircle, Printer, Share2 } from 'lucide-react';
import { Modal } from '../shared/Modal.jsx';
import { money, fmtFecha, fmtFechaCorta, fmtFechaLarga } from '../../utils/format.js';
import { aplicaIva, calcIva, calcItemTotal, calcProductos, calcTotal, calcTransporte } from '../../utils/calculos.js';
import { FRANJAS, TEXTO_LEGAL_REMISION, TIPOS_DOCUMENTO_ID } from '../../constants.js';

const resumenHorario = (h) => {
  if (!h) return '—';
  if (h.tipo === 'cerrado') return h.hora ? `${h.hora} h (cerrado)` : 'cerrado';
  return `abierto · ${FRANJAS[h.franja] || ''}`;
};
const resumenFechaHora = (b) => (b?.fecha ? `${fmtFechaCorta(b.fecha)} · ${resumenHorario(b)}` : '—');

const esRemision = (ev) => (ev.tipoDocumento || 'COTIZACION') === 'REMISION';
const tituloDoc  = (ev) => (esRemision(ev) ? 'REMISIÓN' : 'COTIZACIÓN');

const generarTextoWhatsApp = (ev) => {
  const lineas = [];
  lineas.push(`🎉 *${tituloDoc(ev)} DECOLOUNGE*`);
  lineas.push(`N° ${ev.numeroEvento}-${ev.version}`);
  lineas.push('');
  if (ev.razonSocial) lineas.push(`👤 *Cliente:* ${ev.razonSocial}`);
  if (ev.numeroDocId) lineas.push(`🪪 *${ev.tipoDocId || 'Doc'}:* ${ev.numeroDocId}`);
  if (ev.contactoNombre) lineas.push(`📞 *Contacto:* ${ev.contactoNombre}`);
  if (ev.fechaEvento) lineas.push(`📅 *Fecha:* ${fmtFechaLarga(ev.fechaEvento)}`);
  if (ev.horarioEvento && (ev.horarioEvento.hora || ev.horarioEvento.franja)) {
    lineas.push(`🕒 *Horario:* ${resumenHorario(ev.horarioEvento)}`);
  }
  if (ev.direccion || ev.ciudad) {
    const partes = [ev.direccion, ev.ciudad].filter(Boolean).join(', ');
    lineas.push(`📍 *Dirección:* ${partes}`);
  }
  if (ev.montaje?.fecha) lineas.push(`🚚 *Montaje:* ${resumenFechaHora(ev.montaje)}`);
  if (ev.desmontaje?.fecha) lineas.push(`📤 *Desmontaje:* ${resumenFechaHora(ev.desmontaje)}`);
  lineas.push('');
  lineas.push(`📦 *PRODUCTOS*`);
  (ev.items || []).forEach((it) => {
    lineas.push(`• ${it.nombre}`);
    lineas.push(`   ${it.cantidad} × ${it.dias}d = *${money(calcItemTotal(it))}*`);
  });
  lineas.push('');
  const sufijoIva = aplicaIva(ev) ? ' (IVA incluido)' : ' (sin IVA)';
  lineas.push(`💰 *TOTAL: ${money(calcTotal(ev))}*${sufijoIva}`);
  lineas.push(`💳 ${ev.formaPago}`);
  if (esRemision(ev)) {
    lineas.push('');
    lineas.push(`ℹ️ _${TEXTO_LEGAL_REMISION}_`);
  }
  lineas.push('');
  lineas.push(`_Por: ${ev.comercial}_ · _Decolounge_ ✨`);
  return lineas.join('\n');
};

const cargarJsPDF = () =>
  import('jspdf').then((m) => ({ jsPDF: m.jsPDF || m.default.jsPDF }));

async function descargarPDF(ev, setPdfError) {
  try {
    const { jsPDF } = await cargarJsPDF();
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    doc.setFillColor(225, 29, 72);
    doc.rect(0, 0, pageW, 8, 'F');

    doc.setFillColor(28, 25, 23);
    doc.roundedRect(margin, y, 14, 14, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('D', margin + 7, y + 10, { align: 'center' });

    doc.setTextColor(28, 25, 23);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('DECOLOUNGE', margin + 20, y + 8);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 113, 108);
    doc.text('Alquiler de mobiliario para eventos', margin + 20, y + 13);

    doc.setFontSize(8);
    doc.setTextColor(120, 113, 108);
    doc.text(tituloDoc(ev), pageW - margin, y + 4, { align: 'right' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(28, 25, 23);
    doc.text(`${ev.numeroEvento}-${ev.version}`, pageW - margin, y + 10, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 113, 108);
    doc.text(fmtFecha(ev.fechaCreacion), pageW - margin, y + 15, { align: 'right' });

    y += 22;
    doc.setDrawColor(225, 29, 72);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    const docLabel = TIPOS_DOCUMENTO_ID[ev.tipoDocId]?.label || ev.tipoDocId || '—';
    const campos = [
      ['CLIENTE', ev.razonSocial || '—'],
      [docLabel.toUpperCase(), ev.numeroDocId || '—'],
      ['TIPO CLIENTE', ev.tipoCliente || '—'],
      ['CONTACTO', ev.contactoNombre || '—'],
      ['TELÉFONO', ev.contactoTelefono || '—'],
      ['EMAIL', ev.contactoEmail || '—'],
      ['FECHA EVENTO', ev.fechaEvento ? fmtFechaLarga(ev.fechaEvento) : '—'],
      ['HORARIO EVENTO', resumenHorario(ev.horarioEvento)],
      ['TIPO EVENTO', ev.tipoEvento || '—'],
      ['DIRECCIÓN', ev.direccion || '—'],
      ['CIUDAD', ev.ciudad || '—'],
      ['MONTAJE', resumenFechaHora(ev.montaje)],
      ['DESMONTAJE', resumenFechaHora(ev.desmontaje)],
      ['COMERCIAL', ev.comercial || '—'],
      ['FORMA DE PAGO', ev.formaPago || '—']
    ];
    const filasCampos = Math.ceil(campos.length / 2);
    const altoCampos = 6 + filasCampos * 7 + 3;
    doc.setFillColor(250, 250, 249);
    doc.roundedRect(margin, y, pageW - margin * 2, altoCampos, 2, 2, 'F');
    const colW = (pageW - margin * 2) / 2;
    campos.forEach((c, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = margin + 4 + col * colW;
      const yy = y + 6 + row * 7;
      doc.setFontSize(6.5);
      doc.setTextColor(120, 113, 108);
      doc.setFont('helvetica', 'bold');
      doc.text(c[0], x, yy);
      doc.setFontSize(9);
      doc.setTextColor(28, 25, 23);
      doc.setFont('helvetica', 'normal');
      const val = doc.splitTextToSize(String(c[1]), colW - 8);
      doc.text(val[0] || '', x, yy + 3.5);
    });
    y += altoCampos + 6;

    // Bloque de personas (recibe / entrega)
    const personasMontaje = (ev.personasMontaje || []).filter((p) => p?.nombre);
    const personasDesmontaje = (ev.personasDesmontaje || []).filter((p) => p?.nombre);
    if (personasMontaje.length > 0 || personasDesmontaje.length > 0) {
      const altoPers = 8 + Math.max(personasMontaje.length, personasDesmontaje.length, 1) * 4 + 4;
      doc.setFillColor(250, 250, 249);
      doc.roundedRect(margin, y, pageW - margin * 2, altoPers, 2, 2, 'F');
      const colPW = (pageW - margin * 2) / 2;
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 113, 108);
      doc.text('RECIBEN EN MONTAJE', margin + 4, y + 5);
      doc.text('ENTREGAN EN DESMONTAJE', margin + 4 + colPW, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(28, 25, 23);
      personasMontaje.forEach((p, i) => {
        const txt = `${p.nombre}${p.celular ? ` · ${p.celular}` : ''}`;
        const line = doc.splitTextToSize(txt, colPW - 8);
        doc.text(line[0] || '', margin + 4, y + 10 + i * 4);
      });
      personasDesmontaje.forEach((p, i) => {
        const txt = `${p.nombre}${p.celular ? ` · ${p.celular}` : ''}`;
        const line = doc.splitTextToSize(txt, colPW - 8);
        doc.text(line[0] || '', margin + 4 + colPW, y + 10 + i * 4);
      });
      y += altoPers + 6;
    }

    doc.setFillColor(28, 25, 23);
    doc.rect(margin, y, pageW - margin * 2, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCTO', margin + 3 + 20, y + 5.5);
    doc.text('CANT', pageW - 70, y + 5.5, { align: 'center' });
    doc.text('DÍAS', pageW - 50, y + 5.5, { align: 'center' });
    doc.text('SUBTOTAL', pageW - margin - 3, y + 5.5, { align: 'right' });
    y += 8;

    const FILA_H = 22; // mm: 18mm foto + 2mm arriba/abajo
    const FOTO_S = 18;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(28, 25, 23);
    (ev.items || []).forEach((it, idx) => {
      if (y + FILA_H > 275) { doc.addPage(); y = 20; }

      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 249);
        doc.rect(margin, y, pageW - margin * 2, FILA_H, 'F');
      }

      // Foto del item
      const fotoX = margin + 2;
      const fotoY = y + 2;
      let fotoOk = false;
      if (it.foto && typeof it.foto === 'string' && it.foto.startsWith('data:image')) {
        try {
          const fmt = it.foto.includes('png') ? 'PNG' : 'JPEG';
          doc.addImage(it.foto, fmt, fotoX, fotoY, FOTO_S, FOTO_S, undefined, 'FAST');
          fotoOk = true;
        } catch (e) {
          fotoOk = false;
        }
      }
      if (!fotoOk) {
        doc.setFillColor(245, 245, 244);
        doc.roundedRect(fotoX, fotoY, FOTO_S, FOTO_S, 1, 1, 'F');
        doc.setDrawColor(225, 29, 72);
        doc.setLineWidth(0.2);
        doc.roundedRect(fotoX, fotoY, FOTO_S, FOTO_S, 1, 1, 'S');
        // Texto con el nombre dentro del placeholder
        doc.setFontSize(6);
        doc.setTextColor(87, 83, 78);
        doc.setFont('helvetica', 'bold');
        const raw = it.nombre || 'Producto';
        const lines = doc.splitTextToSize(raw, FOTO_S - 2);
        const maxLines = Math.min(lines.length, 4);
        const lineH = 2.2;
        const startY = fotoY + FOTO_S / 2 - ((maxLines - 1) * lineH) / 2 + 0.7;
        for (let i = 0; i < maxLines; i++) {
          doc.text(lines[i], fotoX + FOTO_S / 2, startY + i * lineH, { align: 'center' });
        }
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(28, 25, 23);
      }

      const textX = margin + 3 + FOTO_S + 3;
      const nombreLineas = doc.splitTextToSize(it.nombre, 85);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(nombreLineas.slice(0, 2), textX, y + 6);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 113, 108);
      doc.text(`${it.codigo} · ${it.categoria}`, textX, y + FILA_H - 4);
      doc.setTextColor(28, 25, 23);

      const yCenter = y + FILA_H / 2 + 1;
      doc.setFontSize(9);
      doc.text(String(it.cantidad), pageW - 70, yCenter, { align: 'center' });
      doc.text(String(it.dias), pageW - 50, yCenter, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(money(calcItemTotal(it)), pageW - margin - 3, yCenter, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      y += FILA_H;
    });
    y += 5;

    const llevaIva = aplicaIva(ev);
    const llevaTransp = calcTransporte(ev) > 0;
    const totalesAlto = 14 + (llevaTransp ? 6 : 0) + (llevaIva ? 6 : 0) + 8;
    doc.setFillColor(245, 245, 244);
    doc.roundedRect(pageW - 90, y, 75, totalesAlto, 2, 2, 'F');
    let ty = y + 6;

    doc.setFontSize(9);
    doc.setTextColor(120, 113, 108);
    doc.text('Productos:', pageW - 85, ty);
    doc.setTextColor(28, 25, 23);
    doc.text(money(calcProductos(ev)), pageW - margin - 3, ty, { align: 'right' });

    if (llevaTransp) {
      ty += 6;
      doc.setTextColor(120, 113, 108);
      doc.text('Transporte:', pageW - 85, ty);
      doc.setTextColor(28, 25, 23);
      doc.text(money(calcTransporte(ev)), pageW - margin - 3, ty, { align: 'right' });
    }

    if (llevaIva) {
      ty += 6;
      doc.setTextColor(120, 113, 108);
      doc.text('IVA 19%:', pageW - 85, ty);
      doc.setTextColor(28, 25, 23);
      doc.text(money(calcIva(ev)), pageW - margin - 3, ty, { align: 'right' });
    }

    ty += 4;
    doc.setDrawColor(28, 25, 23);
    doc.setLineWidth(0.5);
    doc.line(pageW - 85, ty, pageW - margin - 3, ty);

    ty += 6;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 95, 70);
    doc.text('TOTAL:', pageW - 85, ty);
    doc.text(money(calcTotal(ev)), pageW - margin - 3, ty, { align: 'right' });

    y += totalesAlto + 6;

    if (esRemision(ev)) {
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.3);
      const rHeight = 16;
      doc.roundedRect(margin, y, pageW - margin * 2, rHeight, 2, 2, 'FD');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(146, 64, 14);
      doc.text('IMPORTANTE · DOCUMENTO NO VÁLIDO COMO FACTURA', margin + 3, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 50, 20);
      const legalLines = doc.splitTextToSize(TEXTO_LEGAL_REMISION, pageW - margin * 2 - 6);
      doc.text(legalLines.slice(0, 2), margin + 3, y + 9);
      y += rHeight + 4;
    }

    if (ev.comentarios) {
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, pageW - margin * 2, 20, 2, 2, 'FD');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(146, 64, 14);
      doc.text('OBSERVACIONES', margin + 3, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(41, 37, 36);
      const coment = doc.splitTextToSize(ev.comentarios, pageW - margin * 2 - 6);
      doc.text(coment.slice(0, 3), margin + 3, y + 10);
      y += 24;
    }

    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(120, 113, 108);
    doc.text('Decolounge · Bogotá, Colombia · Cotización válida por 15 días · Precios por día de alquiler', pageW / 2, pageH - 8, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('Gracias por confiar en nosotros ✨', pageW / 2, pageH - 4, { align: 'center' });

    const fileName = `Cotizacion_${ev.numeroEvento}-${ev.version}_${(ev.razonSocial || 'cliente').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.pdf`;
    doc.save(fileName);
    return true;
  } catch (e) {
    console.error('Error generando PDF:', e);
    setPdfError('No se pudo generar el PDF.');
    return false;
  }
}

export function ShareModal({ open, ev, onClose }) {
  const [copiado, setCopiado] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [pdfError, setPdfError] = useState('');

  if (!ev) return null;

  const texto = generarTextoWhatsApp(ev);

  const compartirWhatsApp = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');

  const copiarTexto = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {}
  };

  const handlePdf = async () => {
    setDescargando(true);
    setPdfError('');
    await descargarPDF(ev, setPdfError);
    setDescargando(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-emerald-600" /> Compartir cotización
        </span>
      }
      subtitle={`${ev.numeroEvento}-${ev.version} · ${ev.razonSocial || 'Sin nombre'}`}
    >
      <div className="p-5 space-y-4">
        {(() => {
          const sinFoto = (ev.items || []).filter((it) => !it.foto || !String(it.foto).startsWith('data:image'));
          if (sinFoto.length === 0) return null;
          return (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-3 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <div>
                <strong>{sinFoto.length} producto{sinFoto.length !== 1 ? 's' : ''} sin foto.</strong> El PDF mostrará un placeholder "SIN FOTO".
                Para evitar confusiones con el cliente, sube la foto desde el <strong>Catálogo</strong> antes de compartir.
                <div className="mt-1 text-[10px] text-amber-800 dark:text-amber-400/80">
                  Faltan foto: {sinFoto.map((it) => it.nombre).slice(0, 3).join(', ')}{sinFoto.length > 3 && ` y ${sinFoto.length - 3} más`}
                </div>
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={compartirWhatsApp}
            className="flex flex-col items-center gap-1 p-4 border-2 border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition active:scale-95"
          >
            <MessageCircle className="w-6 h-6 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">WhatsApp</span>
            <span className="text-[9px] text-fg-muted">Enviar chat</span>
          </button>
          <button
            onClick={copiarTexto}
            className="flex flex-col items-center gap-1 p-4 border-2 border-border hover:border-fg rounded-xl transition active:scale-95"
          >
            {copiado ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <Copy className="w-6 h-6 text-fg" />}
            <span className="text-xs font-semibold">{copiado ? '¡Copiado!' : 'Copiar texto'}</span>
            <span className="text-[9px] text-fg-muted">Pegar donde quieras</span>
          </button>
          <button
            onClick={handlePdf}
            disabled={descargando}
            className="flex flex-col items-center gap-1 p-4 border-2 border-brand/20 hover:border-brand hover:bg-brand-softer rounded-xl transition active:scale-95 disabled:opacity-60"
          >
            {descargando ? (
              <Loader2 className="w-6 h-6 text-brand animate-spin" />
            ) : (
              <Printer className="w-6 h-6 text-brand" />
            )}
            <span className="text-xs font-semibold text-brand">{descargando ? 'Generando...' : 'Descargar PDF'}</span>
            <span className="text-[9px] text-fg-muted">Archivo .pdf</span>
          </button>
        </div>

        {pdfError && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-2.5 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{pdfError}</span>
          </div>
        )}

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-fg-muted mb-2 flex items-center justify-between">
            <span>Vista previa del mensaje</span>
            <span className="text-[9px] font-normal normal-case text-fg-subtle">{texto.length} caracteres</span>
          </div>
          <div className="bg-surface-sunken border border-border rounded-xl p-4 max-h-60 overflow-y-auto">
            <pre className="text-[11px] font-mono whitespace-pre-wrap text-fg leading-relaxed">{texto}</pre>
          </div>
        </div>
      </div>
    </Modal>
  );
}
