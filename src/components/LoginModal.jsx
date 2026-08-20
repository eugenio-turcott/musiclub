// src/components/LoginModal.jsx
import React, { useState } from 'react';

export function LoginModal({
  isOpen,
  onClose,
  onLogin,
  loading,
  onGoogleLogin,
  googleLoading,
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [useEmail, setUseEmail] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Por favor ingresa un email válido');
      return;
    }

    const result = await onLogin(email.trim(), name.trim());
    if (!result.success) {
      setError(result.error || 'Error al iniciar sesión');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    const result = await onGoogleLogin();
    if (!result.success) {
      setError(result.error || 'Error al iniciar sesión con Google');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[9999] p-4">
      <div className="bg-black/90 border border-[#f5576c]/30 rounded-3xl p-6 sm:p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            🎵 MUSICLUB
          </h3>
          <p className="text-white/50 text-xs sm:text-sm">
            Inicia sesión para proponer, calificar y descubrir música
          </p>
        </div>

        {/* Botón de Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-3 transition-all duration-300 disabled:opacity-50"
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
          <span className="text-white font-medium">
            {googleLoading ? 'Conectando...' : 'Continuar con Google'}
          </span>
        </button>

        {/* Separador */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-black/90 px-3 text-white/20">
              O continuar con email
            </span>
          </div>
        </div>

        {/* Formulario de email (opcional) */}
        {useEmail ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white/40 text-xs block mb-1">
                Tu Nombre (opcional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#f5576c]/50 transition-colors"
              />
            </div>

            <div>
              <label className="text-white/40 text-xs block mb-1">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#f5576c]/50 transition-colors"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="text-[#f5576c] text-xs bg-[#f5576c]/10 px-3 py-2 rounded-lg">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white font-bold py-3 rounded-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50"
            >
              {loading ? '🔄 Verificando...' : '🎯 Ingresar'}
            </button>

            <button
              type="button"
              onClick={() => setUseEmail(false)}
              className="w-full text-white/30 text-sm hover:text-white/50 transition-colors"
            >
              ← Volver
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setUseEmail(true)}
            className="w-full text-white/30 text-sm hover:text-white/50 transition-colors py-2"
          >
            Usar email en lugar de Google
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full text-white/20 text-sm hover:text-white/30 transition-colors mt-4"
        >
          Cancelar
        </button>

        <div className="mt-4 text-center">
          <p className="text-white/20 text-[10px]">
            Los usuarios se registran automáticamente al sugerir un álbum
          </p>
        </div>
      </div>
    </div>
  );
}
