# MOE · Master Operativo de Eventos · Decolounge

ERP interno de **Decolounge** (alquiler de mobiliario para eventos, Bogotá, Colombia). Migrado desde un prototipo de Claude Artifacts (un solo archivo React de ~1500 líneas) a un proyecto Vite + React modular con Supabase como backend.

## Stack

- **Frontend**: React 18 + Vite 5 + Tailwind 3
- **UI**: framer-motion (animaciones), sonner (toasts), lucide-react (iconos), recharts (gráficos), jsPDF (PDFs desde CDN)
- **Backend**: Supabase (Postgres + Auth + Storage)
- **Almacenamiento de sesión**: `localStorage['moe-supabase-auth']` (no cookies)

## Comandos

```bash
npm run dev      # arranca Vite en :5173
npm run build    # build a dist/
npm run preview  # sirve el build local
```

No hay tests, no hay linter configurado. Build exitoso ≠ feature funcional — siempre verificar en navegador.

## Estructura de archivos (~70 archivos, ninguno >400 líneas)

```
src/
├── MOEApp.jsx                  # raíz: gate de auth + carga de stores
├── constants.js                # ROLES, USUARIOS demo, catálogos enum
├── data/
│   ├── supabase.js             # cliente Supabase (URL+key fallback hardcoded)
│   ├── cotizaciones.js         # adapter Supabase ↔ "evento" denormalizado
│   ├── audit.js                # log de auditoría (DB o localStorage)
│   └── storage.js              # wrapper localStorage
├── hooks/
│   ├── useSession.js           # auth: Supabase o demo según supabaseEnabled
│   ├── useCotizaciones.js      # eventos con diff-upsert a Supabase
│   ├── usePersistedState.js    # localStorage genérico (catálogo, rangos)
│   ├── useTheme.js             # dark mode (auto + toggle)
│   ├── useDirtyGuard.jsx       # advertencia al salir con cambios
│   └── useHotkey.js            # ⌘K, ⌘N
├── utils/                      # eventos, calculos, comisiones, semaforo, format, validaciones
└── components/
    ├── shell/                  # Shell, Sidebar, Topbar, MobileNav, CommandPalette
    ├── auth/Login.jsx
    ├── hoy/                    # vista HOY (eventos urgentes del día)
    ├── dashboard/              # KPIs, pipeline kanban, productividad, productos, leads
    ├── leads/                  # lista cotizaciones, modales vender/perder
    ├── evento/                 # EventForm, Cotizador, TabPagos, Historial, Share, PersonasLista
    ├── catalogo/               # CRUD productos
    ├── comisiones/
    └── shared/                 # Modal, Avatar, Badge, Fld, Skeleton, etc.

supabase/migrations/
├── 001_init.sql                # schema base
├── 002_rls.sql                 # RLS con security definer (evita recursión)
├── 003_seeds.sql               # 11 roles, permisos, workflows, productos demo
├── 004_fix_coord_comercial.sql # parche: coord_comercial → direccion_comercial
├── 005a_financiero.sql         # empresas, bancos, gastos, retiros
├── 005b_logistica.sql          # vehículos, rutas, remisiones, daños
├── 005c_inventario.sql         # inventario individual con trazabilidad por unidad
└── 006_usuarios_temporada.sql  # vincula Laura, Paola, Luciana, Ammy Garzón
```

## Supabase — estado verificado (abril 2026)

