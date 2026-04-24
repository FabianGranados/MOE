# MOE · Decolounge

**ERP operativo de eventos y alquiler** — construido sobre estándares de Rental ERP, CRM, Procurement Workflow y control cruzado financiero.

Integra comercial, inventario, logística, compras, cartera y tesorería con **11 roles** y trazabilidad total (audit log + cadenas de aprobación).

## Modos de operación

- **Demo** (por defecto) → datos en `localStorage`, usuarios hardcoded. Perfecto para probar.
- **Producción** → backend real en **Supabase** (Postgres + Auth + RLS).
  Para activarlo: ver [`supabase/README.md`](./supabase/README.md) · toma ~5 min.

## Arrancar en local

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Build para producción

```bash
npm run build
npm run preview   # para probar el build local
```

El resultado se genera en `dist/` (se puede subir tal cual a Vercel, Netlify, Cloudflare Pages, etc.).

## Usuarios demo

| Rol              | Email                    | Password  |
|------------------|--------------------------|-----------|
| Gerencia         | admin@decolounge.co      | demo1234  |
| Coord. Comercial | johanna@decolounge.co    | demo1234  |
| Asesor           | ammy@decolounge.co       | demo1234  |

## Atajos de teclado

- `⌘K` / `Ctrl+K` — abrir command palette (buscar y navegar)
- `⌘N` / `Ctrl+N` — nueva cotización
- `Esc` — cerrar cualquier modal

## Estructura

```
src/
├── MOEApp.jsx             # Root: auth + providers + shell
├── main.jsx               # Entry point
├── index.css              # Design tokens + Tailwind
├── constants.js           # Roles, estados, categorías, etc.
├── data/storage.js        # Wrapper de localStorage
├── utils/
│   ├── format.js          # Formateo (fechas, moneda)
│   ├── calculos.js        # Totales, IVA, transporte
│   ├── comisiones.js      # Rangos y cálculo de comisión
│   ├── eventos.js         # Nuevo evento, clasificación, stock
│   └── validaciones.js    # Validación de formularios
├── hooks/
│   ├── useTheme.js        # Dark mode
│   ├── useSession.js      # Login/logout
│   ├── usePersistedState.js
│   └── useHotkey.js       # ⌘K, Esc, etc.
└── components/
    ├── shared/            # Fld, Kpi, Modal, Avatar, Badge, ...
    ├── auth/Login.jsx
    ├── shell/             # Sidebar, Topbar, MobileNav, CommandPalette
    ├── hoy/               # Vista "HOY"
    ├── dashboard/         # Dashboard + 5 tabs
    ├── leads/             # Lista + modales vender/perder
    ├── evento/            # EventForm + Cotizador + subtabs + modales
    ├── comisiones/
    └── catalogo/
```

## Stack

- **Vite + React 18**
- **Tailwind CSS** con design tokens (CSS vars) para tema claro/oscuro
- **Framer Motion** para transiciones
- **Recharts** para gráficas
- **Sonner** para toasts
- **Lucide** para iconos
- **jsPDF** para generar PDFs de cotización

## Persistencia

Todo se guarda en `localStorage` del navegador (bajo el prefijo `moe-`). Para limpiar:

```js
Object.keys(localStorage).filter(k => k.startsWith('moe-')).forEach(k => localStorage.removeItem(k));
```

## Deploy a Vercel (5 min, gratis)

1. Sube este repo a GitHub.
2. Entra a https://vercel.com → "Import Project" → elige el repo.
3. Vercel detecta Vite automáticamente. Click **Deploy**.
4. Listo: tu app queda en `moe-decolounge.vercel.app` (o el dominio que elijas).
