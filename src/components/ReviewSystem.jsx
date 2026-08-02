// src/components/ReviewSystem.jsx
import React, { useState, useEffect, useCallback } from "react";
import { supabaseService } from "../services/supabaseClient";

const CRITERIOS = [
  { id: "produccion", label: "🎛️ Producción", max: 10 },
  { id: "composicion", label: "🎵 Composición", max: 10 },
  { id: "letras", label: "📝 Letras", max: 10 },
  { id: "originalidad", label: "💡 Originalidad", max: 10 },
  { id: "cohesion", label: "🔗 Cohesión", max: 10 },
  { id: "replay", label: "🔄 Replay Value", max: 10 },
  { id: "general", label: "⭐ Calificación General", max: 10 },
];

export function ReviewSystem({ album, onReviewSubmitted, isAdmin }) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReviews = useCallback(async () => {
    if (!album || !album.id) {
      console.warn("No album id available");
      return;
    }

    setLoading(true);
    try {
      const data = await supabaseService.getReviews(album.id);
      setReviews(data || []);
    } catch (error) {
      console.error("Error loading reviews:", error);
    }
    setLoading(false);
  }, [album]);

  useEffect(() => {
    if (album && album.id) {
      loadReviews();
    }
  }, [album, loadReviews]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    // Validar que todos los criterios estén calificados
    const missingCriterios = CRITERIOS.filter((c) => !ratings[c.id]);
    if (missingCriterios.length > 0) {
      setError(`Por favor califica todos los criterios`);
      setIsSubmitting(false);
      return;
    }

    if (!userName.trim()) {
      setError("Por favor ingresa tu nombre");
      setIsSubmitting(false);
      return;
    }

    if (!userEmail.trim() || !userEmail.includes("@")) {
      setError("Por favor ingresa un email válido");
      setIsSubmitting(false);
      return;
    }

    const reviewData = {
      albumId: album.id,
      reviewerName: userName.trim(),
      reviewerEmail: userEmail.trim(),
      trackRatings: {},
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
      setComment("");
      setUserName("");
      setUserEmail("");
      setShowReviewForm(false);
      await loadReviews();
      if (onReviewSubmitted) onReviewSubmitted();
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError(error.message || "Error al enviar la review");
    }
    setIsSubmitting(false);
  };

  const handleRatingChange = (criterioId, value) => {
    setRatings((prev) => ({
      ...prev,
      [criterioId]: parseFloat(value),
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

  if (!album) return null;

  return (
    <div className="mt-6 pt-6 border-t border-white/5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <h4 className="text-white/80 text-sm tracking-wider uppercase flex items-center gap-2">
          🎧 Reviews
          <span className="text-white/20 text-xs font-normal">
            ({reviews.length})
          </span>
        </h4>
        {average && (
          <span className="text-[#f5576c] text-sm font-bold bg-[#f5576c]/10 px-3 py-1 rounded-full border border-[#f5576c]/20">
            ★ {average}/10
          </span>
        )}
      </div>

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
                : "N/A";

            return (
              <div
                key={idx}
                className="bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                  <div>
                    <span className="text-white/80 text-sm font-medium">
                      {review.reviewer_name || "Anónimo"}
                    </span>
                    {review.reviewer_email && (
                      <span className="text-white/20 text-xs ml-2">
                        {review.reviewer_email}
                      </span>
                    )}
                    <span className="text-white/20 text-xs ml-2">
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString(
                            "es-ES",
                          )
                        : ""}
                    </span>
                  </div>
                  <span className="text-[#f5576c] text-sm font-bold">
                    ★ {avg}
                  </span>
                </div>

                {review.comment && (
                  <p className="text-white/40 text-sm mt-1">{review.comment}</p>
                )}

                <div className="flex flex-wrap gap-1 mt-2">
                  {[
                    { key: "rating_produccion", label: "🎛️" },
                    { key: "rating_composicion", label: "🎵" },
                    { key: "rating_letras", label: "📝" },
                    { key: "rating_originalidad", label: "💡" },
                    { key: "rating_cohesion", label: "🔗" },
                    { key: "rating_replay", label: "🔄" },
                    { key: "rating_general", label: "⭐" },
                  ].map(
                    ({ key, label }) =>
                      review[key] && (
                        <span
                          key={key}
                          className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full"
                        >
                          {label}: {review[key]}
                        </span>
                      ),
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-white/20 text-sm py-4 text-center border border-dashed border-white/5 rounded-xl">
          No hay reviews para este álbum.
          <br className="sm:hidden" />
          <span className="text-white/10 text-xs">
            ¡Sé el primero en dejar tu review!
          </span>
        </div>
      )}

      {/* Botón para dejar review */}
      {!showReviewForm && (
        <button
          onClick={() => setShowReviewForm(true)}
          className="mt-3 w-full py-2 bg-gradient-to-r from-[#f5576c]/20 to-[#f093fb]/20 border border-[#f5576c]/30 rounded-xl text-white/70 hover:bg-gradient-to-r hover:from-[#f5576c]/30 hover:to-[#f093fb]/30 hover:text-white transition-all text-sm"
        >
          ✍️ Dejar tu Review
        </button>
      )}

      {/* Formulario de review */}
      {showReviewForm && (
        <form
          onSubmit={handleSubmitReview}
          className="mt-4 bg-white/5 rounded-2xl p-4 border border-white/10"
        >
          <div className="flex justify-between items-center mb-3">
            <h5 className="text-white/60 text-sm">Nueva Review</h5>
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="text-white/20 hover:text-white/40 text-sm"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Tu nombre *"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#f5576c]/50"
              required
            />
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="Tu email *"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#f5576c]/50"
              required
            />
          </div>

          <div className="space-y-2 mb-3 max-h-[300px] overflow-y-auto pr-2">
            {CRITERIOS.map((criterio) => (
              <div
                key={criterio.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-2"
              >
                <span className="text-white/40 text-xs w-28 flex-shrink-0">
                  {criterio.label}
                </span>
                <div className="flex items-center gap-2 w-full sm:flex-1">
                  <input
                    type="range"
                    min="1"
                    max={criterio.max}
                    step="0.5"
                    value={ratings[criterio.id] || 5}
                    onChange={(e) =>
                      handleRatingChange(criterio.id, e.target.value)
                    }
                    className="flex-1 accent-[#f5576c] h-1"
                    style={{
                      background: `linear-gradient(to right, #f5576c 0%, #f5576c ${((ratings[criterio.id] || 5) / criterio.max) * 100}%, rgba(255,255,255,0.1) ${((ratings[criterio.id] || 5) / criterio.max) * 100}%, rgba(255,255,255,0.1) 100%)`,
                    }}
                  />
                  <span className="text-white/60 text-xs w-8 text-right flex-shrink-0">
                    {ratings[criterio.id] || 5}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="¿Qué te pareció el álbum? (opcional)"
            rows="2"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#f5576c]/50 mb-3 resize-none"
          />

          {error && (
            <div className="text-[#f5576c] text-xs mb-3 bg-[#f5576c]/10 px-3 py-2 rounded-lg">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="text-green-400 text-xs mb-3 bg-green-400/10 px-3 py-2 rounded-lg">
              ✅ ¡Review enviada con éxito! Gracias por tu participación.
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white rounded-xl text-sm font-bold transition-all ${
              isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:scale-[1.02]"
            }`}
          >
            {isSubmitting ? "Enviando..." : "📤 Enviar Review"}
          </button>

          <p className="text-white/20 text-[10px] text-center mt-2">
            Tu review se guardará en Supabase
          </p>
        </form>
      )}
    </div>
  );
}
