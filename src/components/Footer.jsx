// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-12 pt-6 border-t border-white/5">
      <div className="flex flex-wrap justify-center items-center gap-4 text-xs text-white/20">
        <span>© 2026 Musiclub</span>
        <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
        <Link to="/privacy" className="hover:text-white/40 transition-colors">
          Política de Privacidad
        </Link>
        <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
        <Link to="/terms" className="hover:text-white/40 transition-colors">
          Términos de Servicio
        </Link>
        <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
        <span className="text-white/10">Hecho con 🎵 por la comunidad</span>
      </div>
    </footer>
  );
}
