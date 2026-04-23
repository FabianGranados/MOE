import { LABELS_CAMPOS } from '../constants.js';
import { diasHasta, hoy } from './format.js';

export const nextNumero = (events) => {
  const y = String(new Date().getFullYear()).slice(-2);
  const nums = events
    .map((e) => String(e.numeroEvento || ''))
    .filter((n) => n.startsWith(y))
    .map((n) => parseInt(n.slice(2), 10))
    .filter((n) => !isNaN(n));
  const sig = nums.length ? Math.max(...nums) + 1 : 1;
  return `${y}${String(sig).padStart(4, '0')}`;
};

export const newEvent = (numero, usuario) => ({
  id: `evt_${Date.now()}`,
  numeroEvento: numero,
  version: 1,
  comercial: usuario?.alias || (usuario?.nombre || '').split(' ')[0].toUpperCase() || '',
  fechaCreacion: hoy(),

  tipoDocumento: 'COTIZACION',

  razonSocial: '',
  tipoPersona: 'JURIDICA',
  tipoDocId: 'NIT',
  numeroDocId: '',
  tipoCliente: '',

  contactoNombre: '',
  contactoTelefono: '',
  contactoEmail: '',

  fechaEvento: '',
  horarioEvento: { tipo: 'abierto', franja: 'tarde', hora: '' },
  estado: 'EN ESPERA',
  tipoEvento: 'SOCIAL',
  llevaProveedorExterno: false,
  proveedorExternoNotas: '',
  formaPago: 'CONTADO',
  comentarios: '',
  items: [],
  finalizado: false,
  createdBy: usuario?.id,
  direccion: '',
  ciudad: '',
  mapsUrl: '',
  montaje: { fecha: '', tipo: 'abierto', franja: 'manana', hora: '' },
  desmontaje: { fecha: '', tipo: 'abierto', franja: 'tarde', hora: '' },
  personasMontaje: [
    { nombre: '', celular: '' },
    { nombre: '', celular: '' }
  ],
  personasDesmontaje: [
    { nombre: '', celular: '' },
    { nombre: '', celular: '' }
  ],
  contactoPrincipal: { nombre: '', celular: '' },
  contactoBackup: { nombre: '', celular: '' },
  notasOperativas: '',
  pagos: [],
  historial: []
});

export const diffDatos = (antes, despues, usuario) => {
  const cambios = [];
  const getVal = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);
  Object.keys(LABELS_CAMPOS).forEach((path) => {
    const a = getVal(antes, path) || '';
    const b = getVal(despues, path) || '';
    if (String(a) !== String(b)) {
      cambios.push({
        id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        campo: path,
        label: LABELS_CAMPOS[path],
        anterior: String(a),
        nuevo: String(b),
        usuarioId: usuario?.id,
        usuarioNombre: usuario?.nombre,
        fecha: new Date().toISOString()
      });
    }
  });
  return cambios;
};

export const clasificar = (ev) => {
  if (!ev.finalizado || ev.estado === 'PERDIDO') return null;
  const d = diasHasta(ev.fechaEvento);
  if (ev.estado === 'EN ESPERA' && d !== null && d <= 0)
    return { seccion: 1, razon: d === 0 ? 'HOY y EN ESPERA' : `Pasó hace ${Math.abs(d)}d` };
  if (ev.estado === 'EN ESPERA' && d !== null && d <= 7)
    return { seccion: 2, razon: `Faltan ${d}d` };
  if (ev.estado === 'EN ESPERA' && d !== null && d <= 15)
    return { seccion: 3, razon: `En ${d}d · sin confirmar` };
  if (ev.estado === 'VENDIDO' && d !== null && d >= 0 && d <= 15)
    return { seccion: 5, razon: d === 0 ? 'HOY' : `En ${d}d` };
  return null;
};

export const unidadesReservadas = (codigo, fechaISO, events, excluirEvId = null) => {
  if (!fechaISO || !codigo) return 0;
  return events
    .filter((e) => e.id !== excluirEvId)
    .filter((e) => e.estado === 'VENDIDO' || (e.finalizado && e.estado === 'EN ESPERA'))
    .filter((e) => e.fechaEvento === fechaISO)
    .reduce((total, ev) => {
      const item = (ev.items || []).find((i) => i.codigo === codigo);
      return total + (item ? Number(item.cantidad) || 0 : 0);
    }, 0);
};

export const verificarDisponibilidad = (producto, cantidadSolicitada, fechaISO, events, excluirEvId = null) => {
  if (!producto || producto.stock == null) return { disponible: true, sinLimite: true };
  const reservadas = unidadesReservadas(producto.codigo, fechaISO, events, excluirEvId);
  const usadas = reservadas + (Number(cantidadSolicitada) || 0);
  return {
    disponible: usadas <= producto.stock,
    sinLimite: false,
    stock: producto.stock,
    reservadas,
    solicitadas: Number(cantidadSolicitada) || 0,
    disponiblesAhora: Math.max(0, producto.stock - reservadas),
    exceso: Math.max(0, usadas - producto.stock)
  };
};
