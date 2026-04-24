import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(URL && KEY);

export const supabase = supabaseEnabled
  ? createClient(URL, KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'moe-supabase-auth'
      },
      db: { schema: 'public' }
    })
  : null;

if (typeof window !== 'undefined') {
  // Bandera visible en consola para saber en qué modo corre la app
  // eslint-disable-next-line no-console
  console.info(
    supabaseEnabled
      ? '%c[MOE] Supabase activo ✓'
      : '%c[MOE] Modo demo (localStorage). Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para activar backend real.',
    supabaseEnabled ? 'color:#10b981;font-weight:bold' : 'color:#f59e0b'
  );
}
