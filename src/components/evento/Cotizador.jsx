import { useMemo, useState } from 'react';
import { AlertCircle, Package, Plus, Search, Trash2, XCircle } from 'lucide-react';
import { Modal } from '../shared/Modal.jsx';
import { ModalManual } from './ModalManual.jsx';
import { CATEGORIAS } from '../../constants.js';
import { money } from '../../utils/format.js';
import { calcItemAuto, calcItemTotal, esNoComisionable } from '../../utils/calculos.js';
import { unidadesReservadas, verificarDisponibilidad } from '../../utils/eventos.js';

export function Cotizador({ items, catalogo, addItem, updateItem, removeItem, events = [], fechaEvento, evId }) {
  const [showSel, setShowSel] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('TODAS');

  const prods = catalogo.filter((p) => p.activo);
  const filt = prods.filter((p) => {
    if (cat !== 'TODAS' && p.categoria !== cat) return false;
    if (search) return `${p.nombre} ${p.codigo}`.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const subtotal = items.reduce((s, it) => s + calcItemTotal(it), 0);

  const getDisponibilidad = (it) => {
    const prod = catalogo.find((p) => p.codigo === it.codigo);
    if (!prod || prod.stock == null) return { sinLimite: true };
    return verificarDisponibilidad(prod, it.cantidad, fechaEvento, events, evId);
  };

  const alertasStock = useMemo(
    () => items.map((it) => ({ it, disp: getDisponibilidad(it) })).filter((a) => !a.disp.sinLimite && !a.disp.disponible),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, fechaEvento]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Package className="w-4 h-4 text-brand" /> Productos cotizados
          </h3>
          <p className="text-[11px] text-fg-muted">
            {items.length} producto{items.length !== 1 ? 's' : ''} · Precios auto (editables)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowManual(true)} className="btn-ghost">
            <Plus className="w-3.5 h-3.5" /> Manual
          </button>
          <button onClick={() => setShowSel(true)} className="btn-primary">
            <Plus className="w-3.5 h-3.5" /> Del catálogo
          </button>
        </div>
      </div>

      {alertasStock.length > 0 && (
        <div className="mb-3 bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <strong className="text-xs text-red-900 dark:text-red-300">
              Sobrecupo de inventario · {alertasStock.length} producto{alertasStock.length !== 1 ? 's' : ''}
            </strong>
          </div>
          <div className="text-[11px] text-red-800 dark:text-red-300 space-y-0.5 ml-6">
            {alertasStock.map(({ it, disp }) => (
              <div key={it.id}>
                • <strong>{it.nombre}</strong>: pides {disp.solicitadas}, hay {disp.disponiblesAhora} disponibles ({disp.reservadas} reservadas)
              </div>
            ))}
          </div>
          <div className="text-[10px] text-red-700 dark:text-red-400/80 mt-2 ml-6">
            💡 Reduce cantidades, cambia fecha, o avisa a Gerencia.
          </div>
        </div>
      )}

      {!fechaEvento && items.length > 0 && (
        <div className="mb-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-2.5 text-[11px] text-amber-900 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span><strong>Sin fecha del evento</strong> — asigna una fecha en Comercial para validar stock.</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-surface-sunken border border-dashed border-border rounded-xl p-8 text-center">
          <Package className="w-10 h-10 text-fg-subtle mx-auto mb-2" />
          <p className="text-xs text-fg-muted font-medium">Sin productos agregados</p>
        </div>
      ) : (
        <>
          <ListaItemsMobile items={items} updateItem={updateItem} removeItem={removeItem} />
          <TablaItemsDesktop items={items} updateItem={updateItem} removeItem={removeItem} />
          <div className="hidden md:flex mt-3 bg-fg text-surface rounded-xl p-3 items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold">Subtotal (sin IVA)</span>
            <span className="text-base font-bold font-mono">{money(subtotal)}</span>
          </div>
        </>
      )}

      <SelectorProductos
        open={showSel}
        onClose={() => setShowSel(false)}
        prods={filt}
        catalogo={catalogo}
        search={search}
        setSearch={setSearch}
        cat={cat}
        setCat={setCat}
        onPick={(p) => { addItem(p); setShowSel(false); }}
        fechaEvento={fechaEvento}
        events={events}
        evId={evId}
      />

      <ModalManual
        open={showManual}
        onCancel={() => setShowManual(false)}
        onSave={(p) => { addItem(p); setShowManual(false); }}
      />
    </div>
  );
}

