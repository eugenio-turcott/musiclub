// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppHeader } from './components/AppHeader';
import { SlotMachine } from './components/SlotMachine';
import { AlbumGrid } from './components/AlbumGrid';
import { AlbumSearch } from './components/AlbumSearch';
import { Rankings } from './components/Rankings';
import { WinnerDisplay } from './components/WinnerDisplay';
import { LoginModal } from './components/LoginModal';
import { LoadingOverlay } from './components/LoadingOverlay';
import { Footer } from './components/Footer';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { useAlbums } from './hooks/useAlbums';
import { useAuth } from './hooks/useAuth';

function AppContent() {
  const {
    albums,
    winner,
    loading,
    error,
    refetch,
    markAlbumAsInactive,
    // resetWinner - eliminado porque no se usa
  } = useAlbums();

  const {
    user,
    loading: authLoading,
    isAdmin,
    loginWithGoogle,
    logout,
    // isAuthenticated - eliminado porque no se usa
  } = useAuth();

  const [isSpinning, setIsSpinning] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = () => setShowLoginModal(true);

  const handleLoginWithGoogle = async () => {
    setLoginLoading(true);
    const result = await loginWithGoogle();
    setLoginLoading(false);
    if (result.success && !result.redirecting) {
      setShowLoginModal(false);
    }
    return result;
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleSpinStart = () => {
    setIsSpinning(true);
  };

  const handleSpinComplete = () => {
    setIsSpinning(false);
  };

  return (
    <div className="min-h-screen cyber-grid p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header con logo y login */}
        <AppHeader
          user={user}
          isAdmin={isAdmin}
          onLogin={handleLogin}
          onLogout={handleLogout}
          loading={authLoading}
        />

        {/* Loading Overlay */}
        <LoadingOverlay
          loading={loading || isSpinning}
          message={
            isSpinning ? '🎰 GIRANDO LA MÁQUINA...' : 'Cargando álbumes...'
          }
        />

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLoginWithGoogle}
          onGoogleLogin={handleLoginWithGoogle}
          loading={loginLoading}
          googleLoading={loginLoading}
        />

        {/* Winner Display - SIEMPRE visible */}
        <WinnerDisplay winner={winner} />

        {/* Slot Machine - Solo visible si hay álbumes */}
        {albums.length > 0 && (
          <SlotMachine
            albums={albums}
            onSpinComplete={handleSpinComplete}
            isSpinning={isSpinning}
            onSpinStart={handleSpinStart}
            markAlbumAsInactive={markAlbumAsInactive}
            isAdmin={isAdmin}
            user={user}
          />
        )}

        {/* Rankings */}
        <Rankings albums={albums} isAdmin={isAdmin} />

        {/* Álbumes - Catálogo completo */}
        <AlbumGrid
          albums={albums}
          loading={loading}
          error={error}
          winner={winner}
        />

        {/* Búsqueda de álbumes en Spotify (solo admin) */}
        {isAdmin && <AlbumSearch onAlbumCreated={refetch} />}

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Routes>
    </Router>
  );
}

export default App;
