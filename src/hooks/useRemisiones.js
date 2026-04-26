import { useCallback, useEffect, useState } from 'react';
import { supabaseEnabled } from '../data/supabase.js';
import {
  fetchAll, upsertRemision, finalizeRemision, addAddendum
} from '../data/remisiones.js';

/**
 * Hook para gestionar la colección de remisiones del usuario actual.
 *
 * En modo Supabase: lee con RLS (asesor sólo ve las suyas, bodega/log
 * sólo finalizadas, gerencia ve todo). En modo demo no aplica — la
 * remisión depende de la nube y de la cotización en la nube, así que
 * en demo simplemente no carga (devuelve []).
 *
 * Devuelve:
 *   { remisiones, hydrated, refresh, save, finalize, addNote }
 */
export function useRemisiones() {
  const [remisiones, setRemisiones] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    if (!supabaseEnabled) {
      setHydrated(true);
      return;
    }
    try {
      const list = await fetchAll();
      setRemisiones(list);
    } catch (e) {
      console.warn('[useRemisiones] refresh falló:', e);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Crea o actualiza la remisión (sólo si no está finalizada).
  // Después del upsert refrescamos del server para reflejar lo que RLS permitió.
  const save = useCallback(async (rem) => {
    const saved = await upsertRemision(rem);
    if (saved) await refresh();
    return saved;
  }, [refresh]);

  // Finaliza la remisión: marca finalizada=true, llena fecha y correlativo.
  const finalize = useCallback(async (rem, cotizacion) => {
    const saved = await finalizeRemision(rem, cotizacion);
    if (saved) await refresh();
    return saved;
  }, [refresh]);

  // Anexa un otrosí. La UI debe refrescar para mostrarlo en la lista.
  const addNote = useCallback(async (remisionId, texto, currentUser) => {
    const note = await addAddendum(remisionId, texto, currentUser);
    if (note) await refresh();
    return note;
  }, [refresh]);

  return { remisiones, hydrated, refresh, save, finalize, addNote };
}
