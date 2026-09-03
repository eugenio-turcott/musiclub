import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { PoolPage } from './pages/PoolPage';
import { AlbumsPage } from './pages/AlbumsPage';
import { AlbumDetailPage } from './pages/AlbumDetailPage';
import { ArtistDetailPage } from './pages/ArtistDetailPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { GashaponPage } from './pages/GashaponPage';
import { PlaylistsPage } from './pages/PlaylistsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { FAQPage } from './pages/FAQPage';
import { PatchNotesPage } from './pages/PatchNotesPage';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { NotFoundPage } from './pages/NotFoundPage';
import { ScrollToTop } from './components/ScrollToTop';
import { scheduleUniversalTranslation } from './utils/translateCrashGuard';

function AppContent() {
  const location = useLocation();
  const [isDelayed, setIsDelayed] = React.useState(false);

  useEffect(() => {
    const savedLang = (() => {
      try {
        return localStorage.getItem('musiclub_selected_lang');
      } catch (e) {
        return 'es';
      }
    })();

    if (!savedLang || savedLang === 'es') {
      setIsDelayed(false);
      scheduleUniversalTranslation(0, 'es');
      return;
    }

    // Delay translation by 2 seconds on navigation/refresh to let React & Supabase load first
    setIsDelayed(true);

    const timer = setTimeout(() => {
      setIsDelayed(false);
      scheduleUniversalTranslation(0, savedLang);
    }, 2000);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div
      id="musiclub-route-container"
      className={isDelayed ? 'notranslate w-full min-h-screen' : 'w-full min-h-screen'}
      translate={isDelayed ? 'no' : undefined}
    >
      <ScrollToTop />
      <Routes>
        {/* Homepage: Modern Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Pool Musical Comunitario & Temporadas */}
        <Route path="/pool" element={<PoolPage />} />
        <Route path="/pool-musical" element={<PoolPage />} />
        <Route path="/temporadas" element={<PoolPage />} />
        <Route path="/season" element={<PoolPage />} />

        {/* Recomendaciones Inteligentes & Para Ti */}
        <Route path="/recomendaciones" element={<RecommendationsPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="/para-ti" element={<RecommendationsPage />} />

        {/* Catálogo General de Lanzamientos */}
        <Route path="/catalogo" element={<AlbumsPage />} />
        <Route path="/catalog" element={<AlbumsPage />} />
        <Route path="/albumes" element={<AlbumsPage />} />
        <Route path="/albums" element={<AlbumsPage />} />

        {/* Páginas Individuales por Formato de Lanzamiento */}
        <Route path="/albumes/:slug" element={<AlbumDetailPage />} />
        <Route path="/albums/:slug" element={<AlbumDetailPage />} />
        <Route path="/eps/:slug" element={<AlbumDetailPage />} />
        <Route path="/ep/:slug" element={<AlbumDetailPage />} />
        <Route path="/sencillos/:slug" element={<AlbumDetailPage />} />
        <Route path="/singles/:slug" element={<AlbumDetailPage />} />
        <Route path="/single/:slug" element={<AlbumDetailPage />} />
        <Route path="/compilaciones/:slug" element={<AlbumDetailPage />} />
        <Route path="/compilations/:slug" element={<AlbumDetailPage />} />
        <Route path="/remixes/:slug" element={<AlbumDetailPage />} />
        <Route path="/remix/:slug" element={<AlbumDetailPage />} />
        <Route path="/release/:slug" element={<AlbumDetailPage />} />
        <Route path="/lanzamiento/:slug" element={<AlbumDetailPage />} />

        {/* Detalle de Artistas */}
        <Route path="/artista/:slug" element={<ArtistDetailPage />} />
        <Route path="/artistas/:slug" element={<ArtistDetailPage />} />
        <Route path="/artist/:slug" element={<ArtistDetailPage />} />
        <Route path="/artists/:slug" element={<ArtistDetailPage />} />

        {/* Gashapon & Ruleta Arcade */}
        <Route path="/gashapon" element={<GashaponPage />} />
        <Route path="/gacha" element={<GashaponPage />} />

        {/* Leaderboard & Salón de la Fama */}
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/ranking" element={<LeaderboardPage />} />

        {/* Reseñas Comunitarias */}
        <Route path="/reviews" element={<ReviewsPage />} />

        {/* Playlists & Buzón Musical */}
        <Route path="/playlists" element={<PlaylistsPage />} />
        <Route path="/playlist" element={<PlaylistsPage />} />
        <Route path="/listas" element={<PlaylistsPage />} />

        {/* Perfil & Configuración */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/configuracion" element={<SettingsPage />} />

        {/* Administración */}
        <Route path="/admin" element={<AdminPage />} />

        {/* Información, FAQ, Legal */}
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/preguntas-frecuentes" element={<FAQPage />} />
        <Route path="/ayuda" element={<FAQPage />} />
        <Route path="/patch-notes" element={<PatchNotesPage />} />
        <Route path="/changelog" element={<PatchNotesPage />} />
        <Route path="/novedades" element={<PatchNotesPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/privacidad" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/terminos" element={<TermsOfService />} />

        {/* 404 Not Found */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
