// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { LanguageSelector } from './LanguageSelector';

export function Footer() {
  return (
    <footer className="mt-12 pt-6 border-t border-white/5">
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
        <LanguageSelector variant="footer" />
        <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
        <span className="text-white/20">Hecho con 🎵 para el club</span>
      </div>
    </footer>
  );
}

