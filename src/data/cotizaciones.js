// =====================================================================
// MOE · Adapter Cotizaciones (Supabase ↔ "evento" denormalizado)
//
// La UI maneja un objeto "evento" gordo (con items[], pagos[], historial[])
// que es cómodo en React. Supabase lo guarda normalizado en 4 tablas.
// Este módulo es el puente: convierte de un lado al otro.
//
// Funciones públicas:
//   · fetchAll()                       → array de eventos (todos los visibles por RLS)
//   · upsertEvent(event)               → guarda un evento completo (o lo crea)
//   · deleteEvent(id)                  → borra (cascade limpia hijos)
//   · nextNumeroFromDb()               → siguiente '26xxxx' sin colisiones
// =====================================================================

import { supabase } from './supabase.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (v) => UUID_RE.test(String(v || ''));
const toUUID = (v) => (isUUID(v) ? v : (crypto?.randomUUID?.() || fallbackUUID()));

function fallbackUUID() {
  // Para entornos sin crypto.randomUUID (poco común). RFC4122 v4 simple.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ---------------------------------------------------------------------
// MAPEO · Row de Supabase → objeto "evento" que entiende la UI
// ---------------------------------------------------------------------
function rowToEvent(row, items = [], pagos = [], historial = []) {
  return {
    id: row.id,
    numeroEvento: row.numero,
    version: row.version,
    tipoDocumento: row.tipo_documento || 'COTIZACION',
    estado: row.estado || 'EN ESPERA',
    finalizado: !!row.finalizado,
    motivoPerdida: row.motivo_perdida || '',

    razonSocial: row.razon_social || '',
    tipoPersona: row.tipo_persona || 'JURIDICA',
    tipoDocId: row.tipo_doc_id || 'NIT',
    numeroDocId: row.numero_doc_id || '',
    tipoCliente: row.tipo_cliente || '',

    contactoNombre: row.contacto_nombre || '',
    contactoTelefono: row.contacto_telefono || '',
    contactoEmail: row.contacto_email || '',

    fechaEvento: row.fecha_evento || '',
    tipoEvento: row.tipo_evento || '',
    horarioEvento: row.horario_evento || { tipo: 'abierto', franja: 'tarde', hora: '' },

    direccion: row.direccion || '',
    ciudad: row.ciudad || '',
    mapsUrl: row.maps_url || '',

    montaje: row.montaje || { fecha: '', tipo: 'abierto', franja: 'manana', hora: '' },
    desmontaje: row.desmontaje || { fecha: '', tipo: 'abierto', franja: 'tarde', hora: '' },
    personasMontaje: row.personas_montaje || [{ nombre: '', celular: '' }, { nombre: '', celular: '' }],
    personasDesmontaje: row.personas_desmontaje || [{ nombre: '', celular: '' }, { nombre: '', celular: '' }],
    notasOperativas: row.notas_operativas || '',
    horariosConfirmados: !!row.horarios_confirmados,

    llevaProveedorExterno: !!row.lleva_proveedor_externo,
    proveedorExternoNotas: row.proveedor_externo_notas || '',

    formaPago: row.forma_pago || 'CONTADO',

    comercial: row.comercial_alias || '',
    createdBy: row.comercial_id || null,
    comentarios: row.comentarios || '',

    fechaCreacion: row.fecha_creacion,
    fechaConfirmacionVenta: row.fecha_confirmacion_venta,

    items: (items || []).map((it) => ({
      id: it.id,
      productoId: it.producto_id,
      codigo: it.codigo || '',
      nombre: it.nombre,
      categoria: it.categoria || '',
      foto: it.foto_url || '',
      cantidad: it.cantidad || 1,
      dias: it.dias || 1,
      precioBase: Number(it.precio_base) || 0,
      precioManual: it.precio_manual === null ? null : Number(it.precio_manual)
    })),

    pagos: (pagos || []).map((p) => ({
      id: p.id,
      tipoPago: p.tipo_pago,
      monto: Number(p.monto) || 0,
      fecha: p.fecha,
      metodo: p.metodo,
      banco: p.banco,
      referencia: p.referencia || '',
      notas: p.notas || '',
      foto: p.foto_url || '',
      validado: !!p.validado,
      fechaValidacion: p.validado_en
    })),

    historial: (historial || []).map((h) => ({
      id: h.id,
      campo: h.campo,
      label: h.label || '',
      anterior: h.anterior || '',
      nuevo: h.nuevo || '',
      usuarioId: h.usuario_id,
      usuarioNombre: h.usuario_nombre || '',
      fecha: h.ts
    }))
  };
}

// ---------------------------------------------------------------------
// MAPEO · "evento" → row de cotizaciones (sin items/pagos/historial)
// ---------------------------------------------------------------------
function eventToRow(ev) {
  return {
    id: toUUID(ev.id),
    numero: ev.numeroEvento,
    version: ev.version || 1,
    tipo_documento: ev.tipoDocumento || 'COTIZACION',
    estado: ev.estado || 'EN ESPERA',
    finalizado: !!ev.finalizado,
    motivo_perdida: ev.motivoPerdida || null,
    razon_social: ev.razonSocial || null,
    tipo_persona: ev.tipoPersona || 'JURIDICA',
    tipo_doc_id: ev.tipoDocId || 'NIT',
    numero_doc_id: ev.numeroDocId || null,
    tipo_cliente: ev.tipoCliente || null,
    contacto_nombre: ev.contactoNombre || null,
    contacto_telefono: ev.contactoTelefono || null,
    contacto_email: ev.contactoEmail || null,
    fecha_evento: ev.fechaEvento || null,
    tipo_evento: ev.tipoEvento || null,
    horario_evento: ev.horarioEvento || null,
    direccion: ev.direccion || null,
    ciudad: ev.ciudad || null,
    maps_url: ev.mapsUrl || null,
    montaje: ev.montaje || null,
    desmontaje: ev.desmontaje || null,
    personas_montaje: ev.personasMontaje || null,
    personas_desmontaje: ev.personasDesmontaje || null,
    notas_operativas: ev.notasOperativas || null,
    horarios_confirmados: !!ev.horariosConfirmados,
    lleva_proveedor_externo: !!ev.llevaProveedorExterno,
    proveedor_externo_notas: ev.proveedorExternoNotas || null,
    forma_pago: ev.formaPago || 'CONTADO',
    comercial_alias: ev.comercial || null,
    comercial_id: ev.createdBy && isUUID(ev.createdBy) ? ev.createdBy : null,
    comentarios: ev.comentarios || null,
    fecha_creacion: ev.fechaCreacion || undefined
  };
}

// ---------------------------------------------------------------------
// FETCH · trae todo lo visible por RLS, en una sola pasada con joins
// ---------------------------------------------------------------------
export async function fetchAll() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('cotizaciones')
    .select(`
      *,
      cotizacion_items (*),
      pagos (*),
      cotizacion_historial (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[cotizaciones.fetchAll] error:', error.message);
    return [];
  }

  return (data || []).map((r) =>
    rowToEvent(
      r,
      (r.cotizacion_items || []).slice().sort((a, b) => (a.orden || 0) - (b.orden || 0)),
      (r.pagos || []).slice().sort((a, b) => (a.fecha < b.fecha ? -1 : 1)),
      (r.cotizacion_historial || []).slice().sort((a, b) => (a.ts < b.ts ? -1 : 1))
    )
  );
}

// ---------------------------------------------------------------------
// UPSERT · guarda un evento completo
//   1. upsert en cotizaciones (UUID estable)
//   2. reemplaza items: delete + insert
//   3. inserta pagos nuevos (los existentes ya están)
//   4. inserta entradas de historial nuevas
// ---------------------------------------------------------------------
export async function upsertEvent(ev) {
  if (!supabase) return null;

  const row = eventToRow(ev);
  const cotizacionId = row.id;

  // 1) Cotización principal
  const { error: e1 } = await supabase
    .from('cotizaciones')
    .upsert(row, { onConflict: 'id' });
  if (e1) {
    console.warn('[cotizaciones.upsert] cotizaciones:', e1.message);
    return null;
  }

  // 2) Items: estrategia simple — borrar todos y re-insertar
  await supabase.from('cotizacion_items').delete().eq('cotizacion_id', cotizacionId);
  if (Array.isArray(ev.items) && ev.items.length > 0) {
    const itemRows = ev.items.map((it, idx) => ({
      id: toUUID(it.id),
      cotizacion_id: cotizacionId,
      producto_id: it.productoId && isUUID(it.productoId) ? it.productoId : null,
      codigo: it.codigo || null,
      nombre: it.nombre,
      categoria: it.categoria || null,
      foto_url: it.foto || null,
      cantidad: it.cantidad || 1,
      dias: it.dias || 1,
      precio_base: it.precioBase || 0,
      precio_manual: it.precioManual === null || it.precioManual === undefined ? null : it.precioManual,
      orden: idx
    }));
    const { error: e2 } = await supabase.from('cotizacion_items').insert(itemRows);
    if (e2) console.warn('[cotizaciones.upsert] items:', e2.message);
  }

  // 3) Pagos: solo agregar los nuevos (no rompemos los validados)
  if (Array.isArray(ev.pagos) && ev.pagos.length > 0) {
    const { data: existentes } = await supabase
      .from('pagos')
      .select('id')
      .eq('cotizacion_id', cotizacionId);
    const existentesSet = new Set((existentes || []).map((p) => p.id));
    const nuevos = ev.pagos.filter((p) => !existentesSet.has(p.id));
    if (nuevos.length > 0) {
      const pagoRows = nuevos.map((p) => ({
        id: toUUID(p.id),
        cotizacion_id: cotizacionId,
        tipo_pago: p.tipoPago || null,
        monto: p.monto || 0,
        fecha: p.fecha,
        metodo: p.metodo || null,
        banco: p.banco || null,
        referencia: p.referencia || null,
        notas: p.notas || null,
        foto_url: p.foto || null,
        validado: !!p.validado,
        validado_en: p.fechaValidacion || null
      }));
      const { error: e3 } = await supabase.from('pagos').insert(pagoRows);
      if (e3) console.warn('[cotizaciones.upsert] pagos:', e3.message);
    }
  }

  // 4) Historial: solo nuevos
  if (Array.isArray(ev.historial) && ev.historial.length > 0) {
    const { data: existentesH } = await supabase
      .from('cotizacion_historial')
      .select('id')
      .eq('cotizacion_id', cotizacionId);
    const existentesIds = new Set((existentesH || []).map((h) => Number(h.id)));
    const nuevos = ev.historial.filter((h) => {
      const idNum = Number(h.id);
      return !Number.isFinite(idNum) || !existentesIds.has(idNum);
    });
    if (nuevos.length > 0) {
      const histRows = nuevos.map((h) => ({
        cotizacion_id: cotizacionId,
        campo: h.campo,
        label: h.label || null,
        anterior: h.anterior == null ? null : String(h.anterior),
        nuevo: h.nuevo == null ? null : String(h.nuevo),
        usuario_id: h.usuarioId && isUUID(h.usuarioId) ? h.usuarioId : null,
        usuario_nombre: h.usuarioNombre || null,
        ts: h.fecha || new Date().toISOString()
      }));
      const { error: e4 } = await supabase.from('cotizacion_historial').insert(histRows);
      if (e4) console.warn('[cotizaciones.upsert] historial:', e4.message);
    }
  }

  return cotizacionId;
}

// ---------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------
export async function deleteEvent(id) {
  if (!supabase || !isUUID(id)) return false;
  const { error } = await supabase.from('cotizaciones').delete().eq('id', id);
  if (error) {
    console.warn('[cotizaciones.delete]', error.message);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------
// NUMERACIÓN · '26xxxx' único por año
// Lee el max(numero) del año actual, le suma 1.
// Si no hay nada, arranca en YY0001.
// ---------------------------------------------------------------------
export async function nextNumeroFromDb() {
  if (!supabase) return null;
  const yy = String(new Date().getFullYear()).slice(-2);
  const prefix = yy;
  const { data, error } = await supabase
    .from('cotizaciones')
    .select('numero')
    .like('numero', `${prefix}%`)
    .order('numero', { ascending: false })
    .limit(1);
  if (error) {
    console.warn('[cotizaciones.nextNumero]', error.message);
    return `${yy}0001`;
  }
  const last = data?.[0]?.numero;
  if (!last) return `${yy}0001`;
  const seq = parseInt(last.slice(2), 10) || 0;
  return `${yy}${String(seq + 1).padStart(4, '0')}`;
}

// Helpers exportados (por si los necesita la UI o tests)
export { isUUID, toUUID };
