export const ROLES = {
  gerencia_general:       { label: 'Gerencia General',              short: 'Gerencia',       accent: 'bg-stone-900' },
  coord_admin_financiero: { label: 'Coord. Admin. y Financiero',    short: 'Financiera',     accent: 'bg-emerald-700' },
  coord_admin_control:    { label: 'Coord. Admin. de Control',      short: 'Control',        accent: 'bg-amber-700' },
  direccion_comercial:    { label: 'Dirección Comercial',           short: 'Dir. Comercial', accent: 'bg-rose-600' },
  asesor_comercial:       { label: 'Asesor Comercial',              short: 'Asesor',         accent: 'bg-pink-500' },
  asistente_contable:     { label: 'Asistente Contable',            short: 'Contable',       accent: 'bg-violet-600' },
  jefe_bodega:            { label: 'Jefe de Bodega',                short: 'Bodega',         accent: 'bg-orange-600' },
  coord_logistica:        { label: 'Coord. Logística',              short: 'Logística',      accent: 'bg-sky-600' },
  rrhh_sst:               { label: 'RRHH / SST',                    short: 'RRHH',           accent: 'bg-teal-600' },
  contador_externo:       { label: 'Contador Externo',              short: 'Contador',       accent: 'bg-indigo-600' },
  cliente:                { label: 'Cliente',                       short: 'Cliente',        accent: 'bg-stone-500' }
};

// Usuarios DEMO (modo localStorage). En modo Supabase los usuarios reales
// viven en la base de datos y estos solo sirven como credenciales de prueba
// visibles en la pantalla de login.
export const USUARIOS = [
  { id: 'u1', nombre: 'Fabian Granados', email: 'admin@decolounge.com.co',          password: 'demo1234', rol: 'gerencia_general',    alias: 'FABIAN' },
  { id: 'u2', nombre: 'Johanna Ruiz',    email: 'cordicomercial@decolounge.com.co', password: 'demo1234', rol: 'direccion_comercial', alias: 'JOHANNA' },
  { id: 'u3', nombre: 'Ammy Castro',     email: 'asesor1@decolounge.com.co',        password: 'demo1234', rol: 'asesor_comercial',    alias: 'AMMY' }
];

