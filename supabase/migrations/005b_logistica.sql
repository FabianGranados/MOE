-- =====================================================================
-- MOE · Migración 005b · Pilar Logística
--
-- Cubre:
--   · Vehículos (4 placas iniciales)
--   · Personal logístico (conductores, auxiliares, mantenimiento)
--   · Chequeo diario de vehículo (pre-salida)
--   · Rutas (programación del día — reemplaza el WhatsApp de Jose Miguel)
--   · Crews (quiénes van en cada ruta)
--   · Paradas (montaje/desmontaje/entrega bodega/recibe bodega/alistamiento)
--   · Remisiones (entrega firmada digitalmente con foto + CC)
--   · Daños reportados (por unidad de inventario)
--
-- Roles:
--   · jefe_bodega          — ya existe, arma rutas y aprueba daños
--   · coord_logistica      — ya existe
--   · logistico_campo      — NUEVO · conductores y auxiliares en calle
-- =====================================================================

-- =====================================================================
-- NUEVO ROL · logistico_campo
-- =====================================================================
insert into public.roles (id, nombre, nombre_corto, nivel, descripcion) values
  ('logistico_campo', 'Logístico de Campo', 'Logístico', 5,
   'Conductor o auxiliar. Solo ve sus rutas del día, firma remisiones, sube fotos, reporta daños. NO ve precios ni nada financiero.')
on conflict (id) do nothing;

