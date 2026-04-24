import { LogOut, Moon, Sun } from 'lucide-react';
import { Avatar } from '../shared/Avatar.jsx';
import { ROLES } from '../../constants.js';

export function Sidebar({ menu, section, onNavigate, currentUser, onLogout, theme, onToggleTheme, mobileOpen, onCloseMobile }) {
  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-screen w-[240px] bg-stone-950 text-stone-300 flex flex-col z-40 transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center border-b border-stone-800/60 px-5 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center font-extrabold text-sm mr-2.5 shadow-lg shadow-rose-600/20">
            D
          </div>
          <div>
            <div className="text-sm font-semibold text-white tracking-tight">Decolounge</div>
            <div className="text-[9px] text-stone-500 uppercase tracking-[0.15em]">MOE · v1.0</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {menu.map((m) => {
            const Icon = m.icon;
            const active = section === m.key;
            return (
              <button
                key={m.key}
                onClick={() => {
                  onNavigate(m.key);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition group ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'hover:bg-white/5 text-stone-400 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-stone-500 group-hover:text-stone-300'}`} />
                <span className="flex-1 text-left">{m.label}</span>
                {active && <span className="w-1 h-4 rounded-full bg-rose-500" />}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-stone-800/60 p-3 flex-shrink-0 space-y-1">
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-stone-400 hover:bg-white/5 hover:text-white transition"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </button>
          <div className="flex items-center gap-2.5 p-2">
            <Avatar
              name={currentUser.nombre || currentUser.email || 'Usuario'}
              size="sm"
              color={(ROLES[currentUser.rol] || {}).accent || 'bg-stone-500'}
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{currentUser.nombre || currentUser.email}</div>
              <div className="text-[10px] text-stone-500 truncate">{(ROLES[currentUser.rol] || {}).short || 'Sin rol asignado'}</div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 hover:bg-white/10 rounded-md text-stone-400 hover:text-white transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-30 md:hidden"
          onClick={onCloseMobile}
        />
      )}
    </>
  );
}
