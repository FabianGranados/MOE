import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
import { useDirtyGuard } from '../../hooks/useDirtyGuard.jsx';
import { newEvent, nextNumero, diffDatos } from '../../utils/eventos.js';
import { ErrorBoundary } from '../shared/ErrorBoundary.jsx';

const MENU = [
  { key: 'hoy',        label: 'HOY',                  short: 'Hoy',       icon: Sun,             roles: ['direccion_comercial', 'asesor_comercial'] },
  { key: 'dashboard',  label: 'Dashboard',            short: 'Dashboard', icon: LayoutDashboard, roles: ['gerencia_general', 'direccion_comercial', 'coord_admin_financiero', 'coord_admin_control'] },
  { key: 'leads',      label: 'Leads & Cotizaciones', short: 'Leads',     icon: Briefcase,       roles: ['gerencia_general', 'direccion_comercial', 'asesor_comercial', 'coord_admin_control', 'asistente_contable'] },
  { key: 'comisiones', label: 'Comisiones',           short: 'Comisión',  icon: DollarSign,      roles: ['gerencia_general', 'direccion_comercial', 'asesor_comercial', 'coord_admin_financiero', 'contador_externo'] },
  { key: 'catalogo',   label: 'Catálogo',             short: 'Catálogo',  icon: Package,         roles: ['gerencia_general', 'direccion_comercial', 'asesor_comercial', 'jefe_bodega', 'coord_logistica'] }
];

export function Shell({
  currentUser, events, persistEvents, catalogo, persistCatalogo,
  rangosComision, persistRangos, onLogout
}) {
  const { theme, toggle: toggleTheme } = useTheme();
  const { confirmLeave } = useDirtyGuard();
  const [section, setSection] = useState(() =>
    currentUser.rol === 'gerencia_general' ? 'dashboard' : 'hoy'
  );
  const [activeId, setActiveId] = useState(null);
  const [view, setView] = useState('list');
  const [menuOpen, setMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  const navigateTo = (k) => {
    if (!confirmLeave()) return;
    setSection(k);
    setView('list');
    setActiveId(null);
  };
  const openNew = () => {
    if (!confirmLeave()) return;
    setView('new');
    setSection('leads');
  };
  const goBackToList = () => {
    if (!confirmLeave()) return;
    setView('list');
    setActiveId(null);
  };

  useHotkey('mod+k', () => setCmdOpen(true), []);
  useHotkey('mod+n', openNew, []);

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
    // Navegamos primero — si la persistencia falla, no dejamos al usuario
    // atrapado en la pantalla del wizard sin saber qué pasó.
    setActiveId(null);
    setView('list');
    setSection('leads');
    try {
      await persistEvents(next);
      toast.success('Cotización finalizada', { description: `${evFinal.numeroEvento}-${evFinal.version} quedó bloqueada` });
    } catch (e) {
      console.warn('[finalizar] persist falló:', e);
      toast.error('No se pudo guardar el estado finalizado', { description: 'Reintenta desde la lista.' });
    }
  };

  const marcarVendida = async (ev, datosOp) => {
    const { pagoInicial, ...otros } = datosOp;
    const cambios = diffDatos(ev, { ...ev, ...otros }, currentUser);
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
    const historialEventos = [entradaVenta, ...cambios];
    let pagos = ev.pagos || [];
    if (pagoInicial) {
      pagos = [...pagos, pagoInicial];
      historialEventos.push({
        id: `h_${Date.now()}_pg`,
        campo: '_pago',
        label: 'Pago registrado',
        anterior: '',
        nuevo: `${pagoInicial.tipoPago} · ${pagoInicial.metodo} · $${pagoInicial.monto.toLocaleString('es-CO')}`,
        usuarioId: currentUser.id,
        usuarioNombre: currentUser.nombre,
        fecha: new Date().toISOString()
      });
    }
    const evVendido = {
      ...ev,
      ...otros,
      pagos,
      estado: 'VENDIDO',
      historial: [...(ev.historial || []), ...historialEventos]
    };
    await persistEvents(events.map((x) => (x.id === ev.id ? evVendido : x)));
    toast.success('¡Venta registrada! 🎉', {
      description: pagoInicial
        ? `Pago de $${pagoInicial.monto.toLocaleString('es-CO')} queda pendiente de validación por contabilidad`
        : `${ev.numeroEvento}-${ev.version} marcada como VENDIDA`
    });
  };

  const marcarPerdida = async (ev, motivo) => {
    await persistEvents(
      events.map((x) => (x.id === ev.id ? { ...x, estado: 'PERDIDO', motivoPerdida: motivo } : x))
    );
    toast('Cotización marcada como perdida', { description: `Motivo: ${motivo}` });
  };

  const nuevaVersion = async (ev) => {
    // Versión nueva arranca desde cero — el comercial pidió que no se
    // copien los datos para evitar confusiones por dejar valores viejos.
    // Conservamos sólo el numeroEvento (sigue siendo el mismo cliente)
    // y la versión incrementada.
    const versiones = events.filter((e) => e.numeroEvento === ev.numeroEvento);
    const maxV = Math.max(...versiones.map((e) => e.version || 1));
    const fresh = newEvent(ev.numeroEvento, currentUser);
    const clone = {
      ...fresh,
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      version: maxV + 1
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
        onNavigate={navigateTo}
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
          <ErrorBoundary key={`${section}-${view}-${activeId || ''}-boundary`}>
            <motion.div
              key={`${section}-${view}-${activeId || ''}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {view === 'list' && section === 'hoy' && (
                <HoyView
                  events={eventosVisibles}
                  currentUser={currentUser}
                  rangosComision={rangosComision}
                  onOpen={openEvent}
                  onNew={openNew}
                  onMarcarVendida={marcarVendida}
                  onMarcarPerdida={marcarPerdida}
                />
              )}
              {view === 'list' && section === 'dashboard' && (
                <DashboardView events={events} onOpen={openEvent} />
              )}
              {view === 'list' && section === 'leads' && (
                <LeadsView
                  events={eventosVisibles}
                  currentUser={currentUser}
                  onOpen={openEvent}
                  onNew={openNew}
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
                  onCancel={goBackToList}
                  onSave={saveEvent}
                  onFinalize={finalizar}
                  catalogo={catalogo}
                  allEvents={events}
                  currentUser={currentUser}
                  isNew
                />
              )}
              {view === 'detail' && activeEv && (
                <EventForm
                  key={activeEv.id}
                  initial={activeEv}
                  onCancel={goBackToList}
                  onSave={saveEvent}
                  onFinalize={finalizar}
                  onDelete={() => deleteEvent(activeEv.id)}
                  onNuevaVersion={() => nuevaVersion(activeEv)}
                  catalogo={catalogo}
                  allEvents={events}
                  currentUser={currentUser}
                />
              )}
            </motion.div>
          </ErrorBoundary>
        </main>
      </div>

      <MobileNav
        menu={menu}
        section={section}
        onNavigate={navigateTo}
      />

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        events={eventosVisibles}
        menu={menu}
        onNavigate={navigateTo}
        onOpenEvent={openEvent}
        onNew={openNew}
      />
    </div>
  );
}
