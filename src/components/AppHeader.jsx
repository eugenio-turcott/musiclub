// src/components/AppHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoginModal } from './LoginModal';
import { HeroMusicCanvas } from './HeroMusicCanvas';

export function AppHeader({
  user: propUser,
  isAdmin: propIsAdmin,
  onLogin: propOnLogin,
  onLogout: propOnLogout,
  loading: propLoading,
  showTitle = false,
  customTitle,
  customSubtitle,
}) {
  const auth = useAuth();
  const location = useLocation();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const heroContainerRef = useRef(null);

  // Fallbacks using useAuth hook if props are not explicitly provided
  const user = propUser !== undefined ? propUser : auth.user;
  const isAdmin = propIsAdmin !== undefined ? propIsAdmin : auth.isAdmin;
  const loading = propLoading !== undefined ? propLoading : auth.loading;

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Cerrar menús al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest('#mobile-menu-btn')
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLoginClick = () => {
    if (propOnLogin) {
      propOnLogin();
    } else {
      setShowLoginModal(true);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginLoading(true);
    const res = await auth.loginWithGoogle();
    setLoginLoading(false);
    if (res.success && !res.redirecting) {
      setShowLoginModal(false);
    }
    return res;
  };

  const handleLogoutClick = async () => {
    setIsUserMenuOpen(false);
    if (propOnLogout) {
      propOnLogout();
    } else {
      await auth.logout();
    }
  };

  const pathname = location.pathname;

  const isLinkActive = (paths) => {
    return paths.some((path) => {
      if (path === '/' && pathname === '/') return true;
      if (path !== '/' && pathname.startsWith(path)) return true;
      return false;
    });
  };

  const navLinks = [
    {
      to: '/recomendaciones',
      label: 'Para Ti',
      icon: '✨',
      paths: ['/recomendaciones', '/para-ti'],
      highlight: true,
    },
    {
      to: '/leaderboard',
      label: 'Leaderboard',
      icon: '🏆',
      paths: ['/leaderboard', '/ranking'],
    },
    {
      to: '/albumes',
      label: 'Álbumes',
      icon: '💿',
      paths: ['/albumes', '/albums'],
    },
    {
      to: '/playlists',
      label: 'Playlists',
      icon: '🎵',
      paths: ['/playlists', '/playlist'],
    },
    {
      to: '/reviews',
      label: 'Reviews',
      icon: '📝',
      paths: ['/reviews'],
    },
  ];

  return (
    <header className="w-full backdrop-blur-xl sticky top-0 z-50">
      <div className="relative max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Lado Izquierdo: Logo */}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center overflow-hidden">
              <img
                src="/5662059.png"
                alt="Musiclub Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </Link>
        </div>

        {/* Centro: Enlaces de Navegación - Solo en pantallas medianas y grandes (Desktop/Tablet) */}
        <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center pointer-events-none">
          <nav className="flex items-center gap-1 lg:gap-2 bg-white/5 border border-white/10 px-1.5 lg:px-2 py-1 lg:py-1.5 rounded-full backdrop-blur-md shadow-inner pointer-events-auto">
            {navLinks.map((link) => {
              const active = isLinkActive(link.paths);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-xs lg:text-sm font-semibold flex items-center gap-1 lg:gap-1.5 px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-full transition-all duration-200 whitespace-nowrap ${
                    active
                      ? link.highlight
                        ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-[0_0_15px_rgba(245,87,108,0.4)]'
                        : 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : link.highlight
                        ? 'text-pink-300 hover:text-white bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Lado Derecho: User Profile Dropdown & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto">
          {/* Si el usuario ha iniciado sesión: Extensible User Profile Dropdown */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border transition-all duration-200 cursor-pointer select-none ${
                  isUserMenuOpen
                    ? 'bg-[#181a2f] border-pink-500/60 ring-2 ring-pink-500/30 shadow-[0_0_20px_rgba(245,87,108,0.25)]'
                    : 'bg-[#121324]/80 hover:bg-[#1a1b32] border-white/15 hover:border-white/30 shadow-md'
                }`}
                title="Abrir menú de usuario"
                aria-expanded={isUserMenuOpen}
              >
                {/* Avatar */}
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'Usuario'}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/20 object-cover flex-shrink-0"
                    onError={(e) => {
                      e.target.src =
                        'https://via.placeholder.com/100/1a1a2e/ffffff?text=👤';
                    }}
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#f5576c] to-[#f093fb] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                    {(user.name || 'U')[0].toUpperCase()}
                  </div>
                )}

                {/* Nombre de usuario */}
                <div className="flex flex-col text-left max-w-[70px] xs:max-w-[100px] sm:max-w-[130px]">
                  <span className="text-white text-xs sm:text-sm font-semibold truncate leading-tight">
                    {user.name || 'Usuario'}
                  </span>
                  {isAdmin && (
                    <span className="text-[9px] text-[#f5576c] font-bold uppercase tracking-wider leading-none mt-0.5">
                      Admin
                    </span>
                  )}
                </div>

                {/* Flecha Chevron */}
                <svg
                  className={`w-3.5 h-3.5 text-white/50 transition-transform duration-200 ${
                    isUserMenuOpen ? 'rotate-180 text-pink-400' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Menú Desplegable Extensible del Perfil */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 max-w-[calc(100vw-1.5rem)] bg-[#0d0f1c]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.7)] p-2 z-50 text-left animate-fadeIn">
                  {/* Tarjeta de Encabezado del Usuario */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 mb-1.5">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || 'Usuario'}
                        className="w-10 h-10 rounded-full border border-pink-500/40 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f5576c] to-[#f093fb] text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {(user.name || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-bold text-sm truncate">
                        {user.name || 'Usuario'}
                      </p>
                      <p className="text-white/40 text-xs truncate">
                        {user.email || 'Miembro del Club'}
                      </p>
                      {isAdmin && (
                        <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#f5576c]/20 text-[#f5576c] border border-[#f5576c]/30">
                          🛡️ Administrador
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="h-[1px] bg-white/10 my-1"></div>

                  {/* Opciones del menú */}
                  <div className="space-y-0.5">
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                        pathname === '/profile'
                          ? 'bg-purple-500/20 text-purple-200 font-semibold'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">👤</span>
                        <span>Mi Perfil</span>
                      </div>
                      <span className="text-[10px] text-white/40">
                        Reviews & Stats
                      </span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                        pathname === '/settings'
                          ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">⚙️</span>
                        <span>Configuración</span>
                      </div>
                      <span className="text-[10px] text-white/40">Ajustes</span>
                    </Link>

                    {/* Opción Admin Panel (Solo si es Administrador) */}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                          pathname === '/admin'
                            ? 'bg-rose-500/20 text-rose-200 font-semibold'
                            : 'text-rose-300 hover:text-rose-100 hover:bg-rose-500/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">🔧</span>
                          <span>Panel de Admin</span>
                        </div>
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded-full border border-rose-500/30">
                          Gestión
                        </span>
                      </Link>
                    )}

                    <Link
                      to="/faq"
                      onClick={() => setIsUserMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                        pathname === '/faq'
                          ? 'bg-amber-500/20 text-amber-200 font-semibold'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">❓</span>
                        <span>Guía & FAQ</span>
                      </div>
                      <span className="text-[10px] text-white/40">Ayuda</span>
                    </Link>
                  </div>

                  <div className="h-[1px] bg-white/10 my-1.5"></div>

                  {/* Cerrar Sesión */}
                  <button
                    type="button"
                    onClick={handleLogoutClick}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-400 hover:text-rose-200 hover:bg-rose-500/15 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base group-hover:translate-x-0.5 transition-transform">
                        🚪
                      </span>
                      <span>Cerrar Sesión</span>
                    </div>
                    <span className="text-xs text-rose-400/60">Salir</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Botón de Iniciar Sesión */
            <button
              onClick={handleLoginClick}
              disabled={loading}
              className="px-3.5 sm:px-4 py-1.5 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white text-xs sm:text-sm font-bold rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-[#f5576c]/20 flex items-center gap-1.5"
            >
              <span>👤</span>
              <span>{loading ? '...' : 'Iniciar sesión'}</span>
            </button>
          )}

          {/* Botón Hamburguesa para Mobile / Tablets reducidas */}
          <button
            id="mobile-menu-btn"
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className={`md:hidden w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200 ${
              isMobileMenuOpen
                ? 'bg-pink-500/20 border-pink-500/50 text-white'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
            }`}
            aria-label="Abrir menú de navegación"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Menú Desplegable Hamburguesa para Mobile */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden border-t border-white/10 bg-[#0c0e1a]/95 backdrop-blur-2xl px-4 py-3 space-y-2.5 animate-fadeIn shadow-2xl"
        >
          {/* Si el usuario ha iniciado sesión, mostramos tarjeta de usuario en el menú móvil también */}
          {user && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || 'Usuario'}
                  className="w-9 h-9 rounded-full border border-pink-500/40 object-cover flex-shrink-0"
                  onError={(e) => {
                    e.target.src =
                      'https://via.placeholder.com/100/1a1a2e/ffffff?text=👤';
                  }}
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#f5576c] to-[#f093fb] text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {(user.name || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold text-xs truncate">
                  {user.name || 'Usuario'}
                </p>
                <p className="text-white/40 text-[10px] truncate">
                  {user.email || 'Miembro del Club'}
                </p>
              </div>
              {isAdmin && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#f5576c]/20 text-[#f5576c] border border-[#f5576c]/30">
                  Admin
                </span>
              )}
            </div>
          )}

          <div className="text-[10px] uppercase font-bold text-white/30 tracking-wider px-1">
            Navegación del Club
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {navLinks.map((link) => {
              const active = isLinkActive(link.paths);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    active
                      ? link.highlight
                        ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md shadow-[#f5576c]/30'
                        : 'bg-white/15 text-white border border-white/20'
                      : link.highlight
                        ? 'bg-pink-500/10 text-pink-300 border border-pink-500/20 hover:bg-pink-500/20'
                        : 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  <span className="text-base">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Opciones de usuario adicionales en móvil */}
          {user ? (
            <div className="pt-2 border-t border-white/10 space-y-1">
              <div className="text-[10px] uppercase font-bold text-white/30 tracking-wider px-1">
                Mi Cuenta
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 text-white/80 hover:text-white border border-white/5"
                >
                  <span>👤</span>
                  <span>Mi Perfil</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 text-white/80 hover:text-white border border-white/5"
                >
                  <span>⚙️</span>
                  <span>Ajustes</span>
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 col-span-2"
                  >
                    <span>🔧</span>
                    <span>Panel de Admin</span>
                  </Link>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogoutClick();
                }}
                className="w-full mt-1.5 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
              >
                <span>🚪</span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLoginClick();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md shadow-[#f5576c]/20"
              >
                <span>👤</span>
                <span>Iniciar sesión</span>
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40 px-1">
            <Link
              to="/faq"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <span>❓</span> Guía & FAQ
            </Link>
            <span>Musiclub v5.0</span>
          </div>
        </div>
      )}

      {/* Título opcional centrado debajo (ej. para pantalla principal) con Fondo Animado e Interactivo */}
      {showTitle && (
        <div
          ref={heroContainerRef}
          className="relative overflow-hidden my-3 mx-2 sm:mx-4 rounded-3xl border border-white/10 bg-gradient-to-b from-[#151730] via-[#0d0e1c] to-[#070810] shadow-[0_15px_50px_rgba(0,0,0,0.7)] text-center py-6 sm:py-8 px-4 sm:px-6 cursor-default select-none"
        >
          {/* Canvas interactivo de partículas musicales al mover el mouse */}
          <HeroMusicCanvas containerRef={heroContainerRef} />

          {/* Orbes de luz de fondo con aceleración GPU */}
          <div
            className="absolute -top-16 -left-16 w-56 sm:w-72 h-56 sm:h-72 bg-gradient-to-tr from-[#f5576c]/25 to-[#f093fb]/15 rounded-full blur-2xl pointer-events-none animate-aura-pulse"
            style={{
              willChange: 'transform, opacity',
              transform: 'translate3d(0,0,0)',
            }}
          ></div>
          <div
            className="absolute -top-16 -right-16 w-56 sm:w-72 h-56 sm:h-72 bg-gradient-to-bl from-cyan-500/20 via-indigo-500/15 to-purple-600/15 rounded-full blur-2xl pointer-events-none animate-aura-pulse"
            style={{
              animationDelay: '3s',
              willChange: 'transform, opacity',
              transform: 'translate3d(0,0,0)',
            }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-28 bg-[#f5576c]/10 rounded-full blur-2xl pointer-events-none"
            style={{ transform: 'translate3d(-50%, -50%, 0)' }}
          ></div>

          {/* Elementos flotantes decorativos */}
          <div className="hidden sm:flex absolute left-6 top-8 text-2xl opacity-60 animate-float-slow select-none pointer-events-none">
            🎵
          </div>
          <div className="hidden sm:flex absolute left-14 bottom-6 text-lg opacity-40 animate-float-reverse select-none pointer-events-none">
            ✨
          </div>
          <div className="hidden sm:flex absolute right-6 top-8 text-2xl opacity-60 animate-float-reverse select-none pointer-events-none">
            🎧
          </div>
          <div className="hidden sm:flex absolute right-14 bottom-6 text-lg opacity-40 animate-float-slow select-none pointer-events-none">
            ⚡
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Pill superior con ecualizador animado */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-sm mb-2 hover:border-[#f5576c]/40 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-end gap-0.5 h-3.5">
                <span
                  className="w-1 bg-[#f5576c] rounded-full animate-[soundWave_1.2s_ease-in-out_infinite]"
                  style={{ animationDelay: '0.1s' }}
                ></span>
                <span
                  className="w-1 bg-[#f093fb] rounded-full animate-[soundWave_1.2s_ease-in-out_infinite]"
                  style={{ animationDelay: '0.35s' }}
                ></span>
                <span
                  className="w-1 bg-cyan-400 rounded-full animate-[soundWave_1.2s_ease-in-out_infinite]"
                  style={{ animationDelay: '0.55s' }}
                ></span>
                <span
                  className="w-1 bg-amber-400 rounded-full animate-[soundWave_1.2s_ease-in-out_infinite]"
                  style={{ animationDelay: '0.2s' }}
                ></span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-white/90">
                Club de Música & Reviews
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>

            {/* Título Principal con Gradiente Animado */}
            <h1
              className="title-albumes text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-[#f093fb] to-[#f5576c] animate-gradient-text my-0 leading-none"
              style={{
                textShadow:
                  '0 0 10px rgba(245,87,108,0.3), 0 0 25px rgba(245,87,108,0.2), 0 0 45px rgba(240,147,251,0.15)',
              }}
            >
              {customTitle || 'MUSICLUB'}
            </h1>

            {/* Subtítulo Descriptivo */}
            <p className="text-white/75 text-xs sm:text-sm md:text-base font-medium max-w-2xl mx-auto leading-relaxed mt-2 tracking-wide">
              {customSubtitle ||
                'Recomienda, vota, califica y descubre música con la comunidad'}
            </p>
          </div>
        </div>
      )}

      {/* Fallback Login Modal */}
      {!propOnLogin && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={handleGoogleLogin}
          onGoogleLogin={handleGoogleLogin}
          loading={loginLoading}
          googleLoading={loginLoading}
        />
      )}
    </header>
  );
}
