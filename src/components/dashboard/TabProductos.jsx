import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Package } from 'lucide-react';
import { EmptyState } from '../shared/EmptyState.jsx';
import { money } from '../../utils/format.js';
import { calcItemTotal } from '../../utils/calculos.js';

const PIE_COLORS = ['#e11d48', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6', '#64748b'];

export function TabProductos({ events }) {
  const topProductos = useMemo(() => {
    const map = {};
    events
      .filter((e) => e.estado === 'VENDIDO')
      .forEach((ev) => {
        (ev.items || []).forEach((it) => {
          const key = it.codigo + '|' + it.nombre;
          if (!map[key]) map[key] = { codigo: it.codigo, nombre: it.nombre, categoria: it.categoria, cantidad: 0, valor: 0, cotizaciones: 0 };
          map[key].cantidad += Number(it.cantidad) || 0;
          map[key].valor += calcItemTotal(it);
          map[key].cotizaciones++;
        });
      });
    return Object.values(map).sort((a, b) => b.valor - a.valor).slice(0, 10);
  }, [events]);

  const porCategoria = useMemo(() => {
    const map = {};
    events
      .filter((e) => e.estado === 'VENDIDO')
      .forEach((ev) => {
        (ev.items || []).forEach((it) => {
          if (!map[it.categoria]) map[it.categoria] = { categoria: it.categoria, valor: 0 };
          map[it.categoria].valor += calcItemTotal(it);
        });
      });
    return Object.values(map).sort((a, b) => b.valor - a.valor);
  }, [events]);

  const totalCat = porCategoria.reduce((s, c) => s + c.valor, 0);
  const chartData = porCategoria.map((c) => ({ name: c.categoria, value: c.valor }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 card p-5">
        <h3 className="text-sm font-bold mb-3">Top productos más vendidos</h3>
        {topProductos.length === 0 ? (
          <EmptyState icon={Package} description="Sin datos" variant="plain" />
        ) : (
          <div className="space-y-1">
            {topProductos.map((p, i) => (
              <div key={p.codigo + i} className="flex items-center gap-3 p-2 hover:bg-surface-sunken rounded-lg transition">
                <div
                  className={`w-7 h-7 rounded-full ${
                    i === 0 ? 'bg-amber-500' : i < 3 ? 'bg-fg' : 'bg-surface-sunken text-fg'
                  } ${i < 3 ? 'text-white' : ''} flex items-center justify-center text-[10px] font-bold`}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate text-fg">{p.nombre}</div>
                  <div className="text-[10px] text-fg-muted">{p.categoria} · {p.cantidad} unid · {p.cotizaciones} cotiz.</div>
                </div>
                <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">{money(p.valor)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-bold mb-3">Por categoría</h3>
        {porCategoria.length === 0 ? (
          <div className="text-center py-6 text-fg-subtle text-xs">Sin datos</div>
        ) : (
          <>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={34} outerRadius={62} paddingAngle={3} dataKey="value">
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="rgb(var(--surface))" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 10, fontSize: 11 }}
                    formatter={(v) => [money(v), 'Valor']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-3">
              {porCategoria.map((c, i) => {
                const pct = totalCat > 0 ? (c.valor / totalCat) * 100 : 0;
                return (
                  <div key={c.categoria}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="flex items-center gap-1.5 font-medium text-fg">
                        <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {c.categoria}
                      </span>
                      <span className="font-mono font-bold">{Math.round(pct)}%</span>
                    </div>
                    <div className="text-[10px] text-fg-subtle">{money(c.valor)}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
