-- =====================================================================
-- MOE · Row Level Security (RLS)
--
-- Reglas de visibilidad y mutación por rol. Esta capa garantiza que
-- aunque alguien conozca la URL o la API key pública, SOLO verá lo
-- que su rol le permite.
-- =====================================================================

-- Helper: ¿cuál es el rol del usuario autenticado?
--
-- IMPORTANTE: estas funciones deben ser 'security definer' para NO
-- disparar las policies de la tabla public.usuarios que consultan.
-- Sin esto se genera recursión infinita (stack depth error 54001)
-- cuando alguna policy usa my_role() en la misma tabla usuarios.
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role_id from public.usuarios where id = auth.uid();
$$;

create or replace function public.my_alias()
returns text language sql stable security definer set search_path = public as $$
  select alias from public.usuarios where id = auth.uid();
$$;

create or replace function public.has_perm(p_permission text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.role_permissions rp
    join public.usuarios u on u.role_id = rp.role_id
    where u.id = auth.uid() and rp.permission_id = p_permission
  );
$$;

-- =====================================================================
-- Habilitar RLS en todas las tablas sensibles
-- =====================================================================

alter table public.usuarios               enable row level security;
alter table public.roles                  enable row level security;
alter table public.permissions            enable row level security;
alter table public.role_permissions       enable row level security;
alter table public.audit_log              enable row level security;
alter table public.productos              enable row level security;
alter table public.cotizaciones           enable row level security;
alter table public.cotizacion_items       enable row level security;
alter table public.cotizacion_historial   enable row level security;
alter table public.pagos                  enable row level security;
alter table public.rangos_comision        enable row level security;
alter table public.workflow_types         enable row level security;
alter table public.workflow_steps         enable row level security;
alter table public.workflow_instances     enable row level security;
alter table public.workflow_approvals     enable row level security;
alter table public.proveedores            enable row level security;
alter table public.proveedor_cotizaciones enable row level security;

-- =====================================================================
-- Políticas · Usuarios
-- =====================================================================

-- Cualquier autenticado ve la lista de usuarios (para asignaciones)
create policy usuarios_select_all on public.usuarios
  for select using (auth.uid() is not null);

-- Solo Gerencia / RRHH pueden editar usuarios
create policy usuarios_write_rh on public.usuarios
  for all using (public.my_role() in ('gerencia_general', 'rrhh_sst'));

-- Un usuario puede editar su propio perfil (nombre, avatar, teléfono)
create policy usuarios_update_self on public.usuarios
  for update using (id = auth.uid()) with check (id = auth.uid());

-- =====================================================================
-- Políticas · Catálogo de permisos (solo lectura para autenticados)
-- =====================================================================

create policy roles_read on public.roles
  for select using (auth.uid() is not null);
create policy permissions_read on public.permissions
  for select using (auth.uid() is not null);
create policy role_permissions_read on public.role_permissions
  for select using (auth.uid() is not null);

-- =====================================================================
-- Políticas · Audit log
-- =====================================================================

-- Solo Gerencia y Contador Externo ven el audit completo
create policy audit_read on public.audit_log
  for select using (
    public.my_role() in ('gerencia_general', 'contador_externo', 'coord_admin_control')
  );

-- Cualquier rol puede insertar eventos en el audit (los hooks de la app)
create policy audit_insert on public.audit_log
  for insert with check (auth.uid() is not null);

-- =====================================================================
-- Políticas · Productos (Catálogo)
-- =====================================================================

-- Todos los autenticados pueden ver el catálogo
create policy productos_select on public.productos
  for select using (auth.uid() is not null);

-- Quienes pueden editar: Gerencia, Bodega, Dir. Comercial, Coord. Comercial
create policy productos_write on public.productos
  for all using (
    public.my_role() in (
      'gerencia_general', 'jefe_bodega', 'direccion_comercial'
    )
  );

-- =====================================================================
-- Políticas · Cotizaciones
-- =====================================================================

-- Asesor ve solo las suyas. Los demás roles operativos y directivos ven todo.
create policy cotizaciones_select on public.cotizaciones
  for select using (
    public.my_role() in (
      'gerencia_general', 'coord_admin_financiero', 'coord_admin_control',
      'direccion_comercial',
      'jefe_bodega', 'coord_logistica', 'asistente_contable', 'contador_externo'
    )
    or (public.my_role() = 'asesor_comercial' and comercial_id = auth.uid())
  );

-- Crear: asesores, dirección comercial, gerencia
create policy cotizaciones_insert on public.cotizaciones
  for insert with check (
    public.my_role() in ('asesor_comercial', 'direccion_comercial', 'gerencia_general')
  );