- **URL**: `https://galjspyrjymlybrltitc.supabase.co`
- **Cliente**: `src/data/supabase.js` — URL y anon key (legacy JWT) hardcoded como fallback. En producción se leen de `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- **Mensaje al conectar bien**: `[MOE] Supabase activo ✓`
- **`storageKey`**: `moe-supabase-auth` (no cookies). Si una sesión queda rota, limpiar esa entrada en localStorage.

### 7 usuarios reales en producción (todos vinculados con `activo=true`)

| Email | Nombre | Alias | Rol |
|---|---|---|---|
| `admin@decolounge.com.co` | Fabian Granados | FABIAN | gerencia_general |
| `cordicomercial@decolounge.com.co` | Johanna Ruiz | JOHANNA | direccion_comercial |
| `asesor1@decolounge.com.co` | Ammy Castro | AMMY | asesor_comercial |
| `comercial@decolounge.com.co` | Laura Martinez | LAURA | asesor_comercial |
| `comercial1@decolounge.com.co` | Paola Castro | PAOLA | asesor_comercial |
| `comercial2@decolounge.com.co` | Ammy Garzon | AMMY | asesor_comercial |
| `comercial3@decolounge.com.co` | Luciana Ramirez | LUCIANA | asesor_comercial |

**Hay dos Ammys a propósito** (Castro vieja + Garzón nueva). Decisión del usuario: dejar las dos para no romper datos históricos.

**README.md de `supabase/`** usa emails distintos (`@decolounge.co` sin `.com`) — está desactualizado, no es la fuente de verdad. La realidad son los emails de la tabla de arriba.

## Modelo de datos clave

La UI maneja un objeto **"evento" denormalizado** (con `items[]`, `pagos[]`, `historial[]`). Supabase lo guarda en 4 tablas separadas:
- `cotizaciones` (header)
- `cotizacion_items`
- `pagos`
- `cotizacion_historial`

El puente vive en `src/data/cotizaciones.js` (`fetchAll`, `upsertEvent`, `deleteEvent`, `nextNumeroFromDb`). `upsertEvent` reemplaza items con DELETE + INSERT.

## RLS — patrones

- Funciones helper: `public.my_role()`, `public.my_alias()`, `public.has_perm()` con `security definer set search_path = public` (críticas para evitar recursión infinita en policies que consultan `usuarios`).
- `asesor_comercial` solo ve `cotizaciones` donde `comercial_id = auth.uid()`. Los demás roles ven todo.
- Policies de items/historial: `for all using (exists(select 1 from cotizaciones c where c.id = cotizacion_id))` — **no tienen `with check` explícito**, lo que puede causar fallos silenciosos en INSERTs (sospecha del bug "cotización colgada al finalizar").

## Reglas de negocio

- **Numeración**: `YY####` (ej `260001`). Se calcula con `nextNumeroFromDb()` mirando el máximo del año actual.
- **Versiones**: misma cotización puede tener V1, V2, V3 — `unique(numero, version)` en DB.
- **Flujo**: `BORRADOR → FINALIZADA (bloqueada) → EN ESPERA → VENDIDA / PERDIDA`.
- **Cálculo**: `precio = cantidad × precioBase × multiplicadorDías` (o precio manual override).
- **IVA 19%** sobre base total (solo en `COTIZACION`, no en `REMISION`).
- **Comisión**: solo sobre productos (excluye Transporte/Montaje/Desmontaje). "Ganada" solo cuando evento `VENDIDO` y pagado al 100%. Rangos configurables en tabla `rangos_comision`.

## Inconsistencias conocidas / deuda técnica

1. **`catalogo` y `rangos-comision` viven en `localStorage`** (`MOEApp.jsx:14-15`), no en Supabase. Cada usuario ve su catálogo local. Las tablas `productos` y `rangos_comision` existen en DB pero la UI no las consume.
2. **RLS de items/historial sin `with check` explícito** — sospechoso para INSERTs que fallan en silencio.
3. **`README.md` de `supabase/`** tiene emails desactualizados (`@decolounge.co`).

## Bugs reportados pendientes

1. **"Laura ve igual que antes"**: como `asesor_comercial`, RLS solo le muestra cotizaciones donde `comercial_id = auth.uid()`. Sospecha: las cotizaciones viejas tienen `comercial_id = null` o apuntan a un id distinto. Validar con: `select numero, comercial_id, comercial_alias from cotizaciones order by created_at desc limit 20;`
2. **"Cotización colgada al finalizar" (Ammy vieja)**: la cotización sí se guarda en Supabase (verificado), pero la UI se queda colgada. Posible: `upsertEvent` hace DELETE de items, INSERT falla por RLS sin `with check`, y el código no surface el error (solo `console.warn`). Ver `src/data/cotizaciones.js:228-247`.

## Próximos pasos

1. Resolver bug #1 (Laura) — corregir `comercial_id` en cotizaciones huérfanas o ajustar RLS.
2. Resolver bug #2 (cotización colgada) — agregar `with check` a policies de items/historial, y propagar errores del `upsertEvent` a la UI.
3. Migrar `catalogo` y `rangos` a Supabase (eliminar `usePersistedState` para esos).
4. Crear PR a `main` con todo el trabajo de Supabase.
5. Deploy en Vercel (`moe-decolounge.vercel.app`).

## Convenciones

- **Branch actual**: `claude/fix-chat-400-error-Q7yGx`. Commits con `fix(...)`, `feat(...)`, `feat(005a)`, etc. Mensajes en español.
- **Sin emojis** en código fuente, sí en toasts/UI cuando aporta (ej `🎉` al vender).
- **Sin comentarios redundantes**. Comentar solo el "por qué" no obvio (ej: por qué `security definer` en helpers de RLS).
- **Sin tests**: la verificación es manual en navegador. Si haces cambio de UI, abre dev server y prueba.
- **Archivos** ≤ 400 líneas. Si crece, modularizar.

## Workaround para el bug 400 de Claude Code en web

Anthropic tiene un bug abierto ([issue #52689](https://github.com/anthropics/claude-code/issues/52689)): si pegas una imagen **sin texto acompañante**, queda un bloque tóxico con `cache_control` en el historial y la sesión se rompe permanentemente con error 400. **Workaround**: siempre escribir al menos una palabra al adjuntar imágenes. Si la sesión ya está rota, `/clear` (este `CLAUDE.md` se carga solo en la nueva).
