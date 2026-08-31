import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import { SEO } from './SEO';
import { ReviewSystem } from './ReviewSystem';
import { supabaseService } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import {
  slugifyAlbum,
  slugifyArtist,
  findAlbumBySlug,
  getTrackDisplayName,
  getEmotionFromReview,
  getReviewFavoriteTrack,
  isFavoriteTrackMatch,
  calculateAlbumTopTrack,
} from '../utils/ratingUtils';
import {
  fetchAlbumSpotifyMetadata,
  searchAlbum,
  getAlbumDetails,
} from '../services/spotifyApi';

const CRITERIA_METRICS = [
  {
    key: 'rating_produccion',
    label: 'Producción',
    icon: '🎛️',
    max: 5,
    color: 'from-blue-500 to-cyan-400',
    desc: 'Mezcla y diseño de sonido',
  },
  {
    key: 'rating_composicion',
    label: 'Composición',
    icon: '🎵',
    max: 5,
    color: 'from-emerald-500 to-teal-400',
    desc: 'Melodías, arreglos y estructura',
  },
  {
    key: 'rating_letras',
    label: 'Letras',
    icon: '📝',
    max: 5,
    color: 'from-amber-500 to-yellow-400',
    desc: 'Lírica, mensaje y narrativa',
  },
  {
    key: 'rating_originalidad',
    label: 'Originalidad',
    icon: '💡',
    max: 5,
    color: 'from-purple-500 to-indigo-400',
    desc: 'Innovación y propuesta',
  },
  {
    key: 'rating_cohesion',
    label: 'Cohesión',
    icon: '🔗',
    max: 5,
    color: 'from-rose-500 to-red-400',
    desc: 'Fluidez como obra completa',
  },
  {
    key: 'rating_replay',
    label: 'Replay Value',
    icon: '🔄',
    max: 5,
    color: 'from-teal-500 to-cyan-400',
    desc: 'Ganas de volver a escucharlo',
  },
  {
    key: 'rating_general',
    label: 'General',
    icon: '⭐',
    max: 10,
    color: 'from-[#f5576c] to-[#f093fb]',
    desc: 'Valoración global e independiente',
  },
];

