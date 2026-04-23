import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const Ctx = createContext({
  setDirty: () => {},
  confirmLeave: () => true
});

export function DirtyGuardProvider({ children }) {
  const dirtyRef = useRef(false);
  const [, setTick] = useState(0);

  const setDirty = useCallback((v) => {
    dirtyRef.current = v;
    setTick((t) => t + 1);
  }, []);

  const confirmLeave = useCallback((msg = 'Tienes cambios sin guardar. ¿Salir de todas formas?') => {
    if (!dirtyRef.current) return true;
    const ok = window.confirm(msg);
    if (ok) dirtyRef.current = false;
    return ok;
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  return <Ctx.Provider value={{ setDirty, confirmLeave }}>{children}</Ctx.Provider>;
}

export function useDirtyGuard() {
  return useContext(Ctx);
}
