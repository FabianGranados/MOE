import { useCallback, useEffect, useState } from 'react';
import { loadJSON, saveJSON, storage } from '../data/storage.js';
import { USUARIOS } from '../constants.js';

export function useSession() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    (async () => {
      const s = await loadJSON('session', null);
      if (s) setSession(s);
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const u = USUARIOS.find(
      (x) =>
        x.email.toLowerCase() === email.toLowerCase().trim() &&
        x.password === password.trim()
    );
    if (!u) return { ok: false, error: 'Email o contraseña incorrectos' };
    const s = { userId: u.id };
    setSession(s);
    await saveJSON('session', s);
    return { ok: true, user: u };
  }, []);

  const logout = useCallback(async () => {
    setSession(null);
    await storage.delete('session');
  }, []);

  const currentUser = session ? USUARIOS.find((u) => u.id === session.userId) : null;

  return { loading, session, currentUser, login, logout };
}
