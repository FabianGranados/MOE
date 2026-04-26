-- =====================================================================
-- MOE · Migración 007 · Remisión de Logística (Fase B)
--
-- La tabla `remisiones` ya fue creada en 005b orientada a la remisión
-- legal con firma del cliente en sitio. Esta migración la EXTIENDE para
-- soportar el documento operativo que el comercial llena cuando vende
-- (personas, notas, otrosíes) y que bodega/logística ven en tiempo real
-- apenas se finaliza.
--
-- Una cotización ↔ una remisión por versión.
-- Después de finalizada no se edita; sí se le pueden anexar otrosíes
-- (notas adicionales) en una tabla aparte.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Columnas nuevas en `remisiones`
-- ---------------------------------------------------------------------
alter table public.remisiones
  add column if not exists personas_montaje    jsonb       default '[]'::jsonb,
  add column if not exists personas_desmontaje jsonb       default '[]'::jsonb,
  add column if not exists notas_operativas    text,
  add column if not exists finalizada          boolean     default false,
  add column if not exists fecha_finalizacion  timestamptz,
  add column if not exists creado_por          uuid        references public.usuarios(id),
  add column if not exists cotizacion_version  smallint    not null default 1;

-- 1 cotización + version ↔ 1 remisión (no permitir duplicados)
create unique index if not exists uq_remisiones_cotizacion_version
  on public.remisiones(cotizacion_id, cotizacion_version);

-- `numero` (correlativo legal) era NOT NULL en 005b. Lo relajamos para
-- poder crear remisiones en borrador sin asignar correlativo. Al
-- finalizar la app le pone `${cotizacion.numero}-R-${cotizacion_version}`.
alter table public.remisiones alter column numero drop not null;

-- `tipo` (ENTREGA | DESMONTAJE) no aplica a nuestro modelo: una sola
-- remisión cubre ambos. Le damos default para que rows nuevos no fallen.
alter table public.remisiones alter column tipo drop not null;
alter table public.remisiones alter column tipo set default 'COMPLETA';

-- ---------------------------------------------------------------------
-- Tabla `remision_addendum` (otrosíes)
-- Después de finalizada la remisión, el comercial puede anexar notas
-- ("el cliente quitó 6 mesas 6 horas antes"). Cada nota es un row, con
-- audit completo. Bodega/logística las ven en tiempo real.
-- ---------------------------------------------------------------------
create table if not exists public.remision_addendum (
  id              uuid primary key default uuid_generate_v4(),
  remision_id     uuid not null references public.remisiones(id) on delete cascade,
  texto           text not null,
  creado_por      uuid references public.usuarios(id),
  creado_por_nombre text,
  creado_en       timestamptz not null default now()
);
create index if not exists idx_addendum_remision on public.remision_addendum(remision_id);

alter table public.remision_addendum enable row level security;

-- ---------------------------------------------------------------------
-- RLS de `remisiones` — reemplazamos las del 005b (eran muy abiertas)
-- ---------------------------------------------------------------------
drop policy if exists remisiones_read   on public.remisiones;
drop policy if exists remisiones_write  on public.remisiones;
drop policy if exists remisiones_insert on public.remisiones;
drop policy if exists remisiones_update on public.remisiones;
drop policy if exists remisiones_delete on public.remisiones;

-- SELECT
--   · gerencia + dirección comercial + admin → todas
--   · asesor_comercial → sólo las de SUS cotizaciones
--   · bodega + logística + logistico_campo → sólo las FINALIZADAS
--     (apenas el comercial le da finalizar, ellos las ven en tiempo real)
create policy remisiones_read on public.remisiones
  for select using (
    public.my_role() in (
      'gerencia_general', 'direccion_comercial',
      'coord_admin_control', 'coord_admin_financiero',
      'asistente_contable', 'contador_externo'
    )
    or (
      public.my_role() = 'asesor_comercial'
      and exists (
        select 1 from public.cotizaciones c
        where c.id = remisiones.cotizacion_id
          and c.comercial_id = auth.uid()
      )
    )
    or (
      public.my_role() in ('jefe_bodega', 'coord_logistica', 'logistico_campo')
      and remisiones.finalizada = true
    )
  );

-- INSERT: sólo el asesor dueño de la cotización (o roles superiores).
-- Las remisiones SÓLO las hace quien vende el evento.
create policy remisiones_insert on public.remisiones
  for insert with check (
    public.my_role() in ('gerencia_general', 'direccion_comercial')
    or (
      public.my_role() = 'asesor_comercial'
      and exists (
        select 1 from public.cotizaciones c
        where c.id = remisiones.cotizacion_id
          and c.comercial_id = auth.uid()
      )
    )
  );

-- UPDATE: sólo si NO está finalizada. Una vez finalizada queda inmutable
-- (los cambios van por addendum). Excepción: gerencia puede tocar siempre.
create policy remisiones_update on public.remisiones
  for update using (
    public.my_role() = 'gerencia_general'
    or (
      remisiones.finalizada = false
      and (
        public.my_role() in ('direccion_comercial')
        or (
          public.my_role() = 'asesor_comercial'
          and exists (
            select 1 from public.cotizaciones c
            where c.id = remisiones.cotizacion_id
              and c.comercial_id = auth.uid()
          )
        )
      )
    )
  );

-- DELETE: sólo gerencia (en la práctica nunca se borran)
create policy remisiones_delete on public.remisiones
  for delete using (public.my_role() = 'gerencia_general');

-- ---------------------------------------------------------------------
-- RLS de `remision_addendum`
-- ---------------------------------------------------------------------
-- SELECT: igual que la remisión a la que pertenece
create policy addendum_read on public.remision_addendum
  for select using (
    exists (
      select 1 from public.remisiones r
      where r.id = remision_addendum.remision_id
        -- delegamos al RLS de remisiones (visible si la remisión es visible)
    )
  );

-- INSERT: el comercial dueño de la cotización (o gerencia/dirección).
-- Se permite anexar otrosíes incluso después de finalizada.
create policy addendum_insert on public.remision_addendum
  for insert with check (
    public.my_role() in ('gerencia_general', 'direccion_comercial')
    or (
      public.my_role() = 'asesor_comercial'
      and exists (
        select 1
        from public.remisiones r
        join public.cotizaciones c on c.id = r.cotizacion_id
        where r.id = remision_addendum.remision_id
          and c.comercial_id = auth.uid()
      )
    )
  );

-- UPDATE/DELETE: nadie. Los otrosíes son inmutables — son parte del audit.
-- (Si se necesita corregir, se anexa otro otrosí que aclara.)
-- No creamos políticas de update/delete: por defecto Postgres niega.

-- ---------------------------------------------------------------------
-- Validación final
-- ---------------------------------------------------------------------
-- Para verificar que aplicó bien:
--   select column_name, data_type from information_schema.columns
--     where table_name = 'remisiones' and table_schema = 'public'
--     order by ordinal_position;
--
--   select policyname, cmd from pg_policies where tablename = 'remisiones';
