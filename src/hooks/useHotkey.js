import { useEffect } from 'react';

export function useHotkey(combo, handler, deps = []) {
  useEffect(() => {
    const keys = combo.toLowerCase().split('+').map((k) => k.trim());
    const needsMod = keys.includes('mod') || keys.includes('cmd') || keys.includes('ctrl');
    const needsShift = keys.includes('shift');
    const needsAlt = keys.includes('alt');
    const target = keys.filter((k) => !['mod', 'cmd', 'ctrl', 'shift', 'alt'].includes(k))[0];

    const onKey = (e) => {
      if (needsMod && !(e.metaKey || e.ctrlKey)) return;
      if (!needsMod && (e.metaKey || e.ctrlKey)) return;
      if (needsShift && !e.shiftKey) return;
      if (!needsShift && e.shiftKey) return;
      if (needsAlt && !e.altKey) return;
      if (e.key.toLowerCase() !== target) return;
      e.preventDefault();
      handler(e);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function useEscape(handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e) => { if (e.key === 'Escape') handler(e); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handler, enabled]);
}
