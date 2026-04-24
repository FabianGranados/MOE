import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Package, Plus, Save, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '../shared/PageHeader.jsx';
import { EmptyState } from '../shared/EmptyState.jsx';
import { Confirm } from '../shared/Confirm.jsx';
import { FotoProducto } from '../shared/FotoProducto.jsx';
import { FormProducto } from './FormProducto.jsx';
import { CATEGORIAS } from '../../constants.js';
import { money } from '../../utils/format.js';

export function CatalogoView({ catalogo, persistCatalogo, currentUser }) {
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('TODAS');

  const puedeCrearEditar = ['gerencia_general', 'coord_comercial'].includes(currentUser.rol);
  const puedeEliminar = currentUser.rol === 'gerencia_general';
  const esAsesor = currentUser.rol === 'asesor_comercial';

  const guardar = async (data) => {
    if (edit) await persistCatalogo(catalogo.map((p) => (p.id === edit.id ? { ...p, ...data } : p)));
    else await persistCatalogo([{ id: `p_${Date.now()}`, ...data, activo: true }, ...catalogo]);
    setShowForm(false);
    setEdit(null);
  };

  const eliminar = async (p) => {
    await persistCatalogo(catalogo.filter((x) => x.id !== p.id));
    setConfirmDel(null);
  };

  const filtrados = useMemo(
    () =>
      catalogo.filter((p) => {
        if (cat !== 'TODAS' && p.categoria !== cat) return false;
        if (search) return `${p.nombre} ${p.codigo}`.toLowerCase().includes(search.toLowerCase());
        return true;
      }),
    [catalogo, cat, search]
  );

  return (
    <div>
      <PageHeader
        title="Catálogo"
        subtitle={
          <>
            {catalogo.length} productos · Precios base (por día)
            {esAsesor && (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] bg-surface-sunken text-fg-muted border border-border px-2 py-0.5 rounded-full font-semibold">
                <Eye className="w-2.5 h-2.5" /> Solo consulta
              </span>
            )}
          </>
        }
        action={
          puedeCrearEditar && (
            <button onClick={() => { setEdit(null); setShowForm(true); }} className="btn-dark">
              <Plus className="w-3.5 h-3.5" /> Agregar producto
            </button>
          )
        }
      />

      <div className="card p-3 mb-4 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="input pl-8" />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="input w-auto">
          <option value="TODAS">Todas</option>
          {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <span className="text-[10px] text-fg-muted ml-auto font-mono">{filtrados.length} de {catalogo.length}</span>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState icon={Package} title="Sin resultados" description="Ajusta los filtros o agrega un producto nuevo." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtrados.map((p, idx) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.02, 0.3), duration: 0.2 }}
              className="card overflow-hidden group"
            >
              <div className="aspect-square relative overflow-hidden">
                <FotoProducto foto={p.foto} nombre={p.nombre} className="group-hover:scale-[1.02] transition-transform duration-300" />
                <div className="absolute bottom-2 left-2">
                  {p.stock == null ? (
                    <span className="chip bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30">♾️ Sin límite</span>
                  ) : p.stock === 0 ? (
                    <span className="chip bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30">Sin stock</span>
                  ) : p.stock <= 10 ? (
                    <span className="chip bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">⚠️ {p.stock} unid.</span>
                  ) : (
                    <span className="chip bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">{p.stock} unid.</span>
                  )}
                </div>
              </div>
              <div className="p-3">
                <div className="text-[9px] text-fg-muted uppercase font-semibold">{p.categoria}</div>
                <h4 className="text-xs font-semibold line-clamp-2 mt-0.5 min-h-[2rem] text-fg">{p.nombre}</h4>
                {p.codigo && p.codigo !== 'MANUAL' && (
                  <div className="text-[9px] text-fg-subtle font-mono mt-0.5">{p.codigo}</div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold font-mono text-fg">{money(p.precio)}</span>
                  <div className="flex gap-1">
                    {puedeCrearEditar && (
                      <button
                        onClick={() => { setEdit(p); setShowForm(true); }}
                        className="p-1.5 hover:bg-surface-sunken rounded text-fg-muted hover:text-fg transition"
                        title="Editar"
                      >
                        <Save className="w-3 h-3" />
                      </button>
                    )}
                    {puedeEliminar && (
                      <button
                        onClick={() => setConfirmDel(p)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded text-fg-muted hover:text-red-600 transition"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <FormProducto
        open={showForm && puedeCrearEditar}
        editando={edit}
        onCancel={() => { setShowForm(false); setEdit(null); }}
        onSave={guardar}
      />

      <Confirm
        open={!!confirmDel}
        onCancel={() => setConfirmDel(null)}
        onConfirm={() => eliminar(confirmDel)}
        title={`¿Eliminar "${confirmDel?.nombre}"?`}
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
      />
    </div>
  );
}
