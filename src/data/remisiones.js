// =====================================================================
// MOE · Adapter Remisiones de Logística (Supabase ↔ objeto "remisión")
//
// Una "remisión" es el documento operativo que el comercial llena cuando
// vende un evento, fiel a la cotización pero con personas que reciben /
// entregan + notas operativas. Bodega y logística la ven en tiempo real
// apenas se finaliza.
//
// Schema en Supabase:
//   public.remisiones          → fila por (cotizacion_id, cotizacion_version)
//   public.remision_addendum   → otrosíes anexados después de finalizar
//
// Funciones públicas:
//   · fetchAll()                              → array de remisiones visibles por RLS
//   · fetchByCotizacion(cotizacionId, ver)    → 1 remisión específica (o null)
//   · upsertRemision(rem)                     → guarda (no permitido si finalizada)
//   · finalizeRemision(rem)                   → marca finalizada + asigna correlativo
//   · addAddendum(remisionId, texto, user)    → anexa otrosí (siempre permitido)
// =====================================================================

import { supabase } from './supabase.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (v) => UUID_RE.test(String(v || ''));

function genUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ---------------------------------------------------------------------
// MAPEO · row de Supabase → objeto "remisión" que entiende la UI
// ---------------------------------------------------------------------
function rowToRemision(row, addendums = []) {
  return {
    id: row.id,
    numero: row.numero || '',
    cotizacionId: row.cotizacion_id,
    cotizacionVersion: row.cotizacion_version || 1,
    personasMontaje: row.personas_montaje || [],
    personasDesmontaje: row.personas_desmontaje || [],
    notasOperativas: row.notas_operativas || '',
    finalizada: !!row.finalizada,
    fechaFinalizacion: row.fecha_finalizacion,
    creadoPor: row.creado_por,
    fechaCreacion: row.created_at,
    addendums: (addendums || [])
      .slice()
      .sort((a, b) => (a.creado_en < b.creado_en ? -1 : 1))
      .map((a) => ({
        id: a.id,
        texto: a.texto,
        creadoPor: a.creado_por,
        creadoPorNombre: a.creado_por_nombre || '',
        creadoEn: a.creado_en
      }))
  };
}

// ---------------------------------------------------------------------
// FETCH ALL — todas las remisiones visibles por RLS, con sus addendums
// ---------------------------------------------------------------------
export async function fetchAll() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('remisiones')
    .select(`
      id, numero, cotizacion_id, cotizacion_version,
      personas_montaje, personas_desmontaje, notas_operativas,
      finalizada, fecha_finalizacion, creado_por, created_at,
      remision_addendum (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[remisiones.fetchAll]', error.message);
    return [];
  }

  return (data || []).map((r) => rowToRemision(r, r.remision_addendum || []));
}

// ---------------------------------------------------------------------
// FETCH BY COTIZACIÓN — la remisión específica de una cotización-versión
// ---------------------------------------------------------------------
export async function fetchByCotizacion(cotizacionId, version = 1) {
  if (!supabase || !isUUID(cotizacionId)) return null;

  const { data, error } = await supabase
    .from('remisiones')
    .select(`
      id, numero, cotizacion_id, cotizacion_version,
      personas_montaje, personas_desmontaje, notas_operativas,
      finalizada, fecha_finalizacion, creado_por, created_at,
      remision_addendum (*)
    `)
    .eq('cotizacion_id', cotizacionId)
    .eq('cotizacion_version', version)
    .maybeSingle();

  if (error) {
    console.warn('[remisiones.fetchByCotizacion]', error.message);
    return null;
  }
  if (!data) return null;
  return rowToRemision(data, data.remision_addendum || []);
}

// ---------------------------------------------------------------------
// UPSERT — guarda la remisión. Prohibido si ya está finalizada (RLS lo
// rechaza pero validamos antes para dar feedback claro).
// Devuelve { ok, data, error } para que la UI pueda mostrar el motivo.
// ---------------------------------------------------------------------
export async function upsertRemision(rem) {
  if (!supabase) return { ok: false, error: 'Supabase no está activo' };
  if (rem.finalizada) {
    return { ok: false, error: 'No se puede editar una remisión finalizada' };
  }

  const row = {
    id: rem.id && isUUID(rem.id) ? rem.id : genUUID(),
    cotizacion_id: rem.cotizacionId,
    cotizacion_version: rem.cotizacionVersion || 1,
    personas_montaje: rem.personasMontaje || [],
    personas_desmontaje: rem.personasDesmontaje || [],
    notas_operativas: rem.notasOperativas || null,
    creado_por: rem.creadoPor && isUUID(rem.creadoPor) ? rem.creadoPor : null,
    finalizada: false
  };

  const { data, error } = await supabase
    .from('remisiones')
    .upsert(row, { onConflict: 'cotizacion_id,cotizacion_version' })
    .select()
    .single();

  if (error) {
    console.error('[remisiones.upsert] error completo:', error);
    console.error('  → row enviado:', row);
    return { ok: false, error: error.message, code: error.code, details: error.details, hint: error.hint };
  }
  return { ok: true, data: rowToRemision(data, []) };
}

// ---------------------------------------------------------------------
// FINALIZE — marca finalizada=true + asigna correlativo + timestamp
// El correlativo lo armamos como "<numeroEvento>-R-<version>"
// ---------------------------------------------------------------------
export async function finalizeRemision(rem, cotizacion) {
  if (!supabase || !isUUID(rem.id)) {
    return { ok: false, error: 'Falta id de la remisión' };
  }

  const correlativo = cotizacion?.numeroEvento
    ? `${cotizacion.numeroEvento}-R-${rem.cotizacionVersion || 1}`
    : null;

  const { data, error } = await supabase
    .from('remisiones')
    .update({
      finalizada: true,
      fecha_finalizacion: new Date().toISOString(),
      numero: correlativo
    })
    .eq('id', rem.id)
    .select()
    .single();

  if (error) {
    console.error('[remisiones.finalize] error completo:', error);
    return { ok: false, error: error.message, code: error.code, details: error.details, hint: error.hint };
  }
  return { ok: true, data: rowToRemision(data, []) };
}

// ---------------------------------------------------------------------
// ADD ADDENDUM — anexa un otrosí. Permitido aún cuando la remisión está
// finalizada (es la única forma de agregarle información después).
// ---------------------------------------------------------------------
export async function addAddendum(remisionId, texto, currentUser) {
  if (!supabase || !isUUID(remisionId) || !texto?.trim()) return null;

  const { data, error } = await supabase
    .from('remision_addendum')
    .insert({
      remision_id: remisionId,
      texto: texto.trim(),
      creado_por: currentUser?.id && isUUID(currentUser.id) ? currentUser.id : null,
      creado_por_nombre: currentUser?.nombre || null
    })
    .select()
    .single();

  if (error) {
    console.warn('[remisiones.addAddendum]', error.message);
    return null;
  }
  return {
    id: data.id,
    texto: data.texto,
    creadoPor: data.creado_por,
    creadoPorNombre: data.creado_por_nombre || '',
    creadoEn: data.creado_en
  };
}

export { isUUID };
