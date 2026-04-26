export const validarDatosCliente = (ev) => {
  const errores = [];
  if (!ev.comercial) errores.push('Comercial');
  if (!ev.razonSocial?.trim()) errores.push(ev.tipoPersona === 'NATURAL' ? 'Nombre completo' : 'Razón social');
  if (!ev.tipoPersona) errores.push('Tipo de persona');
  if (!ev.tipoDocId) errores.push('Tipo de documento');
  if (!ev.numeroDocId?.trim()) errores.push('Número de documento');
  if (!ev.tipoCliente) errores.push('Tipo de cliente');
  if (!ev.contactoNombre?.trim()) errores.push('Nombre de contacto');
  if (!ev.contactoTelefono?.trim() && !ev.contactoEmail?.trim()) errores.push('Teléfono o email');
  if (!ev.fechaEvento) errores.push('Fecha del evento');
  if (!ev.tipoEvento) errores.push('Tipo de evento');
  return errores;
};

// Logística completa de la cotización. Todos obligatorios para finalizar.
// Las personas que reciben/entregan NO se piden acá — eso vive en la
// Remisión de Logística (Fase B), porque al cotizar todavía no se sabe.
export const validarLogistica = (ev) => {
  const errores = [];

  // Horario del evento
  const he = ev.horarioEvento || {};
  if (!he.tipo) errores.push('Tipo de horario del evento');
  if (he.tipo === 'cerrado' && !he.hora) errores.push('Hora exacta del evento');

  // Lugar
  if (!ev.direccion?.trim()) errores.push('Dirección');
  if (!ev.ciudad?.trim()) errores.push('Ciudad');

  // Montaje
  const m = ev.montaje || {};
  if (!m.fecha) errores.push('Fecha de montaje');
  if (m.tipo === 'cerrado' && !m.hora) errores.push('Hora de montaje');

  // Desmontaje
  const d = ev.desmontaje || {};
  if (!d.fecha) errores.push('Fecha de desmontaje');
  if (d.tipo === 'cerrado' && !d.hora) errores.push('Hora de desmontaje');

  return errores;
};

export const validarEventoBorrador = (ev) => {
  const errores = validarDatosCliente(ev);
  errores.push(...validarLogistica(ev));
  if (!(ev.items || []).length) errores.push('Al menos un producto');
  return errores;
};

export const validarDatosOperativos = (data) => {
  const err = [];
  if (!data.direccion?.trim()) err.push('Dirección');
  if (!data.montaje?.fecha) err.push('Fecha montaje');
  if (!data.desmontaje?.fecha) err.push('Fecha desmontaje');
  if (data.montaje?.tipo === 'cerrado' && !data.montaje.hora) err.push('Hora montaje');
  if (data.desmontaje?.tipo === 'cerrado' && !data.desmontaje.hora) err.push('Hora desmontaje');
  if (!data.contactoPrincipal?.nombre?.trim()) err.push('Contacto principal');
  if (!data.contactoPrincipal?.celular?.trim()) err.push('Cel principal');
  return err;
};
