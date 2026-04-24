-- =====================================================================
-- MOE · Migración 005c · Inventario Individual
--
-- Cada unidad física tiene un código único (ej. SILLA-TIFFANY-0001).
-- Permite saber en tiempo real:
--   · Cuántas unidades hay disponibles para una fecha (sin doble venta)
--   · Dónde está cada unidad (bodega, evento X, reparación)
--   · Cuántas se han dañado y cuándo
--   · Costo de mantenimiento por unidad / por modelo
--
-- Esto reemplaza el concepto de "stock agregado" por "trazabilidad por
-- unidad", que es como Decolounge realmente lleva el inventario.
-- =====================================================================

-- =====================================================================
-- UNIDADES INDIVIDUALES
-- =====================================================================
create table if not exists public.inventario_unidades (
  id                  uuid primary key default uuid_generate_v4(),
  producto_id         uuid not null references public.productos(id),
  codigo_unidad       text unique not null,                -- 'SILLA-TIFFANY-0001'
  estado              text not null default 'disponible',  -- disponible | en_alquiler | en_reparacion | dado_baja | extraviado
  ubicacion           text default 'bodega',               -- bodega | evento | reparacion | externo
  fecha_ingreso       date default current_date,
  costo_compra        numeric(14,2),
  proveedor_id        uuid references public.proveedores(id),
  veces_alquilado     integer not null default 0,
  ultimo_evento_id    uuid references public.cotizaciones(id),
  ultimo_uso          date,
  observaciones       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists idx_unidades_producto on public.inventario_unidades(producto_id, estado);
create index if not exists idx_unidades_estado on public.inventario_unidades(estado);

-- =====================================================================
-- BLOQUEOS POR FECHA (reservas para eventos)
-- Una unidad se bloquea entre fecha_desde y fecha_hasta para un evento.
-- Permite calcular disponibilidad: una unidad NO está disponible si
-- tiene un bloqueo activo que cruce con las fechas que pide el comercial.
-- =====================================================================
create table if not exists public.inventario_bloqueos (
  id                  uuid primary key default uuid_generate_v4(),
  unidad_id           uuid not null references public.inventario_unidades(id) on delete cascade,
  cotizacion_id       uuid not null references public.cotizaciones(id) on delete cascade,
  cotizacion_item_id  uuid references public.cotizacion_items(id) on delete cascade,
  fecha_desde         date not null,                       -- día de montaje
  fecha_hasta         date not null,                       -- día de desmontaje
  estado              text not null default 'reservada',   -- reservada | en_uso | devuelta | cancelada
  reservado_por       uuid references public.usuarios(id),
  reservado_en        timestamptz not null default now(),
  liberado_en         timestamptz,
  observaciones       text,
  check (fecha_hasta >= fecha_desde)
);
create index if not exists idx_bloqueos_unidad on public.inventario_bloqueos(unidad_id, fecha_desde, fecha_hasta);
create index if not exists idx_bloqueos_cotizacion on public.inventario_bloqueos(cotizacion_id);
create index if not exists idx_bloqueos_estado on public.inventario_bloqueos(estado) where estado in ('reservada', 'en_uso');

-- =====================================================================
-- MOVIMIENTOS (bitácora de entradas/salidas)
-- =====================================================================
create table if not exists public.inventario_movimientos (
  id              uuid primary key default uuid_generate_v4(),
  unidad_id       uuid not null references public.inventario_unidades(id) on delete cascade,
  tipo            text not null,                          -- salida_evento | retorno_evento | salida_reparacion | retorno_reparacion | baja | ingreso
  fecha           timestamptz not null default now(),
  cotizacion_id   uuid references public.cotizaciones(id),
  ruta_id         uuid references public.rutas_logistica(id),
  destino         text,                                    -- texto libre cuando no aplica relación
  realizado_por   uuid references public.usuarios(id),
  observaciones   text
);
create index if not exists idx_mov_unidad on public.inventario_movimientos(unidad_id, fecha desc);

-- =====================================================================
-- MANTENIMIENTOS POR UNIDAD
-- =====================================================================
create table if not exists public.inventario_mantenimientos (
  id              uuid primary key default uuid_generate_v4(),
  unidad_id       uuid not null references public.inventario_unidades(id),
  fecha_inicio    date not null default current_date,
  fecha_fin       date,
  motivo          text not null,                          -- 'rotura', 'pintura', 'limpieza profunda', etc
  costo           numeric(14,2),
  responsable     uuid references public.personal_logistico(id),
  estado          text not null default 'en_curso',       -- en_curso | completado | descartado
  observaciones   text,
  fotos           jsonb default '[]'::jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists idx_mant_unidad on public.inventario_mantenimientos(unidad_id);
create index if not exists idx_mant_estado on public.inventario_mantenimientos(estado) where estado = 'en_curso';

-- =====================================================================
-- TRIGGER · updated_at en unidades
-- =====================================================================
create trigger set_updated_at_unidades before update on public.inventario_unidades
  for each row execute function public.tg_set_updated_at();

-- =====================================================================
-- FUNCIÓN · disponibilidad de un producto entre fechas
-- Devuelve cuántas unidades del producto están libres para X período.
-- =====================================================================
create or replace function public.disponibles_entre(
  p_producto_id uuid,
  p_desde date,
  p_hasta date
) returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int
  from public.inventario_unidades u
  where u.producto_id = p_producto_id
    and u.estado = 'disponible'
    and not exists (
      select 1
      from public.inventario_bloqueos b
      where b.unidad_id = u.id
        and b.estado in ('reservada', 'en_uso')
        and b.fecha_desde <= p_hasta
        and b.fecha_hasta >= p_desde
    );
$$;

-- =====================================================================
-- RLS
-- Inventario lo ven comerciales (para verificar disponibilidad), bodega
-- y gerencia. Solo bodega/gerencia pueden modificar unidades.
-- =====================================================================
alter table public.inventario_unidades        enable row level security;
alter table public.inventario_bloqueos        enable row level security;
alter table public.inventario_movimientos     enable row level security;
alter table public.inventario_mantenimientos  enable row level security;

-- Lectura amplia (todos los autenticados ven el inventario disponible)
create policy unidades_read on public.inventario_unidades
  for select using (auth.uid() is not null);
create policy unidades_write on public.inventario_unidades
  for all using (
    public.my_role() in (
      'gerencia_general', 'jefe_bodega', 'coord_logistica', 'direccion_comercial'
    )
  );

-- Bloqueos: lectura amplia, escritura por comerciales (al cotizar)
create policy bloqueos_read on public.inventario_bloqueos
  for select using (auth.uid() is not null);
create policy bloqueos_write on public.inventario_bloqueos
  for all using (
    public.my_role() in (
      'gerencia_general', 'jefe_bodega', 'coord_logistica',
      'direccion_comercial', 'asesor_comercial'
    )
  );

-- Movimientos: lectura jefes + comerciales; escritura logística
create policy movimientos_read on public.inventario_movimientos
  for select using (
    public.my_role() in (
      'gerencia_general', 'jefe_bodega', 'coord_logistica',
      'direccion_comercial', 'asesor_comercial', 'coord_admin_control'
    )
  );
create policy movimientos_insert on public.inventario_movimientos
  for insert with check (
    public.my_role() in (
      'gerencia_general', 'jefe_bodega', 'coord_logistica', 'logistico_campo'
    )
  );

-- Mantenimientos: jefes + financiero (para ver costo)
create policy mant_read on public.inventario_mantenimientos
  for select using (
    public.my_role() in (
      'gerencia_general', 'jefe_bodega', 'coord_logistica',
      'coord_admin_financiero', 'asistente_contable', 'contador_externo'
    )
  );
create policy mant_write on public.inventario_mantenimientos
  for all using (
    public.my_role() in ('gerencia_general', 'jefe_bodega', 'coord_logistica')
  );
