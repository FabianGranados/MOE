import { useCallback, useEffect, useRef, useState } from 'react';
import { loadJSON, saveJSON } from '../data/storage.js';
import { supabaseEnabled } from '../data/supabase.js';
import { fetchAll, upsertEvent, deleteEvent } from '../data/cotizaciones.js';

/**
 * Reemplazo drop-in de usePersistedState('events', []) para cotizaciones.
 *
 * Mantiene la misma firma → [events, persistEvents, hydrated] — para que
 * MOEApp no se entere de si está hablando con localStorage o con la nube.
 *
 * Modo Supabase:
 *   · En el mount: fetchAll() trae todo lo visible por RLS.
 *   · persistEvents(next) compara contra el snapshot anterior y aplica
 *     diff: borra los desaparecidos, upsertea los nuevos o cambiados.
 *
 * Modo demo (sin Supabase):
 *   · Igual que usePersistedState: lee/escribe en localStorage.
 */
export function useCotizaciones() {
  const [value, setValue] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const prevRef = useRef([]);

  // ----- carga inicial ------------------------------------------------
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (supabaseEnabled) {
        const events = await fetchAll();
        if (!mounted) return;
        setValue(events);
        prevRef.current = events;
        setHydrated(true);
      } else {
        const v = await loadJSON('events', []);
        if (!mounted) return;
        setValue(v);
        prevRef.current = v;
        setHydrated(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ----- persist ------------------------------------------------------
  const persist = useCallback(async (next) => {
    setValue(next);

    if (!supabaseEnabled) {
      await saveJSON('events', next);
      prevRef.current = next;
      return;
    }

    // Supabase: diff contra prev y aplicar
    const prevList = prevRef.current || [];
    const nextById = new Map(next.map((e) => [e.id, e]));

    // 1) Deletes: estaban antes y ya no están
    const toDelete = prevList.filter((e) => !nextById.has(e.id));

    // 2) Upserts: nuevos o cambiados (por referencia)
    const prevById = new Map(prevList.map((e) => [e.id, e]));
    const toUpsert = next.filter((e) => prevById.get(e.id) !== e);

    // Aplicar en paralelo (operaciones independientes)
    await Promise.all([
      ...toDelete.map((e) => deleteEvent(e.id)),
      ...toUpsert.map((e) => upsertEvent(e))
    ]);

    prevRef.current = next;
  }, []);

  return [value, persist, hydrated];
}
