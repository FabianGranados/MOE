import { supabase, supabaseEnabled } from './supabase.js';

const LOCAL_KEY = 'moe-audit-log';
const MAX_LOCAL = 500; // no crece sin fin en demo

/**
 * Registra una acción en el log de auditoría.
 * Cuando Supabase está activo, se escribe en la tabla audit_log (con RLS).
 * En modo demo, queda en localStorage (últimos MAX_LOCAL eventos).
 *
 * @param {Object} entry
 * @param {string} entry.modulo      - 'cotizaciones' | 'pagos' | 'auth' | ...
 * @param {string} entry.accion      - 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'validate' | 'login' | 'view'
 * @param {string} [entry.entidadTipo]
 * @param {string} [entry.entidadId]
 * @param {Object} [entry.antes]
 * @param {Object} [entry.despues]
 * @param {string} [entry.observaciones]
 * @param {string} [entry.soporteUrl]
 * @param {Object} [currentUser] - usuario actual (si no viene, se lee de Supabase)
 */
export async function audit(entry, currentUser = null) {
  const record = {
    ts: new Date().toISOString(),
    usuario_id: currentUser?.id || null,
    usuario_nombre: currentUser?.nombre || null,
    modulo: entry.modulo,
    accion: entry.accion,
    entidad_tipo: entry.entidadTipo || null,
    entidad_id: entry.entidadId ? String(entry.entidadId) : null,
    antes: entry.antes || null,
    despues: entry.despues || null,
    observaciones: entry.observaciones || null,
    soporte_url: entry.soporteUrl || null,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
  };

  if (supabaseEnabled && supabase) {
    try {
      const { error } = await supabase.from('audit_log').insert(record);
      if (error) console.warn('[audit] Supabase insert error:', error.message);
    } catch (e) {
      console.warn('[audit] exception:', e);
    }
    return;
  }

  // Modo demo: localStorage
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(record);
    if (list.length > MAX_LOCAL) list.length = MAX_LOCAL;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch {}
}

/** Lee los últimos eventos del audit log (útil para Gerencia/Contador Externo). */
export async function readAudit({ limit = 100, entidadTipo, entidadId } = {}) {
  if (supabaseEnabled && supabase) {
    let q = supabase.from('audit_log').select('*').order('ts', { ascending: false }).limit(limit);
    if (entidadTipo) q = q.eq('entidad_tipo', entidadTipo);
    if (entidadId) q = q.eq('entidad_id', String(entidadId));
    const { data, error } = await q;
    if (error) { console.warn('[audit] read error:', error.message); return []; }
    return data || [];
  }
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    let list = raw ? JSON.parse(raw) : [];
    if (entidadTipo) list = list.filter((e) => e.entidad_tipo === entidadTipo);
    if (entidadId) list = list.filter((e) => e.entidad_id === String(entidadId));
    return list.slice(0, limit);
  } catch {
    return [];
  }
}
