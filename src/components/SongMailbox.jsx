import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabaseService } from '../services/supabaseClient';

export function SongMailbox({ user, onOpenSendModal }) {
  const [activeSubTab, setActiveSubTab] = useState('received'); // 'received' | 'sent'
  const [receivedList, setReceivedList] = useState([]);
  const [sentList, setSentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterReadStatus, setFilterReadStatus] = useState('all'); // 'all' | 'unread' | 'read'
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Cargar recomendaciones
  const fetchMailboxData = useCallback(async () => {
    if (!user || (!user.email && !user.id)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [received, sent] = await Promise.all([
        supabaseService.getReceivedSongRecommendations(user.email, user.id),
        supabaseService.getSentSongRecommendations(user.email, user.id),
      ]);
      setReceivedList(received || []);
      setSentList(sent || []);
    } catch (err) {
      console.warn('Error fetching song mailbox data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMailboxData();
  }, [fetchMailboxData]);

  // Contadores
  const unreadCount = useMemo(() => {
    return receivedList.filter((item) => !item.is_read).length;
  }, [receivedList]);

  // Filtrado y búsqueda
  const filteredReceived = useMemo(() => {
    return receivedList.filter((item) => {
      // Filtro de lectura
      if (filterReadStatus === 'unread' && item.is_read) return false;
      if (filterReadStatus === 'read' && !item.is_read) return false;

      // Filtro de búsqueda
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const title = (item.song_title || '').toLowerCase();
      const artist = (item.artist_name || '').toLowerCase();
      const sender = (item.sender_name || item.sender_email || '').toLowerCase();
      const msg = (item.message || '').toLowerCase();
      return title.includes(q) || artist.includes(q) || sender.includes(q) || msg.includes(q);
    });
  }, [receivedList, filterReadStatus, searchQuery]);

  const filteredSent = useMemo(() => {
    return sentList.filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const title = (item.song_title || '').toLowerCase();
      const artist = (item.artist_name || '').toLowerCase();
      const recipient = (item.recipient_name || item.recipient_email || '').toLowerCase();
      const msg = (item.message || '').toLowerCase();
      return title.includes(q) || artist.includes(q) || recipient.includes(q) || msg.includes(q);
    });
  }, [sentList, searchQuery]);

  // Toggle leído / no leído
  const handleToggleRead = async (id, currentRead) => {
    // Optimistic UI update
    setReceivedList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read: !currentRead } : item))
    );

    try {
      await supabaseService.markSongRecommendationAsRead(id, !currentRead);
    } catch (err) {
      console.error('Error toggling read status:', err);
      // Revert if error
      setReceivedList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: currentRead } : item))
      );
    }
  };

  // Eliminar recomendación
  const handleDelete = async (id, isReceived) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta cartita de tu buzón?')) return;

    setDeletingId(id);
    try {
      await supabaseService.deleteSongRecommendation(id);
      if (isReceived) {
        setReceivedList((prev) => prev.filter((item) => item.id !== id));
      } else {
        setSentList((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error('Error deleting recommendation:', err);
      alert('No se pudo eliminar la cartita.');
    } finally {
      setDeletingId(null);
    }
  };

  // Formato de fecha amigable
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* BANNER PRINCIPAL DEL BUZÓN */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b1e3f] via-[#121327] to-[#0d0e1a] border border-white/15 p-5 sm:p-7 shadow-2xl">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-[#f5576c]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-[#f093fb]/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#f5576c] via-[#f093fb] to-cyan-400 p-[2px] shadow-lg shadow-[#f5576c]/25 flex-shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-[#101226] rounded-[14px] flex items-center justify-center text-2xl sm:text-3xl">
                📬
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Buzón Musical de Perfil
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 uppercase tracking-wider animate-pulse">
                    {unreadCount} {unreadCount === 1 ? 'nueva cartita' : 'nuevas cartitas'}
                  </span>
                )}
              </div>
              <p className="text-white/60 text-xs sm:text-sm mt-0.5">
                Cartitas y dedicatorias exclusivas con canciones que otros miembros del club te han recomendado.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenSendModal && onOpenSendModal()}
            className="w-full md:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-[#f5576c] via-[#f093fb] to-cyan-400 hover:brightness-110 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#f5576c]/30 flex items-center justify-center gap-2 transition-all"
          >
            <span>✨</span> Recomendar una Canción (+50 XP)
          </button>
        </div>
      </div>

      {/* PESTAÑAS Y BUSCADOR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Selector Recibidas / Enviadas */}
        <div className="flex items-center gap-2 p-1 bg-black/40 border border-white/10 rounded-2xl max-w-fit">
          <button
            onClick={() => setActiveSubTab('received')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeSubTab === 'received'
                ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>📥</span> Recibidas ({receivedList.length})
            {unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[10px] flex items-center justify-center font-black">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('sent')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeSubTab === 'sent'
                ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>📤</span> Enviadas por Mí ({sentList.length})
          </button>
        </div>

        {/* Buscador & Filtros de lectura */}
        <div className="flex items-center gap-2 flex-grow sm:max-w-md">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por canción, artista o dedicatoria..."
              className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-white/40 focus:outline-none focus:border-[#f5576c] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-white/40 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {activeSubTab === 'received' && (
            <select
              value={filterReadStatus}
              onChange={(e) => setFilterReadStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-[#f5576c]"
            >
              <option value="all" className="bg-[#101226]">
                Todas
              </option>
              <option value="unread" className="bg-[#101226]">
                Nuevas 🌟
              </option>
              <option value="read" className="bg-[#101226]">
                Escuchadas ✓
              </option>
            </select>
          )}
        </div>
      </div>

      {/* LISTADO DE CARTITAS MUSICALES */}
      {loading ? (
        <div className="py-16 text-center text-white/50 text-sm animate-pulse flex flex-col items-center justify-center gap-3">
          <span className="text-3xl animate-bounce">💌</span>
          <span>Abriendo tu buzón musical...</span>
        </div>
      ) : activeSubTab === 'received' ? (
        // CARTITAS RECIBIDAS
        filteredReceived.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-white/5 border border-white/10 p-8 flex flex-col items-center justify-center gap-3">
            <span className="text-5xl">📫</span>
            <h4 className="text-lg font-black text-white">No tienes cartitas musicales aquí</h4>
            <p className="text-white/50 text-xs sm:text-sm max-w-md">
              {searchQuery || filterReadStatus !== 'all'
                ? 'No encontramos recomendaciones con esos filtros de búsqueda.'
                : 'Tu buzón está esperando nuevas recomendaciones. ¡Sé el primero en recomendarle una rola a alguien del club!'}
            </p>
            <button
              onClick={() => onOpenSendModal && onOpenSendModal()}
              className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white font-bold text-xs shadow-lg"
            >
              💌 Enviar primera recomendación
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {filteredReceived.map((rec) => (
              <div
                key={rec.id}
                className={`relative rounded-3xl p-5 sm:p-6 transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                  !rec.is_read
                    ? 'bg-gradient-to-br from-[#232752] via-[#161836] to-[#0f1024] border-2 border-[#f5576c]/60 shadow-xl shadow-[#f5576c]/15 hover:border-[#f093fb]'
                    : 'bg-gradient-to-br from-[#16182e] via-[#101224] to-[#0a0b16] border border-white/10 hover:border-white/20'
                }`}
              >
                {/* Sello Postal y Decoración de Cartita */}
                <div className="absolute top-4 right-4 flex items-center gap-2 select-none pointer-events-none">
                  {/* Sello Postal */}
                  <div className="w-12 h-14 rounded-lg bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-[1px] shadow-md transform rotate-2">
                    <div className="w-full h-full bg-[#101226]/90 rounded-[7px] border border-dashed border-white/30 flex flex-col items-center justify-center p-1">
                      <span className="text-xs">🎵</span>
                      <span className="text-[7px] font-mono font-black uppercase text-amber-300">
                        POSTAL
                      </span>
                      <span className="text-[6px] text-white/50">CLUB</span>
                    </div>
                  </div>
                </div>

                {/* Encabezado: Remitente y Fecha */}
                <div>
                  <div className="flex items-center gap-3 pr-14 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md">
                      {(rec.sender_name || rec.sender_email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white truncate">
                          {rec.sender_name || rec.sender_email}
                        </span>
                        {!rec.is_read && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#f5576c] text-white animate-pulse">
                            Nueva
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-white/40 block">
                        Recomendada el {formatDate(rec.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo Musical: Portada + Canción + Artista */}
                  <div className="flex items-center gap-4 bg-black/40 p-3.5 rounded-2xl border border-white/10 mb-4">
                    {rec.image_url ? (
                      <img
                        src={rec.image_url}
                        alt={rec.song_title}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shadow-lg border border-white/10 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-tr from-[#f5576c] via-[#f093fb] to-indigo-600 flex items-center justify-center text-2xl flex-shrink-0 shadow-lg">
                        💿
                      </div>
                    )}

                    <div className="truncate flex-grow">
                      <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-0.5">
                        Canción Recomendada
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-white truncate">
                        {rec.song_title}
                      </h4>
                      <p className="text-xs font-semibold text-amber-300 truncate">
                        {rec.artist_name}
                      </p>
                      {rec.album_name && (
                        <p className="text-[10px] text-white/40 truncate">
                          Álbum: {rec.album_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dedicatoria / Mensaje */}
                  {rec.message && (
                    <div className="relative mb-4 bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                      <div className="text-[10px] uppercase font-bold text-white/40 tracking-wider mb-1 flex items-center gap-1">
                        <span>✍️</span> Dedicatoria:
                      </div>
                      <p className="text-xs sm:text-sm text-white/90 italic leading-relaxed whitespace-pre-line font-serif">
                        "{rec.message}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Enlaces de Reproducción y Acciones de la Cartita */}
                <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
                  {/* Botones de Streaming */}
                  <div className="flex flex-wrap items-center gap-2">
                    {rec.spotify_link && (
                      <a
                        href={rec.spotify_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-[#1DB954]/20 hover:bg-[#1DB954]/30 border border-[#1DB954]/40 text-[#1DB954] text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <span>🎵</span> Abrir en Spotify
                      </a>
                    )}

                    {rec.youtube_link && (
                      <a
                        href={rec.youtube_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <span>▶️</span> YouTube
                      </a>
                    )}

                    {rec.apple_music_link && (
                      <a
                        href={rec.apple_music_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <span>🍎</span> Apple Music
                      </a>
                    )}
                  </div>

                  {/* Barra de Acciones Inferior */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleRead(rec.id, rec.is_read)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                        rec.is_read
                          ? 'text-white/50 hover:text-white bg-white/5 hover:bg-white/10'
                          : 'text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30'
                      }`}
                    >
                      {rec.is_read ? '✓ Marcar no leída' : '✨ Marcar como escuchada'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenSendModal) {
                            onOpenSendModal({
                              id: rec.sender_id,
                              name: rec.sender_name,
                              email: rec.sender_email,
                            });
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/10 font-bold transition-all flex items-center gap-1.5 active:scale-95"
                        title="Recomendarle una canción de vuelta"
                      >
                        <span>💌</span> Responder
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(rec.id, true)}
                        disabled={deletingId === rec.id}
                        className="p-1.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Eliminar cartita"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // CANCIONES ENVIADAS POR EL USUARIO
        filteredSent.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-white/5 border border-white/10 p-8 flex flex-col items-center justify-center gap-3">
            <span className="text-5xl">📤</span>
            <h4 className="text-lg font-black text-white">No has enviado recomendaciones aún</h4>
            <p className="text-white/50 text-xs sm:text-sm max-w-md">
              Sorprende a tus compañeros del club recomendándoles esas canciones especiales que tanto te gustan.
            </p>
            <button
              onClick={() => onOpenSendModal && onOpenSendModal()}
              className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white font-bold text-xs shadow-lg"
            >
              💌 Recomendar mi primera canción
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {filteredSent.map((rec) => (
              <div
                key={rec.id}
                className="relative rounded-3xl p-5 bg-gradient-to-br from-[#16182e] via-[#101224] to-[#0a0b16] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                        {(rec.recipient_name || rec.recipient_email || 'U')[0].toUpperCase()}
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-white truncate block">
                          Para: {rec.recipient_name || rec.recipient_email}
                        </span>
                        <span className="text-[10px] text-white/40 block">
                          Enviada el {formatDate(rec.created_at)}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                        rec.is_read
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {rec.is_read ? '✓ Escuchada' : '⏳ Pendiente'}
                    </span>
                  </div>

                  {/* Canción */}
                  <div className="flex items-center gap-3 bg-black/30 p-3 rounded-2xl border border-white/5 mb-3">
                    {rec.image_url ? (
                      <img
                        src={rec.image_url}
                        alt={rec.song_title}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#f5576c] to-[#f093fb] flex items-center justify-center text-xl flex-shrink-0">
                        💿
                      </div>
                    )}
                    <div className="truncate">
                      <h4 className="text-sm font-black text-white truncate">{rec.song_title}</h4>
                      <p className="text-xs font-semibold text-amber-300 truncate">{rec.artist_name}</p>
                    </div>
                  </div>

                  {rec.message && (
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-xs text-white/80 italic mb-3">
                      "{rec.message}"
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                  {rec.spotify_link ? (
                    <a
                      href={rec.spotify_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1DB954] hover:underline font-bold flex items-center gap-1 text-[11px]"
                    >
                      <span>🎵</span> Ver en Spotify
                    </a>
                  ) : (
                    <span></span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(rec.id, false)}
                    disabled={deletingId === rec.id}
                    className="p-1 text-white/40 hover:text-red-400 text-xs"
                    title="Eliminar de enviados"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
export default SongMailbox;
