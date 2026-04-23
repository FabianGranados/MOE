import { RANGOS_COMISION_DEFAULT } from '../constants.js';
import { calcProductos, calcTotal, calcPagado } from './calculos.js';

export const calcPorcentajeComision = (baseProductos, rangos = RANGOS_COMISION_DEFAULT) => {
  const r = rangos.find((x) => baseProductos <= x.hasta);
  return r ? r.porcentaje : 0;
};

export const calcBaseComision = (ev) => calcProductos(ev);

export const calcComision = (ev, rangos = RANGOS_COMISION_DEFAULT) => {
  const base = calcBaseComision(ev);
  const pct = calcPorcentajeComision(base, rangos);
  return Math.round((base * pct) / 100);
};

export const esComisionGanada = (ev) => {
  if (ev.estado !== 'VENDIDO') return false;
  const total = calcTotal(ev);
  if (total <= 0) return false;
  return calcPagado(ev) >= total;
};
