// src/components/SlotMachine.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ReviewSystem } from './ReviewSystem';

export function SlotMachine({
  albums,
  onSpinComplete,
  isSpinning,
  onSpinStart,
  markAlbumAsInactive,
  isAdmin = false,
  user = null,
}) {
  const [reels, setReels] = useState([0, 0, 0]);
  const [isSpinningLocal, setIsSpinningLocal] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const [message, setMessage] = useState('🎰 ¡Tira la palanca!');
  const [finalWinner, setFinalWinner] = useState(null);
  const carruselIntervalRef = useRef(null);
  const isMounted = useRef(true);
  const carruselTimeoutRef = useRef(null);

  const machineAlbums = albums.filter((album) => album.status === 'ACTIVO');
  const activePool = machineAlbums.length > 0 ? machineAlbums : albums;

  // Pre-cargar todas las imágenes del pool activo en memoria del navegador para animación ultra rápida y fluida
  useEffect(() => {
    if (activePool && activePool.length > 0) {
      activePool.forEach((alb) => {
        if (alb?.imagen) {
          const img = new Image();
          img.src = alb.imagen;
        }
      });
    }
  }, [activePool]);

  /**
   * Helper para obtener timestamp numérico seguro de un álbum.
   */
  const getAlbumTimestamp = (album) => {
    if (!album || !album.created_at) return Date.now();
    const parsed = new Date(album.created_at).getTime();
    return isNaN(parsed) ? Date.now() : parsed;
  };

  /**
   * Selecciona un índice ponderado según la antigüedad del álbum.
   * Entre más antiguo (fecha created_at menor), mayor probabilidad de ganar.
   * El porcentaje extra es bajo/moderado (~35-40% más peso para el más antiguo vs el más reciente).
   */
  const getWeightedWinnerIndex = (pool) => {
    if (!pool || pool.length === 0) return 0;
    if (pool.length === 1) return 0;

    const timestamps = pool.map(getAlbumTimestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeSpan = maxTime - minTime;

    // Si todos tienen la misma fecha o el rango es 0, selección uniforme
    if (timeSpan <= 0) {
      return Math.floor(Math.random() * pool.length);
    }

    // Base 1.0 + (factor de antigüedad 0.0 a 1.0) * 0.4
    // Más antiguo => factor 1.0 => peso 1.4
    // Más reciente => factor 0.0 => peso 1.0
    const weights = timestamps.map((t) => {
      const ageFactor = (maxTime - t) / timeSpan;
      return 1.0 + ageFactor * 0.4;
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let randomVal = Math.random() * totalWeight;

    for (let i = 0; i < pool.length; i++) {
      randomVal -= weights[i];
      if (randomVal <= 0) {
        return i;
      }
    }

    return pool.length - 1;
  };

  const getAlbumForReel = (index) => {
    if (!activePool.length)
      return { album: '???', artista: '???', imagen: '' };
    return activePool[index % activePool.length];
  };

  const launchConfetti = () => {
    const colors = [
      '#f5576c',
      '#f093fb',
      '#ffd93d',
      '#6bcb77',
      '#4d96ff',
      '#ff6b6b',
      '#ff9ff3',
      '#00d2ff',
    ];
    for (let i = 0; i < 120; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.top = '-10px';
      piece.style.background =
        colors[Math.floor(Math.random() * colors.length)];
      piece.style.width = Math.random() * 8 + 4 + 'px';
      piece.style.height = Math.random() * 8 + 4 + 'px';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      piece.style.animationDuration = Math.random() * 2.5 + 2 + 's';
      piece.style.animationDelay = Math.random() * 0.8 + 's';
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      piece.style.boxShadow = `0 0 10px ${colors[Math.floor(Math.random() * colors.length)]}`;
      piece.style.zIndex = '10000';
      document.body.appendChild(piece);
      setTimeout(() => {
        if (piece.parentNode) piece.remove();
      }, 5000);
    }
  };

  const getSlotResult = () => {
    const random = Math.random() * 100;
    let result;

    if (random < 50) {
      const winnerIndex = getWeightedWinnerIndex(activePool);
      result = [winnerIndex, winnerIndex, winnerIndex];
    } else if (random < 70) {
      const winnerIndex = getWeightedWinnerIndex(activePool);
      let differentIndex;
      do {
        differentIndex = Math.floor(Math.random() * activePool.length);
      } while (differentIndex === winnerIndex && activePool.length > 1);
      const differentColumn = Math.floor(Math.random() * 3);
      result = [winnerIndex, winnerIndex, winnerIndex];
      result[differentColumn] = differentIndex;
    } else {
      const indices = [];
      while (indices.length < 3 && indices.length < activePool.length) {
        const idx = Math.floor(Math.random() * activePool.length);
        if (!indices.includes(idx)) indices.push(idx);
      }
      while (indices.length < 3) {
        indices.push(Math.floor(Math.random() * activePool.length));
      }
      result = indices.sort(() => Math.random() - 0.5);
    }

    return result;
  };

  const spinSingleReel = (reelIndex, targetIndex, duration, currentReels) => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const interval = 40 + Math.random() * 20;
      let current = currentReels[reelIndex];

      const spinInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        const easeOut = 1 - Math.pow(1 - progress, 3);

        if (progress < 0.8) {
          current =
            (current + 1 + Math.floor(Math.random() * 2)) % activePool.length;
        } else {
          const steps = Math.floor((1 - easeOut) * 15);
          const remaining =
            (targetIndex - current + activePool.length) % activePool.length;
          if (steps > 0 && remaining > 0) {
            const stepSize = Math.max(1, Math.ceil(remaining / (steps + 1)));
            current =
              (current + Math.min(stepSize, remaining)) % activePool.length;
          } else if (remaining === 0) {
          } else {
            current = (current + 1) % activePool.length;
          }
        }

        if (isMounted.current) {
          setReels((prev) => {
            const newReels = [...prev];
            newReels[reelIndex] = current % activePool.length;
            return newReels;
          });
        }

        if (progress >= 1) {
          clearInterval(spinInterval);
          if (isMounted.current) {
            setReels((prev) => {
              const newReels = [...prev];
              newReels[reelIndex] = targetIndex % activePool.length;
              return newReels;
            });
          }
          resolve();
        }
      }, interval);
    });
  };

  const startCarrusel = useCallback(() => {
    if (carruselIntervalRef.current) {
      clearInterval(carruselIntervalRef.current);
      carruselIntervalRef.current = null;
    }

    if (!activePool.length) return;

    setReels([
      Math.floor(Math.random() * activePool.length),
      Math.floor(Math.random() * activePool.length),
      Math.floor(Math.random() * activePool.length),
    ]);

    // Animación rápida y continua de imágenes cambiando entre ellas (85ms)
    carruselIntervalRef.current = setInterval(() => {
      if (!isMounted.current) return;

      setReels((prev) => [
        (prev[0] + 1 + Math.floor(Math.random() * 2)) % activePool.length,
        (prev[1] + 1 + Math.floor(Math.random() * 1)) % activePool.length,
        (prev[2] + 1) % activePool.length,
      ]);
    }, 85);
  }, [activePool.length]);

  const stopCarrusel = useCallback(() => {
    if (carruselIntervalRef.current) {
      clearInterval(carruselIntervalRef.current);
      carruselIntervalRef.current = null;
    }
  }, []);

  const spinSequence = async () => {
    if (
      isSpinningLocal ||
      isSpinning ||
      !activePool.length ||
      !isMounted.current
    )
      return;

    stopCarrusel();

    setIsSpinningLocal(true);
    setShowWin(false);
    if (onSpinStart) onSpinStart();
    setMessage('🎰 GIRANDO...');
    setSpinCount((prev) => prev + 1);

    setReels([0, 0, 0]);

    const result = getSlotResult();
    let attempts = 0;
    const maxAttempts = 10;
    let winner = null;

    const attemptSpin = async () => {
      if (!isMounted.current) return;

      attempts++;
      let currentReelsState = [0, 0, 0];

      setMessage('🎰 GIRANDO COLUMNA 1...');
      await spinSingleReel(0, result[0], 1200, currentReelsState);
      currentReelsState = [result[0], 0, 0];

      setMessage('🎰 GIRANDO COLUMNA 2...');
      await spinSingleReel(1, result[1], 1000, currentReelsState);
      currentReelsState = [result[0], result[1], 0];

      setMessage('🎰 GIRANDO COLUMNA 3...');
      await spinSingleReel(2, result[2], 800, currentReelsState);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const r1 = result[0];
      const r2 = result[1];
      const r3 = result[2];
      const allEqual = r1 === r2 && r2 === r3;

      if (allEqual) {
        winner = activePool[r1];
        setFinalWinner(winner);
        setShowWin(true);
        setMessage('🏆 ¡JACKPOT! ¡ÁLBUM GANADOR!');
        launchConfetti();
        setReels([r1, r2, r3]);

        if (onSpinComplete) {
          onSpinComplete(winner);
        }

        setTimeout(async () => {
          if (markAlbumAsInactive && winner) {
            await markAlbumAsInactive(winner.album, winner.artista);
          }
        }, 500);

        setTimeout(() => {
          if (isMounted.current) {
            setIsSpinningLocal(false);
            carruselTimeoutRef.current = setTimeout(() => {
              if (!isSpinningLocal && !isSpinning && isMounted.current) {
                startCarrusel();
              }
            }, 3000);
          }
        }, 800);
      } else {
        if (attempts < maxAttempts) {
          setMessage(`🔄 REINTENTANDO... (${attempts}/${maxAttempts})`);
          await new Promise((resolve) => setTimeout(resolve, 800));
          const newResult = getSlotResult();
          result[0] = newResult[0];
          result[1] = newResult[1];
          result[2] = newResult[2];
          await attemptSpin();
        } else {
          setMessage('🎯 ÚLTIMO INTENTO...');
          const winnerIndex = getWeightedWinnerIndex(activePool);
          const forcedResult = [winnerIndex, winnerIndex, winnerIndex];
          setReels(forcedResult);
          winner = activePool[winnerIndex];
          setFinalWinner(winner);
          setShowWin(true);
          setMessage('🏆 ¡JACKPOT! ¡ÁLBUM GANADOR!');
          launchConfetti();

          if (onSpinComplete) {
            onSpinComplete(winner);
          }

          setTimeout(async () => {
            if (markAlbumAsInactive && winner) {
              await markAlbumAsInactive(winner.album, winner.artista);
            }
          }, 500);

          setTimeout(() => {
            if (isMounted.current) {
              setIsSpinningLocal(false);
              carruselTimeoutRef.current = setTimeout(() => {
                if (!isSpinningLocal && !isSpinning && isMounted.current) {
                  startCarrusel();
                }
              }, 3000);
            }
          }, 800);
        }
      }
    };

    await attemptSpin();
  };

  useEffect(() => {
    isMounted.current = true;
    if (albums.length > 0) {
      const timeout = setTimeout(() => {
        if (isMounted.current && albums.length > 0) {
          startCarrusel();
        }
      }, 500);

      return () => {
        clearTimeout(timeout);
      };
    }

    return () => {
      isMounted.current = false;
      if (carruselIntervalRef.current) {
        clearInterval(carruselIntervalRef.current);
        carruselIntervalRef.current = null;
      }
      if (carruselTimeoutRef.current) {
        clearTimeout(carruselTimeoutRef.current);
        carruselTimeoutRef.current = null;
      }
    };
  }, [albums, startCarrusel]);

  if (!albums.length) {
    return (
      <div className="flex justify-center items-center py-16 text-white/20 text-lg">
        No hay álbumes disponibles
      </div>
    );
  }

  const album1 = getAlbumForReel(reels[0]);
  const album2 = getAlbumForReel(reels[1]);
  const album3 = getAlbumForReel(reels[2]);
  const allEqual = reels[0] === reels[1] && reels[1] === reels[2];
  const isWinner = showWin && allEqual;
  const isCarruselActive = carruselIntervalRef.current !== null;

  return (
    <div className="py-6">
      <div className="relative max-w-3xl mx-auto">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#f5576c] via-[#f093fb] to-[#f5576c] rounded-3xl blur-xl opacity-50 animate-pulse"></div>

        <div className="relative bg-black/70 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border-2 border-[#f5576c]/30">
          <div className="text-center mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span className="text-xs sm:text-sm tracking-[0.3em] text-[#f5576c] border border-[#f5576c]/20 px-4 py-1 rounded-full">
              PRIMER POOL DE ÁLBUMES
            </span>
            <div className="flex items-center gap-2">
              {user && (
                <span className="text-[10px] text-white/30">
                  {isAdmin ? '👑 Admin' : `👤 ${user.name || user.email}`}
                </span>
              )}
            </div>
          </div>

          <div className="text-center mb-3">
            <span className="text-xs text-white/40">{message}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[album1, album2, album3].map((album, idx) => {
              const isWinnerReel = isWinner;

              return (
                <div
                  key={idx}
                  className={`relative bg-black/50 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                    isWinnerReel
                      ? 'border-[#f5576c] shadow-[0_0_60px_rgba(245,87,108,0.5)]'
                      : isCarruselActive && !isSpinningLocal && !isSpinning
                        ? 'border-[#f5576c]/30 shadow-[0_0_30px_rgba(245,87,108,0.08)]'
                        : 'border-white/5'
                  }`}
                  style={{
                    animation: isWinnerReel
                      ? 'slotWin 0.8s ease-in-out'
                      : isCarruselActive && !isSpinningLocal && !isSpinning
                        ? 'carruselPulse 1.2s ease-in-out infinite'
                        : 'none',
                  }}
                >
                  <div className="aspect-square flex flex-col items-center justify-center p-2 sm:p-3 relative">
                    <img
                      src={album.imagen}
                      alt={album.album}
                      className="w-full h-full object-cover rounded-xl"
                    />

                    {isWinnerReel && (
                      <div className="absolute inset-0 bg-gradient-to-t from-[#f5576c]/30 via-transparent to-transparent flex items-end justify-center pb-2 sm:pb-3">
                        <span className="text-[#f5576c] text-[10px] sm:text-xs font-bold animate-pulse flex items-center gap-2 bg-black/80 px-2 sm:px-3 py-1 rounded-full backdrop-blur-sm border border-[#f5576c]/30">
                          ⚡ JACKPOT ⚡
                        </span>
                      </div>
                    )}

                    <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] sm:text-[10px] text-white/40 border border-white/5">
                      #{idx + 1}
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md px-1 sm:px-2 py-1 sm:py-1.5 rounded-lg border border-white/5">
                      <p className="text-[8px] sm:text-[10px] text-white/80 truncate text-center">
                        {album.album}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-4 sm:gap-6 mt-4">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-white/30">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSpinningLocal
                    ? 'bg-[#f5576c] animate-pulse'
                    : isWinner
                      ? 'bg-green-500'
                      : isCarruselActive
                        ? 'bg-[#f5576c]/70 animate-pulse'
                        : 'bg-green-500/50'
                }`}
              ></span>
              {isSpinningLocal
                ? 'GIRANDO...'
                : isWinner
                  ? '¡GANADOR!'
                  : isCarruselActive
                    ? 'BLOQUEADO'
                    : 'LISTO'}
            </div>
            {spinCount > 0 && (
              <div className="text-[10px] sm:text-xs text-white/20">
                INTENTOS: {spinCount}
              </div>
            )}
          </div>

          <div className="text-center mt-6">
            {isAdmin ? (
              <button
                onClick={spinSequence}
                disabled={isSpinningLocal || isSpinning}
                className={`
                  relative px-4 sm:px-10 py-3 sm:py-4 rounded-full font-bold text-xs sm:text-lg transition-all duration-300 max-w-full
                  ${
                    isSpinningLocal || isSpinning
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white hover:scale-105 hover:shadow-[0_0_40px_rgba(245,87,108,0.5)] active:scale-95'
                  }
                `}
              >
                {!isSpinningLocal && !isSpinning && (
                  <span className="absolute -inset-0.5 bg-gradient-to-r from-[#f5576c] to-[#f093fb] rounded-full blur opacity-50 animate-pulse"></span>
                )}
                <span className="relative flex items-center justify-center gap-1.5 sm:gap-3">
                  <span className="text-lg sm:text-2xl">🎰</span>
                  <span className="truncate">
                    {isSpinningLocal || isSpinning
                      ? 'GIRANDO...'
                      : '¡TIRAR PALANCA!'}
                  </span>
                  <span className="text-[10px] sm:text-xs tracking-wider opacity-50">
                    {!isSpinningLocal && !isSpinning && '▶'}
                  </span>
                </span>
              </button>
            ) : (
              <button
                onClick={() => {}}
                className="relative px-4 sm:px-10 py-3 sm:py-4 rounded-full font-bold text-xs sm:text-base transition-all duration-300 bg-gray-800/50 text-white/30 cursor-not-allowed border border-white/5 max-w-full"
              >
                <span className="relative flex items-center justify-center gap-1.5 sm:gap-3">
                  <span className="text-lg sm:text-2xl">🔒</span>
                  <span className="truncate">
                    {user ? 'Solo Admin puede girar' : 'Inicia sesión para girar'}
                  </span>
                </span>
              </button>
            )}
          </div>

          {/* Sistema de Reviews */}
          {showWin && finalWinner && (
            <div className="mt-6 rounded-3xl bg-[#0e101d] border border-[#f5576c]/30 sm:border-[#f5576c]/40 p-3 sm:p-5 md:p-7 shadow-2xl animate-fadeIn space-y-3 sm:space-y-4 text-left">
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <span className="text-xl sm:text-2xl">⭐</span>
                  <h3 className="text-base sm:text-xl font-black text-white truncate">
                    Escribir Reseña
                  </h3>
                </div>
              </div>
              <ReviewSystem
                album={finalWinner}
                isAdmin={isAdmin}
                user={user}
                onReviewSubmitted={() => {}}
              />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slotWin {
          0% { transform: scale(1); }
          25% { transform: scale(1.05) rotate(-2deg); }
          50% { transform: scale(1.1) rotate(2deg); }
          75% { transform: scale(1.05) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes carruselPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .confetti-piece {
          position: fixed;
          pointer-events: none;
          animation: confettiFall linear forwards;
        }
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