function formatDuration(ms) {
  if (!ms || isNaN(ms)) return null;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export function AlbumDetail() {
  const { slug } = useParams();
  const { user, isAdmin } = useAuth();

  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewSystem, setShowReviewSystem] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState({});
  const [spotifyMeta, setSpotifyMeta] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supabaseService.getAllAlbumsWithFullStats();
      let current = findAlbumBySlug(data || [], slug);

      // Fallback 1: si el álbum fue recién insertado y la vista agregada no lo reflejó de inmediato
      if (!current) {
        const fallbackAlbums = await supabaseService.getAllAlbums();
        current = findAlbumBySlug(fallbackAlbums || [], slug);
        if (current) {
          current = {
            ...current,
            reviews: [],
            track_stats: [],
            stats: { totalReviews: 0, averageRating: null },
            final_rating: null,
          };
        }
      }

      // Fallback 2 (On-Demand Spotify): Si no existe en la base de datos de Musiclub, buscar en Spotify API
      if (!current && slug) {
        try {
          const searchQuery = slug.replace(/-/g, ' ');
          const searchRes = await searchAlbum(searchQuery);
          if (
            searchRes?.success &&
            searchRes.albums &&
            searchRes.albums.length > 0
          ) {
            const bestMatch = searchRes.albums[0];
            const detailsRes = await getAlbumDetails(bestMatch.id);
            if (detailsRes?.success && detailsRes.album) {
              const spAlbum = detailsRes.album;
              const spTracks = (spAlbum.tracks || []).map((t, idx) => ({
                name: t.name,
                track_number: t.track_number || idx + 1,
                duration_ms: t.duration_ms || null,
                avg_rating: null,
                votes_count: 0,
              }));

              current = {
                id: `spotify_${spAlbum.id}`,
                spotify_id: spAlbum.id,
                album_name: spAlbum.name,
                artist_name: spAlbum.artists.join(', '),
                image_url: spAlbum.image,
                spotify_link:
                  spAlbum.external_urls?.spotify ||
                  `https://open.spotify.com/album/${spAlbum.id}`,
                release_date: spAlbum.releaseDate,
                release_year: spAlbum.releaseYear,
                release_type: spAlbum.release_type || 'ALBUM',
                genres: spAlbum.genres || [],
                label: spAlbum.label || '',
                tracks: spAlbum.tracks.map((t) => t.name),
                track_stats: spTracks,
                reviews: [],
                stats: { totalReviews: 0, averageRating: null },
                final_rating: null,
                is_on_demand: true,
              };

              setSpotifyMeta({
                success: true,
                releaseDate: spAlbum.releaseDate,
                releaseYear: spAlbum.releaseYear,
                releaseType: spAlbum.release_type,
                genres: spAlbum.genres,
                label: spAlbum.label,
                totalTracks: spAlbum.totalTracks,
                spotifyUrl: spAlbum.external_urls?.spotify,
              });
            }
          }
        } catch (spErr) {
          console.warn('Error al resolver álbum on-demand desde Spotify:', spErr);
        }
      }

      if (current) {
        setAlbum(current);
      } else {
        setError('Álbum no encontrado');
      }
    } catch (err) {
      console.error('Error loading album details:', err);
      setError('Error al cargar la información del álbum');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Enriquecer automáticamente metadatos desde Spotify (año, géneros, tipo de lanzamiento)
  useEffect(() => {
    if (!album) return;

    let isMounted = true;
    const enrichFromSpotify = async () => {
      try {
        const meta = await fetchAlbumSpotifyMetadata(
          album.album_name || album.album,
          album.artist_name || album.artista,
          album.spotify_link
        );
        if (isMounted && meta?.success) {
          setSpotifyMeta(meta);
        }
      } catch (err) {
        console.warn(
          'No se pudieron obtener metadatos extendidos de Spotify:',
          err
        );
      }
    };

    enrichFromSpotify();

    return () => {
      isMounted = false;
    };
  }, [album]);

  // Recalcular el top track usando la lógica unificada
  const topTrack = useMemo(() => {
    if (!album) return null;
    return calculateAlbumTopTrack(album, album.reviews, album.track_stats);
  }, [album]);

  // Determinar si el usuario actual ya calificó el álbum
  const userReview = useMemo(() => {
    if (!album || !user || !album.reviews) return null;
    const userEmail = (user.email || '').toLowerCase().trim();
    const userName = (user.name || '').toLowerCase().trim();
    return album.reviews.find((r) => {
      const rEmail = (r.reviewer_email || '').toLowerCase().trim();
      const rName = (r.reviewer_name || '').toLowerCase().trim();
      return (
        (userEmail && rEmail === userEmail) || (userName && rName === userName)
      );
    });
  }, [album, user]);

  const toggleReviewExpanded = (reviewId) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  // Structured JSON-LD Schema for Google Rich Review Snippets (Metacritic / AOTY style)
  const schemaData = useMemo(() => {
    if (!album) return null;
    const albumSlug = slugifyAlbum(album.album_name);
    const artistSlug = slugifyArtist(album.artist_name);
    const canonicalUrl = `https://musiclub.org/albumes/${albumSlug}`;
    const releaseYear =
      album.release_year ||
      (album.release_date ? album.release_date.substring(0, 4) : undefined);

    // Track list structured data
    const tracksList = (album.track_stats || []).map((t, idx) => ({
      '@type': 'MusicRecording',
      name: t.name,
      position: idx + 1,
      duration: t.duration_ms
        ? `PT${Math.floor(t.duration_ms / 60000)}M${Math.floor((t.duration_ms % 60000) / 1000)}S`
        : undefined,
      url: `${canonicalUrl}#track-${idx + 1}`,
    }));

    // Individual reviews structured data
    const userReviewsSchema = (album.reviews || [])
      .filter((r) => r.rating !== undefined && r.rating !== null)
      .map((r) => ({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: r.reviewer_name || 'Miembro de Musiclub',
        },
        datePublished: r.created_at
          ? new Date(r.created_at).toISOString().split('T')[0]
          : undefined,
        reviewBody:
          r.opinion && r.opinion.trim().length > 0
            ? r.opinion.trim()
            : `Reseña y calificación para ${album.album_name} de ${album.artist_name} en Musiclub.`,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: Number(r.rating).toFixed(1),
          bestRating: '10',
          worstRating: '1',
        },
      }));

    const reviewCount =
      album.reviews && album.reviews.length > 0
        ? album.reviews.length
        : album.review_count || 1;

    const genres =
      album.genres && album.genres.length > 0
        ? album.genres
        : spotifyMeta?.genres || [];

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'MusicAlbum',
      '@id': `${canonicalUrl}#album`,
      name: album.album_name,
      url: canonicalUrl,
      image: album.image_url,
      byArtist: {
        '@type': 'MusicGroup',
        name: album.artist_name,
        url: `https://musiclub.org/artista/${artistSlug}`,
      },
      numTracks: album.tracks?.length || album.track_stats?.length || undefined,
      genre: genres.length > 0 ? genres : undefined,
      datePublished:
        album.release_date ||
        (releaseYear ? `${releaseYear}-01-01` : undefined),
      description: `Reseñas, calificaciones de la comunidad y desglose pista por pista del álbum "${album.album_name}" de ${album.artist_name} en Musiclub.`,
      track: tracksList.length > 0 ? tracksList : undefined,
    };

    if (album.final_rating) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: Number(album.final_rating).toFixed(2),
        ratingCount: reviewCount,
        reviewCount: reviewCount,
        bestRating: '10',
        worstRating: '1',
      };
    }

    if (userReviewsSchema.length > 0) {
      schema.review = userReviewsSchema;
    }

    return schema;
  }, [album, spotifyMeta]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b12] text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <AppHeader showTitle={false} />
          <div className="py-24 text-center space-y-4">
            <div className="inline-block w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-medium">
              Cargando detalles del álbum...
            </p>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="min-h-screen bg-[#0a0b12] text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <AppHeader showTitle={false} />
          <div className="p-10 bg-white/5 border border-white/10 rounded-3xl text-center space-y-4 max-w-lg mx-auto mt-12 shadow-2xl">
            <span className="text-5xl">💿</span>
            <h2 className="text-2xl font-black text-white">
              Álbum no encontrado
            </h2>
            <p className="text-slate-400 text-sm">
              No pudimos encontrar el álbum solicitado en nuestro catálogo o fue
              modificado.
            </p>
            <div className="pt-2">
              <Link
                to="/albumes"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-sm shadow-lg hover:brightness-110 transition-all"
              >
                <span>←</span>
                <span>Explorar Todos los Álbumes</span>
              </Link>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  const score = album.final_rating;
  const canonicalUrl = `https://musiclub.org/albumes/${slugifyAlbum(album.album_name)}`;
  const reviewCountNum = album.reviews?.length || album.review_count || 0;
  const metaDescription = score
    ? `Reseñas y calificaciones de la comunidad para "${album.album_name}" de ${album.artist_name}. Calificación promedio de ${Number(score).toFixed(1)}/10 basada en ${reviewCountNum} ${reviewCountNum === 1 ? 'reseña' : 'reseñas'}. Canción destacada y desglose pista por pista en Musiclub.`
    : `Descubre las reseñas, opiniones y calificaciones de "${album.album_name}" de ${album.artist_name} en Musiclub.`;

  return (
    <div className="min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden relative selection:bg-cyan-500 selection:text-black">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <SEO
        title={`${album.artist_name} - ${album.album_name} - Reviews | Musiclub`}
        description={metaDescription}
        image={album.image_url}
        url={canonicalUrl}
        type="music.album"
        schemaData={schemaData}
      />

      <div className="max-w-7xl mx-auto space-y-8 w-full">
        {/* Universal Standard App Header */}
        <AppHeader showTitle={false} />

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Link to="/" className="hover:text-cyan-400 transition-colors">
            Inicio
          </Link>
          <span>/</span>
          <Link to="/albumes" className="hover:text-cyan-400 transition-colors">
            Álbumes
          </Link>
          <span>/</span>
          <span
            className="text-slate-200 truncate font-semibold"
            title={album.album_name}
          >
            {album.album_name}
          </span>
        </nav>

        {/* HERO SECTION: Responsive Layout (Left = Artwork, Right = Title & Info on desktop; Top = Artwork, Bottom = Info on mobile) */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#131522] via-[#0f111d] to-[#090a12] border border-white/10 p-5 sm:p-7 md:p-8 shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Subtle Background Glow behind cover */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 lg:gap-10">
            {/* LEFT / TOP: Album Artwork Container */}
            <div className="w-full sm:w-72 md:w-80 lg:w-96 flex-shrink-0 flex flex-col items-center">
              <div className="relative w-full aspect-square rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 shadow-2xl group bg-black/60">
                <img
                  src={
                    album.image_url ||
                    'https://via.placeholder.com/400/1a1a2e/ffffff?text=🎵'
                  }
                  alt={album.album_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    e.target.src =
                      'https://via.placeholder.com/400/1a1a2e/ffffff?text=🎵';
                  }}
                />

                {/* Status Badge on artwork */}
                <div className="absolute top-3 right-3 z-20">
                  {album.is_on_demand ? (
                    <span className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 border border-purple-400/30">
                      ✨ Por Calificar
                    </span>
                  ) : album.status === 'GANADOR' ? (
                    <span className="bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 border border-rose-400/30">
                      🏆 GANADOR
                    </span>
                  ) : album.status === 'INDIVIDUAL' ? (
                    <span className="bg-blue-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow border border-blue-400/30">
                      📌 Individual
                    </span>
                  ) : album.status === 'INACTIVO' ? (
                    <span className="bg-slate-700/90 backdrop-blur-md text-slate-300 text-xs font-bold px-3 py-1 rounded-full shadow border border-slate-600/30">
                      💤 Inactivo
                    </span>
                  ) : (
                    <span className="bg-emerald-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow border border-emerald-400/30">
                      🎵 Pool Activo
                    </span>
                  )}
                </div>

                {/* User Ownership Badge */}
                {user &&
                  (album.added_by_email === user.email ||
                    album.added_by === user.name) && (
                    <div className="absolute top-3 left-3 z-20 bg-yellow-400 text-black text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                      <span>★</span>
                      <span>TU ÁLBUM</span>
                    </div>
                  )}
              </div>

              {/* Streaming Links below cover */}
              <div className="flex items-center justify-center gap-2.5 w-full mt-4 flex-wrap">
                {album.spotify_link && (
                  <a
                    href={album.spotify_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#1db954]/15 hover:bg-[#1db954]/25 text-[#1db954] border border-[#1db954]/30 font-bold text-xs transition-all shadow-sm group"
                  >
                    <svg
                      className="w-4 h-4 fill-current group-hover:scale-110 transition-transform"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.306c-.216.353-.674.468-1.027.252-2.81-1.718-6.347-2.107-10.514-1.155-.403.092-.807-.16-.899-.563-.092-.403.16-.807.563-.899 4.568-1.044 8.49-.607 11.625 1.338.353.216.468.674.252 1.027zm1.47-3.268c-.272.443-.853.585-1.296.313-3.218-1.978-8.123-2.55-11.928-1.395-.499.151-1.03-.134-1.181-.633-.151-.499.134-1.03.633-1.181 4.354-1.322 9.775-.684 13.459 1.58.443.272.585.853.313 1.296zm.126-3.41c-3.858-2.29-10.222-2.502-13.886-1.39-.59.179-1.217-.156-1.396-.746-.179-.59.156-1.217.746-1.396 4.218-1.28 11.248-1.036 15.688 1.597.531.315.704 1.002.389 1.533-.315.531-1.002.704-1.541.402z" />
                    </svg>
                    <span>Spotify</span>
                  </a>
                )}

                {album.apple_music_link && (
                  <a
                    href={album.apple_music_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-pink-500/15 to-rose-500/15 hover:from-pink-500/25 hover:to-rose-500/25 text-rose-300 border border-rose-500/30 font-bold text-xs transition-all shadow-sm"
                  >
                    <span>🍎</span>
                    <span>Apple Music</span>
                  </a>
                )}

                {album.youtube_link && (
                  <a
                    href={album.youtube_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 font-bold text-xs transition-all shadow-sm"
                  >
                    <span>▶️</span>
                    <span>YouTube</span>
                  </a>
                )}
              </div>
            </div>

            {/* RIGHT / BOTTOM: Title, Artist, Ratings, Top Track, Actions */}
            <div className="flex-1 min-w-0 space-y-4 sm:space-y-5 text-center md:text-left w-full">
              {/* Curator Info & Metadata Badges */}
              <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-slate-400 flex-wrap">
                {/* Release Type Badge */}
                {(() => {
                  const type =
                    album.release_type || spotifyMeta?.releaseType || 'ALBUM';
                  const badgeMap = {
                    EP: {
                      label: '💿 EP',
                      cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
                    },
                    SENCILLO: {
                      label: '🎵 Sencillo',
                      cls: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
                    },
                    COMPILACION: {
                      label: '📦 Compilación',
                      cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                    },
                    ALBUM: {
                      label: '✨ Álbum',
                      cls: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                    },
                  };
                  const badge = badgeMap[type] || badgeMap.ALBUM;
                  return (
                    <span
                      className={`font-black text-[11px] px-2.5 py-0.5 rounded-full border shadow-sm uppercase tracking-wider ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  );
                })()}

                {/* Release Year */}
                {(() => {
                  const year =
                    album.release_year ||
                    spotifyMeta?.releaseYear ||
                    (album.release_date
                      ? album.release_date.substring(0, 4)
                      : null);
                  if (!year) return null;
                  return (
                    <span className="font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span>📅</span>
                      <span>{year}</span>
                    </span>
                  );
                })()}

                <span className="text-white/20">•</span>

                <span>Curado por</span>
                <span className="font-bold text-slate-200 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                  {album.added_by || 'Miembro de Musiclub'}
                </span>

                {album.created_at && (
                  <>
                    <span className="text-white/20">•</span>
                    <span>
                      {new Date(album.created_at).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>

              {/* Album Title & Artist Link */}
              <div className="space-y-1.5">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-200 tracking-tight leading-tight">
                  {album.album_name}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-2 pt-1">
                  <Link
                    to={`/artista/${slugifyArtist(album.artist_name)}`}
                    className="group/artist inline-flex items-center gap-2 text-xl sm:text-2xl text-cyan-400 hover:text-cyan-300 font-bold tracking-wide transition-all"
                    title={`Ver página y discografía de ${album.artist_name}`}
                  >
                    <span className="underline decoration-cyan-500/30 group-hover/artist:decoration-cyan-400 underline-offset-4">
                      {album.artist_name}
                    </span>
                  </Link>
                </div>

                {/* Genres Tags from Spotify */}
                {(() => {
                  const genres =
                    album.genres && album.genres.length > 0
                      ? album.genres
                      : spotifyMeta?.genres || [];
                  if (genres.length === 0) return null;
                  return (
                    <div className="flex items-center justify-center md:justify-start gap-1.5 flex-wrap pt-1.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mr-1">
                        Géneros:
                      </span>
                      {genres.slice(0, 5).map((g) => (
                        <span
                          key={g}
                          className="text-[11px] font-medium px-2.5 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-200/90 capitalize transition-colors"
                        >
                          #{g}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Score Highlight Box */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-2">
                {/* Score Card */}
                <div className="col-span-2 sm:col-span-1 bg-black/40 border border-white/10 rounded-2xl p-3 sm:p-4 text-center md:text-left flex flex-col justify-between">
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Calificación Final
                  </span>
                  <div className="flex items-baseline justify-center md:justify-start gap-1.5 mt-1">
                    {score !== null ? (
                      <>
                        <span className="text-2xl sm:text-3xl md:text-4xl font-black text-amber-400">
                          {score.toFixed(2)}
                        </span>
                        <span className="text-sm sm:text-base text-amber-300">
                          ⭐
                        </span>
                        {album.bonus > 0 && (
                          <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded-md ml-1">
                            +{album.bonus.toFixed(2)}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-sm font-bold text-slate-400">
                        Sin calificar
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">
                    {album.review_count || 0}{' '}
                    {album.review_count === 1 ? 'reseña' : 'reseñas'}
                  </span>
                </div>

                {/* Crown / Top Track Box */}
                <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-400/30 rounded-2xl p-3 sm:p-4 text-center md:text-left flex flex-col justify-between">
                  <div className="flex items-center justify-center md:justify-start gap-1 text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <span>👑</span>
                    <span>Canción Top</span>
                  </div>
                  <div className="mt-1">
                    {topTrack ? (
                      <div>
                        <p
                          className="text-sm sm:text-base font-black text-amber-200 truncate"
                          title={topTrack.name}
                        >
                          {topTrack.name}
                        </p>
                        <p className="text-xs font-bold text-amber-400 mt-0.5">
                          {topTrack.avg_rating} ⭐{' '}
                          {topTrack.star_votes > 1
                            ? `(${topTrack.star_votes} votos ⭐)`
                            : ''}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Evaluando canciones...
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-amber-300/60 mt-1">
                    {topTrack?.is_favorite_consensus
                      ? 'Favorita de la comunidad'
                      : 'Mayor promedio'}
                  </span>
                </div>

                {/* Total Tracks & Status */}
                <div className="col-span-2 sm:col-span-1 bg-black/40 border border-white/10 rounded-2xl p-3 sm:p-4 text-center md:text-left flex flex-col justify-between">
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Pistas
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                    {album.tracks?.length || album.track_stats?.length || 0} 🎵
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">
                    Estado:{' '}
                    <strong className="text-slate-300">
                      {album.status || 'Activo'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center md:justify-start gap-3 pt-2 flex-wrap">
                <button
                  onClick={() => setShowReviewSystem((prev) => !prev)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs sm:text-sm shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span>
                    {userReview
                      ? '✏️ Modificar Mi Reseña'
                      : '⭐ Calificar y Reseñar'}
                  </span>
                </button>

                <Link
                  to={`/artista/${slugifyArtist(album.artist_name)}`}
                  className="px-5 py-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 font-bold text-xs sm:text-sm border border-cyan-500/30 transition-all flex items-center gap-2"
                >
                  <span>🎤</span>
                  <span>Discografía</span>
                </Link>

                <Link
                  to="/albumes"
                  className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs sm:text-sm border border-white/10 transition-all flex items-center gap-2"
                >
                  <span>←</span>
                  <span>Ver Catálogo</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ON-DEMAND SPOTIFY ALBUM CTA BANNER */}
        {album.is_on_demand && (
          <div className="rounded-3xl bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-cyan-500/30 p-4 sm:p-6 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold uppercase tracking-wider">
                <span>✨</span> Álbum Disponible On-Demand
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                ¡Sé el primer miembro de Musiclub en calificar este álbum!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Puntúa cada canción, califica los 6 pilares de producción y regístralo oficialmente en el club.
              </p>
            </div>
            <button
              onClick={() => setShowReviewSystem(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-[#f5576c] to-purple-500 hover:from-cyan-300 hover:to-purple-400 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-2 flex-shrink-0"
            >
              <span>⭐</span>
              <span>Calificar Álbum Ahora</span>
            </button>
          </div>
        )}

        {/* REVIEW SYSTEM MODAL / SECTION (Interactive Rating Form) */}
        {showReviewSystem && (
          <div className="rounded-3xl bg-[#0e101d] border border-cyan-500/30 p-3 sm:p-5 md:p-7 shadow-2xl animate-fadeIn space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <span className="text-xl sm:text-2xl">⭐</span>
                <h3 className="text-base sm:text-xl font-black text-white truncate">
                  {userReview ? 'Actualizar tu Reseña' : 'Escribir Reseña'}
                </h3>
              </div>
              <button
                onClick={() => setShowReviewSystem(false)}
                className="text-slate-400 hover:text-white text-xs sm:text-sm bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-all font-medium flex items-center gap-1 flex-shrink-0"
              >
                <span>Cerrar</span>
                <span>✕</span>
              </button>
            </div>

            <ReviewSystem
              album={{
                id: album.id,
                album: album.album_name,
                album_name: album.album_name,
                artista: album.artist_name,
                artist_name: album.artist_name,
                imagen: album.image_url,
                image_url: album.image_url,
                tracks: album.tracks,
                spotify_link: album.spotify_link,
                spotify_id: album.spotify_id,
                release_date: album.release_date,
                release_year: album.release_year,
                status: album.status || 'INDIVIDUAL',
                is_on_demand: album.is_on_demand,
              }}
              tracks={album.tracks}
              isFromSpotify={!!album.is_on_demand}
              user={user}
              isAdmin={isAdmin}
              isIndividual={true}
              onReviewSubmitted={() => {
                setShowReviewSystem(false);
                loadData();
              }}
            />
          </div>
        )}

        {/* CRITERIA BREAKDOWN SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>📊</span>
              <span>Desglose de Criterios</span>
            </h2>
            <span className="text-xs text-slate-400">
              Promedio de los 6 pilares + Calificación General
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {CRITERIA_METRICS.map((crit) => {
              const avg = album.criteria_averages?.[crit.key];
              const pct = avg ? (avg / crit.max) * 100 : 0;

              return (
                <div
                  key={crit.key}
                  className="bg-[#121422]/90 border border-white/5 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between space-y-2 hover:border-white/15 transition-all shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                        <span>{crit.icon}</span>
                        <span>{crit.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        {crit.desc}
                      </p>
                    </div>
                    <span className="text-sm font-black text-white ml-1">
                      {avg !== null && avg !== undefined
                        ? `${avg}/${crit.max}`
                        : '—'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${crit.color} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TRACKLIST & RATINGS SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>🎵</span>
                <span>Tracklist y Puntuación por Canción</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluación canción por canción basada en las calificaciones del
                club.
              </p>
            </div>
            {topTrack && (
              <span className="text-xs bg-amber-500/15 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                <span>👑 Top:</span>
                <span className="truncate max-w-[150px]">{topTrack.name}</span>
                <span>({topTrack.avg_rating} ⭐)</span>
              </span>
            )}
          </div>

          <div className="bg-[#121422]/90 border border-white/5 rounded-3xl p-3.5 sm:p-5 shadow-xl overflow-hidden">
            {album.track_stats && album.track_stats.length > 0 ? (
              <div className="divide-y divide-white/5 space-y-1">
                {album.track_stats.map((t, idx) => {
                  const isTop =
                    topTrack &&
                    (t.id === topTrack.id ||
                      t.name.trim().toLowerCase() ===
                        topTrack.name.trim().toLowerCase());

                  return (
                    <div
                      key={t.id || idx}
                      className={`flex items-center justify-between py-2.5 px-3 sm:px-4 rounded-xl transition-all ${
                        isTop
                          ? 'bg-amber-500/15 border border-amber-400/30 shadow-md my-1 text-amber-200'
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      {/* Track Number & Name */}
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <span
                          className={`text-xs font-mono w-6 text-center ${isTop ? 'text-amber-400 font-black' : 'text-slate-500'}`}
                        >
                          {isTop ? '👑' : `#${t.track_number || idx + 1}`}
                        </span>
                        <div className="min-w-0">
                          <p
                            className={`text-xs sm:text-sm truncate ${isTop ? 'font-bold text-amber-100' : 'font-medium text-white'}`}
                            title={t.name}
                          >
                            {t.name}
                          </p>
                          {t.duration_ms && (
                            <p className="text-[10px] text-slate-500">
                              {formatDuration(t.duration_ms)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Track Rating Score */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {t.rating_count > 0 && (
                          <span className="hidden sm:inline text-[10px] text-slate-400">
                            {t.rating_count}{' '}
                            {t.rating_count === 1 ? 'voto' : 'votos'}
                          </span>
                        )}
                        <span
                          className={`font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-lg border ${
                            isTop
                              ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                              : t.avg_rating >= 8
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : t.avg_rating >= 6
                                  ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                                  : t.avg_rating !== null
                                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                    : 'bg-white/5 text-slate-500 border-white/5'
                          }`}
                        >
                          {t.avg_rating !== null ? `${t.avg_rating} ⭐` : '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                No hay lista de canciones registrada para este álbum.
              </div>
            )}
          </div>
        </div>

        {/* COMMUNITY REVIEWS SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>💬</span>
              <span>
                Reseñas de la Comunidad ({album.reviews?.length || 0})
              </span>
            </h2>
          </div>

          {album.reviews && album.reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {album.reviews.map((rev, revIdx) => {
                const emotion = getEmotionFromReview(rev);
                const favTrack = getReviewFavoriteTrack(rev);
                const favTrackName = favTrack
                  ? getTrackDisplayName(favTrack, album.tracks)
                  : null;
                const isExpanded = expandedReviews[rev.id || revIdx];
                const hasTrackRatings =
                  rev.track_ratings &&
                  Object.keys(rev.track_ratings).length > 0;

                return (
                  <div
                    key={rev.id || revIdx}
                    className="bg-gradient-to-br from-[#121422] to-[#0b0d18] border border-white/5 hover:border-white/15 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 shadow-xl transition-all"
                  >
                    {/* Review Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            rev.reviewer_avatar ||
                            rev.avatar_url ||
                            'https://via.placeholder.com/100/1e293b/ffffff?text=👤'
                          }
                          alt={rev.reviewer_name}
                          className="w-10 h-10 rounded-full object-cover border border-white/10 shadow"
                          onError={(e) => {
                            e.target.src =
                              'https://via.placeholder.com/100/1e293b/ffffff?text=👤';
                          }}
                        />
                        <div>
                          <p className="font-bold text-white text-sm sm:text-base">
                            {rev.reviewer_name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {rev.created_at
                              ? new Date(rev.created_at).toLocaleDateString(
                                  'es-ES',
                                  {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  }
                                )
                              : 'Fecha no registrada'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {emotion && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${emotion.badgeClass}`}
                            title={emotion.description}
                          >
                            <span className="text-xl">{emotion.emoji}</span>
                            <span className="hidden sm:block">
                              {emotion.label}
                            </span>
                          </span>
                        )}
                        <span className="text-emerald-400 font-black text-xs sm:text-sm px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                          ★ {rev.weighted_score ?? rev.rating_general ?? '—'}
                        </span>
                      </div>
                    </div>

                    {/* Review Comment */}
                    {rev.comment && (
                      <p className="text-white/80 text-xs italic bg-black/40 p-3 rounded-xl border border-white/5 leading-relaxed break-words">
                        "{rev.comment}"
                      </p>
                    )}

                    {/* Favorite Track Badge */}
                    {favTrackName && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-400/30 p-2 sm:px-2.5 sm:py-1 rounded-xl text-amber-200 font-medium shadow-sm">
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-sm">⭐</span>
                          <span className="text-amber-400/80 font-bold text-[10px] uppercase tracking-wider">
                            Canción Favorita:
                          </span>
                        </div>
                        <span
                          className="font-extrabold text-amber-200 text-xs sm:text-sm pl-5 sm:pl-0 break-words sm:truncate"
                          title={favTrackName}
                        >
                          {favTrackName}
                        </span>
                      </div>
                    )}

                    {/* Mini Criteria Chips */}
                    <div className="grid grid-cols-4 gap-1 sm:gap-1.5 pt-1 border-t border-white/5">
                      {[
                        {
                          label: '🎛️ Prod',
                          val: rev.rating_produccion,
                          max: 5,
                        },
                        {
                          label: '🎵 Comp',
                          val: rev.rating_composicion,
                          max: 5,
                        },
                        { label: '📝 Letras', val: rev.rating_letras, max: 5 },
                        { label: '⭐ Gral', val: rev.rating_general, max: 10 },
                      ].map((crit, cIdx) => (
                        <div
                          key={cIdx}
                          className="bg-black/30 p-1 rounded-lg text-center border border-white/5"
                        >
                          <div className="text-white/40 text-[8px] uppercase truncate">
                            {crit.label}
                          </div>
                          <div className="text-white font-bold text-[11px] mt-0.5">
                            {crit.val ?? '-'}/{crit.max}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Collapsible Tracks */}
                    {hasTrackRatings && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => toggleReviewExpanded(rev.id || revIdx)}
                          className="w-full text-left flex items-center justify-between text-white/50 hover:text-white text-[10px] sm:text-xs font-semibold py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                        >
                          <span>
                            🎵 {Object.keys(rev.track_ratings).length} canciones
                            evaluadas
                          </span>
                          <span className="text-[10px] text-white/40">
                            {isExpanded ? 'Ocultar ▲' : 'Ver tracks ▼'}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="mt-2 p-2 sm:p-3 rounded-xl bg-black/50 border border-white/5 max-h-48 overflow-y-auto custom-scrollbar space-y-1.5 animate-fadeIn">
                            {Object.entries(rev.track_ratings).map(
                              ([trackKey, tScore], tIdx) => {
                                const tName = getTrackDisplayName(
                                  trackKey,
                                  album.tracks
                                );
                                const isFav = isFavoriteTrackMatch(
                                  trackKey,
                                  favTrack,
                                  album.tracks,
                                  tIdx
                                );
                                return (
                                  <div
                                    key={tIdx}
                                    className={`flex items-center justify-between text-xs py-1 px-2 rounded-lg border transition-all ${
                                      isFav
                                        ? 'bg-amber-500/20 border-amber-400/40 text-amber-200 shadow-sm'
                                        : 'bg-white/5 border-white/5'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 truncate pr-2 min-w-0">
                                      <span>{isFav ? '⭐' : '🎵'}</span>
                                      <span
                                        className={`truncate text-[11px] ${isFav ? 'font-bold text-amber-200' : 'text-white/80'}`}
                                        title={tName}
                                      >
                                        {tName}
                                      </span>
                                    </div>
                                    <span
                                      className={`font-black text-[11px] flex-shrink-0 ${isFav ? 'text-amber-300' : 'text-emerald-400'}`}
                                    >
                                      {tScore}/10
                                    </span>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 bg-white/5 border border-white/5 rounded-3xl text-center space-y-2 text-slate-400 text-xs">
              <span className="text-3xl">📝</span>
              <p className="font-semibold text-white">
                Sé el primero en calificar este álbum
              </p>
              <p>
                Tu opinión ayudará a la comunidad a descubrir esta obra musical.
              </p>
            </div>
          )}

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
}
