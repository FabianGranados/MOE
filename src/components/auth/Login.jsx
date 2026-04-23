import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronRight, Eye, EyeOff, KeyRound, Loader2, Mail, Sparkles } from 'lucide-react';
import { Avatar } from '../shared/Avatar.jsx';

const DEMOS = [
  { rol: 'Gerencia',        email: 'admin@decolounge.co',   pass: 'demo1234', color: 'bg-stone-900' },
  { rol: 'Coord. Comercial', email: 'johanna@decolounge.co', pass: 'demo1234', color: 'bg-rose-600' },
  { rol: 'Asesor Comercial', email: 'ammy@decolounge.co',    pass: 'demo1234', color: 'bg-pink-500' }
];

export function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError('');
    const res = await onLogin(email, password);
    if (!res.ok) setError(res.error || 'Error al iniciar sesión');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-surface-sunken via-surface to-surface-sunken relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-fg to-stone-950 text-surface items-center justify-center font-extrabold text-2xl shadow-pop mb-4">
            D
          </div>
          <h1 className="text-2xl font-bold tracking-tight">MOE · Decolounge</h1>
          <p className="text-sm text-fg-muted mt-1">Master Operativo de Eventos</p>
        </div>

        <div className="card p-7 shadow-elev">
          <h2 className="text-lg font-semibold">Bienvenido</h2>
          <p className="text-xs text-fg-muted mb-5">Ingresa con tu correo corporativo</p>

          <div className="space-y-3">
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="tu@decolounge.co"
                className="input pl-10"
              />
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
              <input
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••"
                className="input pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg"
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-3 text-xs text-red-800 dark:text-red-300"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !email || !password}
              className="btn-dark w-full py-2.5 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>Iniciar sesión <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>

        <div className="mt-5 card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-semibold text-fg-muted">Acceso rápido (demo)</span>
          </div>
          <div className="p-2">
            {DEMOS.map((u) => (
              <button
                key={u.email}
                onClick={() => {
                  setEmail(u.email);
                  setPassword(u.pass);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-sunken text-left transition"
              >
                <Avatar name={u.rol} size="sm" color={u.color} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-fg">{u.rol}</div>
                  <div className="text-[10px] text-fg-subtle font-mono">{u.email}</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-fg-subtle" />
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mt-5 text-[10px] text-fg-subtle">
          v1.0 · Protegido por Decolounge
        </div>
      </motion.div>
    </div>
  );
}
