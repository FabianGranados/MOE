import { Login } from './components/auth/Login.jsx';
import { Shell } from './components/shell/Shell.jsx';
import { SpinnerPage } from './components/shared/Skeleton.jsx';
import { SinVincular } from './components/shared/SinVincular.jsx';
import { PRODUCTOS_INICIAL, RANGOS_COMISION_DEFAULT, ROLES } from './constants.js';
import { DirtyGuardProvider } from './hooks/useDirtyGuard.jsx';
import { usePersistedState } from './hooks/usePersistedState.js';
import { useSession } from './hooks/useSession.js';

export default function MOEApp() {
  const { loading, currentUser, login, logout } = useSession();
  const [events, persistEvents, eventsHydrated]       = usePersistedState('events', []);
  const [catalogo, persistCatalogo, catalogoHydrated] = usePersistedState('catalogo', PRODUCTOS_INICIAL);
  const [rangos, persistRangos, rangosHydrated]       = usePersistedState('rangos-comision', RANGOS_COMISION_DEFAULT);

  if (loading || !eventsHydrated || !catalogoHydrated || !rangosHydrated) {
    return <SpinnerPage label="Cargando MOE..." />;
  }

  if (!currentUser) return <Login onLogin={login} />;

  // Usuario autenticado pero sin vincular a un rol válido
  if (!currentUser.rol || !ROLES[currentUser.rol]) {
    return <SinVincular email={currentUser.email} onLogout={logout} />;
  }

  return (
    <DirtyGuardProvider>
      <Shell
        currentUser={currentUser}
        events={events}
        persistEvents={persistEvents}
        catalogo={catalogo}
        persistCatalogo={persistCatalogo}
        rangosComision={rangos}
        persistRangos={persistRangos}
        onLogout={logout}
      />
    </DirtyGuardProvider>
  );
}
