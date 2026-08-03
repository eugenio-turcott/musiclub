// src/App.js
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
} from 'react-router-dom';
import { useAlbums } from './hooks/useAlbums';
import { useAuth } from './hooks/useAuth';
import { SlotMachine } from './components/SlotMachine';
import { AlbumGrid } from './components/AlbumGrid';
import { Header } from './components/Header';
import { LoadingOverlay } from './components/LoadingOverlay';
import { WinnerDisplay } from './components/WinnerDisplay';
import { LoginModal } from './components/LoginModal';
import { Rankings } from './components/Rankings';
import { AlbumSearch } from './components/AlbumSearch';
import { Footer } from './components/Footer';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';

// Componente principal de la app
function MainApp() {
  const {
    albums,
    loading,
    error,
    markAlbumAsInactive,
    refetch,
    winner,
    resetWinner,
  } = useAlbums();
  const {
    user,
    isAdmin,
    loading: authLoading,
    loginWithGoogle,
    logout,
    isAuthenticated,
  } = useAuth();

  const [isSpinning, setIsSpinning] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [localWinner, setLocalWinner] = useState(null);

  // Usar el winner del hook o el local
  useEffect(() => {
    if (winner) {
      setLocalWinner(winner);
    }
  }, [winner]);

  const handleSpinComplete = (selectedAlbum) => {
    setLocalWinner(selectedAlbum);
    setIsSpinning(false);
  };

  const handleSpinStart = () => {
    setIsSpinning(true);
  };

  const handleResetWinner = async () => {
    await resetWinner();
    setLocalWinner(null);
  };

  const handleAlbumCreated = () => {
    refetch();
  };

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle();
    if (result.success) {
      setShowLogin(false);
    }
    return result;
  };

  // Mostrar loading si está cargando autenticación o álbumes
  if (authLoading || loading) {
    return <LoadingOverlay loading={true} message="Cargando..." />;
  }

  return (
    <div className="min-h-screen cyber-grid p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header con info de usuario */}
        <div className="flex justify-between items-center mb-4">
          <Header />
          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-2">
                  {user.avatar && (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border border-[#f5576c]/30"
                    />
                  )}
                  <span className="text-white/40 text-xs hidden sm:inline">
                    {user.name || user.email}
                    {isAdmin && (
                      <span className="ml-2 text-[#f5576c] font-bold">
                        ⭐ Admin
                      </span>
                    )}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors px-3 py-1 border border-white/10 rounded-full hover:border-white/20"
                >
                  {isAdmin ? '🔓 Cerrar' : '🚪 Salir'}
                </button>
              </>
            ) : (
              <button
                onClick={handleLoginClick}
                className="text-xs text-white/40 hover:text-white/70 transition-colors px-4 py-1.5 bg-gradient-to-r from-[#f5576c]/20 to-[#f093fb]/20 border border-[#f5576c]/30 rounded-full hover:border-[#f5576c]/50"
              >
                🔑 Iniciar Sesión
              </button>
            )}
          </div>
        </div>

        {/* Login Modal */}
        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onLogin={() => {}}
          onGoogleLogin={handleGoogleLogin}
          loading={authLoading}
          googleLoading={authLoading}
        />

        {/* Winner Display - Siempre visible si hay ganador */}
        {localWinner && (
          <WinnerDisplay
            winner={localWinner}
            onReset={isAdmin ? handleResetWinner : null}
          />
        )}

        {/* Slot Machine */}
        <SlotMachine
          albums={albums}
          onSpinComplete={handleSpinComplete}
          isSpinning={isSpinning}
          onSpinStart={handleSpinStart}
          markAlbumAsInactive={markAlbumAsInactive}
          isAdmin={isAdmin}
          user={user}
        />

        {/* Album Search - Solo admin */}
        {isAdmin && <AlbumSearch onAlbumCreated={handleAlbumCreated} />}

        {/* Album Grid */}
        <AlbumGrid
          albums={albums}
          loading={loading}
          error={error}
          winner={localWinner}
        />

        {/* Rankings - Siempre visible */}
        <Rankings albums={albums} isAdmin={isAdmin} />

        {/* Footer con enlaces */}
        <Footer />
      </div>
    </div>
  );
}

// App principal con Router
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
