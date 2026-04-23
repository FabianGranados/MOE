import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Briefcase, DollarSign, LayoutDashboard, Package, Sun
} from 'lucide-react';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { MobileNav } from './MobileNav.jsx';
import { CommandPalette } from './CommandPalette.jsx';
import { HoyView } from '../hoy/HoyView.jsx';
import { DashboardView } from '../dashboard/DashboardView.jsx';
import { LeadsView } from '../leads/LeadsView.jsx';
import { ComisionesView } from '../comisiones/ComisionesView.jsx';
import { CatalogoView } from '../catalogo/CatalogoView.jsx';
import { EventForm } from '../evento/EventForm.jsx';
import { useHotkey } from '../../hooks/useHotkey.js';
import { useTheme } from '../../hooks/useTheme.js';
import { newEvent, nextNumero, diffDatos } from '../../utils/eventos.js';

const MENU = [
  { key: 'hoy',        label: 'HOY',                 short: 'Hoy',      icon: Sun,             roles: ['coord_comercial', 'asesor_comercial'] },
  { key: 'dashboard',  label: 'Dashboard',           short: 'Dashboard', icon: LayoutDashboard, roles: ['gerencia_general', 'coord_comercial'] },
  { key: 'leads',      label: 'Leads & Cotizaciones', short: 'Leads',   icon: Briefcase,       roles: ['gerencia_general', 'coord_comercial', 'asesor_comercial'] },
  { key: 'comisiones', label: 'Comisiones',          short: 'Comisión', icon: DollarSign,      roles: ['gerencia_general', 'coord_comercial', 'asesor_comercial'] },
  { key: 'catalogo',   label: 'Catálogo',            short: 'Catálogo', icon: Package,         roles: ['gerencia_general', 'coord_comercial', 'asesor_comercial'] }
];