-- =====================================================================
-- VEHÍCULOS
-- =====================================================================
create table if not exists public.vehiculos (
  id                 uuid primary key default uuid_generate_v4(),
  placa              text unique not null,
  marca              text,
  modelo             text,
  anio               smallint,
  tipo               text default 'camion',     -- camion | furgon | van | otros
  capacidad_m3       numeric(8,2),
  kilometraje_actual integer default 0,
  soat_vence         date,
  tecno_vence        date,
  proximo_mantenim   date,
  activo             boolean not null default true,
  observaciones      text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

insert into public.vehiculos (placa, tipo) values
  ('TTY138', 'camion'),
  ('WEQ117', 'camion'),
  ('WOU262', 'camion'),
  ('LJV347', 'camion')
on conflict (placa) do nothing;

-- =====================================================================
-- PERSONAL LOGÍSTICO
-- Puede o no estar vinculado a un user de MOE (usuario_id nullable).
-- =====================================================================
create table if not exists public.personal_logistico (
  id              uuid primary key default uuid_generate_v4(),
  usuario_id      uuid references public.usuarios(id),    -- null si no tiene cuenta MOE
  nombre          text not null,
  cedula          text,
  telefono        text,
  cargo           text not null,                          -- conductor | auxiliar | mantenimiento | jefe
  licencia_num    text,                                   -- solo conductores
  licencia_cat    text,
  licencia_vence  date,
  activo          boolean not null default true,
  externo         boolean not null default false,         -- true = subcontratado
  observaciones   text,
  created_at      timestamptz not null default now()
);
create index if not exists idx_personal_cargo on public.personal_logistico(cargo) where activo = true;

-- =====================================================================
-- CHEQUEO DIARIO DE VEHÍCULO (pre-salida)
-- =====================================================================
create table if not exists public.vehiculo_chequeos (
  id                  uuid primary key default uuid_generate_v4(),
  vehiculo_id         uuid not null references public.vehiculos(id),
  fecha               date not null default current_date,
  hora                time not null default current_time,
  kilometraje         integer not null,
  combustible_pct     smallint check (combustible_pct between 0 and 100),
  luces_ok            boolean not null default true,
  llantas_ok          boolean not null default true,
  niveles_ok          boolean not null default true,    -- aceite, refrigerante, frenos
  documentos_ok       boolean not null default true,    -- SOAT, tecno, tarjeta
  observaciones       text,
  fotos               jsonb default '[]'::jsonb,        -- array de URLs
  realizado_por       uuid references public.personal_logistico(id),
  realizado_por_user  uuid references public.usuarios(id),
  created_at          timestamptz not null default now()
);
create index if not exists idx_chequeos_vehiculo on public.vehiculo_chequeos(vehiculo_id, fecha desc);

-- =====================================================================
-- RUTAS (programación del día)
-- Un evento puede tener N rutas (vehículos múltiples).
-- =====================================================================
create table if not exists public.rutas_logistica (
  id              uuid primary key default uuid_generate_v4(),
  fecha           date not null,
  vehiculo_id     uuid references public.vehiculos(id),       -- null si transporte externo
  externa         boolean not null default false,              -- true = transporte contratado
  proveedor_id    uuid references public.proveedores(id),      -- si externa
  conductor_id    uuid references public.personal_logistico(id),
  hora_inicio     time,
  estado          text not null default 'programada',          -- programada | en_curso | completada | cancelada
  km_inicio       integer,
  km_fin          integer,
  observaciones   text,
  creada_por      uuid references public.usuarios(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_rutas_fecha on public.rutas_logistica(fecha, estado);
create index if not exists idx_rutas_vehiculo on public.rutas_logistica(vehiculo_id, fecha);

-- =====================================================================
-- CREWS (quiénes van en la ruta)
-- =====================================================================
create table if not exists public.ruta_personal (
  ruta_id      uuid not null references public.rutas_logistica(id) on delete cascade,
  personal_id  uuid not null references public.personal_logistico(id),
  rol_en_ruta  text not null,                               -- conductor | auxiliar
  primary key (ruta_id, personal_id)
);

-- =====================================================================
-- PARADAS DE LA RUTA (montaje, desmontaje, etc.)
-- =====================================================================
create table if not exists public.ruta_paradas (
  id                uuid primary key default uuid_generate_v4(),
  ruta_id           uuid not null references public.rutas_logistica(id) on delete cascade,
  orden             smallint not null,
  tipo              text not null,                          -- MONTAJE | DESMONTAJE | ENTREGA_BODEGA | RECIBE_BODEGA | ALISTAMIENTO
  cotizacion_id     uuid references public.cotizaciones(id),
  hora_programada   time,
  hora_llegada      timestamptz,
  hora_salida       timestamptz,
  estado            text not null default 'pendiente',      -- pendiente | en_curso | completada | omitida
  fotos             jsonb default '[]'::jsonb,              -- "montaje listo"
  observaciones     text,
  created_at        timestamptz not null default now()
);
create index if not exists idx_paradas_ruta on public.ruta_paradas(ruta_id, orden);
create index if not exists idx_paradas_cotizacion on public.ruta_paradas(cotizacion_id);

-- =====================================================================
-- REMISIONES (entrega firmada por cliente)
-- Reemplaza la remisión en papel (Decolounge SAS NIT 901473035-5).
-- =====================================================================
create table if not exists public.remisiones (
  id                       uuid primary key default uuid_generate_v4(),
  numero                   text unique not null,            -- correlativo legal
  cotizacion_id            uuid not null references public.cotizaciones(id),
  parada_id                uuid references public.ruta_paradas(id),
  tipo                     text not null,                   -- ENTREGA | DESMONTAJE
  empresa_id               text not null default 'decolounge' references public.empresas(id),
  fecha_emision            timestamptz not null default now(),
  fecha_entrega_prog       date,
  hora_entrega_prog        text,                            -- "9:00 am a 10:00 am"
  fecha_desmontaje_prog    date,
  hora_desmontaje_prog     text,
  contacto_nombre          text,
  contacto_cedula          text,
  contacto_telefono        text,
  direccion                text,
  lugar                    text,                            -- ej. "Stand India - Pabellón"
  -- Firmas digitales
  firma_entrega_url        text,
  firma_entrega_nombre     text,
  firma_entrega_cedula     text,
  firma_entrega_en         timestamptz,
  firma_desmontaje_url     text,
  firma_desmontaje_nombre  text,
  firma_desmontaje_cedula  text,
  firma_desmontaje_en      timestamptz,
  fotos_montaje            jsonb default '[]'::jsonb,
  pdf_url                  text,
  observaciones            text,
  created_at               timestamptz not null default now()
);
create index if not exists idx_remisiones_cotizacion on public.remisiones(cotizacion_id);

-- =====================================================================
-- DAÑOS REPORTADOS
-- =====================================================================
create table if not exists public.danos_reportados (
  id                  uuid primary key default uuid_generate_v4(),
  ruta_id             uuid references public.rutas_logistica(id),
  cotizacion_id       uuid references public.cotizaciones(id),
  cotizacion_item_id  uuid references public.cotizacion_items(id),
  unidad_codigo       text,                                 -- código individual (cuando exista inventario_unidades)
  descripcion         text not null,
  fotos               jsonb default '[]'::jsonb,
  costo_estimado      numeric(14,2),
  imputable_cliente   boolean not null default false,
  estado              text not null default 'reportado',    -- reportado | aprobado | cobrado | descartado
  reportado_por       uuid references public.usuarios(id),
  reportado_en        timestamptz not null default now(),
  resuelto_por        uuid references public.usuarios(id),
  resuelto_en         timestamptz,
  resolucion_notas    text
);
create index if not exists idx_danos_estado on public.danos_reportados(estado, reportado_en desc);

-- =====================================================================
-- TRIGGERS · updated_at
-- =====================================================================
create trigger set_updated_at_vehiculos before update on public.vehiculos
  for each row execute function public.tg_set_updated_at();
create trigger set_updated_at_rutas before update on public.rutas_logistica
  for each row execute function public.tg_set_updated_at();

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.vehiculos             enable row level security;
alter table public.personal_logistico    enable row level security;
alter table public.vehiculo_chequeos     enable row level security;
alter table public.rutas_logistica       enable row level security;
alter table public.ruta_personal         enable row level security;
alter table public.ruta_paradas          enable row level security;
alter table public.remisiones            enable row level security;
alter table public.danos_reportados      enable row level security;

-- Vehículos: lectura para todos los autenticados (catálogo); escritura jefes
create policy vehiculos_read on public.vehiculos
  for select using (auth.uid() is not null);
create policy vehiculos_write on public.vehiculos
  for all using (
    public.my_role() in ('gerencia_general', 'jefe_bodega', 'coord_logistica')
  );

-- Personal logístico: lectura para roles operativos
create policy personal_read on public.personal_logistico
  for select using (
    public.my_role() in (
      'gerencia_general', 'jefe_bodega', 'coord_logistica',
      'rrhh_sst', 'direccion_comercial'
    )
    or usuario_id = auth.uid()
  );
create policy personal_write on public.personal_logistico
  for all using (
    public.my_role() in ('gerencia_general', 'jefe_bodega', 'coord_logistica', 'rrhh_sst')
  );

-- Chequeos: el logístico ve los suyos; jefes ven todos
create policy chequeos_read on public.vehiculo_chequeos
  for select using (
    public.my_role() in ('gerencia_general', 'jefe_bodega', 'coord_logistica')
    or realizado_por_user = auth.uid()
  );
create policy chequeos_insert on public.vehiculo_chequeos
  for insert with check (
    public.my_role() in (
      'gerencia_general', 'jefe_bodega', 'coord_logistica', 'logistico_campo'
    )
  );

-- Rutas: jefes editan, logístico solo ve las suyas
create policy rutas_read on public.rutas_logistica
  for select using (
    public.my_role() in (
      'gerencia_general', 'jefe_bodega', 'coord_logistica',
      'direccion_comercial', 'asesor_comercial'
    )
    or exists (
      select 1 from public.ruta_personal rp
      join public.personal_logistico pl on pl.id = rp.personal_id
      where rp.ruta_id = id and pl.usuario_id = auth.uid()
    )
  );
create policy rutas_write on public.rutas_logistica
  for all using (
    public.my_role() in ('gerencia_general', 'jefe_bodega', 'coord_logistica')
  );

-- Crews: hereda de la ruta (jefes editan; logístico ve si está asignado)
create policy ruta_pers_read on public.ruta_personal
  for select using (
    public.my_role() in ('gerencia_general', 'jefe_bodega', 'coord_logistica')
    or exists (
      select 1 from public.personal_logistico pl
      where pl.id = personal_id and pl.usuario_id = auth.uid()
    )
  );
create policy ruta_pers_write on public.ruta_personal
  for all using (
    public.my_role() in ('gerencia_general', 'jefe_bodega', 'coord_logistica')
  );

-- Paradas: similar
create policy paradas_read on public.ruta_paradas
  for select using (
    public.my_role() in (
      'gerencia_general', 'jefe_bodega', 'coord_logistica',
      'direccion_comercial', 'asesor_comercial'
    )
    or exists (
      select 1 from public.rutas_logistica r
      join public.ruta_personal rp on rp.ruta_id = r.id
      join public.personal_logistico pl on pl.id = rp.personal_id
      where r.id = ruta_id and pl.usuario_id = auth.uid()
    )
  );
create policy paradas_update on public.ruta_paradas
  for update using (
    public.my_role() in ('gerencia_general', 'jefe_bodega', 'coord_logistica', 'logistico_campo')
  );
create policy paradas_insert on public.ruta_paradas
  for insert with check (
    public.my_role() in ('gerencia_general', 'jefe_bodega', 'coord_logistica')
  );

-- Remisiones: comerciales y logística las ven; logístico_campo solo lectura
create policy remisiones_read on public.remisiones
  for select using (
    public.my_role() in (
      'gerencia_general', 'jefe_bodega', 'coord_logistica',
      'direccion_comercial', 'asesor_comercial', 'asistente_contable',
      'coord_admin_control', 'logistico_campo'
    )
  );
create policy remisiones_write on public.remisiones
  for all using (
    public.my_role() in (
      'gerencia_general', 'jefe_bodega', 'coord_logistica',
      'direccion_comercial', 'asesor_comercial'
    )
  );

-- Daños: el logístico_campo solo puede insertar y ver; jefes editan/aprueban
create policy danos_read on public.danos_reportados
  for select using (
    public.my_role() in (
      'gerencia_general', 'jefe_bodega', 'coord_logistica',
      'direccion_comercial', 'asesor_comercial', 'coord_admin_control', 'logistico_campo'
    )
  );
create policy danos_insert on public.danos_reportados
  for insert with check (
    public.my_role() in (
      'gerencia_general', 'jefe_bodega', 'coord_logistica', 'logistico_campo'
    )
  );
create policy danos_update on public.danos_reportados
  for update using (
    public.my_role() in ('gerencia_general', 'jefe_bodega', 'coord_logistica', 'direccion_comercial')
  );