-- Actualizar: dueño (asesor) o supervisión comercial / gerencia / bodega (para logística)
create policy cotizaciones_update on public.cotizaciones
  for update using (
    (public.my_role() = 'asesor_comercial' and comercial_id = auth.uid())
    or public.my_role() in (
      'gerencia_general', 'direccion_comercial',
      'jefe_bodega', 'coord_logistica'
    )
  );

-- Borrar: solo Gerencia
create policy cotizaciones_delete on public.cotizaciones
  for delete using (public.my_role() = 'gerencia_general');

-- Items siguen la misma lógica de la cotización padre
create policy items_all on public.cotizacion_items
  for all using (
    exists(select 1 from public.cotizaciones c where c.id = cotizacion_id)
  );

create policy historial_all on public.cotizacion_historial
  for all using (
    exists(select 1 from public.cotizaciones c where c.id = cotizacion_id)
  );

-- =====================================================================
-- Políticas · Pagos
-- =====================================================================

-- Ver: comercial dueño, contabilidad, gerencia, control
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

-- Insertar: el comercial que vende sube el pago
create policy pagos_insert on public.pagos
  for insert with check (
    public.my_role() in (
      'asesor_comercial', 'direccion_comercial', 'gerencia_general'
    )
  );

-- Validar pagos: solo contabilidad y gerencia. El comercial NO valida sus propios pagos.
create policy pagos_update on public.pagos
  for update using (
    public.my_role() in ('gerencia_general', 'asistente_contable', 'coord_admin_financiero')
  );

-- =====================================================================
-- Políticas · Comisiones
-- =====================================================================

create policy rangos_read on public.rangos_comision
  for select using (auth.uid() is not null);

create policy rangos_write on public.rangos_comision
  for all using (
    public.my_role() in ('gerencia_general', 'coord_admin_financiero', 'contador_externo')
  );

-- =====================================================================
-- Políticas · Workflows
-- =====================================================================

create policy wf_types_read on public.workflow_types for select using (auth.uid() is not null);
create policy wf_types_write on public.workflow_types for all
  using (public.my_role() = 'gerencia_general');

create policy wf_steps_read on public.workflow_steps for select using (auth.uid() is not null);
create policy wf_steps_write on public.workflow_steps for all
  using (public.my_role() = 'gerencia_general');

-- Instancias: ven todos los involucrados (quien inicia + quienes deben aprobar)
create policy wf_instances_read on public.workflow_instances
  for select using (
    iniciado_por = auth.uid()
    or exists (
      select 1 from public.workflow_approvals a
      where a.instance_id = id and a.asignado_a = public.my_role()
    )
    or public.my_role() in ('gerencia_general', 'contador_externo')
  );

create policy wf_instances_insert on public.workflow_instances
  for insert with check (auth.uid() is not null);

create policy wf_instances_update on public.workflow_instances
  for update using (
    public.my_role() in ('gerencia_general', 'coord_admin_control', 'coord_admin_financiero')
  );

create policy wf_approvals_read on public.workflow_approvals
  for select using (
    asignado_a = public.my_role()
    or public.my_role() in ('gerencia_general', 'contador_externo')
    or exists (
      select 1 from public.workflow_instances wi
      where wi.id = instance_id and wi.iniciado_por = auth.uid()
    )
  );

create policy wf_approvals_update on public.workflow_approvals
  for update using (asignado_a = public.my_role());

-- =====================================================================
-- Políticas · Proveedores
-- =====================================================================

create policy proveedores_read on public.proveedores
  for select using (auth.uid() is not null);

create policy proveedores_write on public.proveedores
  for all using (
    public.my_role() in (
      'gerencia_general', 'coord_admin_control', 'coord_admin_financiero', 'asistente_contable'
    )
  );

create policy proveedor_cots_read on public.proveedor_cotizaciones
  for select using (
    subido_por = auth.uid()
    or public.my_role() in (
      'gerencia_general', 'coord_admin_control', 'coord_admin_financiero',
      'asistente_contable', 'contador_externo', 'direccion_comercial'
    )
  );

create policy proveedor_cots_insert on public.proveedor_cotizaciones
  for insert with check (
    public.my_role() in ('asesor_comercial', 'direccion_comercial')
  );

create policy proveedor_cots_update on public.proveedor_cotizaciones
  for update using (
    public.my_role() in (
      'gerencia_general', 'coord_admin_control', 'coord_admin_financiero', 'asistente_contable'
    )
  );
