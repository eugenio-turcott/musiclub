// src/components/AppHeader.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export function AppHeader({ user, isAdmin, onLogin, onLogout, loading }) {
  return (
    <header className="w-full border-b border-white/5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo izquierda */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
            <img
              src="/5662059.png"
              alt="Musiclub Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-white/80 font-bold text-xl tracking-tight hidden sm:block group-hover:text-white transition-colors">
            Musiclub
          </span>
        </Link>

        {/* Enlaces centrales */}
        <div className="hidden md:flex items-center gap-5">
          <Link
            to="/leaderboard"
            className="text-white/60 hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5"
          >
            <span>🏆</span> Leaderboard
          </Link>
          <Link
            to="/albumes"
            className="text-white/60 hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5"
          >
            <span>💿</span> Álbumes
          </Link>
          <Link
            to="/reviews"
            className="text-white/60 hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5"
          >
            <span>📝</span> Reviews
          </Link>
          {user && (
            <Link
              to="/profile"
              className="text-white/60 hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5"
            >
              <span>👤</span> Mi Perfil
            </Link>
          )}
          {user && (
            <Link
              to="/settings"
              className="text-white/60 hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5"
            >
              <span>⚙️</span> Configuración
            </Link>
          )}
        </div>

        {/* Login / User a la derecha */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAdmin && (
            <Link
              to="/admin"
              className="text-xs text-[#f5576c] font-semibold bg-[#f5576c]/15 px-2.5 sm:px-3 py-1.5 rounded-full border border-[#f5576c]/30 hover:bg-[#f5576c]/25 transition-all flex items-center gap-1 shadow-sm"
            >
              <span>🔧</span>
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-black/40 border border-white/15 pl-1.5 pr-2 sm:pr-2.5 py-1 rounded-full shadow-lg backdrop-blur-md">
              <Link
                to="/profile"
                className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity"
                title="Ver mi perfil"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-white/20 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/100/1a1a2e/ffffff?text=👤';
                    }}
                  />
                ) : (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-[#f5576c] to-[#f093fb] text-white font-bold text-xs flex items-center justify-center">
                    {(user.name || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-white/90 text-xs sm:text-sm font-semibold hidden sm:block max-w-[110px] truncate">
                  {user.name || 'Usuario'}
                </span>
              </Link>

              <div className="w-[1px] h-3.5 bg-white/20 mx-0.5"></div>

              <Link
                to="/settings"
                className="text-white/50 hover:text-cyan-300 text-xs p-1 rounded-full transition-colors"
                title="Configuración"
              >
                ⚙️
              </Link>

              <button
                onClick={onLogout}
                className="text-white/50 hover:text-rose-400 text-xs font-semibold px-1.5 py-0.5 rounded-full hover:bg-white/10 transition-all"
                title="Cerrar sesión"
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              disabled={loading}
              className="px-3 sm:px-4 py-1.5 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white text-xs sm:text-sm font-bold rounded-full hover:scale-105 transition-all disabled:opacity-50 shadow-md shadow-[#f5576c]/20"
            >
              {loading ? '...' : 'Iniciar sesión'}
            </button>
          )}
        </div>
      </div>

      {/* Navegación móvil horizontal secundaria */}
      <div className="md:hidden border-t border-white/5 bg-black/20 px-3 py-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max justify-center xs:justify-start">
          <Link
            to="/leaderboard"
            className="text-xs text-white/80 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full border border-white/10 transition-all flex items-center gap-1 font-medium whitespace-nowrap"
          >
            <span>🏆</span> Leaderboard
          </Link>
          <Link
            to="/albumes"
            className="text-xs text-white/80 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full border border-white/10 transition-all flex items-center gap-1 font-medium whitespace-nowrap"
          >
            <span>💿</span> Álbumes
          </Link>
          <Link
            to="/reviews"
            className="text-xs text-white/80 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full border border-white/10 transition-all flex items-center gap-1 font-medium whitespace-nowrap"
          >
            <span>📝</span> Reviews
          </Link>
          {user && (
            <Link
              to="/profile"
              className="text-xs text-white/80 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full border border-white/10 transition-all flex items-center gap-1 font-medium whitespace-nowrap"
            >
              <span>👤</span> Perfil
            </Link>
          )}
          {user && (
            <Link
              to="/settings"
              className="text-xs text-white/80 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full border border-white/10 transition-all flex items-center gap-1 font-medium whitespace-nowrap"
            >
              <span>⚙️</span> Ajustes
            </Link>
          )}
        </div>
      </div>

      {/* Título centrado debajo */}
      <div className="text-center pb-4">
        <h1
          className="title-albumes text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight"
          style={{
            color: '#ffffff',
            textShadow:
              '0 0 7px rgba(245,87,108,0.3), 0 0 10px rgba(245,87,108,0.2), 0 0 21px rgba(245,87,108,0.15), 0 0 42px rgba(245,87,108,0.1)',
          }}
        >
          MÁQUINA MUSICAL
        </h1>
        <p className="text-white/40 tracking-[0.2em] text-xs sm:text-sm mt-0.5">
          Sistema de selección de álbumes · AZAR
        </p>
      </div>
    </header>
  );
}
