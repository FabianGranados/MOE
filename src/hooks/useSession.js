import { useCallback, useEffect, useState } from 'react';
import { loadJSON, saveJSON, storage } from '../data/storage.js';
import { supabase, supabaseEnabled } from '../data/supabase.js';
import { audit } from '../data/audit.js';
import { USUARIOS } from '../constants.js';

/**
 * Hook de sesión.
 * - Si Supabase está activo: usa supabase.auth (fuente de verdad).
 * - Si no: cae al flujo demo en localStorage.
 *
 * El currentUser expuesto tiene la forma:
 *   { id, email, nombre, alias, rol }
 */
export function useSession() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // --------- Modo Supabase ----------------------------------------------
  const loadSupabaseUser = useCallback(async (authUser) => {
    if (!authUser) return null;
    const { data, error } = await supabase
      .from('usuarios')
      .select('id,email,nombre,alias,role_id,activo')
      .eq('id', authUser.id)
      .maybeSingle();
    if (error) {
      console.error('[useSession] ERROR leyendo public.usuarios:', error);
      console.error('  → auth.uid():', authUser.id);
      console.error('  → email:', authUser.email);
      console.error('  → code:', error.code, '· details:', error.details, '· hint:', error.hint);
    }
    if (!data) {
      console.warn('[useSession] Usuario sin fila en public.usuarios');
      console.warn('  → auth.uid():', authUser.id);
      console.warn('  → email:', authUser.email);
      console.warn('  Fix: insertar fila en public.usuarios con ese id y role_id.');
    }
    if (error || !data) {
      return {
        id: authUser.id,
        email: authUser.email,
        nombre: authUser.email,
        alias: null,
        rol: null,
        sinVincular: true
      };
    }
    if (data.activo === false) {
      console.warn('[useSession] usuario inactivo');
      await supabase.auth.signOut();
      return null;
    }
    return {
      id: data.id,
      email: data.email,
      nombre: data.nombre,
      alias: data.alias,
      rol: data.role_id
    };
  }, []);

  useEffect(() => {
    if (supabaseEnabled) {
      let mounted = true;
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!mounted) return;
          const u = await loadSupabaseUser(session?.user);
          if (mounted) setCurrentUser(u);
        } catch (e) {
          console.warn('[useSession] getSession falló:', e);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
      const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
        try {
          const u = await loadSupabaseUser(session?.user);
          setCurrentUser(u);
        } catch (e) {
          console.warn('[useSession] onAuthStateChange:', e);
        }
      });
      return () => { mounted = false; sub?.subscription?.unsubscribe(); };
    }
    // Modo demo: lee de localStorage
    (async () => {
      try {
        const s = await loadJSON('session', null);
        if (s) {
          const u = USUARIOS.find((x) => x.id === s.userId);
          if (u) setCurrentUser({ id: u.id, email: u.email, nombre: u.nombre, alias: u.alias, rol: u.rol });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [loadSupabaseUser]);

  // --------- Login ------------------------------------------------------
  const login = useCallback(async (email, password) => {
    if (supabaseEnabled) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password.trim()
      });
      if (error) return { ok: false, error: 'Email o contraseña incorrectos' };
      const u = await loadSupabaseUser(data.user);
      if (!u) return { ok: false, error: 'Usuario inactivo o no vinculado' };
      if (u.sinVincular) {
        await supabase.auth.signOut();
        return { ok: false, error: 'Tu cuenta existe pero no está vinculada a un rol. Contacta a Gerencia.' };
      }
      setCurrentUser(u);
      audit({ modulo: 'auth', accion: 'login', entidadTipo: 'usuario', entidadId: u.id }, u);
      return { ok: true, user: u };
    }
    // Modo demo
    const u = USUARIOS.find(
      (x) =>
        x.email.toLowerCase() === email.toLowerCase().trim() &&
        x.password === password.trim()
    );
    if (!u) return { ok: false, error: 'Email o contraseña incorrectos' };
    const user = { id: u.id, email: u.email, nombre: u.nombre, alias: u.alias, rol: u.rol };
    setCurrentUser(user);
    await saveJSON('session', { userId: u.id });
    audit({ modulo: 'auth', accion: 'login', entidadTipo: 'usuario', entidadId: u.id }, user);
    return { ok: true, user };
  }, [loadSupabaseUser]);

  const logout = useCallback(async () => {
    // Limpiar UI primero — si signOut o audit fallan, el usuario igual sale.
    setCurrentUser(null);
    try {
      if (currentUser) {
        audit({ modulo: 'auth', accion: 'logout', entidadTipo: 'usuario', entidadId: currentUser.id }, currentUser);
      }
      if (supabaseEnabled) {
        await supabase.auth.signOut();
      } else {
        await storage.delete('session');
      }
    } catch (e) {
      console.warn('[useSession] logout error (sesión local ya cerrada):', e);
    }
  }, [currentUser]);

  return { loading, currentUser, login, logout, session: currentUser };
}
