import { supabase } from './supabaseClient.js';
import { slugifyRelease, slugifyArtist } from '../utils/ratingUtils.js';
import {
  RECORD_CLUB_FALLBACK_RELEASES,
  RECORD_CLUB_FALLBACK_UPCOMING,
  CURATED_ANTICIPATED_RELEASES,
} from './recordClubData.js';

let cachedToken = null;
let tokenExpiresAt = 0;
let inMemoryTrending = null;
let inMemoryTrendingExpires = 0;

function getSpotifyCredentials() {
  const clientId =
    process.env.REACT_APP_SPOTIFY_CLIENT_ID ||
    process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ||
    process.env.SPOTIFY_CLIENT_ID;
  const clientSecret =
    process.env.REACT_APP_SPOTIFY_CLIENT_SECRET ||
    process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET ||
    process.env.SPOTIFY_CLIENT_SECRET;
  return { clientId, clientSecret };
}

/**
 * Obtiene token de aplicación de Spotify de forma segura (soporta Node y Browser)
 */
async function getSpotifyAppToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const { clientId, clientSecret } = getSpotifyCredentials();

  if (!clientId || !clientSecret) {
    throw new Error('Credenciales de Spotify no configuradas');
  }

  const rawCreds = `${clientId}:${clientSecret}`;
  const authHeader =
    typeof btoa !== 'undefined'
      ? btoa(rawCreds)
      : Buffer.from(rawCreds).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authHeader}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error('No se pudo obtener el token de Spotify');
  }

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + ((data.expires_in || 3600) - 60) * 1000;
  return cachedToken;
}

/**
 * Obtiene los lanzamientos en tendencia/novedades (modelo híbrido con fallback en Supabase)
 * @param {Object} options
 * @param {boolean} options.forceRefresh - Fuerza recarga ignorando la antigüedad del caché
 * @param {number} options.limit - Cantidad máxima de lanzamientos (por defecto 50)
 */
