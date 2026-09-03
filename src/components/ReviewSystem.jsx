import React, { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import {
  getWeightedReviewScore,
  getAlbumWeightedAverage,
  getTrackDisplayName,
  EMOTIONS,
  getEmotionForScore,
  getEmotionFromReview,
  getReviewFavoriteTrack,
  isFavoriteTrackMatch,
  getTopRatedTrack,
} from '../utils/ratingUtils';

const CRITERIOS = [
  {
    id: 'produccion',
    label: '🎛️ Producción',
    desc: 'Evalúa la calidad de producción, mezcla y diseño de sonido.',
    max: 5,
  },
  {
    id: 'composicion',
    label: '🎵 Composición',
    desc: 'Evalúa las melodías, armonías, arreglos y estructura musical.',
    max: 5,
  },
  {
    id: 'letras',
    label: '📝 Letras',
    desc: 'Evalúa el contenido lírico, mensajes, poesía y narrativa.',
    max: 5,
  },
  {
    id: 'originalidad',
    label: '💡 Originalidad',
    desc: 'Evalúa la innovación, propuesta única y frescura sonora.',
    max: 5,
  },
  {
    id: 'cohesion',
    label: '🔗 Cohesión',
    desc: 'Evalúa cómo fluyen las canciones juntas como proyecto unificado.',
    max: 5,
  },
  {
    id: 'replay',
    label: '🔄 Replay Value',
    desc: '¿Qué tantas ganas te deja de volver a escucharlo completo?',
    max: 5,
  },
  {
    id: 'general',
    label: '⭐ Calificación General',
    desc: 'Tu valoración global e independiente para el álbum.',
    max: 10,
  },
];

export function ReviewSystem({
  album,
  onReviewSubmitted,
  isFromSpotify = false,
  isIndividual = false,
  tracks = [],
  user: propUser = null,
  showTrackReviews = true,
  onToggleTrackReviews = null,
  initialEditing = false,
  initialReview = null,
  hideOtherReviews = false,
  isModal = false,
  onCancelEdit = null,
}) {
  const auth = useAuth();
  const user = propUser || auth.user;
  const loginWithGoogle = auth.loginWithGoogle;

  const [showReviewForm, setShowReviewForm] = useState(isIndividual);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [ratings, setRatings] = useState({
    produccion: 3,
    composicion: 3,
    letras: 3,
    originalidad: 3,
    cohesion: 3,
    replay: 3,
    general: 5,
  });
  const [trackRatings, setTrackRatings] = useState({});
  const [favoriteTrack, setFavoriteTrack] = useState(null);
  const [selectedFeeling, setSelectedFeeling] = useState(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Wizard state: 'tracks' | 'criteria' | 'summary'
  const [wizardStep, setWizardStep] = useState('tracks');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentCriterionIndex, setCurrentCriterionIndex] = useState(0);

  const shouldShowTracks = isIndividual || showTrackReviews;

  const loadReviews = useCallback(async () => {
    if (
      !album ||
      !album.id ||
      (typeof album.id === 'string' && album.id.startsWith('spotify_'))
    ) {
      setReviews([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await supabaseService.getReviews(album.id);
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
    setLoading(false);
  }, [album]);

  useEffect(() => {
    if (album && album.id) {
      loadReviews();
    }
  }, [album, loadReviews]);

  const draftKey = album?.id ? `musiclub_draft_${album.id}` : null;
  const isDraftRestoredRef = React.useRef(false);

  // Restore draft on mount or when album.id changes
  useEffect(() => {
    if (!draftKey) return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.ratings) setRatings(parsed.ratings);
        if (parsed.trackRatings) setTrackRatings(parsed.trackRatings);
        if (parsed.favoriteTrack !== undefined)
          setFavoriteTrack(parsed.favoriteTrack);
        if (parsed.selectedFeeling) setSelectedFeeling(parsed.selectedFeeling);
        if (parsed.comment !== undefined) setComment(parsed.comment);
        if (parsed.wizardStep && parsed.wizardStep !== 'user') {
          setWizardStep(parsed.wizardStep);
        }
        if (typeof parsed.currentTrackIndex === 'number')
          setCurrentTrackIndex(parsed.currentTrackIndex);
        if (typeof parsed.currentCriterionIndex === 'number')
          setCurrentCriterionIndex(parsed.currentCriterionIndex);
        isDraftRestoredRef.current = true;
      }
    } catch (e) {
      console.warn('Error reading review draft from localStorage', e);
    }
  }, [draftKey, user]);

  useEffect(() => {
    if (user) {
      setUserName(user.name || user.email?.split('@')[0] || '');
      setUserEmail(user.email || '');
    } else {
      setUserName('');
      setUserEmail('');
    }
  }, [user]);

  const effectiveTracks =
    tracks && tracks.length > 0
      ? tracks
      : album?.tracks && Array.isArray(album.tracks)
        ? album.tracks
        : [];

  const getTrackKey = (t, idx) => {
    if (!t) return String(idx);
    if (typeof t === 'string') return t;
    return t.id || t.spotify_id || t.name || String(idx);
  };

  const getTrackName = (t, idx) => {
    if (!t) return `Pista ${idx + 1}`;
    if (typeof t === 'string') return t;
    return t.name || `Pista ${t.track_number || idx + 1}`;
  };

  const getTrackRating = (track, idx, ratingsMap = trackRatings) => {
    if (!track || !ratingsMap) return undefined;

    // 1. Coincidencia directa por key
    const key = getTrackKey(track, idx);
    if (ratingsMap[key] !== undefined) return ratingsMap[key];

    // 2. Si track es objeto: por id, spotify_id, name o nombre sin espacios
    if (typeof track === 'object') {
      if (track.id && ratingsMap[track.id] !== undefined)
        return ratingsMap[track.id];
      if (track.spotify_id && ratingsMap[track.spotify_id] !== undefined)
        return ratingsMap[track.spotify_id];

      if (track.name) {
        if (ratingsMap[track.name] !== undefined) return ratingsMap[track.name];
        const trimmedName = track.name.trim();
        if (ratingsMap[trimmedName] !== undefined)
          return ratingsMap[trimmedName];

        const match = Object.entries(ratingsMap).find(
          ([k]) => k.trim().toLowerCase() === trimmedName.toLowerCase()
        );
        if (match && match[1] !== undefined) return match[1];
      }
    } else if (typeof track === 'string') {
      if (ratingsMap[track] !== undefined) return ratingsMap[track];
      const trimmed = track.trim();
      if (ratingsMap[trimmed] !== undefined) return ratingsMap[trimmed];
      const match = Object.entries(ratingsMap).find(
        ([k]) => k.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (match && match[1] !== undefined) return match[1];
    }

    // 3. Por número de pista o índice
    const trackNum =
      typeof track === 'object' && track.track_number
        ? String(track.track_number)
        : null;
    if (trackNum && ratingsMap[trackNum] !== undefined)
      return ratingsMap[trackNum];
    if (ratingsMap[String(idx + 1)] !== undefined)
      return ratingsMap[String(idx + 1)];
    if (ratingsMap[String(idx)] !== undefined) return ratingsMap[String(idx)];

    return undefined;
  };

  // Ensure default wizard step is valid ('tracks' or 'criteria')
  useEffect(() => {
    if (wizardStep === 'user') {
      setWizardStep(
        shouldShowTracks && effectiveTracks.length > 0 ? 'tracks' : 'criteria'
      );
    }
  }, [wizardStep, shouldShowTracks, effectiveTracks.length]);

  // Auto-save draft changes to localStorage
  useEffect(() => {
    if (!draftKey || isSubmitting) return;
    try {
      const hasChanges =
        Object.keys(trackRatings).length > 0 ||
        comment.trim().length > 0 ||
        currentTrackIndex > 0 ||
        currentCriterionIndex > 0 ||
        ratings.general !== 5 ||
        ratings.produccion !== 3 ||
        ratings.composicion !== 3 ||
        ratings.letras !== 3 ||
        ratings.originalidad !== 3 ||
        ratings.cohesion !== 3 ||
        ratings.replay !== 3;

      if (hasChanges) {
        const draft = {
          ratings,
          trackRatings,
          favoriteTrack,
          selectedFeeling,
          comment,
          wizardStep,
          currentTrackIndex,
          currentCriterionIndex,
          userName,
          userEmail,
          updatedAt: Date.now(),
        };
        localStorage.setItem(draftKey, JSON.stringify(draft));
      }
    } catch (e) {
      console.warn('Error saving review draft to localStorage', e);
    }
  }, [
    draftKey,
    ratings,
    trackRatings,
    favoriteTrack,
    selectedFeeling,
    comment,
    wizardStep,
    currentTrackIndex,
    currentCriterionIndex,
    userName,
    userEmail,
    isSubmitting,
  ]);

  const handleResetDraft = () => {
    if (draftKey) {
      try {
        localStorage.removeItem(draftKey);
      } catch (e) {}
    }
    setRatings({
      produccion: 3,
      composicion: 3,
      letras: 3,
      originalidad: 3,
      cohesion: 3,
      replay: 3,
      general: 5,
    });
    setTrackRatings({});
    setFavoriteTrack(null);
    setSelectedFeeling(null);
    setComment('');
    setCurrentTrackIndex(0);
    setCurrentCriterionIndex(0);
    setWizardStep(
      shouldShowTracks && effectiveTracks.length > 0 ? 'tracks' : 'criteria'
    );
    setError(null);
  };

  const currentUserEmail = (user?.email || userEmail || '')
    .trim()
    .toLowerCase();
  const currentUserName = (user?.name || userName || '').trim().toLowerCase();
  const currentUserAvatar = user?.avatar_url || user?.avatar || null;
  const currentUserId = user?.id || null;

  const foundReviewInList = reviews.find((r) => {
    if (currentUserId && r.user_id && String(r.user_id) === String(currentUserId))
      return true;
    const revEmail = (r.reviewer_email || '').trim().toLowerCase();
    const revName = (r.reviewer_name || '').trim().toLowerCase();
    const revAvatar = r.reviewer_avatar || r.avatar_url || null;
    if (currentUserEmail && revEmail && revEmail === currentUserEmail)
      return true;
    if (currentUserName && revName && revName === currentUserName) return true;
    if (currentUserAvatar && revAvatar && revAvatar === currentUserAvatar)
      return true;
    return false;
  });

  const existingUserReview = foundReviewInList || initialReview || null;
  const hasAlreadyReviewed = !!existingUserReview;

  const handleStartEditing = () => {
    if (!existingUserReview) return;
    setIsEditing(true);
    setShowReviewForm(true);
    setRatings({
      produccion: existingUserReview.rating_produccion ?? 3,
      composicion: existingUserReview.rating_composicion ?? 3,
      letras: existingUserReview.rating_letras ?? 3,
      originalidad: existingUserReview.rating_originalidad ?? 3,
      cohesion: existingUserReview.rating_cohesion ?? 3,
      replay: existingUserReview.rating_replay ?? 3,
      general: existingUserReview.rating_general ?? 5,
    });

    const rawTrackRatings =
      existingUserReview.track_ratings || existingUserReview.trackRatings || {};
    const normalized = {};

    if (effectiveTracks.length > 0) {
      effectiveTracks.forEach((track, idx) => {
        const val = getTrackRating(track, idx, rawTrackRatings);
        const key = getTrackKey(track, idx);
        if (val !== undefined && !isNaN(Number(val))) {
          normalized[key] = Number(val);
        }
      });
    }

    // Conservar llaves originales de rawTrackRatings por si acaso
    Object.entries(rawTrackRatings).forEach(([k, v]) => {
      if (v !== undefined && !isNaN(Number(v)) && normalized[k] === undefined) {
        normalized[k] = Number(v);
      }
    });

    setTrackRatings(normalized);
    const initialFav =
      existingUserReview.favorite_track ||
      existingUserReview.favoriteTrack ||
      getTopRatedTrack(normalized, false) ||
      null;
    setFavoriteTrack(initialFav);
    const emotionFromReview = getEmotionFromReview(existingUserReview);
    setSelectedFeeling(
      existingUserReview.feeling || emotionFromReview?.text || null
    );
    setComment(existingUserReview.comment || '');
    setCurrentTrackIndex(0);
    setCurrentCriterionIndex(0);
    setWizardStep(
      shouldShowTracks && effectiveTracks.length > 0 ? 'tracks' : 'criteria'
    );
    setError(null);
  };

  // Auto-activar modo edición si viene initialEditing=true
  const hasAutoStartedRef = React.useRef(false);
  useEffect(() => {
    if (initialEditing && existingUserReview && !isEditing && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      handleStartEditing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEditing, existingUserReview, isEditing]);

  const handleCancelEditing = () => {
    setIsEditing(false);
    setError(null);
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  const handleSubmitReview = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    if (hasAlreadyReviewed && !isEditing) {
      setError('Ya has enviado una reseña para este álbum previamente.');
      setIsSubmitting(false);
      return;
    }

    const missingCriterios = CRITERIOS.filter((c) => !ratings[c.id]);
    if (missingCriterios.length > 0) {
      setError(`Por favor califica todos los criterios`);
      setIsSubmitting(false);
      return;
    }

    if (shouldShowTracks && effectiveTracks.length > 0) {
      const missingTracks = effectiveTracks.filter(
        (track, idx) => getTrackRating(track, idx) === undefined
      );
      if (missingTracks.length > 0) {
        setError(
          `Por favor califica todas las canciones (faltan ${missingTracks.length})`
        );
        setIsSubmitting(false);
        return;
      }
    }

    if (!user || !user.email) {
      setError('Debes iniciar sesión con Google para poder enviar una reseña.');
      setIsSubmitting(false);
      return;
    }

    const finalReviewerName = (
      user.name ||
      user.email.split('@')[0] ||
      'Miembro Musiclub'
    ).trim();
    const finalReviewerEmail = user.email.trim();

    const finalTrackRatings = {};
    if (effectiveTracks.length > 0) {
      effectiveTracks.forEach((track, idx) => {
        const score = getTrackRating(track, idx);
        if (score !== undefined) {
          const key = getTrackKey(track, idx);
          finalTrackRatings[key] = Number(score);
        }
      });
    } else {
      Object.assign(finalTrackRatings, trackRatings);
    }

    // Calcular sentimiento predeterminado si el usuario no eligió uno explícito
    const currentScore = getWeightedReviewScore({
      track_ratings: finalTrackRatings,
      rating_produccion: ratings.produccion,
      rating_composicion: ratings.composicion,
      rating_letras: ratings.letras,
      rating_originalidad: ratings.originalidad,
      rating_cohesion: ratings.cohesion,
      rating_replay: ratings.replay,
      rating_general: ratings.general,
    });
    const defaultEmotion = getEmotionForScore(currentScore);
    const finalFeeling =
      selectedFeeling || defaultEmotion?.text || 'Relajado / Conectado';

    // Determinar canción favorita: manual o por máxima nota (desempate aleatorio si hay empate)
    const finalFavoriteTrack =
      favoriteTrack || getTopRatedTrack(finalTrackRatings, true) || null;

    const reviewData = {
      albumId: album.id,
      reviewerName: finalReviewerName,
      reviewerEmail: finalReviewerEmail,
      reviewerAvatar:
        currentUserAvatar ||
        user?.avatar_url ||
        user?.avatar ||
        existingUserReview?.reviewer_avatar ||
        null,
      trackRatings: finalTrackRatings,
      ratingProduccion: ratings.produccion,
      ratingComposicion: ratings.composicion,
      ratingLetras: ratings.letras,
      ratingOriginalidad: ratings.originalidad,
      ratingCohesion: ratings.cohesion,
      ratingReplay: ratings.replay,
      ratingGeneral: ratings.general,
      feeling: finalFeeling,
      favoriteTrack: finalFavoriteTrack,
      comment: comment.trim(),
    };

    try {
      let targetAlbumId = album.id;

      // Auto-creación On-Demand en Supabase si el álbum viene de Spotify o aún no existe en BD
      if (
        isFromSpotify ||
        album.is_on_demand ||
        (typeof album.id === 'string' && album.id.startsWith('spotify_')) ||
        !album.id
      ) {
        try {
          const allAlbums = await supabaseService.getAllAlbums();
          const targetName = (
            album.album_name ||
            album.album ||
            album.name ||
            ''
          )
            .toLowerCase()
            .trim();
          const targetArtist = (
            album.artist_name ||
            album.artist ||
            album.artista ||
            ''
          )
            .toLowerCase()
            .trim();

          const existing = (allAlbums || []).find((a) => {
            const aName = (a.album_name || a.album || '').toLowerCase().trim();
            const aArtist = (
              a.artist_name ||
              a.artist ||
              a.artista ||
              ''
            )
              .toLowerCase()
              .trim();
            return aName === targetName && aArtist === targetArtist;
          });

          if (existing && existing.id) {
            targetAlbumId = existing.id;
          } else {
            const trackList = (album.tracks || []).map((t) =>
              typeof t === 'string' ? t : t.name || String(t)
            );
            const newAlbum = await supabaseService.createAlbumWithTracks({
              albumName: album.album_name || album.album || album.name,
              artistName: album.artist_name || album.artist || album.artista,
              imageUrl:
                album.image_url ||
                album.imagen ||
                album.image ||
                album.cover_image,
              spotifyLink:
                album.spotify_link ||
                album.spotifyUrl ||
                (album.spotify_id
                  ? `https://open.spotify.com/album/${album.spotify_id}`
                  : null),
              tracks: trackList,
              releaseDate: album.release_date || album.releaseDate || null,
              releaseYear: album.release_year || album.releaseYear || null,
              status: 'INDIVIDUAL',
              addedBy: finalReviewerName,
              addedByEmail: finalReviewerEmail,
              reviews_enabled: true,
            });
            targetAlbumId = newAlbum.id;
          }
        } catch (createErr) {
          console.error(
            'Error al registrar álbum on-demand en Supabase:',
            createErr
          );
          throw new Error(
            `No se pudo registrar el álbum en la base de datos: ${createErr.message}`
          );
        }
      }

      reviewData.albumId = targetAlbumId;

      if (isEditing && existingUserReview?.id) {
        await supabaseService.updateReview(existingUserReview.id, reviewData);
      } else {
        await supabaseService.submitReview(reviewData);
      }

      // Clear draft on successful submission
      if (draftKey) {
        try {
          localStorage.removeItem(draftKey);
        } catch (e) {}
      }

      setSuccess(true);
      setIsEditing(false);

      if (!isIndividual && !isEditing) {
        if (!user) {
          setUserName('');
          setUserEmail('');
        }
        setShowReviewForm(false);
        if (onToggleTrackReviews) {
          onToggleTrackReviews();
        }
      }

      await loadReviews();
      if (onReviewSubmitted) onReviewSubmitted();
      setTimeout(() => setSuccess(false), 3500);
    } catch (error) {
      setError(error.message || 'Error al guardar la review');
    }
    setIsSubmitting(false);
  };

  const handleRatingChange = (criterioId, value) => {
    setRatings((prev) => ({
      ...prev,
      [criterioId]: parseInt(value, 10),
    }));
  };

  const handleTrackRatingChange = (trackId, value) => {
    setTrackRatings((prev) => ({
      ...prev,
      [trackId]: parseInt(value, 10),
    }));
  };

  const average = getAlbumWeightedAverage(reviews);
  const areAllTracksRated = shouldShowTracks
    ? effectiveTracks.length > 0 &&
      effectiveTracks.every(
        (track, idx) => getTrackRating(track, idx) !== undefined
      )
    : true;
  const trackProgress = shouldShowTracks
    ? effectiveTracks.filter(
        (track, idx) => getTrackRating(track, idx) !== undefined
      ).length
    : 0;

  const safeTrackIndex = Math.min(
    Math.max(0, currentTrackIndex),
    Math.max(0, effectiveTracks.length - 1)
  );
  const currentTrack = effectiveTracks[safeTrackIndex] || null;

  const safeCriterionIndex = Math.min(
    Math.max(0, currentCriterionIndex),
    CRITERIOS.length - 1
  );
  const currentCriterion = CRITERIOS[safeCriterionIndex] || CRITERIOS[0];

  const formatDuration = (ms) => {
    if (!ms) return null;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const getRatingBadgeColor = (val, max = 10) => {
    const norm = (val / max) * 10;
    if (norm >= 8.5)
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (norm >= 7) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (norm >= 5)
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  if (!album) return null;

  return (
    <div className={isModal ? 'space-y-4' : 'space-y-6'}>
      {/* ======================================================== */}
      {/* SECCIÓN 1: MI REVIEW (CALIFICAR / VER / EDITAR)         */}
      {/* ======================================================== */}
      <div>
        {hasAlreadyReviewed && !isEditing ? (
          /* TU REVIEW REGISTRADA (Con botón Editar) */
          <div
            className={`rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 border shadow-2xl relative overflow-hidden transition-all duration-500 ${
              isIndividual
                ? 'bg-gradient-to-br from-[#0b172a] via-[#0d1d36] to-[#081120] border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.15)]'
                : 'bg-gradient-to-br from-[#0e1b2b] to-[#09111c] border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.12)]'
            }`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 mb-5 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(16,185,129,0.3)] flex-shrink-0">
                  ✓
                </div>
                <div>
                  <h5 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                    <span>Tu Review Registrada</span>
                  </h5>
                  <p className="text-emerald-400/80 text-xs mt-2">
                    Ya calificaste este álbum. Puedes editar tu review en
                    cualquier momento.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartEditing}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 hover:text-white border border-cyan-400/30 hover:border-cyan-400/60 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.15)] active:scale-95 flex-shrink-0"
              >
                <span>✏️</span> Editar Mi Review
              </button>
            </div>

            <div className="space-y-4 sm:space-y-5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/40 p-4 sm:p-5 rounded-2xl border border-white/10">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-3.5 min-w-0 text-center sm:text-left w-full sm:w-auto">
                  {existingUserReview?.reviewer_avatar ||
                  user?.user_metadata?.avatar_url ||
                  user?.avatar_url ? (
                    <img
                      src={
                        existingUserReview?.reviewer_avatar ||
                        user?.user_metadata?.avatar_url ||
                        user?.avatar_url
                      }
                      alt={
                        existingUserReview?.reviewer_name ||
                        user?.name ||
                        'Reviewer'
                      }
                      className="w-16 h-16 sm:w-11 sm:h-11 rounded-full object-cover border border-emerald-500/40 flex-shrink-0 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-11 sm:h-11 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-sm sm:text-xs text-center flex-shrink-0 px-1 shadow-md">
                      {(existingUserReview?.reviewer_name ||
                        user?.name ||
                        'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex flex-col items-center sm:items-start">
                    <div className="text-white font-bold text-sm sm:text-base truncate max-w-full">
                      {existingUserReview?.reviewer_name ||
                        user?.name ||
                        'Tu Usuario'}
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mt-0.5">
                      <span className="text-white/40 text-xs">
                        {existingUserReview?.created_at
                          ? new Date(
                              existingUserReview.created_at
                            ).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : 'Evaluado'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center sm:justify-end gap-3 self-stretch sm:self-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
                  {(() => {
                    const emotionObj = getEmotionFromReview(existingUserReview);
                    return emotionObj ? (
                      <span
                        className={`text-[11px] px-2.5 py-1 rounded-full border font-bold flex items-center gap-1.5 shadow-sm ${emotionObj.badgeClass}`}
                        title={emotionObj.description}
                      >
                        <span className="text-xl">{emotionObj.emoji}</span>
                        <span className="hidden sm:inline">
                          {emotionObj.label}
                        </span>
                      </span>
                    ) : null;
                  })()}
                  <div className="text-2xl sm:text-3xl font-black text-emerald-300 flex items-center gap-1.5">
                    ★{' '}
                    {getWeightedReviewScore(existingUserReview)?.toFixed(2) ??
                      existingUserReview.rating_general ??
                      '10'}
                  </div>
                </div>
              </div>

              {existingUserReview.comment && (
                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                  <div className="text-white/40 text-xs mb-1.5 font-semibold uppercase tracking-wider">
                    Tu Comentario:
                  </div>
                  <p className="text-white/90 text-sm italic leading-relaxed">
                    "{existingUserReview.comment}"
                  </p>
                </div>
              )}

              {/* Desglose de Criterios */}
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
                {[
                  { key: 'rating_produccion', label: '🎛️ Producción', max: 5 },
                  {
                    key: 'rating_composicion',
                    label: '🎵 Composición',
                    max: 5,
                  },
                  { key: 'rating_letras', label: '📝 Letras', max: 5 },
                  {
                    key: 'rating_originalidad',
                    label: '💡 Originalidad',
                    max: 5,
                  },
                  { key: 'rating_cohesion', label: '🔗 Cohesión', max: 5 },
                  { key: 'rating_replay', label: '🔄 Replay', max: 5 },
                  {
                    key: 'rating_general',
                    label: '⭐ General',
                    max: 10,
                    fullWidth: true,
                  },
                ].map(({ key, label, max, fullWidth }) => {
                  const val = existingUserReview[key];
                  if (val === undefined || val === null) return null;
                  return (
                    <div
                      key={key}
                      className={`bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-between ${
                        fullWidth
                          ? 'xs:col-span-2 sm:col-span-3 md:col-span-4 bg-emerald-500/10 border-emerald-500/20'
                          : ''
                      }`}
                    >
                      <span className="text-xs text-white/70">{label}</span>
                      <span
                        className={`font-bold font-mono text-sm px-2 py-0.5 rounded-lg border ${getRatingBadgeColor(val, max)}`}
                      >
                        {val}/{max}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Canción Favorita */}
              {(() => {
                const favTrack = getReviewFavoriteTrack(existingUserReview);
                if (!favTrack) return null;
                const favName = getTrackDisplayName(
                  favTrack,
                  effectiveTracks.length > 0 ? effectiveTracks : album?.tracks
                );
                return (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border border-amber-400/40 p-3 rounded-xl text-amber-200 font-medium">
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-base">⭐</span>
                      <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                        Canción Favorita:
                      </span>
                    </div>
                    <span
                      className="font-bold text-amber-200 text-sm pl-6 sm:pl-0 truncate"
                      title={favName}
                    >
                      {favName}
                    </span>
                  </div>
                );
              })()}

              {/* Canciones Calificadas */}
              {existingUserReview.track_ratings &&
                Object.keys(existingUserReview.track_ratings).length > 0 && (
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2.5">
                    <div className="text-white/40 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <span>🎵</span> Canciones Calificadas:
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                      {Object.entries(existingUserReview.track_ratings).map(
                        ([tId, rating], idx) => {
                          const trackName = getTrackDisplayName(
                            tId,
                            effectiveTracks.length > 0
                              ? effectiveTracks
                              : album?.tracks
                          );
                          const isFav = isFavoriteTrackMatch(
                            tId,
                            getReviewFavoriteTrack(existingUserReview),
                            effectiveTracks.length > 0
                              ? effectiveTracks
                              : album?.tracks,
                            idx
                          );
                          return (
                            <span
                              key={tId}
                              className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all ${
                                isFav
                                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-200 font-bold shadow-[0_0_12px_rgba(251,191,36,0.2)]'
                                  : 'bg-black/50 border-white/10 text-white/80'
                              }`}
                            >
                              <span>{isFav ? '⭐' : '🎵'}</span>
                              <span
                                className="max-w-[160px] truncate"
                                title={trackName}
                              >
                                {trackName}
                              </span>
                              <span
                                className={`font-bold font-mono ml-1 ${isFav ? 'text-amber-300' : 'text-emerald-300'}`}
                              >
                                ★ {rating}
                              </span>
                              {isFav && (
                                <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                  Fav
                                </span>
                              )}
                            </span>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        ) : showReviewForm || isIndividual || isEditing ? (
          <div
            className={
              isModal
                ? 'relative overflow-hidden'
                : `rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-7 border shadow-2xl relative overflow-hidden transition-all duration-500 ${
                    isEditing
                      ? 'bg-gradient-to-br from-[#16120b] via-[#1a150e] to-[#0d0a07] border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.18)]'
                      : isIndividual
                        ? 'bg-gradient-to-br from-[#0b1324] via-[#0e1a30] to-[#070d1a] border-blue-500/40 shadow-[0_0_50px_rgba(59,130,246,0.18)]'
                        : 'bg-gradient-to-br from-[#121225] to-[#0a0a14] border-[#f5576c]/30 shadow-2xl'
                  }`
            }
          >
            {/* Luces traseras decorativas para Individual o Edición si no es modal */}
            {!isModal && (isIndividual || isEditing) && (
              <>
                <div
                  className={`absolute -top-24 -right-24 w-60 h-60 ${isEditing ? 'bg-amber-500/15' : 'bg-blue-500/15'} rounded-full blur-3xl pointer-events-none`}
                ></div>
                <div
                  className={`absolute -bottom-24 -left-24 w-60 h-60 ${isEditing ? 'bg-orange-500/10' : 'bg-cyan-500/10'} rounded-full blur-3xl pointer-events-none`}
                ></div>
              </>
            )}

            {/* Header del Formulario (oculto en modal ya que el modal provee su propio header) */}
            {!isModal && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 pb-4 border-b border-white/10 relative z-10 gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h5 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                    <span
                      className={
                        isEditing
                          ? 'text-amber-400'
                          : isIndividual
                            ? 'text-blue-400'
                            : 'text-[#f5576c]'
                      }
                    >
                      {isEditing ? '✏️' : isIndividual ? '📌' : '✍️'}
                    </span>
                    {isEditing ? (
                      <span className="bg-gradient-to-r from-amber-300 via-orange-200 to-white bg-clip-text text-transparent font-bold">
                        Editar Mi Review
                      </span>
                    ) : isIndividual ? (
                      <span className="bg-gradient-to-r from-blue-300 via-cyan-200 to-white bg-clip-text text-transparent font-bold">
                        Review de Álbum Individual
                      </span>
                    ) : isFromSpotify ? (
                      <>Nueva Review · Álbum de Spotify</>
                    ) : (
                      <>Nueva Review · Álbum del Club</>
                    )}
                  </h5>
                  {isEditing ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-mono">
                      <span>✏️</span> Modo Edición
                    </span>
                  ) : (
                    <span className="hidden xs:inline-flex items-center gap-1 text-[10px] text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono">
                      <span>💾</span> Autoguardado
                    </span>
                  )}
                </div>
                {isEditing ? (
                  <button
                    type="button"
                    onClick={handleCancelEditing}
                    className="text-white/60 hover:text-white text-xs sm:text-sm bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 transition-all font-medium flex-shrink-0"
                  >
                    Cancelar Edición
                  </button>
                ) : !isIndividual ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewForm(false);
                      if (onToggleTrackReviews) {
                        onToggleTrackReviews();
                      }
                    }}
                    className="text-white/40 hover:text-white text-sm bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0"
                    title="Cerrar"
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            )}

            {!user ? (
              <div className="py-8 sm:py-10 px-4 text-center space-y-4 sm:space-y-5 relative z-10">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-[#f5576c]/20 to-[#f093fb]/20 border border-[#f5576c]/30 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(245,87,108,0.25)]">
                  ⭐
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h4 className="text-xl sm:text-2xl font-black text-white">
                    Inicia Sesión con Google para Calificar
                  </h4>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    Para calificar este álbum, ganar XP y registrar tu
                    puntuación en tu perfil de Musiclub, es obligatorio iniciar
                    sesión con tu cuenta de Google.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={loginWithGoogle}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-white text-black font-extrabold text-sm rounded-2xl shadow-xl hover:bg-slate-100 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Iniciar Sesión con Google</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Banner de Usuario Autenticado con Google (oculto si es modal) */}
                {!isModal && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-3 sm:px-4 sm:py-3.5 mb-5 text-xs relative z-10 gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1 w-full sm:w-auto">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name || 'Usuario'}
                          className="w-9 h-9 rounded-full object-cover border border-[#f5576c]/40 flex-shrink-0"
                          onError={(e) => {
                            e.target.src =
                              'https://via.placeholder.com/100/1a1a2e/ffffff?text=👤';
                          }}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#f5576c] to-[#f093fb] text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                          {(
                            (user.name || user.email || 'U')[0] || 'U'
                          ).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-white font-bold truncate text-xs sm:text-sm"
                          title={user.name || user.email?.split('@')[0]}
                        >
                          {user.name || user.email?.split('@')[0]}
                        </div>
                        <div
                          className="text-white/40 text-[10px] sm:text-[11px] truncate"
                          title={user.email}
                        >
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nav Tab Bar del Wizard */}
                <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-1.5 sm:gap-2 mb-5 sm:mb-6 bg-black/50 p-1.5 sm:p-2 rounded-2xl border border-white/10 relative z-10">
                  {shouldShowTracks && effectiveTracks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setWizardStep('tracks')}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 text-center ${
                        wizardStep === 'tracks'
                          ? isIndividual
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md'
                          : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                      }`}
                    >
                      <span>🎵</span>
                      <span>
                        1. Canciones ({trackProgress}/{effectiveTracks.length})
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setWizardStep('criteria')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 text-center ${
                      wizardStep === 'criteria'
                        ? isIndividual
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md'
                        : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <span>📊</span>
                    <span>
                      {shouldShowTracks && effectiveTracks.length > 0
                        ? '2. Criterios'
                        : '1. Criterios'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWizardStep('summary')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 text-center ${
                      wizardStep === 'summary'
                        ? isIndividual
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md'
                        : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <span>📝</span>
                    <span>
                      {shouldShowTracks && effectiveTracks.length > 0
                        ? '3. Resumen'
                        : '2. Resumen'}
                    </span>
                  </button>
                </div>

                {/* ======================================================== */}
                {/* STEP 2: CANCIONES (STRATEGY BACK / NEXT) */}
                {/* ======================================================== */}
                {wizardStep === 'tracks' &&
                  shouldShowTracks &&
                  effectiveTracks.length > 0 &&
                  currentTrack && (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Progress Bar de Canciones */}
                      <div>
                        <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-1 text-xs text-white/60 mb-2 font-medium">
                          <span className="flex items-center gap-1.5 text-white font-semibold">
                            <span className="text-[#f5576c]">🎵</span> Canción{' '}
                            {currentTrackIndex + 1} de {effectiveTracks.length}
                          </span>
                          <span className="text-[#f093fb] font-mono">
                            {trackProgress} / {effectiveTracks.length}{' '}
                            calificadas
                          </span>
                        </div>
                        <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#f5576c] to-[#f093fb] h-full transition-all duration-300"
                            style={{
                              width: `${((currentTrackIndex + 1) / effectiveTracks.length) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Strip selector de canciones (Pills/Drawer rápido) */}
                      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1.5 px-0.5 custom-scrollbar">
                        {effectiveTracks.map((t, idx) => {
                          const isRated = getTrackRating(t, idx) !== undefined;
                          const isActive = idx === currentTrackIndex;
                          const isFav =
                            isFavoriteTrackMatch(
                              t,
                              favoriteTrack,
                              effectiveTracks,
                              idx
                            ) || favoriteTrack === getTrackKey(t, idx);
                          return (
                            <button
                              key={getTrackKey(t, idx)}
                              type="button"
                              onClick={() => setCurrentTrackIndex(idx)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1 flex-shrink-0 border ${
                                isActive
                                  ? 'bg-[#f5576c] text-white border-[#f5576c] shadow-lg shadow-[#f5576c]/30 ring-2 ring-[#f5576c]/50 font-bold'
                                  : isFav
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 font-semibold'
                                    : isRated
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                      : 'bg-black/30 text-white/40 border-white/10 hover:bg-white/10'
                              }`}
                              title={getTrackName(t, idx)}
                            >
                              <span>#{t.track_number || idx + 1}</span>
                              {isFav ? (
                                <span className="text-[10px]">⭐</span>
                              ) : (
                                isRated && (
                                  <span className="text-[10px]">✓</span>
                                )
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* CARD DE CANCIÓN ACTUAL */}
                      <div className="bg-gradient-to-b from-white/10 to-black/40 rounded-2xl p-4 sm:p-6 border border-white/10 shadow-xl relative space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5 pb-3.5 border-b border-white/10 w-full min-w-0">
                          <div className="flex-1 min-w-0 w-full">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white/40 text-xs font-mono bg-white/10 px-2.5 py-0.5 rounded-md">
                                Pista #
                                {currentTrack.track_number ||
                                  currentTrackIndex + 1}
                              </span>
                              {formatDuration(currentTrack.duration_ms) && (
                                <span className="text-white/30 text-xs font-mono">
                                  ⏱️ {formatDuration(currentTrack.duration_ms)}
                                </span>
                              )}
                            </div>
                            <h4 className="text-white text-base sm:text-xl font-bold tracking-tight mt-1.5 break-words whitespace-normal leading-snug w-full">
                              {getTrackName(currentTrack, currentTrackIndex)}
                            </h4>
                          </div>

                          {/* Acciones y Calificación de la Pista */}
                          <div className="flex items-center justify-between md:justify-end gap-2.5 w-full md:w-auto flex-wrap pt-1 md:pt-0">
                            {/* Botón Favorita ⭐ */}
                            {(() => {
                              const trackKey = getTrackKey(
                                currentTrack,
                                currentTrackIndex
                              );
                              const isFav =
                                isFavoriteTrackMatch(
                                  currentTrack,
                                  favoriteTrack,
                                  effectiveTracks,
                                  currentTrackIndex
                                ) || favoriteTrack === trackKey;
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFavoriteTrack(isFav ? null : trackKey);
                                  }}
                                  className={`px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2 transition-all active:scale-95 ${
                                    isFav
                                      ? 'bg-amber-500/30 text-amber-300 border-amber-400 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/50'
                                      : 'bg-black/40 text-white/60 border-white/10 hover:text-amber-300 hover:border-amber-400/30'
                                  }`}
                                  title={
                                    isFav
                                      ? 'Marcada como tu canción favorita'
                                      : 'Marcar como tu canción favorita'
                                  }
                                >
                                  <span>⭐</span>
                                  <span>
                                    {isFav ? 'Canción Favorita' : 'Favorita'}
                                  </span>
                                </button>
                              );
                            })()}

                            {/* Valor de la Calificación con Badge Dinámico */}
                            <div
                              className={`px-3.5 py-2 rounded-xl border text-sm font-bold flex items-center gap-1.5 ${getRatingBadgeColor(
                                getTrackRating(
                                  currentTrack,
                                  currentTrackIndex
                                ) !== undefined
                                  ? getTrackRating(
                                      currentTrack,
                                      currentTrackIndex
                                    )
                                  : 5,
                                10
                              )}`}
                            >
                              <span className="text-xs">★</span>
                              <span className="text-base font-mono">
                                {getTrackRating(
                                  currentTrack,
                                  currentTrackIndex
                                ) !== undefined
                                  ? getTrackRating(
                                      currentTrack,
                                      currentTrackIndex
                                    )
                                  : 5}
                              </span>
                              <span className="text-[10px] opacity-60">
                                / 10
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Selección Rápida de Puntajes (Pills 1-10) */}
                        <div>
                          <label className="text-white/50 text-xs uppercase tracking-wider block mb-2.5 font-semibold">
                            Calificación rápida (Haz clic en un número):
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-1.5 sm:gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                              const isSelected =
                                getTrackRating(
                                  currentTrack,
                                  currentTrackIndex
                                ) === score;
                              const trackKey = getTrackKey(
                                currentTrack,
                                currentTrackIndex
                              );
                              return (
                                <button
                                  key={score}
                                  type="button"
                                  onClick={() =>
                                    handleTrackRatingChange(trackKey, score)
                                  }
                                  className={`py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold font-mono transition-all border ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white border-transparent scale-105 shadow-md shadow-[#f5576c]/40'
                                      : 'bg-black/30 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                                  }`}
                                >
                                  {score}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Slider Ajuste Fino */}
                        {(() => {
                          const currentScore =
                            getTrackRating(currentTrack, currentTrackIndex) !==
                            undefined
                              ? getTrackRating(currentTrack, currentTrackIndex)
                              : 5;
                          const trackKey = getTrackKey(
                            currentTrack,
                            currentTrackIndex
                          );
                          return (
                            <div className="space-y-1.5 pt-2">
                              <div className="hidden sm:flex justify-between items-center text-xs text-white/40 font-mono">
                                <span>1 (Mala)</span>
                                <span>Ajuste con deslizador</span>
                                <span>10 (Obra de arte)</span>
                              </div>
                              <input
                                type="range"
                                min="1"
                                max="10"
                                step="1"
                                value={currentScore}
                                onChange={(e) =>
                                  handleTrackRatingChange(
                                    trackKey,
                                    e.target.value
                                  )
                                }
                                className="w-full accent-[#f5576c] h-2.5 bg-white/10 rounded-lg cursor-pointer"
                                style={{
                                  background: `linear-gradient(to right, #f5576c 0%, #f5576c ${
                                    ((currentScore - 1) / 9) * 100
                                  }%, rgba(255,255,255,0.1) ${
                                    ((currentScore - 1) / 9) * 100
                                  }%, rgba(255,255,255,0.1) 100%)`,
                                }}
                              />
                            </div>
                          );
                        })()}
                      </div>

                      {/* Botones de Navegación BACK / NEXT para CANCIONES */}
                      <div className="flex flex-col-reverse xs:flex-row justify-between items-stretch xs:items-center gap-3 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (currentTrackIndex > 0) {
                              setCurrentTrackIndex((prev) => prev - 1);
                            }
                          }}
                          disabled={currentTrackIndex === 0}
                          className={`w-full xs:w-auto px-5 py-3 bg-white/10 border border-white/10 text-white/80 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                            currentTrackIndex === 0
                              ? 'opacity-30 cursor-not-allowed'
                              : 'hover:bg-white/20 active:scale-95'
                          }`}
                        >
                          ⬅️ Anterior
                        </button>

                        <div className="text-white/40 text-xs font-mono text-center">
                          {currentTrackIndex + 1} de {effectiveTracks.length}
                        </div>

                        {currentTrackIndex < effectiveTracks.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              const trackKey = getTrackKey(
                                currentTrack,
                                currentTrackIndex
                              );
                              if (
                                getTrackRating(
                                  currentTrack,
                                  currentTrackIndex
                                ) === undefined
                              ) {
                                handleTrackRatingChange(trackKey, 5);
                              }
                              setCurrentTrackIndex((prev) => prev + 1);
                            }}
                            className="w-full xs:w-auto px-6 py-3 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white rounded-xl text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            Siguiente ➡️
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const trackKey = getTrackKey(
                                currentTrack,
                                currentTrackIndex
                              );
                              if (
                                getTrackRating(
                                  currentTrack,
                                  currentTrackIndex
                                ) === undefined
                              ) {
                                handleTrackRatingChange(trackKey, 5);
                              }
                              setWizardStep('criteria');
                            }}
                            className="w-full xs:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-xl text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            Ir a Criterios 📊 ➔
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                {/* ======================================================== */}
                {/* STEP 3: CRITERIOS (1 POR 1) */}
                {/* ======================================================== */}
                {wizardStep === 'criteria' && (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Progress Bar de Criterios */}
                    <div>
                      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-1 text-xs text-white/60 mb-2 font-medium">
                        <span className="flex items-center gap-1.5 text-white font-semibold">
                          <span className="text-[#f5576c]">📊</span> Criterio{' '}
                          {currentCriterionIndex + 1} de {CRITERIOS.length}
                        </span>
                        <span className="text-[#f093fb] font-mono">
                          {currentCriterionIndex + 1} / {CRITERIOS.length}
                        </span>
                      </div>
                      <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#f5576c] to-[#f093fb] h-full transition-all duration-300"
                          style={{
                            width: `${((currentCriterionIndex + 1) / CRITERIOS.length) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Strip selector de criterios */}
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1.5 px-0.5 custom-scrollbar">
                      {CRITERIOS.map((c, idx) => {
                        const isActive = idx === currentCriterionIndex;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setCurrentCriterionIndex(idx)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 flex-shrink-0 border ${
                              isActive
                                ? 'bg-[#f5576c] text-white border-[#f5576c] shadow-lg shadow-[#f5576c]/30 ring-2 ring-[#f5576c]/50 font-bold'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            <span>{c.label.split(' ')[0]}</span>
                            <span className="text-[10px] opacity-70">
                              ({ratings[c.id] || (c.max === 10 ? 5 : 3)}/{c.max}
                              )
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* CARD DEL CRITERIO ACTUAL */}
                    <div className="bg-gradient-to-b from-white/10 to-black/40 rounded-2xl p-4 sm:p-6 border border-white/10 shadow-xl relative space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3.5 border-b border-white/10">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white/40 text-xs font-mono bg-white/10 px-2.5 py-0.5 rounded-md">
                              Criterio {currentCriterionIndex + 1} /{' '}
                              {CRITERIOS.length}
                            </span>
                            <span className="text-white/30 text-xs font-mono">
                              Escala 1 a {currentCriterion.max}
                            </span>
                          </div>
                          <h4 className="text-white text-base sm:text-xl font-bold tracking-tight mt-1.5">
                            {currentCriterion.label}
                          </h4>
                          <p className="text-white/60 text-xs sm:text-sm mt-1 leading-relaxed">
                            {currentCriterion.desc}
                          </p>
                        </div>

                        {/* Valor del Criterio con Badge Dinámico */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto flex-shrink-0 pt-1 sm:pt-0">
                          <div
                            className={`px-3.5 py-2 rounded-xl border text-sm font-bold flex items-center gap-1.5 ${getRatingBadgeColor(
                              ratings[currentCriterion.id] ||
                                (currentCriterion.max === 10 ? 5 : 3),
                              currentCriterion.max
                            )}`}
                          >
                            <span className="text-xs">⭐</span>
                            <span className="text-base font-mono">
                              {ratings[currentCriterion.id] ||
                                (currentCriterion.max === 10 ? 5 : 3)}
                            </span>
                            <span className="text-[10px] opacity-60">
                              / {currentCriterion.max}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Selección Rápida de Puntajes del Criterio */}
                      <div>
                        <label className="text-white/50 text-xs uppercase tracking-wider block mb-2.5 font-semibold">
                          Selecciona tu puntaje (1 - {currentCriterion.max}):
                        </label>
                        <div
                          className={`grid gap-2 ${
                            currentCriterion.max === 10
                              ? 'grid-cols-5 sm:grid-cols-10'
                              : 'grid-cols-5'
                          }`}
                        >
                          {Array.from(
                            { length: currentCriterion.max },
                            (_, i) => i + 1
                          ).map((score) => {
                            const isSelected =
                              ratings[currentCriterion.id] === score;
                            return (
                              <button
                                key={score}
                                type="button"
                                onClick={() =>
                                  handleRatingChange(currentCriterion.id, score)
                                }
                                className={`py-2.5 sm:py-3.5 rounded-xl text-xs sm:text-base font-bold font-mono transition-all border ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white border-transparent scale-105 shadow-md shadow-[#f5576c]/40'
                                    : 'bg-black/30 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                {score}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Slider Ajuste Fino para Criterio */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between items-center text-xs text-white/40 font-mono">
                          <span>1</span>
                          <span>Ajuste con deslizador</span>
                          <span>{currentCriterion.max}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max={currentCriterion.max}
                          step="1"
                          value={
                            ratings[currentCriterion.id] ||
                            (currentCriterion.max === 10 ? 5 : 3)
                          }
                          onChange={(e) =>
                            handleRatingChange(
                              currentCriterion.id,
                              e.target.value
                            )
                          }
                          className="w-full accent-[#f5576c] h-2.5 bg-white/10 rounded-lg cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #f5576c 0%, #f5576c ${
                              (((ratings[currentCriterion.id] ||
                                (currentCriterion.max === 10 ? 5 : 3)) -
                                1) /
                                (currentCriterion.max - 1)) *
                              100
                            }%, rgba(255,255,255,0.1) ${
                              (((ratings[currentCriterion.id] ||
                                (currentCriterion.max === 10 ? 5 : 3)) -
                                1) /
                                (currentCriterion.max - 1)) *
                              100
                            }%, rgba(255,255,255,0.1) 100%)`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Botones de Navegación BACK / NEXT para CRITERIOS */}
                    <div className="flex flex-col-reverse xs:flex-row justify-between items-stretch xs:items-center gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (currentCriterionIndex > 0) {
                            setCurrentCriterionIndex((prev) => prev - 1);
                          } else if (
                            shouldShowTracks &&
                            effectiveTracks.length > 0
                          ) {
                            setWizardStep('tracks');
                            setCurrentTrackIndex(effectiveTracks.length - 1);
                          }
                        }}
                        disabled={
                          currentCriterionIndex === 0 &&
                          (!shouldShowTracks || effectiveTracks.length === 0)
                        }
                        className={`w-full xs:w-auto px-5 py-3 bg-white/10 border border-white/10 text-white/80 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                          currentCriterionIndex === 0 &&
                          (!shouldShowTracks || effectiveTracks.length === 0)
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:bg-white/20 active:scale-95'
                        }`}
                      >
                        ⬅️ Anterior
                      </button>

                      <div className="text-white/40 text-xs font-mono text-center">
                        Criterio {currentCriterionIndex + 1} de{' '}
                        {CRITERIOS.length}
                      </div>

                      {currentCriterionIndex < CRITERIOS.length - 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentCriterionIndex((prev) => prev + 1)
                          }
                          className="w-full xs:w-auto px-6 py-3 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white rounded-xl text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          Siguiente ➡️
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setWizardStep('summary')}
                          className="w-full xs:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-xl text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          Ver Resumen 📝 ➔
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ======================================================== */}
                {/* STEP 4: RESUMEN Y ENVÍO */}
                {/* ======================================================== */}
                {wizardStep === 'summary' && (
                  <div className="space-y-4 sm:space-y-5 animate-fadeIn">
                    <div className="bg-white/5 rounded-2xl p-4 sm:p-6 border border-white/10 space-y-4 sm:space-y-5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
                        <h6 className="text-white text-base sm:text-lg font-bold flex items-center gap-2">
                          <span>📝</span> Resumen de tu Review
                        </h6>
                        {(() => {
                          const currentReviewScore = getWeightedReviewScore({
                            track_ratings: trackRatings,
                            rating_produccion: ratings.produccion,
                            rating_composicion: ratings.composicion,
                            rating_letras: ratings.letras,
                            rating_originalidad: ratings.originalidad,
                            rating_cohesion: ratings.cohesion,
                            rating_replay: ratings.replay,
                            rating_general: ratings.general,
                          });
                          return currentReviewScore !== null ? (
                            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-3.5 py-1.5 rounded-full border border-emerald-400/30 text-emerald-300 text-xs sm:text-sm font-bold">
                              ★ Promedio Ponderado Final:{' '}
                              {currentReviewScore.toFixed(2)} / 10
                            </div>
                          ) : null;
                        })()}
                      </div>

                      {/* Resumen de Usuario */}
                      <div className="text-xs sm:text-sm text-white/70 bg-black/40 p-3.5 sm:p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {user?.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name || 'Usuario'}
                              className="w-8 h-8 rounded-full object-cover border border-[#f5576c]/30 flex-shrink-0"
                              onError={(e) => {
                                e.target.src =
                                  'https://via.placeholder.com/100/1a1a2e/ffffff?text=👤';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f5576c] to-[#f093fb] text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {(
                                (user?.name || user?.email || 'U')[0] || 'U'
                              ).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-white font-bold block truncate">
                              {user?.name || user?.email?.split('@')[0]}
                            </span>
                            <span className="text-white/40 text-[10px] sm:text-xs block truncate">
                              {user?.email}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Resumen de Canciones */}
                      {shouldShowTracks && effectiveTracks.length > 0 && (
                        <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-white/70 font-semibold flex items-center gap-1.5">
                              <span>🎵</span> Calificaciones de Canciones (
                              {trackProgress}/{effectiveTracks.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => setWizardStep('tracks')}
                              className="text-xs text-[#f093fb] hover:underline font-semibold"
                            >
                              ✏️ Editar
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto custom-scrollbar pt-1">
                            {effectiveTracks.map((t, idx) => {
                              const score = getTrackRating(t, idx);
                              const trackName = getTrackName(t, idx);
                              const effectiveFav =
                                favoriteTrack ||
                                getTopRatedTrack(
                                  effectiveTracks.reduce((acc, curr, cIdx) => {
                                    const s = getTrackRating(curr, cIdx);
                                    if (s !== undefined)
                                      acc[getTrackKey(curr, cIdx)] = Number(s);
                                    return acc;
                                  }, {}),
                                  false
                                );
                              const isFav =
                                isFavoriteTrackMatch(
                                  t,
                                  effectiveFav,
                                  effectiveTracks,
                                  idx
                                ) || effectiveFav === getTrackKey(t, idx);
                              return (
                                <span
                                  key={getTrackKey(t, idx)}
                                  className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 border font-mono ${
                                    isFav
                                      ? 'bg-amber-500/20 text-amber-200 border-amber-400/40 font-bold shadow-sm'
                                      : score !== undefined
                                        ? 'bg-white/5 text-white/80 border-white/10'
                                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                                  }`}
                                >
                                  <span>
                                    {isFav
                                      ? '⭐'
                                      : `#${t.track_number || idx + 1}`}
                                  </span>
                                  <span className="truncate max-w-[120px]">
                                    {trackName}
                                  </span>
                                  :
                                  <span
                                    className={`font-bold ${isFav ? 'text-amber-300' : 'text-[#f5576c]'}`}
                                  >
                                    {score !== undefined
                                      ? score
                                      : 'Sin calificar'}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Resumen de Criterios */}
                      <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white/70 font-semibold flex items-center gap-1.5">
                            <span>📊</span> Criterios del Álbum
                          </span>
                          <button
                            type="button"
                            onClick={() => setWizardStep('criteria')}
                            className="text-xs text-[#f093fb] hover:underline font-semibold"
                          >
                            ✏️ Editar
                          </button>
                        </div>

                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5 pt-1">
                          {CRITERIOS.map((c) => (
                            <div
                              key={c.id}
                              className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col justify-between gap-1"
                            >
                              <span className="text-white/50 text-xs truncate">
                                {c.label}
                              </span>
                              <span className="font-bold text-white text-base font-mono">
                                {ratings[c.id]} / {c.max}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Selección de Canción Favorita (⭐ Track Destacado del Álbum) */}
                      {shouldShowTracks && effectiveTracks.length > 0 && (
                        <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 p-4 sm:p-5 rounded-2xl border border-amber-400/30 space-y-3.5 shadow-[0_0_25px_rgba(251,191,36,0.08)]">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div>
                              <h6 className="text-amber-300 text-sm sm:text-base font-bold flex items-center gap-2">
                                <span>⭐</span> ¿Cuál fue tu canción favorita
                                del álbum?
                              </h6>
                              <p className="text-white/60 text-xs mt-0.5">
                                Toca una canción para marcarla con la estrella
                                dorada como tu favorita del disco.
                              </p>
                            </div>
                            {(() => {
                              const effectiveFav =
                                favoriteTrack ||
                                getTopRatedTrack(
                                  effectiveTracks.reduce((acc, t, idx) => {
                                    const s = getTrackRating(t, idx);
                                    if (s !== undefined)
                                      acc[getTrackKey(t, idx)] = Number(s);
                                    return acc;
                                  }, {}),
                                  false
                                );
                              if (!effectiveFav) return null;
                              const favName = getTrackDisplayName(
                                effectiveFav,
                                effectiveTracks
                              );
                              return (
                                <div className="bg-amber-400/20 text-amber-200 border border-amber-400/40 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-sm flex-shrink-0">
                                  <span>⭐ Favorita:</span>
                                  <span className="truncate max-w-[160px]">
                                    {favName}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Grid de Canciones para Seleccionar la Favorita */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5 max-h-56 overflow-y-auto custom-scrollbar pr-1 pt-1">
                            {effectiveTracks.map((t, idx) => {
                              const tKey = getTrackKey(t, idx);
                              const tName = getTrackName(t, idx);
                              const score = getTrackRating(t, idx);
                              const effectiveFav =
                                favoriteTrack ||
                                getTopRatedTrack(
                                  effectiveTracks.reduce((acc, curr, cIdx) => {
                                    const s = getTrackRating(curr, cIdx);
                                    if (s !== undefined)
                                      acc[getTrackKey(curr, cIdx)] = Number(s);
                                    return acc;
                                  }, {}),
                                  false
                                );
                              const isFav =
                                isFavoriteTrackMatch(
                                  t,
                                  effectiveFav,
                                  effectiveTracks,
                                  idx
                                ) || effectiveFav === tKey;

                              return (
                                <button
                                  key={tKey}
                                  type="button"
                                  onClick={() => setFavoriteTrack(tKey)}
                                  className={`p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between gap-2.5 group ${
                                    isFav
                                      ? 'bg-gradient-to-r from-amber-500/25 to-yellow-500/20 border-amber-400 text-white shadow-md shadow-amber-500/20 ring-1 ring-amber-400/60 scale-[1.01]'
                                      : 'bg-black/30 border-white/5 hover:bg-white/10 hover:border-amber-400/30 text-white/70'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                                        isFav
                                          ? 'bg-amber-400 text-black shadow-sm'
                                          : 'bg-white/10 text-white/50'
                                      }`}
                                    >
                                      #{t.track_number || idx + 1}
                                    </span>
                                    <span
                                      className="text-xs sm:text-sm font-medium truncate"
                                      title={tName}
                                    >
                                      {tName}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {score !== undefined && (
                                      <span className="text-xs font-mono text-white/50 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                                        ★ {score}
                                      </span>
                                    )}
                                    <span
                                      className={`text-lg transition-transform group-hover:scale-125 ${
                                        isFav
                                          ? 'text-amber-300 filter drop-shadow'
                                          : 'text-white/20 hover:text-amber-300/80'
                                      }`}
                                    >
                                      ⭐
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Pregunta: ¿Cómo te hizo sentir el álbum? (7 Emojis) */}
                      <div className="bg-black/30 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h6 className="text-white text-sm sm:text-base font-bold flex items-center gap-2">
                              <span>🎭</span> ¿Cómo te hizo sentir el álbum?
                            </h6>
                            <p className="text-white/40 text-xs mt-0.5">
                              Selecciona el sentimiento o vibra principal que te
                              provocó al escucharlo.
                            </p>
                          </div>
                          {(() => {
                            const currentScore = getWeightedReviewScore({
                              track_ratings: trackRatings,
                              rating_produccion: ratings.produccion,
                              rating_composicion: ratings.composicion,
                              rating_letras: ratings.letras,
                              rating_originalidad: ratings.originalidad,
                              rating_cohesion: ratings.cohesion,
                              rating_replay: ratings.replay,
                              rating_general: ratings.general,
                            });
                            const suggested = getEmotionForScore(currentScore);
                            return (
                              <span className="text-xs text-pink-300/90 bg-pink-500/10 px-3 py-1 rounded-xl border border-pink-500/20 self-start sm:self-auto font-mono flex items-center gap-1.5 flex-shrink-0">
                                <span>💡 Sugerido:</span> {suggested.emoji}{' '}
                                {suggested.label}
                              </span>
                            );
                          })()}
                        </div>

                        {/* Grid de los 7 Emojis */}
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-2.5 pt-1">
                          {EMOTIONS.map((emo) => {
                            const currentScore = getWeightedReviewScore({
                              track_ratings: trackRatings,
                              rating_produccion: ratings.produccion,
                              rating_composicion: ratings.composicion,
                              rating_letras: ratings.letras,
                              rating_originalidad: ratings.originalidad,
                              rating_cohesion: ratings.cohesion,
                              rating_replay: ratings.replay,
                              rating_general: ratings.general,
                            });
                            const suggested = getEmotionForScore(currentScore);
                            const isSelected = selectedFeeling
                              ? selectedFeeling.toLowerCase() ===
                                  emo.text.toLowerCase() ||
                                selectedFeeling.toLowerCase() ===
                                  emo.label.toLowerCase()
                              : suggested.id === emo.id;

                            return (
                              <button
                                key={emo.id}
                                type="button"
                                onClick={() => setSelectedFeeling(emo.text)}
                                className={`p-3 sm:p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-200 group relative ${
                                  isSelected
                                    ? `${emo.badgeClass} ring-2 ring-white/50 scale-[1.04] shadow-lg`
                                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 text-white/70'
                                }`}
                                title={emo.description}
                              >
                                <span className="text-2xl sm:text-3xl transition-transform group-hover:scale-110">
                                  {emo.emoji}
                                </span>
                                <span className="text-xs font-bold mt-2 leading-tight line-clamp-2">
                                  {emo.label}
                                </span>
                                <span className="text-[10px] opacity-60 mt-1 line-clamp-2 hidden sm:block">
                                  {emo.description}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Campo de Comentario Adicional */}
                      <div>
                        <label className="text-white/70 text-xs sm:text-sm block mb-1.5 font-semibold">
                          ¿Quieres agregar un comentario u opinión general?
                          (Opcional)
                        </label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Escribe tus impresiones del álbum..."
                          rows="3"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#f5576c]/60 resize-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Advertencias / Errores */}
                    {error && (
                      <div className="text-[#f5576c] text-xs sm:text-sm bg-[#f5576c]/10 p-3.5 rounded-xl border border-[#f5576c]/20 flex items-center gap-2">
                        <span>⚠️</span> {error}
                      </div>
                    )}
                    {success && (
                      <div className="text-green-400 text-xs sm:text-sm bg-green-400/10 p-3.5 rounded-xl border border-green-400/20 flex items-center gap-2">
                        <span>✅</span> ¡Review enviada con éxito! Muchas
                        gracias.
                      </div>
                    )}

                    {/* Botón Final de Envío */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-3">
                      <button
                        type="button"
                        onClick={handleSubmitReview}
                        disabled={
                          isSubmitting ||
                          (shouldShowTracks &&
                            effectiveTracks.length > 0 &&
                            !areAllTracksRated)
                        }
                        className={`w-full sm:flex-1 py-3.5 sm:py-4 px-6 bg-gradient-to-r ${
                          isEditing
                            ? 'from-amber-500 via-orange-500 to-amber-500 shadow-amber-500/20'
                            : isIndividual
                              ? 'from-blue-600 to-cyan-500 shadow-blue-500/20'
                              : 'from-[#f5576c] to-[#f093fb] shadow-[#f5576c]/20'
                        } text-white rounded-2xl text-sm sm:text-base font-bold shadow-xl transition-all flex items-center justify-center gap-2 ${
                          isSubmitting ||
                          (shouldShowTracks &&
                            effectiveTracks.length > 0 &&
                            !areAllTracksRated)
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:scale-[1.02] active:scale-95'
                        }`}
                      >
                        {isSubmitting
                          ? isEditing
                            ? '🔄 Actualizando Review...'
                            : '🔄 Enviando Review...'
                          : isEditing
                            ? '💾 Guardar Cambios de Review'
                            : '📤 Enviar Review Definitiva'}
                      </button>

                      {isEditing ? (
                        <button
                          type="button"
                          onClick={handleCancelEditing}
                          className="w-full sm:w-auto py-3.5 sm:py-4 px-6 bg-white/5 border border-white/10 text-white/70 hover:text-white rounded-2xl text-sm hover:bg-white/10 transition-all font-semibold active:scale-95 text-center"
                        >
                          Cancelar Edición
                        </button>
                      ) : !isIndividual ? (
                        <button
                          type="button"
                          onClick={() => {
                            setShowReviewForm(false);
                            if (onToggleTrackReviews) {
                              onToggleTrackReviews();
                            }
                          }}
                          className="w-full sm:w-auto py-3.5 sm:py-4 px-6 bg-white/5 border border-white/10 text-white/50 hover:text-white rounded-2xl text-sm hover:bg-white/10 transition-all font-semibold active:scale-95 text-center"
                        >
                          Cancelar
                        </button>
                      ) : null}
                    </div>

                    {/* Opción de reiniciar borrador */}
                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              '¿Estás seguro de que quieres borrar las respuestas y reiniciar la calificación?'
                            )
                          ) {
                            handleResetDraft();
                          }
                        }}
                        className="text-xs text-white/30 hover:text-rose-300 hover:underline transition-colors font-medium inline-flex items-center gap-1.5 py-1"
                      >
                        <span>🗑️</span> Reiniciar todas las respuestas
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Botón CTA cuando no se ha calificado y el formulario está cerrado */
          <button
            onClick={() => setShowReviewForm(true)}
            className="w-full py-4 bg-gradient-to-r from-[#f5576c]/20 via-[#f093fb]/20 to-[#f5576c]/20 hover:from-[#f5576c]/30 hover:via-[#f093fb]/30 hover:to-[#f5576c]/30 border border-[#f5576c]/40 hover:border-[#f5576c]/70 rounded-2xl text-white hover:shadow-xl hover:shadow-[#f5576c]/15 transition-all text-sm font-bold flex items-center justify-center gap-2.5 group"
          >
            <span className="text-lg group-hover:scale-125 transition-transform">
              ✍️
            </span>
            <span>Dejar tu Review para este Álbum</span>
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* SECCIÓN 2: REVIEWS GENERALES DEL ÁLBUM / COMUNIDAD     */}
      {/* ======================================================== */}
      {!hideOtherReviews && (
        <div className="pt-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <div className="flex items-center gap-3">
              <h4 className="text-white/90 text-sm font-bold tracking-wider uppercase flex items-center gap-2">
                {isIndividual ? (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/10 px-3 py-1 rounded-full border border-blue-400/30 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                    <span className="animate-pulse">📌</span>
                    <span className="font-semibold text-xs tracking-wider uppercase">
                      Reviews de Álbum Individual
                    </span>
                  </div>
                ) : isFromSpotify ? (
                  <>
                    <span className="text-[#f5576c]">🎵</span>
                    <span className="text-white/80">Reviews de la Comunidad</span>
                  </>
                ) : (
                  <>
                    <span className="text-[#f5576c]">🎧</span>
                    <span className="text-white/80">Reviews del Club</span>
                  </>
                )}
                <span className="text-white/60 text-xs font-normal bg-white/10 px-2.5 py-0.5 rounded-full border border-white/5">
                  {reviews.length}
                </span>
              </h4>
            </div>
            {average && (
              <span
                className={`text-sm font-bold px-3 py-1 rounded-full border flex items-center gap-1 shadow-lg ${
                  isIndividual
                    ? 'text-cyan-300 bg-cyan-500/10 border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'text-[#f5576c] bg-[#f5576c]/10 border-[#f5576c]/20'
                }`}
              >
                ★ {Number(average).toFixed(1)}/10 Promedio General
              </span>
            )}
          </div>

          {/* Lista de reviews existentes */}
          {loading ? (
            <div className="text-white/20 text-sm py-6 text-center">
              <span className="w-2 h-2 bg-[#f5576c] rounded-full animate-pulse inline-block mr-2"></span>
              Cargando reviews...
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
              {reviews.map((review, idx) => {
                const weightedScore = getWeightedReviewScore(review);
                const avg =
                  weightedScore !== null && !isNaN(weightedScore)
                    ? Number(weightedScore).toFixed(1)
                    : review.rating_general !== null &&
                        review.rating_general !== undefined &&
                        !isNaN(review.rating_general)
                      ? Number(review.rating_general).toFixed(1)
                      : 'N/A';
                const trackRatingsData = review.track_ratings || {};

                return (
                  <div
                    key={idx}
                    className={`rounded-2xl p-4 border transition-all duration-300 ${
                      isIndividual
                        ? 'bg-gradient-to-r from-blue-950/30 via-slate-900/40 to-cyan-950/20 border-blue-500/20 hover:border-blue-400/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
                      <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                        {review?.reviewer_avatar ? (
                          <img
                            src={review.reviewer_avatar}
                            alt={review.reviewer_name || 'Reviewer'}
                            className="w-7 h-7 rounded-full object-cover border border-white/20 shadow-sm flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling)
                                e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            review?.reviewer_avatar ? 'hidden' : 'flex'
                          } ${
                            isIndividual
                              ? 'bg-gradient-to-tr from-blue-600 to-cyan-400 text-white shadow-md'
                              : 'bg-gradient-to-tr from-[#f5576c] to-[#f093fb] text-white'
                          }`}
                        >
                          {(review?.reviewer_name || 'A')[0].toUpperCase()}
                        </div>
                        <span
                          translate="no"
                          className="notranslate username-tag text-white font-medium text-sm"
                        >
                          {review?.reviewer_name || 'Anónimo'}
                        </span>
                        <span className="text-white/30 text-xs">
                          {review.created_at
                            ? new Date(review.created_at).toLocaleDateString(
                                'es-ES',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )
                            : ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto flex-shrink-0">
                        {(() => {
                          const emo = getEmotionFromReview(review);
                          return emo ? (
                            <span
                              className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 shadow-sm ${emo.badgeClass}`}
                              title={emo.description}
                            >
                              <span className="text-xl">{emo.emoji}</span>
                              <span className="hidden sm:inline">
                                {emo.label}
                              </span>
                            </span>
                          ) : null;
                        })()}
                        <span
                          className={`text-sm font-bold px-2.5 py-0.5 rounded-full border ${
                            isIndividual
                              ? 'text-cyan-300 bg-cyan-500/15 border-cyan-400/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                              : 'text-[#f5576c] bg-[#f5576c]/10 border-[#f5576c]/20'
                          }`}
                        >
                          ★ {avg}
                        </span>
                      </div>
                    </div>

                    {review.comment && (
                      <p className="text-white/70 text-sm mt-2 italic bg-black/20 p-2.5 rounded-xl border border-white/5 leading-relaxed">
                        "{review.comment}"
                      </p>
                    )}

                    {/* Canción Favorita */}
                    {(() => {
                      const favTrack = getReviewFavoriteTrack(review);
                      if (!favTrack) return null;
                      const favName = getTrackDisplayName(
                        favTrack,
                        effectiveTracks.length > 0
                          ? effectiveTracks
                          : album?.tracks
                      );
                      return (
                        <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-400/30 p-2.5 sm:px-3 sm:py-1.5 rounded-xl text-amber-200 font-medium shadow-sm">
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-sm">⭐</span>
                            <span className="text-amber-400/90 font-bold text-[10px] sm:text-[11px] uppercase tracking-wider">
                              Canción Favorita:
                            </span>
                          </div>
                          <span
                            translate="no"
                            className="notranslate track-name font-extrabold text-amber-200 text-xs sm:text-sm pl-5 sm:pl-0 break-words sm:truncate sm:max-w-[280px]"
                            title={favName}
                          >
                            {favName}
                          </span>
                        </div>
                      );
                    })()}

                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {[
                        { key: 'rating_produccion', label: '🎛️ Prod.' },
                        { key: 'rating_composicion', label: '🎵 Comp.' },
                        { key: 'rating_letras', label: '📝 Letras' },
                        { key: 'rating_originalidad', label: '💡 Orig.' },
                        { key: 'rating_cohesion', label: '🔗 Cohes.' },
                        { key: 'rating_replay', label: '🔄 Replay' },
                        { key: 'rating_general', label: '⭐ Gral.' },
                      ].map(
                        ({ key, label }) =>
                          review[key] && (
                            <span
                              key={key}
                              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                isIndividual
                                  ? 'text-blue-200/80 bg-blue-500/10 border-blue-400/20'
                                  : 'text-white/30 bg-white/5 border-white/5'
                              }`}
                            >
                              {label}: {review[key]}
                            </span>
                          )
                      )}
                    </div>

                    {Object.keys(trackRatingsData).length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/10">
                        <p className="text-white/30 text-[9px] uppercase tracking-wider mb-1 flex items-center gap-1">
                          <span>🎵</span> Reviews por canción:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(trackRatingsData).map(
                            ([trackId, rating], trIdx) => {
                              const trackName = getTrackDisplayName(
                                trackId,
                                effectiveTracks.length > 0
                                  ? effectiveTracks
                                  : album?.tracks
                              );
                              const isFav = isFavoriteTrackMatch(
                                trackId,
                                getReviewFavoriteTrack(review),
                                effectiveTracks.length > 0
                                  ? effectiveTracks
                                  : album?.tracks,
                                trIdx
                              );
                              return (
                                <span
                                  key={trackId}
                                  className={`text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 border transition-all ${
                                    isFav
                                      ? 'bg-amber-500/20 border-amber-400/40 text-amber-200 font-bold shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                                      : 'bg-black/40 border-white/10 text-white/70'
                                  }`}
                                >
                                  <span>{isFav ? '⭐' : '🎵'}</span>
                                  <span
                                    translate="no"
                                    className="notranslate track-name max-w-[120px] truncate"
                                    title={trackName}
                                  >
                                    {trackName}
                                  </span>
                                  <span
                                    className={`font-mono font-bold ${isFav ? 'text-amber-300' : 'text-emerald-300'}`}
                                  >
                                    ★ {rating}
                                  </span>
                                </span>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-white/20 text-sm py-6 text-center border border-dashed border-white/5 rounded-xl">
              No hay reviews para este álbum todavía.
              <br className="sm:hidden" />
              <span className="hidden sm:inline"> </span>
              <span className="text-white/10 text-xs">
                ¡Sé el primero en dejar tu review!
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
