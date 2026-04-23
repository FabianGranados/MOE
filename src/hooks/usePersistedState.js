import { useCallback, useEffect, useState } from 'react';
import { loadJSON, saveJSON } from '../data/storage.js';

export function usePersistedState(key, initial) {
  const [value, setValue] = useState(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const v = await loadJSON(key, initial);
      if (mounted) {
        setValue(v);
        setHydrated(true);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const persist = useCallback(
    async (next) => {
      setValue(next);
      await saveJSON(key, next);
    },
    [key]
  );

  return [value, persist, hydrated];
}
