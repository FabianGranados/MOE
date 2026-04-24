import { createClient } from '@supabase/supabase-js';

// En producción (Vercel) las credenciales se leen de variables de entorno.
// Mientras tanto, para StackBlitz / demo, van acá como fallback.
// OJO: la "publishable key" (antes anon) es pública por diseño — la seguridad
// real vive en las policies RLS configuradas en la base de datos.
const FALLBACK_URL = 'https://galjspyrjymlybrltitc.supabase.co';
const FALLBACK_KEY = 'sb_publishable_CmGxcIjQ7vOS6rXQHhLUBg_kFwdPBdA';

const URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

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
  // eslint-disable-next-line no-console
  console.info(
    supabaseEnabled
      ? '%c[MOE] Supabase activo ✓ · ' + URL
      : '%c[MOE] Modo demo (localStorage).',
    supabaseEnabled ? 'color:#10b981;font-weight:bold' : 'color:#f59e0b'
  );
}
