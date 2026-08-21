import React, { useState, useEffect, useRef } from 'react';
import { supabaseService } from '../services/supabaseClient';
import { searchTracks } from '../services/spotifyApi';

const VIBE_SUGGESTIONS = [
  '🎧 Escúchala con buenos audífonos',
  '🔥 Joyita oculta imperdible',
  '✨ Me recordó a tu estilo musical',
  '🎸 La producción y el solo son increíbles',
  '🌙 Perfecta para la noche',
  '☕ Mood relajante y reconfortante',
];

export function SendSongRecommendationModal({
  isOpen,
  onClose,
  currentUser,
  defaultRecipient = null,
  onSuccess,
}) {
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Form State
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [isRecipientDropdownOpen, setIsRecipientDropdownOpen] = useState(false);

  const [trackSearchQuery, setTrackSearchQuery] = useState('');
  const [spotifyResults, setSpotifyResults] = useState([]);
  const [isSearchingSpotify, setIsSearchingSpotify] = useState(false);
  const [showSpotifyResults, setShowSpotifyResults] = useState(false);

  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [albumName, setAlbumName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [spotifyLink, setSpotifyLink] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [appleMusicLink, setAppleMusicLink] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  // Cargar lista de miembros del club
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadMembers() {
      setLoadingProfiles(true);
      try {
        const data = await supabaseService.getAllProfiles();
        if (isMounted) {
          // Filtrar para no mostrar al usuario actual
          const currentEmail = (currentUser?.email || '').toLowerCase().trim();
          const currentId = currentUser?.id ? String(currentUser.id) : null;
          const filtered = (data || []).filter((p) => {
            const pEmail = (p.email || '').toLowerCase().trim();
            const pId = p.id ? String(p.id) : null;
            return pEmail !== currentEmail && (!currentId || pId !== currentId);
          });
          setProfiles(filtered);

          // Si hay destinatario por defecto
          if (defaultRecipient) {
            const matched = filtered.find(
              (p) =>
                (defaultRecipient.email &&
                  p.email?.toLowerCase().trim() === defaultRecipient.email?.toLowerCase().trim()) ||
                (defaultRecipient.id && String(p.id) === String(defaultRecipient.id)) ||
                (defaultRecipient.name && p.name?.toLowerCase().trim() === defaultRecipient.name?.toLowerCase().trim())
            );
            setSelectedRecipient(matched || defaultRecipient);
          }
        }
      } catch (err) {
        console.warn('Error cargando perfiles:', err);
      } finally {
        if (isMounted) setLoadingProfiles(false);
      }
    }

    loadMembers();
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser, defaultRecipient]);

  // Búsqueda en Spotify con debounce
  const handleSpotifySearchChange = (e) => {
    const val = e.target.value;
    setTrackSearchQuery(val);
    setShowSpotifyResults(true);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val || val.trim().length < 2) {
      setSpotifyResults([]);
      setIsSearchingSpotify(false);
      return;
    }

    setIsSearchingSpotify(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await searchTracks(val, 8);
        if (res && res.success && res.tracks) {
          setSpotifyResults(res.tracks);
        } else {
          setSpotifyResults([]);
        }
      } catch (err) {
        console.warn('Error buscando tracks:', err);
        setSpotifyResults([]);
      } finally {
        setIsSearchingSpotify(false);
      }
    }, 350);
  };

  // Seleccionar track de Spotify
  const handleSelectTrack = (track) => {
    setSongTitle(track.name || '');
    setArtistName(track.artistName || (track.artists && track.artists.join(', ')) || '');
    setAlbumName(track.albumName || '');
    setImageUrl(track.imageUrl || '');
    setSpotifyLink(track.spotifyUrl || '');
    setShowSpotifyResults(false);
    setTrackSearchQuery('');
  };

  // Reset del formulario al cerrar
  const handleClose = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setSongTitle('');
    setArtistName('');
    setAlbumName('');
    setImageUrl('');
    setSpotifyLink('');
    setYoutubeLink('');
    setAppleMusicLink('');
    setMessage('');
    setTrackSearchQuery('');
    setSpotifyResults([]);
    setSelectedRecipient(null);
    onClose();
  };

  // Enviar recomendación
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedRecipient) {
      setErrorMsg('Por favor selecciona el miembro del club al que deseas enviar la recomendación.');
      return;
    }

    if (!songTitle.trim() || !artistName.trim()) {
      setErrorMsg('El título de la canción y el nombre del artista son obligatorios.');
      return;
    }

    if (!currentUser || !currentUser.email) {
      setErrorMsg('Debes iniciar sesión para enviar una recomendación.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        senderId: currentUser.id || null,
        senderName: currentUser.name || currentUser.email?.split('@')[0] || 'Miembro de Musiclub',
        senderEmail: currentUser.email,
        recipientId: selectedRecipient.id || null,
        recipientName: selectedRecipient.name || selectedRecipient.email?.split('@')[0] || 'Compañero',
        recipientEmail: selectedRecipient.email,
        songTitle: songTitle.trim(),
        artistName: artistName.trim(),
        albumName: albumName.trim() || null,
        imageUrl: imageUrl.trim() || null,
        spotifyLink: spotifyLink.trim() || null,
        youtubeLink: youtubeLink.trim() || null,
        appleMusicLink: appleMusicLink.trim() || null,
        message: message.trim() || null,
      };

      await supabaseService.sendSongRecommendation(payload);

      setSuccessMsg('¡Cartita musical enviada con éxito! 💌✨');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        handleClose();
      }, 1200);
    } catch (err) {
      console.error('Error enviando recomendación:', err);
      setErrorMsg(err.message || 'Ocurrió un error al enviar la recomendación.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Filtrar miembros en el buscador de destinatario
  const filteredProfiles = profiles.filter((p) => {
    if (!recipientSearch.trim()) return true;
    const term = recipientSearch.toLowerCase();
    const name = (p.name || '').toLowerCase();
    const email = (p.email || '').toLowerCase();
    const favArtist = (p.favorite_artist || '').toLowerCase();
    return name.includes(term) || email.includes(term) || favArtist.includes(term);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-gradient-to-br from-[#181935] via-[#101226] to-[#0a0b16] border border-white/20 rounded-3xl shadow-2xl p-5 sm:p-7 overflow-hidden my-auto animate-fadeIn max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Luces de fondo decorativas */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#f5576c]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#f093fb]/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#f5576c] to-[#f093fb] flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-[#f5576c]/30">
              💌
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                Buzón Musical: Enviar Canción
              </h2>
              <p className="text-white/50 text-xs">
                Recomiéndale una canción exclusiva a un compañero del club
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* Notificaciones de Éxito / Error */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn flex-shrink-0">
            <span>⚠️</span> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn flex-shrink-0">
            <span>✨</span> {successMsg}
          </div>
        )}

        {/* Contenido scrolleable */}
        <form onSubmit={handleSubmit} className="overflow-y-auto space-y-4 sm:space-y-5 pt-4 pr-1 flex-grow">
          {/* 1. SELECCIÓN DE DESTINATARIO */}
          <div className="space-y-1.5" ref={dropdownRef}>
            <label className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
              <span>👤</span> Para (Miembro del Club): *
            </label>

            {selectedRecipient ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/15 hover:border-white/30 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedRecipient.avatar_url ? (
                    <img
                      src={selectedRecipient.avatar_url}
                      alt={selectedRecipient.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/20 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {(selectedRecipient.name || selectedRecipient.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-sm font-black text-white truncate">
                      {selectedRecipient.name || selectedRecipient.email}
                    </p>
                    <p className="text-[11px] text-white/50 truncate">
                      {selectedRecipient.email}
                      {selectedRecipient.favorite_artist && ` • Fan de ${selectedRecipient.favorite_artist}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecipient(null);
                    setIsRecipientDropdownOpen(true);
                  }}
                  className="px-2.5 py-1 text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={recipientSearch}
                  onChange={(e) => {
                    setRecipientSearch(e.target.value);
                    setIsRecipientDropdownOpen(true);
                  }}
                  onFocus={() => setIsRecipientDropdownOpen(true)}
                  placeholder="Escribe el nombre o correo del compañero..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-black/40 border border-white/15 text-white text-xs sm:text-sm placeholder-white/40 focus:outline-none focus:border-[#f5576c] transition-all"
                />

                {isRecipientDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 max-h-48 overflow-y-auto bg-[#141528] border border-white/20 rounded-2xl shadow-2xl z-30 divide-y divide-white/5">
                    {loadingProfiles ? (
                      <div className="p-4 text-center text-xs text-white/50">Cargando miembros...</div>
                    ) : filteredProfiles.length === 0 ? (
                      <div className="p-4 text-center text-xs text-white/50 italic">
                        No se encontraron miembros con ese nombre.
                      </div>
                    ) : (
                      filteredProfiles.map((prof) => (
                        <div
                          key={prof.id || prof.email}
                          onClick={() => {
                            setSelectedRecipient(prof);
                            setIsRecipientDropdownOpen(false);
                            setRecipientSearch('');
                          }}
                          className="p-2.5 hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors"
                        >
                          {prof.avatar_url ? (
                            <img
                              src={prof.avatar_url}
                              alt={prof.name}
                              className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {(prof.name || prof.email || 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="truncate text-left">
                            <span className="text-xs font-bold text-white block truncate">
                              {prof.name || prof.email}
                            </span>
                            <span className="text-[10px] text-white/40 block truncate">
                              {prof.email}
                              {prof.favorite_artist && ` • ❤️ ${prof.favorite_artist}`}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. BUSCADOR DE CANCIONES EN SPOTIFY */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>🔍</span> Buscar Canción en Spotify (Autocompletar)
              </span>
              <span className="text-[10px] text-[#1DB954] font-medium lowercase">Powered by Spotify</span>
            </label>

            <div className="relative">
              <input
                type="text"
                value={trackSearchQuery}
                onChange={handleSpotifySearchChange}
                placeholder="Escribe el nombre de la canción o artista..."
                className="w-full px-4 py-2.5 rounded-2xl bg-black/40 border border-[#1DB954]/40 text-white text-xs sm:text-sm placeholder-white/40 focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954]/50 transition-all"
              />

              {isSearchingSpotify && (
                <div className="absolute right-3.5 top-3 text-xs text-[#1DB954] animate-spin">
                  ⏳
                </div>
              )}

              {/* Resultados de Búsqueda de Spotify */}
              {showSpotifyResults && spotifyResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 max-h-56 overflow-y-auto bg-[#101226] border border-[#1DB954]/40 rounded-2xl shadow-2xl z-30 divide-y divide-white/5">
                  {spotifyResults.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTrack(t)}
                      className="p-2.5 hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors text-left"
                    >
                      {t.imageUrl ? (
                        <img
                          src={t.imageUrl}
                          alt={t.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 shadow"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-base flex-shrink-0">
                          🎵
                        </div>
                      )}
                      <div className="truncate flex-grow">
                        <span className="text-xs font-bold text-white block truncate">{t.name}</span>
                        <span className="text-[11px] text-white/60 block truncate">
                          {t.artistName} {t.albumName && `• ${t.albumName}`}
                        </span>
                      </div>
                      <span className="text-[10px] bg-[#1DB954]/20 text-[#1DB954] px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                        Elegir 🎵
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. CAMPOS DE LA CANCIÓN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-white/80 block mb-1">
                Título de la Canción: *
              </label>
              <input
                type="text"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                required
                placeholder="Ej. Starman, Nangs, Bohemian Rhapsody..."
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs sm:text-sm focus:outline-none focus:border-[#f5576c]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white/80 block mb-1">
                Artista / Banda: *
              </label>
              <input
                type="text"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                required
                placeholder="Ej. David Bowie, Tame Impala..."
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs sm:text-sm focus:outline-none focus:border-[#f5576c]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-white/80 block mb-1">
                Álbum o Single (Opcional):
              </label>
              <input
                type="text"
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value)}
                placeholder="Ej. Currents, Ziggy Stardust..."
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs sm:text-sm focus:outline-none focus:border-[#f5576c]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white/80 block mb-1">
                Enlace de Portada (Image URL):
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs sm:text-sm focus:outline-none focus:border-[#f5576c]"
              />
            </div>
          </div>

          {/* Links de Streaming */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#1DB954] block mb-1 flex items-center gap-1">
                <span>🎵</span> Spotify URL:
              </label>
              <input
                type="url"
                value={spotifyLink}
                onChange={(e) => setSpotifyLink(e.target.value)}
                placeholder="https://open.spotify.com/track/..."
                className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-[#1DB954]/30 text-white text-xs focus:outline-none focus:border-[#1DB954]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-red-400 block mb-1 flex items-center gap-1">
                <span>▶️</span> YouTube URL:
              </label>
              <input
                type="url"
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-red-500/30 text-white text-xs focus:outline-none focus:border-red-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-pink-300 block mb-1 flex items-center gap-1">
                <span>🍎</span> Apple Music URL:
              </label>
              <input
                type="url"
                value={appleMusicLink}
                onChange={(e) => setAppleMusicLink(e.target.value)}
                placeholder="https://music.apple.com/..."
                className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-pink-400/30 text-white text-xs focus:outline-none focus:border-pink-300"
              />
            </div>
          </div>

          {/* 4. MENSAJE / DEDICATORIA PERSONAL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>✍️</span> Tu Dedicatoria / Mensaje en la Cartita:
              </span>
              <span className="text-[10px] text-white/40">{message.length}/300 car.</span>
            </label>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 300))}
              rows={3}
              placeholder="Escribe por qué le recomiendas este track (ej: 'Te va a encantar la atmósfera de esta rola, escúchala cuando estés relajado')..."
              className="w-full p-3.5 rounded-2xl bg-black/40 border border-white/15 text-white text-xs sm:text-sm placeholder-white/40 focus:outline-none focus:border-[#f5576c] resize-none leading-relaxed"
            />

            {/* Chips de sugerencia rápida */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {VIBE_SUGGESTIONS.map((vibe, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const separator = message ? '\n' : '';
                    if (!message.includes(vibe)) {
                      setMessage((prev) => (prev + separator + vibe).slice(0, 300));
                    }
                  }}
                  className="text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all text-left"
                >
                  + {vibe}
                </button>
              ))}
            </div>
          </div>

          {/* 5. VISTA PREVIA DE LA CARTITA POSTAL */}
          {songTitle && (
            <div className="pt-2">
              <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest block mb-2">
                Vista Previa de la Cartita Musical:
              </span>

              <div className="relative rounded-2xl p-4 bg-gradient-to-br from-[#1d1f3b] via-[#15172d] to-[#0d0f1e] border-2 border-[#f5576c]/40 shadow-xl overflow-hidden text-left">
                {/* Sello postal */}
                <div className="absolute top-3 right-3 w-10 h-12 rounded-lg bg-gradient-to-tr from-amber-400 to-rose-500 border border-white/40 shadow flex flex-col items-center justify-center text-white select-none">
                  <span className="text-xs">🎵</span>
                  <span className="text-[7px] font-mono font-black uppercase">CLUB</span>
                </div>

                <div className="flex items-center gap-3 pr-12 mb-3">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={songTitle}
                      className="w-12 h-12 rounded-xl object-cover shadow border border-white/20 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#f5576c] to-[#f093fb] flex items-center justify-center text-xl flex-shrink-0 shadow">
                      💿
                    </div>
                  )}
                  <div className="truncate">
                    <h4 className="text-sm font-black text-white truncate">{songTitle}</h4>
                    <p className="text-xs font-semibold text-amber-300 truncate">{artistName}</p>
                    {albumName && <p className="text-[10px] text-white/50 truncate">Álbum: {albumName}</p>}
                  </div>
                </div>

                {message && (
                  <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 text-xs text-white/90 italic leading-relaxed">
                    "{message}"
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white/60 hover:text-white transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting || !songTitle.trim() || !artistName.trim() || !selectedRecipient}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-lg transition-all flex items-center gap-2 ${
                submitting || !songTitle.trim() || !artistName.trim() || !selectedRecipient
                  ? 'bg-slate-800 border border-white/10 opacity-50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#f5576c] via-[#f093fb] to-cyan-400 hover:brightness-110 active:scale-95 shadow-[#f5576c]/30'
              }`}
            >
              {submitting ? (
                <>
                  <span className="animate-spin">🌀</span> Enviando...
                </>
              ) : (
                <>
                  <span>💌</span> Enviar Cartita (+50 XP)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default SendSongRecommendationModal;
