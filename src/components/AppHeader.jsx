// src/components/AppHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { LoginModal } from './LoginModal';
import { HeroMusicCanvas } from './HeroMusicCanvas';
import { HeaderAlbumSearch } from './HeaderAlbumSearch';
import { NotificationsDropdown } from './NotificationsDropdown';
import { LanguageSelector } from './LanguageSelector';

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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Dropdown para navegación agrupada en desktop ('discover' | 'games' | null)
  const [openNavDropdown, setOpenNavDropdown] = useState(null);

  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const heroContainerRef = useRef(null);
  const discoverDropdownRef = useRef(null);
  const gamesDropdownRef = useRef(null);

  // Fallbacks using useAuth hook if props are not explicitly provided
  const user = propUser !== undefined ? propUser : auth.user;
  const isAdmin = propIsAdmin !== undefined ? propIsAdmin : auth.isAdmin;
  const loading = propLoading !== undefined ? propLoading : auth.loading;

  // Hook de Notificaciones
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    isRead,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshNotifications,
  } = useNotifications(user);

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsNotificationsOpen(false);
    setOpenNavDropdown(null);
  }, [location.pathname]);

  // Cerrar menús al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest('#mobile-menu-btn')
      ) {
        setIsMobileMenuOpen(false);
      }
      if (
        discoverDropdownRef.current &&
        !discoverDropdownRef.current.contains(event.target) &&
        gamesDropdownRef.current &&
        !gamesDropdownRef.current.contains(event.target)
      ) {
        setOpenNavDropdown(null);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsNotificationsOpen(false);
        setIsMobileMenuOpen(false);
        setOpenNavDropdown(null);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
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

  const isPathActive = (paths) => {
    return paths.some((path) => {
      if (path === '/' && pathname === '/') return true;
      if (path !== '/' && pathname.startsWith(path)) return true;
      return false;
    });
  };

  // Rutas para los grupos
  const discoverPaths = ['/recomendaciones', '/para-ti', '/playlists', '/playlist', '/reviews'];
  const gamesPaths = ['/gashapon', '/gacha', '/leaderboard', '/ranking'];

  const isDiscoverActive = isPathActive(discoverPaths);
  const isGamesActive = isPathActive(gamesPaths);

  return (
    <header className="w-full backdrop-blur-xl sticky top-0 z-50">
      <div className="relative max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Lado Izquierdo: Logo */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center overflow-hidden">
              <img
                src="/5662059.png"
                alt="Musiclub Logo"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </Link>
        </div>

        {/* Centro: Menú de Navegación Agrupado & Compacto - Pantallas medianas/grandes (md/lg/xl) */}
        <div className="hidden md:flex items-center justify-center flex-1 min-w-0 px-2">
          <nav className="flex items-center gap-1 xl:gap-1.5 bg-white/5 border border-white/10 px-1.5 py-1 rounded-full backdrop-blur-md shadow-inner">
            {/* 1. Catálogo Directo */}
            <Link
              to="/catalogo"
              className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-200 whitespace-nowrap ${
                isPathActive(['/catalogo', '/catalog', '/albumes', '/albums'])
                  ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>💿</span>
              <span>Catálogo</span>
            </Link>

            {/* 2. Pool Musical (Pill Destacado) */}
            <Link
              to="/pool"
              className={`text-xs font-bold flex items-center gap-1.5 px-3.5 py-1 rounded-full transition-all duration-200 whitespace-nowrap ${
                isPathActive(['/pool', '/pool-musical', '/temporadas', '/season'])
                  ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-[0_0_15px_rgba(245,87,108,0.4)]'
                  : 'text-pink-300 hover:text-white bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20'
              }`}
            >
              <span>🗳️</span>
              <span>Pool Musical</span>
            </Link>

            {/* 3. Dropdown Agrupado: Descubrir (Para Ti, Playlists, Reviews) */}
            <div className="relative" ref={discoverDropdownRef}>
              <button
                type="button"
                onClick={() =>
                  setOpenNavDropdown((prev) => (prev === 'discover' ? null : 'discover'))
                }
                className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-200 whitespace-nowrap cursor-pointer select-none ${
                  openNavDropdown === 'discover' || isDiscoverActive
                    ? 'bg-purple-500/20 text-purple-200 border border-purple-500/35 shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>✨</span>
                <span>Descubrir</span>
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${
                    openNavDropdown === 'discover' ? 'rotate-180 text-purple-300' : 'text-white/40'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Submenú Flotante Descubrir */}
              {openNavDropdown === 'discover' && (
                <div className="absolute top-full mt-2 left-0 w-60 bg-[#0c0e1c]/95 border border-purple-500/30 rounded-2xl p-1.5 shadow-2xl backdrop-blur-2xl z-50 animate-fadeIn space-y-0.5">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-purple-300/70 border-b border-white/5 mb-1">
                    Exploración Musical
                  </div>
                  <Link
                    to="/recomendaciones"
                    onClick={() => setOpenNavDropdown(null)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                      isPathActive(['/recomendaciones', '/para-ti'])
                        ? 'bg-purple-500/20 text-purple-200 font-bold border border-purple-500/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-base">✨</span>
                    <div className="flex flex-col text-left">
                      <span className="font-semibold">Para Ti</span>
                      <span className="text-[10px] text-slate-400 font-normal">Recomendaciones personalizadas</span>
                    </div>
                  </Link>
                  <Link
                    to="/playlists"
                    onClick={() => setOpenNavDropdown(null)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                      isPathActive(['/playlists', '/playlist'])
                        ? 'bg-purple-500/20 text-purple-200 font-bold border border-purple-500/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-base">🎵</span>
                    <div className="flex flex-col text-left">
                      <span className="font-semibold">Playlists</span>
                      <span className="text-[10px] text-slate-400 font-normal">Colecciones y selecciones del club</span>
                    </div>
                  </Link>
                  <Link
                    to="/reviews"
                    onClick={() => setOpenNavDropdown(null)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                      isPathActive(['/reviews'])
                        ? 'bg-purple-500/20 text-purple-200 font-bold border border-purple-500/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-base">📝</span>
                    <div className="flex flex-col text-left">
                      <span className="font-semibold">Reviews</span>
                      <span className="text-[10px] text-slate-400 font-normal">Feed de opiniones y notas</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* 4. Dropdown Agrupado: Dinámicas (Gashapon, Leaderboard) */}
            <div className="relative" ref={gamesDropdownRef}>
              <button
                type="button"
                onClick={() =>
                  setOpenNavDropdown((prev) => (prev === 'games' ? null : 'games'))
                }
                className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-200 whitespace-nowrap cursor-pointer select-none ${
                  openNavDropdown === 'games' || isGamesActive
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/35 shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>🎮</span>
                <span>Dinámicas</span>
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${
                    openNavDropdown === 'games' ? 'rotate-180 text-amber-300' : 'text-white/40'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Submenú Flotante Dinámicas */}
              {openNavDropdown === 'games' && (
                <div className="absolute top-full mt-2 left-0 w-60 bg-[#0c0e1c]/95 border border-amber-500/30 rounded-2xl p-1.5 shadow-2xl backdrop-blur-2xl z-50 animate-fadeIn space-y-0.5">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-amber-300/70 border-b border-white/5 mb-1">
                    Arcade & Ranking
                  </div>
                  <Link
                    to="/gashapon"
                    onClick={() => setOpenNavDropdown(null)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                      isPathActive(['/gashapon', '/gacha'])
                        ? 'bg-amber-500/20 text-amber-200 font-bold border border-amber-500/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-base">🎰</span>
                    <div className="flex flex-col text-left">
                      <span className="font-semibold">Gashapon</span>
                      <span className="text-[10px] text-slate-400 font-normal">Sorteo arcade de cápsulas</span>
                    </div>
                  </Link>
                  <Link
                    to="/leaderboard"
                    onClick={() => setOpenNavDropdown(null)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                      isPathActive(['/leaderboard', '/ranking'])
                        ? 'bg-amber-500/20 text-amber-200 font-bold border border-amber-500/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-base">🏆</span>
                    <div className="flex flex-col text-left">
                      <span className="font-semibold">Leaderboard</span>
                      <span className="text-[10px] text-slate-400 font-normal">Ranking de críticos del club</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Lado Derecho: Buscador Global Directo, Selector de Idiomas, Centro de Notificaciones, User Profile Dropdown & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto">
          {/* Selector de Idiomas Global (Oculto en celular, visible en sm y superior) */}
          <div className="hidden sm:inline-block">
            <LanguageSelector variant="header" />
          </div>

          {/* Buscador de Álbumes del Club con Autocomplete y Calificación Directa */}
          <HeaderAlbumSearch user={user} />

          {/* Centro de Notificaciones (Buzón de Canciones, Reviews a tus Álbumes, Álbum Ganador) */}
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotificationsOpen((prev) => !prev);
                setIsUserMenuOpen(false);
                setIsMobileMenuOpen(false);
                setOpenNavDropdown(null);
              }}
              className={`relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full border transition-all duration-200 cursor-pointer select-none ${
                isNotificationsOpen
                  ? 'bg-[#181a2f] border-pink-500/60 ring-2 ring-pink-500/30 text-white shadow-[0_0_15px_rgba(245,87,108,0.3)]'
                  : 'bg-[#121324]/80 hover:bg-[#1a1b32] border-white/15 hover:border-white/30 text-white/80 hover:text-white shadow-md hover:scale-105 active:scale-95'
              }`}
              title={
                unreadCount > 0
                  ? `Tienes ${unreadCount} ${unreadCount === 1 ? 'notificación nueva' : 'notificaciones nuevas'}`
                  : 'Notificaciones'
              }
              aria-label="Abrir centro de notificaciones"
              aria-expanded={isNotificationsOpen}
            >
              <svg
                className="w-4 h-4 sm:w-4.5 sm:h-4.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>

              {/* Badge Contador de Notificaciones No Leídas */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white text-[9px] sm:text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-pink-500/50 animate-pulse border border-[#0c0e1a]">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Menú Desplegable / Popover de Notificaciones */}
            {isNotificationsOpen && (
              <NotificationsDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                loading={notificationsLoading}
                isRead={isRead}
                markAsRead={markAsRead}
                markAllAsRead={markAllAsRead}
                deleteNotification={deleteNotification}
                clearAllNotifications={clearAllNotifications}
                refreshNotifications={refreshNotifications}
                onClose={() => setIsNotificationsOpen(false)}
              />
            )}
          </div>

          {/* Si el usuario ha iniciado sesión: Extensible User Profile Dropdown */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen((prev) => !prev);
                  setIsMobileMenuOpen(false);
                  setOpenNavDropdown(null);
                }}
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
                <div className="hidden sm:flex flex-col text-left max-w-[70px] xs:max-w-[100px] sm:max-w-[130px]">
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
                <div className="fixed left-2 right-2 top-[58px] z-[155] sm:fixed-none sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 bg-[#0d0f1c] backdrop-blur-2xl border border-pink-500/40 sm:border-white/15 rounded-2xl shadow-2xl p-3 sm:p-2.5 text-left animate-fadeIn space-y-2">
                  {/* Cabecera para móvil con botón cerrar */}
                  <div className="flex sm:hidden items-center justify-between pb-1.5 border-b border-white/10">
                    <span className="text-[11px] font-bold text-pink-300 flex items-center gap-1.5">
                      <span>👤</span>
                      <span>Mi Cuenta & Perfil</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs cursor-pointer transition-all"
                      title="Cerrar"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Tarjeta de Encabezado del Usuario */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || 'Usuario'}
                        className="w-10 h-10 rounded-full border border-pink-500/40 object-cover flex-shrink-0"
                        onError={(e) => {
                          e.target.src =
                            'https://via.placeholder.com/100/1a1a2e/ffffff?text=👤';
                        }}
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
                  <div className="space-y-1">
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                        pathname === '/profile'
                          ? 'bg-purple-500/20 text-purple-200 font-semibold border border-purple-500/30'
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
                      className={`flex items-center justify-between px-3 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                        pathname === '/settings'
                          ? 'bg-cyan-500/20 text-cyan-200 font-semibold border border-cyan-500/30'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">⚙️</span>
                        <span>Configuración</span>
                      </div>
                      <span className="text-[10px] text-white/40">Ajustes</span>
                    </Link>

                    {/* Opción Admin Panel */}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                          pathname === '/admin'
                            ? 'bg-rose-500/20 text-rose-200 font-semibold border border-rose-500/30'
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
                      className={`flex items-center justify-between px-3 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                        pathname === '/faq'
                          ? 'bg-amber-500/20 text-amber-200 font-semibold border border-amber-500/30'
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
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogoutClick();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-400 hover:text-rose-200 hover:bg-rose-500/15 transition-all text-left group cursor-pointer"
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
              className="px-3.5 sm:px-4 py-1.5 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white text-xs sm:text-sm font-bold rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-[#f5576c]/20 flex items-center gap-1.5 cursor-pointer"
            >
              <span>👤</span>
              <span>{loading ? '...' : 'Iniciar sesión'}</span>
            </button>
          )}

          {/* Botón Hamburguesa para Mobile / Tablets */}
          <button
            id="mobile-menu-btn"
            type="button"
            onClick={() => {
              setIsMobileMenuOpen((prev) => !prev);
              setIsUserMenuOpen(false);
              setOpenNavDropdown(null);
            }}
            className={`md:hidden w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer ${
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
                  strokeWidth="2.5"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Menú Desplegable Hamburguesa para Mobile y Tablets (Estructurado por Categorías) */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden border-t border-white/10 bg-[#0c0e1a]/98 backdrop-blur-2xl px-4 py-3.5 space-y-3.5 animate-fadeIn shadow-2xl"
        >
          {/* SECCIÓN 1: MÚSICA & POOL */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1">
              Música & Club
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/catalogo"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isPathActive(['/catalogo', '/catalog', '/albumes', '/albums'])
                    ? 'bg-white/15 text-white border border-white/20'
                    : 'text-white/80 bg-white/5 hover:bg-white/10 border border-white/5'
                }`}
              >
                <span className="text-base">💿</span>
                <span>Catálogo</span>
              </Link>
              <Link
                to="/pool"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isPathActive(['/pool', '/pool-musical', '/temporadas', '/season'])
                    ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md'
                    : 'bg-pink-500/10 text-pink-300 border border-pink-500/20 hover:bg-pink-500/20'
                }`}
              >
                <span className="text-base">🗳️</span>
                <span>Pool Musical</span>
              </Link>
            </div>
          </div>

          {/* SECCIÓN 2: DESCUBRIMIENTO */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-purple-300/70 tracking-wider px-1">
              Descubrimiento
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Link
                to="/recomendaciones"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isPathActive(['/recomendaciones', '/para-ti'])
                    ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30'
                    : 'text-white/80 bg-white/5 hover:bg-white/10 border border-white/5'
                }`}
              >
                <span className="text-base">✨</span>
                <span>Para Ti</span>
              </Link>
              <Link
                to="/playlists"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isPathActive(['/playlists', '/playlist'])
                    ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30'
                    : 'text-white/80 bg-white/5 hover:bg-white/10 border border-white/5'
                }`}
              >
                <span className="text-base">🎵</span>
                <span>Playlists</span>
              </Link>
              <Link
                to="/reviews"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isPathActive(['/reviews'])
                    ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30'
                    : 'text-white/80 bg-white/5 hover:bg-white/10 border border-white/5'
                }`}
              >
                <span className="text-base">📝</span>
                <span>Reviews</span>
              </Link>
            </div>
          </div>

          {/* SECCIÓN 3: DINÁMICAS & RANKING */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-amber-300/70 tracking-wider px-1">
              Dinámicas & Ranking
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/gashapon"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isPathActive(['/gashapon', '/gacha'])
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                    : 'text-white/80 bg-white/5 hover:bg-white/10 border border-white/5'
                }`}
              >
                <span className="text-base">🎰</span>
                <span>Gashapon</span>
              </Link>
              <Link
                to="/leaderboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isPathActive(['/leaderboard', '/ranking'])
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                    : 'text-white/80 bg-white/5 hover:bg-white/10 border border-white/5'
                }`}
              >
                <span className="text-base">🏆</span>
                <span>Leaderboard</span>
              </Link>
            </div>
          </div>

          {/* Pie de navegación móvil */}
          <div className="pt-2.5 border-t border-white/10 flex flex-col gap-2.5 px-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Idioma / Language
              </span>
              <LanguageSelector variant="footer" />
            </div>

            <div className="flex items-center justify-between text-[11px] text-white/50 pt-1 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsNotificationsOpen(true);
                }}
                className="hover:text-white transition-colors flex items-center gap-1.5 text-pink-300 font-semibold cursor-pointer"
              >
                <span>🔔</span>
                <span>Notificaciones</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white text-[9px] font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              <Link
                to="/faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white transition-colors flex items-center gap-1 text-slate-300 hover:text-white"
              >
                <span>❓</span> Guía & FAQ
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Título opcional centrado debajo con Fondo Animado e Interactivo */}
      {showTitle && (
        <div
          ref={heroContainerRef}
          className="relative overflow-hidden my-3 mx-2 sm:mx-4 rounded-3xl border border-white/10 bg-gradient-to-b from-[#151730] via-[#0d0e1c] to-[#070810] shadow-[0_15px_50px_rgba(0,0,0,0.7)] text-center py-6 sm:py-8 px-4 sm:px-6 cursor-default select-none"
        >
          <HeroMusicCanvas containerRef={heroContainerRef} />

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

            <h1
              className="title-albumes text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-[#f093fb] to-[#f5576c] animate-gradient-text my-0 leading-none"
              style={{
                textShadow:
                  '0 0 10px rgba(245,87,108,0.3), 0 0 25px rgba(245,87,108,0.2), 0 0 45px rgba(240,147,251,0.15)',
              }}
            >
              {customTitle || 'MUSICLUB'}
            </h1>

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

export default AppHeader;
