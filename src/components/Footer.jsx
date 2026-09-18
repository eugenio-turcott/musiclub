'use client';
import React from 'react';
import { Link } from 'react-router-dom';
import { LanguageSelector } from './LanguageSelector';

export function Footer({ showAd = true }) {
  return (
    <footer className="mt-12 pt-6 border-t border-white/5">
      {/* Banner de Anuncios Nativos Adsterra (Comentado temporalmente) */}
      {/* {showAd && <AdsterraNativeBanner />} */}

      {/* Brand Divider with Spinning Musiclub Logo */}
      <div className="flex items-center justify-center gap-3 mb-4 select-none pointer-events-none">
        <div className="h-px w-12 sm:w-24 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-400/15 rounded-full blur-md animate-pulse" />
          <img
            src="/musiclub_logo.png"
            alt="Musiclub Logo"
            className="w-full h-full object-contain animate-spin-slow drop-shadow-[0_0_10px_rgba(251,191,36,0.35)] opacity-80"
          />
        </div>
        <div className="h-px w-12 sm:w-24 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>

      <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 text-xs text-white/30">
        <span className="font-semibold text-white/50 flex items-center gap-1.5">
          <img
            src="/musiclub_logo_corchea.png"
            alt="Musiclub"
            className="w-3.5 h-3.5 object-contain inline opacity-70"
          />
          <span>© 2026 Musiclub</span>
        </span>
        <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
        <Link
          to="/faq"
          className="hover:text-[#f5576c] transition-colors flex items-center gap-1"
        >
          <span>❓</span> FAQ & Guía
        </Link>
        <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
        <Link
          to="/privacy"
          className="hover:text-[#f5576c] transition-colors flex items-center gap-1"
        >
          <span>🔒</span> Privacidad
        </Link>
        <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
        <Link
          to="/terms"
          className="hover:text-[#f5576c] transition-colors flex items-center gap-1"
        >
          <span>📋</span> Términos
        </Link>
        <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
        <Link
          to="/patch-notes"
          className="hover:text-[#f5576c] transition-colors flex items-center gap-1"
        >
          <span>📜</span> Patch Notes & Versiones
        </Link>
        <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
        <Link
          to="/portadas"
          className="hover:text-[#f5576c] transition-colors flex items-center gap-1"
        >
          <span>🖼️</span> Calificar Portadas
        </Link>
        <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
        {/* Adsterra Smartlink Estratégico (Apoyo al Club) */}
        <a
          href="https://www.profitableratecpmnetwork.com/t6th9d40w?key=4e5727d8ec1bfa194c514b1411284db6"
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="hover:text-amber-400 text-amber-500/80 transition-colors flex items-center gap-1 font-medium"
          title="Enlace patrocinado para apoyar el mantenimiento de Musiclub"
        >
          <span>✨</span> Apoya a Musiclub
        </a>
        <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
        <LanguageSelector variant="footer" />
        <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
        <span className="text-white/20">Hecho con 🎵 para el club</span>
      </div>
    </footer>
  );
}
