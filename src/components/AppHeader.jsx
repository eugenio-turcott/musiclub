// src/components/AppHeader.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export function AppHeader({ user, isAdmin, onLogin, onLogout, loading }) {
  return (
    <header className="w-full border-b border-white/5 bg-black/30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo izquierda */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#f5576c] to-[#f093fb] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#f5576c]/20 group-hover:scale-105 transition-transform">
            🎵
          </div>
          <span className="text-white/80 font-bold text-sm tracking-tight hidden sm:block group-hover:text-white transition-colors">
            Musiclub
          </span>
        </Link>

        {/* Login / User a la derecha */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-white/10"
                />
              )}
              <span className="text-white/60 text-sm hidden sm:block">
                {user.name || user.email}
              </span>
              {isAdmin && (
                <span className="text-[10px] text-[#f5576c] bg-[#f5576c]/10 px-2 py-0.5 rounded-full border border-[#f5576c]/20">
                  Admin
                </span>
              )}
              <button
                onClick={onLogout}
                className="text-white/30 hover:text-white/70 text-sm transition-colors"
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              disabled={loading}
              className="px-4 py-1.5 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white text-sm font-medium rounded-full hover:scale-105 transition-all disabled:opacity-50"
            >
              {loading ? '...' : 'Iniciar sesión'}
            </button>
          )}
        </div>
      </div>

      {/* Título centrado debajo - CON TIPOGRAFÍA 3D ORIGINAL */}
      <div className="text-center pb-4">
        <h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight"
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
