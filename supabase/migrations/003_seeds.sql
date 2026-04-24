-- =====================================================================
-- MOE · Seeds iniciales
--
-- Carga: 11 roles · matriz de permisos · workflows pre-configurados ·
-- usuarios demo · productos de arranque · rangos de comisión default.
-- =====================================================================

-- =====================================================================
-- ROLES (según jerarquía Decolounge)
-- =====================================================================

insert into public.roles (id, nombre, nombre_corto, nivel, descripcion) values
  ('gerencia_general',        'Gerencia General',                        'Gerencia',      1, 'Dirección y control financiero · aprueba excepciones y reglas maestras'),
  ('coord_admin_financiero',  'Coordinador Administrativo y Financiero', 'Financiera',    1, 'Tesorería · ejecuta pagos · controla flujo de caja'),
  ('coord_admin_control',     'Coordinador Administrativo de Control',   'Control',       2, 'Fiscalía interna · valida compras, pagos y operación cruzada'),
  ('direccion_comercial',     'Dirección Comercial',                     'Dir. Comercial',2, 'Supervisa ventas · aprueba descuentos · pipeline comercial'),
  ('asesor_comercial',        'Asesor Comercial',                        'Asesor',        3, 'Crea cotizaciones, gestiona pagos del cliente, sube soportes'),
  ('asistente_contable',      'Asistente Contable',                      'Contable',      3, 'Revisa soportes · valida ingresos · causa facturas'),
  ('jefe_bodega',             'Jefe de Bodega',                          'Bodega',        3, 'Inventario · alistamiento · reporte de daños'),
  ('coord_logistica',         'Coordinador de Logística y Transporte',   'Logística',     3, 'Rutas · cuadrillas · montajes y desmontajes'),
  ('rrhh_sst',                'Recursos Humanos / SST',                  'RRHH',          4, 'Novedades · horarios · anticipos · seguridad laboral'),
  ('contador_externo',        'Contador Externo',                        'Contador ext.', 4, 'Auditoría · cierres · liquidaciones (solo lectura)'),
  ('cliente',                 'Cliente',                                 'Cliente',       5, 'Externo · portal limitado · ve su cotización y eventos')
on conflict (id) do update set
  nombre = excluded.nombre,
  nombre_corto = excluded.nombre_corto,
  nivel = excluded.nivel,
  descripcion = excluded.descripcion;

-- =====================================================================
-- PERMISOS (granulares por módulo.acción)
-- =====================================================================

insert into public.permissions (id, modulo, accion, descripcion) values
  -- Cotizaciones
  ('cotizaciones.ver_propias',  'cotizaciones', 'ver',    'Ver solo las cotizaciones propias'),
  ('cotizaciones.ver_todas',    'cotizaciones', 'ver',    'Ver todas las cotizaciones'),
  ('cotizaciones.crear',        'cotizaciones', 'crear',  'Crear cotizaciones'),
  ('cotizaciones.editar',       'cotizaciones', 'editar', 'Editar cotizaciones'),
  ('cotizaciones.finalizar',    'cotizaciones', 'aprobar','Finalizar / bloquear cotización'),
  ('cotizaciones.marcar_venta', 'cotizaciones', 'aprobar','Marcar como vendida o perdida'),
  ('cotizaciones.eliminar',     'cotizaciones', 'eliminar','Eliminar cotizaciones'),

  -- Pagos del cliente
  ('pagos.registrar',           'pagos', 'crear',  'Subir un pago del cliente con soporte'),
  ('pagos.validar',             'pagos', 'validar','Validar que el dinero llegó al banco'),
  ('pagos.ver_todos',           'pagos', 'ver',    'Ver todos los pagos'),
  ('pagos.anular',              'pagos', 'anular', 'Anular un pago registrado'),

  -- Inventario
  ('inventario.ver',            'inventario', 'ver',    'Ver catálogo e inventario'),
  ('inventario.editar',         'inventario', 'editar', 'Crear / editar / desactivar productos'),
  ('inventario.reportar_dano',  'inventario', 'editar', 'Reportar producto dañado'),

  -- Logística
  ('logistica.programar',       'logistica', 'crear',  'Programar rutas / cuadrillas'),
  ('logistica.ver',             'logistica', 'ver',    'Ver programación de montajes'),

  -- Comisiones
  ('comisiones.ver_propias',    'comisiones', 'ver',    'Ver comisiones propias'),
  ('comisiones.ver_todas',      'comisiones', 'ver',    'Ver comisiones de todos los comerciales'),
  ('comisiones.configurar',     'comisiones', 'editar', 'Configurar rangos de comisión'),
  ('comisiones.liquidar',       'comisiones', 'aprobar','Liquidar y pagar comisiones'),

  -- Proveedores y compras
  ('proveedores.crear',         'proveedores', 'crear',  'Registrar proveedor'),
  ('proveedores.aprobar',       'proveedores', 'aprobar','Dar visto bueno al proveedor (CAC)'),
  ('proveedores.ver',           'proveedores', 'ver',    'Ver lista de proveedores'),
  ('ot.solicitar',              'ot',          'crear',  'Solicitar orden de trabajo / pago a proveedor'),
  ('ot.revisar_contable',       'ot',          'validar','Revisar soportes y fiscal del proveedor'),
  ('ot.validar_control',        'ot',          'aprobar','Validar que la OT corresponde a la operación'),
  ('ot.ejecutar_pago',          'ot',          'aprobar','Ejecutar pago al proveedor'),

  -- Usuarios y RH
  ('usuarios.editar',           'usuarios', 'editar',  'Crear / editar / desactivar usuarios'),
  ('rrhh.novedades',            'rrhh',     'editar',  'Registrar novedades, anticipos'),

  -- Auditoría
  ('audit.ver',                 'audit', 'ver', 'Ver log completo de auditoría'),

  -- Dashboard / reportes
  ('reportes.ejecutivos',       'reportes', 'ver', 'Ver dashboard ejecutivo')
