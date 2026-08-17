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
import { AdminPage } from './pages/AdminPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AlbumsPage } from './pages/AlbumsPage';
import { useAlbums } from './hooks/useAlbums';
import { useAuth } from './hooks/useAuth';
import { useUserReviews } from './hooks/useUserReviews';

function AppContent() {
  const { albums, winner, loading, error, refetch, markAlbumAsInactive } =
    useAlbums();

  const {
    user,
    loading: authLoading,
    isAdmin,
    loginWithGoogle,
    logout,
  } = useAuth();

  const { reviewedAlbumIds, refetchUserReviews } = useUserReviews(user);

  const [isSpinning, setIsSpinning] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleAlbumUpdated = () => {
    refetch();
    if (refetchUserReviews) refetchUserReviews();
  };

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
    <div className="min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header con logo y login */}
        <AppHeader
          user={user}
          isAdmin={isAdmin}
          onLogin={handleLogin}
          onLogout={handleLogout}
          loading={authLoading}
        />

        {/* Loading Overlay */}
        <LoadingOverlay loading={loading} message="Cargando álbumes..." />

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
        <WinnerDisplay
          winner={winner}
          isAdmin={isAdmin}
          user={user}
          reviewedAlbumIds={reviewedAlbumIds}
          onAlbumUpdated={handleAlbumUpdated}
        />

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
          user={user}
          isAdmin={isAdmin}
          reviewedAlbumIds={reviewedAlbumIds}
          onAlbumUpdated={handleAlbumUpdated}
        />

        {/* Búsqueda de álbumes en Spotify (solo usuarios con sesión iniciada) */}
        {user && <AlbumSearch onAlbumCreated={handleAlbumUpdated} user={user} />}
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
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/configuracion" element={<SettingsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/ranking" element={<LeaderboardPage />} />
        <Route path="/albumes" element={<AlbumsPage />} />
        <Route path="/albums" element={<AlbumsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
