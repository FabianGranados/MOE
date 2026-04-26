-- =====================================================================
-- MOE · Migración 009 · RLS de remisiones más tolerante con el alias
--
-- La 008 hizo backfill por alias para llenar comercial_id, pero si una
-- cotización tiene un alias que no aparece exacto en public.usuarios
-- (por ejemplo, mayúsculas/minúsculas distintas, espacios, o un alias
-- que el comercial cambió en su perfil después de crear la cotización),
-- el comercial_id queda NULL y el asesor no puede crear su remisión.
--
-- Solución: relajar la RLS para aceptar que el asesor cree/modifique la
-- remisión si su comercial_id matchea EL UUID O EL ALIAS. Es coherente
-- con el filtro del cliente (`e.comercial === currentUser.alias || ...`).
--
-- También aplicamos lo mismo a SELECT y UPDATE.
-- =====================================================================

drop policy if exists remisiones_read   on public.remisiones;
drop policy if exists remisiones_insert on public.remisiones;
drop policy if exists remisiones_update on public.remisiones;

-- READ
--   · admin / dirección / gerencia / contadores → todas
--   · asesor_comercial → las suyas (por uuid O por alias)
--   · bodega / logística / logístico de campo → solo finalizadas
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
          and (
            c.comercial_id = auth.uid()
            or upper(trim(c.comercial_alias)) = upper(trim(public.my_alias()))
          )
      )
    )
    or (
      public.my_role() in ('jefe_bodega', 'coord_logistica', 'logistico_campo')
      and remisiones.finalizada = true
    )
  );

-- INSERT: el asesor dueño (uuid o alias) o roles superiores
create policy remisiones_insert on public.remisiones
  for insert with check (
    public.my_role() in ('gerencia_general', 'direccion_comercial')
    or (
      public.my_role() = 'asesor_comercial'
      and exists (
        select 1 from public.cotizaciones c
        where c.id = remisiones.cotizacion_id
          and (
            c.comercial_id = auth.uid()
            or upper(trim(c.comercial_alias)) = upper(trim(public.my_alias()))
          )
      )
    )
  );

-- UPDATE: sólo si NO está finalizada (gerencia exenta)
create policy remisiones_update on public.remisiones
  for update using (
    public.my_role() = 'gerencia_general'
    or (
      remisiones.finalizada = false
      and (
        public.my_role() = 'direccion_comercial'
        or (
          public.my_role() = 'asesor_comercial'
          and exists (
            select 1 from public.cotizaciones c
            where c.id = remisiones.cotizacion_id
              and (
                c.comercial_id = auth.uid()
                or upper(trim(c.comercial_alias)) = upper(trim(public.my_alias()))
              )
          )
        )
      )
    )
  );

-- =====================================================================
-- Validación
--   select policyname, cmd from pg_policies where tablename = 'remisiones';
-- =====================================================================
