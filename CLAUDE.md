# CLAUDE.md · MOE (Decolounge)

> Documento orientado a Claude Code para arrancar una sesión nueva sin tener que reconstruir contexto. Si trabajas con MOE, **lee esto primero**.

## ¿Qué es MOE?

ERP operativo de **Decolounge** (alquiler de mobiliario y montaje de eventos en Bogotá). Construido sobre estándares de Rental ERP, CRM, Procurement Workflow y control cruzado financiero. Cubre 6 grandes pilares:

1. **Comercial** — leads, cotizaciones, ventas, pérdidas, comisiones
2. **Inventario** — catálogo de productos y, en pilar 005c, trazabilidad por unidad individual
3. **Logística** — vehículos, rutas, remisiones, daños (pilar 005b)
4. **Financiero** — empresas (3 razones sociales), bancos, gastos, retiros (pilar 005a)
5. **Cartera y tesorería** — pagos, validaciones, cuentas por cobrar
6. **Auditoría y aprobaciones** — audit log + cadenas de aprobación (pago a proveedor, descuentos especiales)

11 roles con RBAC reforzado por RLS de Postgres. Demo y producción conviven sin tocar código (ver "Modos de operación").

## Stack

- **Vite + React 18** (sin TypeScript todavía)
- **Tailwind CSS** con design tokens (CSS vars) para tema claro/oscuro
- **Framer Motion** para transiciones, **Recharts** para gráficas, **Sonner** para toasts, **Lucide** para iconos, **jsPDF** para PDFs
- **Supabase** (Postgres + Auth + RLS) en producción

## Modos de operación

- **Demo** (sin variables de entorno) → datos en `localStorage`, usuarios hardcoded en `src/constants.js`. Ideal para probar UI sin red.
- **Producción** → backend real en Supabase. Si `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` están definidas (o el fallback en `src/data/supabase.js` es válido), la app entra automáticamente a este modo. La consola imprime `[MOE] Supabase activo ✓` al cargar.

El switch lo decide `supabaseEnabled` en `src/data/supabase.js`. Cualquier módulo nuevo que persista datos debe consultar este flag y caer a localStorage si está en `false`.

## Cómo correrlo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm run preview  # sirve el build local
```

## Estado de la migración a Supabase

Esta es la fuente de verdad de qué está hecho y qué no. **Actualízalo** cuando termines un trabajo.

### ✅ Hecho

- **Infra Supabase** — migrations 001 a 006 aplicadas en el proyecto `galjspyrjymlybrltitc`:
  - `001_init.sql` — schema completo (roles, usuarios, cotizaciones, items, pagos, productos, audit_log, workflows)
  - `002_rls.sql` — policies RLS por rol, con helpers `security definer` para evitar recursión
  - `003_seeds.sql` — 11 roles y 5 productos demo
  - `004_fix_coord_comercial.sql` — rename `coord_comercial` → `direccion_comercial` + workflow_types
  - `005a_financiero.sql` — empresas, bancos, gastos, retiros
  - `005b_logistica.sql` — vehículos, rutas, remisiones, daños
  - `005c_inventario.sql` — inventario individual (unidades con serial, trazabilidad)
  - `006_usuarios_temporada.sql` — script para crear usuarios temporales
- **Auth real** (`src/hooks/useSession.js`) — login con email/password contra `auth.users` de Supabase, lee rol de la tabla `usuarios`. Fallback a usuarios demo si Supabase está apagado.
- **Cotizaciones en la nube** (`src/data/cotizaciones.js` + `src/hooks/useCotizaciones.js`) — fetch en mount, diff/upsert en persist. RLS filtra: asesor sólo ve las suyas, gerencia ve todo.

### ⏳ Pendiente (en orden sugerido)

1. **Remisión de Logística (pilar 005b · prioridad alta)** — la cotización NO incluye personas que reciben/entregan ni notas operativas (decisión del comercial: en el momento de cotizar todavía no se sabe quién va a recibir). Esos datos viven en un documento separado, la **Remisión de Logística**, que se crea cuando el evento está confirmado y pagado (100% / 50% / crédito legalizado). Pendiente: pantalla, validaciones, lock, audit, integración con remisiones físicas.
2. **Catálogo de productos a Supabase** — la tabla `productos` ya existe con seeds, pero `MOEApp.jsx:14` sigue usando `usePersistedState('catalogo', PRODUCTOS_INICIAL)`. Cada PC tiene su propio catálogo y los `producto_id` que guardan las cotizaciones quedan inconsistentes. **Patrón a seguir**: copiar el de cotizaciones — un `useCatalogo()` drop-in con la misma firma `[items, persist, hydrated]`.
3. **Rangos de comisión** — mismo problema, viven en localStorage. Crear tabla `rangos_comision` o guardarlos en una tabla `config` key-value.
4. **Cablear audit log** — el módulo `src/data/audit.js` ya escribe a Supabase; falta llamarlo en eventos clave: login (parcial), crear cotización, cambio de estado, validar pago, crear/editar producto.
5. **Pantalla de auditoría dentro de MOE** — para gerencia y contador externo. Lee de `audit_log` con filtros por entidad/usuario/fecha.
6. **UI de los pilares 005a/c** — el SQL existe pero no hay pantallas:
   - Financiero: gestión de empresas, bancos, gastos, retiros, conciliación
   - Inventario individual: vista por unidad con serial, historial de uso, mantenimientos
7. **Workflows de aprobación** — tablas `workflow_types` y `workflow_steps` ya existen; falta UI para iniciar/aprobar/rechazar (pago a proveedor, descuento especial).

## Flujo de la cotización (decisión de UX)

- **Wizard SIEMPRE**, en 3 (o 4) pasos:
  1. **Cliente** — datos del comprador
  2. **Logística** — horario evento, dirección, ciudad, fecha + horario de montaje y desmontaje
  3. **Productos** — catálogo y precios
  4. **Pagos** — sólo aparece cuando `estado === 'VENDIDO'`
- No hay modo pestañas. Editar una cotización existente reabre el wizard.
- **Cotizaciones finalizadas** (`finalizado === true`): los pasos 1-3 se ven en modo readonly (`<fieldset disabled>`); el botón "Finalizar" desaparece. Para ajustar algo se crea una **versión nueva** (260001-2, 260001-3...) con el botón en la parte superior. La versión nueva arranca **desde cero** — no copia datos para evitar arrastrar valores viejos por error.
- **No** se piden personas que reciben/entregan ni notas operativas en la cotización. Eso vive en la Remisión de Logística (Fase B, pendiente).

## Estructura

```
src/
├── MOEApp.jsx              · auth + providers + shell (root)
├── main.jsx
├── index.css               · design tokens + Tailwind
├── constants.js            · ROLES, ESTADOS, USUARIOS demo, PRODUCTOS_INICIAL, etc.
├── data/
│   ├── storage.js          · wrapper localStorage
│   ├── supabase.js         · cliente, flag supabaseEnabled
│   ├── audit.js            · audit log (Supabase ↔ localStorage)
│   └── cotizaciones.js     · adapter Supabase ↔ "evento" denormalizado
├── hooks/
│   ├── useSession.js       · login/logout (auth real + fallback demo)
│   ├── useCotizaciones.js  · drop-in de usePersistedState('events') con diff/upsert
│   ├── usePersistedState.js
│   ├── useTheme.js, useHotkey.js, useDirtyGuard.jsx
└── components/
    ├── shared/             · Fld, Kpi, Modal, Avatar, Badge, Skeleton, SinVincular, ...
    ├── auth/Login.jsx
    ├── shell/              · Sidebar, Topbar, MobileNav, CommandPalette
    ├── hoy/                · vista "HOY"
    ├── dashboard/          · dashboard + 5 tabs
    ├── leads/              · lista + modales vender/perder
    ├── evento/             · EventForm, Cotizador, subtabs, modales
    ├── comisiones/
    └── catalogo/

