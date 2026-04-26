// =====================================================================
// MOE · Generación del PDF de la Remisión de Pedido
//
// Documento operativo para bodega y logística. Lleva todo lo de la
// cotización (cliente, evento, dirección, items, total) + lo propio
// de la remisión (personas que reciben/entregan, notas operativas,
// otrosíes).
// =====================================================================

import { calcTotal } from '../../utils/calculos.js';
import { fmtFechaCorta, fmtFechaLarga, money } from '../../utils/format.js';

const FRANJAS = { manana: 'Mañana (9am - 12pm)', tarde: 'Tarde (1pm - 4pm)' };

const cargarJsPDF = () =>
  import('jspdf').then((m) => ({ jsPDF: m.jsPDF || m.default.jsPDF }));

function resumenHorario(h) {
  if (!h) return '—';
  if (h.tipo === 'cerrado') return h.hora ? `${h.hora} h (cerrado)` : 'Cerrado · sin hora';
  return `Abierto · ${FRANJAS[h.franja] || h.franja || ''}`.trim();
}

function resumenFechaHora(b) {
  if (!b?.fecha) return '—';
  return `${fmtFechaCorta(b.fecha)} · ${resumenHorario(b)}`;
}

export async function generarRemisionPDF(evento, remision) {
  const { jsPDF } = await cargarJsPDF();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = 20;

  // Banda superior
  doc.setFillColor(225, 29, 72);
  doc.rect(0, 0, pageW, 8, 'F');

  // Logo
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
  doc.text('Remisión de pedido · Logística', margin + 20, y + 13);

  // Número remisión + fechas
  doc.setFontSize(8);
  doc.setTextColor(120, 113, 108);
  doc.text('REMISIÓN', pageW - margin, y + 4, { align: 'right' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(28, 25, 23);
  const numero = remision.numero || `${evento.numeroEvento}-R-${remision.cotizacionVersion}`;
  doc.text(numero, pageW - margin, y + 10, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 113, 108);
  if (remision.fechaFinalizacion) {
    doc.text(`Emitida: ${fmtFechaCorta(remision.fechaFinalizacion)}`, pageW - margin, y + 15, { align: 'right' });
  }

  y += 22;
  doc.setDrawColor(225, 29, 72);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Bloque de campos (cliente + evento)
  const campos = [
    ['CLIENTE', evento.razonSocial || '—'],
    ['DOCUMENTO', `${evento.tipoDocId || ''} ${evento.numeroDocId || ''}`.trim() || '—'],
    ['CONTACTO', evento.contactoNombre || '—'],
    ['TELÉFONO', evento.contactoTelefono || '—'],
    ['EMAIL', evento.contactoEmail || '—'],
    ['TIPO EVENTO', evento.tipoEvento || '—'],
    ['FECHA EVENTO', evento.fechaEvento ? fmtFechaLarga(evento.fechaEvento) : '—'],
    ['HORARIO EVENTO', resumenHorario(evento.horarioEvento)],
    ['DIRECCIÓN', evento.direccion || '—'],
    ['CIUDAD', evento.ciudad || '—'],
    ['MONTAJE', resumenFechaHora(evento.montaje)],
    ['DESMONTAJE', resumenFechaHora(evento.desmontaje)],
    ['COMERCIAL', evento.comercial || '—'],
    ['Nº COTIZACIÓN', `${evento.numeroEvento}-${evento.version || 1}`]
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

  // Personas
  const pm = (remision.personasMontaje || []).filter((p) => p?.nombre);
  const pd = (remision.personasDesmontaje || []).filter((p) => p?.nombre);
  if (pm.length > 0 || pd.length > 0) {
    const filas = Math.max(pm.length, pd.length, 1);
    const altoPers = 10 + filas * 5 + 4;
    doc.setFillColor(250, 250, 249);
    doc.roundedRect(margin, y, pageW - margin * 2, altoPers, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(120, 113, 108);
    doc.setFont('helvetica', 'bold');
    doc.text('PERSONAS QUE RECIBEN', margin + 4, y + 6);
    doc.text('PERSONAS QUE ENTREGAN', margin + 4 + colW, y + 6);
    doc.setFontSize(8.5);
    doc.setTextColor(28, 25, 23);
    doc.setFont('helvetica', 'normal');
    for (let i = 0; i < filas; i++) {
      const yy = y + 11 + i * 5;
      const a = pm[i];
      const b = pd[i];
      if (a) doc.text(`• ${a.nombre} · ${a.celular || ''}`, margin + 4, yy);
      if (b) doc.text(`• ${b.nombre} · ${b.celular || ''}`, margin + 4 + colW, yy);
    }
    y += altoPers + 6;
  }

  // Tabla de productos
  doc.setFillColor(28, 25, 23);
  doc.rect(margin, y, pageW - margin * 2, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CANT', margin + 3, y + 5);
  doc.text('PRODUCTO', margin + 18, y + 5);
  doc.text('DÍAS', margin + 105, y + 5);
  doc.text('VR. UNIT', margin + 125, y + 5, { align: 'right' });
  doc.text('TOTAL', pageW - margin - 3, y + 5, { align: 'right' });
  y += 7;

  const items = evento.items || [];
  doc.setTextColor(28, 25, 23);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  items.forEach((it, idx) => {
    if (y > pageH - 50) { doc.addPage(); y = 20; }
    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 249);
      doc.rect(margin, y, pageW - margin * 2, 6, 'F');
    }
    const nombre = doc.splitTextToSize(it.nombre || '', 80);
    const cantidad = Number(it.cantidad) || 1;
    const dias = Number(it.dias) || 1;
    const precio = Number(it.precioManual ?? it.precioBase) || 0;
    const total = precio * cantidad * dias;
    doc.text(String(cantidad), margin + 3, y + 4);
    doc.text(nombre[0] || '', margin + 18, y + 4);
    doc.text(String(dias), margin + 105, y + 4);
    doc.text(money(precio), margin + 125, y + 4, { align: 'right' });
    doc.text(money(total), pageW - margin - 3, y + 4, { align: 'right' });
    y += 6;
  });

  // Total
  y += 2;
  doc.setDrawColor(28, 25, 23);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${money(calcTotal(evento))}`, pageW - margin - 3, y, { align: 'right' });
  y += 8;

  // Notas operativas
  if (remision.notasOperativas?.trim()) {
    if (y > pageH - 60) { doc.addPage(); y = 20; }
    doc.setFontSize(8);
    doc.setTextColor(120, 113, 108);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTAS OPERATIVAS', margin, y);
    y += 4;
    doc.setFontSize(9);
    doc.setTextColor(28, 25, 23);
    doc.setFont('helvetica', 'normal');
    const lineas = doc.splitTextToSize(remision.notasOperativas, pageW - margin * 2);
    lineas.forEach((l) => {
      if (y > pageH - 25) { doc.addPage(); y = 20; }
      doc.text(l, margin, y);
      y += 4.5;
    });
    y += 4;
  }

  // Otrosíes
  if ((remision.addendums || []).length > 0) {
    if (y > pageH - 50) { doc.addPage(); y = 20; }
    doc.setFontSize(8);
    doc.setTextColor(120, 113, 108);
    doc.setFont('helvetica', 'bold');
    doc.text('OTROSÍES', margin, y);
    y += 5;
    remision.addendums.forEach((a) => {
      if (y > pageH - 30) { doc.addPage(); y = 20; }
      doc.setFontSize(7.5);
      doc.setTextColor(120, 113, 108);
      doc.setFont('helvetica', 'italic');
      doc.text(`${a.creadoPorNombre || '—'} · ${fmtFechaLarga(a.creadoEn)}`, margin, y);
      y += 4;
      doc.setFontSize(9);
      doc.setTextColor(28, 25, 23);
      doc.setFont('helvetica', 'normal');
      const lineas = doc.splitTextToSize(a.texto, pageW - margin * 2);
      lineas.forEach((l) => {
        if (y > pageH - 20) { doc.addPage(); y = 20; }
        doc.text(l, margin, y);
        y += 4.5;
      });
      y += 4;
    });
  }

  // Footer firmas (en la última página)
  const yFirmas = Math.max(y + 10, pageH - 35);
  if (yFirmas + 20 > pageH) {
    doc.addPage();
    y = 20;
  } else {
    y = yFirmas;
  }
  doc.setDrawColor(120, 113, 108);
  doc.setLineWidth(0.3);
  doc.line(margin + 5, y, margin + 75, y);
  doc.line(pageW - margin - 75, y, pageW - margin - 5, y);
  doc.setFontSize(8);
  doc.setTextColor(120, 113, 108);
  doc.text('Firma quien recibe', margin + 40, y + 4, { align: 'center' });
  doc.text('Firma quien entrega', pageW - margin - 40, y + 4, { align: 'center' });

  // Nombre archivo
  const filename = `Remision-${numero}.pdf`;
  doc.save(filename);
}
