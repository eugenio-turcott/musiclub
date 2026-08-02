// src/components/Rankings.jsx
import React, { useState, useEffect, useCallback } from "react";
import { supabaseService } from "../services/supabaseClient";

export function Rankings({ albums }) {
  const [rankings, setRankings] = useState({
    topReviewers: [],
    topAlbums: [],
    loading: true,
    totalReviews: 0,
  });

  const loadRankings = useCallback(async () => {
    setRankings((prev) => ({ ...prev, loading: true }));

    try {
      const [topReviewers, topAlbums, allReviews] = await Promise.all([
        supabaseService.getTopReviewers(),
        supabaseService.getTopAlbums(),
        supabaseService.getAllReviews(),
      ]);

      setRankings({
        topReviewers: topReviewers || [],
        topAlbums: topAlbums || [],
        loading: false,
        totalReviews: allReviews?.length || 0,
      });
    } catch (error) {
      console.error("Error loading rankings:", error);
      setRankings((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  }, []);

  useEffect(() => {
    loadRankings();
  }, [loadRankings]);

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
                        {reviewer.reviewer_name}
                      </span>
                      <span className="text-white/20 text-[10px]">
                        {reviewer.review_count} reviews · {reviewer.album_count}{" "}
                        álbumes
                      </span>
                    </div>
                  </div>
                  <span className="text-[#f5576c] text-sm font-bold flex-shrink-0">
                    ★ {reviewer.avg_rating}
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
                        {album.album_name}
                      </span>
                      <span className="text-white/20 text-[10px] truncate block">
                        {album.artist_name} · {album.review_count} reviews
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[#f5576c] text-sm font-bold">
                      ★ {album.avg_rating}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
