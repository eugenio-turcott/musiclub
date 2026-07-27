import React, { useState, useEffect } from 'react';
import { useAlbums } from './hooks/useAlbums';
import { SlotMachine } from './components/SlotMachine';
import { AlbumGrid } from './components/AlbumGrid';
import { Header } from './components/Header';
import { LoadingOverlay } from './components/LoadingOverlay';
import { WinnerFullscreen } from './components/WinnerFullscreen';
import { Rankings } from './components/Rankings';
import { AlbumSearch } from './components/AlbumSearch';

function App() {
  const { albums, loading, error, markAlbumAsInactive, refetch } = useAlbums();
  const [winner, setWinner] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [, setIsAdmin] = useState(false);

  useEffect(() => {
    const handleAdminChange = (e) => {
      setIsAdmin(e.detail.isAdmin);
    };
    window.addEventListener('adminStatusChange', handleAdminChange);
    return () => window.removeEventListener('adminStatusChange', handleAdminChange);
  }, [setIsAdmin]);

  const handleSpinComplete = (selectedAlbum) => {
    setWinner(selectedAlbum);
    setShowWinner(true);
    setIsSpinning(false);
  };

  const handleSpinStart = () => {
    setIsSpinning(true);
    setShowWinner(false);
  };

  const handleCloseWinner = () => {
    setShowWinner(false);
  };

  const handleAlbumCreated = () => {
    refetch(); // Recargar la lista de álbumes
  };

  return (
    <div className="min-h-screen cyber-grid p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <LoadingOverlay loading={loading} message="Cargando álbumes..." />

        <Header />

        <SlotMachine
          albums={albums}
          onSpinComplete={handleSpinComplete}
          isSpinning={isSpinning}
          onSpinStart={handleSpinStart}
          markAlbumAsInactive={markAlbumAsInactive}
        />

        {winner && (
          <WinnerFullscreen
            winner={winner}
            isOpen={showWinner}
            onClose={handleCloseWinner}
          />
        )}

        <AlbumSearch onAlbumCreated={handleAlbumCreated} />

        <AlbumGrid
          albums={albums}
          loading={loading}
          error={error}
          winner={winner}
        />

        <Rankings albums={albums} />
      </div>
    </div>
  );
}

export default App;