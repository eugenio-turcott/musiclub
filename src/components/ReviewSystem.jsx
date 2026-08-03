// src/components/ReviewSystem.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../services/supabaseClient';

const CRITERIOS = [
  { id: 'produccion', label: '🎛️ Producción', max: 5 },
  { id: 'composicion', label: '🎵 Composición', max: 5 },
  { id: 'letras', label: '📝 Letras', max: 5 },
  { id: 'originalidad', label: '💡 Originalidad', max: 5 },
  { id: 'cohesion', label: '🔗 Cohesión', max: 5 },
  { id: 'replay', label: '🔄 Replay Value', max: 5 },
  { id: 'general', label: '⭐ Calificación General', max: 10 },
];

export function ReviewSystem({
  album,
  onReviewSubmitted,
  isAdmin,
  isFromSpotify = false,
  isIndividual = false, // 👈 NUEVA PROP
  tracks = [],
  user = null, // 👈 USUARIO LOGUEADO
}) {
  const [showReviewForm, setShowReviewForm] = useState(isIndividual); // 👈 SI ES INDIVIDUAL, SIEMPRE ABIERTO
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [ratings, setRatings] = useState({});
  const [trackRatings, setTrackRatings] = useState({});
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTrackReviews, setShowTrackReviews] = useState(false);

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

  // 👈 SI EL USUARIO ESTÁ LOGUEADO, AUTOCOMPLETAR CAMPOS
  useEffect(() => {
    if (user) {
      setUserName(user.name || user.email?.split('@')[0] || '');
      setUserEmail(user.email || '');
    }
  }, [user]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    const missingCriterios = CRITERIOS.filter((c) => !ratings[c.id]);
    if (missingCriterios.length > 0) {
      setError(`Por favor califica todos los criterios`);
      setIsSubmitting(false);
      return;
    }

    if (tracks.length > 0) {
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
      setIsSubmitting(false);
      return;
    }

    if (!userEmail.trim() || !userEmail.includes('@')) {
      setError('Por favor ingresa un email válido');
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
      setRatings({});
      setTrackRatings({});
      setComment('');

      // 👈 SI ES INDIVIDUAL, NO CERRAR EL FORMULARIO
      if (!isIndividual) {
        setUserName('');
        setUserEmail('');
        setShowReviewForm(false);
        setShowTrackReviews(false);
      } else {
        // Si es individual, mantener los datos del usuario
        if (user) {
          setUserName(user.name || user.email?.split('@')[0] || '');
          setUserEmail(user.email || '');
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
      [criterioId]: parseFloat(value),
    }));
  };

  const handleTrackRatingChange = (trackId, value) => {
    setTrackRatings((prev) => ({
      ...prev,
      [trackId]: parseFloat(value),
    }));
  };

  const getAverageRating = (reviewList) => {
    if (!reviewList || reviewList.length === 0) return null;

    const total = reviewList.reduce((sum, review) => {
      const values = [
        review.rating_produccion,
        review.rating_composicion,
        review.rating_letras,
        review.rating_originalidad,
        review.rating_cohesion,
        review.rating_replay,
        review.rating_general,
      ].filter((v) => v !== null && v !== undefined);

      if (values.length === 0) return sum;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return sum + avg;
    }, 0);

    return (total / reviewList.length).toFixed(1);
  };

  const average = getAverageRating(reviews);
  const areAllTracksRated =
    tracks.length > 0 && tracks.every((track) => trackRatings[track.id]);
  const trackProgress = tracks.filter((track) => trackRatings[track.id]).length;

  if (!album) return null;

  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      {/* Header de Reviews */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div className="flex items-center gap-3">
          <h4 className="text-white/80 text-sm tracking-wider uppercase flex items-center gap-2">
            {isIndividual ? (
              <>
                <span className="text-blue-400">📌</span>
                <span className="text-white/60">
                  Reviews de Álbum Individual
                </span>
              </>
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
            <span className="text-white/20 text-xs font-normal bg-white/5 px-2 py-0.5 rounded-full">
              {reviews.length}
            </span>
          </h4>
          {tracks.length > 0 && (
            <button
              onClick={() => setShowTrackReviews(!showTrackReviews)}
              className="text-[10px] text-white/30 hover:text-white/60 transition-colors bg-white/5 px-2 py-0.5 rounded-full border border-white/5"
            >
              {showTrackReviews ? '📝 Ocultar canciones' : '🎵 Ver canciones'}
            </button>
          )}
        </div>
        {average && (
          <span className="text-[#f5576c] text-sm font-bold bg-[#f5576c]/10 px-3 py-1 rounded-full border border-[#f5576c]/20 flex items-center gap-1">
            ★ {average}/10
          </span>
        )}
      </div>

      {/* Canciones para review */}
      {tracks.length > 0 && (
        <div className="mb-4 bg-white/5 rounded-xl p-3 border border-white/5">
          <div className="flex justify-between items-center mb-2">
            <h5 className="text-white/40 text-[10px] uppercase tracking-wider flex items-center gap-2">
              <span>🎵</span> Canciones del álbum
              {showReviewForm && (
                <span className="text-white/20 text-[8px]">
                  ({trackProgress}/{tracks.length} calificadas)
                </span>
              )}
            </h5>
            {showReviewForm && tracks.length > 0 && (
              <span
                className={`text-[8px] ${areAllTracksRated ? 'text-green-400' : 'text-yellow-400'}`}
              >
                {areAllTracksRated
                  ? '✅ Todas calificadas'
                  : '⚠️ Obligatorio calificar todas'}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {tracks.map((track, idx) => (
              <div
                key={track.id || idx}
                className={`flex items-center gap-2 bg-black/30 px-2 py-1 rounded-lg ${
                  showReviewForm ? 'border-l-2 border-[#f5576c]/30' : ''
                }`}
              >
                <span className="text-white/10 text-xs w-5">
                  {track.track_number || idx + 1}.
                </span>
                <span className="text-white/50 text-xs truncate flex-1">
                  {track.name}
                </span>
                {showReviewForm ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={trackRatings[track.id] || 5}
                      onChange={(e) =>
                        handleTrackRatingChange(track.id, e.target.value)
                      }
                      className="w-16 accent-[#f5576c] h-1 cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #f5576c 0%, #f5576c ${((trackRatings[track.id] || 5) / 10) * 100}%, rgba(255,255,255,0.1) ${((trackRatings[track.id] || 5) / 10) * 100}%, rgba(255,255,255,0.1) 100%)`,
                      }}
                    />
                    <span className="text-white/40 text-xs w-5 text-right font-mono">
                      {trackRatings[track.id] || 5}
                    </span>
                  </div>
                ) : (
                  <span className="text-white/20 text-[8px]">🎵</span>
                )}
              </div>
            ))}
          </div>
          {showReviewForm && tracks.length > 0 && (
            <div className="mt-2 text-[8px] text-white/20 text-center">
              {areAllTracksRated ? (
                <span className="text-green-400">
                  ✅ Todas las canciones calificadas
                </span>
              ) : (
                <span className="text-yellow-400">
                  ⚠️ Debes calificar todas las canciones (
                  {tracks.length - trackProgress} pendientes)
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lista de reviews existentes */}
      {loading ? (
        <div className="text-white/20 text-sm py-4 text-center">
          <span className="w-2 h-2 bg-[#f5576c] rounded-full animate-pulse inline-block mr-2"></span>
          Cargando reviews...
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {reviews.map((review, idx) => {
            const values = [
              review.rating_produccion,
              review.rating_composicion,
              review.rating_letras,
              review.rating_originalidad,
              review.rating_cohesion,
              review.rating_replay,
              review.rating_general,
            ].filter((v) => v !== null && v !== undefined);

            const avg =
              values.length > 0
                ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
                : 'N/A';

            const trackRatingsData = review.track_ratings || {};

            return (
              <div
                key={idx}
                className="bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white/80 text-sm font-medium">
                      {review.reviewer_name || 'Anónimo'}
                    </span>
                    {review.reviewer_email && (
                      <span className="text-white/20 text-xs">
                        {review.reviewer_email}
                      </span>
                    )}
                    <span className="text-white/20 text-xs">
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString(
                            'es-ES',
                            { day: 'numeric', month: 'short', year: 'numeric' }
                          )
                        : ''}
                    </span>
                  </div>
                  <span className="text-[#f5576c] text-sm font-bold bg-[#f5576c]/10 px-2 py-0.5 rounded-full">
                    ★ {avg}
                  </span>
                </div>

                {review.comment && (
                  <p className="text-white/40 text-sm mt-1 italic">
                    "{review.comment}"
                  </p>
                )}

                <div className="flex flex-wrap gap-1 mt-2">
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
                          className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/5"
                        >
                          {label}: {review[key]}
                        </span>
                      )
                  )}
                </div>

                {Object.keys(trackRatingsData).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <p className="text-white/20 text-[9px] uppercase tracking-wider mb-1">
                      🎵 Reviews por canción
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(trackRatingsData).map(
                        ([trackId, rating]) => {
                          const track = tracks.find(
                            (t) => t.id === trackId || String(t.id) === trackId
                          );
                          return (
                            <span
                              key={trackId}
                              className="text-[9px] text-white/30 bg-black/30 px-2 py-0.5 rounded-full flex items-center gap-1"
                            >
                              <span className="text-white/10">🎵</span>
                              {track
                                ? track.name.substring(0, 15)
                                : trackId.substring(0, 10)}
                              : {rating}
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
          No hay reviews para este álbum.
          <br className="sm:hidden" />
          <span className="text-white/10 text-xs">
            ¡Sé el primero en dejar tu review!
          </span>
        </div>
      )}

      {/* 👈 BOTÓN DE REVIEW - SOLO PARA NO INDIVIDUALES */}
      {!isIndividual && !showReviewForm && (
        <button
          onClick={() => setShowReviewForm(true)}
          className="mt-3 w-full py-2.5 bg-gradient-to-r from-[#f5576c]/20 to-[#f093fb]/20 border border-[#f5576c]/30 rounded-xl text-white/70 hover:bg-gradient-to-r hover:from-[#f5576c]/30 hover:to-[#f093fb]/30 hover:text-white transition-all text-sm font-medium"
        >
          ✍️ Dejar tu Review
        </button>
      )}

      {/* 👈 FORMULARIO - SIEMPRE VISIBLE PARA INDIVIDUALES, OPCIONAL PARA EL RESTO */}
      {(showReviewForm || isIndividual) && (
        <form
          onSubmit={handleSubmitReview}
          className={`mt-4 bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-4 border ${
            isIndividual ? 'border-blue-500/30' : 'border-white/10'
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h5 className="text-white/60 text-sm font-medium flex items-center gap-2">
              <span
                className={isIndividual ? 'text-blue-400' : 'text-[#f5576c]'}
              >
                {isIndividual ? '📌' : '✍️'}
              </span>
              {isIndividual ? (
                <>Review de Álbum Individual</>
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
                  setShowTrackReviews(false);
                }}
                className="text-white/20 hover:text-white/40 text-sm transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          {/* 👈 SI EL USUARIO NO ESTÁ LOGUEADO, MOSTRAR MENSAJE */}
          {!user && isIndividual && (
            <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
              <p className="text-yellow-400/80 text-xs flex items-center gap-2">
                <span>⚠️</span>
                Inicia sesión para dejar tu review. Si ya iniciaste sesión,
                asegúrate de que tus datos estén cargados.
              </p>
            </div>
          )}

          {/* Datos del usuario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-white/30 text-[10px] uppercase tracking-wider block mb-1">
                Tu nombre *
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#f5576c]/50 transition-colors"
                required
                disabled={!!user} // 👈 Si está logueado, no editable
              />
            </div>
            <div>
              <label className="text-white/30 text-[10px] uppercase tracking-wider block mb-1">
                Tu email *
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#f5576c]/50 transition-colors"
                required
                disabled={!!user} // 👈 Si está logueado, no editable
              />
              {user && isIndividual && (
                <p className="text-white/20 text-[8px] mt-1">
                  ✓ Usando tu cuenta de Google
                </p>
              )}
            </div>
          </div>

          {/* Criterios de calificación */}
          <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">
              Califica cada criterio
            </p>
            {CRITERIOS.map((criterio) => {
              const isGeneral = criterio.id === 'general';
              const maxValue = criterio.max;

              return (
                <div
                  key={criterio.id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-black/20 rounded-xl px-3 py-2 ${
                    isGeneral ? 'border-l-2 border-[#f5576c]/30' : ''
                  }`}
                >
                  <span
                    className={`text-xs w-32 flex-shrink-0 ${isGeneral ? 'text-white/60' : 'text-white/40'}`}
                  >
                    {criterio.label}
                    {isGeneral && (
                      <span className="text-[#f5576c] text-[8px] ml-1">
                        (1-10)
                      </span>
                    )}
                    {!isGeneral && (
                      <span className="text-white/20 text-[8px] ml-1">
                        (1-5)
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2 w-full sm:flex-1">
                    <input
                      type="range"
                      min="1"
                      max={maxValue}
                      step="0.5"
                      value={ratings[criterio.id] || (isGeneral ? 5 : 3)}
                      onChange={(e) =>
                        handleRatingChange(criterio.id, e.target.value)
                      }
                      className="flex-1 accent-[#f5576c] h-1 cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #f5576c 0%, #f5576c ${((ratings[criterio.id] || (isGeneral ? 5 : 3)) / maxValue) * 100}%, rgba(255,255,255,0.1) ${((ratings[criterio.id] || (isGeneral ? 5 : 3)) / maxValue) * 100}%, rgba(255,255,255,0.1) 100%)`,
                      }}
                    />
                    <span className="text-white/60 text-xs w-8 text-right flex-shrink-0 font-mono">
                      {ratings[criterio.id] || (isGeneral ? 5 : 3)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Indicador obligatorio de canciones */}
          {tracks.length > 0 && (
            <div className="mb-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-2">
              <p className="text-yellow-400/60 text-[10px] flex items-center gap-2">
                <span>⚠️</span>
                {areAllTracksRated ? (
                  <span className="text-green-400">
                    ✅ Todas las canciones calificadas
                  </span>
                ) : (
                  <span>
                    Obligatorio calificar todas las canciones (
                    {tracks.length - trackProgress} pendientes)
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Comentario */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="¿Qué te pareció el álbum? (opcional)"
            rows="2"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#f5576c]/50 mb-3 resize-none transition-colors"
          />

          {/* Mensajes */}
          {error && (
            <div className="text-[#f5576c] text-xs mb-3 bg-[#f5576c]/10 px-3 py-2 rounded-lg border border-[#f5576c]/10">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="text-green-400 text-xs mb-3 bg-green-400/10 px-3 py-2 rounded-lg border border-green-400/10">
              ✅ ¡Review enviada con éxito! Gracias por tu participación.
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              disabled={
                isSubmitting || (tracks.length > 0 && !areAllTracksRated)
              }
              className={`flex-1 py-2.5 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white rounded-xl text-sm font-bold transition-all ${
                isSubmitting || (tracks.length > 0 && !areAllTracksRated)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-[1.02] shadow-lg shadow-[#f5576c]/20'
              }`}
            >
              {isSubmitting ? '🔄 Enviando...' : '📤 Enviar Review'}
            </button>
            {!isIndividual && (
              <button
                type="button"
                onClick={() => {
                  setShowReviewForm(false);
                  setShowTrackReviews(false);
                }}
                className="px-4 py-2.5 bg-white/5 border border-white/10 text-white/40 rounded-xl text-sm hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
            )}
          </div>

          <p className="text-white/20 text-[10px] text-center mt-2">
            Tu review se guardará en la base de datos
          </p>
        </form>
      )}
    </div>
  );
}
