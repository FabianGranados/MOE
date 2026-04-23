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

export const validarEventoBorrador = (ev) => {
  const errores = validarDatosCliente(ev);
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