on conflict (id) do nothing;

-- =====================================================================
-- Matriz de permisos por rol
-- =====================================================================

-- Helper temporal para asignar permisos a un rol
create or replace function public.grant_perms(p_role text, p_perms text[]) returns void as $$
begin
  insert into public.role_permissions(role_id, permission_id)
  select p_role, unnest(p_perms)
  on conflict do nothing;
end;
$$ language plpgsql;

-- Gerencia General · ve y puede todo
select public.grant_perms('gerencia_general', array[
  'cotizaciones.ver_todas', 'cotizaciones.crear', 'cotizaciones.editar', 'cotizaciones.finalizar',
  'cotizaciones.marcar_venta', 'cotizaciones.eliminar',
  'pagos.registrar', 'pagos.validar', 'pagos.ver_todos', 'pagos.anular',
  'inventario.ver', 'inventario.editar', 'inventario.reportar_dano',
  'logistica.programar', 'logistica.ver',
  'comisiones.ver_todas', 'comisiones.configurar', 'comisiones.liquidar',
  'proveedores.crear', 'proveedores.aprobar', 'proveedores.ver',
  'ot.solicitar', 'ot.revisar_contable', 'ot.validar_control', 'ot.ejecutar_pago',
  'usuarios.editar', 'rrhh.novedades',
  'audit.ver', 'reportes.ejecutivos'
]);

-- Coordinador Administrativo y Financiero (tesorería · ejecuta pagos)
select public.grant_perms('coord_admin_financiero', array[
  'cotizaciones.ver_todas',
  'pagos.ver_todos', 'pagos.validar',
  'comisiones.ver_todas', 'comisiones.liquidar', 'comisiones.configurar',
  'proveedores.ver',
  'ot.ejecutar_pago',
  'reportes.ejecutivos'
]);

-- Coordinador Administrativo de Control (fiscalía interna)
select public.grant_perms('coord_admin_control', array[
  'cotizaciones.ver_todas',
  'pagos.ver_todos',
  'inventario.ver',
  'logistica.ver',
  'proveedores.ver', 'proveedores.aprobar',
  'ot.validar_control',
  'audit.ver',
  'reportes.ejecutivos'
]);

-- Dirección Comercial (supervisa ventas · aprueba descuentos)
select public.grant_perms('direccion_comercial', array[
  'cotizaciones.ver_todas', 'cotizaciones.crear', 'cotizaciones.editar',
  'cotizaciones.finalizar', 'cotizaciones.marcar_venta',
  'pagos.ver_todos',
  'inventario.ver',
  'comisiones.ver_todas',
  'proveedores.ver',
  'ot.solicitar',
  'reportes.ejecutivos'
]);

-- Asesor Comercial
select public.grant_perms('asesor_comercial', array[
  'cotizaciones.ver_propias', 'cotizaciones.crear', 'cotizaciones.editar',
  'cotizaciones.finalizar', 'cotizaciones.marcar_venta',
  'pagos.registrar',
  'inventario.ver',
  'comisiones.ver_propias',
  'ot.solicitar'
]);

-- Asistente Contable (revisa soportes, causa facturas)
select public.grant_perms('asistente_contable', array[
  'cotizaciones.ver_todas',
  'pagos.ver_todos', 'pagos.validar',
  'proveedores.ver',
  'ot.revisar_contable',
  'reportes.ejecutivos'
]);