supabase/
├── README.md               · guía de setup paso a paso (5 min)
└── migrations/             · 001 a 006 (orden importa)
```

## Convenciones

- **Idioma**: código en inglés (nombres de funciones/variables), UI y commits en español. Comentarios en español cortos cuando aclaren un POR QUÉ no obvio.
- **Commits**: estilo Conventional con scope, en español. Ejemplos del log: `feat(supabase): cotizaciones leen y escriben en la nube`, `fix(rls): funciones helper con security definer evitan recursión`. **Trailer obligatorio** con la URL de la sesión de Claude Code.
- **Branch default**: `main`. Trabaja directo sobre `main` salvo que el usuario pida una rama feature.
- **Nunca** `--no-verify`, `--force`, `reset --hard` sin permiso explícito.
- **Persistencia nueva**: si agregas un módulo que guarda datos, sigue el patrón de `cotizaciones.js` — adapter con `fetchAll` / `upsert` / `delete` y un hook drop-in que respete `supabaseEnabled`.
- **No introduzcas dependencias** sin discutirlo. Stack ya es generoso.
- **No crees archivos `.md` nuevos** salvo que el usuario lo pida; este `CLAUDE.md` y el `README.md` cubren la documentación.

## Datos sensibles

- El fallback de `supabase.js` contiene la **anon key** del proyecto. Es pública por diseño (la seguridad real vive en RLS), pero **no commitees** la `service_role` key bajo ninguna circunstancia.
- `.env.local` está en `.gitignore`. Verifica antes de cualquier commit que no entró por accidente.

## Usuarios demo (modo localStorage)

| Rol               | Email                                | Password   |
|-------------------|--------------------------------------|------------|
| Gerencia General  | admin@decolounge.com.co              | demo1234   |
| Dir. Comercial    | cordicomercial@decolounge.com.co     | demo1234   |
| Asesor Comercial  | asesor1@decolounge.com.co            | demo1234   |

En modo Supabase los usuarios viven en `auth.users` + `public.usuarios`. Ver `supabase/README.md` para crearlos.

## Atajos

- `⌘K` / `Ctrl+K` — command palette
- `⌘N` / `Ctrl+N` — nueva cotización
- `Esc` — cerrar modal
