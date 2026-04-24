# MOE · Supabase setup (5 minutos)

Esta guía es para activar el **backend real** de MOE. Hasta que la hagas, la app sigue corriendo perfecta en modo **demo** (localStorage) sin tocar nada.

## ¿Por qué migrar a Supabase?

- Varios usuarios trabajando a la vez, con **datos centralizados**
- **RBAC** (permisos por rol) reforzado a nivel base de datos con RLS
- **Audit log** persistente y auditable
- **Workflows de aprobación** (pago a proveedor, descuentos especiales)
- Acceso desde **cualquier dispositivo** con la misma cuenta
- Gratis hasta ~50k filas / 500 MB — suficiente para el primer año

---

## Paso 1 · Crear cuenta Supabase (2 min)

1. Entra a [https://supabase.com](https://supabase.com) → **Start your project**
2. Inicia sesión con GitHub (recomendado) o email
3. Click **New project**:
   - **Name**: `moe-decolounge`
   - **Database password**: pon uno fuerte y **guárdalo en un lugar seguro** (no lo verás de nuevo)
   - **Region**: `South America (São Paulo)` (más cerca de Colombia)
   - **Pricing plan**: Free
4. Supabase tarda ~2 min en aprovisionar. Mientras espera, sigue con el paso 2.

---

## Paso 2 · Ejecutar las migraciones (2 min)

Una vez el proyecto esté listo:

1. En el menú izquierdo entra a **SQL Editor**
2. Click **New query**
3. Pega el contenido de `supabase/migrations/001_init.sql` → click **Run**
   - Tarda unos segundos. Debe terminar sin errores.
4. Repite con `supabase/migrations/002_rls.sql`
5. Repite con `supabase/migrations/003_seeds.sql`

**Valida** que quedó bien:
- Menú izquierdo → **Table Editor** → deberías ver las tablas `roles`, `usuarios`, `cotizaciones`, `productos`, `audit_log`, `workflow_types`, etc.
- Abre `roles` → debe haber **11 registros**
- Abre `productos` → debe haber **5 productos demo**

---

## Paso 3 · Crear los primeros usuarios (1 min)

1. Menú izquierdo → **Authentication** → **Users**
2. Click **Add user → Create new user**
3. Crea estos 3 de una, con password `demo1234`:
   - `admin@decolounge.co`
   - `johanna@decolounge.co`
   - `ammy@decolounge.co`
4. Para cada uno, **copia el UUID** que aparece en la columna `ID`.

Ahora vincúlalos a roles en la tabla `usuarios`:

1. **SQL Editor** → New query → pega y ajusta los UUIDs:

```sql
insert into public.usuarios (id, email, nombre, alias, role_id) values
  ('<UUID-DE-ADMIN>',   'admin@decolounge.co',   'Fabian Granados', 'FABIAN',  'gerencia_general'),
  ('<UUID-DE-JOHANNA>', 'johanna@decolounge.co', 'Johanna Ruiz',    'JOHANNA', 'direccion_comercial'),
  ('<UUID-DE-AMMY>',    'ammy@decolounge.co',    'Ammy Castro',     'AMMY',    'asesor_comercial')
on conflict (id) do nothing;
```

2. Click **Run**.

---

## Paso 4 · Conectar MOE a Supabase

1. Menú izquierdo de Supabase → **Settings** → **API**
2. Copia:
   - **Project URL** (ej. `https://xxxxx.supabase.co`)
   - **anon public** key (la pública, no la `service_role`)
3. En la raíz del proyecto crea un archivo `.env.local` (a partir de `.env.example`):

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

4. Reinicia el dev server (`npm run dev`).
5. Abre la consola del navegador (F12). Debe decir:

```
[MOE] Supabase activo ✓
```

Si dice `Modo demo`, las variables no se cargaron bien (revisa el archivo y reinicia).

---

## Paso 5 · Primer login

1. Abre MOE → deberías ver la pantalla de login
2. Entra con `admin@decolounge.co` / `demo1234`
3. Si todo quedó bien, entras como Gerencia y ves todos los datos del servidor
4. Abre **SQL Editor** → consulta `select * from public.audit_log;` → debería haber un registro de tu `login`

🎉 Listo. Estás en producción real.

---

## Cómo agregar nuevos usuarios después

Cuando contrates una nueva persona (ej. jefe de bodega nuevo):

1. **Auth → Users → Add user** (email + password temporal)
2. **SQL Editor**:
```sql
insert into public.usuarios (id, email, nombre, alias, role_id)
values ('<uuid-nuevo>', 'juan@decolounge.co', 'Juan Pérez', 'JUAN', 'jefe_bodega');
```

La persona entra con ese email, y MOE automáticamente sabe qué puede ver y qué no.

---

## Preguntas frecuentes

**¿Puedo seguir usando el modo demo mientras pruebo Supabase?**
Sí. Si dejas `VITE_SUPABASE_URL` vacío, vuelves a localStorage. Los datos demo siguen intactos.

**¿Pierdo los datos del demo al migrar?**
Los datos de localStorage NO se migran automáticamente — son de prueba. Empiezas limpio en Supabase con las 5 productos demo que ya trae `003_seeds.sql`.

**¿Qué pasa si un empleado ya no trabaja en Decolounge?**
No lo elimines (se pierde la trazabilidad de sus acciones). En su lugar márcalo `activo = false` en la tabla `usuarios`. El histórico queda intacto.

**¿Cómo hago backup?**
Supabase hace backups automáticos diarios en el plan gratuito (7 días de retención). Para más tiempo, consulta sus planes o exporta con `pg_dump`.

**¿Puedo ver los logs de auditoría?**
Sí. Como Gerencia o Contador Externo, vas a **SQL Editor** y consultas `audit_log`. Más adelante tendrás una pantalla dentro de MOE para verlo cómodo.

**¿Se puede tumbar con muchos usuarios?**
Free tier: ~500 MB, 50k filas activas. Con 10 usuarios y 200 cotizaciones/mes te dura todo el año. Cuando crezcas pasas a Pro ($25/mes).
