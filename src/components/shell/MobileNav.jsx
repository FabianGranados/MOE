export function MobileNav({ menu, section, onNavigate }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="flex items-center justify-around">
        {menu.slice(0, 5).map((m) => {
          const Icon = m.icon;
          const active = section === m.key;
          return (
            <button
              key={m.key}
              onClick={() => onNavigate(m.key)}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 pt-2 pb-2 flex-1 min-w-0 transition active:scale-95 ${
                active ? 'text-brand' : 'text-fg-subtle'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? '' : ''}`} strokeWidth={active ? 2.4 : 2} />
              <span className="text-[9px] font-semibold tracking-tight truncate max-w-full">{m.short || m.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
