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

  useEffect(() => {
    if (user) {
      setUserName(user.name || user.email?.split('@')[0] || '');
      setUserEmail(user.email || '');
    }
  }, [user]);

  // Handle default wizard step based on login status and tracks availability
  useEffect(() => {
    if (user && userName && userEmail) {
      if (shouldShowTracks && tracks.length > 0) {
        setWizardStep('tracks');
      } else {
        setWizardStep('criteria');
      }
    }
  }, [user, userName, userEmail, shouldShowTracks, tracks]);

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

  const handleSubmitReview = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    if (hasAlreadyReviewed) {
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

    if (shouldShowTracks && tracks.length > 0) {
      const missingTracks = tracks.filter((track) => !trackRatings[track.id]);
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

    const reviewData = {
      albumId: album.id,
      reviewerName: userName.trim(),
      reviewerEmail: userEmail.trim(),
      trackRatings: trackRatings,
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
      await supabaseService.submitReview(reviewData);
      setSuccess(true);
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
      setWizardStep('user');
      setCurrentTrackIndex(0);
      setCurrentCriterionIndex(0);

      if (!isIndividual) {
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
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError(error.message || 'Error al enviar la review');
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
    ? tracks.length > 0 && tracks.every((track) => trackRatings[track.id] !== undefined)
    : true;
  const trackProgress = shouldShowTracks
    ? tracks.filter((track) => trackRatings[track.id] !== undefined).length
    : 0;

  const currentTrack = tracks[currentTrackIndex] || null;
  const currentCriterion = CRITERIOS[currentCriterionIndex] || CRITERIOS[0];

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
    <div className="mt-4 pt-4 border-t border-white/5">
      {/* Header de Reviews */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div className="flex items-center gap-3">
          <h4 className="text-white/80 text-sm tracking-wider uppercase flex items-center gap-2">
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
                <span className="text-white/60">Reviews de la Comunidad</span>
              </>
            ) : (
              <>
                <span className="text-[#f5576c]">🎧</span>
                <span className="text-white/60">Reviews del Club</span>
              </>
            )}
            <span className="text-white/40 text-xs font-normal bg-white/10 px-2.5 py-0.5 rounded-full border border-white/5">
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
            ★ {average}/10
          </span>
        )}
      </div>

      {/* Lista de reviews existentes */}
      {loading ? (
        <div className="text-white/20 text-sm py-4 text-center">
          <span className="w-2 h-2 bg-[#f5576c] rounded-full animate-pulse inline-block mr-2"></span>
          Cargando reviews...
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar mb-4">
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
                            tracks || album?.tracks
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
                              : <span className="font-bold">{rating}</span>
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
        <div className="text-white/20 text-sm py-6 text-center border border-dashed border-white/5 rounded-xl mb-4">
          No hay reviews para este álbum.
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> </span>
          <span className="text-white/10 text-xs">
            ¡Sé el primero en dejar tu review!
          </span>
        </div>
      )}

      {/* Botón de Abrir Formulario - Solo para no individuales */}
      {!isIndividual && !showReviewForm && (
        hasAlreadyReviewed ? (
          <div className="mt-2 w-full py-2.5 px-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm font-semibold flex items-center justify-between gap-2 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-xs font-bold">
                ✓
              </span>
              <span className="text-xs sm:text-sm">Ya diste tu review a este álbum</span>
            </div>
            <button
              onClick={() => setShowReviewForm(true)}
              className="text-xs text-emerald-200 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/30 px-3 py-1 rounded-lg border border-emerald-400/30 transition-all font-medium"
            >
              Ver mi review
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowReviewForm(true)}
            className="mt-2 w-full py-3 bg-gradient-to-r from-[#f5576c]/20 via-[#f093fb]/20 to-[#f5576c]/20 border border-[#f5576c]/30 rounded-xl text-white hover:border-[#f5576c]/60 hover:shadow-lg hover:shadow-[#f5576c]/10 transition-all text-sm font-semibold flex items-center justify-center gap-2"
          >
            <span>✍️</span> Dejar tu Review
          </button>
        )
      )}

      {/* FORMULARIO WIZARD STEP-BY-STEP O VISTA DE YA CALIFICADO */}
      {(showReviewForm || isIndividual) && (
        hasAlreadyReviewed ? (
          <div
            className={`mt-4 rounded-3xl p-5 sm:p-6 border shadow-2xl relative overflow-hidden transition-all duration-500 ${
              isIndividual
                ? 'bg-gradient-to-br from-[#0b172a] via-[#0d1d36] to-[#081120] border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.15)]'
                : 'bg-gradient-to-br from-[#0e1b2b] to-[#09111c] border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.12)]'
            }`}
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                  ✓
                </div>
                <div>
                  <h5 className="text-white font-bold text-sm sm:text-base">Tu Review Registrada</h5>
                  <p className="text-emerald-400/80 text-xs">
                    Ya calificaste este álbum. No se permite enviar una segunda review.
                  </p>
                </div>
              </div>
              {!isIndividual && (
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="text-white/40 hover:text-white text-sm bg-white/5 hover:bg-white/10 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                  title="Cerrar"
                >
                  ✕
                </button>
              )}
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
                          tracks || album?.tracks
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
        ) : (
        <div
          className={`mt-4 rounded-3xl p-5 sm:p-6 border shadow-2xl relative overflow-hidden transition-all duration-500 ${
            isIndividual
              ? 'bg-gradient-to-br from-[#0b1324] via-[#0e1a30] to-[#070d1a] border-blue-500/40 shadow-[0_0_50px_rgba(59,130,246,0.18)]'
              : 'bg-gradient-to-br from-[#121225] to-[#0a0a14] border-[#f5576c]/30 shadow-2xl'
          }`}
        >
          {/* Luces traseras decorativas para Individual */}
          {isIndividual && (
            <>
              <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
            </>
          )}

          {/* Header del Formulario */}
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10 relative z-10">
            <h5 className="text-white font-bold text-base flex items-center gap-2">
              <span className={isIndividual ? 'text-blue-400' : 'text-[#f5576c]'}>
                {isIndividual ? '📌' : '✍️'}
              </span>
              {isIndividual ? (
                <span className="bg-gradient-to-r from-blue-300 via-cyan-200 to-white bg-clip-text text-transparent font-bold">
                  Review de Álbum Individual
                </span>
              ) : isFromSpotify ? (
                <>Nueva Review · Álbum de Spotify</>
              ) : (
                <>Nueva Review · Álbum del Club</>
              )}
            </h5>
            {!isIndividual && (
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
            )}
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

            {shouldShowTracks && tracks.length > 0 && (
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
                  2. Canciones ({trackProgress}/{tracks.length})
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
                {shouldShowTracks && tracks.length > 0 ? '3. Criterios' : '2. Criterios'}
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
                    if (shouldShowTracks && tracks.length > 0) {
                      setWizardStep('tracks');
                    } else {
                      setWizardStep('criteria');
                    }
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white rounded-xl text-sm font-bold shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2"
                >
                  Continuar{' '}
                  {shouldShowTracks && tracks.length > 0 ? 'a Canciones 🎵' : 'a Criterios 📊'} ➔
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: CANCIONES (STRATEGY BACK / NEXT) */}
          {/* ======================================================== */}
          {wizardStep === 'tracks' && shouldShowTracks && tracks.length > 0 && currentTrack && (
            <div className="space-y-4 animate-fadeIn">
              {/* Progress Bar de Canciones */}
              <div>
                <div className="flex justify-between items-center text-xs text-white/60 mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5 text-white">
                    <span className="text-[#f5576c]">🎵</span> Canción {currentTrackIndex + 1} de {tracks.length}
                  </span>
                  <span className="text-[#f093fb]">
                    {trackProgress} / {tracks.length} calificadas
                  </span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#f5576c] to-[#f093fb] h-full transition-all duration-300"
                    style={{
                      width: `${((currentTrackIndex + 1) / tracks.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Strip selector de canciones (Pills/Drawer rápido) */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
                {tracks.map((t, idx) => {
                  const isRated = trackRatings[t.id] !== undefined;
                  const isActive = idx === currentTrackIndex;
                  return (
                    <button
                      key={t.id || idx}
                      type="button"
                      onClick={() => setCurrentTrackIndex(idx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1 flex-shrink-0 border ${
                        isActive
                          ? 'bg-[#f5576c] text-white border-[#f5576c] shadow-lg shadow-[#f5576c]/30 ring-2 ring-[#f5576c]/50'
                          : isRated
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-black/30 text-white/40 border-white/10 hover:bg-white/10'
                      }`}
                      title={t.name}
                    >
                      <span>#{t.track_number || idx + 1}</span>
                      {isRated && <span className="text-[10px]">✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* CARD DE CANCIÓN ACTUAL */}
              <div className="bg-gradient-to-b from-white/10 to-black/40 rounded-2xl p-5 border border-white/10 shadow-xl relative">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-white/10">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs font-mono bg-white/10 px-2 py-0.5 rounded-md">
                        Pista #{currentTrack.track_number || currentTrackIndex + 1}
                      </span>
                      {formatDuration(currentTrack.duration_ms) && (
                        <span className="text-white/30 text-xs font-mono">
                          ⏱️ {formatDuration(currentTrack.duration_ms)}
                        </span>
                      )}
                    </div>
                    <h4 className="text-white text-lg font-bold tracking-tight mt-1 truncate">
                      {currentTrack.name}
                    </h4>
                  </div>

                  {/* Valor de la Calificación con Badge Dinámico */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className={`px-3 py-1.5 rounded-xl border text-sm font-bold flex items-center gap-1.5 ${getRatingBadgeColor(
                        trackRatings[currentTrack.id] || 5,
                        10
                      )}`}
                    >
                      <span className="text-xs">⭐</span>
                      <span className="text-base font-mono">
                        {trackRatings[currentTrack.id] !== undefined
                          ? trackRatings[currentTrack.id]
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
                      const isSelected = trackRatings[currentTrack.id] === score;
                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleTrackRatingChange(currentTrack.id, score)}
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
                    value={trackRatings[currentTrack.id] !== undefined ? trackRatings[currentTrack.id] : 5}
                    onChange={(e) => handleTrackRatingChange(currentTrack.id, e.target.value)}
                    className="w-full accent-[#f5576c] h-2 bg-white/10 rounded-lg cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #f5576c 0%, #f5576c ${
                        (((trackRatings[currentTrack.id] !== undefined ? trackRatings[currentTrack.id] : 5) - 1) / 9) * 100
                      }%, rgba(255,255,255,0.1) ${
                        (((trackRatings[currentTrack.id] !== undefined ? trackRatings[currentTrack.id] : 5) - 1) / 9) * 100
                      }%, rgba(255,255,255,0.1) 100%)`,
                    }}
                  />
                </div>
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
                  {currentTrackIndex + 1} / {tracks.length}
                </div>

                {currentTrackIndex < tracks.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (trackRatings[currentTrack.id] === undefined) {
                        handleTrackRatingChange(currentTrack.id, 5);
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
                      if (trackRatings[currentTrack.id] === undefined) {
                        handleTrackRatingChange(currentTrack.id, 5);
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
          {/* STEP 3: CRITERIOS FIJOS (STRATEGY BACK / NEXT) */}
          {/* ======================================================== */}
          {wizardStep === 'criteria' && currentCriterion && (
            <div className="space-y-4 animate-fadeIn">
              {/* Progress Bar Criterios */}
              <div>
                <div className="flex justify-between items-center text-xs text-white/60 mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5 text-white">
                    <span className="text-[#f5576c]">📊</span> Criterio {currentCriterionIndex + 1} de {CRITERIOS.length}
                  </span>
                  <span className="text-[#f093fb]">
                    {currentCriterionIndex + 1} / {CRITERIOS.length} completados
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

              {/* Strip selector de criterios (Pills rápidos) */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
                {CRITERIOS.map((c, idx) => {
                  const isActive = idx === currentCriterionIndex;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCurrentCriterionIndex(idx)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 flex-shrink-0 border ${
                        isActive
                          ? 'bg-[#f5576c] text-white border-[#f5576c] shadow-lg shadow-[#f5576c]/30 ring-2 ring-[#f5576c]/50'
                          : 'bg-black/30 text-white/60 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span>{c.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* CARD DEL CRITERIO ACTUAL */}
              <div className="bg-gradient-to-b from-white/10 to-black/40 rounded-2xl p-5 border border-white/10 shadow-xl relative">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-3 border-b border-white/10">
                  <div>
                    <span className="text-white/40 text-[10px] uppercase tracking-wider font-semibold">
                      Criterio Fijo del Club #{currentCriterionIndex + 1}
                    </span>
                    <h4 className="text-white text-lg font-bold tracking-tight mt-0.5">
                      {currentCriterion.label}
                    </h4>
                  </div>

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

                <p className="text-white/60 text-xs mb-4 italic leading-relaxed bg-black/20 p-2.5 rounded-xl border border-white/5">
                  💡 {currentCriterion.desc}
                </p>

                {/* Presets de Calificación (Pills de botones) */}
                <div className="mb-4">
                  <label className="text-white/40 text-[11px] uppercase tracking-wider block mb-2 font-medium">
                    Selecciona tu puntaje (1 a {currentCriterion.max}):
                  </label>
                  <div
                    className={`grid gap-1.5 ${
                      currentCriterion.max === 10 ? 'grid-cols-5 sm:grid-cols-10' : 'grid-cols-5'
                    }`}
                  >
                    {Array.from({ length: currentCriterion.max }, (_, i) => i + 1).map((score) => {
                      const isSelected = ratings[currentCriterion.id] === score;
                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleRatingChange(currentCriterion.id, score)}
                          className={`py-2.5 rounded-xl text-sm font-bold font-mono transition-all border ${
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
                      if (shouldShowTracks && tracks.length > 0) {
                        setWizardStep('tracks');
                        setCurrentTrackIndex(tracks.length - 1);
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
                {shouldShowTracks && tracks.length > 0 && (
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60 font-semibold flex items-center gap-1.5">
                        <span>🎵</span> Calificaciones de Canciones ({trackProgress}/{tracks.length})
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
                      {tracks.map((t, idx) => {
                        const score = trackRatings[t.id];
                        return (
                          <span
                            key={t.id || idx}
                            className={`text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 border font-mono ${
                              score !== undefined
                                ? 'bg-white/5 text-white/80 border-white/10'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}
                          >
                            <span className="text-white/30">#{t.track_number || idx + 1}</span>
                            <span className="truncate max-w-[100px]">{t.name}</span>:
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
                    (shouldShowTracks && tracks.length > 0 && !areAllTracksRated)
                  }
                  className={`flex-1 py-3 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white rounded-xl text-sm font-bold shadow-xl shadow-[#f5576c]/20 transition-all flex items-center justify-center gap-2 ${
                    isSubmitting ||
                    (shouldShowTracks && tracks.length > 0 && !areAllTracksRated)
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-[1.02]'
                  }`}
                >
                  {isSubmitting ? '🔄 Enviando Review...' : '📤 Enviar Review Definitiva'}
                </button>

                {!isIndividual && (
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
                )}
              </div>
            </div>
          )}
        </div>
        )
      )}
    </div>
  );
}
