import { diasHasta } from './format.js';

const NIVELES = {
  rojo:    { tone: 'red',     dot: 'bg-red-500',     text: 'text-red-700 dark:text-red-300',         bg: 'bg-red-50 dark:bg-red-500/10',         border: 'border-red-200 dark:border-red-500/30' },
  amarillo:{ tone: 'amber',   dot: 'bg-amber-500',   text: 'text-amber-700 dark:text-amber-300',     bg: 'bg-amber-50 dark:bg-amber-500/10',     border: 'border-amber-200 dark:border-amber-500/30' },
  verde:   { tone: 'emerald', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30' },
  gris:    { tone: 'neutral', dot: 'bg-stone-400',   text: 'text-fg-muted',                          bg: 'bg-surface-sunken',                    border: 'border-border' }
};

/**
 * Clasifica un evento por urgencia/seguimiento.
 * Retorna: { nivel, razon, color }
 */
export function semaforo(ev) {
  // Cerradas = gris
  if (ev.estado === 'VENDIDO' || ev.estado === 'PERDIDO') {
    return { nivel: 'gris', razon: ev.estado === 'VENDIDO' ? 'Cerrada · Vendida' : 'Cerrada · Perdida', ...NIVELES.gris };
  }

  const d = diasHasta(ev.fechaEvento);

  // Sin finalizar = tratar con más tolerancia
  if (!ev.finalizado) {
    if (d !== null && d < 0) return { nivel: 'rojo', razon: `Borrador · evento pasó hace ${Math.abs(d)}d`, ...NIVELES.rojo };
    if (d !== null && d <= 7) return { nivel: 'amarillo', razon: `Borrador · evento en ${d}d`, ...NIVELES.amarillo };
    return { nivel: 'amarillo', razon: 'Borrador sin finalizar', ...NIVELES.amarillo };
  }

  // EN ESPERA finalizada
  if (d !== null && d < 0) return { nivel: 'rojo', razon: `Pasó hace ${Math.abs(d)}d · pendiente de cierre`, ...NIVELES.rojo };
  if (d !== null && d === 0) return { nivel: 'rojo', razon: 'HOY sin confirmar', ...NIVELES.rojo };
  if (d !== null && d <= 7) return { nivel: 'rojo', razon: `Faltan ${d}d · sin confirmar`, ...NIVELES.rojo };
  if (d !== null && d <= 15) return { nivel: 'amarillo', razon: `En ${d}d · hacer seguimiento`, ...NIVELES.amarillo };
  return { nivel: 'verde', razon: d !== null ? `En ${d}d` : 'Sin fecha', ...NIVELES.verde };
}

/**
 * Identifica cotizaciones que requieren cierre obligatorio del comercial.
 * Son las que tienen fecha pasada y siguen EN ESPERA + finalizadas.
 */
export const requiereCierre = (ev) => {
  if (!ev.finalizado) return false;
  if (ev.estado !== 'EN ESPERA') return false;
  const d = diasHasta(ev.fechaEvento);
  return d !== null && d < 0;
};
