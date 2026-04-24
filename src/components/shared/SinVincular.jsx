import { AlertCircle, LogOut } from 'lucide-react';

export function SinVincular({ email, onLogout }) {
  return (
    <div className="min-h-screen bg-surface-sunken flex items-center justify-center p-4">
      <div className="max-w-md w-full card p-6 text-center border-amber-300 dark:border-amber-500/40">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-lg font-bold text-fg">Tu cuenta no está vinculada a un rol</h2>
        <p className="text-sm text-fg-muted mt-2 mb-4">
          El email <strong className="text-fg">{email}</strong> existe en el sistema pero no está asociado
          a un perfil de Decolounge. Contacta a Gerencia para que asignen tu rol.
        </p>
        <button onClick={onLogout} className="btn-dark mx-auto">
          <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}