export async function getTrendingReleases(options = {}) {
  const { forceRefresh = false, limit = 50 } = options;

  // Si se ejecuta en el navegador, delegar al endpoint del servidor para evitar CORS
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/trending${forceRefresh ? '?refresh=true' : ''}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.releases?.length > 0) {
          return json;
        }
      }
    } catch (browserErr) {
      console.warn('⚠️ Fallback de cliente para tendencias:', browserErr.message);
    }
  }

  // Si tenemos caché en memoria fresco en el servidor
  if (!forceRefresh && inMemoryTrending && Date.now() < inMemoryTrendingExpires) {
    return inMemoryTrending;
  }

  let dbData = null;
  let isCacheFresh = false;
  const currentYear = new Date().getFullYear();

  // 1. Intentar leer desde Supabase (tabla rotatoria trending_releases) si son álbumes sustanciales de 2026
  try {
    const { data, error } = await supabase
      .from('trending_releases')
      .select('*')
      .order('release_date', { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      const allFromCurrentYear = data.every((r) =>
        (r.release_date || '').startsWith(String(currentYear))
      );
      const hasSubstantialTracks = data.some((r) => (r.total_tracks || 0) >= 8);
      const newestUpdated = new Date(data[0].updated_at || 0).getTime();
      const ageHours = (Date.now() - newestUpdated) / (1000 * 60 * 60);

      if (ageHours < 6 && allFromCurrentYear && hasSubstantialTracks && !forceRefresh) {
        isCacheFresh = true;
        dbData = data;
      }
    }
  } catch {
    // Si la tabla no está creada aún, continúa a Spotify
  }

  if (isCacheFresh && dbData && dbData.length > 0) {
    const response = {
      success: true,
      source: 'supabase_cache',
      releases: dbData,
    };
    inMemoryTrending = response;
    inMemoryTrendingExpires = Date.now() + 60 * 60 * 1000;
    return response;
  }

  let lastError = null;

  // 2. Consultar los álbumes más famosos y tendencia de 2026 vía Spotify (Mercado MX y Global)
  try {
    const token = await getSpotifyAppToken();
    const offsets = [0, 10, 20, 30, 40, 50, 60, 70];
    const fetchTasks = [];

    offsets.forEach((offset) => {
      // Mercado México / Latino
      fetchTasks.push(
        fetch(
          `https://api.spotify.com/v1/search?q=year:${currentYear}&type=album&market=MX&limit=10&offset=${offset}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
          .then((r) => r.json())
          .catch(() => null)
      );
      // Mercado Global / Internacional
      fetchTasks.push(
        fetch(
          `https://api.spotify.com/v1/search?q=year:${currentYear}&type=album&limit=10&offset=${offset}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
          .then((r) => r.json())
          .catch(() => null)
      );
    });

    const batchResults = await Promise.all(fetchTasks);
    const seenIds = new Set();
    const seenTitleArtist = new Set();
    const formattedReleases = [];

    batchResults.forEach((json) => {
      if (!json?.albums?.items) {
        if (json?.error) lastError = json.error.message;
        return;
      }

      for (const item of json.albums.items) {
        if (!item || !item.id) continue;
        if (seenIds.has(item.id)) continue;

        const artistName = item.artists
          ? item.artists.map((a) => a.name).join(', ')
          : 'Varios Artistas';
        const normKey = `${(item.name || '').trim().toLowerCase()}:::${artistName.trim().toLowerCase()}`;
        if (seenTitleArtist.has(normKey)) continue;

        // Filtrado estricto estilo Record Club:
        // Solo ÁLBUMES y EPs legítimos de 2026 (excluyendo cualquier single suelto o compilaciones spotlight)
        const relDate = item.release_date || '';
        const isCurrentYear = relDate.startsWith(String(currentYear));
        const isTrueAlbum =
          item.album_type === 'album' || item.album_type === 'compilation';
        const isGenericSpotlight = (item.name || '')
          .toLowerCase()
          .includes('artist spotlight');

        if (!isCurrentYear || !isTrueAlbum || isGenericSpotlight) continue;

        seenIds.add(item.id);
        seenTitleArtist.add(normKey);

        let releaseType = 'ALBUM';
        if (item.album_type === 'compilation') {
          releaseType = 'COMPILACION';
        } else if ((item.total_tracks || 0) <= 6) {
          releaseType = 'EP';
        }

        formattedReleases.push({
          id: item.id,
          album_name: item.name,
          artist_name: artistName,
          image_url: item.images?.[0]?.url || item.images?.[1]?.url || '',
          spotify_url:
            item.external_urls?.spotify ||
            `https://open.spotify.com/album/${item.id}`,
          release_date: relDate || `${currentYear}-01-01`,
          release_type: releaseType,
          total_tracks: item.total_tracks || 1,
          popularity: item.popularity || 0,
          updated_at: new Date().toISOString(),
        });
      }
    });

    if (formattedReleases.length > 0) {
      const finalReleases = formattedReleases.slice(0, Math.max(limit, 50));

      // Sincronizar silenciosamente en Supabase (tabla rotatoria)
      try {
        await supabase
          .from('trending_releases')
          .upsert(finalReleases, { onConflict: 'id' });
      } catch {
        // Fallback silencioso sin ensuciar la base de datos principal
      }

      const response = {
        success: true,
        source: 'spotify_live',
        releases: finalReleases,
      };

      inMemoryTrending = response;
      inMemoryTrendingExpires = Date.now() + 60 * 60 * 1000; // 1 hora de caché en memoria
      return response;
    }
  } catch (spotifyErr) {
    lastError = spotifyErr?.message;
    console.warn('⚠️ Error al consultar Spotify en vivo:', spotifyErr?.message);
  }

  // 4. Fallback resiliente: Si Spotify falla, servir el último snapshot de Supabase
  if (dbData && dbData.length > 0) {
    return {
      success: true,
      source: 'supabase_fallback',
      releases: dbData,
    };
  }

  return {
    success: false,
    source: 'none',
    releases: [],
    error: lastError,
  };
}

const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

let inMemoryRecordClub = null;
let inMemoryRecordClubExpires = 0;

/**
 * Obtiene los lanzamientos en tendencia sincronizados 1:1 con Record Club (https://record.club/releases).
 * Prioriza la API en vivo de Record Club con fallback de alta fidelidad verificado (V.8.5).
 */
export async function getMonthlyTrendingReleases(options = {}) {
  const { forceRefresh = false } = options;
  const now = new Date();
  const monthName = MONTH_NAMES_ES[now.getMonth()];
  const currentYear = now.getFullYear();
  const monthLabel = `Tendencias de ${monthName} ${currentYear}`;

  // Calcular la fecha del viernes más reciente (ciclo de actualización semanal de Record Club)
  const day = now.getDay();
  const daysSinceFriday = (day + 7 - 5) % 7;
  const lastFriday = new Date(now);
  lastFriday.setDate(now.getDate() - daysSinceFriday);
  const lastFridayStr = lastFriday.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });

  // 1. Delegar a endpoint interno si estamos en el navegador para evitar bloqueos CORS
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(
        `/api/trending?type=weekly${forceRefresh ? '&refresh=true' : ''}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.releases?.length > 0) {
          return json;
        }
      }
    } catch (browserErr) {
      console.warn('⚠️ Fallback de cliente Record Club:', browserErr.message);
    }
  }

  // 2. Caché en memoria fresco
  if (!forceRefresh && inMemoryRecordClub && Date.now() < inMemoryRecordClubExpires) {
    return inMemoryRecordClub;
  }

  // 3. CONSULTAR DIRECTAMENTE DESDE SUPABASE (Tabla record_club_releases)
  // Si la tabla contiene los lanzamientos, los servimos directamente desde la BD del usuario sin consultar a Record Club
  let dbData = null;
  try {
    const { data, error } = await supabase
      .from('record_club_releases')
      .select('*')
      .order('trending_rank', { ascending: true })
      .limit(limit);

    if (!error && data && data.length > 0) {
      dbData = data;
      if (!forceRefresh) {
        const response = {
          success: true,
          source: 'supabase_db',
          monthLabel,
          lastFridayStr,
          updateCycle: 'Almacenado y consultado directamente desde tu base de datos en Supabase',
          releases: data,
        };
        inMemoryRecordClub = response;
        inMemoryRecordClubExpires = Date.now() + 60 * 60 * 1000; // 1 hora de caché en memoria
        return response;
      }
    }
  } catch (dbErr) {
    // Tabla no creada aún en Supabase; continuará con el flujo
  }

  let finalItems = [...RECORD_CLUB_FALLBACK_RELEASES];

  // 4. Si se forzó sincronización o no hay datos en BD, consultar Record Club
  try {
    const rcRes = await fetch(
      'https://api.record.club/releases?sortBy=popularity-week&limit=84',
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          Accept: 'application/json',
        },
        signal:
          typeof AbortSignal !== 'undefined' && AbortSignal.timeout
            ? AbortSignal.timeout(6000)
            : undefined,
      }
    );

    if (rcRes.ok) {
      const rcJson = await rcRes.json();
      if (rcJson.success && Array.isArray(rcJson.data) && rcJson.data.length > 0) {
        const fallbackMap = new Map();
        RECORD_CLUB_FALLBACK_RELEASES.forEach((r) => {
          fallbackMap.set(r.album_name.toLowerCase(), r);
          if (r.id) fallbackMap.set(r.id, r);
        });

        finalItems = rcJson.data.map((r, index) => {
          const artist =
            r.artists?.map((a) => a.name).join(' & ') || 'Varios Artistas';
          const title = r.title;
          const matched = fallbackMap.get(title.toLowerCase()) || fallbackMap.get(r.id);
          const pop = r.popularityByWeek?.popularity || r.popularity?.popularity || (450 - index * 4);
          const pos = r.popularityByWeek?.position || index + 1;

          const artworkUrl = r.artwork?.releaseVersionId
            ? `https://cdn.rcrd.club/releases/${r.id}/${r.artwork.releaseVersionId}.webp?v=${r.artwork.artworkVersionId || ''}&width=500`
            : (matched?.image_url || `https://cdn.rcrd.club/releases/${r.id}.webp?width=500`);

          const relDate = r.releaseDate
            ? `${r.releaseDate.year}-${String((r.releaseDate.month ?? 0) + 1).padStart(2, '0')}-${String(r.releaseDate.day || 1).padStart(2, '0')}`
            : matched?.release_date || '2026-09-01';

          const isNew = r.id === '05golqe1nj9l1j23' || (r.releaseDate?.year === 2026 && r.releaseDate?.month >= 8);

          return {
            id: r.id || `rc_${index + 1}`,
            album_name: title,
            artist_name: artist,
            image_url: artworkUrl,
            release_date: relDate,
            release_type:
              r.type === 2 ? 'SENCILLO' : r.type === 3 ? 'EP' : 'ALBUM',
            total_tracks: matched?.total_tracks || (r.type === 2 ? 1 : 12),
            trending_rank: pos,
            popularity_raw: pop,
            popularity_this_week: `${pop.toLocaleString()} pts`,
            genre_category: matched?.genre_category || 'POP / ALTERNATIVE',
            hit_track: matched?.hit_track || title,
            badge:
              pos === 1
                ? '🔥 #1 Popularity This Week'
                : pos <= 3
                  ? 'Top 3 Global'
                  : isNew
                    ? 'NEW'
                    : 'Tendencia Semanal',
            record_club_url: `https://record.club${r.uri || ''}`,
            is_new: isNew,
          };
        });
      }
    }
  } catch (liveErr) {
    console.warn('⚠️ Usando snapshot verificado de tendencias:', liveErr.message);
  }

  // 5. Asignar slugs canónicos y porcentajes de popularidad
  const processed = finalItems.map((item, index) => {
    const weeklyPopularity = Math.max(
      30,
      Math.min(99, Math.round(99 - index * 0.8))
    );
    const relYear = parseInt(item.release_date?.slice(0, 4), 10);
    const isNew = item.is_new ?? (relYear >= 2026 || index < 5);

    return {
      ...item,
      popularity_score: weeklyPopularity,
      is_new: isNew,
      slug: slugifyRelease(item.artist_name, item.album_name),
      artist_slug: slugifyArtist(item.artist_name),
    };
  });

  const finalReleases = processed.slice(0, 84);

  // 6. Si la tabla en Supabase está disponible, sincronizar los datos automáticamente
  try {
    await supabase
      .from('record_club_releases')
      .upsert(finalReleases, { onConflict: 'id' });
  } catch {
    // Si la tabla no ha sido creada aún en Supabase, continúa silenciosamente
  }

  const response = {
    success: true,
    source: dbData ? 'supabase_db' : 'global_ranking_sync',
    monthLabel,
    lastFridayStr,
    updateCycle: 'Sincronizado semanalmente con el Ranking Global de Popularidad',
    releases: finalReleases,
  };

  inMemoryRecordClub = response;
  inMemoryRecordClubExpires = Date.now() + 60 * 60 * 1000; // 1 hora de caché
  return response;
}

