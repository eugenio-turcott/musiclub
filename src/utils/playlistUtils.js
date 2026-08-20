// src/utils/playlistUtils.js
import { getSpotifyPlaylistDetails } from '../services/spotifyApi';

export const PLAYLIST_MOODS = [
  { id: 'all', label: 'Todos los Moods', icon: '✨' },
  { id: 'chill', label: 'Chill & Focus', icon: '☕' },
  { id: 'energia', label: 'Energía & Fiesta', icon: '⚡' },
  { id: 'melancolia', label: 'Nostalgia & Melancolía', icon: '🌙' },
  { id: 'roadtrip', label: 'Roadtrip & Viaje', icon: '🚗' },
  { id: 'indie_rock', label: 'Indie, Rock & Alt', icon: '🎸' },
  { id: 'electronica', label: 'Electrónica & Beat', icon: '🎛️' },
  { id: 'descubrimientos', label: 'Joyas Ocultas', icon: '💎' },
];

/**
 * Detecta plataforma y retorna metadata de diseño
 */
export function detectPlatform(url = '') {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes('spotify.com')) {
    return {
      platform: 'spotify',
      name: 'Spotify',
      icon: '🟢',
      color: 'from-emerald-500 to-green-600',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      buttonBg: 'bg-[#1DB954] hover:bg-[#1ed760] text-black',
    };
  }
  if (lower.includes('apple.com') || lower.includes('music.apple')) {
    return {
      platform: 'apple',
      name: 'Apple Music',
      icon: '🍎',
      color: 'from-pink-500 to-rose-600',
      badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      buttonBg: 'bg-[#fc3c44] hover:bg-[#ff4f56] text-white',
    };
  }
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return {
      platform: 'youtube',
      name: 'YouTube Music',
      icon: '▶️',
      color: 'from-red-500 to-red-700',
      badgeClass: 'bg-red-500/20 text-red-300 border-red-500/30',
      buttonBg: 'bg-[#ff0000] hover:bg-[#ff2626] text-white',
    };
  }
  return {
    platform: 'other',
    name: 'Enlace Web',
    icon: '🔗',
    color: 'from-indigo-500 to-purple-600',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    buttonBg: 'bg-purple-600 hover:bg-purple-500 text-white',
  };
}

/**
 * Decodifica entidades HTML comunes (&amp; -> &)
 */
