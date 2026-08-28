// src/components/LoginModal.jsx
import { useState } from 'react';
import { createPortal } from 'react-dom';

export function LoginModal({
  isOpen,
  onClose,
  onGoogleLogin,
  onLogin,
  googleLoading,
  loading,
}) {
  const [error, setError] = useState(null);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const isLoading = googleLoading || loading;

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const loginFn = onGoogleLogin || onLogin;
      if (loginFn) {
        const result = await loginFn();
        if (result && result.success === false) {
          setError(result.error || 'Error al iniciar sesión con Google');
        } else if (result && result.error) {
          setError(result.error);
        }
      }
    } catch (err) {
      setError(err?.message || 'Error al iniciar sesión');
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[99999] p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-gradient-to-br from-[#181935] via-[#101226] to-[#0a0b16] border border-[#f5576c]/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow de fondo decorativo */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#f5576c]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#f093fb]/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Botón cerrar X */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer z-10"
          title="Cerrar"
        >
          ✕
        </button>

        <div className="relative z-10 text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-[#f5576c]/20 to-[#f093fb]/20 border border-[#f5576c]/30 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(245,87,108,0.2)]">
            🎵
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
            MUSICLUB
          </h3>
          <p className="text-white/60 text-xs sm:text-sm max-w-xs mx-auto leading-relaxed">
            Inicia sesión con Google para proponer, calificar y descubrir música con la comunidad.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-xs p-3 rounded-xl mb-4 relative z-10 text-left">
            ⚠️ {error}
          </div>
        )}

        {/* Botón de Google */}
        <div className="relative z-10 space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-black font-extrabold text-sm rounded-2xl px-5 py-3.5 shadow-xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 48 48"
            >
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              />
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              />
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              />
            </svg>
            <span>
              {isLoading ? 'Conectando con Google...' : 'Continuar con Google'}
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-white/40 hover:text-white text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