/**
 * Obtiene los lanzamientos anticipados (no estrenados aún oficialmente).
 * No se pueden calificar hasta su salida oficial, pero sí indexar y consultar sus pistas (V.8.5).
 */
export async function getAnticipatedReleases(clubAlbums = []) {
  const now = new Date();

  // 1. Extraer de la base de datos SÓLO lanzamientos del club cuya fecha de lanzamiento sea estrictamente FUTURA
  const fromDb = clubAlbums.filter((a) => {
    if (!a.release_date) return false;
    const relTime = new Date(a.release_date).getTime();
    if (isNaN(relTime)) return false;
    if (relTime <= now.getTime()) return false;
    return a.status === 'ANTICIPADO' || relTime > now.getTime();
  });

  // 2. Consultar la tabla record_club_upcoming en Supabase
  let upcomingFromDb = [];
  try {
    const { data, error } = await supabase
      .from('record_club_upcoming')
      .select('*')
      .order('popularity_rank', { ascending: true })
      .limit(50);

    if (!error && data && data.length > 0) {
      upcomingFromDb = data;
    }
  } catch (_) {
    // Si la tabla no está creada aún, continuará con el fallback
  }

  // Si no hay datos en Supabase, usar el fallback verificado de Record Club y los curados
  const upcomingSource = upcomingFromDb.length > 0 ? upcomingFromDb : RECORD_CLUB_FALLBACK_UPCOMING;

  // 3. Combinar los de BD con los curados, evitando duplicados
  const combined = [...fromDb];
  const seenSlugs = new Set(
    combined.map((a) =>
      slugifyRelease(a.artist_name || a.artista, a.album_name || a.album)
    )
  );

  upcomingSource.forEach((ca) => {
    const slug = ca.slug || slugifyRelease(ca.artist_name, ca.album_name);
    if (!seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      combined.push({
        ...ca,
        slug,
        is_anticipated: true,
        can_rate: false,
      });
    }
  });

  // Asegurar que los lanzamientos curados clave también estén presentes si no están duplicados
  CURATED_ANTICIPATED_RELEASES.forEach((ca) => {
    const slug = slugifyRelease(ca.artist_name, ca.album_name);
    if (!seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      combined.push({
        ...ca,
        slug,
        is_anticipated: true,
        can_rate: false,
      });
    }
  });

  return combined;
}

