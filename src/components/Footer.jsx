import React from 'react';
import { Link } from 'react-router-dom';
import { LanguageSelector } from './LanguageSelector';

export function Footer({ showAd = true }) {
  return (
    <footer className="mt-12 pt-6 border-t border-white/5">
      {/* Banner de Anuncios Nativos Adsterra (Comentado temporalmente) */}
      {/* {showAd && <AdsterraNativeBanner />} */}

      <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 text-xs text-white/30">
        <span className="font-semibold text-white/50">© 2026 Musiclub</span>
        <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
        <Link to="/faq" className="hover:text-[#f5576c] transition-colors flex items-center gap-1">
          <span>❓</span> FAQ & Guía
        </Link>
        <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
        <Link to="/privacy" className="hover:text-[#f5576c] transition-colors flex items-center gap-1">
          <span>🔒</span> Privacidad
        </Link>
        <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
        <Link to="/terms" className="hover:text-[#f5576c] transition-colors flex items-center gap-1">
          <span>📋</span> Términos
        </Link>
        <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
        <Link to="/patch-notes" className="hover:text-[#f5576c] transition-colors flex items-center gap-1">
          <span>📜</span> Patch Notes & Versiones
        </Link>
        <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
        <Link to="/portadas" className="hover:text-[#f5576c] transition-colors flex items-center gap-1">
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

