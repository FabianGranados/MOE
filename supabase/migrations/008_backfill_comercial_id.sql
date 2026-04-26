-- =====================================================================
-- MOE · Migración 008 · Backfill comercial_id en cotizaciones
--
-- Fix para el error:
--   "new row violates row-level security policy for table 'remisiones'"
-- que aparece cuando el asesor intenta crear una remisión sobre una
-- cotización con comercial_id = NULL (creada antes de que el sistema
-- asignara correctamente la UUID del comercial, o creada/migrada
-- desde modo demo).
--
-- 1) Backfill: rellena comercial_id donde sea NULL haciendo match por
--    alias contra public.usuarios. Comparación case-insensitive y
--    trimeada para tolerar espacios o mayúsculas inconsistentes.
-- 2) Trigger: para futuros inserts, si viene NULL, lo llena con
--    auth.uid() automáticamente. Así nunca más quedará una cotización
--    sin comercial vinculado.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Backfill por alias
-- ---------------------------------------------------------------------
update public.cotizaciones c
set comercial_id = u.id
from public.usuarios u
where c.comercial_id is null
  and c.comercial_alias is not null
  and upper(trim(c.comercial_alias)) = upper(trim(u.alias));

-- Para auditar qué quedó: filas que SIGUEN con comercial_id null.
-- Si esta consulta devuelve resultados, hay cotizaciones cuyo alias no
-- aparece en public.usuarios — habría que matchear a mano.
--   select id, numero, comercial_alias from public.cotizaciones
--     where comercial_id is null;

-- ---------------------------------------------------------------------
-- 2) Trigger para nuevos inserts
-- ---------------------------------------------------------------------
create or replace function public.cotizaciones_set_comercial_id()
returns trigger language plpgsql as $$
begin
  if new.comercial_id is null then
    new.comercial_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cotizaciones_set_comercial_id on public.cotizaciones;
create trigger trg_cotizaciones_set_comercial_id
before insert on public.cotizaciones
for each row execute function public.cotizaciones_set_comercial_id();

-- =====================================================================
-- Validación post-aplicación
-- =====================================================================
-- a) Cotizaciones que ya tienen comercial_id (debería ser todas o la mayoría):
--    select count(*) from public.cotizaciones where comercial_id is not null;
-- b) Cotizaciones huérfanas (alias no encontrado en usuarios):
--    select id, numero, comercial_alias from public.cotizaciones
--      where comercial_id is null;
-- c) Trigger registrado:
--    select tgname from pg_trigger where tgrelid = 'public.cotizaciones'::regclass;
