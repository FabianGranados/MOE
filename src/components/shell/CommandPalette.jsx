import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, FileText, Plus, Search, Sparkles } from 'lucide-react';
import { useEscape } from '../../hooks/useHotkey.js';
import { money } from '../../utils/format.js';
import { calcTotal } from '../../utils/calculos.js';
import { EstadoBadge } from '../shared/Estado.jsx';

export function CommandPalette({ open, onClose, events, menu, onNavigate, onOpenEvent, onNew }) {
  const [q, setQ] = useState('');

  useEffect(() => { if (open) setQ(''); }, [open]);
  useEscape(onClose, open);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    const matches = events
      .filter((e) => {
        if (!query) return true;
        return (
          (e.numeroEvento || '').toLowerCase().includes(query) ||
          (e.razonSocial || '').toLowerCase().includes(query) ||
          (e.contactoNombre || '').toLowerCase().includes(query) ||
          (e.comercial || '').toLowerCase().includes(query)
        );
      })
      .slice(0, 8);
    return matches;
  }, [events, q]);

  const filteredMenu = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return menu;
    return menu.filter((m) => m.label.toLowerCase().includes(query));
  }, [menu, q]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 360 }}
            className="relative w-full max-w-xl bg-surface-elev rounded-2xl shadow-pop border border-border overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-fg-subtle" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar cotización, contacto, cliente..."
                className="flex-1 bg-transparent outline-none text-sm text-fg placeholder:text-fg-subtle"
              />
              <span className="kbd">esc</span>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {!q && (
                <Section title="Acciones">
                  <Row
                    icon={Plus}
                    label="Nueva cotización"
                    hint="Crear un lead"
                    onClick={() => { onNew(); onClose(); }}
                  />
                </Section>
              )}

              {filteredMenu.length > 0 && (
                <Section title="Navegar">
                  {filteredMenu.map((m) => {
                    const Icon = m.icon;
                    return (
                      <Row
                        key={m.key}
                        icon={Icon}
                        label={m.label}
                        onClick={() => { onNavigate(m.key); onClose(); }}
                      />
                    );
                  })}
                </Section>
              )}

              {results.length > 0 && (
                <Section title={`Cotizaciones ${q ? `· ${results.length}` : ''}`}>
                  {results.map((ev) => (
                    <Row
                      key={ev.id}
                      icon={FileText}
                      label={ev.razonSocial || 'Sin nombre'}
                      hint={`${ev.numeroEvento}-${ev.version} · ${ev.comercial || '—'}`}
                      right={
                        <div className="flex items-center gap-2">
                          <EstadoBadge estado={ev.estado} size="xs" />
                          <span className="text-[11px] font-mono font-semibold">{money(calcTotal(ev))}</span>
                        </div>
                      }
                      onClick={() => { onOpenEvent(ev.id); onClose(); }}
                    />
                  ))}
                </Section>
              )}

              {q && results.length === 0 && filteredMenu.length === 0 && (
                <div className="py-10 text-center">
                  <Sparkles className="w-6 h-6 text-fg-subtle mx-auto mb-2" />
                  <div className="text-xs text-fg-muted">Sin resultados para "{q}"</div>
                </div>
              )}
            </div>

            <div className="border-t border-border bg-surface-sunken px-4 py-2 flex items-center gap-3 text-[10px] text-fg-muted">
              <span className="flex items-center gap-1"><span className="kbd">↑↓</span> Navegar</span>
              <span className="flex items-center gap-1"><span className="kbd">↵</span> Abrir</span>
              <span className="flex items-center gap-1 ml-auto"><span className="kbd">⌘K</span> Comandos</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-2">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-fg-subtle px-2 pt-2 pb-1">{title}</div>
      <div>{children}</div>
    </div>
  );
}

function Row({ icon: Icon, label, hint, right, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-sunken text-left transition group"
    >
      <div className="w-8 h-8 rounded-lg bg-surface-sunken group-hover:bg-brand-softer group-hover:text-brand flex items-center justify-center text-fg-muted transition">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-fg truncate">{label}</div>
        {hint && <div className="text-[10px] text-fg-muted truncate">{hint}</div>}
      </div>
      {right}
      <ArrowRight className="w-3.5 h-3.5 text-fg-subtle opacity-0 group-hover:opacity-100 transition" />
    </button>
  );
}