export function decodeHtmlEntities(str = '') {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Valida si una URL de imagen es un marcador transparente (1x1.gif) o ícono genérico/SVG
 */
export function isInvalidArtwork(url = '') {
  if (!url || typeof url !== 'string') return true;
  const lower = url.toLowerCase();
  return (
    lower.includes('1x1.gif') ||
    lower.includes('1x1.png') ||
    lower.includes('onboarding_appicon') ||
    lower.includes('spacer') ||
    lower.endsWith('.svg')
  );
}

/**
 * Limpia y normaliza títulos de Apple Music (removiendo marcas invisibles, comillas redundantes y sufijos de plataforma)
 */
export function cleanAppleMusicTitle(title = '') {
  if (!title) return '';
  let t = title
    .replace(/^[\u200E\u200F\uFEFF]/, '') // Marcas unicode invisibles
    .trim();

  t = t.replace(/\s*(?:en|on|-)\s*Apple\s*Music$/i, '').trim();
  t = t.replace(/\s*-\s*Playlist$/i, '').trim();

  // Si tiene formato “Título” de Creador / "Title" by Creator
  const matchWithAuthor = t.match(/^[“"']([^”"']+)["”']\s*(?:de|by)\s*(.+)$/i);
  if (matchWithAuthor) {
    const playlistName = matchWithAuthor[1].trim();
    const authorName = matchWithAuthor[2].trim();
    return `${playlistName} (de ${authorName})`;
  }

  t = t.replace(/^[“"']+|[”"']+$/g, '').trim();
  return t;
}

/**
 * Helper para capitalizar texto de slug (ej: "late-night-tales" -> "Late Night Tales")
 */
function formatSlugTitle(slug = '') {
  if (!slug) return '';
  return slug
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Extrae título y portada automáticamente a partir de un enlace de Spotify, Apple Music o YouTube Music
 */
export async function fetchPlaylistMetadataFromUrl(rawUrl = '') {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { success: false, error: 'URL no proporcionada' };
  }

  const cleanUrl = rawUrl.trim();
  const platformInfo = detectPlatform(cleanUrl);
  const platform = platformInfo ? platformInfo.platform : 'other';

  // 1. SPOTIFY
  if (platform === 'spotify') {
    const playlistIdMatch = cleanUrl.match(/playlist\/([a-zA-Z0-9]+)/);
    const playlistId = playlistIdMatch ? playlistIdMatch[1] : null;

    if (playlistId) {
      try {
        const details = await getSpotifyPlaylistDetails(playlistId);
        if (details.success && details.title) {
          return {
            success: true,
            platform: 'spotify',
            title: details.title,
            imageUrl: details.imageUrl || '',
            description: details.description || '',
            url: cleanUrl,
          };
        }
      } catch (err) {
        console.warn('Fallo Spotify API en fetchPlaylistMetadata, probando oEmbed...', err);
      }
    }

    // Fallback 1: oEmbed para Spotify
    try {
      const oembedRes = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(cleanUrl)}`
      );
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        return {
          success: true,
          platform: 'spotify',
          title: oembedData.title || 'Playlist de Spotify',
          imageUrl: oembedData.thumbnail_url || '',
          description: '',
          url: cleanUrl,
        };
      }
    } catch (err) {
      console.warn('oEmbed Spotify falló:', err);
    }

    // Fallback 2: Microlink API
    try {
      const microRes = await fetch(
        `https://api.microlink.io/?url=${encodeURIComponent(cleanUrl)}`
      );
      if (microRes.ok) {
        const microData = await microRes.json();
        if (microData.status === 'success' && microData.data?.title) {
          const sImg = microData.data?.image?.url;
          return {
            success: true,
            platform: 'spotify',
            title:
              microData.data.title.replace(/\s*-\s*Spotify$/i, '').trim() ||
              'Playlist de Spotify',
            imageUrl: sImg && !isInvalidArtwork(sImg) ? sImg : '',
            description: microData.data?.description || '',
            url: cleanUrl,
          };
        }
      }
    } catch (err) {
      console.warn('Microlink Spotify falló:', err);
    }

    return {
      success: true,
      platform: 'spotify',
      title: 'Playlist de Spotify',
      imageUrl: '',
      description: '',
      url: cleanUrl,
    };
  }

  // 2. YOUTUBE / YOUTUBE MUSIC
  if (platform === 'youtube') {
    const videoIdMatch = cleanUrl.match(
      /(?:v=|\/embed\/|\/shorts\/|youtu\.be\/|\/v\/)([a-zA-Z0-9_-]{11})/i
    );
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    // Estrategia 1: Microlink API (Detecta playlists de YouTube Music en < 1.2s y pasa CORS en el navegador)
    try {
      const microRes = await fetch(
        `https://api.microlink.io/?url=${encodeURIComponent(cleanUrl)}`
      );
      if (microRes.ok) {
        const microData = await microRes.json();
        if (microData.status === 'success' && microData.data?.title) {
          let ytTitle = microData.data.title;
          ytTitle = ytTitle.replace(/\s*-\s*YouTube\s*(Music)?$/i, '').trim();

          const ytImg =
            microData.data?.image?.url ||
            microData.data?.logo?.url ||
            (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');

          const ytDesc =
            microData.data?.description &&
            !microData.data.description.toLowerCase().includes('enjoy the videos')
              ? microData.data.description
              : '';

          return {
            success: true,
            platform: 'youtube',
            title: ytTitle || 'Playlist de YouTube Music',
            imageUrl: ytImg || '',
            description: ytDesc || '',
            url: cleanUrl,
          };
        }
      }
    } catch (err) {
      console.warn('Microlink YouTube falló, probando alternativas...', err);
    }

    // Estrategia 2: Si tiene video ID en la URL (ej: watch?v=...&list=...), oEmbed oficial de YouTube
    if (videoId) {
      try {
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(
            `https://www.youtube.com/watch?v=${videoId}`
          )}&format=json`
        );
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          return {
            success: true,
            platform: 'youtube',
            title: oembedData.title || 'Playlist de YouTube Music',
            imageUrl:
              oembedData.thumbnail_url ||
              `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            description: '',
            url: cleanUrl,
          };
        }
      } catch (err) {
        console.warn('YouTube video oEmbed falló:', err);
      }

      return {
        success: true,
        platform: 'youtube',
        title: 'Playlist de YouTube Music',
        imageUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        description: '',
        url: cleanUrl,
      };
    }

    // Estrategia 3: Fallback estándar con imagen musical de alta calidad
    return {
      success: true,
      platform: 'youtube',
      title: 'Playlist de YouTube Music',
      imageUrl:
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      description: '',
      url: cleanUrl,
    };
  }

  // 3. APPLE MUSIC
  if (platform === 'apple') {
    let extractedTitle = 'Playlist de Apple Music';
    let extractedImage = '';
    let extractedDesc = '';

    const slugMatch = cleanUrl.match(/playlist\/([^/?#]+)/i);
    if (slugMatch && slugMatch[1] && !slugMatch[1].startsWith('pl.')) {
      extractedTitle = decodeURIComponent(formatSlugTitle(slugMatch[1]));
    }

    const idMatch = cleanUrl.match(/\/([0-9]{8,12})/);

    // Estrategia 1: Si es un álbum / canción oficial con ID numérico en Apple Music, iTunes Lookup API oficial
    if (idMatch) {
      try {
        const itunesRes = await fetch(
          `https://itunes.apple.com/lookup?id=${idMatch[1]}&country=us`
        );
        if (itunesRes.ok) {
          const itunesData = await itunesRes.json();
          const item = itunesData.results?.[0];
          if (item) {
            if (item.collectionName || item.trackName) {
              extractedTitle = item.collectionName || item.trackName;
            }
            if (item.artworkUrl100 && !isInvalidArtwork(item.artworkUrl100)) {
              extractedImage = item.artworkUrl100.replace(
                '100x100bb',
                '600x600bb'
              );
            }
          }
        }
      } catch (err) {
        console.warn('iTunes Lookup API falló:', err);
      }
    }

    // Estrategia 2: Extraer og:image y apple:title exactos directamente desde el HTML de Apple Music
    if (!extractedImage) {
      const proxyEndpoints = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`
      ];

      for (const endpoint of proxyEndpoints) {
        if (extractedImage) break;
        try {
          const proxyRes = await fetch(endpoint, {
            signal: AbortSignal.timeout(4500),
          });
          if (proxyRes.ok) {
            let html = '';
            if (endpoint.includes('/get?')) {
              const data = await proxyRes.json();
              html = data.contents || '';
            } else {
              html = await proxyRes.text();
            }

            if (html) {
              const ogImgMatch =
                html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1] ||
                html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i)?.[1];

              const appleTitleMatch =
                html.match(/<meta\s+name=["']apple:title["']\s+content=["']([^"']+)["']/i)?.[1] ||
                html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1];

              if (ogImgMatch && !isInvalidArtwork(ogImgMatch)) {
                extractedImage = decodeHtmlEntities(ogImgMatch);
              }
              if (appleTitleMatch && (!extractedTitle || extractedTitle === 'Playlist de Apple Music')) {
                extractedTitle = cleanAppleMusicTitle(appleTitleMatch);
              }
            }
          }
        } catch (err) {
          // Si el proxy falla o da timeout, continuamos
        }
      }
    }

    // Estrategia 3: Microlink para completar título o descripción
    try {
      const microRes = await fetch(
        `https://api.microlink.io/?url=${encodeURIComponent(cleanUrl)}`,
        { signal: AbortSignal.timeout(3500) }
      );
      if (microRes.ok) {
        const microData = await microRes.json();
        if (microData.status === 'success') {
          const mTitle = microData.data?.title;
          const mImg = microData.data?.image?.url;
          if (
            mTitle &&
            !mTitle.startsWith('pl.') &&
            (!extractedTitle || extractedTitle === 'Playlist de Apple Music')
          ) {
            extractedTitle = cleanAppleMusicTitle(mTitle);
          }
          if (!extractedImage && mImg && !isInvalidArtwork(mImg)) {
            extractedImage = mImg;
          }
          if (microData.data?.description) {
            extractedDesc = microData.data.description;
          }
        }
      }
    } catch (err) {
      console.warn('Microlink Apple Music falló:', err);
    }

    return {
      success: true,
      platform: 'apple',
      title: extractedTitle || 'Playlist de Apple Music',
      imageUrl:
        extractedImage ||
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      description: extractedDesc,
      url: cleanUrl,
    };
  }

  // 4. OTROS ENLACES
  try {
    const microRes = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(cleanUrl)}`
    );
    if (microRes.ok) {
      const microData = await microRes.json();
      if (microData.status === 'success' && microData.data?.title) {
        const oImg = microData.data?.image?.url;
        return {
          success: true,
          platform: 'other',
          title: microData.data.title,
          imageUrl: oImg && !isInvalidArtwork(oImg) ? oImg : '',
          description: microData.data?.description || '',
          url: cleanUrl,
        };
      }
    }
  } catch (err) {
    console.warn('Microlink genérico falló:', err);
  }

  return {
    success: true,
    platform: 'other',
    title: 'Playlist de Música',
    imageUrl: '',
    description: '',
    url: cleanUrl,
  };
}

/**
 * Calcula estadísticas de aprobación binaria (Sí/No) para una playlist
 */
export function getPlaylistApprovalStats(playlist) {
  const reviews = playlist?.reviews || [];
  const likes = playlist?.likes_count ?? reviews.filter((r) => r.liked === true).length;
  const dislikes = playlist?.dislikes_count ?? reviews.filter((r) => r.liked === false).length;
  const totalVotes = likes + dislikes;
  const rate = totalVotes > 0 ? Math.round((likes / totalVotes) * 100) : null;

  let badge = {
    label: '✨ Sin votos aún',
    colorClass: 'bg-white/10 text-white/60 border-white/10',
    barColor: 'bg-slate-500',
  };

  if (totalVotes > 0) {
    if (rate >= 90) {
      badge = {
        label: `🌟 ${rate}% Aprobación · Aclamada`,
        colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        barColor: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      };
    } else if (rate >= 70) {
      badge = {
        label: `👍 ${rate}% Aprobación · Muy Buena`,
        colorClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        barColor: 'bg-gradient-to-r from-cyan-500 to-blue-500',
      };
    } else if (rate >= 50) {
      badge = {
        label: `⚖️ ${rate}% Aprobación · Mixta`,
        colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        barColor: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      };
    } else {
      badge = {
        label: `👎 ${rate}% Aprobación · Polarizante`,
        colorClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        barColor: 'bg-gradient-to-r from-rose-500 to-pink-600',
      };
    }
  }

  return {
    totalVotes,
    likes,
    dislikes,
    rate,
    badge,
  };
}