export const ESTADOS_META = {
  'EN ESPERA': { color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30', dot: 'bg-amber-500' },
  'VENDIDO':   { color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30', dot: 'bg-emerald-500' },
  'PERDIDO':   { color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30', dot: 'bg-red-500' }
};
export const ESTADOS = Object.keys(ESTADOS_META);

export const TIPO_EVENTO = ['SOCIAL', 'EMPRESARIAL', 'CORPORATIVO', 'MATRIMONIO', '15 AÑOS', 'CUMPLEAÑOS', 'BAUTIZO', 'FERIA'];
export const FORMAS_PAGO = ['CONTADO', 'CREDICONTADO', 'CREDITO'];
export const CATEGORIAS = ['Mobiliario', 'Mantelería', 'Iluminación', 'Decoración', 'Servicios', 'Otros'];

export const TIPOS_DOCUMENTO_COTIZACION = [
  { key: 'COTIZACION', label: 'Cotización',        sub: 'Con IVA 19%', icon: '📄' },
  { key: 'REMISION',   label: 'Remisión comercial', sub: 'Sin IVA',    icon: '📋' }
];

export const TIPOS_PERSONA = [
  { key: 'JURIDICA',   label: 'Jurídica',          docs: ['NIT'] },
  { key: 'NATURAL',    label: 'Natural',           docs: ['CC'] },
  { key: 'EXTRANJERA', label: 'Extranjera',        docs: ['CE', 'PASAPORTE'] }
];

export const TIPOS_DOCUMENTO_ID = {
  NIT:       { label: 'NIT',                      hint: 'Número de identificación tributaria' },
  CC:        { label: 'Cédula de ciudadanía',     hint: null },
  CE:        { label: 'Cédula de extranjería',    hint: null },
  PASAPORTE: { label: 'Pasaporte',                hint: null }
};

export const TIPOS_CLIENTE = ['Hotel', 'Agencia de Eventos', 'Planeador', 'Cliente Final'];

export const TEXTO_LEGAL_REMISION =
  'Documento no válido como factura. El precio aquí expresado NO incluye IVA ni retenciones. En caso de requerir cuenta de cobro, los impuestos se cobrarán aparte.';

export const FRANJAS = { manana: 'Mañana (9am - 12pm)', tarde: 'Tarde (1pm - 4pm)' };

export const MOTIVOS_PERDIDA = [
  'Precio alto', 'Fecha no disponible', 'Cambio de fecha', 'Eligió otro proveedor',
  'No respondió', 'Cambio de plan', 'Presupuesto cancelado', 'Otro'
];

export const METODOS_PAGO = ['Transferencia', 'Efectivo', 'Tarjeta', 'Cheque'];
export const BANCOS = [
  'BANCOLOMBIA DECO', 'BANCOLOMBIA LOGIQ',
  'DAVIVIENDA DECO', 'DAVIVIENDA LOGIQ',
  'B-REVE DECO', 'B-REVE LOGIQ',
  'NEQUI', 'DAVIPLATA', 'OTRO'
];

export const AVISO_PAGO_OTRO_BANCO =
  'Si el pago viene de otro banco puede tardar entre 24 y 72 horas en reflejarse.';

export const PRODUCTOS_INICIAL = [
  { id: 'p1', codigo: 'MESA-RED-2M', nombre: 'Mesa redonda 2mts x 80cm con mantel negro', categoria: 'Mobiliario', precio: 65000, stock: 40, foto: '', activo: true },
  { id: 'p2', codigo: 'CAMINO-DOR', nombre: 'Camino dorado sobre mesa', categoria: 'Mantelería', precio: 10000, stock: 80, foto: '', activo: true },
  { id: 'p3', codigo: 'SILLA-TIF', nombre: 'Silla Tiffany dorada con cojín blanco', categoria: 'Mobiliario', precio: 8000, stock: 300, foto: '', activo: true },
  { id: 'p4', codigo: 'LUZ-LED', nombre: 'Iluminación LED decorativa', categoria: 'Iluminación', precio: 45000, stock: 15, foto: '', activo: true },
  { id: 'p5', codigo: 'SERV-TRANS', nombre: 'Servicio de Transporte en Bogotá', categoria: 'Servicios', precio: 200000, stock: null, foto: '', activo: true }
];

export const RANGOS_COMISION_DEFAULT = [
  { hasta: 5000000, porcentaje: 5 },
  { hasta: 10000000, porcentaje: 8 },
  { hasta: Infinity, porcentaje: 10 }
];

export const LABELS_CAMPOS = {
  direccion: 'Dirección',
  mapsUrl: 'Link Maps',
  'montaje.fecha': 'Fecha montaje',
  'montaje.tipo': 'Tipo montaje',
  'montaje.franja': 'Franja montaje',
  'montaje.hora': 'Hora montaje',
  'desmontaje.fecha': 'Fecha desmontaje',
  'desmontaje.tipo': 'Tipo desmontaje',
  'desmontaje.franja': 'Franja desmontaje',
  'desmontaje.hora': 'Hora desmontaje',
  'contactoPrincipal.nombre': 'Contacto principal',
  'contactoPrincipal.celular': 'Cel principal',
  'contactoBackup.nombre': 'Contacto backup',
  'contactoBackup.celular': 'Cel backup',
  notasOperativas: 'Notas operativas'
};

export const REGLAS_PAGO = {
  CONTADO: 'Pago del 100% antes del evento',
  CREDICONTADO: 'Anticipo 50% + 50% día del evento',
  CREDITO: 'Pago posterior al evento'
};
