import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEscape } from '../../hooks/useHotkey.js';

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md', tone = 'neutral' }) {
  const maxW = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl', '4xl': 'max-w-4xl' }[size];
  const tones = {
    neutral: 'border-border',
    success: 'border-emerald-500/20',
    danger:  'border-red-500/20',
    brand:   'border-brand/20'
  };

  useEscape(onClose, open);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`relative bg-surface-elev w-full ${maxW} rounded-t-2xl sm:rounded-2xl border ${tones[tone]} shadow-pop max-h-[92vh] flex flex-col overflow-hidden`}
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          >
            {(title || onClose) && (
              <div className="flex items-start gap-3 p-5 border-b border-border">
                <div className="flex-1 min-w-0">
                  {title && <h3 className="text-base font-bold text-fg">{title}</h3>}
                  {subtitle && <p className="text-[11px] text-fg-muted mt-0.5">{subtitle}</p>}
                </div>
                {onClose && (
                  <button className="btn-icon" onClick={onClose} aria-label="Cerrar">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            <div className="flex-1 overflow-y-auto">{children}</div>
            {footer && <div className="p-4 border-t border-border bg-surface-sunken flex justify-end gap-2 safe-bottom">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
