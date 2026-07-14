import React, { useState } from 'react';
import './styles/global.css';
import { Header } from './components/Header';
import { SlotMachine } from './components/SlotMachine';
import { LoadingOverlay } from './components/LoadingOverlay';
import { WinnerFullscreen } from './components/WinnerFullscreen';
import { AlbumGrid } from './components/AlbumGrid';
import { useAlbums } from './hooks/useAlbums';

function App() {
  const { albums, loading, error, markAlbumAsInactive } = useAlbums();
  const [winner, setWinner] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const handleSpinComplete = (selectedAlbum) => {
    setWinner(selectedAlbum);
    setIsSpinning(false);
  };

  const handleSpinStart = () => {
    setIsSpinning(true);
    setWinner(null);
  };

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

        <AlbumGrid
          albums={albums}
          loading={loading}
          error={error}
          winner={winner}
        />

        <WinnerFullscreen winner={winner} onClose={() => setWinner(null)} />
      </div>
    </div>
  );
}

export default App;
