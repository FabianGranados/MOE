-- =====================================================================
-- MOE · Migración 010 · Función SECURITY DEFINER para siguiente número
--
-- Problema: la función nextNumeroFromDb del cliente hacía
--   select numero from cotizaciones where numero like '26%'
--   order by numero desc limit 1
-- pero la RLS de cotizaciones filtra por comercial_id = auth.uid() para
-- los asesores. Resultado: Paola ve sólo sus cotizaciones, calcula
-- 260010 como siguiente, pero Ammy ya tiene 260010 → colisión en la
-- unique constraint cotizaciones_numero_version_key.
--
-- Solución: una función security definer que ignora la RLS y devuelve
-- el siguiente número globalmente único. Por ser security definer
-- corre con los permisos del owner (postgres), bypassa la policy de
-- SELECT y puede leer todas las cotizaciones del año.
--
-- Concurrencia: aún hay una pequeña ventana de carrera si dos asesores
-- llaman exactamente al mismo milisegundo. La unique constraint sigue
-- siendo el último filtro y rechazará al perdedor del race con 23505;
-- el cliente puede reintentar. En la práctica esto pasa muy poco.
-- =====================================================================

create or replace function public.next_cotizacion_numero()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  yy        text;
  last_num  text;
  next_seq  integer;
begin
  yy := to_char(now(), 'YY');

  -- Bypassa RLS porque la función es SECURITY DEFINER
  select numero into last_num
  from public.cotizaciones
  where numero like yy || '%'
  order by numero desc
  limit 1;

  if last_num is null then
    return yy || '0001';
  end if;

  next_seq := coalesce(nullif(substring(last_num from 3), '')::integer, 0) + 1;
  return yy || lpad(next_seq::text, 4, '0');
end;
$$;

-- Cualquiera autenticado puede llamarla
grant execute on function public.next_cotizacion_numero() to authenticated;

-- =====================================================================
-- Validación
-- =====================================================================
-- a) Smoke test (debería devolver el siguiente número):
--      select public.next_cotizacion_numero();
-- b) Verificar que existe:
--      select proname, prosecdef from pg_proc where proname = 'next_cotizacion_numero';
