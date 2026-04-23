import { LogOut, Menu, Moon, Search, Sun } from 'lucide-react';
import { ROLES } from '../../constants.js';

export function Topbar({ currentUser, onLogout, onOpenMenu, onOpenSearch, theme, onToggleTheme }) {
  const firstName = currentUser.nombre.split(' ')[0];
  return (
    <header className="sticky top-0 z-20 h-16 bg-surface/80 backdrop-blur-xl border-b border-border px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMenu}
          className="md:hidden btn-icon"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5 text-fg" />
        </button>
        <div className="min-w-0">
          <div className="text-[11px] text-fg-muted">Hola,</div>
          <div className="text-sm font-semibold text-fg tracking-tight truncate">
            {firstName} <span className="inline-block">👋</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border border-border bg-surface-sunken hover:border-border-strong hover:bg-surface text-fg-muted text-[11px] font-medium transition"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Buscar...</span>
          <span className="kbd">⌘K</span>
        </button>

        <button
          onClick={onToggleTheme}
          className="btn-icon hidden sm:inline-flex"
          aria-label="Cambiar tema"
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface-sunken">
          <div className={`w-2 h-2 rounded-full ${ROLES[currentUser.rol].accent}`} />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            {ROLES[currentUser.rol].short}
          </span>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10 dark:hover:border-red-500/30 dark:hover:text-red-400 text-fg-muted text-[11px] font-semibold transition"
          title="Cerrar sesión"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
