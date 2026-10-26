import React from 'react';
import { RefreshCw, AlertTriangle, RotateCcw, ShieldAlert } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturó una excepción en tiempo de ejecución:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndClearCache = () => {
    try {
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((reg) => reg.unregister());
        });
      }
    } catch (e) {
      console.warn('Aviso limpiando caché:', e);
    }
    // Redirigir limpiando la URL
    window.location.href = '/doctor';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-teal-500/30 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center mx-auto border border-teal-500/30 shadow-md">
              <ShieldAlert className="w-8 h-8 text-teal-300" />
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-white">
                Dra. Adriana Parra
              </h2>
              <p className="text-xs text-teal-400 font-semibold mt-0.5">
                Odontología Especializada • Sistema Clínico Seguro
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-left">
              <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Actualización del sistema completada</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Se detectaron nuevos cambios en la aplicación. Presiona el botón verde para recargar y continuar trabajando normalmente.
              </p>
              {this.state.error?.message && (
                <p className="text-[10px] text-slate-500 font-mono mt-2 p-2 bg-slate-900 rounded-lg break-words">
                  {this.state.error.message}
                </p>
              )}
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar Aplicación</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetAndClearCache}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 border border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Actualizar y Limpiar Caché</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-500">
              Guacara / Yagua, Edo. Carabobo 🇻🇪 • Datos locales protegidos
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
