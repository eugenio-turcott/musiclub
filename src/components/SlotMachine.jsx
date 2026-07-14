// src/components/SlotMachine.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

export function SlotMachine({
  albums,
  onSpinComplete,
  isSpinning,
  onSpinStart,
  markAlbumAsInactive,
}) {
  const [reels, setReels] = useState([0, 0, 0]);
  const [isSpinningLocal, setIsSpinningLocal] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const [message, setMessage] = useState('🎰 ¡Tira la palanca!');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const carruselIntervalRef = useRef(null);
  const isMounted = useRef(true);
  const carruselTimeoutRef = useRef(null);

  // Credenciales del administrador
  const ADMIN_PASSWORD = 'AMMPACC2026$';

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowLogin(false);
      setPassword('');
      setMessage('🔓 Acceso concedido');
      setTimeout(() => setMessage('🎰 ¡Tira la palanca!'), 1500);
    } else {
      setMessage('❌ Contraseña incorrecta');
      setTimeout(() => setMessage('🎰 ¡Tira la palanca!'), 2000);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setMessage('🔒 Sesión cerrada');
    setTimeout(() => setMessage('🎰 ¡Tira la palanca!'), 1500);
  };

  const getAlbumForReel = (index) => {
    if (!albums.length) return { album: '???', artista: '???', imagen: '' };
    return albums[index % albums.length];
  };

  // Efecto de confeti
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

  // Determinar el resultado basado en probabilidades
  const getSlotResult = () => {
    const random = Math.random() * 100;
    let result;

    if (random < 50) {
      const winnerIndex = Math.floor(Math.random() * albums.length);
      result = [winnerIndex, winnerIndex, winnerIndex];
    } else if (random < 70) {
      const winnerIndex = Math.floor(Math.random() * albums.length);
      let differentIndex;
      do {
        differentIndex = Math.floor(Math.random() * albums.length);
      } while (differentIndex === winnerIndex);
      const differentColumn = Math.floor(Math.random() * 3);
      result = [winnerIndex, winnerIndex, winnerIndex];
      result[differentColumn] = differentIndex;
    } else {
      const indices = [];
      while (indices.length < 3) {
        const idx = Math.floor(Math.random() * albums.length);
        if (!indices.includes(idx)) indices.push(idx);
      }
      result = indices.sort(() => Math.random() - 0.5);
    }

    return result;
  };

  // Girar una columna individual
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
            (current + 1 + Math.floor(Math.random() * 2)) % albums.length;
        } else {
          const steps = Math.floor((1 - easeOut) * 15);
          const remaining =
            (targetIndex - current + albums.length) % albums.length;
          if (steps > 0 && remaining > 0) {
            const stepSize = Math.max(1, Math.ceil(remaining / (steps + 1)));
            current = (current + Math.min(stepSize, remaining)) % albums.length;
          } else if (remaining === 0) {
          } else {
            current = (current + 1) % albums.length;
          }
        }

        if (isMounted.current) {
          setReels((prev) => {
            const newReels = [...prev];
            newReels[reelIndex] = current % albums.length;
            return newReels;
          });
        }

        if (progress >= 1) {
          clearInterval(spinInterval);
          if (isMounted.current) {
            setReels((prev) => {
              const newReels = [...prev];
              newReels[reelIndex] = targetIndex % albums.length;
              return newReels;
            });
          }
          resolve();
        }
      }, interval);
    });
  };

  // Carrusel continuo
  const startCarrusel = useCallback(() => {
    // Limpiar intervalos previos
    if (carruselIntervalRef.current) {
      clearInterval(carruselIntervalRef.current);
      carruselIntervalRef.current = null;
    }

    if (!albums.length) return;

    // Iniciar con valores aleatorios
    setReels([
      Math.floor(Math.random() * albums.length),
      Math.floor(Math.random() * albums.length),
      Math.floor(Math.random() * albums.length),
    ]);

    // Intervalo que se ejecuta continuamente
    carruselIntervalRef.current = setInterval(() => {
      if (!isMounted.current) return;

      setReels((prev) => {
        // Cada columna se mueve a diferentes velocidades
        return [
          (prev[0] + 1 + Math.floor(Math.random() * 2)) % albums.length,
          (prev[1] + 1 + Math.floor(Math.random() * 1)) % albums.length,
          (prev[2] + 1) % albums.length,
        ];
      });
    }, 80);
  }, [albums.length]);

  const stopCarrusel = useCallback(() => {
    if (carruselIntervalRef.current) {
      clearInterval(carruselIntervalRef.current);
      carruselIntervalRef.current = null;
    }
  }, []);

  // Secuencia de giro completa
  const spinSequence = async () => {
    if (isSpinningLocal || isSpinning || !albums.length || !isMounted.current)
      return;

    // Detener carrusel antes de girar
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
    let finalWinner = null;

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
        finalWinner = albums[r1];
        setShowWin(true);
        setMessage('🏆 ¡JACKPOT! ¡ÁLBUM GANADOR!');
        launchConfetti();
        setReels([r1, r2, r3]);

        // 🔴 PRIMERO: Mostrar el popup inmediatamente
        if (onSpinComplete) {
          onSpinComplete(finalWinner);
        }

        // 🔴 DESPUÉS: Marcar como inactivo (con delay de 500ms)
        setTimeout(async () => {
          if (markAlbumAsInactive && finalWinner) {
            await markAlbumAsInactive(finalWinner.album, finalWinner.artista);
          }
        }, 500);

        // Resetear estado después de la animación
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
          const winnerIndex = Math.floor(Math.random() * albums.length);
          const forcedResult = [winnerIndex, winnerIndex, winnerIndex];
          setReels(forcedResult);
          finalWinner = albums[winnerIndex];
          setShowWin(true);
          setMessage('🏆 ¡JACKPOT! ¡ÁLBUM GANADOR!');
          launchConfetti();

          // 🔴 PRIMERO: Mostrar el popup inmediatamente
          if (onSpinComplete) {
            onSpinComplete(finalWinner);
          }

          // 🔴 DESPUÉS: Marcar como inactivo (con delay de 500ms)
          setTimeout(async () => {
            if (markAlbumAsInactive && finalWinner) {
              await markAlbumAsInactive(finalWinner.album, finalWinner.artista);
            }
          }, 500);

          // Resetear estado después de la animación
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

  // Iniciar carrusel al montar el componente
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
      {/* Modal de Login */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[9999]">
          <div className="bg-black/90 border border-[#f5576c]/30 rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-white text-3xl font-bold text-center mb-4 cyber-text">
              🔐 ACCESO ADMIN
            </h3>
            <p className="text-white/40 text-sm text-center mb-6">
              Ingresa la contraseña para acceder a la máquina
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#f5576c]/50 transition-colors"
                autoFocus
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white font-bold py-3 rounded-xl hover:scale-[1.02] transition-all duration-300"
              >
                ACCEDER
              </button>
              <button
                type="button"
                onClick={() => setShowLogin(false)}
                className="w-full text-white/30 text-sm hover:text-white/50 transition-colors"
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="relative max-w-3xl mx-auto">
        {/* Marco de neón */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#f5576c] via-[#f093fb] to-[#f5576c] rounded-3xl blur-xl opacity-50 animate-pulse"></div>

        <div className="relative bg-black/70 backdrop-blur-xl rounded-3xl p-6 border-2 border-[#f5576c]/30">
          {/* Título de la máquina */}
          <div className="text-center mb-4 flex justify-between items-center">
            <span className="text-sm tracking-[0.3em] text-[#f5576c] border border-[#f5576c]/20 px-4 py-1 rounded-full">
              PRIMER POOL DE ÁLBUMES
            </span>
            <button
              onClick={isAdmin ? handleLogout : () => setShowLogin(true)}
              className="text-[14px] text-white/30 hover:text-white/60 transition-colors px-3 py-1 border border-white/10 rounded-full hover:border-white/20"
            >
              {isAdmin ? '🔓 Admin' : '🔒 Login'}
            </button>
          </div>

          {/* Mensaje de estado */}
          <div className="text-center mb-3">
            <span className="text-xs text-white/40">{message}</span>
          </div>

          {/* Reels en orden: 1°, 2°, 3° */}
          <div className="grid grid-cols-3 gap-4">
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
                  <div className="aspect-square flex flex-col items-center justify-center p-3 relative">
                    <img
                      src={album.imagen}
                      alt={album.album}
                      className="w-full h-full object-cover rounded-xl transition-all duration-150"
                    />

                    {isWinnerReel && (
                      <div className="absolute inset-0 bg-gradient-to-t from-[#f5576c]/30 via-transparent to-transparent flex items-end justify-center pb-3">
                        <span className="text-[#f5576c] text-xs font-bold animate-pulse flex items-center gap-2 bg-black/80 px-3 py-1 rounded-full backdrop-blur-sm border border-[#f5576c]/30">
                          ⚡ JACKPOT ⚡
                        </span>
                      </div>
                    )}

                    <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white/40 border border-white/5">
                      #{idx + 1}
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md px-2 py-1.5 rounded-lg border border-white/5">
                      <p className="text-[10px] text-white/80 truncate text-center">
                        {album.album}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Indicador de estado */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2 text-xs text-white/30">
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
              <div className="text-xs text-white/20">INTENTOS: {spinCount}</div>
            )}
          </div>

          {/* Palanca / Botón Cyberpunk - SOLO ADMIN */}
          <div className="text-center mt-6">
            {isAdmin ? (
              <button
                onClick={spinSequence}
                disabled={isSpinningLocal || isSpinning}
                className={`
                  relative px-10 py-4 rounded-full font-bold text-lg transition-all duration-300
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
                <span className="relative flex items-center gap-3">
                  <span className="text-2xl">🎰</span>
                  {isSpinningLocal || isSpinning
                    ? 'GIRANDO...'
                    : '¡TIRAR PALANCA!'}
                  <span className="text-xs tracking-wider opacity-50">
                    {!isSpinningLocal && !isSpinning && '▶'}
                  </span>
                </span>
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="relative px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 bg-gray-800/50 text-white/30 cursor-not-allowed border border-white/5"
              >
                <span className="relative flex items-center gap-3">
                  <span className="text-2xl">🔒</span>
                  BLOQUEADO
                  <span className="text-xs tracking-wider opacity-30">🔐</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
