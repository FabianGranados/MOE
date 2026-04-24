-- =====================================================================
-- MOE · Migración 006 · Usuarios de temporada (Laura, Paola, Luciana, Ammy)
--
-- ESTE SCRIPT TIENE 2 PASOS — léelos antes de ejecutar.
--
-- PASO 1 (manual, en Supabase Dashboard):
--   Ir a: Authentication > Users > "Add user" > "Create new user"
--   Crear estos 4 usuarios con su email y una contraseña temporal
--   (ej. "Decolounge2026"). Marcar "Auto Confirm User" para que
--   no haya que confirmar email.
--
--     1) comercial@decolounge.com.co     (Laura)
--     2) comercial1@decolounge.com.co    (Paola)
--     3) comercial2@decolounge.com.co    (Ammy)
--     4) comercial3@decolounge.com.co    (Luciana)
--
-- PASO 2 (automático, este SQL):
--   Una vez creados en Auth, ejecutar este script en SQL Editor.
--   Los vincula a public.usuarios con su rol y alias.
-- =====================================================================

-- Laura Martinez
insert into public.usuarios (id, email, nombre, alias, role_id, activo)
select u.id, u.email, 'Laura Martinez', 'LAURA', 'asesor_comercial', true
from auth.users u
where u.email = 'comercial@decolounge.com.co'
on conflict (id) do update
  set nombre = excluded.nombre,
      alias = excluded.alias,
      role_id = excluded.role_id,
      activo = true;

-- Paola Castro
insert into public.usuarios (id, email, nombre, alias, role_id, activo)
select u.id, u.email, 'Paola Castro', 'PAOLA', 'asesor_comercial', true
from auth.users u
where u.email = 'comercial1@decolounge.com.co'
on conflict (id) do update
  set nombre = excluded.nombre,
      alias = excluded.alias,
      role_id = excluded.role_id,
      activo = true;

-- Ammy Garzon
insert into public.usuarios (id, email, nombre, alias, role_id, activo)
select u.id, u.email, 'Ammy Garzon', 'AMMY', 'asesor_comercial', true
from auth.users u
where u.email = 'comercial2@decolounge.com.co'
on conflict (id) do update
  set nombre = excluded.nombre,
      alias = excluded.alias,
      role_id = excluded.role_id,
      activo = true;

-- Luciana Ramirez
insert into public.usuarios (id, email, nombre, alias, role_id, activo)
select u.id, u.email, 'Luciana Ramirez', 'LUCIANA', 'asesor_comercial', true
from auth.users u
where u.email = 'comercial3@decolounge.com.co'
on conflict (id) do update
  set nombre = excluded.nombre,
      alias = excluded.alias,
      role_id = excluded.role_id,
      activo = true;

-- Verificación: muestra los 4 vinculados
select email, nombre, alias, role_id, activo
from public.usuarios
where email in (
  'comercial@decolounge.com.co',
  'comercial1@decolounge.com.co',
  'comercial2@decolounge.com.co',
  'comercial3@decolounge.com.co'
)
order by alias;
