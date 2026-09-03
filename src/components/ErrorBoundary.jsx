// src/components/ErrorBoundary.jsx
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);

    // If it's a DOM removeChild/insertBefore error caused by external DOM manipulation (e.g. Google Translate)
    const isDomMismatch =
      error?.name === 'NotFoundError' ||
      error?.message?.includes('removeChild') ||
      error?.message?.includes('insertBefore') ||
      error?.message?.includes('Node');

    if (isDomMismatch) {
      console.warn(
        'Detected DOM tree mutation conflict (likely Google Translate). Attempting graceful state reset.'
      );
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a14] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-3xl shadow-lg shadow-pink-500/20">
            ⚠️
          </div>
          <div className="space-y-1.5 max-w-md">
            <h2 className="text-xl font-black text-white">
              Ha ocurrido un detalle en la interfaz
            </h2>
            <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
              La vista se vio afectada temporalmente por la traducción del navegador.
              Puedes reintentar o recargar la página limpiamente.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/15"
            >
              Reintentar vista
            </button>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white rounded-xl text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
