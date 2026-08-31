// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden relative selection:bg-cyan-500 selection:text-black flex flex-col justify-between">
      {/* Background ambient glowing lights */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-[#f5576c]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <SEO
        title="404: Pista No Encontrada | Musiclub"
        description="La página o disco que estás buscando no existe en el repertorio o ha sido movido a otra frecuencia."
        url="https://musiclub.org/404"
      />

      <div className="max-w-7xl mx-auto space-y-8 w-full flex-grow flex flex-col">
        {/* Universal Standard App Header */}
        <AppHeader showTitle={false} />

        {/* 404 Hero Container */}
        <div className="my-auto py-8 sm:py-16 flex flex-col items-center justify-center text-center px-4">
          {/* Holographic 404 Vinyl Icon with Neon Glow */}
          <div className="relative mb-8 group">
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-purple-600 to-[#f5576c] rounded-full blur-2xl opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse" />
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-[#1a1c2e] via-[#0f111d] to-[#07080e] border-2 border-cyan-500/40 flex items-center justify-center shadow-2xl overflow-hidden">
              {/* Spinning vinyl grooves */}
              <div className="absolute inset-2 rounded-full border border-white/5 animate-spin" style={{ animationDuration: '12s' }}>
                <div className="absolute inset-2 rounded-full border border-white/5" />
                <div className="absolute inset-4 rounded-full border border-cyan-500/10" />
                <div className="absolute inset-6 rounded-full border border-white/5" />
              </div>
              <div className="text-5xl sm:text-6xl animate-bounce" style={{ animationDuration: '2.5s' }}>
                💿
              </div>
            </div>
            {/* 404 Floating Tag */}
            <span className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#f5576c] to-purple-600 text-white font-mono text-xs sm:text-sm font-black px-3 py-1 rounded-full shadow-lg border border-white/20">
              ERROR 404
            </span>
          </div>

          {/* Glitch Typography Title */}
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-widest">
              <span className="animate-ping inline-flex h-2 w-2 rounded-full bg-cyan-400 opacity-75" />
              Frecuencia No Sintonizada
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
              Pista Fuera de Órbita
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
              La página o el álbum que buscas no está en el repertorio actual de Musiclub o fue movido a otra dimensión sonora.
            </p>
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 mt-10 w-full max-w-3xl">
            <Link
              to="/"
              className="p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] hover:from-cyan-500/20 hover:to-blue-500/10 border border-white/10 hover:border-cyan-500/40 transition-all text-left group flex flex-col justify-between shadow-lg"
            >
              <div>
                <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">🏠</span>
                <p className="font-bold text-white text-sm">Inicio</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Volver a la portada principal</p>
              </div>
              <span className="text-[10px] text-cyan-400 font-bold mt-3 block group-hover:translate-x-1 transition-transform">
                Explorar →
              </span>
            </Link>

            <Link
              to="/albumes"
              className="p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] hover:from-purple-500/20 hover:to-pink-500/10 border border-white/10 hover:border-purple-500/40 transition-all text-left group flex flex-col justify-between shadow-lg"
            >
              <div>
                <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">💿</span>
                <p className="font-bold text-white text-sm">Catálogo</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Ver todos los álbumes y reviews</p>
              </div>
              <span className="text-[10px] text-purple-400 font-bold mt-3 block group-hover:translate-x-1 transition-transform">
                Ver discos →
              </span>
            </Link>

            <Link
              to="/leaderboard"
              className="p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] hover:from-amber-500/20 hover:to-yellow-500/10 border border-white/10 hover:border-amber-500/40 transition-all text-left group flex flex-col justify-between shadow-lg"
            >
              <div>
                <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">🏆</span>
                <p className="font-bold text-white text-sm">Leaderboard</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Top discos y mejores notas</p>
              </div>
              <span className="text-[10px] text-amber-400 font-bold mt-3 block group-hover:translate-x-1 transition-transform">
                Ver rankings →
              </span>
            </Link>

            <Link
              to="/gashapon"
              className="p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] hover:from-rose-500/20 hover:to-red-500/10 border border-white/10 hover:border-rose-500/40 transition-all text-left group flex flex-col justify-between shadow-lg"
            >
              <div>
                <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">🎲</span>
                <p className="font-bold text-white text-sm">Gashapon</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Ruleta y descubrimientos</p>
              </div>
              <span className="text-[10px] text-rose-400 font-bold mt-3 block group-hover:translate-x-1 transition-transform">
                Tirar ruleta →
              </span>
            </Link>
          </div>

          {/* Action Back Button */}
          <div className="mt-8">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-2 mx-auto active:scale-95"
            >
              <span>←</span>
              <span>Regresar a la página anterior</span>
            </button>
          </div>
        </div>
      </div>

      {/* Universal Standard Footer */}
      <Footer />
    </div>
  );
}

export default NotFoundPage;
