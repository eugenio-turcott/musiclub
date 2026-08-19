import React, { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../services/supabaseClient';
import { getWeightedReviewScore, getAlbumWeightedAverage, getTrackDisplayName } from '../utils/ratingUtils';

const CRITERIOS = [
  { id: 'produccion', label: '🎛️ Producción', desc: 'Evalúa la calidad de producción, mezcla y diseño de sonido.', max: 5 },
  { id: 'composicion', label: '🎵 Composición', desc: 'Evalúa las melodías, armonías, arreglos y estructura musical.', max: 5 },
  { id: 'letras', label: '📝 Letras', desc: 'Evalúa el contenido lírico, mensajes, poesía y narrativa.', max: 5 },
  { id: 'originalidad', label: '💡 Originalidad', desc: 'Evalúa la innovación, propuesta única y frescura sonora.', max: 5 },
  { id: 'cohesion', label: '🔗 Cohesión', desc: 'Evalúa cómo fluyen las canciones juntas como proyecto unificado.', max: 5 },
  { id: 'replay', label: '🔄 Replay Value', desc: '¿Qué tantas ganas te deja de volver a escucharlo completo?', max: 5 },
  { id: 'general', label: '⭐ Calificación General', desc: 'Tu valoración global e independiente para el álbum.', max: 10 },
];

export function ReviewSystem({
  album,
  onReviewSubmitted,
  isAdmin,
  isFromSpotify = false,
  isIndividual = false,
  tracks = [],
  user = null,
  showTrackReviews = true,
  onToggleTrackReviews = null,
}) {
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
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Wizard state: 'user' | 'tracks' | 'criteria' | 'summary'
  const [wizardStep, setWizardStep] = useState('user');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentCriterionIndex, setCurrentCriterionIndex] = useState(0);

  const shouldShowTracks = isIndividual || showTrackReviews;

  const loadReviews = useCallback(async () => {
    if (!album || !album.id) {
      console.warn('No album id available');
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
        if (parsed.comment !== undefined) setComment(parsed.comment);
        if (parsed.wizardStep) setWizardStep(parsed.wizardStep);
        if (typeof parsed.currentTrackIndex === 'number')
          setCurrentTrackIndex(parsed.currentTrackIndex);
        if (typeof parsed.currentCriterionIndex === 'number')
          setCurrentCriterionIndex(parsed.currentCriterionIndex);
        if (parsed.userName && !user) setUserName(parsed.userName);
        if (parsed.userEmail && !user) setUserEmail(parsed.userEmail);
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
      if (track.id && ratingsMap[track.id] !== undefined) return ratingsMap[track.id];
      if (track.spotify_id && ratingsMap[track.spotify_id] !== undefined) return ratingsMap[track.spotify_id];

      if (track.name) {
        if (ratingsMap[track.name] !== undefined) return ratingsMap[track.name];
        const trimmedName = track.name.trim();
        if (ratingsMap[trimmedName] !== undefined) return ratingsMap[trimmedName];

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
    const trackNum = typeof track === 'object' && track.track_number ? String(track.track_number) : null;
    if (trackNum && ratingsMap[trackNum] !== undefined) return ratingsMap[trackNum];
    if (ratingsMap[String(idx + 1)] !== undefined) return ratingsMap[String(idx + 1)];
    if (ratingsMap[String(idx)] !== undefined) return ratingsMap[String(idx)];

    return undefined;
  };

  // Handle default wizard step ONLY when step is 'user' and no draft step exists
  useEffect(() => {
    if (user && userName && userEmail) {
      setWizardStep((prev) => {
        if (prev === 'user' && !isDraftRestoredRef.current) {
          return shouldShowTracks && effectiveTracks.length > 0 ? 'tracks' : 'criteria';
        }
        return prev;
      });
    }
  }, [user, userName, userEmail, shouldShowTracks, effectiveTracks.length]);

  // Auto-save draft changes to localStorage
  useEffect(() => {
    if (!draftKey || isSubmitting) return;
    try {
      const hasChanges =
        Object.keys(trackRatings).length > 0 ||
        comment.trim().length > 0 ||
        wizardStep !== 'user' ||
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
    setComment('');
    setCurrentTrackIndex(0);
    setCurrentCriterionIndex(0);
    if (user) {
      setWizardStep(shouldShowTracks && effectiveTracks.length > 0 ? 'tracks' : 'criteria');
    } else {
      setWizardStep('user');
    }
    setError(null);
  };

  const currentUserEmail = (user?.email || userEmail || '').trim().toLowerCase();
  const currentUserName = (user?.name || userName || '').trim().toLowerCase();

  const existingUserReview = reviews.find((r) => {
    const revEmail = (r.reviewer_email || '').trim().toLowerCase();
    const revName = (r.reviewer_name || '').trim().toLowerCase();
    if (currentUserEmail && revEmail && revEmail === currentUserEmail) return true;
    if (currentUserName && revName && revName === currentUserName) return true;
    return false;
  });
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
    setComment(existingUserReview.comment || '');
    setCurrentTrackIndex(0);
    setCurrentCriterionIndex(0);
    setWizardStep(shouldShowTracks && effectiveTracks.length > 0 ? 'tracks' : 'criteria');
    setError(null);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setError(null);
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

    if (!userName.trim()) {
      setError('Por favor ingresa tu nombre');
      setWizardStep('user');
      setIsSubmitting(false);
      return;
    }

    if (!userEmail.trim() || !userEmail.includes('@')) {
      setError('Por favor ingresa un email válido');
      setWizardStep('user');
      setIsSubmitting(false);
      return;
    }

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

    const reviewData = {
      albumId: album.id,
      reviewerName: userName.trim(),
      reviewerEmail: userEmail.trim(),
      trackRatings: finalTrackRatings,
      ratingProduccion: ratings.produccion,
      ratingComposicion: ratings.composicion,
      ratingLetras: ratings.letras,
      ratingOriginalidad: ratings.originalidad,
      ratingCohesion: ratings.cohesion,
      ratingReplay: ratings.replay,
      ratingGeneral: ratings.general,
      comment: comment.trim(),
    };

    try {
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
      effectiveTracks.every((track, idx) => getTrackRating(track, idx) !== undefined)
    : true;
  const trackProgress = shouldShowTracks
    ? effectiveTracks.filter((track, idx) => getTrackRating(track, idx) !== undefined).length
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
    if (norm >= 8.5) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (norm >= 7) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (norm >= 5) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  if (!album) return null;

  return (
    <div className="mt-4 pt-4 border-t border-white/5 space-y-6">
      {/* ======================================================== */}
      {/* SECCIÓN 1: MI REVIEW (CALIFICAR / VER / EDITAR)         */}
      {/* ======================================================== */}
      <div>
        {hasAlreadyReviewed && !isEditing ? (
          /* TU REVIEW REGISTRADA (Con botón Editar) */
          <div
            className={`rounded-3xl p-5 sm:p-6 border shadow-2xl relative overflow-hidden transition-all duration-500 ${
              isIndividual
                ? 'bg-gradient-to-br from-[#0b172a] via-[#0d1d36] to-[#081120] border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.15)]'
                : 'bg-gradient-to-br from-[#0e1b2b] to-[#09111c] border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.12)]'
            }`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                  ✓
                </div>
                <div>
                  <h5 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                    <span>Tu Review Registrada</span>
                  </h5>
                  <p className="text-emerald-400/80 text-xs">
                    Ya calificaste este álbum. Puedes editar tu review en cualquier momento.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartEditing}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 hover:text-white border border-cyan-400/30 hover:border-cyan-400/60 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.15)] active:scale-95"
              >
                <span>✏️</span> Editar Mi Review
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-base">
                    {(existingUserReview.reviewer_name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">
                      {existingUserReview.reviewer_name || 'Tu Usuario'}
                    </div>
                    <div className="text-white/40 text-xs">
                      {existingUserReview.created_at
                        ? new Date(existingUserReview.created_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Evaluado'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-300">
                    ★ {getWeightedReviewScore(existingUserReview)?.toFixed(1) ?? existingUserReview.rating_general ?? '10'}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-emerald-400/70 font-semibold">
                    Calificación Ponderada
                  </div>
                </div>
              </div>

              {existingUserReview.comment && (
                <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
                  <div className="text-white/40 text-xs mb-1 font-semibold uppercase tracking-wider">
                    Tu Comentario:
                  </div>
                  <p className="text-white/90 text-sm italic">"{existingUserReview.comment}"</p>
                </div>
              )}

              {/* Desglose de Criterios */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'rating_produccion', label: '🎛️ Prod.', max: 5 },
                  { key: 'rating_composicion', label: '🎵 Comp.', max: 5 },
                  { key: 'rating_letras', label: '📝 Letras', max: 5 },
                  { key: 'rating_originalidad', label: '💡 Orig.', max: 5 },
                  { key: 'rating_cohesion', label: '🔗 Cohes.', max: 5 },
                  { key: 'rating_replay', label: '🔄 Replay', max: 5 },
                  { key: 'rating_general', label: '⭐ Gral.', max: 10 },
                ].map(({ key, label, max }) => {
                  const val = existingUserReview[key];
                  if (val === undefined || val === null) return null;
                  return (
                    <div
                      key={key}
                      className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex items-center justify-between"
                    >
                      <span className="text-white/60 text-xs truncate mr-1">{label}</span>
                      <span className="text-emerald-300 font-bold text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                        {val}/{max}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Canciones calificadas */}
              {existingUserReview.track_ratings &&
                Object.keys(existingUserReview.track_ratings).length > 0 && (
                  <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
                    <div className="text-white/40 text-xs mb-2 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <span>🎵</span> Canciones Calificadas:
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                      {Object.entries(existingUserReview.track_ratings).map(([tId, rating]) => {
                        const trackName = getTrackDisplayName(
                          tId,
                          effectiveTracks.length > 0 ? effectiveTracks : album?.tracks
                        );
                        return (
                          <span
                            key={tId}
                            className="text-xs px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-white/80 flex items-center gap-1.5"
                          >
                            <span className="text-cyan-400">🎵</span>
                            <span className="max-w-[150px] truncate" title={trackName}>
                              {trackName}
                            </span>
                            <span className="font-bold text-emerald-300 ml-1">★ {rating}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
          </div>
        ) : (showReviewForm || isIndividual || isEditing) ? (
          <div
            className={`rounded-3xl p-5 sm:p-6 border shadow-2xl relative overflow-hidden transition-all duration-500 ${
              isEditing
                ? 'bg-gradient-to-br from-[#16120b] via-[#1a150e] to-[#0d0a07] border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.18)]'
                : isIndividual
                ? 'bg-gradient-to-br from-[#0b1324] via-[#0e1a30] to-[#070d1a] border-blue-500/40 shadow-[0_0_50px_rgba(59,130,246,0.18)]'
                : 'bg-gradient-to-br from-[#121225] to-[#0a0a14] border-[#f5576c]/30 shadow-2xl'
            }`}
          >
            {/* Luces traseras decorativas para Individual o Edición */}
            {(isIndividual || isEditing) && (
              <>
                <div className={`absolute -top-24 -right-24 w-60 h-60 ${isEditing ? 'bg-amber-500/15' : 'bg-blue-500/15'} rounded-full blur-3xl pointer-events-none`}></div>
                <div className={`absolute -bottom-24 -left-24 w-60 h-60 ${isEditing ? 'bg-orange-500/10' : 'bg-cyan-500/10'} rounded-full blur-3xl pointer-events-none`}></div>
              </>
            )}

            {/* Header del Formulario */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10 relative z-10 gap-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h5 className="text-white font-bold text-base flex items-center gap-2">
                  <span className={isEditing ? 'text-amber-400' : isIndividual ? 'text-blue-400' : 'text-[#f5576c]'}>
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
                  <span className="hidden xs:inline-flex items-center gap-1 text-[10px] text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                    <span>💾</span> Autoguardado
                  </span>
                )}
              </div>
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleCancelEditing}
                  className="text-white/60 hover:text-white text-xs bg-white/5 hover:bg-white/10 px-3 py-1 rounded-xl border border-white/10 transition-all font-medium"
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
                  className="text-white/40 hover:text-white text-sm bg-white/5 hover:bg-white/10 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                  title="Cerrar"
                >
                  ✕
                </button>
              ) : null}
            </div>

          {/* Nav Tab Bar del Wizard */}
          <div className="flex items-center gap-1.5 mb-5 bg-black/50 p-1.5 rounded-2xl border border-white/10 relative z-10 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setWizardStep('user')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap flex-shrink-0 flex-1 ${
                wizardStep === 'user'
                  ? isIndividual
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <span>👤</span> <span className="truncate">1. Datos</span>
            </button>

            {shouldShowTracks && effectiveTracks.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (userName.trim() && userEmail.trim()) {
                    setWizardStep('tracks');
                  } else {
                    setError('Por favor completa tus datos de usuario primero.');
                  }
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap flex-shrink-0 flex-1 ${
                  wizardStep === 'tracks'
                    ? isIndividual
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <span>🎵</span>{' '}
                <span>
                  2. Canciones ({trackProgress}/{effectiveTracks.length})
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (userName.trim() && userEmail.trim()) {
                  setWizardStep('criteria');
                } else {
                  setError('Por favor completa tus datos de usuario primero.');
                }
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap flex-shrink-0 flex-1 ${
                wizardStep === 'criteria'
                  ? isIndividual
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <span>📊</span>{' '}
              <span>
                {shouldShowTracks && effectiveTracks.length > 0 ? '3. Criterios' : '2. Criterios'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (userName.trim() && userEmail.trim()) {
                  setWizardStep('summary');
                } else {
                  setError('Por favor completa tus datos de usuario primero.');
                }
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap flex-shrink-0 flex-1 ${
                wizardStep === 'summary'
                  ? isIndividual
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <span>📝</span> <span>Resumen</span>
            </button>
          </div>

          {/* Banner de inicio de sesión o cuenta */}
          {!user && isIndividual && wizardStep === 'user' && (
            <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
              <p className="text-yellow-400/90 text-xs flex items-center gap-2">
                <span>⚠️</span>
                Inicia sesión para vincular tu review a tu perfil de Google.
              </p>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 1: DATOS DEL USUARIO */}
          {/* ======================================================== */}
          {wizardStep === 'user' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <h6 className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>👤</span> Tus Datos de Reviewer
                </h6>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/50 text-xs block mb-1.5 font-medium">
                      Tu Nombre / Apodo *
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Ej: Sofía Martínez"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#f5576c]/60 transition-colors"
                      required
                      disabled={!!user}
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs block mb-1.5 font-medium">
                      Tu Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#f5576c]/60 transition-colors"
                      required
                      disabled={!!user}
                    />
                    {user && (
                      <p className="text-green-400/80 text-[10px] mt-1 flex items-center gap-1">
                        ✓ Autenticado con Google
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón Siguiente a Canciones / Criterios */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    if (!userName.trim()) {
                      setError('Por favor ingresa tu nombre');
                      return;
                    }
                    if (!userEmail.trim() || !userEmail.includes('@')) {
                      setError('Por favor ingresa un correo válido');
                      return;
                    }
                    if (shouldShowTracks && effectiveTracks.length > 0) {
                      setWizardStep('tracks');
                    } else {
                      setWizardStep('criteria');
                    }
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white rounded-xl text-sm font-bold shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2"
                >
                  Continuar{' '}
                  {shouldShowTracks && effectiveTracks.length > 0 ? 'a Canciones 🎵' : 'a Criterios 📊'} ➔
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: CANCIONES (STRATEGY BACK / NEXT) */}
          {/* ======================================================== */}
          {wizardStep === 'tracks' && shouldShowTracks && effectiveTracks.length > 0 && currentTrack && (
            <div className="space-y-4 animate-fadeIn">
              {/* Progress Bar de Canciones */}
              <div>
                <div className="flex justify-between items-center text-xs text-white/60 mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5 text-white">
                    <span className="text-[#f5576c]">🎵</span> Canción {currentTrackIndex + 1} de {effectiveTracks.length}
                  </span>
                  <span className="text-[#f093fb]">
                    {trackProgress} / {effectiveTracks.length} calificadas
                  </span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#f5576c] to-[#f093fb] h-full transition-all duration-300"
                    style={{
                      width: `${((currentTrackIndex + 1) / effectiveTracks.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Strip selector de canciones (Pills/Drawer rápido) */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
                {effectiveTracks.map((t, idx) => {
                  const isRated = getTrackRating(t, idx) !== undefined;
                  const isActive = idx === currentTrackIndex;
                  return (
                    <button
                      key={getTrackKey(t, idx)}
                      type="button"
                      onClick={() => setCurrentTrackIndex(idx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1 flex-shrink-0 border ${
                        isActive
                          ? 'bg-[#f5576c] text-white border-[#f5576c] shadow-lg shadow-[#f5576c]/30 ring-2 ring-[#f5576c]/50'
                          : isRated
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-black/30 text-white/40 border-white/10 hover:bg-white/10'
                      }`}
                      title={getTrackName(t, idx)}
                    >
                      <span>#{t.track_number || idx + 1}</span>
                      {isRated && <span className="text-[10px]">✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* CARD DE CANCIÓN ACTUAL */}
              <div className="bg-gradient-to-b from-white/10 to-black/40 rounded-2xl p-5 border border-white/10 shadow-xl relative">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-white/10 w-full min-w-0">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white/40 text-xs font-mono bg-white/10 px-2 py-0.5 rounded-md">
                        Pista #{currentTrack.track_number || currentTrackIndex + 1}
                      </span>
                      {formatDuration(currentTrack.duration_ms) && (
                        <span className="text-white/30 text-xs font-mono">
                          ⏱️ {formatDuration(currentTrack.duration_ms)}
                        </span>
                      )}
                    </div>
                    <h4 className="text-white text-base sm:text-lg font-bold tracking-tight mt-1.5 break-words whitespace-normal leading-snug w-full">
                      {getTrackName(currentTrack, currentTrackIndex)}
                    </h4>
                  </div>

                  {/* Valor de la Calificación con Badge Dinámico */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto">
                    <div
                      className={`px-3 py-1.5 rounded-xl border text-sm font-bold flex items-center gap-1.5 ${getRatingBadgeColor(
                        getTrackRating(currentTrack, currentTrackIndex) !== undefined
                          ? getTrackRating(currentTrack, currentTrackIndex)
                          : 5,
                        10
                      )}`}
                    >
                      <span className="text-xs">⭐</span>
                      <span className="text-base font-mono">
                        {getTrackRating(currentTrack, currentTrackIndex) !== undefined
                          ? getTrackRating(currentTrack, currentTrackIndex)
                          : 5}
                      </span>
                      <span className="text-[10px] opacity-60">/ 10</span>
                    </div>
                  </div>
                </div>

                {/* Selección Rápida de Puntajes (Pills 1-10) */}
                <div className="mb-4">
                  <label className="text-white/40 text-[11px] uppercase tracking-wider block mb-2 font-medium">
                    Calificación rápida (Haz clic en un número):
                  </label>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                      const isSelected =
                        getTrackRating(currentTrack, currentTrackIndex) === score;
                      const trackKey = getTrackKey(currentTrack, currentTrackIndex);
                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleTrackRatingChange(trackKey, score)}
                          className={`py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
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
                    getTrackRating(currentTrack, currentTrackIndex) !== undefined
                      ? getTrackRating(currentTrack, currentTrackIndex)
                      : 5;
                  const trackKey = getTrackKey(currentTrack, currentTrackIndex);
                  return (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs text-white/40 font-mono">
                        <span>1</span>
                        <span>Ajuste con deslizador</span>
                        <span>10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={currentScore}
                        onChange={(e) =>
                          handleTrackRatingChange(trackKey, e.target.value)
                        }
                        className="w-full accent-[#f5576c] h-2 bg-white/10 rounded-lg cursor-pointer"
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
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (currentTrackIndex > 0) {
                      setCurrentTrackIndex((prev) => prev - 1);
                    } else {
                      setWizardStep('user');
                    }
                  }}
                  className="px-4 py-2.5 bg-white/10 border border-white/10 text-white/80 rounded-xl text-sm font-medium hover:bg-white/20 transition-all flex items-center gap-1.5"
                >
                  ⬅️ Anterior
                </button>

                <div className="text-white/40 text-xs font-mono hidden sm:block">
                  {currentTrackIndex + 1} / {effectiveTracks.length}
                </div>

                {currentTrackIndex < effectiveTracks.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const trackKey = getTrackKey(currentTrack, currentTrackIndex);
                      if (getTrackRating(currentTrack, currentTrackIndex) === undefined) {
                        handleTrackRatingChange(trackKey, 5);
                      }
                      setCurrentTrackIndex((prev) => prev + 1);
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white rounded-xl text-sm font-bold shadow-lg hover:scale-[1.02] transition-all flex items-center gap-1.5"
                  >
                    Siguiente ➡️
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const trackKey = getTrackKey(currentTrack, currentTrackIndex);
                      if (getTrackRating(currentTrack, currentTrackIndex) === undefined) {
                        handleTrackRatingChange(trackKey, 5);
                      }
                      setWizardStep('criteria');
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-xl text-sm font-bold shadow-lg hover:scale-[1.02] transition-all flex items-center gap-1.5"
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
                <div className="flex justify-between items-center text-xs text-white/60 mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5 text-white">
                    <span className="text-[#f5576c]">📊</span> Criterio {currentCriterionIndex + 1} de {CRITERIOS.length}
                  </span>
                  <span className="text-[#f093fb]">
                    {currentCriterionIndex + 1} / {CRITERIOS.length}
                  </span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#f5576c] to-[#f093fb] h-full transition-all duration-300"
                    style={{
                      width: `${((currentCriterionIndex + 1) / CRITERIOS.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Strip selector de criterios */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
                {CRITERIOS.map((c, idx) => {
                  const isActive = idx === currentCriterionIndex;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCurrentCriterionIndex(idx)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1 flex-shrink-0 border ${
                        isActive
                          ? 'bg-[#f5576c] text-white border-[#f5576c] shadow-lg shadow-[#f5576c]/30 ring-2 ring-[#f5576c]/50'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      <span>{c.label.split(' ')[0]}</span>
                      <span className="text-[10px] opacity-70">
                        ({ratings[c.id] || (c.max === 10 ? 5 : 3)}/{c.max})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* CARD DEL CRITERIO ACTUAL */}
              <div className="bg-gradient-to-b from-white/10 to-black/40 rounded-2xl p-5 border border-white/10 shadow-xl relative">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-white/10">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs font-mono bg-white/10 px-2 py-0.5 rounded-md">
                        Criterio {currentCriterionIndex + 1} / {CRITERIOS.length}
                      </span>
                      <span className="text-white/30 text-xs font-mono">
                        Escala 1 a {currentCriterion.max}
                      </span>
                    </div>
                    <h4 className="text-white text-lg font-bold tracking-tight mt-1">
                      {currentCriterion.label}
                    </h4>
                    <p className="text-white/60 text-xs mt-0.5 leading-relaxed">
                      {currentCriterion.desc}
                    </p>
                  </div>

                  {/* Valor del Criterio con Badge Dinámico */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className={`px-3 py-1.5 rounded-xl border text-sm font-bold flex items-center gap-1.5 ${getRatingBadgeColor(
                        ratings[currentCriterion.id] || (currentCriterion.max === 10 ? 5 : 3),
                        currentCriterion.max
                      )}`}
                    >
                      <span className="text-xs">⭐</span>
                      <span className="text-base font-mono">
                        {ratings[currentCriterion.id] || (currentCriterion.max === 10 ? 5 : 3)}
                      </span>
                      <span className="text-[10px] opacity-60">/ {currentCriterion.max}</span>
                    </div>
                  </div>
                </div>

                {/* Selección Rápida de Puntajes del Criterio */}
                <div className="mb-4">
                  <label className="text-white/40 text-[11px] uppercase tracking-wider block mb-2 font-medium">
                    Selecciona tu puntaje (1 - {currentCriterion.max}):
                  </label>
                  <div
                    className={`grid gap-1.5 ${
                      currentCriterion.max === 10
                        ? 'grid-cols-5 sm:grid-cols-10'
                        : 'grid-cols-5'
                    }`}
                  >
                    {Array.from({ length: currentCriterion.max }, (_, i) => i + 1).map(
                      (score) => {
                        const isSelected = ratings[currentCriterion.id] === score;
                        return (
                          <button
                            key={score}
                            type="button"
                            onClick={() => handleRatingChange(currentCriterion.id, score)}
                            className={`py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                              isSelected
                                ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white border-transparent scale-105 shadow-md shadow-[#f5576c]/40'
                                : 'bg-black/30 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {score}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Slider Ajuste Fino para Criterio */}
                <div className="space-y-1">
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
                    value={ratings[currentCriterion.id] || (currentCriterion.max === 10 ? 5 : 3)}
                    onChange={(e) => handleRatingChange(currentCriterion.id, e.target.value)}
                    className="w-full accent-[#f5576c] h-2 bg-white/10 rounded-lg cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #f5576c 0%, #f5576c ${
                        (((ratings[currentCriterion.id] || (currentCriterion.max === 10 ? 5 : 3)) - 1) /
                          (currentCriterion.max - 1)) *
                        100
                      }%, rgba(255,255,255,0.1) ${
                        (((ratings[currentCriterion.id] || (currentCriterion.max === 10 ? 5 : 3)) - 1) /
                          (currentCriterion.max - 1)) *
                        100
                      }%, rgba(255,255,255,0.1) 100%)`,
                    }}
                  />
                </div>
              </div>

              {/* Botones de Navegación BACK / NEXT para CRITERIOS */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (currentCriterionIndex > 0) {
                      setCurrentCriterionIndex((prev) => prev - 1);
                    } else {
                      if (shouldShowTracks && effectiveTracks.length > 0) {
                        setWizardStep('tracks');
                        setCurrentTrackIndex(effectiveTracks.length - 1);
                      } else {
                        setWizardStep('user');
                      }
                    }
                  }}
                  className="px-4 py-2.5 bg-white/10 border border-white/10 text-white/80 rounded-xl text-sm font-medium hover:bg-white/20 transition-all flex items-center gap-1.5"
                >
                  ⬅️ Anterior
                </button>

                <div className="text-white/40 text-xs font-mono hidden sm:block">
                  Criterio {currentCriterionIndex + 1} de {CRITERIOS.length}
                </div>

                {currentCriterionIndex < CRITERIOS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentCriterionIndex((prev) => prev + 1)}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white rounded-xl text-sm font-bold shadow-lg hover:scale-[1.02] transition-all flex items-center gap-1.5"
                  >
                    Siguiente ➡️
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setWizardStep('summary')}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-xl text-sm font-bold shadow-lg hover:scale-[1.02] transition-all flex items-center gap-1.5"
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
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/10 pb-3">
                  <h6 className="text-white text-sm font-bold flex items-center gap-2">
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
                      <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-3 py-1 rounded-full border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                        ★ Promedio Ponderado Final: {currentReviewScore.toFixed(1)} / 10
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Resumen de Usuario */}
                <div className="text-xs text-white/70 bg-black/30 p-2.5 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between gap-1">
                  <div>
                    <span className="text-white/30 block">Reviewer:</span>
                    <span className="font-semibold text-white">{userName}</span>
                  </div>
                  <div>
                    <span className="text-white/30 block">Correo:</span>
                    <span className="font-semibold text-white">{userEmail}</span>
                  </div>
                </div>

                {/* Resumen de Canciones */}
                {shouldShowTracks && effectiveTracks.length > 0 && (
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60 font-semibold flex items-center gap-1.5">
                        <span>🎵</span> Calificaciones de Canciones ({trackProgress}/{effectiveTracks.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setWizardStep('tracks')}
                        className="text-[11px] text-[#f093fb] hover:underline"
                      >
                        ✏️ Editar
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar pt-1">
                      {effectiveTracks.map((t, idx) => {
                        const score = getTrackRating(t, idx);
                        const trackName = getTrackName(t, idx);
                        return (
                          <span
                            key={getTrackKey(t, idx)}
                            className={`text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 border font-mono ${
                              score !== undefined
                                ? 'bg-white/5 text-white/80 border-white/10'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}
                          >
                            <span className="text-white/30">#{t.track_number || idx + 1}</span>
                            <span className="truncate max-w-[100px]">{trackName}</span>:
                            <span className="font-bold text-[#f5576c]">
                              {score !== undefined ? score : 'Sin calificar'}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Resumen de Criterios */}
                <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60 font-semibold flex items-center gap-1.5">
                      <span>📊</span> Criterios del Álbum
                    </span>
                    <button
                      type="button"
                      onClick={() => setWizardStep('criteria')}
                      className="text-[11px] text-[#f093fb] hover:underline"
                    >
                      ✏️ Editar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs pt-1">
                    {CRITERIOS.map((c) => (
                      <div
                        key={c.id}
                        className="bg-white/5 p-2 rounded-lg border border-white/5 flex flex-col justify-between"
                      >
                        <span className="text-white/40 text-[10px] truncate">{c.label}</span>
                        <span className="font-bold text-white text-sm font-mono mt-0.5">
                          {ratings[c.id]} / {c.max}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Campo de Comentario Adicional */}
                <div>
                  <label className="text-white/60 text-xs block mb-1 font-medium">
                    ¿Quieres agregar un comentario u opinión general? (Opcional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Escribe tus impresiones del álbum..."
                    rows="3"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#f5576c]/60 resize-none transition-colors"
                  />
                </div>
              </div>

              {/* Advertencias / Errores */}
              {error && (
                <div className="text-[#f5576c] text-xs bg-[#f5576c]/10 p-3 rounded-xl border border-[#f5576c]/20 flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}
              {success && (
                <div className="text-green-400 text-xs bg-green-400/10 p-3 rounded-xl border border-green-400/20 flex items-center gap-2">
                  <span>✅</span> ¡Review enviada con éxito! Muchas gracias.
                </div>
              )}

              {/* Botón Final de Envío */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={
                    isSubmitting ||
                    (shouldShowTracks && effectiveTracks.length > 0 && !areAllTracksRated)
                  }
                  className={`flex-1 py-3 bg-gradient-to-r ${
                    isEditing
                      ? 'from-amber-500 via-orange-500 to-amber-500 shadow-amber-500/20'
                      : isIndividual
                      ? 'from-blue-600 to-cyan-500 shadow-blue-500/20'
                      : 'from-[#f5576c] to-[#f093fb] shadow-[#f5576c]/20'
                  } text-white rounded-xl text-sm font-bold shadow-xl transition-all flex items-center justify-center gap-2 ${
                    isSubmitting ||
                    (shouldShowTracks && effectiveTracks.length > 0 && !areAllTracksRated)
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-[1.02]'
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
                    className="px-4 py-3 bg-white/5 border border-white/10 text-white/60 hover:text-white rounded-xl text-sm hover:bg-white/10 transition-all font-medium"
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
                    className="px-4 py-3 bg-white/5 border border-white/10 text-white/40 rounded-xl text-sm hover:bg-white/10 hover:text-white transition-all"
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
                  className="text-[11px] text-white/30 hover:text-rose-300 hover:underline transition-colors font-medium inline-flex items-center gap-1"
                >
                  <span>🗑️</span> Reiniciar todas las respuestas
                </button>
              </div>
            </div>
          )}
        </div>
        ) : (
          /* Botón CTA cuando no se ha calificado y el formulario está cerrado */
          <button
            onClick={() => setShowReviewForm(true)}
            className="w-full py-4 bg-gradient-to-r from-[#f5576c]/20 via-[#f093fb]/20 to-[#f5576c]/20 hover:from-[#f5576c]/30 hover:via-[#f093fb]/30 hover:to-[#f5576c]/30 border border-[#f5576c]/40 hover:border-[#f5576c]/70 rounded-2xl text-white hover:shadow-xl hover:shadow-[#f5576c]/15 transition-all text-sm font-bold flex items-center justify-center gap-2.5 group"
          >
            <span className="text-lg group-hover:scale-125 transition-transform">✍️</span>
            <span>Dejar tu Review para este Álbum</span>
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* SECCIÓN 2: REVIEWS GENERALES DEL ÁLBUM / COMUNIDAD     */}
      {/* ======================================================== */}
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
              ★ {average}/10 Promedio General
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
                weightedScore !== null
                  ? weightedScore.toFixed(1)
                  : review.rating_general
                  ? review.rating_general.toFixed(1)
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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isIndividual
                            ? 'bg-gradient-to-tr from-blue-600 to-cyan-400 text-white shadow-md'
                            : 'bg-gradient-to-tr from-[#f5576c] to-[#f093fb] text-white'
                        }`}
                      >
                        {(review.reviewer_name || 'A')[0].toUpperCase()}
                      </div>
                      <span className="text-white font-medium text-sm">
                        {review.reviewer_name || 'Anónimo'}
                      </span>
                      <span className="text-white/30 text-xs">
                        {review.created_at
                          ? new Date(review.created_at).toLocaleDateString(
                              'es-ES',
                              { day: 'numeric', month: 'short', year: 'numeric' }
                            )
                          : ''}
                      </span>
                    </div>
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

                  {review.comment && (
                    <p className="text-white/70 text-sm mt-2 italic bg-black/20 p-2.5 rounded-xl border border-white/5 leading-relaxed">
                      "{review.comment}"
                    </p>
                  )}

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
                      <p className="text-white/30 text-[9px] uppercase tracking-wider mb-1">
                        🎵 Reviews por canción
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(trackRatingsData).map(
                          ([trackId, rating]) => {
                            const trackName = getTrackDisplayName(
                              trackId,
                              effectiveTracks.length > 0 ? effectiveTracks : album?.tracks
                            );
                            return (
                              <span
                                key={trackId}
                                className={`text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                                  isIndividual
                                    ? 'text-cyan-200/80 bg-black/40 border-cyan-500/20'
                                    : 'text-white/30 bg-black/30 border-white/5'
                                }`}
                              >
                                <span className="text-cyan-400/60">🎵</span>
                                <span className="max-w-[120px] truncate" title={trackName}>
                                  {trackName}
                                </span>
                                : <span className="font-bold text-emerald-300 ml-1">★ {rating}</span>
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
    </div>
  );
}
