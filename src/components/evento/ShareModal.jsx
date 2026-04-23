import { useState } from 'react';
import { AlertCircle, CheckCircle2, Copy, Loader2, MessageCircle, Printer, Share2 } from 'lucide-react';
import { Modal } from '../shared/Modal.jsx';
import { money, fmtFecha, fmtFechaLarga } from '../../utils/format.js';
import { calcIva, calcItemTotal, calcProductos, calcTotal, calcTransporte } from '../../utils/calculos.js';

const generarTextoWhatsApp = (ev) => {
  const lineas = [];
  lineas.push(`🎉 *COTIZACIÓN DECOLOUNGE*`);
  lineas.push(`N° ${ev.numeroEvento}-${ev.version}`);
  lineas.push('');
  if (ev.razonSocial) lineas.push(`👤 *Cliente:* ${ev.razonSocial}`);
  if (ev.contactoNombre) lineas.push(`📞 *Contacto:* ${ev.contactoNombre}`);
  if (ev.fechaEvento) lineas.push(`📅 *Fecha:* ${fmtFechaLarga(ev.fechaEvento)}`);
  lineas.push('');
  lineas.push(`📦 *PRODUCTOS*`);
  (ev.items || []).forEach((it) => {
    lineas.push(`• ${it.nombre}`);
    lineas.push(`   ${it.cantidad} × ${it.dias}d = *${money(calcItemTotal(it))}*`);
  });
  lineas.push('');
  lineas.push(`💰 *TOTAL: ${money(calcTotal(ev))}* (IVA incluido)`);
  lineas.push(`💳 ${ev.formaPago}`);
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
    doc.text('COTIZACIÓN', pageW - margin, y + 4, { align: 'right' });
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

    doc.setFillColor(250, 250, 249);
    doc.roundedRect(margin, y, pageW - margin * 2, 32, 2, 2, 'F');
    const colW = (pageW - margin * 2) / 2;
    const campos = [
      ['CLIENTE', ev.razonSocial || '—'],
      ['CONTACTO', ev.contactoNombre || '—'],
      ['TELÉFONO', ev.contactoTelefono || '—'],
      ['EMAIL', ev.contactoEmail || '—'],
      ['FECHA EVENTO', ev.fechaEvento ? fmtFechaLarga(ev.fechaEvento) : '—'],
      ['TIPO', ev.tipoEvento || '—'],
      ['COMERCIAL', ev.comercial || '—'],
      ['FORMA DE PAGO', ev.formaPago || '—']
    ];
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
    y += 38;

    doc.setFillColor(28, 25, 23);
    doc.rect(margin, y, pageW - margin * 2, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCTO', margin + 3, y + 5.5);
    doc.text('CANT', pageW - 70, y + 5.5, { align: 'center' });
    doc.text('DÍAS', pageW - 50, y + 5.5, { align: 'center' });
    doc.text('SUBTOTAL', pageW - margin - 3, y + 5.5, { align: 'right' });
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(28, 25, 23);
    (ev.items || []).forEach((it, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 249);
        doc.rect(margin, y, pageW - margin * 2, 10, 'F');
      }
      const nombreLineas = doc.splitTextToSize(it.nombre, 95);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(nombreLineas[0], margin + 3, y + 4);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 113, 108);
      doc.text(`${it.codigo} · ${it.categoria}`, margin + 3, y + 8);
      doc.setTextColor(28, 25, 23);
      doc.setFontSize(9);
      doc.text(String(it.cantidad), pageW - 70, y + 6, { align: 'center' });
      doc.text(String(it.dias), pageW - 50, y + 6, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(money(calcItemTotal(it)), pageW - margin - 3, y + 6, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      y += 10;
      if (y > 260) { doc.addPage(); y = 20; }
    });
    y += 5;

    doc.setFillColor(245, 245, 244);
    doc.roundedRect(pageW - 90, y, 75, 32, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(120, 113, 108);
    doc.text('Productos:', pageW - 85, y + 6);
    doc.setTextColor(28, 25, 23);
    doc.text(money(calcProductos(ev)), pageW - margin - 3, y + 6, { align: 'right' });

    if (calcTransporte(ev) > 0) {
      doc.setTextColor(120, 113, 108);
      doc.text('Transporte:', pageW - 85, y + 12);
      doc.setTextColor(28, 25, 23);
      doc.text(money(calcTransporte(ev)), pageW - margin - 3, y + 12, { align: 'right' });
    }

    doc.setTextColor(120, 113, 108);
    doc.text('IVA 19%:', pageW - 85, y + 18);
    doc.setTextColor(28, 25, 23);
    doc.text(money(calcIva(ev)), pageW - margin - 3, y + 18, { align: 'right' });

    doc.setDrawColor(28, 25, 23);
    doc.setLineWidth(0.5);
    doc.line(pageW - 85, y + 22, pageW - margin - 3, y + 22);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 95, 70);
    doc.text('TOTAL:', pageW - 85, y + 28);
    doc.text(money(calcTotal(ev)), pageW - margin - 3, y + 28, { align: 'right' });
    y += 40;

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
