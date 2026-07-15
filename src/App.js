import React, { useState, useEffect } from 'react';
import './styles/global.css';
import { Header } from './components/Header';
import { SlotMachine } from './components/SlotMachine';
import { LoadingOverlay } from './components/LoadingOverlay';
import { WinnerFullscreen } from './components/WinnerFullscreen';
import { AlbumGrid } from './components/AlbumGrid';
import { useAlbums } from './hooks/useAlbums';

const STORAGE_KEY = 'MAQUINA_MUSICAL_WINNER';

function App() {
  const { albums, loading, error, markAlbumAsInactive } = useAlbums();
  const [winner, setWinner] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Cargar ganador guardado al iniciar
  useEffect(() => {
    const savedWinner = localStorage.getItem(STORAGE_KEY);
    if (savedWinner) {
      try {
        const parsed = JSON.parse(savedWinner);
        setWinner(parsed);
        setShowWinnerPopup(true);
      } catch (e) {
        console.error('Error al cargar ganador guardado:', e);
      }
    }
  }, []);

  const handleSpinComplete = (selectedAlbum) => {
    // Guardar en localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedAlbum));
    setWinner(selectedAlbum);
    setShowWinnerPopup(true);
    setIsSpinning(false);
  };

  const handleSpinStart = () => {
    setIsSpinning(true);
  };

  const handleCloseWinner = () => {
    setShowWinnerPopup(false);
  };

  // Función para resetear el ganador (solo admin)
  const resetWinner = () => {
    localStorage.removeItem(STORAGE_KEY);
    setWinner(null);
    setShowWinnerPopup(false);
  };

  // Escuchar cambios en el estado de admin desde SlotMachine
  useEffect(() => {
    const handleAdminChange = (event) => {
      if (event.detail && typeof event.detail.isAdmin === 'boolean') {
        setIsAdmin(event.detail.isAdmin);
      }
    };

    window.addEventListener('adminStatusChange', handleAdminChange);
    return () =>
      window.removeEventListener('adminStatusChange', handleAdminChange);
  }, []);

  return (
    <div className="relative min-h-screen w-full max-w-5xl mx-auto p-4 md:p-6">
      {/* Grid de fondo cyberpunk */}
      <div className="fixed inset-0 pointer-events-none cyber-grid opacity-20"></div>

      {/* Borde de neón sutil */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#f5576c]/10 via-[#f093fb]/10 to-[#f5576c]/10 rounded-[60px] blur-xl"></div>

      <LoadingOverlay loading={loading} message="Cargando álbumes..." />

      <div className="relative">
        <Header />

        <SlotMachine
          albums={albums}
          onSpinComplete={handleSpinComplete}
          isSpinning={isSpinning}
          onSpinStart={handleSpinStart}
          markAlbumAsInactive={markAlbumAsInactive}
        />

        {/* Botón para resetear ganador (SOLO ADMIN) */}
        {isAdmin && winner && (
          <div className="text-center mt-4">
            <button
              onClick={resetWinner}
              className="text-xs text-white/30 hover:text-white/60 transition-colors px-4 py-2 border border-white/10 hover:border-white/20 rounded-full bg-white/5 hover:bg-white/10"
            >
              🔄 Resetear ganador
            </button>
          </div>
        )}

        <AlbumGrid
          albums={albums}
          loading={loading}
          error={error}
          winner={winner}
        />

        <WinnerFullscreen
          winner={winner}
          onClose={handleCloseWinner}
          isOpen={showWinnerPopup}
        />
      </div>
    </div>
  );
}

export default App;
