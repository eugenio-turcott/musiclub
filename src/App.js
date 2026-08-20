// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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
import { RecommendationsPage } from './pages/RecommendationsPage';
import { PlaylistsPage } from './pages/PlaylistsPage';
import { FAQPage } from './pages/FAQPage';
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
          showTitle={true}
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

        {/* Buscador de Proponer Álbum en Spotify (en la parte superior) */}
        {user && (
          <div className="mb-6">
            <AlbumSearch onAlbumCreated={handleAlbumUpdated} user={user} />
          </div>
        )}

        {/* Banner de Recomendaciones Personalizadas (Para ti) */}
        {user && (
          <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#14142b] via-[#1b1535] to-[#0d1020] border border-white/10 shadow-2xl mb-6">
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#f5576c]/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="hidden sm:flex w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
                  ✨
                </div>
                <div>
                  <h3 className="text-white font-black text-lg sm:text-xl">
                    <span className="inline sm:hidden">✨ </span>Recomendaciones
                    para Ti
                  </h3>
                  <p className="text-white/60 text-xs sm:text-sm">
                    Descubre álbumes seleccionados con algoritmo matemático
                    basado en tus mejores calificaciones.
                  </p>
                </div>
              </div>
              <Link
                to="/recomendaciones"
                className="px-5 py-2.5 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <span>🎯</span> Ver Mis Recomendaciones
              </Link>
            </div>
          </div>
        )}

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
        <Route path="/recomendaciones" element={<RecommendationsPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="/para-ti" element={<RecommendationsPage />} />
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
        <Route path="/playlists" element={<PlaylistsPage />} />
        <Route path="/playlist" element={<PlaylistsPage />} />
        <Route path="/listas" element={<PlaylistsPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/preguntas-frecuentes" element={<FAQPage />} />
        <Route path="/ayuda" element={<FAQPage />} />
      </Routes>
    </Router>
  );
}

export default App;
