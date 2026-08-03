// src/pages/AdminPage.jsx
import React from 'react';
import { AdminPanel } from '../components/AdminPanel';
import { useAuth } from '../hooks/useAuth';

export function AdminPage() {
  const { isAdmin, loading } = useAuth();

  console.log('AdminPage - isAdmin:', isAdmin, 'loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen cyber-grid flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen cyber-grid flex items-center justify-center">
        <div className="text-white/60 text-center">
          <p className="text-xl">⛔ Acceso denegado</p>
          <p className="text-sm mt-2">No tienes permisos de administrador</p>
          <a
            href="/"
            className="text-[#f5576c] hover:underline mt-4 inline-block"
          >
            ← Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <AdminPanel onClose={() => (window.location.href = '/')} isPage={true} />
  );
}
