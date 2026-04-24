-- =====================================================================
-- MOE · Parche 004 · Fix rol coord_comercial → direccion_comercial
--
-- Motivo: los archivos 002 y 003 tenían referencias a un rol llamado
-- 'coord_comercial' que NO forma parte de la jerarquía final (solo
-- existe 'direccion_comercial'). Este parche:
--   1. Recrea las policies de RLS que usaban el rol incorrecto.
--   2. Completa los workflow_steps de 'anulacion_venta' que fallaron.
--   3. Carga rangos_comision y productos iniciales que no alcanzaron
--      a ejecutarse por el error.
--
-- Ejecutar una sola vez.
-- =====================================================================

-- ---- 1. Recrear policies afectadas --------------------------------

drop policy if exists cotizaciones_select     on public.cotizaciones;
drop policy if exists cotizaciones_insert     on public.cotizaciones;
drop policy if exists cotizaciones_update     on public.cotizaciones;
drop policy if exists productos_write         on public.productos;
drop policy if exists pagos_select            on public.pagos;
drop policy if exists pagos_insert            on public.pagos;
drop policy if exists proveedor_cots_insert   on public.proveedor_cotizaciones;

create policy cotizaciones_select on public.cotizaciones
  for select using (
    public.my_role() in (
      'gerencia_general', 'coord_admin_financiero', 'coord_admin_control',
      'direccion_comercial',
      'jefe_bodega', 'coord_logistica', 'asistente_contable', 'contador_externo'
    )
    or (public.my_role() = 'asesor_comercial' and comercial_id = auth.uid())
  );

create policy cotizaciones_insert on public.cotizaciones
  for insert with check (
    public.my_role() in ('asesor_comercial', 'direccion_comercial', 'gerencia_general')
  );

create policy cotizaciones_update on public.cotizaciones
  for update using (
    (public.my_role() = 'asesor_comercial' and comercial_id = auth.uid())
    or public.my_role() in (
      'gerencia_general', 'direccion_comercial',
      'jefe_bodega', 'coord_logistica'
    )
  );

create policy productos_write on public.productos
  for all using (
    public.my_role() in (
      'gerencia_general', 'jefe_bodega', 'direccion_comercial'
    )
  );

create policy pagos_select on public.pagos
  for select using (
    public.my_role() in (
      'gerencia_general', 'coord_admin_financiero', 'coord_admin_control',
      'asistente_contable', 'contador_externo',
      'direccion_comercial'
    )
    or (
      public.my_role() = 'asesor_comercial' and exists(
        select 1 from public.cotizaciones c
        where c.id = cotizacion_id and c.comercial_id = auth.uid()
      )
    )
  );

create policy pagos_insert on public.pagos
  for insert with check (
    public.my_role() in (
      'asesor_comercial', 'direccion_comercial', 'gerencia_general'
    )
  );

create policy proveedor_cots_insert on public.proveedor_cotizaciones
  for insert with check (
    public.my_role() in ('asesor_comercial', 'direccion_comercial')
  );

-- ---- 2. Completar workflow_types y workflow_steps ----------------

insert into public.workflow_types (id, nombre, descripcion) values
  ('pago_proveedor', 'Pago a proveedor externo',
   'OT / cuenta de cobro de proveedor: revisión contable → validación control → ejecución financiera'),
  ('descuento_especial', 'Descuento superior al umbral autorizado',
   'Escala a Dirección Comercial y Gerencia según el porcentaje'),
  ('anulacion_venta', 'Anulación de venta ya registrada',
   'Requiere visto bueno de Dirección Comercial y registro contable')
on conflict (id) do nothing;

insert into public.workflow_steps (workflow_type, orden, nombre, role_id, sla_horas, obligatorio) values
  ('pago_proveedor',    1, 'Revisión de soportes y fiscal',    'asistente_contable',      48, true),
  ('pago_proveedor',    2, 'Validación operativa',             'coord_admin_control',     48, true),
  ('pago_proveedor',    3, 'Ejecución del pago (viernes)',     'coord_admin_financiero', 168, true),
  ('descuento_especial',1, 'Aprobación Dir. Comercial',        'direccion_comercial',     24, true),
  ('descuento_especial',2, 'Aprobación Gerencia',              'gerencia_general',        48, true),
  ('anulacion_venta',   1, 'Visto bueno Dirección Comercial',  'direccion_comercial',     24, true),
  ('anulacion_venta',   2, 'Registro contable',                'asistente_contable',      48, true)
on conflict (workflow_type, orden) do nothing;

-- ---- 3. Rangos de comisión default --------------------------------

insert into public.rangos_comision (orden, hasta, porcentaje) values
  (1, 5000000,  5),
  (2, 10000000, 8),
  (3, null,    10)
on conflict do nothing;

-- ---- 4. Productos iniciales (solo si la tabla está vacía) ---------

insert into public.productos (codigo, nombre, categoria, precio_base, stock, activo)
select * from (values
  ('MESA-RED-2M',  'Mesa redonda 2mts x 80cm con mantel negro', 'Mobiliario',   65000,   40, true),
  ('CAMINO-DOR',   'Camino dorado sobre mesa',                   'Mantelería',  10000,   80, true),
  ('SILLA-TIF',    'Silla Tiffany dorada con cojín blanco',      'Mobiliario',   8000,  300, true),
  ('LUZ-LED',      'Iluminación LED decorativa',                 'Iluminación', 45000,   15, true),
  ('SERV-TRANS',   'Servicio de Transporte en Bogotá',           'Servicios',  200000, null, true)
) as v(codigo, nombre, categoria, precio_base, stock, activo)
where not exists (select 1 from public.productos);
