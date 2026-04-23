export const multiplicadorDias = (d) => {
  const n = Math.max(1, Math.min(30, Number(d) || 1));
  if (n === 1) return 1.0;
  if (n === 2) return 1.4;
  if (n === 3) return 1.8;
  if (n <= 8) return 1 + (n - 1) * 0.3;
  return 3.1 + (n - 8) * 0.07;
};

export const calcItemAuto = (it) =>
  (Number(it.cantidad) || 0) * (Number(it.precioBase) || 0) * multiplicadorDias(it.dias);

export const calcItemTotal = (it) =>
  it.precioManual != null ? Number(it.precioManual) : calcItemAuto(it);

export const esNoComisionable = (it) =>
  it.categoria === 'Servicios' && /transporte|montaje|desmontaje/i.test(it.nombre || '');

export const calcProductos = (ev) =>
  (ev.items || [])
    .filter((i) => !esNoComisionable(i))
    .reduce((s, i) => s + calcItemTotal(i), 0);

export const calcTransporte = (ev) =>
  (ev.items || []).filter(esNoComisionable).reduce((s, i) => s + calcItemTotal(i), 0);

export const calcBaseIva = (ev) => calcProductos(ev) + calcTransporte(ev);
export const calcIva = (ev) => Math.round(calcBaseIva(ev) * 0.19);
export const calcTotal = (ev) => calcBaseIva(ev) + calcIva(ev);
export const calcPagado = (ev) =>
  (ev.pagos || []).reduce((s, p) => s + (Number(p.monto) || 0), 0);
