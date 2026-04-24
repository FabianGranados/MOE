import { VideoPlayer } from './VideoPlayer.jsx';

export function VideoDemo() {
  return (
    <div className="min-h-screen bg-surface-sunken p-6 sm:p-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Video Demo</h1>
          <p className="text-sm text-fg-muted mt-1">
            Prueba del componente <code className="font-mono text-xs bg-surface px-1.5 py-0.5 rounded">VideoPlayer</code> leyendo desde <code className="font-mono text-xs bg-surface px-1.5 py-0.5 rounded">/videos/</code>.
          </p>
        </header>

        <section className="card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Autoplay · Loop · Mute</h2>
          <VideoPlayer src="/videos/test-3s.mp4" autoPlay loop muted />
          <p className="text-xs text-fg-muted">
            Uso: <code className="font-mono">{'<VideoPlayer src="/videos/test-3s.mp4" autoPlay loop muted />'}</code>
          </p>
        </section>

        <section className="card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Controles manuales</h2>
          <VideoPlayer src="/videos/test-3s.mp4" />
          <p className="text-xs text-fg-muted">Hover sobre el video para ver los controles.</p>
        </section>

        <p className="text-xs text-fg-subtle text-center">
          Quita <code className="font-mono">?demo=video</code> de la URL para volver a la app.
        </p>
      </div>
    </div>
  );
}