/**
 * Catálogo de los géneros más famosos con sus respectivos releases del club.
 * Si un género tiene menos de 5 lanzamientos (<5), recomienda álbumes icónicos
 * y esenciales para esa categoría para descubrimiento (V.8.5).
 */
export function getFamousGenresCatalog(clubAlbums = []) {
  const GENRE_DEFINITIONS = [
    {
      id: 'pop',
      name: 'Pop',
      icon: '💖',
      color: 'from-pink-500 to-rose-400',
      description: 'Melodías contagiosas, synthpop, hyperpop y superestrellas globales.',
      keywords: ['pop', 'dance pop', 'synth-pop', 'hyperpop', 'art pop', 'electropop'],
      recommendations: [
        { album_name: 'Future Nostalgia', artist_name: 'Dua Lipa', release_year: 2020, image_url: 'https://i.scdn.co/image/ab67616d0000b273c88bae7846e62a8ba59ee0bd' },
        { album_name: "1989 (Taylor's Version)", artist_name: 'Taylor Swift', release_year: 2023, image_url: 'https://i.scdn.co/image/ab67616d0000b273dc2bacae1dca83d26e2b1949' },
        { album_name: 'Melodrama', artist_name: 'Lorde', release_year: 2017, image_url: 'https://i.scdn.co/image/ab67616d0000b273f8553e18a11209d4becd0336' },
        { album_name: 'Emotion', artist_name: 'Carly Rae Jepsen', release_year: 2015, image_url: 'https://i.scdn.co/image/ab67616d0000b273ef47c9fe64a125374bac43ad' },
        { album_name: 'After Hours', artist_name: 'The Weeknd', release_year: 2020, image_url: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36' },
      ],
    },
    {
      id: 'rock',
      name: 'Rock',
      icon: '🎸',
      color: 'from-amber-500 to-red-500',
      description: 'Guitarras enérgicas, distorsión, post-punk y la fuerza del rock clásico y contemporáneo.',
      keywords: ['rock', 'alternative rock', 'post-punk', 'indie rock', 'hard rock', 'garage rock'],
      recommendations: [
        { album_name: 'OK Computer', artist_name: 'Radiohead', release_year: 1997, image_url: 'https://i.scdn.co/image/ab67616d0000b273c8b444df094279e70d0ed856' },
        { album_name: 'The Dark Side of the Moon', artist_name: 'Pink Floyd', release_year: 1973, image_url: 'https://i.scdn.co/image/ab67616d0000b273db216ca805faf5fe35df4ee6' },
        { album_name: 'Nevermind', artist_name: 'Nirvana', release_year: 1991, image_url: 'https://i.scdn.co/image/ab67616d0000b273e175a19e530c898d167d39bf' },
        { album_name: 'AM', artist_name: 'Arctic Monkeys', release_year: 2013, image_url: 'https://i.scdn.co/image/ab67616d0000b2734ae1c4c5c45aabe565499163' },
        { album_name: 'Is This It', artist_name: 'The Strokes', release_year: 2001, image_url: 'https://i.scdn.co/image/ab67616d0000b273a388a3f20d1bf2123249cc79' },
      ],
    },
    {
      id: 'hiphop',
      name: 'Hip-Hop & Rap',
      icon: '🎤',
      color: 'from-yellow-500 to-amber-600',
      description: 'Lírica consciente, ritmos pesados, boombap y el pulso urbano del hip-hop.',
      keywords: ['hip hop', 'hip-hop', 'rap', 'trap', 'conscious hip hop', 'boom bap'],
      recommendations: [
        { album_name: 'To Pimp a Butterfly', artist_name: 'Kendrick Lamar', release_year: 2015, image_url: 'https://i.scdn.co/image/ab67616d0000b273cdb645498cd3d8a2db4d05e1' },
        { album_name: 'My Beautiful Dark Twisted Fantasy', artist_name: 'Kanye West', release_year: 2010, image_url: 'https://i.scdn.co/image/ab67616d0000b273d9194aa18fa4c9362b47464f' },
        { album_name: 'The College Dropout', artist_name: 'Kanye West', release_year: 2004, image_url: 'https://i.scdn.co/image/ab67616d0000b27325b055377757b3cdd6f26b78' },
        { album_name: 'Illmatic', artist_name: 'Nas', release_year: 1994, image_url: 'https://i.scdn.co/image/ab67616d0000b27371d840defb002ed3b180f7cd' },
        { album_name: 'IGOR', artist_name: 'Tyler, The Creator', release_year: 2019, image_url: 'https://i.scdn.co/image/ab67616d0000b27330a635de2bb0caa4e26f6abb' },
      ],
    },
    {
      id: 'indie',
      name: 'Indie & Alternativo',
      icon: '🌿',
      color: 'from-emerald-500 to-teal-400',
      description: 'Sonidos independientes, dream pop, shoegaze y proyectos de autor.',
      keywords: ['indie', 'indie rock', 'dream pop', 'shoegaze', 'indie pop', 'chamber pop'],
      recommendations: [
        { album_name: 'Punisher', artist_name: 'Phoebe Bridgers', release_year: 2020, image_url: 'https://i.scdn.co/image/ab67616d0000b273a91b75c9ef65ed8d760ff600' },
        { album_name: 'Currents', artist_name: 'Tame Impala', release_year: 2015, image_url: 'https://i.scdn.co/image/ab67616d0000b2739e1cfc756886ac782e363d79' },
        { album_name: 'Norman Fucking Rockwell!', artist_name: 'Lana Del Rey', release_year: 2019, image_url: 'https://i.scdn.co/image/ab67616d0000b273879e9318cb9f4e05ee552ac9' },
        { album_name: 'Titanic Rising', artist_name: 'Weyes Blood', release_year: 2019, image_url: 'https://i.scdn.co/image/ab67616d0000b2730c64e752dec4c08362cc4a88' },
        { album_name: 'Loveless', artist_name: 'My Bloody Valentine', release_year: 1991, image_url: 'https://i.scdn.co/image/ab67616d0000b273db8e38addb58131f77b48377' },
      ],
    },
    {
      id: 'electronic',
      name: 'Electrónica & Club',
      icon: '🎛️',
      color: 'from-cyan-500 to-blue-500',
      description: 'Sintetizadores, techno, house, ambient y beats diseñados para la pista.',
      keywords: ['electronic', 'techno', 'house', 'ambient', 'uk garage', 'idm', 'drum and bass'],
      recommendations: [
        { album_name: 'Discovery', artist_name: 'Daft Punk', release_year: 2001, image_url: 'https://i.scdn.co/image/ab67616d0000b2731e81bff9807a9e629fce5ade' },
        { album_name: 'Selected Ambient Works 85-92', artist_name: 'Aphex Twin', release_year: 1992, image_url: 'https://i.scdn.co/image/ab67616d0000b27338906032688bb13b135ce19a' },
        { album_name: 'Untrue', artist_name: 'Burial', release_year: 2007, image_url: 'https://i.scdn.co/image/ab67616d0000b27355018696782c175bdbaa3b5d' },
        { album_name: 'In Colour', artist_name: 'Jamie xx', release_year: 2015, image_url: 'https://i.scdn.co/image/ab67616d0000b2733b104b3cfcf52e380e90254d' },
        { album_name: 'Random Access Memories', artist_name: 'Daft Punk', release_year: 2013, image_url: 'https://i.scdn.co/image/ab67616d0000b2739b9b36b0e22870b9f542d937' },
      ],
    },
    {
      id: 'rnb',
      name: 'R&B & Neo-Soul',
      icon: '✨',
      color: 'from-purple-500 to-indigo-500',
      description: 'Grooves sensuales, armonías vocales profundas y la elegancia del soul moderno.',
      keywords: ['r&b', 'soul', 'neo-soul', 'contemporary r&b', 'funk'],
      recommendations: [
        { album_name: 'Blonde', artist_name: 'Frank Ocean', release_year: 2016, image_url: 'https://i.scdn.co/image/ab67616d0000b273c5649add07ed3720be9d5526' },
        { album_name: 'SOS', artist_name: 'SZA', release_year: 2022, image_url: 'https://i.scdn.co/image/ab67616d0000b273bc18bdade69ec5ef0bb25b17' },
        { album_name: 'Channel Orange', artist_name: 'Frank Ocean', release_year: 2012, image_url: 'https://i.scdn.co/image/ab67616d0000b2737aede4855f6d0d738012e2e5' },
        { album_name: 'Voodoo', artist_name: "D'Angelo", release_year: 2000, image_url: 'https://i.scdn.co/image/ab67616d0000b2732b3dc336a7a69293c25d9ade' },
        { album_name: 'The Miseducation of Lauryn Hill', artist_name: 'Ms. Lauryn Hill', release_year: 1998, image_url: 'https://i.scdn.co/image/ab67616d0000b273e08b1250db5f75643f1508c9' },
      ],
    },
    {
      id: 'latin',
      name: 'Latino & Urbano',
      icon: '🔥',
      color: 'from-orange-500 to-rose-500',
      description: 'El sonido global de Latinoamérica: reggaetón, trap latino, cumbia, corrido y pop hispano.',
      keywords: ['latin', 'latino', 'latin pop', 'reggaeton', 'urbano', 'corrido'],
      recommendations: [
        { album_name: 'Un Verano Sin Ti', artist_name: 'Bad Bunny', release_year: 2022, image_url: 'https://i.scdn.co/image/ab67616d0000b27349d694203245f241a1bcaa72' },
        { album_name: 'MOTOMAMI', artist_name: 'ROSALÍA', release_year: 2022, image_url: 'https://i.scdn.co/image/ab67616d0000b273ac8367a27c0eb7195dc3a58d' },
        { album_name: 'El Mal Querer', artist_name: 'ROSALÍA', release_year: 2018, image_url: 'https://i.scdn.co/image/ab67616d0000b273b115d8632e69edce1a1da7d8' },
        { album_name: 'YHLQMDLG', artist_name: 'Bad Bunny', release_year: 2020, image_url: 'https://i.scdn.co/image/ab67616d0000b273548f7ec52da7313de0c5e4a0' },
        { album_name: 'DATA', artist_name: 'Tainy', release_year: 2023, image_url: 'https://i.scdn.co/image/ab67616d0000b273f885fb64a381318a1c9c14e4' },
      ],
    },
    {
      id: 'metal',
      name: 'Metal & Heavy Rock',
      icon: '⚡',
      color: 'from-red-600 to-zinc-600',
      description: 'Riffs demoledores, distorsión extrema, doble bombo y potencia sónica.',
      keywords: ['metal', 'alternative metal', 'heavy metal', 'nu metal', 'metalcore', 'thrash metal'],
      recommendations: [
        { album_name: 'Master of Puppets', artist_name: 'Metallica', release_year: 1986, image_url: 'https://i.scdn.co/image/ab67616d0000b273668e3aca3167e6e569a9aa20' },
        { album_name: 'Toxicity', artist_name: 'System of a Down', release_year: 2001, image_url: 'https://i.scdn.co/image/ab67616d0000b27307bc7d2a745636c356b4d0aa' },
        { album_name: 'Paranoid', artist_name: 'Black Sabbath', release_year: 1970, image_url: 'https://i.scdn.co/image/ab67616d0000b2739f0a9474c47a841c6f03e990' },
        { album_name: 'White Pony', artist_name: 'Deftones', release_year: 2000, image_url: 'https://i.scdn.co/image/ab67616d0000b2735c53799f473fa3e1a48c00ed' },
        { album_name: 'Rust in Peace', artist_name: 'Megadeth', release_year: 1990, image_url: 'https://i.scdn.co/image/ab67616d0000b27342be808911785ceb13140edc' },
      ],
    },
    {
      id: 'jazz',
      name: 'Jazz & Fusión',
      icon: '🎷',
      color: 'from-indigo-600 to-sky-500',
      description: 'Improvisación pura, armonía compleja, swing y la sofisticación acústica del jazz.',
      keywords: ['jazz', 'bop', 'fusion', 'contemporary jazz', 'spiritual jazz'],
      recommendations: [
        { album_name: 'Kind of Blue', artist_name: 'Miles Davis', release_year: 1959, image_url: 'https://i.scdn.co/image/ab67616d0000b273387a29c90de3b2398c29c34f' },
        { album_name: 'A Love Supreme', artist_name: 'John Coltrane', release_year: 1965, image_url: 'https://i.scdn.co/image/ab67616d0000b273ea42191f549dce4d9c8ecd1a' },
        { album_name: 'Time Out', artist_name: 'The Dave Brubeck Quartet', release_year: 1959, image_url: 'https://i.scdn.co/image/ab67616d0000b273b6bd44cf06bf8f4d5ce1e080' },
        { album_name: 'Promises', artist_name: 'Floating Points, Pharoah Sanders', release_year: 2021, image_url: 'https://i.scdn.co/image/ab67616d0000b2738718f18aca81c2f4961946f4' },
        { album_name: 'Head Hunters', artist_name: 'Herbie Hancock', release_year: 1973, image_url: 'https://i.scdn.co/image/ab67616d0000b273b170840d6fdbc754ba304058' },
      ],
    },
    {
      id: 'folk',
      name: 'Folk & Acústico',
      icon: '🌲',
      color: 'from-emerald-700 to-amber-700',
      description: 'Historias íntimas, instrumentación acústica, tradición y poesía cantada.',
      keywords: ['folk', 'indie folk', 'acoustic', 'singer-songwriter', 'americana'],
      recommendations: [
        { album_name: 'Carrie & Lowell', artist_name: 'Sufjan Stevens', release_year: 2015, image_url: 'https://i.scdn.co/image/ab67616d0000b273820e2ac14772ae3162c6d479' },
        { album_name: 'Blue', artist_name: 'Joni Mitchell', release_year: 1971, image_url: 'https://i.scdn.co/image/ab67616d0000b273e79dc1438d650f426b5e99a7' },
        { album_name: 'Fleet Foxes', artist_name: 'Fleet Foxes', release_year: 2008, image_url: 'https://i.scdn.co/image/ab67616d0000b2733818b4c636e2a7fdea3bf965' },
        { album_name: 'For Emma, Forever Ago', artist_name: 'Bon Iver', release_year: 2007, image_url: 'https://i.scdn.co/image/ab67616d0000b273bf7c317a63c4f128b8823406' },
        { album_name: "The Freewheelin' Bob Dylan", artist_name: 'Bob Dylan', release_year: 1963, image_url: 'https://i.scdn.co/image/ab67616d0000b273c7f7596cd80cbd6436086f80' },
      ],
    },
  ];

  return GENRE_DEFINITIONS.map((def) => {
    // Buscar álbumes del club que pertenezcan a este género
    const clubMatches = clubAlbums.filter((album) => {
      const albumGenres = (album.genres || []).map((g) => String(g).toLowerCase().trim());
      return def.keywords.some((kw) =>
        albumGenres.some((ag) => ag.includes(kw) || kw.includes(ag))
      );
    });

    // Si tiene menos de 5 lanzamientos, complementar con recomendaciones esenciales
    const needsRecommendations = clubMatches.length < 5;
    const recommendationsToAdd = needsRecommendations
      ? def.recommendations
          .filter(
            (rec) =>
              !clubMatches.some(
                (cm) =>
                  (cm.album_name || cm.album || '').toLowerCase() ===
                  rec.album_name.toLowerCase()
              )
          )
          .map((rec) => ({
            ...rec,
            is_recommendation: true,
            slug: slugifyRelease(rec.artist_name, rec.album_name),
            status: 'RECOMENDADO',
          }))
      : [];

    return {
      ...def,
      clubReleases: clubMatches,
      recommendations: recommendationsToAdd,
      totalCount: clubMatches.length + recommendationsToAdd.length,
      hasFewReleases: needsRecommendations,
    };
  });
}