-- Jefe de Bodega
select public.grant_perms('jefe_bodega', array[
  'cotizaciones.ver_todas',
  'inventario.ver', 'inventario.editar', 'inventario.reportar_dano',
  'logistica.ver'
]);

-- Coordinador de Logística
select public.grant_perms('coord_logistica', array[
  'cotizaciones.ver_todas',
  'inventario.ver',
  'logistica.ver', 'logistica.programar'
]);

-- RRHH / SST
select public.grant_perms('rrhh_sst', array[
  'usuarios.editar', 'rrhh.novedades'
]);

-- Contador Externo (auditoría · solo lectura)
select public.grant_perms('contador_externo', array[
  'cotizaciones.ver_todas',
  'pagos.ver_todos',
  'comisiones.ver_todas', 'comisiones.configurar',
  'proveedores.ver',
  'audit.ver',
  'reportes.ejecutivos'
]);

-- Cliente (externo · portal limitado) — permisos se aplican por JWT custom
-- No asignamos aquí, se maneja con magic links.

drop function public.grant_perms(text, text[]);

-- =====================================================================
-- WORKFLOWS pre-configurados
-- =====================================================================

insert into public.workflow_types (id, nombre, descripcion) values
  ('pago_proveedor', 'Pago a proveedor externo',
   'OT / cuenta de cobro de proveedor: revisión contable → validación control → ejecución financiera'),
  ('descuento_especial', 'Descuento superior al umbral autorizado',
   'Escala a Dirección Comercial y Gerencia según el porcentaje'),
  ('anulacion_venta', 'Anulación de venta ya registrada',
   'Requiere visto bueno de Coord. Comercial y registro contable')
on conflict (id) do nothing;

insert into public.workflow_steps (workflow_type, orden, nombre, role_id, sla_horas, obligatorio) values
  ('pago_proveedor', 1, 'Revisión de soportes y fiscal', 'asistente_contable',      48, true),
  ('pago_proveedor', 2, 'Validación operativa',          'coord_admin_control',     48, true),
  ('pago_proveedor', 3, 'Ejecución del pago (viernes)',  'coord_admin_financiero', 168, true),

  ('descuento_especial', 1, 'Aprobación Dir. Comercial', 'direccion_comercial', 24, true),
  ('descuento_especial', 2, 'Aprobación Gerencia',       'gerencia_general',    48, true),

  ('anulacion_venta', 1, 'Visto bueno Dirección Comercial', 'direccion_comercial',   24, true),
  ('anulacion_venta', 2, 'Registro contable',                'asistente_contable',   48, true)
on conflict (workflow_type, orden) do nothing;

-- =====================================================================
-- RANGOS DE COMISIÓN DEFAULT
-- =====================================================================

insert into public.rangos_comision (orden, hasta, porcentaje) values
  (1, 5000000,  5),
  (2, 10000000, 8),
  (3, null,    10)
on conflict do nothing;

-- =====================================================================
-- USUARIOS DEMO
--
-- IMPORTANTE: primero debes crear estos emails desde Supabase Auth
-- (Authentication → Users → Invite / Create). Luego Supabase asigna
-- un UUID que usamos abajo. Reemplaza los UUIDs '00000000-...' por
-- los reales tras crear cada cuenta, o usa el script de la UI.
-- =====================================================================

-- Estos INSERTs son plantilla. Ajusta los IDs con los reales de auth.users.
-- insert into public.usuarios (id, email, nombre, alias, role_id) values
--   ('uuid-real-1', 'admin@decolounge.co',   'Fabian Granados','FABIAN', 'gerencia_general'),
--   ('uuid-real-2', 'johanna@decolounge.co', 'Johanna Ruiz',   'JOHANNA','direccion_comercial'),
--   ('uuid-real-3', 'ammy@decolounge.co',    'Ammy Castro',    'AMMY',   'asesor_comercial')
-- on conflict (id) do nothing;

-- =====================================================================
-- PRODUCTOS INICIALES (solo si la tabla está vacía)
-- =====================================================================

insert into public.productos (codigo, nombre, categoria, precio_base, stock, activo)
select * from (values
  ('MESA-RED-2M',  'Mesa redonda 2mts x 80cm con mantel negro', 'Mobiliario',   65000,   40, true),
  ('CAMINO-DOR',   'Camino dorado sobre mesa',                   'Mantelería',  10000,   80, true),
  ('SILLA-TIF',    'Silla Tiffany dorada con cojín blanco',      'Mobiliario',   8000,  300, true),
  ('LUZ-LED',      'Iluminación LED decorativa',                 'Iluminación', 45000,   15, true),
  ('SERV-TRANS',   'Servicio de Transporte en Bogotá',           'Servicios',  200000, null, true)
) as v(codigo, nombre, categoria, precio_base, stock, activo)
where not exists (select 1 from public.productos);
