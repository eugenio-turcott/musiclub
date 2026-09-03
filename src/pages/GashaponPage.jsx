// src/pages/GashaponPage.jsx
import React, { useState } from 'react';
import { AppHeader } from '../components/AppHeader';
import { Footer } from '../components/Footer';
import { GashaponMachine } from '../components/GashaponMachine';
import { useAlbums } from '../hooks/useAlbums';
import { useAuth } from '../hooks/useAuth';
import { useUserReviews } from '../hooks/useUserReviews';
import { LoginModal } from '../components/LoginModal';

export function GashaponPage() {
  const { albums, refetch: refetchAlbums } = useAlbums();
  const { user, loading: authLoading, isAdmin, loginWithGoogle, logout } = useAuth();
  const { userReviews, refetchUserReviews } = useUserReviews(user);

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

  return (
    <div className="min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header con navegación completa y login */}
        <AppHeader
          user={user}
          isAdmin={isAdmin}
          onLogin={handleLogin}
          onLogout={handleLogout}
          loading={authLoading}
          showTitle={false}
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

        {/* Contenido Principal del Gashapon */}
        <main className="py-4 sm:py-6">
          <GashaponMachine
            albums={albums}
            user={user}
            userReviews={userReviews}
            refetchUserReviews={refetchUserReviews}
            refetchAlbums={refetchAlbums}
          />
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default GashaponPage;
