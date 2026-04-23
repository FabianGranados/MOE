export const validarEventoBorrador = (ev) => {
  const errores = [];
  if (!ev.comercial) errores.push('Comercial');
  if (!ev.razonSocial?.trim()) errores.push('Razón social');
  if (!ev.contactoNombre?.trim()) errores.push('Contacto');
  if (!ev.contactoTelefono?.trim() && !ev.contactoEmail?.trim()) errores.push('Teléfono o email');
  if (!ev.fechaEvento) errores.push('Fecha evento');
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
