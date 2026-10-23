'use client';
import { MusiclubVinyl } from './MusiclubVinyl';
import React from 'react';
import { Link } from 'react-router-dom';
import { LanguageSelector } from './LanguageSelector';
import { FacebookIcon, InstagramIcon, RedditIcon, TikTokIcon } from './common/ShareIcons';
import { YouTubeLogo } from './common/PlatformLogos';

const socialLinks = [
  { name: 'Instagram', href: 'https://www.instagram.com/musicluborg/', Icon: InstagramIcon },
  { name: 'Facebook', href: 'https://www.facebook.com/musicluborg/', Icon: FacebookIcon },
  { name: 'TikTok', href: 'https://www.tiktok.com/@musicluborg', Icon: TikTokIcon },
  { name: 'YouTube', href: 'https://www.youtube.com/@musicluboficial', Icon: YouTubeLogo },
  { name: 'Reddit', href: 'https://www.reddit.com/user/musicluborg/', Icon: RedditIcon },
];

export function Footer({ showAd = true }) {
  return (
    <footer className="mt-12 pt-6 border-t border-white/5">
      {/* Banner de Anuncios Nativos Adsterra (Comentado temporalmente) */}
      {/* {showAd && <AdsterraNativeBanner />} */}

      {/* Brand Divider with Spinning Musiclub Logo */}
      <div className="flex items-center justify-center gap-3 mb-4 select-none pointer-events-none">
        <div className="h-px w-12 sm:w-24 bg-linear-to-r from-transparent via-white/15 to-transparent" />
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-400/15 rounded-full blur-md animate-pulse" />
          <MusiclubVinyl
            src="/musiclub_logo.png"
            alt="Musiclub Logo"
            className="w-full h-full object-contain animate-spin-slow drop-shadow-[0_0_10px_rgba(251,191,36,0.35)] opacity-80"
          />
        </div>
        <div className="h-px w-12 sm:w-24 bg-linear-to-r from-transparent via-white/15 to-transparent" />
      </div>

      <nav aria-label="Musiclub en redes sociales" className="mb-6 px-2">
        <ul className="flex flex-wrap justify-center gap-2">
          {socialLinks.map(({ name, href, Icon }) => (
            <li key={name}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Musiclub en ${name} (se abre en otra pestaña)`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-300 transition-colors hover:border-pink-400/40 hover:bg-pink-400/10 hover:text-pink-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-300"
              >
                <span aria-hidden="true"><Icon className="h-4 w-4 shrink-0" /></span>
                {name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 text-xs text-slate-400">
        <span className="font-semibold text-white/50 flex items-center gap-1.5">
          <img
            src="/musiclub_logo_corchea.png"
            alt="Musiclub"
            className="w-3.5 h-3.5 object-contain inline opacity-70"
          />
          <span>© 2026 Musiclub</span>
        </span>
        <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
        <Link to="/sobre-musiclub" className="hover:text-pink-300 underline">Sobre Musiclub</Link>
        <Link to="/contacto" className="hover:text-pink-300 underline">Contacto</Link>
        <Link to="/guias" className="hover:text-pink-300 underline">Guías de escucha y reseña</Link>
        <Link
          to="/faq"
          className="hover:text-[#f5576c] transition-colors flex items-center gap-1"
        >
          <span>❓</span> Preguntas frecuentes
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
        <LanguageSelector variant="footer" />
        <span className="w-px h-3 bg-white/10 hidden sm:block"></span>
        <span className="text-white/20">Hecho con 🎵 para el club</span>
      </div>
    </footer>
  );
}
