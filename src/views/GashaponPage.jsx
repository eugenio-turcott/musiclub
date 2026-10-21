'use client';
// src/pages/GashaponPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import presentation from '../utils/poolPresentation.cjs';
import { AppHeader } from '../components/AppHeader';
import { Footer } from '../components/Footer';
import { GashaponMachine } from '../components/GashaponMachine';
import { SEO } from '../components/SEO';
import { useAlbums } from '../hooks/useAlbums';
import { useAuth } from '../hooks/useAuth';
import { useUserReviews } from '../hooks/useUserReviews';
import { LoginModal } from '../components/LoginModal';

export function GashaponPage({ initialAlbums = [] }) {
  const { albums, refetch: refetchAlbums } = useAlbums(initialAlbums);
  const { user, loading: authLoading, isAdmin, loginWithGoogle, logout } = useAuth();
  const { userReviews, refetchUserReviews } = useUserReviews(user);

  const { search } = useLocation();
  const poolId = new URLSearchParams(search).get('pool') || '';
  const [poolScope, setPoolScope] = useState(null);
  useEffect(() => {
    if (!poolId) { setPoolScope(null); return; }
    let current = true;
    setPoolScope(null);
    (async () => {
      const { data, error } = await supabase.from('public_pool_entries').select('album_id,status').eq('season_id', poolId).in('status', ['ACTIVO', 'GANADOR', 'GRADUADO']);
      if (current) setPoolScope({ id: poolId, entries: data || [], error: !!error });
    })().catch(() => { if (current) setPoolScope({ id: poolId, entries: [], error: true }); });
    return () => { current = false; };
  }, [poolId]);
  const scopeReady = !poolId || poolScope?.id === poolId;
  const scopedAlbums = useMemo(() => poolId ? presentation.poolReleases(albums, poolScope?.id === poolId ? poolScope.entries : []) : albums, [albums, poolId, poolScope]);

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
        title="Gashapon Musical — Descubre Música | Musiclub"
        description="Elige un género musical y descubre lanzamientos del club. Cada género tiene su cápsula y los resultados respetan tu selección."
        url="https://www.musiclub.org/gashapon"
        keywords="ruleta musical, gashapon musica, descubrir albumes aleatorios, juego musical arcade, musiclub gashapon"
      />
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
          {poolId && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-300/20 bg-purple-500/10 p-4 text-sm text-purple-100"><div><p className="font-bold">🎰 Releases del Pool</p><p className="mt-1 text-xs text-slate-300">Solo propuestas activas, disco elegido e historial de esta temporada.</p></div><Link to="/gashapon" className="min-h-11 rounded-xl border border-white/15 px-3 py-3 text-xs font-bold hover:bg-white/10">Explorar catálogo completo</Link></div>}
          {!scopeReady ? <p role="status" className="p-6 text-center text-purple-200">Cargando los releases del Pool…</p> : poolScope?.error ? <p role="alert" className="rounded-xl border border-rose-300/20 p-4 text-rose-200">No pudimos cargar los releases de este Pool. Recarga la página para intentarlo de nuevo.</p> : <GashaponMachine
            albums={scopedAlbums}
            collectionLabel={poolId ? 'releases del Pool' : 'releases del catálogo'}
            user={user}
            userReviews={userReviews}
            refetchUserReviews={refetchUserReviews}
            refetchAlbums={refetchAlbums}
          />}
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default GashaponPage;
