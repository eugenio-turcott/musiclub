import React, { useState, useEffect, useCallback } from "react";
import { reviewsApi } from "../services/api";

export function Rankings({ albums }) {
  const [rankings, setRankings] = useState({
    topReviewers: [],
    topAlbums: [],
    loading: true,
    totalReviews: 0,
  });

  const loadAllReviews = useCallback(async () => {
    setRankings((prev) => ({ ...prev, loading: true }));

    try {
      const result = await reviewsApi.getAllReviews(albums);

      if (!result.success || !result.data) {
        throw new Error("Error al cargar reviews");
      }

      const allReviews = result.data;

      // Calcular estadísticas por reviewer
      const reviewerStats = {};
      allReviews.forEach((review) => {
        if (!reviewerStats[review.reviewer]) {
          reviewerStats[review.reviewer] = {
            reviews: 0,
            totalScore: 0,
            albums: new Set(),
          };
        }
        reviewerStats[review.reviewer].reviews++;
        reviewerStats[review.reviewer].albums.add(review.album);

        const values = Object.values(review.ratings || {});
        if (values.length > 0) {
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          reviewerStats[review.reviewer].totalScore += avg;
        }
      });

      const topReviewers = Object.entries(reviewerStats)
        .map(([name, stats]) => ({
          name,
          reviews: stats.reviews,
          albums: stats.albums.size,
          average:
            stats.reviews > 0
              ? (stats.totalScore / stats.reviews).toFixed(1)
              : "0.0",
        }))
        .sort(
          (a, b) =>
            b.reviews - a.reviews ||
            parseFloat(b.average) - parseFloat(a.average),
        )
        .slice(0, 5);

      // Calcular estadísticas por álbum
      const albumStats = {};
      allReviews.forEach((review) => {
        const key = `${review.album}|${review.artista}`;
        if (!albumStats[key]) {
          albumStats[key] = {
            album: review.album,
            artista: review.artista,
            total: 0,
            count: 0,
            reviews: [],
          };
        }
        const values = Object.values(review.ratings || {});
        if (values.length > 0) {
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          albumStats[key].total += avg;
          albumStats[key].count++;
          albumStats[key].reviews.push(review);
        }
      });

      const topAlbums = Object.values(albumStats)
        .filter((stat) => stat.count > 0)
        .map((stat) => ({
          ...stat,
          average: (stat.total / stat.count).toFixed(1),
        }))
        .sort((a, b) => parseFloat(b.average) - parseFloat(a.average))
        .slice(0, 5);

      setRankings({
        topReviewers,
        topAlbums,
        loading: false,
        totalReviews: allReviews.length,
      });
    } catch (error) {
      console.error("Error loading rankings:", error);
      setRankings((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  }, [albums]);

  useEffect(() => {
    if (albums && albums.length > 0) {
      loadAllReviews();
    }
  }, [albums, loadAllReviews]);

  if (rankings.loading) {
    return (
      <div className="flex justify-center items-center py-8 text-white/20 text-sm">
        <span className="w-2 h-2 bg-[#f5576c] rounded-full animate-pulse mr-2"></span>
        Cargando rankings...
      </div>
    );
  }

  return (
    <div className="mt-8 pt-6 border-t border-white/5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <h3 className="text-white/60 text-xs tracking-[0.2em] uppercase">
          📊 Rankings & Estadísticas
        </h3>
        <span className="text-white/20 text-xs">
          {rankings.totalReviews} reviews totales
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TOP Reviewers */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <h4 className="text-white/60 text-xs tracking-[0.2em] uppercase mb-3">
            🏆 TOP Reviewers
          </h4>
          {rankings.topReviewers.length === 0 ? (
            <p className="text-white/20 text-sm">Sin reviews aún</p>
          ) : (
            <div className="space-y-2">
              {rankings.topReviewers.map((reviewer, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-white/20 text-sm font-bold w-6 flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <span className="text-white/80 text-sm truncate block">
                        {reviewer.name}
                      </span>
                      <span className="text-white/20 text-[10px]">
                        {reviewer.reviews} reviews · {reviewer.albums} álbumes
                      </span>
                    </div>
                  </div>
                  <span className="text-[#f5576c] text-sm font-bold flex-shrink-0">
                    ★ {reviewer.average}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TOP Álbumes */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <h4 className="text-white/60 text-xs tracking-[0.2em] uppercase mb-3">
            🎵 TOP Álbumes
          </h4>
          {rankings.topAlbums.length === 0 ? (
            <p className="text-white/20 text-sm">Sin reviews aún</p>
          ) : (
            <div className="space-y-2">
              {rankings.topAlbums.map((album, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-white/20 text-sm font-bold w-6 flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <span className="text-white/80 text-sm truncate block">
                        {album.album}
                      </span>
                      <span className="text-white/20 text-[10px] truncate block">
                        {album.artista} · {album.count} reviews
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[#f5576c] text-sm font-bold">
                      ★ {album.average}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detalle de reviews por categoría */}
      {rankings.topAlbums.length > 0 && (
        <details className="mt-4 bg-white/5 rounded-2xl p-4 border border-white/5">
          <summary className="text-white/40 text-xs cursor-pointer hover:text-white/60 transition-colors">
            📋 Ver desglose por categoría
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-white/30 border-b border-white/5">
                  <th className="text-left py-2 pr-4">Álbum</th>
                  <th className="text-center py-2 px-2">🎛️</th>
                  <th className="text-center py-2 px-2">🎵</th>
                  <th className="text-center py-2 px-2">📝</th>
                  <th className="text-center py-2 px-2">💡</th>
                  <th className="text-center py-2 px-2">🔗</th>
                  <th className="text-center py-2 px-2">🔄</th>
                  <th className="text-center py-2 px-2">⭐</th>
                  <th className="text-center py-2 px-2">Prom.</th>
                </tr>
              </thead>
              <tbody>
                {rankings.topAlbums.map((album, idx) => {
                  const cats = [
                    "produccion",
                    "composicion",
                    "letras",
                    "originalidad",
                    "cohesion",
                    "replay",
                    "general",
                  ];
                  const avgByCat = cats.map((cat) => {
                    const values =
                      album.reviews
                        ?.map((r) => r.ratings?.[cat])
                        .filter((v) => !isNaN(v) && v !== undefined) || [];
                    return values.length > 0
                      ? (
                          values.reduce((a, b) => a + b, 0) / values.length
                        ).toFixed(1)
                      : "-";
                  });
                  const totalAvg = parseFloat(album.average);

                  return (
                    <tr
                      key={idx}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="py-2 pr-4 text-white/60 truncate max-w-[120px]">
                        {album.album}
                      </td>
                      {avgByCat.map((val, i) => (
                        <td
                          key={i}
                          className="text-center py-2 px-2 text-white/40"
                        >
                          {val}
                        </td>
                      ))}
                      <td className="text-center py-2 px-2 text-[#f5576c] font-bold">
                        ★ {totalAvg.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
