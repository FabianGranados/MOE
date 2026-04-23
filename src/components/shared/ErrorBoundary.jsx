import { Component } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[MOE] Error boundary:', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="max-w-md w-full card p-6 text-center border-red-300 dark:border-red-500/40">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-fg">Algo salió mal</h2>
            <p className="text-sm text-fg-muted mt-2 mb-4">
              La vista tuvo un error inesperado. Tus datos están a salvo.
            </p>
            <pre className="text-[10px] text-left bg-surface-sunken rounded-lg p-3 overflow-x-auto mb-4 max-h-32">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <div className="flex gap-2 justify-center">
              <button onClick={this.reset} className="btn-dark">
                <RotateCw className="w-3.5 h-3.5" /> Reintentar
              </button>
              <button onClick={() => window.location.reload()} className="btn-ghost">
                Recargar app
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