function ListaItemsMobile({ items, updateItem, removeItem }) {
  return (
    <div className="md:hidden space-y-2">
      {items.map((it) => {
        const auto = calcItemAuto(it);
        const total = calcItemTotal(it);
        const esManual = it.precioManual != null;
        const noCom = esNoComisionable(it);
        return (
          <div key={it.id} className="card p-3">
            <div className="flex items-start gap-2 mb-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold leading-tight flex items-start gap-1.5">
                  <span className="flex-1">{it.nombre}</span>
                  {noCom && <span className="chip bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 flex-shrink-0">sin comisión</span>}
                </div>
                <div className="text-[10px] text-fg-muted mt-0.5">{it.codigo} · {it.categoria}</div>
                <div className="text-[10px] text-fg-muted">Base {money(it.precioBase)}/día</div>
              </div>
              <button
                onClick={() => removeItem(it.id)}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 text-fg-subtle hover:text-red-600 rounded flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <LabelInput label="Cantidad">
                <input
                  type="number"
                  min="1"
                  value={it.cantidad}
                  onChange={(e) => updateItem(it.id, { cantidad: Number(e.target.value) || 0 })}
                  className="input text-center font-mono"
                />
              </LabelInput>
              <LabelInput label="Días">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={it.dias}
                  onChange={(e) => updateItem(it.id, { dias: Math.min(30, Math.max(1, Number(e.target.value) || 1)) })}
                  className="input text-center font-mono"
                />
              </LabelInput>
              <LabelInput label="Precio">
                <input
                  type="number"
                  value={esManual ? it.precioManual : Math.round(auto)}
                  onChange={(e) => updateItem(it.id, { precioManual: Number(e.target.value) || 0 })}
                  className={`input text-right font-mono ${esManual ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300' : ''}`}
                />
              </LabelInput>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-[10px] text-fg-muted uppercase font-bold">Subtotal</span>
              <span className="text-sm font-bold font-mono text-fg">{money(total)}</span>
            </div>
          </div>
        );
      })}
      <div className="bg-fg text-surface rounded-xl p-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-bold">Subtotal (sin IVA)</span>
        <span className="text-base font-bold font-mono">{money(items.reduce((s, it) => s + calcItemTotal(it), 0))}</span>
      </div>
    </div>
  );
}

function TablaItemsDesktop({ items, updateItem, removeItem }) {
  return (
    <div className="hidden md:block border border-border rounded-xl overflow-x-auto bg-surface">
      <table className="min-w-full text-xs">
        <thead className="bg-surface-sunken border-b border-border text-fg-muted">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Producto</th>
            <th className="px-2 py-2 text-center font-semibold w-20">Cant.</th>
            <th className="px-2 py-2 text-center font-semibold w-20">Días</th>
            <th className="px-2 py-2 text-center font-semibold w-32">Precio</th>
            <th className="px-2 py-2 text-right font-semibold w-28">Subtotal</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((it) => {
            const auto = calcItemAuto(it);
            const total = calcItemTotal(it);
            const esManual = it.precioManual != null;
            const noCom = esNoComisionable(it);
            return (
              <tr key={it.id} className="hover:bg-surface-sunken/50 transition">
                <td className="px-3 py-2">
                  <div className="font-semibold flex items-center gap-1.5">
                    {it.nombre}
                    {noCom && <span className="chip bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">sin comisión</span>}
                  </div>
                  <div className="text-[10px] text-fg-muted mt-0.5">{it.codigo} · {it.categoria} · Base {money(it.precioBase)}/día</div>
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min="1"
                    value={it.cantidad}
                    onChange={(e) => updateItem(it.id, { cantidad: Number(e.target.value) || 0 })}
                    className="input text-center font-mono"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={it.dias}
                    onChange={(e) => updateItem(it.id, { dias: Math.min(30, Math.max(1, Number(e.target.value) || 1)) })}
                    className="input text-center font-mono"
                  />
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={esManual ? it.precioManual : Math.round(auto)}
                      onChange={(e) => updateItem(it.id, { precioManual: Number(e.target.value) || 0 })}
                      className={`input text-right font-mono ${esManual ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300' : ''}`}
                    />
                    {esManual && (
                      <button
                        onClick={() => updateItem(it.id, { precioManual: null })}
                        className="text-[11px] text-amber-700 px-1"
                        title="Resetear a precio automático"
                      >
                        ↺
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-2 py-2 text-right font-mono font-semibold">{money(total)}</td>
                <td className="px-2 py-2 text-center">
                  <button
                    onClick={() => removeItem(it.id)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 text-fg-subtle hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LabelInput({ label, children }) {
  return (
    <div>
      <label className="block text-[9px] text-fg-muted uppercase font-bold mb-1">{label}</label>
      {children}
    </div>
  );
}

function SelectorProductos({ open, onClose, prods, search, setSearch, cat, setCat, onPick, fechaEvento, events, evId }) {
  return (
    <Modal open={open} onClose={onClose} size="4xl" title="Seleccionar producto">
      <div className="p-4 border-b border-border flex gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
          <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="input pl-8" />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="input w-auto">
          <option value="TODAS">Todas</option>
          {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {prods.map((p) => {
            const reservadas = fechaEvento ? unidadesReservadas(p.codigo, fechaEvento, events, evId) : 0;
            const disponibles = p.stock != null ? Math.max(0, p.stock - reservadas) : null;
            return (
              <button
                key={p.id}
                onClick={() => onPick(p)}
                className="text-left card-hover overflow-hidden transition"
              >
                <div className="aspect-square bg-gradient-to-br from-surface-sunken to-border/40 flex items-center justify-center relative">
                  {p.foto ? (
                    <img src={p.foto} alt="" className="w-full h-full object-cover no-drag" />
                  ) : (
                    <Package className="w-10 h-10 text-fg-subtle" />
                  )}
                  {p.stock != null && (
                    <div className="absolute bottom-1.5 left-1.5">
                      {disponibles === 0 ? (
                        <span className="text-[8px] px-1.5 py-0.5 bg-red-600 text-white rounded-full font-bold">Agotado</span>
                      ) : disponibles <= 5 ? (
                        <span className="text-[8px] px-1.5 py-0.5 bg-amber-500 text-white rounded-full font-bold">Solo {disponibles}</span>
                      ) : (
                        <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500 text-white rounded-full font-bold">{disponibles} disp.</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-[9px] text-fg-muted uppercase font-semibold">{p.categoria}</div>
                  <h4 className="text-xs font-semibold line-clamp-2 mt-0.5 text-fg">{p.nombre}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold font-mono text-fg">{money(p.precio)}</span>
                    <Plus className="w-4 h-4 text-brand" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
