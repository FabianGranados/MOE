export const money = (n) =>
  '$' + (Number(n) || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });

export const hoy = () => new Date().toISOString().slice(0, 10);

export const diasHasta = (f) => {
  if (!f) return null;
  const a = new Date(f + 'T00:00:00');
  const b = new Date(hoy() + 'T00:00:00');
  return Math.round((a - b) / 86400000);
};

export const addDias = (fechaISO, dias) => {
  if (!fechaISO) return '';
  const d = new Date(fechaISO + 'T00:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
};

export const diffDias = (f1, f2) => {
  if (!f1 || !f2) return null;
  const a = new Date(f1 + 'T00:00:00');
  const b = new Date(f2 + 'T00:00:00');
  return Math.round((a - b) / 86400000);
};

const LOCALE = 'es-CO';

export const fmtFecha = (iso) => {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' });
};

export const fmtFechaLarga = (iso) => {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString(LOCALE, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
};

export const fmtFechaCorta = (iso) => {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString(LOCALE, {
    weekday: 'short', day: 'numeric', month: 'short'
  });
};

export const fmtHora = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
};

export const fmtMes = (iso) => {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString(LOCALE, { month: 'short' });
};

export const tiempoRelativo = (d) => {
  if (!d) return '';
  const seg = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (seg < 10) return 'hace un momento';
  if (seg < 60) return `hace ${seg}s`;
  const min = Math.floor(seg / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(d).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' });
};

export const initials = (n) =>
  (n || '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const MAPS_BASE = 'https://www.google.com/maps/search/?api=1&query=';
export const buildMapsUrl = (direccion, ciudad) => {
  const q = [direccion, ciudad].filter((s) => s && String(s).trim()).join(', ');
  return q ? MAPS_BASE + encodeURIComponent(q) : '';
};
// True si la URL luce como una auto-generada nuestra
export const esMapsAutoUrl = (url) => !url || String(url).startsWith(MAPS_BASE);
