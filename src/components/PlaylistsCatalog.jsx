import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import { supabaseService } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import {
  PLAYLIST_MOODS,
  detectPlatform,
  fetchPlaylistMetadataFromUrl,
  getPlaylistApprovalStats,
} from '../utils/playlistUtils';

export function PlaylistsCatalog({ isPage = true }) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votingMap, setVotingMap] = useState({});
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMood, setSelectedMood] = useState('all');
  const [sortBy, setSortBy] = useState('approval'); // 'approval' | 'votes' | 'recent'
  const [expandedCommentsId, setExpandedCommentsId] = useState(null);

  // Form State
  const [inputUrl, setInputUrl] = useState('');
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [detectedPlatformInfo, setDetectedPlatformInfo] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    curatorName: '',
    description: '',
    imageUrl: '',
    spotifyLink: '',
    appleMusicLink: '',
    youtubeMusicLink: '',
    otherLink: '',
    genreOrMood: 'Chill & Focus',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Quick Comment Modal / Prompt State for voting
  const [commentModalPlaylist, setCommentModalPlaylist] = useState(null);
  const [voteCommentText, setVoteCommentText] = useState('');
  const [pendingVoteLiked, setPendingVoteLiked] = useState(null);

  const userEmail = user?.email || null;

  const loadPlaylists = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    }
    try {
      const data = await supabaseService.getPlaylists(userEmail);
      // No usar fallbacks ni datos default
      setPlaylists(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching playlists:', err);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    loadPlaylists(true);
  }, [loadPlaylists]);

  const openProposeModal = useCallback(() => {
    setFormError(null);
    setFormSuccess(false);
    setInputUrl('');
    setDetectedPlatformInfo(null);
    setFormData({
      title: '',
      curatorName: user?.name || user?.email?.split('@')[0] || '',
      description: '',
      imageUrl: '',
      spotifyLink: '',
      appleMusicLink: '',
      youtubeMusicLink: '',
      otherLink: '',
      genreOrMood: 'Chill & Focus',
    });
    setShowProposeModal(true);
  }, [user]);

  // Manejar cambio y auto-fetch del enlace URL
  const handleUrlInputChange = async (e) => {
    const rawVal = e.target.value;
    setInputUrl(rawVal);
    setFormError(null);

    const trimmed = rawVal.trim();
    if (!trimmed) {
      setDetectedPlatformInfo(null);
      setFormData((prev) => ({
        ...prev,
        title: '',
        imageUrl: '',
        spotifyLink: '',
        appleMusicLink: '',
        youtubeMusicLink: '',
        otherLink: '',
      }));
      return;
    }

    const plat = detectPlatform(trimmed);
    setDetectedPlatformInfo(plat);

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      setIsFetchingMeta(true);
      try {
        const meta = await fetchPlaylistMetadataFromUrl(trimmed);
        if (meta && meta.success) {
          setFormData((prev) => {
            const updated = {
              ...prev,
              title: meta.title || prev.title,
              imageUrl: meta.imageUrl || prev.imageUrl,
              description: meta.description || prev.description,
              spotifyLink: meta.platform === 'spotify' ? meta.url : prev.spotifyLink,
              appleMusicLink: meta.platform === 'apple' ? meta.url : prev.appleMusicLink,
              youtubeMusicLink: meta.platform === 'youtube' ? meta.url : prev.youtubeMusicLink,
              otherLink: meta.platform === 'other' ? meta.url : prev.otherLink,
            };
            return updated;
          });
        }
      } catch (err) {
        console.warn('Error fetching URL metadata:', err);
      } finally {
        setIsFetchingMeta(false);
      }
    }
  };

  // Manejador de Voto Sí/No
  const handleVote = async (playlist, liked) => {
    const reviewerName = user?.name || user?.email?.split('@')[0] || 'Miembro Musiclub';
    const reviewerEmail = user?.email || '';

    if (!reviewerEmail) {
      alert('Debes iniciar sesión para votar en las playlists.');
      return;
    }

    setVotingMap((prev) => ({ ...prev, [playlist.id]: true }));

    try {
      await supabaseService.votePlaylist({
        playlistId: playlist.id,
        reviewerName,
        reviewerEmail,
        liked,
        comment: '',
        userId: user?.id || null,
      });

      // Optimistic UI Update
      setPlaylists((prev) =>
        prev.map((item) => {
          if (item.id !== playlist.id) return item;

          const existingReviews = item.reviews || [];
          const normEmail = reviewerEmail.toLowerCase().trim();
          const filtered = existingReviews.filter(
            (r) => (r.reviewer_email || '').toLowerCase().trim() !== normEmail
          );

          const newVote = {
            id: `vote-${Date.now()}`,
            playlist_id: item.id,
            reviewer_name: reviewerName,
            reviewer_email: normEmail,
            liked: liked,
            comment: '',
            created_at: new Date().toISOString(),
          };

          const updatedReviews = [newVote, ...filtered];
          const likes = updatedReviews.filter((r) => r.liked === true).length;
          const dislikes = updatedReviews.filter((r) => r.liked === false).length;
          const totalVotes = likes + dislikes;
          const approvalRate = totalVotes > 0 ? Math.round((likes / totalVotes) * 100) : null;

          return {
            ...item,
            reviews: updatedReviews,
            likes_count: likes,
            dislikes_count: dislikes,
            total_votes: totalVotes,
            approval_rate: approvalRate,
            user_vote: liked,
          };
        })
      );
    } catch (err) {
      console.error('Error voting playlist:', err);
      alert(`Error al registrar el voto: ${err.message}`);
    } finally {
      setVotingMap((prev) => ({ ...prev, [playlist.id]: false }));
    }
  };

  // Abrir modal para votar con comentario
  const handleOpenVoteWithComment = (playlist, liked) => {
    setCommentModalPlaylist(playlist);
    setPendingVoteLiked(liked);
    setVoteCommentText(playlist.user_comment || '');
  };

  const handleConfirmVoteWithComment = async () => {
    if (!commentModalPlaylist) return;
    const playlist = commentModalPlaylist;
    const liked = pendingVoteLiked;
    const comment = voteCommentText.trim();
    const reviewerName = user?.name || user?.email?.split('@')[0] || 'Miembro Musiclub';
    const reviewerEmail = user?.email || '';

    if (!reviewerEmail) {
      alert('Debes iniciar sesión para votar.');
      return;
    }

    setVotingMap((prev) => ({ ...prev, [playlist.id]: true }));

    try {
      await supabaseService.votePlaylist({
        playlistId: playlist.id,
        reviewerName,
        reviewerEmail,
        liked,
        comment,
        userId: user?.id || null,
      });

      setPlaylists((prev) =>
        prev.map((item) => {
          if (item.id !== playlist.id) return item;
          const existingReviews = item.reviews || [];
          const normEmail = reviewerEmail.toLowerCase().trim();
          const filtered = existingReviews.filter(
            (r) => (r.reviewer_email || '').toLowerCase().trim() !== normEmail
          );
          const newVote = {
            id: `vote-${Date.now()}`,
            playlist_id: item.id,
            reviewer_name: reviewerName,
            reviewer_email: normEmail,
            liked: liked,
            comment: comment,
            created_at: new Date().toISOString(),
          };
          const updatedReviews = [newVote, ...filtered];
          const likes = updatedReviews.filter((r) => r.liked === true).length;
          const dislikes = updatedReviews.filter((r) => r.liked === false).length;
          const totalVotes = likes + dislikes;
          const approvalRate = totalVotes > 0 ? Math.round((likes / totalVotes) * 100) : null;

          return {
            ...item,
            reviews: updatedReviews,
            likes_count: likes,
            dislikes_count: dislikes,
            total_votes: totalVotes,
            approval_rate: approvalRate,
            user_vote: liked,
            user_comment: comment,
          };
        })
      );
      setCommentModalPlaylist(null);
      setVoteCommentText('');
    } catch (err) {
      console.error('Error submitting vote with comment:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setVotingMap((prev) => ({ ...prev, [playlist.id]: false }));
    }
  };

  // Crear Playlist
  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    const finalUrl = inputUrl.trim();
    if (!finalUrl) {
      setFormError('Por favor pega el enlace URL de la playlist.');
      return;
    }

    if (!formData.title.trim()) {
      setFormError('Por favor ingresa o carga un título para la playlist.');
      return;
    }

    const plat = detectPlatform(finalUrl);
    const spotifyLink = plat?.platform === 'spotify' ? finalUrl : formData.spotifyLink;
    const appleMusicLink = plat?.platform === 'apple' ? finalUrl : formData.appleMusicLink;
    const youtubeMusicLink = plat?.platform === 'youtube' ? finalUrl : formData.youtubeMusicLink;
    const otherLink = plat?.platform === 'other' ? finalUrl : formData.otherLink;

    if (!spotifyLink && !appleMusicLink && !youtubeMusicLink && !otherLink) {
      setFormError('Debes agregar un enlace válido (Spotify, Apple Music o YouTube Music).');
      return;
    }

    const suggestedBy =
      formData.curatorName?.trim() ||
      user?.name ||
      user?.email?.split('@')[0] ||
      'Miembro del Club';
    const addedByEmail = user?.email || 'anonimo@musiclub.com';

    setFormSubmitting(true);

    try {
      await supabaseService.createPlaylist({
        title: formData.title.trim(),
        curatorName: suggestedBy,
        description: formData.description.trim(),
        imageUrl:
          formData.imageUrl ||
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        spotifyLink,
        appleMusicLink,
        youtubeMusicLink,
        otherLink,
        genreOrMood: formData.genreOrMood,
        addedBy: suggestedBy,
        addedByEmail,
        userId: user?.id || null,
      });

      setFormSuccess(true);
      setTimeout(() => {
        setShowProposeModal(false);
        setFormSuccess(false);
        setInputUrl('');
        setDetectedPlatformInfo(null);
        setFormData({
          title: '',
          curatorName: user?.name || user?.email?.split('@')[0] || '',
          description: '',
          imageUrl: '',
          spotifyLink: '',
          appleMusicLink: '',
          youtubeMusicLink: '',
          otherLink: '',
          genreOrMood: 'Chill & Focus',
        });
        loadPlaylists();
      }, 1200);
    } catch (err) {
      console.error('Error creating playlist:', err);
      setFormError(err.message || 'Error al publicar la playlist.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filtrado y Ordenamiento
  const filteredPlaylists = useMemo(() => {
    return playlists
      .filter((pl) => {
        const title = (pl.title || '').toLowerCase();
        const curator = (pl.curator_name || '').toLowerCase();
        const desc = (pl.description || '').toLowerCase();
        const mood = (pl.genre_or_mood || '').toLowerCase();
        const search = searchTerm.toLowerCase().trim();

        const matchesSearch =
          !search ||
          title.includes(search) ||
          curator.includes(search) ||
          desc.includes(search) ||
          mood.includes(search);

        const matchesMood =
          selectedMood === 'all' ||
          mood.includes(selectedMood.toLowerCase()) ||
          (selectedMood === 'chill' && (mood.includes('chill') || mood.includes('focus'))) ||
          (selectedMood === 'energia' && (mood.includes('energ') || mood.includes('fiesta'))) ||
          (selectedMood === 'melancolia' && (mood.includes('melan') || mood.includes('nostal')));

        return matchesSearch && matchesMood;
      })
      .sort((a, b) => {
        if (sortBy === 'approval') {
          const rateA = a.approval_rate !== null ? a.approval_rate : -1;
          const rateB = b.approval_rate !== null ? b.approval_rate : -1;
          if (rateB !== rateA) return rateB - rateA;
          return (b.total_votes || 0) - (a.total_votes || 0);
        }
        if (sortBy === 'votes') {
          return (b.total_votes || 0) - (a.total_votes || 0);
        }
        // recent
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
  }, [playlists, searchTerm, selectedMood, sortBy]);

  return (
    <div
      className={
        isPage
          ? 'min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden text-white'
          : 'fixed inset-0 bg-black/90 backdrop-blur-xl z-[99999] overflow-y-auto py-5 sm:py-8 px-3 sm:px-6 lg:px-8 text-white'
      }
    >
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 w-full">
        {/* Universal Standard App Header */}
        <AppHeader user={user} showTitle={false} />

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1a1235] via-[#101223] to-[#0c1829] border border-white/10 p-5 sm:p-7 md:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-br from-pink-500/15 via-purple-500/10 to-cyan-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-5 sm:gap-6">
            <div className="space-y-2 max-w-2xl text-left">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-pink-400/30 text-pink-300 text-[11px] sm:text-xs font-bold tracking-wider uppercase">
                <span>🎵 Curaduría & Playlists</span>
              </div>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Playlists de la Comunidad
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Descubre selecciones recomendadas por miembros del club con enlaces a{' '}
                <span className="text-emerald-400 font-semibold">Spotify</span>,{' '}
                <span className="text-rose-400 font-semibold">Apple Music</span> y{' '}
                <span className="text-red-400 font-semibold">YouTube Music</span>. Califica con una sola pregunta:{' '}
                <strong className="text-white">¿Te gustó? (Sí / No)</strong> para medir el porcentaje de aprobación.
              </p>
            </div>

            <button
              onClick={openProposeModal}
              className="w-full md:w-auto px-5 py-3 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm flex-shrink-0"
            >
              <span>➕</span> Recomendar Playlist
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-[#141624] p-3.5 sm:p-5 rounded-2xl border border-white/10 space-y-3.5 sm:space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-between items-stretch sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título, quién la sugiere o vibra..."
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-pink-500/60 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2 justify-between sm:justify-start">
              <span className="text-slate-400 text-xs font-semibold whitespace-nowrap">
                Ordenar por:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-black/40 border border-white/10 text-white text-xs sm:text-sm rounded-xl px-3 py-2 sm:py-2.5 focus:outline-none focus:border-pink-500/60 transition-colors cursor-pointer"
              >
                <option value="approval">🔥 Mayor Aprobación (%)</option>
                <option value="votes">🗳️ Más Votadas</option>
                <option value="recent">⏱️ Más Recientes</option>
              </select>
            </div>
          </div>

          {/* Mood Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
            {PLAYLIST_MOODS.map((mood) => {
              const isSelected = selectedMood === mood.id;
              return (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20 scale-[1.02]'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                  }`}
                >
                  <span>{mood.icon}</span>
                  <span>{mood.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Playlists Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="inline-block w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Cargando playlists recomendadas...</p>
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <div className="p-8 sm:p-12 bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl text-center space-y-4 max-w-xl mx-auto my-6 sm:my-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-pink-500/10 border border-pink-500/30 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mx-auto shadow-inner">
              🎵
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-xl font-bold text-white">
                {playlists.length === 0
                  ? 'No hay playlists recomendadas aún'
                  : 'No se encontraron playlists para este filtro'}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                {playlists.length === 0
                  ? 'Sé el primer miembro del club en compartir tu playlist favorita de Spotify, Apple Music o YouTube Music.'
                  : 'Prueba cambiando la vibra seleccionada o el término de búsqueda.'}
              </p>
            </div>
            <button
              onClick={openProposeModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-pink-500/25"
            >
              <span>➕</span> Recomendar Playlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredPlaylists.map((playlist) => {
              const stats = getPlaylistApprovalStats(playlist);
              const isVoting = votingMap[playlist.id];
              const commentsList = (playlist.reviews || []).filter((r) => r.comment && r.comment.trim());
              const isCommentsExpanded = expandedCommentsId === playlist.id;

              return (
                <div
                  key={playlist.id}
                  className="bg-[#141624]/90 border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl transition-all duration-300 group hover:-translate-y-1"
                >
                  {/* Top Cover Image & Info */}
                  <div>
                    <div className="relative aspect-[16/9] sm:h-44 w-full bg-slate-900 overflow-hidden">
                      <img
                        src={
                          playlist.image_url ||
                          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'
                        }
                        alt={playlist.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#141624] via-transparent to-black/30" />

                      {/* Mood Badge */}
                      {playlist.genre_or_mood && (
                        <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-pink-300 border border-white/10 uppercase tracking-wider">
                          ✨ {playlist.genre_or_mood}
                        </span>
                      )}

                      {/* Approval Badge Overlay */}
                      <span
                        className={`absolute top-3 right-3 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-black border shadow-lg ${stats.badge.colorClass}`}
                      >
                        {stats.rate !== null ? `👍 ${stats.rate}%` : '✨ Nuevo'}
                      </span>
                    </div>

                    <div className="p-4 sm:p-5 space-y-3">
                      <div>
                        <h3 className="text-white font-black text-base sm:text-lg leading-snug group-hover:text-pink-300 transition-colors line-clamp-2">
                          {playlist.title}
                        </h3>
                        <p className="text-slate-400 text-xs mt-1">
                          Sugerida por:{' '}
                          <strong className="text-slate-200">
                            {playlist.added_by || playlist.curator_name || 'Miembro del Club'}
                          </strong>
                        </p>
                      </div>

                      {playlist.description && (
                        <p className="text-slate-300/80 text-xs line-clamp-2 leading-relaxed">
                          {playlist.description}
                        </p>
                      )}

                      {/* Platform Links */}
                      <div className="pt-1">
                        <div className="text-white/40 text-[10px] uppercase font-semibold tracking-wider mb-1.5">
                          Escuchar en tu plataforma:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {playlist.spotify_link && (
                            <a
                              href={playlist.spotify_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-[#1DB954]/20 hover:bg-[#1DB954] text-[#1ed760] hover:text-black border border-[#1DB954]/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <span>🟢</span> Spotify
                            </a>
                          )}
                          {playlist.apple_music_link && (
                            <a
                              href={playlist.apple_music_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-[#fc3c44]/20 hover:bg-[#fc3c44] text-rose-300 hover:text-white border border-[#fc3c44]/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <span>🍎</span> Apple Music
                            </a>
                          )}
                          {playlist.youtube_music_link && (
                            <a
                              href={playlist.youtube_music_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <span>▶️</span> YouTube Music
                            </a>
                          )}
                          {playlist.other_link && (
                            <a
                              href={playlist.other_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <span>🔗</span> Enlace Web
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Stats & Binary Voting Section */}
                  <div className="p-4 sm:p-5 pt-0 space-y-3">
                    {/* Approval Bar */}
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <span>📊</span> Aprobación:
                        </span>
                        <span className="text-slate-300 font-mono text-[11px]">
                          {stats.likes} 👍 · {stats.dislikes} 👎 ({stats.totalVotes} votos)
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                        {stats.totalVotes > 0 ? (
                          <>
                            <div
                              style={{ width: `${stats.rate}%` }}
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                              title={`${stats.rate}% Likes`}
                            />
                            <div
                              style={{ width: `${100 - stats.rate}%` }}
                              className="h-full bg-gradient-to-r from-rose-500 to-pink-600 transition-all duration-500"
                              title={`${100 - stats.rate}% Dislikes`}
                            />
                          </>
                        ) : (
                          <div className="w-full h-full bg-slate-700/50" />
                        )}
                      </div>
                    </div>

                    {/* Binary Review Question (True / False - Sí / No) */}
                    <div className="bg-gradient-to-r from-purple-950/20 to-pink-950/20 p-3 rounded-xl border border-pink-500/20 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">
                          ¿Te gustó esta playlist?
                        </span>
                        {playlist.user_vote !== null && playlist.user_vote !== undefined && (
                          <span className="text-[10px] text-pink-300 bg-pink-500/15 px-2 py-0.5 rounded-md font-semibold">
                            Tu voto: {playlist.user_vote ? '👍 Sí' : '👎 No'}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleVote(playlist, true)}
                          disabled={isVoting}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            playlist.user_vote === true
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-[1.02] ring-2 ring-emerald-300/50'
                              : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          <span>👍</span> Sí, me gustó
                        </button>

                        <button
                          type="button"
                          onClick={() => handleVote(playlist, false)}
                          disabled={isVoting}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            playlist.user_vote === false
                              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-[1.02] ring-2 ring-rose-300/50'
                              : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          <span>👎</span> No me gustó
                        </button>
                      </div>

                      {/* Opción para agregar o editar comentario */}
                      <div className="flex justify-between items-center pt-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenVoteWithComment(
                              playlist,
                              playlist.user_vote !== null ? playlist.user_vote : true
                            )
                          }
                          className="text-pink-300/80 hover:text-pink-200 hover:underline flex items-center gap-1 font-medium"
                        >
                          <span>💬</span>{' '}
                          {playlist.user_comment ? 'Editar mi comentario' : 'Dejar comentario'}
                        </button>

                        {commentsList.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedCommentsId(
                                isCommentsExpanded ? null : playlist.id
                              )
                            }
                            className="text-slate-400 hover:text-white text-[11px]"
                          >
                            {isCommentsExpanded
                              ? 'Ocultar notas ▲'
                              : `Ver ${commentsList.length} notas ▼`}
                          </button>
                        )}
                      </div>

                      {/* Lista desplegable de comentarios de miembros */}
                      {isCommentsExpanded && commentsList.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/10 space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar animate-fadeIn">
                          {commentsList.map((c, cIdx) => (
                            <div
                              key={cIdx}
                              className="bg-black/40 p-2 rounded-lg border border-white/5 text-[11px]"
                            >
                              <div className="flex justify-between items-center text-slate-400 text-[10px]">
                                <span className="font-bold text-slate-200">
                                  {c.liked ? '👍' : '👎'} {c.reviewer_name || 'Miembro'}
                                </span>
                              </div>
                              <p className="text-slate-300 mt-0.5 italic">"{c.comment}"</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <Footer />

        {/* Modal para Proponer Playlist vía createPortal (Viewport Completo) */}
        {showProposeModal &&
          createPortal(
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
              <div
                className="bg-[#141624] border border-white/15 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl animate-scaleUp my-auto max-h-[92vh] overflow-y-auto custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎵</span>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                        Recomendar Playlist
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Pega el enlace de Spotify, Apple Music o YouTube Music
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowProposeModal(false)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreatePlaylist} className="space-y-4">
                  {/* Entrada Principal: URL de la Playlist */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-pink-300 font-bold block flex items-center gap-1.5">
                      <span>🔗</span> Enlace URL de la Playlist *
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        required
                        value={inputUrl}
                        onChange={handleUrlInputChange}
                        placeholder="https://open.spotify.com/playlist/... o Apple Music / YouTube Music"
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all pr-10"
                        autoFocus
                      />
                      {isFetchingMeta && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span>✨</span> Autocompleta automáticamente la portada y el título.
                    </p>
                  </div>

                  {/* Previsualización en Tiempo Real de la Portada y Título */}
                  {(formData.title || formData.imageUrl || isFetchingMeta) && (
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3 animate-fadeIn">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 relative border border-white/10">
                        {formData.imageUrl ? (
                          <img
                            src={formData.imageUrl}
                            alt="Portada de la Playlist"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl text-slate-500">
                            🎵
                          </div>
                        )}
                        {detectedPlatformInfo && (
                          <span className="absolute bottom-1 right-1 text-xs">
                            {detectedPlatformInfo.icon}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {detectedPlatformInfo && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${detectedPlatformInfo.badgeClass}`}
                            >
                              {detectedPlatformInfo.name}
                            </span>
                          )}
                          {isFetchingMeta && (
                            <span className="text-[10px] text-amber-300 animate-pulse">
                              Extrayendo portada y título...
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2">
                          {formData.title || (isFetchingMeta ? 'Cargando título...' : 'Sin título aún')}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          Sugerida por:{' '}
                          <span className="text-slate-200">
                            {formData.curatorName || user?.name || (user ? 'Tú' : 'Sin especificar')}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Título (editable si se desea afinar) */}
                  <div>
                    <label className="text-xs text-slate-300 font-semibold block mb-1">
                      Título de la Playlist *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ej. Midnight Melancholy & Late Night Drives"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-pink-500/60"
                    />
                  </div>

                  {/* URL de Portada (autocompletada o editable) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-300 font-semibold">
                        URL de Portada (Imagen)
                      </label>
                      <span className="text-[10px] text-slate-400">Autocompletada o enlace personalizado</span>
                    </div>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://... enlace de imagen o portada"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-pink-500/60"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 font-semibold block mb-1">
                        Sugerido por (Tu nombre o apodo)
                      </label>
                      <input
                        type="text"
                        value={formData.curatorName}
                        onChange={(e) => setFormData({ ...formData, curatorName: e.target.value })}
                        placeholder={user ? (user.name || user.email?.split('@')[0]) : "Tu nombre o apodo"}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-pink-500/60"
                      />
                      {user ? (
                        <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 truncate">
                          <span>🟢</span> Conectado como {user.name || user.email?.split('@')[0]}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <span>💡</span> Inicia sesión con Google para autocompletar.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 font-semibold block mb-1">
                        Vibra / Mood
                      </label>
                      <select
                        value={formData.genreOrMood}
                        onChange={(e) => setFormData({ ...formData, genreOrMood: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 text-white text-xs sm:text-sm rounded-xl px-3.5 py-2 focus:outline-none focus:border-pink-500/60 cursor-pointer"
                      >
                        <option value="Chill & Focus">☕ Chill & Focus</option>
                        <option value="Energía & Fiesta">⚡ Energía & Fiesta</option>
                        <option value="Nostalgia & Melancolía">🌙 Nostalgia & Melancolía</option>
                        <option value="Roadtrip & Viaje">🚗 Roadtrip & Viaje</option>
                        <option value="Indie, Rock & Alt">🎸 Indie, Rock & Alt</option>
                        <option value="Electrónica & Beat">🎛️ Electrónica & Beat</option>
                        <option value="Joyas Ocultas">💎 Joyas Ocultas</option>
                        <option value="General">✨ General</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-semibold block mb-1">
                      Descripción o por qué la recomiendas (Opcional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Cuéntale a la comunidad qué canciones o vibra destacan en esta playlist..."
                      rows="2"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-pink-500/60 resize-none"
                    />
                  </div>

                  {formError && (
                    <div className="text-rose-400 text-xs bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                      ⚠️ {formError}
                    </div>
                  )}
                  {formSuccess && (
                    <div className="text-emerald-400 text-xs bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                      ✅ ¡Playlist publicada con éxito!
                    </div>
                  )}

                  <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowProposeModal(false)}
                      className="w-full sm:w-1/2 py-2.5 bg-white/10 hover:bg-white/15 text-slate-300 rounded-xl text-xs font-semibold transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={formSubmitting || isFetchingMeta}
                      className="w-full sm:w-1/2 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {formSubmitting ? 'Publicando...' : 'Publicar Playlist 🚀'}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}

        {/* Modal de Voto con Comentario vía createPortal */}
        {commentModalPlaylist &&
          createPortal(
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <div
                className="bg-[#141624] border border-white/15 rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-scaleUp my-auto max-h-[92vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>💬</span> Tu Opinión de la Playlist
                  </h4>
                  <button
                    onClick={() => setCommentModalPlaylist(null)}
                    className="w-7 h-7 rounded-full bg-white/5 text-slate-400 hover:text-white flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    ¿Qué opinas de <strong className="text-white">"{commentModalPlaylist.title}"</strong>?
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPendingVoteLiked(true)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        pendingVoteLiked === true
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      👍 Sí, me gustó
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingVoteLiked(false)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        pendingVoteLiked === false
                          ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      👎 No me gustó
                    </button>
                  </div>

                  <textarea
                    value={voteCommentText}
                    onChange={(e) => setVoteCommentText(e.target.value)}
                    placeholder="Escribe un breve comentario u opinión sobre esta playlist..."
                    rows="3"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-pink-500/60 resize-none"
                  />

                  <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setCommentModalPlaylist(null)}
                      className="w-full sm:w-1/2 py-2 bg-white/10 text-slate-300 rounded-xl text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmVoteWithComment}
                      className="w-full sm:w-1/2 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl text-xs font-bold shadow-lg"
                    >
                      Guardar Voto ✨
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}

