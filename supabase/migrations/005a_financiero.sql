-- =====================================================================
-- MOE · Migración 005a · Pilar Financiero
--
-- Cubre:
--   · Empresas (Decolounge SAS y Logiq)
--   · Cuentas bancarias (4 operativas + cajas auxiliares)
--   · Categorías de gasto (estructura del P&L)
--   · Gastos · Retiros de socios · Transferencias internas
--   · Períodos de cierre mensual
--
-- Reglas contables aplicadas:
--   · Retiros de socios NO son gasto. Son distribución.
--   · Transferencias internas NO afectan P&L. Solo mueven caja.
--   · Períodos cerrados bloquean edición (cerrar mes = inmutable).
-- =====================================================================

-- =====================================================================
-- EMPRESAS
-- =====================================================================
create table if not exists public.empresas (
  id          text primary key,                 -- 'decolounge' | 'logiq'
  nombre      text not null,
  nit         text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

insert into public.empresas (id, nombre, nit) values
  ('decolounge', 'Decolounge SAS', '901473035-5'),
  ('logiq',      'Logiq',          null)
on conflict (id) do nothing;

-- =====================================================================
-- CUENTAS BANCARIAS
-- 4 operativas (Bancolombia/Davivienda × Deco/Logiq) + cajas auxiliares
-- =====================================================================
create table if not exists public.bank_cuentas (
  id              uuid primary key default uuid_generate_v4(),
  empresa_id      text not null references public.empresas(id),
  banco           text not null,                 -- 'Bancolombia' | 'Davivienda' | 'Nequi' | 'Efectivo'
  numero          text,                          -- número de cuenta (puede ser null para Efectivo)
  tipo            text default 'ahorros',        -- ahorros | corriente | digital | efectivo
  alias           text,                          -- "Deco · Bancolombia operativa"
  saldo_inicial   numeric(14,2) not null default 0,
  fecha_saldo_inicial date,
  activo          boolean not null default true,
  observaciones   text,
  created_at      timestamptz not null default now()
);
create index if not exists idx_bank_empresa on public.bank_cuentas(empresa_id);

insert into public.bank_cuentas (empresa_id, banco, tipo, alias) values
  ('decolounge', 'Bancolombia', 'ahorros',  'Deco · Bancolombia'),
  ('decolounge', 'Davivienda',  'ahorros',  'Deco · Davivienda'),
  ('logiq',      'Bancolombia', 'ahorros',  'Logiq · Bancolombia'),
  ('logiq',      'Davivienda',  'ahorros',  'Logiq · Davivienda'),
  ('decolounge', 'Nequi',       'digital',  'Deco · Nequi'),
  ('decolounge', 'Efectivo',    'efectivo', 'Deco · Caja efectivo')
on conflict do nothing;

-- =====================================================================
-- CATEGORÍAS DE GASTO (estructura del P&L)
-- =====================================================================
create table if not exists public.expense_categorias (
  id          text primary key,                  -- 'nomina', 'prov_mobiliario', etc
  nombre      text not null,
  grupo       text not null,                     -- 'operativo' | 'administrativo' | 'financiero' | 'inversion' | 'no_pyg'
  orden       smallint not null default 0,
  activo      boolean not null default true
);

insert into public.expense_categorias (id, nombre, grupo, orden) values
  -- Operativo · Nómina
  ('nomina',           'Nómina fija',            'operativo',      10),
  ('nomina_temporal',  'Personal temporal',      'operativo',      11),
  -- Operativo · Proveedores
  ('prov_mobiliario',  'Proveedores mobiliario', 'operativo',      20),
  ('prov_transporte',  'Proveedores transporte', 'operativo',      21),
  ('prov_bodega',      'Proveedores bodega',     'operativo',      22),
  -- Operativo · Mantenimiento
  ('mante_mobiliario', 'Mantenimiento mobiliario','operativo',     30),
  ('mante_vehiculos',  'Mantenimiento vehículos','operativo',      31),
  ('mante_bodega',     'Mantenimiento bodega',   'operativo',      32),
  -- Operativo · Servicios
  ('combustible',      'Combustible',            'operativo',      40),
  ('servicios',        'Servicios públicos',     'operativo',      41),
  ('arriendo',         'Arriendo',               'operativo',      42),
  ('dotacion',         'Dotación',               'operativo',      43),
  -- Administrativo
  ('administrativos',  'Administrativos',        'administrativo', 50),
  ('financieros',      'Gastos financieros',     'financiero',     60),
  ('impuestos',        'Impuestos',              'financiero',     61),
  -- Otros
  ('otros',            'Otros gastos',           'operativo',      90),
  -- Inversión (no es gasto, es CAPEX)
  ('inversion',        'Inversión / CAPEX',      'inversion',      100),
  -- Por revisar (catch-all)
  ('por_revisar',      'Por revisar',            'no_pyg',         999)
on conflict (id) do nothing;

-- =====================================================================
-- GASTOS
-- =====================================================================
create table if not exists public.gastos (
  id              uuid primary key default uuid_generate_v4(),
  fecha           date not null,
  empresa_id      text not null references public.empresas(id),
  categoria_id    text not null references public.expense_categorias(id),
  bank_cuenta_id  uuid references public.bank_cuentas(id),
  proveedor_id    uuid references public.proveedores(id),
  concepto        text not null,
  monto           numeric(14,2) not null check (monto > 0),
  soporte_url     text,
  observaciones   text,
  registrado_por  uuid references public.usuarios(id),
  registrado_en   timestamptz not null default now(),
  periodo_cerrado boolean not null default false   -- se marca true cuando se cierra el mes
);
create index if not exists idx_gastos_fecha on public.gastos(fecha desc);
create index if not exists idx_gastos_empresa on public.gastos(empresa_id, fecha);
create index if not exists idx_gastos_categoria on public.gastos(categoria_id);

-- =====================================================================
-- RETIROS DE SOCIOS
-- NO son gasto contable. Salen contra patrimonio.
-- =====================================================================
create table if not exists public.socio_retiros (
  id              uuid primary key default uuid_generate_v4(),
  fecha           date not null,
  socio_nombre    text not null,                   -- 'JOHANNA' | 'FABIAN' | etc
  empresa_id      text not null references public.empresas(id),
  bank_cuenta_id  uuid references public.bank_cuentas(id),
  monto           numeric(14,2) not null check (monto > 0),
  concepto        text,
  soporte_url     text,
  registrado_por  uuid references public.usuarios(id),
  registrado_en   timestamptz not null default now(),
  periodo_cerrado boolean not null default false
);
create index if not exists idx_retiros_fecha on public.socio_retiros(fecha desc);
create index if not exists idx_retiros_socio on public.socio_retiros(socio_nombre, fecha);

-- =====================================================================
-- TRANSFERENCIAS INTERNAS (entre cuentas propias)
-- NO son gasto. Solo movimiento de caja.
-- =====================================================================
create table if not exists public.transferencias_internas (
  id                uuid primary key default uuid_generate_v4(),
  fecha             date not null,
  origen_cuenta_id  uuid not null references public.bank_cuentas(id),
  destino_cuenta_id uuid not null references public.bank_cuentas(id),
  monto             numeric(14,2) not null check (monto > 0),
  concepto          text,
  soporte_url       text,
  registrado_por    uuid references public.usuarios(id),
  registrado_en     timestamptz not null default now(),
  check (origen_cuenta_id <> destino_cuenta_id)
);
create index if not exists idx_transfer_fecha on public.transferencias_internas(fecha desc);

-- =====================================================================
-- PERÍODOS DE CIERRE MENSUAL
-- Cuando un mes está cerrado, no se puede editar gastos/retiros de ese mes.
-- =====================================================================
create table if not exists public.periodos_cierre (
  id          smallserial primary key,
  anio        smallint not null,
  mes         smallint not null check (mes between 1 and 12),
  empresa_id  text not null references public.empresas(id),
  estado      text not null default 'abierto',     -- abierto | cerrado
  cerrado_por uuid references public.usuarios(id),
  cerrado_en  timestamptz,
  notas       text,
  unique (anio, mes, empresa_id)
);

-- =====================================================================
-- RLS · Solo Gerencia / Coord. Financiero / Contador / Asistente Contable
-- pueden ver el módulo financiero. Retiros de socios solo Gerencia +
-- Contador Externo (no Coord. Control).
-- =====================================================================

alter table public.empresas               enable row level security;
alter table public.bank_cuentas           enable row level security;
alter table public.expense_categorias     enable row level security;
alter table public.gastos                 enable row level security;
alter table public.socio_retiros          enable row level security;
alter table public.transferencias_internas enable row level security;
alter table public.periodos_cierre        enable row level security;

-- Empresas y categorías: lectura para todos los autenticados (sirve de catálogo)
create policy empresas_read on public.empresas
  for select using (auth.uid() is not null);
create policy expense_cat_read on public.expense_categorias
  for select using (auth.uid() is not null);

-- Cuentas bancarias: solo financieros las ven
create policy bank_read on public.bank_cuentas
  for select using (
    public.my_role() in (
      'gerencia_general', 'coord_admin_financiero', 'coord_admin_control',
      'asistente_contable', 'contador_externo'
    )
  );
create policy bank_write on public.bank_cuentas
  for all using (
    public.my_role() in ('gerencia_general', 'coord_admin_financiero')
  );

-- Gastos: lectura financiera; escritura financiera + asistente contable
create policy gastos_read on public.gastos
  for select using (
    public.my_role() in (
      'gerencia_general', 'coord_admin_financiero', 'coord_admin_control',
      'asistente_contable', 'contador_externo'
    )
  );
create policy gastos_insert on public.gastos
  for insert with check (
    public.my_role() in (
      'gerencia_general', 'coord_admin_financiero', 'asistente_contable'
    )
  );
create policy gastos_update on public.gastos
  for update using (
    public.my_role() in ('gerencia_general', 'coord_admin_financiero', 'asistente_contable')
    and periodo_cerrado = false                  -- no se puede editar mes cerrado
  );

-- Retiros de socios: SOLO Gerencia y Contador Externo
create policy retiros_read on public.socio_retiros
  for select using (
    public.my_role() in ('gerencia_general', 'contador_externo')
  );
create policy retiros_write on public.socio_retiros
  for all using (
    public.my_role() = 'gerencia_general' and (periodo_cerrado = false or true)
  );

-- Transferencias internas: financieros
create policy transfer_read on public.transferencias_internas
  for select using (
    public.my_role() in (
      'gerencia_general', 'coord_admin_financiero', 'coord_admin_control',
      'asistente_contable', 'contador_externo'
    )
  );
create policy transfer_write on public.transferencias_internas
  for all using (
    public.my_role() in ('gerencia_general', 'coord_admin_financiero', 'asistente_contable')
  );

-- Períodos de cierre: lectura financiera; cierre solo Gerencia + Coord. Financiero
create policy periodos_read on public.periodos_cierre
  for select using (
    public.my_role() in (
      'gerencia_general', 'coord_admin_financiero', 'coord_admin_control',
      'asistente_contable', 'contador_externo'
    )
  );
create policy periodos_write on public.periodos_cierre
  for all using (
    public.my_role() in ('gerencia_general', 'coord_admin_financiero')
  );
