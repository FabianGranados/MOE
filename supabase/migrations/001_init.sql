-- =====================================================================
-- MOE · Master Operativo de Eventos · Decolounge
-- Migración 001 · Esquema base
--
-- Ejecutar en Supabase SQL Editor en este orden:
--   1. 001_init.sql        (este archivo)
--   2. 002_rls.sql         (Row Level Security)
--   3. 003_seeds.sql       (datos iniciales: roles, permisos, usuarios demo)
-- =====================================================================

-- Extensiones
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =====================================================================
-- ROLES Y PERMISOS (RBAC)
-- =====================================================================

create table if not exists public.roles (
  id           text primary key,                 -- ej: 'gerencia_general'
  nombre       text not null,                    -- "Gerencia General"
  nombre_corto text not null,                    -- "Gerencia"
  nivel        smallint not null,                -- 1-5 según jerarquía
  descripcion  text,
  created_at   timestamptz not null default now()
);

create table if not exists public.permissions (
  id           text primary key,                 -- ej: 'cotizaciones.crear'
  modulo       text not null,                    -- 'cotizaciones', 'pagos', 'inventario'...
  accion       text not null,                    -- 'crear', 'ver', 'editar', 'aprobar', 'validar', 'eliminar'
  descripcion  text
);

create table if not exists public.role_permissions (
  role_id       text references public.roles(id) on delete cascade,
  permission_id text references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.usuarios (
  id          uuid primary key default uuid_generate_v4(),  -- vinculado a auth.users.id
  email       text unique not null,
  nombre      text not null,
  alias       text,
  role_id     text not null references public.roles(id),
  activo      boolean not null default true,
  telefono    text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_usuarios_role on public.usuarios(role_id);

-- =====================================================================
-- AUDIT LOG · trazabilidad obligatoria para ERP
-- =====================================================================

create table if not exists public.audit_log (
  id            bigserial primary key,
  ts            timestamptz not null default now(),
  usuario_id    uuid references public.usuarios(id),
  usuario_nombre text,                           -- snapshot por si se elimina el usuario
  modulo        text not null,
  accion        text not null,                   -- 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'validate' | 'login' | 'view'
  entidad_tipo  text,                            -- 'cotizacion', 'pago', 'producto'...
  entidad_id    text,
  antes         jsonb,
  despues       jsonb,
  ip            text,
  user_agent    text,
  soporte_url   text,                            -- link al archivo adjunto si aplica
  observaciones text
);
create index if not exists idx_audit_entidad on public.audit_log(entidad_tipo, entidad_id);
create index if not exists idx_audit_usuario on public.audit_log(usuario_id);
create index if not exists idx_audit_ts on public.audit_log(ts desc);

-- =====================================================================
-- CATÁLOGO DE PRODUCTOS
-- =====================================================================

create table if not exists public.productos (
  id          uuid primary key default uuid_generate_v4(),
  codigo      text unique,
  nombre      text not null,
  categoria   text not null,
  precio_base numeric(14,2) not null default 0,
  stock       integer,                            -- null = sin límite (servicios)
  foto_url    text,
  activo      boolean not null default true,
  created_by  uuid references public.usuarios(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =====================================================================
-- COTIZACIONES (CORE)
-- =====================================================================

create table if not exists public.cotizaciones (
  id                     uuid primary key default uuid_generate_v4(),
  numero                 text not null,           -- '260001'
  version                smallint not null default 1,
  tipo_documento         text not null default 'COTIZACION',  -- COTIZACION | REMISION
  estado                 text not null default 'EN ESPERA',   -- EN ESPERA | VENDIDO | PERDIDO
  finalizado             boolean not null default false,
  motivo_perdida         text,

  -- Cliente
  razon_social           text,
  tipo_persona           text default 'JURIDICA',             -- JURIDICA | NATURAL | EXTRANJERA
  tipo_doc_id            text default 'NIT',                  -- NIT | CC | CE | PASAPORTE
  numero_doc_id          text,
  tipo_cliente           text,                                -- Hotel | Agencia de Eventos | ...

  -- Contacto comercial
  contacto_nombre        text,
  contacto_telefono      text,
  contacto_email         text,

  -- Evento
  fecha_evento           date,
  tipo_evento            text,
  horario_evento         jsonb default '{"tipo":"abierto","franja":"tarde","hora":""}'::jsonb,
  direccion              text,
  ciudad                 text,
  maps_url               text,

  -- Operación (logística)
  montaje                jsonb default '{"fecha":"","tipo":"abierto","franja":"manana","hora":""}'::jsonb,
  desmontaje             jsonb default '{"fecha":"","tipo":"abierto","franja":"tarde","hora":""}'::jsonb,
  personas_montaje       jsonb default '[{"nombre":"","celular":""},{"nombre":"","celular":""}]'::jsonb,
  personas_desmontaje    jsonb default '[{"nombre":"","celular":""},{"nombre":"","celular":""}]'::jsonb,
  notas_operativas       text,

  -- Proveedor externo (conecta con CAC)
  lleva_proveedor_externo boolean not null default false,
  proveedor_externo_notas text,

  -- Pago
  forma_pago             text default 'CONTADO',              -- CONTADO | CREDICONTADO | CREDITO

  -- Comercial
  comercial_alias        text,                                -- snapshot
  comercial_id           uuid references public.usuarios(id),
  comentarios            text,

  -- Timestamps clave
  fecha_creacion         date not null default current_date,
  fecha_confirmacion_venta timestamptz,
  horarios_confirmados   boolean default false,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  unique (numero, version)
);
create index if not exists idx_cotizaciones_estado on public.cotizaciones(estado) where finalizado = true;
create index if not exists idx_cotizaciones_fecha on public.cotizaciones(fecha_evento);
create index if not exists idx_cotizaciones_comercial on public.cotizaciones(comercial_id);

-- Items de la cotización
create table if not exists public.cotizacion_items (
  id             uuid primary key default uuid_generate_v4(),
  cotizacion_id  uuid not null references public.cotizaciones(id) on delete cascade,
  producto_id    uuid references public.productos(id),        -- null si es manual
  codigo         text,
  nombre         text not null,
  categoria      text,
  foto_url       text,
  cantidad       integer not null default 1,
  dias           integer not null default 1,
  precio_base    numeric(14,2) not null default 0,
  precio_manual  numeric(14,2),                                -- override, null = usar auto
  orden          integer default 0,
  created_at     timestamptz not null default now()
);
create index if not exists idx_items_cotizacion on public.cotizacion_items(cotizacion_id);

-- Pagos del cliente
create table if not exists public.pagos (
  id              uuid primary key default uuid_generate_v4(),
  cotizacion_id   uuid not null references public.cotizaciones(id) on delete cascade,
  tipo_pago       text,                                       -- ANTICIPO_50 | ANTICIPO_PARC | TOTAL_100
  monto           numeric(14,2) not null,
  fecha           date not null,
  metodo          text,                                       -- Transferencia | Efectivo | Tarjeta | Cheque
  banco           text,
  referencia      text,
  notas           text,
  foto_url        text,
  validado        boolean not null default false,
  validado_por    uuid references public.usuarios(id),
  validado_en     timestamptz,
  registrado_por  uuid references public.usuarios(id),
  registrado_en   timestamptz not null default now()
);
create index if not exists idx_pagos_cotizacion on public.pagos(cotizacion_id);
create index if not exists idx_pagos_sin_validar on public.pagos(validado) where validado = false;

-- Historial editorial (diff de campos de la cotización)
create table if not exists public.cotizacion_historial (
  id             bigserial primary key,
  cotizacion_id  uuid not null references public.cotizaciones(id) on delete cascade,
  campo          text not null,
  label          text,
  anterior       text,
  nuevo          text,
  usuario_id     uuid references public.usuarios(id),
  usuario_nombre text,
  ts             timestamptz not null default now()
);
create index if not exists idx_hist_cotizacion on public.cotizacion_historial(cotizacion_id, ts desc);

-- =====================================================================
-- COMISIONES
-- =====================================================================

create table if not exists public.rangos_comision (
  id          smallserial primary key,
  orden       smallint not null,
  hasta       numeric(14,2),                        -- null = sin límite (último rango)
  porcentaje  numeric(5,2) not null,
  activo_desde date not null default current_date,
  activo_hasta date                                  -- null = vigente
);

-- =====================================================================
-- WORKFLOW ENGINE GENÉRICO
--
-- Permite definir cadenas de aprobación configurables sin programar.
-- Ejemplos de uso:
--   - Pago a proveedor: Contable → CAC → Financiera
--   - Descuento mayor al X%: Comercial → Dir. Comercial → Gerencia
--   - Anulación de cotización: Comercial → Coord. Comercial
-- =====================================================================

create table if not exists public.workflow_types (
  id            text primary key,                   -- 'pago_proveedor', 'descuento_especial', 'anulacion'
  nombre        text not null,
  descripcion   text,
  activo        boolean not null default true
);

create table if not exists public.workflow_steps (
  id            serial primary key,
  workflow_type text not null references public.workflow_types(id) on delete cascade,
  orden         smallint not null,
  nombre        text not null,                      -- 'Revisión contable', 'Validación CAC', 'Ejecución pago'
  role_id       text not null references public.roles(id),
  sla_horas     integer default 48,                 -- escala si se pasa
  obligatorio   boolean not null default true,
  unique (workflow_type, orden)
);

create table if not exists public.workflow_instances (
  id              uuid primary key default uuid_generate_v4(),
  workflow_type   text not null references public.workflow_types(id),
  entidad_tipo    text not null,                    -- 'pago_proveedor', 'cotizacion'...
  entidad_id      text not null,
  estado          text not null default 'en_curso', -- en_curso | aprobado | rechazado | cancelado
  step_actual     smallint,
  iniciado_por    uuid references public.usuarios(id),
  iniciado_en     timestamptz not null default now(),
  cerrado_en      timestamptz,
  resumen         text
);
create index if not exists idx_wf_estado on public.workflow_instances(estado, step_actual);

create table if not exists public.workflow_approvals (
  id              uuid primary key default uuid_generate_v4(),
  instance_id     uuid not null references public.workflow_instances(id) on delete cascade,
  step_orden      smallint not null,
  step_nombre     text,
  estado          text not null default 'pendiente',-- pendiente | aprobado | rechazado
  asignado_a      text references public.roles(id), -- rol responsable
  resuelto_por    uuid references public.usuarios(id),
  resuelto_en     timestamptz,
  comentario      text,
  soporte_url     text,
  sla_vence_en    timestamptz
);
create index if not exists idx_approvals_pendientes on public.workflow_approvals(asignado_a, estado) where estado = 'pendiente';

-- =====================================================================
-- PROVEEDORES EXTERNOS
-- =====================================================================

create table if not exists public.proveedores (
  id           uuid primary key default uuid_generate_v4(),
  nombre       text not null,
  nit          text,
  contacto     text,
  telefono     text,
  email        text,
  banco        text,
  cuenta       text,
  activo       boolean not null default true,
  aprobado_cac boolean not null default false,       -- visto bueno del CAC
  created_at   timestamptz not null default now()
);

create table if not exists public.proveedor_cotizaciones (
  id             uuid primary key default uuid_generate_v4(),
  cotizacion_id  uuid not null references public.cotizaciones(id) on delete cascade,
  proveedor_id   uuid references public.proveedores(id),
  concepto       text not null,
  valor          numeric(14,2) not null,
  soporte_url    text,                                -- cotización del proveedor
  estado         text not null default 'pendiente',   -- pendiente | aprobado | rechazado | pagado
  workflow_id    uuid references public.workflow_instances(id),
  subido_por     uuid references public.usuarios(id),
  subido_en      timestamptz not null default now()
);

-- =====================================================================
-- TRIGGER · mantener updated_at
-- =====================================================================

create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_cotizaciones before update on public.cotizaciones
  for each row execute function public.tg_set_updated_at();
create trigger set_updated_at_productos before update on public.productos
  for each row execute function public.tg_set_updated_at();
create trigger set_updated_at_usuarios before update on public.usuarios
  for each row execute function public.tg_set_updated_at();