export function Shell({
  currentUser, events, persistEvents, catalogo, persistCatalogo,
  rangosComision, persistRangos, onLogout
}) {
  const { theme, toggle: toggleTheme } = useTheme();
  const [section, setSection] = useState(() =>
    currentUser.rol === 'gerencia_general' ? 'dashboard' : 'hoy'
  );
  const [activeId, setActiveId] = useState(null);
  const [view, setView] = useState('list');
  const [menuOpen, setMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  useHotkey('mod+k', () => setCmdOpen(true), []);
  useHotkey('mod+n', () => { setView('new'); setSection('leads'); }, []);

  const menu = useMemo(
    () => MENU.filter((m) => m.roles.includes(currentUser.rol)),
    [currentUser.rol]
  );

  const eventosVisibles = useMemo(() => {
    if (currentUser.rol === 'asesor_comercial') {
      return events.filter(
        (e) => e.comercial === currentUser.alias || e.createdBy === currentUser.id
      );
    }
    return events;
  }, [events, currentUser]);

  const saveEvent = async (ev) => {
    const idx = events.findIndex((x) => x.id === ev.id);
    let evFinal = ev;
    if (idx >= 0) {
      const cambios = diffDatos(events[idx], ev, currentUser);
      if (cambios.length > 0) evFinal = { ...ev, historial: [...(ev.historial || []), ...cambios] };
    }
    const next = idx >= 0 ? events.map((x) => (x.id === ev.id ? evFinal : x)) : [evFinal, ...events];
    await persistEvents(next);
    setActiveId(evFinal.id);
    setView('detail');
  };

  const finalizar = async (ev) => {
    const evFinal = { ...ev, finalizado: true, estado: 'EN ESPERA' };
    const idx = events.findIndex((x) => x.id === ev.id);
    const next = idx >= 0 ? events.map((x) => (x.id === ev.id ? evFinal : x)) : [evFinal, ...events];
    await persistEvents(next);
    toast.success('Cotización finalizada', { description: `${evFinal.numeroEvento}-${evFinal.version} quedó bloqueada` });
    setActiveId(null);
    setView('list');
    setSection('leads');
  };

  const marcarVendida = async (ev, datosOp) => {
    const cambios = diffDatos(ev, { ...ev, ...datosOp }, currentUser);
    const entradaVenta = {
      id: `h_${Date.now()}_v`,
      campo: '_estado',
      label: 'Estado',
      anterior: 'EN ESPERA',
      nuevo: 'VENDIDO',
      usuarioId: currentUser.id,
      usuarioNombre: currentUser.nombre,
      fecha: new Date().toISOString()
    };
    const evVendido = {
      ...ev,
      ...datosOp,
      estado: 'VENDIDO',
      historial: [...(ev.historial || []), entradaVenta, ...cambios]
    };
    await persistEvents(events.map((x) => (x.id === ev.id ? evVendido : x)));
    toast.success('¡Venta registrada! 🎉', { description: `${ev.numeroEvento}-${ev.version} marcada como VENDIDA` });
  };

  const marcarPerdida = async (ev, motivo) => {
    await persistEvents(
      events.map((x) => (x.id === ev.id ? { ...x, estado: 'PERDIDO', motivoPerdida: motivo } : x))
    );
    toast('Cotización marcada como perdida', { description: `Motivo: ${motivo}` });
  };

  const nuevaVersion = async (ev) => {
    const versiones = events.filter((e) => e.numeroEvento === ev.numeroEvento);
    const maxV = Math.max(...versiones.map((e) => e.version || 1));
    const clone = {
      ...ev,
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      version: maxV + 1,
      finalizado: false,
      estado: 'EN ESPERA',
      pagos: [],
      direccion: '',
      mapsUrl: '',
      montaje: { fecha: '', tipo: 'abierto', franja: 'manana', hora: '' },
      desmontaje: { fecha: '', tipo: 'abierto', franja: 'tarde', hora: '' },
      contactoPrincipal: { nombre: '', celular: '' },
      contactoBackup: { nombre: '', celular: '' },
      notasOperativas: ''
    };
    await persistEvents([clone, ...events]);
    toast.success(`Versión ${clone.version} creada`, { description: 'Edita la nueva versión' });
    setActiveId(clone.id);
    setView('detail');
    setSection('leads');
  };

  const deleteEvent = async (id) => {
    const ev = events.find((x) => x.id === id);
    await persistEvents(events.filter((x) => x.id !== id));
    toast('Cotización eliminada', { description: ev ? `${ev.numeroEvento}-${ev.version}` : '' });
    setView('list');
    setActiveId(null);
  };

  const openEvent = (id) => { setActiveId(id); setView('detail'); };

  const activeEv = events.find((e) => e.id === activeId);

  return (
    <div className="flex min-h-screen bg-surface-sunken">
      <Sidebar
        menu={menu}
        section={section}
        onNavigate={(k) => { setSection(k); setView('list'); setActiveId(null); }}
        currentUser={currentUser}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        mobileOpen={menuOpen}
        onCloseMobile={() => setMenuOpen(false)}
      />

      <div className="flex-1 md:ml-[240px] min-w-0 pb-20 md:pb-0">
        <Topbar
          currentUser={currentUser}
          onLogout={onLogout}
          onOpenMenu={() => setMenuOpen(true)}
          onOpenSearch={() => setCmdOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="p-4 md:p-8 max-w-[1400px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${section}-${view}-${activeId || ''}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {view === 'list' && section === 'hoy' && (
                <HoyView events={eventosVisibles} onOpen={openEvent} onNew={() => setView('new')} />
              )}
              {view === 'list' && section === 'dashboard' && (
                <DashboardView events={events} onOpen={openEvent} />
              )}
              {view === 'list' && section === 'leads' && (
                <LeadsView
                  events={eventosVisibles}
                  currentUser={currentUser}
                  onOpen={openEvent}
                  onNew={() => setView('new')}
                  onMarcarVendida={marcarVendida}
                  onMarcarPerdida={marcarPerdida}
                  onNuevaVersion={nuevaVersion}
                />
              )}
              {view === 'list' && section === 'comisiones' && (
                <ComisionesView
                  events={events}
                  currentUser={currentUser}
                  rangosComision={rangosComision}
                  persistRangos={persistRangos}
                  onOpen={openEvent}
                />
              )}
              {view === 'list' && section === 'catalogo' && (
                <CatalogoView catalogo={catalogo} persistCatalogo={persistCatalogo} currentUser={currentUser} />
              )}
              {view === 'new' && (
                <EventForm
                  initial={newEvent(nextNumero(events), currentUser)}
                  onCancel={() => setView('list')}
                  onSave={saveEvent}
                  onFinalize={finalizar}
                  catalogo={catalogo}
                  allEvents={events}
                  isNew
                />
              )}
              {view === 'detail' && activeEv && (
                <EventForm
                  key={activeEv.id}
                  initial={activeEv}
                  onCancel={() => setView('list')}
                  onSave={saveEvent}
                  onFinalize={finalizar}
                  onDelete={() => deleteEvent(activeEv.id)}
                  onNuevaVersion={() => nuevaVersion(activeEv)}
                  catalogo={catalogo}
                  allEvents={events}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <MobileNav
        menu={menu}
        section={section}
        onNavigate={(k) => { setSection(k); setView('list'); setActiveId(null); }}
      />

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        events={eventosVisibles}
        menu={menu}
        onNavigate={(k) => { setSection(k); setView('list'); setActiveId(null); }}
        onOpenEvent={openEvent}
        onNew={() => { setSection('leads'); setView('new'); }}
      />
    </div>
  );
}
