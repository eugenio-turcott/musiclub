// src/pages/PatchNotesPage.jsx
import React, { useState } from 'react';
import { AppHeader } from '../components/AppHeader';
import { Footer } from '../components/Footer';
import { PatchNotes } from '../components/PatchNotes';
import { SEO } from '../components/SEO';
import { useAuth } from '../hooks/useAuth';
import { LoginModal } from '../components/LoginModal';

export function PatchNotesPage() {
  const { user, loading: authLoading, isAdmin, loginWithGoogle, logout } = useAuth();

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
      <SEO
        title="Patch Notes & Historial de Actualizaciones | Musiclub"
        description="Consulta el registro completo de cambios, nuevas funciones, mejoras y correcciones de Musiclub sincronizado en tiempo real con GitHub."
        url="https://musiclub.org/patch-notes"
      />
      <div className="max-w-7xl mx-auto w-full">
        {/* Header con navegación completa y buscador */}
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

        {/* Contenido Principal de Patch Notes */}
        <main className="py-4 sm:py-6">
          <PatchNotes isPage={true} />
        </main>
      </div>

      <Footer />
    </div>
  );
}
